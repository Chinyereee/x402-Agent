"use client";

import { useState } from "react";

// Prototype only: shows the two choices. The real version signs once on "Allow once".
export function Decide({ amount }: { amount: string }) {
  const [choice, setChoice] = useState<"allow" | "no" | null>(null);
  if (choice === "allow") return <p className="muted">Allowed once. The wallet signs {amount} for this payment only; your rules stay the same.</p>;
  if (choice === "no") return <p className="muted">Declined. Nothing was signed or paid.</p>;
  return (
    <div className="actions">
      <button className="btn primary" onClick={() => setChoice("allow")}>Allow once, {amount}</button>
      <button className="btn ghost" onClick={() => setChoice("no")}>Say no</button>
    </div>
  );
}
