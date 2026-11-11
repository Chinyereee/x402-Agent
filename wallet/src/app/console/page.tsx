import { Console } from "@/components/Console.tsx";

export default function ConsolePage() {
  return (
    <>
      <h1>Demo console</h1>
      <p className="lead">The x402 handshake between the two modules, step by step. The rule checks are the wallet&apos;s real code; the payment and the engine are simulated in this prototype.</p>
      <Console />
    </>
  );
}
