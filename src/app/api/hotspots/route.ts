import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseRest } from "@/lib/supabase/server";

type ComplaintRow = {
  id: string;
  incident_type: string;
  location_label: string | null;
  latitude: number;
  longitude: number;
  created_at: string;
};

function getRangeStart(range: string) {
  const now = new Date();
  switch (range) {
    case "hour":
      return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    case "day":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    case "week":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    default:
      return null;
  }
}

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ configured: false, hotspots: [] });
  }

  try {
    const range = request.nextUrl.searchParams.get("range") ?? "all";
    const rangeStart = getRangeStart(range);
    const createdAtFilter = rangeStart ? `&created_at=gte.${encodeURIComponent(rangeStart)}` : "";

    const complaints = await supabaseRest<ComplaintRow[]>(
      `complaints?select=id,incident_type,location_label,latitude,longitude,created_at&latitude=not.is.null&longitude=not.is.null${createdAtFilter}&order=created_at.desc&limit=500`,
    );
    const groups = new Map<string, ComplaintRow[]>();
    for (const complaint of complaints) {
      const key = `${complaint.latitude.toFixed(2)},${complaint.longitude.toFixed(2)},${complaint.incident_type}`;
      groups.set(key, [...(groups.get(key) ?? []), complaint]);
    }

    const hotspots = [...groups.values()].map((items) => ({
      id: items[0].id,
      latitude: items[0].latitude,
      longitude: items[0].longitude,
      incidentType: items[0].incident_type,
      locationLabel: items[0].location_label ?? "Approximate reported area",
      reportCount: items.length,
      latestReportAt: items[0].created_at,
    }));

    return NextResponse.json({ configured: true, range, hotspots, polledAt: new Date().toISOString() });
  } catch (error) {
    console.error("Hotspot request error:", error);
    return NextResponse.json({ error: "Could not load incident hotspots." }, { status: 500 });
  }
}
