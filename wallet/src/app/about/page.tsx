import Link from "next/link";
import { Fragment } from "react";
import { GoldDust } from "@/components/GoldDust.tsx";
import "./site.css";

// The product site: what Receipts is, how a payment works, the proof on Stellar, and the design story.
const TX = "https://stellar.expert/explorer/testnet/tx/";

const STEPS = [
  { art: "purse", t: "Pocket money, not your wallet", d: "Lina gives her AI helper a small monthly allowance. Her own money stays in her own wallet." },
  { art: "lock", t: "House rules in plain words", d: "“$2 a month, at most 25 cents a payment, only these shops.” The wallet reads them back as clear limits and saves nothing until she says yes." },
  { art: "shop", t: "The shop shows a price tag", d: "A service answers HTTP 402 with its price in USDC on Stellar. The rules check it in code; over the cap, the agent asks her first." },
  { art: "coin", t: "Paid after delivery, with a receipt", d: "The seller does the work, then settles. A failed job costs nothing. Every payment leaves a receipt she can read and a record anyone can check." },
];

const FAMILIAR = [
  ["402 Payment Required", "The price on the card terminal"],
  ["Rules in plain words", "An allowance, a card limit"],
  ["Signing the authorization", "Signing the slip"],
  ["Signed, not yet settled", "“Pending” in your bank app"],
  ["Settled on Stellar", "“Posted”"],
  ["Blocked by the rules", "A declined card"],
  ["Over the cap", "“Approve this purchase?”"],
];

const PROOF = [
  ["Codemod upgrade, 0.05 USDC", "The engine opened a pull request, then settled", "65397076c85edb9c72f35d19ed34acf93f58bb15d4dd3325f748a9fb85e4c633"],
  ["Inverter prices, 0.01 USDC", "Within the rules: paid", "5ea315724b9606a8e07910442a6eed6480afcec1186528776a07e3b19d6efe01"],
  ["Market report, 0.50 USDC", "Over the cap: paid after “Allow once”", "1d40156c34904fb241051416a3824804a441f3f218bd2d2471df42fff24af1d0"],
  ["Allowance granted on Stellar", "The owner approves the agent, with an end date", "6c9692d90d7b82b75e3cec2f985af4fdb0dc16e27a27499f6de6aa9a7a4db779"],
];

export default function Site() {
  return (
    <div className="os">
      <header className="os-top">
        <Link href="/about" className="os-brand">
          <img src="/porcelain/star2.webp" alt="" aria-hidden="true" /> Receipts <small>by 402 Found</small>
        </Link>
        <nav>
          <a href="#how">How it works</a>
          <a href="#sellers">For sellers</a>
          <a href="#proof">Proof</a>
          <a href="#story">Design</a>
          <Link className="os-cta" href="/welcome">Open the wallet</Link>
        </nav>
      </header>

      <section className="os-hero">
        <GoldDust count={28} />
        <div className="os-hero-text">
          <p className="os-eyebrow">EmpowerHer · Building the Agent Economy · Stellar</p>
          <h1>An allowance for your AI helper, not your wallet</h1>
          <p className="os-lede">Your AI helper pays for small things online, a few cents at a time, only inside the house rules you wrote. Every cent leaves a receipt you can read and a record anyone can check.</p>
          <div className="os-actions">
            <Link className="os-btn main" href="/welcome">Open the wallet</Link>
            <Link className="os-btn" href="/ws/job">Watch one purchase</Link>
          </div>
        </div>
        <div className="os-hero-art">
          <img className="os-hero-card" src="/porcelain/card.webp" alt="A porcelain allowance card with a gold-leaf edge" />
          <img className="os-hero-star" src="/porcelain/star2.webp" alt="" aria-hidden="true" />
        </div>
      </section>

      <section className="os-sec">
        <p className="os-eyebrow">Why</p>
        <h2>Agents can pay now. Two people were left out.</h2>
        <div className="os-cols3">
          <div className="os-card"><h3>The person whose money it is</h3><p>An agent&apos;s wallet is a private key. Its limits live in code, not in words its owner can read, and a ledger entry is not a receipt most people can read.</p></div>
          <div className="os-card"><h3>The person with something to sell</h3><p>A developer with a useful tool can&apos;t sell it for five cents a call: card fees start around thirty cents, and paying across borders is slow and costly.</p></div>
          <div className="os-card"><h3>Why now</h3><p>x402 puts the price and the payment inside the web request. Stellar settles in about five seconds for a tiny fee, in native USDC.</p></div>
        </div>
      </section>

      <section className="os-sec" id="how">
        <p className="os-eyebrow">How it works</p>
        <h2>One payment, from house rules to a receipt</h2>
        <ol className="os-steps">
          {STEPS.map((s) => (
            <li key={s.art}>
              <img src={`/porcelain/${s.art}.webp`} alt="" aria-hidden="true" />
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="os-sec os-split">
        <img src="/porcelain/safe.webp" alt="A small porcelain safe" />
        <div>
          <p className="os-eyebrow">Limits Stellar enforces</p>
          <h2>Even if our code had a bug, the network says no</h2>
          <p>Lina&apos;s money stays in her own wallet. She grants the agent a USDC allowance that ends with the month. The agent carries a few cents and refills from the allowance before it pays. Past the limit, past the end date, or once she revokes it, the USDC contract on Stellar refuses the refill.</p>
        </div>
      </section>

      <section className="os-sec">
        <p className="os-eyebrow">New ideas, familiar forms</p>
        <h2>Every step feels like something you already know</h2>
        <div className="os-map">
          {FAMILIAR.map(([a, b]) => (
            <Fragment key={a}>
              <span className="new">{a}</span>
              <span className="fl">feels like</span>
              <span className="old">{b}</span>
            </Fragment>
          ))}
        </div>
      </section>

      <section className="os-sec os-split rev" id="sellers">
        <div>
          <p className="os-eyebrow">For sellers</p>
          <h2>Anything useful can charge a few cents a use</h2>
          <p>No sign-up form and no card machine: a service names its price in a 402 and is paid the moment it delivers. Our first shop is a codemod engine that upgrades ethers v5 to v6 for 5 cents and delivers a pull request. It settles only after the pull request opens, and withdraws it if payment fails.</p>
          <p><Link href="/ws/job">See one job from both sides →</Link></p>
        </div>
        <img src="/porcelain/shop.webp" alt="A small porcelain shop" />
      </section>

      <section className="os-sec" id="proof">
        <p className="os-eyebrow">Proof on Stellar testnet</p>
        <h2>Every payment has a public receipt</h2>
        <table className="os-proof">
          <thead><tr><th>What</th><th>What happened</th><th>Transaction</th></tr></thead>
          <tbody>
            {PROOF.map(([w, h, tx]) => (
              <tr key={tx}>
                <td>{w}</td>
                <td>{h}</td>
                <td><a href={`${TX}${tx}`} target="_blank" rel="noreferrer"><code>{tx.slice(0, 8)}…{tx.slice(-6)}</code> ↗</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="os-sec os-story" id="story">
        <p className="os-eyebrow">The design</p>
        <h2>Blue that travelled</h2>
        <p className="os-story-lede">Blue-and-white porcelain from Jingdezhen sailed to Europe by the shipload; potters in Delft learned to make their own; women dyers in Nigeria have long made Adire, indigo cloth of dotted circles and patterned squares. Three crafts, each a traded thing, meet in our pieces. The fine gold flecks are sajin, a Chinese art of scattering gold leaf: here each fleck is a small sum, and a person on the chain.</p>
        <div className="os-cols3">
          <figure><img src="/about/china-kraak-wanli.webp" alt="Blue-and-white dish from Jingdezhen, Wanli period" /><figcaption>China · Jingdezhen, Wanli period. Honolulu Museum of Art, CC0</figcaption></figure>
          <figure><img src="/about/delft-plate-cleveland.webp" alt="Delftware plate" /><figcaption>Holland · Delftware. Cleveland Museum of Art, CC0</figcaption></figure>
          <figure><img src="/about/adire-symbols.webp" alt="Adire cloth with patterned squares" /><figcaption>Nigeria · Adire. Wikimedia Commons, CC0</figcaption></figure>
        </div>
      </section>

      <section className="os-sec">
        <p className="os-eyebrow">Who built it</p>
        <h2>402 Found</h2>
        <div className="os-cols2">
          <div className="os-card"><h3>Chinyere</h3><p>Full-stack and AST engineer. The seller: a codemod engine behind HTTP 402, settled only after the pull request opens.</p></div>
          <div className="os-card"><h3>Elodie Liu</h3><p>Product design and full-stack. The buyer: the Receipts wallet, its plain-words rules, on-chain allowance and readable receipts.</p></div>
        </div>
      </section>

      <footer className="os-foot">
        <img src="/porcelain/street.webp" alt="" aria-hidden="true" />
        <p>Stellar testnet only: test money with no real value. Code at github.com/Chinyereee/x402-Agent.</p>
      </footer>
    </div>
  );
}
