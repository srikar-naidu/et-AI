"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { Download, FileUp, FolderSearch, ShieldCheck, Timer } from "lucide-react";

type CaseSummary = { id: string; case_number: string; title: string; status: string; severity: number; created_at: string };
type CaseDetail = { case: CaseSummary; events: Array<{ id: string; event_type: string; actor_type: string; created_at: string }>; evidence: Array<{ id: string; original_filename: string; byte_size: number; sha256: string; created_at: string }> };

export default function CaseConsole() {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [selected, setSelected] = useState<CaseDetail | null>(null);
  const [message, setMessage] = useState("Loading secure case records…");
  const [isUploading, setIsUploading] = useState(false);

  async function loadCases() {
    try {
      const response = await fetch("/api/cases", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not load cases.");
      setCases(payload.cases ?? []);
      setMessage(payload.configured ? "Select a case to inspect its audit timeline." : "Connect Supabase to activate secure case storage.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load cases.");
    }
  }

  async function selectCase(caseId: string) {
    try {
      const response = await fetch(`/api/cases/${caseId}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not load case.");
      setSelected(payload);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load case.");
    }
  }

  async function uploadEvidence(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !selected) return;
    setIsUploading(true);
    try {
      const data = new FormData();
      data.append("caseId", selected.case.id);
      data.append("file", file);
      const response = await fetch("/api/evidence", { method: "POST", body: data });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not store evidence.");
      await selectCase(selected.case.id);
      setMessage("Evidence stored with a SHA-256 integrity hash.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not store evidence.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  useEffect(() => { void loadCases(); }, []);

  return <section className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[300px_1fr]">
    <aside className="rounded-xl border border-[#333] bg-black/30 p-5"><div className="flex items-center gap-2 text-[#00f3ff]"><FolderSearch className="size-5" /><h2 className="font-mono text-sm font-bold">CASE QUEUE</h2></div><div className="mt-5 space-y-2">{cases.map((item) => <button key={item.id} onClick={() => void selectCase(item.id)} className={`w-full rounded-lg border p-3 text-left ${selected?.case.id === item.id ? "border-[#00f3ff] bg-[#00f3ff]/10" : "border-[#333] hover:border-[#00f3ff]/50"}`}><p className="font-mono text-xs text-[#00f3ff]">{item.case_number}</p><p className="mt-1 text-sm font-semibold text-white">{item.title}</p><p className="mt-1 text-xs text-gray-400">{item.status} · severity {item.severity}/5</p></button>)}</div></aside>
    <div className="rounded-xl border border-[#333] bg-black/30 p-5 sm:p-6">{selected ? <><div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#333] pb-5"><div><p className="font-mono text-xs text-[#00f3ff]">{selected.case.case_number}</p><h2 className="mt-1 text-xl font-bold text-white">{selected.case.title}</h2><p className="mt-1 text-sm text-gray-400">Created {new Date(selected.case.created_at).toLocaleString()}</p></div><a href={`/api/cases/${selected.case.id}/export`} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#00f3ff]/50 px-3 text-sm font-semibold text-[#00f3ff] hover:bg-[#00f3ff]/10"><Download className="size-4" /> Export bundle</a></div><div className="mt-6 grid gap-6 md:grid-cols-2"><div><div className="flex items-center gap-2"><Timer className="size-4 text-[#00f3ff]" /><h3 className="font-mono text-sm font-bold text-white">Audit timeline</h3></div><ol className="mt-4 space-y-3">{selected.events.map((event) => <li key={event.id} className="border-l border-[#00f3ff]/40 pl-3"><p className="text-sm text-white">{event.event_type}</p><p className="text-xs text-gray-500">{event.actor_type} · {new Date(event.created_at).toLocaleString()}</p></li>)}</ol></div><div><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><ShieldCheck className="size-4 text-[#00ff66]" /><h3 className="font-mono text-sm font-bold text-white">Evidence integrity</h3></div><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#00f3ff]/50 px-3 py-2 text-xs font-semibold text-[#00f3ff] hover:bg-[#00f3ff]/10"><FileUp className="size-4" /> {isUploading ? "Storing…" : "Add file"}<input className="sr-only" type="file" disabled={isUploading} onChange={uploadEvidence} /></label></div><ul className="mt-4 space-y-3">{selected.evidence.map((item) => <li key={item.id} className="rounded-lg border border-[#333] p-3"><p className="text-sm font-medium text-white">{item.original_filename}</p><p className="mt-1 break-all font-mono text-[11px] text-gray-500">SHA-256: {item.sha256}</p></li>)}</ul></div></div></> : <div className="flex min-h-96 flex-col items-center justify-center text-center"><FolderSearch className="mb-4 size-12 text-gray-600" /><p className="max-w-md text-sm leading-6 text-gray-400">{message}</p></div>}</div>
  </section>;
}
