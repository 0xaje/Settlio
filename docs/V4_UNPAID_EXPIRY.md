# V4 quote 5 unpaid automatic expiry

Status: authenticated on-chain expiry and both-chain closure verified within scope. M2 remains open. Fresh user WSL CLI reproduction is pending.

| Stage | Public transaction |
| --- | --- |
| Merchant credit | `0xad31dc37dda52adc0e65e0bc0622e8a0f8823a21ef3150716591fd4361e0c470` |
| Creation | `0xe543824cf95ec195efc92a93ba6272cbe37cc2e2577c2b1205e2a3f2a23e8cb3` |
| Indexed network CRON100 | `0x5a9359dc6952863c825777f06443e604ee7918008738491c75ea5a0b7d7db125` |
| Associated Reactive policy request | `0xdc5717617ee33a21c6c28f148a4b01c7a04e542a3253f7421f027839bcafc1cd` |
| Authenticated expiry callback | `0x5788d2770d4a9658ea71472df25a23da6079e881b0b4c5f163f1e92d2c9b17ad` |

Fixed V4 identity: escrow `0x5675C610d6f0aCe9f7933f3584D53dc4F567Dc6B`, Reactive `0xFa1F509E21040bB4fE266B79E9583073914dFe6e`, receiver `0x49ff0a4Bfa918b0576315C31a0bcE561eEBf3Df0`, admission `0x935Ef09F57B68D08fd9Fd315755b7Daf49871486`. Networks are Base Sepolia 84532 and Lasna 5318007.

On 25 November 2026 in Africa/Lagos, creation was at 12:01:46 with payment deadline 12:03:00 and cutoff 12:08:00. Automatic merchant release was false. A real network CRON drives the matching policy request at 12:04:18; authenticated proxy delivery expires the quote at 12:04:20. No exact/general latency guarantee is implied by these observed times.

The original policy event fingerprint was processed. The quote-scoped escrow event history from creation through the pinned observation contains no deposit, asset selection, confirmation, cancellation or participant retry. The destination is Expired, admission job closed, active/reserved zero, quoteCount/admitted five. The source job is registered/closed with nextAt zero, global jobs zero, CRON false and scheduler unpaused. ETH and USDC balances/liabilities are zero. Five of six lifetime admissions are consumed; only one remains and it does not regenerate.

The validator checks grant receipt/calldata/reference and creation binding, the network CRON receipt/input fields, matching policy request, official proxy route and injected authorized Reactive sender, expiry timestamp and terminal events, policy registration observation, admission state, history and custody. V4 uses explicit fixed identities and policy version 4. It does not fabricate a legacy V3 journal to pass the original validator. The V3 CLI retains its strict default journal checks.

## Read-only reproduction

```bash
cd ~/Settlio &&
git pull --ff-only origin main &&
NODE_OPTIONS="--dns-result-order=ipv4first --no-network-family-autoselection" \
BASE_SEPOLIA_RPC=https://sepolia.base.org \
LASNA_RPC=https://lasna-rpc.rnk.dev \
npm run verify:expiry:v4
```

This sends no transaction and needs no key. A successful fresh check atomically updates its local snapshot only after validation. Historical replay is explicit:

```bash
npm run verify:expiry:v4 -- --recorded
```

[Public bundle](../deployments/evidence/v4/quote-5-expiry-verified.json). Collection observed at 2026-11-25T11:14:23.526Z used the actual JavaScript collector with a temporary Python HTTP transport in this executor; the normal CLI uses ethers. Fresh user reproduction is pending. Later legitimate activity can invalidate strict current idle/counter checks without invalidating the accepted historical trace; preserve the bundle.

## Recording provenance

The 50.3333-second user video `20261125-1101-41.9878810.mp4` has SHA-256 `f89a30731e325e47663e852bd3467e66df1cd2be72cc42e5737dccfe4477abd4`. A sampled five-second review shows creation confirmation, quote 5/deadlines, unpaid status and scheduled checks, absence of the quote tab around 30 seconds, and reopening with Expired and scheduler completion later. This is qualified tab-closure/reopening evidence. The file does not continuously capture the full wall-clock waiting interval, so continuous closure across the callback time is not established. See [metadata](../deployments/evidence/v4/quote-5-browser-evidence.json). Raw video was not uploaded to GitHub.

RPC proves the authenticated on-chain trace, not browser actions. A clock-derived UI label alone was not used as expiry proof. Matching request/delivery payloads do not uniquely map protocol return reports. Source observation and current wiring are point-in-time evidence, not guaranteed future funding or delivery. This does not prove a general outage/recovery scenario or every admission/mobile/browser journey.

No payment, cancellation, retry, new credit, funding or deployment was sent by evidence collection. Do not pay or retry quote 5. Remaining controlled recovery, admission/journey review, browser/mobile and final M2 acceptance stay open; no quote-6 credit is implemented here.

## Reader correction after user CLI failure — 25 November 2026

The original user RPC error was hidden by a generic catch and remains unconfirmed. The reader now paginates history in 1,000-block pages, four concurrent calls, through the pinned head (maximum 1,000 pages), failing closed on any failed or malformed page. Network/method and safe codes are reported without provider URLs or raw errors. Proof checks are unchanged. [Fresh alternate-transport read metadata](../deployments/evidence/v4/quote-5-history-read-check.json) confirms 47 pages/four events and terminal closure; this does not prove the original endpoint cause. Retry the same fresh CLI command above and preserve any specific error. Recorded replay remains explicitly historical, not a replacement for successful fresh user reproduction.
