"use client";

import { useEffect, useRef, useState } from "react";
import { CATALOG, byPath } from "@/lib/catalog.ts";
import { useWs, type Item, type Tab, type Thread } from "./context.tsx";
import { Icon, I } from "./icons.tsx";

/*
 * Assistant: the conversation is the largest area. Anything to look at or decide opens as a tab
 * in the app area inside it (receipts, rules, things to buy); anything that spends money or
 * changes rules first comes back as a card the owner confirms.
 */
type AiStatus = { configured: boolean; model: string | null; host: string | null };
type Live = { ledger: { paidThisMonth: number; pending: number }; rules: { monthlyBudget: number; capPerPayment: number; allow: string[]; text: string }; receipts: { id: string; status: string }[] };
type Receipt = { id: string; status: string; description: string; amount: number; note?: string };

const START = [
  { t: "What did my agent buy?", d: "Every payment, ask and stop", p: "What did my agent buy so far?" },
  { t: "How much is left?", d: "This month, against your rules", p: "How much is left this month?" },
  { t: "Change my rules", d: "In your own words, you confirm", p: "Raise my monthly budget to $3, keep the rest." },
  { t: "Buy something", d: "Your rules check it first", p: "Get the inverter prices." },
];

const TAB = {
  home: { id: "home", title: "Overview", src: "/hifi" },
  rules: { id: "rules", title: "Rules", src: "/hifi/rules" },
  pay: { id: "pay", title: "Things to buy", src: "/hifi/live" },
  receipt: (id: string, what: string): Tab => ({ id: `r:${id}`, title: `Receipt · ${what}`, src: `/hifi/receipts/${id}` }),
};

const usd = (units: number) => {
  const d = units / 1e7;
  return d > 0 && d < 0.01 ? `$${d.toFixed(3)}` : `$${d.toFixed(2)}`;
};
const uid = () => Math.random().toString(36).slice(2, 10);

// Without a model: the few things the page can answer for sure.
function ruleReply(q: string, live: Live | null): { text: string; then?: Item; open?: Tab } {
  const t = q.toLowerCase();
  const item = CATALOG.find((i) => t.includes(i.what.toLowerCase().split(" ")[0]) || t.includes(i.what.toLowerCase()));
  if (item && /(buy|get|pay|买|要)/.test(t)) return { text: `Here is what that would cost. Your rules check it before anything is paid.`, then: { k: "buy", path: item.path } };
  if (/(rule|budget|cap|limit|规则|上限|预算)/.test(t)) return { text: "Write the new rules in your own words below. Nothing changes until you save them.", then: { k: "rules", text: live?.rules.text ?? "" } };
  if (/(left|remain|how much|剩)/.test(t) && live) {
    const left = live.rules.monthlyBudget - live.ledger.paidThisMonth - live.ledger.pending;
    return { text: `You have ${usd(left)} left of ${usd(live.rules.monthlyBudget)} this month. ${usd(live.ledger.paidThisMonth)} is paid and ${usd(live.ledger.pending)} is still settling.`, open: TAB.home };
  }
  if (/(buy|bought|receipt|spent|paid|买了|收据)/.test(t)) return { text: `Your agent has ${live?.receipts.length ?? 0} receipts so far. I opened the overview beside us.`, open: TAB.home };
  return { text: "I can only answer simple questions until an assistant is connected. Settings shows how." };
}

export default function Assistant() {
  const { threads, setThreads, current, setCurrent, setAppOpen } = useWs();
  const thread = threads.find((t) => t.id === current) ?? null;
  const items = thread?.items ?? [];
  const [ai, setAi] = useState<AiStatus | null>(null);
  const [live, setLive] = useState<Live | null>(null);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [tab, setTab] = useState<string | null>(null);
  const [focus, setFocus] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  // A conversation this page just started keeps the tabs it is opening; switching to another clears them.
  const started = useRef<string | null>(null);

  const refresh = () => fetch("/api/live").then((r) => r.json()).then(setLive).catch(() => {});
  useEffect(() => {
    fetch("/api/ws/ask").then((r) => r.json()).then(setAi).catch(() => setAi(null));
    refresh();
    const c = new URLSearchParams(location.search).get("c");
    if (c) setCurrent(c);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (current && current === started.current) return;
    setTabs([]);
    setTab(null);
    setFocus(false);
  }, [current]);
  useEffect(() => setAppOpen(tabs.length > 0), [tabs.length, setAppOpen]);
  useEffect(() => () => setAppOpen(false), [setAppOpen]);

  const patch = (id: string, fn: (t: Thread) => Thread) => setThreads((all) => all.map((t) => (t.id === id ? fn(t) : t)));
  const add = (id: string, ...more: Item[]) => patch(id, (t) => ({ ...t, at: Date.now(), items: [...t.items, ...more] }));
  const setItem = (id: string, i: number, next: Item) => patch(id, (t) => ({ ...t, items: t.items.map((x, j) => (j === i ? next : x)) }));

  function openTab(t: Tab) {
    setTabs((all) => (all.some((x) => x.id === t.id) ? all.map((x) => (x.id === t.id ? t : x)) : [...all, t]));
    setTab(t.id);
  }
  function closeTab(id: string) {
    setTabs((all) => {
      const left = all.filter((x) => x.id !== id);
      if (tab === id) setTab(left[left.length - 1]?.id ?? null);
      if (!left.length) setFocus(false);
      return left;
    });
  }

  async function say(raw: string) {
    const q = raw.trim();
    if (!q || busy) return;
    setText("");
    let id = current;
    if (!id || !thread) {
      id = uid();
      setThreads((all) => [{ id: id!, title: q.slice(0, 60), at: Date.now(), items: [] }, ...all]);
      started.current = id;
      setCurrent(id);
      history.replaceState(null, "", `/ws?c=${id}`);
    }
    const tid = id;
    add(tid, { k: "user", text: q });
    if (!ai?.configured) {
      const r = ruleReply(q, live);
      add(tid, { k: "ai", text: r.text, via: "rules" }, ...(r.then ? [r.then] : []));
      if (r.open) openTab(r.open);
      return;
    }
    setBusy(true);
    try {
      const msgs = [...items, { k: "user", text: q } as Item]
        .filter((x): x is Extract<Item, { k: "user" | "ai" }> => x.k === "user" || x.k === "ai")
        .map((x) => ({ role: x.k === "user" ? "user" : "assistant", content: x.text }));
      const res = await fetch("/api/ws/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: msgs }) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      const a = body.action;
      const then: Item | null = a?.type === "buy" && byPath(a.path) ? { k: "buy", path: a.path } : a?.type === "rules" && a.text ? { k: "rules", text: String(a.text) } : null;
      add(tid, { k: "ai", text: body.reply || "…", via: "ai" }, ...(then ? [then] : []));
      if (a?.type === "open" && a.what in TAB) openTab(TAB[a.what as "home" | "rules" | "pay"]);
      if (a?.type === "receipt" && a.id) openTab(TAB.receipt(String(a.id), "details"));
    } catch (e) {
      add(tid, { k: "error", text: `The assistant did not answer: ${e instanceof Error ? e.message : "error"}` });
    } finally {
      setBusy(false);
    }
  }

  // ---------- actions behind the cards; each calls the same API as the classic pages ----------
  async function buy(i: number, path: string) {
    if (!current) return;
    const item = byPath(path)!;
    setItem(current, i, { k: "buy", path, state: "done" });
    const res = await fetch("/api/live", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "buy", path, seller: item.seller }) });
    const r: Receipt & { error?: string } = await res.json();
    refresh();
    if (!res.ok || r.error) return add(current, { k: "error", text: r.error || "The payment did not go through." });
    const t = TAB.receipt(r.id, item.what);
    if (r.status === "paid") add(current, { k: "tool", tone: "ok", label: `Paid ${usd(r.amount)} for ${item.what}. The receipt is printed.`, tab: t });
    else if (r.status === "needs_you") add(current, { k: "decide", id: r.id, what: item.what, amount: usd(r.amount) });
    else add(current, { k: "tool", tone: "bad", label: `Stopped before paying: ${r.note ?? "your rules said no"}. Nothing was paid.`, tab: t });
    openTab(t);
  }
  async function decide(i: number, it: Extract<Item, { k: "decide" }>, allow: boolean) {
    if (!current) return;
    setItem(current, i, { ...it, state: allow ? "allowed" : "declined" });
    const res = await fetch("/api/live", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: allow ? "allow" : "decline", id: it.id }) });
    const r: Receipt & { error?: string } = await res.json();
    refresh();
    if (!res.ok || r.error) return add(current, { k: "error", text: r.error || "That did not go through." });
    const t = TAB.receipt(r.id, it.what);
    add(current, allow ? { k: "tool", tone: "ok", label: `Allowed once and paid ${usd(r.amount)} for ${it.what}.`, tab: t } : { k: "tool", tone: "warn", label: `Declined. Nothing was paid for ${it.what}.`, tab: t });
    openTab(t);
  }
  async function saveRules(i: number, ruleText: string) {
    if (!current) return;
    const res = await fetch("/api/rules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: ruleText }) });
    const r = await res.json();
    if (!res.ok || r.error) return add(current, { k: "error", text: r.error || "Those rules could not be read. Try plainer words." });
    setItem(current, i, { k: "rules", text: ruleText, state: "done" });
    refresh();
    add(current, { k: "tool", tone: "ok", label: "Rules saved. Every payment from now on is checked against them.", tab: TAB.rules });
    openTab({ ...TAB.rules, src: `/hifi/rules?t=${Date.now()}` });
  }

  const hour = new Date().getHours();
  const hello = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const left = live ? live.rules.monthlyBudget - live.ledger.paidThisMonth - live.ledger.pending : null;
  const active = tabs.find((t) => t.id === tab) ?? tabs[tabs.length - 1];

  return (
    <section className={`ws-talk${tabs.length ? " ws-talk-app" : ""}${focus ? " ws-talk-focus" : ""}`} aria-label="Conversation">
      <div className="ws-controls" role="group" aria-label="Display">
        {tabs.length > 0 && (
          <>
            <button type="button" title={focus ? "Side by side" : "Give the app area more room"} aria-pressed={focus} onClick={() => setFocus(!focus)}>
              <Icon d={focus ? I.split : I.wide} size={15} />
            </button>
            <button type="button" title="Close the app area" onClick={() => (setTabs([]), setTab(null), setFocus(false))}>
              <Icon d={I.close} size={15} />
            </button>
          </>
        )}
      </div>

      <div className="ws-flow">
        {!items.length ? (
          <div className="ws-hero-wrap">
            <div className="ws-scene" aria-hidden="true" />
            <div className="ws-hero">
              <p className="ws-eyebrow">Receipts · Assistant</p>
              <h1>{hello}, Lina</h1>
              <p className="ws-lede">
                {left == null ? "Reading your agent's month…" : <>Your agent has <b>{usd(left)}</b> left of {usd(live!.rules.monthlyBudget)} this month, inside the rules you wrote.</>}
              </p>
              <Composer text={text} setText={setText} busy={busy} send={say} ai={ai} autoFocus />
              <p className="ws-sec">Start here</p>
              <div className="ws-start">
                {START.map((x) => (
                  <button key={x.t} type="button" className="ws-card" onClick={() => say(x.p)}>
                    <b>{x.t}</b>
                    <span>{x.d}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <Thread items={items} busy={busy} openTab={openTab} buy={buy} decide={decide} saveRules={saveRules} />
            <div className="ws-dock">
              <Composer text={text} setText={setText} busy={busy} send={say} ai={ai} />
            </div>
          </>
        )}
      </div>

      {active && (
        <aside className="ws-app" aria-label="App area">
          <div className="ws-tabs">
            <div className="ws-tabs-list" role="tablist">
              {tabs.map((t) => (
                <span key={t.id} className={`ws-tab${t.id === active.id ? " on" : ""}`}>
                  <button type="button" role="tab" aria-selected={t.id === active.id} onClick={() => setTab(t.id)}>{t.title}</button>
                  <button type="button" className="ws-tab-x" aria-label={`Close ${t.title}`} onClick={() => closeTab(t.id)}>
                    <Icon d={I.close} size={12} />
                  </button>
                </span>
              ))}
            </div>
            <a className="ws-open-full" href={active.src} target="_blank" rel="noreferrer">New window ↗</a>
          </div>
          <iframe key={active.src} className="ws-frame" src={active.src} title={active.title} />
        </aside>
      )}
    </section>
  );
}

function Thread({ items, busy, openTab, buy, decide, saveRules }: {
  items: Item[];
  busy: boolean;
  openTab: (t: Tab) => void;
  buy: (i: number, path: string) => void;
  decide: (i: number, it: Extract<Item, { k: "decide" }>, allow: boolean) => void;
  saveRules: (i: number, text: string) => void;
}) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [items.length, busy]);
  return (
    <div className="ws-thread">
      {items.map((x, i) => {
        if (x.k === "user") return <div key={i} className="ws-user"><div>{x.text}</div></div>;
        if (x.k === "ai")
          return (
            <div key={i} className="ws-ai">
              <span className="ws-ava" aria-hidden="true">R</span>
              <div>
                <p>{x.text}</p>
                {x.via === "rules" && <small className="ws-via">Answered from your receipts, without AI</small>}
              </div>
            </div>
          );
        if (x.k === "buy") {
          const it = byPath(x.path)!;
          return (
            <div key={i} className={`ws-confirm${x.state ? " done" : ""}`}>
              <p className="ws-eyebrow">{x.state ? "Sent to your agent" : "Buy this?"}</p>
              <div className="ws-confirm-row">
                <span><b>{it.what}</b><small>{it.seller === "engine" ? "Codemod engine" : "Solar Data service"}</small></span>
                <span className="ws-price">{it.price}</span>
              </div>
              {!x.state && (
                <div className="ws-confirm-bar">
                  <span>Your rules check the price and the seller before anything is paid.</span>
                  <button type="button" className="ws-btn main" onClick={() => buy(i, x.path)}>Ask the agent to buy it</button>
                </div>
              )}
            </div>
          );
        }
        if (x.k === "rules") return <RulesCard key={i} initial={x.text} done={!!x.state} onSave={(t) => saveRules(i, t)} />;
        if (x.k === "decide")
          return (
            <div key={i} className={`ws-confirm ws-ask${x.state ? " done" : ""}`}>
              <p className="ws-eyebrow">{x.state ? (x.state === "allowed" ? "You allowed it once" : "You declined") : "Your agent is asking"}</p>
              <p className="ws-ask-q">{x.what} costs {x.amount}, more than your cap per payment. Pay it this one time?</p>
              {!x.state && (
                <div className="ws-confirm-bar">
                  <button type="button" className="ws-btn" onClick={() => decide(i, x, false)}>Decline</button>
                  <button type="button" className="ws-btn main" onClick={() => decide(i, x, true)}>Allow once</button>
                </div>
              )}
            </div>
          );
        if (x.k === "tool")
          return (
            <div key={i} className="ws-tool">
              <i className={`ws-tool-dot ${x.tone}`} />
              <span>{x.label}</span>
              {x.tab && <button type="button" onClick={() => openTab(x.tab!)}>Open →</button>}
            </div>
          );
        return <div key={i} className="ws-error">{x.text}</div>;
      })}
      {busy && <div className="ws-typing"><i /><i /><i /></div>}
      <div ref={end} />
    </div>
  );
}

function RulesCard({ initial, done, onSave }: { initial: string; done: boolean; onSave: (t: string) => void }) {
  const [t, setT] = useState(initial);
  return (
    <div className={`ws-confirm${done ? " done" : ""}`}>
      <p className="ws-eyebrow">{done ? "Rules saved" : "New rules, in your words"}</p>
      {done ? (
        <p className="ws-rules-done">&ldquo;{t}&rdquo;</p>
      ) : (
        <>
          <textarea className="ws-rules-input" value={t} rows={2} onChange={(e) => setT(e.target.value)} aria-label="Rules" />
          <div className="ws-confirm-bar">
            <span>Say a monthly amount, a most-per-payment, and which services.</span>
            <button type="button" className="ws-btn main" disabled={!t.trim()} onClick={() => onSave(t)}>Save these rules</button>
          </div>
        </>
      )}
    </div>
  );
}

type Rec = { lang: string; interimResults: boolean; start: () => void; stop: () => void; onresult: ((e: any) => void) | null; onend: (() => void) | null }; // eslint-disable-line @typescript-eslint/no-explicit-any

function Composer({ text, setText, busy, send, ai, autoFocus }: { text: string; setText: (t: string) => void; busy: boolean; send: (t: string) => void; ai: AiStatus | null; autoFocus?: boolean }) {
  const [listening, setListening] = useState(false);
  const [Rec, setRec] = useState<(new () => Rec) | null>(null);
  const rec = useRef<Rec | null>(null);
  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
    setRec(() => w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null);
  }, []);
  function listen() {
    if (!Rec) return;
    if (listening) return rec.current?.stop();
    const r = new Rec();
    r.lang = navigator.language || "en-US";
    r.interimResults = true;
    r.onresult = (e) => {
      const said = Array.from(e.results as ArrayLike<{ 0: { transcript: string } }>).map((x) => x[0].transcript).join("");
      setText(said);
      if (e.results[e.results.length - 1].isFinal) send(said);
    };
    r.onend = () => setListening(false);
    rec.current = r;
    setListening(true);
    r.start();
  }
  return (
    <div className="ws-composer">
      <textarea
        value={text}
        rows={2}
        autoFocus={autoFocus}
        placeholder="Ask about your agent's spending, or tell it what to do…"
        aria-label="Message"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            send(text);
          }
        }}
      />
      <div className="ws-bar">
        <span className="ws-model">{ai?.configured ? ai.model : "Simple answers · no assistant connected"}</span>
        {Rec && (
          <button type="button" className={`ws-mic${listening ? " on" : ""}`} onClick={listen} aria-label={listening ? "Stop listening" : "Speak"} title="Speak">
            <Icon d={I.mic} size={16} />
          </button>
        )}
        <button type="button" className="ws-send" disabled={busy || !text.trim()} onClick={() => send(text)} aria-label="Send">↑</button>
      </div>
    </div>
  );
}
