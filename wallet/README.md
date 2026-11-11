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
