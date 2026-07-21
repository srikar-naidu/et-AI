"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, AlertTriangle, Activity, Brain, ShieldCheck, FileText, PhoneCall, Radio } from "lucide-react";
import ReportGenerator from "./ReportGenerator";

interface VectorResult {
  detected: boolean;
  evidence: string | null;
}

interface AnalysisResult {
  threat_level: number;
  verdict: "SAFE" | "SUSPICIOUS" | "DANGEROUS" | "CRITICAL";
  vectors: {
    authority: VectorResult;
    urgency: VectorResult;
    isolation: VectorResult;
    financial: VectorResult;
  };
  summary: string;
}

export default function VoiceShield() {
  const [source, setSource] = useState<"browser" | "twilio">("browser");
  const [isListening, setIsListening] = useState(false);
  const [twilioStatus, setTwilioStatus] = useState("Waiting for a call to your Twilio number");
  const [transcript, setTranscript] = useState<string>("");
  const [threatLevel, setThreatLevel] = useState(0);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const recognitionRef = useRef<any>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const latestTranscriptRef = useRef<string>("");

  // Keep the ref in sync with state
  useEffect(() => {
    latestTranscriptRef.current = transcript;
  }, [transcript]);

  // Debounced Groq analysis call
  const triggerAnalysis = useCallback((text: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(async () => {
      if (text.trim().length < 10) return;
      setIsAnalyzing(true);
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: text }),
        });
        if (res.ok) {
          const data: AnalysisResult = await res.json();
          setAnalysis(data);
          setThreatLevel(data.threat_level);
        }
      } catch (err) {
        console.error("Analysis fetch error:", err);
      } finally {
        setIsAnalyzing(false);
      }
    }, 1500); // Wait 1.5s after last speech chunk before calling AI
  }, []);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + " ";
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const fullText = (finalTranscript + interimTranscript).trim();
      if (fullText) {
        setTranscript(fullText);
        // Only send final results to the AI to avoid excessive calls
        if (finalTranscript.trim().length > 0) {
          triggerAnalysis(fullText);
        }
      }
    };

    recognition.onerror = (event: any) => {
      // Gracefully handle "no-speech" — this is NOT a fatal error.
      // It just means the mic is open but nobody is talking.
      if (event.error === "no-speech") {
        // Silently restart recognition
        return;
      }
      // For actual errors, log and stop
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        console.error("Microphone access denied.");
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // Auto-restart if we are supposed to still be listening
      // This also handles the "no-speech" auto-restart
      if (recognitionRef.current?._shouldListen) {
        try {
          recognition.start();
        } catch (e) {
          // Ignore "already started" errors
        }
      }
    };

    recognitionRef.current = recognition;
    recognitionRef.current._shouldListen = false;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current._shouldListen = false;
        recognitionRef.current.stop();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [triggerAnalysis]);

  useEffect(() => {
    if (source !== "twilio") return;
    let cancelled = false;
    const refresh = async () => {
      try {
        const response = await fetch("/api/live-call/active", { cache: "no-store" });
        const payload = await response.json();
        const session = payload.session as { transcript?: string; status?: string; caller?: string; error_message?: string } | null;
        if (cancelled) return;
        if (!payload.configured) {
          setTwilioStatus("Configure Supabase and Twilio to arm the live bridge");
          setIsListening(false);
          return;
        }
        if (!session) {
          setTwilioStatus("Waiting for a call to your Twilio number");
          setIsListening(false);
          return;
        }
        const live = session.status === "ringing" || session.status === "connected";
        setIsListening(live);
        setTwilioStatus(session.error_message ?? `${session.status === "connected" ? "Shielding" : session.status} ${session.caller ?? "caller"}`);
        const nextTranscript = session.transcript?.trim() ?? "";
        if (nextTranscript && nextTranscript !== latestTranscriptRef.current) {
          setTranscript(nextTranscript);
          triggerAnalysis(nextTranscript);
        }
      } catch {
        if (!cancelled) setTwilioStatus("Could not reach live-call service");
      }
    };
    void refresh();
    const interval = window.setInterval(() => void refresh(), 2000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [source, triggerAnalysis]);

  const toggleListening = () => {
    if (source === "twilio") return;
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current._shouldListen = false;
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      setTranscript("");
      setThreatLevel(0);
      setAnalysis(null);
      if (recognitionRef.current) {
        recognitionRef.current._shouldListen = true;
        recognitionRef.current.start();
      }
      setIsListening(true);
    }
  };

  const changeSource = (next: "browser" | "twilio") => {
    if (next === source) return;
    recognitionRef.current?._shouldListen && recognitionRef.current.stop();
    if (recognitionRef.current) recognitionRef.current._shouldListen = false;
    setIsListening(false);
    setTranscript("");
    setThreatLevel(0);
    setAnalysis(null);
    setSource(next);
  };

  // UI color helpers
  const getThreatColor = () => {
    if (threatLevel < 30) return "text-[#00ff66] border-[#00ff66]/50";
    if (threatLevel < 70) return "text-yellow-400 border-yellow-400/50";
    return "text-[#ff003c] border-[#ff003c]/50";
  };

  const getThreatBg = () => {
    if (threatLevel < 30) return "bg-[#00ff66]";
    if (threatLevel < 70) return "bg-yellow-400";
    return "bg-[#ff003c]";
  };

  const getVerdictStyle = () => {
    if (!analysis) return "text-gray-500";
    switch (analysis.verdict) {
      case "SAFE": return "text-[#00ff66]";
      case "SUSPICIOUS": return "text-yellow-400";
      case "DANGEROUS": return "text-orange-500";
      case "CRITICAL": return "text-[#ff003c] animate-pulse";
      default: return "text-gray-500";
    }
  };

  const vectorConfig: Record<string, { label: string; color: string; borderColor: string }> = {
    authority: { label: "Authority", color: "text-blue-400", borderColor: "border-blue-500/50" },
    urgency: { label: "Urgency", color: "text-orange-400", borderColor: "border-orange-500/50" },
    isolation: { label: "Isolation", color: "text-purple-400", borderColor: "border-purple-500/50" },
    financial: { label: "Financial", color: "text-[#ff003c]", borderColor: "border-[#ff003c]/50" },
  };

  return (
    <div className="w-full h-full flex flex-col md:flex-row gap-6">
      {/* Left Panel: Controls, Meter & AI Verdict */}
      <div className="w-full md:w-[380px] flex flex-col gap-5 flex-shrink-0">
        {/* Mic Control */}
        <div className="bg-black/40 border border-[#333333] rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="mb-5 grid w-full grid-cols-2 rounded-lg border border-[#333] bg-black/30 p-1 text-[10px] font-mono uppercase tracking-wider">
            <button onClick={() => changeSource("twilio")} className={`rounded-md px-2 py-2 transition ${source === "twilio" ? "bg-[#00f3ff]/15 text-[#00f3ff]" : "text-gray-500"}`}><PhoneCall className="mr-1 inline size-3" />Twilio call</button>
            <button onClick={() => changeSource("browser")} className={`rounded-md px-2 py-2 transition ${source === "browser" ? "bg-[#00f3ff]/15 text-[#00f3ff]" : "text-gray-500"}`}><Mic className="mr-1 inline size-3" />Browser mic</button>
          </div>
          <AnimatePresence>
            {isListening && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.05, 0.15, 0.05] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-[#00f3ff]/10 pointer-events-none"
              />
            )}
          </AnimatePresence>

          <button
            onClick={toggleListening}
            disabled={source === "twilio"}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg cursor-pointer ${
              isListening
                ? "bg-red-500/20 text-red-400 border-2 border-red-500/60 hover:bg-red-500/30 shadow-red-500/20"
                : "bg-[#00f3ff]/10 text-[#00f3ff] border-2 border-[#00f3ff]/40 hover:bg-[#00f3ff]/20 shadow-[#00f3ff]/10"
            }`}
          >
            {source === "twilio" ? <Radio className="w-8 h-8" /> : isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </button>
          <p className="mt-3 font-mono text-xs text-gray-500 tracking-widest uppercase">
            {source === "twilio" ? twilioStatus : isListening ? "Recording Active" : "System Standby"}
          </p>
          {source === "twilio" && <p className="mt-2 text-center text-[11px] leading-4 text-gray-600">Call the Twilio Voice number from your test account. Twilio bridges it to your protected number and streams both speakers here.</p>}
        </div>

        {/* Threat Meter */}
        <div className={`bg-black/40 border rounded-xl p-5 flex flex-col transition-colors duration-700 ${getThreatColor()}`}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-mono text-xs uppercase tracking-widest text-gray-400">Threat Level</h3>
            <span className="font-mono text-3xl font-bold tabular-nums">{threatLevel}%</span>
          </div>

          {/* Bar */}
          <div className="w-full h-2.5 bg-[#0a0a0a] rounded-full overflow-hidden border border-[#222]">
            <motion.div
              className={`h-full rounded-full ${getThreatBg()}`}
              initial={{ width: 0 }}
              animate={{ width: `${threatLevel}%` }}
              transition={{ type: "spring", stiffness: 40, damping: 15 }}
            />
          </div>

          {/* Verdict */}
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs font-mono text-gray-500">VERDICT:</span>
            <span className={`text-sm font-mono font-bold ${getVerdictStyle()}`}>
              {analysis?.verdict ?? "AWAITING"}
            </span>
            {isAnalyzing && (
              <Brain className="w-4 h-4 text-[#00f3ff] animate-spin ml-auto" />
            )}
          </div>
        </div>

        {/* Detected Vectors */}
        <div className="bg-black/40 border border-[#333333] rounded-xl p-5">
          <h3 className="font-mono text-xs uppercase tracking-widest text-gray-500 mb-3">Detected Vectors</h3>
          <div className="flex flex-col gap-2.5">
            {Object.entries(vectorConfig).map(([key, config]) => {
              const vec = analysis?.vectors?.[key as keyof typeof analysis.vectors];
              const detected = vec?.detected ?? false;
              return (
                <motion.div
                  key={key}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-500 ${
                    detected
                      ? `bg-white/[0.03] ${config.borderColor}`
                      : "bg-transparent border-[#222]"
                  }`}
                  animate={detected ? { scale: [1, 1.01, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 transition-colors duration-500 ${
                    detected ? config.color.replace("text-", "bg-") : "bg-[#333]"
                  }`} />
                  <div className="min-w-0">
                    <span className={`text-xs font-mono font-semibold uppercase tracking-wider ${
                      detected ? config.color : "text-gray-600"
                    }`}>
                      {config.label}
                    </span>
                    {detected && vec?.evidence && (
                      <p className="text-[11px] text-gray-400 mt-1 leading-snug truncate">
                        &quot;{vec.evidence}&quot;
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Critical Alert Banner */}
        <AnimatePresence>
          {threatLevel >= 75 && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              className="bg-[#ff003c]/10 border border-[#ff003c]/60 rounded-xl p-4 flex items-start gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-[#ff003c] flex-shrink-0 mt-0.5" />
              <div className="flex-grow">
                <h4 className="text-[#ff003c] font-bold font-mono text-xs uppercase tracking-wider">
                  {analysis?.verdict === "CRITICAL" ? "Digital Arrest Scam Detected" : "High Threat Detected"}
                </h4>
                <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                  {analysis?.summary ?? "Multiple manipulation vectors identified. Exercise extreme caution."}
                </p>
                <ul className="mt-3 space-y-1.5 rounded-lg border border-[#ff003c]/35 bg-black/30 p-3 text-[11px] leading-4 text-gray-200">
                  <li>• Do not transfer money, crypto, gift cards, or “security deposits”.</li>
                  <li>• Do not share OTP, PIN, CVV, or install remote-access apps.</li>
                  <li>• Do not click links sent during this call. Hang up and verify offline.</li>
                  <li>• Call 1930 / report on cybercrime.gov.in if money is at risk.</li>
                </ul>
                <button
                  onClick={() => setShowReport(true)}
                  className="mt-3 bg-[#ff003c] hover:bg-[#ff003c]/80 text-black text-xs font-bold px-3 py-1.5 rounded flex items-center gap-2 transition-colors"
                >
                  <FileText className="w-3 h-3" /> GENERATE NCRB REPORT
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Safe Banner */}
        <AnimatePresence>
          {analysis && threatLevel < 20 && transcript.length > 20 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-[#00ff66]/5 border border-[#00ff66]/30 rounded-xl p-4 flex items-start gap-3"
            >
              <ShieldCheck className="w-5 h-5 text-[#00ff66] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[#00ff66] font-bold font-mono text-xs uppercase tracking-wider">Conversation Safe</h4>
                <p className="text-gray-400 text-xs mt-1">{analysis.summary}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right Panel: Transcript */}
      <div className="w-full bg-black/40 border border-[#333333] rounded-xl flex flex-col overflow-hidden">
        <div className="px-5 py-3 border-b border-[#222] bg-[#0d0d0d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-gray-500" />
            <h3 className="font-mono text-xs text-gray-400 uppercase tracking-widest">Live Transcript</h3>
          </div>
          <div className="flex items-center gap-3">
            {isAnalyzing && (
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-[#00f3ff]">
                <Brain className="w-3 h-3 animate-spin" /> ANALYZING
              </span>
            )}
            {isListening && (
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
            )}
          </div>
        </div>
        <div className="flex-grow p-6 overflow-y-auto font-sans text-base text-gray-300 leading-relaxed">
          {transcript ? (
            <p>{transcript}</p>
          ) : (
            <p className="text-gray-600 italic text-sm">Awaiting audio input…</p>
          )}
        </div>

        {/* AI Summary Footer */}
        {analysis && analysis.summary && (
          <div className="px-5 py-3 border-t border-[#222] bg-[#0d0d0d]">
            <div className="flex items-start gap-2">
              <Brain className="w-4 h-4 text-[#00f3ff] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-400 leading-relaxed">
                <span className="text-[#00f3ff] font-mono font-semibold">AI: </span>
                {analysis.summary}
              </p>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showReport && analysis && (
          <ReportGenerator 
            source="VoiceShield"
            threatLevel={threatLevel}
            data={{
              transcript,
              summary: analysis.summary
            }}
            onClose={() => setShowReport(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
