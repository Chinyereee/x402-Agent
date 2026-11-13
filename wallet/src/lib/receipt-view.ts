// Shapes a live testnet receipt for the Home list and the receipt page.
import type { Receipt, Status } from "./sample.ts";
import type { LiveReceipt } from "./live.ts";
import { prLabel, prUrl } from "./pr.ts";

const STATUS: Record<LiveReceipt["status"], Status> = {
  paid: "paid", pending: "pending", needs_you: "needs_you", blocked: "blocked", declined: "blocked", failed: "blocked",
};

const time = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export function fromLive(r: LiveReceipt): Receipt & { link?: string; prLink?: string } {
  const pr = prUrl(r.data);
  const steps = [
    { at: time(r.at), label: "Asked for payment", detail: `402 · ${(r.amount / 1e7).toString()} USDC · stellar:testnet` },
    { at: "", label: "Rules checked", detail: r.checks.every((c) => c.ok) ? "All three passed" : r.checks.filter((c) => !c.ok).map((c) => c.detail).join("; ") },
  ];
  if (r.status === "paid") {
    steps.push({ at: "", label: "Signed", detail: "Exactly the quoted amount, to the quoted address" });
    steps.push({ at: "", label: "Settled on Stellar", detail: `Fee paid by the facilitator · tx ${r.tx?.slice(0, 8)}…` });
  } else if (r.note) steps.push({ at: "", label: r.status === "needs_you" ? "Waiting for you" : "Not paid", detail: r.note });
  return {
    id: r.id,
    at: time(r.at),
    status: STATUS[r.status],
    what: r.description.replace(/\s*\(.*\)\s*$/, ""),
    why: `Lina's agent asked ${r.service} for it.`,
    service: r.service,
    amount: r.amount,
    checks: r.checks,
    tx: r.tx ? `${r.tx.slice(0, 8)}…${r.tx.slice(-6)}` : undefined,
    link: r.link,
    ...(pr ? { pr: `Pull request ${prLabel(pr)}`, prLink: pr } : {}),
    steps,
  };
}
