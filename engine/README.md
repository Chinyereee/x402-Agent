# Engine (the seller)

`POST /api/v1/migrate` behind an x402 v2 paywall on Stellar, as specified in the
[shared README](../README.md).

- An unpaid request gets `402` with `PAYMENT-REQUIRED` (0.05 USDC, `stellar:testnet`,
  `maxTimeoutSeconds: 900`).
- A paid request is verified by the facilitator, then the job runs.
- The payment is settled only if the job answers below 400. A failed job (5xx) or a job
  stopped by the 10-minute timeout (504) is never settled.

Built on the official packages: `@x402/express` (middleware), `@x402/stellar` (exact scheme),
`@x402/core` (facilitator client).

## Status

| Step | | |
|---|---|---|
| A | Paid endpoint, settle-on-success, job timeout, test payer | done |
| B | Free preflight (repo, App, ethers v5, size) | next |
| C | Real job: clone, codemod, `package.json` + lockfile, pull request | |
| D | Idempotent retries (same payment → same job and PR) | |

Until step C, the only job is `hello`: it takes the payment and opens no pull request.

## Run the tests

```bash
npm install          # from the repository root
npm test -w engine
```

The tests use a simulated facilitator, so they need no network.

## First real payment on Stellar testnet (13 Nov milestone)

You need two testnet accounts, made in [Stellar Lab](https://lab.stellar.org/account/create):

| Account | Needs |
|---|---|
| Engine (`PAY_TO`) | XLM from Friendbot, and a USDC trustline |
| Buyer (`BUYER_SECRET`) | XLM from Friendbot, a USDC trustline, and testnet USDC from the [Circle faucet](https://faucet.circle.com/) (choose Stellar) |

Add the trustline in [Stellar Lab → Fund account](https://lab.stellar.org/account/fund).

```bash
cp engine/.env.example engine/.env    # set PAY_TO=G... (the engine account)
npm start -w engine                   # 402 Found engine on http://localhost:4021 ...

# in another terminal
cd engine
BUYER_SECRET=S... EXPECT_PAY_TO=G... npx tsx scripts/pay.ts https://github.com/<owner>/<repo>
```

Expected: `HTTP 200`, a `hello` body, `settled: true` and a stellar.expert link to the
transaction. The test payer refuses to sign anything other than USDC on testnet, at most
0.05, to `EXPECT_PAY_TO`.

If the engine cannot reach the facilitator, it logs `Failed to initialize` and answers
`/api/v1/migrate` with 500. It never does work it cannot be paid for.
