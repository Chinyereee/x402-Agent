import { NextResponse } from "next/server";
import { apply, plan } from "@/lib/demo-reset.ts";

export const dynamic = "force-dynamic";

// GET: what a reset would close and delete. POST { confirm: true }: do it.
export async function GET() {
  try {
    return NextResponse.json(await plan(process.env));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  const { confirm } = await req.json().catch(() => ({}));
  if (confirm !== true) return NextResponse.json({ error: "Send { confirm: true } to reset the demo repo." }, { status: 400 });
  try {
    return NextResponse.json(await apply(process.env));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
