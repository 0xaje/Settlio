# M2 automatic-release live test procedure

Status: PREPARED, NOT EXECUTED. M2 remains open. This procedure does not certify any future quote or browser closure.

## Readiness
Run `npm run verify:m2` and `npm run budget:m2 -- 30` immediately before creating a quote. Require correct deployment/wiring, no debt, an idle/unpaused scheduler and `canStart: true`. The budget is conditional: one quote only; cutoff within 30 minutes from creation; 15-minute delivery allowance; twice fastest sampled CRON cadence; twice current prices; 900000 source gas plus current surcharge; sixteen extra source events; eight destination callbacks at requested 1000000 gas plus surcharge. Higher rates/traffic/delays invalidate it. This is not a protocol guarantee or implemented on-chain admission rule.

The initial independent observation blocked the test: 0.414101 test REACT reserves against 13.6 modeled requirement. The model is deliberately much larger than observed individual block fees. Unspent prepaid reserves remain for later fees; this is not an expected 13.6-REACT charge. Callback funding passed that observation. Source wallet held 8.4928356 test REACT; it could not fund the separately prepared 14-REACT intent plus gas.

## Separate funding intent
`npm run fund:m2` remains the original one-time 1-test-REACT recovery. `npm run fund:m2:release` is a new one-time 14-test-REACT SYSTEM.depositTo(existing M2 Reactive) operation named fundReactiveRelease. It needs the recorded deployer's locally supplied hidden key. Both purposes share the lock and save exact public intent/hash before broadcast. Rerunning a purpose resumes that same hash, never another deposit. Unknown purpose, wrong signer/network, changed creation/wiring or occupied nonce fail closed. Do not edit/delete old intents to top up.

Obtain sufficient test REACT in the deployer wallet first. Official faucet instructions: https://dev.reactive.network/reactive-mainnet. Base Sepolia faucet 0x2afaFD298b23b62760711756088F75B7409f5967, 1 test ETH -> 100 test REACT. A 0.1 test ETH transfer from the deployer is intended to request 10 test REACT; verify arrival before signing the separate funding transaction. This faucet claim is not the SYSTEM reserve deposit. No mainnet token is required.

After funding, verify the genuine receipt and run budget:m2/verify:m2 again. Do not create a quote if the model still fails. A funding receipt does not prove policy execution.

## Quote and customer payment
Once funded and ready, provide fresh absolute Africa/Lagos times from the current clock. For the first ETH release test: merchant ...288E, customer 0xe84A1B8C20b1E33Fc1D6dD4650Af53783F2911eD, total 0.0003 test ETH, deposit 0.0001, USDC unchecked, automatic release CHECKED. Payment deadline should be creation time plus 15 minutes; full-refund cutoff creation time plus 30 minutes. These are planning offsets, not already-set dates. Record actual immutable times, create receipt, policy flag and terms hash before payment. If setup delays invalidate the 30-minute budget, recalculate rather than reuse a stale pass.

The customer reviews/accepts the automatic-release rule and pays through the policy-aware entry point. Capture deposit hash, real Reactive confirmation and Confirmed UI. Do not cancel this quote; that would test refunds instead of release. The agreed cutoff makes the deposit payable, not proof that the service was delivered. Remaining-balance collection is not implemented.

## Browser-closed capture and proof
Record the confirmed quote, its ID, automatic-release terms, cutoff and visible clock. Close BOTH merchant/customer Settlio tabs before cutoff and record their closure; retain the original recording. Keep them closed across cutoff. Leave the development server available; it serves the interface and does not perform on-chain policy execution. Do not send a manual merchant claim, policy retry or any other transaction during the automatic-release observation window.

Reopen after cutoff to inspect read-only state. Require a genuine authenticated callback with Released(quoteId,deposit), correct merchant recipient and same asset, exact principal accounting, cleared liability and terminal scheduler acknowledgement. Independently collect CRON -> Reactive request -> decoded/authenticated Base callback plus actual times, token transfer or native balance evidence. Preserve any delay/failure; a timer/UI label alone is insufficient. If no callback arrives within the modeled delivery allowance, keep acceptance open and diagnose before intervention.

Browser-closure evidence comes from the recording, not retrospective CLI output. Unique retry attribution requires genuine return-report linkage; otherwise preserve the limit. Repeat the required USDC release journey separately after a fresh budget review. Full M2 acceptance also retains operational recovery/cost/journey gates; do not start M3 based only on this procedure.
