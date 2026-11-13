import { aiStatus } from "@/lib/ws-ask.ts";

export const dynamic = "force-dynamic";

// Settings (function page): where the assistant gets connected.
export default function Settings() {
  const ai = aiStatus();
  return (
    <div className="ws-page">
      <p className="ws-eyebrow">Settings</p>
      <h1 className="ws-page-h">How the workspace works for you</h1>
      <section className="ws-set">
        <h2>Assistant</h2>
        <p className="ws-set-now">
          <i className={`ws-tool-dot ${ai.configured ? "ok" : "warn"}`} /> {ai.configured ? `Connected: ${ai.model} at ${ai.host}` : "Not connected. The workspace answers simple questions from your receipts."}
        </p>
        <p>A Claude key works as is, and so does any service that speaks the OpenAI chat format. Add these to <code>wallet/.env.local</code> and restart:</p>
        <pre>{`AI_BASE_URL=https://api.anthropic.com/v1\nAI_API_KEY=your-anthropic-key\nAI_MODEL=claude-sonnet-5-5`}</pre>
        <p className="ws-fine">The key stays on the server. The assistant reads your rules and receipts and explains them. It never pays or changes rules by itself: every action comes back to you as a card.</p>
      </section>
    </div>
  );
}
