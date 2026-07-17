import { NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseRest } from "@/lib/supabase/server";

type ComplaintRow = {
  id: string;
  incident_type: string;
  location_label: string | null;
  latitude: number;
  longitude: number;
  created_at: string;
};

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ configured: false, hotspots: [] });
  }

  try {
    const complaints = await supabaseRest<ComplaintRow[]>(
      "complaints?select=id,incident_type,location_label,latitude,longitude,created_at&latitude=not.is.null&longitude=not.is.null&order=created_at.desc&limit=500",
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

    return NextResponse.json({ configured: true, hotspots });
  } catch (error) {
    console.error("Hotspot request error:", error);
    return NextResponse.json({ error: "Could not load incident hotspots." }, { status: 500 });
  }
}
