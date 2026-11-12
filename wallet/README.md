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
