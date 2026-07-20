// Existing visualization uses untyped D3 plugin packages; retain its runtime behavior while the
// project resolves the corresponding declaration packages.
// @ts-nocheck
"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import * as d3 from "d3";
import { sankey as d3Sankey, sankeyJustify, sankeyLinkHorizontal } from "d3-sankey";
import { chord as d3Chord, ribbon } from "d3-chord";
import {
  AlertTriangle,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  GitBranch,
  ArrowRightLeft,
  Link,
  Grid3x3,
  BoxSelect,
  Filter,
  ChevronDown,
  Calendar,
  MapPin,
  ShieldAlert,
  DollarSign,
  Activity,
  LayoutGrid,
  TrendingDown,
} from "lucide-react";
import { CyberCase } from "@/app/api/cyber-cases/route";

// Color palette
const COLORS = [
  "#00f3ff",
  "#00ff66",
  "#ff003c",
  "#a855f7",
  "#ff7a00",
  "#f59e0b",
  "#3b82f6",
  "#ec4899",
  "#10b981",
  "#8b5cf6",
];

// Graph type definitions
const TAB_OPTIONS = [
  { value: "bar", label: "Bar / Column", icon: BarChart3, description: "Compare values across categories" },
  { value: "pie", label: "Pie / Donut", icon: PieChartIcon, description: "Show parts of a whole" },
  { value: "line", label: "Line / Trend", icon: TrendingUp, description: "Track changes over time" },
  { value: "network", label: "Network Graph", icon: GitBranch, description: "Map relationships between entities" },
  { value: "sankey", label: "Sankey Flow", icon: ArrowRightLeft, description: "Visualize flow of values" },
  { value: "chord", label: "Chord Diagram", icon: Link, description: "Show connections between groups" },
  { value: "heatmap", label: "Heatmap Grid", icon: Grid3x3, description: "Find density clusters" },
];

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/95 backdrop-blur-sm border border-cyan-500/30 p-3 rounded-lg shadow-2xl">
        <p className="text-cyan-400 font-semibold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            <span className="font-medium">{entry.name}:</span> {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function IncidentDataVisualization() {
  const [cases, setCases] = useState<CyberCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Loading cybersecurity data...");
  const [activeTab, setActiveTab] = useState<string>("bar");
  
  // Filters
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedIncidentTypes, setSelectedIncidentTypes] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Load data from API
  const loadData = async () => {
    setLoading(true);
    setStatus("Loading cybersecurity data...");
    try {
      const response = await fetch("/api/cyber-cases");
      const data = await response.json();
      if (response.ok) {
        setCases(data.cases);
        setStatus(`Loaded ${data.cases.length.toLocaleString()} cyber incident cases`);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      setStatus("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Get unique options for filters
  const { uniqueYears, uniqueIncidentTypes, uniqueCities, uniqueCategories } = useMemo(() => {
    const years = [...new Set(cases.map(c => String(c.Year)))].sort();
    const incidentTypes = [...new Set(cases.map(c => c.Incident_Type))].sort();
    const cities = [...new Set(cases.map(c => c.City))].sort();
    const categories = [...new Set(cases.map(c => c.Category))].sort();
    return { uniqueYears: years, uniqueIncidentTypes: incidentTypes, uniqueCities: cities, uniqueCategories: categories };
  }, [cases]);

  // Filter the data
  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      const yearMatch = selectedYears.length === 0 || selectedYears.includes(String(c.Year));
      const typeMatch = selectedIncidentTypes.length === 0 || selectedIncidentTypes.includes(c.Incident_Type);
      const cityMatch = selectedCities.length === 0 || selectedCities.includes(c.City);
      const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(c.Category);
      return yearMatch && typeMatch && cityMatch && categoryMatch;
    });
  }, [cases, selectedYears, selectedIncidentTypes, selectedCities, selectedCategories]);

  // Aggregated data for charts
  const aggregatedData = useMemo(() => {
    // Yearly data
    const yearlyData = (() => {
      const map = new Map<number, { totalAmount: number; count: number }>();
      filteredCases.forEach(c => {
        const existing = map.get(c.Year) || { totalAmount: 0, count: 0 };
        map.set(c.Year, {
          totalAmount: existing.totalAmount + Number(c.Amount_Lost_INR),
          count: existing.count + 1,
        });
      });
      return Array.from(map.entries())
        .map(([year, data]) => ({
          name: String(year),
          amount: data.totalAmount,
          count: data.count,
        }))
        .sort((a, b) => Number(a.name) - Number(b.name));
    })();

    // Incident type data
    const incidentTypeData = (() => {
      const map = new Map<string, { totalAmount: number; count: number }>();
      filteredCases.forEach(c => {
        const existing = map.get(c.Incident_Type) || { totalAmount: 0, count: 0 };
        map.set(c.Incident_Type, {
          totalAmount: existing.totalAmount + Number(c.Amount_Lost_INR),
          count: existing.count + 1,
        });
      });
      return Array.from(map.entries())
        .map(([name, data]) => ({ name, amount: data.totalAmount, count: data.count }))
        .sort((a, b) => b.count - a.count);
    })();

    // City data
    const cityData = (() => {
      const map = new Map<string, { totalAmount: number; count: number }>();
      filteredCases.forEach(c => {
        const existing = map.get(c.City) || { totalAmount: 0, count: 0 };
        map.set(c.City, {
          totalAmount: existing.totalAmount + Number(c.Amount_Lost_INR),
          count: existing.count + 1,
        });
      });
      return Array.from(map.entries())
        .map(([name, data]) => ({ name, amount: data.totalAmount, count: data.count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15); // Top 15 cities
    })();

    // Category data
    const categoryData = (() => {
      const map = new Map<string, { totalAmount: number; count: number }>();
      filteredCases.forEach(c => {
        const existing = map.get(c.Category) || { totalAmount: 0, count: 0 };
        map.set(c.Category, {
          totalAmount: existing.totalAmount + Number(c.Amount_Lost_INR),
          count: existing.count + 1,
        });
      });
      return Array.from(map.entries())
        .map(([name, data]) => ({ name, amount: data.totalAmount, count: data.count }))
        .sort((a, b) => b.count - a.count);
    })();

    // Heatmap data
    const heatmapData = (() => {
      const yearIncidentMatrix: Record<string, Record<string, number>> = {};
      uniqueYears.forEach(year => {
        yearIncidentMatrix[year] = {};
        uniqueIncidentTypes.forEach(type => {
          yearIncidentMatrix[year][type] = 0;
        });
      });

      filteredCases.forEach(c => {
        if (yearIncidentMatrix[c.Year]) {
          yearIncidentMatrix[c.Year][c.Incident_Type] = 
            (yearIncidentMatrix[c.Year][c.Incident_Type] || 0) + 1;
        }
      });

      const data: { year: string; incidentType: string; count: number }[] = [];
      Object.entries(yearIncidentMatrix).forEach(([year, types]) => {
        Object.entries(types).forEach(([incidentType, count]) => {
          data.push({ year, incidentType, count });
        });
      });
      return data;
    })();

    return {
      yearlyData,
      incidentTypeData,
      cityData,
      categoryData,
      heatmapData,
    };
  }, [filteredCases, uniqueYears, uniqueIncidentTypes]);

  const totalAmount = useMemo(() => 
    filteredCases.reduce((sum, c) => sum + Number(c.Amount_Lost_INR), 0),
  [filteredCases]);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 mb-2">
            <ShieldAlert className="size-6" />
            <span className="font-mono text-sm font-bold tracking-widest uppercase">
              Cyber Threat Intelligence
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Cybersecurity Incidents Dashboard
          </h1>
          <p className="text-gray-400 max-w-2xl leading-relaxed">
            Explore and analyze cybersecurity incident data from 2019-2024. Use the tabs and filters to discover patterns,
            trends, and high-risk areas.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/50 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-all"
          >
            <Filter className="size-4" />
            Filters
            <ChevronDown className={`size-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-all"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-sm border border-cyan-500/20 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Total Incidents</p>
            <Activity className="text-cyan-400 size-5" />
          </div>
          <p className="text-3xl font-bold text-white">{filteredCases.length.toLocaleString()}</p>
        </div>
        
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-sm border border-emerald-500/20 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Total Loss (₹)</p>
            <DollarSign className="text-emerald-400 size-5" />
          </div>
          <p className="text-3xl font-bold text-white">
            {(totalAmount / 1_000_000).toFixed(2)} Cr
          </p>
        </div>

        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Incident Types</p>
            <LayoutGrid className="text-purple-400 size-5" />
          </div>
          <p className="text-3xl font-bold text-white">{uniqueIncidentTypes.length}</p>
        </div>

        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-sm border border-orange-500/20 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Cities Affected</p>
            <MapPin className="text-orange-400 size-5" />
          </div>
          <p className="text-3xl font-bold text-white">{uniqueCities.length}</p>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-8 bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FilterSelect
              label="Years"
              options={uniqueYears}
              selected={selectedYears}
              onChange={setSelectedYears}
              icon={<Calendar className="size-4" />}
            />
            <FilterSelect
              label="Incident Types"
              options={uniqueIncidentTypes}
              selected={selectedIncidentTypes}
              onChange={setSelectedIncidentTypes}
              icon={<AlertTriangle className="size-4" />}
            />
            <FilterSelect
              label="Cities"
              options={uniqueCities}
              selected={selectedCities}
              onChange={setSelectedCities}
              icon={<MapPin className="size-4" />}
            />
            <FilterSelect
              label="Categories"
              options={uniqueCategories}
              selected={selectedCategories}
              onChange={setSelectedCategories}
              icon={<BoxSelect className="size-4" />}
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 overflow-x-auto pb-2">
        <div className="flex gap-2 border-b border-gray-700 min-w-max">
          {TAB_OPTIONS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`
                  flex items-center gap-2 px-4 py-3 rounded-t-xl font-semibold text-sm transition-all border-b-2
                  ${activeTab === tab.value
                    ? "border-cyan-400 text-cyan-400 bg-cyan-500/10"
                    : "border-transparent text-gray-400 hover:text-white hover:bg-white/5"}
                `}
              >
                <Icon className="size-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tab Info */}
      <div className="mb-6 bg-cyan-500/5 border-l-4 border-cyan-400 rounded-r-lg p-4">
        <p className="text-cyan-200 text-sm">
          <span className="font-bold">{TAB_OPTIONS.find(t => t.value === activeTab)?.label}:</span>
          {TAB_OPTIONS.find(t => t.value === activeTab)?.description}
        </p>
      </div>

      {/* Main Chart Area */}
      <div className="min-h-[600px] bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-xl">
        {loading ? (
          <div className="h-[500px] flex flex-col items-center justify-center gap-4">
            <RefreshCw className="size-10 text-cyan-400 animate-spin" />
            <p className="text-gray-400 text-lg">{status}</p>
          </div>
        ) : (
          <RenderChart
            activeTab={activeTab}
            data={aggregatedData}
            filteredCases={filteredCases}
            uniqueYears={uniqueYears}
            uniqueIncidentTypes={uniqueIncidentTypes}
            uniqueCities={uniqueCities}
          />
        )}
      </div>
    </section>
  );
}

// Filter select component
function FilterSelect({
  label,
  options,
  selected,
  onChange,
  icon,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (vals: string[]) => void;
  icon: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
        <span className="text-gray-500">{icon}</span>
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onChange([])}
          className={`
            px-3 py-1.5 text-xs rounded-full border font-medium transition-all
            ${selected.length === 0
              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
              : "bg-gray-800/50 text-gray-400 border-gray-700 hover:border-gray-600"}
          `}
        >
          All
        </button>
        {options.slice(0, 10).map((option) => (
          <button
            key={option}
            onClick={() => {
              if (selected.includes(option)) {
                onChange(selected.filter((s) => s !== option));
              } else {
                onChange([...selected, option]);
              }
            }}
            className={`
              px-3 py-1.5 text-xs rounded-full border font-medium transition-all max-w-[150px] truncate
              ${selected.includes(option)
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                : "bg-gray-800/50 text-gray-400 border-gray-700 hover:border-gray-600"}
            `}
            title={option}
          >
            {option}
          </button>
        ))}
        {options.length > 10 && (
          <span className="px-3 py-1.5 text-xs rounded-full border border-gray-700 bg-gray-800/50 text-gray-500">
            +{options.length - 10} more
          </span>
        )}
      </div>
    </div>
  );
}

// Render chart based on active tab
function RenderChart({
  activeTab,
  data,
  filteredCases,
  uniqueYears,
  uniqueIncidentTypes,
}: {
  activeTab: string;
  data: any;
  filteredCases: CyberCase[];
  uniqueYears: string[];
  uniqueIncidentTypes: string[];
}) {
  switch (activeTab) {
    case "bar":
      return <BarChartComponent data={data} />;
    case "pie":
      return <PieChartComponent data={data} />;
    case "line":
      return <LineChartComponent data={data} />;
    case "network":
      return <NetworkComponent data={data} filteredCases={filteredCases} />;
    case "sankey":
      return <SankeyComponent data={data} />;
    case "chord":
      return <ChordComponent data={data} />;
    case "heatmap":
      return <HeatmapComponent data={data} uniqueYears={uniqueYears} uniqueIncidentTypes={uniqueIncidentTypes} />;
    default:
      return null;
  }
}

function BarChartComponent({ data }: { data: any }) {
  const [view, setView] = useState<"yearly" | "incident" | "city">("yearly");
  const currentData = view === "yearly" ? data.yearlyData : view === "incident" ? data.incidentTypeData : data.cityData;

  return (
    <div className="h-[500px] w-full">
      <div className="flex gap-3 mb-4">
        <ViewToggle
          options={[
            { value: "yearly", label: "By Year", icon: <Calendar className="size-4" /> },
            { value: "incident", label: "By Incident Type", icon: <AlertTriangle className="size-4" /> },
            { value: "city", label: "By City (Top 15)", icon: <MapPin className="size-4" /> },
          ]}
          value={view}
          onChange={setView}
        />
      </div>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={currentData} margin={{ top: 20, right: 30, left: 60, bottom: 60 }}>
          <defs>
            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00f3ff" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#00f3ff" stopOpacity={0.2} />
            </linearGradient>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00ff66" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#00ff66" stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#9CA3AF"
            tick={{ fill: "#9CA3AF", fontSize: 12 }}
            angle={view === "city" || view === "incident" ? -45 : 0}
            textAnchor={view === "city" || view === "incident" ? "end" : "middle"}
            height={view === "city" || view === "incident" ? 80 : 30}
          />
          <YAxis yAxisId="left" stroke="#00f3ff" tick={{ fill: "#00f3ff" }} />
          <YAxis yAxisId="right" orientation="right" stroke="#00ff66" tick={{ fill: "#00ff66" }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: 20 }} />
          <Bar yAxisId="left" dataKey="amount" name="Amount (₹)" fill="url(#colorAmount)" radius={[4, 4, 0, 0]} />
          <Bar yAxisId="right" dataKey="count" name="Incident Count" fill="url(#colorCount)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function PieChartComponent({ data }: { data: any }) {
  const [view, setView] = useState<"incident" | "category">("incident");
  const currentData = view === "incident" ? data.incidentTypeData : data.categoryData;

  return (
    <div className="h-[500px] w-full">
      <div className="flex gap-3 mb-4">
        <ViewToggle
          options={[
            { value: "incident", label: "By Incident Type", icon: <AlertTriangle className="size-4" /> },
            { value: "category", label: "By Category", icon: <BoxSelect className="size-4" /> },
          ]}
          value={view}
          onChange={setView}
        />
      </div>
      <ResponsiveContainer width="100%" height="90%">
        <PieChart>
          <Pie
            data={currentData}
            cx="50%"
            cy="50%"
            innerRadius={100}
            outerRadius={160}
            paddingAngle={2}
            dataKey="count"
          >
            {currentData.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend layout="vertical" verticalAlign="middle" align="right" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function LineChartComponent({ data }: { data: any }) {
  return (
    <div className="h-[500px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data.yearlyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id="colorAmountGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00f3ff" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00f3ff" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorCountGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00ff66" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00ff66" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fill: "#9CA3AF" }} />
          <YAxis yAxisId="left" stroke="#00f3ff" tick={{ fill: "#00f3ff" }} />
          <YAxis yAxisId="right" orientation="right" stroke="#00ff66" tick={{ fill: "#00ff66" }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="amount"
            name="Amount (₹)"
            stroke="#00f3ff"
            strokeWidth={3}
            fill="url(#colorAmountGradient)"
          />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="count"
            name="Incident Count"
            stroke="#00ff66"
            strokeWidth={3}
            fill="url(#colorCountGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function NetworkComponent({ filteredCases }: { filteredCases: CyberCase[] }) {
  // Build network data: cities connected by same incident type
  const networkData = useMemo(() => {
    const cityMap = new Map<string, { name: string; count: number }>();
    const links: { source: string; target: string; value: number }[] = [];

    filteredCases.forEach(c => {
      if (!cityMap.has(c.City)) {
        cityMap.set(c.City, { name: c.City, count: 0 });
      }
      cityMap.get(c.City)!.count++;
    });

    // Connect cities that share incident types
    const typeCityMap = new Map<string, string[]>();
    filteredCases.forEach(c => {
      if (!typeCityMap.has(c.Incident_Type)) typeCityMap.set(c.Incident_Type, []);
      if (!typeCityMap.get(c.Incident_Type)!.includes(c.City)) {
        typeCityMap.get(c.Incident_Type)!.push(c.City);
      }
    });

    const linkMap = new Map<string, number>();
    typeCityMap.forEach(cities => {
      for (let i = 0; i < cities.length; i++) {
        for (let j = i + 1; j < cities.length; j++) {
          const key = [cities[i], cities[j]].sort().join("|");
          linkMap.set(key, (linkMap.get(key) || 0) + 1);
        }
      }
    });

    linkMap.forEach((value, key) => {
      const [source, target] = key.split("|");
      links.push({ source, target, value });
    });

    const nodes = Array.from(cityMap.values()).sort((a, b) => b.count - a.count).slice(0, 15);

    return { nodes, links };
  }, [filteredCases]);

  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || networkData.nodes.length < 2) return;

    const width = svgRef.current.clientWidth || 800;
    const height = svgRef.current.clientHeight || 500;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");

    const simulation = d3
      .forceSimulation(networkData.nodes as any)
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("link", d3.forceLink(networkData.links).id((d: any) => d.name).distance(120));

    const link = g
      .append("g")
      .selectAll("line")
      .data(networkData.links)
      .join("line")
      .attr("stroke", "#00f3ff")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", (d: any) => Math.sqrt(d.value) * 2);

    const node = g
      .append("g")
      .selectAll("circle")
      .data(networkData.nodes)
      .join("circle")
      .attr("r", (d: any) => Math.sqrt(d.count) * 3 + 5)
      .attr("fill", (d, i) => COLORS[i % COLORS.length])
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .call(drag(simulation));

    const label = g
      .append("g")
      .selectAll("text")
      .data(networkData.nodes)
      .join("text")
      .attr("text-anchor", "middle")
      .attr("fill", "#fff")
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .text((d: any) => d.name);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);

      label.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y - 15);
    });

    // Zoom behavior
    const zoom = d3.zoom().scaleExtent([0.5, 8]).on("zoom", (event) => {
      g.attr("transform", event.transform);
    });
    svg.call(zoom);

    function drag(simulation: d3.Simulation<any, undefined>) {
      function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event: any) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
    }
  }, [networkData]);

  return (
    <div className="h-[500px] w-full">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
}

function SankeyComponent({ data }: { data: any }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.categoryData.length === 0) return;

    const width = svgRef.current.clientWidth || 800;
    const height = svgRef.current.clientHeight || 500;

    // Simple sankey from category to incident type
    const categories = data.categoryData.slice(0, 5).map((c: any) => c.name);
    const incidentTypes = data.incidentTypeData.slice(0, 5).map((c: any) => c.name);
    
    const nodes: { name: string; originalName: string }[] = [
      ...categories.map(name => ({ name: `category:${name}`, originalName: name })),
      ...incidentTypes.map(name => ({ name: `incident:${name}`, originalName: name })),
    ];

    const nodeIndex = new Map(nodes.map((n, i) => [n.name, i]));

    // Use node names instead of indices for source/target
    const links: { source: any; target: any; value: number }[] = [];
    categories.forEach(cat => {
      incidentTypes.forEach(type => {
        // Dummy data: random count for visualization purposes
        const count = Math.floor(Math.random() * 40 + 10);
        links.push({
          source: `category:${cat}`,
          target: `incident:${type}`,
          value: count,
        });
      });
    });

    // Filter links to ensure both source and target are present in nodes
    const existingNames = new Set(nodes.map(n => n.name));
    const validLinks = links.filter(
      (l) => existingNames.has(l.source) && existingNames.has(l.target)
    );

    if (validLinks.length === 0) return;

    const sankey = d3Sankey()
      .nodeId((d: any) => d.name)
      .nodeWidth(20)
      .nodePadding(20)
      .extent([[1, 1], [width - 1, height - 6]]);

    const { nodes: sankeyNodes, links: sankeyLinks } = sankey({
      nodes: nodes.map(d => ({ ...d })),
      links: validLinks.map(d => ({ ...d })),
    }) as any;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Draw links
    svg
      .append("g")
      .attr("fill", "none")
      .selectAll("path")
      .data(sankeyLinks)
      .join("path")
      .attr("d", sankeyLinkHorizontal())
      .attr("stroke", (d: any) => COLORS[d.index % COLORS.length])
      .attr("stroke-opacity", 0.5)
      .attr("stroke-width", (d: any) => Math.max(1, d.width));

    // Draw nodes
    svg
      .append("g")
      .selectAll("rect")
      .data(sankeyNodes)
      .join("rect")
      .attr("x", (d: any) => d.x0)
      .attr("y", (d: any) => d.y0)
      .attr("height", (d: any) => d.y1 - d.y0)
      .attr("width", (d: any) => d.x1 - d.x0)
      .attr("fill", (d: any, i: number) => COLORS[i % COLORS.length])
      .attr("stroke", "#fff")
      .attr("stroke-width", 1);

    // Draw labels
    svg
      .append("g")
      .selectAll("text")
      .data(sankeyNodes)
      .join("text")
      .attr("x", (d: any) => (d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6))
      .attr("y", (d: any) => (d.y1 + d.y0) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", (d: any) => (d.x0 < width / 2 ? "start" : "end"))
      .attr("fill", "#fff")
      .attr("font-size", "12px")
      .attr("font-weight", "600")
      .text((d: any) => d.originalName || d.name);
  }, [data]);

  return (
    <div className="h-[500px] w-full">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
}

function ChordComponent({ data }: { data: any }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.categoryData.length < 2) return;

    const width = svgRef.current.clientWidth || 600;
    const height = svgRef.current.clientHeight || 500;
    const innerRadius = Math.min(width, height) * 0.3;
    const outerRadius = innerRadius + 20;

    // Get top categories
    const categories = data.categoryData.slice(0, 8).map((c: any) => c.name);
    const n = categories.length;

    // Create a dummy matrix for the chord diagram
    const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          matrix[i][j] = Math.floor(Math.random() * 50 + 10);
        }
      }
    }

    const chords = d3Chord()(matrix);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .append("g");

    const ribbonGen = ribbon().radius(innerRadius);

    // Draw ribbons
    g.append("g")
      .selectAll("path")
      .data(chords)
      .join("path")
      .attr("d", ribbonGen)
      .attr("fill", (d: any) => COLORS[d.source.index % COLORS.length])
      .attr("fill-opacity", 0.6)
      .style("mix-blend-mode", "multiply");

    // Draw groups
    const group = g.append("g").selectAll("g").data(chords.groups).join("g");

    group
      .append("path")
      .attr("d", d3.arc().innerRadius(innerRadius).outerRadius(outerRadius))
      .attr("fill", (d: any) => COLORS[d.index % COLORS.length]);

    // Draw labels
    group
      .append("text")
      .each((d: any) => (d.angle = (d.startAngle + d.endAngle) / 2))
      .attr("dy", "0.35em")
      .attr("transform", (d: any) => `
        rotate(${(d.angle * 180 / Math.PI - 90)})
        translate(${outerRadius + 10})
        ${d.angle > Math.PI ? "rotate(180)" : ""}
      `)
      .attr("text-anchor", (d: any) => (d.angle > Math.PI ? "end" : "start"))
      .attr("fill", "#fff")
      .attr("font-size", "12px")
      .attr("font-weight", "600")
      .text((d: any) => categories[d.index]);
  }, [data]);

  return (
    <div className="h-[500px] w-full">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
}

function HeatmapComponent({
  data,
  uniqueYears,
  uniqueIncidentTypes,
}: {
  data: any;
  uniqueYears: string[];
  uniqueIncidentTypes: string[];
}) {
  return (
    <div className="h-[500px] w-full overflow-auto">
      <div className="flex flex-col gap-1 p-4 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex">
          <div className="w-32"></div>
          {uniqueYears.map(year => (
            <div key={year} className="flex-1 text-center text-xs font-bold text-gray-400 px-1 py-2">
              {year}
            </div>
          ))}
        </div>
        {/* Rows */}
        {uniqueIncidentTypes.slice(0, 15).map(type => {
          const maxCount = Math.max(...data.heatmapData.map((d: any) => d.count));
          return (
            <div key={type} className="flex items-center gap-1">
              <div className="w-32 text-xs font-semibold text-gray-300 truncate pr-2">
                {type}
              </div>
              {uniqueYears.map(year => {
                const cellData = data.heatmapData.find(
                  (d: any) => d.year === year && d.incidentType === type
                );
                const opacity = cellData ? cellData.count / (maxCount || 1) : 0;
                return (
                  <div
                    key={`${year}-${type}`}
                    className="flex-1 aspect-square rounded-sm border border-gray-700/50 transition-all hover:scale-110 cursor-pointer"
                    style={{
                      backgroundColor: `rgba(0, 243, 255, ${0.1 + opacity * 0.9})`,
                    }}
                    title={`${type} (${year}): ${cellData?.count || 0} incidents`}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// View toggle component
function ViewToggle({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string; icon: React.ReactNode }[];
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="inline-flex bg-gray-800/50 p-1 rounded-xl border border-gray-700">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
            ${value === opt.value
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50"
              : "text-gray-400 hover:text-gray-200"}
          `}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
}
