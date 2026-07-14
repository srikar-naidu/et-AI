"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, ScanLine, Link as LinkIcon, Activity } from "lucide-react";

export default function Home() {
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
      <div className="w-full max-w-6xl flex-grow flex flex-col items-center justify-center">
        {!activeModule ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            {modules.map((mod, i) => (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setActiveModule(mod.id)}
                className={`bg-[#111111] border ${mod.color} p-6 rounded-lg cursor-pointer hover:bg-[#1a1a1a] transition-all relative overflow-hidden group`}
              >
                {/* Neon Glow Effect on Hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                
                <div className="mb-4 bg-black/50 w-16 h-16 rounded-full flex items-center justify-center border border-[#333333]">
                  {mod.icon}
                </div>
                <h2 className="text-xl font-bold font-mono text-white mb-2">{mod.title}</h2>
                <p className="text-sm text-gray-400">{mod.description}</p>
              </motion.div>
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
            <div className="flex-grow bg-[#111111] border border-[#333333] rounded-lg p-6">
              {activeModule === "voice-shield" && (
                <div className="text-center text-gray-400 font-mono mt-10">
                  <Activity className="w-16 h-16 mx-auto mb-4 text-[#00f3ff] animate-pulse" />
                  <p>Initializing Live Call Shield module...</p>
                </div>
              )}
              {activeModule === "counterfeit-scanner" && (
                <div className="text-center text-gray-400 font-mono mt-10">
                  <ScanLine className="w-16 h-16 mx-auto mb-4 text-[#00ff66] animate-pulse" />
                  <p>Initializing Counterfeit Scanner module...</p>
                </div>
              )}
              {activeModule === "phishing-disassembler" && (
                <div className="text-center text-gray-400 font-mono mt-10">
                  <LinkIcon className="w-16 h-16 mx-auto mb-4 text-[#ff003c] animate-pulse" />
                  <p>Initializing Phishing Disassembler module...</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
