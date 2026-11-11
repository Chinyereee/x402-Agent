import Link from "next/link";
import { Pill } from "@/components/Pill.tsx";
import { usd } from "@/lib/money.ts";
import { LEDGER, OWNER, RECEIPTS, RULES, RULES_TEXT } from "@/lib/sample.ts";

export default function Home() {
  const { monthlyBudget, capPerPayment, allow } = RULES;
  const available = monthlyBudget - LEDGER.paidThisMonth - LEDGER.pending;
  const pct = (n: number) => `${(n / monthlyBudget) * 100}%`;

  return (
    <>
      <h1>Good afternoon, {OWNER}</h1>
      <p className="lead">Your agent spends inside the rules you wrote. Here is everything it paid, asked about or was stopped from paying.</p>

      <div className="grid">
        <section className="card">
          <div className="muted small">Available this month</div>
          <div className="big">{usd(available)}</div>
          <div className="bar">
            <span style={{ width: pct(LEDGER.paidThisMonth), background: "var(--paid)" }} />
            <span style={{ width: pct(LEDGER.pending), background: "var(--pending)", opacity: 0.5 }} />
          </div>
          <div className="legend">
            <span><i className="dot" style={{ background: "var(--paid)" }} />{usd(LEDGER.paidThisMonth)} paid</span>
            <span><i className="dot" style={{ background: "var(--pending)", opacity: 0.5 }} />{usd(LEDGER.pending)} pending</span>
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
          <p className="quote">&ldquo;{RULES_TEXT}&rdquo;</p>
          <div className="actions"><Link href="/hifi/rules" className="btn ghost">Change rules</Link></div>
        </section>
      </div>

      <h2>Receipts</h2>
      <div className="list">
        {RECEIPTS.map((r) => (
          <Link key={r.id} href={`/hifi/receipts/${r.id}`} className="row">
            <div className="when muted small">{r.at}</div>
            <div>
              <div className="what">{r.what}</div>
              <div className="links">
                <Pill status={r.status} />
                {r.status === "pending" && <span className="muted">settles when the pull request opens · expires in {r.expiresIn}</span>}
                {r.status === "needs_you" && <span className="muted">over your cap · tap to decide</span>}
                {r.status === "blocked" && <span className="muted">not on your list · nothing paid</span>}
                {r.pr && <span className="sample">{r.pr}</span>}
                {r.tx && <span className="sample">Tx {r.tx}</span>}
              </div>
            </div>
            <div className="amt">{usd(r.amount)}</div>
          </Link>
        ))}
      </div>
    </>
  );
}
