import { NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseRest } from "@/lib/supabase/server";

export async function GET(_request: Request, context: RouteContext<"/api/cases/[id]/export">) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Case storage is not configured yet." }, { status: 503 });
  const { id } = await context.params;
  try {
    const [cases, events, evidence, complaints] = await Promise.all([
      supabaseRest<Record<string, unknown>[]>(`cases?select=*&id=eq.${encodeURIComponent(id)}&limit=1`),
      supabaseRest<Record<string, unknown>[]>(`audit_events?select=*&case_id=eq.${encodeURIComponent(id)}&order=created_at.asc`),
      supabaseRest<Record<string, unknown>[]>(`evidence_items?select=id,original_filename,content_type,byte_size,sha256,source,created_at&case_id=eq.${encodeURIComponent(id)}&order=created_at.asc`),
      supabaseRest<Record<string, unknown>[]>(`complaints?select=incident_type,description,location_label,created_at&case_id=eq.${encodeURIComponent(id)}&order=created_at.asc`),
    ]);
    if (!cases[0]) return NextResponse.json({ error: "Case not found." }, { status: 404 });
    return NextResponse.json({ exported_at: new Date().toISOString(), export_scope: "metadata and audit timeline only; binary evidence remains in protected storage", case: cases[0], complaints, evidence, audit_timeline: events }, { headers: { "Content-Disposition": `attachment; filename="case-${id}-bundle.json"` } });
  } catch (error) {
    console.error("Case export error:", error);
    return NextResponse.json({ error: "Could not create case export." }, { status: 500 });
  }
}
