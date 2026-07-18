"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ShieldAlert, ScanLine, Link as LinkIcon, Activity, MapPin, FileWarning, Network, FolderSearch, Siren } from "lucide-react";
import VoiceShield from "@/components/VoiceShield";
import CounterfeitScanner from "@/components/CounterfeitScanner";
import PhishingDisassembler from "@/components/PhishingDisassembler";
import DeepfakeAnalyzer from "@/components/DeepfakeAnalyzer";
import ChatbotWidget from "@/components/ChatbotWidget";

const GeospatialMapper = dynamic(() => import("@/components/GeospatialMapper"), { ssr: false });
import CitizenReport from "@/components/CitizenReport";
import FraudNetwork from "@/components/FraudNetwork";
import CaseConsole from "@/components/CaseConsole";
import ReportingGuide from "@/components/ReportingGuide";
import ServiceReadinessPanel from "@/components/ServiceReadinessPanel";
import OperatorAuthPanel from "@/components/OperatorAuthPanel";

function Home() {
  const [activeModule, setActiveModule] = useState<string | null>(null);

  const modules = [
    {
      id: "voice-shield",
      title: "Live Call Shield",
      description: "Real-time audio interception & AI analysis for Digital Arrest scams.",
      icon: <Activity className="w-8 h-8 text-[#00f3ff]" />,
      color: "border-[#00f3ff]",
    },
    {
      id: "counterfeit-scanner",
      title: "Counterfeit Scanner",
      description: "Computer vision webcam feed to detect fake currency & IDs.",
      icon: <ScanLine className="w-8 h-8 text-[#00ff66]" />,
      color: "border-[#00ff66]",
    },
    {
      id: "phishing-disassembler",
      title: "Phishing Disassembler",
      description: "Deep AI & network analysis of malicious URLs and SMS texts.",
      icon: <LinkIcon className="w-8 h-8 text-[#ff003c]" />,
      color: "border-[#ff003c]",
    },
    {
      id: "deepfake-analyzer",
      title: "Deepfake Analyzer",
      description: "Deepfake audio detection & transcription analysis for voice scams.",
      icon: <ShieldAlert className="w-8 h-8 text-purple-400" />,
      color: "border-purple-400",
    },
    {
      id: "geospatial-mapper",
      title: "Geospatial Mapper",
      description: "Geospatial AI layer for law enforcement that maps fraud complaint locations, counterfeit currency seizure points, and cybercrime hotspots — enabling patrol prioritisation, resource deployment, and inter-district intelligence sharing in near real time through a command centre interface.",
      icon: <MapPin className="w-8 h-8 text-amber-400" />,
      color: "border-amber-400",
    },
    {
      id: "citizen-report",
      title: "Citizen Incident Report",
      description: "Create a secure case record and add anonymised incident signals to the map.",
      icon: <FileWarning className="w-8 h-8 text-[#00f3ff]" />,
      color: "border-[#00f3ff]",
    },
    {
      id: "fraud-network",
      title: "Fraud Network Intelligence",
      description: "Explore linked accounts, transfers, and flagged AML patterns with explainable risk signals.",
      icon: <Network className="w-8 h-8 text-[#ff003c]" />,
      color: "border-[#ff003c]",
    },
    { id: "case-console", title: "Case & Evidence Console", description: "Review case timelines, preserve evidence hashes, and export investigation bundles.", icon: <FolderSearch className="w-8 h-8 text-[#00ff66]" />, color: "border-[#00ff66]" },
    { id: "reporting-guide", title: "Official Reporting Guide", description: "Prepare evidence, call the right helpline, and continue to official cybercrime reporting.", icon: <Siren className="w-8 h-8 text-[#ff003c]" />, color: "border-[#ff003c]" },
  ];

  return (
    <main className="min-h-screen p-8 flex flex-col items-center">
      {/* Header */}
      <header className="w-full max-w-6xl mb-12 flex justify-between items-center border-b border-[#333333] pb-4">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-10 h-10 text-[#00f3ff]" />
          <div>
            <h1 className="text-3xl font-mono font-bold tracking-wider text-white uppercase">
              Digital Safety <span className="text-[#00f3ff]">Command Center</span>
            </h1>
            <p className="text-sm font-mono text-gray-400">
              SYS.STATUS: <span className="text-[#00ff66]">ONLINE & MONITORING</span>
            </p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="w-full max-w-6xl grow flex flex-col items-center justify-center">
        <div className="mb-8 w-full space-y-4">
          <ServiceReadinessPanel />
          <OperatorAuthPanel />
        </div>
        {!activeModule ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
            {modules.map((mod, i) => (
              <motion.button
                key={mod.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setActiveModule(mod.id)}
                className={`bg-[#111111] border ${mod.color} p-6 rounded-lg cursor-pointer hover:bg-[#1a1a1a] transition-all relative overflow-hidden group text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00f3ff]`}
              >
                {/* Neon Glow Effect on Hover */}
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                
                <div className="mb-4 bg-black/50 w-16 h-16 rounded-full flex items-center justify-center border border-[#333333]">
                  {mod.icon}
                </div>
                <h2 className="text-xl font-bold font-mono text-white mb-2">{mod.title}</h2>
                <p className="text-sm text-gray-400">{mod.description}</p>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="w-full flex flex-col h-full">
            <div className="mb-4">
              <button
                onClick={() => setActiveModule(null)}
                className="text-[#00f3ff] hover:text-white font-mono text-sm border border-[#00f3ff] px-4 py-2 rounded transition-colors"
              >
                &larr; BACK TO TERMINAL
              </button>
            </div>
            
            {/* Module Rendering Space */}
            <div className="grow bg-[#111111] border border-[#333333] rounded-xl p-6">
              {activeModule === "voice-shield" && <VoiceShield />}
              {activeModule === "counterfeit-scanner" && <CounterfeitScanner />}
              {activeModule === "phishing-disassembler" && <PhishingDisassembler />}
              {activeModule === "deepfake-analyzer" && <DeepfakeAnalyzer />}
              {activeModule === "geospatial-mapper" && <GeospatialMapper />}
              {activeModule === "citizen-report" && <CitizenReport />}
              {activeModule === "fraud-network" && <FraudNetwork />}
              {activeModule === "case-console" && <CaseConsole />}
              {activeModule === "reporting-guide" && <ReportingGuide />}
            </div>
          </div>
        )}
      </div>

      {/* Global Expansion Widgets */}
      <ChatbotWidget />
    </main>
  );
}

export default Home;
