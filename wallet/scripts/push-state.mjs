// One-off: copy wallet/data/*.json (receipts, rules, allowance) into the Supabase table, so the
// online demo starts with the same history as the laptop. Prints only keys and counts.
//   node --env-file=.env.local scripts/push-state.mjs
import fs from "node:fs/promises";

const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first");

for (const name of ["receipts", "rules", "allowance"]) {
  let value;
  try {
    value = JSON.parse(await fs.readFile(`data/${name}.json`, "utf8"));
  } catch {
    console.log(`${name}: no local file, skipped`);
    continue;
  }
  const res = await fetch(`${url}/rest/v1/wallet_state`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({ key: name, value, updated_at: new Date().toISOString() }),
  });
  console.log(`${name}: ${res.ok ? "copied" : `failed, HTTP ${res.status}`}${Array.isArray(value) ? ` (${value.length} items)` : ""}`);
}
