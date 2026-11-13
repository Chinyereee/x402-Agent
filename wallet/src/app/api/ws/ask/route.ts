import { NextResponse } from "next/server";
import { ask, aiStatus } from "@/lib/ws-ask.ts";

export const dynamic = "force-dynamic";

// GET: is the assistant connected (no secrets). POST { messages }: one turn.
export async function GET() {
  return NextResponse.json(aiStatus());
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    return NextResponse.json(await ask(Array.isArray(messages) ? messages : []));
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
