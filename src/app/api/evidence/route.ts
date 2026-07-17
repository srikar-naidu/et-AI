import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { insertRow, isSupabaseConfigured, supabaseStorage } from "@/lib/supabase/server";

const MAX_EVIDENCE_BYTES = 20 * 1024 * 1024;
const caseIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Evidence storage is not configured yet." }, { status: 503 });
  try {
    const formData = await request.formData();
    const caseId = formData.get("caseId");
    const file = formData.get("file");
    if (typeof caseId !== "string" || !caseIdPattern.test(caseId) || !(file instanceof File) || !file.size) {
      return NextResponse.json({ error: "Provide a valid case and non-empty evidence file." }, { status: 400 });
    }
    if (file.size > MAX_EVIDENCE_BYTES) return NextResponse.json({ error: "Evidence files must be 20 MB or smaller." }, { status: 413 });

    const bytes = Buffer.from(await file.arrayBuffer());
    const hash = createHash("sha256").update(bytes).digest("hex");
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${caseId}/${crypto.randomUUID()}-${safeName}`;
    await supabaseStorage(`object/case-evidence/${storagePath}`, {
      method: "POST",
      headers: { "Content-Type": file.type || "application/octet-stream", "x-upsert": "false" },
      body: bytes,
    });
    const evidence = await insertRow("evidence_items", {
      case_id: caseId,
      original_filename: file.name.slice(0, 255),
      content_type: file.type || "application/octet-stream",
      byte_size: file.size,
      storage_path: storagePath,
      sha256: hash,
      source: "citizen_upload",
    }) as unknown as { id: string; sha256: string };
    await insertRow("audit_events", { case_id: caseId, event_type: "evidence.uploaded", actor_type: "citizen", details: { evidence_id: evidence.id, sha256: hash, byte_size: file.size } });
    return NextResponse.json({ id: evidence.id, sha256: evidence.sha256 }, { status: 201 });
  } catch (error) {
    console.error("Evidence upload error:", error);
    return NextResponse.json({ error: "Could not securely store evidence." }, { status: 500 });
  }
}
