import { NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseRest } from "@/lib/supabase/server";

type EntityRow = {
  external_id: string;
  entity_type: string;
  label: string;
  risk_score: number;
};

type EdgeRow = {
  source_external_id: string;
  target_external_id: string;
  relationship_type: string;
  amount: number | null;
  is_flagged: boolean;
  occurred_at: string | null;
};

/* ── Demo data (mirrors seed route) ─────────────────────────────── */

const DEMO_ENTITIES: EntityRow[] = [
  { external_id: "entity_001", entity_type: "account", label: "ACC-12345 (Karol Business)", risk_score: 15 },
  { external_id: "entity_002", entity_type: "account", label: "ACC-67890 (Mumbai Traders)", risk_score: 35 },
  { external_id: "entity_003", entity_type: "account", label: "ACC-11111 (Shell Company)", risk_score: 72 },
  { external_id: "entity_004", entity_type: "individual", label: "Individual - Phone: 9876543210", risk_score: 58 },
  { external_id: "entity_005", entity_type: "organization", label: "Trade House Ltd", risk_score: 42 },
  { external_id: "entity_006", entity_type: "phone", label: "Phone: +91-8800-XXXX", risk_score: 64 },
  { external_id: "entity_007", entity_type: "account", label: "ACC-44444 (Hawala Hub)", risk_score: 88 },
  { external_id: "entity_008", entity_type: "device", label: "Device: Samsung A34 (IMEI masked)", risk_score: 45 },
];

const DEMO_EDGES: EdgeRow[] = [
  { source_external_id: "entity_001", target_external_id: "entity_002", relationship_type: "transfer", amount: 50000, occurred_at: new Date(Date.now() - 5 * 86400000).toISOString(), is_flagged: false },
  { source_external_id: "entity_002", target_external_id: "entity_003", relationship_type: "transfer", amount: 100000, occurred_at: new Date(Date.now() - 3 * 86400000).toISOString(), is_flagged: true },
  { source_external_id: "entity_003", target_external_id: "entity_004", relationship_type: "transfer", amount: 75000, occurred_at: new Date(Date.now() - 2 * 86400000).toISOString(), is_flagged: true },
  { source_external_id: "entity_004", target_external_id: "entity_005", relationship_type: "transfer", amount: 30000, occurred_at: new Date(Date.now() - 1 * 86400000).toISOString(), is_flagged: false },
  { source_external_id: "entity_003", target_external_id: "entity_007", relationship_type: "transfer", amount: 250000, occurred_at: new Date(Date.now() - 1.5 * 86400000).toISOString(), is_flagged: true },
  { source_external_id: "entity_007", target_external_id: "entity_006", relationship_type: "call", amount: null, occurred_at: new Date(Date.now() - 0.5 * 86400000).toISOString(), is_flagged: true },
  { source_external_id: "entity_006", target_external_id: "entity_008", relationship_type: "device_link", amount: null, occurred_at: new Date(Date.now() - 4 * 86400000).toISOString(), is_flagged: false },
  { source_external_id: "entity_008", target_external_id: "entity_004", relationship_type: "ownership", amount: null, occurred_at: new Date(Date.now() - 6 * 86400000).toISOString(), is_flagged: false },
];

/* ── Build response from entities + edges ───────────────────────── */

function buildGraphResponse(entities: EntityRow[], edges: EdgeRow[]) {
  const nodeRisk = new Map(entities.map((e) => [e.external_id, Number(e.risk_score)]));
  const neighbours = new Map<string, Set<string>>();
  for (const edge of edges) {
    neighbours.set(edge.source_external_id, (neighbours.get(edge.source_external_id) ?? new Set()).add(edge.target_external_id));
    neighbours.set(edge.target_external_id, (neighbours.get(edge.target_external_id) ?? new Set()).add(edge.source_external_id));
  }
  const visited = new Set<string>();
  const clusters = [...neighbours.keys()].flatMap((start) => {
    if (visited.has(start)) return [];
    const queue = [start];
    const members: string[] = [];
    visited.add(start);
    while (queue.length) {
      const current = queue.shift();
      if (!current) continue;
      members.push(current);
      for (const neighbour of neighbours.get(current) ?? []) if (!visited.has(neighbour)) { visited.add(neighbour); queue.push(neighbour); }
    }
    const maxRisk = Math.max(...members.map((m) => nodeRisk.get(m) ?? 0));
    return members.length > 1 ? [{ memberCount: members.length, maxRisk, flagged: members.some((m) => edges.some((e) => e.is_flagged && (e.source_external_id === m || e.target_external_id === m))) }] : [];
  }).sort((a, b) => b.maxRisk - a.maxRisk);

  return {
    configured: true,
    nodes: entities.map((e) => ({
      id: e.external_id,
      label: e.label,
      type: e.entity_type,
      riskScore: Number(e.risk_score),
    })),
    links: edges.map((e) => ({
      source: e.source_external_id,
      target: e.target_external_id,
      type: e.relationship_type,
      amount: e.amount === null ? null : Number(e.amount),
      flagged: e.is_flagged,
      occurredAt: e.occurred_at,
    })),
    clusters,
  };
}

export async function GET() {
  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      const [entities, edges] = await Promise.all([
        supabaseRest<EntityRow[]>("graph_entities?select=external_id,entity_type,label,risk_score&order=risk_score.desc&limit=300"),
        supabaseRest<EdgeRow[]>("graph_edges?select=source_external_id,target_external_id,relationship_type,amount,is_flagged,occurred_at&order=occurred_at.desc&limit=600"),
      ]);

      // If Supabase returned data, use it
      if (entities.length > 0) {
        return NextResponse.json(buildGraphResponse(entities, edges));
      }
    } catch (error) {
      console.error("Supabase graph query failed, using demo data:", error);
      // Fall through to demo data
    }
  }

  // Fallback: demo data
  return NextResponse.json({ ...buildGraphResponse(DEMO_ENTITIES, DEMO_EDGES), mode: "demo" });
}
