# 402 Found

Per-call developer services, paid by agents inside rules their owners set, over x402 on Stellar.

Team 402 Found for EmpowerHer: Building the Agent Economy.

| Module | Owner | Role |
|---|---|---|
| Codemod engine | Chinyere | The seller: upgrades a repository from ethers v5 to v6 and delivers it as a GitHub pull request, behind an HTTP 402 |
| Receipts wallet (`/wallet`) | Elodie | The buyer: holds the agent's testnet key, enforces the owner's rules in code, signs the payment, keeps a receipt |

The codemod the engine runs lives in [`/codemod`](codemod), with its full git history; [`codemod/HACKATHON.md`](codemod/HACKATHON.md) shows what existed before the hackathon and what we added.

This README is the shared contract between the two modules.

## Demo

- Demo video: https://youtu.be/1BqJvxQohkI
- Live demo: coming soon (engine on Render, wallet on Vercel)
- Everything runs on Stellar testnet with test money. Every payment in the video has a real transaction and a real pull request.

## Run it

Needs Node 22+.

### Engine (`/engine`)

```bash
npm install                          # from the repository root
cp engine/.env.example engine/.env   # set PAY_TO=G... (the engine account), GITHUB_TOKEN, JOB=migrate, PORT=4041
npm start -w engine                  # 402 Found engine on http://localhost:4041
```

`JOB=migrate` opens a real pull request; `JOB=hello` takes the payment and opens none. Without `PORT` the engine uses 4021, the port the workshop kit's Solar Data service also uses. To deploy, [`render.yaml`](render.yaml) describes the service for Render. More in [`engine/README.md`](engine/README.md).

### Wallet (`/wallet`)

Needs a funded Stellar testnet key for the agent.

```bash
cd wallet
npm install
npm test       # rules engine tests, no network
npm run dev    # http://localhost:3040
```

1. Create `wallet/.env.local` (git-ignored, never commit it) with `WALLET_AGENT_SECRET`, `WALLET_NETWORK=stellar:testnet`, `WALLET_RPC_URL`, `WALLET_HORIZON_URL`, `WALLET_USDC_CONTRACT`, `WALLET_USDC_ISSUER`, `WALLET_EXPLORER_URL`, and the engine: `ENGINE_BASE_URL` (e.g. `http://localhost:4041`), `ENGINE_PAYTO` (the engine's pay-to address), `ENGINE_TEST_REPO` (the demo repository). Optional: `OWNER_SECRET` for on-chain limits, `AI_*` for the assistant (see `wallet/README.md`).
2. Optional on-chain limits: `node scripts/setup-owner.mjs 0.10` creates the owner wallet and leaves the agent a 0.10 USDC float.
3. Open `/ws/rules`, write the rules in plain words and confirm them.
4. Open `/ws/job` and press “Run the codemod job”. The wallet checks the rules, pays the 402, and keeps a receipt with the pull request and transaction links (`/ws/home`).

More in [`wallet/README.md`](wallet/README.md).

### Pay the engine from your own testnet wallet

The engine takes payment from any x402 buyer, not only our wallet. To check it with your own key (test money only):

1. Create a Stellar testnet account and fund it with Friendbot, then add a USDC trustline (both in [Stellar Lab](https://lab.stellar.org/), network Testnet).
2. Get free test USDC at [faucet.circle.com](https://faucet.circle.com) (Stellar Testnet).
3. Run the test payer against the engine. The engine can only open pull requests on repositories its token may push to, so use our demo repository:

```bash
npm install
BUYER_SECRET=S... ENGINE_URL=<engine URL> npx tsx engine/scripts/pay.ts https://github.com/haodaz/ethers-v5-demo
```

It prints the pull request and the Stellar transaction. It pays at most 0.05 USDC (`MAX_AMOUNT`), and only to the address in `EXPECT_PAY_TO` if you set it.

## Payment requirements (x402 v2)

The engine answers an unpaid `POST /api/v1/migrate` with `402` and a `PAYMENT-REQUIRED` header. Decoded:

```json
{
  "x402Version": 2,
  "resource": {
    "url": "https://<engine>/api/v1/migrate",
    "description": "ethers v5 to v6 codemod, delivered as a pull request"
  },
  "accepts": [{
    "scheme": "exact",
    "network": "stellar:testnet",
    "asset": "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
    "amount": "500000",
    "payTo": "<engine Stellar address>",
    "maxTimeoutSeconds": 900
  }]
}
```

- `asset` is the testnet USDC SEP-41 contract from the Stellar docs.
- `amount` is 0.05 USDC in atomic units (7 decimals).
- Build headers with the x402 package types. If they differ from this sketch, the package wins and this README is updated.

### Why `maxTimeoutSeconds` is 900

On Stellar, the buyer signs a Soroban authorization entry. It does not hold the funds, and it expires at `currentLedger + maxTimeoutSeconds / ~5 s`. The engine settles only after the pull request is open, so the job must finish well inside that window.

- The engine has a hard job timeout of 10 minutes, leaving at least 5 minutes to settle.
- The wallet counts a signed but unsettled payment as **pending** against the owner's allowance. It becomes **paid** on `PAYMENT-RESPONSE`, or returns to the allowance once the signature has expired.

## Flow

1. The agent calls `POST /api/v1/migrate` with `{ "repoUrl": "https://github.com/<owner>/<repo>" }`.
2. Free preflight: github.com repo, the engine can push to it (a scoped token for the demo, a GitHub App in the product), ethers v5 present, size under the limit. A failure returns 4xx and no payment request.
3. The engine answers `402` with `PAYMENT-REQUIRED`.
4. The wallet checks the owner's rules in code (budget, cap per payment, allowed services). If they pass, it signs the Soroban authorization entry and repeats the POST with `PAYMENT-SIGNATURE`. Over the cap it asks the owner; off the list it blocks. No model sits in this step.
5. The engine verifies through the facilitator, clones, runs the codemod, regenerates the lockfile and opens the pull request.
6. Only if the pull request opened, the engine settles and returns `200` with `PAYMENT-RESPONSE` and the body below. The wallet stores the receipt.

Success body:

```json
{
  "status": "pr_opened",
  "jobId": "job_...",
  "prUrl": "https://github.com/<owner>/<repo>/pull/12",
  "transforms": ["rename-utils", "rename-providers", "bigNumber-to-bigint", "await-getSigner", "package-json"],
  "needsHuman": [{ "file": "src/Wallet.ts", "line": 14, "reason": "getSigner() in a constructor" }]
}
```

## Errors

| Code | When | Paid? |
|---|---|---|
| 400 | Not a github.com repo | No payment requested |
| 403 | The engine's token cannot push to the repo | No payment requested |
| 404 | Repo not found | No payment requested |
| 413 | Repo too large | No payment requested |
| 422 | No ethers v5 | No payment requested |
| 5xx | Failure after verification | Never settled |
| 502 | GitHub unreachable | No payment requested |

A retry with the same payment returns the same `jobId` and pull request.

## Facilitator

The engine uses the public x402 facilitator at `https://www.x402.org/facilitator` (set in `FACILITATOR_URL`), which supports Stellar testnet and pays the network fee. No API key is needed. Any x402 facilitator that supports `stellar:testnet` can be swapped in through `FACILITATOR_URL`.

Source: [Stellar Developers, "What is x402?"](https://developers.stellar.org/docs/build/agentic-payments/x402)
