# Settlio current status

## V5 reader incremental checkpointing verified locally — 25 November 2026

[`renewable-reader.cjs`](../script/renewable-reader.cjs) now supports `settlio-renewable-checkpoint/v1` incremental resumption (`checkpoint` / `previousCheckpoint`) with `checkpointHash` integrity binding and live canonical block-hash checks on resume. Targeted `node --test test/renewable-reader.test.cjs test/renewable-commitments.test.cjs` passed **20/20** (175.70s); no new full `npm test` run, public transaction, or token spend is claimed. `canGrant` remains `false` and M2 remains OPEN. Earlier entries below are historical checkpoints.

## V5 reader finalized-skew hardening verified locally — 25 November 2026

[`renewable-reader.cjs`](../script/renewable-reader.cjs) now queries `finalized` before `latest` per chain with at most one `latest` re-fetch on transient `finalized > latest` skew, failing closed if skew persists. Targeted `node --test test/renewable-reader.test.cjs test/renewable-commitments.test.cjs` passed **19/19** (144.48s) using pinned `npm ci` + `npm run setup:reactive`; no new full `npm test` run, public transaction, or token spend is claimed. `canGrant` remains `false` and M2 remains OPEN. Earlier entries below are historical checkpoints.

## V5 readiness review and M2 gates consolidated — 25 November 2026

[V5 readiness review](V5_READINESS_REVIEW.md) and [candidate operating profile & reader spec](V5_OPERATING_PROFILE_SPEC.md) map V4 public evidence, local-only V5 verification (`canGrant: false`), live **read-only** Base/Lasna compatibility observations (22:09 UTC: `Cron1000`/`Cron10000` indexed-`uint256` layouts confirmed, `finalized` supported with 1-block Lasna skew risk, `PROXY`/`SYSTEM` runtime hashes and fee parameters recorded, `rnk_getFilters` PascalCase `8,021` filters, sampled `getCallbacks` empty), and candidate 24h/7d profile, `finalized`-skew hardening, and incremental checkpointing specs. No tokens spent, no deployment authorized, and no new test/build run claimed (`node_modules` absent in this checkout). M2 remains OPEN. Earlier entries below are historical checkpoints.

## Read-only V5 reconciliation verified locally — 25 November 2026

[Reader acceptance](RENEWABLE_READER_ACCEPTANCE.md): runtime/constructor/wiring checks, pinned fee resources, finalized contiguous history, subscription checks and protocol-report/delivery reconciliation now feed the local commitment guard. Missing reports/backlog retain holds; unknown outside grants stop reconciliation. Full regression passed 313/313; after adding multi-callback ordinal coverage, expanded reader/accounting checks passed 19/19. No full 314-test run is claimed. Two isolated local chains and an explicit protocol fixture provide test evidence only. The reader remains canGrant: false; no public V5 compatibility, economic profile approval, funding, grant or deployment is claimed. M2 remains OPEN. Next: consolidate V5 readiness and remaining M2 gates without spending, requesting tokens or repeating the six verified V4 journeys. Earlier entries below are historical checkpoints.

## Local fee commitment accounting verified — 25 November 2026

[Commitment acceptance](RENEWABLE_COMMITMENT_ACCEPTANCE.md): independent source/destination allowances now remain reserved across grant/admission/terminal states until reconciled settlement. Revisioned atomic journals and exclusive locks prevent competing writers from promising the same local backing. Final targeted checks: 18/18 passed (14 new accounting cases plus four cost-review cases), including a two-process race and normal npm inspection. Last full suite remains 295/295; no new full-suite/build/public-funding claim. This is a local sponsor guard using attested inputs, not on-chain monetary enforcement or independently verified balances; canGrant remains false. No production journal, grant, transaction or contract change. M2 remains OPEN. Next: verified read-only snapshot/event reconciliation against the local V5 stack; no spending or deployment authorized.

## Local adaptive timer verified — 25 November 2026

[Timer acceptance](RENEWABLE_TIMER_ACCEPTANCE.md): V5 uses an earliest-deadline heap and explicit opt-in coarse/medium/fast CRON tiers; fast-only mode remains available. Final `npm test`: 295/295 passed, zero failures/skips/cancellations; all four renewable contracts compiled below EVM limits. A 128-item queue and exact timer switches were checked locally. Live coarse-event read attempt was unavailable; no public verification is claimed. Offline cost scenarios stay an explicitly labelled always-fast baseline. V4, balances and public evidence are unchanged. M2 stays OPEN. Next: local fee-backed commitment accounting; live timer/profile and deployment decisions remain separate, with no spending authorized.

## Offline renewable funding review — 25 November 2026

[Cost and duration review](RENEWABLE_COST_REVIEW.md) and its reproducible report inventory 48 archived receipts and explicitly separate transaction-envelope amounts from unknown application service charges. Timer-only scenarios compare 15 minutes/day/week using stale recorded price/cadence, not funding recommendations. New offline-tool tests passed 4/4; normal npm output matches the saved report; all nine inputs match current repository blobs. No new full-suite claim (last full: 287/287), blockchain RPC, contract change or spending. Funding readiness is NOT established; M2 remains OPEN. Next: local timer/profile optimization and commitment accounting before any renewable funding/admission decision. Deployment preparation remains cancelled.

## Authenticated V5 closure protocol — 25 November 2026

[Closure acceptance](RENEWABLE_CLOSURE_ACCEPTANCE.md): actual V5 receiver and Reactive closure path are implemented locally with proxy/source/domain/epoch/profile checks, terminal tombstones and finite recovery. Accepted acknowledgement requests leave autonomous source work; Base keeps backing reserved until actual delivery. Final `npm test`: 287/287 passed, zero failures/skips/cancellations; `npm run build:renewable` passed for all four contracts. These are isolated local fixtures, not new public integration evidence. No V4/public deployment, funding or frontend change. M2 remains OPEN. Next: read-only renewable fee/admission reconciliation and horizon review, including acknowledgement costs; no token spend or deployment preparation authorized.

## Local renewable escrow integration — 25 November 2026

[Escrow acceptance](RENEWABLE_ESCROW_ACCEPTANCE.md): separate V5 escrow now consumes ledger grants atomically and closes active capacity only with successful terminal transitions. Refund claims bypass closed admission/retry exhaustion; missing source acknowledgement retains work capacity, not customer principal. Final `npm test`: 272/272 passed, zero failures/skips/cancellations; new ledger/escrow compilation and size checks passed. These are isolated local checks, not new public evidence. V4 source/deployment, web ABI and six proofs remain unchanged. M2 stays open. Next: authenticated versioned receiver and source closure with bounded acknowledgement recovery; economics and production settings remain pending. No deployment or spending authorized.

## Standalone renewable ledger implemented — 25 November 2026

User authorized the next local implementation step. [Ledger acceptance](RENEWABLE_LEDGER_ACCEPTANCE.md): renewable finite grants, separate active/unsettled work, idempotent two-sided settlement, epoch/profile binding and retained replay records. Combined new-ledger/existing-admission tests passed 10/10; Solidity 0.8.29 compilation passed (4,751-byte runtime). These are local fixture checks only. No public operation or V4 change. Escrow/source/receiver integration and economics remain pending; M2 stays open. Next: local escrow integration with atomic principal-safety tests.

## Renewable admission planning — 25 November 2026

The user's continuation approves the operating-model direction for implementation planning: renewable finite sponsorship and bounded unsettled cross-chain work. [Implementation plan](RENEWABLE_ADMISSION_PLAN.md) defines components, invariants, failures and acceptance tests. This does not approve numeric production settings, public operations or deployment. Current V4 and its six proofs remain unchanged; M2 remains open. Planning checks only; no new test/build result.

## Operating-model proposal prepared — 25 November 2026

[Ongoing admission and funding proposal](OPERATING_MODEL_PROPOSAL.md) is ready for review. Recommended direction: renewable sponsored finite batches with bounded unsettled cross-chain work; no permanent six-booking product cap. This is proposed design only. Exact quotas, duration profiles and pricing remain undecided; no contracts, operating commands or deployment permissions changed. M2 remains open and replacement deployment preparation remains cancelled. Next: user policy review before implementation.

Updated 25 November 2026 (Africa/Lagos). Reviewed code/evidence baseline: [73dc15b](https://github.com/0xaje/Settlio/commit/73dc15b8d1fa5fd62b9131a7f131d2aa04264fd6). This is a concise status index; [the master plan](../SETTLIO_MASTER_PLAN.md) remains the implementation source of truth. Dated logs below old “current status” headings are historical, not newer results.

## Milestones

| Milestone | Current position | Next acceptance action |
|---|---|---|
| M0 foundation | COMPLETE | Preserve policies, licence and dependencies |
| M1 quote/deposit/Reactive confirmation and recovery | COMPLETE for accepted engineering scope | Preserve [M1 acceptance](M1_ACCEPTANCE.md) and its limits |
| M2 scheduled policies | Six scoped V4 public journeys and user CLI reproductions verified; formal M2 acceptance remains OPEN | Resolve ongoing admission/funding policy and explicitly retain/decide original unattended browser-evidence qualifications; do not repeat successful journeys merely for another video |
| M3 approved full interface | NOT STARTED as a completed milestone; existing working UI is partial implementation | Complete six approved surfaces only after M2 scope/acceptance is settled |
| M4 release/submission | PENDING | Public application availability, final review and public video strictly under three minutes |

M3/M4 work must not be described as a failed M2 contract test. M2 is not silently closed or its original acceptance conditions waived by this summary.

## What is proven

| V4 quote | Genuine public outcome | Archived proof |
|---|---|---|
| 1 | ETH deposit, Reactive confirmation, automatic release | [Bundle](../deployments/evidence/v4/quote-1-release-verified.json) |
| 2 | USDC deposit, Reactive confirmation, automatic release | [Bundle](../deployments/evidence/v4/quote-2-release-verified.json) |
| 3 | Eligible cancellation and exact ETH refund | [Bundle](../deployments/evidence/v4/quote-3-refund-verified.json) |
| 4 | Eligible cancellation and exact USDC refund | [Bundle](../deployments/evidence/v4/quote-4-refund-verified.json) |
| 5 | Unpaid quote, authenticated scheduled expiry | [Bundle](../deployments/evidence/v4/quote-5-expiry-verified.json) |
| 6 | Owner pause, processed participant retry while paused, restore, real CRON/request/authenticated expiry and closure | [Bundle](../deployments/evidence/v4/quote-6-recovery-verified.json) |

All six complete public verifiers were also reproduced successfully from the user's Ubuntu terminal. [Current V4 acceptance](V4_ACCEPTANCE.md) links the journey records. [Final source review](M2_FINAL_REVIEW.md) separates source/local negative-path tests from genuine public successes. No mock activity or isolated fixture is public protocol evidence.

The last full regression run passed **245/245**, zero failures/skips/cancellations, in checkpoint [4038b52](https://github.com/0xaje/Settlio/commit/4038b524b8a4216f1c87e0371347f30a371945a4). Contract, admission and web builds passed there. The later wording-only correction in [73dc15b](https://github.com/0xaje/Settlio/commit/73dc15b8d1fa5fd62b9131a7f131d2aa04264fd6) had a fresh TypeScript/Vite build; a new full suite was not claimed for that label change. The approximately 540 kB minified bundle warning remains. This documentation/handoff checkpoint does not claim a new test or build run.

## Current deployment and limits

| Item | Value |
|---|---|
| Base Sepolia chain ID | 84532 |
| Reactive Lasna chain ID | 5318007 |
| V4 escrow | `0x5675C610d6f0aCe9f7933f3584D53dc4F567Dc6B` |
| V4 callback receiver | `0x49ff0a4Bfa918b0576315C31a0bcE561eEBf3Df0` |
| V4 Reactive contract | `0xFa1F509E21040bB4fE266B79E9583073914dFe6e` |
| V4 admission | `0x935Ef09F57B68D08fd9Fd315755b7Daf49871486` |
| Sponsor/merchant | `0xbf6301D7bca9F23A63A2d1Ed513d5120Dbb2288E` |
| Known test customer | `0xe84A1B8C20b1E33Fc1D6dD4650Af53783F2911eD` |
| Issuer Base Sepolia USDC | `0x036CbD53842c5426634e7929541eC2318f3dCF7e`, six decimals |
| Enabled assets | Native test ETH and issuer USDC; USDT disabled/deferred |
| Immutable admission settings | Six active/reserved slots, **six lifetime admissions**, 900-second horizon, one shared participant retry, 60-second retry cooldown |

**All six lifetime admissions are consumed.** Closing a booking frees active capacity, not lifetime capacity. Another wallet, more fee tokens or another grant cannot create quote 7. The source/receiver/admission are not exposed as an upgrade/reset mechanism. The configuration is bounded verification policy, not an approved permanent public-service policy.

A read-only observation at **2026-11-25T15:53:38.420Z (16:53 WAT)** found 248.1593678 prepaid test REACT, 0.1 test REACT contract balance, zero source debt and zero active jobs; admitted/maxLifetime was 6/6. Callback prepaid reserves were 0.001215459752 test ETH plus 0.001 contract balance, with zero callback debt. These are dated observations, not fresh balances or a guarantee. No claim that all 249 deposited reserve REACT was consumed is justified. Official [economy documentation](https://dev.reactive.network/economy) describes reserves as fee credit; do not assume a refund or automatic migration to another deployment.

## Decisions and constraints from the user

- Work continues here; Antigravity/new-chat handoff is a backup, not a restart.
- Further deployment preparation was **CANCELLED**. No replacement deployment, new funding, new grant or public test transaction is currently authorized.
- Test tokens are difficult for the user to obtain. Stop repeated successful live tests and do not ask for another deposit merely to continue documentation, cost analysis or UI work.
- The wallet-extension conflict is **FIXED AS REPORTED BY THE USER** after the last recording. An independent clean-console recheck was not supplied. Do not keep presenting it as an unresolved contract failure or repeatedly ask the same question.
- Scores are self-assessment, not external judging: Execution 20/25, Integration 20/25, Usefulness 15/25, Craft 15/25 = **70/100**, not a percentage-complete claim.

## Evidence qualifications

Public receipt/payload checks prove the recorded automation. Some browser closure/reopening evidence is qualified; uninterrupted closed intervals and every original both-session-closed visual condition are not fully established. Quote-6 recovery is controlled owner pause/retry/restore, not an untouched unattended run or evidence of a protocol outage. Unique protocol return-report attribution is not claimed. Creation/retry may have relayed envelopes; exact internal retry caller is not traced.

Desktop exhausted-capacity and terminal quote displays were observed. Chrome **390 × 644 emulation** showed readable cards, wrapped/stacked quote sections and no payment/retry controls for the expired quote. That is not a physical-mobile wallet/payment test or proof of all browser compatibility. Copy-link visibility was observed; clipboard success was not demonstrated. Share-link storage-denial repair has code/test/build evidence. Expired summary wording was corrected to “Deposit amount”; post-correction visual confirmation is not separately recorded.

## Approved design and remaining work

The current form/list/details interface is functional engineering UI, not the final agreed product. Preserve six surfaces: Landing, Dashboard, Create Quote, Quote Details, Booking Confirmed, Automation Rules. Use green/orange, Georgia headings and Inter interface text. Landing headline: “Turn quotes into confirmed bookings”. Rotate photographer, baker, tailor and event-decorator scenes with labelled illustrative outcomes, gentle fades, pause/manual controls, reduced-motion support and mobile cropping checks. Old navy/yellow/Archivo baseline material is superseded.

Next: [write a no-spend operating-model proposal](HANDOFF.md#next-task) addressing renewable admission, concurrent work, realistic quote horizons, fee responsibility, measured cost versus conservative reserve forecasts and a migration/availability decision. Do not implement or deploy that proposal silently. Preserve M2 acceptance limits explicitly. The full interface is M3; final hosted release and video are M4. USDT and optional messaging are not surprise M2 blockers.


## Handoff checkpoint validation — 25 November 2026

The six documented archived CLI commands were run successfully in explicit recorded/no-fresh-RPC mode: release quotes 1/2, refund quotes 3/4, expiry quote 5 and recovery quote 6. Outcomes were Released, Released, Refunded, Refunded, Expired and Expired. New README/current-status/handoff relative links were checked against repository paths; command names were checked against package.json. The complete previous README and M2 ledger text were preserved in their stated historical locations. No public RPC observation, transaction, build or new full regression run is claimed by these documentation checks.
