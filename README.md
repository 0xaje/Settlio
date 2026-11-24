# Settlio

Settlio turns service quotes into wallet-funded bookings using Base Sepolia escrow and Reactive Lasna automation.

## Current status — 23 November 2026

**M1 COMPLETED: quote -> ETH/USDC deposit -> Reactive -> authenticated booking confirmation, with receipt recovery.**

The [M1 acceptance checklist](docs/M1_ACCEPTANCE.md) marks each completed requirement and links its source, tests and evidence. All three contracts compile; TypeScript/production frontend build passes; M1 baseline had 46 local tests; the current suite has 147 passing checks including M2 destination-policy and scheduler cases. Real ETH and USDC confirmation trails are verified. The user reran both public-trail verifiers, preflight and live healthcheck successfully from WSL on 23 November.

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


## One-hour operator allowance window — 24 November 2026

User-approved correction after the first renewal also expired during a slow-network workflow. User WSL reports successful renewExpiredGrant receipt 0xf63394b6d8fa14ad89d64b8364f5a949cc91763c75caacbd2dcf042854fd071b, admission open, one unused reservation, quotes/admitted/jobs zero and zero ETH/USDC custody. The returned expiry 1795544127 is 19:15:27 Africa/Lagos; a subsequent current-time lookup was 19:20. It was already expired when the next instructions were being prepared. This is a usability/coordination failure, not a failed renewal receipt, additional funding need or successful quote journey. Provenance: user-terminal output; independent public renewal bundle pending.

New plan:window:v4 and window:v4 explicitly replace only that confirmed, expired, wholly unused first renewal with one 3600-second operator window. Quote deadline/cutoff horizon stays the immutable 900 seconds; lifetime/active/retry limits and all deployed bytecode stay unchanged. Merchant eligibility to create a future quote is separate from how long that quote may remain scheduled. Whole-lifetime cost is unchanged under the same fee observations, and funding/identity/idle/unused/expiry checks remain fresh before broadcast. Grant window is not a guarantee of future gas prices, protocol availability or delivery. No fees are taken from principal.

The ordinary initial and ten-minute renewal planners retain their 600-second bound. Only the explicit operator-window path permits up to 3600 seconds, independently of quote horizon, and includes the actual 3600-second proposal in its funding reference. A distinct operatorWindowGrant plan and grantOperatorWindow operation preserve original grant, opening, funding and first-renewal history. Repeating the command recovers its exact saved hash, not a rolling extension. No additional credit, deployment, funding, quote or payment is created. Generic recurring renewals and incremental grants remain unsupported.

Validation: full npm test completed with 149 passed, zero failures/skips/cancellations. The actual isolated two-chain operational fixture advances both chains past the first renewal, verifies the one-hour plan, issues the grant, checks expiry, repeats the command without another nonce/transaction, preserves both earlier plans and verifies deployment state. Model boundary checks reject implicit one-hour and over-one-hour proposals. These are local fixtures, not public one-hour issuance evidence. Contract/frontend source unchanged; no new build/public transaction claimed. M2 remains OPEN: public one-hour issuance, actual V4 quote/payment/Reactive/callback/policy journey and browser/mobile acceptance remain pending; M3 has not started. Execution: successful user-reported first renewal retained; new path currently local evidence. Integration: same real admission API and funding checks. Usefulness: removes the ten-minute operator coordination trap while retaining short booking tests. Craft: explicit separate intent, unchanged immutable limits and replay/refusal tests. Next: user signs the one-hour operation when ready, then refreshes capacity and sets fresh quote deadlines.


## V4 quote 1 ETH journey — 24 November 2026

**COMPLETE within scope: admitted ETH deposit, Reactive confirmation, CRON-triggered automatic merchant release, exact principal deltas and both queues closed. M2 remains OPEN.** Evidence: [public receipt bundle](deployments/evidence/v4/quote-1-release-verified.json), [browser provenance](deployments/evidence/v4/quote-1-browser-evidence.json), [reproduction guide](docs/V4_ETH_RELEASE.md).

Fixed deployed V4 escrow 0x5675C610d6f0aCe9f7933f3584D53dc4F567Dc6B, Reactive 0xFa1F509E21040bB4fE266B79E9583073914dFe6e, callback 0x49ff0a4Bfa918b0576315C31a0bcE561eEBf3Df0 and admission 0x935Ef09F57B68D08fd9Fd315755b7Daf49871486. Public creation 0x19dc9658753aded4496f6de1ba24781677c66b1b302c93ebe8f73c4ed7ada5fd consumes the merchant reservation and binds automatic release. Deposit 0x7f382d7194594201d476139169e38fd5726d21ea07f3c2b230f3e3009625118b records exactly 0.0001 ETH from the designated customer before the 19:40 WAT deadline. Confirmation request 0xc0fb11a8fa8c8bcbbeb86bdbd1bbac56af8771e5d86d5943f03a6c8ef209f587 matches that original log fingerprint; authenticated callback 0xdeb16540981772b9f9993c2527bff85fcefc029b98ce444c309aae24825c4a7a confirms quote 1.

Genuine indexed CRON100 0xe5d07c0371dcad4787f19e1e86d859e3fd195dded3797745366459ec8e429737 feeds matching source policy request 0xdc68ff6e8e966e275c96bb9d3c103fadfbd728651a2ed300508c56ca153793f7 (attempt 1). Base delivery 0xfae5751d4ada0e304910114e04686fbb0d7d5c27cfea19402ddcced7b21ffff4 traverses the official proxy, targets the correct receiver with the authorized Reactive sender/quote payload and releases at 19:47:12 WAT, after the 19:47 cutoff. Merchant and escrow release-block balance deltas each match 100000000000000 wei. Pinned current quote is Released; ETH balance/liability and USDC balance/liability are zero; admission job is closed, active/reserved zero, admitted one; source job closed, global jobs zero, CRON false, scheduler unpaused. These are observations for this single-quote deployment, not future guarantees.

Collector/validator ran against actual public Base/Lasna RPC data at sourceObservedAt 2026-11-24T19:06:19.850Z, using a temporary Python HTTP transport adapter because direct Node RPC access here is unreliable. The committed normal CLI uses the same JS collection/validation with ethers providers. Recorded CLI replay passed; fresh user WSL Node reproduction remains pending. No transaction was signed/sent by this evidence collection.

The 78.444250-second user recording was sampled at ten-second intervals: Confirmed before closure; Settlio tab absent around 30s; reopened quote Released around 50s; scheduler completion shown later. SHA-256 eec3cce80ceb1b687841b2ba3eefb448e532fd8d90bb3036339f8729670fbc70. This is qualified tab-close/reopen visual evidence, not proof of continuous closure across all wall-clock time or a complete frame audit. Raw video was not uploaded to GitHub. RPC does not prove browser actions. Matching requests/deliveries do not establish unique protocol return-report attribution; no general latency guarantee or service-delivery proof is claimed.

User WSL also reported one-hour operator grant 0x8d0d4021b8d58635dc556c829a4c3f262b7e88f13b3917723fbb5b4c69656f16, expiry 20:31:05 WAT and reference 0x4a1d9c223eec5fbd1302d7f9c7fe7d67ba61a48cb48cd57460b1e9f07da4398e, which appears in the quote's admitted event. This does not imply fresh production affordability after further traffic.

Validation: full npm test passed: 155 tests, zero failures/skips/cancellations. Six new archived-public-evidence checks cover V4 binding, admission receipts/counters, source idle/custody, failed/altered origin/callback/delta and browser annotations. npm run verify:release:v4 -- --recorded passed. These replay real archived data but are not additional live transactions. Legacy V3 release validation keeps its default identity; the V4 wrapper explicitly fixes the new identity and additionally requires V4 versions, gate binding, admission receipt events, slot closure, zero current single-quote liabilities and scheduler idle. Neither contract nor frontend source changed; no new browser/mobile build is claimed.

Remaining OPEN: V4 USDC and other policy/recovery/admission adversarial journeys not demonstrated by this ETH outcome, fresh user CLI reproduction and final item-by-item M2 review; mobile/remaining browser coverage and M3 final design pending. Do not create another quote without a separately reviewed merchant-credit plan; the one credit has been consumed and lifetime capacity does not regenerate.

Judging: Execution — genuine two-network confirmation and scheduled release trace, plus exact payout. Integration — real Reactive deposit observation and network CRON drive authenticated callbacks and terminal queue accounting. Usefulness — merchant receives the opted-in deposit after the refund period without manual claim in the observed callback trace. Craft — public archived bundle, refusal tests, read-only reproduction, scoped browser provenance and explicit remaining gaps. No prize guarantee or whole-milestone acceptance.


## V4 quote-2 sponsorship preparation — 24 November 2026

**IMPLEMENTED; M2 remains OPEN; no public quote-2 grant or USDC payment claimed.** User WSL fresh verify:release:v4 passed at 2026-11-24T19:10:00.624Z: quote 1 Released, admission slot closed, source scheduler idle and zero customer liabilities. **V4 ETH user CLI reproduction COMPLETE**, with user-terminal provenance. Its regenerated local snapshot bytes were not substituted for the separately collected public bundle; prior attribution/browser limits remain.

New [next-grant tooling](script/v4-next-grant.cjs) and [operator instructions](docs/V4_NEXT_QUOTE.md) implement one explicit one-hour merchant credit for quote 2. Unlike expired unused allowance renewal, this requires the previous one-hour credit consumed, the sole admitted quote terminal with zero liabilities, its admission job closed AND its Reactive job closed, no active/reserved work, idle unpaused source, and the confirmed original one-hour grant transaction matching its saved public proposal. This prevents reducing the budget while a previous job still needs source work. Original funding/grant/open/renewal/window records remain unchanged.

Funding budgets all five remaining immutable lifetime admissions, not just the next single credit. A projection of the verified empty remaining capacity is passed to the existing stress model; maxLifetimeAdmissions on chain remains six, admitted remains one and spent lifetime allowance never regenerates. The raw observation, closure proof, explicit proposal and projected model reference are bound into the sponsor attestation. No general incremental grants, repeated quote-2 credits, further-cycle automation or implicit top-up is authorized. New nextQuoteGrant plan and grantNextQuote stage use the existing lock/saved-intent/nonce recovery. Fresh funding/state are reread before unknown broadcast; stale plans, conflicting/nonterminal state, unknown or insufficient funding and wrong sponsor block execution.

Independent public remaining-budget observation collected through the actual JS observer with a temporary Python HTTP transport: [snapshot](deployments/evidence/v4/next-quote-budget-observation.json). Model required 205.6 test REACT versus 248.8223677 prepaid reserves, and 0.00185328 Base test ETH versus 0.0022222302696 callback funds; canGrant=true. These are recorded conditional observations, not a new signing plan, journal verification, expected actual fees or future delivery guarantee. All customer principal is excluded. User plan:next:v4 must freshly verify its own journal and actual prior grant before signing. The previous strict single-quote release verifier can legitimately stop passing its *current reserved=0* assertion once this next credit is issued; archived accepted historical quote-1 proof remains valid. Do not erase evidence or relax it to hide later state.

Validation: full npm test passed: 158 tests, zero failures/skips/cancellations; syntax check passed for next-grant script. No new public grant or USDC transaction was sent. Initial focused run 5/6 passed: the absent quote correctly triggered an earlier refusal than the test expected. The refusal-message matcher was corrected without weakening guards; repeated focused run 6/6 passed. The actual isolated two-chain fixture consumes one credit, refuses while active, expires the unpaid quote through an explicitly impersonated local callback, refuses before source acknowledgement, forwards the genuine local terminal receipt to the real Reactive contract, then grants once and recovers the same hash/nonce on repeat while preserving prior window history. This is local fixture evidence, not a public expiry or quote-2 result. Pure model tests cover all remaining admissions, no lifetime reset, stale/unknown/busy states, unacknowledged source and insufficient reserves. No contract/frontend source change, new build or public transaction is claimed.

Judging: Execution — accepted public V4 ETH trace and user reproduction retained; USDC pending. Integration — next admission depends on completed destination/source accounting and meaningful automation funding. Usefulness — one-hour workflow avoids the expired ten-minute trap, without replenishing consumed lifetime capacity. Craft — public read-only model observation, separate saved intent, refusal/idempotency checks and explicit provenance. Next: user read-only plan, then one signed credit when ready, then fresh USDC quote/approval/deposit/Reactive/policy evidence. Other M2 acceptance items and M3 remain open.
