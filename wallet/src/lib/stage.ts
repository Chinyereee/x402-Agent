// Script for the two-sided demo. Each step is one event in the x402 flow; in the prototype the steps run on a timer,
// in the product each one fires only when the real header or settlement result arrives.
// `familiar` pairs each new idea with the payment form people already know.

export type Scenario = "paid" | "needs" | "blocked" | "statement";

export type Line =
  | { k: "text"; left: string; right?: string; faint?: boolean; strong?: boolean }
  | { k: "rule" }
  | { k: "sign" }
  | { k: "signed" }
  | { k: "barcode"; label: string }
  | { k: "link"; label: string; href: string };

export type Slip = { label: string; dir: "ltr" | "rtl"; coin?: string };

export type Step = {
  wait: number; // ms before this step
  buyer: { status: string; tone: "idle" | "work" | "pending" | "ask" | "paid" | "declined"; note?: string; checks?: number; ask?: boolean };
  seller: { status: string; log?: string; received?: number };
  slip?: Slip;
  print?: Line[];
  stamp?: "pending" | "paid" | "void" | "posted";
  available?: number; // cents
  familiar?: [string, string];
  drawer?: boolean;
  receivedAbs?: number; // live: the seller's real balance, in cents
  askId?: string; // live: the receipt waiting for the owner
};

export type Script = {
  merchant: string;
  city: string;
  item: string;
  price: string;
  checks: { label: string; ok: boolean }[];
  steps: Step[];
};

const head: Line[] = [
  { k: "text", left: "RECEIPTS", strong: true },
  { k: "text", left: "Lina's agent wallet" },
  { k: "text", left: "11 Nov 2026", right: "New York" },
  { k: "rule" },
];

const RULES: [string, string] = ["Rules in plain words", "An allowance, a card limit"];

export const SCRIPTS: Record<Scenario, Script> = {
  paid: {
    merchant: "Codemod engine",
    city: "Lagos",
    item: "ethers v5 → v6 upgrade",
    price: "0.05",
    checks: [
      { label: "Allowed service", ok: true },
      { label: "Under the $0.25 cap", ok: true },
      { label: "Inside the $2 budget", ok: true },
    ],
    steps: [
      { wait: 600, buyer: { status: "Asking for a code upgrade", tone: "work" }, seller: { status: "Request in", log: "POST /api/v1/migrate" }, slip: { label: "POST /migrate", dir: "ltr" } },
      { wait: 900, buyer: { status: "Asking for a code upgrade", tone: "work" }, seller: { status: "Preflight passed", log: "repo ok · ethers v5 found" } },
      {
        wait: 900,
        buyer: { status: "Price received", tone: "work", note: "$0.05 for an ethers upgrade" },
        seller: { status: "Asking 0.05 USDC", log: "402 Payment Required" },
        slip: { label: "PAYMENT-REQUIRED", dir: "rtl" },
        print: [...head, { k: "text", left: "Codemod engine", right: "Lagos" }, { k: "text", left: "ethers v5 → v6 upgrade" }, { k: "text", left: "PRICE", right: "0.05 USDC" }, { k: "rule" }],
        familiar: ["402 Payment Required", "The price lights up on the card terminal"],
      },
      { wait: 2200, buyer: { status: "Checking your rules", tone: "work", checks: 1 }, seller: { status: "Waiting for payment" }, familiar: RULES },
      { wait: 600, buyer: { status: "Checking your rules", tone: "work", checks: 2 }, seller: { status: "Waiting for payment" } },
      {
        wait: 600,
        buyer: { status: "Checking your rules", tone: "work", checks: 3 },
        seller: { status: "Waiting for payment" },
        print: [{ k: "text", left: "RULES", right: "allowed ✓ cap ✓ budget ✓" }],
      },
      {
        wait: 1600,
        buyer: { status: "Signed", tone: "pending", checks: 3, note: "The agent signs for exactly $0.05" },
        seller: { status: "Payment signed", log: "verifying with the facilitator" },
        slip: { label: "PAYMENT-SIGNATURE", dir: "ltr" },
        print: [{ k: "signed" }],
        familiar: ["Signing the authorization", "Signing the slip"],
      },
      {
        wait: 2200,
        buyer: { status: "Pending", tone: "pending", checks: 3, note: "Held until the pull request opens" },
        seller: { status: "Verified", log: "facilitator ✓ · cloning repo" },
        print: [{ k: "text", left: "VERIFIED", right: "facilitator", faint: true }],
        stamp: "pending",
        available: 195,
        familiar: ["Signed, not yet settled", "“Pending” in your bank app, a hotel hold"],
      },
      { wait: 1800, buyer: { status: "Pending", tone: "pending", checks: 3, note: "Held until the pull request opens" }, seller: { status: "Working", log: "11 transforms · lockfile" } },
      {
        wait: 1200,
        buyer: { status: "Pending", tone: "pending", checks: 3, note: "Held until the pull request opens" },
        seller: { status: "Pull request opened", log: "PR #12 opened" },
        print: [
          { k: "rule" },
          { k: "text", left: "rename-utils", right: "×6" },
          { k: "text", left: "bigNumber → bigint", right: "×14" },
          { k: "text", left: "await getSigner", right: "×3" },
          { k: "text", left: "needs a human", right: "1" },
          { k: "text", left: "PR #12", right: "opened" },
        ],
      },
      {
        wait: 1200,
        buyer: { status: "Posted", tone: "paid", checks: 3, note: "$0.05 to Codemod engine" },
        seller: { status: "Settled", log: "settled on Stellar" },
        slip: { label: "PAYMENT-RESPONSE", dir: "rtl", coin: "0.05" },
        print: [
          { k: "rule" },
          { k: "text", left: "TOTAL", right: "0.05 USDC", strong: true },
          { k: "text", left: "SETTLED", right: "stellar:testnet" },
          { k: "barcode", label: "TX 7c1e…f04a · sample" },
          { k: "text", left: "Pay per call. No invoices." },
        ],
        stamp: "paid",
        familiar: ["Settled on Stellar", "“Posted”: the charge is final"],
      },
      {
        wait: 2200,
        buyer: { status: "Posted", tone: "paid", checks: 3, note: "$0.05 to Codemod engine" },
        seller: { status: "Received", log: "+0.05 USDC in the drawer", received: 5 },
        drawer: true,
        familiar: ["The seller gets paid", "The cash drawer pops open: ding"],
      },
    ],
  },
  needs: {
    merchant: "Codemod engine",
    city: "Lagos",
    item: "Full repository audit",
    price: "0.40",
    checks: [
      { label: "Allowed service", ok: true },
      { label: "Under the $0.25 cap", ok: false },
      { label: "Inside the $2 budget", ok: true },
    ],
    steps: [
      { wait: 600, buyer: { status: "Asking for an audit", tone: "work" }, seller: { status: "Request in", log: "POST /api/v1/audit" }, slip: { label: "POST /audit", dir: "ltr" } },
      {
        wait: 1000,
        buyer: { status: "Price received", tone: "work", note: "$0.40 for a full audit" },
        seller: { status: "Asking 0.40 USDC", log: "402 Payment Required" },
        slip: { label: "PAYMENT-REQUIRED", dir: "rtl" },
        print: [...head, { k: "text", left: "Codemod engine", right: "Lagos" }, { k: "text", left: "Full repository audit" }, { k: "text", left: "PRICE", right: "0.40 USDC" }, { k: "rule" }],
      },
      { wait: 1000, buyer: { status: "Checking your rules", tone: "work", checks: 1 }, seller: { status: "Waiting for payment" } },
      { wait: 500, buyer: { status: "Checking your rules", tone: "work", checks: 2 }, seller: { status: "Waiting for payment" } },
      {
        wait: 500,
        buyer: { status: "Needs you", tone: "ask", checks: 3, ask: true, note: "Over your $0.25 cap" },
        seller: { status: "Waiting for payment" },
        print: [{ k: "text", left: "RULES", right: "allowed ✓ cap ✕ budget ✓" }, { k: "text", left: "NEEDS YOUR OK", strong: true }, { k: "sign" }],
        familiar: ["Over the cap, so it asks", "“Approve this purchase?” on your phone"],
      },
      {
        wait: 3200,
        buyer: { status: "Allowed once · pending", tone: "pending", checks: 3, note: "Your rules stay the same" },
        seller: { status: "Payment signed", log: "verifying with the facilitator" },
        slip: { label: "PAYMENT-SIGNATURE", dir: "ltr" },
        print: [{ k: "text", left: "ALLOWED ONCE", right: "by Lina" }, { k: "signed" }],
        stamp: "pending",
        available: 155,
      },
      { wait: 1100, buyer: { status: "Allowed once · pending", tone: "pending", checks: 3 }, seller: { status: "Working", log: "42 dependencies scanned" } },
      {
        wait: 1200,
        buyer: { status: "Allowed once · pending", tone: "pending", checks: 3 },
        seller: { status: "Report ready", log: "report attached to PR #13" },
        print: [{ k: "rule" }, { k: "text", left: "dependencies", right: "42" }, { k: "text", left: "out of date", right: "7" }, { k: "text", left: "report", right: "PR #13" }],
      },
      {
        wait: 1100,
        buyer: { status: "Posted", tone: "paid", checks: 3, note: "$0.40, allowed once" },
        seller: { status: "Received", log: "+0.40 USDC in the drawer", received: 40 },
        slip: { label: "PAYMENT-RESPONSE", dir: "rtl", coin: "0.40" },
        print: [{ k: "rule" }, { k: "text", left: "TOTAL", right: "0.40 USDC", strong: true }, { k: "text", left: "SETTLED", right: "stellar:testnet" }, { k: "barcode", label: "TX 2b9d…a71c · sample" }],
        stamp: "paid",
        drawer: true,
      },
    ],
  },
  blocked: {
    merchant: "Deploy service",
    city: "Unknown",
    item: "Deploy to production",
    price: "0.10",
    checks: [
      { label: "Allowed service", ok: false },
      { label: "Under the $0.25 cap", ok: true },
      { label: "Inside the $2 budget", ok: true },
    ],
    steps: [
      { wait: 600, buyer: { status: "Asking to deploy", tone: "work" }, seller: { status: "Request in", log: "POST /deploy" }, slip: { label: "POST /deploy", dir: "ltr" } },
      {
        wait: 1000,
        buyer: { status: "Price received", tone: "work", note: "$0.10 to deploy" },
        seller: { status: "Asking 0.10 USDC", log: "402 Payment Required" },
        slip: { label: "PAYMENT-REQUIRED", dir: "rtl" },
        print: [...head, { k: "text", left: "Deploy service" }, { k: "text", left: "Deploy to production" }, { k: "text", left: "PRICE", right: "0.10 USDC" }, { k: "rule" }],
      },
      {
        wait: 1000,
        buyer: { status: "Declined", tone: "declined", checks: 1, note: "Not on your list. Nothing signed." },
        seller: { status: "No payment came" },
        print: [{ k: "text", left: "RULES", right: "allowed ✕" }, { k: "text", left: "DECLINED", right: "nothing signed", strong: true }, { k: "rule" }, { k: "text", left: "TOTAL", right: "0.00 USDC", strong: true }],
        stamp: "void",
        familiar: ["Blocked by the rules", "A declined card: “Declined”, nothing charged"],
      },
    ],
  },
  statement: {
    merchant: "Codemod engine",
    city: "Lagos",
    item: "November statement",
    price: "0.45",
    checks: [],
    steps: [
      {
        wait: 600,
        buyer: { status: "November statement", tone: "paid", note: "Everything the agent paid, asked about or was stopped from paying" },
        seller: { status: "November from Lina", log: "2 payments · 0.45 USDC" },
        print: [
          { k: "text", left: "STATEMENT", strong: true },
          { k: "text", left: "Lina's agent wallet" },
          { k: "text", left: "November 2026" },
          { k: "rule" },
        ],
        available: 155,
        familiar: ["The month in one view", "Your bank statement"],
      },
      { wait: 500, buyer: { status: "November statement", tone: "paid" }, seller: { status: "November from Lina" }, print: [{ k: "text", left: "09:31 ethers upgrade", right: "0.05" }] },
      { wait: 400, buyer: { status: "November statement", tone: "paid" }, seller: { status: "November from Lina" }, print: [{ k: "text", left: "11:05 repo audit · once", right: "0.40" }] },
      { wait: 400, buyer: { status: "November statement", tone: "paid" }, seller: { status: "November from Lina" }, print: [{ k: "text", left: "14:40 deploy · declined", right: "0.00" }] },
      {
        wait: 500,
        buyer: { status: "November statement", tone: "paid" },
        seller: { status: "November from Lina" },
        print: [
          { k: "rule" },
          { k: "text", left: "PAID", right: "0.45 USDC", strong: true },
          { k: "text", left: "ALLOWANCE", right: "2.00 USDC" },
          { k: "text", left: "AVAILABLE", right: "1.55 USDC" },
          { k: "text", left: "DECLINED", right: "1" },
        ],
        stamp: "posted",
      },
    ],
  },
};
