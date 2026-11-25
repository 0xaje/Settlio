# V5 adaptive timer — local acceptance

25 November 2026. **Implemented and tested locally; not deployed or enabled on V4. M2 remains open.** Follows [the cost review](RENEWABLE_COST_REVIEW.md).

## Scope and accepted local behavior

[SettlioReactiveV5.sol](../packages/contracts/renewable/SettlioReactiveV5.sol) now chooses a timer from the earliest queued deadline. Its active queue is a minimum heap with quote-ID tie breaking. Insertion, rescheduling and removal repair the heap in logarithmic work; timer choice reads the root without scanning every booking. A tick still processes no more than eight items and requests no more than two callbacks.

The constructor is now `(uint256 chain, bool enableAdaptiveTimers)`. This is an explicit local configuration choice, not a mutable merchant setting or an approved public deployment profile. False retains fast-only timing. Existing V4 constructors/addresses remain untouched.

| Earliest queued deadline, when adaptive is true | Selected subscription |
|---|---|
| More than six hours away | Cron10000, every 10,000 blocks |
| More than 30 minutes but at most six hours away | Cron1000, every 1,000 blocks |
| At most 30 minutes away, including already due | Cron100, every 100 blocks |
| Paused or no source work queued | None |

Six hours and 30 minutes are candidate local transition thresholds, not guaranteed latency, service horizons or approved production settings. Timers are block-driven; wall-clock cadence and delivery vary. Near-term work, cancellation and retry deadlines move the shared timer back to the fast tier immediately when observed.

Even a coarse tick with no due item re-evaluates its tier, allowing a genuine network event to move the scheduler towards finer checks. It never unsubscribes every timer while waiting for future work. At most one CRON tier is recorded as subscribed. Switching uses identical chain/emitter/wildcards and replaces only topic0. Delayed old-tier notifications cannot trigger a second batch.

No Base payment, cancellation, refund or payout condition changed. The destination still enforces its own timestamps and state. An adaptive source can be late; it cannot authorize early release, late payment or consume a reserved refund.

## Local verification

- `node --test test/renewable-timer.test.cjs`: **4/4 passed**, zero failures/skips/cancellations.
- Existing closure regression after shared transport extraction: **8/8 passed**, zero failures/skips/cancellations.
- Offline cost-report regression after refreshing its source fingerprints: **4/4 passed**.
- `npm run build:renewable`: all four contracts compiled under Solidity 0.8.29 and passed EVM size checks.
- Final full repository `npm test`: **295/295 passed**, zero failures/skips/cancellations (167.89 seconds).

New timer cases verify:
1. An actual local quote transitions coarse -> medium -> fast without early expiry, then completes authenticated local expiry/closure/settlement. Exact six-field subscription keys are checked, old-tier notifications are ignored and idle unsubscribes all tiers.
2. Arbitrary heap insertion order, earlier/later rescheduling and root/non-root removal preserve the independently expected minimum deadline.
3. Fast-only configuration, owner permission and adaptive pause/resume preserve deadlines and choose the current appropriate tier.
4. A 128-item synthetic local queue retains exact minimum selection; registration/cancellation calls remain below the fixture's 900,000-gas ceiling, and processing retains the request bound.

The protocol transport is shared in [renewable-protocol.cjs](../test/helpers/renewable-protocol.cjs); it explicitly defaults fixtures to fast-only. The existing closure and receiver-policy tests still instantiate actual V5 contracts. Synthetic queue records are isolated adversarial cases, not public receipts, customers or adoption.

The 128-item result is not a guarantee for every uint32 capacity, queue size, fee setting or delivery condition. Candidate public capacity still needs admission/gas-budget review.

## Compile sizes

| Contract | Runtime bytes | Initcode bytes |
|---|---:|---:|
| Work ledger | 4,751 | 5,309 |
| V5 escrow | 12,673 | 18,646 |
| V5 receiver | 2,601 | 21,869 |
| V5 Reactive | 13,694 | 14,005 |

No current web ABI or existing deployment artifact was overwritten. No frontend enablement or signing operation was added.

## Cost interpretation

This change reduces the frequency of waiting-period checks when every queued deadline is distant. It does not establish a measured token saving or lower the worst-case funding requirement automatically. One nearby or repeatedly due booking keeps the shared subscription fast for all jobs. Price changes, origin observations, subscription-switch gas, acknowledgements and backlog still cost money.

The saved [offline report](analysis/renewable-cost-review.json) was regenerated with current input hashes. Its numeric scenarios deliberately remain an explicitly labelled **hypothetical always-Cron100 baseline**, not an adaptive-cost forecast, grant-readiness check or deposit recommendation. No application service-charge average, fresh reserves or transferable old V4 balance is inferred.

Fee-backed commitment accounting remains pending. A future model must bind source runtime, timing profile, queue/capacity limits, current fee observations and outstanding allowances. Do not reuse the V4 finite-lifetime planner for V5.

## Official review and live verification limits

Official [Reactive documentation](https://dev.reactive.network/reactive-contracts) was reviewed on 25 November: it lists Cron100/Cron1000/Cron10000, exact subscription/unsubscription matching and billed subscribed ticks. The known page description of an unindexed parameter conflicts with accepted indexed Cron100 evidence.

The new coarse filters are an indexed-layout candidate. A bounded read-only attempt to inspect current coarser Lasna logs was unavailable from this environment (URLError); it produced no verified log evidence. Coarser event shape, index availability, current cadence and subscription behavior must be independently verified before enabling adaptive mode on any public deployment. Local fixtures do not satisfy that gate.

No contracts were deployed, no testnet funds were sent, no new grant was issued and no V4 evidence was replaced. Constructor choice does not authorize new public operations.

## Review and next step

Replacing round-robin with a heap makes due work take priority and removes full-queue timer scans, but adds storage maintenance and a new constructor parameter to the unreleased V5 candidate. Future operations must use its exact ABI/runtime and verified timer profile. Source attention/exhaustion and accepted-but-undelivered closure semantics remain unchanged.

No new public Execution/Integration credit is earned by fixtures. Prior assessment remains Execution 20/25, Integration 20/25, Usefulness 15/25, Craft 15/25. This local timer step is complete; formal M2 remains OPEN.

Next: implement and verify fee-backed commitment accounting locally, keeping profile selection, public gas/admission settings, live coarse-event verification and any deployment decision explicitly separate. No token top-up is needed to continue that local work.
