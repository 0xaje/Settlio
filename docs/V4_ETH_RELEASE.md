# V4 quote 1: ETH automatic release

Scoped live outcome complete; M2 is not accepted in full. See the dated master/progress/acceptance entry for provenance and remaining gates.

| Stage | Genuine transaction |
|---|---|
| Quote creation / admission | [Base](https://sepolia.basescan.org/tx/0x19dc9658753aded4496f6de1ba24781677c66b1b302c93ebe8f73c4ed7ada5fd) |
| Customer ETH deposit | [Base](https://sepolia.basescan.org/tx/0x7f382d7194594201d476139169e38fd5726d21ea07f3c2b230f3e3009625118b) |
| Confirmation request on Lasna | `0xc0fb11a8fa8c8bcbbeb86bdbd1bbac56af8771e5d86d5943f03a6c8ef209f587` |
| Confirmation delivery | [Base](https://sepolia.basescan.org/tx/0xdeb16540981772b9f9993c2527bff85fcefc029b98ce444c309aae24825c4a7a) |
| Network CRON100 | `0xe5d07c0371dcad4787f19e1e86d859e3fd195dded3797745366459ec8e429737` |
| Scheduled policy request on Lasna | `0xdc68ff6e8e966e275c96bb9d3c103fadfbd728651a2ed300508c56ca153793f7` |
| Automatic release delivery | [Base](https://sepolia.basescan.org/tx/0xfae5751d4ada0e304910114e04686fbb0d7d5c27cfea19402ddcced7b21ffff4) |

Lasna explorer: https://lasna.reactscan.net/ — search the exact source hashes above. Release amount 0.0001 test ETH, payment deadline 24 November 2026 19:40 WAT, refund cutoff 19:47 WAT, observed release 19:47:12 WAT. These historical timestamps are not a new quote template.

## Reproduce

Fresh read-only public RPC collection, no key or transaction:

```bash
cd ~/Settlio &&
git pull --ff-only origin main &&
NODE_OPTIONS="--dns-result-order=ipv4first --no-network-family-autoselection" \\
BASE_SEPOLIA_RPC=https://sepolia.base.org \\
LASNA_RPC=https://lasna-rpc.rnk.dev \\
npm run verify:release:v4
```

Archived public bundle replay, explicitly not a new network check:

```bash
npm run verify:release:v4 -- --recorded
```

The normal CLI refreshes the fixed archived quote trail and writes a successful bundle only after validation. It does not discover a different quote or sign transactions. Later unrelated account activity or new jobs can legitimately make its strict single-quote current-state assertions fail; preserve the accepted historical bundle and investigate rather than relaxing checks or promoting a failure to success.

Validation checks origin log/transaction/block fingerprints, both callback configurations and authentication wiring, real indexed CRON origin, consent/deadline ordering, merchant/escrow exact payout deltas, principal coverage, V4 identity/version/gate binding, Admitted/Closed receipts, admission and scheduler closure. The first collection used public RPC through a temporary Python HTTP transport adapter; recorded CLI passed, fresh WSL Node reproduction pending.

## Limits

Matching requests/deliveries are associated, not uniquely mapped by protocol return reports. The observed twelve seconds after cutoff is a single observation, not a latency promise. The supplied recording was sampled: it shows closure/reopening and Released, but not continuous closed-tab wall-clock proof. Browser annotations cannot override the RPC validator. Existing V3 evidence is retained separately; V4 USDC and other acceptance items remain open. The consumed merchant credit is not automatically renewed.
