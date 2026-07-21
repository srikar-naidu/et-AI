import { NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseRest } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ configured: false, session: null });
  }
  try {
    // Get time 10 minutes ago (on each request)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const sessions = await supabaseRest<Record<string, unknown>[]>(
      `live_call_sessions?select=call_sid,caller,status,transcript,updated_at,created_at,error_message&order=updated_at.desc&limit=1&created_at=gte.${encodeURIComponent(tenMinutesAgo)}`,
    );
    return NextResponse.json({ configured: true, session: sessions[0] ?? null });
  } catch (error) {
    console.error("Live call session fetch error:", error);
    return NextResponse.json({ configured: false, session: null, error: "Live call storage is unavailable." }, { status: 503 });
  }
}
