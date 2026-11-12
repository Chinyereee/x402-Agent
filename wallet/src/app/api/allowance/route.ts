import { NextResponse } from "next/server";
import { approve, hasOwner, status } from "@/lib/allowance.ts";
import { readRules } from "@/lib/rules-store.ts";
import { ledger, readReceipts } from "@/lib/live.ts";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!hasOwner()) return NextResponse.json({ enabled: false });
  return NextResponse.json({ enabled: true, ...(await status()) });
}

// action "grant": the owner approves what is left of her monthly budget until the end of the month,
// so the on-chain allowance and the wallet's budget agree. "revoke": 0.
export async function POST(req: Request) {
  const { action } = await req.json();
  const paid = ledger(await readReceipts()).paidThisMonth;
  const amount = action === "revoke" ? 0 : Math.max(0, (await readRules()).rules.monthlyBudget - paid);
  const r = await approve(amount);
  return NextResponse.json(r, { status: r.ok ? 200 : 400 });
}
