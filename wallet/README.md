# Receipts wallet

The buyer side of 402 Found. Work in progress.

An allowance for your agent: the owner writes rules in plain words (a monthly budget, a cap per payment, the services the agent may pay), confirms them once, and the wallet enforces them in code before it signs any x402 payment on Stellar testnet. Every payment, request for approval and blocked attempt leaves a receipt with the pull request and transaction links.

See the [shared contract](../README.md) for the payment requirements and flow.

## Run the prototype

```bash
cd wallet
npm install
npm run dev    # http://localhost:3040
npm test       # rules engine tests
```

Pages: `/` is the lo-fi wireframe board (the same screens with the flow between them, for Phase 2). Under `/hifi` is an early design direction (colours, type, sizes), clickable but not final; we discuss and change screens on the lo-fi board first. It has: home (allowance, rules, receipts), `/hifi/rules` (plain words to enforced limits), a receipt (rule checks and what happened) and `/hifi/console` (the x402 handshake). `/bars` is an earlier lo-fi draft with placeholder bars.

## Live on testnet (`/hifi/live`)

Real x402 payments on Stellar testnet: the agent reads the price out of the 402, the wallet checks the owner's rules in code (`src/lib/rules.ts`), and only then signs, at most the quoted amount to the quoted address. A payment over the cap waits as "Needs you" until the owner allows it once. Every receipt links to the transaction on stellar.expert; signed-but-unsettled payments count as pending against the allowance.

For now the seller is the workshop kit's paid API (github.com/KoxyG/x402-stellar-empower-Her, run locally on port 4021). Switching to the codemod engine means changing `SERVICE_BASE_URL`, `SERVICE_NAME` and `SERVICE_PAYTO`.

Setup: create `wallet/.env.local` (never commit it) with `WALLET_AGENT_SECRET`, `WALLET_NETWORK=stellar:testnet`, `WALLET_RPC_URL`, `WALLET_USDC_CONTRACT`, `WALLET_EXPLORER_URL`, `SERVICE_BASE_URL`, `SERVICE_NAME`, `SERVICE_PAYTO`. Receipts are stored in `wallet/data/` (git-ignored).

## Online demo (Vercel + Render + Supabase)

- **Engine on Render**: the Blueprint in [`render.yaml`](../render.yaml). Render asks for `PAY_TO` and `GITHUB_TOKEN`; the free plan sleeps when idle, so the first job after a while takes longer.
- **Wallet on Vercel**: import the repo with Root Directory `wallet`. Add the same variables as `.env.local`, with `ENGINE_BASE_URL` set to the Render URL, plus:
  - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`: receipts, rules and allowance history live in the `wallet_state` table ([`supabase/schema.sql`](supabase/schema.sql)), because Vercel's disk does not persist. Without them the wallet uses `wallet/data/` as before.
  - `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL` for the assistant (see below).
  - `DEMO_CODE`: anyone can look around; spending test money, opening a pull request, changing rules or asking the assistant needs this code (Settings → Demo code). Without it, everything is open (local dev).
- Leave `SERVICE_BASE_URL` out online: the workshop kit runs only on a laptop, so its items are hidden.
- `node --env-file=.env.local scripts/push-state.mjs` copies the laptop's history into Supabase once.

## The assistant (`/ws`)

The workspace assistant explains rules and receipts in plain words and proposes actions as cards; it never pays or changes rules by itself. Any OpenAI-format chat endpoint works; we use Claude:

```
AI_BASE_URL=https://api.anthropic.com/v1
AI_API_KEY=...            # a key from a separate, prepaid account with auto-reload off
AI_MODEL=claude-sonnet-5-5
AI_DAILY_LIMIT=50         # optional: replies a day, then simple answers without AI
AI_MAX_TOKENS=600         # optional: longest reply
```

Spending stays capped three ways: the prepaid balance on the provider account (auto-reload off), the daily reply cap in the app, and, online, the demo code. No model sits in the payment path. Settings shows today's and this month's replies and tokens. Without these variables the workspace still answers simple questions from the receipts.

## Rules in force, Home and the product page

- `/hifi/rules`: the owner's plain-words rules. Confirming saves them (`wallet/data/rules.json`); every live payment is checked against them. Anything not understood is listed and nothing is saved.
- `/hifi`: Home with the allowance and receipts from real testnet payments.
- `/about`: a one-page product explainer (problem, how it works, on-chain limits, familiar forms, proof links, architecture, team).

## On-chain limits (testnet)

`node scripts/setup-owner.mjs 0.10` creates Lina's owner wallet (Friendbot, USDC trustline) and moves the agent's test USDC into it, leaving a 0.10 float. On `/hifi/live` the owner grants an allowance (SEP-41 `approve`, expiring at month end) or revokes it. Before each payment the agent tops up its float with `transfer_from`; over the allowance, after expiry or after a revoke, the USDC contract refuses it and nothing is paid. x402 still pays from the agent's own account, as the standard `exact` scheme requires. The owner key lives in `.env.local` for the demo only; in the product she would sign in her own wallet.
