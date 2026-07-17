import { NextResponse } from "next/server";
import { getSupabaseClient, isSupabaseClientConfigured } from "@/lib/supabase/client";

export async function GET() {
  if (!isSupabaseClientConfigured()) {
    return NextResponse.json({ configured: false, user: null });
  }

  const client = getSupabaseClient();
  if (!client) {
    return NextResponse.json({ configured: false, user: null });
  }

  const { data } = await client.auth.getUser();
  return NextResponse.json({ configured: true, user: data.user });
}
