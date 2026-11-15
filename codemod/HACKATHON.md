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

## What we added during the hackathon (from `601893a`, 11 to 14 Nov 2026)

Each fix comes with tests, written to fail before the fix. Most were found by running the
codemod on a real ethers v5 codebase and type-checking the result against ethers 6.

| Change | Found on | Commit |
|---|---|---|
| Packaging: lockfile in sync, `npm run build` works, CLI runs | the repo itself | `601893a` |
| `toHexString()` keeps the `0x` prefix (`toBeHex`) | sample code | `cca5dcf` |
| Arithmetic operands become bigint (`2` → `2n`, `fee` → `BigInt(fee)`) | sample code | `dc35719` |
| `import { ethers } from 'ethers'` handled like `import * as ethers` | sample code | `557896d` |
| New transform: `await provider.getSigner()` (safe places only, the rest flagged) | sample code | `9ce98ff` |
| BigNumber chains and `pow` / `mod` / `shl` / `shr` / `isZero` / `abs` | Uniswap v3-periphery | `587c88a` |
| `BigNumber` type annotations → `bigint` | Uniswap v3-periphery | `6a3124b` |
| Destructured `constants.X` → bare names | Uniswap v3-periphery | `300897c` |
| New transform: `ethers/lib/*` and `@ethersproject/*` imports | Uniswap v3-periphery | `98d0128` |
| Function types stay valid when BigNumber types are rewritten | Aave v3 core | `beca236` |
| `.ts` files parsed with the `ts` parser (casts like `<any>x`) | Aave v3 core | `a63e4ae` |
| No duplicate `ethers` import next to hardhat's `ethers` | Aave v3 core | `b3b9fac` |
| New transform: `hexlify(number)` → `toBeHex` | scaffold-eth | `8d29bed` |
| `sendTransaction` renamed only on providers | Safe | `67e38b5` |
| v5 numeric constants treated as bigint | Uniswap v3-periphery | `ad3fb96` |
| `migrateDirectory()` API, used by the x402 engine | the engine | `c4caef1` |
| `package.json` bumped to `^6.13.0`, with warnings for packages that pin ethers v5 | ethers-v5-demo | `8ef7f99` |
| `parseEther` / `parseUnits` results tracked as bigint | ethers-v5-demo | `8ef7f99` |
| Untraced `.add` / `.sub` / `.mul` / `.div` get a TODO instead of being skipped | Uniswap v3-periphery | `88bb34a` |
| TODO count works on files with Windows line endings | Uniswap v3-periphery | `baa048a` |

Tests: **154 → 261**. Transforms: **8 → 11**.

Semantics were checked against the real libraries (ethers 5.8.0 and 6.17.0), not from
memory. That is how we found, for example, that v5 `mod` never returns a negative while
`%` does, so `.mod()` is converted with a TODO rather than silently.

## How we checked it

We ran the codemod on Uniswap v3-periphery, Safe (v1.3.0 and current `main`, which is
already on ethers 6), Aave v3 core and scaffold-eth. We type-checked every changed file
before (ethers 5 types) and after (ethers 6 types), and counted only new errors on lines
the codemod changed.

On 14 Nov we ran it again on Uniswap v3-periphery through `migrateDirectory()`: 41 source
files scanned, 28 changed plus `package.json`, no crashes, and 95 TODO comments left for a
human. Before the flag rule, the same run reported none, although about 90 untraced
BigNumber calls were left behind.

Not yet migrated automatically: v6 API changes outside imports and BigNumber
(`_signTypedData`, `contract.address`, event filters), CommonJS `require('ethers')`, and
project-specific BigNumber extensions such as Aave's `rayMul`. The codemod leaves a
`TODO(ethers-codemod)` comment where it knows a human is needed.

Other limits:

- Arithmetic on values the codemod can't trace is flagged, not converted.
- Files that never import `BigNumber`, the `ethers` namespace or `constants` get no
  arithmetic flags.
- Only the root `package.json` is updated.
- Hardhat and Waffle plugins pin ethers v5. The PR warns about it.