-- Upgrade existing installations for heterogeneous fraud-network ingestion.
alter table public.graph_entities
  drop constraint if exists graph_entities_entity_type_check;

alter table public.graph_entities
  add constraint graph_entities_entity_type_check
  check (entity_type in ('account', 'individual', 'organization', 'phone', 'url', 'device', 'location'));

create unique index if not exists graph_edges_dedup_idx
  on public.graph_edges (source_external_id, target_external_id, relationship_type, occurred_at);
