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
| B | Free preflight (repo, push access, ethers v5, size) | done |
| C | Real job: clone, codemod, `package.json` + lockfile, pull request | done |
| D | Idempotent retries (same payment → same job and PR) | done |

`JOB=migrate` runs step C: it clones the default branch, runs `/codemod`, regenerates `package-lock.json` if there is one (`--ignore-scripts`), pushes a `402found/ethers-v6-<id>` branch and opens the pull request. The description lists the changed files, the codemod's TODOs and failures, and the `package.json` warnings, so the maintainer knows what to check. Any failure answers 5xx and the payment is not settled. `JOB=hello` still takes the payment and opens no pull request.

### Order of a paid job

1. The paywall verifies the payment with the facilitator before the job starts. An invalid payment never runs a job.
2. The job opens the pull request.
3. The paywall settles. If settlement fails, the engine closes the pull request and deletes its branch, so a failed payment never leaves free work behind.

A retry with the same `PAYMENT-SIGNATURE` gets the same `jobId`, pull request and `PAYMENT-RESPONSE`; a retry while the job is still running waits for it. This is kept in memory, so it lasts until the engine restarts.

### Known limits

- Only the root `package.json` is updated. In a monorepo, nested packages keep ethers v5 and need a manual bump.
- The pull request description lists the codemod's TODOs whenever there are any, along with failures and `package.json` warnings.

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
cp engine/.env.example engine/.env    # set PAY_TO=G... (the engine account) and GITHUB_TOKEN
npm start -w engine                   # 402 Found engine on http://localhost:4021 ...

# in another terminal
cd engine
BUYER_SECRET=S... EXPECT_PAY_TO=G... npx tsx scripts/pay.ts https://github.com/<owner>/<repo>
```

The repo must pass the free preflight first: the token can push to it and a `package.json`
depends on ethers v5. Otherwise the engine answers 400/403/404/413/422 and never asks for
payment. A fork of any ethers v5 project works.

Expected: `HTTP 200`, a `hello` body, `settled: true` and a stellar.expert link to the
transaction. The test payer refuses to sign anything other than USDC on testnet, at most
0.05, to `EXPECT_PAY_TO`.

If the engine cannot reach the facilitator, it logs `Failed to initialize` and answers
`/api/v1/migrate` with 500. It never does work it cannot be paid for.
