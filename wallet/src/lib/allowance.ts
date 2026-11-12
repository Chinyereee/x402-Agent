// On-chain limits (testnet): Lina's owner wallet grants the agent a USDC allowance with a cap and
// an expiry (SEP-41 approve). The agent keeps only a small float and tops it up with transfer_from.
// Stellar itself refuses any top-up over the allowance or after it expires.
// x402 then pays from the agent's own account, as the standard "exact" scheme requires.
import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { Address, BASE_FEE, Keypair, Networks, Operation, TransactionBuilder, nativeToScVal, rpc, scValToNative } from "@stellar/stellar-sdk";

const env = (k: string) => {
  const v = process.env[k];
  if (!v) throw new Error(`${k} is missing in wallet/.env.local`);
  return v;
};
const UNITS = 10_000_000;
const LEDGER_SECONDS = 5;
const MIN_TOPUP = 0.1 * UNITS; // top up at least this much, so not every payment needs a top-up

const server = () => new rpc.Server(env("WALLET_RPC_URL"));
const owner = () => Keypair.fromSecret(env("OWNER_SECRET"));
const agent = () => Keypair.fromSecret(env("WALLET_AGENT_SECRET"));
const addr = (s: string) => new Address(s).toScVal();
const i128 = (n: number) => nativeToScVal(BigInt(Math.round(n)), { type: "i128" });

export const hasOwner = () => !!process.env.OWNER_SECRET;

type Entry = { at: string; kind: "approve" | "revoke" | "topup" | "refused"; amount: number; hash?: string; note?: string };
type State = { untilLedger: number | null; untilISO: string | null; history: Entry[] };
const FILE = path.join(process.cwd(), "data", "allowance.json");
async function readState(): Promise<State> {
  try { return JSON.parse(await fs.readFile(FILE, "utf8")); } catch { return { untilLedger: null, untilISO: null, history: [] }; }
}
async function writeState(s: State) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(s, null, 2));
}

async function invoke(kp: Keypair, fn: string, args: ReturnType<typeof addr>[]) {
  const s = server();
  const acct = await s.getAccount(kp.publicKey());
  const tx = new TransactionBuilder(acct, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
    .addOperation(Operation.invokeContractFunction({ contract: env("WALLET_USDC_CONTRACT"), function: fn, args }))
    .setTimeout(60).build();
  const sim = await s.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    const code = String(sim.error).match(/Error\(Contract, #\d+\)/)?.[0];
    return { ok: false as const, error: code ? `${code} (the USDC contract refused it)` : String(sim.error).split("\n")[0] };
  }
  const ready = rpc.assembleTransaction(tx, sim).build();
  ready.sign(kp);
  const sent = await s.sendTransaction(ready);
  if (sent.status === "ERROR") return { ok: false as const, error: "rejected at submit", hash: sent.hash };
  const res = await s.pollTransaction(sent.hash, { attempts: 30 });
  return res.status === "SUCCESS" ? { ok: true as const, hash: sent.hash } : { ok: false as const, error: String(res.status), hash: sent.hash };
}

async function view(fn: string, args: ReturnType<typeof addr>[]) {
  const s = server();
  const acct = await s.getAccount(agent().publicKey());
  const tx = new TransactionBuilder(acct, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
    .addOperation(Operation.invokeContractFunction({ contract: env("WALLET_USDC_CONTRACT"), function: fn, args }))
    .setTimeout(60).build();
  const sim = await s.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) throw new Error(String(sim.error).split("\n")[0]);
  return scValToNative(sim.result!.retval);
}

export async function status() {
  const st = await readState();
  const [left, float, ownerBal] = await Promise.all([
    view("allowance", [addr(owner().publicKey()), addr(agent().publicKey())]),
    view("balance", [addr(agent().publicKey())]),
    view("balance", [addr(owner().publicKey())]),
  ]);
  return {
    owner: owner().publicKey(),
    agent: agent().publicKey(),
    allowance: Number(left),
    agentFloat: Number(float),
    ownerBalance: Number(ownerBal),
    untilISO: st.untilISO,
    expired: !!st.untilISO && new Date(st.untilISO) < new Date(),
    history: st.history.slice(-8).reverse(),
    explorer: env("WALLET_EXPLORER_URL"),
  };
}

// The owner grants the monthly budget until the end of the month (or revokes with 0).
export async function approve(amount: number) {
  const latest = (await server().getLatestLedger()).sequence;
  const now = new Date();
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const until = amount > 0 ? latest + Math.ceil((end.getTime() - now.getTime()) / 1000 / LEDGER_SECONDS) : latest;
  const r = await invoke(owner(), "approve", [addr(owner().publicKey()), addr(agent().publicKey()), i128(amount), nativeToScVal(until, { type: "u32" })]);
  const st = await readState();
  st.untilLedger = amount > 0 ? until : null;
  st.untilISO = amount > 0 ? end.toISOString() : null;
  st.history.push({ at: now.toISOString(), kind: amount > 0 ? "approve" : "revoke", amount, hash: r.hash, note: r.ok ? undefined : r.error });
  await writeState(st);
  return r;
}

// Before paying `amount`, make sure the agent's float covers it; if not, top up from the allowance.
// Returns the top-up made (if any). Throws if Stellar refuses it: that refusal is the on-chain limit.
export async function ensureFloat(amount: number): Promise<{ amount: number; hash: string } | null> {
  if (!hasOwner()) return null;
  const float = Number(await view("balance", [addr(agent().publicKey())]));
  if (float >= amount) return null;
  const need = Math.max(amount - float, MIN_TOPUP);
  const left = Number(await view("allowance", [addr(owner().publicKey()), addr(agent().publicKey())]));
  // Prefer a comfortable top-up; if the allowance can't cover that, ask only for what this payment needs.
  // If even that is over the allowance (or it has expired), Stellar refuses the transfer.
  const topup = left >= need ? need : amount - float;
  const r = await invoke(agent(), "transfer_from", [addr(agent().publicKey()), addr(owner().publicKey()), addr(agent().publicKey()), i128(topup)]);
  const st = await readState();
  st.history.push({ at: new Date().toISOString(), kind: r.ok ? "topup" : "refused", amount: topup, hash: r.hash, note: r.ok ? undefined : r.error });
  await writeState(st);
  if (!r.ok) throw new Error(`Stellar refused the top-up from Lina's allowance: ${r.error}. Nothing was paid.`);
  return { amount: topup, hash: r.hash! };
}
