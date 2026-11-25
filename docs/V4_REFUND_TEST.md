# V4 quote 3: controlled ETH refund check

Status: preparation only. No public quote-3 grant, deposit, cancellation or refund is claimed here. M2 remains open.

## Acceptance

1. Sponsor one quote only after quotes 1 and 2 are terminal on both chains, both admission jobs are closed, the previous merchant grant is consumed, all custody/liabilities and active/reserved jobs are zero, and scheduler is idle/unpaused.
2. Budget all four remaining immutable lifetime admissions using fresh network/fee observations. Exclude customer deposits. A shortfall blocks the grant; it never triggers automatic funding.
3. Merchant creates an ETH quote for the designated customer with fresh timestamps within the 900-second horizon. Use total 0.0003 test ETH and deposit 0.0001 test ETH. Do not create it before the credit is confirmed.
4. Customer pays once, then requests cancellation strictly before the full-refund cutoff. Only the designated customer can cancel. Merchant/sponsor does not cancel for the customer.
5. Collect creation, deposit, authenticated confirmation if delivered, cancellation, associated Reactive request, authenticated refund callback, exact original-asset return, cleared liability, admission closure and source acknowledgement. A cancellation request is not a completed refund.
6. Record browser evidence separately from RPC evidence. Close initiating sessions after cancellation and before callback if timing permits; do not mislabel an already-completed refund as a browser-closed execution.

The next live journey is ETH refund. USDC refund, unpaid expiry/recovery, admission refusal/limit checks and browser/mobile acceptance remain separate open gates. Earlier V3 outcomes are retained as V3 evidence, not silently promoted to V4.

## Read-only plan

```bash
cd ~/Settlio &&
git pull --ff-only origin main &&
NODE_OPTIONS="--dns-result-order=ipv4first --no-network-family-autoselection" \
BASE_SEPOLIA_RPC=https://sepolia.base.org \
LASNA_RPC=https://lasna-rpc.rnk.dev \
npm run plan:refund:v4
```

Review `canGrant`, previous grant hash, the two prior closure proofs and remaining lifetime count before the signing step. No key is needed for this plan. A failed or unknown observation is not permission to bypass it.

When ready, the separate `grant:refund:v4` command uses a hidden local sponsor key and saves `refundQuoteGrant` / `grantRefundQuote`. It issues one one-hour merchant eligibility window, not a one-hour quote horizon. Reruns recover the same intent/hash; they do not add credit. Preserve previous grant/funding records and the journal on any stop. Generic later credits and automatic window extension are unsupported.

Do not rerun `grant:next:v4` to obtain quote 3: that command retains the consumed quote-2 operation. Do not fund or redeploy as part of this preparation.

The actual next-grant module is shared between two explicitly bounded stages. The quote-3 stage verifies the confirmed quote-2 grant calldata/receipt and each previous quote on both chains, then binds the closure observations and remaining-budget model into the sponsor reference. Local impersonated callbacks in tests are fixtures, never public recovery evidence.

Validation: full `npm test` passed 166/166 with zero failed/skipped/cancelled. Focused next-grant/actual two-chain operational tests passed 7/7; they execute a separate quote-3 grant, refuse outstanding work and missing source closure, recover the same hash without a second nonce, preserve quote-2/window history, reject another signer and edited plans, and budget the remaining lifetime rather than resetting it. Callback impersonation and protocol/filter fixtures are explicitly local; no public refund/grant proof is claimed. JavaScript syntax checks passed. No contract/frontend source changed in this checkpoint, so no new web build is claimed.
