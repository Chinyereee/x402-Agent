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

Pages: Home (allowance, rules, receipts), Rules (plain words to enforced limits), a receipt (rule checks and what happened), Demo console (the x402 handshake), and Lo-fi (`/lofi`, the same screens as low-fidelity wireframes with the flow between them, for Phase 2). The rule parsing and checks in `src/lib/rules.ts` are real code; the payments and the engine are sample data until the Stellar side is wired.
