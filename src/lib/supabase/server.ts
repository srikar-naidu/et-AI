import "server-only";
import { isSupabaseClientConfigured as clientConfigured } from "./client";

type SupabaseValue = Record<string, unknown> | Array<Record<string, unknown>>;

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secret) {
    return null;
  }

  return { url: url.replace(/\/$/, ""), secret };
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseConfig());
}

export function isSupabaseClientConfigured() {
  return clientConfigured();
}

export async function supabaseRest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error("Supabase is not configured. Add the Supabase environment variables locally.");
  }

  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: config.secret,
      // Modern Supabase `sb_secret_...` keys are opaque API keys, not JWTs.
      // Sending one as a Bearer token produces a 401 before PostgREST sees it.
      ...(config.secret.startsWith("sb_") ? {} : { Authorization: `Bearer ${config.secret}` }),
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...options.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase request failed (${response.status}): ${message}`);
  }

  return response.json() as Promise<T>;
}

export async function insertRow<T extends Record<string, unknown>>(
  table: string,
  row: T,
) {
  const records = await supabaseRest<Array<T>>(table, {
    method: "POST",
    body: JSON.stringify(row),
  });

  return records[0];
}

export async function updateRows<T extends Record<string, unknown>>(
  table: string,
  filter: string,
  row: T,
) {
  return supabaseRest<Array<T>>(`${table}?${filter}`, {
    method: "PATCH",
    body: JSON.stringify(row),
  });
}

export async function supabaseStorage(path: string, options: RequestInit = {}) {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase is not configured. Add the Supabase environment variables locally.");
  const response = await fetch(`${config.url}/storage/v1/${path}`, {
    ...options,
    headers: { apikey: config.secret, Authorization: `Bearer ${config.secret}`, ...options.headers },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Supabase storage request failed (${response.status}): ${await response.text()}`);
  return response;
}

export type { SupabaseValue };
