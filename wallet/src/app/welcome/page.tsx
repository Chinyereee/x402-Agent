"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle.tsx";
import "../ws/ws.css";
import "./welcome.css";

// The front door: the porcelain street is the chain (one house, one block), the star is Stellar.
// On the public demo the demo code unlocks spending; anyone can look around without it.
export default function Welcome() {
  const [locked, setLocked] = useState<boolean | null>(null);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  useEffect(() => {
    fetch("/api/unlock").then((r) => r.json()).then((b) => setLocked(b.locked)).catch(() => setLocked(false));
  }, []);
  async function unlock() {
    setMsg("");
    const res = await fetch("/api/unlock", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
    const b = await res.json();
    if (!res.ok) return setMsg(b.error ?? "That did not work.");
    location.href = "/ws";
  }
  return (
    <div className="wl aurora">
      <ThemeToggle className="wl-theme" />
      <div className="wl-inner">
        <img className="wl-star" src="/porcelain/star2.webp" alt="" aria-hidden="true" />
        <p className="wl-eyebrow">Receipts · Stellar testnet</p>
        <h1>An allowance for your AI helper</h1>
        <p className="wl-lede">You write the house rules. It pays for small things inside them, and every cent leaves a receipt anyone can check.</p>
        {locked ? (
          <div className="wl-form">
            <input value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && code.trim() && unlock()} placeholder="Demo code" aria-label="Demo code" />
            <button type="button" disabled={!code.trim()} onClick={unlock}>Enter</button>
          </div>
        ) : (
          <div className="wl-form">
            <Link className="wl-go" href="/ws">Open the wallet</Link>
          </div>
        )}
        {msg && <p className="wl-msg">{msg}</p>}
        {locked && <Link className="wl-look" href="/ws">Just look around →</Link>}
        <p className="wl-fine">Test money only. Nothing here can cost you real money.</p>
      </div>
      <img className="wl-street" src="/porcelain/street.webp" alt="A row of porcelain houses, one joined to the next like blocks in a chain" />
    </div>
  );
}
