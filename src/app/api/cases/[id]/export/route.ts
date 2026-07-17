import { NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseRest } from "@/lib/supabase/server";

/* ── Demo case details ──────────────────────────────────────────── */

const DEMO_CASE_DETAILS: Record<string, {
  case: Record<string, unknown>;
  events: Array<{ id: string; event_type: string; actor_type: string; created_at: string }>;
  evidence: Array<{ id: string; original_filename: string; byte_size: number; sha256: string; created_at: string }>;
  complaints: Array<{ incident_type: string; description: string; location_label: string | null; created_at: string }>;
}> = {
  "demo-case-001": {
    case: {
      id: "demo-case-001",
      case_number: "CASE-2026-001",
      title: "Suspected Digital Arrest Scam Network",
      status: "escalated",
      severity: 5,
      source: "citizen_report",
      created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    events: [
      { id: "evt-001", event_type: "case.created", actor_type: "system", created_at: new Date(Date.now() - 7 * 86400000).toISOString() },
      { id: "evt-002", event_type: "complaint.submitted", actor_type: "citizen", created_at: new Date(Date.now() - 7 * 86400000 + 3600000).toISOString() },
      { id: "evt-003", event_type: "evidence.uploaded", actor_type: "citizen", created_at: new Date(Date.now() - 6 * 86400000).toISOString() },
      { id: "evt-004", event_type: "case.escalated", actor_type: "operator", created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
    ],
    evidence: [
      { id: "evi-001", original_filename: "call_recording_scam.mp3", byte_size: 2457600, sha256: "a3f2b8c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1", created_at: new Date(Date.now() - 6 * 86400000).toISOString() },
      { id: "evi-002", original_filename: "whatsapp_screenshot.png", byte_size: 348160, sha256: "b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3", created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
    ],
    complaints: [
      { incident_type: "digital_arrest", description: "Got a call claiming to be CBI. Demanded money for customs clearance.", location_label: "Connaught Place, Delhi", created_at: new Date(Date.now() - 7 * 86400000 + 3600000).toISOString() }
    ]
  },
  "demo-case-002": {
    case: {
      id: "demo-case-002",
      case_number: "CASE-2026-002",
      title: "Counterfeit Currency Distribution Ring",
      status: "open",
      severity: 4,
      source: "merchant_complaint",
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    events: [
      { id: "evt-010", event_type: "case.created", actor_type: "system", created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
      { id: "evt-011", event_type: "complaint.submitted", actor_type: "citizen", created_at: new Date(Date.now() - 5 * 86400000 + 1800000).toISOString() },
    ],
    evidence: [
      { id: "evi-010", original_filename: "fake_note_front.jpg", byte_size: 512000, sha256: "c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4", created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
    ],
    complaints: [
      { incident_type: "counterfeit", description: "Found multiple counterfeit Rs 500 notes.", location_label: "MG Road, Bengaluru", created_at: new Date(Date.now() - 5 * 86400000 + 1800000).toISOString() }
    ]
  },
  "demo-case-003": {
    case: {
      id: "demo-case-003",
      case_number: "CASE-2026-003",
      title: "Deepfake Audio in Extortion Attempt",
      status: "triaged",
      severity: 3,
      source: "platform_detection",
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    events: [
      { id: "evt-020", event_type: "case.created", actor_type: "system", created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
      { id: "evt-021", event_type: "case.triaged", actor_type: "operator", created_at: new Date(Date.now() - 1 * 86400000).toISOString() },
    ],
    evidence: [],
    complaints: []
  },
  "demo-case-004": {
    case: {
      id: "demo-case-004",
      case_number: "CASE-2026-004",
      title: "Phishing SMS Campaign Targeting Bank Customers",
      status: "open",
      severity: 4,
      source: "telecom_report",
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    events: [
      { id: "evt-030", event_type: "case.created", actor_type: "system", created_at: new Date(Date.now() - 1 * 86400000).toISOString() },
    ],
    evidence: [
      { id: "evi-030", original_filename: "phishing_sms_screenshot.png", byte_size: 204800, sha256: "d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5", created_at: new Date(Date.now() - 1 * 86400000).toISOString() },
    ],
    complaints: []
  },
};

export async function GET(_request: Request, context: RouteContext<"/api/cases/[id]/export">) {
  const { id } = await context.params;

  if (isSupabaseConfigured()) {
    try {
      const [cases, events, evidence, complaints] = await Promise.all([
        supabaseRest<Record<string, unknown>[]>(`cases?select=*&id=eq.${encodeURIComponent(id)}&limit=1`),
        supabaseRest<Record<string, unknown>[]>(`audit_events?select=*&case_id=eq.${encodeURIComponent(id)}&order=created_at.asc`),
        supabaseRest<Record<string, unknown>[]>(`evidence_items?select=id,original_filename,content_type,byte_size,sha256,source,created_at&case_id=eq.${encodeURIComponent(id)}&order=created_at.asc`),
        supabaseRest<Record<string, unknown>[]>(`complaints?select=incident_type,description,location_label,created_at&case_id=eq.${encodeURIComponent(id)}&order=created_at.asc`),
      ]);
      if (cases[0]) {
        return NextResponse.json(
          { exported_at: new Date().toISOString(), export_scope: "metadata and audit timeline only; binary evidence remains in protected storage", case: cases[0], complaints, evidence, audit_timeline: events },
          { headers: { "Content-Disposition": `attachment; filename="case-${id}-bundle.json"` } }
        );
      }
    } catch (error) {
       console.error("Supabase export failed, trying demo data:", error);
    }
  }

  const demo = DEMO_CASE_DETAILS[id];
  if (demo) {
    return NextResponse.json(
      { exported_at: new Date().toISOString(), export_scope: "metadata and audit timeline only; binary evidence remains in protected storage", case: demo.case, complaints: demo.complaints, evidence: demo.evidence, audit_timeline: demo.events },
      { headers: { "Content-Disposition": `attachment; filename="case-${id}-bundle.json"` } }
    );
  }

  return NextResponse.json({ error: "Case not found." }, { status: 404 });
}
