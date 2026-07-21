"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  ScanLine,
  Link as LinkIcon,
  Activity,
  MapPin,
  Network,
  Siren,
  ArrowLeft,
  ChevronRight,
  BarChart3,
  Fingerprint,
} from "lucide-react";
import VoiceShield from "@/components/VoiceShield";
import CounterfeitScanner from "@/components/CounterfeitScanner";
import PhishingDisassembler from "@/components/PhishingDisassembler";
import DeepfakeAnalyzer from "@/components/DeepfakeAnalyzer";
import ChatbotWidget from "@/components/ChatbotWidget";
import DigitalArrestPatterns from "@/components/DigitalArrestPatterns";
import IncidentDataVisualization from "@/components/IncidentDataVisualization";
import FraudNetwork from "@/components/FraudNetwork";
import ReportingGuide from "@/components/ReportingGuide";

const GeospatialMapper = dynamic(() => import("@/components/GeospatialMapper"), {
  ssr: false,
});

function Home() {
  const [activeModule, setActiveModule] = useState<string | null>(null);

  const modules = [
    {
      id: "voice-shield",
      title: "Live Call Shield",
      description: "Real-time audio interception & AI analysis for Digital Arrest scams.",
      icon: <Activity className="w-8 h-8 text-[#00f3ff]" />,
      color: "border-[#00f3ff]/30 hover:border-[#00f3ff]",
      bgColor: "bg-[#00f3ff]/10",
      glowColor: "shadow-[0_0_50px_rgba(0,243,255,0.4)]",
    },
    {
      id: "counterfeit-scanner",
      title: "Counterfeit Scanner",
      description: "Computer vision webcam feed to detect fake currency & IDs.",
      icon: <ScanLine className="w-8 h-8 text-[#00ff66]" />,
      color: "border-[#00ff66]/30 hover:border-[#00ff66]",
      bgColor: "bg-[#00ff66]/10",
      glowColor: "shadow-[0_0_50px_rgba(0,255,102,0.4)]",
    },
    {
      id: "phishing-disassembler",
      title: "Phishing Disassembler",
      description: "Deep AI & network analysis of malicious URLs and SMS texts.",
      icon: <LinkIcon className="w-8 h-8 text-[#ff003c]" />,
      color: "border-[#ff003c]/30 hover:border-[#ff003c]",
      bgColor: "bg-[#ff003c]/10",
      glowColor: "shadow-[0_0_50px_rgba(255,0,60,0.4)]",
    },
    {
      id: "deepfake-analyzer",
      title: "Deepfake Analyzer",
      description: "Deepfake audio detection & transcription analysis for voice scams.",
      icon: <ShieldAlert className="w-8 h-8 text-purple-400" />,
      color: "border-purple-400/30 hover:border-purple-400",
      bgColor: "bg-purple-400/10",
      glowColor: "shadow-[0_0_50px_rgba(168,85,247,0.4)]",
    },
    {
      id: "geospatial-mapper",
      title: "Geospatial Mapper",
      description:
        "Geospatial AI layer for law enforcement that maps fraud complaint locations and cybercrime hotspots.",
      icon: <MapPin className="w-8 h-8 text-amber-400" />,
      color: "border-amber-400/30 hover:border-amber-400",
      bgColor: "bg-amber-400/10",
      glowColor: "shadow-[0_0_50px_rgba(251,191,36,0.4)]",
    },
    {
      id: "digital-arrest-patterns",
      title: "Digital Arrest Pattern Lab",
      description: "Scam patterns, call-flow sequences, number-spoofing signatures, and script templates for digital-arrest detection.",
      icon: <Fingerprint className="w-8 h-8 text-[#00f3ff]" />,
      color: "border-[#00f3ff]/30 hover:border-[#00f3ff]",
      bgColor: "bg-[#00f3ff]/10",
      glowColor: "shadow-[0_0_50px_rgba(0,243,255,0.4)]",
    },
    {
      id: "fraud-network",
      title: "Fraud Network Intelligence",
      description: "Graph AI agent analyzing linked accounts, coordinated scams, and money mule networks with court-admissible intelligence packages.",
      icon: <Network className="w-8 h-8 text-[#ff003c]" />,
      color: "border-[#ff003c]/30 hover:border-[#ff003c]",
      bgColor: "bg-[#ff003c]/10",
      glowColor: "shadow-[0_0_50px_rgba(255,0,60,0.4)]",
    },
    {
      id: "incident-data-visualization",
      title: "Incident Data Visualization",
      description: "Explore cyber incident data with interactive charts and filters.",
      icon: <BarChart3 className="w-8 h-8 text-[#00ff66]" />,
      color: "border-[#00ff66]/30 hover:border-[#00ff66]",
      bgColor: "bg-[#00ff66]/10",
      glowColor: "shadow-[0_0_50px_rgba(0,255,102,0.4)]",
    },
    {
      id: "reporting-guide",
      title: "Official Reporting Guide",
      description: "Prepare evidence, call the right helpline, and continue to official cybercrime reporting.",
      icon: <Siren className="w-8 h-8 text-[#ff003c]" />,
      color: "border-[#ff003c]/30 hover:border-[#ff003c]",
      bgColor: "bg-[#ff003c]/10",
      glowColor: "shadow-[0_0_50px_rgba(255,0,60,0.4)]",
    },
  ];

  return (
      <main className="min-h-screen flex flex-col items-center relative overflow-hidden">
      {/* Animated Background Gradient Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#00f3ff]/20 blur-[100px]"
          animate={{
            x: [0, 40, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-[#ff003c]/20 blur-[100px]"
          animate={{
            x: [0, -40, 0],
            y: [0, -30, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#00ff66]/10 blur-[120px]"
          animate={{
            x: ["-50%", "-45%", "-50%"],
            y: ["-50%", "-55%", "-50%"],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full flex flex-col items-center px-4 py-12">
        {/* Header */}
        <header className="w-full max-w-7xl mb-16 flex flex-col md:flex-row justify-between items-center gap-8">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex items-center gap-4"
          >
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#00f3ff] via-[#00ff66] to-[#ff003c] flex items-center justify-center shadow-[0_0_40px_rgba(0,243,255,0.4)]">
                <ShieldAlert className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-white">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00f3ff] via-[#00ff66] to-[#ff003c]">
                  RUBIX
                </span>
              </h1>
              <p className="text-sm md:text-base font-mono text-gray-400 mt-1">
                Digital Safety Command Center
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="flex items-center gap-3 px-5 py-2.5 rounded-full border border-[#333] bg-[#0d0d0d]/80 backdrop-blur-md"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff66] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00ff66]"></span>
            </span>
            <span className="text-sm font-mono text-[#00ff66]">ONLINE & MONITORING</span>
          </motion.div>
        </header>

        {/* Main Content Area */}
        <div className="w-full max-w-7xl grow flex flex-col items-center justify-center">
          {!activeModule ? (
            <div className="w-full">
              {/* Hero Intro */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: "easeOut", delay: 0.3 }}
                className="mb-12 text-center max-w-3xl mx-auto"
              >
                <h2 className="text-3xl md:text-6xl font-bold text-white mb-6 leading-tight">
                  Protect What Matters.
                  <br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00f3ff] to-[#00ff66]">
                    Analyze. Respond. Secure.
                  </span>
                </h2>
                <p className="text-lg md:text-xl text-gray-400 leading-relaxed">
                  AI-powered threat detection and public safety suite for modern digital challenges.
                </p>
              </motion.div>

              {/* Modules Grid */}
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full"
              >
                {modules.map((mod, i) => (
                  <motion.button
                    key={mod.id}
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      delay: i * 0.08,
                      duration: 0.6,
                      ease: "easeOut",
                    }}
                    whileHover={{ scale: 1.05, y: -8, rotate: 0.5 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setActiveModule(mod.id)}
                    className={`group relative bg-[#0d0d0d]/95 backdrop-blur-xl border-2 ${mod.color} p-7 rounded-2xl cursor-pointer transition-all duration-300 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505] focus-visible:ring-[#00f3ff]`}
                  >
                    {/* Background Glow on Hover */}
                    <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${mod.glowColor}`} />

                    <div className="relative z-10">
                      <div
                        className={`mb-5 w-16 h-16 rounded-xl ${mod.bgColor} flex items-center justify-center border border-white/5 group-hover:scale-125 transition-all duration-300 group-hover:rotate-5`}
                      >
                        {mod.icon}
                      </div>
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="text-xl font-bold text-white group-hover:text-white/90 transition-colors">{mod.title}</h3>
                        <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white group-hover:translate-x-3 transition-all duration-300" />
                      </div>
                      <p className="text-sm text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                        {mod.description}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full flex flex-col"
            >
              <div className="mb-6">
                <motion.button
                  whileHover={{ x: -4 }}
                  onClick={() => setActiveModule(null)}
                  className="flex items-center gap-2 text-white/80 hover:text-white font-medium text-sm px-4 py-2.5 rounded-xl border border-[#333] hover:border-[#00f3ff] bg-[#0d0d0d]/80 backdrop-blur-md transition-all duration-300"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Modules
                </motion.button>
              </div>

              {/* Module Rendering Space */}
              <div className="bg-[#0d0d0d]/90 backdrop-blur-xl border border-[#333] rounded-2xl p-6 md:p-8 shadow-[0_0_60px_rgba(0,0,0,0.5)]">
                {activeModule === "voice-shield" && <VoiceShield />}
                {activeModule === "counterfeit-scanner" && <CounterfeitScanner />}
                {activeModule === "phishing-disassembler" && <PhishingDisassembler />}
                {activeModule === "deepfake-analyzer" && <DeepfakeAnalyzer />}
                {activeModule === "geospatial-mapper" && <GeospatialMapper />}
                {activeModule === "digital-arrest-patterns" && <DigitalArrestPatterns />}
                {activeModule === "incident-data-visualization" && <IncidentDataVisualization />}
                {activeModule === "fraud-network" && <FraudNetwork />}
                {activeModule === "reporting-guide" && <ReportingGuide />}
              </div>
            </motion.div>
          )}
        </div>
      </div>

        {/* Global Expansion Widgets */}
        <ChatbotWidget />
      </main>
  );
}

export default Home;
