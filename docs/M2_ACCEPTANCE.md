# M2 unattended policies — acceptance ledger

Status: **IN PROGRESS / LIVE CRON GATE BLOCKED / NOT ACCEPTED**, started 23 November 2026.
M1 remains complete under [its acceptance record](M1_ACCEPTANCE.md). M2 source is not deployed; the existing M1 contracts, quote links and principal are unchanged.

## Acceptance conditions and current results

| Area | Status | Evidence / remaining gate |
|---|---|---|
| Explicit immutable automatic-release opt-in | COMPLETE — LOCAL CODE/TEST | [Escrow](../packages/contracts/src/SettlioEscrow.sol): createQuoteWithPolicy, automaticRelease getter, PolicyRegistered event. Existing creation entry points default to manual release |
| Authenticated destination policy callback | COMPLETE — LOCAL CODE/TEST | [Receiver](../packages/contracts/src/SettlioCallback.sol): proxy and authorised Reactive sender guards; direct/wrong-sender calls rejected in [policy tests](../test/policy.test.cjs) |
| Authoritative destination timestamps/state | COMPLETE — LOCAL CODE/TEST | Early expiry/payout is harmless; payment rejected at expiry; exact cutoff allows eligible release |
| Cancellation reservation takes priority | COMPLETE — LOCAL CODE/TEST | Eligible cancellation remains refundable after cutoff and cannot pay merchant |
| Same-asset transfers, duplicate safety and failed-transfer rollback | COMPLETE — LOCAL CODE/TEST | Native automatic payout once, token refund/payout once; real mined failed token callback transactions retain state and liability, then succeed on retry. Existing asset/refund tests also pass |
| Participant policy retry signal | COMPLETE — LOCAL CODE/TEST | requestPolicy rejects nonparticipants and terminal states; no live retry trail yet |
| CRON scheduler and bounded work queue | COMPLETE — LOCAL CODE/TEST; LIVE PENDING | [Scheduler](../packages/contracts/src/SettlioReactive.sol), [scheduler tests](../test/scheduler.test.cjs): eight scans/two requests per tick; actual Lasna CRON still unverified |
| Out-of-order events, acknowledgements, retry/backoff and idle pause | COMPLETE — LOCAL CODE/TEST; LIVE PENDING | Cancellation/confirmation flags persist, terminal states cannot reopen, six unanswered attempts then attention; pause/idle unsubscribe. Live cost/debt/admission review still pending |
| Policy-bound terms and merchant/customer interface | IMPLEMENTED — LOCAL CHECKS PASS; BROWSER/LIVE PENDING | Version 3 binds the automatic-release flag; legacy fingerprints unchanged; UI reads recorded policy. Explicit-consent payment API blocks legacy automatic-policy bypass. New browser journeys still need verification |
| Versioned deployment journal, preflight/health/evidence tooling | COMMANDS IMPLEMENTED / LOCAL CHECKS PASS; LIVE AND POLICY EVIDENCE PENDING | Separate M2 journal, preflight/plan/deploy/verify commands and namespaced confirmation evidence. Scheduled-policy verifier and live observations remain open |
| Live scheduled expiry, ETH/USDC refunds and automatic release | PENDING — RELEASE BLOCKER | Genuine CRON/origin -> Reactive -> authenticated Base callback traces, balances/state and browser-closed execution required |
| Complete journeys, failure/recovery, documentation and review | PENDING | M2 cannot close until every required live/local gate is satisfied |

## Implemented destination rules

processPolicy authenticates its caller via the immutable receiver. Reserved refund first; otherwise unpaid expiry, received-deposit confirmation, or explicitly enabled confirmed-deposit release at cutoff. Destination state/timestamp checks make repeated/stale calls safe. PolicyChecked reports resulting state; it does not by itself prove scheduler acknowledgement.

Existing manual release stays merchant-only. An opt-in can only be set at creation; there is no switch that can change an existing quote's policy. Reaching refundCutoff establishes agreed payout eligibility, not proof of service delivery. Automation funding remains outside principal.

## Verification on 23 November

- Initial focused run failed because the first edit omitted the option-creation policy assignment/event. Corrected before commit.
- Focused policy suite: 7 passing checks (parent plus six cases).
- Expanded full suite: **69 passed, zero failures/skips/cancellations**, including existing 46 M1 checks.
- All three contracts compile using Solidity 0.8.29. TypeScript/production frontend build passes. Existing >500kB bundle warning remains.
- Protocol proxy/token fixtures are isolated local test contracts. No public callback, CRON delivery, official USDC transfer, deployment or user payment is claimed by these tests.
- Current official [Reactive contracts](https://dev.reactive.network/reactive-contracts) and [callback authentication](https://dev.reactive.network/callback-contracts) docs rechecked. CRON support is documented, not yet observed live for Settlio.
- No public transaction sent, no quote migrated, no funds moved. Existing frontend continues to use the unchanged M1 deployment and does not offer automatic release.

## Judging review

Execution: destination logic has passing local execution; M2 public-network proof pending.
Integration: scheduler and genuine unattended callbacks still pending.
Usefulness: approved deposit policy has clear behaviour; no customer-demand claim.
Craft: tested permission/timing/failure boundaries and transparent incomplete ledger; no overall score claimed.

Next: version deployment/evidence tooling, verify legacy and new policy browser journeys and verify real unattended network loops. Stay in M2 until live acceptance; do not begin M3 merely because local checks pass.


## Scheduler verification update — 23 November
CRON100 is authenticated against Reactive chain ID, legacy emitter address, topic and log shape. Ten precise origin subscriptions track policy registration, participant retry, cancellation, confirmation and destination completion in addition to deposit confirmation routes. Runnable jobs enable CRON; idle/paused jobs unsubscribe. Each tick scans at most eight and requests at most two callbacks; backoff uses timestamps (60 seconds times attempt). Six unanswered attempts set needsAttention and stop that job's automatic retry; participant request can reconstruct registration and requeue immediately. Destination checks remain authoritative under clock skew and delayed/out-of-order events.

The scheduler test suite includes real isolated expiry, native automatic payout, and late cancellation/refund transactions with protocol forwarding and explicit test CRON records. It proves local code wiring, not public delivery. Original M1 regression tests now expect ten subscriptions only for newly compiled fixture deployments; the old public M1 subscriber remains unchanged.

Final 64-test run passed after the retry-timing correction. The contract build passed after it; the frontend build passed before that final internal-only correction, with no ABI or frontend change afterward. No new public transaction, network proof or deployment. Active jobs still incur tick fees; retries/idle unsubscribe do not establish production-scale admission economics or permanent funding. Those operational/live checks remain open.


## Policy interface and explicit payment consent — 23 November
Version 3 share terms now include automaticRelease; versions 1/2 golden fingerprints remain unchanged. [Policy guards](../apps/web/src/policy.ts) distinguish a deterministic legacy empty revert from unknown RPC/unsupported-version errors and validate chain IDs and immutable wiring. [Frontend](../apps/web/src/main.tsx) creates/reads policy quotes, discloses default-off opt-in, eligibility and device timezone, and connects cancellation/claim/retry controls only on policy-capable deployments. [Read adapters](../apps/web/src/chain.ts) query actual scheduler/funding states; failure remains unknown. Fee balance presence is not an execution guarantee.

Automatic-policy deposits require payDepositWithPolicy and matching explicit consent; old deposit entry points reject these quotes. The [local policy UI/contract tests](../test/policy-ui.test.mjs) verify version/wiring failures and genuine isolated quote/payment consent; [terms tests](../test/terms.test.mjs) verify compatibility and policy mismatches. Final contracts/TypeScript/frontend build and 69 local tests pass. No new live or browser UI evidence. Snapshot/media evidence from M1 does not validate these new screens. New deployment/versioned journal and operational browser/live proof remain mandatory before M2 acceptance.


## M2 deployment intent safety — 23 November 2026
Added [deployment-state helpers](../script/m2-state.cjs) and [five focused checks](../test/m2-state.test.cjs). A separate testnet-m2.json journal validates policy/network version, deployer, source fingerprints and constructor funding; saves public unsigned intent/hash before broadcast; resumes the identical signed transaction; refuses nonce conflicts and preserves reverted receipts without a replacement. M1 journal filenames are rejected. Keys and raw signed transactions are not persisted. Exact active subscription parsing rejects missing/wrong-chain/source/scheduler filters and unexpected schemas.

Final full local suite: **74 passed, zero failures/skips/cancellations**. Interruption, occupied-nonce and reverted-creation checks use real isolated Anvil transactions; subscription-index responses are test fixtures. These are not public Reactive evidence. No contract/frontend source changed in this slice; no additional build pass claimed.

This completes the local deployment-state component only. It is not wired into a runnable M2 deployment command yet. Read-only network/CRON checks, source/runtime verification, deployment CLI, M2 evidence namespaces and live policy trace verification remain open. Do not run the legacy deployment command against M2 bytecode. No new public deployment, payment, refund or release occurred. M2 remains NOT ACCEPTED.

Judging: Execution and Integration gain local safety coverage only; live M2 loops remain required. Usefulness is unchanged. Craft gains reproducible restart/failure tests and an explicit incomplete gate. Next: integrate and test the versioned deployment/preflight/evidence commands before requesting any local-wallet deployment.


## Deployment command acceptance update — 23 November 2026
Integrated preflight:m2, plan:m2, deploy:m2 and verify:m2. Plan/preflight/verify are read-only; only deploy loads a local signing key. M2 journals/locks are separate; M1 addresses, evidence and frontend configuration remain unchanged. Legacy deploy:testnet now rejects policy bytecode before reading a key or creating a lock. Confirmation evidence is namespaced for M2; unknown namespace/version combinations fail.

Added source/constructor/receipt checks and compiler runtime output. Runtime matching compares all bytes except compiler-declared constructor immutable references; those values are checked with reciprocal version/wiring/owner getters. No broad bytecode wildcard. Deploy saves each intent/hash before broadcast, validates resulting creations, resumes configure by saved intent and only reports verification after the active subscription index matches. Missing/lagging index leaves successful deployment intents recoverable.

New command integration uses two isolated Anvil chains with explicit protocol/USDC/CRON fixtures. It executes real contract creation/configuration, injects a subscription-index outage after successful broadcast, verifies retry sends no additional transaction, preserves the M1 file, rejects a changed source fingerprint and altered runtime, checks a key-free read-only plan and guards the legacy command. Fixture subscription responses and fixture CRON are not live Reactive/issuer evidence.

Actual checks: all three Solidity 0.8.29 contracts compile; TypeScript/production frontend build passes (existing 530.58kB chunk warning remains); final full suite **76 passed, zero failures/skips/cancellations**. Focused initial command integration also passed before adding the namespace/legacy guard checks. Public preflight attempt failed with no verified network observations; no live M2 deployment, subscription observation or callback is claimed. No public funds moved. Official Reactive contracts/CRON and rnk_getFilters documentation rechecked.

Execution/Integration: command flow has isolated proof only; live M2 execution remains a release blocker. Usefulness: preserved M1, explicit costs/unknown verification and safe resumption help operators. Craft: repeatable CLI, source/runtime guards and reproducible failure tests; bundle size and browser coverage remain weaknesses. No score/winning claim. M2 remains NOT ACCEPTED.

Next: user-local read-only preflight/plan, address any network/CRON/filter incompatibility, implement scheduled-policy evidence linkage/verifier, then perform new dedicated M2 deployment and full unattended expiry/refund/release trails. New browser/physical-device journeys, costs/delay and operational recovery/admission review remain open. M3 has not started.



## Live CRON preflight blocker — 23 November 2026
User WSL at commit 6e4856d ran preflight:m2 and received “No recent network CRON100 event observed.” Because commands used &&, plan:m2 did not run. The command checks protocol/USDC prerequisites before this branch, but the supplied output contains no CRON trace. No deployment was attempted. Empty matching results alone do not establish a network outage, missing emission or an incorrect event shape; the cause remains unverified. M1 is unaffected.

Rechecked current official https://dev.reactive.network/reactive-contracts: documented Lasna CRON emitter, topic and one unindexed uint256 agree with the implemented check. Added diagnose:cron, an explicitly read-only observation command: three nonoverlapping bounded 2,000-block topic windows, all emitter topics over the latest 256 blocks, the CRON100 topic across emitters over that same bounded window, and before/after block heights. Output separates empty responses, unavailable queries and incompatible sample shapes; raw RPC errors/URLs/keys are not printed. An unchanged head during immediate queries does not establish a halted network. Historical or alternate-emitter events never waive preflight.

Three focused diagnostic tests pass after correcting a fixture's chain-ID hex literal. Tests cover malformed/removed/out-of-range logs, bounded read-only queries, missing RPC responses and wrong-network rejection. This slice changes no existing preflight acceptance logic, contract, deployment or payment code. Prior full 76-test/build results remain historical; no new full-suite/build or live diagnostic pass is claimed.

Execution/Integration: live scheduling gate remains blocked, not waived. Usefulness: existing M1 flow is unaffected. Craft: improved actionable, secret-free diagnostics; root cause still pending. Next: run npm run diagnose:cron in WSL, inspect its actual output, and fix the confirmed cause before any deployment. M2 remains NOT ACCEPTED.
