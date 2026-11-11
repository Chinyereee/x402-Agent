"use client";

import { useMemo, useState } from "react";
import { usd } from "@/lib/money.ts";
import { isComplete, parseRules } from "@/lib/rules.ts";
import { ENGINE, RULES_TEXT } from "@/lib/sample.ts";

export function RulesEditor() {
  const [text, setText] = useState(RULES_TEXT);
  const [confirmed, setConfirmed] = useState(false);
  const parsed = useMemo(() => parseRules(text, [ENGINE]), [text]);
  const ready = isComplete(parsed.rules) && parsed.unread.length === 0;

  return (
    <div className="grid">
      <section className="card">
        <h2>In your words</h2>
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setConfirmed(false); }}
          aria-label="Your rules"
        />
        <p className="muted small">Say a monthly budget, a cap per payment, and which services your agent may pay.</p>
      </section>

      <section className="card">
        <h2>What the wallet will enforce</h2>
        <dl className="kv">
          <dt>Monthly budget</dt>
          <dd>{parsed.rules.monthlyBudget !== undefined ? usd(parsed.rules.monthlyBudget) : <span className="muted">Not set</span>}</dd>
          <dt>Cap per payment</dt>
          <dd>{parsed.rules.capPerPayment !== undefined ? usd(parsed.rules.capPerPayment) : <span className="muted">Not set</span>}</dd>
          <dt>Allowed services</dt>
          <dd>{parsed.rules.allow?.length ? parsed.rules.allow.map((s) => `${s.name} (${s.payTo})`).join(", ") : <span className="muted">None</span>}</dd>
        </dl>
        {parsed.unread.length > 0 && (
          <p className="small" style={{ color: "var(--ask)" }}>
            Not understood, so not enforced: {parsed.unread.map((u) => `"${u}"`).join(", ")}
          </p>
        )}
        <p className="muted small">Read once, here, without a model. After you confirm, every payment is checked against these numbers in code.</p>
        <div className="actions">
          <button className="btn primary" disabled={!ready || confirmed} onClick={() => setConfirmed(true)}>
            {confirmed ? "Confirmed" : "Confirm these rules"}
          </button>
        </div>
      </section>
    </div>
  );
}
