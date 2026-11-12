// One-time testnet setup for on-chain limits: creates Lina's owner wallet, adds a USDC
// trustline, and moves most of the agent's test USDC into it, so the agent keeps only a
// small float and tops up from an allowance the owner grants. Testnet only. Never prints secrets.
//   node scripts/setup-owner.mjs [floatUSDC=0.10]
import fs from "node:fs";
import { Asset, BASE_FEE, Horizon, Keypair, Networks, Operation, TransactionBuilder } from "@stellar/stellar-sdk";

const ENV = ".env.local";
const env = Object.fromEntries(fs.readFileSync(ENV, "utf8").split("\n").filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
if (env.WALLET_NETWORK !== "stellar:testnet") throw new Error("testnet only");

const horizon = new Horizon.Server(env.WALLET_HORIZON_URL);
const USDC = new Asset("USDC", env.WALLET_USDC_ISSUER);
const agent = Keypair.fromSecret(env.WALLET_AGENT_SECRET);
let owner;
if (env.OWNER_SECRET) owner = Keypair.fromSecret(env.OWNER_SECRET);
else {
  owner = Keypair.random();
  fs.appendFileSync(ENV, `# Lina's owner wallet (testnet demo only; in the product she signs in her own wallet)\nOWNER_SECRET=${owner.secret()}\n`);
}
console.log("owner", owner.publicKey());

async function exists(pub) { try { await horizon.loadAccount(pub); return true; } catch { return false; } }
if (!(await exists(owner.publicKey()))) {
  const r = await fetch(`https://friendbot.stellar.org/?addr=${owner.publicKey()}`);
  if (!r.ok) throw new Error(`friendbot ${r.status}`);
  console.log("✓ funded by Friendbot");
}

async function submit(kp, ops) {
  const acc = await horizon.loadAccount(kp.publicKey());
  const b = new TransactionBuilder(acc, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET });
  ops.forEach((o) => b.addOperation(o));
  const tx = b.setTimeout(60).build();
  tx.sign(kp);
  return (await horizon.submitTransaction(tx)).hash;
}

const ownerAcc = await horizon.loadAccount(owner.publicKey());
if (!ownerAcc.balances.find((b) => b.asset_code === "USDC" && b.asset_issuer === USDC.issuer)) {
  console.log("✓ USDC trustline", await submit(owner, [Operation.changeTrust({ asset: USDC })]));
}

const float = Number(process.argv[2] ?? "0.10");
const agentAcc = await horizon.loadAccount(agent.publicKey());
const bal = Number(agentAcc.balances.find((b) => b.asset_code === "USDC" && b.asset_issuer === USDC.issuer)?.balance ?? 0);
const move = Math.floor((bal - float) * 1e7) / 1e7;
if (move > 0) {
  const hash = await submit(agent, [Operation.payment({ destination: owner.publicKey(), asset: USDC, amount: move.toFixed(7) })]);
  console.log(`✓ moved ${move} USDC agent → owner`, hash);
}
console.log(`agent float now ≈ ${float} USDC`);
