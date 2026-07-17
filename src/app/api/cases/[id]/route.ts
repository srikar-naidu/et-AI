import { NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseRest } from "@/lib/supabase/server";

export async function GET(_request: Request, context: RouteContext<"/api/cases/[id]">) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Case storage is not configured yet." }, { status: 503 });
  const { id } = await context.params;
  try {
    const [cases, events, evidence] = await Promise.all([
      supabaseRest<Record<string, unknown>[]>(`cases?select=*&id=eq.${encodeURIComponent(id)}&limit=1`),
      supabaseRest<Record<string, unknown>[]>(`audit_events?select=*&case_id=eq.${encodeURIComponent(id)}&order=created_at.desc`),
      supabaseRest<Record<string, unknown>[]>(`evidence_items?select=id,original_filename,content_type,byte_size,sha256,source,created_at&case_id=eq.${encodeURIComponent(id)}&order=created_at.desc`),
    ]);
    if (!cases[0]) return NextResponse.json({ error: "Case not found." }, { status: 404 });
    return NextResponse.json({ case: cases[0], events, evidence });
  } catch (error) {
    console.error("Case detail error:", error);
    return NextResponse.json({ error: "Could not load case details." }, { status: 500 });
  }
}
