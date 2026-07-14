"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, AlertTriangle, ShieldCheck, Activity } from "lucide-react";

// Mock AI Logic Keywords
const SCAM_KEYWORDS = {
  authority: ["police", "cbi", "customs", "fedex", "narcotics", "arrest", "warrant", "officer"],
  urgency: ["immediately", "urgent", "right now", "today", "action required", "suspend"],
  isolation: ["don't hang up", "stay on the line", "don't tell anyone", "alone", "secret"],
  financial: ["transfer", "money", "deposit", "account", "rbi", "fee", "penalty", "security deposit"],
};

export default function VoiceShield() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<string>("");
  const [threatLevel, setThreatLevel] = useState(0); // 0 to 100
  const [detectedCategories, setDetectedCategories] = useState<Set<string>>(new Set());
  
  // SpeechRecognition types
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        
        // Append to existing transcript for simulation purposes, or just replace
        setTranscript(prev => {
          const newTranscript = prev + " " + currentTranscript;
          analyzeThreat(newTranscript);
          return newTranscript.trim();
        });
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        if (isListening) {
          recognition.start(); // Auto-restart if still supposed to be listening
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setTranscript("");
      setThreatLevel(0);
      setDetectedCategories(new Set());
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const analyzeThreat = (text: string) => {
    const lowerText = text.toLowerCase();
    const newDetected = new Set<string>();
    
    // Check categories
    if (SCAM_KEYWORDS.authority.some(w => lowerText.includes(w))) newDetected.add("authority");
    if (SCAM_KEYWORDS.urgency.some(w => lowerText.includes(w))) newDetected.add("urgency");
    if (SCAM_KEYWORDS.isolation.some(w => lowerText.includes(w))) newDetected.add("isolation");
    if (SCAM_KEYWORDS.financial.some(w => lowerText.includes(w))) newDetected.add("financial");

    setDetectedCategories(newDetected);

    // Calculate compound threat level
    let level = 0;
    if (newDetected.size === 1) level = 20;
    else if (newDetected.size === 2) level = 50;
    else if (newDetected.size === 3) level = 85;
    else if (newDetected.size >= 4) level = 100;

    setThreatLevel(level);
  };

  // UI Helpers
  const getThreatColor = () => {
    if (threatLevel < 30) return "text-[#00ff66] border-[#00ff66]";
    if (threatLevel < 70) return "text-yellow-400 border-yellow-400";
    return "text-[#ff003c] border-[#ff003c]";
  };

  const getThreatBg = () => {
    if (threatLevel < 30) return "bg-[#00ff66]";
    if (threatLevel < 70) return "bg-yellow-400";
    return "bg-[#ff003c]";
  };

  // Function to highlight words in the transcript
  const renderHighlightedTranscript = () => {
    if (!transcript) return <span className="text-gray-500 italic">Awaiting audio input...</span>;
    
    let highlightedHTML = transcript;
    
    // Simple naive highlighting (can be improved with regex word boundaries)
    Object.entries(SCAM_KEYWORDS).forEach(([category, words]) => {
      let colorClass = "";
      if (category === "authority") colorClass = "bg-blue-500/20 text-blue-400 border border-blue-500/50 rounded px-1";
      if (category === "urgency") colorClass = "bg-orange-500/20 text-orange-400 border border-orange-500/50 rounded px-1";
      if (category === "isolation") colorClass = "bg-purple-500/20 text-purple-400 border border-purple-500/50 rounded px-1";
      if (category === "financial") colorClass = "bg-[#ff003c]/20 text-[#ff003c] border border-[#ff003c]/50 rounded px-1";

      words.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        highlightedHTML = highlightedHTML.replace(regex, `<span class="${colorClass}">$&</span>`);
      });
    });

    return <div dangerouslySetInnerHTML={{ __html: highlightedHTML }} className="leading-relaxed" />;
  };

  return (
    <div className="w-full h-full flex flex-col md:flex-row gap-8">
      {/* Left Panel: Controls & Meter */}
      <div className="w-full md:w-1/3 flex flex-col gap-6">
        <div className="bg-black/40 border border-[#333333] rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
          {/* Subtle pulsating background for listening state */}
          <AnimatePresence>
            {isListening && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.1, 0.3, 0.1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-[#00f3ff]/10 pointer-events-none"
              />
            )}
          </AnimatePresence>

          <button
            onClick={toggleListening}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
              isListening 
                ? "bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500/30 shadow-red-500/20" 
                : "bg-[#00f3ff]/20 text-[#00f3ff] border border-[#00f3ff]/50 hover:bg-[#00f3ff]/30 shadow-[#00f3ff]/20"
            }`}
          >
            {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </button>
          <p className="mt-4 font-mono text-sm text-gray-400">
            {isListening ? "RECORDING ACTIVE" : "SYSTEM STANDBY"}
          </p>
        </div>

        {/* Threat Meter */}
        <div className={`bg-black/40 border rounded-xl p-6 flex flex-col transition-colors duration-500 ${getThreatColor()}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-mono text-sm uppercase tracking-widest text-white">Compound Threat</h3>
            <span className="font-mono text-2xl font-bold">{threatLevel}%</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full h-3 bg-[#111111] rounded-full overflow-hidden border border-[#333333]">
            <motion.div 
              className={`h-full ${getThreatBg()}`}
              initial={{ width: 0 }}
              animate={{ width: `${threatLevel}%` }}
              transition={{ type: "spring", stiffness: 50, damping: 15 }}
            />
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <div className="text-xs font-mono text-gray-500 uppercase">Detected Vectors:</div>
            <div className="flex flex-wrap gap-2">
              {detectedCategories.size === 0 && <span className="text-gray-600 text-sm">None detected</span>}
              <AnimatePresence>
                {Array.from(detectedCategories).map(cat => (
                  <motion.span
                    key={cat}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-xs font-mono capitalize"
                  >
                    {cat}
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Dynamic Alert Banner */}
        <AnimatePresence>
          {threatLevel >= 85 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-[#ff003c]/10 border border-[#ff003c] rounded-xl p-4 flex items-start gap-3"
            >
              <AlertTriangle className="w-6 h-6 text-[#ff003c] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[#ff003c] font-bold font-mono text-sm">DIGITAL ARREST SCAM DETECTED</h4>
                <p className="text-gray-300 text-xs mt-1">
                  High-probability psychological manipulation sequence identified. Disconnect call immediately.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right Panel: Transcript */}
      <div className="w-full md:w-2/3 bg-black/40 border border-[#333333] rounded-xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[#333333] bg-[#111111] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-400" />
            <h3 className="font-mono text-sm text-gray-300 uppercase tracking-widest">Live Transcript Feed</h3>
          </div>
          {isListening && (
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
        </div>
        <div className="flex-grow p-6 overflow-y-auto font-sans text-lg text-gray-200">
          {renderHighlightedTranscript()}
        </div>
      </div>
    </div>
  );
}
