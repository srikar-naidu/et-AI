"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import * as d3 from "d3";
import { motion } from "framer-motion";
import {
  Network,
  AlertTriangle,
  ShieldAlert,
  FileText,
  RefreshCw,
  ChevronDown,
  DollarSign,
  Phone,
  Smartphone,
  Building,
  User,
  Link2,
} from "lucide-react";

// Types matching /api/graph response
type GraphNode = {
  id: string;
  label: string;
  type: string;
  riskScore: number;
};

type GraphLink = {
  source: string;
  target: string;
  type: string;
  amount: number | null;
  flagged: boolean;
  occurredAt: string | null;
};

type FraudCluster = {
  memberCount: number;
  maxRisk: number;
  flagged: boolean;
};

type GraphData = {
  configured: boolean;
  mode?: string;
  nodes: GraphNode[];
  links: GraphLink[];
  clusters: FraudCluster[];
};

// Risk score to color
const getRiskColor = (score: number) => {
  if (score >= 80) return "#ff003c"; // High risk (red)
  if (score >= 50) return "#ff7a00"; // Medium risk (orange)
  if (score >= 30) return "#f59e0b"; // Low-medium (amber)
  return "#00ff66"; // Low risk (green)
};

// Entity type to icon
const getEntityIcon = (type: string, size: number = 20) => {
  switch (type) {
    case "account":
      return <DollarSign size={size} />;
    case "individual":
      return <User size={size} />;
    case "phone":
      return <Phone size={size} />;
    case "device":
      return <Smartphone size={size} />;
    case "organization":
      return <Building size={size} />;
    default:
      return <Link2 size={size} />;
  }
};

export default function FraudNetwork() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Load data
  const loadGraphData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/graph");
      const data = await res.json();
      setGraphData(data);
    } catch (err) {
      console.error("Failed to load graph data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraphData();
  }, []);

  // Render graph
  useEffect(() => {
    if (!graphData || !svgRef.current) return;

    const width = svgRef.current.clientWidth || 800;
    const height = 500;

    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", [0, 0, width, height]);

    // Zoom behavior
    const g = svg.append("g");
    const zoom = d3.zoom().scaleExtent([0.1, 4]).on("zoom", (event) => {
      g.attr("transform", event.transform);
    });
    svg.call(zoom);

    // Create simulation
    const simulation = d3
      .forceSimulation(graphData.nodes)
      .force(
        "link",
        d3
          .forceLink(graphData.links)
          .id((d: any) => d.id)
          .distance(100)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30));

    // Draw links
    const link = g
      .append("g")
      .attr("stroke", "#374151")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(graphData.links)
      .join("line")
      .attr("stroke", (d: GraphLink) => (d.flagged ? "#ff003c" : "#374151"))
      .attr("stroke-width", (d: GraphLink) => (d.flagged ? 3 : 1.5));

    // Draw nodes
    const node = g
      .append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(graphData.nodes)
      .join("circle")
      .attr("r", (d) => 10 + d.riskScore / 10)
      .attr("fill", (d) => getRiskColor(d.riskScore))
      .style("cursor", "pointer")
      .on("click", (_, d) => {
        setSelectedNode(d as GraphNode);
      })
      .call(
        d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      );

    // Drag functions
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);
    });

    // Tooltip
    const tooltip = d3
      .select("body")
      .append("div")
      .attr(
        "class",
        "fixed bg-gray-900/95 backdrop-blur-md border border-cyan-500/30 px-4 py-3 rounded-lg text-sm shadow-xl pointer-events-none z-50"
      )
      .style("opacity", 0);

    node
      .on("mouseenter", (event, d: any) => {
        tooltip.transition().duration(200).style("opacity", 1);
        tooltip
          .html(
            `<div class="font-bold text-white mb-1">${d.label}</div>
             <div class="text-gray-400 text-xs">Type: ${d.type}</div>
             <div class="text-xs">Risk Score: <span style="color: ${getRiskColor(
               d.riskScore
             )}">${d.riskScore}</span></div>`
          )
          .style("left", event.pageX + 15 + "px")
          .style("top", event.pageY - 10 + "px");
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", event.pageX + 15 + "px")
          .style("top", event.pageY - 10 + "px");
      })
      .on("mouseleave", () => {
        tooltip.transition().duration(200).style("opacity", 0);
      });

    // Cleanup tooltip on unmount
    return () => {
      tooltip.remove();
    };
  }, [graphData]);

  // Intelligence packages
  const intelligencePackages = useMemo(() => {
    if (!graphData) return [];
    return [
      {
        id: 1,
        title: "High-Risk Money Mule Cluster",
        riskLevel: "Critical",
        entities: graphData.clusters[0]?.memberCount || 0,
        flaggedTransfers: graphData.links.filter(
          (l) => l.flagged && l.type === "transfer"
        ).length,
        summary:
          "Identified coordinated transfers between multiple accounts with high risk scores, indicative of a money mule network.",
      },
      {
        id: 2,
        title: "Linked Device & Phone Signals",
        riskLevel: "High",
        entities: 3,
        flaggedTransfers: 2,
        summary:
          "A single device linked to multiple high-risk accounts and phone numbers, suggesting coordinated scam operations.",
      },
    ];
  }, [graphData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <RefreshCw className="w-10 h-10 text-[#00f3ff] animate-spin" />
        <div className="text-gray-400 font-mono">
          Loading Fraud Network Graph...
        </div>
      </div>
    );
  }

  if (!graphData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="w-10 h-10 text-[#ff003c]" />
        <div className="text-gray-400 font-mono">
          Failed to load graph data
        </div>
        <button
          onClick={loadGraphData}
          className="px-4 py-2 rounded-xl border border-[#00f3ff]/30 bg-[#00f3ff]/10 text-[#00f3ff] hover:bg-[#00f3ff]/20 transition-all"
        >
          <RefreshCw className="w-4 h-4 inline mr-2" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Network className="w-6 h-6 text-[#ff003c]" />
            Fraud Network Intelligence
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Graph AI analysis of linked fraud networks
            {graphData.mode === "demo" && (
              <span className="ml-2 text-xs bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/20">
                Demo Mode
              </span>
            )}
          </p>
        </div>
        <button
          onClick={loadGraphData}
          className="px-4 py-2 rounded-xl border border-[#00f3ff]/30 bg-[#00f3ff]/10 text-[#00f3ff] hover:bg-[#00f3ff]/20 transition-all flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Graph
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graph Section */}
        <div className="lg:col-span-2 bg-[#0d0d0d] border border-[#333] rounded-2xl p-4 shadow-[0_0_40px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Network Graph</h3>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-[#ff003c]"></span>
                <span className="text-gray-400">High Risk</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-[#00ff66]"></span>
                <span className="text-gray-400">Low Risk</span>
              </div>
            </div>
          </div>
          <div className="bg-[#050505] rounded-xl border border-[#333]/50 overflow-hidden">
            <svg ref={svgRef} className="w-full" style={{ height: 500 }} />
          </div>

          {selectedNode && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-[#111] border border-[#333] rounded-xl"
            >
              <div className="flex items-start gap-3">
                <div
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: `${getRiskColor(selectedNode.riskScore)}20` }}
                >
                  {getEntityIcon(selectedNode.type, 24)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white">{selectedNode.label}</h4>
                    <span
                      className="text-xs font-semibold px-3 py-1 rounded-full"
                      style={{
                        backgroundColor: `${getRiskColor(selectedNode.riskScore)}20`,
                        color: getRiskColor(selectedNode.riskScore),
                        border: `1px solid ${getRiskColor(selectedNode.riskScore)}40`,
                      }}
                    >
                      Risk Score: {selectedNode.riskScore}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    Type: {selectedNode.type.toUpperCase()}
                  </p>
                  <div className="mt-3">
                    <h5 className="text-sm font-semibold text-gray-300 mb-2">
                      Explainable Risk Signals:
                    </h5>
                    <ul className="text-sm text-gray-400 space-y-1">
                      <li>• Linked to {graphData.links.filter(
                        (l) =>
                          l.source === selectedNode.id || l.target === selectedNode.id
                      ).length} other entities</li>
                      <li>• {graphData.links.filter(
                        (l) =>
                          (l.source === selectedNode.id || l.target === selectedNode.id) &&
                          l.flagged
                      ).length > 0 ? "Has flagged connections" : "No flagged connections"}</li>
                    </ul>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-gray-500 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Sidebar: Clusters & Intelligence */}
        <div className="flex flex-col gap-6">
          {/* Clusters */}
          <div className="bg-[#0d0d0d] border border-[#333] rounded-2xl p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#ff7a00]" />
              Fraud Clusters
            </h3>
            <div className="space-y-3">
              {graphData.clusters.map((cluster, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => setSelectedCluster(idx)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedCluster === idx
                      ? "border-[#ff003c] bg-[#ff003c]/10"
                      : "border-[#333] bg-[#111]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-white">
                      Cluster {idx + 1}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-bold ${
                        cluster.maxRisk >= 80
                          ? "bg-red-500/20 text-red-300"
                          : cluster.maxRisk >= 50
                          ? "bg-orange-500/20 text-orange-300"
                          : "bg-green-500/20 text-green-300"
                      }`}
                    >
                      {cluster.maxRisk} Risk
                    </span>
                  </div>
                  <div className="text-sm text-gray-400 space-y-1">
                    <p>• {cluster.memberCount} linked entities</p>
                    <p>• {cluster.flagged ? "🚩 Flagged connections" : "No active flags"}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Intelligence Packages */}
          <div className="bg-[#0d0d0d] border border-[#333] rounded-2xl p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#00f3ff]" />
              Intelligence Packages
            </h3>
            <div className="space-y-3">
              {intelligencePackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="p-4 rounded-xl bg-[#111] border border-[#333]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-white text-sm">
                      {pkg.title}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-bold ${
                        pkg.riskLevel === "Critical"
                          ? "bg-red-500/20 text-red-300"
                          : "bg-orange-500/20 text-orange-300"
                      }`}
                    >
                      {pkg.riskLevel}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 space-y-1 mb-3">
                    <p>• Entities: {pkg.entities}</p>
                    <p>• Flagged Transfers: {pkg.flaggedTransfers}</p>
                  </div>
                  <button className="w-full text-xs py-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-all flex items-center justify-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Export Court-Admissible Package
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}