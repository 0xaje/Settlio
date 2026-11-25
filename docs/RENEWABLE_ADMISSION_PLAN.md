# Renewable admission implementation plan

25 November 2026. The user approved proceeding with implementation planning after the operating-model proposal. **Design direction approved; production settings, contract implementation and deployment are separate gates. No spending or deployment authorized.**

## Scope and completion condition

Plan a versioned replacement architecture with renewable finite sponsored grants, bounded outstanding cross-chain obligations and isolated customer principal. Preserve V4 source, addresses, links, journals and six proofs. Do not modify the exhausted deployment, reopen capacity, or repeat the six public journeys.

Planning is complete when the component responsibilities, accounting invariants, failure cases and verification order are concrete. Local implementation is the next engineering step once this plan is accepted; it does not authorize public operations. M2 remains open; M3/M4 have not begun through this work.

## Proposed component changes

| Component | Planned responsibility | Required constraint |
|---|---|---|
| New admission ledger | Reserve finite grants, consume permissions, track outstanding work and settle it once | No permanent lifetime cutoff; monotonic audit count; unused grants and unsettled jobs share bounded work capacity |
| Versioned escrow | Preserve current payment/refund rules; report terminal state to admission ledger | Principal transitions cannot depend on successful remote acknowledgement |
| Versioned Reactive contract | Observe terminal events, tombstone jobs, emit closure acknowledgements and bounded acknowledgement retries | Late creation/retry cannot resurrect closed jobs; runtime state must not be confused with network subscription state |
| Versioned callback receiver | Authenticate network proxy and configured Reactive identity; deliver typed closure acknowledgement | Deployment/chain/epoch/quote binding; no generic owner-settled bypass |
| Read-only accounting tooling | Reconcile grants, obligations and fee observations across both chains | Stale/unknown is not settled or funded; no automatic transaction |
| Sponsor operation | Issue reviewed finite grants against reserved budget | Serialize issuance and recover saved intents; never grant on an unconfirmed transaction |
| Web interface later | Explain capacity, fee availability and pending reconciliation in plain English | Full visual implementation remains M3; do not advertise renewable functionality before deployment |

Names and ABI are to be finalized during local design review, without changing current deployment scripts or their journals. Keep new operations opt-in and version-specific.

## State and accounting contract

Per permission: merchant, deployment identity, epoch, grant expiry, budget profile and unused count. Per job: globally unique quote ID, admitted epoch/profile, destination terminal flag, source-closure acknowledgement flag and settled flag.

Proposed transitions:
- Grant reserves unused work capacity.
- Creation moves one unit from unused reservation to unsettled obligation atomically.
- Destination terminal outcome frees destination active capacity only.
- Authenticated source closure acknowledgement plus local terminal outcome settles the obligation exactly once.
- Expired unused permissions release only their unused reservation.
- Grant replacement must first reconcile unused permissions; it must never remove an admitted obligation.

Invariant: unused reserved work + admitted unsettled work never exceeds the configured work bound. A distinct destination active bound may also apply. Settlement must never decrement twice or wrap counters. Aggregate counts must equal the corresponding per-merchant/per-job totals.

An acknowledgement arriving before local terminal state must not free capacity. Choose either harmless pending storage or rejection with bounded retry during implementation review; test the selected policy. Include terminal outcome/version in the payload so a closure for another job cannot match accidentally.

A normal terminal operation must not call an untrusted remote service synchronously. Accounting cannot confiscate or delay an otherwise valid reserved-refund claim. Failed recipient transfers leave funds and liabilities intact. Preserve exact asset isolation, cancellation precedence, timestamps, authentication and duplicate-transfer protection.

## Source closure and recovery

Use a distinct acknowledgement path and bounded recovery budget. The existing terminal-job policy retry is unsuitable after job closure. Specify who can request an acknowledgement retry, cooldown, maximum attempts, deduplication and who pays; none of these may silently reset through repeated grant issuance.

A source job must remain tombstoned after closure, including if terminal logs arrive before creation logs. New grants cannot erase old tombstones or reuse IDs. Source pending acknowledgements remain accounted work. A callback receipt or request alone is not destination settlement evidence.

If acknowledgement delivery exhausts its allowance, keep the work reservation outstanding and show the reason. No timeout-based owner shortcut that claims remote work disappeared. A separately reviewed authenticated reconciliation/recovery mechanism may restore capacity after evidence is available. Customer withdrawals must remain independent.

## Budget design and unresolved numbers

The approved direction is platform sponsorship, not an approved permanent price. Do not choose arbitrary production capacity or horizon to make tests pass.

Before selecting initial settings, compare 24-hour and seven-day candidate horizons using measured existing history where available and clearly labeled scenario inputs. Include active source processing, idle timer work, retries, terminal acknowledgement requests/deliveries, processing backlog and fee contingency. Verify official timer support and subscription changes before implementing a cheaper cadence.

Per-chain allowance must cover existing unsettled obligations, unused permissions, proposed new work and contingency. Source fee credits cannot substitute for destination ETH. Neither customer principal nor presumed recoverable old reserves counts as funding.

Specify a maximum observation age and acceptable chain-head lag as explicit policy parameters. Close new issuance on debt, stale observations, failed reconciliation or insufficient backing. Existing jobs may still require funding after extraordinary fee/delivery changes; no finite reserve promises indefinite service.

Sponsor observations are attestations, not a cryptographic proof of Lasna reserves to Base. A compromised sponsor can misstate funding. Document this residual trust and limit authority: sponsor permissions cannot move customer deposits.

## Verification order and acceptance matrix

| Step | Checks | Evidence needed |
|---|---|---|
| 1: ledger | Concurrent merchants, exact counters, expired/replaced grants, replayed IDs, overflow boundaries, duplicate settlement | Local executable invariants and adversarial tests |
| 2: escrow integration | Deadline equality, cutoff races, pending cancellation, failed transfers, exact ETH/USDC accounting | Existing meaningful regression cases against new version |
| 3: closure protocol | Wrong proxy/sender/chain/epoch, early/duplicate acknowledgements, terminal-before-create, delayed retries | Local integration with explicit out-of-order event sequences |
| 4: backlog/recovery | Many destination closures before source ingestion, lost acknowledgements, exhausted retry allowance, issuer outage | Bounded outstanding work; cancellation/refund rights still usable |
| 5: economics/tooling | Double reservation, stale/reorged observations, debt/fee change, partial grant broadcast and restart | Deterministic read-only reports and intent-recovery tests |
| 6: critical review | All invariants, official integration assumptions, remaining trust, operational complexity | Review fixes and exact test/build results |
| 7: later public decision | Concrete code/config, cost ceiling, journal identity and minimal new integration proof | Separate user authorization before deployment/funding |

Local tests may isolate protocol actors; label them local verification, never genuine network evidence. Existing 245/245 is a historical checkpoint, not a new-version pass. Run targeted tests while implementing; run the relevant full regression and builds at the coherent integration checkpoint. Do not repeat unchanged live workflows to pad evidence.

## Implementation sequence and stopping rules

First implement the standalone ledger and its invariants locally. Then integrate escrow principal safety, followed by source closure/acknowledgement recovery. Build the read-only budget/reconciliation tooling after the state model is stable. Review the complete system before adding any signing operations.

Stop if the design cannot bound remote work without blocking customer claims, if timer/funding assumptions cannot be verified, or if an acknowledgement loop requires unbounded charges. Report the unresolved issue instead of weakening the invariant.

Preserve existing dependencies and event-period history. Work on main with coherent commits. No deployment preparation, key handling, new grant or fee deposit belongs to these planning steps.

## Status and judging

This plan is documentation, not implemented renewable functionality. No new test, build, network observation or milestone completion is claimed. The prior self-assessment remains Execution 20/25, Integration 20/25, Usefulness 15/25 and Craft 15/25. The operating direction is now approved for planning; numeric policy choices and the original M2 evidence qualifications remain open.

Next action: review this implementation specification, then implement and verify the standalone ledger locally without touching V4 or spending tokens.
