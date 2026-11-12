// Live testnet payments for the Receipts wallet (server only).
// Reads the price out of a 402, checks the owner's rules in code, then pays through x402
// and keeps a receipt with the real Stellar transaction. Testnet only.
import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { wrapFetchWithPaymentFromConfig, decodePaymentResponseHeader } from "@x402/fetch";
import { createEd25519Signer } from "@x402/stellar";
import { ExactStellarScheme } from "@x402/stellar/exact/client";
import { check, type Check, type Rules } from "./rules.ts";
import { UNITS } from "./money.ts";

const env = (key: string) => {
  const v = process.env[key];
  if (!v) throw new Error(`${key} is missing in wallet/.env.local`);
  return v;
};

const network = () => env("WALLET_NETWORK") as `${string}:${string}`;

export function rules(): Rules {
  return {
    monthlyBudget: 2 * UNITS,
    capPerPayment: 0.25 * UNITS,
    allow: [{ name: env("SERVICE_NAME"), payTo: env("SERVICE_PAYTO"), keywords: [] }],
  };
}

export const RULES_TEXT = "$2 a month, at most $0.25 a payment, only the services I list";

export type LiveStatus = "paid" | "pending" | "needs_you" | "blocked" | "declined" | "failed";

export type LiveReceipt = {
  id: string;
  at: string;
  path: string;
  service: string;
  description: string;
  amount: number; // atomic units
  payTo: string;
  status: LiveStatus;
  checks: Check[];
  note?: string;
  tx?: string;
  link?: string;
  data?: unknown;
};

const STORE = path.join(process.cwd(), "data", "receipts.json");

export async function readReceipts(): Promise<LiveReceipt[]> {
  try { return JSON.parse(await fs.readFile(STORE, "utf8")); } catch { return []; }
}

async function save(r: LiveReceipt) {
  const all = await readReceipts();
  const i = all.findIndex((x) => x.id === r.id);
  if (i >= 0) all[i] = r; else all.unshift(r);
  await fs.mkdir(path.dirname(STORE), { recursive: true });
  await fs.writeFile(STORE, JSON.stringify(all, null, 2));
}

// Paid this month and still pending, from the receipts themselves.
export function ledger(all: LiveReceipt[]) {
  const month = new Date().toISOString().slice(0, 7);
  const mine = all.filter((r) => r.at.startsWith(month));
  const sum = (s: LiveStatus) => mine.filter((r) => r.status === s).reduce((n, r) => n + r.amount, 0);
  return { paidThisMonth: sum("paid"), pending: sum("pending") };
}

type Quote = { amount: number; payTo: string; description: string };

// Read the price out of a 402 WITHOUT paying.
async function quote(url: string): Promise<Quote | { free: unknown } | { error: string }> {
  const res = await fetch(url);
  if (res.status !== 402) return res.ok ? { free: await res.json() } : { error: `HTTP ${res.status}` };
  const header = res.headers.get("PAYMENT-REQUIRED");
  if (!header) return { error: "402 without PAYMENT-REQUIRED" };
  const { resource, accepts } = JSON.parse(Buffer.from(header, "base64").toString("utf8"));
  const offer = accepts.find((o: { network: string; asset: string }) => o.network === network() && o.asset === env("WALLET_USDC_CONTRACT"));
  if (!offer) return { error: "no USDC offer on this network" };
  return { amount: Number(offer.amount), payTo: offer.payTo, description: resource?.description ?? "" };
}

// A fetch that signs at most the approved amount, to the approved address.
function payingFetch(q: Quote) {
  const signer = createEd25519Signer(env("WALLET_AGENT_SECRET"), network());
  return wrapFetchWithPaymentFromConfig(fetch, {
    schemes: [{ network: network(), client: new ExactStellarScheme(signer, { url: env("WALLET_RPC_URL") }) }],
    policies: [(_v, offers) => offers.filter((o) => Number(o.amount) <= q.amount && o.payTo === q.payTo)],
  });
}

async function settle(r: LiveReceipt, q: Quote): Promise<LiveReceipt> {
  r.status = "pending"; // signed, not yet settled: counts against the allowance
  await save(r);
  try {
    const res = await payingFetch(q)(`${env("SERVICE_BASE_URL")}${r.path}`);
    const header = res.headers.get("PAYMENT-RESPONSE");
    const s = header ? decodePaymentResponseHeader(header) : null;
    if (!res.ok || !s?.success) {
      r.status = "failed";
      r.note = `Not settled (HTTP ${res.status}). Nothing was paid.`;
    } else {
      r.status = "paid";
      r.tx = s.transaction;
      r.link = `${env("WALLET_EXPLORER_URL")}/tx/${s.transaction}`;
      r.data = await res.json();
    }
  } catch (e) {
    r.status = "failed";
    r.note = `Payment error: ${(e as Error).message}. Nothing was paid.`;
  }
  await save(r);
  return r;
}

// The agent asks to buy one paid resource. The wallet decides.
export async function buy(pathname: string): Promise<LiveReceipt> {
  const q = await quote(`${env("SERVICE_BASE_URL")}${pathname}`);
  if ("error" in q) throw new Error(q.error);
  if ("free" in q) throw new Error("This resource is free; nothing to pay.");
  const all = await readReceipts();
  const decision = check(rules(), { payTo: q.payTo, amount: q.amount, what: pathname }, ledger(all));
  const r: LiveReceipt = {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    at: new Date().toISOString(),
    path: pathname,
    service: rules().allow.find((s) => s.payTo === q.payTo)?.name ?? "Unknown service",
    description: q.description,
    amount: q.amount,
    payTo: q.payTo,
    status: decision.outcome === "block" ? "blocked" : decision.outcome === "ask" ? "needs_you" : "pending",
    checks: decision.checks,
  };
  if (decision.outcome !== "pay") {
    r.note = decision.outcome === "block" ? "Not on your list. Nothing was signed." : "Over your cap. Waiting for you; nothing signed yet.";
    await save(r);
    return r;
  }
  return settle(r, q);
}

// The owner answers a "Needs you" receipt.
export async function answer(id: string, allow: boolean): Promise<LiveReceipt> {
  const r = (await readReceipts()).find((x) => x.id === id);
  if (!r || r.status !== "needs_you") throw new Error("Nothing waiting with that id.");
  if (!allow) {
    r.status = "declined";
    r.note = "You said no. Nothing was signed or paid.";
    await save(r);
    return r;
  }
  r.note = "Allowed once by you. Your rules stay the same.";
  return settle(r, { amount: r.amount, payTo: r.payTo, description: r.description });
}
