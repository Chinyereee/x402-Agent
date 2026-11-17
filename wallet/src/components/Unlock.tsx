"use client";

import { useEffect, useState } from "react";

// Settings: the demo code that lets this browser spend test money on the public demo.
export function Unlock() {
  const [locked, setLocked] = useState<boolean | null>(null);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  useEffect(() => {
    fetch("/api/unlock").then((r) => r.json()).then((b) => setLocked(b.locked)).catch(() => setLocked(null));
  }, []);
  async function send() {
    setMsg("");
    const res = await fetch("/api/unlock", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
    const b = await res.json();
    if (!res.ok) return setMsg(b.error ?? "That did not work.");
    setLocked(false);
    setCode("");
  }
  if (locked === null) return null;
  return (
    <section className="ws-set">
      <h2>Demo code</h2>
      {locked ? (
        <>
          <p>On the public demo anyone can look around. To let the agent spend test money, open a pull request or ask the assistant, enter the code from our submission page.</p>
          <div className="ws-unlock">
            <input value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Demo code" aria-label="Demo code" />
            <button type="button" className="ws-btn main" disabled={!code.trim()} onClick={send}>Unlock</button>
          </div>
          {msg && <p className="ws-fine">{msg}</p>}
        </>
      ) : (
        <p className="ws-set-now"><i className="ws-tool-dot ok" /> This browser can use the agent. Everything is test money.</p>
      )}
    </section>
  );
}
