# V5 authenticated closure protocol — local acceptance

25 November 2026. **Local implementation and isolated verification only. Not deployed, not funded and not public Reactive integration evidence. M2 remains open.** Follows [escrow acceptance](RENEWABLE_ESCROW_ACCEPTANCE.md) and [the implementation plan](RENEWABLE_ADMISSION_PLAN.md).

## Implemented path

- [SettlioCallbackV5](../packages/contracts/renewable/SettlioCallbackV5.sol) inherits the pinned Omni AbstractCallback, with immutable proxy and Reactive identity checks on confirmation, policy and closure methods. It creates the V5 escrow with a fixed receiver. Closure acknowledgement also checks destination chain, escrow address and terminal destination status before the ledger validates quote epoch/profile.
- [SettlioReactiveV5](../packages/contracts/renewable/SettlioReactiveV5.sol) subscribes to twelve escrow topics plus the ledger Settled topic. WorkRegistered binds quote identity; terminal observations tombstone policy work; genuine settlement observations stop pending closure work. Delayed registration, confirmation and policy/retry signals cannot reopen a terminal job.
- [SettlioEscrowV5](../packages/contracts/renewable/SettlioEscrowV5.sol) exposes a distinct terminal-only acknowledgement recovery. Only merchant/customer may use it, only while the ledger is unsettled. Its count/cooldown is separate from live policy retries and never authorizes a principal transfer.
- The existing ledger requires both destination close and authenticated source acknowledgement. Quote IDs and epoch/profile tombstones remain retained.

The configured source origin chain/escrow/receiver/ledger form a one-time trust domain. Future operations must verify every address/runtime and all thirteen subscriptions; the existing V4 deployment/verification commands are not V5 commands.

## Acceptance, delivery and capacity

A source acknowledgement request is not destination delivery. When the protocol accepts a request, the source removes that item from autonomous CRON work and sets awaitingDelivery. This prevents an automatic retry tail from continuing behind newly freed Base capacity. Base retains its unsettled reservation until the actual callback succeeds.

If request submission is rejected, source attempts use backoff and bounded queue processing. If submission succeeds but delivery fails or remains missing, a separately authorized terminal recovery signal can add a finite attempt allowance. No owner timeout or counter reset erases the obligation.

Current candidate code bounds are three request attempts per batch and two participant recovery signals, for at most nine application acknowledgement requests per quote. Attempts are cumulative; recovery never resets consumed attempts. Reordered recovery numbers cannot multiply the allowance. These are reviewable local protocol bounds, not approved production pricing/settings or a guarantee about protocol-level delivery charges. Queue processing shares the existing maximum of eight scans and two requests per tick; rejected requests are isolated.

A settled ledger event is consumed by the source if delivered. If that event is delayed, source awaitingDelivery status may lag Base settlement; it does not authorize new autonomous attempts. Already emitted finite historical recovery signals may still be ingested, so the funding model must include them. Lost destination delivery leaves admission backing reserved; customer cancellation/refund claims remain independent.

After all allowances are exhausted, the source marks attention and stops CRON for that item. A missing registration, omitted settlement event or stalled service is not proof of success. Monitor destination ledger settlement, source closure and pending acknowledgement status together; activeJobCount == 0 alone is insufficient.

## Actual checks

Targeted closure command: `node --test test/renewable-closure.test.cjs` — **8/8 passed**, no failures/skips/cancellations before final permission assertions were added. The final full regression below includes those assertions.

Receiver-policy command: `node --test test/policy.test.cjs` — **21/21 passed**, no failures/skips/cancellations. V5 now deploys the actual SettlioCallbackV5 and SettlioEscrowV5 with a real local ledger; it does not reuse a V3 receiver under a V5 label.

Coverage:
- Wrong proxy, Reactive sender, destination chain, escrow, epoch/profile, direct ledger access and premature closure are rejected. Source configuration is owner-only and cannot be repeated; non-provider fee collection is rejected.
- Local expiry receipt -> source observation -> policy request -> authenticated expiry -> closure request -> authenticated ledger settlement -> observed settlement completes. Placeholder sender injection and callback payload/recipient/chain are checked.
- Terminal-before-registration and settled-before-registration preserve tombstones; malformed CRON, forged emitter/chain, duplicate logs and stale deposit/confirmation/policy signals cannot reopen work.
- Request rejection exhausts three attempts; finite real terminal recovery receipts permit at most nine cumulative attempts, then stop. Accepted-but-undelivered requests leave Base backing reserved without an autonomous retry tail.
- A bounded queue isolates rejected submissions and reaches later jobs. Owner pause/resume retains work rather than resetting attempts.
- Existing policy cases run against actual V5: authentication, timestamp boundaries, automatic/manual release, cancellation precedence and failed token transfer recovery.

The closure transport runs on a single isolated Anvil EVM with injected system/proxy fixture code. Some ordering/queue cases deliberately supply synthetic records. Those exercise adversarial local mechanics; they are not public receipts, measured network latency, customer activity or proof of actual network indexing. No raw keys or signed public transactions were used.

Final full repository command: `npm test` — **287/287 passed**, zero failures/skips/cancellations (163.72 seconds). This includes the final permission assertions, eight closure cases, actual V5 receiver-policy checks, and the existing regression/evidence suites. It is isolated regression verification, not fresh public network evidence.

`npm run build:renewable` passed with Solidity 0.8.29; no existing web ABI or deployment artifact was overwritten.

| Contract | Runtime bytes | Initcode bytes |
|---|---:|---:|
| SettlioWorkLedger | 4,751 | 5,309 |
| SettlioEscrowV5 | 12,673 | 18,646 |
| SettlioCallbackV5 | 2,601 | 21,869 |
| SettlioReactiveV5 | 12,189 | 12,441 |

All are below EVM size limits. A nonfatal npm environment proxy warning was printed; compilation succeeded.

## Official documentation review

Reviewed 25 November:
- [Callbacks](https://dev.reactive.network/callback-contracts): both proxy and injected Reactive identity checks are required. The callback receiver uses both pinned library guards.
- [Reactive contracts](https://dev.reactive.network/reactive-contracts): exact subscription criteria, dynamic CRON subscriptions and callback requests. The page still describes an unindexed CRON parameter, conflicting with the previously verified Lasna indexed-number receipts. This implementation retains the accepted indexed-number filter; no new live CRON schema verification is claimed.
- [Networks](https://dev.reactive.network/origins-and-destinations): Base Sepolia 84532 and Lasna 5318007 are listed testnets; Base proxy is 0x476F44b11F5C942c58f4c8E3d0300E5710743585. Fixture chain ID 31337 is not a new public supported network.
- [Economy](https://dev.reactive.network/economy): separate source and destination funding/debt remain necessary; failed execution and subscribed ticks have costs. Fee accounting must include acknowledgement/recovery and residual origin events.

## Critical review, judging and remaining gates

The local transport establishes code-path behavior, not public protocol delivery. V5 runtime identity checks, real filter-index verification, saved operation tooling, actual callback gas forwarded by the proxy and fee reserves have not been independently verified on a deployed V5 instance. Existing V4 proofs do not become V5 proofs.

This change adds acknowledgement traffic and terminal recovery events that the old V4 funding model does not price. No renewable funding admission model, commercial fee plan or long-horizon timer policy is approved/implemented here. Sponsor observations remain attestations, not cross-chain reserve proofs. Retained tombstones and origin subscriptions have storage/fee costs; replaying historical finite signals must be budgeted. Source confirmation submission behavior inherited from V4 and protocol redelivery assumptions also need inclusion in the cost/recovery review.

A successful callback request does not identify a unique public retry delivery; no new return-report attribution claim is made. Continuous browser closure evidence and other original M2 qualifications remain unchanged. No frontend enablement, V4 deployment change, fee deposit or public transaction occurred.

No new public Execution/Integration points are earned by local fixtures. Prior self-assessment remains Execution 20/25, Integration 20/25, Usefulness 15/25, Craft 15/25. Local closure implementation is complete for this step; formal M2 remains OPEN.

Next: read-only cost/reconciliation and admission review for the renewable model, including acknowledgement allowances and realistic horizons. Preserve the cancellation of deployment preparation; no token request or new public proof rerun is needed for that analysis.
