"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Fingerprint,
  GitBranch,
  MessageSquareWarning,
  Radar,
  ScrollText,
  ShieldAlert,
} from "lucide-react";
import {
  CALL_FLOWS,
  matchDigitalArrestPatterns,
  PATTERN_LIBRARY_STATS,
  SCAM_PATTERNS,
  SCRIPT_TEMPLATES,
  SPOOF_SIGNATURES,
  type PatternCategory,
} from "@/lib/digital-arrest-patterns";

type TabId = PatternCategory | "matcher";

const TABS: { id: TabId; label: string; icon: typeof Radar }[] = [
  { id: "matcher", label: "Live matcher", icon: Radar },
  { id: "scam_patterns", label: "Scam patterns", icon: ShieldAlert },
  { id: "call_flows", label: "Call flows", icon: GitBranch },
  { id: "spoof_signatures", label: "Spoof signatures", icon: Fingerprint },
  { id: "script_templates", label: "Script templates", icon: ScrollText },
];

const SAMPLE =
  "This is Inspector Sharma from CBI Cyber Cell. Do not disconnect this call. A parcel with narcotics was seized under your Aadhaar. Keep your camera on and do not tell your family. Pay a refundable security deposit to the nodal account for clearance.";

export default function DigitalArrestPatterns() {
  const [tab, setTab] = useState<TabId>("matcher");
  const [input, setInput] = useState(SAMPLE);
  const result = useMemo(() => matchDigitalArrestPatterns(input), [input]);

  const riskColor =
    result.risk === "critical"
      ? "text-[#ff003c] border-[#ff003c]/50"
      : result.risk === "high"
        ? "text-orange-400 border-orange-400/50"
        : result.risk === "elevated"
          ? "text-yellow-400 border-yellow-400/50"
          : "text-[#00ff66] border-[#00ff66]/40";

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 border-b border-[#333] pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#00f3ff]">Digital Arrest Intelligence</p>
          <h2 className="mt-2 font-mono text-2xl font-bold text-white">Pattern Lab</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
            Reference library for AI arrest scam patterns, call-flow sequences, number-spoofing signatures, and script templates.
            Live Call Shield uses the same threat vectors in real time; this module exposes the underlying pattern set for analysts.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ["Patterns", PATTERN_LIBRARY_STATS.scamPatterns],
            ["Flows", PATTERN_LIBRARY_STATS.callFlows],
            ["Spoof sigs", PATTERN_LIBRARY_STATS.spoofSignatures],
            ["Scripts", PATTERN_LIBRARY_STATS.scriptTemplates],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-[#333] bg-black/40 px-3 py-2 text-center">
              <p className="font-mono text-lg font-bold text-white">{value}</p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 font-mono text-xs font-semibold uppercase tracking-wide transition-colors ${
              tab === id
                ? "border-[#00f3ff]/60 bg-[#00f3ff]/10 text-[#00f3ff]"
                : "border-[#333] text-gray-400 hover:border-[#555] hover:text-gray-200"
            }`}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === "matcher" && (
        <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
          <div className="rounded-xl border border-[#333] bg-black/40 p-5">
            <h3 className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-gray-400">
              <MessageSquareWarning className="size-4" /> Transcript / script input
            </h3>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              className="min-h-48 w-full resize-y rounded-lg border border-[#333] bg-[#0a0a0a] p-3 font-mono text-sm leading-6 text-gray-200 outline-none focus:border-[#00f3ff]"
              placeholder="Paste a live call transcript, SMS bridge text, or suspected script…"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setInput(SAMPLE)}
                className="rounded-lg border border-[#333] px-3 py-2 font-mono text-xs text-gray-300 hover:border-[#00f3ff]/50 hover:text-[#00f3ff]"
              >
                Load sample digital-arrest script
              </button>
              <button
                type="button"
                onClick={() => setInput("")}
                className="rounded-lg border border-[#333] px-3 py-2 font-mono text-xs text-gray-300 hover:border-[#555]"
              >
                Clear
              </button>
            </div>
          </div>

          <div className={`rounded-xl border bg-black/40 p-5 ${riskColor}`}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-gray-400">Pattern match score</p>
                <p className="mt-1 font-mono text-3xl font-bold text-white">{result.overallScore}</p>
              </div>
              <p className={`font-mono text-sm font-bold uppercase ${riskColor.split(" ")[0]}`}>{result.risk}</p>
            </div>

            {result.guidance.length > 0 && (
              <div className="mb-4 rounded-lg border border-[#ff003c]/40 bg-[#ff003c]/10 p-3">
                <p className="font-mono text-[11px] uppercase tracking-wider text-[#ff003c]">Victim guidance</p>
                <ul className="mt-2 space-y-1.5 text-sm leading-5 text-gray-200">
                  {result.guidance.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-3">
              {result.hits.length === 0 ? (
                <p className="text-sm text-gray-500">No strong library matches yet.</p>
              ) : (
                result.hits.map((hit) => (
                  <motion.div
                    key={hit.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-[#333] bg-[#0a0a0a] p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono text-sm font-semibold text-white">{hit.title}</p>
                      <span className="font-mono text-xs text-[#00f3ff]">{hit.score}</span>
                    </div>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-gray-500">
                      {hit.layer.replace(/_/g, " ")}
                    </p>
                    <p className="mt-2 text-xs text-gray-400">
                      Matched: {hit.matchedKeywords.join(", ") || "stage heuristics"}
                    </p>
                  </motion.div>
                ))
              )}
            </div>

            {result.activeFlow && (
              <div className="mt-4 rounded-lg border border-[#333] bg-[#0a0a0a] p-3">
                <p className="font-mono text-[11px] uppercase tracking-wider text-gray-500">Active call-flow alignment</p>
                <p className="mt-1 text-sm font-semibold text-white">{result.activeFlow.title}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {result.activeFlow.stages.map((stage) => {
                    const active = result.matchedStages.includes(stage.step);
                    return (
                      <span
                        key={stage.step}
                        className={`rounded border px-2 py-1 font-mono text-[10px] ${
                          active
                            ? "border-[#ff003c]/50 bg-[#ff003c]/10 text-[#ff003c]"
                            : "border-[#333] text-gray-600"
                        }`}
                      >
                        {stage.step}. {stage.action.slice(0, 28)}…
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "scam_patterns" && (
        <div className="grid gap-4 md:grid-cols-2">
          {SCAM_PATTERNS.map((pattern) => (
            <article key={pattern.id} className="rounded-xl border border-[#333] bg-black/40 p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-mono text-base font-bold text-white">{pattern.title}</h3>
                <span
                  className={`font-mono text-[10px] uppercase tracking-wider ${
                    pattern.severity === "critical" ? "text-[#ff003c]" : "text-orange-400"
                  }`}
                >
                  {pattern.severity}
                </span>
              </div>
              <p className="text-sm leading-6 text-gray-300">{pattern.summary}</p>
              <ul className="mt-4 space-y-2 text-sm text-gray-400">
                {pattern.signals.map((signal) => (
                  <li key={signal} className="flex gap-2">
                    <span className="text-[#00f3ff]">▸</span>
                    <span>{signal}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 rounded-lg border border-[#00ff66]/30 bg-[#00ff66]/5 p-3 text-xs leading-5 text-gray-200">
                {pattern.victimAdvice}
              </p>
            </article>
          ))}
        </div>
      )}

      {tab === "call_flows" && (
        <div className="space-y-5">
          {CALL_FLOWS.map((flow) => (
            <article key={flow.id} className="rounded-xl border border-[#333] bg-black/40 p-5">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-mono text-base font-bold text-white">{flow.title}</h3>
                <span className="font-mono text-[10px] uppercase tracking-wider text-gray-500">{flow.durationHint}</span>
              </div>
              <p className="mb-4 text-sm text-gray-400">{flow.summary}</p>
              <ol className="space-y-3">
                {flow.stages.map((stage) => (
                  <li key={stage.step} className="grid gap-1 rounded-lg border border-[#222] bg-[#0a0a0a] p-3 md:grid-cols-[70px_1fr]">
                    <span className="font-mono text-xs text-[#00f3ff]">STEP {stage.step}</span>
                    <div>
                      <p className="text-sm text-white">
                        <span className="font-mono text-[10px] uppercase text-gray-500">{stage.actor} · </span>
                        {stage.action}
                      </p>
                      <p className="mt-1 text-xs text-[#ff003c]/90">{stage.redFlag}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      )}

      {tab === "spoof_signatures" && (
        <div className="grid gap-4 md:grid-cols-2">
          {SPOOF_SIGNATURES.map((spoof) => (
            <article key={spoof.id} className="rounded-xl border border-[#333] bg-black/40 p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="font-mono text-base font-bold text-white">{spoof.title}</h3>
                <span className="rounded border border-[#333] px-2 py-0.5 font-mono text-[10px] uppercase text-[#00f3ff]">
                  {spoof.channel}
                </span>
              </div>
              <p className="text-sm leading-6 text-gray-300">{spoof.signature}</p>
              <p className="mt-4 flex gap-2 text-xs leading-5 text-gray-400">
                <BookOpen className="mt-0.5 size-3.5 shrink-0 text-gray-500" />
                {spoof.howToSpot}
              </p>
            </article>
          ))}
        </div>
      )}

      {tab === "script_templates" && (
        <div className="space-y-4">
          {SCRIPT_TEMPLATES.map((script) => (
            <article key={script.id} className="rounded-xl border border-[#333] bg-black/40 p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-mono text-base font-bold text-white">{script.title}</h3>
                <span className="font-mono text-[10px] uppercase tracking-wider text-gray-500">{script.persona}</span>
              </div>
              <div className="space-y-2 rounded-lg border border-[#222] bg-[#0a0a0a] p-3">
                {script.sampleLines.map((line) => (
                  <p key={line} className="font-mono text-sm leading-6 text-gray-300">
                    “{line}”
                  </p>
                ))}
              </div>
              <p className="mt-3 rounded-lg border border-[#00f3ff]/30 bg-[#00f3ff]/5 p-3 text-xs leading-5 text-gray-200">
                Counter-script: {script.counterScript}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
