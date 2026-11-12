// Live testnet payments for the Receipts wallet (server only).
// Reads the price out of a 402, checks the owner's rules in code, then pays through x402
// and keeps a receipt with the real Stellar transaction. Testnet only.
// Every step can be reported as it happens (emit), so the UI prints only real events.
import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { wrapFetchWithPaymentFromConfig, decodePaymentResponseHeader } from "@x402/fetch";
import { createEd25519Signer } from "@x402/stellar";
import { ExactStellarScheme } from "@x402/stellar/exact/client";
import { check, type Check, type Rules } from "./rules.ts";
import { readRules } from "./rules-store.ts";

const env = (key: string) => {
  const v = process.env[key];
  if (!v) throw new Error(`${key} is missing in wallet/.env.local`);
  return v;
};

const network = () => env("WALLET_NETWORK") as `${string}:${string}`;

// The rules the owner confirmed in plain words (see rules-store.ts).
export async function rules(): Promise<Rules> {
  return (await readRules()).rules;
}

// Sellers the agent can call. "other" is a second seller that is not on the owner's list.
export type Seller = "main" | "other";
const sellerBase = (s: Seller) => env(s === "main" ? "SERVICE_BASE_URL" : "OTHER_SERVICE_BASE_URL");

export type LiveStatus = "paid" | "pending" | "needs_you" | "blocked" | "declined" | "failed";

export type LiveReceipt = {
  id: string;
  at: string;
  seller: Seller;
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

export type LiveEvent =
  | { type: "request"; path: string; seller: Seller }
  | { type: "quote"; amount: number; payTo: string; description: string; service: string }
  | { type: "rules"; checks: Check[]; outcome: "pay" | "ask" | "block"; available: number }
  | { type: "blocked" | "ask" | "declined" | "failed"; receipt: LiveReceipt }
  | { type: "signed"; available: number }
  | { type: "settled"; receipt: LiveReceipt }
  | { type: "drawer"; balance: number };

type Emit = (e: LiveEvent) => void;
const quiet: Emit = () => {};

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

export async function available() {
  const l = ledger(await readReceipts());
  return (await rules()).monthlyBudget - l.paidThisMonth - l.pending;
}

// The seller's USDC balance on Stellar, read from Horizon: the real cash drawer.
export async function sellerBalance(payTo = env("SERVICE_PAYTO")): Promise<number> {
  const res = await fetch(`${env("WALLET_HORIZON_URL")}/accounts/${payTo}`);
  if (!res.ok) return 0;
  const acc = await res.json();
  const b = acc.balances?.find((x: { asset_code?: string; asset_issuer?: string }) => x.asset_code === "USDC" && x.asset_issuer === env("WALLET_USDC_ISSUER"));
  return b ? Math.round(Number(b.balance) * 10_000_000) : 0;
}

type Quote = { amount: number; payTo: string; description: string };

// Read the price out of a 402 WITHOUT paying.
async function quote(url: string): Promise<Quote> {
  const res = await fetch(url);
  if (res.status !== 402) throw new Error(res.ok ? "This resource is free; nothing to pay." : `HTTP ${res.status}`);
  const header = res.headers.get("PAYMENT-REQUIRED");
  if (!header) throw new Error("402 without PAYMENT-REQUIRED");
  const { resource, accepts } = JSON.parse(Buffer.from(header, "base64").toString("utf8"));
  const offer = accepts.find((o: { network: string; asset: string }) => o.network === network() && o.asset === env("WALLET_USDC_CONTRACT"));
  if (!offer) throw new Error("no USDC offer on this network");
  return { amount: Number(offer.amount), payTo: offer.payTo, description: resource?.description ?? "" };
}

// A fetch that signs at most the approved amount, to the approved address.
// The inner fetch reports the moment the signed retry leaves the wallet.
function payingFetch(q: Quote, onSigned: () => void) {
  const signer = createEd25519Signer(env("WALLET_AGENT_SECRET"), network());
  const observed: typeof fetch = (input, init) => {
    const h = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    if (h.has("PAYMENT-SIGNATURE")) onSigned();
    return fetch(input, init);
  };
  return wrapFetchWithPaymentFromConfig(observed, {
    schemes: [{ network: network(), client: new ExactStellarScheme(signer, { url: env("WALLET_RPC_URL") }) }],
    policies: [(_v, offers) => offers.filter((o) => Number(o.amount) <= q.amount && o.payTo === q.payTo)],
  });
}

async function settle(r: LiveReceipt, q: Quote, emit: Emit): Promise<LiveReceipt> {
  try {
    const res = await payingFetch(q, async () => {
      r.status = "pending"; // signed, not yet settled: counts against the allowance
      await save(r);
      emit({ type: "signed", available: await available() });
    })(`${sellerBase(r.seller)}${r.path}`);
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
  if (r.status === "paid") {
    emit({ type: "settled", receipt: r });
    emit({ type: "drawer", balance: await sellerBalance(r.payTo) });
  } else emit({ type: "failed", receipt: r });
  return r;
}

// The agent asks to buy one paid resource. The wallet decides.
export async function buy(pathname: string, seller: Seller = "main", emit: Emit = quiet): Promise<LiveReceipt> {
  emit({ type: "request", path: pathname, seller });
  const q = await quote(`${sellerBase(seller)}${pathname}`);
  const r0 = await rules();
  const allowed = r0.allow.find((s) => s.payTo === q.payTo);
  const service = allowed?.name ?? "Unknown seller";
  emit({ type: "quote", amount: q.amount, payTo: q.payTo, description: q.description, service });
  const all = await readReceipts();
  const decision = check(r0, { payTo: q.payTo, amount: q.amount, what: pathname }, ledger(all));
  emit({ type: "rules", checks: decision.checks, outcome: decision.outcome, available: await available() });
  const r: LiveReceipt = {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    at: new Date().toISOString(),
    seller,
    path: pathname,
    service,
    description: q.description,
    amount: q.amount,
    payTo: q.payTo,
    status: decision.outcome === "block" ? "blocked" : decision.outcome === "ask" ? "needs_you" : "pending",
    checks: decision.checks,
  };
  if (decision.outcome === "block") {
    r.note = "Not on your list. Nothing was signed.";
    await save(r);
    emit({ type: "blocked", receipt: r });
    return r;
  }
  if (decision.outcome === "ask") {
    r.note = "Over your cap. Waiting for you; nothing signed yet.";
    await save(r);
    emit({ type: "ask", receipt: r });
    return r;
  }
  return settle(r, q, emit);
}

// The owner answers a "Needs you" receipt.
export async function answer(id: string, allow: boolean, emit: Emit = quiet): Promise<LiveReceipt> {
  const r = (await readReceipts()).find((x) => x.id === id);
  if (!r || r.status !== "needs_you") throw new Error("Nothing waiting with that id.");
  r.seller ??= "main";
  if (!allow) {
    r.status = "declined";
    r.note = "You said no. Nothing was signed or paid.";
    await save(r);
    emit({ type: "declined", receipt: r });
    return r;
  }
  r.note = "Allowed once by you. Your rules stay the same.";
  return settle(r, { amount: r.amount, payTo: r.payTo, description: r.description }, emit);
}
