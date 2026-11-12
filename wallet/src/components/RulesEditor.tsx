"use client";

import { useMemo, useState } from "react";
import { usd } from "@/lib/money.ts";
import { isComplete, parseRules, type Service } from "@/lib/rules.ts";

// Plain words on the left, the limits the wallet will enforce on the right.
// Confirming saves them on the server; from then on every payment is checked against them.
export function RulesEditor({ initialText, services, confirmedAt }: { initialText: string; services: Service[]; confirmedAt: string | null }) {
  const [text, setText] = useState(initialText);
  const [saved, setSaved] = useState<{ text: string; at: string | null }>({ text: initialText, at: confirmedAt });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const parsed = useMemo(() => parseRules(text, services), [text, services]);
  const ready = isComplete(parsed.rules) && parsed.unread.length === 0;
  const unchanged = text === saved.text && !!saved.at;

  async function confirm() {
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/rules", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) });
      const json = await res.json();
      if (!res.ok) setError(json.error);
      else setSaved({ text: json.text, at: json.confirmedAt });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid">
      <section className="card">
        <h2>In your words</h2>
        <textarea value={text} onChange={(e) => setText(e.target.value)} aria-label="Your rules" />
        <p className="muted small">Say a monthly budget, a cap per payment, and which services your agent may pay. Services it knows: {services.map((s) => s.name).join(", ")}.</p>
      </section>

      <section className="card">
        <h2>What the wallet will enforce</h2>
        <dl className="kv">
          <dt>Monthly budget</dt>
          <dd>{parsed.rules.monthlyBudget !== undefined ? usd(parsed.rules.monthlyBudget) : <span className="muted">Not set</span>}</dd>
          <dt>Cap per payment</dt>
          <dd>{parsed.rules.capPerPayment !== undefined ? usd(parsed.rules.capPerPayment) : <span className="muted">Not set</span>}</dd>
          <dt>Allowed services</dt>
          <dd>{parsed.rules.allow?.length ? parsed.rules.allow.map((s) => `${s.name} (${s.payTo.slice(0, 6)}…${s.payTo.slice(-4)})`).join(", ") : <span className="muted">None</span>}</dd>
        </dl>
        {parsed.unread.length > 0 && (
          <p className="small" style={{ color: "var(--ask)" }}>
            Not understood, so not enforced: {parsed.unread.map((u) => `"${u}"`).join(", ")}
          </p>
        )}
        {error && <p className="small" style={{ color: "var(--block)" }}>{error}</p>}
        <p className="muted small">Read once, here, without a model. After you confirm, every payment on Stellar testnet is checked against these numbers in code.</p>
        <div className="actions">
          <button className="btn primary" disabled={!ready || unchanged || busy} onClick={confirm}>
            {busy ? "Saving…" : unchanged ? "Confirmed" : "Confirm these rules"}
          </button>
        </div>
        {saved.at && <p className="muted small">In force since {new Date(saved.at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}.</p>}
      </section>
    </div>
  );
}
