// The public demo: anyone can look, but anything that spends test money, opens a pull request,
// changes rules or calls the AI needs the demo code (DEMO_CODE). Without DEMO_CODE (local dev)
// everything is open. The code is checked against a cookie set by /api/unlock.
export const GATE_COOKIE = "rc_code";
export const LOCKED_MESSAGE = "This is the public demo. Enter the demo code in Settings to let the agent spend test money.";

export function unlocked(cookieValue: string | undefined) {
  const code = process.env.DEMO_CODE;
  return !code || cookieValue === code;
}
