import { toUnits, usd } from "./money.ts";

export type Service = { name: string; payTo: string; keywords: string[] };

export type Rules = {
  monthlyBudget: number; // atomic units
  capPerPayment: number; // atomic units
  allow: Service[];
};

export type Parsed = { rules: Partial<Rules>; understood: string[]; unread: string[] };

/**
 * Turns the owner's plain words into hard limits, once. Deterministic on purpose:
 * no model sits between the owner's words and the payment path. Anything it
 * can't read is returned in `unread`, so the owner sees it before confirming.
 */
export function parseRules(text: string, services: Service[]): Parsed {
  const rules: Partial<Rules> = {};
  const understood: string[] = [];
  const parts = text.split(/[,;\n]|\band\b/i).map((p) => p.trim()).filter(Boolean);
  const unread: string[] = [];

  for (const part of parts) {
    const lower = part.toLowerCase();
    const money = lower.match(/\$\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*(?:usd|usdc|dollars?)/);
    const amount = money ? toUnits(Number(money[1] ?? money[2])) : null;

    if (amount !== null && /\b(a|per|each)\s+(payment|call|request)|at most|max|up to/.test(lower)) {
      rules.capPerPayment = amount;
      understood.push(`At most ${usd(amount)} a payment`);
    } else if (amount !== null && /\b(a|per|each|every)\s+month|monthly/.test(lower)) {
      rules.monthlyBudget = amount;
      understood.push(`${usd(amount)} a month`);
    } else if (/\bonly\b/.test(lower)) {
      const hits = services.filter((s) => s.keywords.some((k) => lower.includes(k)));
      if (hits.length) {
        rules.allow = hits;
        understood.push(`Only ${hits.map((s) => s.name).join(", ")}`);
      } else unread.push(part);
    } else unread.push(part);
  }
  return { rules, understood, unread };
}

export function isComplete(r: Partial<Rules>): r is Rules {
  return r.monthlyBudget !== undefined && r.capPerPayment !== undefined && !!r.allow?.length;
}

export type PaymentRequest = { payTo: string; amount: number; what: string };
export type Ledger = { paidThisMonth: number; pending: number };
export type Check = { rule: string; ok: boolean; detail: string };
export type Decision = { outcome: "pay" | "ask" | "block"; checks: Check[] };

/** Runs before any signature. Off the list blocks; over the cap or the budget asks. */
export function check(rules: Rules, req: PaymentRequest, ledger: Ledger): Decision {
  const service = rules.allow.find((s) => s.payTo === req.payTo);
  const left = rules.monthlyBudget - ledger.paidThisMonth - ledger.pending;
  const checks: Check[] = [
    {
      rule: "Allowed service",
      ok: !!service,
      detail: service ? `${service.name} is on the list` : "This address is not on the list",
    },
    {
      rule: "Cap per payment",
      ok: req.amount <= rules.capPerPayment,
      detail: `${usd(req.amount)} against a ${usd(rules.capPerPayment)} cap`,
    },
    {
      rule: "Monthly budget",
      ok: req.amount <= left,
      detail: `${usd(left)} available after paid and pending`,
    },
  ];
  const outcome = !checks[0].ok ? "block" : checks.every((c) => c.ok) ? "pay" : "ask";
  return { outcome, checks };
}
