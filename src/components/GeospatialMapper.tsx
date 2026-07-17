"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Target,
  Truck,
  Zap,
  Shield,
  Users,
  AlertTriangle,
  Activity,
} from "lucide-react";

interface Hotspot {
  id: string;
  lat: number;
  lng: number;
  type: "counterfeit" | "phishing" | "digital-arrest";
  severity: "low" | "medium" | "high" | "critical";
  count: number;
  location: string;
}

const mockHotspots: Hotspot[] = [
  {
    id: "1",
    lat: 28.6139,
    lng: 77.209,
    type: "digital-arrest",
    severity: "critical",
    count: 24,
    location: "Connaught Place, Delhi",
  },
  {
    id: "2",
    lat: 19.076,
    lng: 72.8777,
    type: "phishing",
    severity: "high",
    count: 18,
    location: "Bandra, Mumbai",
  },
  {
    id: "3",
    lat: 12.9716,
    lng: 77.5946,
    type: "counterfeit",
    severity: "medium",
    count: 12,
    location: "MG Road, Bengaluru",
  },
  {
    id: "4",
    lat: 22.5726,
    lng: 88.3639,
    type: "digital-arrest",
    severity: "critical",
    count: 31,
    location: "Park Street, Kolkata",
  },
  {
    id: "5",
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
  const [hotspots, setHotspots] = useState<Hotspot[]>(mockHotspots);
  const [isLiveData, setIsLiveData] = useState(false);

  useEffect(() => {
    async function loadHotspots() {
      try {
        const response = await fetch("/api/hotspots", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok || !payload.configured || payload.hotspots.length === 0) return;

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
        setIsLiveData(true);
      } catch {
        // The clearly labelled sample layer remains available when the database is offline.
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

  return (
    <div className="w-full h-full flex flex-col md:flex-row gap-6">
      {/* Left Panel: Map View */}
      <div className="w-full md:w-2/3 flex flex-col gap-4">
        <div className="relative w-full flex-grow bg-[#0a0a0a] border border-[#333333] rounded-xl overflow-hidden flex items-center justify-center">
          {/* Simulated India Map Background */}
          <div className="absolute inset-0 opacity-20">
            <svg viewBox="0 0 400 400" className="w-full h-full">
              <path
                d="M100,50 L150,80 L140,120 L160,150 L120,180 L100,220 L150,240 L170,280 L200,300 L220,280 L240,240 L220,200 L250,180 L280,150 L300,120 L280,80 L250,50 Z"
                fill="#00f3ff"
                stroke="#00f3ff"
                strokeWidth="2"
              />
            </svg>
          </div>

          {/* Hotspots */}
          {hotspots.map((hotspot) => (
            <motion.div
              key={hotspot.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.2 }}
              onClick={() => setSelectedHotspot(hotspot)}
              className={`absolute cursor-pointer ${
                hotspot.severity === "critical"
                  ? "text-[#ff003c]"
                  : hotspot.severity === "high"
                  ? "text-orange-400"
                  : hotspot.severity === "medium"
                  ? "text-yellow-400"
                  : "text-[#00ff66]"
              }`}
              style={{
                left: `${50 + (hotspot.lng - 77.5) * 4}%`,
                top: `${50 + (23 - hotspot.lat) * 6}%`,
              }}
            >
              <MapPin className="w-6 h-6 animate-pulse" />
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#ff003c] text-white text-xs px-1 rounded whitespace-nowrap">
                {hotspot.count}
              </span>
            </motion.div>
          ))}

          {/* Map Overlay Grid */}
          <div className="absolute inset-0 pointer-events-none opacity-30 bg-[linear-gradient(rgba(0,243,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />

          {/* Map Title */}
          <div className="absolute top-4 left-4 bg-black/70 p-3 rounded-lg border border-[#333333]">
            <h3 className="font-mono text-xs text-gray-400 uppercase tracking-widest">
              {isLiveData ? "Citizen incident signals" : "Sample incident layer"}
            </h3>
            <p className="mt-1 text-[10px] font-mono text-gray-500">{isLiveData ? "Reports with shared location" : "Connect Supabase to activate live reports"}</p>
          </div>
        </div>

        {/* Map Controls */}
        <div className="bg-black/40 border border-[#333333] rounded-xl p-4 flex justify-between items-center">
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-[#00f3ff]/20 border border-[#00f3ff] text-[#00f3ff] text-xs font-mono rounded hover:bg-[#00f3ff]/30">
              +
            </button>
            <button className="px-3 py-1 bg-[#00f3ff]/20 border border-[#00f3ff] text-[#00f3ff] text-xs font-mono rounded hover:bg-[#00f3ff]/30">
              -
            </button>
          </div>
          <div className="flex gap-3 text-xs font-mono text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-[#ff003c] rounded-full" />
              Critical
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-orange-400 rounded-full" />
              High
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-yellow-400 rounded-full" />
              Medium
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-[#00ff66] rounded-full" />
              Low
            </span>
          </div>
        </div>
      </div>

      {/* Right Panel: Hotspot Details & Controls */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        {/* Selected Hotspot Details */}
        <div className="bg-black/40 border border-[#333333] rounded-xl overflow-hidden flex flex-col flex-grow">
          <div className="p-4 border-b border-[#333333] bg-[#111111] flex items-center gap-2">
            <MapPin className="w-5 h-5 text-gray-400" />
            <h3 className="font-mono text-sm text-gray-300 uppercase tracking-widest">
              Hotspot Details
            </h3>
          </div>

          <div className="p-4 flex flex-col gap-4">
            {selectedHotspot ? (
              <>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex flex-col gap-4"
                >
                  <div className="flex items-center gap-3">
                    {getTypeIcon(selectedHotspot.type)}
                    <div>
                      <h4 className="text-white font-bold font-mono">
                        {selectedHotspot.location}
                      </h4>
                      <p className="text-gray-400 text-xs font-mono">
                        {selectedHotspot.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-gray-500 text-xs font-mono">Count</p>
                      <p className="text-white font-bold font-mono text-xl">
                        {selectedHotspot.count}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs font-mono">Severity</p>
                      <p className={`font-bold font-mono ${getSeverityColor(selectedHotspot.severity)}`}>
                        {selectedHotspot.severity}
                      </p>
                    </div>
                  </div>
                </motion.div>

                <div className="border border-[#333333] rounded-lg p-4">
                  <h5 className="font-mono text-xs text-gray-400 uppercase tracking-widest mb-2">
                    Recommendations
                  </h5>
                  <ul className="text-xs text-gray-300 space-y-2">
                    {selectedHotspot.severity === "critical" ? (
                      <>
                        <li className="flex items-start gap-2">
                          <Zap className="w-3 h-3 text-[#ff003c] mt-0.5" />
                          <span>Deploy rapid response team</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Truck className="w-3 h-3 text-[#ff003c] mt-0.5" />
                          <span>Alert nearby patrol units</span>
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-start gap-2">
                          <Users className="w-3 h-3 text-[#00ff66] mt-0.5" />
                          <span>Monitor situation closely</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <MapPin className="w-3 h-3 text-[#00ff66] mt-0.5" />
                          <span>
                            Place patrols to area</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                <MapPin className="w-12 h-12 opacity-30 mb-3" />
                <p className="text-xs font-mono">
                  Select a hotspot on the map
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Statistics Overview */}
        <div className="bg-black/40 border border-[#333333] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#333333] bg-[#111111] flex items-center gap-2">
          <Activity className="w-5 h-5 text-gray-400" />
            <h3 className="font-mono text-sm text-gray-300 uppercase tracking-widest">
              Statistics
            </h3>
          </div>
          <div className="p-4 grid grid-cols-2 gap-4">
            <div className="bg-black/70 border border-[#333333] rounded-lg p-3">
              <p className="text-gray-500 text-xs font-mono">Total Hotspots</p>
              <p className="text-white font-bold font-mono text-lg">
                {hotspots.length}
              </p>
            </div>
            <div className="bg-black/70 border border-[#333333] rounded-lg p-3">
              <p className="text-gray-500 text-xs font-mono">Critical</p>
              <p className="text-[#ff003c] font-bold font-mono text-lg">
                {hotspots.filter((h) => h.severity === "critical").length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
