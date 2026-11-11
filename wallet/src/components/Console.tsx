"use client";

import { useEffect, useRef, useState } from "react";
import { usd } from "@/lib/money.ts";
import { check, type PaymentRequest } from "@/lib/rules.ts";
import { LEDGER, RULES } from "@/lib/sample.ts";

type Scenario = { key: string; label: string; endpoint: string; req: PaymentRequest };

const SCENARIOS: Scenario[] = [
  { key: "ok", label: "Within the rules", endpoint: "POST /api/v1/migrate", req: { payTo: "GCHINYERE…ENGINE", amount: 500_000, what: "ethers v5 to v6 upgrade" } },
  { key: "cap", label: "Over the cap", endpoint: "POST /api/v1/audit", req: { payTo: "GCHINYERE…ENGINE", amount: 4_000_000, what: "Full repository audit" } },
  { key: "list", label: "Off the list", endpoint: "POST /deploy", req: { payTo: "GDEPLOY…SERVICE", amount: 1_000_000, what: "Deploy to production" } },
];

type Line = { side: "wallet" | "engine"; text: string; code?: string };

function script(s: Scenario): Line[] {
  const d = check(RULES, s.req, LEDGER);
  const required = JSON.stringify(
    { x402Version: 2, accepts: [{ scheme: "exact", network: "stellar:testnet", amount: String(s.req.amount), payTo: s.req.payTo, maxTimeoutSeconds: 900 }] },
    null,
    2,
  );
  const lines: Line[] = [
    { side: "wallet", text: `Agent calls ${s.endpoint}` },
    { side: "engine", text: "Preflight: repo reachable, App installed, ethers v5 present" },
    { side: "engine", text: `402 Payment Required · ${usd(s.req.amount)} USDC`, code: `PAYMENT-REQUIRED (decoded)\n${required}` },
    ...d.checks.map((c): Line => ({ side: "wallet", text: `${c.ok ? "✓" : "✕"} ${c.rule}: ${c.detail}` })),
  ];
  if (d.outcome === "block") return [...lines, { side: "wallet", text: "Blocked. Nothing signed, nothing paid. Receipt kept as Blocked." }];
  if (d.outcome === "ask") return [...lines, { side: "wallet", text: "Stopped. Asking Lina before signing. Receipt kept as Needs you." }];
  return [
    ...lines,
    { side: "wallet", text: "Signs the Soroban authorization (valid 15 min) · held as pending" },
    { side: "wallet", text: "Retries with PAYMENT-SIGNATURE" },
    { side: "engine", text: "Facilitator verified the payment" },
    { side: "engine", text: "Cloning (shallow) · running 8 transforms + await getSigner" },
    { side: "engine", text: "Regenerating the lockfile · opening the pull request" },
    { side: "engine", text: "PR #12 opened · settling through the facilitator" },
    { side: "engine", text: "200 OK with PAYMENT-RESPONSE", code: `{\n  "status": "pr_opened",\n  "prUrl": "https://github.com/<owner>/<repo>/pull/12"\n}` },
    { side: "wallet", text: "Pending became paid · receipt saved with the PR and the transaction" },
  ];
}

export function Console() {
  const [scenario, setScenario] = useState(SCENARIOS[0]);
  const [shown, setShown] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const lines = script(scenario);

  const stop = () => { if (timer.current) clearInterval(timer.current); timer.current = null; };
  useEffect(() => stop, []);

  function play() {
    stop();
    setShown(0);
    timer.current = setInterval(() => {
      setShown((n) => {
        if (n + 1 >= lines.length) stop();
        return n + 1;
      });
    }, 700);
  }

  function pick(s: Scenario) { stop(); setScenario(s); setShown(0); }

  const col = (side: Line["side"]) =>
    lines.slice(0, shown).filter((l) => l.side === side).map((l, i) => (
      <div key={i}>
        <div>{l.text}</div>
        {l.code && <pre className="code">{l.code}</pre>}
      </div>
    ));

  return (
    <>
      <div className="actions" style={{ marginBottom: 20, alignItems: "center" }}>
        <div className="seg">
          {SCENARIOS.map((s) => (
            <button key={s.key} className={s.key === scenario.key ? "on" : ""} onClick={() => pick(s)}>{s.label}</button>
          ))}
        </div>
        <button className="btn primary" onClick={play}>Run the handshake</button>
      </div>
      <div className="grid">
        <section className="card">
          <h2>Receipts wallet · Lina&apos;s agent</h2>
          <div className="log">{col("wallet")}{shown === 0 && <span className="l">Waiting to start</span>}</div>
        </section>
        <section className="card">
          <h2>Codemod engine · Chinyere</h2>
          <div className="log">{col("engine")}{shown === 0 && <span className="l">Waiting to start</span>}</div>
        </section>
      </div>
    </>
  );
}
