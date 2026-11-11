// Low-fidelity versions of the wallet's screens: same structure as the real pages,
// shown in the wireframe style with short real words, so every block says what it is.
import type { CSSProperties } from "react";

type TProps = { k?: string; style?: CSSProperties; children: React.ReactNode };
const T = ({ k = "", style, children }: TProps) => <p className={`lf-t ${k}`} style={style}>{children}</p>;
const Chip = ({ children }: { children: React.ReactNode }) => <span className="lf-chip word">{children}</span>;

export function Frame({ phone, style, children }: { phone?: boolean; style?: CSSProperties; children: React.ReactNode }) {
  return (
    <div className={`lf-frame ${phone ? "lf-phone" : ""}`} style={style}>
      {phone ? <div className="lf-notch"><b /></div> : <div className="lf-chrome"><i /><i /><i /><b /></div>}
      {children}
    </div>
  );
}

function Donut({ size = 92 }: { size?: number }) {
  const r = 34, c = 2 * Math.PI * r;
  const arc = (from: number, len: number, color: string, w = 12) => (
    <circle r={r} cx="46" cy="46" fill="none" stroke={color} strokeWidth={w}
      strokeDasharray={`${len * c} ${c}`} strokeDashoffset={-from * c} transform="rotate(-90 46 46)" />
  );
  return (
    <svg width={size} height={size} viewBox="0 0 92 92" aria-hidden style={{ flex: "none" }}>
      {arc(0, 1, "var(--lf-light)")}
      {arc(0.1, 0.9, "var(--lf-mid)")}
      {arc(0, 0.05, "var(--lf-dark)")}
      {arc(0.05, 0.05, "#fff", 12)}
      {arc(0.05, 0.05, "var(--lf-mid)", 5)}
    </svg>
  );
}

function Nav({ phone }: { phone?: boolean }) {
  return (
    <div className="lf-row" style={{ marginBottom: 2 }}>
      <span className="lf-logo">R</span>
      <T>Receipts</T>
      <span style={{ flex: 1 }} />
      {phone ? <T k="g">☰</T> : <><T k="g">Home</T><T k="g">Rules</T><T k="b">Console</T></>}
    </div>
  );
}

const ROWS = [
  { pill: "pending", label: "Pending", when: "4:12 PM", what: "ethers upgrade · tutor-site", note: "settles when the PR opens", amt: "$0.05" },
  { pill: "blocked", label: "Blocked", when: "2:40 PM", what: "Deploy to production", note: "not on your list · $0 paid", amt: "$0.10" },
  { pill: "needs", label: "Needs you", when: "11:05 AM", what: "Full repository audit", note: "over your $0.25 cap", amt: "$0.40" },
  { pill: "paid", label: "Paid", when: "9:31 AM", what: "ethers upgrade · scheduler-app", note: "PR #12 · Tx 7c1e…f04a", amt: "$0.05" },
];

function Receipts({ compact }: { compact?: boolean }) {
  return (
    <div className="lf-lines" style={{ gap: 7 }}>
      {ROWS.map((r) => (
        <div key={r.label} className="lf-card w lf-row" style={{ padding: "8px 10px" }}>
          {!compact && <T k="g" style={{ width: 52, flex: "none" }}>{r.when}</T>}
          <div className="lf-grow lf-lines" style={{ gap: 4 }}>
            <T>{r.what}</T>
            <div className="lf-row" style={{ gap: 6 }}>
              <span className={`lf-pill ${r.pill}`}>{r.label}</span>
              {!compact && <T k="g">{r.note}</T>}
            </div>
          </div>
          <T style={{ flex: "none", fontSize: 12 }}>{r.amt}</T>
        </div>
      ))}
    </div>
  );
}

export function HomeLo() {
  return (
    <div className="lf-body">
      <Nav />
      <T k="h">Good afternoon, Lina</T>
      <T k="g">Your agent spends inside the rules you wrote. Every payment leaves a receipt.</T>
      <div className="lf-row" style={{ alignItems: "stretch", gap: 12 }}>
        <div className="lf-card lf-row lf-grow" style={{ gap: 14 }}>
          <Donut />
          <div className="lf-lines">
            <span className="lf-txt s">Available this month</span>
            <span className="lf-txt big">$1.90</span>
            <div className="lf-row" style={{ gap: 6 }}><span className="lf-pill paid">$0.05 paid</span><span className="lf-pill pending">$0.05 pending</span></div>
          </div>
        </div>
        <div className="lf-card lf-grow lf-lines" style={{ gap: 8, minWidth: 0 }}>
          <T>Your rules</T>
          <div className="lf-row" style={{ gap: 6, flexWrap: "wrap" }}><Chip>$2 a month</Chip><Chip>Max $0.25 a payment</Chip><Chip>Codemod only</Chip></div>
          <T k="g wrap">&ldquo;$2 a month, at most $0.25 a payment, only the codemod service&rdquo;</T>
          <span className="lf-btn ghost" style={{ width: "fit-content" }}>Change rules</span>
        </div>
      </div>
      <T>Receipts</T>
      <Receipts />
    </div>
  );
}

export function PhoneLo() {
  return (
    <div className="lf-body" style={{ padding: "10px 12px" }}>
      <Nav phone />
      <T k="h">Hi, Lina</T>
      <div className="lf-card lf-row" style={{ gap: 12 }}>
        <Donut size={70} />
        <div className="lf-lines"><span className="lf-txt s">Available</span><span className="lf-txt big">$1.90</span><T k="g">of $2.00 this month</T></div>
      </div>
      <div className="lf-row" style={{ gap: 6, flexWrap: "wrap" }}><Chip>$2 a month</Chip><Chip>Max $0.25</Chip><Chip>Codemod only</Chip></div>
      <T>Receipts</T>
      <Receipts compact />
    </div>
  );
}

export function RulesLo() {
  return (
    <div className="lf-body">
      <Nav />
      <T k="h">Your rules</T>
      <T k="g">Write them the way you would tell a person.</T>
      <div className="lf-row" style={{ alignItems: "stretch", gap: 12 }}>
        <div className="lf-card lf-grow lf-lines" style={{ gap: 8, minWidth: 0 }}>
          <T>In your words</T>
          <div className="lf-input"><T k="wrap" style={{ fontWeight: 500 }}>$2 a month, at most $0.25 a payment, only the codemod service</T></div>
          <T k="g wrap">Budget, cap per payment, allowed services</T>
        </div>
        <div className="lf-card lf-grow lf-lines" style={{ gap: 7, minWidth: 0 }}>
          <T>What the wallet enforces</T>
          {[["Budget", "$2.00 a month"], ["Cap", "$0.25 a payment"], ["Allowed", "Codemod only"]].map(([k, v]) => (
            <div key={k} className="lf-row"><T k="g" style={{ width: 52, flex: "none" }}>{k}</T><T>{v}</T></div>
          ))}
          <T k="b wrap">Read once, no model. Checked in code.</T>
          <span className="lf-btn" style={{ width: "fit-content" }}>Confirm these rules</span>
        </div>
      </div>
    </div>
  );
}

export function ReceiptLo() {
  return (
    <div className="lf-body">
      <Nav />
      <T k="b">← All receipts</T>
      <T k="h">Full repository audit</T>
      <div className="lf-row" style={{ alignItems: "stretch", gap: 12 }}>
        <div className="lf-card lf-grow lf-lines" style={{ gap: 7, minWidth: 0 }}>
          <span className="lf-pill needs" style={{ width: "fit-content" }}>Needs you</span>
          <span className="lf-txt big">$0.40</span>
          <div className="lf-row"><T k="g" style={{ width: "34%" }}>Why</T><T>Wanted a check first</T></div>
          <div className="lf-row"><T k="g" style={{ width: "34%" }}>Paid to</T><T>Codemod engine</T></div>
          <div className="lf-row" style={{ gap: 6 }}><span className="lf-btn">Allow once</span><span className="lf-btn ghost">Say no</span></div>
        </div>
        <div className="lf-card lf-grow lf-lines" style={{ gap: 9, minWidth: 0 }}>
          <T>Checked before signing</T>
          <div className="lf-check"><i /><T>Allowed service</T></div>
          <div className="lf-check"><i className="no" /><T>Cap: $0.40 is over $0.25</T></div>
          <div className="lf-check"><i /><T>Budget: $1.90 left</T></div>
        </div>
      </div>
      <div className="lf-card w lf-lines" style={{ gap: 7 }}>
        <T>What happened</T>
        <div className="lf-step"><i /><T k="g" style={{ width: 52 }}>11:05</T><T>Asked for payment · 402</T></div>
        <div className="lf-step"><i /><T k="g" style={{ width: 52 }}>11:05</T><T>Waiting for you · nothing signed</T></div>
        <div className="lf-step"><i className="dim" /><T k="g" style={{ width: 52 }}>next</T><T k="g">Signs this one payment if you allow</T></div>
      </div>
    </div>
  );
}

export function ConsoleLo() {
  return (
    <div className="lf-body">
      <Nav />
      <T k="h">Demo console</T>
      <div className="lf-row" style={{ gap: 10 }}>
        <div className="lf-tabs word"><span className="on">Within rules</span><span>Over cap</span><span>Off list</span></div>
        <span className="lf-btn">Run the handshake</span>
      </div>
      <div className="lf-row" style={{ alignItems: "stretch", gap: 12 }}>
        <div className="lf-card w lf-grow lf-lines" style={{ gap: 6, minWidth: 0 }}>
          <T>Wallet · Lina&apos;s agent</T>
          <T k="mono">POST /api/v1/migrate</T>
          <T k="g">✓ Allowed · ✓ Under cap · ✓ Budget</T>
          <T k="g">Signs auth entry · pending</T>
          <T k="mono">Retry + PAYMENT-SIGNATURE</T>
          <T k="b">Pending → paid · receipt saved</T>
        </div>
        <div className="lf-card w lf-grow lf-lines" style={{ gap: 6, minWidth: 0 }}>
          <T>Engine · Chinyere</T>
          <T k="g">Preflight passed</T>
          <div className="lf-code"><T k="mono">PAYMENT-REQUIRED</T><T k="mono">0.05 USDC · stellar:testnet</T></div>
          <T k="g">Facilitator verified</T>
          <T>PR #12 opened · settled</T>
        </div>
      </div>
    </div>
  );
}
