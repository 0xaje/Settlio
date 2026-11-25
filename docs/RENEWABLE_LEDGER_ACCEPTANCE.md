# Renewable work ledger — local acceptance

25 November 2026. Standalone first implementation step under [the plan](RENEWABLE_ADMISSION_PLAN.md). **Not integrated, deployed, or usable by the current V4 frontend. M2 remains open.**

## Implemented

[SettlioWorkLedger.sol](../packages/contracts/renewable/SettlioWorkLedger.sol) tracks finite unused grants, destination-active jobs and admitted unsettled work separately. Global work bound is reserved + unsettled. Destination close frees active capacity; only destination close plus a valid receiver acknowledgement frees unsettled work. Both event orders are supported. Duplicate close/acknowledgement is idempotent.

Monotonic merchant grant epochs prevent replay after expiry or replacement. Consumed grants never erase job obligations. Job IDs and job epoch/profile records remain tombstones. totalAdmitted is an audit count without a lifetime admission cutoff. Immutable escrow/sponsor/receiver roles constrain actions. Closing new admission does not stop close or acknowledgement.

The contract has no payable path, customer custody, withdrawal, signer, fee deposit or deployment operation. A profile/observation reference is not a reserve proof. Sponsor may attest dishonestly; no funding sufficiency is enforced by this standalone ledger.

## Actual checks

Command: `node --test test/renewable-ledger.test.cjs test/admission.test.cjs`

Result: **10/10 tests passed**, zero failed/skipped/cancelled. This includes five new standalone ledger tests and the existing V4 admission tests (including their subtests). Isolated ephemeral Anvil accounts and role signers are fixtures, not public Reactive evidence.

Coverage includes delayed/duplicate/early acknowledgement, renewable capacity beyond initial allowance, permanent ID replay rejection, merchant/epoch/profile authorization, expired unused grants at exact boundary, active obligations surviving replacement, global multi-merchant reservation limits, independent active bound, invalid configuration and timestamp/term rejection.

Solidity **0.8.29+commit.ab55807c** compiled the new source successfully. Optimized Cancun output: **4,751 runtime bytes**, **5,309 initcode bytes**, below EVM size limits. No new full 245-test regression, web build, public RPC observation or transaction is claimed. The initial four-test run was interrupted after a test-fixture nonce stall; rejected calls were corrected to static calls and the final combined command above passed.

## Critical review and remaining gates

The receiver is an immutable trusted address here, represented by a local signer in tests. Network-proxy/source identity, deployment/chain domain binding and genuine terminal-event observation belong to the future versioned receiver/Reactive integration. This ledger alone does not verify those facts. An early acknowledgement cannot free capacity without local close, but its authenticity remains the receiver's responsibility.

Escrow integration must make admission/close atomic with valid quote creation/terminal state and preserve customer claims on transfer failure. Current V4 is unchanged; no claim of new-version principal safety is made from a standalone accounting test.

Terminal acknowledgements and their finite retry/recovery budgets, source tombstones against out-of-order registration, fee reconciliation, production quotas/horizons, merchant abuse controls and economic validation remain pending. No reset, timeout settlement or sponsor override was added to bypass remote obligations. Tombstones are retained permanently; storage growth must be accounted for.

Judging: no extra public Execution or Integration credit earned. Prior product self-assessment remains 20/25 Execution, 20/25 Integration, 15/25 Usefulness, 15/25 Craft. This is meaningful local accounting progress, not milestone completion.

Next: integrate the ledger into a separate local escrow version with atomic principal/accounting regression tests, then implement authenticated source closure and bounded recovery. No new deployment or token spend is authorized.
