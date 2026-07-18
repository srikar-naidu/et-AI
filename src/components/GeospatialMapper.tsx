"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Building2,
  Clock3,
  Copy,
  MapPin,
  Radar,
  Radio,
  RefreshCcw,
  Route,
  Send,
  Shield,
  Target,
  Users,
  Zap,
} from "lucide-react";
import dynamic from "next/dynamic";

const LiveMap = dynamic(() => import("./LiveMap"), { ssr: false });

interface Hotspot {
  id: string;
  lat: number;
  lng: number;
  type: "counterfeit" | "phishing" | "digital-arrest";
  severity: "low" | "medium" | "high" | "critical";
  count: number;
  location: string;
  district: string;
  latestReportAt: string;
  source: "sample" | "live" | "dataset";
}

const sampleHotspots: Hotspot[] = [
  {
    id: "sample-1",
    lat: 28.6139,
    lng: 77.209,
    type: "digital-arrest",
    severity: "critical",
    count: 24,
    location: "Connaught Place, Delhi",
    district: "Delhi",
    latestReportAt: "2026-07-18T10:18:00.000Z",
    source: "sample",
  },
  {
    id: "sample-2",
    lat: 19.076,
    lng: 72.8777,
    type: "phishing",
    severity: "high",
    count: 18,
    location: "Bandra, Mumbai",
    district: "Mumbai",
    latestReportAt: "2026-07-18T09:42:00.000Z",
    source: "sample",
  },
  {
    id: "sample-3",
    lat: 12.9716,
    lng: 77.5946,
    type: "counterfeit",
    severity: "medium",
    count: 12,
    location: "MG Road, Bengaluru",
    district: "Bengaluru",
    latestReportAt: "2026-07-18T08:15:00.000Z",
    source: "sample",
  },
  {
    id: "sample-4",
    lat: 22.5726,
    lng: 88.3639,
    type: "digital-arrest",
    severity: "critical",
    count: 31,
    location: "Park Street, Kolkata",
    district: "Kolkata",
    latestReportAt: "2026-07-18T11:04:00.000Z",
    source: "sample",
  },
  {
    id: "sample-5",
    lat: 13.0827,
    lng: 80.2707,
    type: "phishing",
    severity: "low",
    count: 8,
    location: "T Nagar, Chennai",
    district: "Chennai",
    latestReportAt: "2026-07-18T07:28:00.000Z",
    source: "sample",
  },
];

type TimeRange = "all";
type DeploymentState = Record<string, { units: number; status: "monitoring" | "dispatching" | "escalated" }>;

function deriveDistrict(location: string) {
  const parts = location.split(",");
  return parts[parts.length - 1]?.trim() || "Unknown district";
}

function getSeverityWeight(severity: Hotspot["severity"]) {
  switch (severity) {
    case "critical":
      return 90;
    case "high":
      return 70;
    case "medium":
      return 45;
    case "low":
      return 20;
    default:
      return 10;
  }
}

function getDefaultDeployment(hotspot: Hotspot) {
  const units = hotspot.severity === "critical" ? 4 : hotspot.severity === "high" ? 3 : hotspot.severity === "medium" ? 2 : 1;
  const status = hotspot.severity === "critical" ? "escalated" : hotspot.severity === "high" ? "dispatching" : "monitoring";
  return { units, status } as const;
}

export default function GeospatialMapper() {
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [baseHotspots, setBaseHotspots] = useState<Hotspot[]>(sampleHotspots);
  const [isLiveData, setIsLiveData] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"all" | Hotspot["type"]>("all");
  const timeRange: TimeRange = "all";
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [deploymentState, setDeploymentState] = useState<DeploymentState>({});

  const loadHotspots = useCallback(async () => {
    try {
      const response = await fetch(`/api/hotspots`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.configured || !Array.isArray(payload.hotspots) || payload.hotspots.length === 0) {
        setBaseHotspots(sampleHotspots);
        setSelectedHotspot((current) => current ?? sampleHotspots[0] ?? null);
        setIsLiveData(false);
        setLastUpdated(new Date().toISOString());
        return;
      }

      const liveHotspots = payload.hotspots.map((hotspot: {
        id: string;
        latitude: number;
        longitude: number;
        incidentType: Hotspot["type"];
        locationLabel: string;
        reportCount: number;
        latestReportAt: string;
        district?: string;
        severity?: string;
      }) => ({
        id: hotspot.id,
        lat: hotspot.latitude,
        lng: hotspot.longitude,
        type: hotspot.incidentType,
        severity: (hotspot.severity as any) ?? (hotspot.reportCount >= 5 ? "critical" : hotspot.reportCount >= 3 ? "high" : hotspot.reportCount >= 2 ? "medium" : "low"),
        count: hotspot.reportCount,
        location: hotspot.locationLabel,
        district: hotspot.district ?? deriveDistrict(hotspot.locationLabel),
        latestReportAt: hotspot.latestReportAt,
        source: "live" as const,
      })) as Hotspot[];

      setBaseHotspots(liveHotspots);
      setSelectedHotspot((current) => liveHotspots.find((item) => item.id === current?.id) ?? liveHotspots[0] ?? null);
      setIsLiveData(true);
      setLastUpdated(payload.polledAt ?? new Date().toISOString());
    } catch (e) {
      console.error(e);
      setBaseHotspots(sampleHotspots);
      setSelectedHotspot((current) => current ?? sampleHotspots[0] ?? null);
      setIsLiveData(false);
      setLastUpdated(new Date().toISOString());
    }
  }, []);

  useEffect(() => {
    void loadHotspots();
  }, [loadHotspots]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = window.setInterval(() => {
      void loadHotspots();
    }, 15000);

    return () => window.clearInterval(interval);
  }, [autoRefresh, loadHotspots]);

  const hotspots = useMemo(() => baseHotspots, [baseHotspots]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-[#ff003c]";
      case "high":
        return "text-orange-400";
      case "medium":
        return "text-yellow-400";
      case "low":
        return "text-[#00ff66]";
      default:
        return "text-gray-400";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "counterfeit":
        return <Shield className="w-4 h-4" />;
      case "phishing":
        return <Target className="w-4 h-4" />;
      case "digital-arrest":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  const visibleHotspots = typeFilter === "all" ? hotspots : hotspots.filter((hotspot) => hotspot.type === typeFilter);
  const timeline = useMemo(
    () =>
      [...visibleHotspots]
        .sort((a, b) => new Date(b.latestReportAt).getTime() - new Date(a.latestReportAt).getTime())
        .slice(0, 6),
    [visibleHotspots],
  );

  const districtSummary = useMemo(() => {
    const summary = new Map<string, { total: number; critical: number; districts: Set<string> }>();
    for (const hotspot of visibleHotspots) {
      const current = summary.get(hotspot.district) ?? { total: 0, critical: 0, districts: new Set<string>() };
      current.total += hotspot.count;
      if (hotspot.severity === "critical") {
        current.critical += 1;
      }
      current.districts.add(hotspot.district);
      summary.set(hotspot.district, current);
    }
    return [...summary.entries()]
      .map(([district, value]) => ({ district, total: value.total, critical: value.critical }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [visibleHotspots]);

  const patrolPriorities = useMemo(
    () =>
      [...visibleHotspots]
        .map((hotspot) => {
          const ageHours = Math.max(
            1,
            (Date.now() - new Date(hotspot.latestReportAt).getTime()) / (1000 * 60 * 60),
          );
          const score = Math.round(getSeverityWeight(hotspot.severity) + hotspot.count * 3 + Math.max(0, 20 - ageHours));
          return { hotspot, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 5),
    [visibleHotspots],
  );

  const selectedDeployment = selectedHotspot
    ? deploymentState[selectedHotspot.id] ?? getDefaultDeployment(selectedHotspot)
    : null;

  useEffect(() => {
    if (!visibleHotspots.length) {
      setSelectedHotspot(null);
      return;
    }
    if (!selectedHotspot || !visibleHotspots.some((hotspot) => hotspot.id === selectedHotspot.id)) {
      setSelectedHotspot(visibleHotspots[0]);
    }
  }, [selectedHotspot, visibleHotspots]);

  const updateDeployment = (delta: number) => {
    if (!selectedHotspot) return;
    setDeploymentState((current) => {
      const existing = current[selectedHotspot.id] ?? getDefaultDeployment(selectedHotspot);
      const nextUnits = Math.max(0, existing.units + delta);
      return {
        ...current,
        [selectedHotspot.id]: {
          units: nextUnits,
          status: nextUnits >= 4 ? "escalated" : nextUnits >= 2 ? "dispatching" : "monitoring",
        },
      };
    });
  };

  const handleShareIntel = async () => {
    const bulletin = [
      "RUBIX Inter-District Intelligence Bulletin",
      `Generated: ${new Date().toLocaleString()}`,
      `Range: ${timeRange.toUpperCase()}`,
      ...districtSummary.map((entry, index) => `${index + 1}. ${entry.district}: ${entry.total} linked reports, ${entry.critical} critical clusters`),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(bulletin);
      setShareStatus("District bulletin copied for secure channel sharing.");
    } catch {
      setShareStatus("Clipboard access failed. Copy the district bulletin manually from the timeline panel.");
    }
  };

  return (
    <div className="flex h-full w-full flex-col gap-6 md:flex-row">
      <div className="flex w-full flex-col gap-4 md:w-2/3">
        <div className="overflow-hidden rounded-xl border border-[#333333] bg-[#0a0a0a] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-mono text-xs uppercase tracking-widest text-gray-400">{isLiveData ? "Citizen incident signals" : "Sample incident layer"}</h3>
              <p className="mt-1 text-[11px] font-mono text-gray-500">{isLiveData ? "Aggregated, non-sensitive incident signals from connected reports." : "Connect Supabase or import a dataset to activate live reports."}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => setAutoRefresh((current) => !current)} className={`rounded-full border px-3 py-1 text-[11px] font-mono ${autoRefresh ? "border-[#00ff66]/40 text-[#00ff66]" : "border-[#333] text-gray-400"}`}>
                <Radio className="mr-1 inline h-3 w-3" /> {autoRefresh ? "LIVE POLLING" : "POLLING OFF"}
              </button>
              <button onClick={() => void loadHotspots()} className="rounded-full border border-[#333] px-3 py-1 text-[11px] font-mono text-gray-400 transition-colors hover:border-[#00f3ff]/60 hover:text-[#00f3ff]">
                <RefreshCcw className="mr-1 inline h-3 w-3" /> Refresh
              </button>
              <div className="rounded-full border border-[#333] px-3 py-1 text-[11px] font-mono text-gray-400">Privacy-aware map view</div>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-[#222] bg-black/40 p-3">
            <div className="rounded border border-[#00f3ff]/50 bg-[#00f3ff]/10 px-3 py-1.5 text-xs font-mono text-[#00f3ff]">
              ALL TIME
            </div>
            <button
              onClick={() => setShowHeatmap((current) => !current)}
              className={`rounded border px-3 py-1.5 text-xs font-mono transition-colors ${showHeatmap ? "border-[#ff7a00] bg-[#ff7a00]/15 text-[#ffb86b]" : "border-[#333] text-gray-400 hover:border-[#ff7a00]/50"}`}
            >
              <Radar className="mr-1 inline h-3 w-3" /> {showHeatmap ? "HEATMAP ON" : "HEATMAP OFF"}
            </button>
            {lastUpdated && <span className="ml-auto text-[11px] font-mono text-gray-500">Last updated {new Date(lastUpdated).toLocaleTimeString()}</span>}
          </div>

          <div className="h-110 w-full overflow-hidden rounded-lg border border-[#222]">
            <LiveMap hotspots={visibleHotspots} selectedHotspot={selectedHotspot} onSelect={setSelectedHotspot} showHeatmap={showHeatmap} />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#333333] bg-black/40 p-4">
          <div className="flex flex-wrap gap-2">
            {(["all", "digital-arrest", "phishing", "counterfeit"] as const).map((type) => (
              <button key={type} onClick={() => setTypeFilter(type)} className={`rounded border px-3 py-1.5 text-xs font-mono transition-colors ${typeFilter === type ? "border-[#00f3ff] bg-[#00f3ff]/20 text-[#00f3ff]" : "border-[#333] text-gray-400 hover:border-[#00f3ff]/50"}`}>
                {type === "all" ? "ALL" : type.replace("-", " ").toUpperCase()}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 text-xs font-mono text-gray-400">
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-[#ff003c]" />Critical</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-orange-400" />High</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-yellow-400" />Medium</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-[#00ff66]" />Low</span>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-[#333333] bg-black/40">
            <div className="flex items-center gap-2 border-b border-[#333333] bg-[#111111] p-4">
              <Route className="h-5 w-5 text-[#00f3ff]" />
              <h3 className="font-mono text-sm uppercase tracking-widest text-gray-300">Patrol Prioritisation</h3>
            </div>
            <div className="space-y-3 p-4">
              {patrolPriorities.map(({ hotspot, score }, index) => (
                <button
                  key={hotspot.id}
                  onClick={() => setSelectedHotspot(hotspot)}
                  className="flex w-full items-start justify-between rounded-lg border border-[#222] bg-black/50 p-3 text-left transition-colors hover:border-[#00f3ff]/40"
                >
                  <div>
                    <p className="font-mono text-xs text-gray-500">Priority #{index + 1}</p>
                    <p className="font-mono text-sm font-bold text-white">{hotspot.location}</p>
                    <p className="mt-1 text-xs text-gray-400">{hotspot.count} reports · {hotspot.type.replace("-", " ")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-xs text-gray-500">Patrol score</p>
                    <p className={`font-mono text-lg font-bold ${getSeverityColor(hotspot.severity)}`}>{score}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#333333] bg-black/40">
            <div className="flex items-center gap-2 border-b border-[#333333] bg-[#111111] p-4">
              <Clock3 className="h-5 w-5 text-[#00f3ff]" />
              <h3 className="font-mono text-sm uppercase tracking-widest text-gray-300">Hotspot Timeline</h3>
            </div>
            <div className="space-y-3 p-4">
              {timeline.map((hotspot) => (
                <button
                  key={hotspot.id}
                  onClick={() => setSelectedHotspot(hotspot)}
                  className="flex w-full items-start gap-3 rounded-lg border border-[#222] bg-black/50 p-3 text-left transition-colors hover:border-[#00f3ff]/40"
                >
                  <span className={`mt-1 inline-flex h-2.5 w-2.5 rounded-full ${hotspot.severity === "critical" ? "bg-[#ff003c]" : hotspot.severity === "high" ? "bg-orange-400" : hotspot.severity === "medium" ? "bg-yellow-400" : "bg-[#00ff66]"}`} />
                  <div>
                    <p className="font-mono text-sm font-bold text-white">{hotspot.location}</p>
                    <p className="mt-1 text-xs text-gray-400">{new Date(hotspot.latestReportAt).toLocaleString()} · {hotspot.source.toUpperCase()}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col gap-4 md:w-1/3">
        <div className="flex grow flex-col overflow-hidden rounded-xl border border-[#333333] bg-black/40">
          <div className="flex items-center gap-2 border-b border-[#333333] bg-[#111111] p-4">
            <MapPin className="h-5 w-5 text-gray-400" />
            <h3 className="font-mono text-sm uppercase tracking-widest text-gray-300">Hotspot Details</h3>
          </div>

          <div className="flex flex-col gap-4 p-4">
            {selectedHotspot ? (
              <>
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(selectedHotspot.type)}
                    <div>
                      <h4 className="font-mono font-bold text-white">{selectedHotspot.location}</h4>
                      <p className="text-xs font-mono text-gray-400">{selectedHotspot.type} · {selectedHotspot.district}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs font-mono text-gray-500">Count</p>
                      <p className="text-xl font-bold font-mono text-white">{selectedHotspot.count}</p>
                    </div>
                    <div>
                      <p className="text-xs font-mono text-gray-500">Severity</p>
                      <p className={`font-bold font-mono ${getSeverityColor(selectedHotspot.severity)}`}>{selectedHotspot.severity}</p>
                    </div>
                  </div>
                </motion.div>

                <div className="rounded-lg border border-[#333333] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h5 className="font-mono text-xs uppercase tracking-widest text-gray-400">Resource Deployment</h5>
                    <span className={`font-mono text-xs uppercase ${selectedDeployment?.status === "escalated" ? "text-[#ff003c]" : selectedDeployment?.status === "dispatching" ? "text-yellow-400" : "text-[#00ff66]"}`}>{selectedDeployment?.status}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-mono text-gray-500">Assigned units</p>
                      <p className="font-mono text-2xl font-bold text-white">{selectedDeployment?.units ?? 0}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => updateDeployment(-1)} className="rounded border border-[#333] px-3 py-1.5 font-mono text-sm text-gray-300 hover:border-[#00f3ff]/50">-1</button>
                      <button onClick={() => updateDeployment(1)} className="rounded border border-[#00f3ff]/50 bg-[#00f3ff]/10 px-3 py-1.5 font-mono text-sm text-[#00f3ff] hover:bg-[#00f3ff]/20">+1 unit</button>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-[#333333] p-4">
                  <h5 className="mb-2 font-mono text-xs uppercase tracking-widest text-gray-400">Recommendations</h5>
                  <ul className="space-y-2 text-xs text-gray-300">
                    {selectedHotspot.severity === "critical" ? (
                      <>
                        <li className="flex items-start gap-2"><Zap className="mt-0.5 h-3 w-3 text-[#ff003c]" /><span>Prioritise trained reviewer follow-up.</span></li>
                        <li className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-3 w-3 text-[#ff003c]" /><span>Publish a local awareness alert after verification.</span></li>
                        <li className="flex items-start gap-2"><Route className="mt-0.5 h-3 w-3 text-[#ff003c]" /><span>Push this cluster to the top of the patrol route planner.</span></li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-start gap-2"><Users className="mt-0.5 h-3 w-3 text-[#00ff66]" /><span>Monitor the area closely.</span></li>
                        <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-3 w-3 text-[#00ff66]" /><span>Add the area to the review queue.</span></li>
                      </>
                    )}
                  </ul>
                </div>
              </>
            ) : (
              <div className="flex h-32 flex-col items-center justify-center text-gray-400">
                <MapPin className="mb-3 h-12 w-12 opacity-30" />
                <p className="text-xs font-mono">Select a hotspot on the map</p>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#333333] bg-black/40">
          <div className="flex items-center gap-2 border-b border-[#333333] bg-[#111111] p-4">
            <Activity className="h-5 w-5 text-gray-400" />
            <h3 className="font-mono text-sm uppercase tracking-widest text-gray-300">Statistics</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 p-4">
            <div className="rounded-lg border border-[#333333] bg-black/70 p-3">
              <p className="text-xs font-mono text-gray-500">Total hotspots</p>
              <p className="text-lg font-bold font-mono text-white">{hotspots.length}</p>
            </div>
            <div className="rounded-lg border border-[#333333] bg-black/70 p-3">
              <p className="text-xs font-mono text-gray-500">Critical</p>
              <p className="text-lg font-bold font-mono text-[#ff003c]">{hotspots.filter((h) => h.severity === "critical").length}</p>
            </div>
            <div className="rounded-lg border border-[#333333] bg-black/70 p-3">
              <p className="text-xs font-mono text-gray-500">Districts</p>
              <p className="text-lg font-bold font-mono text-white">{new Set(hotspots.map((hotspot) => hotspot.district)).size}</p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#333333] bg-black/40">
          <div className="flex items-center gap-2 border-b border-[#333333] bg-[#111111] p-4">
            <Building2 className="h-5 w-5 text-gray-400" />
            <h3 className="font-mono text-sm uppercase tracking-widest text-gray-300">Inter-District Sharing</h3>
          </div>
          <div className="space-y-4 p-4">
            <p className="text-xs text-gray-400">Near real-time district bulletin built from the latest hotspot stream. Use this to brief adjacent jurisdictions and task cross-district patrols.</p>
            <div className="space-y-2">
              {districtSummary.map((entry) => (
                <div key={entry.district} className="flex items-center justify-between rounded-lg border border-[#222] bg-black/60 p-3">
                  <div>
                    <p className="font-mono text-sm font-bold text-white">{entry.district}</p>
                    <p className="text-xs text-gray-400">{entry.total} linked reports · {entry.critical} critical clusters</p>
                  </div>
                  <Send className="h-4 w-4 text-[#00f3ff]" />
                </div>
              ))}
            </div>
            <button onClick={handleShareIntel} className="w-full rounded-lg border border-[#00f3ff]/50 bg-[#00f3ff]/10 px-4 py-3 font-mono text-sm font-bold text-[#00f3ff] transition-colors hover:bg-[#00f3ff]/20">
              <Copy className="mr-2 inline h-4 w-4" /> COPY DISTRICT BULLETIN
            </button>
            {shareStatus && <p className="text-xs text-gray-400">{shareStatus}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
