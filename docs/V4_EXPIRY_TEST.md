# V4 quote 5: unpaid automatic expiry

Status: preparation, not live expiry acceptance. M2 remains open. The quote-4 USDC refund fresh Ubuntu CLI passed at 2026-11-25T10:08:50.256Z; user-terminal provenance is recorded separately from the independently collected public bundle.

**Never pay this test quote.** No approval, deposit, cancellation, manual claim or participant retry is part of the normal unattended expiry test. If automation stalls, first collect observations and diagnose; a manual retry changes the evidence scope to recovery and cannot be passed off as an untouched unattended success.

## Credit gate

`plan:expiry:v4` requires exactly four admitted/created quotes, each terminal and closed on destination and source, consumed quote-4 merchant grant with matching confirmed calldata/receipt, no liabilities/custody or active/reserved work, idle/unpaused source and verified current wiring/subscriptions. Fresh conditional funding covers both remaining immutable lifetime admissions; customer principal is excluded. The limit remains six and consumed slots never regenerate.

`grant:expiry:v4` issues one separate merchant eligibility credit when the operator is ready. Its `expiryQuoteGrant` plan and `grantExpiryQuote` saved operation preserve all earlier grants, use the same lock/nonce recovery, and reuse the exact hash on repeat. No automatic funding, quote creation, rolling grant or new deployment occurs. No quote-6 credit is implemented here.

Start with the read-only plan:

```bash
cd ~/Settlio &&
git pull --ff-only origin main &&
NODE_OPTIONS="--dns-result-order=ipv4first --no-network-family-autoselection" \
BASE_SEPOLIA_RPC=https://sepolia.base.org \
LASNA_RPC=https://lasna-rpc.rnk.dev \
npm run plan:expiry:v4
```

## Journey after grant confirmation

Create exactly one unpaid quote with merchant ending 288E, designated customer `0xe84A1B8C20b1E33Fc1D6dD4650Af53783F2911eD`, service **Unpaid quote automatic expiry verification**, total 0.0003 test ETH and deposit 0.0001 test ETH. Leave USDC unchecked and automatic release unchecked; unpaid expiry is independent of merchant-release opt-in. Both date fields must use freshly generated device-local timestamps within the immutable 900-second horizon.

When ready to enter them, use:

```bash
TZ=Africa/Lagos date -d '+3 minutes' '+Payment deadline: %m/%d/%Y %H:%M'
TZ=Africa/Lagos date -d '+8 minutes' '+Full-refund cutoff: %m/%d/%Y %H:%M'
```

These are procedural offsets, not a fixed date to reuse later. Confirm the year, deadline order and remaining future time immediately before creation. Do not create more quotes to recover from a display issue or missing button.

Record the successful creation hash and original full share link. If capturing browser evidence, start recording before creation; show quote ID and deadline, close every initiating Settlio tab, keep a visible clock and the recording running through the wait, then reopen the saved link afterward. Raw continuous capture can exceed the public demo limit; an eventual shortened demo must label cuts/time jumps honestly. Do not claim the raw closed interval from two unrelated clips or RPC alone. No recording has been supplied for this new test yet.

After the payment deadline, wait for genuine network scheduling/delivery. No exact callback latency is promised. An Expired UI label based only on the clock is insufficient evidence; acceptance requires an actual successful authenticated Base Sepolia callback with `QuoteExpired`/terminal policy state, a matching real origin CRON and Reactive request, closed admission slot, source acknowledgement and zero custody/liabilities. Reopening the page is a read, not an expiry transaction.

## Acceptance and remaining limits

Collect the creation event, network CRON, associated reaction, proxy delivery/authenticated sender, terminal destination event, both-chain closure and funding observations with explicit provenance. Keep browser observations separate. Unpaid quotes must never acquire deposits/liabilities. Contract payment expiry still applies if a callback is delayed; existing boundary tests retain their local provenance until separately demonstrated live.

This component does not accept general controlled recovery, admission scale, all browser/mobile journeys, exact protocol return-report attribution or future funding guarantees. Those remaining M2 gates stay open. Creating this quote consumes the fifth lifetime admission; only one then remains. Do not issue any later credit without a separate review.

Validation: full `npm test` passed 182/182 with zero failed/skipped/cancelled; focused model/actual two-chain operational checks passed 9/9. The extended fixture consumes/closes four quotes, refuses pending destination/source work, verifies the separate fifth-credit plan and operation, rejects another signer and edited plan, recovers the same hash without another nonce, preserves all earlier grant records and verifies operation status. Model checks cover both remaining slots, complete ordered prior closures, stale/insufficient observations and unsupported later stages. Local impersonated callbacks and subscription fixtures are not public expiry evidence. Syntax checks passed. No contract/frontend source changed; no new web build claimed.
