import { NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseRest, insertRow } from "@/lib/supabase/server";

/**
 * Seed endpoint to populate the database with mock data for testing.
 * SECURITY: Only accessible locally. Never expose in production.
 * 
 * Usage: POST /api/seed/demo-data
 */
export async function POST() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 }
    );
  }

  try {
    // Check environment - only allow in development
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Seeding is disabled in production" },
        { status: 403 }
      );
    }

    // Seed graph entities (financial entities/accounts)
    const entities = [
      {
        external_id: "entity_001",
        entity_type: "account",
        label: "ACC-12345 (Karol Business)",
        risk_score: 15,
        attributes: { institution: "State Bank", country: "IN" },
      },
      {
        external_id: "entity_002",
        entity_type: "account",
        label: "ACC-67890 (Mumbai Traders)",
        risk_score: 35,
        attributes: { institution: "HDFC", country: "IN" },
      },
      {
        external_id: "entity_003",
        entity_type: "account",
        label: "ACC-11111 (Shell Company)",
        risk_score: 72,
        attributes: { institution: "Private", country: "IN", flagged: true },
      },
      {
        external_id: "entity_004",
        entity_type: "individual",
        label: "Individual - Phone: 9876543210",
        risk_score: 58,
        attributes: { phone: "9876543210", country: "IN" },
      },
      {
        external_id: "entity_005",
        entity_type: "organization",
        label: "Trade House Ltd",
        risk_score: 42,
        attributes: { registration: "LLPIN123", country: "IN" },
      },
    ];

    for (const entity of entities) {
      await insertRow("graph_entities", entity);
    }

    // Seed graph edges (transfer relationships)
    const edges = [
      {
        source_external_id: "entity_001",
        target_external_id: "entity_002",
        relationship_type: "transfer",
        amount: 50000,
        occurred_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        is_flagged: false,
        attributes: { purpose: "payment" },
      },
      {
        source_external_id: "entity_002",
        target_external_id: "entity_003",
        relationship_type: "transfer",
        amount: 100000,
        occurred_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        is_flagged: true,
        attributes: { purpose: "unknown" },
      },
      {
        source_external_id: "entity_003",
        target_external_id: "entity_004",
        relationship_type: "transfer",
        amount: 75000,
        occurred_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        is_flagged: true,
        attributes: { purpose: "cash_withdrawal" },
      },
      {
        source_external_id: "entity_004",
        target_external_id: "entity_005",
        relationship_type: "transfer",
        amount: 30000,
        occurred_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        is_flagged: false,
        attributes: { purpose: "goods" },
      },
    ];

    for (const edge of edges) {
      await insertRow("graph_edges", edge);
    }

    // Seed sample cases
    const cases = [
      {
        case_number: "CASE-2026-001",
        title: "Suspected Digital Arrest Scam Network",
        status: "escalated",
        severity: 5,
        source: "citizen_report",
      },
      {
        case_number: "CASE-2026-002",
        title: "Counterfeit Currency Distribution Ring",
        status: "open",
        severity: 4,
        source: "merchant_complaint",
      },
      {
        case_number: "CASE-2026-003",
        title: "Deepfake Audio in Extortion Attempt",
        status: "triaged",
        severity: 3,
        source: "platform_detection",
      },
    ];

    const insertedCases = [];
    for (const caseData of cases) {
      const inserted = await insertRow("cases", caseData);
      insertedCases.push(inserted);
    }

    // Seed audit events for first case
    if (insertedCases.length > 0) {
      const caseId = (insertedCases[0] as any).id;
      const events = [
        {
          case_id: caseId,
          event_type: "case.created",
          actor_type: "system",
          details: { source: "api_seed" },
        },
        {
          case_id: caseId,
          event_type: "case.escalated",
          actor_type: "operator",
          details: { reason: "high_fraud_risk" },
        },
      ];

      for (const event of events) {
        await insertRow("audit_events", event);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Demo data seeded successfully",
      entities: entities.length,
      edges: edges.length,
      cases: cases.length,
    });
  } catch (error) {
    console.error("Seeding error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Seeding failed" },
      { status: 500 }
    );
  }
}
