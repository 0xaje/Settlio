# Live on-chain evidence

## Current acceptance status — 23 November 2026
**M1 COMPLETE for its defined engineering scope.** See [the acceptance checklist](docs/M1_ACCEPTANCE.md) for all completed items and proof provenance. Both ETH/USDC full trails below were reverified successfully from user WSL on 23 November. Their committed JSON files retain their original verification dates; fresh user-local snapshot bytes were not fetched/published. Original creation interruption recovery is user-browser evidence; damaged-terms recovery is isolated integration evidence, not a live callback.

M2 expiry/refund/automatic release, M3 full design and M4 submission remain pending. USDT is Coming soon, not an M1 blocker. Subsequent dated sections preserve historical observations; their older open-status statements do not override this current status. Historical receipts do not establish current balances or future delivery. No hashes or snapshot data have been changed in this documentation update.


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
