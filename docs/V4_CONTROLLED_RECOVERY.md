# Final V4 controlled recovery test

Status: independent public recovery proof verified. The user executed the final credit, pause, unpaid creation, one participant retry and restore. The full fresh Ubuntu recovery-verifier reproduction passed on 25 November 2026 at 15:10:26.840 UTC (16:10 WAT). Earlier preparation/pending notes below describe the original procedure; they are superseded for independent live outcome evidence. M2 remains open. Quote 5's fresh Ubuntu expiry CLI passed at 2026-11-25T13:44:12.937Z through PublicNode; the original endpoint failed its history-read path. Terminal provenance is separate from the independently collected proof.

**Never pay quote 6.** This is a controlled owner pause and restore, not a protocol outage or an untouched unattended expiry. The sixth admission exhausts the immutable lifetime allowance. There is no rolling or seventh credit; do not create an extra quote to find a button or repair a display problem.

## One grouped sequence

1. Run the read-only final-credit plan. It verifies all five earlier quotes terminal/closed on both chains, the consumed quote-5 grant/receipt, zero custody/liabilities/work and sufficient fresh funding for the one remaining lifetime admission.
2. When ready, issue the one final merchant credit with `grant:recovery:v4`. The `recoveryQuoteGrant` plan / `grantRecoveryQuote` operation are separate saved intents. Reruns recover the original hash/nonce; no extra credit, funding, quote or payment is created.
3. Run `pause:recovery:v4` once through the sponsor's hidden local key prompt. It requires exactly five admissions and one unused final reservation, open admission, no active jobs, an unpaused scheduler and zero ETH/USDC custody and liabilities. The grant must be confirmed, match its calldata/reference and have more than sixty seconds remaining. The saved owner action is `pauseRecoveryScheduler` on Lasna.
4. Only after pause confirmation, create one unpaid quote for the usual customer with fresh payment deadline about three minutes ahead and cutoff about eight minutes ahead, within the 900-second horizon. Use 0.0003/0.0001 test ETH, USDC unchecked and automatic merchant release unchecked. Record creation hash and original share link. Do not pay, approve or cancel.
5. Once the payment deadline passes, use the merchant wallet ending 288E (the designated customer is also authorized) to request **Retry automatic check** once. Preserve its successful transaction hash. The single shared participant retry credit is consumed; a second retry must not be submitted. UI clock expiry alone is not a terminal on-chain expiry.
6. Before resume, collect read-only status: the owner pause should remain true, CRON false, the unpaid quote still not terminal and the observed source work queued. Source ingestion can be delayed; unknown or unobserved state is not proof of recovery. The participant event can register/requeue work while CRON is paused, but it does not resume the owner-controlled scheduler.
7. Restore with `resume:recovery:v4`. A confirmed authentic saved pause is required. Restore intentionally does not require idle work or zero custody: service must not be trapped merely because a job or principal appeared while paused. The saved action is `resumeRecoveryScheduler`. It does not create another grant, participant retry or funding deposit.
8. Collect the actual resumed CRON/request/authenticated callback and quote expiry, admission closure, source acknowledgement and zero custody. State all owner/participant actions in the evidence. Resume is not itself proof of successful expiry delivery.

If you stop, lose connectivity, or the unused merchant credit expires after pause, **resume the scheduler** using the saved restore command even if you cannot create the test quote. Do not delete the journal/lock, regrant, fund or redeploy blindly. A paused status is not a failed transaction. Commands preserve original hashes on rerun; an already-restored cycle cannot be silently paused again.

Owner pause disables CRON only. Origin observations and some fees can continue. Existing destination timestamp/authentication/principal rules remain enforced. This is not general admission protection or permanent fee coverage.

## First command: read-only plan

```bash
cd ~/Settlio &&
git pull --ff-only origin main &&
NODE_OPTIONS="--dns-result-order=ipv4first --no-network-family-autoselection" \
BASE_SEPOLIA_RPC=https://base-sepolia-rpc.publicnode.com \
LASNA_RPC=https://lasna-rpc.rnk.dev \
npm run plan:recovery:v4
```

No key is needed. Review the final `remainingLifetimeQuotes: "1"`, all prior closure records and `canGrant` before any signing step. The same working RPC/IPv4 environment applies to later commands. Do not use the old V3 `pause:recovery`/`resume:recovery` commands for V4.

`status:recovery:v4` is read-only and reports the saved owner hashes, current verification and pause preconditions. It does not itself authorize pausing; the final grant receipt is verified separately in the signed pause path. Each signed command must receive the sponsor key only via the local hidden prompt. Never paste the key into chat.

## Acceptance and limits

Required evidence: final credit/creation, authentic owner pause, genuine participant retry and consumed limit, pre-restore paused/queued observation, authentic restore, matching resumed network CRON/request/delivery, terminal destination/source accounting and zero principal. No synthetic callbacks or fabricated outage claims can count as public proof. Isolated protocol fixtures and callback impersonation are local tests only.

Record browser actions separately and qualify any cuts or unrecorded intervals. Keep the earlier accepted ETH/USDC release/refund/expiry evidence; current idle/counter verifiers for those historical checkpoints can legitimately stop passing after another reservation/quote. Use explicit recorded replay when discussing historical evidence.

This step does not complete final admission/journey review, browser/mobile coverage, production funding guarantees, or submission/demo requirements. Those gates remain open until separately reviewed. M3 has not started.

Validation for this grouped preparation: `npm test` passed 198/198, with zero failures, skips or cancellations. The focused operations/credit run passed 10/10, and the separate pause/network unit run passed 2/2. The two-chain recovery fixture explicitly uses local protocol/callback simulation and does not count as public recovery evidence. No contract or frontend source changed; no new web-build result is claimed.


## V4 quote 6 — controlled recovery public proof, 25 November 2026

Independent raw-RPC collection and the new `verify:recovery:v4` validator establish the final unpaid quote's controlled recovery. The [complete public bundle](../deployments/evidence/v4/quote-6-recovery-verified.json) records grant, owner pause, creation, a single consumed participant retry, owner restore, real network CRON, associated Reactive request, authenticated destination expiry and both-chain closure. The [user terminal observations](../deployments/evidence/v4/quote-6-user-observations.json) are separately labelled provenance; fresh user reproduction of the complete verifier remains pending. See [procedure and result](V4_CONTROLLED_RECOVERY.md).

Successful public hashes: grant `0x36c086ac6797e5c8c0eafcfa30ce95a1ee4d43442ea23411c1871896dbd7756f`; owner pause `0x0e2d517eb5315601012d9db7d0810e53f2b2b1da2b087c26fb12e80a67a07c4d`; creation `0x1ea3654d1081ad1593f0a14233a52896539d8a43728fabf64feb020aa5c8720e`; retry `0xf550fc2dbf043fb5664565f5e03b7444afc950a8da84036890ab5a32d12cf3cc`; owner restore `0x9113708fad9ad2e5ed405f1ec6b80f3d0b656c9909ca3508b3d847f270d9af6f`; CRON `0x4b127fc6fd7ee8c833765acd83430d104d60d5124b866536a3db645d80f290da`; associated reaction `0x2bb12c7d975ddffd62b1e7bdb7bd0ca0925d3604766a01b7f1a899f6144f47a5`; expiry callback `0x80e72e14b40270466409884920a052a5bd32ee1a686169745217532f16ba5773`.

The pinned Lasna block immediately before restore shows paused=true, CRON=false, one active job, zero request attempts, and the genuine PolicyRequested fingerprint already processed. Its block hash matches the restore block's parent. Retry occurred after the original payment deadline. Creation and retry have relayed top-level envelopes; source-matched escrow runtime at both historical blocks plus QuoteCreated/admission/PolicyRequested/RetryConsumed events establish the admitted merchant and authorized retry path. Exact internal merchant/customer retry caller attribution is not claimed; PublicNode debug_traceTransaction was unavailable. No direct merchant-to-escrow transaction is fabricated.

At the terminal checkpoint quote 6 is Expired, the admission and source job are closed, active/reserved/jobs are zero, the scheduler is unpaused, CRON is unsubscribed, and ETH/USDC custody and liabilities are zero. Six of six immutable lifetime admissions are consumed. This is **controlled owner-pause recovery**, not evidence of a protocol outage, untouched unattended execution, browser closure, unique protocol return-report attribution, measured production funding, or future delivery. Earlier scoped proofs remain preserved. Final demo availability after exhaustion, remaining admission/journey/browser/mobile review and fresh user verifier reproduction remain open. **M2 remains OPEN; M3 has not started.**

Judging, equally weighted: Execution has genuine resumed CRON/request/authenticated expiry; Integration shows Reactive resumes queued work and closes it after destination acknowledgement; Usefulness demonstrates recovery without paying or exposing customer principal; Craft adds a read-only reproducible verifier, historical state binding and honest relayed-route limits. No deployment, funding, credit, pause/restore or other public transaction was sent by this evidence/documentation change.


### Verified timeline (Africa/Lagos, WAT)

| Action | 25 November 2026 |
|---|---|
| Final credit | 15:21:58 |
| Owner pause | 15:26:59 |
| Unpaid creation | 15:36:45 |
| Payment deadline | 15:38:00 |
| Participant retry | 15:43:04 |
| Owner restore | 15:50:04 |
| Associated Reactive request | 15:51:25 |
| Authenticated expiry | 15:51:27 |

Creation and retry were relayed; the receipt logs, historical quote and compiled-runtime check establish their scope. They must not be reported as top-level transactions sent directly by the merchant. This proof does not independently identify which authorized participant was the internal retry caller. Historical paused/queued state is independently read at block `0x8cc2db`, immediately before restore; it confirms retry ingestion while paused.

### Fresh user reproduction (read-only)

```bash
cd ~/Settlio &&
git pull --ff-only origin main &&
NODE_OPTIONS="--dns-result-order=ipv4first --no-network-family-autoselection" \\
BASE_SEPOLIA_RPC=https://base-sepolia-rpc.publicnode.com \\
LASNA_RPC=https://lasna-rpc.rnk.dev \\
npm run verify:recovery:v4
```

No key is required and no transaction is sent. Fresh receipt, history, deployed-runtime and historical-state reads must all pass before a successful snapshot is written atomically. An RPC/archival failure leaves the previous successful file intact and does not mean the public action failed. `npm run verify:recovery:v4 -- --recorded` is explicitly archived replay, not fresh network proof. The collector reuses the bounded quote-history reader and accepts only quote 5 or 6; the existing quote-5 validator remains strict and unchanged.

Validation for this grouped evidence checkpoint: full `npm test` passed 204/204 with zero failures, skips or cancellations; the expiry/history/recovery focused run passed 19/19; the final recovery mutation tests passed 6/6, including historical runtime tampering checks. The normal `verify:recovery:v4 -- --recorded` CLI passed as explicit archived replay. Independent public collection used the actual JavaScript collector/validator with a Python HTTPS RPC transport in this workspace; a fresh native Node/Ubuntu CLI reproduction by the user is still pending. No contract/frontend source changed, and no new web build is claimed.

Provisional M2 checkpoint assessment (equal weight, 1–5; self-review, not an external judging result): Execution 4/5 and Integration 4/5 for genuine multi-asset policy outcomes and controlled recovery; Usefulness 3/5 for the demonstrated workflow without claimed customer adoption/validation; Craft 3/5 while complete browser/mobile journeys, remaining acceptance review, demo availability and submission deliverables are open. These scores do not close M2.


### Public transaction links

| Action | Explorer |
|---|---|
| Final grant | [0x36c086ac6797e5c8c0eafcfa30ce95a1ee4d43442ea23411c1871896dbd7756f](https://sepolia.basescan.org/tx/0x36c086ac6797e5c8c0eafcfa30ce95a1ee4d43442ea23411c1871896dbd7756f) |
| Owner pause | [0x0e2d517eb5315601012d9db7d0810e53f2b2b1da2b087c26fb12e80a67a07c4d](https://lasna.reactscan.net/tx/0x0e2d517eb5315601012d9db7d0810e53f2b2b1da2b087c26fb12e80a67a07c4d) |
| Creation | [0x1ea3654d1081ad1593f0a14233a52896539d8a43728fabf64feb020aa5c8720e](https://sepolia.basescan.org/tx/0x1ea3654d1081ad1593f0a14233a52896539d8a43728fabf64feb020aa5c8720e) |
| Participant retry | [0xf550fc2dbf043fb5664565f5e03b7444afc950a8da84036890ab5a32d12cf3cc](https://sepolia.basescan.org/tx/0xf550fc2dbf043fb5664565f5e03b7444afc950a8da84036890ab5a32d12cf3cc) |
| Owner restore | [0x9113708fad9ad2e5ed405f1ec6b80f3d0b656c9909ca3508b3d847f270d9af6f](https://lasna.reactscan.net/tx/0x9113708fad9ad2e5ed405f1ec6b80f3d0b656c9909ca3508b3d847f270d9af6f) |
| Network CRON | [0x4b127fc6fd7ee8c833765acd83430d104d60d5124b866536a3db645d80f290da](https://lasna.reactscan.net/tx/0x4b127fc6fd7ee8c833765acd83430d104d60d5124b866536a3db645d80f290da) |
| Associated reaction | [0x2bb12c7d975ddffd62b1e7bdb7bd0ca0925d3604766a01b7f1a899f6144f47a5](https://lasna.reactscan.net/tx/0x2bb12c7d975ddffd62b1e7bdb7bd0ca0925d3604766a01b7f1a899f6144f47a5) |
| Authenticated expiry | [0x80e72e14b40270466409884920a052a5bd32ee1a686169745217532f16ba5773](https://sepolia.basescan.org/tx/0x80e72e14b40270466409884920a052a5bd32ee1a686169745217532f16ba5773) |


## V4 controlled recovery user reproduction COMPLETE — 25 November 2026

Fresh Ubuntu `npm run verify:recovery:v4` passed at **2026-11-25T15:10:26.840Z (16:10:26 WAT)** on source commit `400447d18a3b4b6c1cf4e58732b1eec7588bb130`, with PublicNode Base Sepolia, official Lasna RPC and the recorded IPv4 Node options. [User-result provenance](../deployments/evidence/v4/quote-6-user-observations.json) is separate from the independently collected quote-6 bundle. The result confirms processed retry before restore, authenticated Expired outcome, closed source/admission, idle unpaused scheduler, zero observed customer principal and six consumed lifetime admissions. The **scoped V4 controlled recovery item, including fresh user CLI reproduction, is COMPLETE**. Earlier reproduction-pending notes are historical and superseded.

Relayed internal-caller attribution, unique return-report mapping and browser-closure limits are unchanged; no protocol outage, untouched unattended execution or future-delivery guarantee is claimed. No new public transaction, deployment, funding or credit is needed for this verification. The immutable six-quote capacity is exhausted. **M2 remains OPEN** for final admission/journey review, actual browser/mobile and approval usability checks, and the demo/deployment availability decision; M3 has not started. This update changes evidence/acceptance documentation only. The prior implementation checkpoint's 204/204 tests remain its recorded result; no new test run or build is claimed here. The four-criterion self-assessment remains unchanged pending those reviews.
