# M1 completion and acceptance record

Status: **COMPLETED for the defined engineering scope — 23 November 2026 (WAT).**
Milestone: merchant quote -> authorised ETH/USDC deposit -> Reactive -> authenticated booking confirmation, with protected custody and receipt recovery.
Acceptance recorded after the recovery implementation in commits [2171da7](https://github.com/0xaje/Settlio/commit/2171da767787966d01d50f5a54fe79fd9b493888), [50c4840](https://github.com/0xaje/Settlio/commit/50c48403bd7472110e0151a748394fbe871c30fe) and [0f0dd10](https://github.com/0xaje/Settlio/commit/0f0dd100b8e2496b79759b359b8cea793c1f5b9e).

## Completion checklist

| Requirement | Status | Evidence and limits |
|---|---|---|
| Merchant creates quote with designated customer, exact amounts and timestamp deadlines | COMPLETE | [Escrow](../packages/contracts/src/SettlioEscrow.sol), [terms checks](../test/terms.test.mjs), genuine creation journeys; Quote 7 browser evidence below |
| All offered asset/amount options bound to immutable accepted terms | COMPLETE | [Terms tests](../test/terms.test.mjs), [asset tests](../test/assets.test.cjs); no implicit exchange rate |
| ETH deposit and automatic booking confirmation | COMPLETE — LIVE | [Quote 1 snapshot](../deployments/evidence/quote-1.json), [decoded trail](../ONCHAIN-EVIDENCE.md) |
| USDC exact approval, deposit and automatic confirmation | COMPLETE — LIVE | [Quote 2 snapshot](../deployments/evidence/quote-2.json), approval/Transfer/deposit/callback evidence in [decoded trail](../ONCHAIN-EVIDENCE.md) |
| Wrong payer/amount/terms, duplicate payments and exact expiry boundary rejected | COMPLETE — LOCAL VERIFICATION | [Escrow tests](../test/escrow.test.cjs), [asset tests](../test/assets.test.cjs); these are not fabricated live rejection transactions |
| Subscriber authenticates protocol caller and filters/deduplicates origin events | COMPLETE — LOCAL + LIVE LOOP | [Reactive tests](../test/reactive.test.cjs), public ETH/USDC trails |
| Callback authenticates proxy and authorised Reactive sender | COMPLETE — LOCAL + LIVE LOOP | [Callback contract](../packages/contracts/src/SettlioCallback.sol), reactive tests and public trails |
| Separate customer liabilities and automation funding | COMPLETE for M1 | Per-asset contract tests; user WSL live health report below |
| Confirmation retry emits a fresh event; failed request does not permanently consume dedup state | COMPLETE — LOCAL VERIFICATION | [Reactive tests](../test/reactive.test.cjs); no claim of an additional public retry trail |
| Initial merchant/customer journeys and targeted mobile corrections | COMPLETE for M1 | User accepted targeted responsive fixes; final design, physical-device/extension matrix remain M3/M4 |
| Deadline-passed wording consistent in list/mobile cards/detail | COMPLETE — SOURCE/BUILD | Shared timestamp-aware label in [frontend](../apps/web/src/main.tsx); no scheduled expiry transition is implied |
| Manual receipt recovery restores original matching service terms | COMPLETE — USER BROWSER | Corrected unpaid Quote 6; user supplied successful recovery notice |
| Original new-creation pause -> refresh -> saved-hash recovery | COMPLETE — USER BROWSER | Quote 7 recording and follow-up screenshot below; no second submission reported |
| Pending receipt survives RPC/storage-process restart | COMPLETE — LOCAL INTEGRATION | [Persistent local EVM test](../test/pending-integration.test.cjs), real isolated transaction and separate persistent Web Storage processes |
| Malformed/mismatched saved terms retain hash; correct terms recover without duplication | COMPLETE — LOCAL INTEGRATION | Same test invokes [recovery coordinator used by React](../apps/web/src/pending.ts); no separate browser error-screen pass claimed |
| Builds and regression suite | COMPLETE | Three contracts compile; TypeScript/Vite build passes; 46 local tests pass. Latest recovery coordinator and expanded test included |

## Public payment evidence

These are historical, genuine public-testnet transactions. Both full trails were independently verified earlier and successfully reverified by the user's WSL verifier on 23 November. No new payment was sent for revalidation.

| Asset | Origin deposit | Reactive processing | Destination callback |
|---|---|---|---|
| ETH | [0x2c2292…970b9a](https://sepolia.basescan.org/tx/0x2c2292c4be6674774a69106c8f516a16409c8c0561b92c718e2024f6dd970b9a) | [0x40c0f7…da2f8](https://lasna.reactscan.net/tx/0x40c0f7778a403667cff17a25d1c21dc1a1e01644cb16384afa54f3ba48cda2f8) | [0x676944…636a](https://sepolia.basescan.org/tx/0x676944ba23ce0dd5983f1ee529178a0367ef986f30be5f9cd26c840379ef636a) |
| USDC | [0x1b410e…f290f](https://sepolia.basescan.org/tx/0x1b410e4e98859bc8bce93bbe7a9beb93b5ac3bc67c25ececeed2b77ba75f290f) | [0x187fc2…ad6d5](https://lasna.reactscan.net/tx/0x187fc2615773c9725f7d1a7882709a21a1f16102b6bf0cfadba3fd271eaad6d5) | [0xb66ec4…44b6](https://sepolia.basescan.org/tx/0xb66ec4bc2398038d7f5a9b90746a419e00d43b2ed67fe2ccf551c215edb844b6) |

Base Sepolia escrow: [0xfD09cf3bfd3aD13a03Cfb499ec18D97d79748c83](https://sepolia.basescan.org/address/0xfD09cf3bfd3aD13a03Cfb499ec18D97d79748c83).
Lasna subscriber: [0xd106C554567470b5a8a0894b3A210D175d4fD7BA](https://lasna.reactscan.net/address/0xd106C554567470b5a8a0894b3A210D175d4fD7BA).
Base callback receiver: [0xAa6126962C923F242ffd01A6736B8d34b310Bfe5](https://sepolia.basescan.org/address/0xAa6126962C923F242ffd01A6736B8d34b310Bfe5).

Committed JSON snapshot timestamps remain their original 19 November UTC values. Fresh 23 November verifier success is supported by user terminal output in the conversation and [progress record](PROGRESS.md); refreshed user-local JSON files were not fetched/published. Do not silently change verification dates.

## Original creation recovery evidence

User-provided creation hash: [0x0f6bd02457428fdbd321608ec66d7eccdfb2cb1b7f1e6c409076ecfb0f1fcc71](https://sepolia.basescan.org/tx/0x0f6bd02457428fdbd321608ec66d7eccdfb2cb1b7f1e6c409076ecfb0f1fcc71). Hash-to-quote linkage is user/browser evidence here, not a fresh assistant RPC receipt verification.

The 30.43-second user recording named 20261123-0938-24.0269241.mp4 shows actual creation from the development pause URL, followed by the saved-hash banner and Step 1 complete. The follow-up image(20261123-094339).png shows Quote 7 recovered from its successful creation receipt, matching terms and no new transaction sent. Dates shown: payment November 27, 2026 18:00 WAT; refund cutoff November 28, 2026 18:00 WAT. Deposit 0.0001 test ETH; total 0.0003.

Media were reviewed in the conversation; they are not committed public assets or the submission video. The refresh step was user-performed, not independently captured as a continuous automated trace. The chain may already have confirmed before client receipt processing; this check does not claim an unmined transaction throughout refresh. Quote remains unpaid. Earlier staged-receipt checks are not substituted for this original-creation evidence.

## WSL live health observation — 23 November

User-provided read-only report: wiringVerified true; quoteCount 6 at that observation (before the later creation); ETH balance and liability both 100000000000000 wei; USDC balance and liability both 1000000 units. Reactive debt 0, reserves 0, balance 69717400000000000; callback debt 0, reserves 0, balance 998767555600000; both needsAttention false. Preflight passed supported network/protocol identity and issuer-listed USDC code/metadata. Point-in-time observations do not guarantee future funding or delivery.

## Reproduce checks

From the checkout with the local public deployment journal:

```sh
npm run build:contracts
npm run build:web
npm test
npm run preflight
npm run healthcheck
npm run verify:quote -- 1 0x2c2292c4be6674774a69106c8f516a16409c8c0561b92c718e2024f6dd970b9a 0x40c0f7778a403667cff17a25d1c21dc1a1e01644cb16384afa54f3ba48cda2f8 0x676944ba23ce0dd5983f1ee529178a0367ef986f30be5f9cd26c840379ef636a
npm run verify:quote -- 2 0x1b410e4e98859bc8bce93bbe7a9beb93b5ac3bc67c25ececeed2b77ba75f290f 0x187fc2615773c9725f7d1a7882709a21a1f16102b6bf0cfadba3fd271eaad6d5 0xb66ec4bc2398038d7f5a9b90746a419e00d43b2ed67fe2ccf551c215edb844b6
```

No key or transaction broadcast is used by preflight, healthcheck or evidence verification. Local tests create isolated accounts/transactions, not public activity.

## Not completed by M1

- M2: unattended scheduled expiry, real cancellation/refund routing and approved automatic release; no live refund/expiry/release proof yet.
- M3: final six-surface design and rotating professional hero; full accessibility/motion/mobile journey verification.
- M4: release review, exhaustive chosen browser/wallet matrix, public hosted demo and public video strictly under three minutes.
- USDT: Coming soon; no enabled address/payment or availability date.
- Optional messaging: not implemented.
- Customer demand validation: pending; no adoption, satisfaction or winning-score claim.
- No independent security-audit or zero-defect guarantee. Existing >500kB frontend bundle warning remains.

## Judging assessment

Execution: genuine ETH/USDC full loops demonstrated. Integration: authentication and event/callback plumbing proven; stronger unattended utility is M2. Usefulness: quote/deposit workflow implemented, demand still unvalidated. Craft: passing builds/tests and evidenced recovery, with coverage limits above. No invented numerical score.

## Documentation inventory and completion rule

There are now six Markdown documents: README.md, AGENTS.md, SETTLIO_MASTER_PLAN.md, ONCHAIN-EVIDENCE.md, docs/PROGRESS.md and this file. LICENSE is a separate seventh human-readable policy/legal file. Two committed JSON evidence snapshots supplement them.

For each subsequent milestone: mark every accepted requirement complete with source/test/transaction/evidence links, date, execution environment and limits; leave failed/blocked/unverified items open; reconcile current README/master/evidence status; preserve historical logs as history; never mark the whole product complete when only a milestone is accepted.
