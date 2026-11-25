# Settlio

Settlio turns service quotes into wallet-funded bookings, with escrow on Base Sepolia and confirmation, expiry, eligible refunds and opted-in release automated by Reactive Lasna.

**Current position — 25 November 2026:** M1 is accepted; six scoped V4 M2 public journeys and user CLI reproductions are verified. Formal M2 acceptance remains open. The approved full interface is M3; final public release and submission are M4. The current deployment has consumed all **six immutable lifetime quote slots** and cannot create another quote. It remains available to inspect genuine historical outcomes. This is not a claim of mainnet readiness or continuous public booking availability.

Start with [current status](docs/CURRENT_STATUS.md). For a new chat or IDE, use the [continuation handoff and copyable start prompt](docs/HANDOFF.md). [SETTLIO_MASTER_PLAN.md](SETTLIO_MASTER_PLAN.md) remains the implementation source of truth. Full previous README content is retained in [README_HISTORY.md](README_HISTORY.md); old current-status paragraphs there are historical.

## Proven public outcomes

| Quote | V4 outcome | Evidence |
|---|---|---|
| 1 | ETH deposit, Reactive confirmation and automatic release | [Proof](deployments/evidence/v4/quote-1-release-verified.json) |
| 2 | USDC deposit, Reactive confirmation and automatic release | [Proof](deployments/evidence/v4/quote-2-release-verified.json) |
| 3 | Eligible cancellation and exact ETH refund | [Proof](deployments/evidence/v4/quote-3-refund-verified.json) |
| 4 | Eligible cancellation and exact USDC refund | [Proof](deployments/evidence/v4/quote-4-refund-verified.json) |
| 5 | Scheduled unpaid expiry | [Proof](deployments/evidence/v4/quote-5-expiry-verified.json) |
| 6 | Controlled owner pause, processed participant retry, restore and authenticated expiry | [Proof](deployments/evidence/v4/quote-6-recovery-verified.json) |

Public snapshots include genuine receipts and payload/state validation; user CLI reproductions are recorded separately. Local Anvil fixtures and adversarial tokens are isolated tests, never live protocol evidence. Browser-closure intervals, exact internal relayed-caller identification and unique return-report attribution have explicit limits. See [V4 acceptance](docs/V4_ACCEPTANCE.md) and [M2 source review](docs/M2_FINAL_REVIEW.md).

The last full regression checkpoint passed **245/245** with no failures/skips/cancellations. Contract/admission/web builds passed. The later expired-label correction had a fresh TypeScript/Vite build; no full rerun was claimed for that copy-only change. The approximately 540 kB minified bundle warning remains. This documentation checkpoint does not claim new code, build or test results.

## Deployment

| Contract | Address |
|---|---|
| Base Sepolia escrow | `0x5675C610d6f0aCe9f7933f3584D53dc4F567Dc6B` |
| Base Sepolia callback | `0x49ff0a4Bfa918b0576315C31a0bcE561eEBf3Df0` |
| Lasna Reactive | `0xFa1F509E21040bB4fE266B79E9583073914dFe6e` |
| Base Sepolia admission | `0x935Ef09F57B68D08fd9Fd315755b7Daf49871486` |

Base Sepolia chain ID: 84532. Lasna chain ID: 5318007. ETH and issuer Base Sepolia USDC are enabled; USDT is disabled as Coming soon. [Current status](docs/CURRENT_STATUS.md) includes the verified token address, immutable limits, known participants and dated fee observations. Existing M1/V3 contracts, links and proofs remain separate and preserved.

The six-quote limit is global lifetime admission, not just simultaneous capacity. Extra fee deposits or another wallet cannot reset it. Substantial prepaid reserves remained at the last observation; exhaustion must not be described as all REACT being spent. Further deployment preparation was cancelled by the user. No new deployment, funding, grant or public proof transaction is authorized by these instructions.

## Setup and local checks

Use the existing main checkout and inspect local changes first. Node.js >=22.18 and npm are specified. For a fresh checkout install lockfile dependencies and the pinned Reactive dependency:

```sh
npm ci
npm run setup:reactive
npm run build:contracts
npm run build:admission
npm run build:web
npm test
```

These commands compile and run local checks; they do not broadcast public transactions. Settlio code is [MIT licensed](LICENSE); prior dependencies keep their own licences. `setup-reactive.cjs` identifies the pinned Omni dependency. Do not put private keys in frontend `VITE_*` variables or commit local journals/credentials.

Run a new local frontend server only if needed:

```sh
VITE_ESCROW_ADDRESS=0x5675C610d6f0aCe9f7933f3584D53dc4F567Dc6B \\
VITE_BASE_SEPOLIA_RPC=https://base-sepolia-rpc.publicnode.com \\
VITE_LASNA_RPC=https://lasna-rpc.rnk.dev \\
npm run dev -- --port 5174 --strictPort
```

Open http://localhost:5174/. If that port is occupied, inspect the existing server instead of killing unrelated work. The exhausted deployment will correctly disable creation. Localhost is not a verified public hosting URL. Viewing existing quotes needs no signature.

Explicit archived replay, with no fresh RPC or public transaction:

```sh
npm run verify:release:v4 -- 1 --recorded
npm run verify:release:v4 -- 2 --recorded
npm run verify:refund:v4 -- 3 --recorded
npm run verify:refund:v4 -- 4 --recorded
npm run verify:expiry:v4 -- --recorded
npm run verify:recovery:v4 -- --recorded
```

These validate recorded public bundles, not current live observations. Earlier current-state verifiers may correctly reject their old counter checkpoint after later quotes. Never loosen validation or erase proof to hide that.

## Payment and product boundaries

A merchant specifies each accepted asset's exact total/deposit; there is no automatic exchange rate. The designated customer's first successful deposit locks its asset/option. Approval alone does not pay. Service terms, wallets, timestamps, amounts/options and release consent are fingerprint-bound. Missing/mismatched terms disable payment. Share-link terms are readable to anyone with the link; avoid confidential data.

Destination block timestamps and current escrow state govern payment/cancellation/payout. Timely cancellation reserves the full deposited asset; delayed/repeated callbacks cannot legitimately use it for merchant release. Automation fees are separate from customer liabilities. A release is not proof of service delivery, and remaining-balance collection is not enabled. No exact execution latency or perpetual funding guarantee is made.

The current list/form/quote interface is a working part of the product, not the finished six-screen UI. Preserve green/orange, Georgia/Inter, the approved hierarchy and professional-scene hero requirements. The next no-spend task is an operating-model proposal; no new contract policy, public spending or M3 start is silently approved by this handoff.

## Documentation

| Document | Purpose |
|---|---|
| [Current status](docs/CURRENT_STATUS.md) | Concise verified/pending state, addresses and latest user constraints |
| [Handoff](docs/HANDOFF.md) | New-chat/Antigravity start prompt, safe commands and next task |
| [Master plan](SETTLIO_MASTER_PLAN.md) | Approved implementation scope and milestone boundaries |
| [M1 acceptance](docs/M1_ACCEPTANCE.md) | Accepted original engineering scope and evidence limits |
| [V4 acceptance](docs/V4_ACCEPTANCE.md) | Current M2 V4 checklist |
| [M2 historical ledger](docs/M2_ACCEPTANCE.md) | Prior V3/V4 acceptance history, failures and later corrections |
| [Progress](docs/PROGRESS.md) | Current summary plus preserved chronological record |
| [On-chain evidence](ONCHAIN-EVIDENCE.md) | Historical addresses and decoded public trails |
| [Historical README](README_HISTORY.md) | Previous long-form README, preserved as history |

Submission requires the public repository, deployed addresses, real full-loop evidence and a public video strictly under three minutes. It is not marked complete. The current 70/100 assessment is a subjective equally weighted review, not an award prediction or percent-finished metric.
