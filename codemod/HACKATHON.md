# The codemod during the hackathon

This folder is [Chinyereee/ethers-v5-to-v6-codemod](https://github.com/Chinyereee/ethers-v5-to-v6-codemod),
brought in with its full git history (`git subtree`), so every change below can be
checked commit by commit.

## What existed before the hackathon (up to `9d46e3f`, 8 Nov 2026)

- 8 jscodeshift transforms: utils renames, BigNumber → bigint, provider renames,
  constants, contract method buckets, provider methods, `getGasPrice` → `getFeeData`,
  import cleanup.
- 154 tests.
- A CLI (`src/run.ts`) and a Codemod registry workflow (`scripts/`, `workflow.yaml`).

## What we added during the hackathon (from `601893a`, 11 Nov 2026)

Each fix comes with tests, written to fail before the fix. Most were found by running the
codemod on a real ethers v5 codebase and type-checking the result against ethers 6.

| Change | Found on |
|---|---|
| Packaging: lockfile in sync, `npm run build` works, CLI runs | the repo itself |
| `toHexString()` keeps the `0x` prefix (`toBeHex`) | sample code |
| Arithmetic operands become bigint (`2` → `2n`, `fee` → `BigInt(fee)`) | sample code |
| `import { ethers } from 'ethers'` handled like `import * as ethers` | sample code |
| New transform: `await provider.getSigner()` (safe places only, the rest flagged) | sample code |
| BigNumber chains and `pow` / `mod` / `shl` / `shr` / `isZero` / `abs` | Uniswap v3-periphery |
| `BigNumber` type annotations → `bigint` | Uniswap v3-periphery |
| Destructured `constants.X` → bare names | Uniswap v3-periphery |
| New transform: `ethers/lib/*` and `@ethersproject/*` imports | Uniswap v3-periphery |
| Function types stay valid when BigNumber types are rewritten | Aave v3 core |
| `.ts` files parsed with the `ts` parser (casts like `<any>x`) | Aave v3 core |
| No duplicate `ethers` import next to hardhat's `ethers` | Aave v3 core |
| New transform: `hexlify(number)` → `toBeHex` | scaffold-eth |
| `sendTransaction` renamed only on providers | Safe |
| v5 numeric constants treated as bigint | Uniswap v3-periphery |
| `migrateDirectory()` API, used by the x402 engine | the engine |

Tests: **154 → 261**. Transforms: **8 → 11**.

Semantics were checked against the real libraries (ethers 5.8.0 and 6.17.0), not from
memory. That is how we found, for example, that v5 `mod` never returns a negative while
`%` does, so `.mod()` is converted with a TODO rather than silently.

## How we checked it

We ran the codemod on Uniswap v3-periphery, Safe (v1.3.0 and current `main`, which is
already on ethers 6), Aave v3 core and scaffold-eth. We type-checked every changed file
before (ethers 5 types) and after (ethers 6 types), and counted only new errors on lines
the codemod changed.

Not yet migrated automatically: v6 API changes outside imports and BigNumber
(`_signTypedData`, `contract.address`, event filters), CommonJS `require('ethers')`, and
project-specific BigNumber extensions such as Aave's `rayMul`. The codemod leaves a
`TODO(ethers-codemod)` comment where it knows a human is needed.
