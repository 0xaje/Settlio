# Renewable fee commitments — local acceptance

25 November 2026. **Local sponsor accounting implemented; no funding, grant or public readiness established. M2 remains open.** Follows [timer acceptance](RENEWABLE_TIMER_ACCEPTANCE.md) and [the cost review](RENEWABLE_COST_REVIEW.md).

## What this implements

[renewable-commitments.cjs](../script/renewable-commitments.cjs) reserves two independent amounts for each unused grant credit and admitted unsettled booking: source fee allowance and destination fee allowance. It has no provider, wallet, signer, calldata generation, funding or grant execution.

A reviewed profile is bound by a canonical SHA-256 profile hash to the exact V5 identity, source/destination chains, four runtime hashes, timer mode, horizon/work limits, fee ceilings/parameters, per-credit allowances, buffers and model-review reference. No production prices, example funded profile or automatic adoption of the partial timer estimates are supplied.

Inputs remain **trusted reader/sponsor attestations**, not independently checked chain proofs. The module does not calculate or prove that a declared allowance covers all future work. The on-chain work ledger still enforces work counts, not monetary solvency; a sponsor could bypass this local guard with a direct contract call. Inspection always returns canGrant: false.

## Reservation and lifecycle rules

| Operation | Accounting behavior |
|---|---|
| Observe | Pin both fee-payer identities, blocks/hashes/timestamps, runtime/configuration and resources; reject regressing, stale, future or inconsistent checkpoints |
| Reserve intent | Hold both full per-credit allowances plus separate buffers before any external issuance; prevent overlaps across merchants and work capacity |
| Reuse intent | Require identical intent fields; refresh/check funding, debt, price caps and expiry without promising the amount twice |
| Confirm grant | Bind transaction reference, merchant, epoch, credits, expiry, profile and chronology to the saved reservation |
| Record admission | Move one unused credit into a quote obligation, preserving the full held amounts; enforce confirmed intent, uniqueness and reviewed horizon |
| Record terminal state | Change status only; do not free fee backing |
| Settle obligation | Require quote/epoch/profile identity, destination ledger settlement, source settlement, zero pending deliveries/backlog and sufficiently recent fee checkpoints |
| Release unused credits | Require reconciled on-chain grant state and complete admitted-quote history; clock expiry or a missing transaction alone is insufficient |
| Renew | Reserve only against current resources minus all remaining commitments/buffers; old jobs keep their allowance until reconciled |

Source availability counts **prepaid source reserves only**. Destination availability counts callback receiver reserves and its own balance. Escrow/customer principal is not an allowed resource field, and mismatched payer addresses are rejected. Source/destination resources are never converted or netted against one another.

Debt, higher gas prices than the reviewed cap or changed coefficient/surcharge prevent new reservations. Recording a genuine settlement is not blocked merely because later balances are low or debt has appeared: that must not erase existing accounting or customer claim rights.

The guard conservatively retains the full original unit allowance until settlement rather than subtracting unverified per-job charges. Since fresh reserves already reflect actual spending, this can hold more than a precise remaining-work model would require. It favors refusing new issuance over pretending unknown funds are free. A later verified charge reconciler could refine this, but no such refinement is assumed.

## Persistence and concurrency

State is separate from existing deployment journals. Only the basename renewable-commitments.local.json is accepted. Initialization refuses overwrite. Existing M1/M2/V4 journals, locks and evidence are untouched.

The transaction API accepts a closed set of accounting commands, not arbitrary mutation callbacks. It acquires an exclusive filesystem lock, checks the expected revision, validates the result, writes a private temporary file, fsyncs and atomically renames it. A competing/stale writer cannot commit a second reservation against the same journal version. Existing locks are never automatically removed by a contender.

Secret-bearing fields and unknown schemas are rejected; symlink journals are refused. Local journals and temporary/lock siblings are ignored by Git. No user production journal was initialized: tests use temporary directories and isolated, explicitly fictitious financial inputs.

Use one authoritative coordinator/journal for each fee-payer deployment. Local file locks are not a distributed database or protection against an operator manually editing files, starting a second independent journal, or bypassing the guard. Profile/identity changes require a reviewed migration that retains all outstanding holds; creating an empty journal against the same funds is unsafe and is not an implemented migration path.

## Actual checks

Command: `node --test test/renewable-commitments.test.cjs test/renewable-cost-review.test.cjs`

**18/18 passed**, zero failures/skips/cancellations: 14 new commitment cases plus four cost-review cases.

Checks include:
- Two merchants cannot promise the same backing; duplicate intent reuse is idempotent and changed intent fields fail.
- Destination shortfall, debt, price/parameter drift, wrong runtime/payer, principal substitution and stale/regressing/inconsistent observations fail closed.
- Grant confirmation, admission identity, bounded terms and event/checkpoint chronology are enforced.
- Terminal state alone, unresolved deliveries/backlog and copied wrong-quote closure cannot release an obligation.
- Unused release requires admitted history; a new epoch cannot consume an old live job's allocation.
- Low balances or later debt do not prevent valid settlement bookkeeping.
- Atomic file updates, private permissions, schema/secret guards, preserved foreign locks and legacy-journal refusal.
- Two actual Node processes race to reserve the same resources: exactly one succeeds, with one saved intent and revision.
- The normal npm inspection entry point returns read-only status without modifying the journal or authorizing grants.

`npm run inspect:commitments:renewable -- /path/to/renewable-commitments.local.json` is inspection only and requires an existing validated local journal. It does not create one or request credentials. No operator needs to run it before such a journal has been intentionally established.

The previous full regression remains **295/295** at b3c9899. No new full-suite, contract compilation, browser check, blockchain RPC observation or live-funding result is claimed for this independent local module.

## Remaining verification boundary

Before this can govern public issuance, implement a verified read-only adapter and reconcile complete history. It must independently validate chain identities, canonical/finalized receipts and block ancestry, runtime/immutable wiring, ledger events/epochs, unused credits, all admissions, source closure/processed history, pending callback deliveries and actual fee resources. Shape checks and evidence hashes here do not establish those facts by themselves.

A real full-obligation model must be reviewed at the price caps and actual shared-timer/work bounds, including origin traffic, retries, acknowledgement tails and contingencies. The partial always-fast cost table is not that model. Adaptive coarse events remain unverified publicly. A profile-review hash is a binding reference, not proof that the model is economically sufficient.

There is no signing integration or public V5 journal, no new credit issued, and no token deposit or deployment. Existing V4 remains exhausted at six lifetime admissions. Existing public proofs do not become V5 proofs through this module.

Judging: no additional public Execution/Integration score. Prior self-assessment remains Execution 20/25, Integration 20/25, Usefulness 15/25, Craft 15/25. This local accounting step is complete; formal M2 stays OPEN.

Next: integrate verified read-only snapshot/event reconciliation against the local V5 stack, retaining the no-spend boundary. A public fee-backed grant and deployment decision remain later, separate gates.
