import Link from "next/link";
import { notFound } from "next/navigation";
import { Decide } from "@/components/Decide.tsx";
import { Pill } from "@/components/Pill.tsx";
import { usd } from "@/lib/money.ts";
import { RECEIPTS } from "@/lib/sample.ts";

export function generateStaticParams() {
  return RECEIPTS.map((r) => ({ id: r.id }));
}

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = RECEIPTS.find((x) => x.id === id);
  if (!r) notFound();

  return (
    <>
      <p className="small"><Link href="/hifi">← All receipts</Link></p>
      <h1>{r.what}</h1>
      <p className="lead">Receipt {r.id} · {r.at}</p>

      <div className="grid">
        <section className="card">
          <div className="links" style={{ marginBottom: 8 }}><Pill status={r.status} /></div>
          <div className="big">{usd(r.amount)}</div>
          <dl className="kv" style={{ marginTop: 20 }}>
            <dt>Why</dt><dd>{r.why}</dd>
            <dt>Paid to</dt><dd>{r.service}</dd>
            {r.pr && <><dt>Result</dt><dd><span className="sample">{r.pr}</span></dd></>}
            {r.tx && <><dt>Transaction</dt><dd><span className="sample">{r.tx}</span> on Stellar testnet</dd></>}
            {r.expiresIn && <><dt>Signature</dt><dd>Expires in {r.expiresIn} if the work is not delivered</dd></>}
          </dl>
          {r.status === "needs_you" && <Decide amount={usd(r.amount)} />}
        </section>

        <section className="card">
          <h2>Your rules, checked before signing</h2>
          <ul className="checks">
            {r.checks.map((c) => (
              <li key={c.rule}>
                <span className={`tick ${c.ok ? "ok" : "no"}`}>{c.ok ? "✓" : "✕"}</span>
                <span><b>{c.rule}</b> <span className="muted">· {c.detail}</span></span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card">
        <h2>What happened</h2>
        <ol className="steps">
          {r.steps.map((s, i) => (
            <li key={i}>
              <span className="t">{s.at}</span><b>{s.label}</b>
              {s.detail && <div className="muted small">{s.detail}</div>}
            </li>
          ))}
          {r.status === "pending" && (
            <li className="dim"><span className="t">next</span><span className="muted">Settles on Stellar once the pull request opens</span></li>
          )}
        </ol>
      </section>
    </>
  );
}
