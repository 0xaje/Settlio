# Settlio current status

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
