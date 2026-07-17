import { NextRequest, NextResponse } from "next/server";
import { insertRow, isSupabaseConfigured, supabaseRest } from "@/lib/supabase/server";

const VALID_STATUSES = new Set(["open", "triaged", "escalated", "closed"]);
type StoredCase = { id: string; case_number: string };

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ configured: false, cases: [] });
  }

  try {
    const cases = await supabaseRest<Record<string, unknown>[]>(
      "cases?select=id,case_number,title,status,severity,source,created_at,updated_at&order=created_at.desc&limit=30",
    );
    return NextResponse.json({ configured: true, cases });
  } catch (error) {
    console.error("Case list error:", error);
    return NextResponse.json({ error: "Could not load cases." }, { status: 500 });
  }
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
