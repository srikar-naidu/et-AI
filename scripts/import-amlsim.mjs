import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const secret = process.env.SUPABASE_SECRET_KEY;

if (!baseUrl || !secret) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local before importing AMLSim data.");
}

function parseCsv(text) {
  const [header, ...rows] = text.trim().split(/\r?\n/);
  const keys = header.split(",");
  return rows.filter(Boolean).map((row) => Object.fromEntries(row.split(",").map((value, index) => [keys[index], value])));
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
const flagged = new Set(alerts.map((alert) => alert.ACCOUNT_ID));

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

console.log(`Imported ${accounts.length} accounts, ${transactions.length} transactions, and ${alerts.length} alert records.`);
