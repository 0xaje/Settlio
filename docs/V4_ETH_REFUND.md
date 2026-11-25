# V4 quote 3 ETH refund

Acceptance scope: admitted ETH deposit, authenticated booking confirmation, eligible customer cancellation, authenticated same-asset refund and destination/source completion. Whole M2 acceptance remains open.

| Stage | Public transaction |
| --- | --- |
| One quote-3 merchant credit | `0xac55f94d6ad0a08058aa9211e93a14af58e721d22de26044b4903c7b3dae1fe7` |
| Creation | `0xc842c94e1036a3d1190108b7c9205c1986035129a64e6b63231261cac7bd31a2` |
| ETH deposit | `0x05a8c90f18505a83a6409d0d60202e8b33f40737bd9970e7c70d23966a6de77c` |
| Deposit confirmation reaction | `0xf3114a704f13dbbb9743bcbdad1fa179d6450ac063fa50423b9e146679765d5f` |
| Booking confirmation callback | `0x8681c10cea33fa36c0a906cc9195590d9fa3f71b8030296f8a624bb051c94422` |
| Customer cancellation | `0x97a4980d213b96e5cd9e3c354d70062bd1fa025e0efafbbe6f288d0729f3fa6c` |
| Indexed CRON100 | `0xaf8ec945edeedd33a19d8477c79ec0762da5f8a54086d33802e13fd8d39cb2f5` |
| Refund policy reaction | `0x672674d8c0f7c239e44491b857d610c723fbe69121c3e90208478d5d9daee8c3` |
| Refund callback | `0xe97dbaef558927bfed00690711838bb7c2ad543af241be46b796334fd4bab2f8` |

Base Sepolia chain 84532 and Reactive Lasna chain 5318007. The wrapper fixes the same V4 escrow/Reactive/receiver/admission identity as the accepted release verifiers. The grant receipt, calldata and creation admission event bind the consumed merchant credit. User transactions may use a wallet router: creation/payment/cancellation are identified by the configured escrow's receipt events, not by assuming the outer transaction sender is the merchant/customer.

Quote 3 opted into automatic release. An eligible customer cancellation reserved the deposit instead. Deposit was at 10:24:23 WAT, confirmation 10:24:24, cancellation 10:26:33 and refund 10:27:53 on 25 November 2026; cancellation preceded the 10:33 cutoff. The refund validator requires exactly 100000000000000 wei (0.0001 ETH) returned to the designated customer, exact refund-block customer/escrow balance changes, a genuine matching CRON origin and Reactive request, official callback proxy delivery, the authorized injected Reactive sender, matching quote/payload, cleared ETH/USDC custody/liabilities, closed admission slot and idle unpaused source scheduler. These checks establish this outcome, not a universal future execution guarantee. This live refund occurred before cutoff; delayed refund reservation across cutoff remains covered separately by local boundary tests, not asserted as this live timing.

## Reproduce

```bash
cd ~/Settlio &&
git pull --ff-only origin main &&
NODE_OPTIONS="--dns-result-order=ipv4first --no-network-family-autoselection" \
BASE_SEPOLIA_RPC=https://sepolia.base.org \
LASNA_RPC=https://lasna-rpc.rnk.dev \
npm run verify:refund:v4
```

No key, approval, payment or retry is sent. Successful fresh verification atomically updates the local evidence snapshot; failed validation preserves the existing snapshot. Historical replay is explicit:

```bash
npm run verify:refund:v4 -- --recorded
```

The wrapper expects the idle quote-3 checkpoint with three lifetime admissions and no remaining reservation. Later activity can legitimately fail those current-state checks without invalidating this accepted archived outcome. Preserve [the public bundle](../deployments/evidence/v4/quote-3-refund-verified.json).

## Provenance and limits

Public evidence collection observed at 2026-11-25T09:35:45.181Z uses the actual JavaScript collector with a Python HTTP transport in this executor; the normal CLI uses ethers directly. User WSL fresh reproduction remains pending. No browser recording was supplied for this refund: browser closure is not verified. Matching requests/deliveries do not establish unique protocol return-report attribution. Strict block balance differences can fail if unrelated same-block transfers occur. Local evidence mutation tests replay archived public data; they do not create additional live integration evidence.

Earlier setup screenshots show a missing automatic-release option before restart with the explicit V4 address, then a checked option with a malformed cutoff year. The successful creation receipt is authoritative for the final opted-in policy. The earlier wrong/disabled form is not a failed on-chain quote and must not be counted as one.

No contract or frontend code changes are needed for this verifier. V4 USDC refund, unpaid expiry/recovery, remaining admission/journey review and browser/mobile acceptance stay open. No additional payment or cancellation is needed for quote 3, and no generic quote-4 credit is created by these commands.

Validation: full `npm test` passed 173/173, zero failed/skipped/cancelled; focused existing/V4 refund evidence tests passed 19/19, and `npm run verify:refund:v4 -- --recorded` passed. Initial collection stopped at a verifier ABI mismatch (`setGrant` credits were declared uint256 instead of the deployed uint32); corrected before successful validation/snapshot creation. This was a verifier error, not a failed public transaction. All refund authentication/delta checks and V4 admission/closure guards passed after correction. Neither contracts nor frontend changed, so no additional web build is claimed. Fresh user WSL CLI reproduction remains pending.

## Fresh Ubuntu reproduction — 25 November 2026

User CLI passed at 2026-11-25T09:39:22.125Z. [Terminal provenance](../deployments/evidence/v4/quote-3-wsl-verification.json) records the result separately from the independent public snapshot. Earlier pending user reproduction text is historical and superseded. Browser-closure and attribution limits remain unchanged.
