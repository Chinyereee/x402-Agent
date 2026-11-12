import Link from "next/link";
import { Fragment } from "react";
import "./about.css";

const TX = "https://stellar.expert/explorer/testnet/tx/";

const STEPS = [
  { n: "01", t: "Rules in plain words", d: "Lina writes “$2 a month, at most $0.25 a payment, only the services I list”. The wallet shows exactly what it will enforce, and nothing changes until she confirms. No model reads her rules at payment time." },
  { n: "02", t: "The agent meets a 402", d: "Her coding agent asks a paid service for work. The service answers HTTP 402 with a price in USDC on Stellar. The wallet reads the price before anything is signed." },
  { n: "03", t: "Checked, then signed", d: "Allowed service, under the cap, inside the budget: the wallet signs exactly that amount to exactly that address. Over the cap, it asks her. Off the list, it declines. Nothing is signed in either case." },
  { n: "04", t: "Settled after delivery", d: "The seller verifies the payment through a facilitator, does the work, and settles only if it succeeded. A failed job costs nothing." },
  { n: "05", t: "A receipt a person can read", d: "What was bought, why, which rule allowed it, what was delivered, and the Stellar transaction as proof." },
];

const FAMILIAR = [
  ["402 Payment Required", "The price lights up on the card terminal"],
  ["Rules in plain words", "An allowance, a card limit"],
  ["Signing the authorization", "Signing the slip"],
  ["Signed, not yet settled", "“Pending” in your bank app"],
  ["Settled on Stellar", "“Posted”"],
  ["Blocked by the rules", "A declined card"],
  ["Over the cap", "“Approve this purchase?”"],
  ["The seller gets paid", "The cash drawer: ding"],
  ["The month in one view", "A bank statement"],
];

const PROOF = [
  ["Inverter prices, 0.01 USDC", "Within the rules: paid", "5ea315724b9606a8e07910442a6eed6480afcec1186528776a07e3b19d6efe01"],
  ["Market report, 0.50 USDC", "Over the cap: paid after “Allow once”", "1d40156c34904fb241051416a3824804a441f3f218bd2d2471df42fff24af1d0"],
  ["Allowance granted on Stellar", "Owner approves the agent, with an expiry", "6c9692d90d7b82b75e3cec2f985af4fdb0dc16e27a27499f6de6aa9a7a4db779"],
  ["Top-up from the allowance", "Agent transfer_from, enforced by the USDC contract", "47174f0832d562769c38b05b41fc357a92ff6f0d610823a8ef24c601fe10c263"],
];

export default function About() {
  return (
    <div className="ab">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap" precedence="default" />
      <div className="ab-top">
        <div className="ab-brand"><span className="mark">R</span> Receipts <span className="muted small" style={{ fontWeight: 500 }}>by 402 Found</span></div>
        <span className="ab-tag">EmpowerHer: Building the Agent Economy · Stellar testnet</span>
      </div>

      <section className="ab-hero">
        <div>
          <h1>Give your agent an allowance, not your wallet.</h1>
          <p>Receipts lets an AI agent pay for services per call over x402 on Stellar, inside rules its owner wrote in plain words, and gives her a receipt she can actually read.</p>
          <div className="ab-cta">
            <Link className="btn primary" href="/hifi/live">See it pay on testnet</Link>
            <Link className="btn ghost" href="/hifi/stage?live=1">One payment, two sides</Link>
          </div>
        </div>
        <img src="/about/stage.jpg" alt="One payment seen from both sides, with a receipt printed by real x402 events" />
      </section>

      <section className="ab-sec">
        <h2>The problem</h2>
        <p className="lead">Agents can pay on their own now. Two people are left out.</p>
        <div className="ab-cards">
          <div className="ab-card"><h3>The person whose money it is</h3><p>Today an agent&apos;s wallet is a private key. Its limits live in code, not in words its owner can read, and a ledger entry is a receipt most people can&apos;t read either.</p></div>
          <div className="ab-card"><h3>The person with something to sell</h3><p>A developer in Lagos with a useful tool can&apos;t sell it for five cents a call: card fees start around thirty cents, and cross-border settlement is slow and costly.</p></div>
          <div className="ab-card"><h3>Why now</h3><p>x402 puts the price and the payment inside the web request. Stellar settles in about five seconds for a tiny fee in native USDC. Micropayments finally cost less than what they buy.</p></div>
        </div>
      </section>

      <section className="ab-sec">
        <h2>How it works</h2>
        <p className="lead">One payment, from Lina&apos;s rules to a readable receipt.</p>
        <div className="ab-cards">
          {STEPS.map((s) => <div key={s.n} className="ab-card"><div className="ab-num">{s.n}</div><h3>{s.t}</h3><p>{s.d}</p></div>)}
        </div>
      </section>

      <section className="ab-sec">
        <h2>Limits that Stellar enforces</h2>
        <p className="lead">The wallet checks every rule in code. The monthly budget is also enforced on-chain.</p>
        <div className="ab-cards">
          <div className="ab-card"><h3>An allowance, not a transfer</h3><p>Lina&apos;s money stays in her own wallet. She grants the agent a USDC allowance that expires at the end of the month.</p></div>
          <div className="ab-card"><h3>A small float</h3><p>The agent keeps a few cents and tops up from the allowance before it pays. x402 then pays from the agent&apos;s own account, as the standard requires.</p></div>
          <div className="ab-card"><h3>The network says no</h3><p>Over the allowance, after it expires, or once she revokes it, the USDC contract on Stellar refuses the top-up, whatever the agent or our code tries.</p></div>
        </div>
      </section>

      <section className="ab-sec">
        <h2>New ideas, in forms people already know</h2>
        <blockquote className="ab-quote">A payment product can&apos;t get around the things people already know. So why not make how it works, and how it feels, even more familiar?</blockquote>
        <p className="muted" style={{ marginBottom: 18 }}>Elodie, product design</p>
        <div className="ab-map">
          {FAMILIAR.map(([a, b]) => (
            <Fragment key={a}>
              <span className="new">{a}</span>
              <span className="fl">feels like</span>
              <span className="old">{b}</span>
            </Fragment>
          ))}
        </div>
      </section>

      <section className="ab-sec">
        <h2>Proof on Stellar testnet</h2>
        <p className="lead">Every payment has a public receipt. These open on stellar.expert.</p>
        <table className="ab-proof">
          <thead><tr><th>What</th><th>What happened</th><th>Transaction</th></tr></thead>
          <tbody>
            {PROOF.map(([w, h, tx]) => (
              <tr key={tx}><td>{w}</td><td>{h}</td><td><a href={`${TX}${tx}`} target="_blank" rel="noreferrer"><code>{tx.slice(0, 8)}…{tx.slice(-6)}</code> ↗</a></td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="ab-sec">
        <h2>How it fits together</h2>
        <p className="lead">Two modules, one handshake: the Receipts wallet (buyer) and the codemod engine (seller), with a standard x402 facilitator in between.</p>
        <img className="ab-img" src="/about/c4-context.png" alt="System context: Lina, Chinyere, the Receipts wallet, the codemod engine, Stellar, the facilitator, GitHub, stellar.expert" />
      </section>

      <section className="ab-sec">
        <h2>Who built it</h2>
        <div className="ab-cards">
          <div className="ab-card"><h3>Chinyere</h3><p>Full-stack and AST engineer. The seller: a codemod engine that upgrades ethers v5 to v6, behind HTTP 402, settled only after the pull request opens.</p></div>
          <div className="ab-card"><h3>Elodie Liu</h3><p>Product design and full-stack. The buyer: the Receipts wallet, its plain-words rules, on-chain allowance and readable receipts.</p></div>
        </div>
      </section>

      <p className="ab-foot">Testnet only: test money with no real value. The stand-in seller in the live demo is the EmpowerHer workshop kit&apos;s paid API until the codemod engine is connected. Stellar gives every payment a public receipt; we make that receipt readable by people.</p>
    </div>
  );
}
