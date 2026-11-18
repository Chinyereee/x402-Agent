"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { WsProvider, useWs } from "./context.tsx";
import { Icon, I } from "./icons.tsx";
import "./ws.css";

/*
 * The Receipts workspace (/ws): side nav that folds to icons · conversation first · app area
 * inside the conversation. Function pages (overview, rules, pay) are full pages of their own.
 * The classic pages under /hifi stay as they are.
 */
const NAV = [
  { href: "/ws", label: "Assistant", d: I.chat },
  { href: "/ws/home", label: "Overview", d: I.home },
  { href: "/ws/rules", label: "Rules", d: I.rules },
  { href: "/ws/pay", label: "Pay a service", d: I.pay },
  { href: "/ws/job", label: "Codemod job", d: I.job },
  { href: "/ws/guide", label: "How it works", d: I.guide },
  { href: "/ws/settings", label: "Settings", d: I.gear },
];

// Each function page can hand its context to a new conversation ("Ask about this").
const ASK: { at: RegExp; title: string; q: (path: string) => string }[] = [
  { at: /^\/ws\/home$/, title: "Overview", q: () => "Explain my overview: what did my agent pay for, and how much is left?" },
  { at: /^\/ws\/rules$/, title: "Rules", q: () => "Help me check my rules. Are they safe for my agent?" },
  { at: /^\/ws\/pay$/, title: "Pay a service", q: () => "What can my agent buy here, and what would my rules allow?" },
  { at: /^\/ws\/job$/, title: "Codemod job", q: () => "Explain in plain words what happens in the codemod job." },
  { at: /^\/ws\/receipts\//, title: "Receipt", q: (p) => `Explain receipt ${p.split("/").pop()} in plain words.` },
  { at: /^\/ws\/guide$/, title: "How it works", q: () => "Explain how this works with an everyday example." },
  { at: /^\/ws\/settings$/, title: "Settings", q: () => "How do I connect the assistant?" },
];

function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { threads, setThreads, current, setCurrent, appOpen } = useWs();
  const [fold, setFold] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [mobile, setMobile] = useState(false);
  // Shown inside the app area (an iframe): just the page, no second shell around it.
  const [embedded, setEmbedded] = useState(false);
  useEffect(() => {
    setEmbedded(window.self !== window.top);
    try {
      setFold(localStorage.getItem("ws-fold") === "1");
    } catch {}
    const on = () => setNarrow(window.innerWidth < 1440);
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  useEffect(() => setMobile(false), [path]);
  // Folds by itself while the app area is open on a laptop-size screen.
  const railed = fold || (appOpen && narrow && path === "/ws");
  const page = ASK.find((a) => a.at.test(path));
  const toggle = () => {
    setFold(!railed);
    try {
      localStorage.setItem("ws-fold", railed ? "0" : "1");
    } catch {}
  };
  const open = (id: string | null) => {
    setCurrent(id);
    router.push(id ? `/ws?c=${id}` : "/ws");
  };

  if (embedded) return <div className="ws-bare">{children}</div>;
  return (
    <div className={`ws${railed ? " ws-railed" : ""}`}>
      <aside className={`ws-side${mobile ? " ws-side-open" : ""}`} aria-label="Navigation">
        <div className="ws-brand">
          <img className="ws-mark-img" src="/porcelain/star2.webp" alt="" aria-hidden="true" />
          <span className="ws-brand-t">
            <b>Receipts</b>
            <small>An allowance, not your wallet</small>
          </span>
          <button type="button" className="ws-fold" onClick={toggle} aria-label={railed ? "Open the side bar" : "Fold the side bar"}>
            <Icon d={railed ? I.unfold : I.fold} size={16} />
          </button>
        </div>
        <div className="ws-scroll">
          <button type="button" className="ws-new" onClick={() => open(null)} title="New conversation">
            <Icon d={I.new} /> <span>New conversation</span>
          </button>
          <nav className="ws-nav">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} title={n.label} className={path === n.href && !(n.href === "/ws" && current) ? "on" : ""} onClick={() => n.href === "/ws" && setCurrent(null)}>
                <Icon d={n.d} /> <span>{n.label}</span>
              </Link>
            ))}
          </nav>
          <p className="ws-group">Recent</p>
          <div className="ws-recent">
            {threads.map((t) => (
              <div key={t.id} className={`ws-item${t.id === current && path === "/ws" ? " on" : ""}`}>
                <button type="button" title={t.title} onClick={() => open(t.id)}>{t.title}</button>
                <button type="button" className="ws-del" aria-label={`Delete ${t.title}`} onClick={() => (setThreads((all) => all.filter((x) => x.id !== t.id)), t.id === current && open(null))}>
                  <Icon d={I.trash} size={14} />
                </button>
              </div>
            ))}
            {!threads.length && <p className="ws-empty">No conversations yet</p>}
          </div>
          <p className="ws-group">Classic</p>
          <nav className="ws-nav">
            <a href="/hifi" title="Classic pages"><Icon d={I.out} /> <span>Classic pages</span></a>
          </nav>
        </div>
        <div className="ws-foot">
          <span className="ws-seal">L</span>
          <span className="ws-who">
            <b>Lina</b>
            <small>Stellar testnet · test money</small>
          </span>
        </div>
      </aside>
      {mobile && <div className="ws-scrim" onClick={() => setMobile(false)} />}
      <div className="ws-main">
        <div className="ws-mbar">
          <button type="button" className="ws-burger" onClick={() => setMobile(true)} aria-label="Open navigation">
            <Icon d={I.menu} />
          </button>
          <b>{page?.title ?? "Assistant"}</b>
          <Link href="/ws" className="ws-mbar-new" aria-label="New conversation" onClick={() => setCurrent(null)}>
            <Icon d={I.new} size={16} />
          </Link>
        </div>
        {/* the conversation fills the column; function pages get a centred page width */}
        {path === "/ws" ? children : (
          <div className="ws-pagewrap">
            {children}
            {page && (
              <Link className="ws-askthis" href={`/ws?ask=${encodeURIComponent(page.q(path))}`} onClick={() => setCurrent(null)}>
                <Icon d={I.spark} size={15} /> Ask about this
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function WsLayout({ children }: { children: React.ReactNode }) {
  return (
    <WsProvider>
      <Shell>{children}</Shell>
    </WsProvider>
  );
}
