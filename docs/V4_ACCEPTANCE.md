# Current V4 acceptance checklist

Updated 25 November 2026. This is the current V4 checklist within M2. Historical M1 and V3 proof remains valid for those versions; it does not prove every V4 journey. M2 is open and M3 has not started.

| Gate | Current evidence | Remaining action |
| --- | --- | --- |
| Admitted ETH deposit, confirmation, scheduled release | Quote 1 public trace and successful user CLI; exact payout and both-chain closure | Preserve accepted historical bundle and qualified browser provenance |
| Admitted USDC deposit, confirmation, scheduled release | Quote 2 public trace and fresh user CLI at 08:54:41.984 UTC; exact 1 USDC payout and closure | Preserve accepted bundle; video does not show browser closed before release |
| Eligible ETH cancellation/refund | Quote 3 public deposit/confirmation/cancellation/CRON/refund trace; exact 0.0001 ETH customer return and both-chain closure | Fresh user `verify:refund:v4` passed at 09:39:22.125 UTC; browser closure not recorded. See [ETH refund proof](V4_ETH_REFUND.md) |
| Eligible USDC cancellation/refund | Quote 4 public admitted USDC deposit/confirmation/cancellation/CRON/refund trace; exact 1 USDC return and both-chain closure | Fresh user `verify:refund:v4 -- 4` passed at 10:08:50.256 UTC; browser closure not recorded. See [USDC refund proof](V4_USDC_REFUND.md) |
| Unpaid expiry | Quote 5 actual CRON/request/authenticated expiry; no deposit/retry in history, processed registration, closed jobs and zero custody | Fresh user `verify:expiry:v4` stopped on a generic read failure; paginated reader/specific errors implemented, user retry pending; qualified closure/reopening video. See [proof](V4_UNPAID_EXPIRY.md) |
| Controlled recovery | Prior V3 public result and V4 isolated tests; V4 live acceptance pending | Review the final remaining slot before any new test; distinguish recovery from unattended success |
| Admission and remaining funding | Six lifetime admissions immutable; five consumed; quote-5 grant/consumption proven; its plan budgeted two remaining at issuance | One lifetime slot remains; no quote-6 credit prepared. Fresh funding/recovery review required; capacity/refusal conditions retain local/live provenance |
| Permissions, deadlines, replay and custody | Existing regression tests cover authentication, expiry/cutoff boundaries, cancellation priority, failed transfers and idempotency | Final item-by-item review against deployed V4 and the new journey evidence; fixtures are not public protocol transactions |
| Approval usability and browser/mobile journeys | Fresh-allowance approval correction passes local tests and web build | Retest with an actual browser wallet; complete mobile and merchant/customer journey coverage |
| Browser-closed automation | Qualified quote-1 tab evidence; quote-2 release occurred while open | Preserve limitations; obtain clearly timed closure evidence for outstanding unattended demonstration requirements |
| Documentation and submission | Public repository and scoped receipts recorded | Finish acceptance review, deployed proof details and a public demo strictly under three minutes; no submission-complete claim |

Do not create another quote merely to find a button or repeat proof already accepted. Each live credit consumes finite lifetime capacity. New commands are bounded stages, not automatic recurring sponsorship. Funding estimates are conditional sponsor observations, not guaranteed future delivery or measured production cost.

Current proofs: [ETH refund](V4_ETH_REFUND.md) and [USDC refund](V4_USDC_REFUND.md). ETH/USDC refund user reproductions passed. Next: fresh [V4 expiry CLI reproduction](V4_UNPAID_EXPIRY.md), then controlled recovery and remaining admission/journey review. Do not create another quote yet. Detailed historical ledger: [M2_ACCEPTANCE.md](M2_ACCEPTANCE.md). The master plan remains the implementation source of truth.
