import { NextResponse, type NextRequest } from "next/server";
import { GATE_COOKIE, LOCKED_MESSAGE, unlocked } from "@/lib/gate.ts";

// Actions behind the demo code: every POST to the API (except unlocking itself) and the live
// payment stream, which spends test money.
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const spends = (req.method === "POST" && pathname !== "/api/unlock") || pathname === "/api/live/stream";
  if (spends && !unlocked(req.cookies.get(GATE_COOKIE)?.value)) {
    return NextResponse.json({ error: LOCKED_MESSAGE, locked: true }, { status: 401 });
  }
  return NextResponse.next();
}

export const config = { matcher: "/api/:path*" };
