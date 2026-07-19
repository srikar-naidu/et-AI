import { NextRequest, NextResponse } from "next/server";
import { getClusterGraph } from "@/lib/fraud-intelligence";
import { loadFraudGraph } from "@/lib/fraud-data";
import { insertRow, isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const escapePdf = (value: string) => value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)").replace(/[^\x20-\x7E]/g, "?");

function buildPdf(lines: string[], diagram: { nodes: number; links: number }) {
  const pageWidth = 595;
  const pageHeight = 842;
  const content: string[] = ["0.04 0.06 0.10 rg", `0 0 ${pageWidth} ${pageHeight} re f`, "0.12 0.92 0.95 rg", "BT /F1 18 Tf 48 790 Td (FRAUD NETWORK INTELLIGENCE - EVIDENCE PACKAGE) Tj ET", "0.78 0.84 0.90 rg", "BT /F1 9 Tf 48 770 Td (Generated from the selected WCC cluster. Investigative use and human review required.) Tj ET"];
  let y = 740;
  for (const line of lines) {
    if (y < 105) break;
    content.push("0.86 0.90 0.94 rg", `BT /F1 10 Tf 48 ${y} Td (${escapePdf(line)}) Tj ET`);
    y -= 17;
  }
  const centerX = 470;
  const centerY = 170;
  const radius = 58;
  content.push("0.30 0.38 0.48 RG 0.7 w");
  for (let i = 0; i < Math.min(diagram.links, 10); i++) {
    const angle = (Math.PI * 2 * i) / Math.max(1, Math.min(diagram.nodes, 8));
    const x = centerX + Math.cos(angle) * radius;
    const yPos = centerY + Math.sin(angle) * radius;
    content.push(`${centerX} ${centerY} m ${x.toFixed(1)} ${yPos.toFixed(1)} l S`);
  }
  for (let i = 0; i < Math.min(diagram.nodes, 8); i++) {
    const angle = (Math.PI * 2 * i) / Math.max(1, Math.min(diagram.nodes, 8));
    const x = centerX + Math.cos(angle) * radius;
    const yPos = centerY + Math.sin(angle) * radius;
    content.push("0.95 0.24 0.32 rg", `${x.toFixed(1)} ${yPos.toFixed(1)} 7 7 re f`);
  }
  content.push("0.12 0.95 0.72 rg", `${centerX - 9} ${centerY - 9} 18 18 re f`, "0.78 0.84 0.90 rg", "BT /F1 8 Tf 382 75 Td (Vector topology summary - not to scale) Tj ET", "BT /F1 8 Tf 48 44 Td (Et AI Digital Public Safety Platform | Evidence manifest integrity reference included above) Tj ET");
  const stream = content.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let index = 0; index < objects.length; index++) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, "utf8");
}

export async function GET(request: NextRequest) {
  const graph = await loadFraudGraph();
  const requestedCluster = request.nextUrl.searchParams.get("clusterId") ?? "";
  const data = getClusterGraph(graph, requestedCluster);
  if (!data) return NextResponse.json({ error: "No cluster is available for export." }, { status: 404 });
  const manifest = JSON.stringify({ cluster: data.cluster, nodes: data.nodes, links: data.links, analysedAt: graph.analysedAt });
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(manifest));
  const sha256 = Array.from(new Uint8Array(digest)).map((item) => item.toString(16).padStart(2, "0")).join("");
  if (isSupabaseConfigured()) {
    try {
      await insertRow("audit_events", { event_type: "fraud_network.exported", actor_type: "system", details: { cluster_id: data.cluster.id, manifest_sha256: sha256, analysis_method: graph.analysisMethod } });
    } catch (error) {
      console.error("Unable to persist fraud export audit event", error);
    }
  }
  const relationships = Object.entries(data.cluster.relationshipCounts).map(([type, count]) => `${type}: ${count}`).join(", ");
  const lines = [
    `Case reference: ${data.cluster.id} | Risk: ${data.cluster.riskLevel.toUpperCase()} (${data.cluster.maxRisk}/100)`,
    `Analysis method: Weakly Connected Components (WCC) | Analysis timestamp: ${graph.analysedAt}`,
    `Entity count: ${data.cluster.memberCount} | Flagged relationships: ${data.cluster.flaggedEdgeCount}`,
    `Transfers: ${data.cluster.transferCount} | Aggregate transferred amount: INR ${data.cluster.totalTransferred.toLocaleString("en-IN")}`,
    `Relationship evidence: ${relationships || "No relationships recorded"}`,
    "Finding: " + data.cluster.summary,
    "Entities included:",
    ...data.nodes.map((node) => `- ${node.label} | ${node.type} | risk ${node.riskScore}/100`),
    "Evidence relationships:",
    ...data.links.map((link) => `- ${link.source} -> ${link.target} | ${link.type}${link.amount ? ` | INR ${link.amount.toLocaleString("en-IN")}` : ""}${link.flagged ? " | FLAGGED" : ""}${link.occurredAt ? ` | ${link.occurredAt}` : ""}`),
    `Evidence manifest SHA-256: ${sha256}`,
    "Chain-of-custody note: export generated by the platform; retain source records and obtain investigator certification before legal filing.",
  ];
  const pdf = buildPdf(lines, { nodes: data.nodes.length, links: data.links.length });
  return new NextResponse(pdf, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="fraud-evidence-${data.cluster.id}.pdf"`, "Cache-Control": "no-store" } });
}
