import { Scale } from "@/components/lofi/Scale.tsx";
import { ConsoleLo, Frame, HomeLo, PhoneLo, ReceiptLo, RulesLo } from "@/components/lofi/Screens.tsx";
import "./lofi.css";

const W = 1600;
const H = 1080;

// Dashed flow line with a node at the start and an arrow at the end.
function Flow({ d, sx, sy }: { d: string; sx: number; sy: number }) {
  return (
    <>
      <path d={d} fill="none" stroke="var(--lf-mid)" strokeWidth="3" strokeDasharray="2 9" strokeLinecap="round" markerEnd="url(#lf-arrow)" />
      <circle cx={sx} cy={sy} r="8" fill="#fff" stroke="var(--lf-dark)" strokeWidth="3" />
    </>
  );
}

const TAGS = [
  { text: "Rules read once, no model", light: false },
  { text: "Checked in code before signing", light: true },
  { text: "Pending until the PR opens", light: false },
  { text: "Blocked costs nothing", light: true },
];

const SCREENS = [
  { n: "01", title: "Rules", note: "Plain words on the left, the limits the wallet will enforce on the right. Nothing changes until she confirms.", el: <RulesLo /> },
  { n: "02", title: "Home", note: "What is left this month, her rules as chips, and every receipt: paid, pending, needs you, blocked.", el: <HomeLo /> },
  { n: "03", title: "Receipt · Needs you", note: "Why the agent stopped, each rule ticked or crossed, and one tap to allow this payment once.", el: <ReceiptLo /> },
  { n: "04", title: "Demo console", note: "For judges: the x402 handshake between the wallet and the engine, step by step.", el: <ConsoleLo /> },
  { n: "05", title: "Home on a phone", note: "The same allowance and receipts, stacked.", el: <PhoneLo />, phone: true },
];

export default function LofiPage() {
  return (
    <>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700&display=swap" precedence="default" />
      <div className="lf">
        <div className="lf-head">
          <h1 className="lf-title">Receipts · Lo-fi</h1>
          <span className="lf-by">402 Found · Phase 2 wireframes</span>
        </div>
        <p className="lf-sub">The buyer side: an allowance for your agent, with a receipt for every payment.</p>

        <Scale width={W} height={H}>
          <svg className="lf-flow" width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            <defs>
              <marker id="lf-arrow" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="12" markerHeight="12" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
                <path d="M2 1 L11 6 L2 11 Z" fill="#fff" stroke="var(--lf-dark)" strokeWidth="2.2" strokeLinejoin="round" />
              </marker>
            </defs>
            <Flow d="M 500 275 H 584" sx={500} sy={275} />
            <Flow d="M 1150 250 H 1254" sx={1150} sy={250} />
            <Flow d="M 590 500 H 300 Q 280 500 280 520 V 594" sx={590} sy={500} />
            <Flow d="M 880 648 V 616" sx={880} sy={648} />
            <Flow d="M 530 860 H 600" sx={530} sy={860} />
          </svg>

          <Frame style={{ left: 30, top: 110, width: 470, height: 330 }}><RulesLo /></Frame>
          <Frame style={{ left: 590, top: 50, width: 560, height: 560 }}><HomeLo /></Frame>
          <Frame phone style={{ left: 1260, top: 30, width: 270, height: 560 }}><PhoneLo /></Frame>
          <Frame style={{ left: 30, top: 600, width: 500, height: 430 }}><ReceiptLo /></Frame>
          <Frame style={{ left: 620, top: 650, width: 520, height: 380 }}><ConsoleLo /></Frame>

          <span className="lf-note" style={{ left: 488, top: 238 }}>Confirm once</span>
          <span className="lf-note" style={{ left: 1150, top: 212 }}>Same on a phone</span>
          <span className="lf-note" style={{ left: 330, top: 508 }}>Tap a receipt</span>
          <span className="lf-note" style={{ left: 896, top: 620 }}>Every run leaves a receipt</span>
          <span className="lf-note" style={{ left: 528, top: 822 }}>Allow once</span>

          <svg className="lf-flow" width={W} height={H}>
            <path d="M 1207 700 V 934" stroke="var(--lf-mid)" strokeWidth="3" strokeDasharray="2 9" strokeLinecap="round" fill="none" />
          </svg>
          {TAGS.map((t, i) => (
            <span key={t.text} className="lf-tag" style={{ left: 1200, top: 680 + i * 78 }}>
              <i /><span className={t.light ? "l" : ""}>{t.text}</span>
            </span>
          ))}
        </Scale>

        <h2 className="lf-h2">Screens one by one</h2>
        <div className="lf-screens">
          {SCREENS.map((s) => (
            <div key={s.n}>
              <Frame phone={s.phone} style={{ position: "relative", maxWidth: s.phone ? 300 : undefined }}>{s.el}</Frame>
              <div className="lf-cap"><b>{s.n}</b><strong>{s.title}</strong><p>{s.note}</p></div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
