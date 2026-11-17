import Link from "next/link";

// How it works (function page): the whole idea in everyday words, for someone who has never
// heard of x402, Stellar or a wallet. Each step is a familiar object first, the technical word after.
const STEPS = [
  {
    n: "1",
    t: "Give your AI helper pocket money",
    p: "Like a prepaid card you hand to a teenager: a small amount each month, and your own bank card never leaves your hands.",
    w: "In the app: the allowance card on Overview.",
  },
  {
    n: "2",
    t: "Write the house rules in your own words",
    p: "“$2 a month, at most 25 cents each time, only these shops.” The app reads them back as clear limits and saves nothing until you say yes.",
    w: "In the app: Rules.",
  },
  {
    n: "3",
    t: "The shop shows a price tag, your rules check it",
    p: "Online services can now answer “this costs 5 cents”, the way a shop shows a price tag. Your helper reads the tag, your rules check it, and only then does it pay. Too pricey? It asks you first.",
    w: "The price tag is called HTTP 402. The payment rides on x402.",
  },
  {
    n: "4",
    t: "A receipt for everything",
    p: "Paid, waiting for you, or stopped: every try leaves a receipt. Each payment links to a public record anyone can check, like a bank stamp.",
    w: "The public record is the Stellar network. Here it is the test network, with test money.",
  },
];

const ASK = [
  "How much has my agent spent this month?",
  "What happens if a price is higher than my limit?",
  "Can someone else take money from this?",
];

export default function Guide() {
  return (
    <div className="ws-page ws-guide">
      <p className="ws-eyebrow">How it works</p>
      <h1 className="ws-page-h">An allowance for your AI helper, in four steps</h1>
      <p className="ws-guide-lede">No crypto knowledge needed. Everything here uses test money, so nothing you try can cost you real money.</p>

      <ol className="ws-steps">
        {STEPS.map((s) => (
          <li key={s.n} className="ws-step">
            <span className="ws-step-n" aria-hidden="true">{s.n}</span>
            <div>
              <h2>{s.t}</h2>
              <p>{s.p}</p>
              <small>{s.w}</small>
            </div>
          </li>
        ))}
      </ol>

      <section className="ws-guide-sell">
        <h2>Selling instead of buying?</h2>
        <p>
          The same price tag works the other way. If you make something useful online, a report, a tool, a checklist, it can charge a few cents each time an AI helper uses it. No sign-up form and no card machine: it is paid the moment it delivers.
        </p>
        <p>
          The codemod engine in this demo is a small shop like that. It upgrades someone&apos;s code for 5 cents, and it is paid only after the work is done.
        </p>
      </section>

      <p className="ws-sec">Try it</p>
      <div className="ws-start ws-guide-try">
        <Link className="ws-card" href="/ws/rules"><b>Write my rules</b><span>One sentence, you confirm</span></Link>
        <Link className="ws-card" href="/ws/job"><b>Watch one purchase</b><span>Both sides, about 15 seconds</span></Link>
        <Link className="ws-card" href="/ws/home"><b>See my receipts</b><span>Everything paid, asked or stopped</span></Link>
      </div>

      <p className="ws-sec">Or just ask</p>
      <div className="ws-guide-ask">
        {ASK.map((q) => (
          <Link key={q} href={`/ws?ask=${encodeURIComponent(q)}`}>{q}</Link>
        ))}
      </div>
    </div>
  );
}
