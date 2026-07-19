import { isSupabaseConfigured, supabaseRest } from "@/lib/supabase/server";
import { analyseFraudGraph, type FraudGraph, type GraphEdge, type GraphEntity } from "@/lib/fraud-intelligence";

export const DEMO_ENTITIES: GraphEntity[] = [
  { external_id: "mule_hub", entity_type: "account", label: "ACC-99999 (Mule Hub)", risk_score: 95 },
  { external_id: "victim_1", entity_type: "account", label: "ACC-12345 (Victim: Rajesh)", risk_score: 10 },
  { external_id: "victim_2", entity_type: "account", label: "ACC-67890 (Victim: Priya)", risk_score: 15 },
  { external_id: "victim_3", entity_type: "account", label: "ACC-11111 (Victim: Amit)", risk_score: 12 },
  { external_id: "victim_4", entity_type: "account", label: "ACC-22222 (Victim: Neha)", risk_score: 18 },
  { external_id: "scammer_1", entity_type: "account", label: "ACC-44444 (Shell Company XYZ)", risk_score: 82 },
  { external_id: "scammer_2", entity_type: "individual", label: "Individual: Unknown Scammer", risk_score: 90 },
  { external_id: "device_1", entity_type: "device", label: "Device: IMEI-9A77-2F01", risk_score: 88 },
  { external_id: "phone_1", entity_type: "phone", label: "Phone: +91-9999-XXXX", risk_score: 85 },
  { external_id: "offshore", entity_type: "organization", label: "Offshore Holding: Singapore", risk_score: 92 },
];

const ago = (days: number) => new Date(Date.now() - days * 86400000).toISOString();
export const DEMO_EDGES: GraphEdge[] = [
  { source_external_id: "victim_1", target_external_id: "mule_hub", relationship_type: "transfer", amount: 25000, occurred_at: ago(2), is_flagged: true },
  { source_external_id: "victim_2", target_external_id: "mule_hub", relationship_type: "transfer", amount: 45000, occurred_at: ago(1), is_flagged: true },
  { source_external_id: "victim_3", target_external_id: "mule_hub", relationship_type: "transfer", amount: 30000, occurred_at: ago(0.5), is_flagged: true },
  { source_external_id: "victim_4", target_external_id: "mule_hub", relationship_type: "transfer", amount: 50000, occurred_at: ago(1.2), is_flagged: true },
  { source_external_id: "mule_hub", target_external_id: "scammer_1", relationship_type: "transfer", amount: 120000, occurred_at: ago(0.8), is_flagged: true },
  { source_external_id: "scammer_1", target_external_id: "offshore", relationship_type: "transfer", amount: 100000, occurred_at: ago(0.3), is_flagged: true },
  { source_external_id: "scammer_1", target_external_id: "device_1", relationship_type: "logged_in", amount: null, occurred_at: ago(3), is_flagged: true },
  { source_external_id: "scammer_2", target_external_id: "device_1", relationship_type: "logged_in", amount: null, occurred_at: ago(2.5), is_flagged: true },
  { source_external_id: "scammer_2", target_external_id: "phone_1", relationship_type: "call", amount: null, occurred_at: ago(1.8), is_flagged: true },
  { source_external_id: "device_1", target_external_id: "phone_1", relationship_type: "paired", amount: null, occurred_at: ago(4), is_flagged: false },
];

export async function loadFraudGraph(): Promise<FraudGraph> {
  if (isSupabaseConfigured()) {
    try {
      const [entities, edges] = await Promise.all([
        supabaseRest<GraphEntity[]>("graph_entities?select=external_id,entity_type,label,risk_score&order=risk_score.desc&limit=1000"),
        supabaseRest<GraphEdge[]>("graph_edges?select=source_external_id,target_external_id,relationship_type,amount,is_flagged,occurred_at&order=occurred_at.desc&limit=5000"),
      ]);
      if (entities.length) return analyseFraudGraph(entities, edges, "live");
    } catch (error) {
      console.error("Supabase graph query failed; serving isolated demo graph", error);
    }
  }
  return analyseFraudGraph(DEMO_ENTITIES, DEMO_EDGES, "demo");
}
