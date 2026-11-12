"use client";

import { useCallback, useEffect, useState } from "react";
import type { LiveReceipt } from "@/lib/live.ts";

const UNITS = 10_000_000;
const usd = (units: number) => `$${(units / UNITS).toFixed(units < 0.01 * UNITS && units > 0 ? 3 : 2)}`;
const usdc = (units: number) => `${(units / UNITS).toFixed(3)} USDC`;

// What the agent can ask for on the workshop kit's paid API.
const ITEMS: { path: string; what: string; price: string; seller?: string }[] = [
  { path: "/paid/sun-forecast", what: "Sun forecast", price: "$0.001" },
  { path: "/paid/installers", what: "Solar installers", price: "$0.002" },
  { path: "/paid/supplier-prices", what: "Inverter prices", price: "$0.01" },
  { path: "/paid/market-report", what: "Full market report", price: "$0.50" },
  { path: "/api/v1/migrate", what: "Codemod: ethers v5 → v6", price: "$0.05", seller: "engine" },
];

type State = {
  receipts: LiveReceipt[];
  ledger: { paidThisMonth: number; pending: number };
  rules: { monthlyBudget: number; capPerPayment: number; allow: string[]; text: string };
};

const STAMP: Record<LiveReceipt["status"], string> = {
  paid: "PAID", pending: "PENDING", needs_you: "NEEDS YOU", blocked: "VOID", declined: "DECLINED", failed: "FAILED",
};

type Allowance = {
  enabled: boolean; owner?: string; agent?: string; allowance?: number; agentFloat?: number; ownerBalance?: number;
  untilISO?: string | null; expired?: boolean; explorer?: string;
  history?: { at: string; kind: string; amount: number; hash?: string; note?: string }[];
};

export function Live() {
  const [state, setState] = useState<State | null>(null);
  const [allow, setAllow] = useState<Allowance | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [a, b] = await Promise.all([fetch("/api/live").then((r) => r.json()), fetch("/api/allowance").then((r) => r.json())]);
    setState(a); setAllow(b);
  }, []);

  async function setAllowance(action: "grant" | "revoke") {
    setBusy(action); setError(null);
    try {
      const res = await fetch("/api/allowance", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action }) });
      if (!res.ok) setError((await res.json()).error ?? "Stellar refused it");
    } finally { setBusy(null); load(); }
  }
  useEffect(() => { load(); }, [load]);

  async function post(body: object, key: string) {
    setBusy(key); setError(null);
    try {
      const res = await fetch("/api/live", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) setError(json.error);
    } finally {
      setBusy(null);
      load();
    }
  }

  if (!state) return <p className="muted">Loading…</p>;
  const { receipts, ledger, rules } = state;
  const available = rules.monthlyBudget - ledger.paidThisMonth - ledger.pending;

  return (
    <div className="lv">
      <aside className="lv-side">
        <div className="st-card">
          <div className="st-card-top"><span className="st-chip" /><span>Agent allowance · Testnet</span></div>
          <div className="st-card-avail"><span>Available this month</span><b>{usd(available)}</b></div>
          <div className="st-card-limit">LIMIT {usd(rules.monthlyBudget)} / MONTH · {usd(rules.capPerPayment)} / PAYMENT</div>
        </div>
        <p className="lv-rules">&ldquo;{rules.text}&rdquo;<br /><span className="muted small">Allowed: {rules.allow.join(", ")}</span></p>

        {allow?.enabled && (
          <div className="lv-onchain">
            <div className="lv-onchain-head"><b>On-chain allowance</b><span className="muted small">enforced by Stellar</span></div>
            <div className="lv-onchain-row"><span>Left for the agent</span><b>{usdc(allow.allowance ?? 0)}</b></div>
            <div className="lv-onchain-row"><span>Expires</span><b>{allow.untilISO ? new Date(allow.untilISO).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}</b></div>
            <div className="lv-onchain-row"><span>Agent&apos;s float</span><b>{usdc(allow.agentFloat ?? 0)}</b></div>
            <p className="muted small">The agent keeps a small float and tops it up from Lina&apos;s wallet. Over the allowance or after it expires, Stellar refuses the top-up.</p>
            <div className="lv-ask">
              <button className="btn primary" disabled={!!busy} onClick={() => setAllowance("grant")}>{busy === "grant" ? "Signing…" : `Grant ${usd(available)} to month end`}</button>
              <button className="btn ghost" disabled={!!busy} onClick={() => setAllowance("revoke")}>{busy === "revoke" ? "Signing…" : "Revoke"}</button>
            </div>
            <ul className="lv-hist">
              {(allow.history ?? []).map((h, i) => (
                <li key={i}>
                  <span>{h.kind === "approve" ? "Granted" : h.kind === "revoke" ? "Revoked" : h.kind === "topup" ? "Top-up" : "Refused by Stellar"} {h.kind !== "revoke" ? usdc(h.amount) : ""}</span>
                  {h.hash ? <a href={`${allow.explorer}/tx/${h.hash}`} target="_blank" rel="noreferrer">tx ↗</a> : <span className="muted">{h.note}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        <h2>Ask the agent to buy</h2>
        <div className="lv-items">
          {ITEMS.map((it) => (
            <button key={it.path} className="lv-item" disabled={!!busy} onClick={() => post({ action: "buy", path: it.path, seller: it.seller ?? "main" }, it.path)}>
              <span>{it.what}</span>
              <b>{busy === it.path ? "Paying…" : it.price}</b>
            </button>
          ))}
        </div>
        {error && <p className="lv-error">{error}</p>}
        <p className="muted small">Real x402 payments on Stellar testnet, settled through the Coinbase facilitator. The seller for now is the workshop kit&apos;s paid API.</p>
      </aside>

      <section className="lv-receipts">
        {receipts.length === 0 && <p className="muted">No receipts yet. Ask the agent to buy something.</p>}
        {receipts.map((r) => (
          <div key={r.id} className="rc-paper torn lv-paper">
            <div className="rc-line strong"><span>RECEIPTS</span><span>TESTNET</span></div>
            <div className="rc-line"><span>Lina&apos;s agent wallet</span></div>
            <div className="rc-line"><span>{new Date(r.at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</span></div>
            <div className="rc-line rc-rule" />
            <div className="rc-line"><span>{r.service}</span></div>
            <div className="rc-line lv-desc"><span>{r.description}</span></div>
            <div className="rc-line"><span>PRICE</span><span>{usdc(r.amount)}</span></div>
            <div className="rc-line rc-rule" />
            <div className="rc-line"><span>RULES</span><span>{r.checks.map((c) => `${c.rule.split(" ")[0].toLowerCase()} ${c.ok ? "✓" : "✕"}`).join(" ")}</span></div>
            {r.note && <div className="rc-line lv-note"><span>{r.note}</span></div>}
            {r.status === "paid" && r.tx && (
              <>
                <div className="rc-line rc-rule" />
                <div className="rc-line strong"><span>TOTAL</span><span>{usdc(r.amount)}</span></div>
                <div className="rc-line"><span>SETTLED</span><span>stellar:testnet</span></div>
                <div className="rc-line"><span>FEE</span><span>paid by facilitator</span></div>
                <a className="rc-line lv-tx" href={r.link} target="_blank" rel="noreferrer"><span>TX {r.tx.slice(0, 8)}…{r.tx.slice(-6)}</span><span>open ↗</span></a>
              </>
            )}
            {r.status === "needs_you" && (
              <div className="lv-ask">
                <button className="btn primary" disabled={!!busy} onClick={() => post({ action: "allow", id: r.id }, r.id)}>{busy === r.id ? "Paying…" : `Allow once, ${usd(r.amount)}`}</button>
                <button className="btn ghost" disabled={!!busy} onClick={() => post({ action: "decline", id: r.id }, r.id + "n")}>Say no</button>
              </div>
            )}
            <div className={`rc-stamp lv-stamp ${r.status}`}>{STAMP[r.status]}</div>
          </div>
        ))}
      </section>
    </div>
  );
}
