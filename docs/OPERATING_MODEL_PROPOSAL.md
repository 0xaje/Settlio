# Ongoing admission and funding — proposal

25 November 2026. **PROPOSED ONLY — not approved operating policy, implemented code, or deployment authorization.** Baseline: main d8383ed. Read [current status](CURRENT_STATUS.md) and [master plan](../SETTLIO_MASTER_PLAN.md).

## Decision in plain English

Recommend renewable, prepaid batches of booking permissions, with a limit on outstanding cross-chain work. The platform sponsors automation initially. A completed booking can make room for another only after the destination outcome and source closure are reconciled. Keep customer deposits completely outside this fee budget.

This supports ongoing use without a permanent six-booking ceiling. It does not mean unlimited free bookings: new permissions pause when funding, reconciliation or capacity checks fail. Existing customer refund rights must remain usable.

This document completes the authorized no-spend analysis. Contract implementation needs a separate policy decision; deployment preparation remains cancelled. No new token request is made.

## What exists today

In [SettlioAdmission.sol](../packages/contracts/admission/SettlioAdmission.sol), maxLifetimeAdmissions is immutable and admitted only increases. Closing a job decreases active, not admitted. setGrant also checks reserved + admitted against the lifetime limit. All six V4 admissions are consumed. There is no reset, upgrade or alternate-wallet workaround in the deployed design.

The six successes remain valid: ETH/USDC release, ETH/USDC refund, unpaid expiry, and controlled pause/retry/restore expiry. Reuse their [evidence](V4_ACCEPTANCE.md). M2 formal acceptance stays open; the original strict browser-closure qualifications are retained. This proposal does not waive them, start M3 or turn the submission video into another transaction test.

## Options

| Option | Advantage | Material weakness | Recommendation |
|---|---|---|---|
| Raise the immutable lifetime cap | Small conceptual change | Another eventual hard stop; reserves must cover the entire allowance; does not provide renewable accounting | Reject as permanent model |
| Replace lifetime cap with destination concurrency only | Reuses capacity quickly | Base can close jobs before Lasna observes closure; fast sequential bookings can accumulate remote work | Reject alone |
| Renewable funded batches with outstanding-work accounting | Finite promises and ongoing capacity | Requires reconciliation, monitoring and extra authenticated acknowledgements | Recommend for design |
| Merchant fee credit or per-booking charge | A potential sustainable payer model | Pricing, refunds of unused fee credit and user consent need additional design | Later commercial decision |
| Unrestricted sponsored admission | Simplest creation UX | Unbounded financial exposure and griefing | Reject |

A finite sponsored batch is an economic authorization; concurrency is a separate operational bound. Neither substitutes for the other.

## Proposed lifecycle and invariants

Maintain separate counts for unused reserved permissions, destination-active bookings, and admitted bookings whose source work has not settled. totalAdmitted remains a monotonic audit metric, not a permanent stop condition.

1. The sponsor issues a small finite grant only after pinned, recent observations on both chains and an atomic reservation of its cost allowance. Bind merchant, deployment, chain IDs, epoch, expiry, budget profile and nonce. Do not allow concurrent issuer requests to reserve the same funds.
2. Quote creation consumes one unused permission and creates an outstanding automation obligation. Bind immutable customer, terms, assets and timestamps. Grants expiring later do not terminate accepted quotes.
3. Destination terminal execution immediately updates custody and destination capacity. It must not wait for a cross-chain acknowledgement to reserve or pay an eligible refund.
4. Lasna observes the genuine destination terminal event, closes the job and requests an authenticated acknowledgement to Base. Base releases the remote-work reservation exactly once, only after both its own terminal state and that acknowledgement are established.
5. Renew admission only against remaining funds and outstanding obligations. Delayed/lost acknowledgement causes backpressure on new bookings, not a blind timeout that erases possible remote work.

The acknowledgement is **new proposed functionality**, absent from current V4. It costs source execution and destination delivery; include both and bounded recovery attempts in the budget. A distinct terminal acknowledgement-recovery route is needed: the current live-job policy retry cannot simply be reused after closure.

Duplicate/out-of-order acknowledgements must be idempotent. Forged acknowledgements, wrong chain/deployment/epoch/quote and wrong Reactive sender must fail. Source terminal tombstones must prevent delayed creation or retry events reopening a closed job. Do not delete replay protection merely to reclaim storage; assess its long-term storage cost.

Expired unused grants can return unused reservations. They cannot erase admitted obligations, refund reservations or historical IDs. Abandoned unpaid quotes remain obligations until authenticated expiry and source settlement. Closing admission or losing the issuer service must not block cancellation or permitted refund claims. Recipient transfer failures must preserve claimable funds and must not falsely close accounting.

A sponsor must not be able to withdraw committed automation backing through new application withdrawal features. It must never gain authority over customer principal. However, a shared reserve exposed to external event traffic, protocol fee changes and sponsor-controlled attestations cannot provide an unconditional delivery guarantee; budget and disclose those residual risks.

## Who pays and how issuance works

Recommended first operating policy: platform-sponsored automation with explicit merchant quotas and availability. The customer pays their own wallet transaction gas; the platform funds source REACT and destination native fee credit separately. A deposit in ETH or USDC is refundable principal, never available automation money.

Start with auditable on-chain finite grants and a sponsor-operated monitoring/issuance process. A public self-service issuer later needs merchant authentication, rate limits, transaction reconciliation and persistent reservation accounting. Signed per-quote permits could reduce issuer transactions but add signing-key/API availability and replay risks; they are an alternative to evaluate, not an approved new dependency.

Base does not directly prove Lasna reserves. A funding-observation hash is an accountable sponsor attestation, not a trustless cross-chain proof. Document who signs, observation blocks/hashes, freshness, budgets and grant history. Automatic renewal is not authorized by this proposal. A compromised or dishonest sponsor remains a trust boundary.

Long-term revenue—merchant subscription, separate fee credit or explicit booking fee—requires a separate product decision. Do not silently deduct a service fee from deposits or advertise perpetual free service.

## Cost findings and limits

| Recorded item | Amount | Meaning |
|---|---|---|
| Initial V4 prepaid source deposit | 249 test REACT | Funding, not consumption |
| Source reserves at 25 November 15:53:38.420 UTC / 16:53 WAT | 248.1593678 test REACT | Dated observation, not a fresh balance |
| Arithmetic difference | 0.8406322 test REACT | Checkpoint reserve difference, not audited per-booking cost |
| Callback reserves at that checkpoint | 0.001215459752 test ETH | Separate from 0.001 test ETH callback contract balance |

See [current status](CURRENT_STATUS.md) for provenance and [admission-budget.cjs](../script/admission-budget.cjs) for the existing forecast. The forecast covers six lifetime quotes, four possible attempt batches per quote, 26 callbacks per quote, worst-case source execution, doubled sampled price/cadence, backoff and delivery margin. At the recorded 1,245 source-call allowance and 0.2 REACT modeled unit, it yielded 249 REACT. It was deliberately much larger than observed consumption.

The archived journey bundles establish selected genuine receipts, not an exhaustive billing ledger for every source invocation. Receipt gasUsed × effectiveGasPrice describes transaction-envelope gas; it must not be substituted for, or blindly added to, the application's protocol service charge. No reliable normal-booking average or production price is established here. Deployment, funding transaction gas, older V3 activity and exceptional recovery are separate categories.

Before pricing, build a read-only reconciliation report from complete charged executions and funding/checkpoint records. Deduplicate hashes; identify chain, payer, quote where provable, successful/failed service charges, idle CRON, acknowledgements and unrelated traffic. Report unattributed charges explicitly. No new public booking is required just to analyze existing history.

Official [economy documentation](https://dev.reactive.network/economy), reviewed 25 November, specifies separate balance/reserves/debt, service pricing from gas consumed plus surcharge and coefficient, and charging for failed executions. Positive debt blocks service. Fee reserves are restricted to fees; do not assume old prepaid reserves can be withdrawn or migrated.

## Longer service durations

The 900-second V4 horizon was a test restriction. A useful booking product needs a reviewed duration profile, not repeated manual extensions of creation windows.

Compare 24-hour and seven-day profiles before choosing an initial supported maximum. These are analysis candidates, not approved settings. Constant frequent polling over days can dominate cost. Evaluate documented coarser timers or staged coarse/fine scheduling against a bounded earliest-due queue. Verify actual supported subscriptions and event layouts before choosing them. An unsubscribed scheduler cannot wake itself without a real triggering event.

For each profile model time until cutoff, expiry/confirmation/refund work, retry backoff, processing backlog, acknowledgement recovery and delivery margin. Bound scanning and callback batches. Keep Base timestamps authoritative: delayed automation may postpone action, never permit late payment or early release. State expected lateness honestly; do not promise exact-second execution.

On each chain require available fee resources to cover outstanding obligations + unused grants + proposed new work + explicit contingency. Apply fresh prices/coefficients and stop issuing when stale, indebted, paused, underfunded or unreconciled. A multiplier is a conditional buffer, not protection against arbitrary future prices or indefinite delays. Admission stopping cannot ensure already accepted jobs finish without additional funding.

## Required implementation acceptance before any deployment decision

- Local adversarial tests: grants/epochs/nonces, concurrent issuance and budget reservations, abandoned quotes, forged/duplicate/delayed acknowledgements, source backlog, late registration after closure, bounded terminal recovery and grant expiry.
- Preserve existing payment deadline, cancellation/cutoff races, exact-asset liability, failed-transfer recovery, callback authentication and duplicate-transfer tests.
- Demonstrate bounded pending work when Base closes many bookings before Lasna ingests events. Capacity cannot renew from destination closure alone.
- Test issuer outage, stale observations, fee/debt changes and admission shutdown while cancellation/refund claims remain available.
- Produce reproducible cost models for chosen durations, including added acknowledgements and idle traffic; distinguish measured charges from stress reserves.
- Review the trust model, monitoring, merchant-facing availability and operating runbook. Keep new source local until reviewed; a separate later decision governs public deployment and minimal new integration evidence.
- Preserve all V4 addresses, links, journals and evidence. A changed immutable architecture requires a separately authorized version; it cannot upgrade the exhausted deployment. No fund transfer or reserve recovery is presumed.

## Decision requested and milestone assessment

Approve or revise **the design direction**: renewable platform-sponsored finite batches, bounded unsettled cross-chain obligations, principal isolation and explicit duration/cost profiles. Exact production quotas, service horizon and commercial pricing remain undecided until the model is reviewed. Approval of direction is not approval to spend or deploy.

This documentation adds no execution proof or new test pass. Prior equal-weight self-assessment remains Execution 20/25, Integration 20/25, Usefulness 15/25, Craft 15/25 = 70/100. The proposal addresses a real usability limitation but earns no additional implementation points until built and verified. M2 remains open; M3 full approved interface and M4 hosted release/video remain pending.
