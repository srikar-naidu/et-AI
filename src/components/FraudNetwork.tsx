// D3 v7 is shipped without declaration files in this workspace. Runtime integration is verified;
// remove this file-level suppression once @types/d3 is available in the project registry.
// @ts-nocheck
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { AlertTriangle, Bot, Building, DollarSign, FileText, Link2, Network, Phone, RefreshCw, Send, ShieldAlert, Smartphone, User } from "lucide-react";

type GraphNode = { id: string; label: string; type: string; riskScore: number };
type GraphLink = { source: string; target: string; type: string; amount: number | null; flagged: boolean; occurredAt: string | null };
type FraudCluster = {
  id: string; memberIds: string[]; memberCount: number; maxRisk: number; flagged: boolean;
  flaggedEdgeCount: number; transferCount: number; totalTransferred: number;
  relationshipCounts: Record<string, number>; riskLevel: "critical" | "high" | "moderate" | "low"; summary: string;
};
type GraphData = { configured: boolean; mode?: string; analysisMethod: string; analysedAt: string; nodes: GraphNode[]; links: GraphLink[]; clusters: FraudCluster[] };
type SimNode = GraphNode & d3.SimulationNodeDatum;
type SimLink = GraphLink & d3.SimulationLinkDatum<SimNode>;

const riskColor = (score: number) => score >= 80 ? "#ff4058" : score >= 50 ? "#ff9d38" : score >= 30 ? "#f4ca63" : "#4be18c";
const iconFor = (type: string, size = 20) => {
  const props = { size, "aria-hidden": true as const };
  if (type === "account") return <DollarSign {...props} />;
  if (type === "individual") return <User {...props} />;
  if (type === "phone") return <Phone {...props} />;
  if (type === "device") return <Smartphone {...props} />;
  if (type === "organization") return <Building {...props} />;
  return <Link2 {...props} />;
};

export default function FraudNetwork() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<number | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [question, setQuestion] = useState("Summarize this cluster and identify cross-border ties.");
  const [agentReply, setAgentReply] = useState<string | null>(null);
  const [agentLoading, setAgentLoading] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const loadGraph = async () => {
    setLoading(true); setError(null);
    try {
      const response = await fetch("/api/graph", { cache: "no-store" });
      if (!response.ok) throw new Error(`Graph service returned ${response.status}`);
      setGraphData(await response.json());
      setSelectedCluster(null); setSelectedNode(null); setAgentReply(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load the fraud network.");
    } finally { setLoading(false); }
  };
  useEffect(() => { void loadGraph(); }, []);

  const visibleGraph = useMemo(() => {
    if (!graphData || selectedCluster === null) return graphData;
    const cluster = graphData.clusters[selectedCluster];
    if (!cluster) return graphData;
    const memberIds = new Set(cluster.memberIds);
    return { ...graphData, nodes: graphData.nodes.filter((node) => memberIds.has(node.id)), links: graphData.links.filter((link) => memberIds.has(link.source) && memberIds.has(link.target)) };
  }, [graphData, selectedCluster]);

  useEffect(() => {
    if (!visibleGraph || !svgRef.current) return;
    const svgNode = svgRef.current;
    const width = svgNode.clientWidth || 800;
    const height = 510;
    const svg = d3.select(svgNode).attr("viewBox", `0 0 ${width} ${height}`);
    svg.selectAll("*").remove();
    const root = svg.append("g");
    svg.call(d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.2, 4]).on("zoom", (event) => root.attr("transform", event.transform)));
    const nodes: SimNode[] = visibleGraph.nodes.map((node) => ({ ...node }));
    const links: SimLink[] = visibleGraph.links.map((link) => ({ ...link }));
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink<SimNode, SimLink>(links).id((node) => node.id).distance(135))
      .force("charge", d3.forceManyBody().strength(-420))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide<SimNode>().radius((node) => 27 + node.riskScore / 8));
    const line = root.append("g").attr("stroke-opacity", 0.85).selectAll("line").data(links).join("line")
      .attr("stroke", (link) => link.flagged ? "#ff4058" : "#526171")
      .attr("stroke-width", (link) => link.flagged ? 3 : 1.5)
      .attr("stroke-dasharray", (link) => link.type === "transfer" ? "0" : "5,4");
    const labels = root.append("g").selectAll("text").data(links).join("text").attr("fill", "#aeb9c8").attr("font-size", 10).attr("text-anchor", "middle").attr("pointer-events", "none")
      .text((link) => link.amount ? `INR ${link.amount.toLocaleString("en-IN")}` : link.type.replaceAll("_", " "));
    const groups = root.append("g").selectAll<SVGGElement, SimNode>("g").data(nodes).join("g").attr("class", "node").attr("tabindex", 0).attr("role", "button")
      .attr("aria-label", (node) => `${node.label}; ${node.type}; risk score ${node.riskScore}`).style("cursor", "pointer")
      .on("click", (_, node) => setSelectedNode(node))
      .on("keydown", (event: KeyboardEvent, node) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedNode(node); } })
      .call(d3.drag<SVGGElement, SimNode>().on("start", (event, node) => { if (!event.active) simulation.alphaTarget(0.25).restart(); node.fx = node.x; node.fy = node.y; }).on("drag", (event, node) => { node.fx = event.x; node.fy = event.y; }).on("end", (event, node) => { if (!event.active) simulation.alphaTarget(0); node.fx = null; node.fy = null; }));
    groups.append("circle").attr("r", (node) => 18 + node.riskScore / 8).attr("fill", (node) => `${riskColor(node.riskScore)}30`).attr("stroke", (node) => riskColor(node.riskScore)).attr("stroke-width", 2.5);
    groups.append("text").attr("text-anchor", "middle").attr("dominant-baseline", "central").attr("font-size", 18).text((node) => ({ account: "₹", individual: "●", phone: "☎", device: "▣", organization: "▤" }[node.type] ?? "◆"));
    groups.append("text").attr("dy", 37).attr("text-anchor", "middle").attr("fill", "#edf3f7").attr("font-size", 10).text((node) => node.label.slice(0, 24));
    simulation.on("tick", () => {
      line.attr("x1", (link) => (link.source as SimNode).x ?? 0).attr("y1", (link) => (link.source as SimNode).y ?? 0).attr("x2", (link) => (link.target as SimNode).x ?? 0).attr("y2", (link) => (link.target as SimNode).y ?? 0);
      labels.attr("x", (link) => (((link.source as SimNode).x ?? 0) + ((link.target as SimNode).x ?? 0)) / 2).attr("y", (link) => (((link.source as SimNode).y ?? 0) + ((link.target as SimNode).y ?? 0)) / 2);
      groups.attr("transform", (node) => `translate(${node.x ?? 0},${node.y ?? 0})`);
    });
    return () => simulation.stop();
  }, [visibleGraph]);

  const activeCluster = graphData?.clusters[selectedCluster ?? 0] ?? null;
  const askAgent = async () => {
    if (!activeCluster || !question.trim()) return;
    setAgentLoading(true); setAgentReply(null);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ language: "en", clusterId: activeCluster.id, messages: [{ role: "user", content: question.trim() }] }) });
      const body = await response.json();
      setAgentReply(response.ok ? body.reply : body.error || "The intelligence agent could not complete this request.");
    } catch { setAgentReply("The intelligence agent is unavailable. Check the connection and API configuration."); }
    finally { setAgentLoading(false); }
  };
  const exportPackage = () => { if (activeCluster) window.location.assign(`/api/export-pdf?clusterId=${encodeURIComponent(activeCluster.id)}`); };

  if (loading) return <div className="py-20 text-center text-gray-300" role="status"><RefreshCw className="mx-auto mb-3 size-8 animate-spin text-[#00f3ff]" />Loading fraud network intelligence…</div>;
  if (!graphData || error) return <div className="py-16 text-center"><AlertTriangle className="mx-auto mb-3 size-9 text-[#ff4058]" /><p className="text-gray-200">{error || "The graph service returned no data."}</p><button type="button" onClick={loadGraph} className="mt-4 rounded-lg bg-[#00f3ff] px-4 py-2 text-sm font-semibold text-black">Retry graph load</button></div>;

  return <section className="w-full space-y-5" aria-labelledby="fraud-network-title">
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div><h2 id="fraud-network-title" className="flex items-center gap-2 text-2xl font-bold text-white"><Network className="size-6 text-[#ff4058]" />Fraud Network Intelligence</h2><p className="mt-1 text-sm text-gray-300">{graphData.analysisMethod.replaceAll("_", " ")} analysis · {graphData.mode === "demo" ? "isolated demo dataset" : "live graph dataset"}</p></div>
      <button type="button" onClick={loadGraph} className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#3b5366] px-3 py-2 text-sm font-medium text-[#9fedf5] hover:bg-[#0e2731]"><RefreshCw className="size-4" />Refresh graph</button>
    </div>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 rounded-xl border border-[#293746] bg-[#0a0f15] p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold text-white">Network topology</h3><p className="text-xs text-gray-300">{visibleGraph?.nodes.length ?? 0} entities · {visibleGraph?.links.length ?? 0} relationships · Tab + Enter inspects a node</p></div>
        <svg ref={svgRef} tabIndex={0} role="img" aria-label="Interactive fraud network. Tab through entities and press Enter to inspect one." className="h-[510px] w-full rounded-lg bg-[#06090d] outline-none focus-visible:ring-2 focus-visible:ring-[#00f3ff]" />
        {selectedNode && <div className="mt-4 flex gap-3 rounded-lg bg-[#111923] p-3"><div className="mt-0.5 text-[#9fedf5]">{iconFor(selectedNode.type, 22)}</div><div className="min-w-0"><p className="font-semibold text-white break-words">{selectedNode.label}</p><p className="text-sm text-gray-300">{selectedNode.type} · risk {selectedNode.riskScore}/100 · {graphData.links.filter((link) => link.source === selectedNode.id || link.target === selectedNode.id).length} linked relationships</p></div><button type="button" onClick={() => setSelectedNode(null)} className="ml-auto self-start text-sm text-[#9fedf5] underline">Close</button></div>}
      </div>
      <aside className="space-y-5">
        <div className="rounded-xl border border-[#293746] bg-[#0a0f15] p-4"><h3 className="flex items-center gap-2 font-semibold text-white"><AlertTriangle className="size-5 text-[#ff9d38]" />Discovered campaigns</h3><div className="mt-3 space-y-2">{graphData.clusters.map((cluster, index) => <button key={cluster.id} type="button" onClick={() => { setSelectedCluster((current) => current === index ? null : index); setSelectedNode(null); setAgentReply(null); }} aria-pressed={selectedCluster === index} className={`w-full rounded-lg border p-3 text-left transition-colors ${selectedCluster === index ? "border-[#ff4058] bg-[#35131a]" : "border-[#293746] bg-[#111923] hover:bg-[#172331]"}`}><span className="flex justify-between gap-3 font-medium text-white"><span className="truncate">Campaign {index + 1}</span><span className="text-xs text-[#ffb0ba]">{cluster.riskLevel.toUpperCase()}</span></span><span className="mt-2 block text-xs leading-5 text-gray-300">{cluster.memberCount} entities · INR {cluster.totalTransferred.toLocaleString("en-IN")} · {cluster.flaggedEdgeCount} flagged links</span></button>)}</div></div>
        {activeCluster && <div className="rounded-xl border border-[#293746] bg-[#0a0f15] p-4"><h3 className="flex items-center gap-2 font-semibold text-white"><FileText className="size-5 text-[#9fedf5]" />Evidence package</h3><p className="mt-2 text-sm leading-6 text-gray-300">{activeCluster.summary}</p><button type="button" onClick={exportPackage} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#00f3ff] px-3 py-2 text-sm font-semibold text-black hover:bg-[#59f7ff]"><ShieldAlert className="size-4" />Export evidence PDF</button></div>}
        <div className="rounded-xl border border-[#293746] bg-[#0a0f15] p-4"><h3 className="flex items-center gap-2 font-semibold text-white"><Bot className="size-5 text-[#9fedf5]" />Cluster intelligence agent</h3><p className="mt-2 text-xs leading-5 text-gray-300">Answers are grounded in the active cluster&apos;s graph facts.</p><label className="sr-only" htmlFor="cluster-question">Question for the selected cluster</label><textarea id="cluster-question" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={600} className="mt-3 min-h-24 w-full resize-y rounded-lg border border-[#293746] bg-[#06090d] p-2 text-sm text-white outline-none focus:border-[#00f3ff]" /><button type="button" onClick={askAgent} disabled={agentLoading || !question.trim()} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-[#3b5366] px-3 py-2 text-sm font-medium text-[#9fedf5] hover:bg-[#0e2731] disabled:cursor-not-allowed disabled:opacity-50"><Send className="size-4" />{agentLoading ? "Analysing…" : "Ask agent"}</button>{agentReply && <p className="mt-3 whitespace-pre-wrap rounded-lg bg-[#111923] p-3 text-sm leading-6 text-gray-100" role="status">{agentReply}</p>}</div>
      </aside>
    </div>
  </section>;
}
