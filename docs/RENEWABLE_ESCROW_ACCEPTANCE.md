# Renewable escrow integration — local acceptance

25 November 2026. **Local implementation only; not deployed, not connected to a new authenticated receiver or Reactive scheduler. M2 remains open.** This implements the escrow step of [the plan](RENEWABLE_ADMISSION_PLAN.md), following [ledger acceptance](RENEWABLE_LEDGER_ACCEPTANCE.md).

## Changes

[SettlioEscrowV5.sol](../packages/contracts/renewable/SettlioEscrowV5.sol) is a separate version derived from the preserved V4 escrow. Creation atomically reads the merchant's current grant epoch/profile and consumes one ledger permission. WorkRegistered records the identity for future source processing. Invalid options revert the entire transaction, including consumed credit and quoteCount.

Successful refunds, claims, expiry and releases close destination active capacity in the same transaction. They leave unsettled work reserved until the ledger receives source closure acknowledgement. Failed principal transfers roll back quote status, liabilities and capacity together. No remote acknowledgement is required for the customer to claim a reserved refund.

Participant confirmation/policy signals share a per-quote bounded retry count/cooldown in the new escrow. Cancellation and refund claims do not consume that budget and do not require open admission. Grant replacement cannot reset a quote's retry counters.

A separate [compile entry point](../script/compile-renewable.cjs) builds the new ledger/escrow without overwriting current web ABI or deployment artifacts. Existing V3/V4 sources, scripts, configuration, links and evidence remain unchanged. The shared local fixture explicitly selects V3, V4 or V5; unknown versions fail.

## Actual verification

Standalone targeted command: `node --test test/renewable-escrow.test.cjs` — **3/3 passed**, zero failures/skips/cancellations.

The three integrated cases verify:
- A genuinely reverted invalid creation restores grant credit and quoteCount; real expiry frees active slots while source work remains reserved; acknowledgement allows a later epoch and third booking.
- Customer refund claims survive closed admission, exhausted retries, the cutoff passing and missing source acknowledgement; stale automatic payout cannot consume the reserved refund.
- Failed token refund and automatic payout preserve principal, liabilities, quote state and active work; later recovery pays exactly once in the original asset, with capacity settling separately.

The existing [asset](../test/assets.test.cjs) and [escrow](../test/escrow.test.cjs) suites now deploy actual V5 as well as V3/V4, covering exact payer/amount/terms, duplicate payments/transfers, deadline equality, cancellation races, reentrancy, fee-on-transfer rollback, no-return tokens and per-asset isolation. These are local adversarial fixtures, not additional supported public tokens or live network proof.

The existing callback-policy suite stays V3/V4. An initial attempted V5 label reused its legacy receiver setup; that label was removed before the final regression. It is not counted as V5 receiver verification. V5 callback authentication beyond the escrow's immutable caller check remains a future integration gate.

Solidity 0.8.29 compilation succeeded through `node script/compile-renewable.cjs`. Ledger runtime/initcode: 4,751/5,309 bytes. Escrow runtime/initcode: 11,586/17,545 bytes. Both are below EVM size limits.

Final full repository command: `npm test` — **272/272 passed**, zero failures/skips/cancellations (158.86 seconds). This run includes the corrected V3/V4-only callback-policy suite, actual V5 asset/escrow fixtures, five ledger cases and three dedicated escrow integration cases. No live-network proof is inferred from the local suite.

## Critical review and remaining work

The local receiver signer represents a trusted role. No new network proxy authentication, source identity/domain validation, source terminal tombstones or bounded acknowledgement-retry protocol has been implemented in this step. An acknowledgement requires the ledger's configured receiver and matching job epoch/profile; this does not independently prove a cross-chain fact.

The ledger and escrow keep principal separate from fee resources, but do not enforce cross-chain funding sufficiency. Sponsor attestation remains a trust boundary. Production quotas, longer horizons, cost reconciliation, finite acknowledgement recovery and fee admission checks remain pending. V5 is not selectable by the current web ABI or existing public operations.

The versioned source deliberately preserves V4 payment logic rather than refactoring deployed-version source. Duplication creates maintenance risk: future security fixes must review both versions. Source/receiver integration must preserve the new WorkRegistered identity and out-of-order terminal semantics.

No public transaction, signer request, new funding, deployment or UI rollout occurred. Existing 6/6 lifetime capacity remains exhausted on V4. Public Execution/Integration evidence is unchanged; dated self-assessment remains 20/25 Execution, 20/25 Integration, 15/25 Usefulness, 15/25 Craft. These local checks do not close M2 or its browser-evidence qualifications.

Next: implement a separate authenticated receiver and Reactive terminal-closure/acknowledgement path with bounded retry accounting, then review economics before any public deployment decision.
