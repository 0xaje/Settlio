# Live on-chain evidence

## M1 · Quote #1 · ETH deposit and booking confirmation
Verified on 19 November 2026 using read-only Base Sepolia and Reactive Lasna RPC calls. This is public-network evidence, not a local protocol fixture.

### Contracts
- Base Sepolia escrow: `0xfD09cf3bfd3aD13a03Cfb499ec18D97d79748c83`
- Base Sepolia callback receiver: `0xAa6126962C923F242ffd01A6736B8d34b310Bfe5`
- Base Sepolia callback proxy: `0x476F44b11F5C942c58f4c8E3d0300E5710743585`
- Lasna reactive contract: `0xd106C554567470b5a8a0894b3A210D175d4fD7BA`

### Transaction trail
| Stage | Network | Transaction | Block | Receipt |
|---|---|---|---|---|
| Customer deposit | Base Sepolia | [0x2c2292c4be6674774a69106c8f516a16409c8c0561b92c718e2024f6dd970b9a](https://sepolia.basescan.org/tx/0x2c2292c4be6674774a69106c8f516a16409c8c0561b92c718e2024f6dd970b9a) | 61029313 | status 1 |
| Reactive processing and callback request | Lasna | [0x40c0f7778a403667cff17a25d1c21dc1a1e01644cb16384afa54f3ba48cda2f8](https://lasna.reactscan.net/tx/0x40c0f7778a403667cff17a25d1c21dc1a1e01644cb16384afa54f3ba48cda2f8) | 8764178 | status 1 |
| Delivered confirmation callback | Base Sepolia | [0x676944ba23ce0dd5983f1ee529178a0367ef986f30be5f9cd26c840379ef636a](https://sepolia.basescan.org/tx/0x676944ba23ce0dd5983f1ee529178a0367ef986f30be5f9cd26c840379ef636a) | 61029318 | status 1 |

### Independently checked links
1. The origin receipt contains escrow DepositReceived(1, 0xe84A1B8C20b1E33Fc1D6dD4650Af53783F2911eD, 100000000000000), at log index 2, plus AssetSelected with native ETH (zero address), option 0. The outer transaction uses wallet execution/relayer infrastructure; its tx.from is not the customer's address. The escrow event identifies the customer.
2. Computing keccak256(abi.encode(uint256(84532), uint256(originBlockHash), uint256(originTxHash), uint256(2))) produces `0x5d0a4f659afc86477f214d2e43b083c728ef050b47fab09e319a53306bdbb314`. This exactly matches ConfirmationCallbackRequested's originLog in the Lasna receipt, with quoteId 1.
3. The same Lasna receipt contains the system callback request for chain 84532, receiver 0xAa6126962C923F242ffd01A6736B8d34b310Bfe5, gas limit 1000000 and confirmBooking(address(0),1).
4. The Base callback transaction targets the official proxy. Its decoded configuration has the same chain, receiver, gas limit and quote ID. The sender slot is rewritten to 0xd106C554567470b5a8a0894b3A210D175d4fD7BA.
5. The successful callback receipt contains escrow BookingConfirmed(1).
6. A fresh getQuote(1) read returned status 3 (Confirmed), native ETH, merchant 0xbf6301D7bca9F23A63A2d1Ed513d5120Dbb2288E, designated customer above, deposit 100000000000000 wei (0.0001 ETH), total 300000000000000 wei (0.0003 ETH). Escrow balance and totalLiability both read 100000000000000 wei. These are point-in-time observations.

Origin block hash: `0x49ef06b489db48cf8af06cd90cadeb86d3fcdf2d28ff8a19a31c312140ed981b`.

### Limits and open gates
- getCallbacks(uint256(reactiveTxHash)) returned an empty array at verification time. The linkage above uses actual receipts, the exact origin-log fingerprint, and decoded requested/delivered callback payloads; the callback index is not claimed as populated.
- User supplied the deployment journal and a confirmed-page screenshot. The transaction trail and current escrow state were independently read via RPC.
- This proves one ETH deposit/confirmation flow. USDC live payment, USDT provenance/support, browser/mobile review, expiry/refund automation and recovery remain pending. M1 is still open.
- No code changes or new test run were required for this evidence-only verification.
