"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Phone, PhoneOff, Mic, MicOff, Signal, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

export default function PhonePage() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get("room");

  const [status, setStatus] = useState<"ready" | "connecting" | "connected" | "error">("ready");
  const [errorMsg, setErrorMsg] = useState("");
  const [micMuted, setMicMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<any>(null);
  const dataConnRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const fullTranscriptRef = useRef<string>("");
  const lastResultIndexRef = useRef<number>(0);

  useEffect(() => {
    if (!roomId) {
      setStatus("error");
      setErrorMsg("No room ID provided in URL.");
    }
  }, [roomId]);

  useEffect(() => {
    if (status === "connected") {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  const startCall = async () => {
    if (!roomId) return;
    setStatus("connecting");
    setErrorMsg("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;

      const Peer = (await import("peerjs")).default;
      const peer = new Peer();
      peerRef.current = peer;

      peer.on("open", (id) => {
        console.log("Phone peer ID is: " + id);
        
        // 1. Send Audio Stream
        const call = peer.call(roomId, stream);
        call.on("error", (err) => {
          setStatus("error");
          setErrorMsg("Call dropped: " + err.message);
        });
        call.on("close", () => endCall());

        // 2. Open Data Connection for Transcript
        const conn = peer.connect(roomId);
        dataConnRef.current = conn;

        conn.on("open", () => {
          setStatus("connected");
          startSpeechRecognition(conn);
        });
        
        conn.on("error", (err) => {
          console.error("Data connection error:", err);
        });
      });

      peer.on("error", (err) => {
        setStatus("error");
        setErrorMsg("Connection error: " + err.message);
      });

    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMsg("Microphone access denied or unavailable.");
    }
  };

  const startSpeechRecognition = (conn: any) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN"; // Good default for India

    recognition.onresult = (event: any) => {
      let finalT = "";
      let interimT = "";
      // Only process new results starting from lastResultIndexRef.current
      for (let i = lastResultIndexRef.current; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalT += result[0].transcript + " ";
          lastResultIndexRef.current = i + 1; // Update since this result is final
        } else {
          interimT += result[0].transcript;
        }
      }

      // If we got final text, add to full transcript
      if (finalT) {
        fullTranscriptRef.current = fullTranscriptRef.current + finalT;
      }

      const fullText = (fullTranscriptRef.current + interimT).trim();

      if (conn && conn.open) {
        conn.send({ type: "transcript", text: fullText, isFinal: !!finalT });
      }
    };

    recognition.onerror = (e: any) => {
      if (e.error === "no-speech") return;
      console.error("Speech rec error:", e);
    };

    recognition.onend = () => {
      if (status === "connected") {
        try { recognition.start(); } catch (e) {}
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    fullTranscriptRef.current = ""; // reset transcript for next call
    lastResultIndexRef.current = 0; // reset result index for next call
    setStatus("ready");
    setCallDuration(0);
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicMuted(!audioTrack.enabled);
      }
    }
  };

  if (!roomId) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0a0a0a] text-white p-6 font-mono text-center">
        <div className="max-w-md rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
          <AlertTriangle className="mx-auto mb-4 size-12 text-red-500" />
          <h1 className="mb-2 text-xl font-bold">Invalid Call Link</h1>
          <p className="text-sm text-gray-400">Please use the exact link from the VoiceShield dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-between bg-black text-white p-8">
      {/* Top Bar */}
      <div className="flex w-full justify-between px-2 text-gray-400">
        <span className="text-sm font-semibold">RUBIX WebRTC</span>
        <div className="flex items-center gap-2">
          <Signal className="size-4 text-green-400" />
          <span className="text-xs">Secure</span>
        </div>
      </div>

      {/* Caller Info */}
      <div className="mt-16 flex flex-col items-center text-center">
        <div className="mb-6 flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-gray-800 to-gray-900 shadow-2xl border border-gray-700">
          <Phone className="size-10 text-gray-400" />
        </div>
        <h1 className="text-3xl font-light tracking-wide text-white">Live Intercept</h1>
        <p className="mt-2 text-lg text-gray-400 font-mono">
          {status === "ready" && "Ready to Connect"}
          {status === "connecting" && "Connecting..."}
          {status === "connected" && formatTime(callDuration)}
          {status === "error" && "Call Failed"}
        </p>
        {status === "error" && (
          <div className="mt-4 max-w-xs">
            <p className="text-sm text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-400/20">{errorMsg}</p>
            <p className="text-xs text-yellow-500 mt-3">
              Note: Make sure you have the VoiceShield dashboard open and waiting for a connection with the same Room ID. Both devices need internet access!
            </p>
          </div>
        )}
        {status === "ready" && (
          <p className="text-xs text-gray-500 mt-3">
            Tap Start to connect to VoiceShield with Room ID: <span className="text-yellow-400 font-mono">{roomId}</span>
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="mb-12 flex w-full max-w-xs justify-center gap-6">
        {status === "connected" && (
          <button
            onClick={toggleMic}
            className={`flex size-16 items-center justify-center rounded-full transition-all ${
              micMuted ? "bg-white text-black" : "bg-gray-800/80 text-white hover:bg-gray-700"
            }`}
          >
            {micMuted ? <MicOff className="size-6" /> : <Mic className="size-6" />}
          </button>
        )}

        {status === "ready" || status === "error" ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startCall}
            className="flex size-16 items-center justify-center rounded-full bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]"
          >
            <Phone className="size-6" />
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={endCall}
            className="flex size-16 items-center justify-center rounded-full bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]"
          >
            <PhoneOff className="size-6" />
          </motion.button>
        )}
      </div>
    </div>
  );
}
