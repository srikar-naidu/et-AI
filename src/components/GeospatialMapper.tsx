"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, AlertTriangle, MapPin, Shield, Target, Users, Zap } from "lucide-react";
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
  },
  {
    id: "sample-2",
    lat: 19.076,
    lng: 72.8777,
    type: "phishing",
    severity: "high",
    count: 18,
    location: "Bandra, Mumbai",
  },
  {
    id: "sample-3",
    lat: 12.9716,
    lng: 77.5946,
    type: "counterfeit",
    severity: "medium",
    count: 12,
    location: "MG Road, Bengaluru",
  },
  {
    id: "sample-4",
    lat: 22.5726,
    lng: 88.3639,
    type: "digital-arrest",
    severity: "critical",
    count: 31,
    location: "Park Street, Kolkata",
  },
  {
    id: "sample-5",
    lat: 13.0827,
    lng: 80.2707,
    type: "phishing",
    severity: "low",
    count: 8,
    location: "T Nagar, Chennai",
  },
];

export default function GeospatialMapper() {
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>(sampleHotspots);
  const [isLiveData, setIsLiveData] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"all" | Hotspot["type"]>("all");

  useEffect(() => {
    async function loadHotspots() {
      try {
        const response = await fetch("/api/hotspots", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok || !payload.configured || !Array.isArray(payload.hotspots) || payload.hotspots.length === 0) {
          return;
        }

        const liveHotspots = payload.hotspots.map((hotspot: {
          id: string;
          latitude: number;
          longitude: number;
          incidentType: Hotspot["type"];
          locationLabel: string;
          reportCount: number;
        }) => ({
          id: hotspot.id,
          lat: hotspot.latitude,
          lng: hotspot.longitude,
          type: hotspot.incidentType,
          severity: hotspot.reportCount >= 5 ? "critical" : hotspot.reportCount >= 3 ? "high" : hotspot.reportCount >= 2 ? "medium" : "low",
          count: hotspot.reportCount,
          location: hotspot.locationLabel,
        })) as Hotspot[];

        setHotspots(liveHotspots);
        setSelectedHotspot(liveHotspots[0] ?? null);
        setIsLiveData(true);
      } catch {
        setSelectedHotspot(sampleHotspots[0] ?? null);
      }
    }

    void loadHotspots();
  }, []);

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

  return (
    <div className="flex h-full w-full flex-col gap-6 md:flex-row">
      <div className="flex w-full flex-col gap-4 md:w-2/3">
        <div className="overflow-hidden rounded-xl border border-[#333333] bg-[#0a0a0a] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-mono text-xs uppercase tracking-widest text-gray-400">{isLiveData ? "Citizen incident signals" : "Sample incident layer"}</h3>
              <p className="mt-1 text-[11px] font-mono text-gray-500">{isLiveData ? "Aggregated, non-sensitive incident signals from connected reports." : "Connect Supabase to activate live reports."}</p>
            </div>
            <div className="rounded-full border border-[#333] px-3 py-1 text-[11px] font-mono text-gray-400">Privacy-aware map view</div>
          </div>
          <div className="h-110 w-full overflow-hidden rounded-lg border border-[#222]">
            <LiveMap hotspots={visibleHotspots} selectedHotspot={selectedHotspot} onSelect={setSelectedHotspot} />
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
                      <p className="text-xs font-mono text-gray-400">{selectedHotspot.type}</p>
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
                  <h5 className="mb-2 font-mono text-xs uppercase tracking-widest text-gray-400">Recommendations</h5>
                  <ul className="space-y-2 text-xs text-gray-300">
                    {selectedHotspot.severity === "critical" ? (
                      <>
                        <li className="flex items-start gap-2"><Zap className="mt-0.5 h-3 w-3 text-[#ff003c]" /><span>Prioritise trained reviewer follow-up.</span></li>
                        <li className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-3 w-3 text-[#ff003c]" /><span>Publish a local awareness alert after verification.</span></li>
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
          <div className="grid grid-cols-2 gap-4 p-4">
            <div className="rounded-lg border border-[#333333] bg-black/70 p-3">
              <p className="text-xs font-mono text-gray-500">Total hotpots</p>
              <p className="text-lg font-bold font-mono text-white">{hotspots.length}</p>
            </div>
            <div className="rounded-lg border border-[#333333] bg-black/70 p-3">
              <p className="text-xs font-mono text-gray-500">Critical</p>
              <p className="text-lg font-bold font-mono text-[#ff003c]">{hotspots.filter((h) => h.severity === "critical").length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
