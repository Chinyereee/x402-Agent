// Prototype data for the wireframes. Nothing here is a real payment.
import type { Rules, Service, Check } from "./rules.ts";

export const ENGINE: Service = {
  name: "Codemod engine",
  payTo: "GCHINYERE…ENGINE",
  keywords: ["codemod", "upgrade", "engine"],
};
export const DEPLOY: Service = { name: "Deploy service", payTo: "GDEPLOY…SERVICE", keywords: ["deploy"] };

export const OWNER = "Lina";
export const RULES_TEXT = "$2 a month, at most $0.25 a payment, only the codemod service";

export const RULES: Rules = {
  monthlyBudget: 20_000_000,
  capPerPayment: 2_500_000,
  allow: [ENGINE],
};

export type Status = "paid" | "pending" | "needs_you" | "blocked";

export type Step = { at: string; label: string; detail?: string };

export type Receipt = {
  id: string;
  at: string;
  status: Status;
  what: string;
  why: string;
  service: string;
  amount: number;
  checks: Check[];
  pr?: string;
  tx?: string;
  expiresIn?: string;
  steps: Step[];
};

export const RECEIPTS: Receipt[] = [
  {
    id: "0045",
    at: "Today, 4:12 PM",
    status: "pending",
    what: "ethers v5 to v6 upgrade, tutor-site",
    why: "You asked: \"Upgrade ethers in my site repo too.\"",
    service: ENGINE.name,
    amount: 500_000,
    expiresIn: "13 min",
    checks: [
      { rule: "Allowed service", ok: true, detail: "Codemod engine is on the list" },
      { rule: "Cap per payment", ok: true, detail: "$0.05 against a $0.25 cap" },
      { rule: "Monthly budget", ok: true, detail: "$1.95 available after paid and pending" },
    ],
    steps: [
      { at: "4:12:03", label: "Asked for payment", detail: "402 · 0.05 USDC · stellar:testnet" },
      { at: "4:12:03", label: "Rules checked", detail: "All three passed" },
      { at: "4:12:04", label: "Signed", detail: "Valid for 15 minutes; held as pending" },
      { at: "4:12:05", label: "Verified by the facilitator" },
      { at: "4:12:06", label: "Engine working", detail: "Cloning, transforming, opening the pull request" },
    ],
  },
  {
    id: "0044",
    at: "Today, 2:40 PM",
    status: "blocked",
    what: "Deploy to production",
    why: "Your agent tried to deploy after the upgrade.",
    service: DEPLOY.name,
    amount: 1_000_000,
    checks: [
      { rule: "Allowed service", ok: false, detail: "Deploy service is not on your list" },
      { rule: "Cap per payment", ok: true, detail: "$0.10 against a $0.25 cap" },
      { rule: "Monthly budget", ok: true, detail: "$1.95 available after paid and pending" },
    ],
    steps: [
      { at: "2:40:11", label: "Asked for payment", detail: "402 · 0.10 USDC" },
      { at: "2:40:11", label: "Blocked", detail: "Not on your list. Nothing was signed or paid." },
    ],
  },
  {
    id: "0043",
    at: "Today, 11:05 AM",
    status: "needs_you",
    what: "Full repository audit",
    why: "Your agent wanted a check before upgrading.",
    service: ENGINE.name,
    amount: 4_000_000,
    checks: [
      { rule: "Allowed service", ok: true, detail: "Codemod engine is on the list" },
      { rule: "Cap per payment", ok: false, detail: "$0.40 against a $0.25 cap" },
      { rule: "Monthly budget", ok: true, detail: "$1.95 available after paid and pending" },
    ],
    steps: [
      { at: "11:05:40", label: "Asked for payment", detail: "402 · 0.40 USDC" },
      { at: "11:05:40", label: "Waiting for you", detail: "Over your cap. Nothing signed yet." },
    ],
  },
  {
    id: "0042",
    at: "Today, 9:31 AM",
    status: "paid",
    what: "ethers v5 to v6 upgrade, scheduler-app",
    why: "You asked: \"Upgrade ethers from v5 to v6 in my app.\"",
    service: ENGINE.name,
    amount: 500_000,
    pr: "PR #12",
    tx: "7c1e…f04a",
    checks: [
      { rule: "Allowed service", ok: true, detail: "Codemod engine is on the list" },
      { rule: "Cap per payment", ok: true, detail: "$0.05 against a $0.25 cap" },
      { rule: "Monthly budget", ok: true, detail: "$2.00 available after paid and pending" },
    ],
    steps: [
      { at: "9:31:02", label: "Asked for payment", detail: "402 · 0.05 USDC · stellar:testnet" },
      { at: "9:31:02", label: "Rules checked", detail: "All three passed" },
      { at: "9:31:03", label: "Signed", detail: "Valid for 15 minutes; held as pending" },
      { at: "9:31:04", label: "Verified by the facilitator" },
      { at: "9:32:10", label: "Pull request opened", detail: "8 transforms, 1 line needs a human" },
      { at: "9:32:13", label: "Settled on Stellar", detail: "0.05 USDC moved; pending became paid" },
    ],
  },
];

export const LEDGER = { paidThisMonth: 500_000, pending: 500_000 };

export const STATUS_LABEL: Record<Status, string> = {
  paid: "Paid",
  pending: "Pending",
  needs_you: "Needs you",
  blocked: "Blocked",
};
