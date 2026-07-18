"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AlertTriangle, Network, RefreshCw, ShieldCheck } from "lucide-react";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

type GraphNode = { id: string; label: string; type: string; riskScore: number; x?: number; y?: number };
type GraphLink = { source: string; target: string; type: string; amount: number | null; flagged: boolean };
type GraphPayload = { configured: boolean; nodes: GraphNode[]; links: GraphLink[]; clusters?: Array<{ memberCount: number; maxRisk: number; flagged: boolean }>; error?: string };

export default function FraudNetwork() {
  const [graph, setGraph] = useState<GraphPayload>({ configured: false, nodes: [], links: [], clusters: [] });
  const [status, setStatus] = useState("Loading investigation graph…");

  async function loadGraph() {
    setStatus("Loading investigation graph…");
    try {
      const response = await fetch("/api/graph", { cache: "no-store" });
      const payload = (await response.json()) as GraphPayload;
      if (!response.ok) throw new Error(payload.error || "Could not load graph.");
      setGraph(payload);
      setStatus(payload.configured ? `${payload.nodes.length} entities and ${payload.links.length} relationships loaded.` : "Connect Supabase and import AMLSim data to activate the graph.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not load graph.");
    }
  }

  useEffect(() => { void loadGraph(); }, []);

  const [activeTab, setActiveTab] = useState<"graph" | "data">("graph");
  const flaggedLinks = graph.links.filter((link) => link.flagged).length;
  return (
    <section className="mx-auto w-full max-w-6xl">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#00f3ff]"><Network className="size-5" /><span className="font-mono text-xs font-bold tracking-widest">INVESTIGATION GRAPH</span></div>
          <h2 className="mt-2 text-2xl font-bold text-white">Trace suspicious money movement</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-300">This interactive map visualises the AMLSim (Anti-Money Laundering) transaction data you provided. Each dot is an account or individual, and lines show the flow of money between them. Clustered red dots highlight potential money laundering rings or linked scam networks based on the transaction data.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab("graph")} className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-4 text-sm font-semibold transition-colors ${activeTab === "graph" ? "bg-[#00f3ff]/20 border-[#00f3ff] text-[#00f3ff]" : "border-[#333] text-gray-400 hover:bg-white/5"}`}>Graph View</button>
          <button onClick={() => setActiveTab("data")} className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-4 text-sm font-semibold transition-colors ${activeTab === "data" ? "bg-[#00f3ff]/20 border-[#00f3ff] text-[#00f3ff]" : "border-[#333] text-gray-400 hover:bg-white/5"}`}>Raw Data View</button>
          <button onClick={loadGraph} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#00f3ff]/50 px-3 text-sm font-semibold text-[#00f3ff] hover:bg-[#00f3ff]/10 ml-2"><RefreshCw className="size-4" /> Refresh</button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
        <div className="min-h-[440px] overflow-hidden rounded-xl border border-[#333] bg-[#090d10] flex flex-col">
          {graph.nodes.length > 0 ? (
            activeTab === "graph" ? (
              <ForceGraph2D
                graphData={{ nodes: graph.nodes, links: graph.links }}
                nodeLabel={(node) => `${(node as GraphNode).label} · risk ${(node as GraphNode).riskScore}`}
                nodeColor={(node) => ((node as GraphNode).riskScore >= 70 ? "#ff003c" : "#00f3ff")}
                nodeRelSize={5}
                linkColor={(link) => ((link as GraphLink).flagged ? "#ff003c" : "#52606d")}
                linkWidth={(link) => ((link as GraphLink).flagged ? 2 : 0.7)}
                backgroundColor="#090d10"
              />
            ) : (
              <div className="flex-1 overflow-auto p-4">
                <h3 className="text-white font-bold mb-4">Synthetic AMLSim Data Output</h3>
                <div className="overflow-x-auto rounded-lg border border-[#333]">
                  <table className="w-full text-left text-sm text-gray-300">
                    <thead className="bg-[#111] text-xs uppercase text-gray-500 border-b border-[#333]">
                      <tr>
                        <th className="px-4 py-3">Source Account</th>
                        <th className="px-4 py-3">Target Account</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3 text-right">Amount (₹)</th>
                        <th className="px-4 py-3 text-center">AML Flag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#333]">
                      {graph.links.map((link, idx) => {
                        const sourceNode = graph.nodes.find(n => n.id === link.source) || { label: link.source as string };
                        const targetNode = graph.nodes.find(n => n.id === link.target) || { label: link.target as string };
                        return (
                          <tr key={idx} className="hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3 font-mono">{sourceNode.label}</td>
                            <td className="px-4 py-3 font-mono">{targetNode.label}</td>
                            <td className="px-4 py-3">{link.type}</td>
                            <td className="px-4 py-3 text-right font-mono text-green-400">{link.amount ? `₹${link.amount.toLocaleString()}` : '-'}</td>
                            <td className="px-4 py-3 text-center">
                              {link.flagged ? <span className="inline-flex items-center rounded bg-[#ff003c]/20 px-2 py-1 text-xs font-medium text-[#ff003c]">Suspicious</span> : <span className="inline-flex items-center rounded bg-gray-500/20 px-2 py-1 text-xs font-medium text-gray-400">Normal</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : (
            <div className="flex h-[440px] flex-col items-center justify-center p-6 text-center text-gray-400"><Network className="mb-4 size-12 opacity-30" /><p className="max-w-sm text-sm leading-6">{status}</p></div>
          )}
        </div>
        <aside className="rounded-xl border border-[#333] bg-black/30 p-5">
          <h3 className="font-mono text-sm font-bold text-white">Graph signals</h3>
          <dl className="mt-5 space-y-5">
            <div><dt className="text-xs uppercase tracking-wide text-gray-500">Entities</dt><dd className="mt-1 text-2xl font-bold text-white">{graph.nodes.length}</dd></div>
            <div><dt className="text-xs uppercase tracking-wide text-gray-500">Transfers</dt><dd className="mt-1 text-2xl font-bold text-white">{graph.links.length}</dd></div>
            <div><dt className="text-xs uppercase tracking-wide text-gray-500">Linked clusters</dt><dd className="mt-1 text-2xl font-bold text-white">{graph.clusters?.length ?? 0}</dd></div>
            <div><dt className="flex items-center gap-2 text-xs uppercase tracking-wide text-red-300"><AlertTriangle className="size-3" /> Flagged links</dt><dd className="mt-1 text-2xl font-bold text-[#ff003c]">{flaggedLinks}</dd></div>
          </dl>
          <div className="mt-8 rounded-lg bg-[#00ff66]/[.07] p-3 text-xs leading-5 text-gray-300"><ShieldCheck className="mb-2 size-4 text-[#00ff66]" />Use this view to prioritise review; retain source evidence before creating a case.</div>
        </aside>
      </div>
    </section>
  );
}
