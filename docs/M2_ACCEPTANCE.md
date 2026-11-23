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
| Actual CRON scheduling and bounded work queue | PENDING | Current SettlioReactive remains the M1 deposit/retry subscriber. No scheduling implemented yet |
| Out-of-order events, acknowledgement-based completion, bounded retry/backoff, idle pause and funding control | PENDING | Must be designed/tested with scheduler; requesting a callback is not completion |
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
- Expanded full suite: **53 passed, zero failures/skips/cancellations**, including existing 46 M1 checks.
- All three contracts compile using Solidity 0.8.29. TypeScript/production frontend build passes. Existing >500kB bundle warning remains.
- Protocol proxy/token fixtures are isolated local test contracts. No public callback, CRON delivery, official USDC transfer, deployment or user payment is claimed by these tests.
- Current official [Reactive contracts](https://dev.reactive.network/reactive-contracts) and [callback authentication](https://dev.reactive.network/callback-contracts) docs rechecked. CRON support is documented, not yet observed live for Settlio.
- No public transaction sent, no quote migrated, no funds moved. Existing frontend continues to use the unchanged M1 deployment and does not offer automatic release.

## Judging review

Execution: destination logic has passing local execution; M2 public-network proof pending.
Integration: scheduler and genuine unattended callbacks still pending.
Usefulness: approved deposit policy has clear behaviour; no customer-demand claim.
Craft: tested permission/timing/failure boundaries and transparent incomplete ledger; no overall score claimed.

Next: implement the bounded CRON scheduler, acknowledgement handling and controlled retries. Stay in M2 until live acceptance; do not begin M3 merely because this local slice passes.
