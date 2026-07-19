"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Upload, AudioLines, FileAudio, AlertTriangle, BrainCircuit, Mic, Square } from "lucide-react";
import { AudioPrepError, prepareAudioForAurigin } from "@/lib/audio-to-wav";

interface AnalysisResult {
  transcript: string;
  verdict: string;
  authenticity: "spoofed" | "real" | "unknown";
  confidence: number | null;
  authenticityError?: string;
}

/** Below this, a "real" verdict is treated as weak / inconclusive in the UI. */
const STRONG_AUTH_CONFIDENCE = 0.85;

function authenticityLabel(result: AnalysisResult) {
  if (result.authenticity === "spoofed") {
    return {
      title: "POSSIBLE SYNTHETIC / SPOOFED VOICE",
      tone: "danger" as const,
      detail:
        result.confidence !== null
          ? `Aurigin confidence: ${(result.confidence * 100).toFixed(1)}%. Screening signal only — modern TTS and speaker→mic re-recordings can still be missed or mislabeled.`
          : "Screening signal only — not conclusive proof.",
    };
  }

  if (result.authenticity === "real") {
    const weak = result.confidence !== null && result.confidence < STRONG_AUTH_CONFIDENCE;
    if (weak) {
      return {
        title: "WEAK / INCONCLUSIVE — NO CLEAR SPOOF ARTIFACTS",
        tone: "warn" as const,
        detail: `Aurigin leaned “real” at only ${(result.confidence! * 100).toFixed(1)}% confidence. That does not prove a human spoke. High-quality AI voices (e.g. Gemini TTS) and clips recorded off a speaker often strip the digital artifacts detectors need — treat this as inconclusive and rely on the threat assessment + human review.`,
      };
    }
    return {
      title: "NO STRONG SPOOF ARTIFACTS DETECTED",
      tone: "ok" as const,
      detail: `Aurigin confidence: ${(result.confidence! * 100).toFixed(1)}%. Still not proof of a human voice — replayed or polished TTS can evade detectors. Cross-check the transcript threat assessment.`,
    };
  }

  return {
    title: "NOT AVAILABLE",
    tone: "neutral" as const,
    detail: result.authenticityError ?? "Voice-authenticity screening did not return a usable result.",
  };
}

export default function DeepfakeAnalyzer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number>(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);

  // Cleanup Web Audio API on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current?.state !== "closed") {
        audioContextRef.current?.close();
      }
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
      // Reset canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      recorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = () => {
        const recording = new File([new Blob(chunks, { type: recorder.mimeType || "audio/webm" })], `voice-sample-${Date.now()}.webm`, { type: recorder.mimeType || "audio/webm" });
        setSelectedFile(recording);
        setResult(null);
        setIsRecording(false);
        stream.getTracks().forEach((track) => track.stop());
      };
      recordingStreamRef.current = stream;
      recorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      setResult({ transcript: "Microphone access was not granted.", verdict: "Recordings stay in your browser until you run analysis.", authenticity: "unknown", confidence: null });
    }
  };

  const drawVisualizer = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i];
        
        // Deepfake aesthetic: cyan bars
        ctx.fillStyle = `rgb(0, ${Math.min(255, barHeight + 50)}, 255)`;
        ctx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);

        x += barWidth + 1;
      }
    };

    draw();
  };

  const startAnalysis = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setResult(null);

    // 1. Setup Web Audio API for visualizer
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    // Resume context if suspended (browser policy)
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    audioRef.current.src = URL.createObjectURL(selectedFile);
    
    if (!analyserRef.current) {
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
    }

    if (!sourceRef.current) {
      sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
    }

    audioRef.current.play();
    drawVisualizer();

    try {
      // 2. Transcribe via Groq Whisper
      const formData = new FormData();
      formData.append("file", selectedFile);
      
      const transcribeRes = await fetch("/api/transcribe", {
        method: "POST",
        body: formData
      });
      
      const transcribeData = await transcribeRes.json();
      
      if (!transcribeRes.ok) throw new Error(transcribeData.error);
      const transcript = transcribeData.text;

      // Aurigin rejects browser WebM; convert to mono 16 kHz WAV first (same approach as Aurigin's own docs).
      let authenticityPromise: Promise<{ ok: boolean; payload: Record<string, unknown> }>;
      try {
        const wavFile = await prepareAudioForAurigin(selectedFile, selectedFile.name);
        const authenticityForm = new FormData();
        authenticityForm.append("file", wavFile);
        authenticityPromise = fetch("/api/deepfake", { method: "POST", body: authenticityForm })
          .then(async (response) => ({ ok: response.ok, payload: await response.json() }))
          .catch(() => ({ ok: false, payload: { error: "Voice-authenticity screening could not be reached." } }));
      } catch (prepError) {
        const message =
          prepError instanceof AudioPrepError
            ? prepError.message
            : "Could not prepare audio for authenticity screening.";
        authenticityPromise = Promise.resolve({ ok: false, payload: { error: message, result: "unknown" } });
      }

      // 3. Analyze Transcript for Social Engineering/Deepfake context via Groq LLM
      const analyzeRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: "en",
          messages: [
            {
              role: "user",
              content: `Analyze this exact transcript for signs of a deepfake audio scam (e.g., grandparent scam, kidnapping, urgent financial request from a known person). Focus ONLY on the content context. Transcript: "${transcript}"`
            }
          ]
        })
      });

      const analyzeData = await analyzeRes.json();
      if (!analyzeRes.ok) throw new Error(analyzeData.error);
      const authenticity = await authenticityPromise;
      const authenticityResult =
        authenticity.payload.result === "spoofed" || authenticity.payload.result === "real"
          ? authenticity.payload.result
          : "unknown";
      const authenticityConfidence =
        authenticityResult !== "unknown" && typeof authenticity.payload.confidence === "number"
          ? authenticity.payload.confidence
          : null;

      setResult({
        transcript,
        verdict: analyzeData.reply,
        authenticity: authenticityResult,
        confidence: authenticityConfidence,
        authenticityError:
          authenticityResult === "unknown"
            ? (typeof authenticity.payload.error === "string"
                ? authenticity.payload.error
                : "Voice-authenticity screening is unavailable.")
            : undefined,
      });

    } catch (err: any) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Analysis failed.";
      setResult({
        transcript: "Error transcribing audio.",
        verdict: "Error: " + message,
        authenticity: "unknown",
        confidence: null,
      });
    } finally {
      setIsAnalyzing(false);
      // We keep the audio playing until it finishes, but visualizer stops if we wanted to
      // For now, let it run until audio ends
    }
  };

  return (
    <div className="w-full h-full flex flex-col md:flex-row gap-6">
      {/* Left Panel: Audio Input & Visualizer */}
      <div className="w-full md:w-1/2 flex flex-col gap-6">
        <div className="bg-black/40 border border-[#333333] rounded-xl p-6 flex flex-col">
          <h3 className="font-mono text-sm text-gray-300 uppercase tracking-widest mb-4 flex items-center gap-2">
            <AudioLines className="w-4 h-4" /> Real-Time Audio Extraction
          </h3>
          
          <div className="border-2 border-dashed border-[#333] hover:border-[#00f3ff] transition-colors rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer relative group">
            <input 
              type="file" 
              accept="audio/*" 
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            {selectedFile ? (
              <div className="text-[#00f3ff] flex flex-col items-center">
                <FileAudio className="w-12 h-12 mb-3" />
                <p className="font-mono text-sm">{selectedFile.name}</p>
                <p className="font-mono text-xs text-gray-500 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <div className="text-gray-500 group-hover:text-[#00f3ff] flex flex-col items-center transition-colors">
                <Upload className="w-12 h-12 mb-3" />
                <p className="font-mono text-sm">Drag & Drop Audio File</p>
                <p className="font-mono text-xs mt-1">MP3 / WAV preferred · WebM auto-converted · min 3s</p>
              </div>
            )}
          </div>

          <button type="button" onClick={toggleRecording} className={`mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border font-mono text-sm font-bold transition-colors ${isRecording ? "border-[#ff003c] bg-[#ff003c]/10 text-[#ff003c]" : "border-[#00f3ff]/50 text-[#00f3ff] hover:bg-[#00f3ff]/10"}`}>
            {isRecording ? <><Square className="size-4" /> STOP RECORDING</> : <><Mic className="size-4" /> RECORD AUDIO SAMPLE</>}
          </button>

          <div className="mt-6 bg-[#0a0a0a] border border-[#222] rounded-lg p-4 h-32 relative overflow-hidden flex items-center justify-center">
            {/* Visualizer Canvas */}
            <canvas 
              ref={canvasRef} 
              width={400} 
              height={100}
              className="w-full h-full object-cover"
            />
            {!selectedFile && !isAnalyzing && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-600 font-mono text-xs uppercase tracking-widest">
                Awaiting Audio Data
              </div>
            )}
          </div>
          
          <button
            onClick={startAnalysis}
            disabled={isAnalyzing || !selectedFile}
            className="w-full mt-6 bg-[#00f3ff]/10 hover:bg-[#00f3ff]/20 border border-[#00f3ff]/50 text-[#00f3ff] font-mono font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 z-20"
          >
            {isAnalyzing ? (
              <span className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 animate-spin" /> EXTRACTING FREQUENCIES...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5" /> RUN DEEPFAKE ANALYSIS
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Right Panel: Analysis Results */}
      <div className="w-full md:w-1/2 flex flex-col gap-6">
        {result ? (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-black/40 border border-[#00f3ff]/50 rounded-xl p-6 flex flex-col flex-grow"
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#333333]">
              <div className="flex items-center gap-4">
                <BrainCircuit className="w-10 h-10 text-[#00f3ff]" />
                <div>
                  <h2 className="font-mono text-xl font-bold text-[#00f3ff] uppercase">Audio integrity review</h2>
                  <p className="text-gray-400 font-mono text-xs mt-1 tracking-wider">Voice authenticity + scam-context screening</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6 flex-grow">
              {(() => {
                const auth = authenticityLabel(result);
                const boxClass =
                  auth.tone === "danger"
                    ? "border-[#ff003c]/60 bg-[#ff003c]/10"
                    : auth.tone === "warn"
                      ? "border-[#ffb020]/60 bg-[#ffb020]/10"
                      : auth.tone === "ok"
                        ? "border-[#00ff66]/40 bg-[#00ff66]/5"
                        : "border-[#333] bg-[#111]";
                return (
                  <div className={`rounded-lg border p-4 ${boxClass}`}>
                    <p className="font-mono text-xs uppercase tracking-widest text-gray-400">Screening signal (non-conclusive)</p>
                    <p className="mt-2 font-mono text-lg font-bold text-white">{auth.title}</p>
                    <p className="mt-2 text-xs leading-5 text-gray-300">{auth.detail}</p>
                  </div>
                );
              })()}
              <div>
                <h3 className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <FileAudio className="w-3 h-3" /> Groq Whisper Transcript
                </h3>
                <div className="bg-[#0a0a0a] border border-[#222] p-4 rounded-lg font-mono text-sm text-gray-300 min-h-[80px]">
                  "{result.transcript}"
                </div>
              </div>

              <div className="flex-grow flex flex-col">
                <h3 className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3" /> AI Threat Assessment
                </h3>
                <div className="bg-[#111] border border-[#333] p-4 rounded-lg font-sans text-sm text-gray-200 leading-relaxed flex-grow whitespace-pre-wrap">
                  {result.verdict}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="bg-black/40 border border-[#333333] rounded-xl flex-grow flex flex-col items-center justify-center text-gray-500 font-mono text-sm p-6 text-center">
            <AudioLines className="w-12 h-12 mb-4 opacity-30" />
            <p>Upload an audio file to begin deepfake frequency extraction...</p>
          </div>
        )}
      </div>
    </div>
  );
}
