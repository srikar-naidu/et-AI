import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import Papa from "papaparse";

const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const secret = process.env.SUPABASE_SECRET_KEY;

if (!baseUrl || !secret) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local before importing AMLSim data.");
}

function parseCsv(text) {
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
  if (parsed.errors.length) throw new Error(`CSV parsing failed: ${parsed.errors[0].message}`);
  return parsed.data;
}

async function readCsv(name) {
  return parseCsv(await readFile(resolve("data/raw/amlsim", name), "utf8"));
}

async function insert(table, rows, onConflict) {
  if (!rows.length) return;
  const response = await fetch(`${baseUrl}/rest/v1/${table}?on_conflict=${onConflict}`, {
    method: "POST",
    headers: { apikey: secret, Authorization: `Bearer ${secret}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(rows),
  });
  if (!response.ok) throw new Error(`${table}: ${await response.text()}`);
}

const [accounts, transactions, alerts] = await Promise.all([readCsv("accounts.csv"), readCsv("tx.csv"), readCsv("alerts.csv")]);
const flagged = new Set(alerts.map((alert) => String(alert.ACCOUNT_ID)));
const accountId = (account) => String(account.ACCOUNT_ID);
const highRiskAccounts = accounts.filter((account) => flagged.has(accountId(account)) || account.isFraud === "true");
const enrichmentEntities = [];
const enrichmentEdges = [];

for (const account of highRiskAccounts) {
  const id = accountId(account);
  // Deterministic synthetic identifiers create repeatable multi-source links when AMLSim lacks telemetry fields.
  const cohort = Number(id.replace(/\D/g, "")) % 3;
  const deviceId = `amlsim:device:cohort-${cohort}`;
  const phoneId = `amlsim:phone:cohort-${cohort}`;
  const jurisdiction = String(account.country || "IN").toUpperCase();
  const jurisdictionId = `amlsim:jurisdiction:${jurisdiction}`;
  enrichmentEntities.push(
    { external_id: deviceId, entity_type: "device", label: `Device fingerprint cohort ${cohort}`, risk_score: 78, attributes: { synthetic: true, source: "AMLSim enrichment" } },
    { external_id: phoneId, entity_type: "phone", label: `Phone signal cohort ${cohort}`, risk_score: 72, attributes: { synthetic: true, source: "AMLSim enrichment" } },
    { external_id: jurisdictionId, entity_type: "location", label: `Jurisdiction: ${jurisdiction}`, risk_score: 20, attributes: { country: jurisdiction } },
  );
  enrichmentEdges.push(
    { source_external_id: `amlsim:account:${id}`, target_external_id: deviceId, relationship_type: "logged_in_with_device", amount: null, occurred_at: "2017-01-01T00:00:00.000Z", is_flagged: true, attributes: { synthetic: true } },
    { source_external_id: `amlsim:account:${id}`, target_external_id: phoneId, relationship_type: "called_phone", amount: null, occurred_at: "2017-01-01T00:00:00.000Z", is_flagged: true, attributes: { synthetic: true } },
    { source_external_id: `amlsim:account:${id}`, target_external_id: jurisdictionId, relationship_type: "registered_in", amount: null, occurred_at: "2017-01-01T00:00:00.000Z", is_flagged: false, attributes: { synthetic: true } },
  );
}

await insert("graph_entities", accounts.map((account) => ({
  external_id: `amlsim:account:${account.ACCOUNT_ID}`,
  entity_type: "account",
  label: `Account ${account.ACCOUNT_ID}`,
  risk_score: flagged.has(account.ACCOUNT_ID) || account.isFraud === "true" ? 85 : 5,
  attributes: { customer_id: account.PRIMARY_CUSTOMER_ID, country: account.country, business: account.business },
})), "external_id");

await insert("graph_edges", transactions.map((transaction) => ({
  source_external_id: `amlsim:account:${transaction.ACCOUNT_ID}`,
  target_external_id: `amlsim:account:${transaction.COUNTER_PARTY_ACCOUNT_NUM}`,
  relationship_type: transaction.TXN_SOURCE_TYPE_CODE,
  amount: Number(transaction.TXN_AMOUNT_ORIG),
  occurred_at: new Date(Date.UTC(2017, 0, Number(transaction.start))).toISOString(),
  is_flagged: flagged.has(transaction.ACCOUNT_ID) || flagged.has(transaction.COUNTER_PARTY_ACCOUNT_NUM),
  attributes: { transaction_id: transaction.TXN_ID, count: Number(transaction.tx_count) },
})), "source_external_id,target_external_id,relationship_type,occurred_at");

await insert("graph_entities", [...new Map(enrichmentEntities.map((entity) => [entity.external_id, entity])).values()], "external_id");
await insert("graph_edges", enrichmentEdges, "source_external_id,target_external_id,relationship_type");

console.log(`Imported ${accounts.length} accounts, ${transactions.length} transactions, ${alerts.length} alert records, and ${enrichmentEntities.length} enriched telemetry entities.`);
