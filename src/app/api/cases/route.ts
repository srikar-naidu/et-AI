import { NextRequest, NextResponse } from "next/server";
import { insertRow, isSupabaseConfigured, supabaseRest } from "@/lib/supabase/server";

const VALID_STATUSES = new Set(["open", "triaged", "escalated", "closed"]);
type StoredCase = { id: string; case_number: string };

/* ── Demo cases ─────────────────────────────────────────────────── */

const DEMO_CASES = [
  {
    id: "demo-case-001",
    case_number: "CASE-2026-001",
    title: "Suspected Digital Arrest Scam Network",
    status: "escalated",
    severity: 5,
    source: "citizen_report",
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "demo-case-002",
    case_number: "CASE-2026-002",
    title: "Counterfeit Currency Distribution Ring",
    status: "open",
    severity: 4,
    source: "merchant_complaint",
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "demo-case-003",
    case_number: "CASE-2026-003",
    title: "Deepfake Audio in Extortion Attempt",
    status: "triaged",
    severity: 3,
    source: "platform_detection",
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: "demo-case-004",
    case_number: "CASE-2026-004",
    title: "Phishing SMS Campaign Targeting Bank Customers",
    status: "open",
    severity: 4,
    source: "telecom_report",
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

export async function GET() {
  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      const cases = await supabaseRest<Record<string, unknown>[]>(
        "cases?select=id,case_number,title,status,severity,source,created_at,updated_at&order=created_at.desc&limit=30",
      );
      if (cases.length > 0) {
        return NextResponse.json({ configured: true, cases });
      }
    } catch (error) {
      console.error("Supabase case list failed, using demo data:", error);
    }
  }

  // Fallback: demo data
  return NextResponse.json({ configured: true, cases: DEMO_CASES, mode: "demo" });
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Case storage is not configured yet." },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 160) : "";
    const status = typeof body.status === "string" ? body.status : "open";
    const severity = Number.isInteger(body.severity) ? Math.max(1, Math.min(5, body.severity)) : 2;

    if (!title || !VALID_STATUSES.has(status)) {
      return NextResponse.json({ error: "Provide a case title and valid status." }, { status: 400 });
    }

    const created = (await insertRow("cases", {
      case_number: `CASE-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      title,
      status,
      severity,
      source: "operator",
    })) as unknown as StoredCase;

    await insertRow("audit_events", {
      case_id: created.id,
      event_type: "case.created",
      actor_type: "operator",
      details: { source: "operator" },
    });

    return NextResponse.json({ case: created }, { status: 201 });
  } catch (error) {
    console.error("Case creation error:", error);
    return NextResponse.json({ error: "Could not create case." }, { status: 500 });
  }
}
