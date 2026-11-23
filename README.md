# Settlio

Settlio turns service quotes into wallet-funded bookings using Base Sepolia escrow and Reactive Lasna automation.

## Current status — 23 November 2026

**M1 COMPLETED: quote -> ETH/USDC deposit -> Reactive -> authenticated booking confirmation, with receipt recovery.**

The [M1 acceptance checklist](docs/M1_ACCEPTANCE.md) marks each completed requirement and links its source, tests and evidence. All three contracts compile; TypeScript/production frontend build passes; M1 baseline had 46 local tests; the current suite has 86 passing checks including M2 destination-policy and scheduler cases. Real ETH and USDC confirmation trails are verified. The user reran both public-trail verifiers, preflight and live healthcheck successfully from WSL on 23 November.

Original creation pause/reload/recovery is supported by user recording/screenshots. Malformed/mismatched service-term recovery is verified using the same coordinator as the app, with a real isolated EVM receipt and persistent storage. Local fixtures do not count as live integration evidence. No exhaustive browser/device coverage or independent security-audit claim.

**M2 IN PROGRESS / DEPLOYMENT RECEIPTS REPORTED SUCCESSFUL / VERIFICATION PENDING:** destination policy, bounded CRON scheduler, explicit-consent payment and versioned policy-interface code are implemented and locally tested. Versioned deployment commands pass local integration tests. New browser journeys, live deployment checks and genuine unattended proof remain pending. Scheduled expiry, cancellation/refund routing and automatic release are not operational in the existing deployment. See [M2 acceptance ledger](docs/M2_ACCEPTANCE.md). Do not delete the M1 journal or use its legacy deploy command for M2. Run the read-only M2 checks before any new deployment. The approved full interface/rotating hero is M3; release/submission is M4. ETH and USDC are enabled; USDT is disabled as Coming soon.

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


## Existing M2 contracts — subscription verification pending
User WSL status reports successful Reactive/callback creation and configuration receipts. Addresses and hashes are in ONCHAIN-EVIDENCE.md with provenance. Verification stopped because Lasna returns Version/TopicFilters while the documented example uses version/topicFilters. The parser supports both explicit wrappers, retains all exact active subscription checks, and passes the full 86-test suite.

Pull main and run npm run verify:m2 without a key. This reads the existing M2 journal/contracts and full subscription index. Do not redeploy or delete the journal to resolve this casing issue. A read-only verification pass and all genuine unattended policy traces are still required; M2 is not accepted. Earlier unknown-outcome notes are historical and superseded by the supplied status receipts.
