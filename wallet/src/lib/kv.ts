// Where the wallet keeps its three small JSON records (receipts, rules, allowance history).
//   1. Supabase table `wallet_state` (one row per record, jsonb) when SUPABASE_URL and
//      SUPABASE_SERVICE_ROLE_KEY are set: needed on Vercel, whose disk does not persist.
//   2. wallet/data/<key>.json on disk otherwise (local dev).
// Table, once, in the Supabase SQL editor: see supabase/schema.sql.
import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

const fileFor = (key: string) => path.join(process.cwd(), "data", `${key}.json`);

function supabase() {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" } } : null;
}

export async function readJSON<T>(key: string): Promise<T | null> {
  const sb = supabase();
  if (sb) {
    const res = await fetch(`${sb.url}/rest/v1/wallet_state?key=eq.${encodeURIComponent(key)}&select=value`, { headers: sb.headers, cache: "no-store" });
    if (!res.ok) throw new Error(`supabase read ${key}: HTTP ${res.status}`);
    const rows: { value: T }[] = await res.json();
    return rows[0]?.value ?? null;
  }
  try {
    return JSON.parse(await fs.readFile(fileFor(key), "utf8"));
  } catch {
    return null;
  }
}

export async function writeJSON(key: string, value: unknown): Promise<void> {
  const sb = supabase();
  if (sb) {
    const res = await fetch(`${sb.url}/rest/v1/wallet_state`, {
      method: "POST",
      headers: { ...sb.headers, Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({ key, value, updated_at: new Date().toISOString() }),
    });
    if (!res.ok) throw new Error(`supabase write ${key}: HTTP ${res.status}`);
    return;
  }
  await fs.mkdir(path.dirname(fileFor(key)), { recursive: true });
  await fs.writeFile(fileFor(key), JSON.stringify(value, null, 2));
}
