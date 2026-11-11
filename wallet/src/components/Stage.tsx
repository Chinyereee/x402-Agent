"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SCRIPTS, type Line, type Scenario, type Step } from "@/lib/stage.ts";

const ORDER: Scenario[] = ["paid", "needs", "blocked", "statement"];
const LABEL: Record<Scenario, string> = { paid: "Within the rules", needs: "Over the cap", blocked: "Off the list", statement: "Monthly statement" };
// Each scenario starts where the previous one left off, so the numbers add up across the demo.
const START_AVAILABLE: Record<Scenario, number> = { paid: 200, needs: 195, blocked: 155, statement: 155 };
const START_RECEIVED: Record<Scenario, number> = { paid: 0, needs: 5, blocked: 0, statement: 45 };

const cents = (c: number) => `$${(c / 100).toFixed(2)}`;

type View = {
  step: Step | null;
  lines: Line[];
  stamp: Step["stamp"] | null;
  available: number;
  received: number;
  logs: string[];
  slipKey: number;
  pressed: boolean;
  familiar: [string, string] | null;
};

const fresh = (s: Scenario): View => ({
  step: null, lines: [], stamp: null, available: START_AVAILABLE[s], received: START_RECEIVED[s], logs: [], slipKey: 0, pressed: false, familiar: null,
});

export function Stage({ auto }: { auto: boolean }) {
  const [scenario, setScenario] = useState<Scenario>("paid");
  const [view, setView] = useState<View>(() => fresh("paid"));
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const script = SCRIPTS[scenario];

  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => clear, []);

  // Runs one scenario; resolves when its last step has shown.
  const run = useCallback((s: Scenario) => new Promise<void>((done) => {
    clear();
    setScenario(s);
    setView(fresh(s));
    let at = 0;
    const steps = SCRIPTS[s].steps;
    steps.forEach((step, i) => {
      at += step.wait;
      if (steps[i - 1]?.buyer.ask) {
        timers.current.push(setTimeout(() => setView((v) => ({ ...v, pressed: true })), at - 700));
      }
      timers.current.push(setTimeout(() => {
        setView((v) => ({
          step,
          lines: step.print ? [...v.lines, ...step.print] : v.lines,
          stamp: step.stamp ?? v.stamp,
          available: step.available ?? v.available,
          received: v.received + (step.seller.received ?? 0),
          logs: step.seller.log ? [...v.logs, step.seller.log] : v.logs,
          slipKey: step.slip ? v.slipKey + 1 : v.slipKey,
          pressed: false,
          familiar: step.familiar ?? v.familiar,
        }));
        if (i === steps.length - 1) timers.current.push(setTimeout(done, 400));
      }, at));
    });
  }), []);

  useEffect(() => {
    if (!auto) return;
    let stop = false;
    (async () => {
      await new Promise((r) => setTimeout(r, 1200));
      for (const s of ORDER) {
        if (stop) return;
        await run(s);
        await new Promise((r) => setTimeout(r, 3200));
      }
      document.body.dataset.done = "1";
    })();
    return () => { stop = true; clear(); };
  }, [auto, run]);

  const { step, lines, stamp, available, received, logs, slipKey, pressed, familiar } = view;
  const statement = scenario === "statement";
  const buyer = step?.buyer;
  const shownChecks = buyer?.checks ?? 0;
  const lagos = script.city === "Lagos";

  return (
    <div className={`st ${auto ? "auto" : ""}`}>
      <div className="st-inner">
      <div className="st-top">
        <div>
          <div className="st-eyebrow">Receipts × Codemod engine</div>
          <h1 className="st-title">One payment, two sides{auto && step && <span className="st-scene">{ORDER.indexOf(scenario) + 1} · {LABEL[scenario]}</span>}</h1>
        </div>
        {!auto && (
          <div className="st-controls">
            <div className="seg">
              {ORDER.map((s) => (
                <button key={s} className={s === scenario ? "on" : ""} onClick={() => run(s)}>{LABEL[s]}</button>
              ))}
            </div>
            <button className="btn ghost" onClick={() => window.print()} disabled={!lines.length}>Print the receipt</button>
          </div>
        )}
      </div>

      <div className="st-fam-wrap">
        {familiar ? (
          <div key={familiar[1]} className="st-fam">
            <span className="st-fam-new">{familiar[0]}</span>
            <span className="st-fam-arrow">feels like</span>
            <span className="st-fam-old">{familiar[1]}</span>
          </div>
        ) : <div className="st-fam empty">New ideas, in forms people already know</div>}
      </div>

      <div className="st-grid">
        {/* buyer */}
        <section className="st-side">
          <div className="st-place"><b>New York</b><span>4:12 PM</span></div>
          <div className="st-phone">
            <div className="st-who">Lina&apos;s agent wallet</div>
            <div className="st-avail">
              <span className="muted small">Available this month</span>
              <span className="st-big">{cents(available)}</span>
            </div>
            {!statement && <div className="st-req">
              <div className="muted small">{step ? `${script.merchant} asks` : "Waiting for the agent"}</div>
              <div className="st-req-row"><b>{step ? script.item : "—"}</b><b>{lines.length ? `$${script.price}` : ""}</b></div>
            </div>}
            <ul className="st-checks">
              {script.checks.map((c, i) => (
                <li key={c.label} className={i < shownChecks ? (c.ok ? "ok" : "no") : "wait"}>
                  <i>{i < shownChecks ? (c.ok ? "✓" : "✕") : ""}</i>{c.label}
                </li>
              ))}
            </ul>
            <div className={`st-status ${buyer?.tone ?? "idle"}`}>{buyer?.status ?? "Ready"}</div>
            {buyer?.note && <div className="st-note">{buyer.note}</div>}
            {buyer?.ask && (
              <div className="st-sheet">
                <div className="st-sheet-title">Approve this payment?</div>
                <div className="st-sheet-amt">${script.price} · {script.item}</div>
                <div className="st-sheet-btns">
                  <span className={`st-tap primary ${pressed ? "pressed" : ""}`}>Allow once</span>
                  <span className="st-tap">Decline</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* middle */}
        <section className="st-mid">
          <div className="st-track">
            <span>NY</span>
            <div className="st-rail">
              {step?.slip && (
                <div key={slipKey} className={`st-slip ${step.slip.dir}`}>
                  {step.slip.coin && <i className="st-coin">{step.slip.coin}</i>}
                  {step.slip.label}
                </div>
              )}
            </div>
            <span>{lagos ? "Lagos" : "?"}</span>
          </div>
          <div className="st-rail-label">x402 over HTTP · settled on Stellar testnet</div>
          <div className="rc">
            <div className="rc-slot" />
            <div className={`rc-paper ${lines.length ? "" : "empty"} ${stamp && stamp !== "pending" ? "torn" : ""}`}>
              {lines.map((l, i) => <ReceiptLine key={i} line={l} faint={stamp === "pending" && l.k === "text" && !!l.faint} />)}
              {stamp && <div className={`rc-stamp ${stamp}`}>{{ paid: "PAID", void: "VOID", pending: "PENDING", posted: "POSTED" }[stamp]}</div>}
            </div>
          </div>
        </section>

        {/* seller */}
        <section className="st-side">
          <div className="st-place"><b>{lagos ? "Lagos" : "Somewhere"}</b><span>{lagos ? "10:12 PM" : ""}</span></div>
          <div className="st-till">
            <div className="st-who">{script.merchant}{lagos ? " · Chinyere" : " · not on Lina's list"}</div>
            <div className="st-lcd">
              <span>{step?.seller.status ?? "Idle"}</span>
              <b>{step ? `${script.price} USDC` : "—"}</b>
            </div>
            <ul className="st-log">
              {logs.map((l, i) => <li key={i}>{l}</li>)}
            </ul>
            {step?.drawer && (
              <div key={slipKey + "d"} className="st-tray">
                <i className="st-coin drop">{script.price}</i>
                <span>ding</span>
              </div>
            )}
            <div className={`st-drawer ${step?.drawer ? "ding" : ""}`}>
              <span className="muted small">{statement ? "This month" : "Received today"}</span>
              <b>{(received / 100).toFixed(2)} USDC</b>
            </div>
          </div>
        </section>
      </div>

      <p className="st-foot">Prototype with sample data: the steps run on a timer. In the product, each line prints only when the real x402 header or Stellar settlement arrives.</p>
      </div>
    </div>
  );
}

function ReceiptLine({ line, faint }: { line: Line; faint: boolean }) {
  if (line.k === "rule") return <div className="rc-line rc-rule" />;
  if (line.k === "signed") return (
    <div className="rc-line rc-signed">
      <span>SIGNED</span>
      <svg viewBox="0 0 160 34" aria-hidden>
        <path d="M4 24 C 14 6, 22 6, 20 22 S 30 30, 38 14 C 42 6, 46 26, 52 20 C 58 14, 60 22, 66 20 C 74 17, 76 8, 82 12 C 88 16, 84 28, 92 24 C 100 20, 104 12, 112 16 C 120 20, 124 26, 134 18 L 156 10" />
      </svg>
      <span className="rc-valid">valid 15 min</span>
    </div>
  );
  if (line.k === "sign") return <div className="rc-line rc-sign"><span>Allow once</span><i /></div>;
  if (line.k === "barcode") return (
    <div className="rc-line rc-bar">
      <div className="rc-code" />
      <span>{line.label}</span>
    </div>
  );
  return (
    <div className={`rc-line ${line.strong ? "strong" : ""} ${faint ? "faint" : ""}`}>
      <span>{line.left}</span>{line.right && <span>{line.right}</span>}
    </div>
  );
}
