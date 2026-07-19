export type GraphEntity = {
  external_id: string;
  entity_type: string;
  label: string;
  risk_score: number;
};

export type GraphEdge = {
  source_external_id: string;
  target_external_id: string;
  relationship_type: string;
  amount: number | null;
  is_flagged: boolean;
  occurred_at: string | null;
};

export type FraudCluster = {
  id: string;
  memberIds: string[];
  memberCount: number;
  maxRisk: number;
  flagged: boolean;
  flaggedEdgeCount: number;
  transferCount: number;
  totalTransferred: number;
  relationshipCounts: Record<string, number>;
  riskLevel: "critical" | "high" | "moderate" | "low";
  summary: string;
};

export type FraudGraph = {
  configured: boolean;
  mode?: "demo" | "live";
  analysisMethod: "weakly_connected_components";
  analysedAt: string;
  nodes: Array<{ id: string; label: string; type: string; riskScore: number }>;
  links: Array<{ source: string; target: string; type: string; amount: number | null; flagged: boolean; occurredAt: string | null }>;
  clusters: FraudCluster[];
};

const riskLevel = (score: number): FraudCluster["riskLevel"] =>
  score >= 80 ? "critical" : score >= 60 ? "high" : score >= 30 ? "moderate" : "low";

export function analyseFraudGraph(entities: GraphEntity[], edges: GraphEdge[], mode?: FraudGraph["mode"]): FraudGraph {
  const entityById = new Map(entities.map((entity) => [entity.external_id, entity]));
  const neighbours = new Map<string, Set<string>>(entities.map((entity) => [entity.external_id, new Set()]));

  for (const edge of edges) {
    if (!entityById.has(edge.source_external_id) || !entityById.has(edge.target_external_id)) continue;
    neighbours.get(edge.source_external_id)?.add(edge.target_external_id);
    neighbours.get(edge.target_external_id)?.add(edge.source_external_id);
  }

  const visited = new Set<string>();
  const clusters: FraudCluster[] = [];
  for (const entity of entities) {
    if (visited.has(entity.external_id)) continue;
    const queue = [entity.external_id];
    const memberIds: string[] = [];
    visited.add(entity.external_id);
    while (queue.length) {
      const current = queue.shift();
      if (!current) continue;
      memberIds.push(current);
      for (const neighbour of neighbours.get(current) ?? []) {
        if (!visited.has(neighbour)) {
          visited.add(neighbour);
          queue.push(neighbour);
        }
      }
    }

    const members = new Set(memberIds);
    const clusterEdges = edges.filter((edge) => members.has(edge.source_external_id) && members.has(edge.target_external_id));
    const flaggedEdgeCount = clusterEdges.filter((edge) => edge.is_flagged).length;
    const transfers = clusterEdges.filter((edge) => edge.amount !== null);
    const relationshipCounts = Object.fromEntries(
      [...new Set(clusterEdges.map((edge) => edge.relationship_type))].map((type) => [type, clusterEdges.filter((edge) => edge.relationship_type === type).length]),
    );
    const maxRisk = Math.max(...memberIds.map((id) => Number(entityById.get(id)?.risk_score ?? 0)));
    const totalTransferred = transfers.reduce((total, edge) => total + Number(edge.amount ?? 0), 0);
    const level = riskLevel(maxRisk);
    const deviceLinks = (relationshipCounts.logged_in ?? 0) + (relationshipCounts.paired ?? 0);
    const crossBorder = memberIds.some((id) => /offshore|foreign|international/i.test(entityById.get(id)?.label ?? ""));
    const signals = [
      `${flaggedEdgeCount} flagged relationship${flaggedEdgeCount === 1 ? "" : "s"}`,
      transfers.length ? `${transfers.length} transfer${transfers.length === 1 ? "" : "s"} totaling INR ${totalTransferred.toLocaleString("en-IN")}` : null,
      deviceLinks ? `${deviceLinks} device or phone linkage${deviceLinks === 1 ? "" : "s"}` : null,
      crossBorder ? "an offshore or cross-border endpoint" : null,
    ].filter(Boolean).join(", ");

    clusters.push({
      id: `wcc-${clusters.length + 1}`,
      memberIds,
      memberCount: memberIds.length,
      maxRisk,
      flagged: flaggedEdgeCount > 0,
      flaggedEdgeCount,
      transferCount: transfers.length,
      totalTransferred,
      relationshipCounts,
      riskLevel: level,
      summary: `WCC analysis found ${memberIds.length} linked entities with ${signals || "no flagged relationships"}.`,
    });
  }

  return {
    configured: true,
    ...(mode ? { mode } : {}),
    analysisMethod: "weakly_connected_components",
    analysedAt: new Date().toISOString(),
    nodes: entities.map((entity) => ({ id: entity.external_id, label: entity.label, type: entity.entity_type, riskScore: Number(entity.risk_score) })),
    links: edges.map((edge) => ({ source: edge.source_external_id, target: edge.target_external_id, type: edge.relationship_type, amount: edge.amount === null ? null : Number(edge.amount), flagged: edge.is_flagged, occurredAt: edge.occurred_at })),
    clusters: clusters.sort((a, b) => b.maxRisk - a.maxRisk || b.flaggedEdgeCount - a.flaggedEdgeCount),
  };
}

export function getClusterGraph(graph: FraudGraph, clusterId: string) {
  const cluster = graph.clusters.find((item) => item.id === clusterId) ?? graph.clusters[0];
  if (!cluster) return null;
  const members = new Set(cluster.memberIds);
  return {
    cluster,
    nodes: graph.nodes.filter((node) => members.has(node.id)),
    links: graph.links.filter((link) => members.has(link.source) && members.has(link.target)),
  };
}
