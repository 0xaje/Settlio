# Renewable funding and duration review

25 November 2026. **Offline analysis completed; funding readiness NOT established. No transactions or RPC calls.** Code baseline [40d6829](https://github.com/0xaje/Settlio/commit/40d68293c85649df77de917b7f0b7b1c5987ef9b).

## Recommendation

Do not enable day/week booking horizons by simply increasing the frequent-timer reserve. Optimize long waiting periods and implement commitment reconciliation before public renewable admission. Continue locally without requesting more test tokens. This review does not prescribe a deposit, transfer old reserves, choose production settings or authorize deployment.

Renewable capacity is locally implemented, but fee-backed renewable admission is not complete. A work count/profile hash is not a monetary reserve ledger. M2 stays open; M3/M4 remain pending.

## Reproduce

`npm run review:costs:renewable` prints the [derived report](analysis/renewable-cost-review.json). It reads archived evidence and current source constants, fingerprints nine inputs and its own analysis script, and never creates a provider, wallet, grant or snapshot of current network state. The saved report is deterministic and checked against fresh offline output through the normal npm entry point. All nine input files were also matched byte-for-byte to the current repository's Git blob hashes.

`node --test test/renewable-cost-review.test.cjs` passed **4/4**, zero failures/skips/cancellations. Tests cover conflicting duplicates, invalid unsigned/fee inputs, missing effective prices, integer rounding, scenario units, input hashes, exact saved-report reproducibility and refusal to declare grant readiness.

The prior full regression remains **287/287** at 40d6829; no new full suite or contract/browser build is claimed for this independent read-only analysis tool.

## What existing receipts establish

The six archived V4 proof bundles contain **48 unique transaction receipts** after deduplication. They are a selected sample of successful recorded journeys and controls, not the complete execution history.

| Observation | Recorded result | Interpretation |
|---|---:|---|
| Base receipts with effective gas price | 30 | Selected transaction envelopes, including relayed actions |
| Their summed gasUsed × effectiveGasPrice | 39,822,303,309,830 wei | Envelope execution amount, not Settlio service billing |
| Their separately reported L1 fee | 1,193,545,481,487 wei | Separate receipt field; not an additional application service charge |
| Source receipts paired with a chain-identified transaction | 12 | 1,204,707 recorded gas units in this selected sample |
| Those source receipts missing effectiveGasPrice | 12 | Transaction gasPrice is present in some cases but not silently substituted as a verified effective charge |
| Unclassified or otherwise unpriced receipts | 6 | Preserved as unknown, not guessed from an address |
| Proven complete application fee ledger / normal-booking average | None | serviceChargeWei remains null throughout |

The report retains each receipt hash, field provenance and references; conflicting copies fail rather than being silently summed. It does not attribute bundler/validator envelope costs to the customer or sponsor, reconstruct protocol fees from the wrong gas field, or claim a unique retry-delivery mapping.

The previously recorded initial 249 REACT funding versus 248.1593678 REACT later prepaid balance differs by 0.8406322 REACT. That is a dated reserve difference, not a complete per-booking average, not all project spending, and not a current balance. V3 costs and deployment/funding gas remain separate. Prepaid V4 reserves are not assumed withdrawable or usable by a new V5 contract.

## Timer-only sensitivity

The reference fee/cadence observation is archived at **24 November 2026 19:22:16 UTC / 20:22:16 WAT**. It is stale by design, not a current quote. Its minimum sampled CRON interval is 106 seconds; the scenario uses twice the cadence (53 seconds), twice the recorded prices and maximum source execution gas.

This produces a hypothetical 0.2 REACT source-call stress unit. It does not measure idle gas or imply an idle tick actually costs that much.

| Candidate horizon | Hypothetical continuously subscribed ticks | Timer-only maximum-gas stress at those historical-price assumptions |
|---|---:|---:|
| 15 minutes | 17 | 3.4 test REACT |
| 24 hours | 1,631 | 326.2 test REACT |
| 7 days | 11,412 | 2,282.4 test REACT |

**These are neither full reserve requirements nor deposit recommendations.** They omit configuration, ordinary origin/confirmation/policy traffic, complete backoff/drain tails, recovery events, contingencies and arbitrary future price/cadence changes. They cannot prove affordability or guarantee delivery. A shared scheduler has one timer subscription: do not multiply these ticks blindly by the number of concurrent bookings.

The comparison exposes sensitivity to elapsed waiting time. Actual idle execution gas can be much lower than the maximum used here, but no complete measured idle series is established by the selected proof receipts. Conversely, a larger price increase, delayed processing or extra traffic can exceed these scenarios.

## New acknowledgement allowance

Source constants are read from current code, not copied into a grant command: three attempts per batch, two terminal recoveries, at most nine application request attempts. Each accepted request removes autonomous closure work. Only two distinct finite recovery signals can reschedule after acceptance, so there are at most three accepted requests per quote.

Under the illustrative one-billed-delivery-per-accepted-request assumption, the three destination acknowledgement callbacks have a 42,768,000,000,000 wei stress allowance (**0.000042768 test ETH**) using the historical doubled price and configured callback gas limit. This is an acknowledgement component only, not a full callback reserve. Rejected source request attempts still consume source work; callback failures and possible protocol-level redelivery must be accounted for separately.

Source work can be idle while Base backing remains reserved awaiting delivery. Do not infer fee readiness or full closure from source activeJobCount alone. Already emitted recovery events, terminal observations and settlement events also require source processing and can arrive late.

## Work still required before fee-backed grants

1. **Define duration and lateness profiles.** Compare supported coarse/fine CRON intervals and an earliest-due queue. Retain a genuine wake-up event; unsubscribing every timer cannot wake a future booking by itself. Do not change Base payment/cancellation boundaries or promise exact-second delivery.
2. **Measure what matters from existing history first.** A read-only charge reconciliation should collect the complete relevant execution/funding history, separate service charges from envelope gas, classify idle/due/retry/closure work, and report unattributed amounts. Existing selected receipts do not justify a retail booking price.
3. **Reserve outstanding commitments.** Track money allowances for admitted unsettled work, unused credits, newly proposed work and explicitly budgeted finite tails on each chain. Serialize sponsor issuance and recover saved intents. Reconcile actual spend; a count of work slots alone does not prevent monetary overcommitment.
4. **Stop new issuance when evidence is insufficient.** Require verified new-version identity/subscriptions, recent pinned observations, no debt, reviewed price bounds and sufficient remaining backing. Old V4 initial/remaining-lifetime planners must not be repurposed into V5 readiness.
5. **Publish the trust and recovery model.** Sponsor observations remain attestations. Define what happens after exhausted acknowledgement recovery, service outages, fee changes and issuer downtime. Existing cancellation/refund claims must remain independent of new admission.
6. **Make a later deployment decision from a concrete candidate.** Exact horizon, batch size, sponsorship cost ceiling, fee model, runtime wiring and minimum necessary new-version public proof must be reviewed together. Preserve all old proofs and local journals.

## Sources, limits and assessment

Official [economy documentation](https://dev.reactive.network/economy), reviewed 25 November, distinguishes reserve/balance/debt and application service fees from transaction gas, and charges failed execution. Its pricing inputs are mutable. Official [Reactive contract documentation](https://dev.reactive.network/reactive-contracts) lists coarse CRON intervals and explains that subscribed ticks are billed even when no useful action occurs. No live validation of a new timer configuration is claimed; the known documented-vs-observed CRON layout discrepancy remains recorded in [closure acceptance](RENEWABLE_CLOSURE_ACCEPTANCE.md).

No additional public Execution/Integration score is earned. Prior self-assessment stays Execution 20/25, Integration 20/25, Usefulness 15/25, Craft 15/25. The offline review is complete; production funding admission is incomplete and M2 remains open. The next useful engineering step is a locally tested timer/profile and commitment-accounting design, rather than another token deposit.
