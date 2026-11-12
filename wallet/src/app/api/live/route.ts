import { NextResponse } from "next/server";
import { answer, buy, ledger, readReceipts, rules, RULES_TEXT } from "@/lib/live.ts";

export const dynamic = "force-dynamic";

export async function GET() {
  const receipts = await readReceipts();
  const r = rules();
  return NextResponse.json({ receipts, ledger: ledger(receipts), rules: { monthlyBudget: r.monthlyBudget, capPerPayment: r.capPerPayment, allow: r.allow.map((s) => s.name), text: RULES_TEXT } });
}

export async function POST(req: Request) {
  const body = await req.json();
  try {
    if (body.action === "buy") return NextResponse.json(await buy(String(body.path)));
    if (body.action === "allow" || body.action === "decline") return NextResponse.json(await answer(String(body.id), body.action === "allow"));
    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
