import { Live } from "@/components/Live.tsx";
import "../stage/stage.css";
import "./live.css";

export const dynamic = "force-dynamic";

export default function LivePage() {
  return (
    <>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap" precedence="default" />
      <h1>Live on testnet</h1>
      <p className="lead">Lina&apos;s agent pays real x402 requests on Stellar testnet. The wallet checks her rules in code before it signs, and every receipt links to the transaction.</p>
      <Live />
    </>
  );
}
