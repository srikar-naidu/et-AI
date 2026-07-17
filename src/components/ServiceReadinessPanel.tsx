"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, KeyRound, ShieldCheck, ServerCrash } from "lucide-react";

type ServiceState = {
  label: string;
  status: "configured" | "needs-key" | "needs-migration" | "needs-model" | "degraded";
  detail: string;
};

export default function ServiceReadinessPanel() {
  const [services, setServices] = useState<ServiceState[]>([]);

  useEffect(() => {
    async function loadStatus() {
      try {
        const response = await fetch("/api/health", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Health status unavailable");
        setServices(payload.services as ServiceState[]);
      } catch {
        setServices([
          {
            label: "Command center",
            status: "degraded",
            detail: "Health endpoint unavailable. Verify server startup and environment variables.",
          },
        ]);
      }
    }

    void loadStatus();
  }, []);

  const iconForStatus = (status: ServiceState["status"]) => {
    switch (status) {
      case "configured":
        return <CheckCircle2 className="size-4 text-[#00ff66]" />;
      case "needs-key":
      case "needs-model":
        return <KeyRound className="size-4 text-amber-400" />;
      case "needs-migration":
        return <ShieldCheck className="size-4 text-[#00f3ff]" />;
      default:
        return <AlertTriangle className="size-4 text-[#ff003c]" />;
    }
  };

  return (
    <section className="mt-8 rounded-xl border border-[#333] bg-black/35 p-5">
      <div className="flex items-center gap-2 text-[#00f3ff]">
        <Activity className="size-5" />
        <h2 className="font-mono text-sm font-bold uppercase tracking-[0.24em]">Service readiness</h2>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {services.map((service) => (
          <div key={service.label} className="rounded-lg border border-[#222] bg-[#111] p-3">
            <div className="flex items-center gap-2">
              {iconForStatus(service.status)}
              <p className="text-sm font-semibold text-white">{service.label}</p>
            </div>
            <p className="mt-2 text-sm text-gray-400">{service.detail}</p>
          </div>
        ))}
        {!services.length && (
          <div className="rounded-lg border border-[#222] bg-[#111] p-3 md:col-span-2">
            <div className="flex items-center gap-2 text-[#ff003c]">
              <ServerCrash className="size-4" />
              <p className="text-sm font-semibold text-white">Awaiting readiness check</p>
            </div>
            <p className="mt-2 text-sm text-gray-400">The app is still booting and will report service states once the endpoint responds.</p>
          </div>
        )}
      </div>
    </section>
  );
}
