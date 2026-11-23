# M2 unattended policies — acceptance ledger

Status: **IN PROGRESS / LIVE EXPIRY AND FEE RECOVERY VERIFIED / REMAINING FLOWS OPEN / NOT ACCEPTED**, started 23 November 2026.
M1 remains complete under [its acceptance record](M1_ACCEPTANCE.md). User WSL reports successful M2 creation/configuration receipts; full deployment/subscription verification passed from user WSL on 23 November; the existing M1 contracts, quote links and principal are unchanged.

## Acceptance conditions and current results

| Area | Status | Evidence / remaining gate |
|---|---|---|
| Explicit immutable automatic-release opt-in | COMPLETE — LOCAL CODE/TEST | [Escrow](../packages/contracts/src/SettlioEscrow.sol): createQuoteWithPolicy, automaticRelease getter, PolicyRegistered event. Existing creation entry points default to manual release |
| Authenticated destination policy callback | COMPLETE — LOCAL TESTS AND LIVE EXPIRY | [Receiver](../packages/contracts/src/SettlioCallback.sol): proxy and authorised Reactive sender guards; direct/wrong-sender calls rejected in [policy tests](../test/policy.test.cjs) |
| Authoritative destination timestamps/state | COMPLETE — LOCAL CODE/TEST | Early expiry/payout is harmless; payment rejected at expiry; exact cutoff allows eligible release |
| Cancellation reservation takes priority | COMPLETE — LOCAL CODE/TEST | Eligible cancellation remains refundable after cutoff and cannot pay merchant |
| Same-asset transfers, duplicate safety and failed-transfer rollback | COMPLETE — LOCAL CODE/TEST | Native automatic payout once, token refund/payout once; real mined failed token callback transactions retain state and liability, then succeed on retry. Existing asset/refund tests also pass |
| Participant policy retry signal | COMPLETE — LOCAL CODE/TEST | requestPolicy rejects nonparticipants and terminal states; no live retry trail yet |
| CRON scheduler and bounded work queue | COMPLETE — LOCAL BOUNDS AND ONE LIVE EXPIRY | Real indexed CRON/trigger/request/expiry data verified; scan/request bounds remain local tests, not live scale proof |
| Out-of-order events, acknowledgements, retry/backoff and idle pause | COMPLETE — LOCAL CODE/TEST; LIVE PENDING | Cancellation/confirmation flags persist, terminal states cannot reopen, six unanswered attempts then attention; pause/idle unsubscribe. Live cost/debt/admission review still pending |
| Policy-bound terms and merchant/customer interface | IMPLEMENTED — LOCAL CHECKS PASS; BROWSER/LIVE PENDING | Version 3 binds the automatic-release flag; legacy fingerprints unchanged; UI reads recorded policy. Explicit-consent payment API blocks legacy automatic-policy bypass. New browser journeys still need verification |
| Versioned deployment journal, preflight/health/evidence tooling | DEPLOYMENT CHECKS COMPLETE; EXPIRY VALIDATOR PASSES LIVE DATA | Separate journals, exact filter checks and fee-recovery intent tested. New verify:expiry checks real data; full WSL CLI transport reproduction and other policy verifiers remain pending |
| Live scheduled unpaid expiry | COMPLETE — AUTHENTICATED QUOTE-LINKED ON-CHAIN OUTCOME | Quote 1 receipt/events, creation observation, real CRON/request and scheduler closure verified. Unique retry attribution and browser-closed evidence are not claimed |
| Live ETH/USDC refunds and automatic release | PENDING — RELEASE BLOCKER | Genuine origin/CRON -> Reactive -> authenticated Base callback traces, balances/state and browser-closed execution required |
| Fee-debt recovery | COMPLETE — INDEPENDENT LIVE RECEIPT | 1 test REACT reserve deposit cleared debt/restored subscriptions. Measured cost/admission planning remains open |
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



## M2 deployments reported successful; filter wrapper correction · 23 November 2026
User status:m2 output reports successful current RPC receipts for deployReactive (Lasna nonce 2, block 9050953), deployCallback (Base nonce 112, block 62551090) and configure (Lasna nonce 3, block 9050973). Journal exists, lock absent. These observations establish user-reported successful operations, not a complete milestone or independently re-fetched workspace receipt verification. Preserve these contracts and their journal; no redeployment is required to fix the parser.

Reactive: 0xa2DBeB94c0a151e071A6c29999FE1c6B38217b85, creation hash 0x203cb01ad5e88677db960f65a8cb3324d70e0cb9d838036e9c2abfa26eaf0a75.
Callback: 0x1E44e729A2f2Fa2e64C1eDb9904A2eCD90C8A781, creation hash 0xdd859f335b11a37e314661b86cec8c3011452c1e5140947ff427aec6d6985b7c.
Escrow: 0x1694e56187f9422e364B42af3185d34a0D4b9bc0, reported by the M2 journal/status reader.
Configuration: 0x139facceb7a833911d42af29fd6bb2f20509da34bc05bea6a5b795fd7b892dd6.

Root cause of verify-deployment failure: the actual rnk_getFilters response has Version and TopicFilters (PascalCase, observed version 12309), while our parser only accepted the documented camelCase version/topicFilters wrapper. Inner ChainId/Contract/Topics/Configs/Active fields match the expected structure. The supplied first 5,000 characters do not include proof of Settlio's own ten subscriptions; complete verification still must query the full response.

Parser now explicitly accepts either top-level convention, preserves version reporting, rejects conflicting/malformed wrappers and invalid versions, and retains exact chain/source/topic/wildcard/subscriber/active checks. It does not guess arbitrary fields, accept inactive subscriptions or convert a schema error into success. Extended tests exercise both conventions and failure boundaries; the full local deployment/verification fixture now returns the observed PascalCase wrapper.

Final full local suite: **86 passed, zero failures/skips/cancellations**. No contract/frontend source, source fingerprint, deployment intent or principal changed. No new build/live verifier pass claimed for this script-only change. Previous contract/frontend builds remain the baseline. No transaction is sent by this correction.

Execution/Integration: successful deployment/configuration receipts are user-reported; complete runtime/wiring/subscription verification and unattended policy traces remain open. Usefulness unchanged. Craft: production-response casing regression fixes another fixture/documentation blind spot; browser, operational fees and recovery coverage remain pending. M2 NOT ACCEPTED. Next: pull main and run verify:m2 only, without a private key. Do not deploy again to clear this parser error.



## M2 deployment verification passed — user WSL, 23 November 2026
User pulled 6203604 and ran verify:m2 successfully without a key. Provenance is supplied live WSL command output, not an independently rerun workspace query. Report: policyVersion 3, wiringVerified true, ten active origin subscriptions, filterVersion 12314. Quote count and active jobs are both zero; scheduler not paused; cronActive false. The verifier requires inactive CRON when there is no runnable work, so this is the correct idle state, not an automation failure.

The read-only verifier checks recorded creation/configuration transactions, compiled creation/runtime bytecode with separately verified immutable wiring, chain IDs, versions, custody coverage and active exact subscriptions. These deployment checks are now COMPLETE at the reported observation. This does not verify future dynamic CRON activation/delivery or an end-user policy execution.

Custody observation: ETH balance/liability zero, USDC balance/liability zero. Lasna subscriber 0xa2DBeB94c0a151e071A6c29999FE1c6B38217b85 has balance 100000000000000000 (0.1 native test REACT), debt/reserves zero, needsAttention false. Base callback 0x1E44e729A2f2Fa2e64C1eDb9904A2eCD90C8A781 has balance 1000000000000000 (0.001 test ETH), debt/reserves zero, needsAttention false. These are current observations, not guaranteed capacity for later jobs. The new escrow remains 0x1694e56187f9422e364B42af3185d34a0D4b9bc0. Existing M1 addresses/quotes remain separate.

No source implementation changed or tests/builds rerun for this documentation-only update. Prior 86-test/script regression and contract/frontend builds remain the baseline. Local installed Vite loadEnv was inspected: explicitly supplied VITE process variables take precedence over dotenv values. Operator can open a separate M2 dev instance on strict port 5174 with only its process-scoped public escrow variable, preserving the configured M1 dev instance.

Judging: Execution has verified deployment prerequisites but no live M2 policy callbacks yet; Integration has verified origin subscriptions but dynamic CRON and unattended destination outcomes are pending; Usefulness requires completing merchant/customer live journeys; Craft gains reproducible recorded verification while broader browser/device/cost/recovery gates remain open. M2 NOT ACCEPTED. Next: open the M2 interface, verify the policy controls/version before creating a fresh timed quote, then collect genuine unattended expiry/refund/release traces and complete scheduled-policy evidence verification. Do not begin M3.


### Completed deployment checkpoints

| Checkpoint | Status | Evidence and limits |
|---|---|---|
| Creation/configuration, compiled code, immutable wiring, version and networks | COMPLETE — USER WSL LIVE VERIFIER | verify:m2 on 6203604 reports wiringVerified true and policyVersion 3; transaction addresses/hashes recorded in ONCHAIN-EVIDENCE.md |
| Ten exact active origin subscriptions | COMPLETE — CURRENT OBSERVATION | User verifier reports originSubscriptions 10, filterVersion 12314 |
| Correct empty-queue idle CRON state | COMPLETE — CURRENT OBSERVATION | quoteCount 0, activeJobs 0, paused false, cronActive false; dynamic activation/delivery still pending |
| Custody coverage and separate fee funding | COMPLETE — CURRENT OBSERVATION | Both asset liabilities/balances zero; fee accounts funded with no observed debt; not proof of payment/refund or future fee sufficiency |
| Unattended expiry/refund/release and complete browser journeys | PENDING — M2 ACCEPTANCE BLOCKER | Requires actual origin/CRON-to-Reactive-to-destination execution, balances/states, failure recovery and public evidence |



## M2 Quote 1 registration blocked — official live diagnostics · 23 November 2026
User created the unpaid automatic-expiry quote, creation hash 0x26d54a13b47dafeced742b46ae831140348aa535e7af71e8b35fc547fa1014f6. The supplied 11.67-second video shows M2 localhost:5174 Quote 1, photography automatic-expiry test, Awaiting deposit, 0.0001 ETH deposit/0.0003 total, manual release, deadline 23 November 13:00 WAT and full-refund cutoff 14:30 WAT. It displays “Waiting for the scheduler to observe this quote.” This is user/browser evidence, not callback proof.

User WSL verify:m2 then reports quoteCount 1, activeJobs 0, CRON false, paused false, ten origin subscriptions (filterVersion 12325), empty principal custody and unchanged fee balances with zero debt/reserves. This is not the expected end-to-end registration result, even though the structural verifier's queue/CRON consistency condition passes. Do not mark automation complete from wiringVerified alone.

Reached the public official read-only Reactive MCP at https://mcp.rnk.dev/mcp directly and inspected tool schemas before use. Independent service queries:
- validate_subscription: OK_VALID / proven for Base 84532, our escrow, exact PolicyRegistered topic 0x507cf77845a76d912db6ba6ca3fe5da2563fb037fbbc870d551aa9e27803e5ef, wildcard indexed quote ID. It reports one recent matching event, one subscriber, rcListed true and rcActive true; filterId 0x74caf4021f8749623cbfe403a6ea636c.
- trace_origin_event: origin receipt metadata includes our PolicyRegistered log at index 2, two topics, Base block 62555346. Sequence not found / cannot_prove; scanning stopped after 264 blocks at its 300-RPC request budget. This is inconclusive about delivery, not proof that no reaction could exist.
- get_network_info twice: SEQUENCER_STALLED / likely. First sample advanced Lasna 9052179 -> 9052182 with sequence frontier fixed at 179629726; later sample 9052238 -> 9052241 retained the same frontier. The service flags origin-ingestion stalling. This is a likely external blocker, not a confirmed network-wide outage; public RPC load balancing is an explicit service caveat.
- get_rc_health: ten active subscriptions, zero debt/reserves, balance 0.1 test REACT, zero observed reverts in 3001 blocks. LOW_RESERVES / likely is a separate heuristic based on ten assumed 60000-gas reactions (0.16 REACT cushion), not measured Settlio gas. Our pinned AbstractPayer source implements pay(), so the tool's conditional exclusion of contract balance must not be interpreted as proof of zero available funds. A larger fee buffer/cost review is still required before relying on repeated timed checks.

Committed labelled [diagnostic evidence](../deployments/evidence/m2/quote-1-registration-diagnostic.json), explicitly not a successful execution trace. Direct Base RPC from this workspace remained unavailable; origin metadata was retrieved through the official service. No source, test, contract, deployment or state-changing operation was modified by this investigation. Prior 86 tests/build results stand; no rerun claimed.

Execution/Integration: live registration, dynamic CRON and policy callbacks BLOCKED / UNVERIFIED. The root cause is not yet exclusively proven; exact filter validity and repeated likely-ingestion-stall observations narrow the investigation. Usefulness is not established by a blocked test. Craft gains source-cross-checked, provenance-labelled service evidence and honest scan limits; missing scheduled-policy verifier, fee buffer, cost/recovery and browser acceptance gates remain open. M2 NOT ACCEPTED.

Keep this quote unpaid and preserve its link/hash. Passing 13:00 WAT is intentional for the expiry test; an overdue deadline alone or a UI label is not proof of an authenticated expiry callback. Once ingestion resumes, recheck this same quote, provision adequate separate fees, and collect the actual origin/CRON -> Reactive -> Base result. No retry, new quote, redeployment, top-up or payment was performed by the assistant. No M3 work began.



## M2 registration/CRON recovered; fee debt and callback delivery remain open · 23 November 2026, about 15:16 WAT
Fresh independent official MCP observations supersede the earlier likely-ingestion-stall diagnosis: get_network_info reports OK_NETWORK / proven, frontier 179714802 -> 179714828 at Lasna heights 9061591 -> 9061595. This proves movement during that sample, not permanent network health.

Direct public read-only RPC checks (Base Sepolia publicnode, Lasna official RPC) show Quote 1 still status AwaitingDeposit (1), expiry 1795435200 (13:00 WAT), refund cutoff 1795440600 (14:30 WAT). jobs(1) now registered true, attempts 3, nextAt 1795440652, closed false, confirmed/cancelled/attention false. The original quote has registered; do not recreate it or alter its terms. Both deadlines are past, so only an authenticated expiry result can establish automated completion.

Independently retrieved three PolicyCallbackRequested logs for Quote 1. First reaction 0x80ff5a138037db5fff54218c6a95487cb7cf868f8f89479e0625b358141bfb92 (block 9058601); later requests 0xbb1d31d87ea2d46d884f390242ce03feeae2bf2adc263ad22c2fb6fe988779c3 and 0x07bc0f3491985978a7746a3f141721eb76e853a3b077eebd17986c3e5f64202e. Official trace_reactive_tx proves the first react() succeeded, gasUsed 127271, from a real Lasna CRON100 origin at block 9058600, hash 0x5f7362f65dea57beb12be0ceb49ea1bb378a2dfe6b6166b4d6edecb76558fb83, log index 2; it requested one callback to our Base receiver with gasLimit 1000000. This is real CRON -> Reactive -> callback-request evidence, not successful delivery or browser-closed acceptance.

Official trace labels CALLBACK_NOT_POSTED / cannot_prove: getCallbacks is empty; the service sees no posted results network-wide in its sampled 30000 blocks and no recipient CallbackFailure in its sampled Base interval. Return-report absence alone does not prove nondelivery. The separate Base quote status remains 1, so expiry has not been accepted at the observed state. Delivery investigation remains open.

Current hard blocker: official get_rc_health reports IN_DEBT_BLOCKED / proven, debt 14768500000000000 wei (0.0147685 test REACT), reserves zero, balance 9090600000000000 wei (0.0090906), eleven subscriptions total and none active. PaymentFailure and BlacklistContract are reported at block 9059001 in 0x84cc66b427da3d9b5852468bd9d1813303bc87ed08567c7ee88da061ecbe30ce. Initial 0.1 test REACT did not cover elapsed checks; the earlier low-fee warning must now be treated as a real operational failure. Contract pay() support does not exempt it from debt blocking.

Implemented fund:m2 for one fixed 1-test-REACT SYSTEM.depositTo(existing M2 subscriber) reserve payment. It validates Lasna, recorded deployer, existing creation receipt/compiled code and immutable target wiring; it does not require active subscriptions while recovering from debt. It shares the M2 lock and writes its fundReactive public intent/hash before broadcast. Rerunning resumes that same transaction, not a second deposit. status:m2 includes the optional funding operation. Safe fund-stage errors preserve existing secret suppression. It does not replace deployments, change constructor funding/source fingerprints or touch escrow principal.

Validation: full local suite 87 passed, zero failures/skips/cancellations, then six focused reserve/status checks passed after a final error-stage wrapper. A real isolated fixture deposit clears 0.0147685 fixture debt, credits 0.9852315 reserves, preserves subscriber balance and creation record, rejects wrong deployer, and repeats without another deposit; fixture accounting is not live protocol evidence. No contract/frontend source changed or new builds claimed. No public reserve payment was sent by the assistant; user-local key action is required.

Saved a labelled quote-1-recovery-diagnostic.json containing live observations/request logs and delivery limits. Execution/Integration now have live registration and CRON/request proof, but delivery, expiry/refund/release, full evidence verification and browser-closed testing remain incomplete. Usefulness awaits successful recovery and destination outcome. Craft gains journalled fee recovery; cost/admission thresholds and callback delivery remain weaknesses. M2 NOT ACCEPTED. Next: user runs fund:m2 once with the dedicated local key, verify debt/subscriptions, then inspect the same quote and trace actual destination delivery. A reserve payment fixes debt, not every callback problem.



## M2 Quote 1 authenticated expiry and fee recovery verified · 23 November 2026
User fund:m2 receipt 0xaaa3863b906620ce06546e69fd288c4b51deae460da3f6e958c0d06d14a68282 succeeded. Independently fetched its raw Lasna transaction and receipt: chain 5318007, value 1 test REACT, official SYSTEM recipient, decoded depositTo target equal to the recorded M2 subscriber, successful receipt at block 9062289. User immediate debt 0/reserves 0.9852315; later verify:m2 reserves 0.9684279. Independent official health at 14:31 UTC reports HEALTHY / proven, debt zero, reserves 0.9536594 and all 11 subscriptions active. Readings differ as paid reactions consume reserves; no future-fee guarantee. Saved funding-recovery-1.json with raw public evidence and provenance. No second fund operation was sent.

An independent Base read at 14:31 UTC still showed AwaitingDeposit; a later read at 14:35 UTC showed Expired (6). Scheduler jobs(1) is registered and closed, with nextAt zero and four attempts. Found successful Base callback 0x547bbbf96a201348cf818f4dcf97a55dacb9403b24892009d152c2e219064899 at block 62612635, timestamp 2026-11-23 14:33:15 UTC / 15:33:15 WAT. Its actual proxy call decodes deliverCallback version 0, Base chain ID, the configured M2 receiver and processPolicy(M2 Reactive address,1). The escrow emits QuoteExpired(1) and PolicyChecked(1,6) in that same successful receipt. Current immutable receiver/proxy/Reactive wiring was freshly queried and matched.

Added verify:expiry, a key-free verifier accepting quote ID and creation/CRON/reaction/callback hashes (optional journal path). It validates actual creation/policy terms and original processed fingerprint, exact indexed network CRON log, injected SYSTEM trigger input and receipt linkage, matching PolicyCallbackRequested/system CallbackRequest, delivered proxy configuration/authenticated sender and quote payload, successful expiry/outcome events, deadline/block timing, terminal quote and scheduler acknowledgement. It writes namespaced evidence only after all checks pass and whitelists public journal identity before saving.

Independently retrieved live RPC responses passed validateBundle, yielding quote-1-expiry.json. Full CLI collection from this workspace hit Node provider network detection/access failure; that attempt did not write new success evidence or send a transaction. Public responses were instead fetched through Python HTTP and checked by the same validator. User WSL reproduction of the complete CLI transport is still pending. No fabricated receipt or simulated production transaction is used.

Attribution limit: retries have identical payloads and the official return-report index still lacks mapping. The supplied real CRON/reaction #4 is a matching candidate, not uniquely identified as the one delivered. Report explicitly sets uniqueRetryAttribution false. Browser closure was not recorded; no browser-closed acceptance is claimed. The service's CALLBACK_NOT_POSTED / cannot_prove result is not proof of failed delivery: Base receipts now prove accepted expiry despite missing return reports. No exact-latency claim.

Validation: eight historical-public-evidence/tampering tests pass; full local suite 95 passes with zero failures/skips/cancellations. After optional journal-path and clearer result-label adjustments, the eight focused checks pass again. They replay genuine recorded evidence and do not count as fresh live execution. No contract/frontend bytecode or deployed address changed and no new contract/frontend build was needed/claimed. Existing build baseline remains.

Execution/Integration: COMPLETE for this scope — real quote registration, CRON/request and authenticated quote-linked expiry; fee-debt recovery independently verified. Usefulness: an unpaid booking becomes expired without a merchant expiry transaction; timing was delayed and browser-closed proof remains open. Craft: reproducible validation and explicit attribution/transport limits; measured costs/admission thresholds and broader journeys remain weak/open. M2 NOT ACCEPTED overall. Next: user reruns read-only verify:m2 and verify:expiry, checks the Expired page, then complete ETH/USDC refund/release and browser-closed acceptance. Keep the original 13:00/14:30 WAT terms; do not create a replacement quote for this result.


### Quote 1 checkpoint closure

| Checkpoint | Status | Proof / remaining limit |
|---|---|---|
| Original policy observation and live indexed CRON/request | COMPLETE — INDEPENDENT LIVE RPC | Processed creation fingerprint; injected trigger binds exact CRON receipt; request event/config verified |
| Successful authenticated expiry on Base | COMPLETE — INDEPENDENT LIVE RPC | Callback 0x547bbbf96a201348cf818f4dcf97a55dacb9403b24892009d152c2e219064899, successful receipt, decoded proxy payload, QuoteExpired and PolicyChecked(1,6) |
| Terminal scheduler acknowledgement | COMPLETE — CURRENT LIVE READ | jobs(1).closed true, registered true, nextAt zero |
| Debt payment and reserve recovery | COMPLETE — INDEPENDENT LIVE RPC | Funding receipt 0xaaa3863b906620ce06546e69fd288c4b51deae460da3f6e958c0d06d14a68282; correct depositTo target/value and healthy subsequent observation |
| Unique retry-to-delivery attribution | UNRESOLVED LIMIT | Identical retry payloads; no posted return-report mapping; do not uniquely attribute delivery to request #4 |
| Browser-closed capture and full WSL CLI reproduction | PENDING | No retroactive browser-closure claim; validator passed live receipts but workspace Node transport failed |
| ETH/USDC refunds, releases, cost/admission/recovery and full UI journeys | PENDING — M2 CLOSE BLOCKERS | Complete with actual balances, permissions, traces and usable browser evidence |
