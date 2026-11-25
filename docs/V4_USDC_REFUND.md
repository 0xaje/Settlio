# V4 quote 4 USDC refund

Scope: admitted USDC payment, authenticated confirmation, eligible cancellation, exact original-asset refund, cleared custody and destination/source completion. M2 remains open.

| Stage | Public transaction |
| --- | --- |
| Quote-4 merchant credit | `0xd083d363fd6cdfe40c187483f7b5d53e4c9656b14afc3169a1d2a719623dd205` |
| Creation | `0xdf474974bab7427efe7db3dc4d774f7f0fe78f59ca9ce01c130c91fa763f89a6` |
| Exact 1 USDC approval | `0x5b33a769f3969dda1df59fac02ba012f02cec5c54427ccb37035f2b3023a1a01` |
| Exact 1 USDC deposit | `0x45d1ec116a5589e05c19fcb60e3fc7cdb43793962be4c564ee29825d47921213` |
| Deposit reaction | `0xc82350b3056adcd4ef5a449bb7692dfb162a7393033815f4316749b6637fd913` |
| Confirmation callback | `0x4566532304188e5689a86ab2a37f4b8a1ef5f99d42ace62d2fcc2262a5233de3` |
| Customer cancellation | `0x7d10c2c23838bee56bb8becb2558ffacf4ed96f7bbb160da614e842f5ac0514d` |
| Indexed CRON100 | `0x64ee9e8eb784446cf8c0ff5041e377260c56944b53a6540116ebada9921359fe` |
| Refund policy reaction | `0x77a59afba07fdca0115eef2c961c3b23f0eecfaa13ba047413c1961902e83507` |
| Refund callback | `0x47f31f9fee141a75042e6da7aac9e3ab98f7ee2c6a67b89b713f31081c4a8c11` |

Networks: Base Sepolia 84532 and Reactive Lasna 5318007. Deployed V4 identity is fixed by the verifier. The token is issuer USDC `0x036CbD53842c5426634e7929541eC2318f3dCF7e` with six decimals. Selected option 1 is USDC, total 3 USDC and deposit 1 USDC. The creation admission reference binds the consumed merchant grant, and automatic release was explicitly enabled. Cancellation/refund is therefore verified for an opted-in quote, rather than silently changing its immutable policy.

The validator requires successful distinct creation, approval, deposit, confirmation, cancellation and refund receipts. Approval must set exactly 1 USDC for the correct escrow, precede payment in its bound block and contain no USDC transfer. Approval alone did not pay. Deposit and refund each require the exact corresponding token Transfer. Refund-block token balances must show customer +1 USDC and escrow -1 USDC. The source trace requires the exact deposit log fingerprint for confirmation, a genuine associated indexed network CRON for policy execution and the requested/delivered authenticated callback payloads. Native and USDC custody/liabilities, admission active/reserved counts and source jobs must all clear at the pinned checkpoint.

Customer cancellation must precede the recorded cutoff. This individual receipt trace does not by itself demonstrate every deadline race, failed-transfer retry or delayed refund across cutoff. Existing isolated tests retain their local provenance. Outer transaction senders may be wallet routers; participant identity is established through the configured escrow/token events rather than assuming the router is the customer.

Actual times on 25 November 2026, Africa/Lagos: approval 10:59:03, deposit 10:59:21, confirmation 10:59:22, cancellation 11:00:14 and refund 11:00:24. Payment deadline 11:02 and refund cutoff 11:09. This refund occurred before cutoff; after-cutoff reservation safety is not promoted from a local boundary test to this live timing.

## Fresh read-only reproduction

```bash
cd ~/Settlio &&
git pull --ff-only origin main &&
NODE_OPTIONS="--dns-result-order=ipv4first --no-network-family-autoselection" \
BASE_SEPOLIA_RPC=https://sepolia.base.org \
LASNA_RPC=https://lasna-rpc.rnk.dev \
npm run verify:refund:v4 -- 4
```

No key, funding, grant, approval, deposit, cancellation or retry is sent. Fresh verification writes its local successful snapshot only after validation. Explicit historical replay:

```bash
npm run verify:refund:v4 -- 4 --recorded
```

[Full public bundle](../deployments/evidence/v4/quote-4-refund-verified.json). Quote-3 default CLI compatibility is retained; use `3 --recorded` for its accepted historical ETH proof after later activity. Fresh current-state assertions intentionally require the idle quote-4 checkpoint with admitted/quoteCount 4 and no reservation; later legitimate work can invalidate that current check without invalidating archived evidence.

## Provenance and limits

The actual JavaScript public collector observed at 2026-11-25T10:05:03.353Z uses a temporary Python HTTP transport in this executor; the committed CLI uses ethers directly. Fresh user WSL reproduction remains pending. No refund browser video was supplied, so browser closure is not verified. One successful approval is visible in this supplied journey; this is not exhaustive browser/mobile verification of the approval correction. Matching requests/deliveries do not uniquely map protocol return reports. Strict token balance deltas can fail under unrelated same-block activity. No service-delivery, exact-latency or future-funding guarantee is claimed.

No contract/frontend code changed. Four of six lifetime admissions are consumed and do not regenerate. Two remain; no quote-5 credit is implemented or sent here. Remaining V4 unpaid expiry/recovery, admission/journey review, browser/mobile and final M2 acceptance gates stay open.

Validation: full `npm test` passed 181/181 with zero failed/skipped/cancelled. Focused V3/V4 ETH/USDC refund evidence checks passed 26/26; `npm run verify:refund:v4 -- 4 --recorded` passed and syntax check passed. New refusal checks cover altered approval amount/block/order, missing deposit/refund transfers, incorrect token deltas/custody, wrong grant/counters/admission closure, forged callback/CRON route, open source work, late cancellation and changed opt-in. These replay genuine archived receipts and are not additional live transactions. Neither contracts nor frontend changed, so no new web build is claimed. Fresh user WSL quote-4 reproduction is still pending.
