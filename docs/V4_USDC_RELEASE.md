# V4 quote 2: USDC release checkpoint

Status: public deposit, authenticated confirmation, automatic same-asset release and both-chain closure verified. M2 remains open.

## Public trace

Base Sepolia chain 84532; Reactive Lasna chain 5318007. Fixed V4 identity is enforced by `script/verify-v4-release.cjs`.

| Stage | Transaction hash |
| --- | --- |
| Merchant grant | `0x586b1067459f8eb051b2fb68993a48c51ccf072255e3fa9637eafca86c8fd9b1` |
| Creation | `0xe015e59aa98c8956a158bab3ac669b8313087da7f787e66a8e018bad6797c5a0` |
| First approval | `0x4a0dc4b82405a48223d6badf421edb888605b17365a3cee52bf63fcd0a69337b` |
| Second approval | `0xe6339117ced8e8cef31e30fc55c51b148eb3b1f75f61c2700a9a9bbc96f7a2bf` |
| Deposit | `0xeba96a0c27bfaef6c23f345800cdd853a2dc85fbdd413233fbed6591a7d75159` |
| Confirmation reaction | `0xe7341713307ec88417614b23a2fa6b5d4b74c98556719a28b9d9ce3360edc90d` |
| Confirmation callback | `0x282dfd1d28ed6d2e3e3904a0a9944c9228decc4acd36fc9bd85f6bbe8a888a1f` |
| CRON | `0xa8a4309466d72d7cd985825475ec24245c6466821c3898227d022a9f975c45d4` |
| Release reaction | `0x6ae3d03eceba4224ee93dd230a475de8ae5efd2c6caf2151e32edb52bed21680` |
| Release callback | `0xc0525b7d0c4c47adcd4059427aa39118bb085812d911e88c093feacd7b370314` |

Quote 2 selected issuer USDC, 6 decimals, deposit 1,000,000 units (1 USDC), total 3 USDC. Payment deadline was 25 November 2026 09:25 WAT; cancellation cutoff 09:32 WAT. Release occurred at 09:33:41 WAT (08:33:41 UTC), after cutoff. Actual token transfer and release-block merchant/escrow balance deltas each confirm exactly 1 USDC. Both asset custody/liabilities cleared; admission and source jobs closed, CRON returned idle. These are observations, not future delivery guarantees.

The two approvals each set the customer-to-V4-escrow allowance to 1 USDC. The second replaced the first; neither approval transferred USDC. Historical allowance after each was 1 USDC and after the single deposit was zero. This is not a reset-to-zero then approval sequence and not two payments.

## Reproduce without signing

Run after pulling main in Ubuntu-22.04:

```bash
cd ~/Settlio &&
git pull --ff-only origin main &&
NODE_OPTIONS="--dns-result-order=ipv4first --no-network-family-autoselection" \
BASE_SEPOLIA_RPC=https://sepolia.base.org \
LASNA_RPC=https://lasna-rpc.rnk.dev \
npm run verify:release:v4 -- 2
```

Fresh collection writes a snapshot only after all checks pass. It requires archive reads and expects the recorded idle quote-2 checkpoint; later admissions/custody may legitimately invalidate current-state checks. Preserve this accepted historical bundle. Replay does not query current chains:

```bash
npm run verify:release:v4 -- 2 --recorded
```

Evidence: [public bundle](../deployments/evidence/v4/quote-2-release-verified.json), [browser metadata](../deployments/evidence/v4/quote-2-browser-evidence.json). Collection at 2026-11-25T08:45:39.681Z used the real JavaScript collector with Python HTTP transport in this executor; recorded replay passed. Fresh normal ethers CLI reproduction in the user's WSL is pending. No signing key was used in collection.

## Approval correction and limits

Polling previously reset cached allowance to zero during an RPC read, while the approval handler trusted the cached value. Unknown allowance now disables approval and offers explicit retry on read failure. State is bound to wallet/token/spender. The handler reads fresh allowance before sending; sufficient allowance returns without another approval or automatic payment. Deliberate insufficient-positive allowance still follows reset-to-zero then exact approval. This code weakness was found by review; exact historical click causation is not proved.

Local tests include an actual isolated token contract, stale displayed zero with sufficient real allowance, no second nonce increment, deliberate reset path, unknown context and RPC failure. Fixtures are not live integration evidence. Browser-extension/mobile retesting of the correction remains pending.

The 46.4333-second recording shows Released around 12 seconds while the page is still open, then navigation and reopening. It proves UI update/reopening, not browser closure before release. Raw video is not committed. Matching reaction/callback payloads are not unique protocol return-report attribution. No service-delivery, exact-latency or permanent-funding claim is made.

Do not pay quote 2 again. Its credit is consumed and its slot closed. No generic quote-3 grant is authorized by the existing quote-2 command. V4 refund/expiry/recovery/admission and remaining M2 acceptance gates stay open.

Validation for this checkpoint: `npm test` passed 165/165, with zero failed, skipped or cancelled; `npm run build:web` passed TypeScript and Vite production build. Existing >500 kB bundle warning remains. Focused approval tests passed 3/3 and V4 ETH/USDC evidence tests passed 10/10; these are included in the full count. No browser-extension/mobile retest is claimed.
