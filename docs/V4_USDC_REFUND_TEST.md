# V4 quote 4: controlled USDC cancellation/refund

Status: preparation, not public refund acceptance. Quote 3's fresh ETH-refund Ubuntu CLI passed at 2026-11-25T09:39:22.125Z with user-terminal provenance. Its independent public bundle remains separate. M2 remains open.

## Credit and funding gate

`plan:usdc-refund:v4` is read-only and requires exactly three admitted/created quotes, all three terminal and closed on both chains, consumed previous merchant grant, zero custody/liabilities, no active or reserved work, idle/unpaused source, and matching confirmed quote-3 grant calldata/receipt. Funding covers all three remaining immutable lifetime admissions under fresh observations; it excludes customer principal. No automatic funding occurs.

`grant:usdc-refund:v4` is the separate hidden-local-key operation, used only when ready after reviewing the plan. It saves `usdcRefundQuoteGrant` / `grantUsdcRefundQuote`, preserves all earlier operations and recovers the identical hash/nonce on repeat. It creates one one-hour merchant eligibility credit; it does not extend the 900-second quote horizon, reset lifetime consumption, create/pay/cancel a quote, or authorize a rolling grant. The merchant credit is asset-agnostic on chain; the operator must choose USDC for this intended test. Wrong asset selection is not a successful USDC test.

```bash
cd ~/Settlio &&
git pull --ff-only origin main &&
NODE_OPTIONS="--dns-result-order=ipv4first --no-network-family-autoselection" \
BASE_SEPOLIA_RPC=https://sepolia.base.org \
LASNA_RPC=https://lasna-rpc.rnk.dev \
npm run plan:usdc-refund:v4
```

Do not reuse `grant:next:v4` or `grant:refund:v4` for quote 4; they recover their original saved intents. Do not top up on the basis of an old budget. A shortfall/unknown observation blocks new issuance pending review. No quote-5 or later credit is supported here.

After another credit is reserved, quote 3's strict *current idle checkpoint* verifier can legitimately fail its reserved/counter assertions. This does not invalidate the accepted historical ETH refund. Preserve its bundle and use `verify:refund:v4 -- --recorded` for explicit historical replay; do not relax the verifier or overwrite evidence to conceal later activity.

## Planned customer journey and acceptance

After grant confirmation, connect the merchant ending 288E and create exactly one new quote for customer `0xe84A1B8C20b1E33Fc1D6dD4650Af53783F2911eD`:

When restarting localhost, stop the existing server with Ctrl+C, then explicitly select V4 so an older `.env` deployment cannot hide the policy controls:

```bash
cd ~/Settlio &&
VITE_ESCROW_ADDRESS=0x5675C610d6f0aCe9f7933f3584D53dc4F567Dc6B \
VITE_BASE_SEPOLIA_RPC=https://sepolia.base.org \
npm run dev -- --port 5173 --strictPort
```

| Field | Value |
| --- | --- |
| Service | USDC cancellation and refund verification |
| Description | Verify an eligible customer cancellation returns the exact USDC deposit once. |
| ETH total/deposit (required form fields) | 0.0003 / 0.0001 test ETH |
| Also accept test USDC | Checked |
| USDC total/deposit | 3 / 1 test USDC |
| Automatic release | Checked |
| Payment deadline / cutoff | Fresh device-local timestamps, payment before cutoff, both within 900 seconds of creation |

Customer must select **test USDC** on the shared quote, approve only the deposit if required, then pay once. Approval is not payment. If allowance is already sufficient, no new approval is required; record actual allowance/deposit evidence rather than inventing an approval receipt. Both wallets still need test ETH for their own transactions.

The designated customer then cancels strictly before cutoff. Capture the actual creation, USDC deposit and cancellation hashes. A cancellation transaction only reserves the refund; acceptance requires a genuine associated Reactive request and authenticated callback, exact 1 USDC transfer back to the original customer, corresponding balance changes, cleared liability and destination/source job closure. Cancellation must prevent merchant payout of the reserved principal. Duplicate/late/delayed/failed-transfer boundaries keep their explicit local/live provenance.

Record any browser closure before the delivery when feasible; if delivery happens while the page is open, state that accurately. Do not claim browser closure from RPC or a later reopening. No public quote-4 grant, deposit or refund is claimed by preparation tests.

This stage uses the existing deployed contracts and token; no code deployment, new asset, custody migration or frontend design change occurs. USDT remains unavailable. Other V4 expiry/recovery/admission/browser acceptance gates stay open.

Validation: full `npm test` passed 174/174 with zero failed/skipped/cancelled; focused remaining-model and actual two-chain operational checks passed 8/8. The extended fixture consumes/closes a third quote, refuses before source acknowledgement or while work is active, verifies the separate quote-4 plan/grant, rejects another signer and edited plans, repeats the same grant without another nonce, preserves all prior intents and checks successful operation status. Earlier closures must be complete, ordered and distinct; stale observations and insufficient reserves block readiness. These are isolated fixtures with explicit local callback impersonation, not public quote-4 transactions. Syntax checks passed. No contract/frontend source changed; no new web build claimed.
