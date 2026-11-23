# M2 unattended policies — acceptance ledger

Status: **IN PROGRESS / DEPLOYMENT ATTEMPT STOPPED / OUTCOME UNVERIFIED / NOT ACCEPTED**, started 23 November 2026.
M1 remains complete under [its acceptance record](M1_ACCEPTANCE.md). M2 deployment outcome is unverified after a stopped user-local attempt; the existing M1 contracts, quote links and principal are unchanged.

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



## Indexed CRON event correction — 23 November 2026
Root cause established from user WSL diagnostics at 2026-11-23T10:46:19.948Z: each of three nonoverlapping 2,000-block windows returned 20 CRON100-topic logs. Samples have two topics and zero data bytes; the head advanced from 9,049,714 to 9,049,716. Our unindexed-only parser rejected those logs. The scheduler shared that incorrect assumption and would have silently ignored indexed ticks. This supersedes the earlier unknown-cause status; the previous local fixture repeated the same wrong layout and therefore missed the integration defect.

Official source at revision [72710d2](https://github.com/Reactive-Network/system-smart-contracts/blob/72710d2b5f4e15e445da782aaef9f8bae59f4af9/src/SystemContract.sol) declares Cron100(uint256 indexed number); [Omni LegacySystemContract](https://github.com/Reactive-Network/system-smart-contracts/blob/72710d2b5f4e15e445da782aaef9f8bae59f4af9/src/omni/LegacySystemContract.sol) inherits that source and invokes _cron(block.number). Current prose documentation describes number as unindexed, contradicting source/live samples. Source and actual observations govern this correction. No supported dependency revision changed.

Corrected preflight and diagnostics through a shared strict indexed-event validator. Signature/emitter and one 32-byte indexed number are required; data must be empty. Preflight reports the indexed number. Diagnostics now report matchingIndexedCron100 and indexed-number samples. Scheduler requires opCode 2, empty data and zero unused topic slots, retaining onlySystem, chain/emitter/topic checks, deduplication, bounded work and timestamp deadlines. The block number is not used as a payment timer.

Replaced the deployment CRON fixture with a genuine locally emitted indexed log. Added a scheduler regression forwarding an actual indexed receipt through the isolated protocol: a due job requests a callback once, repeat delivery is ignored, and old unindexed/extra-topic/nonempty-data shapes cannot run the due job. Malformed-log diagnostics remain covered.

Checks: focused diagnostic/deployment/scheduler run **17 passed**; final full suite **80 passed, zero failures/skips/cancellations**. All three Solidity 0.8.29 contracts and TypeScript/production frontend build pass. Existing 530.58kB chunk warning remains. Local protocol/CRON tests are not public callback evidence. User-supplied samples establish the observed mismatch; no independently re-fetched public receipt or corrected user-local preflight pass is claimed.

This changes upcoming M2 subscriber bytecode. No public deployment, migration, payment or fee broadcast occurred; M1 is unchanged. Existing M2 journal fingerprints must still be preserved and inspected, never deleted to bypass source checks. Execution/Integration: concrete integration defect corrected locally, live Settlio CRON delivery still required. Usefulness: intended unattended workflow preserved. Craft: source cross-check and actual-event regression close a fixture blind spot; broader browser/live/cost checks remain open. M2 NOT ACCEPTED.

Next: user WSL reruns preflight:m2 then plan:m2, both read-only. Confirm the corrected live observation before considering deployment. Scheduled-policy evidence linkage/verifier, new public deployment, browser-closed expiry/ETH-USDC refund/release traces, costs and recovery are still pending.



## User WSL M2 preflight and planning passed — 23 November 2026
Provenance: user-pasted command output after pulling a3aef74. Both preflight:m2 and plan:m2 succeeded read-only. Base chain ID 84532, Lasna 5318007 and issuer-listed USDC prerequisites passed. Both reported CRON100 hash 0xab6db2a9d9a4b89640185913021f7f2f3ad29301f294ca4ec945fe361df2a4a7 at block 9050100, indexedNumber 9050100, indexed-number layout, 20 matching logs in the recent window. This supersedes the corrected-check-awaiting-live-rerun status. It is user-local public RPC evidence, not an independently rerun workspace query or a Settlio callback trace.

Planned deployer: 0xbf6301D7bca9F23A63A2d1Ed513d5120Dbb2288E.
Source creation hashes: SettlioReactive 0x1c0f86e6cb9b03fba627eefbd07133082973d9bdeaf5b3ab23b720ac79f36454; SettlioCallback 0x6668b40b266a9976095830bf87fcd6ea2c8c67721a6b9111c86da9fb28a241ae.
Creation gas estimates: Reactive 2053657, callback 2539060. Constructor funding: 0.1 native Lasna test REACT and 0.001 Base Sepolia ETH. Reported creation costs including funding and the planner gas margin: 0.3464388 Lasna native and 0.001018281232 Base ETH. Wallet observations: 9.8153534 Lasna native and 4.724033742548682146 Base ETH. These exceed the creation estimates; configuration and future subscription/CRON/callback fees are additional. No perpetual-delivery or fixed-fee guarantee.

No transaction was sent by either command; no new address, deployment, policy payment, refund or release is established. Prior 80-test/build results stand; this documentation-only update does not claim a new test run. M1 remains intact. Next operational step: dedicated M2 deploy with its preserved journal and a securely entered local testnet deployer key, followed by verify:m2; obtain actual addresses/hashes/output before enabling new frontend configuration. Scheduled-policy evidence verification, browser-closed live expiry/refund/release, costs, failure recovery and remaining browser checks remain open.

Judging: Execution/Integration gain an observed network wakeup prerequisite, not M2 delivery. Usefulness unchanged. Craft closes the preflight-blocker diagnosis with reproducible user output. M2 remains NOT ACCEPTED; M3/M4 remain pending.



## M2 deployment attempt stopped — outcome unverified · 23 November 2026
User entered the hidden local key prompt and deploy:m2 returned the generic “M2 command stopped” message. verify:m2 did not run because the commands were chained with &&. No public hashes or addresses from this attempt have been supplied. The error does not establish the failing stage, absence of a broadcast, complete failure, invalid key, insufficient funds or loss of funds. Preserve the journal and inspect it read-only before another deployment attempt. This supersedes the earlier no-attempt/deployment-pending current status.

Added status:m2: no signing-key access, file write, lock removal, nonce replacement or broadcast. It reads only whitelisted public fields, reports journal/lock presence, validates the M2 schema/networks and checks saved transaction receipts/hashes on the appropriate chain. It distinguishes succeeded, reverted, pending, missing-but-unknown, unavailable-RPC and mismatched-receipt outcomes. Saved “confirmed” alone is not trusted as a fresh receipt check. Unknown JSON fields/raw RPC messages are not printed.

Deployment errors now show fixed stage labels and allowlisted codes, including wallet-key, network-preflight, compile-and-journal, deployment operations and verification. Unknown raw messages are suppressed; no raw key/signing payload/RPC URL is logged. This improves future failures; it cannot reconstruct the exact stage of the user's previous generic error. No contract bytecode, journal fingerprint, subscriptions or frontend source changed.

Checks: five focused status/error checks pass, including an actual CLI invalid-key invocation with no secret in output. The local deployment integration also checks real successful saved receipts and journal preservation after a simulated index outage. Final full suite: **85 passed, zero failures/skips/cancellations**. No new contract/frontend build is claimed for this script-only change; previous builds remain the baseline. These are isolated tests, not verification of the user's attempt.

Execution/Integration: public M2 deployment and unattended loops remain unverified. Usefulness: inspect-before-retry prevents confusion around pending deployments. Craft: explicit, secret-free status/errors; actual failure root cause still open. M2 NOT ACCEPTED. Next: user runs status:m2 without a key and supplies its public output; diagnose the demonstrated state before resuming. Keep the existing M1 configuration and preserved deployment records.
