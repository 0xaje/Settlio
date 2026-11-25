# Final V4 controlled recovery test

Status: tooling preparation. No public sixth credit, owner pause, participant retry, resume or recovery outcome is claimed yet. M2 remains open. Quote 5's fresh Ubuntu expiry CLI passed at 2026-11-25T13:44:12.937Z through PublicNode; the original endpoint failed its history-read path. Terminal provenance is separate from the independently collected proof.

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
