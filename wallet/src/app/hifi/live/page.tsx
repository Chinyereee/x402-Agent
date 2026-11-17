import { Live } from "@/components/Live.tsx";
import "../stage/stage.css";
import "./live.css";

export const dynamic = "force-dynamic";

export default function LivePage() {
  return (
    <>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap" precedence="default" />
      <h1>Pay a service</h1>
      <p className="lead">Pick something for Lina&apos;s agent to buy. Her rules check the price first, then it pays with test money and prints a receipt. Each receipt links to the public record on Stellar (testnet), where anyone can check it.</p>
      <Live />
    </>
  );
}
