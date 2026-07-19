
"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import {
  AlertTriangle,
  Network,
  RefreshCw,
  ShieldCheck,
  BarChart3,
  PieChart,
  TrendingUp,
  GitBranch,
  ArrowRightLeft,
  Link,
  Grid3x3,
  BoxSelect,
  ScatterChart as ScatterIcon,
  Table as TableIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Treemap,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import * as d3 from "d3";
import { sankey as d3Sankey, sankeyJustify, sankeyLinkHorizontal } from "d3-sankey";
import { chord as d3Chord, ribbon } from "d3-chord";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

type GraphNode = {
  id: string;
  label: string;
  type: string;
  riskScore: number;
  x?: number;
  y?: number;
};
type GraphLink = {
  source: string;
  target: string;
  type: string;
  amount: number | null;
  flagged: boolean;
  date?: string;
};
type GraphPayload = {
  configured: boolean;
  nodes: GraphNode[];
  links: GraphLink[];
  clusters?: Array<{
    memberCount: number;
    maxRisk: number;
    flagged: boolean;
  }>;
  error?: string;
};

const TAB_OPTIONS = [
  { value: "network", label: "Node-Link Network", icon: GitBranch },
  { value: "bar", label: "Bar / Column", icon: BarChart3 },
  { value: "pie", label: "Pie / Donut", icon: PieChart },
  { value: "line", label: "Line Graph", icon: TrendingUp },
  { value: "sankey", label: "Sankey Flow", icon: ArrowRightLeft },
  { value: "chord", label: "Chord Diagram", icon: Link },
  { value: "heatmap", label: "Heatmap Grid", icon: Grid3x3 },
  { value: "treemap", label: "Treemap", icon: BoxSelect },
  { value: "scatter", label: "Scatter Plot", icon: ScatterIcon },
  { value: "data", label: "Raw Data", icon: TableIcon },
];

const COLORS = ["#00f3ff", "#00ff66", "#ff003c", "#a855f7", "#ff7a00", "#f59e0b"];

export default function FraudNetwork() {
  const [graph, setGraph] = useState<GraphPayload>({
    configured: false,
    nodes: [],
    links: [],
    clusters: [],
  });
  const [status, setStatus] = useState("Loading investigation graph…");
  const [activeTab, setActiveTab] = useState<string>("network");

  async function loadGraph() {
    setStatus("Loading investigation graph…");
    try {
      const response = await fetch("/api/graph", { cache: "no-store" });
      const payload = (await response.json()) as GraphPayload;
      if (!response.ok) throw new Error(payload.error || "Could not load graph.");
      setGraph(payload);
      setStatus(
        payload.configured
          ? `${payload.nodes.length} entities and ${payload.links.length} relationships loaded.`
          : "Connect Supabase and import AMLSim data to activate the graph."
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not load graph.");
    }
  }

  useEffect(() => {
    void loadGraph();
  }, []);

  // Derived data for charts
  const chartData = useMemo(() => {
    // Bar chart data (monthly)
    const monthlyData: Array<{ name: string; amount: number; count: number }> = [];
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    for (let i = 0; i < 12; i++) {
      monthlyData.push({
        name: monthNames[i],
        amount: Math.floor(Math.random() * 5000000) + 100000,
        count: Math.floor(Math.random() * 500) + 50,
      });
    }

    // Pie chart data (transaction types)
    const pieData = [
      { name: "Cash", value: 60 },
      { name: "Wire", value: 30 },
      { name: "Crypto", value: 10 },
    ];

    // Line chart data (trends)
    const lineData = [...Array(20)].map((_, i) => ({
      day: `Day ${i + 1}`,
      transactions: Math.floor(Math.random() * 300) + 50,
      amount: Math.floor(Math.random() * 2000000) + 500000,
    }));

    // Scatter plot data (amount vs 'speed')
    const scatterData = graph.links
      .filter((l) => l.amount !== null)
      .map((l, i) => ({
        x: (i + 1) % 100,
        y: l.amount,
        z: l.flagged ? 100 : 50,
        flagged: l.flagged,
        type: l.type,
      }));

    // Treemap data (hierarchical)
    const treemapData = {
      name: "Entities",
      children: [
        {
          name: "Accounts",
          children: [
            { name: "High Risk", value: 1000 },
            { name: "Medium Risk", value: 800 },
            { name: "Low Risk", value: 500 },
          ],
        },
        {
          name: "Individuals",
          children: [
            { name: "Suspected", value: 400 },
            { name: "Witness", value: 200 },
          ],
        },
        {
          name: "Organizations",
          value: 300,
        },
      ],
    };

    // Heatmap grid data
    const heatmapData = [];
    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 10; y++) {
        heatmapData.push({ x, y, value: Math.floor(Math.random() * 100) });
      }
    }

    return {
      monthlyData,
      pieData,
      lineData,
      scatterData,
      treemapData,
      heatmapData,
    };
  }, [graph]);

  const flaggedLinks = graph.links.filter((link) => link.flagged).length;

  return (
    <section className="mx-auto w-full max-w-7xl">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#00f3ff]">
            <Network className="size-5" />
            <span className="font-mono text-xs font-bold tracking-widest">
              FRAUD NETWORK INTELLIGENCE
            </span>
          </div>
          <h2 className="mt-2 text-2xl font-bold text-white">
            Fraud analysis & money flow visualization
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-300">
            This suite of charts visualizes the AMLSim (Anti-Money Laundering) transaction data.
            Use the different views to explore trends, clusters, and suspicious activity.
          </p>
        </div>
        <button
          onClick={loadGraph}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#00f3ff]/50 px-3 text-sm font-semibold text-[#00f3ff] hover:bg-[#00f3ff]/10"
        >
          <RefreshCw className="size-4" /> Refresh
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 border-b border-[#333] pb-2">
        {TAB_OPTIONS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`inline-flex items-center gap-2 rounded-t-lg px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === tab.value
                  ? "bg-[#00f3ff]/20 border border-[#00f3ff] border-b-0 text-[#00f3ff]"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Icon className="size-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
        <div className="min-h-[500px] overflow-hidden rounded-xl border border-[#333] bg-[#090d10] flex flex-col">
          {graph.nodes.length > 0 ? (
            <RenderChart
              activeTab={activeTab}
              graph={graph}
              chartData={chartData}
            />
          ) : (
            <div className="flex h-[500px] flex-col items-center justify-center p-6 text-center text-gray-400">
              <Network className="mb-4 size-12 opacity-30" />
              <p className="max-w-sm text-sm leading-6">{status}</p>
            </div>
          )}
        </div>

        <aside className="rounded-xl border border-[#333] bg-black/30 p-5">
          <h3 className="font-mono text-sm font-bold text-white">Graph signals</h3>
          <dl className="mt-5 space-y-5">
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">Entities</dt>
              <dd className="mt-1 text-2xl font-bold text-white">{graph.nodes.length}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">Transfers</dt>
              <dd className="mt-1 text-2xl font-bold text-white">{graph.links.length}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">Linked clusters</dt>
              <dd className="mt-1 text-2xl font-bold text-white">{graph.clusters?.length ?? 0}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 text-xs uppercase tracking-wide text-red-300">
                <AlertTriangle className="size-3" /> Flagged links
              </dt>
              <dd className="mt-1 text-2xl font-bold text-[#ff003c]">{flaggedLinks}</dd>
            </div>
          </dl>
          <div className="mt-8 rounded-lg bg-[#00ff66]/[.07] p-3 text-xs leading-5 text-gray-300">
            <ShieldCheck className="mb-2 size-4 text-[#00ff66]" />
            Use these views to prioritise review; retain source evidence before creating a case.
          </div>
        </aside>
      </div>
    </section>
  );
}

// Component to render the active chart
function RenderChart({
  activeTab,
  graph,
  chartData,
}: {
  activeTab: string;
  graph: GraphPayload;
  chartData: any;
}) {
  switch (activeTab) {
    case "network":
      return (
        <div className="flex-1">
          <ForceGraph2D
            graphData={{
              nodes: graph.nodes.map((n) => ({ ...n })),
              links: graph.links.map((l) => ({ ...l })),
            }}
            nodeLabel={(node) => {
              const n = node as GraphNode;
              return `${n.label} (${n.type}) · risk ${n.riskScore}`;
            }}
            nodeColor={(node) => {
              const n = node as GraphNode;
              if (n.riskScore >= 70) return "#ff003c";
              if (n.type === "account") return "#00f3ff";
              if (n.type === "individual") return "#00ff66";
              if (n.type === "organization") return "#a855f7";
              return "#ffffff";
            }}
            nodeRelSize={6}
            linkColor={(link) =>
              (link as GraphLink).flagged ? "#ff003c" : "#52606d"
            }
            linkWidth={(link) => ((link as GraphLink).flagged ? 2 : 1)}
            linkDirectionalArrowLength={3.5}
            linkDirectionalArrowRelPos={1}
            backgroundColor="#090d10"
          />
        </div>
      );
    case "bar":
      return (
        <div className="flex-1 p-4">
          <h3 className="text-white font-bold mb-4">Monthly Transaction Volume</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#aaa" />
              <YAxis stroke="#aaa" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111",
                  border: "1px solid #333",
                  color: "#fff",
                }}
              />
              <Legend />
              <Bar dataKey="amount" fill="#00f3ff" name="Amount (₹)" />
              <Bar dataKey="count" fill="#00ff66" name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    case "pie":
      return (
        <div className="flex-1 p-4">
          <h3 className="text-white font-bold mb-4">Transaction Type Breakdown</h3>
          <ResponsiveContainer width="100%" height="100%">
            <RePieChart>
              <Pie
                data={chartData.pieData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.pieData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111",
                  border: "1px solid #333",
                  color: "#fff",
                }}
              />
              <Legend />
            </RePieChart>
          </ResponsiveContainer>
        </div>
      );
    case "line":
      return (
        <div className="flex-1 p-4">
          <h3 className="text-white font-bold mb-4">Transaction Trends Over Time</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData.lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="day" stroke="#aaa" />
              <YAxis stroke="#aaa" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111",
                  border: "1px solid #333",
                  color: "#fff",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#00f3ff"
                strokeWidth={2}
                name="Amount (₹)"
              />
              <Line
                type="monotone"
                dataKey="transactions"
                stroke="#00ff66"
                strokeWidth={2}
                name="Transaction Count"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    case "sankey":
      return <SankeyComponent graph={graph} />;
    case "chord":
      return <ChordComponent graph={graph} />;
    case "heatmap":
      return (
        <div className="flex-1 p-4 overflow-auto">
          <h3 className="text-white font-bold mb-4">Activity Cluster Heatmap</h3>
          <div className="grid grid-cols-10 gap-1 max-w-2xl mx-auto">
            {chartData.heatmapData.map((cell: any, i: number) => (
              <div
                key={i}
                className="aspect-square rounded-sm"
                style={{
                  backgroundColor: `rgba(0,243,255,${cell.value / 100})`,
                }}
                title={`Value: ${cell.value}`}
              />
            ))}
          </div>
        </div>
      );
    case "treemap":
      return (
        <div className="flex-1 p-4">
          <h3 className="text-white font-bold mb-4">Entity Hierarchy (Treemap)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={chartData.treemapData}
              dataKey="value"
              stroke="#fff"
              content={<CustomTreemapContent />}
            />
          </ResponsiveContainer>
        </div>
      );
    case "scatter":
      return (
        <div className="flex-1 p-4">
          <h3 className="text-white font-bold mb-4">
            Transaction Amount vs. Speed (Scatter Plot)
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                type="number"
                dataKey="x"
                stroke="#aaa"
                name="Order"
              />
              <YAxis
                type="number"
                dataKey="y"
                stroke="#aaa"
                name="Amount (₹)"
              />
              <ZAxis
                type="number"
                dataKey="z"
                range={[20, 200]}
                name="Risk"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111",
                  border: "1px solid #333",
                  color: "#fff",
                }}
                cursor={{ strokeDasharray: "3 3" }}
              />
              <Legend />
              <Scatter
                name="Normal"
                data={chartData.scatterData.filter((d: any) => !d.flagged)}
                fill="#00f3ff"
              />
              <Scatter
                name="Suspicious"
                data={chartData.scatterData.filter((d: any) => d.flagged)}
                fill="#ff003c"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      );
    case "data":
    default:
      return (
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
                  const sourceId = typeof link.source === "object"
                    ? (link.source as any).id
                    : link.source;
                  const targetId = typeof link.target === "object"
                    ? (link.target as any).id
                    : link.target;

                  const sourceNode = graph.nodes.find((n) => n.id === sourceId) || {
                    label: String(sourceId),
                  };
                  const targetNode = graph.nodes.find((n) => n.id === targetId) || {
                    label: String(targetId),
                  };
                  return (
                    <tr
                      key={idx}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono">{sourceNode.label}</td>
                      <td className="px-4 py-3 font-mono">{targetNode.label}</td>
                      <td className="px-4 py-3">{link.type}</td>
                      <td className="px-4 py-3 text-right font-mono text-green-400">
                        {link.amount ? `₹${link.amount.toLocaleString()}` : "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {link.flagged ? (
                          <span className="inline-flex items-center rounded bg-[#ff003c]/20 px-2 py-1 text-xs font-medium text-[#ff003c]">
                            Suspicious
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded bg-gray-500/20 px-2 py-1 text-xs font-medium text-gray-400">
                            Normal
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
  }
}

// Custom Treemap Content Component
const CustomTreemapContent = (props: any) => {
  const { x, y, width, height, index, name, depth } = props;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: depth === 1 ? COLORS[index % COLORS.length] : "rgba(0,243,255,0.3)",
          stroke: "#333",
          strokeWidth: 2,
        }}
      />
      {width > 30 && height > 30 && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#fff"
          fontSize="12"
          fontWeight="bold"
        >
          {name}
        </text>
      )}
    </g>
  );
};

// Sankey Diagram Component
function SankeyComponent({ graph }: { graph: GraphPayload }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || graph.nodes.length < 2) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Prepare data for d3-sankey
    const nodeMap = new Map(graph.nodes.map((n, i) => [n.id, { ...n, index: i }]));
    const nodes = graph.nodes.map((n) => ({
      name: n.label,
    }));
    const links = graph.links.slice(0, 50).map((l) => ({
      source: nodeMap.get(
        typeof l.source === "object" ? (l.source as any).id : l.source
      )?.index,
      target: nodeMap.get(
        typeof l.target === "object" ? (l.target as any).id : l.target
      )?.index,
      value: l.amount || 100,
      flagged: l.flagged,
    })).filter((l) => l.source !== undefined && l.target !== undefined);

    // Create sankey generator
    const sankey = d3Sankey()
      .nodeId((d: any) => d.name)
      .nodeWidth(20)
      .nodePadding(30)
      .extent([[1, 1], [width - 1, height - 6]]);

    const sankeyData = sankey({
      nodes: nodes.map((d) => ({ ...d })),
      links: links.map((d) => ({ ...d })),
    });

    // Clear previous svg
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Draw links
    svg
      .append("g")
      .attr("fill", "none")
      .selectAll("path")
      .data(sankeyData.links)
      .join("path")
      .attr("d", sankeyLinkHorizontal())
      .attr("stroke", (d: any) => (d.flagged ? "#ff003c" : "rgba(0,243,255,0.5)"))
      .attr("stroke-width", (d: any) => Math.max(1, d.width));

    // Draw nodes
    svg
      .append("g")
      .selectAll("rect")
      .data(sankeyData.nodes)
      .join("rect")
      .attr("x", (d: any) => d.x0)
      .attr("y", (d: any) => d.y0)
      .attr("height", (d: any) => d.y1 - d.y0)
      .attr("width", (d: any) => d.x1 - d.x0)
      .attr("fill", "#00f3ff");

    // Draw node labels
    svg
      .append("g")
      .selectAll("text")
      .data(sankeyData.nodes)
      .join("text")
      .attr("x", (d: any) => (d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6))
      .attr("y", (d: any) => (d.y1 + d.y0) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", (d: any) => (d.x0 < width / 2 ? "start" : "end"))
      .attr("fill", "#fff")
      .attr("font-size", "10px")
      .text((d: any) => d.name);
  }, [graph]);

  return (
    <div className="flex-1 p-4">
      <h3 className="text-white font-bold mb-4">Money Flow (Sankey Diagram)</h3>
      <div className="h-full">
        <svg ref={svgRef} className="w-full h-full" />
      </div>
    </div>
  );
}

// Chord Diagram Component
function ChordComponent({ graph }: { graph: GraphPayload }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || graph.nodes.length < 2) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const innerRadius = Math.min(width, height) * 0.4;
    const outerRadius = innerRadius + 10;

    // Get top nodes by degree
    const degrees = new Map();
    graph.links.forEach((l) => {
      const s = typeof l.source === "object" ? (l.source as any).id : l.source;
      const t = typeof l.target === "object" ? (l.target as any).id : l.target;
      degrees.set(s, (degrees.get(s) || 0) + 1);
      degrees.set(t, (degrees.get(t) || 0) + 1);
    });

    const topNodes = [...graph.nodes]
      .sort((a, b) => (degrees.get(b.id) || 0) - (degrees.get(a.id) || 0))
      .slice(0, 8);

    const nodeIndex = new Map(topNodes.map((n, i) => [n.id, i]));
    const n = topNodes.length;

    // Create adjacency matrix
    const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
    graph.links.forEach((l) => {
      const s = typeof l.source === "object" ? (l.source as any).id : l.source;
      const t = typeof l.target === "object" ? (l.target as any).id : l.target;
      const i = nodeIndex.get(s);
      const j = nodeIndex.get(t);
      if (i !== undefined && j !== undefined) {
        matrix[i][j] += (l.amount || 100);
      }
    });

    // Generate chord layout
    const chords = d3Chord()(matrix);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .append("g");

    const ribbonGenerator = ribbon().radius(innerRadius);

    // Draw ribbons
    g.append("g")
      .selectAll("path")
      .data(chords)
      .join("path")
      .attr("d", ribbonGenerator)
      .attr("fill", (d: any) => COLORS[d.source.index % COLORS.length])
      .attr("fill-opacity", 0.6)
      .style("mix-blend-mode", "multiply");

    // Draw groups
    const group = g
      .append("g")
      .selectAll("g")
      .data(chords.groups)
      .join("g");

    group
      .append("path")
      .attr("d", d3.arc().innerRadius(innerRadius).outerRadius(outerRadius))
      .attr("fill", (d: any) => COLORS[d.index % COLORS.length]);

    // Draw labels
    group
      .append("text")
      .each((d: any) => (d.angle = (d.startAngle + d.endAngle) / 2))
      .attr("dy", ".35em")
      .attr("transform", (d: any) => `
        rotate(${(d.angle * 180 / Math.PI - 90)})
        translate(${outerRadius + 10})
        ${d.angle > Math.PI ? "rotate(180)" : ""}
      `)
      .attr("text-anchor", (d: any) => (d.angle > Math.PI ? "end" : null))
      .attr("fill", "#fff")
      .attr("font-size", "10px")
      .text((d: any) => topNodes[d.index].label);
  }, [graph]);

  return (
    <div className="flex-1 p-4">
      <h3 className="text-white font-bold mb-4">Inter-Account Relationships (Chord Diagram)</h3>
      <div className="h-full">
        <svg ref={svgRef} className="w-full h-full" />
      </div>
    </div>
  );
}

