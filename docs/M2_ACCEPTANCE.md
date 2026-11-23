# M2 unattended policies — acceptance ledger

Status: **IN PROGRESS / NOT ACCEPTED**, started 23 November 2026.
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
| Policy bound into shared terms and merchant/customer interface | PENDING | UI currently uses version 2 terms and manual-policy creation. New policy must be bound/verified and disclosed before enabling automatic release |
| Versioned deployment journal, preflight/health/evidence tooling | PENDING | New bytecode/event API requires new deployments and version checks. Do not deploy this partial slice |
| Live scheduled expiry, ETH/USDC refunds and automatic release | PENDING — RELEASE BLOCKER | Genuine CRON/origin -> Reactive -> authenticated Base callback traces, balances/state and browser-closed execution required |
| Complete journeys, failure/recovery, documentation and review | PENDING | M2 cannot close until every required live/local gate is satisfied |

## Implemented destination rules

processPolicy authenticates its caller via the immutable receiver. Reserved refund first; otherwise unpaid expiry, received-deposit confirmation, or explicitly enabled confirmed-deposit release at cutoff. Destination state/timestamp checks make repeated/stale calls safe. PolicyChecked reports resulting state; it does not by itself prove scheduler acknowledgement.

Existing manual release stays merchant-only. An opt-in can only be set at creation; there is no switch that can change an existing quote's policy. Reaching refundCutoff establishes agreed payout eligibility, not proof of service delivery. Automation funding remains outside principal.

## Verification on 23 November

- Initial focused run failed because the first edit omitted the option-creation policy assignment/event. Corrected before commit.
- Focused policy suite: 7 passing checks (parent plus six cases).
- Expanded full suite: **64 passed, zero failures/skips/cancellations**, including existing 46 M1 checks.
- All three contracts compile using Solidity 0.8.29. TypeScript/production frontend build passes. Existing >500kB bundle warning remains.
- Protocol proxy/token fixtures are isolated local test contracts. No public callback, CRON delivery, official USDC transfer, deployment or user payment is claimed by these tests.
- Current official [Reactive contracts](https://dev.reactive.network/reactive-contracts) and [callback authentication](https://dev.reactive.network/callback-contracts) docs rechecked. CRON support is documented, not yet observed live for Settlio.
- No public transaction sent, no quote migrated, no funds moved. Existing frontend continues to use the unchanged M1 deployment and does not offer automatic release.

## Judging review

Execution: destination logic has passing local execution; M2 public-network proof pending.
Integration: scheduler and genuine unattended callbacks still pending.
Usefulness: approved deposit policy has clear behaviour; no customer-demand claim.
Craft: tested permission/timing/failure boundaries and transparent incomplete ledger; no overall score claimed.

Next: bind policy into versioned terms/UI, expose job/funding/attention states, version deployment/evidence tooling and verify real unattended network loops. Stay in M2 until live acceptance; do not begin M3 merely because local checks pass.


## Scheduler verification update — 23 November
CRON100 is authenticated against Reactive chain ID, legacy emitter address, topic and log shape. Ten precise origin subscriptions track policy registration, participant retry, cancellation, confirmation and destination completion in addition to deposit confirmation routes. Runnable jobs enable CRON; idle/paused jobs unsubscribe. Each tick scans at most eight and requests at most two callbacks; backoff uses timestamps (60 seconds times attempt). Six unanswered attempts set needsAttention and stop that job's automatic retry; participant request can reconstruct registration and requeue immediately. Destination checks remain authoritative under clock skew and delayed/out-of-order events.

The scheduler test suite includes real isolated expiry, native automatic payout, and late cancellation/refund transactions with protocol forwarding and explicit test CRON records. It proves local code wiring, not public delivery. Original M1 regression tests now expect ten subscriptions only for newly compiled fixture deployments; the old public M1 subscriber remains unchanged.

Final 64-test run passed after the retry-timing correction. The contract build passed after it; the frontend build passed before that final internal-only correction, with no ABI or frontend change afterward. No new public transaction, network proof or deployment. Active jobs still incur tick fees; retries/idle unsubscribe do not establish production-scale admission economics or permanent funding. Those operational/live checks remain open.
