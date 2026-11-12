import Link from "next/link";
import { Pill } from "@/components/Pill.tsx";
import { usd } from "@/lib/money.ts";
import { ledger, readReceipts } from "@/lib/live.ts";
import { readRules } from "@/lib/rules-store.ts";
import { fromLive } from "@/lib/receipt-view.ts";
import { OWNER } from "@/lib/sample.ts";

export const dynamic = "force-dynamic";

// Home: the allowance, the owner's rules and every receipt, all from real testnet payments.
export default async function Home() {
  const [{ rules, text }, live] = await Promise.all([readRules(), readReceipts()]);
  const l = ledger(live);
  const { monthlyBudget, capPerPayment, allow } = rules;
  const available = monthlyBudget - l.paidThisMonth - l.pending;
  const pct = (n: number) => `${Math.min(100, (n / monthlyBudget) * 100)}%`;
  const receipts = live.map(fromLive);

  return (
    <>
      <h1>Good afternoon, {OWNER}</h1>
      <p className="lead">Your agent spends inside the rules you wrote. Here is everything it paid, asked about or was stopped from paying, on Stellar testnet.</p>

      <div className="grid">
        <section className="card">
          <div className="muted small">Available this month</div>
          <div className="big">{usd(available)}</div>
          <div className="bar">
            <span style={{ width: pct(l.paidThisMonth), background: "var(--paid)" }} />
            <span style={{ width: pct(l.pending), background: "var(--pending)", opacity: 0.5 }} />
          </div>
          <div className="legend">
            <span><i className="dot" style={{ background: "var(--paid)" }} />{usd(l.paidThisMonth)} paid</span>
            <span><i className="dot" style={{ background: "var(--pending)", opacity: 0.5 }} />{usd(l.pending)} pending</span>
            <span><i className="dot" style={{ background: "var(--line)" }} />of {usd(monthlyBudget)}</span>
          </div>
        </section>

        <section className="card">
          <h2>Your rules</h2>
          <div className="chips">
            <span className="chip">{usd(monthlyBudget)} a month</span>
            <span className="chip">At most {usd(capPerPayment)} a payment</span>
            {allow.map((s) => <span key={s.payTo} className="chip">Only {s.name}</span>)}
          </div>
          <p className="quote">&ldquo;{text}&rdquo;</p>
          <div className="actions"><Link href="/hifi/rules" className="btn ghost">Change rules</Link></div>
        </section>
      </div>

      <h2>Receipts</h2>
      {receipts.length === 0 && <p className="muted">No payments yet. Try the <Link href="/hifi/live">live page</Link>.</p>}
      <div className="list">
        {receipts.map((r) => (
          <Link key={r.id} href={`/hifi/receipts/${r.id}`} className="row">
            <div className="when muted small">{r.at}</div>
            <div>
              <div className="what">{r.what}</div>
              <div className="links">
                <Pill status={r.status} />
                {r.status === "pending" && <span className="muted">signed, settling on Stellar</span>}
                {r.status === "needs_you" && <span className="muted">over your cap · tap to decide</span>}
                {r.status === "blocked" && <span className="muted">nothing paid</span>}
                {r.tx && <span className="muted">Tx {r.tx}</span>}
              </div>
            </div>
            <div className="amt">{usd(r.amount)}</div>
          </Link>
        ))}
      </div>
    </>
  );
}
