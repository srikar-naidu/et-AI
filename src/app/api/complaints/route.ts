import { NextRequest, NextResponse } from "next/server";
import { insertRow, isSupabaseConfigured } from "@/lib/supabase/server";

const INCIDENT_TYPES = new Set(["digital_arrest", "phishing", "counterfeit", "deepfake", "other"]);
type StoredCase = { id: string; case_number: string };
type StoredComplaint = { id: string };

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Citizen reporting is being connected to secure storage. Please try again shortly." },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const incidentType = typeof body.incidentType === "string" ? body.incidentType : "";
    const description = typeof body.description === "string" ? body.description.trim().slice(0, 4000) : "";
    const locationLabel = typeof body.locationLabel === "string" ? body.locationLabel.trim().slice(0, 160) : null;
    const latitude = typeof body.latitude === "number" && body.latitude >= -90 && body.latitude <= 90 ? body.latitude : null;
    const longitude = typeof body.longitude === "number" && body.longitude >= -180 && body.longitude <= 180 ? body.longitude : null;

    if (!INCIDENT_TYPES.has(incidentType) || description.length < 20) {
      return NextResponse.json(
        { error: "Choose an incident type and provide at least 20 characters of detail." },
        { status: 400 },
      );
    }

    const createdCase = (await insertRow("cases", {
      case_number: `CIT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      title: `${incidentType.replace(/_/g, " ")} report`,
      status: "open",
      severity: incidentType === "digital_arrest" ? 4 : 2,
      source: "citizen_report",
    })) as unknown as StoredCase;

    const complaint = (await insertRow("complaints", {
      case_id: createdCase.id,
      incident_type: incidentType,
      description,
      location_label: locationLabel,
      latitude,
      longitude,
      consent_to_store: true,
    })) as unknown as StoredComplaint;

    await insertRow("audit_events", {
      case_id: createdCase.id,
      event_type: "complaint.submitted",
      actor_type: "citizen",
      details: { complaint_id: complaint.id, location_provided: latitude !== null },
    });

    return NextResponse.json(
      { caseNumber: createdCase.case_number, caseId: createdCase.id },
      { status: 201 },
    );
  } catch (error) {
    console.error("Complaint creation error:", error);
    return NextResponse.json({ error: "Could not submit your report." }, { status: 500 });
  }
}
