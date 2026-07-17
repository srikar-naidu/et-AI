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

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ configured: false, nodes: [], links: [] });
  }

  try {
    const [entities, edges] = await Promise.all([
      supabaseRest<EntityRow[]>("graph_entities?select=external_id,entity_type,label,risk_score&order=risk_score.desc&limit=300"),
      supabaseRest<EdgeRow[]>("graph_edges?select=source_external_id,target_external_id,relationship_type,amount,is_flagged,occurred_at&order=occurred_at.desc&limit=600"),
    ]);

    const nodeRisk = new Map(entities.map((entity) => [entity.external_id, Number(entity.risk_score)]));
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
      const maxRisk = Math.max(...members.map((member) => nodeRisk.get(member) ?? 0));
      return members.length > 1 ? [{ memberCount: members.length, maxRisk, flagged: members.some((member) => edges.some((edge) => edge.is_flagged && (edge.source_external_id === member || edge.target_external_id === member))) }] : [];
    }).sort((left, right) => right.maxRisk - left.maxRisk);

    return NextResponse.json({
      configured: true,
      nodes: entities.map((entity) => ({
        id: entity.external_id,
        label: entity.label,
        type: entity.entity_type,
        riskScore: Number(entity.risk_score),
      })),
      links: edges.map((edge) => ({
        source: edge.source_external_id,
        target: edge.target_external_id,
        type: edge.relationship_type,
        amount: edge.amount === null ? null : Number(edge.amount),
        flagged: edge.is_flagged,
        occurredAt: edge.occurred_at,
      })),
      clusters,
    });
  } catch (error) {
    console.error("Graph request error:", error);
    return NextResponse.json({ error: "Could not load the investigation graph." }, { status: 500 });
  }
}
