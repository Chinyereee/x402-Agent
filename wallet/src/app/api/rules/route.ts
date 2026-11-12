import { NextResponse } from "next/server";
import { confirmRules, readRules, services } from "@/lib/rules-store.ts";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ...(await readRules()), services: services() });
}

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    return NextResponse.json(await confirmRules(String(text ?? "")));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
