"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scan,
  ScanLine,
  Camera,
  XCircle,
  CheckCircle2,
  Upload,
  AlertTriangle,
  Microscope,
  Shield,
  Hash,
  Zap,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Clock,
  HelpCircle,
  IndianRupee,
} from "lucide-react";
import type {
  CurrencyAnalysisReport,
  TechniqueVerdict,
  Verdict,
  TechniqueId,
} from "@/lib/currency-analysis";
import { analyzeCurrency } from "@/lib/currency-analysis";
import type { PixelData } from "@/lib/currency-analysis/types";

/* ─── Verdict palette ────────────────────────────────────────────────── */

const VERDICT_CONFIG: Record<
  Verdict,
  { color: string; bg: string; border: string; label: string }
> = {
  genuine: {
    color: "#00ff66",
    bg: "rgba(0,255,102,0.10)",
    border: "rgba(0,255,102,0.40)",
    label: "GENUINE",
  },
  suspicious: {
    color: "#ffa500",
    bg: "rgba(255,165,0,0.10)",
    border: "rgba(255,165,0,0.40)",
    label: "SUSPICIOUS",
  },
  counterfeit: {
    color: "#ff003c",
    bg: "rgba(255,0,60,0.10)",
    border: "rgba(255,0,60,0.40)",
    label: "COUNTERFEIT",
  },
  inconclusive: {
    color: "#888888",
    bg: "rgba(136,136,136,0.10)",
    border: "rgba(136,136,136,0.40)",
    label: "INCONCLUSIVE",
  },
};

const TECHNIQUE_META: Record<
  TechniqueId,
  { icon: React.ReactNode; description: string }
> = {
  microprint: {
    icon: <Microscope className="w-5 h-5" />,
    description: "Analyses fine 0.2 mm text via edge density, FFT frequency peaks & texture variance",
  },
  security_thread: {
    icon: <Shield className="w-5 h-5" />,
    description: "Detects embedded metallic thread — vertical continuity, window count & reflectance",
  },
  serial_number: {
    icon: <Hash className="w-5 h-5" />,
    description: "Character segmentation, spacing regularity, print sharpness & dual-number consistency",
  },
  uv_features: {
    icon: <Zap className="w-5 h-5" />,
    description: "Blue-channel dominance, paper fluorescence baseline, ink pigment & fibre density",
  },
};

/* ─── Helpers ────────────────────────────────────────────────────────── */

function imageFileToPixelData(file: File): Promise<PixelData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, canvas.width, canvas.height);
      resolve({ data: d.data, width: d.width, height: d.height });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

/* ─── Confidence Gauge ───────────────────────────────────────────────── */

function ConfidenceGauge({
  value,
  color,
}: {
  value: number;
  color: string;
}) {
  return (
    <div className="relative h-2 w-full rounded-full bg-white/5 overflow-hidden">
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.round(value * 100)}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
}

/* ─── Technique Card ─────────────────────────────────────────────────── */

function TechniqueCard({
  technique,
  expanded,
  onToggle,
}: {
  technique: TechniqueVerdict;
  expanded: boolean;
  onToggle: () => void;
}) {
  const v = VERDICT_CONFIG[technique.verdict];
  const meta = TECHNIQUE_META[technique.technique];
  const pct = Math.round(technique.confidence * 100);

  return (
    <motion.div
      layout
      className="rounded-xl border overflow-hidden transition-colors"
      style={{
        borderColor: v.border,
        backgroundColor: v.bg,
      }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left focus:outline-none"
      >
        <span style={{ color: v.color }}>{meta.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-semibold text-white truncate">
              {technique.label}
            </span>
            <span
              className="font-mono text-[10px] px-2 py-0.5 rounded-full border"
              style={{
                color: v.color,
                borderColor: v.border,
                backgroundColor: v.bg,
              }}
            >
              {v.label}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <ConfidenceGauge value={technique.confidence} color={v.color} />
            <span
              className="font-mono text-xs flex-shrink-0"
              style={{ color: v.color }}
            >
              {pct}%
            </span>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
        )}
      </button>

      {/* Expanded findings */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              <p className="text-[11px] text-gray-500 font-mono mb-3 leading-relaxed">
                {meta.description}
              </p>
              {technique.findings.map((f, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-xs font-mono leading-relaxed"
                >
                  <span className="mt-0.5 flex-shrink-0">
                    {f.severity === "info" ? (
                      <CheckCircle2
                        className="w-3.5 h-3.5"
                        style={{ color: "#00ff66" }}
                      />
                    ) : f.severity === "warning" ? (
                      <AlertTriangle
                        className="w-3.5 h-3.5"
                        style={{ color: "#ffa500" }}
                      />
                    ) : (
                      <XCircle
                        className="w-3.5 h-3.5"
                        style={{ color: "#ff003c" }}
                      />
                    )}
                  </span>
                  <span className="text-gray-300">{f.message}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════════════ */

export default function CounterfeitScanner() {
  /* ── state ─────────────────────────────────────────────────────────── */
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [report, setReport] = useState<CurrencyAnalysisReport | null>(null);
  const [screeningError, setScreeningError] = useState<string | null>(null);
  const [expandedTechnique, setExpandedTechnique] = useState<string | null>(
    null,
  );
  const [showUV, setShowUV] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /* ── camera ────────────────────────────────────────────────────────── */

  useEffect(() => {
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        setHasPermission(true);
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        setHasPermission(false);
      }
    };
    start();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  /* ── image preview ─────────────────────────────────────────────────── */

  useEffect(() => {
    if (!selectedImage) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedImage);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedImage]);

  /* ── capture from camera ───────────────────────────────────────────── */

  const captureCameraFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setScreeningError(
        "Camera preview is not ready. Upload an image instead.",
      );
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setSelectedImage(
          new File([blob], `capture-${Date.now()}.jpg`, {
            type: "image/jpeg",
          }),
        );
        setReport(null);
        setScreeningError(null);
      },
      "image/jpeg",
      0.92,
    );
  }, []);

  /* ── run analysis ──────────────────────────────────────────────────── */

  const handleScan = useCallback(async () => {
    if (isScanning || !selectedImage) return;
    setIsScanning(true);
    setReport(null);
    setScreeningError(null);
    setExpandedTechnique(null);
    setShowUV(false);

    try {
      const pixelData = await imageFileToPixelData(selectedImage);
      const result = await analyzeCurrency(pixelData);
      setReport(result);
    } catch (err) {
      setScreeningError(
        err instanceof Error ? err.message : "Analysis failed.",
      );
    } finally {
      setIsScanning(false);
    }
  }, [isScanning, selectedImage]);

  /* ── derived ───────────────────────────────────────────────────────── */

  const overallV = report ? VERDICT_CONFIG[report.overallVerdict] : null;

  /* ── render ────────────────────────────────────────────────────────── */

  return (
    <div className="w-full flex flex-col gap-6">
      {/* ────────────────────── Top: Camera / Preview + Controls ────── */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Camera / preview */}
        <div className="w-full lg:w-3/5 flex flex-col gap-4">
          <div className="relative w-full aspect-video bg-black rounded-xl border border-[#333333] overflow-hidden flex items-center justify-center">
            {/* Camera feed (hidden when a preview is showing) */}
            {hasPermission === false && !previewUrl && (
              <div className="text-red-500 font-mono text-sm flex flex-col items-center gap-2">
                <Camera className="w-8 h-8 opacity-50" />
                <p>Camera access denied. Please allow permissions or upload an image.</p>
              </div>
            )}
            {hasPermission === null && !previewUrl && (
              <div className="text-[#00f3ff] font-mono text-sm flex flex-col items-center gap-2">
                <Camera className="w-8 h-8 opacity-50 animate-pulse" />
                <p>Requesting camera access…</p>
              </div>
            )}

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${previewUrl ? "hidden" : hasPermission ? "opacity-100" : "opacity-0"}`}
            />

            {/* Image preview overlay */}
            {previewUrl && !showUV && (
              <img
                src={previewUrl}
                alt="Selected currency note"
                className="w-full h-full object-contain"
              />
            )}

            {/* UV simulation overlay */}
            {showUV && report?.uvSimulationDataUrl && (
              <img
                src={report.uvSimulationDataUrl}
                alt="Simulated UV view"
                className="w-full h-full object-contain"
              />
            )}

            {/* Cyber-grid overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(0,243,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />

            {/* Viewfinder corners */}
            <div className="absolute inset-8 pointer-events-none flex justify-between flex-col">
              <div className="flex justify-between">
                <div className="w-8 h-8 border-t-2 border-l-2 border-[#00f3ff]" />
                <div className="w-8 h-8 border-t-2 border-r-2 border-[#00f3ff]" />
              </div>
              <div className="flex justify-between">
                <div className="w-8 h-8 border-b-2 border-l-2 border-[#00f3ff]" />
                <div className="w-8 h-8 border-b-2 border-r-2 border-[#00f3ff]" />
              </div>
            </div>

            {/* Scanning animation */}
            <AnimatePresence>
              {isScanning && (
                <motion.div
                  initial={{ top: "0%" }}
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute left-0 w-full h-1 bg-[#00ff66] shadow-[0_0_15px_#00ff66]"
                />
              )}
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
            <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#00f3ff]/50 bg-[#00f3ff]/10 px-4 font-mono text-sm text-[#00f3ff] transition-colors hover:bg-[#00f3ff]/20">
              <Upload className="w-4 h-4" />
              {selectedImage ? selectedImage.name : "UPLOAD NOTE IMAGE"}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  setSelectedImage(e.target.files?.[0] ?? null);
                  setReport(null);
                  setScreeningError(null);
                }}
              />
            </label>

            <button
              type="button"
              onClick={captureCameraFrame}
              disabled={!hasPermission}
              className="min-h-12 rounded-lg border border-[#00f3ff]/50 px-4 font-mono text-sm text-[#00f3ff] hover:bg-[#00f3ff]/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Camera className="mr-2 inline size-4" />
              CAPTURE
            </button>

            {/* UV toggle */}
            {report?.uvSimulationDataUrl && (
              <button
                type="button"
                onClick={() => setShowUV((prev) => !prev)}
                className={`min-h-12 rounded-lg border px-4 font-mono text-sm transition-colors ${
                  showUV
                    ? "border-purple-400/60 bg-purple-400/20 text-purple-300"
                    : "border-purple-400/30 text-purple-400 hover:bg-purple-400/10"
                }`}
              >
                {showUV ? (
                  <EyeOff className="mr-2 inline size-4" />
                ) : (
                  <Eye className="mr-2 inline size-4" />
                )}
                {showUV ? "NORMAL" : "UV SIM"}
              </button>
            )}

            <button
              type="button"
              onClick={handleScan}
              disabled={!selectedImage || isScanning}
              className="min-h-12 bg-[#00ff66]/10 hover:bg-[#00ff66]/20 border border-[#00ff66]/50 text-[#00ff66] font-mono px-5 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ScanLine className="w-5 h-5" />
              ANALYSE
            </button>
          </div>
        </div>

        {/* ────────────────── Right: Overall verdict panel ──────────── */}
        <div className="w-full lg:w-2/5 flex flex-col gap-4">
          <div className="bg-black/40 border border-[#333333] rounded-xl flex-grow flex flex-col overflow-hidden">
            {/* Panel header */}
            <div className="p-4 border-b border-[#333333] bg-[#111111] flex items-center gap-2">
              <Scan className="w-5 h-5 text-gray-400" />
              <h3 className="font-mono text-sm text-gray-300 uppercase tracking-widest">
                Analysis Report
              </h3>
            </div>

            <div className="flex-grow p-5 flex flex-col">
              {/* Scanning state */}
              {isScanning && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 flex flex-col items-center justify-center gap-4 text-[#00f3ff]"
                >
                  <Scan className="w-16 h-16 animate-spin" />
                  <p className="font-mono uppercase tracking-widest text-sm animate-pulse">
                    Running 4-technique analysis…
                  </p>
                </motion.div>
              )}

              {/* Error state */}
              {!isScanning && screeningError && (
                <div className="flex-1 flex flex-col items-center justify-center text-red-400 gap-3 font-mono text-sm">
                  <XCircle className="w-10 h-10 opacity-60" />
                  <p>{screeningError}</p>
                </div>
              )}

              {/* Idle state */}
              {!isScanning && !report && !screeningError && (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 font-mono text-sm gap-3">
                  <Scan className="w-12 h-12 opacity-30" />
                  <p>Upload or capture a currency note to begin analysis.</p>
                </div>
              )}

              {/* Results */}
              {!isScanning && report && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-5"
                >
                  {/* Overall verdict header */}
                  <div
                    className="rounded-xl border p-4 flex items-center gap-4"
                    style={{
                      borderColor: overallV!.border,
                      backgroundColor: overallV!.bg,
                    }}
                  >
                    {report.overallVerdict === "genuine" ? (
                      <CheckCircle2
                        className="w-10 h-10 flex-shrink-0"
                        style={{ color: overallV!.color }}
                      />
                    ) : report.overallVerdict === "counterfeit" ? (
                      <XCircle
                        className="w-10 h-10 flex-shrink-0 animate-pulse"
                        style={{ color: overallV!.color }}
                      />
                    ) : report.overallVerdict === "suspicious" ? (
                      <AlertTriangle
                        className="w-10 h-10 flex-shrink-0"
                        style={{ color: overallV!.color }}
                      />
                    ) : (
                      <HelpCircle
                        className="w-10 h-10 flex-shrink-0"
                        style={{ color: overallV!.color }}
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="font-mono text-lg font-bold tracking-wider"
                          style={{ color: overallV!.color }}
                        >
                          {overallV!.label}
                        </span>
                        <span className="font-mono text-xs text-gray-400">
                          {Math.round(report.overallConfidence * 100)}%
                          confidence
                        </span>
                      </div>

                      {/* Denomination */}
                      <div className="flex items-center gap-2 mt-1 text-gray-400 font-mono text-xs">
                        {report.denomination ? (
                          <>
                            <IndianRupee className="w-3.5 h-3.5" />
                            <span>
                              ₹{report.denomination} detected (
                              {Math.round(
                                report.denominationConfidence * 100,
                              )}
                              %)
                            </span>
                          </>
                        ) : (
                          <span>Denomination not identified</span>
                        )}
                        <span className="ml-auto flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {report.analysisDurationMs}ms
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Disclaimer */}
                  <p className="text-[10px] text-gray-500 font-mono leading-relaxed px-1">
                    This screening output is non-conclusive and does not replace
                    authentication by a trained examiner. Preserve suspicious
                    notes and report via official channels.
                  </p>

                  {/* Technique cards */}
                  <div className="flex flex-col gap-3">
                    {report.techniques.map((t) => (
                      <TechniqueCard
                        key={t.technique}
                        technique={t}
                        expanded={expandedTechnique === t.technique}
                        onToggle={() =>
                          setExpandedTechnique((prev) =>
                            prev === t.technique ? null : t.technique,
                          )
                        }
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
