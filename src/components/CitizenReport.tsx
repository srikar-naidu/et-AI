"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, LocateFixed, MapPin, Send, ShieldAlert } from "lucide-react";

type IncidentType = "digital_arrest" | "phishing" | "counterfeit" | "deepfake" | "other";

export default function CitizenReport() {
  const [incidentType, setIncidentType] = useState<IncidentType>("digital_arrest");
  const [description, setDescription] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [state, setState] = useState<"idle" | "locating" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  function useLocation() {
    if (!navigator.geolocation) {
      setState("error");
      setMessage("Location is unavailable in this browser. Enter your area manually.");
      return;
    }

    setState("locating");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCoordinates({ latitude: coords.latitude, longitude: coords.longitude });
        setState("idle");
        setMessage("Approximate location attached. You can still add an area name below.");
      },
      () => {
        setState("error");
        setMessage("Location was not shared. You can report without it or add an area manually.");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incidentType, description, locationLabel, ...coordinates }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not submit your report.");

      setState("success");
      setMessage(`Report saved as ${payload.caseNumber}. Keep this reference for follow-up.`);
      setDescription("");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Could not submit your report.");
    }
  }

  return (
    <section className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1.15fr_.85fr]">
      <form onSubmit={submitReport} className="rounded-xl border border-[#00f3ff]/35 bg-black/35 p-5 sm:p-6">
        <div className="mb-6 flex items-start gap-3">
          <ShieldAlert className="mt-0.5 size-6 shrink-0 text-[#00f3ff]" aria-hidden="true" />
          <div>
            <h2 className="font-mono text-lg font-bold text-white">Report a suspicious incident</h2>
            <p className="mt-1 text-sm leading-6 text-gray-300">This creates a secure case record. Do not include passwords, PINs, OTPs, or full account numbers.</p>
          </div>
        </div>

        <label className="mb-4 block text-sm font-medium text-gray-200">
          Incident type
          <select value={incidentType} onChange={(event) => setIncidentType(event.target.value as IncidentType)} className="mt-2 w-full rounded-lg border border-[#333] bg-[#0a0a0a] px-3 py-2.5 text-white outline-none focus:border-[#00f3ff]">
            <option value="digital_arrest">Digital arrest / impersonation</option>
            <option value="phishing">Phishing link or message</option>
            <option value="counterfeit">Suspected counterfeit currency</option>
            <option value="deepfake">Suspected AI-generated voice</option>
            <option value="other">Other digital fraud</option>
          </select>
        </label>

        <label className="mb-4 block text-sm font-medium text-gray-200">
          What happened?
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} required minLength={20} maxLength={4000} placeholder="Include what was claimed, the channel used, and any non-sensitive evidence." className="mt-2 min-h-36 w-full resize-y rounded-lg border border-[#333] bg-[#0a0a0a] p-3 text-sm leading-6 text-white outline-none placeholder:text-gray-500 focus:border-[#00f3ff]" />
        </label>

        <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto]">
          <label className="text-sm font-medium text-gray-200">
            Area or landmark <span className="font-normal text-gray-500">(optional)</span>
            <input value={locationLabel} onChange={(event) => setLocationLabel(event.target.value)} maxLength={160} placeholder="e.g. Indiranagar, Bengaluru" className="mt-2 w-full rounded-lg border border-[#333] bg-[#0a0a0a] px-3 py-2.5 text-white outline-none placeholder:text-gray-500 focus:border-[#00f3ff]" />
          </label>
          <button type="button" onClick={useLocation} disabled={state === "locating"} className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#00f3ff]/55 px-4 text-sm font-semibold text-[#00f3ff] transition-colors hover:bg-[#00f3ff]/10 disabled:cursor-not-allowed disabled:opacity-50">
            <LocateFixed className="size-4" aria-hidden="true" /> {state === "locating" ? "Locating…" : "Use location"}
          </button>
        </div>

        {message && <p role="status" className={`mb-4 rounded-lg p-3 text-sm ${state === "success" ? "bg-[#00ff66]/10 text-[#00ff66]" : "bg-[#ff003c]/10 text-red-200"}`}>{message}</p>}

        <button type="submit" disabled={state === "submitting"} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#00f3ff] px-4 font-mono text-sm font-bold text-black transition-colors hover:bg-[#63f7ff] disabled:cursor-not-allowed disabled:opacity-60">
          <Send className="size-4" aria-hidden="true" /> {state === "submitting" ? "Saving report…" : "Create secure case"}
        </button>
      </form>

      <aside className="flex flex-col justify-between rounded-xl border border-[#333] bg-black/30 p-5 sm:p-6">
        <div>
          <MapPin className="mb-4 size-7 text-[#00f3ff]" aria-hidden="true" />
          <h3 className="font-mono text-base font-bold text-white">What happens next</h3>
          <ol className="mt-4 space-y-4 text-sm leading-6 text-gray-300">
            <li><span className="mr-2 font-mono text-[#00f3ff]">01</span>Your report is assigned a reference number.</li>
            <li><span className="mr-2 font-mono text-[#00f3ff]">02</span>Non-sensitive location information can inform the anonymised incident map.</li>
            <li><span className="mr-2 font-mono text-[#00f3ff]">03</span>Keep screenshots and transaction evidence for an official cybercrime complaint.</li>
          </ol>
        </div>
        <div className="mt-8 rounded-lg bg-[#00ff66]/[.07] p-4 text-sm leading-6 text-gray-200">
          <CheckCircle2 className="mb-2 size-5 text-[#00ff66]" aria-hidden="true" />
          This tool helps organise evidence. It does not replace emergency services or an official complaint.
        </div>
      </aside>
    </section>
  );
}
