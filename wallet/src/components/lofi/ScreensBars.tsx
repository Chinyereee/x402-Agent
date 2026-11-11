// Low-fidelity versions of the wallet's screens: same structure as the real pages, details drawn as bars.
import type { CSSProperties } from "react";

const Bar = ({ w, k = "", style }: { w: number | string; k?: string; style?: CSSProperties }) => (
  <div className={`lf-bar ${k}`} style={{ width: typeof w === "number" ? `${w}%` : w, ...style }} />
);
const Chip = ({ w }: { w: number }) => <span className="lf-chip" style={{ "--w": `${w}px` } as CSSProperties} />;

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
    <svg width={size} height={size} viewBox="0 0 92 92" aria-hidden>
      {arc(0, 1, "var(--lf-light)")}
      {arc(0.1, 0.9, "var(--lf-mid)")}
      {arc(0, 0.05, "var(--lf-dark)")}
      {arc(0.05, 0.05, "#fff", 12)}
      {arc(0.05, 0.05, "var(--lf-mid)", 5)}
    </svg>
  );
}

function Nav() {
  return (
    <div className="lf-row" style={{ marginBottom: 2 }}>
      <span style={{ width: 16, height: 16, borderRadius: 5, background: "var(--lf-dark)" }} />
      <Bar w={46} k="t" style={{ width: 46 }} />
      <span style={{ flex: 1 }} />
      <Bar w={30} k="g" style={{ width: 30 }} /><Bar w={30} k="g" style={{ width: 30 }} /><Bar w={44} k="m" style={{ width: 44 }} />
    </div>
  );
}

const ROWS = [
  { pill: "pending", label: "Pending", t: 70 },
  { pill: "blocked", label: "Blocked", t: 50 },
  { pill: "needs", label: "Needs you", t: 58 },
  { pill: "paid", label: "Paid", t: 74 },
];

function Receipts({ compact }: { compact?: boolean }) {
  return (
    <div className="lf-lines" style={{ gap: 7 }}>
      {ROWS.map((r) => (
        <div key={r.label} className="lf-card w lf-row" style={{ padding: "8px 10px" }}>
          {!compact && <Bar w={14} k="g" style={{ width: 44, flex: "none" }} />}
          <div className="lf-grow lf-lines" style={{ gap: 5 }}>
            <Bar w={r.t} />
            <div className="lf-row" style={{ gap: 6 }}><span className={`lf-pill ${r.pill}`}>{r.label}</span><Bar w={30} k="m" /></div>
          </div>
          <Bar w={22} k="t" style={{ width: 26, flex: "none" }} />
        </div>
      ))}
    </div>
  );
}

export function HomeLo() {
  return (
    <div className="lf-body">
      <Nav />
      <Bar w={44} k="t" />
      <Bar w={78} k="g" />
      <div className="lf-row" style={{ alignItems: "stretch", gap: 12 }}>
        <div className="lf-card lf-row lf-grow" style={{ gap: 14 }}>
          <Donut />
          <div className="lf-lines">
            <span className="lf-txt s">Available this month</span>
            <span className="lf-txt big">$1.90</span>
            <div className="lf-row" style={{ gap: 6 }}><span className="lf-pill paid">paid</span><span className="lf-pill pending">pending</span></div>
          </div>
        </div>
        <div className="lf-card lf-grow lf-lines" style={{ gap: 8 }}>
          <span className="lf-txt">Your rules</span>
          <div className="lf-row" style={{ gap: 6, flexWrap: "wrap" }}><Chip w={36} /><Chip w={56} /><Chip w={46} /></div>
          <Bar w={86} k="g" /><Bar w={60} k="g" />
          <span className="lf-btn ghost" style={{ width: "fit-content" }}>Change rules</span>
        </div>
      </div>
      <span className="lf-txt">Receipts</span>
      <Receipts />
    </div>
  );
}

export function PhoneLo() {
  return (
    <div className="lf-body" style={{ padding: "10px 12px" }}>
      <Nav />
      <Bar w={60} k="t" />
      <div className="lf-card lf-row" style={{ gap: 12 }}>
        <Donut size={70} />
        <div className="lf-lines"><span className="lf-txt s">Available</span><span className="lf-txt big">$1.90</span></div>
      </div>
      <div className="lf-row" style={{ gap: 6, flexWrap: "wrap" }}><Chip w={30} /><Chip w={48} /><Chip w={40} /></div>
      <span className="lf-txt">Receipts</span>
      <Receipts compact />
    </div>
  );
}

export function RulesLo() {
  return (
    <div className="lf-body">
      <Nav />
      <Bar w={34} k="t" />
      <Bar w={84} k="g" />
      <div className="lf-row" style={{ alignItems: "stretch", gap: 12 }}>
        <div className="lf-card lf-grow lf-lines" style={{ gap: 8 }}>
          <span className="lf-txt">In your words</span>
          <div className="lf-input"><Bar w={92} /><Bar w={70} /></div>
          <Bar w={80} k="m" />
        </div>
        <div className="lf-card lf-grow lf-lines" style={{ gap: 9 }}>
          <span className="lf-txt">What the wallet enforces</span>
          {[40, 34, 62].map((w, i) => <div key={i} className="lf-row"><Bar w={36} k="g" style={{ width: "36%" }} /><Bar w={w} /></div>)}
          <Bar w={88} k="m" />
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
      <Bar w={18} k="m" />
      <Bar w={52} k="t" />
      <div className="lf-row" style={{ alignItems: "stretch", gap: 12 }}>
        <div className="lf-card lf-grow lf-lines" style={{ gap: 8 }}>
          <span className="lf-pill needs" style={{ width: "fit-content" }}>Needs you</span>
          <span className="lf-txt big">$0.40</span>
          <div className="lf-row"><Bar w={30} k="g" style={{ width: "26%" }} /><Bar w={60} /></div>
          <div className="lf-row"><Bar w={30} k="g" style={{ width: "26%" }} /><Bar w={44} /></div>
          <div className="lf-row" style={{ gap: 6 }}><span className="lf-btn">Allow once</span><span className="lf-btn ghost">Say no</span></div>
        </div>
        <div className="lf-card lf-grow lf-lines" style={{ gap: 10 }}>
          <span className="lf-txt">Checked before signing</span>
          <div className="lf-check"><i /><Bar w={70} /></div>
          <div className="lf-check"><i className="no" /><Bar w={58} /></div>
          <div className="lf-check"><i /><Bar w={76} /></div>
        </div>
      </div>
      <div className="lf-card w lf-lines" style={{ gap: 8 }}>
        <span className="lf-txt">What happened</span>
        <div className="lf-step"><i /><Bar w={40} /></div>
        <div className="lf-step"><i /><Bar w={52} /></div>
        <div className="lf-step"><i className="dim" /><Bar w={34} k="m" /></div>
      </div>
    </div>
  );
}

export function ConsoleLo() {
  return (
    <div className="lf-body">
      <Nav />
      <Bar w={30} k="t" />
      <div className="lf-row" style={{ gap: 10 }}>
        <div className="lf-tabs"><span className="on" /><span /><span /></div>
        <span className="lf-btn">Run the handshake</span>
      </div>
      <div className="lf-row" style={{ alignItems: "stretch", gap: 12 }}>
        <div className="lf-card w lf-grow lf-lines" style={{ gap: 7 }}>
          <span className="lf-txt">Wallet</span>
          {[80, 66, 72, 58, 84].map((w, i) => <Bar key={i} w={w} k={i % 2 ? "g" : ""} />)}
        </div>
        <div className="lf-card w lf-grow lf-lines" style={{ gap: 7 }}>
          <span className="lf-txt">Engine</span>
          <Bar w={76} />
          <div className="lf-code"><span className="lf-txt s">PAYMENT-REQUIRED</span><Bar w={60} k="m" /><Bar w={74} k="m" /><Bar w={48} k="m" /></div>
          <Bar w={64} k="g" /><Bar w={70} />
        </div>
      </div>
    </div>
  );
}
