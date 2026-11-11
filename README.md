# 402 Found

Per-call developer services, paid by agents inside rules their owners set, over x402 on Stellar.

Team 402 Found for EmpowerHer: Building the Agent Economy.

| Module | Owner | Role |
|---|---|---|
| Codemod engine | Chinyere | The seller: upgrades a repository from ethers v5 to v6 and delivers it as a GitHub pull request, behind an HTTP 402 |
| Receipts wallet (`/wallet`) | Elodie | The buyer: holds the agent's testnet key, enforces the owner's rules in code, signs the payment, keeps a receipt |

The codemod the engine runs lives in [`/codemod`](codemod), with its full git history; [`codemod/HACKATHON.md`](codemod/HACKATHON.md) shows what existed before the hackathon and what we added.

This README is the shared contract between the two modules. If anything here changes, change it here first and tell the other person.

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
2. Free preflight: github.com repo, GitHub App installed, ethers v5 present, size under the limit. A failure returns 4xx and no payment request.
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
  "transforms": ["rename-utils", "rename-providers", "bigNumber-to-bigint", "await-getsigner", "package-json"],
  "needsHuman": [{ "file": "src/Wallet.ts", "line": 14, "reason": "getSigner() in a constructor" }]
}
```

## Errors

| Code | When | Paid? |
|---|---|---|
| 400 | Not a github.com repo | No payment requested |
| 403 | GitHub App not installed | No payment requested |
| 404 | Repo not found | No payment requested |
| 413 | Repo too large | No payment requested |
| 422 | No ethers v5 | No payment requested |
| 5xx | Failure after verification | Never settled |

A retry with the same payment returns the same `jobId` and pull request.

## Facilitator

- Primary: OpenZeppelin Relayer x402 facilitator, testnet (API key required).
- Fallback: Coinbase x402 facilitator, which supports Stellar testnet with sponsored fees.

Source: [Stellar Developers, "What is x402?"](https://developers.stellar.org/docs/build/agentic-payments/x402)

## Dates

| Date | Milestone |
|---|---|
| 13 Nov | A paid "hello" endpoint settles one real testnet payment through the facilitator |
| 16 Nov | Phase 2: wireframes, C4 diagrams, x402 overview |
| 20 Nov | Full loop: preflight, GitHub App, settle on success, receipts |
| 26–27 Nov | Demo and judging |
