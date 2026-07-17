"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scan, ScanLine, Camera, XCircle, CheckCircle2, Maximize, Upload } from "lucide-react";

export default function CounterfeitScanner() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<"IDLE" | "VERIFIED" | "COUNTERFEIT">("IDLE");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [screeningError, setScreeningError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const captureCameraFrame = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setScreeningError("Camera preview is not ready. Upload an image instead.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      setSelectedImage(new File([blob], `currency-capture-${Date.now()}.jpg`, { type: "image/jpeg" }));
      setScanResult("IDLE");
      setScreeningError(null);
    }, "image/jpeg", 0.92);
  };

  useEffect(() => {
    // Request camera access
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setHasPermission(true);
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access denied or failed", err);
        setHasPermission(false);
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleScan = async () => {
    if (isScanning || !selectedImage) return;
    setIsScanning(true);
    setScanResult("IDLE");
    setScreeningError(null);
    setConfidence(null);

    try {
      const formData = new FormData();
      formData.append("image", selectedImage);
      const response = await fetch("/api/counterfeit", { method: "POST", body: formData });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Screening could not be completed.");
      setScanResult(payload.result === "counterfeit" ? "COUNTERFEIT" : "VERIFIED");
      setConfidence(typeof payload.confidence === "number" ? payload.confidence : null);
    } catch (error) {
      setScreeningError(error instanceof Error ? error.message : "Screening could not be completed.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col md:flex-row gap-6">
      {/* Left Panel: Camera Feed */}
      <div className="w-full md:w-2/3 flex flex-col gap-4">
        <div className="relative w-full aspect-video bg-black rounded-xl border border-[#333333] overflow-hidden flex items-center justify-center">
          {hasPermission === false && (
            <div className="text-red-500 font-mono text-sm flex flex-col items-center gap-2">
              <Camera className="w-8 h-8 opacity-50" />
              <p>Camera access denied. Please allow permissions.</p>
            </div>
          )}
          {hasPermission === null && (
            <div className="text-[#00f3ff] font-mono text-sm flex flex-col items-center gap-2">
              <Camera className="w-8 h-8 opacity-50 animate-pulse" />
              <p>Requesting camera access...</p>
            </div>
          )}
          
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className={`w-full h-full object-cover ${hasPermission ? "opacity-100" : "opacity-0"}`}
          />

          {/* Cyberpunk Overlay Grid */}
          <div className="absolute inset-0 pointer-events-none opacity-30 bg-[linear-gradient(rgba(0,243,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />
          
          {/* Viewfinder Corners */}
          <div className="absolute inset-8 border-[#00f3ff]/50 pointer-events-none flex justify-between flex-col">
            <div className="flex justify-between">
              <div className="w-8 h-8 border-t-2 border-l-2 border-[#00f3ff]" />
              <div className="w-8 h-8 border-t-2 border-r-2 border-[#00f3ff]" />
            </div>
            <div className="flex justify-between">
              <div className="w-8 h-8 border-b-2 border-l-2 border-[#00f3ff]" />
              <div className="w-8 h-8 border-b-2 border-r-2 border-[#00f3ff]" />
            </div>
          </div>

          {/* Scanning Animation */}
          <AnimatePresence>
            {isScanning && (
              <motion.div
                initial={{ top: "0%" }}
                animate={{ top: ["0%", "100%", "0%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 w-full h-1 bg-[#00ff66] shadow-[0_0_15px_#00ff66]"
              />
            )}
          </AnimatePresence>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#00f3ff]/50 bg-[#00f3ff]/10 px-4 font-mono text-sm text-[#00f3ff] transition-colors hover:bg-[#00f3ff]/20">
            <Upload className="w-4 h-4" /> {selectedImage ? selectedImage.name : "UPLOAD NOTE IMAGE"}
            <input type="file" accept="image/*" className="sr-only" onChange={(event) => { setSelectedImage(event.target.files?.[0] ?? null); setScanResult("IDLE"); setScreeningError(null); }} />
          </label>
          <button type="button" onClick={captureCameraFrame} disabled={!hasPermission} className="min-h-12 rounded-lg border border-[#00f3ff]/50 px-4 font-mono text-sm text-[#00f3ff] hover:bg-[#00f3ff]/10 disabled:cursor-not-allowed disabled:opacity-50"><Camera className="mr-2 inline size-4" />CAPTURE</button>
          <button
            onClick={handleScan}
            disabled={!selectedImage || isScanning}
            className="min-h-12 bg-[#00ff66]/10 hover:bg-[#00ff66]/20 border border-[#00ff66]/50 text-[#00ff66] font-mono px-5 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ScanLine className="w-5 h-5" /> SCREEN IMAGE
          </button>
        </div>
      </div>

      {/* Right Panel: Analysis Results */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        <div className="bg-black/40 border border-[#333333] rounded-xl flex-grow flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[#333333] bg-[#111111] flex items-center gap-2">
            <Maximize className="w-5 h-5 text-gray-400" />
            <h3 className="font-mono text-sm text-gray-300 uppercase tracking-widest">Analysis Result</h3>
          </div>
          
          <div className="flex-grow p-6 flex flex-col items-center justify-center text-center">
            {isScanning ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-4 text-[#00f3ff]"
              >
                <Scan className="w-16 h-16 animate-spin-slow" />
                <p className="font-mono uppercase tracking-widest text-sm animate-pulse">Running Vision Models...</p>
              </motion.div>
            ) : scanResult === "VERIFIED" ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-4 text-[#00ff66]"
              >
                <CheckCircle2 className="w-20 h-20" />
                <div>
                  <h4 className="font-mono text-xl font-bold tracking-widest">SCREENING RESULT: NO COUNTERFEIT SIGNAL OBSERVED</h4>
                  <p className="text-xs text-gray-400 mt-2 font-mono">This is a non-conclusive screening output and should be reviewed by trained staff.<br/>{confidence !== null ? `Model confidence: ${(confidence * 100).toFixed(1)}%` : "Requires trained model service."}</p>
                </div>
              </motion.div>
            ) : scanResult === "COUNTERFEIT" ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-4 text-[#ff003c]"
              >
                <XCircle className="w-20 h-20 animate-pulse" />
                <div>
                  <h4 className="font-mono text-xl font-bold tracking-widest">SCREENING RESULT: COUNTERFEIT-LIKE PATTERN OBSERVED</h4>
                  <p className="text-xs text-gray-400 mt-2 font-mono text-left bg-black/50 p-2 rounded">
                    This screening output is non-conclusive and should be confirmed by trained staff.<br/>
                    {confidence !== null ? `Model confidence: ${(confidence * 100).toFixed(1)}%` : "Requires trained model service."}<br/>
                    Preserve the note and seek trained examiner verification.
                  </p>
                </div>
              </motion.div>
            ) : (
            <div className="text-gray-500 font-mono text-sm">
              <Scan className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>{screeningError ?? "Upload a note image to run model screening."}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
