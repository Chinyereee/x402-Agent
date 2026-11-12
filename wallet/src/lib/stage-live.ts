// Turns the wallet's real payment events into stage steps. Nothing here is invented:
// each step comes from an event the server sent when it actually happened.
import type { Check } from "./rules.ts";
import type { Line, Scenario, Script, Step } from "./stage.ts";

const UNITS = 10_000_000;
const usdc = (units: number) => (units / UNITS).toFixed(units % (UNITS / 100) === 0 ? 2 : 3);
const toCents = (units: number) => (units / UNITS) * 100;

export const LIVE_REQUEST: Record<Exclude<Scenario, "statement">, { path: string; seller: "main" | "other" }> = {
  paid: { path: "/paid/supplier-prices", seller: "main" },
  needs: { path: "/paid/market-report", seller: "main" },
  blocked: { path: "/paid/installers", seller: "other" },
};

type Receipt = {
  at: string; service: string; description: string; amount: number; status: string; checks: Check[];
  note?: string; tx?: string; link?: string; data?: unknown; id: string;
};

export type LiveBoot = {
  receipts: Receipt[];
  drawer: number;
  ledger: { paidThisMonth: number; pending: number };
  rules: { monthlyBudget: number; capPerPayment: number };
};

type Ev =
  | { type: "request"; path: string; seller: string }
  | { type: "quote"; amount: number; payTo: string; description: string; service: string }
  | { type: "rules"; checks: Check[]; outcome: "pay" | "ask" | "block"; available: number }
  | { type: "blocked" | "ask" | "declined" | "failed"; receipt: Receipt }
  | { type: "signed"; available: number }
  | { type: "settled"; receipt: Receipt }
  | { type: "drawer"; balance: number }
  | { type: "error"; message: string }
  | { type: "statement"; receipts: Receipt[] };

const head = (): Line[] => [
  { k: "text", left: "RECEIPTS", right: "TESTNET", strong: true },
  { k: "text", left: "Lina's agent wallet" },
  { k: "text", left: new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) },
  { k: "rule" },
];

// A short, honest summary of what the seller returned.
function dataLines(data: unknown): Line[] {
  if (!data || typeof data !== "object") return [];
  return Object.entries(data as Record<string, unknown>)
    .filter(([k]) => k !== "demo")
    .slice(0, 4)
    .map(([k, v]) => ({
      k: "text" as const,
      left: k,
      right: Array.isArray(v) ? `${v.length} items` : typeof v === "object" ? "…" : String(v).slice(0, 26),
    }));
}

let price = "";
let item = "";

export function liveSteps(e: Ev, setScript: (f: (s: Script) => Script) => void): Step[] {
  switch (e.type) {
    case "request":
      return [{ wait: 0, buyer: { status: "Asking the seller", tone: "work" }, seller: { status: "Request in", log: `GET ${e.path}` }, slip: { label: `GET ${e.path.replace("/paid", "")}`, dir: "ltr" } }];
    case "quote": {
      price = usdc(e.amount);
      item = e.description.replace(/\s*\(.*\)\s*$/, "");
      setScript(() => ({ merchant: e.service, city: e.service === "Unknown seller" ? "off-list" : "listed", item, price, checks: [], steps: [] }));
      return [{
        wait: 0,
        buyer: { status: "Price received", tone: "work", note: `$${price} for this` },
        seller: { status: `Asking ${price} USDC`, log: "402 Payment Required" },
        slip: { label: "PAYMENT-REQUIRED", dir: "rtl" },
        print: [...head(), { k: "text", left: e.service }, { k: "text", left: item.slice(0, 40) }, { k: "text", left: "PRICE", right: `${price} USDC` }, { k: "rule" }],
        familiar: ["402 Payment Required", "The price lights up on the card terminal"],
      }];
    }
    case "rules": {
      setScript((s) => ({ ...s, checks: e.checks.map((c) => ({ label: c.detail, ok: c.ok })) }));
      const steps: Step[] = [1, 2, 3].map((n) => ({
        wait: 0,
        buyer: { status: "Checking your rules", tone: "work", checks: n },
        seller: { status: "Waiting for payment" },
        ...(n === 1 ? { familiar: ["Rules in plain words", "An allowance, a card limit"] as [string, string] } : {}),
      }));
      if (e.outcome === "pay") steps[2].print = [{ k: "text", left: "RULES", right: "allowed ✓ cap ✓ budget ✓" }];
      return steps;
    }
    case "blocked":
      return [{
        wait: 0,
        buyer: { status: "Declined", tone: "declined", checks: 3, note: "Not on your list. Nothing signed." },
        seller: { status: "No payment came" },
        print: [{ k: "text", left: "RULES", right: "allowed ✕" }, { k: "text", left: "DECLINED", right: "nothing signed", strong: true }, { k: "rule" }, { k: "text", left: "TOTAL", right: "0.00 USDC", strong: true }],
        stamp: "void",
        familiar: ["Blocked by the rules", "A declined card: “Declined”, nothing charged"],
      }];
    case "ask":
      return [{
        wait: 0,
        buyer: { status: "Needs you", tone: "ask", checks: 3, ask: true, note: e.receipt.note },
        seller: { status: "Waiting for payment" },
        print: [{ k: "text", left: "RULES", right: "allowed ✓ cap ✕ budget ✓" }, { k: "text", left: "NEEDS YOUR OK", strong: true }, { k: "sign" }],
        familiar: ["Over the cap, so it asks", "“Approve this purchase?” on your phone"],
        askId: e.receipt.id,
      }];
    case "declined":
      return [{
        wait: 0, buyer: { status: "Declined by you", tone: "declined", checks: 3, note: "Nothing was signed or paid." }, seller: { status: "No payment came" },
        print: [{ k: "text", left: "DECLINED", right: "by Lina", strong: true }], stamp: "void",
      }];
    case "signed":
      return [
        {
          wait: 0,
          buyer: { status: "Signed", tone: "pending", checks: 3, note: `Signed for exactly ${price} USDC` },
          seller: { status: "Payment signed", log: "verifying with the facilitator" },
          slip: { label: "PAYMENT-SIGNATURE", dir: "ltr" },
          print: [{ k: "signed" }],
          available: toCents(e.available),
          familiar: ["Signing the authorization", "Signing the slip"],
        },
        {
          wait: 0,
          buyer: { status: "Pending", tone: "pending", checks: 3, note: "Held until it settles on Stellar" },
          seller: { status: "Verifying" },
          stamp: "pending",
          familiar: ["Signed, not yet settled", "“Pending” in your bank app, a hotel hold"],
        },
      ];
    case "settled": {
      const r = e.receipt;
      const short = r.tx ? `${r.tx.slice(0, 8)}…${r.tx.slice(-6)}` : "";
      return [{
        wait: 0,
        buyer: { status: "Posted", tone: "paid", checks: 3, note: `${price} USDC to ${r.service}` },
        seller: { status: "Settled", log: `settled · tx ${short}` },
        slip: { label: "PAYMENT-RESPONSE", dir: "rtl", coin: price },
        print: [
          { k: "rule" },
          ...dataLines(r.data),
          { k: "rule" },
          { k: "text", left: "TOTAL", right: `${price} USDC`, strong: true },
          { k: "text", left: "SETTLED", right: "stellar:testnet" },
          { k: "text", left: "FEE", right: "paid by facilitator" },
          { k: "barcode", label: `TX ${short}` },
          ...(r.link ? [{ k: "link" as const, label: "View on stellar.expert", href: r.link }] : []),
        ],
        stamp: "paid",
        familiar: ["Settled on Stellar", "“Posted”: the charge is final"],
      }];
    }
    case "drawer":
      return [{
        wait: 0,
        buyer: { status: "Posted", tone: "paid", checks: 3 },
        seller: { status: "Received", log: `+${price} USDC in the drawer` },
        drawer: true,
        receivedAbs: toCents(e.balance),
        familiar: ["The seller gets paid", "The cash drawer pops open: ding"],
      }];
    case "failed":
      return [{ wait: 0, buyer: { status: "Not paid", tone: "declined", checks: 3, note: e.receipt.note }, seller: { status: "Not settled" }, stamp: "void" }];
    case "error":
      return [{ wait: 0, buyer: { status: "Something went wrong", tone: "declined", note: e.message }, seller: { status: "—" } }];
    case "statement": {
      const month = new Date().toISOString().slice(0, 7);
      const mine = e.receipts.filter((r) => r.at.startsWith(month)).reverse();
      const paid = mine.filter((r) => r.status === "paid").reduce((n, r) => n + r.amount, 0);
      setScript(() => ({ merchant: "Solar Data (workshop kit)", city: "listed", item: "Statement", price: usdc(paid), checks: [], steps: [] }));
      const rows: Line[] = mine.slice(-8).map((r) => ({
        k: "text",
        left: `${new Date(r.at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} ${r.description.split(" ").slice(0, 3).join(" ").toLowerCase()}`.slice(0, 30),
        right: r.status === "paid" ? usdc(r.amount) : r.status === "blocked" || r.status === "declined" ? "declined" : r.status,
      }));
      return [{
        wait: 0,
        buyer: { status: `${new Date().toLocaleString("en-US", { month: "long" })} statement`, tone: "paid", note: "Everything the agent paid, asked about or was stopped from paying" },
        seller: { status: "This month from Lina", log: `${mine.filter((r) => r.status === "paid").length} payments · ${usdc(paid)} USDC` },
        print: [
          { k: "text", left: "STATEMENT", right: "TESTNET", strong: true },
          { k: "text", left: "Lina's agent wallet" },
          { k: "text", left: new Date().toLocaleString("en-US", { month: "long", year: "numeric" }) },
          { k: "rule" },
          ...rows,
          { k: "rule" },
          { k: "text", left: "PAID", right: `${usdc(paid)} USDC`, strong: true },
          { k: "text", left: "ALLOWANCE", right: "2.00 USDC" },
          { k: "text", left: "DECLINED", right: String(mine.filter((r) => r.status === "blocked" || r.status === "declined").length) },
        ],
        stamp: "posted",
        familiar: ["The month in one view", "Your bank statement"],
      }];
    }
  }
}
