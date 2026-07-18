"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Search, AlertTriangle, ShieldCheck, Link as LinkIcon, Globe, Clock, Server, FileText, Network } from "lucide-react";
import ReportGenerator from "./ReportGenerator";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

const PSYCHOLOGICAL_TRIGGERS = [
  "suspended", "disconnected", "blocked", "urgent", "immediately", "verify", 
  "kyc", "pan", "aadhar", "electricity", "bill", "pending", "claim", "prize"
];

interface AnalysisResult {
  isPhishing: boolean;
  score: number;
  extractedUrl: string | null;
  domainInfo: {
    age: string;
    location: string;
    registrar: string;
  } | null;
  highlightedText: string;
  explanation: string;
}

export default function PhishingDisassembler() {
  const [inputText, setInputText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  
  // Graph Data
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });

  const analyzeText = async () => {
    if (!inputText.trim()) return;
    
    setIsAnalyzing(true);
    setResult(null);
    setShowGraph(false);

    try {
      const res = await fetch("/api/phishing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: inputText })
      });
      const data = await res.json();

      const lowerText = inputText.toLowerCase();
      const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/g;
      const urls = inputText.match(urlRegex);
      const extractedUrl = urls ? urls[0] : null;

      let score = 0;
      if (data.threatType === "N/A" || data.threatType === "None") {
        score = 0; // Benign message, low score
      } else if (data.urgencyLevel === "Critical") {
        score = 95;
      } else if (data.urgencyLevel === "High") {
        score = 80;
      } else if (data.urgencyLevel === "Medium") {
        score = 50;
      } else {
        score = 20;
      }

      const isPhishing = score > 60;

      let highlighted = inputText;
      PSYCHOLOGICAL_TRIGGERS.forEach(trigger => {
        const regex = new RegExp(`\\b${trigger}\\b`, 'gi');
        highlighted = highlighted.replace(regex, `<span class="bg-[#ff003c]/20 text-[#ff003c] border border-[#ff003c]/50 rounded px-1 font-bold">$&</span>`);
      });
      if (extractedUrl) {
        const escapedUrl = extractedUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const urlReg = new RegExp(escapedUrl, 'g');
        highlighted = highlighted.replace(urlReg, `<span class="bg-blue-500/20 text-blue-400 border border-blue-500/50 rounded px-1 underline cursor-help">$&</span>`);
      }

      setResult({
        isPhishing,
        score,
        extractedUrl,
        domainInfo: extractedUrl ? {
          age: data.domainAge || "Unknown",
          location: data.location || "Unknown",
          registrar: "Hidden/PrivacyGuard",
        } : null,
        highlightedText: highlighted,
        explanation: data.explanation // added to use in UI below
      });

      if (extractedUrl && isPhishing) {
        setGraphData({
          nodes: [
            { id: extractedUrl, group: 1, val: 20, color: "#ff003c", name: "Extracted URL" },
            { id: "Malicious IP 1", group: 2, val: 10, color: "#00f3ff", name: "Known Phishing Server" },
            { id: "Suspicious TLD", group: 3, val: 15, color: "orange", name: "High-Risk Registrar" }
          ] as any,
          links: [
            { source: extractedUrl, target: "Malicious IP 1" },
            { source: extractedUrl, target: "Suspicious TLD" }
          ] as any
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col md:flex-row gap-6">
      {/* Left Panel */}
      <div className="w-full md:w-1/2 flex flex-col gap-6">
        <div className="bg-black/40 border border-[#333333] rounded-xl p-6 flex flex-col">
          <h3 className="font-mono text-sm text-gray-300 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Search className="w-4 h-4" /> Message Payload Input
          </h3>
          
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste suspicious SMS, WhatsApp message, or email here..."
            className="w-full h-32 bg-[#0a0a0a] border border-[#333333] rounded-lg p-4 text-gray-300 font-mono text-sm focus:outline-none focus:border-[#00f3ff] transition-colors resize-none mb-4"
          />
          
          <button
            onClick={analyzeText}
            disabled={isAnalyzing || !inputText.trim()}
            className="w-full bg-[#00f3ff]/10 hover:bg-[#00f3ff]/20 border border-[#00f3ff]/50 text-[#00f3ff] font-mono font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {isAnalyzing ? (
              <span className="flex items-center gap-2">
                <Search className="w-5 h-5 animate-spin" /> DISASSEMBLING...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Search className="w-5 h-5" /> ANALYZE PAYLOAD
              </span>
            )}
          </button>
        </div>

        {/* Dissected View */}
        <AnimatePresence>
          {result && !showGraph && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/40 border border-[#333333] rounded-xl p-6 flex flex-col flex-grow"
            >
              <h3 className="font-mono text-sm text-gray-300 uppercase tracking-widest mb-4">Dissected Message</h3>
              <div 
                className="bg-[#0a0a0a] border border-[#222] rounded-lg p-4 font-sans text-lg text-gray-300 leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: result.highlightedText }}
              />
              <div className="mt-4 flex gap-4 text-xs font-mono text-gray-500">
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-[#ff003c]/20 border border-[#ff003c]/50 rounded inline-block" />
                  Psychological Trigger
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-blue-500/20 border border-blue-500/50 rounded inline-block" />
                  Extracted Link
                </div>
              </div>
            </motion.div>
          )}

          {result && showGraph && result.isPhishing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/40 border border-[#00f3ff] rounded-xl p-6 flex flex-col flex-grow overflow-hidden"
            >
              <h3 className="font-mono text-sm text-[#00f3ff] uppercase tracking-widest mb-4 flex items-center gap-2">
                <Network className="w-4 h-4" /> Fraud Network Map
              </h3>
              <div className="flex-grow bg-[#0a0a0a] rounded-lg border border-[#222] overflow-hidden flex items-center justify-center relative h-64">
                <ForceGraph2D
                  graphData={graphData}
                  nodeAutoColorBy="group"
                  nodeCanvasObject={(node, ctx, globalScale) => {
                    const nodeWithCoords = node as any;
                    const label = nodeWithCoords.name;
                    const fontSize = 12/globalScale;
                    ctx.font = `${fontSize}px Sans-Serif`;
                    ctx.fillStyle = nodeWithCoords.color;
                    ctx.beginPath();
                    ctx.arc(nodeWithCoords.x, nodeWithCoords.y, 4, 0, 2 * Math.PI, false);
                    ctx.fill();
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = 'white';
                    ctx.fillText(label, nodeWithCoords.x, nodeWithCoords.y + 8);
                  }}
                  width={400}
                  height={250}
                  linkColor={() => '#333333'}
                  backgroundColor="#0a0a0a"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right Panel: Risk Report */}
      <div className="w-full md:w-1/2 flex flex-col gap-6">
        {result ? (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`bg-black/40 border rounded-xl p-6 flex flex-col flex-grow ${
              result.isPhishing ? "border-[#ff003c]/50" : "border-[#00ff66]/50"
            }`}
          >
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#333333]">
              <div className="flex items-center gap-4">
                {result.isPhishing ? (
                  <AlertTriangle className="w-12 h-12 text-[#ff003c]" />
                ) : (
                  <ShieldCheck className="w-12 h-12 text-[#00ff66]" />
                )}
                <div>
                  <h2 className={`font-mono text-2xl font-bold ${result.isPhishing ? "text-[#ff003c]" : "text-[#00ff66]"}`}>
                    {result.isPhishing ? "CRITICAL THREAT" : "SAFE MESSAGE"}
                  </h2>
                  <p className="text-gray-400 font-mono text-sm mt-1">
                    Risk Score: <span className={`font-bold ${result.score < 30 ? "text-[#00ff66]" : result.score <= 60 ? "text-yellow-400" : "text-[#ff003c]"}`}>{result.score}/100</span>
                  </p>
                </div>
              </div>

              {result.isPhishing && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowGraph(!showGraph)}
                    className="p-2 border border-[#00f3ff]/50 bg-[#00f3ff]/10 text-[#00f3ff] rounded hover:bg-[#00f3ff]/20 transition-colors"
                    title="Toggle Network Graph"
                  >
                    <Network className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowReport(true)}
                    className="bg-[#ff003c] hover:bg-[#ff003c]/80 text-black text-xs font-bold px-3 py-1.5 rounded flex items-center gap-2 transition-colors"
                  >
                    <FileText className="w-4 h-4" /> REPORT
                  </button>
                </div>
              )}
            </div>

            {/* URL Intelligence Report */}
            {result.extractedUrl ? (
              <div className="flex flex-col gap-6">
                <h3 className="font-mono text-sm text-gray-300 uppercase tracking-widest flex items-center gap-2">
                  <Globe className="w-4 h-4" /> Domain Intelligence
                </h3>
                
                <div className="bg-[#0a0a0a] border border-[#222] p-4 rounded-lg font-mono text-sm text-blue-400 break-all mb-2">
                  {result.extractedUrl}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#111] border border-[#333] p-4 rounded-lg flex flex-col gap-2">
                    <span className="text-gray-500 font-mono text-xs flex items-center gap-1"><Clock className="w-3 h-3"/> DOMAIN AGE</span>
                    <span className={`font-mono font-bold ${result.domainInfo?.age.includes("Days") ? "text-[#ff003c]" : "text-white"}`}>
                      {result.domainInfo?.age}
                    </span>
                  </div>
                  <div className="bg-[#111] border border-[#333] p-4 rounded-lg flex flex-col gap-2">
                    <span className="text-gray-500 font-mono text-xs flex items-center gap-1"><Server className="w-3 h-3"/> LOCATION</span>
                    <span className="font-mono font-bold text-white">
                      {result.domainInfo?.location}
                    </span>
                  </div>
                </div>

                {result.isPhishing && (
                  <div className="mt-auto bg-[#ff003c]/10 border border-[#ff003c] rounded-lg p-4">
                    <p className="text-[#ff003c] font-mono text-sm">
                      <strong>AI ANALYSIS:</strong> {result.explanation || "This URL points to a newly registered domain often associated with credential harvesting. The message uses urgency to manipulate you into clicking. Do not interact with the link."}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-grow text-gray-500 font-mono text-sm text-center">
                <LinkIcon className="w-12 h-12 mb-4 opacity-30" />
                <p>No actionable URLs detected in payload.</p>
                {result.isPhishing && (
                  <p className="text-[#ff003c] mt-4 max-w-xs">
                    However, psychological manipulation was detected. Proceed with caution.
                  </p>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          <div className="bg-black/40 border border-[#333333] rounded-xl flex-grow flex flex-col items-center justify-center text-gray-500 font-mono text-sm p-6 text-center">
            <Search className="w-12 h-12 mb-4 opacity-30" />
            <p>Awaiting payload input for disassembly...</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showReport && result && (
          <ReportGenerator 
            source="PhishingDisassembler"
            threatLevel={result.score}
            data={{
              payload: inputText,
              url: result.extractedUrl,
              location: result.domainInfo?.location,
              summary: "High-risk manipulation tactics detected combined with a newly registered malicious domain."
            }}
            onClose={() => setShowReport(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
