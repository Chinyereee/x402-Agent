// Server-sent events: each step of a live payment, sent the moment it happens.
import { answer, buy, type LiveEvent, type Seller } from "@/lib/live.ts";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: LiveEvent | { type: "error"; message: string } | { type: "end" }) =>
        controller.enqueue(enc.encode(`data: ${JSON.stringify(e)}\n\n`));
      try {
        const id = q.get("answer");
        if (id) await answer(id, q.get("allow") === "1", send);
        else await buy(q.get("path") ?? "/paid/sun-forecast", (q.get("seller") as Seller) ?? "main", send);
      } catch (e) {
        send({ type: "error", message: (e as Error).message });
      }
      send({ type: "end" });
      controller.close();
    },
  });
  return new Response(stream, { headers: { "content-type": "text/event-stream", "cache-control": "no-cache" } });
}
