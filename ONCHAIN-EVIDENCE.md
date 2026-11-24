# Live on-chain evidence

## Current acceptance status — 23 November 2026
**M1 COMPLETE for its defined engineering scope.** See [the acceptance checklist](docs/M1_ACCEPTANCE.md) for all completed items and proof provenance. Both ETH/USDC full trails below were reverified successfully from user WSL on 23 November. Their committed JSON files retain their original verification dates; fresh user-local snapshot bytes were not fetched/published. Original creation interruption recovery is user-browser evidence; damaged-terms recovery is isolated integration evidence, not a live callback.

M2 remains open: unpaid expiry, ETH/USDC refunds and ETH/USDC releases are now verified within scoped evidence below. Quote 6 closure is user-confirmed and reopening video-verified; continuous closure footage is unavailable. Release CLI/reproduction and remaining operational gates are pending. M3 full design and M4 submission remain pending. USDT is Coming soon, not an M1 blocker. Subsequent dated sections preserve historical observations; their older open-status statements do not override this current status. Historical receipts do not establish current balances or future delivery. No hashes or snapshot data have been changed in this documentation update.


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

## M1 · Quote #2 · USDC approval, deposit and confirmation
Verified on 20 November 2026 (Nigeria date) via read-only Base Sepolia and Lasna RPC queries. The screenshot showed quote 2 with a 1 USDC deposit. The user repeated the quote-1 ETH hash; the correct USDC trail below was discovered independently from escrow/token and reactive logs.

| Stage | Network | Transaction |
|---|---|---|
| Exact deposit approval | Base Sepolia | [0xbcd77c0570c6d92f62eda63cf76866a57ba775929df3185c5b3a401ee6c44ce2](https://sepolia.basescan.org/tx/0xbcd77c0570c6d92f62eda63cf76866a57ba775929df3185c5b3a401ee6c44ce2) |
| USDC deposit | Base Sepolia | [0x1b410e4e98859bc8bce93bbe7a9beb93b5ac3bc67c25ececeed2b77ba75f290f](https://sepolia.basescan.org/tx/0x1b410e4e98859bc8bce93bbe7a9beb93b5ac3bc67c25ececeed2b77ba75f290f) |
| Reactive request | Lasna | [0x187fc2615773c9725f7d1a7882709a21a1f16102b6bf0cfadba3fd271eaad6d5](https://lasna.reactscan.net/tx/0x187fc2615773c9725f7d1a7882709a21a1f16102b6bf0cfadba3fd271eaad6d5) |
| Confirmation callback | Base Sepolia | [0xb66ec4bc2398038d7f5a9b90746a419e00d43b2ed67fe2ccf551c215edb844b6](https://sepolia.basescan.org/tx/0xb66ec4bc2398038d7f5a9b90746a419e00d43b2ed67fe2ccf551c215edb844b6) |

Verified details:
- Circle-listed token 0x036CbD53842c5426634e7929541eC2318f3dCF7e emitted Approval(customer, escrow, 1000000) in the approval transaction. Its mined log was checked; the approval receipt was not separately fetched.
- Origin receipt status 1, block 61037024; token Transfer(customer, escrow, 1000000) and escrow DepositReceived(2, customer, 1000000), log index 3. AssetSelected locks option 1, USDC.
- Origin block hash `0x13edc949226ad4101e10f8b7684a66835ca524e9cf1f02d1fec3a60574ad13f4`.
- The computed origin-log fingerprint `0xd30625332200f46c0c7af291e43cf872cc79a3bc12ed574723029acc16f54a22` matches ConfirmationCallbackRequested(2, originLog) in Lasna receipt status 1, block 8765638.
- The same Lasna receipt requests chain 84532, receiver 0xAa6126962C923F242ffd01A6736B8d34b310Bfe5, gas 1000000, confirmBooking(address(0),2).
- Callback receipt status 1, block 61037031; transaction targets proxy 0x476F44b11F5C942c58f4c8E3d0300E5710743585. Its input contains the intended receiver and confirmBooking(0xd106C554567470b5a8a0894b3A210D175d4fD7BA,2) payload. The escrow emits BookingConfirmed(2).
- Fresh getQuote(2): status 3, selectedOption 1, total 3000000 units (3 USDC), deposit 1000000 units (1 USDC), designated customer 0xe84A1B8C20b1E33Fc1D6dD4650Af53783F2911eD.
- At verification: escrow USDC balance = USDC liability = 1000000; ETH balance = native liability = 100000000000000. Customer's current token allowance to escrow = 0. The two assets remain separately backed.
- This proves the USDC deposit/confirmation flow, not automatic refund, expiry, remaining-balance collection or mainnet readiness. USDT and remaining M1 checks stay open. No code changes or test rerun in this verification step.

## Reproducible verifier · 20 November 2026
script/verify-quote.cjs successfully reproduced both historical confirmation trails through read-only public RPC calls. Machine-readable snapshots are committed at deployments/evidence/quote-1.json and quote-2.json. The mismatched ETH deposit was rejected for quote 2 and the existing verified snapshot remained unchanged.

This step sent no transaction. Browser-closed unattended expiry/refund and full recovery evidence remain pending.


## M2 network observation — user WSL, 23 November 2026
Provenance: user-pasted diagnose:cron output at 2026-11-23T10:46:19.948Z, Lasna chain 5318007. Head advanced from 9049714 to 9049716. Three disjoint 2,000-block windows returned 20 CRON100-topic logs each from 0x0000000000000000000000000000000000ffffff. Samples show two topics and zero data bytes. Example reported network CRON hash: 0x0f24af7e6085e9adaac783cb88278f8dc783adca62e5c998a575c19d59b697ee (block 0x8a159c).

This is a network CRON observation supplied by the user, not a Settlio policy execution, independently re-fetched receipt or origin-to-callback trace. It exposed an unindexed-layout assumption in our preflight/scheduler. Corrected indexed-layout source passes 80 local tests and builds; corrected live preflight and M2 callbacks remain pending. No new contract address, migration or public transaction was created by the correction.


## Corrected M2 live preflight and planning — user WSL, 23 November 2026
At source a3aef74, user output shows successful preflight:m2 and plan:m2. Both report genuine network CRON100 transaction 0xab6db2a9d9a4b89640185913021f7f2f3ad29301f294ca4ec945fe361df2a4a7, block/indexedNumber 9050100, indexed-number layout and 20 matching recent logs on Lasna 5318007. Base 84532 and USDC prerequisites passed. Provenance is supplied WSL output; these receipts have not been independently re-fetched in this workspace.

The planner output is read-only: it establishes creation estimates/source fingerprints, not deployed M2 addresses or an origin-to-callback trail. No public transaction was sent by these commands. See the M2 acceptance ledger for exact estimates and remaining deployment, scheduled-policy verification and unattended execution gates.


## M2 deployment attempt — outcome unknown, 23 November 2026
User output shows deploy:m2 stopped with a generic error after the local hidden-key prompt. No deployment hash/address or receipt was supplied; verify:m2 did not run. Neither complete failure nor absence of a public transaction is established by that output. Inspect the user's preserved M2 journal via status:m2 before retrying. No new public evidence snapshot is accepted by this note.


## M2 deployment operations — user WSL receipt observations, 23 November 2026

| Operation | Network | Address | Transaction hash | Block |
|---|---|---|---|---|
| Reactive creation | Lasna 5318007 | 0xa2DBeB94c0a151e071A6c29999FE1c6B38217b85 | 0x203cb01ad5e88677db960f65a8cb3324d70e0cb9d838036e9c2abfa26eaf0a75 | 9050953 |
| Callback creation | Base Sepolia 84532 | 0x1E44e729A2f2Fa2e64C1eDb9904A2eCD90C8A781 | 0xdd859f335b11a37e314661b86cec8c3011452c1e5140947ff427aec6d6985b7c | 62551090 |
| Configure | Lasna 5318007 | Existing Reactive contract above | 0x139facceb7a833911d42af29fd6bb2f20509da34bc05bea6a5b795fd7b892dd6 | 9050973 |

User status reports state succeeded for all three operations and escrow 0x1694e56187f9422e364B42af3185d34a0D4b9bc0. Journal exists; lock absent. Provenance: supplied status:m2 output, not independently re-fetched workspace receipts. Null contractAddress on the configuration receipt is normal for a non-creation transaction.

The live index response has Version 12309 and TopicFilters, exposing a top-level casing mismatch in the verifier. Parser correction is script-only and requires no redeployment. The truncated response does not establish Settlio's own ten active subscriptions. Full read-only runtime/wiring/subscription verification and origin/CRON-to-Reactive-to-policy-callback evidence remain pending. No M2 execution proof JSON is accepted from these deployment receipts alone.


## M2 read-only deployment verification passed — user WSL, 23 November 2026
Source 6203604, npm run verify:m2. Provenance: supplied user WSL public-RPC output, not independently re-fetched workspace receipts. Reported policyVersion 3, wiringVerified true, originSubscriptions 10, filterVersion 12314. Quote count/activeJobs zero, paused false, cronActive false (correct idle state).

Custody ETH balance/liability 0/0; USDC 0/0. Reactive fee balance 100000000000000000, callback fee balance 1000000000000000; debt/reserves zero and needsAttention false for both. Addresses/creation/configuration hashes are recorded above. These readings prove the verifier's deployment prerequisites at that observation, not future funding or a successful automated policy callback.

The full deployment/subscription gate is complete with user-verifier provenance. Live dynamic CRON registration/delivery, expiry/refund/release and full merchant/customer browser journeys remain open. No new policy execution JSON or transaction trace is fabricated by this note.


## M2 Quote 1 — blocked registration diagnostic, 23 November 2026
Creation hash: 0x26d54a13b47dafeced742b46ae831140348aa535e7af71e8b35fc547fa1014f6. Video shows unpaid M2 Quote 1, deadline 13:00 WAT and refund cutoff 14:30 WAT on 23 November. User WSL reports one quote, zero jobs and inactive CRON; no principal held.

Independent official Reactive MCP queries confirm the exact PolicyRegistered signature/filter active for our subscriber and one matching origin event. Trace metadata locates that policy event at log index 2 in Base block 62555346. A bounded sequence scan is inconclusive, not a proof of delivery or nondelivery. Two network samples flag SEQUENCER_STALLED / likely with sequence frontier 179629726 unchanged while blocks advance. A separate LOW_RESERVES heuristic requires fee-buffer review; source implements pay(), so zero reserves is not proof of zero available contract funding.

Machine-readable [diagnostic](deployments/evidence/m2/quote-1-registration-diagnostic.json) is explicitly not an origin-to-callback success report. It records source, verdicts, confidence and limits. No registration, CRON wakeup, policy callback or successful expiry is claimed. M2 remains open; previous deployment checkpoints remain completed current observations.


## M2 Quote 1 — registered and real CRON request observed, delivery/debt unresolved
Independent live observations around 15:16 WAT on 23 November supersede the earlier registration-only blockage. Official MCP reports sequencing moving; direct RPC shows jobs(1).registered true, attempts 3 and Base getQuote(1).status 1 (AwaitingDeposit), not expired on-chain.

First proven CRON origin: Lasna block 9058600, hash 0x5f7362f65dea57beb12be0ceb49ea1bb378a2dfe6b6166b4d6edecb76558fb83, log 2. Successful Reactive request transaction: 0x80ff5a138037db5fff54218c6a95487cb7cf868f8f89479e0625b358141bfb92, block 9058601. Two further requests: 0xbb1d31d87ea2d46d884f390242ce03feeae2bf2adc263ad22c2fb6fe988779c3 and 0x07bc0f3491985978a7746a3f141721eb76e853a3b077eebd17986c3e5f64202e. No successful destination callback hash is claimed.

Official health reports debt 0.0147685 test REACT, balance 0.0090906, zero reserves and 11 inactive subscriptions. PaymentFailure/BlacklistContract hash 0x84cc66b427da3d9b5852468bd9d1813303bc87ed08567c7ee88da061ecbe30ce at block 9059001. The trace service cannot prove delivery because no posted callback result was found; Base quote remains unchanged.

See [recovery diagnostic](deployments/evidence/m2/quote-1-recovery-diagnostic.json) for raw direct state, request logs, provenance, verdicts and limits. It is partial live evidence, not full-loop success. fund:m2 is tested local reserve-recovery tooling; its 1-test-REACT operator payment has not yet been sent or accepted as live proof. Original quote deadlines remain 13:00/14:30 WAT; they are not rewritten.


## M2 Quote 1 authenticated on-chain expiry — independently verified
Funding: 0xaaa3863b906620ce06546e69fd288c4b51deae460da3f6e958c0d06d14a68282, Lasna block 9062289. Independently verified status 1, 1 test REACT, SYSTEM.depositTo targeting the recorded M2 Reactive address. Debt zero and active subscriptions confirmed subsequently; reserve amounts change as fees are charged.

Creation: 0x26d54a13b47dafeced742b46ae831140348aa535e7af71e8b35fc547fa1014f6. Its PolicyRegistered fingerprint is processed on the scheduler.
Matching real CRON: 0xbf44cf5d4ddd5bc0a10ef3a9e30180c80d1e997503f232585a8522a2b9732bdb, Lasna block 9062300, log 2.
Associated matching reaction/request #4: 0x26d506ff287ed32a7e011323b7a567f13a4864af46acdc2519bfdbfcf7e0f7ff, block 9062301.
Successful Base callback: 0x547bbbf96a201348cf818f4dcf97a55dacb9403b24892009d152c2e219064899, Base block 62612635, 14:33:15 UTC / 15:33:15 WAT on 23 November.

Decoded deliverCallback targets the configured receiver with processPolicy(recorded Reactive,1); immutable proxy/sender/escrow getters match. Its receipt emits QuoteExpired(1) and PolicyChecked(1,6); direct quote status is Expired and job closed. The original 13:00/14:30 WAT terms remain unchanged. This was delayed completion after fee recovery, not exact-time performance evidence.

[Expiry proof](deployments/evidence/m2/quote-1-expiry.json) and [funding proof](deployments/evidence/m2/funding-recovery-1.json) include real public data and validation results. verify:expiry reproduces the scoped checks. Independently fetched responses passed the validator; user WSL CLI collection still needs reproduction because workspace Node RPC transport failed. Eight tampering/historical-evidence checks and full 95-test suite pass; unit replays are not fresh live evidence.

Retry attribution is not unique: identical request payloads and missing return-report mapping prevent claiming request #4 specifically delivered this callback. Browser-closed operation was not recorded. Missing CallbackPosted results did not mean Base delivery failed. M2 refund/release and remaining browser/operational gates are still pending; no overall M2 completion is claimed.


## User WSL reproduced full expiry verification — 23 November 2026
After pulling 8107f00, user verify:m2 and verify:expiry both succeeded. Result verifiedAt 2026-11-23T14:55:21.519Z: quote-linked authenticated live expiry, outcome Expired, schedulerClosed true, associated candidate attempt 4, uniqueRetryAttribution false and browserClosedEvidence not recorded. Existing published receipt bundle retains its historical collection timestamp; a newer user-local result is not fabricated into it.

User current observations: filterVersion 12401, ten origin subscriptions, quoteCount 1, zero jobs, CRON inactive, unpaused; zero ETH/USDC custody/liability, zero fee debt. Reactive reserves 907803600000000000 and balance 9090600000000000; callback balance 999354797200000. The terminal idle state is expected after closure. CLI reproduction gate is complete; browser-closed evidence and other M2 flows remain pending.


## M2 Quote 2 ETH cancellation/refund checkpoint — 23 November 2026
Independent read-only Base Sepolia/Lasna RPC collection and offline receipt/calldata/accounting assertions passed at 2026-11-23T15:21:49.670Z (16:21 WAT). Public raw receipts, transactions, CRON, current state and refund-block balance observations: [quote-2-eth-refund.json](deployments/evidence/m2/quote-2-eth-refund.json).

| Stage | Network | Successful transaction |
|---|---|---|
| Creation | Base Sepolia | 0xe4d625cd71e2823c12b2e3b84c74c27b6e4fd98df8e9fdb292005777c59f08f3 |
| Customer ETH deposit | Base Sepolia | 0x75e981f373a8c963fea6f8ca2a8cb5d2b9174262e78dcf3be36ddf8b115cebd9 |
| Confirmation reaction | Lasna | 0x80beb31fd0ddab481bb6a260273336d0c574c07846bdffc2d9eecbbe7b441d9d |
| Confirmation callback | Base Sepolia | 0x20f380c2e345e9cfce5a5206e3d85fb6483e7518dcf52836073f2aa8562c0bae |
| Customer cancellation | Base Sepolia | 0xaa2305dcd6faaed2d89043c7af31e7d81cec7196de9e79013c82a27a996f2518 |
| Network CRON | Lasna | 0x219fbd45f8445d30233eaf625941a2972e82b5e486c90cf68faf1fe005645c29 |
| Associated refund request, attempt 1 | Lasna | 0x7a7b4f77991e6bedf11211479e6ab541e3dcf8d498df95fa86a3ca8121e0ae8d |
| Authenticated refund callback | Base Sepolia | 0x282cbdf95ad6e2cc838799c44f59ad6172bda7be87d43632520cf5488b3aba0a |

Quote terms: total 0.0003 test ETH, deposit 0.0001; payment deadline 23 November 17:00 WAT, refund cutoff 19:00 WAT, automatic release false. User recording shows the created unpaid quote and matching details. Deposit event identifies the designated customer even though the outer transaction is wallet/relayer execution. Confirmation reaction trigger binds the actual deposit log/fingerprint. Refund reaction trigger binds the real indexed CRON receipt; its successful receipt requests processPolicy(address(0),2) through SYSTEM. Both destination calls decode to the correct proxy, receiver, authorised Reactive sender and quote. Current immutable wiring independently matches.

Cancellation accepted at 16:15:28 WAT; refund callback at 16:16:37 WAT emits Refunded(2,100000000000000) and PolicyChecked(2,5). Current quote status is Refunded. Across the refund block, customer ETH increases by exactly 100000000000000 wei and escrow decreases by the same amount; these are block deltas, not internal execution traces. Current native escrow balance/liability are both zero. Scheduler job closed, nextAt zero, active jobs zero and CRON false. These are dated observations, not guarantees for later quotes.

Checkpoint COMPLETE for this live ETH confirmation/cancellation/authenticated refund outcome and current accounting/terminal scheduler acknowledgement. Browser closure was not recorded; do not claim browser-closed acceptance. Matching request is independently verified, but unique retry attribution/return-report mapping is not asserted. A reusable refund CLI and user WSL reproduction remain pending. No new code, contract/frontend build or test-suite run is claimed; prior 95-test baseline stands. No assistant broadcast or new deployment.

Judging assessment: Execution — genuine successful destination confirmation/refund and matching Reactive requests; Integration — CRON drives an authenticated refund without a separate customer refund transaction; Usefulness — eligible cancellation returns the exact deposit; Craft — public receipt/accounting evidence with explicit limits. Overall M2 NOT ACCEPTED. USDC refund, automatic release, browser-closed journeys, operational cost/admission and remaining recovery/reproducibility gates remain open. Next: create a fresh USDC-enabled quote, verify its creation, then select USDC for the customer payment.


## M2 Quote 4 USDC refund checkpoint — 23 November 2026

**COMPLETE for this live USDC deposit/confirmation/cancellation/refund outcome; M2 NOT ACCEPTED overall.** Independent read-only Base Sepolia/Lasna collection and offline assertions passed at 2026-11-23T15:52:22.293Z (16:52 WAT). Raw public receipts, transactions, CRON, state, token balances and current fee-health response: [quote-4-usdc-refund.json](deployments/evidence/m2/quote-4-usdc-refund.json).

| Stage | Network | Successful transaction |
|---|---|---|
| Quote creation | Base Sepolia | 0x9523727d0d08fb8c5f2876e01e7a9147bab4ec7618b5cbc30f759eefc99c2184 |
| Exact 1 USDC approval | Base Sepolia | 0xba7af87415a6ef0ae09e05b94c21a822907a70cb919281a47d1f60ac17ac6b18 |
| 1 USDC deposit | Base Sepolia | 0xf73bc4934cc72975a631a1b0009a5ad8dbb86045af160a4be7b2c3a8188be9ec |
| Confirmation reaction | Lasna | 0x33fd3cdc67297891aac9ca913ce5e3748e76273066ad1edd23aee48fd6a9ff65 |
| Confirmation callback | Base Sepolia | 0x749bb60a090ee4114d231f751233ac4621278038a1b0e1aaa22157b752094242 |
| Customer cancellation | Base Sepolia | 0xd36f969d4f75aabb7c963893fcc0e65a3cf9ee61e54e50569b876035d20e8315 |
| Network CRON | Lasna | 0x6d1d2ae270fece57ced0402d5292a2b5e9fe4207aff311db19420794054523bb |
| Associated refund request, attempt 1 | Lasna | 0xbfd291478cfd1ec58b69a6fda7c47e1ea94451bb034cd17e4243c18a497cf839 |
| Authenticated refund callback | Base Sepolia | 0x08c07b406bf0c2850094e8b8d7fef180adf22ff24645cf174161f0771dd03747 |

Quote 4 used issuer-listed Base Sepolia USDC 0x036CbD53842c5426634e7929541eC2318f3dCF7e, option 1, six decimals: deposit 1000000 units (1 test USDC), total 3000000 (3). Payment deadline 23 November 18:00 WAT, full-refund cutoff 20:00 WAT, automatic release false. Approval alone was separate from the mined token transfer/deposit. Deposit reaction binds the actual origin log/block/hash and its fingerprint. Confirmation delivery decodes confirmBooking(authorised Reactive,4) through the official proxy and configured receiver.

Cancellation succeeded at 16:47:27 WAT, before cutoff. Refund callback at 16:48:23 WAT decodes processPolicy(authorised Reactive,4); its successful receipt contains the issuer token Transfer(escrow,designated customer,1000000), Refunded(4,1000000) and PolicyChecked(4,5). The associated successful Lasna request is driven by the real indexed CRON receipt and requests the matching chain/receiver/payload. Current immutable wiring matches. No protocol return-report mapping/unique-attempt attribution is asserted.

Across the refund block, customer USDC increases by exactly 1000000 units and escrow USDC decreases by exactly 1000000. Current USDC escrow balance/liability are zero; native balance/liability also zero. Quote is Refunded; scheduler job registered/confirmed/cancelled/closed, nextAt zero, active jobs zero, CRON false. Block deltas corroborate the explicit token transfer; current reads are dated observations, not future capacity guarantees.

Official get_rc_health at 15:51:18 UTC reports HEALTHY/proven, zero debt, about 0.414101 test REACT reserves and 10/10 active origin subscriptions. Idle CRON being unsubscribed is expected. Reserves have decreased since funding recovery, so cost/admission and sufficient funding for the next timed release remain open. The existing fund:m2 command resumes its saved one-time operation; do not edit the journal or assume rerunning it creates a fresh top-up.

Verification was read-only historical/live evidence inspection with assertions, not a new contract/frontend change or test-suite run. Prior 95-test baseline remains historical. Browser closure not recorded; reusable refund CLI, WSL reproduction and full browser-closed acceptance remain pending. No assistant transaction or deployment. Mistaken payment tests are excluded from accepted USDC evidence.

Judging: Execution — actual confirmation/refund receipts and matching Reactive requests; Integration — meaningful CRON-triggered same-asset refund; Usefulness — designated customer receives the exact cancelled deposit; Craft — inspectable public token accounting and explicit evidence/funding limits. Next: complete reproducible refund tooling and fee-cost checks before a consented automatic-release/browser-closed live test. Remaining release/recovery/journey gates keep M2 open; M3 has not begun.


## M2 reproducible refund verification and fee observations — 23 November 2026

Added key-free `npm run verify:refund -- 2` and `-- 4` for the two accepted M2 refund trails. Default mode re-fetches public Base/Lasna receipts, transactions, network IDs, exact origin/CRON data, historical blocks/balances, callback authentication and current quote/accounting/job observations. It writes a separate `quote-ID-refund-verified.json` only after validation; original raw snapshots remain unchanged. It contains no signer/broadcast/funding path. `--recorded` explicitly replays the committed public bundle without RPC and identifies that mode/source observation time.

Checks bind deposit event/fingerprint and request to the actual confirmation, and real indexed CRON/request to authenticated processPolicy delivery. They enforce quote/customer/asset/amount, issuer-USDC approval/transfers, successful matching receipts/transactions, deadline/cancellation/order, requested/delivered payloads, refund-block deltas, custody coverage and terminal scheduler acknowledgement. Deposit notifications use opcode 3; CRON uses opcode 2. An initial over-strict shared-opcode assumption was caught against real evidence and corrected before commit. Unrelated same-block transfers can cause strict balance-delta verification to fail; this is an explicit conservative limit, not permission to fabricate a pass. Current unrelated quotes may have legitimate nonzero liabilities/active jobs; only the target job must be terminal and aggregate balances must cover liabilities.

Fresh collection using the actual new collector with independently fetched Python HTTP RPC responses passed for ETH at 2026-11-23T15:58:31.758Z and USDC at 15:59:29.018Z. Both saved namespaced verified bundles include pinned observation block numbers and real historical block data. This validates the collector/validator with live public responses; it is not a claim that the workspace Node HTTP transport or the user's full WSL CLI ran successfully. User WSL reproduction remains pending. Recorded CLI replay passes for both. Browser closure and unique retry attribution remain unproven.

Validation: full local suite **107 passed, zero failures/skips/cancellations**; after final approval/native-coverage guard review, all **12 focused refund tests** pass again and USDC recorded CLI replay passes. Tests replay genuine archived public evidence and reject tampered receipt/network/deployment/proxy/sender/origin/amount/transfer/timing/accounting/job data; they are not new live integration transactions. Early test execution before the USDC bundle finished collecting failed for a missing file; after actual collection, the complete tests pass. No contract/frontend source or bytecode changed, so no new contract/frontend build is claimed.

Fee review: [fee-observation-2026-11-23.json](deployments/evidence/m2/fee-observation-2026-11-23.json) contains actual historical SYSTEM reserve reads, calldata, block numbers and current fee parameters. Subscriber reserve debits across the accepted USDC confirmation/request blocks are **0.0299719** and **0.0168036 test REACT** respectively. These include all subscriber activity in those blocks and are not isolated transaction prices or complete per-quote costs. Lasna effectiveGasPrice is null on these receipts; no gasUsed-times-price figure is invented. Current observed reactive coefficient 1000/1000, surcharge 100000 gas; Base proxy coefficient 1100/1000, surcharge 80000 gas. Reserve observation 0.414101 test REACT; Reactive and callback debt zero. Rechecked official economy docs: configured surcharge/coefficient and price determine charging; zero debt and positive reserves do not guarantee future delivery. Protocol parameters can change.

Execution/Integration: real ETH/USDC refund trails independently re-collected and checked, with replay and tamper rejection. Usefulness: exact deposits returned to designated customers without a separate refund transaction. Craft: reproducible public CLI and preserved provenance; WSL transport reproduction, complete cost/admission budget and browser-closed/automatic-release evidence remain open. **M2 NOT ACCEPTED.** No new quote, payment, top-up or deployment by the assistant. Complete user key-free refund reproduction, then resolve sufficient separate fee budget before the next explicitly consented timed-release test; do not treat this partial fee review as an admission gate.


## M2 refund CLI reproduction complete — user WSL, 23 November 2026

User pulled bf81aae and successfully ran both default live refund commands, followed by verify:m2. Quote 2 ETH verifier result verifiedAt 2026-11-23T16:02:51.179Z (17:02:51 WAT); quote 4 USDC result 16:02:58.146Z (17:02:58 WAT). Both report Refunded, schedulerClosed true, exact refundUnits (100000000000000 wei ETH / 1000000 USDC units), current asset balance/liability zero. **Full user WSL refund CLI reproduction COMPLETE.** This closes the former transport/reproduction gate. Provenance is user-supplied successful terminal output, not independently fetched bytes of the newly written user-local snapshots; published bundles retain their genuine earlier verification dates.

The following verify:m2 output reports policyVersion 3, wiringVerified true, ten active origin subscriptions, filterVersion 12606, quoteCount 4, activeJobs zero, CRON false, paused false. ETH and USDC custody balance/liability are all zero. Reactive debt zero, reserves 414101000000000000 (0.414101 test REACT), balance 9090600000000000. Callback debt/reserves zero, balance 884378354010290 wei ETH. Idle CRON is expected after terminal acknowledgement. These are user-reported point-in-time observations, not future funding guarantees.

uniqueRetryAttribution remains false and browserClosedEvidence remains not recorded. Do not retroactively claim either from CLI success. No code/build/test rerun, deployment, quote creation or funding transaction in this documentation-only update; prior full 107-test and final 12-focused-check results stand. Historical failures remain preserved.

Judging: Execution/Integration — real ETH/USDC refund outcomes now reproduced by the user through the full read-only CLI; Usefulness — same-asset customer recovery supported by actual events/accounting; Craft — commands and evidence are reproducible, while full operating-cost/admission and browser-closed/automatic-release/recovery gates remain open. **M2 NOT ACCEPTED; M3 pending.** Next: establish a sufficient separately funded budget for the timed automatic-release test and an explicit browser-closure capture procedure before creating the next quote. Do not rerun the saved one-time fund:m2 intent expecting a new deposit or alter its journal.


## M2 conditional release budget and separate funding intent — 23 November 2026

Implemented read-only `npm run budget:m2 -- 30` for one isolated release test with cutoff no later than 30 minutes after creation and a fixed 15-minute delivery allowance. Requires Base/Lasna IDs, idle/unpaused scheduler, no fee debt, fresh RPC heads and at least three recent genuine indexed CRON100 observations. It models twice fastest sampled CRON cadence, twice current gas price/basefee, the 900000 source protocol gas cap plus configured surcharge, sixteen extra source events and eight destination callbacks at the configured 1000000 requested gas plus surcharge. It re-reads source/destination coefficients, surcharges and funds. This is a deliberately conservative conditional stress scenario, NOT a fee prediction, protocol guarantee, complete operating-cost acceptance or an on-chain admission control. Concurrent activity, higher rates/parameters/delays invalidate it.

Fresh independent actual collector via Python HTTP public RPC passed with `canStart: false`. [release-budget-before-funding.json](deployments/evidence/m2/release-budget-before-funding.json) records actual sampled minimum CRON 105 seconds, modeled tick 52 seconds, 52 ticks plus 16 extra calls, modeled source requirement 13.6 test REACT against 0.414101 prepaid reserves (shortfall 13.185899). Destination requirement 114048000000000 wei ETH is covered by observed callback balance 884378354010290. Source/destination debt zero. Independent deployer balance read returned 8.4928356 test REACT, insufficient for a 14-token reserve payment plus gas. No full Node/WSL budget CLI reproduction is claimed yet.

Prepared `npm run fund:m2:release`: a separate fixed 14-test-REACT SYSTEM.depositTo(recorded existing M2 subscriber) operation `fundReactiveRelease`. Original `fund:m2` remains the 1-test-REACT recovery and its existing saved hash is preserved. New purpose shares the M2 lock, verifies schema/owner/network/source creation/immutable target wiring, saves its unsigned public intent/hash before broadcast and resumes that same hash on rerun. It neither creates arbitrary top-ups nor edits old intents. Safe stage/status reporting includes the new operation. This is implemented local tooling, not a new live deposit or authorization to claim funding succeeded.

Validation: six focused budget/funding checks passed; full suite **112 passed, zero failures/skips/cancellations**. Isolated real local-chain fixture verifies the new 14-token deposit is distinct, resumes without another transfer, preserves the original funding record/hash and does not persist keys. Pure budget tests reject low source/destination funds, debt, occupied/paused state, wrong networks, missing/nonmonotonic cadence and invalid horizon/rates. They are fixtures, not live funding proof. Initial full-test command ran outside the repo and exited before tests; corrected repo-root run passed all 112. No contract/frontend source, deployment or bytecode changed; no new build claimed.

[Release test procedure](docs/RELEASE_TEST.md) is PREPARED / NOT EXECUTED: fresh absolute WAT payment deadline/cutoff after funding; explicit automatic-release consent; actual customer deposit/confirmation; recorded closure of both app tabs before cutoff; reopen for read-only checks after; no manual merchant claim/retry during observation. Prove same-asset deposit goes to merchant, liability clears and scheduler closes using genuine CRON/request/authenticated callback. Remaining balance collection is outside current build. Browser closure cannot be inferred retrospectively.

Official economy and faucet sources rechecked: https://dev.reactive.network/economy and https://dev.reactive.network/reactive-mainnet. Base Sepolia faucet 0x2afaFD298b23b62760711756088F75B7409f5967 exchanges 1 test ETH for 100 test REACT. Next user action is a 0.1 test ETH faucet request from the deployer (expected 10 test REACT), verify arrival, then explicitly run the new hidden-key reserve operation and rerun budget/verify:m2. No faucet/reserve transaction, key entry, new quote or automatic release occurred in this step.

Judging: Execution/Integration — budget reads are real but release/funding success still pending; Usefulness — avoids starting a timed journey with an unexplained fee shortfall; Craft — explicit scenario limits, separate recoverable intent, tested duplicate safety and closure procedure. M2 NOT ACCEPTED. No M3 work.


## M2 release-test funding verified and WSL budget pass — 23 November 2026

**COMPLETE: separate reserve deposit receipt and user WSL budget-command reproduction.** Independent Lasna receipt/transaction fetched at 2026-11-23T16:19:03.080930Z confirms successful transaction 0x8a0f11608a458b9e88a1da0ebdb98cc3436493921f9335da8cbef3d26b51f7cc, official SYSTEM recipient, recorded deployer sender, chain 5318007, value 14 test REACT and decoded depositTo(existing M2 Reactive). Public evidence: [release-funding-verified.json](deployments/evidence/m2/release-funding-verified.json). The user signed this operation; no assistant key entry or broadcast. The earlier 1-token recovery remains a separate saved intent.

User WSL on bd271a6 reports budgetObservedAt 2026-11-23T16:17:22.097Z (17:17 WAT), reserves 14.414101 test REACT, modeled requirement 13.6, no source shortfall, callback requirement 114048000000000 vs available 884378354010290 wei ETH, canStart true. This closes live budget-CLI reproduction and the measured readiness shortfall for that conditional 30-minute isolated scenario, not general operating-cost/admission acceptance. No claim the stress allowance is the actual fee charged.

User verify:m2 reports wiring verified, ten origin subscriptions, filterVersion 12709, four quotes, zero active jobs, inactive idle CRON, unpaused; all ETH/USDC custody balances/liabilities and both fee debts zero. These state/budget readings have user-terminal provenance; they are not mislabelled as independently re-fetched readings. Published snapshot bytes and dates are preserved.

No code/test/build changes or reruns in this evidence/documentation update; prior 112-test suite stands. Execution/Integration: genuine reserve funding and healthy user prerequisites, automatic release still unproven. Usefulness: fee runway prepared for a consented timed booking. Craft: decoded public receipt and explicit scenario/provenance/closure limits. **M2 NOT ACCEPTED; M3 pending.**

Next: one ETH-only automatic-release quote with explicit consent, fresh absolute WAT payment deadline and full-refund cutoff within the budget horizon; independently verify creation, then customer payment/confirmation and recorded closure of both app tabs before cutoff. No cancellation or manual merchant claim during this release test. The next quote does not yet exist. Recheck readiness if setup/rates/traffic change; a conditional budget pass is not a delivery guarantee.


## M2 Quote 5 ETH automatic release verified — 23 November 2026

**COMPLETE for this authenticated on-chain ETH release/accounting/terminal scheduler outcome. M2 NOT ACCEPTED overall.** Independently fetched Base/Lasna receipts, transactions, exact origin/CRON inputs, current immutable wiring, historical blocks and balances passed offline assertions at 2026-11-23T17:05:31.005Z (18:05 WAT). Public bundle: [quote-5-eth-release.json](deployments/evidence/m2/quote-5-eth-release.json).

| Stage | Network | Successful transaction |
|---|---|---|
| Creation with automaticRelease true | Base Sepolia | 0x75d47815385c7e4621c0010fd63ec95dc4a09d1d8586c60a287446fd7a5e7c0a |
| Customer 0.0001 ETH deposit | Base Sepolia | 0xb74e5a9bc2b4dea7b99c045e5333a24e6ebccd1a03c290fb07003428fcd2ed1d |
| Deposit-linked confirmation reaction | Lasna | 0x72702119e7365110d040277ce62603caa7f3db773ba81c5be955839fb270bf8d |
| Confirmation callback | Base Sepolia | 0x6f6f8668a089d3003141b9d496dd61ffe281fe2538211afa640c5043418c344e |
| Exact indexed network CRON | Lasna | 0x0bf0b9db32c13f96257e40598f921bfa33be7cd99551e64a59d1e94d9f729231 |
| Associated policy request, attempt 1 | Lasna | 0x71e547ac48a525d946f5199ffb42c192fce92592da6ad32e19928bd1b057f30a |
| Authenticated automatic release | Base Sepolia | 0xba43f1482f1032df46e5a1194cf27a90bfc422f59b189b10ff515ff90d9f590e |

Quote terms: merchant ...288E, designated customer ...911eD; native asset, 0.0003 test ETH total and 0.0001 deposit. Creation PolicyRegistered and current automaticRelease getter both true. Actual payment deadline 23 November 17:40 WAT, full-refund cutoff 17:50 WAT. Deposit accepted before expiry; original deposit fingerprint matches the confirmation request. Real CRON trigger record binds its exact transaction/block/log; request configuration matches processPolicy(address(0),5). Actual delivered proxy configuration injects the authorised Reactive contract, targets the existing receiver and quote 5; immutable wiring matches.

Release callback succeeded at **17:50:28 WAT**, after the agreed cutoff, emitting Released(5,100000000000000) and PolicyChecked(5,7). Merchant balance increases by exactly 100000000000000 wei across the release block and escrow decreases by the same amount. These are block observations, not an internal execution trace. Current quote is Released (7), native escrow balance, mapped liability and totalLiability are zero; job automatic/registered/confirmed/closed, nextAt zero; no active jobs and idle CRON false. No additional merchant claim transaction is represented as this automated result. Only the deposit was released; remaining balance collection and proof of service delivery are not claimed.

User recording 20261123-1636-20.4877370.mp4, duration 94.5333 seconds, SHA256 7e3ca75df4119cdd91dab595d6a071b3e29f536019e8c95c521daeb70ba8c72d: reviewed sampled frames show Confirmed quote/terms and later Released/completed-scheduler UI, with clock views before/after cutoff. The recording does not visibly establish closure of BOTH app tabs across cutoff. **Browser-closed acceptance remains PENDING**; no retroactive closure claim. Unique retry-to-delivery attribution also remains unclaimed; matching request/delivery proof is not a protocol return-report mapping.

Fresh next-test budget observation in the bundle reports idle scheduler, zero fee debt, 14.1183207 test REACT reserves against the conditional 13.6 stress allowance, sufficient callback balance, canStart true. This is a dated conditional readiness observation, not future delivery assurance. No additional top-up is needed under that observation. No new quote was created by the assistant.

Evidence/documentation only: no contract/frontend source change, new build or test-suite run. Prior 112-test baseline stands. A reusable release CLI and user WSL release-verifier reproduction remain pending; these offline assertions are not mislabelled as a shipped command.

Judging: Execution — real deposit/confirmation/CRON/request/authenticated release; Integration — deposit paid to merchant by scheduled policy after cutoff; Usefulness — merchant receives agreed eligible deposit with exact principal accounting; Craft — public trace, visible UI review and honest browser/reproduction limits. Next: one USDC automatic-release journey with fresh WAT payment deadline/full-refund cutoff and actual continuous browser-closure recording. Keep remaining operational cost/recovery/journey acceptance open; M3 has not started.


## M2 Quote 6 USDC automatic release and reopening — 23 November 2026

**COMPLETE for authenticated USDC release, exact merchant accounting and terminal scheduler; reopening COMPLETE by video. Earlier tab closure is USER CONFIRMED. M2 overall NOT ACCEPTED.** Independent Base/Lasna public RPC evidence and offline assertions passed at 2026-11-23T17:46:15.671Z (18:46 WAT). Raw receipts, transactions, origin/CRON logs, block times, state, wiring, balances and recording provenance: [quote-6-usdc-release.json](deployments/evidence/m2/quote-6-usdc-release.json).

| Stage | Network | Successful transaction |
|---|---|---|
| Creation, automatic release true | Base Sepolia | 0x1c5a6190c746671ffcc0ecdd1a2ac58a45b7573338c82499d770645d9838ca17 |
| Exact 1 USDC approval | Base Sepolia | 0x7c87a8ed25c2a6e651d91242993fa7da60e5172e2f64c9e52bd7626ce75dee8c |
| 1 USDC deposit | Base Sepolia | 0xd4311380a9249ca74e45976e0c49acec2e758be6bf43ed1535c17fc9af734987 |
| Deposit-linked confirmation reaction | Lasna | 0xbbc2cea647671ad74b7b881fa7644044a12bdfb0ee392bf78b55b7d0b6bea2be |
| Confirmation callback | Base Sepolia | 0xd615e9ee9b6230e7fd1693992eea5a0bc71352af61bd05fb3b45e0a5f6ea7dfa |
| Exact indexed network CRON | Lasna | 0x535d662a55a2a9b0f0d2a050b025b7d8d33a13de4b364155beee6801dbf60c2c |
| Associated release request, attempt 1 | Lasna | 0x944d8da1d6cf77bc2b95c408274ce9ea61af168a4a10b08dad9ec3d0395ccee7 |
| Authenticated automatic release | Base Sepolia | 0xa529fd771e0e5c8b7cba5b651e7bfa167257a058c8af150db46bd3b81e2dac40 |

Immutable terms: issuer-listed Base Sepolia USDC 0x036CbD53842c5426634e7929541eC2318f3dCF7e; total 3000000 units (3 USDC), deposit 1000000 (1); merchant ...288E, customer ...911eD; automaticRelease true. Actual payment deadline 23 November 18:15 WAT and full-refund cutoff 18:20 WAT. Deposit accepted before expiry. Genuine deposit fingerprint/trigger links confirmation request; exact network CRON transaction/block/log links the successful policy request. System request and delivered proxy payloads match authorised Reactive/receiver/quote 6; immutable authentication wiring independently matches.

Release succeeded at **18:20:37 WAT**, after cutoff. Callback contains actual issuer-token Transfer(escrow,merchant,1000000), Released(6,1000000) and PolicyChecked(6,7). Merchant USDC balance rises exactly 1000000 across the release block; escrow falls exactly 1000000. These are block-level observations corroborating the explicit token transfer, not internal execution traces. Current USDC escrow balance/liability zero; native balance/totalLiability zero. Quote Released, job automatic/registered/confirmed/closed, nextAt zero, no active jobs, idle CRON false. Only the deposit was released; remaining-balance collection/service-delivery proof are not claimed. Unique protocol retry attribution remains unclaimed.

### Recording provenance and accepted reopening
- Original 20261123-1713-24.8981684.mp4, 40.3 seconds, SHA256 d30210ddf811600bfe67a721e9c7e96bc600b71294e778c73987b121ad4c0db1: independently reviewed Confirmed/Released UI, 1 USDC terms and 18:20 cutoff; timeline jumps from about 18:13 to 18:29.
- User explicitly clarified that the tab was closed in the earlier test and recording was started after reopening. **Tab closure: USER CONFIRMED**; that attestation is accepted with its stated provenance, not represented as independently recorded closure.
- New 20261123-1740-44.4569856.mp4, 26.943979 seconds, SHA256 d219769d6e4a30640e90b84c66d0d4cb33150269916c1cfbf9d4fc2dfd034889: independently reviewed fresh-tab navigation to quote 6, reading the same quote, returning Released/1 USDC and matching terms around 18:40–18:41. **Reopening completed state: COMPLETE — VIDEO VERIFIED.**
- These are separate recordings, not a fabricated continuous sequence across cutoff. The uninterrupted closed interval is not independently captured. No raw recording or extracted frame was uploaded/published by the assistant to GitHub; only provenance metadata and factual findings are committed. Do not request another quote or retroactive reenactment merely to erase this recording limit.

This supersedes the earlier blanket reopening/closure uncertainty with the new video and user clarification. It does not change historical recordings or claim a continuous capture exists. Evidence/documentation only: no code/build/test-suite rerun; prior 112-test baseline stands. No assistant payment, funding, cancellation, manual claim or deployment.

Judging: Execution — genuine USDC deposit/confirmation/scheduled authenticated release; Integration — CRON and Reactive drive the merchant transfer; Usefulness — exact agreed deposit reaches merchant and completed quote reloads correctly; Craft — public accounting/trace and separately labelled recording/user evidence. Next: reusable read-only ETH/USDC release verifier and user WSL reproduction, then reconcile remaining M2 operational cost/recovery/journey acceptance. No further transaction or recording is needed now. M2 NOT ACCEPTED; M3 pending.


## M2 read-only release verifier implemented — 23 November 2026

Added `npm run verify:release -- 5` (ETH) and `-- 6` (USDC) for the accepted M2 release trails. Default mode re-fetches genuine public Base/Lasna receipts/transactions/network IDs, historical blocks/balances, immutable callback wiring and current quote/automatic-policy/job/accounting observations. Current state calls are pinned to recorded Base/Lasna observation heights. Exact known M2 addresses prevent a different deployment from being accepted. No signer, key access, funding or broadcast path exists. Successful results write separate `quote-ID-release-verified.json` files atomically after checks; original evidence remains unchanged.

Validation binds immutable creation terms/automatic-release opt-in, exact deposit customer/asset/amount/selection, successful confirmation, actual indexed CRON input, real Reactive request, requested/delivered proxy payload and authorised sender, release outcome, source/destination cutoff timing, exact merchant/escrow block deltas, issuer-USDC approval/transfers, current custody coverage and terminal scheduler acknowledgement. It rejects early release, manual-only policy, foreign/failed/copied evidence, wrong network/proxy/sender/origin/recipient/amount, missing token transfer, altered accounting or open job. Unrelated same-block balance movement can conservatively fail delta checks; current unrelated deposits can legitimately leave nonzero covered liabilities.

Fresh actual collector/validator passed via Python HTTP public RPC transport: ETH verifiedAt 2026-11-23T17:52:03.840Z and USDC 17:53:59.910Z. The initial USDC collection process was interrupted by the environment; no USDC success snapshot was accepted until a successful retry. These are fresh real public responses, not fixtures. Full Node CLI transport/user WSL reproduction remains pending; do not equate the Python-transport run with it. Namespaced verified bundles preserve their actual collection times.

Explicit `--recorded` mode replays the committed verified public bundle, labels its sourceObservedAt and states no fresh RPC occurred. Both recorded CLI runs pass. It never upgrades user/video annotations into RPC proof of browser actions: Quote 6's closure stays user-confirmed and reopening independently video-verified in the existing ledger; continuous footage remains unavailable. No further recording/transaction is required now and no previous recording is reclassified by this command.

Validation: **12 focused release tests pass; full suite 124 passed, zero failures/skips/cancellations**. These checks replay genuine archived public evidence, exercise adversarial changes, and verify an existing successful evidence file is preserved after validation fails. They do not count as additional public execution transactions. Current official callback authentication documentation was rechecked at https://dev.reactive.network/callback-contracts. No contract/frontend source or bytecode changed, so no contract/frontend build or deployment was needed/claimed. No additional funds spent.

Judging: Execution/Integration — real ETH/USDC release traces re-collected and checked, genuine merchant outcomes retained; Usefulness — same-asset eligible deposits reach merchants and results survive reopening; Craft — reproducible key-free verifier, explicit replay mode, tamper rejection and preserved human-evidence provenance. **M2 NOT ACCEPTED overall.** Next: user WSL live verify:release for both quotes followed by verify:m2, then reconcile remaining operational cost/recovery/journey acceptance. No M3 work.


## M2 release CLI reproduction complete — user WSL, 23 November 2026

User pulled 06aef45 and successfully ran default live verify:release for ETH Quote 5 at 2026-11-23T17:57:16.989Z (18:57 WAT), USDC Quote 6 at 17:57:21.329Z, then verify:m2. Both outcomes Released, schedulerClosed true, exact releaseUnits 100000000000000 wei ETH / 1000000 USDC units, current asset balance/liability zero and associated request attempt 1. **User WSL live release CLI reproduction COMPLETE.** Published independent bundles retain their earlier verification times; the newly written user-local JSON bytes have not been independently fetched or fabricated into them.

Current user verify:m2: policyVersion 3, wiring verified, ten origin subscriptions, filterVersion 12911, quoteCount 6, zero active jobs, idle CRON false, paused false. ETH/USDC balances and liabilities all zero. Reactive debt zero, reserves 13955456900000000000 (13.9554569 test REACT), contract balance 9090600000000000; callback debt/reserves zero, balance 881052838410290 wei ETH. These are user-terminal observations, not future funding or delivery guarantees.

Both command results preserve uniqueRetryAttribution false. Browser actions remain separate: Quote 6 tab closure user-confirmed, fresh-tab reopening independently video-verified, continuous closed interval not recorded. Successful CLI output does not change those categories. No more quote/payment/recording is required merely to reproduce these completed release checks.

### Remaining M2 acceptance review — specific gaps
| Area | Current evidence | Remaining action |
|---|---|---|
| Normal on-chain outcomes and reproducible proof | Unpaid expiry, ETH/USDC refunds and ETH/USDC releases verified; user WSL verifiers passed | COMPLETE for these scoped outcomes; preserve dated evidence |
| Custody and final scheduler acknowledgement | Exact principal outcomes, zero observed liabilities, closed jobs and idle CRON | COMPLETE for observed journeys; not a claim of perpetual funding |
| Failure, timing and repeated delivery | Local policy/scheduler/protocol tests cover boundaries, cancellation priority, rollback, deduplication and retries. Real Quote 1 debt blocking/reserve recovery and later delivery are recorded | Reconcile the master-plan recovery gate against exact existing test/live evidence. A live participant requestPolicy retry is not yet recorded; do not relabel a local fixture or ordinary automatic request as that proof |
| Fee budget and active-job admission | Real fee observations, conditional single-test budget and separately funded intents exist. Tick scans/requests are capped | Review queue admission and budget enforcement: source _schedule appends new active jobs without a global active-job cap, and budget:m2 is a read-only off-chain model. No claim of production-scale protection or indefinite fee runway |
| Functional journeys and documentation | Actual merchant creation/customer deposit/cancellation/release, user video/UI and receipt recovery evidence exist | Complete an item-by-item M2 review and fix findings. Full approved visual interface and submission polishing remain M3/M4, not reasons to repeat completed payment evidence |

No code/build/test rerun in this documentation-only checkpoint; prior 124-test suite stands. This is not an independent security-audit result. Execution/Integration: release proof successfully reproduced through the full user CLI. Usefulness: exact automatic merchant receipts and customer refunds work in the recorded testnet journeys. Craft: verification is reproducible; operational limits and local-only vs public recovery evidence remain explicit. **M2 NOT ACCEPTED; M3 pending.** Next is the focused recovery/funding/queue review, not another deposit or recording request.


## M2 controlled recovery preparation — 23 November 2026

Added read-only plan:recovery and one-time, journalled pause:recovery/resume:recovery owner commands for the existing deployment. [Procedure and restore command](docs/RECOVERY_TEST.md). Initial pause requires idle/unpaused scheduler and zero ETH/USDC liabilities; restore remains available if jobs appeared while paused. Network, compiled Reactive creation, owner and callback wiring are checked; saved intent/hash and deployment lock prevent accidental duplicate sends. This does not create a quote, deposit or participant retry. No live owner action was sent during implementation.

Focused isolated two-network EVM tests cover wrong key/network, refused busy/funded pause, saved-hash reuse, participant request observation while paused, restoration of CRON for a waiting unpaid job and refusal to re-pause using the completed cycle. Local fixtures are not public proof. Full suite: **126 passed, zero failures, skips or cancellations**; no contract/frontend build was needed or claimed for this scripts-only change.

M2 remains NOT ACCEPTED: public participant-retry recovery is pending, source queue admission remains uncapped, and budget:m2 remains an off-chain conditional model. No contract, frontend or deployed bytecode changed; no redeployment. Current official network/economy references were rechecked: https://dev.reactive.network/origins-and-destinations and https://dev.reactive.network/economy. Existing public expiry/refund/release evidence and accepted user/video provenance remain unchanged. M3 has not started.

Judging: Execution — normal public trails retained; this new recovery scenario has local proof only. Integration — existing participant signal and scheduled policy restoration exercise real application paths in the fixture. Usefulness — recover an overdue unpaid booking without exposing a deposit. Craft — explicit restore procedure, nonce-safe intents, tests and honest operational limits. Next: user-local read-only plan:recovery and verify:m2, then one controlled unpaid recovery journey if readiness checks pass.


## M2 Quote 7 controlled recovery verified — 23 November 2026

**COMPLETE for the scoped live participant-retry / owner pause-and-restore / authenticated expiry journey. M2 overall NOT ACCEPTED.** Independent public Base/Lasna collection passed the existing expiry validator at 2026-11-23T21:14:20.200Z (22:14 WAT). Evidence: [expiry bundle](deployments/evidence/m2/quote-7-expiry.json), [owner actions and participant retry](deployments/evidence/m2/quote-7-controlled-recovery.json), [saved pre-resume observation](deployments/evidence/m2/quote-7-before-resume-observation.json).

| Stage | Network | Successful transaction |
|---|---|---|
| Owner pauses scheduler | Lasna | 0xee6b2c58c8d133018a72ee4184886c7804c5e83d68c4bf38eadcddc10962b97f |
| Quote 7 created, unpaid/manual-release policy | Base Sepolia | 0xb1e078de9e483ce119ff71503794da10378bd44591227d1effba6112bab792a2 |
| Participant policy retry | Base Sepolia | 0xa606da3dfcc68504973dd5bf3f9173c9c791c6b388cdc6b4ae49188e58acfefc |
| Owner restores scheduler | Lasna | 0x20a1702f4809fc9c116009e31c2763911f2c72fc059ce94a54f829d397535ab7 |
| Exact indexed network CRON | Lasna | 0x1eb09c134df026eca32f8fd8526ad2cffdebcb1e949ab4a6f8ca8bce9a11b7a6 |
| Associated policy request, attempt 1 | Lasna | 0xacecb72fe521a8bf2c9f759dbff49b3762c72de1d31e2993e0f302dc6c11ee06 |
| Authenticated expiry callback | Base Sepolia | 0xad2fc08006d84eec3ee3f1057ba889e7b003fea3fe4549a8041996c35b855de9 |

Quote 7 binds the original merchant ...288E/customer ...911eD and terms fingerprint. Payment deadline 23 November 19:30 WAT, full-refund cutoff 19:35 WAT; automatic release false. No payment was requested for this journey. Both owner transactions independently match recorded owner -> existing Reactive, Lasna ID, zero value, exact setSchedulerPaused(true/false), successful receipts and SchedulerPaused events. Retry receipt contains matching PolicyRegistered/PolicyRequested(7); its block is after expiry and chronologically between owner pause and resume. Outer creation/retry transactions can be wallet-relayed; authorisation is not inferred from their outer sender.

Saved independent pre-resume observation shows both exact retry-log fingerprints processed=true, paused=true, one active job, zero attempts and CRON false. Fingerprints derive from Base chain ID, block hash, transaction hash and log index. That original collection lacked block tags/timestamp: retain as a saved observation, not atomic historical state proof or a unique source transaction trace. No invented processing timestamp/hash.

Final expiry verifier binds exact CRON log to Reactive trigger input; requested/delivered callback configuration, destination proxy and authorised sender match; real QuoteExpired/PolicyChecked(7,6) succeed after deadline; current quote is Expired, registered job closed. Independent final reads also showed activeJobs=0, paused=false and cronSubscribed=false. User WSL separately reports ten subscriptions/filterVersion12969, zero ETH/USDC balances/liabilities, both debts zero, Reactive reserves 13.8549934 test REACT and callback balance 880407635610290 wei ETH. These user funding readings are not fabricated into independently collected snapshots.

Fresh public collector used the existing JS collect/validate functions with Python HTTP transport. **8 existing expiry-evidence tests passed**, plus replay of the fresh Quote 7 bundle and rejection of a changed failed callback receipt. This was not a fresh full-suite/build run; prior 126-test baseline stands. Full user WSL expiry-CLI reproduction for Quote 7 remains pending. No source, bytecode, deployment, fee top-up or customer payment was performed by the assistant.

Recording 20261123-1833-10.2963687.mp4: SHA256 9ddc96dad2aeffc01fda130d5a071b3fafa648b56265dabf2f3c83ed8c959c20, prior measured duration 47.935979 seconds. Reviewed frame at 30s shows Quote 7 terms, operator-paused message, retry control and Base Sepolia wallet confirmation. This sampled review alone does not establish a continuous completed recording or browser closure. No raw recording uploaded to GitHub.

Limits: this is deliberate owner-controlled CRON interruption, not a demonstrated protocol outage or failed token-transfer recovery. A natural overdue expiry could also run after resume: do not claim the participant retry was uniquely necessary. Matching request/delivery does not provide unique protocol return-report attribution. Existing normal expiry/refund/release and browser evidence remain unchanged.

### Remaining admission/funding finding — OPEN

Review confirms MAX_SCANS=8 and MAX_REQUESTS=2 bound each tick, MAX_ATTEMPTS=6 bounds unanswered attempts before attention, and RETRY_SECONDS=60 supplies backoff. These do not cap aggregate active jobs, restrict maximum scheduling horizon or enforce per-merchant fee admission. Public escrow creation and source _schedule can grow the shared queue; budget:m2 is only an off-chain conditional estimate. A busy queue can increase delay and consume sponsored reserves. Do not claim production-scale funding protection.

A frontend-only restriction or silently dropping source jobs is not an acceptable fix: direct contract calls bypass the page, and ignoring an accepted booking would break its automation promise. Remediation needs coordinated contract-level admission/funding policy before quote acceptance, bounded scheduling horizon, capacity release on terminal outcomes, safe queue accounting and retry behaviour. Current immutable deployed code cannot acquire those protections through a script or documentation edit; a new version/deployment and new regression/live proof would be needed. Numeric capacity/horizon/funding policy is not silently invented here. M2 remains open for that engineering decision and item-by-item final review; M3 has not started.

Judging: Execution — actual controlled pause/retry/restore/CRON/request/authenticated expiry; Integration — source observes retries while paused and scheduled execution resumes; Usefulness — overdue unpaid quote recovers without a deposit at risk; Craft — exact public receipts, reproduced validator, chronology and explicit attribution/observation limits. Next: reproduce the Quote 7 expiry verifier from WSL, then resolve admission/funding before M2 closure.


## M2 admission hardening checkpoint — 23 November 2026

**V4 admission and destination integration IMPLEMENTED / LOCALLY VERIFIED / NOT DEPLOYED. M2 NOT ACCEPTED.** Separate source directory [admission](packages/contracts/admission) and [design/remaining gates](docs/ADMISSION_DESIGN.md). Existing V3 contracts/source/creation hashes/journals/evidence are preserved. No new wallet action or deployment was performed.

The new ledger starts closed, requires sponsor-authorized expiring merchant credits with an explicit funding-observation reference, caps concurrent/reserved work and total lifetime admissions, bounds new deadlines and shares a finite retry cooldown/count across confirmation and policy retry. Credits never hold customer principal. Consumed lifetime credits do not regenerate when a quote closes, so even delayed terminal acknowledgements cannot permit an unlimited sequence of distinct source jobs. Numeric limits are constructor inputs; small test values are fixture configuration, not public deployment defaults.

All V4 creation paths invoke the ledger. Refund/release/expiry close capacity exactly once; invalid creation and failed principal transfer roll back. Closing admission does not block existing payments, cancellation, callbacks or claims. The review identified that permanently exhausted participant retries could otherwise strand a reserved refund. V4 adds customer-only claimRefund for RefundPending, preserving same-asset liability/reentrancy/duplicate protections and independent of admission/network availability. Normal automatic refund remains available; this is an explicit recovery path.

Checks actually run: separate admission build passed EVM runtime/initcode size checks; **final full suite 134 passed, zero failures/skips/cancellations**. Tests include all creation methods, grants/capacity/lifetime/deadline boundaries, access control, rollback, duplicate closure, shared retries, cancellation after exhaustion, failed token callback followed by customer recovery with admission closed, token automatic release, native accounting and exact preservation of both V3 deployment fingerprints. No frontend build was claimed because its source was not changed. All new transactions were isolated local EVM fixtures, never public integration evidence.

Current public V3 deployment is still uncapped. Base cannot directly read Lasna reserves: the ledger observation is a trusted sponsor attestation, not a cross-chain funding proof or guarantee at future gas prices. Funding-aware grant planning/execution, new-version deployment/recovery journal and subscription checks, direct V4 Reactive end-to-end fixture coverage, V4 shared terms/plain-English interface and new public evidence remain OPEN. The immutable deployment must not be labelled patched; do not use the existing V3 deploy/journal for V4. No arbitrary production capacity/horizon or funding rate was silently selected.

Separately, user WSL live Quote 7 expiry verifier passed at 2026-11-23T21:19:15.048Z (22:19 WAT): Expired, schedulerClosed true, associated attempt 1. **Quote 7 user CLI reproduction COMPLETE** with user-terminal provenance. Its new local snapshot bytes were not fetched or fabricated into the earlier independent bundle; retry-attribution and browser-evidence limits remain intact.

Judging: Execution — accepted V3 public outcomes retained; new V4 code has local evidence only. Integration — admission occurs in contract creation, not only the page; automation and recovery guard customer accounting. Usefulness — finite sponsored work and refundable deposits survive retry exhaustion. Craft — version-isolated source, dedicated build, adversarial checks and explicit funding/deployment limits. Next: funding-aware grant tooling, direct V4 source integration and versioned interface/deployment verification. M3 remains pending.


## M2 V4 automation fixture and initial funding planner — 23 November 2026

**COMPLETE — LOCAL V4 origin/CRON/callback integration and read-only initial grant planning. NOT PUBLICLY DEPLOYED; M2 NOT ACCEPTED.** See [funding planner](docs/ADMISSION_FUNDING.md), [planner source](script/admission-budget.cjs), [budget tests](test/admission-budget.test.cjs) and [two-chain integration](test/admission-reactive.test.cjs).

Actual V4 contracts are deployed on isolated Base-ID/Lasna-ID Anvil fixtures. Real fixture quote/deposit receipts feed the V4 subscriber, duplicate origin records produce no duplicate request, forged react calls and wrong callback routes/senders fail, actual indexed CRON receipts cause policy requests, authenticated fixture proxy delivery produces release/expiry receipts, and both admission and source queues close. Earlier V3 regressions are no longer the only local source-integration checks. This is not public protocol execution.

New plan:admission is strictly read-only: no signer, key handling, file writes, grants, opening of admission or broadcasts. It requires explicit six-field public V4 identity, verifies four compiled runtimes/versions/wiring, sponsor and ten active origin subscriptions, pins state/code/balance reads and rechecks observation block hashes. Freshness, network IDs, empty closed initial state, zero fee debt and known scheduler constants are mandatory. Current filter-index and gas-price reads are separately current, not falsely block-pinned. Missing/unknown data stops planning; insufficient funds return canGrant=false. Source balance and all customer principal are excluded.

The conditional stress model budgets the whole immutable lifetime allowance, including first confirmation/cancellation attempt resets and participant resets, rather than assuming one six-attempt batch. It includes bounded request/event/acknowledgement work, per-quote horizon/backoff, queue draining, double sampled cadence/prices, current coefficients/surcharges and a 15-minute delivery assumption. It is neither an expected charge nor guaranteed affordability under arbitrary delay/prices. Initial grants only; incremental grant execution/accounting is deliberately not implemented. A public observation fingerprint is an attestation reference, not a cross-chain reserve proof.

The collector is exercised against actual isolated V4 bytecode/wiring and funded fee fixtures. The local RNK-index adapter derives filters from the fixture's actual subscription storage; controlled fixture clocks are explicit. No local protocol adapter, token or cost is mislabelled as a public observation.

Validation: **7 focused checks passed; final full suite 141 passed, zero failures/skips/cancellations.** CLI with missing arguments safely refuses. Contract/frontend sources did not change in this checkpoint; the previous V4 size-checked build remains the applicable build, not a newly claimed deployment/build. Both frozen V3 creation fingerprint regressions pass.

Remaining: finalize concrete testnet admission/funding configuration; implement journalled grant execution with freshness/state recheck and nonce-safe recovery; implement separate V4 deployment/configuration/subscription verification; add V4 terms/interface admission/retry/refund-recovery support; then collect genuine new public evidence. Existing V3 journals, links, code and accepted public outcomes remain unchanged. Do not call the public uncapped deployment patched or deploy V4 using deploy:m2. M3 pending.

Judging: Execution — new V4 source/destination flow works locally; public V4 proof pending. Integration — actual source event/CRON scheduling drives authenticated fixture outcomes and capacity closure. Usefulness — funded-work admission is checked without exposing principal. Craft — fail-closed observation/model checks, reproducible tests and explicit limits. No wallet action requested now.


## M2 V4 backend operations and recovery — 23 November 2026

**COMPLETE — LOCAL versioned deployment, capped initial funding and initial grant/open execution. NOT PUBLICLY DEPLOYED; M2 NOT ACCEPTED.** [Operator guide](docs/V4_OPERATIONS.md) describes exact scope, command order, proposed configuration, frozen intents and limits.

New V4 commands plan/deploy/verify/status use only testnet-v4.json and .deploy-v4.lock. They freeze source/settings, preserve unsigned intent/hash before broadcast, verify compiled creation/runtime, constructor funding, owner/limits/wiring/configuration, active filters, scheduler and ETH/USDC custody. An index failure after successful creation/configuration blocks verification but does not discard those transactions; resuming reuses their hashes. Existing M1/M2 journals, source and public addresses remain unchanged.

Initial funding uses explicit source/destination value caps and separately saved SYSTEM/PROXY depositTo intents for the new fee accounts. No implicit funding or duplicated top-up. Initial grant execution stores its public funding observation/reference/proposal/expiry, rechecks freshness/funding before an unknown broadcast, and retains the same intent on recovery. Admission opening is a separate owner transaction that verifies the mined grant, unused/unexpired reserved batch and renewed lifetime budget. It never mints additional credits. Failed/stale/expired cycles stop for review; these commands do not silently renew a grant or replace a nonce.

The review corrected a real identity-validation edge case: source and destination contracts can have the same hexadecimal address on different chains. The planner now requires distinct Base identities but allows that cross-chain equality; the integrated fixture actually deploys that case. Artifact ABIs are cached within each operational process to avoid repeated compilation; source fingerprints still freeze in the journal and are rebuilt in each fresh CLI process.

config/v4-testnet.example.json is a **proposal for review**, not a deployed/approved production limit: six reserved/active slots, six lifetime quotes, 900-second cutoff horizon, one shared participant retry with 60-second cooldown, and seed constructor balances of 0.1 test REACT/0.001 test ETH. Seeds do not establish whole-lifetime funding. The proposed allowance permits a small set of sequential ETH/USDC verification journeys; actual prices and suitable limits still need user WSL review before public deployment. No old reserves or principal are migrated.

Actual checks: **final full suite 144 passed, zero failures/skips/cancellations.** New tests exercise preparation interruption, one-time recovery, wrong network/occupied nonce refusal, explicit setting/secret/path rejection, unavailable-index deployment recovery, capped fee deposits, original hash/nonce preservation, edited constructor-funding rejection, corrupt grant-reference rejection, expired-window opening refusal, separate open/grant reruns, legacy journal preservation and no key persistence. Temporary local clock tests were corrected to follow advancing fixture chains; production freshness guards were not relaxed. These are isolated EVM/protocol/index fixtures, never public V4 execution evidence.

Manual negative CLI checks: missing V4 status reports no journal, plan without config refuses, grant without local key refuses. None creates a deployment or sends a transaction. No contract/frontend source changed in this checkpoint, so prior compiled V4 bytecode/size checks remain applicable; no fresh frontend build or public deployment is claimed. Both V3 fingerprint regressions pass.

Judging: Execution — actual local deployment/funding/grant operations and recoveries pass; genuine public V4 evidence still pending. Integration — full backend prerequisite chain supports meaningful Reactive scheduling without paying fees from principal. Usefulness — prevents duplicate spending and opening unfunded/expired initial sponsorship. Craft — version-isolated recovery, capped values, explicit proposal and reproducible tests. Next: V4 functional terms/interface/admission/refund-recovery integration, then read-only user settings/cost review and bounded public verification. M3 remains pending.


## M2 V4 functional interface — 23 November 2026

**IMPLEMENTED / BUILD AND CONTRACT-BACKED HELPER TESTS PASS / BROWSER AND PUBLIC V4 JOURNEYS PENDING. M2 NOT ACCEPTED.** [Interface acceptance and exact browser blocker](docs/V4_INTERFACE.md).

The interface detects V4 and requires matching scheduler/escrow policy versions plus admission binding. Version 4 terms bind release consent without changing existing version 1/2/3 fingerprints. Merchant views display real capacity, allowance expiry, horizon and finite lifetime counts. Unknown/failed admission reads disable creation; submission rereads current state. Reserved credits are treated as belonging to their merchant, not incorrectly blocked as full capacity.

V4 retries display and enforce shared allowance/cooldown with a fresh pre-send check. Cancellation is independent. Customer Claim reserved refund is available only for a recorded V4 RefundPending quote and the designated customer, with a fresh Base quote/version check. Its handler does not require Lasna or a successful admission query. Current escrow configuration/share targets remain unchanged; ETH/USDC and disabled USDT are retained. This is functional M2 work, not the approved M3 landing-page redesign.

Checks actually completed: npm run build:web passed TypeScript and Vite (174 modules); **13 focused checks passed; final full suite 147 passed, zero failures/skips/cancellations**. An actual isolated V4 contract is read through the same frontend helper/extended ABI, accepts bound version-4 consent/payment, rejects version downgrade/changed consent, exhausts retries, reserves cancellation and supports customer recovery while admission is paused. Legacy ABI export is byte-for-byte unchanged; V3 source fingerprints still pass. Build retains the >500 kB chunk warning (538.58 kB JS, gzip 177.89 kB); it was not hidden or called resolved.

**Browser/mobile checks NOT VERIFIED.** The prepared browser journey could not run: local Chromium binary was missing; official browser download returned HTTP 403; connected extension context was unavailable; cloud fallback could not reach workspace localhost and its error page was inaccessible under browser URL policy. No workaround, desktop/mobile screenshot, overflow measurement, extension-wallet success or public V4 journey is claimed. Temporary isolated server/fixtures were stopped. This concrete blocker remains open; code/build/helper results are not substituted for rendered-browser evidence.

Judging: Execution — local contract-backed interface paths pass; public V4/wallet/browser proof pending. Integration — versioned consent and allowance/recovery are connected to real contract APIs. Usefulness — merchants see why creation is blocked, customers can recover reserved funds without source-status dependency. Craft — plain-English unknown states, version compatibility and reproducible tests, with visual limits explicit.

Next: read-only user WSL review of proposed V4 configuration/creation cost, then bounded deployment/funding/grant verification and actual browser/customer journeys. Do not overwrite V3 journals/links or mark M2 accepted. M3 remains pending.


## V4 expired unused allowance recovery — 24 November 2026

M2 remains OPEN. User WSL output reports V4 deployed at escrow 0x5675C610d6f0aCe9f7933f3584D53dc4F567Dc6B, callback 0x49ff0a4Bfa918b0576315C31a0bcE561eEBf3Df0, Reactive 0xFa1F509E21040bB4fE266B79E9583073914dFe6e, admission 0x935Ef09F57B68D08fd9Fd315755b7Daf49871486. The verified deployer is 0xbf6301D7bca9F23A63A2d1Ed513d5120Dbb2288E. These are user-terminal observations, not newly independently collected deployment bundles; creation/configuration hashes still need collection from the public journal.

User CLI funding receipts: 249 test REACT via 0x312fdbbe3a379df031e04f3edabcd2a2159be6f2ef8e75557bd454b15e97d02c; 0.001223936 Base Sepolia test ETH via 0xab37b9dff72085e7e1ca4f7e487fa92f6668a1d0238efafc9961b8ade0984a78. Conditional funding model returned canGrant=true, both shortfalls zero. This reserve estimate is not measured normal booking cost or guaranteed delivery. Original grant 0x6022aa4cf26ee0ef0ef86f26ea78a7c8926c31033050c80b486acf03db5c4856; opening 0x922916c54987cfa943336ae35d61b40a48f9267f3a05eb2b3ec2820848196f73. Verification then reported ten origins, admission open, reserved=1, admitted=0, quotes/jobs=0, zero ETH/USDC custody/liabilities.

The supplied 20.7-second recording (20261124-1751-15.3814533.mp4) was inspected at sampled frames including the capacity panel and disabled submit control. It shows the unused allowance expired at 12:12:46 PM Africa/Lagos, while the proposed evening quote was being entered. The automatic-release checkbox was also unchecked. This explains disabled creation; changing payment deadlines cannot renew a grant. No successful creation is shown. Current chain state must still be reread; this video is not a live transaction bundle or an all-frames journey review.

New commands plan:renew:v4 (read-only) and renew:v4 (one saved sponsor operation) support ONLY the expired, wholly unchanged original grant on an empty, idle deployment. They verify original transaction calldata/receipt, current wiring/subscriptions, reservation/counter/expiry consistency and fresh whole-lifetime funding. Replacement is atomic through existing setGrant; old initialGrant, grantInitial and openAdmission records remain unchanged. A separate renewExpiredGrant saved intent preserves nonce/hash across reruns; a stale unbroadcast plan, edited fingerprint, changed/used grant, busy deployment, wrong signer or funding shortfall blocks renewal. No automatic funding, opening, redeployment, capacity increase or quote/payment occurs. One explicit renewal cycle only; later renewal/incremental operational support remains out of scope. A quote accepted while the allowance is valid continues after grant expiry.

Validation: 148 tests passed, zero failures/skips/cancellations (full npm test, including the extended two-chain operational fixture). Separate focused operational run: three tests passed. Renewal boundary check: one test passed. Syntax check passed. These are isolated local EVM tests, not public renewal proof. Contracts and frontend are unchanged; no fresh build or public renewal is claimed. Source/runtime pins remain subject to the regression suite. Live renewal, V4 quote/payment/callback/release, other V4 policy journeys and final browser/mobile acceptance remain PENDING. Do not reuse old quote times; generate new local deadlines only after renewal and enable release consent for its test.

Judging: Execution — user CLI deployment/funding/grant/open reports retained; renewal currently isolated-test evidence only. Integration — verifies real contract API constraints and automation reserves before sponsoring work. Usefulness — restores an unused expired allowance without touching customer principal. Craft — append-only recovery intent, refusal boundaries, repeat-run checks and explicit provenance. This checkpoint does not close M2 or start M3.
