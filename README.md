# Settlio

Settlio turns service quotes into wallet-funded bookings using Base Sepolia escrow and Reactive Lasna automation.

## Current status — 23 November 2026

**M1 COMPLETED: quote -> ETH/USDC deposit -> Reactive -> authenticated booking confirmation, with receipt recovery.**

The [M1 acceptance checklist](docs/M1_ACCEPTANCE.md) marks each completed requirement and links its source, tests and evidence. All three contracts compile; TypeScript/production frontend build passes; M1 baseline had 46 local tests; the current suite has 126 passing checks including M2 destination-policy and scheduler cases. Real ETH and USDC confirmation trails are verified. The user reran both public-trail verifiers, preflight and live healthcheck successfully from WSL on 23 November.

Original creation pause/reload/recovery is supported by user recording/screenshots. Malformed/mismatched service-term recovery is verified using the same coordinator as the app, with a real isolated EVM receipt and persistent storage. Local fixtures do not count as live integration evidence. No exhaustive browser/device coverage or independent security-audit claim.

**M2 IN PROGRESS / LIVE EXPIRY, ETH/USDC REFUNDS, ETH/USDC RELEASES AND FEE RECOVERY VERIFIED:** destination policy, bounded CRON scheduler, explicit-consent payment and versioned policy-interface code are implemented and locally tested. Versioned deployment and subscription checks passed from user WSL. M2 Quote 1 has independently verified authenticated on-chain expiry and fee recovery. M2 Quote 2 completed authenticated ETH confirmation/cancellation/refund with exact refund-block balance deltas, zero remaining native liability and closed scheduler; see [public evidence](deployments/evidence/m2/quote-2-eth-refund.json). USDC Quote 4 also completed an authenticated 1 USDC refund with exact token balance deltas, zero liability and scheduler closure; see [public evidence](deployments/evidence/m2/quote-4-usdc-refund.json). Read-only refund verification and user WSL reproduction are complete. ETH Quote 5 and USDC Quote 6 automatic releases are independently verified; Quote 6 reopening is video-verified and its earlier tab closure user-confirmed. Continuous closed-interval footage is unavailable; release CLI and user WSL release reproduction are complete; remaining funding/cost/recovery acceptance remains open. The separate M1 deployment retains its original confirmation-only receiver. See [M2 acceptance ledger](docs/M2_ACCEPTANCE.md). Do not delete the M1 journal or use its legacy deploy command for M2. Run the read-only M2 checks before any new deployment. The approved full interface/rotating hero is M3; release/submission is M4. ETH and USDC are enabled; USDT is disabled as Coming soon.

## Documentation

| File | Purpose |
|---|---|
| [M2 acceptance](docs/M2_ACCEPTANCE.md) | Active implementation, completed local checks and pending release gates |
| [M1 acceptance](docs/M1_ACCEPTANCE.md) | Completed requirements, exact evidence, reproducible checks and limits |
| [Master plan](SETTLIO_MASTER_PLAN.md) | Approved scope, policies and milestone gates |
| [Progress](docs/PROGRESS.md) | Dated work/verification history; current status at top |
| [On-chain evidence](ONCHAIN-EVIDENCE.md) | Genuine addresses, full transaction trails and decoded checks |
| [Project instructions](AGENTS.md) | Sequential work, verification and documentation rules |
| [Licence](LICENSE) | MIT terms for Settlio; dependencies retain their licences |

Together with this README, there are seven Markdown documents plus LICENSE. Two [JSON snapshots](deployments/evidence) supplement the human-readable records.

## Check the source

Node.js 22.18 or later and npm are required.

```sh
npm ci
npm run setup:reactive
npm run build:contracts
npm run build:web
npm test
```

The official Reactive dependency is pinned by the setup script. Each contract suite uses isolated Anvil accounts, verifies chain/account identity and signs locally. Fixture transactions and adversarial tokens never represent public customers or issuer integrations.

## Run the existing frontend

Use the escrow actually returned by your deployment. For the evidenced M1 deployment, create apps/web/.env.local:

```dotenv
VITE_ESCROW_ADDRESS=0xfD09cf3bfd3aD13a03Cfb499ec18D97d79748c83
VITE_BASE_SEPOLIA_RPC=https://sepolia.base.org
VITE_LASNA_RPC=https://lasna-rpc.rnk.dev
```

Then run:

```sh
npm run dev
```

Restart Vite after changing configuration. An absent/invalid escrow configuration disables history/transactions and shows setup instructions; it does not mean chain records were deleted. Never put private keys in VITE variables or share environment files.

## M1 payment policy

Merchant offers native test ETH and optionally issuer-listed Base Sepolia USDC, each with separately set totals/deposits. No automatic exchange rate is assumed. The designated customer's first successful payment locks the selected option. USDC requires exact-amount approval followed by payment; approval alone does not pay. ETH is still needed for gas.

Shared terms bind service description, wallets, exact amounts/options and timestamps to the recorded fingerprint. Payment is disabled if terms are missing or do not match. Share-link terms are readable by anyone with the link; avoid confidential information.

Payment requires block.timestamp < expiresAt even if scheduled expiry is delayed. Contract code accounts separately for each asset and reserves eligible cancellation claims; callback gas cannot spend principal. Fee-on-transfer/rebasing assets are unsupported. The escrow does not vet arbitrary merchant-supplied tokens; the interface enables only ETH and verified USDC.

The existing public M1 receiver currently supports confirmation only. Upcoming M2 source includes policy routes, but they are not deployed. Cancellation/refund/expiry routing is not enabled, and remaining-balance collection is not implemented. Current release requires a merchant transaction after cutoff and confirmation with no reserved cancellation. The approved automatic-release policy is future M2 work, applies only through explicit accepted terms/new deployment, and does not attest service delivery.

USDC address: 0x036CbD53842c5426634e7929541eC2318f3dCF7e, 6 decimals. [Circle deployment source](https://developers.circle.com/stablecoins/usdc-contract-addresses), [test faucet](https://faucet.circle.com/). No substitute token is advertised as USDT.

## Wallet and receipt recovery

Connection checks Base Sepolia and adds official metadata only when the wallet reports an unknown network. Declining is respected; chain/account are rechecked before signing.

Submitted hashes are stored per escrow. During unresolved receipt tracking, new actions are paused. Check saved transaction reads the original receipt without resubmission. No receipt means unknown outcome, not failure. Stop local tracking never cancels a transaction; inspect wallet/explorer before sending again. Replaced/dropped transactions and cross-tab coordination still require care and broader release coverage.

Recover a created quote accepts a creation hash, verifies the configured escrow's successful creation event and restores original matching saved terms. Payment/approval receipts cannot create a quote. If restoring damaged/mismatched terms throws, the saved pending hash remains available. Browser storage/RPC availability and original share links still matter.

Development-only diagnostics at ?screen=new&receipt-check=pause support actual post-broadcast client interruption and explicit existing-receipt restaging. Restaging an already successful receipt is labelled separately and is not original-interruption proof. Diagnostic controls are absent from the production build.

## Read-only live verification

Keep your public deployments/testnet.json journal on your own checkout. Its deployment addresses are public; keys are not. Do not delete it to bypass version/source checks.

```sh
npm run preflight
npm run healthcheck
```

Healthcheck verifies identity/wiring, ETH/USDC custody and separate automation balances/debt/reserves. Successful readings are point-in-time observations, not guarantees of future callbacks. A failure can mean bad configuration, RPC unavailability, a failed check or funding needs.

For full payment trails, use [the exact verifier commands](docs/M1_ACCEPTANCE.md#reproduce-checks). The verifier reads genuine receipts, event linkage and authentication, then writes a snapshot only after success. Committed snapshot timestamps are historical; refreshed user-local snapshots are not silently presented as published.

## Deployment and later work

M1's existing public addresses are in [on-chain evidence](ONCHAIN-EVIDENCE.md). M2 uses the separate commands below with dedicated testnet funding. The legacy deploy:testnet command refuses policy bytecode before reading a key or touching its journal. Read .env.example and the deployment script first; environment files are not loaded automatically. Preserve journals and inspect interrupted transactions before retrying. No redeployment is needed for current frontend/recovery changes.

Finish/prove core unattended policies before optional messaging. WhatsApp Business and iMessage via Photon are planned only; provisioning/subscription entitlements are unverified, and no messaging code is implemented.

## Submission

Track: Set It and Forget It. Execution, Integration, Usefulness and Craft have equal weight. Release requires public open-source source, deployed addresses, several genuine full-loop traces and a public demo video strictly under three minutes. The recovery recordings in the conversation are not the public submission video. No winning score or adoption is claimed.

MIT for Settlio source; upstream dependencies retain their own licensing.


## M2 policy interface (live journey unverified)
New policy deployments use version 3 shared terms. Merchant automatic release defaults off; the customer sees the immutable choice and explicitly accepts it in payDepositWithPolicy. Existing version 1/2 share fingerprints are unchanged, and legacy automatic-policy payment bypass is rejected in the new escrow code.

The interface detects the deployed version, verifies new scheduler wiring before policy creation, shows real job/funding/attention observations and separates refund pending from refunded/released states. RPC errors remain unknown. New actions remain unavailable on the existing M1 deployment. Browser/extension/physical-device journeys and live M2 proof remain pending. See [M2 acceptance](docs/M2_ACCEPTANCE.md). Browser RPC settings are public; never supply private keys or confidential credentials as VITE_* values.

## Versioned M2 deployment checks

These commands read public state and never require a key:

```sh
npm run preflight:m2
npm run plan:m2 -- YOUR_PUBLIC_DEPLOYER_ADDRESS
npm run verify:m2
```

preflight:m2 checks network IDs, protocol/USDC/CRON code, USDC metadata and a recent correctly shaped CRON100 event. plan:m2 additionally estimates creation gas/costs and reads wallet balances; configuration and future automation charges are additional. verify:m2 requires an existing deployments/testnet-m2.json and checks recorded creation/configuration transactions, compiled runtime (constructor immutable slots checked through wiring getters), versions, ten active origin subscriptions, current CRON/queue state, liabilities and separate fee accounts. An unavailable subscription index is a blocked verification, never a pass. The live preflight attempt in this workspace failed without verified observations on 23 November; run these from the funded WSL environment before deployment.

Only deploy:m2 reads DEPLOYER_PRIVATE_KEY and can broadcast. Supply that key securely in your local shell; never put it in command arguments, chat, Git, or VITE variables. REACTIVE_FUND defaults to 0.1 and CALLBACK_FUND to 0.001 in each network's native fee currency. These are initial funding amounts, not a future-delivery guarantee. Then npm run deploy:m2 creates new contracts, preserving M1 and its frontend configuration.

The M2 journal freezes source, deployer and constructor funding. Each transaction intent/hash is saved before broadcast. Resuming signs and checks that same intent; occupied nonces, reverted receipts and changed inputs block automatic replacement. Preserve the journal after an interruption. The .deploy-m2.lock is removed on normal exit; after a crash, confirm no deployment process is active before inspecting/removing a stale lock. Do not delete or edit saved intents to force a retry.

M2 deployment verification is not unattended execution proof. Keep M2 open until real scheduled expiry, ETH/USDC refunds and eligible automatic releases have full traces and browser-closed evidence. The existing verify:quote command accepts an optional final M2 journal path and writes M2 confirmation evidence under deployments/evidence/m2, preserving M1 snapshots. Scheduled-policy trace verification remains pending.



## CRON event correction — live preflight passed
User WSL diagnostics found CRON100 logs with two topics and empty data. The [official source](https://github.com/Reactive-Network/system-smart-contracts/blob/72710d2b5f4e15e445da782aaef9f8bae59f4af9/src/SystemContract.sol) declares the number indexed, despite prose documentation saying otherwise. Both our previous preflight and scheduler incorrectly expected an unindexed number. They now require the indexed layout. Final 80-test suite and builds pass, including an actual local indexed-event regression; public unattended execution is not yet proven.

Rerun npm run preflight:m2 followed by npm run plan:m2 -- YOUR_PUBLIC_DEPLOYER_ADDRESS. Both are read-only. diagnose:cron remains available and now reports indexed-number matches/samples. The corrected user WSL preflight and plan passed on 23 November (CRON100 block 9050100); deployment and live Settlio policy execution remain pending. Do not delete deployment journals to bypass the updated source fingerprint. M2 remains open.


## Inspect a stopped M2 deployment
The user-local deployment attempt on 23 November stopped with a generic error. Its broadcast/creation outcome is unknown; do not infer that nothing was sent or delete its journal. Run npm run status:m2 without a key before retrying. It reports only public journal fields, lock presence and current saved-hash receipt observations, and never writes files, signs, broadcasts or removes a lock. A missing RPC transaction is unknown, not failed. No journal means no saved intent was found, not a general proof about wallet history.

New deployment failures include a fixed stage and allowlisted error code while suppressing raw error messages/key material. Share status output for diagnosis before resuming the preserved intent. M2 stays open until public deployment, full unattended traces and remaining acceptance gates are verified.


## M2 subscription parser correction — resolved
User WSL status reports successful Reactive/callback creation and configuration receipts. Addresses and hashes are in ONCHAIN-EVIDENCE.md with provenance. Verification stopped because Lasna returns Version/TopicFilters while the documented example uses version/topicFilters. The parser supports both explicit wrappers, retains all exact active subscription checks, and passes the full 86-test suite.

Pull main and run npm run verify:m2 without a key. This reads the existing M2 journal/contracts and full subscription index. Do not redeploy or delete the journal to resolve this casing issue. Read-only verification passed from user WSL; genuine unattended policy traces are still required. M2 is not accepted. Earlier unknown-outcome notes are historical and superseded by the supplied status receipts.


## Verified M2 deployment — start its interface
User WSL verify:m2 passed on 23 November: policy version 3, correct compiled code/wiring, ten active origin subscriptions, covered empty custody and funded fee accounts. Zero jobs means CRON is correctly idle, not paused. These are point-in-time prerequisites; live policy execution remains pending.

To use the new escrow in a separate local dev process:

```sh
VITE_ESCROW_ADDRESS=0x1694e56187f9422e364B42af3185d34a0D4b9bc0 npm run dev -- --port 5174 --strictPort
```

Open http://localhost:5174 and check the merchant create-quote policy controls before creating a timed test. The process variable takes precedence over dotenv values for this run; no saved configuration or M1 quote is migrated. Do not change old share links to point at the new contract. The full M2 live/browser/evidence gates remain in the acceptance ledger.


## First live policy test — initial registration blocker (superseded)
The unpaid M2 Quote 1 was created, but the user observes zero scheduler jobs. Official read-only Reactive diagnostics confirm the exact policy filter is active and a matching origin event exists. Two network checks flag likely origin-ingestion stalling; the bounded origin trace cannot prove delivery because its RPC scan budget was exhausted. These observations do not establish a confirmed network-wide outage or rule out every application defect.

See deployments/evidence/m2/quote-1-registration-diagnostic.json and the acceptance ledger. Keep the quote unpaid. Neither an overdue payment deadline nor a UI expired label proves a successful policy callback. Registration/CRON/callback proof and a sufficient separate fee buffer remain required. M2 is not complete. No repeated quote creation or redeployment is justified by these observations.


## Current M2 recovery: registered, debt-blocked, delivery pending
Fresh independent checks show network sequencing moving and Quote 1 registered with three callback requests. A real CRON -> Reactive -> request trace is verified; Base expiry is not. The Reactive subscriber now owes 0.0147685 test REACT and has no active subscriptions due to debt. Initial fee funding was insufficient. Records and machine-readable diagnostic evidence distinguish this from the earlier registration blocker.

npm run fund:m2 uses a securely supplied local DEPLOYER_PRIVATE_KEY to deposit exactly **1 test REACT** through the official Lasna system's depositTo(address), targeting the existing recorded M2 subscriber. This clears debt first and adds remaining funds to reserves. It verifies the recorded creation/source/wiring and expected signer/network, shares the M2 lock, and saves a fundReactive intent before broadcast. Rerunning reuses that exact operation and does not send a second deposit. A different future top-up requires explicit new tooling/intent rather than editing this journal. No other funds or deploy settings are changed.

Run npm run status:m2 to inspect the funding hash and npm run verify:m2 after recovery. Neither read-only command needs a key. Do not send a plain transfer to SYSTEM or assume a direct subscriber transfer settles debt. No customer deposit is needed for Quote 1. Reserve recovery is not callback proof; destination delivery remains separately pending. One test REACT is a recovery buffer, not a future-fee guarantee. No public top-up was sent during development.


## Reproduce the first M2 expiry
Quote 1 is now Expired on Base and its scheduler job is closed. Funding recovery cleared fee debt. Raw public evidence and scoped results are in deployments/evidence/m2/funding-recovery-1.json and quote-1-expiry.json.

```sh
npm run verify:m2
npm run verify:expiry -- 1 \
0x26d54a13b47dafeced742b46ae831140348aa535e7af71e8b35fc547fa1014f6 \
0xbf44cf5d4ddd5bc0a10ef3a9e30180c80d1e997503f232585a8522a2b9732bdb \
0x26d506ff287ed32a7e011323b7a567f13a4864af46acdc2519bfdbfcf7e0f7ff \
0x547bbbf96a201348cf818f4dcf97a55dacb9403b24892009d152c2e219064899
```

Both commands are read-only and need no private key. verify:expiry writes a public snapshot only after its validation passes, preserves M1 evidence, and accepts an optional final journal path. Existing published snapshot time is historical; a fresh local result is not silently represented as a newly published observation. The same validator passed independently fetched live RPC responses here. User WSL then reproduced the full verify:m2 and verify:expiry commands successfully at 2026-11-23T14:55:21.519Z; the earlier workspace Node transport failure remains historical.

The scope is authenticated quote-linked expiry. Identical retries prevent unique attempt attribution without the missing return-report mapping; browser closure was not recorded. These limits are explicit in the result. A missing Reactive CallbackPosted report must not override successful Base receipt evidence. Other live M2 flows and operational acceptance remain open.


## First expiry reproduction completed
User WSL on 8107f00 confirmed Expired, schedulerClosed true and an idle queue/CRON, with zero debt. Full CLI reproduction is complete. Identical retry attribution and unrecorded browser closure remain explicit limits. The next live M2 gate is an ETH deposit followed by eligible cancellation and exact automatic refund; no new quote/payment is recorded yet.


## Latest M2 checkpoint — USDC refund verified, 23 November 2026
Quote 4 approval, 1 USDC deposit, Reactive confirmation, eligible cancellation, CRON/request and authenticated refund are independently checked. Token balance/liability zero and terminal scheduler acknowledged. See deployments/evidence/m2/quote-4-usdc-refund.json and the acceptance ledger. Browser closure and unique request attribution are not claimed. Fee health has zero debt and about 0.414101 test REACT reserves at the observation; cost/admission and release funding review remain open. Earlier next-step/recovery sections are historical; M2 remains NOT ACCEPTED.


## Reproduce accepted M2 refunds

```sh
npm run verify:refund -- 2
npm run verify:refund -- 4
npm run verify:m2
```

These commands need no private key or wallet signature. Refund verification re-fetches genuine public receipts and current state, then writes separate quote-ID-refund-verified.json bundles after checks pass. IDs 2 and 4 refer to the accepted M2 ETH and USDC trails. Original evidence is preserved. It requires historical RPC access and may conservatively reject unrelated same-block balance movements. Use `npm run verify:refund -- 2 --recorded` (or 4) only for an explicitly labelled archived-evidence replay, not a new live check.

Both fresh collectors/validators passed via independently fetched RPC data; user WSL reproduced both live refund commands successfully on 23 November at 16:02 UTC, followed by verify:m2. The published evidence files retain their original collection dates. Twelve new focused evidence/tamper checks pass; full suite baseline is now 107. No new deployment or contract/frontend source change. Fee observations are public in deployments/evidence/m2/fee-observation-2026-11-23.json; block reserve changes are not a complete per-quote fee or future delivery guarantee. Automatic release, browser-closed evidence and operational admission remain open.


## Refund reproduction accepted — 23 November 2026
ETH Quote 2 and USDC Quote 4 live CLI runs passed from user WSL. Current user health output has zero liabilities and fee debt, zero jobs, idle CRON and 0.414101 test REACT reserves. This closes refund CLI reproduction, not browser-closed execution or automatic release. M2 remains NOT ACCEPTED; the next gate is adequate separate fee budget and a recorded browser-closed release journey.


## Prepare the automatic-release test

```sh
npm run budget:m2 -- 30
```

Read-only, key-free conditional stress budget; it must report canStart true immediately before creation, alongside verify:m2. The model assumes one quote with cutoff within 30 minutes, no competing jobs, twice sampled cadence/current prices and a 15-minute delivery allowance. It is not a delivery/actual-cost guarantee or on-chain admission rule. Initial public observation failed: 13.6 test REACT modeled requirement vs 0.414101 reserves; callback buffer passed. See deployments/evidence/m2/release-budget-before-funding.json and [the prepared test procedure](docs/RELEASE_TEST.md).

After sufficient test REACT arrives in the recorded deployer wallet, `npm run fund:m2:release` uses the local DEPLOYER_PRIVATE_KEY to create/resume one **14 test REACT** reserve deposit through SYSTEM.depositTo(existing subscriber), recorded as fundReactiveRelease. Existing fund:m2 keeps its original one-time 1-token recovery. Rerunning either purpose never creates another deposit. Do not edit/delete journal intents. This code does not claim a live top-up has happened. Verify its receipt, run budget:m2/verify:m2 again, then arrange fresh WAT quote times and closure recording. M2 remains open; current full suite passes 112 tests.


## Release-test reserve funding completed — 23 November 2026
Separate 14-test-REACT deposit independently verified in 0x8a0f11608a458b9e88a1da0ebdb98cc3436493921f9335da8cbef3d26b51f7cc; decoded correct SYSTEM.depositTo(existing M2 subscriber). User WSL budget passed at 17:17 WAT with 14.414101 prepaid reserves against 13.6 conditional modeled requirement and sufficient callback funds. See deployments/evidence/m2/release-funding-verified.json. Rerunning the saved funding purpose resumes it, not another deposit. Readiness is point-in-time; automatic release and browser closure are still unproven. Next: fresh consented ETH release quote and recorded journey. M2 NOT ACCEPTED.


## ETH automatic release verified — 23 November 2026
M2 Quote 5 released its 0.0001 ETH deposit through an authenticated scheduled callback at 17:50:28 WAT after its 17:50 cutoff. Real deposit/Reactive confirmation, CRON/policy request/delivery, merchant balance delta, cleared native liabilities and closed scheduler are recorded in deployments/evidence/m2/quote-5-eth-release.json. Supplied video shows Confirmed/Released UI but does not establish browser closure. USDC release, browser-closed capture, reusable release CLI/WSL reproduction and remaining cost/recovery/journey gates remain open. Fresh conditional next-test budget passes; this is not a future fee/delivery guarantee. M2 NOT ACCEPTED.


## USDC automatic release and reopening verified — 23 November 2026
Quote 6 paid exactly 1 issuer-listed test USDC to merchant at 18:20:37 WAT via the authenticated scheduled callback. Exact token balance deltas, zero remaining liabilities and terminal scheduler are verified; deployments/evidence/m2/quote-6-usdc-release.json contains the public origin/Reactive/CRON/callback trail. Fresh-tab reopening is independently verified from the second recording. Earlier tab closure is accepted as user-confirmed; no continuous interval or stitched chronology is claimed. No raw video was published by the assistant. No additional quote/recording is required now. Next: read-only release verifier/WSL reproduction and remaining M2 operational acceptance. M2 NOT ACCEPTED.


## Reproduce accepted M2 automatic releases

```sh
npm run verify:release -- 5
npm run verify:release -- 6
npm run verify:m2
```

No private key or wallet signature is needed. Default release mode reads fresh public receipts and current pinned observations, validates quote/opt-in/deadline/CRON/request/authenticated callback/merchant accounting and closed job, then writes separate quote-ID-release-verified.json snapshots. Existing original evidence is preserved. IDs 5 and 6 are accepted M2 ETH and USDC release trails, not arbitrary new test quotes. Historical RPC access is required; unrelated same-block account movement may conservatively fail strict delta verification.

`npm run verify:release -- 5 --recorded` (or 6) explicitly replays the archived verified bundle without fresh RPC. Browser actions are not inferred from receipts: the ledger separately preserves user-confirmed closure and video-verified reopening. Both fresh collectors/validators passed via Python HTTP transport and recorded CLI replay passed. User WSL reproduced both default live release commands successfully on 23 November at 17:57 UTC, followed by verify:m2. Published bundles retain their original independent timestamps. Full local suite passes 124 tests. No new contract/frontend build or transaction. WSL release reproduction is complete; M2 remains open for the documented operational recovery/admission acceptance review.


## Release reproduction accepted — 23 November 2026
Both ETH/USDC live release verifiers and current M2 health passed from user WSL. Observed zero principal liabilities and fee debt, closed jobs/idle CRON, source reserves 13.9554569 test REACT. Core outcome evidence is reproduced. Remaining M2 review is recovery evidence and fee/queue admission: work per tick is capped but active-job admission is not globally capped, and the stress-budget tool is off-chain. See the explicit remaining-gap matrix in docs/M2_ACCEPTANCE.md. No new payment/recording is requested now. M2 NOT ACCEPTED; M3 pending.


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
