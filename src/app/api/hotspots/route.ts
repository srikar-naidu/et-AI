
import { NextRequest, NextResponse } from "next/server";
import { getCityCoords } from "@/lib/city-coords";
import Papa from "papaparse";
import fs from "fs/promises";
import path from "path";

type RawCSVRow = {
  Year: string;
  Day: string;
  Amount_Lost_INR: string;
  Incident_Type: string;
  City: string;
  Category: string;
};

type ComplaintRow = {
  id: string;
  incident_type: string;
  location_label: string | null;
  latitude: number;
  longitude: number;
  created_at: string;
};

async function loadCyberSecurityDataset(): Promise<ComplaintRow[]> {
  const csvPath = path.join(process.cwd(), "data/processed/geospatial/cybersecurity_cases_india_combined.csv");
  const csvContent = await fs.readFile(csvPath, "utf8");

  const parsed = Papa.parse<RawCSVRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  const results: ComplaintRow[] = [];

  for (const row of parsed.data) {
    if (!row.City || !row.Incident_Type || !row.Year) continue;

    // Map incident types to our system
    let incidentType: string;
    const itype = row.Incident_Type.toLowerCase();
    if (itype.includes("phish")) {
      incidentType = "phishing";
    } else if (itype.includes("fraud")) {
      incidentType = "digital-arrest";
    } else if (itype.includes("ransom") || itype.includes("breach") || itype.includes("theft")) {
      incidentType = "phishing";
    } else {
      incidentType = "phishing";
    }

    // Get city coordinates
    const coords = getCityCoords(row.City);
    if (!coords) continue;

    // Create a synthetic timestamp
    const year = parseInt(row.Year, 10);
    const day = parseInt(row.Day, 10) || 1;
    const month = (day % 12) || 12;
    const createdDate = new Date(year, month - 1, Math.min(day, 28));
    const created_at = createdDate.toISOString();

    results.push({
      id: `csv-${Date.now()}-${Math.random().toString(36)}`,
      incident_type: incidentType,
      location_label: `${row.City} - ${row.Category || "Uncategorized"}`,
      latitude: coords.lat,
      longitude: coords.lng,
      created_at,
    });
  }

  return results;
}

export async function GET(request: NextRequest) {
  try {
    // Load dataset
    const complaints: ComplaintRow[] = await loadCyberSecurityDataset();

    // Aggregate into hotspots
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
      latestReportAt: items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at,
      district: items[0].location_label?.split(" - ")[0] ?? "Unknown",
      severity: items.length > 8 ? "high" : items.length > 3 ? "medium" : "low",
    }));

    return NextResponse.json({ configured: true, hotspots, polledAt: new Date().toISOString() });
  } catch (error) {
    console.error("Hotspot request error:", error);
    return NextResponse.json({ error: "Could not load incident hotspots." }, { status: 500 });
  }
}
