// The owner's confirmed rules, kept on the server. Read once from plain words, confirmed by the
// owner, then used by the wallet for every payment. No model is involved at any step.
import "server-only";
import { readJSON, writeJSON } from "./kv.ts";
import { isComplete, parseRules, type Rules, type Service } from "./rules.ts";


// The first rules, before the owner writes her own: name only sellers this deployment knows.
const defaultText = () =>
  process.env.SERVICE_PAYTO ? "$2 a month, at most $0.25 a payment, only the Solar Data service" : "$2 a month, at most $0.25 a payment, only the codemod engine";

// Services the owner can name in her rules: sellers the wallet knows how to reach.
export function services(): Service[] {
  const list: Service[] = [];
  if (process.env.SERVICE_PAYTO)
    list.push({ name: process.env.SERVICE_NAME ?? "Solar Data", payTo: process.env.SERVICE_PAYTO, keywords: ["solar", "data", "kit"] });
  if (process.env.ENGINE_PAYTO)
    list.push({ name: "Codemod engine", payTo: process.env.ENGINE_PAYTO, keywords: ["codemod", "engine", "upgrade"] });
  return list;
}

export type StoredRules = { text: string; rules: Rules; confirmedAt: string | null };

export async function readRules(): Promise<StoredRules> {
  const saved = await readJSON<StoredRules>("rules");
  if (saved) return saved;
  const text = defaultText();
  const p = parseRules(text, services());
  if (!isComplete(p.rules)) throw new Error("Default rules could not be read; check SERVICE_PAYTO or ENGINE_PAYTO");
  return { text, rules: p.rules, confirmedAt: null };
}

// Saves the rules only if every part was understood; otherwise says what was not.
export async function confirmRules(text: string): Promise<StoredRules> {
  const p = parseRules(text, services());
  if (p.unread.length) throw new Error(`Not understood: ${p.unread.map((u) => `"${u}"`).join(", ")}`);
  if (!isComplete(p.rules)) throw new Error("Say a monthly budget, a cap per payment and which services the agent may pay.");
  const stored = { text, rules: p.rules, confirmedAt: new Date().toISOString() };
  await writeJSON("rules", stored);
  return stored;
}
