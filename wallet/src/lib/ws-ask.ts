// One turn of the workspace assistant. It reads the owner's rules, this month's spending and
// recent receipts, explains them, and may propose an action. It never pays or changes rules
// itself: every action comes back to the owner as a card she confirms.
//
// Any OpenAI-compatible chat endpoint works (set in .env.local, the key stays on the server):
//   AI_BASE_URL=https://api.anthropic.com/v1   AI_API_KEY=…   AI_MODEL=claude-sonnet-5-5
import "server-only";
import { ledger, readReceipts } from "./live.ts";
import { readRules } from "./rules-store.ts";
import { CATALOG } from "./catalog.ts";
import { usd } from "./money.ts";

export function aiStatus() {
  const base = (process.env.AI_BASE_URL || "").replace(/\/+$/, "");
  let host = "";
  try {
    host = base ? new URL(base).host : "";
  } catch {
    host = "invalid AI_BASE_URL";
  }
  return { configured: Boolean(base && process.env.AI_MODEL), model: process.env.AI_MODEL || null, host: host || null };
}

export type Action =
  | { type: "open"; what: "home" | "rules" | "pay" }
  | { type: "receipt"; id: string }
  | { type: "rules"; text: string }
  | { type: "buy"; path: string };

const SYSTEM = `You are the desk where a person looks after the AI agent that spends money for her.
The agent pays small amounts for online services with test USDC on Stellar, only inside the rules she wrote.
Talk plainly and warmly, short sentences, no jargon, no markdown. Answer in the language she writes in.
Use only the facts in CONTEXT. Amounts are in dollars. Never invent a receipt or a balance.
You cannot pay or change rules yourself. When she wants something done, end your reply with exactly one line:
ACTION {"type":"open","what":"home"|"rules"|"pay"}   to show her overview, her rules, or the list of things to buy
ACTION {"type":"receipt","id":"<receipt id from CONTEXT>"}   to show one receipt
ACTION {"type":"rules","text":"<the full new rules in plain words, like the current ones>"}   to propose new rules; she confirms
ACTION {"type":"buy","path":"<path from CATALOG>"}   to propose a purchase; her rules check it, and she confirms first`;

export async function context() {
  const [{ rules, text }, receipts] = await Promise.all([readRules(), readReceipts()]);
  const l = ledger(receipts);
  return {
    rules: { text, monthly: usd(rules.monthlyBudget), perPayment: usd(rules.capPerPayment), onlyServices: rules.allow.map((s) => s.name) },
    thisMonth: { paid: usd(l.paidThisMonth), pending: usd(l.pending), left: usd(rules.monthlyBudget - l.paidThisMonth - l.pending) },
    receipts: receipts.slice(0, 12).map((r) => ({ id: r.id, at: r.at, what: r.description, service: r.service, amount: usd(r.amount), status: r.status, note: r.note })),
    catalog: CATALOG.map((i) => ({ path: i.path, what: i.what, price: i.price })),
  };
}

export async function ask(messages: { role: string; content: string }[]) {
  const s = aiStatus();
  if (!s.configured) throw Object.assign(new Error("The assistant is not connected. Set AI_BASE_URL, AI_API_KEY and AI_MODEL in .env.local."), { status: 503 });
  const turns = messages
    .slice(-12)
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
  const base = process.env.AI_BASE_URL!.replace(/\/+$/, "");
  const key = process.env.AI_API_KEY;
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(key ? { Authorization: `Bearer ${key}` } : {}) },
    body: JSON.stringify({ model: process.env.AI_MODEL, messages: [{ role: "system", content: `${SYSTEM}\n\nCONTEXT:\n${JSON.stringify(await context())}` }, ...turns] }),
    signal: AbortSignal.timeout(30_000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(`AI provider answered ${res.status}: ${body.error?.message || "no details"}`), { status: 502 });
  const text: string = body.choices?.[0]?.message?.content?.trim() || "";
  const m = text.match(/\n?ACTION\s+(\{.*\})\s*$/);
  let action: Action | null = null;
  if (m) {
    try {
      action = JSON.parse(m[1]);
    } catch {
      action = null;
    }
  }
  return { reply: m ? text.slice(0, m.index).trim() : text, action, model: s.model };
}
