"use client";

import { useRef, useState } from "react";
import { prLabel, prUrl } from "@/lib/pr.ts";
import type { Check } from "@/lib/rules.ts";

/*
 * Split-screen demo: the wallet (rules, signature, receipt) beside the engine (preflight, 402,
 * verify, PR, settle). Every line comes from a real event of one live testnet payment.
 * The engine column shows what the engine returned to the wallet; when the engine publishes
 * its own step events, they replace these lines.
 */
type Receipt = { id: string; amount: number; status: string; note?: string; tx?: string; link?: string; data?: unknown; checks: Check[] };
type Ev =
  | { type: "request"; path: string }
  | { type: "quote"; amount: number; payTo: string; description: string; service: string }
  | { type: "rules"; checks: Check[]; outcome: "pay" | "ask" | "block" }
  | { type: "blocked" | "ask" | "declined" | "failed"; receipt: Receipt }
  | { type: "topup"; amount: number; link: string }
  | { type: "signed" }
  | { type: "settled"; receipt: Receipt }
  | { type: "drawer"; balance: number }
  | { type: "error"; message: string }
  | { type: "end" };

type Step = { key: string; title: string; detail?: string; tone: "ok" | "work" | "ask" | "bad" };
type Log = { at: string; dir: "in" | "out" | "note" | "ok" | "bad"; text: string; href?: string };
type Plan = { repo: string; prefix: string; pulls: { number: number; title: string; branch: string }[]; branches: string[]; error?: string };

const usdc = (u: number) => (u / 1e7).toFixed(u % 100_000 === 0 ? 2 : 3);
const now = () => new Date().toLocaleTimeString("en-GB", { hour12: false });
const short = (s: string) => `${s.slice(0, 6)}…${s.slice(-4)}`;

export function Split({ repo, rules }: { repo: string; rules: { monthly: number; cap: number; allow: string[] } }) {
  const [steps, setSteps] = useState<Step[]>([]);
  const [log, setLog] = useState<Log[]>([]);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [askId, setAskId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [reset, setReset] = useState<Plan | null>(null);
  const [resetMsg, setResetMsg] = useState("");
  const price = useRef("");

  const step = (s: Step) => setSteps((all) => [...all.filter((x) => x.key !== s.key), s]);
  const say = (dir: Log["dir"], text: string, href?: string) => setLog((all) => [...all, { at: now(), dir, text, href }]);

  function on(e: Ev) {
    switch (e.type) {
      case "request":
        step({ key: "ask", title: "Agent asks for the codemod", detail: `Upgrade ${repo || "the repo"} from ethers v5 to v6`, tone: "work" });
        say("in", `POST /api/v1/migrate  repo=${repo}`);
        say("note", "preflight (free): can I read and push to this repo, is ethers v5 there?");
        break;
      case "quote":
        price.current = usdc(e.amount);
        step({ key: "price", title: `Price: $${price.current}`, detail: "The engine asked for payment only after its preflight passed", tone: "work" });
        say("ok", "preflight passed");
        say("out", `402 Payment Required · ${price.current} USDC to ${short(e.payTo)}`);
        break;
      case "rules":
        step({
          key: "rules",
          title: e.outcome === "pay" ? "Your rules: all three passed" : e.outcome === "ask" ? "Over your cap: asking you" : "Your rules said no",
          detail: e.checks.map((c) => `${c.ok ? "✓" : "✕"} ${c.detail}`).join("\n"),
          tone: e.outcome === "pay" ? "ok" : e.outcome === "ask" ? "ask" : "bad",
        });
        if (e.outcome === "pay") say("note", "waiting for a signed payment");
        break;
      case "topup":
        step({ key: "topup", title: "Topped up from your on-chain allowance", detail: `+${usdc(e.amount)} USDC, Stellar enforces the limit`, tone: "ok" });
        break;
      case "signed":
        step({ key: "signed", title: `Signed for exactly ${price.current} USDC`, detail: "Held, not settled: the engine only settles once the work is done", tone: "work" });
        say("in", "PAYMENT-SIGNATURE received");
        say("note", "verify with the facilitator: authorization checked, no funds move yet");
        say("note", "running the codemod");
        break;
      case "settled": {
        const pr = prUrl(e.receipt.data);
        setReceipt(e.receipt);
        step({ key: "done", title: `Paid $${price.current}`, detail: "Settled on Stellar after the engine delivered", tone: "ok" });
        if (pr) say("ok", `pull request opened: ${prLabel(pr)}`, pr);
        else say("ok", "job done");
        if (e.receipt.tx) say("ok", `settled on Stellar · tx ${short(e.receipt.tx)}`, e.receipt.link);
        say("out", "200 OK · PAYMENT-RESPONSE");
        break;
      }
      case "drawer":
        say("ok", `engine wallet balance: ${usdc(e.balance)} USDC`);
        break;
      case "ask":
        setAskId(e.receipt.id);
        say("note", "no payment yet: the buyer is asking its owner");
        break;
      case "blocked":
      case "declined":
        step({ key: "done", title: "Nothing paid", detail: e.receipt.note ?? "Declined", tone: "bad" });
        say("note", "no payment came");
        break;
      case "failed":
        step({ key: "done", title: "Not paid", detail: e.receipt.note ?? "Not settled", tone: "bad" });
        say("bad", `not settled · ${e.receipt.note ?? ""}`);
        break;
      case "error":
        step({ key: "done", title: "Something went wrong", detail: e.message, tone: "bad" });
        say("bad", e.message);
        break;
    }
  }

  function stream(query: string) {
    setRunning(true);
    const es = new EventSource(`/api/live/stream?${query}`);
    es.onmessage = (m) => {
      const e = JSON.parse(m.data) as Ev;
      if (e.type === "end") {
        es.close();
        setRunning(false);
      } else on(e);
    };
    es.onerror = () => {
      es.close();
      setRunning(false);
    };
  }

  function run() {
    setSteps([]);
    setLog([]);
    setReceipt(null);
    setAskId(null);
    stream(`path=${encodeURIComponent("/api/v1/migrate")}&seller=engine`);
  }
  function answer(allow: boolean) {
    if (!askId) return;
    setAskId(null);
    stream(`answer=${askId}&allow=${allow ? 1 : 0}`);
  }

  async function checkReset() {
    setResetMsg("");
    const r = await fetch("/api/demo/reset").then((x) => x.json());
    setReset(r);
  }
  async function doReset() {
    const r = await fetch("/api/demo/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirm: true }) }).then((x) => x.json());
    setReset(null);
    setResetMsg(r.error ? r.error : `Closed ${r.closed.length} pull requests and deleted ${r.deleted.length} branches${r.errors.length ? `; could not: ${r.errors.join(", ")}` : ""}.`);
  }

  const pr = receipt ? prUrl(receipt.data) : undefined;

  return (
    <div className="sp">
      <header className="sp-head">
        <div>
          <p className="sp-eyebrow">402 Found · Stellar testnet · real x402 payment with test money</p>
          <h1>One codemod job, both sides</h1>
        </div>
        <div className="sp-actions">
          <button type="button" className="sp-btn" onClick={checkReset} disabled={running}>Reset demo repo</button>
          <button type="button" className="sp-btn main" onClick={run} disabled={running}>{running ? "Running…" : "Run the codemod job"}</button>
        </div>
      </header>

      {(reset || resetMsg) && (
        <div className="sp-reset">
          {resetMsg && <p>{resetMsg}</p>}
          {reset?.error && <p className="bad">{reset.error}</p>}
          {reset && !reset.error && (
            <>
              <p>
                <b>{reset.repo}</b>, branches under <code>{reset.prefix}</code>:{" "}
                {reset.pulls.length || reset.branches.length ? `${reset.pulls.length} open pull requests and ${reset.branches.length} branches.` : "nothing to reset."}
              </p>
              {reset.pulls.map((p) => <p key={p.number} className="sp-mono">PR #{p.number} {p.title} ({p.branch})</p>)}
              {reset.branches.map((b) => <p key={b} className="sp-mono">branch {b}</p>)}
              <div className="sp-actions">
                <button type="button" className="sp-btn" onClick={() => setReset(null)}>Cancel</button>
                {(reset.pulls.length > 0 || reset.branches.length > 0) && <button type="button" className="sp-btn main" onClick={doReset}>Close and delete them</button>}
              </div>
            </>
          )}
        </div>
      )}

      <div className="sp-cols">
        <section className="sp-wallet" aria-label="Receipts wallet">
          <p className="sp-col-t">Lina&rsquo;s Receipts wallet</p>
          <div className="sp-rules">
            <span>${usdc(rules.monthly)} a month</span>
            <span>at most ${usdc(rules.cap)} a payment</span>
            {rules.allow.map((a) => <span key={a}>only {a}</span>)}
          </div>
          {!steps.length && <p className="sp-idle">Press &ldquo;Run the codemod job&rdquo;. The agent asks the engine to upgrade the repo, and your rules decide.</p>}
          <ol className="sp-steps">
            {steps.map((s) => (
              <li key={s.key} className={`sp-step ${s.tone}`}>
                <b>{s.title}</b>
                {s.detail && <span>{s.detail}</span>}
              </li>
            ))}
          </ol>
          {askId && (
            <div className="sp-ask">
              <b>Over your cap. Pay it this one time?</b>
              <div className="sp-actions">
                <button type="button" className="sp-btn" onClick={() => answer(false)}>Decline</button>
                <button type="button" className="sp-btn main" onClick={() => answer(true)}>Allow once</button>
              </div>
            </div>
          )}
          {receipt && (
            <div className="sp-receipt">
              <p className="sp-col-t">Receipt</p>
              <div className="sp-amount">${price.current}</div>
              <dl>
                <dt>Pull request</dt>
                <dd>{pr ? <a href={pr} target="_blank" rel="noreferrer">{prLabel(pr)} ↗</a> : <span className="muted">appears here once the engine opens real PRs</span>}</dd>
                <dt>Stellar</dt>
                <dd>{receipt.link ? <a href={receipt.link} target="_blank" rel="noreferrer">tx {short(receipt.tx ?? "")} ↗</a> : "—"}</dd>
                <dt>Receipt</dt>
                <dd><a href={`/hifi/receipts/${receipt.id}`} target="_blank" rel="noreferrer">{receipt.id} ↗</a></dd>
              </dl>
            </div>
          )}
        </section>

        <section className="sp-engine" aria-label="Codemod engine">
          <p className="sp-col-t">Codemod engine · log</p>
          <p className="sp-src">Lines show what the engine returned to the wallet. Live engine events will replace them.</p>
          <div className="sp-log" role="log">
            {!log.length && <p className="sp-dim">$ waiting for a request…</p>}
            {log.map((l, i) => (
              <p key={i} className={`sp-line ${l.dir}`}>
                <span className="sp-at">{l.at}</span>
                <span className="sp-dir">{l.dir === "in" ? "→" : l.dir === "out" ? "←" : l.dir === "ok" ? "✓" : l.dir === "bad" ? "✕" : "·"}</span>
                {l.href ? <a href={l.href} target="_blank" rel="noreferrer">{l.text} ↗</a> : <span>{l.text}</span>}
              </p>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
