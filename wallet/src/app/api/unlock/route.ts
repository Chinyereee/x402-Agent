import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { GATE_COOKIE, unlocked } from "@/lib/gate.ts";

export const dynamic = "force-dynamic";

// GET: is this browser unlocked. POST { code }: unlock it for 30 days.
export async function GET() {
  return NextResponse.json({ locked: !unlocked((await cookies()).get(GATE_COOKIE)?.value) });
}

export async function POST(req: Request) {
  const { code } = await req.json().catch(() => ({ code: "" }));
  if (!process.env.DEMO_CODE) return NextResponse.json({ locked: false });
  if (typeof code !== "string" || code.trim() !== process.env.DEMO_CODE) return NextResponse.json({ error: "That code is not right." }, { status: 403 });
  const res = NextResponse.json({ locked: false });
  res.cookies.set(GATE_COOKIE, code.trim(), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 30, path: "/" });
  return res;
}
