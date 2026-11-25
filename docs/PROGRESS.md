# Settlio progress

## Current milestone status — 25 November 2026

**M0 complete; M1 accepted for its defined scope; six V4 M2 public journeys verified; formal M2 OPEN; M3/M4 pending.** [Current status](CURRENT_STATUS.md) contains the evidence map, exact scope and current constraints; [handoff](HANDOFF.md) is the continuation entry point.

Last full regression: **245/245**, zero failures/skips/cancellations, checkpoint 4038b52. Builds passed there; the subsequent wording-only correction 73dc15b had a fresh TypeScript/Vite build, not a new full-suite run. Desktop and 390 × 644 emulated terminal-state checks are qualified visual evidence, not a physical-mobile wallet test. The wallet-extension issue was later fixed as reported by the user; no independent clean-console pass is claimed.

All six immutable lifetime admissions on the current V4 deployment are consumed. Extra reserves cannot reset capacity. A dated read-only observation at 16:53 WAT on 25 November found 248.1593678 prepaid test REACT, 0.1 contract balance and zero source debt/jobs; it is not a fresh balance promise. The user cancelled replacement deployment preparation; no deployment, funding, grant, new quote or public proof transaction is authorized. Do not repeat accepted tests merely to produce another video.

## Documentation and backup handoff checkpoint — 25 November 2026

Consolidated the current status, replaced the unwieldy README with a concise entry point, preserved its complete previous content in [README_HISTORY.md](../README_HISTORY.md), and created [HANDOFF.md](HANDOFF.md) with a copyable prompt for Antigravity/new chats. Current summaries distinguish completed public scope, unresolved acceptance decisions, later UI work and submission tasks. Historical logs, evidence and Git history are preserved. Current work continues here; the handoff is a backup.

Next task: a no-spend operating-model proposal, not another deployment. M3 remains the full approved six-screen UI; M4 remains hosted release/submission and video strictly under three minutes. Docs-only validation is recorded in CURRENT_STATUS/HANDOFF; no new build/test/network observation is claimed. Judging assessment remains the dated 70/100 self-review, not an external score or progress percentage.

## Preserved historical record

Entries below, including older sections called “current”, retain their original dates and values. They are superseded where later evidence/current decisions explicitly say so; do not read the old 95/147-test summaries as today's count.

---

## Current milestone status — 23 November 2026
**M0 complete; M1 completed for its defined engineering scope; M2 in progress; M3/M4 pending.** [M1 acceptance checklist](M1_ACCEPTANCE.md) maps each completed requirement to its evidence and limits. The log below is chronological history: earlier open/failed/blocked entries are retained and superseded only by later explicit results. Completion does not imply zero defects, exhaustive browser/device testing or unimplemented later-stage features.


Latest checks: **95 local tests pass; prior contract and frontend builds pass**. Quote 1 authenticated on-chain expiry and fee recovery verified; remaining M2 gates open. User WSL full deployment/subscription verification passed; end-user policy execution remains pending. M2 versioned command flow is locally verified, but live preflight observations and unattended policy traces remain pending. See [M2 acceptance](M2_ACCEPTANCE.md).

## Contract foundation on 19 November 2026

Current milestone M1 remains open. The first live quote/deposit/Reactive/callback/UI flow has not been verified.

Implemented directly on main
- SettlioEscrow stores immutable per-quote merchant/customer, total, exact deposit, expiry, cancellation cutoff, and terms fingerprint.
- Payment requires the designated customer to accept that fingerprint before expiry.
- Principal accounting is isolated from the future callback receiver's automation funds.
- Confirmation and expiry are restricted to the configured callback receiver.
- An eligible customer cancellation reserves the deposit immediately, including before confirmation.
- Refund and confirmation callbacks tolerate repeated delivery. Pending refunds survive the cutoff and late confirmation.
- Merchant release requires confirmed status, cutoff reached, and no pending cancellation.
- Participants can emit a new confirmation request for later Reactive retry processing.

Actual verification
Solidity 0.8.29 compilation passed. npm test passed 9 tests (one parent scenario and eight subtests), zero failures. Tests run contracts on a local Anvil EVM and use a local signer as the callback receiver to isolate escrow permissions. They are local contract checks, not Reactive network evidence. The local startup briefly printed an RPC connection retry before Anvil became available; tests then completed.
Checks cover wrong payer/amount/terms, exact deposits, duplicate deposits, unauthorized/duplicate confirmation, refund reservation across cutoff, exactly-once refund, payment rejection at expiry, cancellation before confirmation, and merchant release at cutoff.

Reproduce
npm ci
npm run build:contracts
npm test

Milestone review
Execution is unverified on public networks.
Integration interfaces checked against current official Omni docs. Subscriber and authenticated network callback receiver are pending.
Usefulness workflow encoded in escrow. Independent user feedback pending.
Craft compilation and nine local checks passed. Reentrancy adversarial tests, failed recipient transfers, full integration, frontend, browser checks, and deployment remain pending.
No overall earned judging score.

Next action
Implement and verify the authenticated callback receiver and Lasna subscriber, including deployment wiring and safe retries. Then deploy with a funded testnet wallet and capture actual origin/Reactive/callback evidence. No signing credentials or funded deployment account have been established in this workspace. Never paste private keys into chat.

Sources checked
https://dev.reactive.network/reactive-contracts
https://dev.reactive.network/callback-contracts
https://github.com/Reactive-Network/reactive-lib-omni

Foundation history
AGENTS.md, master plan version 2, MIT licence and honest README were committed before contract implementation.
Node/npm, compiler, and local Anvil runtime validated. Full deployment preparation is tracked within M1.

## M1 integration update on 19 November 2026
Implemented SettlioReactive and SettlioCallback. The receiver creates its immutable escrow, authenticates the proxy and the originating Reactive address, and funds protocol fees separately. The subscriber can be configured once by its deployer, subscribes to deposits and confirmation retries, validates event shape and origin, suppresses duplicate logs, and requests the current Omni callback API.

The official reactive-lib-omni dependency is fetched at commit 3ade0dcf1d27e67e5783ef807e73a1b9e0c0cce8. Dependency source is installed under ignored lib/ and retains its upstream licensing. Settlio's MIT licence covers its own source.

Verification completed
- Dependency setup command fetched the pinned sources successfully.
- All three contracts compiled with solc 0.8.29.
- 17 local tests passed, zero failures. Local protocol fixtures model the system and proxy. Actual Reactive delivery remains unverified.
- Live read-only preflight verified chain IDs and nonempty protocol bytecode on Base Sepolia and Lasna.
- Deployment script syntax checked. Its missing-key guard was exercised and stopped before transactions.
- Full deployment script execution and journal recovery remain unverified.
- A test fixture payable-address conversion initially failed compilation and was corrected before the passing run.

Judging review
Execution remains unverified on public networks.
Integration has compiled subscriber/receiver code and local boundary checks; live proof pending.
Usefulness has no new user validation.
Craft adds reproducible dependency setup, integration checks, read-only preflight, secret-free deployment configuration, and a resumable deployment journal.
M1 remains open. Scheduled expiry/refund network routing belongs to M2 and has not been implemented in the receiver or subscriber yet.

Live deployment boundary
No funded signing account is configured in this environment. Deploy from a local environment with a testnet wallet funded on both chains. Never send its key in chat. Next verify deployment, then build/verify the M1 customer UI and live deposit-to-callback trace before closing M1.

## M1 frontend update on 19 November 2026
Added the React/TypeScript quote workspace, quote editor and customer preview, shared quote, deposit action, confirmation status, and participant retry action. The interface uses the approved green/orange palette, Georgia headings, and locally bundled Inter interface text.

Service terms travel in the share link fragment and are fingerprinted on-chain. The customer verifies both the terms fingerprint and the economic fields before payment is enabled. Missing or changed terms disable payment. Transaction receipt logs supply the created quote ID. Wallet signing checks the chain and current account. History scans 20 global quote IDs per page and displays those owned by the connected merchant, with older/newer navigation. This is deliberately labelled in the UI.

Verification
- TypeScript checks and production frontend build passed.
- Full suite passed 21 tests, including Unicode share links, changed descriptions, inconsistent economic fields, and invalid link payloads.
- Browser checked the quote workspace, editor navigation, editable draft and live preview, missing-wallet feedback, disabled submission without deployment/account, and invalid quote route.
- No public-network customer payment, wallet browser integration, or mobile layout test has been completed.
- Build reports a JavaScript chunk slightly above 500 kB before compression (about 170 kB gzip). Bundle optimisation remains pending.
- Preview is development-only and has no deployed escrow configured. No fake quote history is shown.
- No public frontend hosting was created in this step.

Judging review
Execution remains unverified on public networks.
Integration contract code and client transaction wiring exist; live confirmation through the UI remains pending.
Usefulness now has navigable merchant/customer surfaces; independent user testing remains pending.
Craft has compile/type/build checks, 21 local tests, and limited desktop browser verification.
M1 stays open. The complete marketing landing page and rotating hero remain in M3.

Next action
Deploy using the local testnet-wallet setup in README, configure apps/web/.env.local with the deployed escrow address, then create a genuine quote and pay from a distinct customer wallet. Record the origin, Reactive, callback transactions and resulting state before closing M1.

## M1 local setup repair on 19 November 2026
The user's WSL run compiled all contracts but failed both local Anvil suites: RPC signing reported an invalid signer chain and the second node did not become ready. Preflight was not reached. This is a reported failure; its exact environment-specific cause was not established.

Acceptance for this repair: isolate each test chain, verify chain/account identity, avoid RPC-managed signing, pass the complete suite and both builds, and resolve the reported dependency audit findings.

Replaced fixed ports with OS-assigned ephemeral ports, explicit chain ID 31337, private startup-output handling, fresh fixture accounts, local transaction signing, and process-group cleanup. These accounts exist only for local fixtures. Pinned solc to 0.8.29 and scoped its tmp dependency override to 0.2.7.

Actual checks in the development environment:
- All 21 local tests passed, zero failures.
- Both chain suites also passed (17 tests) while the previous ports 18545 and 18546 were occupied by controlled dummy listeners.
- All three contracts compiled.
- TypeScript and frontend production build passed; existing large-chunk warning remains.
- npm audit reported zero known vulnerabilities.
- The user's WSL rerun remains pending. No new public-network transactions or deployment evidence were produced.

Judging: Execution and Integration still need live origin-to-Reactive-to-callback proof; Usefulness has no new independent validation; Craft improves reproducible local verification and dependency hygiene. M1 remains open. Next action is the user's updated setup/test/preflight run, then funded testnet deployment and genuine flow evidence.

## M1 funding and approved payment scope
The user supplied WSL output confirming all 21 tests passed, all three contracts compiled, zero npm audit findings, and successful Base Sepolia/Lasna read-only preflight. The user also reports receiving test tokens on both chains; wallet balances were not independently inspected.

Recorded the approved ETH/USDC/USDT customer-choice requirement and its acceptance gates in the master plan. Review of the escrow confirms current code remains ETH-only. Upgrade implementation and its tests are pending. No deployment or live callback proof is claimed. Official Base Sepolia USDT provenance remains unverified.

Execution and Integration remain unverified live; Usefulness gains a user-requested payment choice whose usability is untested; Craft now records explicit acceptance conditions. M1 remains open. Next action: implement asset options and per-asset custody, then update the customer journey and verify before deployment.

## M1 payment options implementation · 19 November 2026
Implemented directly on main:
- A merchant can bind up to three unique asset/amount options to a quote. The first successful customer payment locks the selected asset, total and deposit. ETH-only entry points remain available.
- Per-asset liability accounting, exact token receipt, safe handling of false/no-return transfers, nonreentrant payments/refund/release, and exact same-asset payout checks. Transfer failure rolls back state and liability changes; pending refunds stay reserved.
- The frontend offers ETH plus optional Circle-listed Base Sepolia test USDC with independently entered prices, six-decimal stablecoin amounts, a customer currency selector, bounded approval, approval/payment distinction and token-aware summaries.
- Version-2 share terms bind every option and verify the recorded selected asset and amount. Version-1 terms cannot authorize a multi-asset quote.
- Generated ABI and deployment journal metadata updated. Preflight/deployment now check issuer-listed USDC bytecode, decimals and symbol.
- Reactive DepositReceived signature remains unchanged. Local protocol regression exercises a token deposit event through subscriber processing and authenticated callback delivery while preserving custody.

Actual checks:
- 33 local tests passed, zero failures (including previous ETH regressions, three-asset isolation, invalid choices, exact approval, duplicate payment, failed/fee-on-transfer deposits, failed refund preservation/retry, no-return tokens, merchant release/cutoff, reentry rejection, token expiry boundary, terms tampering and token confirmation routing).
- All three contracts compiled; frontend TypeScript and production build passed.
- npm audit reported zero known vulnerabilities.
- Deployment/preflight scripts passed syntax checks. Missing-key deployment guard stopped before transactions.
- The updated network preflight failed from this environment; its generic error does not establish whether RPC access or another check failed. The new public USDC checks must be rerun in WSL. Earlier user-provided output passed the old preflight.
- No deployment, real issuer-token payment, live Reactive callback, updated browser-wallet journey or mobile verification was completed.
- Existing frontend bundle warning remains (about 511 kB raw / 171 kB gzip).

Sources:
https://developers.circle.com/stablecoins/usdc-contract-addresses lists Base Sepolia USDC at 0x036CbD53842c5426634e7929541eC2318f3dCF7e.
https://tether.to/en/supported-protocols/ did not establish an official Base Sepolia USDT address during this review. USDT remains unverified, unavailable in the UI and an open requirement; no fixture token is labelled official USDT.
https://dev.reactive.network/reactive-contracts checked for current event-driven subscription/callback behaviour.

Critical review:
The escrow accepts merchant-authorised ERC-20 contracts, not arbitrary-token safety guarantees. The UI only enables ETH and the issuer-listed USDC address. Rebasing, transfer-fee and otherwise nonstandard assets are unsupported. Frozen/blacklisted issuer transfers can leave reserved claims pending; these funds are never diverted to automation. No automatic exchange rates, swaps or remaining-balance collection are implemented.

Judging:
Execution: local evidence only; genuine public origin/Reactive/callback proof remains unverified.
Integration: token deposit-to-confirmation works through isolated protocol fixtures; public delivery remains unverified.
Usefulness: implements the user's payment-choice request for ETH/USDC; demand and usability remain unvalidated, and USDT is blocked.
Craft: reproducible builds, 33 passing local checks, bounded approvals and clearer asset handling; browser/mobile, live recovery and bundle optimisation remain pending.
M1 stays open. Next: rerun updated checks/preflight in WSL, resolve the USDT network/address requirement, and obtain genuine testnet payment/callback evidence without publishing keys.

## M1 first live ETH loop · 19 November 2026
User completed deployment and a two-wallet quote/payment journey, supplied a confirmed screenshot and the origin transaction. Read-only RPC verification independently established all three successful transaction receipts, the exact origin-log fingerprint in the reactive event, the requested and delivered callback payloads (including rewritten reactive sender), BookingConfirmed(1), current status 3, and custody balance equal to native liability.

Full addresses, hashes, blocks, linkage and limitations are recorded in [ONCHAIN-EVIDENCE.md](../ONCHAIN-EVIDENCE.md). The optional getCallbacks index returned an empty array; no index result is fabricated. These receipts are real public testnet evidence, separate from the local fixtures. No implementation changed and no tests were rerun in this evidence-only step.

Judging review:
Execution now has one independently verified live ETH origin/Reactive/callback loop.
Integration now has live subscriber-triggered authenticated booking confirmation.
Usefulness has a builder-run merchant/customer journey, not independent customer validation.
Craft adds reproducible public evidence; USDC, USDT support/provenance, browser/mobile checks, recovery and subsequent automation still need work.
M1 remains open. Next action: the real USDC approval/payment/confirmation journey within M1. Do not begin M2 yet.

## M1 live USDC loop · 20 November 2026 (Nigeria)
Independently found and verified quote-2 USDC approval event, deposit receipt/token transfer, reactive origin-log fingerprint and callback request, successful Base callback payload and BookingConfirmed(2), and current confirmed state. The user repeated the earlier ETH hash; it was not incorrectly recorded as a USDC payment. Correct addresses and all four transaction links are in ONCHAIN-EVIDENCE.md.

Custody reads: 1 USDC backs 1 USDC liability, 0.0001 ETH backs the native liability, and customer token allowance is zero. This is real public-network evidence. Approval was checked through its mined token event; no separate approval receipt fetch is claimed. No implementation change or new test run.

Judging: Execution has ETH and USDC live confirmation loops. Integration performs real automated authenticated confirmation for both assets. Usefulness has a builder-operated two-wallet journey, with independent user validation still absent. Craft includes exact approval and per-asset custody evidence; mobile/browser review, recovery and USDT remain open. M1 is still open; no M2 work begins here.

## M1 wallet/recovery review · 20 November 2026
Acceptance for this slice: guide missing-network setup without bypassing rejection; preserve unknown transaction outcomes after reload; inspect receipts without resubmitting; keep quote terms recoverable when local storage is available; expose read-only wiring/custody/funding checks.

Implemented directly on main:
- Base Sepolia detection, handling of unknown-chain error 4902 with official add-chain metadata, explicit switching and post-switch verification. Denials propagate.
- Escrow-scoped persistent pending hash, receipt-check banner and submission pause. Saved terms can reconstruct a confirmed quote-creation link from its receipt.
- No receipt is treated as unknown, not failure or success. Failed receipts clear the pause; successful receipts refresh state without claiming a booking callback occurred. Explicit stop-local-tracking is available after an unresolved check and does not cancel or resend anything.
- npm run healthcheck performs only public reads: network IDs, callback sender/service provider/escrow wiring, per-asset liabilities versus custody, and separate automation debt/reserves/balances.
- No Solidity changes and no redeployment needed.

Checks actually run:
- 42 local tests passed, zero failures. New cases cover already-correct and unknown networks, declined switches, false switch success, corrupt/cross-deployment pending records, wrong RPC networks, unknown receipts, mined success/failure, and mismatched/undecided receipts.
- TypeScript and production frontend build passed after the final UI edits. Bundle warning remains: about 515 kB raw / 172 kB gzip.
- Healthcheck script syntax passed. Live attempts timed out; current automation funding and the full new healthcheck report remain unverified.
- Original preview command failed on a restricted network-interface lookup. Loopback-bound preview started, but the cloud browser could not access it. Browser extension was also unavailable. No mobile rendering or new browser interaction pass is claimed. The task-owned preview was stopped.
- No new on-chain transaction was sent. Previous ETH/USDC live evidence remains valid.

Review limitations:
Real wallet timeout/reload/replacement flows and cross-tab coordination remain unverified. Dropped/replaced transactions require manual diagnosis; removing local tracking never establishes transaction cancellation. Storage failure can prevent share-link recovery. Do not call M1 complete.

Judging: Execution/Integration retain the two verified confirmation loops, with no new live recovery proof. Usefulness improves connection and receipt guidance but has no independent user validation. Craft adds 42 passing local checks and read-only diagnostics; browser/mobile and funding verification remain open.

References checked:
https://docs.base.org/get-started/connect-to-base
https://docs.metamask.io/metamask-connect/evm/guides/manage-networks/
https://docs.usdt0.to/technical-documentation/deployments
Official USDT/USDT0 provenance on Base Sepolia is still unverified; USDT remains disabled.

Next: update WSL main, run tests/build/healthcheck, then verify mobile layout and browser recovery. Stay in M1.

## Core-first amendment and evidence reproduction · 20 November 2026
User approved adding the optional messaging concept to the master plan while reaffirming the core Set It and Forget It goal. Recorded WhatsApp Business/iMessage via Photon as later convenience channels, other channels deferred, wallet-authorised actions and receipt-based notifications. Already-configured on-chain automation must continue if chat is offline. No messaging integration started.

Official Photon docs rechecked: one Photon API may avoid our own Meta adapter, but WhatsApp Business still uses Meta Cloud API/business-account provisioning. Consumer WhatsApp is separately forthcoming; the user's actual subscription entitlements remain unverified.

Recorded user-supplied WSL output: 42 tests and frontend build passed; live healthcheck verified two quotes, exact ETH/USDC custody coverage, wiring, zero debt and nonzero separate funding.

Continued M1 with script/verify-quote.cjs and npm run verify:quote:
- Syntax and missing-argument guard checked.
- Real public RPC runs reproduced both ETH quote-1 and USDC quote-2 origin/Reactive/callback trails and generated the committed snapshots.
- Negative run with quote-1 deposit supplied for quote 2 failed specifically at the missing deposit/asset event and preserved the prior evidence file.
- No contract, frontend or dependency changes and no new on-chain transaction. The unchanged 42-test suite was not rerun for this script/documentation slice.

Judging: Execution/Integration retain two independently reproduced live confirmation loops. Usefulness remains a builder-run journey without independent validation. Craft gains reproducible evidence and honest optional-feature boundaries. Unattended expiry/refund proof is still required.
M1 remains open for mobile/browser checks, full recovery and USDT resolution. M2 and chat integration have not started. Next user-side input: mobile screenshots of Create quote and confirmed quote #2 from the running site.

Photon sources:
https://photon.codes/docs/beta/photon
https://photon.codes/platform/whatsapp

## M1 user mobile recording review · 20 November 2026
Reviewed the full 14.6-second user recording through extracted frames at one-second intervals. Chrome responsive mode shows 390 x 600. The clip covers the quote list and quote editor, vertical scrolling and navigation between them; it does not show the confirmed customer quote page or a physical-phone test.

Observed:
- Long content scrolls vertically and navigation scrolls away. Route changes did not explicitly reset scroll position in source.
- The quote list retains a desktop-width table with horizontal scrolling.
- Editor controls stack and customer preview appears below the form.
- Connected account is the customer from the live flows; merchant-only history can be empty for this wallet.
- Console reports a MetaMask global-provider conflict with another wallet extension. This is an observed extension error, not evidence of a React layout failure.

Acceptance for this fix: avoid the wide history table on small screens, retain reachable mobile navigation, start explicit navigation at the top, keep grid/form controls within their tracks and avoid sub-16px mobile input focus zoom.

Changed:
- Real quote history uses stacked cards below 650px; desktop keeps its table.
- Mobile navigation is sticky and wraps when needed.
- Explicit route navigation resets horizontal/vertical scroll without animation.
- Grid tracks and controls can shrink; no page-level overflow hiding was used to conceal content.
- Mobile inputs/selects/textarea use 16px text with minimum touch sizes.
- Empty history explains that it displays quotes created by the connected merchant wallet.

Verification: frontend TypeScript and production build passed after final edits. Existing bundle-size warning remains (about 515 kB raw, 172 kB gzip). No contract, payment, dependency or deployment change; no new transaction. The unchanged 42-test contract/terms/wallet suite was not rerun for these reversible presentation edits.

Limitations: no independent post-fix browser/mobile rendering pass is claimed. A new 390px recording and confirmed Quote #2 view remain needed. The extension conflict was not fixed by these layout changes and multi-wallet discovery/selection remains pending. Physical-device and reload/replacement recovery remain unverified. M1 is open.

Design: approved green/orange palette, Georgia headings, Inter interface text, six surfaces and rotating professional hero remain authoritative. This is an early functional build; the complete M3 interface has not been delivered or replaced with a new design.

Judging: Execution/Integration retain existing ETH/USDC live proofs with no new chain evidence. Usefulness addresses observed mobile friction. Craft gains a passing build and targeted responsive fixes; visual recheck and independent user testing remain pending. Next: pull main, restart preview and review the updated 390px quote list/editor and confirmed customer quote page.

## User acceptance of mobile fixes · 20 November 2026
The user reports the updated mobile view is working. Record this as user-reported acceptance of the targeted responsive fixes, not an independent physical-device/browser matrix pass. Approved final design and M3 scope remain unchanged.

Next M1 check: a real quote-creation transaction followed by a reload during receipt waiting. Recover its receipt and saved share terms without automatically resubmitting or making a deposit. If the receipt completes before reload, do not mislabel ordinary navigation as pending-receipt recovery; report the observed state. USDT and remaining recovery gates stay open.

## M1 manual creation recovery · 20 November 2026
Reviewed the user's 9.2-second quote-3 video. It shows the existing quote page, service terms, Awaiting deposit and disabled payment for the merchant wallet. It does not show an interrupted pending transaction or the pending-receipt banner. Quote creation previously verified through transaction 0x34f9fee6752caf2f5885bc8ee5c121185e50cede108a199d6f6512ed5ecbb669, receipt status 1, Base block 61069668, QuoteCreated(3). No payment is required for this check.

Added a read-only Recover a created quote control. It accepts a creation hash, verifies chain/receipt status, matches the configured escrow's QuoteCreated event and recovers saved draft/cache terms only when their fingerprint matches. Missing local terms lead to the existing quote without enabling payment on unverified terms. Payment/approval receipts cannot be mistaken for quote creation. Pending receipt checking reuses the same restoration path. No new quote, wallet request or transaction is generated by recovery.

Actual checks: frontend TypeScript/production build passed; 45 local tests passed, zero failures. New cases cover event-derived ID, foreign escrow rejection, failed receipts and payment-only logs. A live RPC attempt using real quote-3 creation and quote-1 payment timed out before returning results; no new live helper/browser recovery pass is claimed. Prior creation/ETH/USDC evidence remains separate and unchanged. Existing bundle warning remains (~517 kB raw/~173 kB gzip).

Critical limits: manual recovery of an already-confirmed creation is not proof of interrupted-pending recovery. Local storage/complete original link is still needed to recover service descriptions, since descriptions are not published in escrow. Browser/mobile recheck of this control remains pending; USDT and other M1 gates remain open.

Judging: Execution and Integration retain the existing live confirmation loops with no new chain action. Usefulness offers recovery without another payment or a millisecond refresh race. Craft adds 45 passing local checks and shared receipt restoration; browser recovery remains unverified.
Next: pull main, open Recover a created quote, use the existing quote-3 creation hash and verify its page/terms return. Do not pay or create another quote for this check.

## Manual recovery feedback review · 20 November 2026
Reviewed the user's 11-second recording. The creation hash is entered in Recover a created quote, and Quote #3 with original terms remains visible. Quote #3 and its complete terms were already open at the recording start; no explicit success feedback establishes whether receipt recovery ran. Do not count the existing view as a new recovery pass.

Added a success notice only after a successful creation receipt and matching saved-terms fingerprint have been checked and the existing quote opened. This resolves an observability gap in the recovery interaction. The no-local-terms path continues to show its distinct incomplete-terms notice. No new transaction or wallet authorization occurs.

TypeScript and production build passed. No receipt/contract/helper/dependency change; the previously passing 45-test suite was not rerun for this single presentation-message change. Existing bundle warning remains. Browser verification of the new success notice, interrupted-pending recovery and other M1 gates remain open.

Judging: no new Execution/Integration evidence; Usefulness/Craft improve clear recovery feedback. M1 stays open. Next check can reuse the same real Quote #3 hash; no new quote or deposit is needed.

## Recovery acceptance and pending integration · 20 November 2026
User explicitly confirmed the receipt-verified success notice for manual Quote #3 recovery. Record manual browser recovery with saved matching terms as user-confirmed. It did not send another transaction. This is separate from a live browser interruption.

Added a genuine local EVM pending-transaction test: disable automining, submit one quote creation, observe no receipt, serialize its pending record, destroy the original reader, start a fresh reader, restore the record, observe it still pending, mine the existing transaction, then recover its successful creation receipt. quoteCount remains 1 after repeated reads, demonstrating no resubmission. The local test chain uses chain ID 84532 to exercise the unchanged frontend network guard; this is explicitly isolated local evidence, not Base Sepolia network evidence.

An initial test run correctly failed the frontend network guard because the fixture used its default 31337. Made fixture chain ID configurable (default remains 31337), verified its actual identity and reran. All 46 local tests passed, zero failures. No application, Solidity, dependency or deployment change in this slice; no new public transaction was sent. Previously passing frontend build was not rerun for test/docs-only changes.

Judging: Execution/Integration retain real ETH/USDC confirmation loops; manual browser recovery is user-confirmed, and interrupted receipt logic now has real local RPC integration coverage. Usefulness avoids duplicate creation while recovering. Craft gains 46 passing checks with clear provenance. Interrupted-pending public-browser recovery remains unverified; do not silently close M1.

USDT decision remains open. Official Tether and USDT0 deployment docs were rechecked; an official Base Sepolia USDT address was not verified. Recommendation for user decision: deliver the hackathon's live payment scope as ETH/USDC and retain USDT for a later verified network/deployment. This would change the earlier three-currency requirement, so it is a proposal only and has not been applied. Do not use a substitute token or start M2 while outstanding M1 gates remain unresolved.
Sources: https://tether.to/en/supported-protocols/ and https://docs.usdt0.to/technical-documentation/deployments .

## Approved ETH/USDC delivery scope · 20 November 2026
User explicitly approved proceeding with USDC and ETH and marking USDT Coming soon. Applied the superseding master-plan amendment. USDT is no longer an active M1 release requirement; it remains a future integration.

UI now labels USDT Coming soon in the merchant helper and shows a disabled Coming soon option in unpaid checkout. Enabled assets and contract logic are unchanged; no USDT address, approval or payment is enabled. No date is promised.

TypeScript and production frontend build passed. No tests added for this reversible presentation change; the previously passing 46-test suite was not rerun. No contract, dependency, public transaction or redeployment. Bundle-size warning remains.

Judging: no new Execution/Integration evidence; Usefulness/Craft improve accurate asset availability. Remaining M1 recovery verification stays open; no gate was silently closed and no M2/chat integration started.


## Controlled browser receipt interruption · 20 November 2026
Added a development-only creation-screen check at `?screen=new&receipt-check=pause`. It broadcasts one real quote creation, persists the real hash, and deliberately stops client receipt waiting. The user can refresh and use Check transaction status without racing Base block timing. This does not pause the chain, manufacture a pending on-chain state, send a deposit, or fabricate a receipt. If hash persistence fails, the page instructs the user to keep it open. Production build removes the diagnostic URL marker, banner and pause message.

Validation: TypeScript and production build passed; all 46 local tests passed, zero failures. Inspected production JavaScript: all three diagnostic markers absent. Existing bundle-size warning remains. Contracts, deployment and payment scope unchanged. Commit b9b66a5cae358db40132586db62e936e07ce2dc7 adds the frontend check.

Judging: no additional public Execution or Integration evidence yet. Usefulness and Craft improve reproducibility of interrupted-client recovery using genuine transactions. Browser refresh/recovery still needs user evidence; M1 remains open. Next: create one unpaid test quote using this development URL, refresh after the pause notice, recover its existing receipt, and confirm the original quote and matching service terms return without resubmission. M2 remains unstarted.


## Reactive necessity and scheduling review · 21 November 2026
Read current master plan, progress, escrow and subscriber before this review. Official current Omni documentation at https://dev.reactive.network/reactive-contracts documents validator-generated CRON events from 0x0000000000000000000000000000000000fffFfF, subscribed through SYSTEM on Reactive's chain ID. This establishes documented scheduling support, not a verified Lasna CRON delivery in Settlio. Every tick is billed, including no-op ticks; scheduling must be bounded and unsubscribed when idle. https://dev.reactive.network/callback-contracts and https://dev.reactive.network/economy confirm dual authentication, separate destination funding, debt blocking execution, and charges for failed callbacks.

Current code: subscriber observes deposit and confirmation-retry events only. Escrow enforces payment expiry directly, exposes callback-only expiry/refund, and requires merchant-signed release after refundCutoff. Confirmation and immediate cancellation refunds can alternatively happen in their initiating Base transaction; routing these through Reactive alone does not prove architectural necessity. Scheduled unpaid expiry is already approved M2 scope but adds less economic value than unattended settlement. Recommendation for explicit policy approval: optional merchant-authorised automatic deposit release after the agreed refund cutoff, only if confirmed with no reserved cancellation. This is a proposal, not an approved policy change or implemented capability; reaching the cutoff does not attest service delivery.

Proposed scheduler design: learn immutable deadlines from authenticated origin events; bounded due-job queue; network ticks trigger callbacks; Base timestamp/state checks remain authoritative; retries remain eligible until successful destination completion is observed, with bounded backoff and per-job isolation. No reliance on block counts for deadlines, no claim of exact-second delivery, no funding from customer liabilities. Current QuoteCreated event includes expiry but not refundCutoff; scheduled release would require a versioned event/API change and new deployment. Existing immutable deployed contracts cannot be treated as upgraded. Preserve old quotes and principal; no redeployment or fund movement in this review.

Acceptance before claiming scheduled integration: real Lasna cron -> authenticated Base callback with both browser sessions closed, no user keeper transaction after setup, no early action, no duplicate transfer, cancellation reservation winning against delayed release, failed delivery retry, measured delay and funding cost, and verifiable transaction evidence. Documentation review passed; no new build/test or live scheduling pass claimed. M1 recovery evidence remains open and M2 implementation remains unstarted. Judging: existing execution proof retained; integration weakness identified with a concrete documented direction, usefulness still needs user validation, craft benefits from explicit limits.


## Automatic release approval · 21 November 2026
User approved the proposed automatic deposit release policy. Updated the master plan with explicit accepted terms, immutable per-quote policy, cancellation reservation precedence, timestamp/state enforcement, idempotent delivery, separate funding, bounded scheduled processing and versioned deployments. Existing contracts/quotes remain unchanged; no funds moved. M2 implementation has not begun.


Checks: source/plan/progress read and video frames reviewed. No code change, build/test rerun, deployment or new on-chain evidence in this update. Execution retains previously verified loops; Integration gains an approved meaningful scheduling target but is not implemented; Usefulness remains an audience hypothesis; Craft gains explicit policy and evidence provenance. M1 remains open pending sequence confirmation; then start M2 scheduling implementation.


## Recovery acceptance status · 23 November 2026
The user requested that mistaken draft attempts be excluded from current project documentation and acceptance evidence. Removed the prior draft-specific recording description. Browser-interruption acceptance remains open; use a fresh quote with checked dates for the next verification. This documentation-only correction does not change deployed contracts, chain records, prior commit history or previously verified payment-loop evidence. No new test pass or recovery acceptance is claimed.


## Quote receipt recovery and clearer instructions · 23 November 2026
User reported the exact successful manual recovery notice for Quote #6: creation receipt succeeded, saved terms match, no new transaction sent. User supplied hash 0x8453f4a69e0c17669056a079c8970b8709ba6fc67c640f694e47ecdce5d729a3; explorer retrieval failed, so this hash is user-supplied, not independently RPC-verified in this review. Screenshots show the intended quote and dates. Manual recovery accepted as user-reported. The user did not confirm the separate saved-hash refresh sequence and found repeated instructions confusing. Do not infer that pass or request more quotes merely to repeat the same ambiguity.

Reviewed both frontend paths. They share receipt restoration but differ in how the hash is obtained. Changed button wording to Check saved transaction, explicitly explained the read-only action, scroll to top after the development pause so instructions are visible, and preserve the explicitly selected development pause flag when internal navigation opens the editor. These are clarity fixes, not a proven root cause of the user's prior sequence. No contract or payment changes.

TypeScript and production frontend build passed. Existing bundle-size warning remains. No new tests added for these low-impact interface changes; the prior 46-test result is historical and was not rerun. No live browser interruption pass claimed. Execution/Integration retain prior ETH/USDC network evidence; Usefulness/Craft improve recovery instructions, with manual quote recovery user-confirmed. M1 remains open for saved-hash browser verification. No M2 implementation or redeployment started. Next check should avoid asking the user for another quote: inspect the current saved-transaction state with clear controls, or obtain browser coverage before arranging a further live transaction.


## Saved transaction investigation and corrected quote status · 23 November 2026
User clarifies corrected Quote #6 has only been created and no deposit has been paid. Treat its status as user-reported unpaid, not a completed payment or Reactive loop. Earlier user-reported manual receipt lookup remains receipt recovery evidence only, not payment or refresh-sequence evidence. Do not include excluded mistaken draft attempts as acceptance evidence.

Source review: the saved transaction record is keyed by configured escrow and chain ID, loaded on app mount, and cleared after receipt processing, explicit stop tracking or an on-chain failure. Opening a quote does not save a pending record. Manual lookup is rendered only when pending is empty. This explains why a successful manual lookup can coexist with no saved-transaction button; it does not establish why this user's original record was absent. A missing escrow configuration also prevents access to the correct deployment-specific state. Do not infer storage deletion or a successful interruption sequence.

Added an explicit No saved transaction to check notice to the development recovery screen when the escrow is configured and no valid saved record exists. The notice distinguishes manual lookup and discourages creating extra quotes merely to locate the button. Revised the development banner to avoid prompting repeated quote creation. Production/payment/contract behavior unchanged.

Validation: fresh 46 local tests passed (zero failures), including the real local pending-reader restart integration; TypeScript and production build passed. Existing bundle-size warning remains. Read-only Base RPC attempt for Quote #6 and supplied creation hash timed out before verification; no fresh chain-state claim. No public transaction broadcast, deposit, deployment or funds movement. Saved-hash browser interruption remains unverified; M1 stays open. Execution/Integration retain earlier verified ETH/USDC loops, Usefulness/Craft improve recovery guidance, but no new live scheduling or user-demand evidence. Next: verify the browser storage lifecycle without requiring another quote; M2 remains unstarted until the M1 gate is resolved.


## Persistent storage restart verification · 23 November 2026
User screenshot shows the explicit No saved transaction to check state with the deployment configured. This confirms the UI has no valid record for its current key, not why the record is absent. Corrected quote remains unpaid per user. No additional user transactions requested.

Extended the existing genuine local EVM pending-creation test to write the actual submitted transaction hash through Node's persistent Web Storage API in a child process, terminate that writer, read the same file from a distinct process, decode the stored record, reject a different escrow, verify isolation of a different storage key, reconnect the RPC reader, mine and recover the original creation receipt, verify quoteCount stays one under repeated reads, remove the record and verify absence from another process. Temporary stores are cleaned up. This uses real disk persistence and local EVM execution; it does not exercise browser origin policy, React mounting or the user's wallet/browser. It must not be presented as public-browser evidence or the cause of the missing user record.

Fresh npm test: 46 tests passed, zero failures. Existing test extended rather than adding an artificial test count. Test-only change; no frontend build rerun needed, no application/contract/deployment change, no public transaction or deposit. Execution/Integration retain earlier public loops and gain no new public-chain proof; Craft gains meaningful persistent-restart coverage; Usefulness unchanged. M1 stays open for actual browser save/reload verification. M2 is not started. Do not keep asking the user to repeat manual hash lookup, which already passed and does not test automatic restoration.


## Existing receipt browser reload diagnostic · 23 November 2026
Added a development-only explicit second recovery submit action at ?screen=new&receipt-check=pause. It reads the supplied existing hash with the normal chain/receipt guard, requires a successful creation event from the configured escrow and matching saved original terms, saves that genuine receipt hash through the production pending-record format, checks immediate readback and asks for refresh. The existing saved-transaction control then executes normal recovery after reload. This action never broadcasts, requests wallet signatures, pays a deposit or creates a quote. User corrected quote remains unpaid.

This is deliberate restaging of an already successful receipt for browser-storage/reload coverage. It does not prove the original pre-receipt interruption or pending-on-chain restoration. That distinction is explicit in UI and must remain in acceptance records. M1 remains open pending the result; do not silently replace or claim the original acceptance gate.

TypeScript and production build pass. Inspected production bundles: diagnostic save action value, button label and stage-success message absent. Existing size warning remains. Latest 46-test pass predates this interface action and was not rerun; no new browser pass claimed. Execution/Integration gain no public transaction evidence, Craft gains a repeatable check without another user transaction, Usefulness unchanged. No contracts/deployment change or M2 implementation. Next: user stages the corrected quote's existing creation hash, refreshes and checks the saved transaction; record actual outcome and remaining provenance limitations.


## Existing-receipt browser recovery result · 23 November 2026
User supplied sequential screenshots of the development reload check using the corrected unpaid quote's existing creation transaction. The first shows the verified existing receipt saved and Check saved transaction available. After instructions to refresh and click that control, the second shows Quote #6 restored with the notice that its successful creation receipt and matching saved service terms were recovered without a new transaction. Record the staged existing-receipt recovery outcome as user-provided browser evidence. Screenshots do not independently capture the refresh event; do not claim an independently observed original interruption, new deposit, new Reactive callback or new transaction.

Quote remains Awaiting deposit in the screenshot; no payment requested or claimed. Displayed dates remain November 25, 2026 18:00 payment deadline and November 26, 2026 18:00 refund cutoff in the user's browser. Excluded mistaken drafts are not acceptance evidence.

Combined coverage now includes user-confirmed manual lookup, local EVM pending/reader restart with real persistent storage across processes (46-test suite), and the staged successful receipt browser outcome. The exact original pre-receipt browser interruption remains unverified, and the current strict M1 gate has not been silently waived. No code/build/test or deployment change in this evidence update. Execution/Integration retain prior live ETH/USDC loops; Craft gains browser recovery outcome with provenance limitations; Usefulness unaffected. Next review must resolve the remaining gate explicitly without repeating manual lookup or requiring another payment. M2 implementation remains unstarted.


## Quote history deadline clarity · 23 November 2026
Fixed the screenshot-observed inconsistency where unpaid quote history retained Awaiting deposit after its timestamp deadline while the quote detail said Payment deadline passed. Both desktop history and mobile cards now share the quote detail's timestamp-aware label. A cleaned-up one-second rendering timer updates history labels across the boundary without extra RPC requests. It changes only status 1 after now >= expiresAt; confirmed, refund and released statuses retain their actual labels. It does not claim an Expired state transition or a successful scheduled callback.

Acceptance: same deadline-aware wording across list/card/detail, exact boundary comparison, no contract/state/payment changes, no per-tick network load, timer cleanup on unmount. TypeScript and production build passed. Bundle-size warning remains. No tests added for this low-impact presentation correction; prior 46 local passes were not rerun. No live browser/physical mobile pass claimed for this change. Execution/Integration gain no new evidence; Usefulness/Craft improve honest deadline display. Existing corrected quote stays unpaid. M1 remains open for the original interruption gate; staged existing-receipt browser outcome remains separately recorded. No M2 implementation or deployment change.


## Automated browser attempt blocked · 23 November 2026
Prepared a scratch-only Playwright test using the real frontend and isolated Anvil chain. Intended coverage: one locally signed quote creation through an explicitly injected fixture wallet bridge, development pause, real browser storage, page reload, normal saved-receipt recovery, matching terms, pending-key removal, one quote and no deposit/resubmission. Fixture bridge would not count as real wallet-extension or public-network evidence.

Actual run failed before opening a page: Chromium aborted with socket() failed: Operation not permitted in process_singleton_posix.cc. Browser launch was blocked by execution-environment permissions; no browser assertion ran, no browser pass or application root cause is claimed. Anvil/Vite cleanup hooks ran. Scratch test is not added to the default suite or represented as verified functionality. No production code, contract, deployment or public transaction changed.

Remaining decision for the user: retain the strict original public-browser interruption gate and keep M1 open, or explicitly amend acceptance to the existing combined coverage (real ETH/USDC confirmation loops, 46 passing local checks including pending EVM and persistent-process restarts, manual browser recovery, staged confirmed-receipt browser outcome), with original public-browser pre-receipt interruption kept as a release verification item. Recommendation is the latter to progress to M2 without claiming missing evidence. This is a proposal only; no acceptance amendment or M1 closure has been applied. Execution/Integration evidence unchanged; Craft records the actual blocked attempt and practical limitation; Usefulness unchanged.


## Strict M1 audit · 23 November 2026
User explicitly rejected waiving the outstanding M1 gate and requires fixes and proof before M2. The previous acceptance-amendment proposal is not approved. M1 stays open; no M2 work is authorised by this audit.

Reviewed current main escrow, callback, subscriber, quote terms, receipt decoder, pending-receipt guard, app transaction/recovery handlers, verifier, healthcheck, evidence record and master/progress. Rechecked current official Reactive Contracts and Callback Contracts documentation: subscriber onlySystem, destination proxy AND injected-sender authentication, immutable wiring and separate funding match the reviewed patterns. This is source review, not fresh live subscription/wiring verification. Contracts retain timestamp payment/cancellation checks, state-first nonreentrant principal transfers, exact token balance-delta checks and per-asset liabilities. No new contract defect established by this review; this is not an independent security audit or a guarantee of no defects. M2 refund/expiry routing remains explicitly unavailable.

Found and corrected frontend ordering flaw: checkPending removed its saved hash before restoreCreatedQuote decoded/validated original terms. A malformed or mismatched saved draft could throw after the record was discarded. It now keeps the pending record until successful restoration, clears a failed mined transaction separately, and leaves unresolved recovery errors visible with existing explorer/retry controls. This issue does not establish the cause of the user's missing original record. The new restore-error branch has source/build review, not a live-browser pass; retain it as a verification item.

Fresh baseline checks after syncing audited main sources: all three contracts compile with 0.8.29, TypeScript/frontend production build pass, 46 local tests pass with zero failures. Frontend build rerun after the ordering fix passed. The 46-test run preceded that UI-only ordering change and does not exercise its React/browser error branch. Bundle-size warning remains. No new blanket test or browser pass claimed.

Fresh read-only healthcheck and both complete quote verifier invocations were attempted with the recorded public deployment addresses and genuine ETH/USDC hashes. All three exited with their failure guards; no new successful report or evidence snapshot written. Generic error output does not identify a contract fault versus connectivity; fresh live verification is blocked, not passed. Existing historical evidence remains unchanged. No public transaction, deposit, new quote, deployment or fund movement.

M1 acceptance ledger:
- quote creation with immutable terms: prior chain evidence and user screenshots; corrected quote unpaid;
- ETH and USDC deposit -> Reactive -> authenticated confirmation: historical verified full-loop snapshots; fresh rechecks blocked;
- designated-wallet permissions, wrong amounts/terms, duplicate payment, principal accounting, deadline boundaries, callbacks and retry: passing local suite, with prior live confirmation evidence separately labelled;
- manual creation-receipt recovery: user-confirmed;
- staged confirmed-hash browser save/reload recovery: user-provided outcome, original interruption not proven;
- local EVM pending/restart and persistent Web Storage across processes: passing isolated test;
- original newly broadcast public-browser interruption: OPEN;
- restore-error retains pending hash: source/build reviewed, browser failure-path verification OPEN;
- current custody/funding/wiring and original hashes revalidation: BLOCKED pending working RPC execution;
- M1 closure: NOT ACCEPTED. M2 remains unstarted.

Judging: Execution retains historical live trails but fresh state revalidation is blocked; Integration retains meaningful event/callback plumbing with known value limitations already recorded; Usefulness retains clear deposit workflow but no validated demand claim; Craft improves a concrete recovery error path while honestly retaining missing verification. Next action: run fresh build/tests/preflight/healthcheck and full-loop verifiers from the user's working WSL/RPC environment, then execute a clearly captured original interruption check. Do not substitute another manual lookup or staged confirmed receipt for that gate.


## User WSL strict audit checks passed · 23 November 2026
User supplied complete terminal output after fast-forward to 66f965d. All three Solidity contracts compile with 0.8.29; TypeScript/Vite production build passes with the existing >500kB chunk warning; 46 tests pass, zero failures/skips/cancellations. This is user-provided execution evidence from WSL and includes the latest pending-restoration ordering fix, although the Node suite does not directly exercise its React error branch.

Preflight passed: issuer-listed Base Sepolia USDC bytecode/metadata, Base chain/protocol bytecode and Lasna chain/protocol bytecode. Read-only healthcheck reported wiringVerified true, quoteCount 6, native balance=liability=100000000000000 wei, USDC balance=liability=1000000 units; Reactive debt 0, reserves 0, balance 69717400000000000; callback debt 0, reserves 0, balance 998767555600000; both needsAttention false. These are point-in-time user-provided observations, not future delivery guarantees or a per-quote payment claim. Corrected quote remains unpaid per user.

This resolves fresh build/test/preflight/current-health evidence previously blocked from the assistant environment. Separate full-loop transaction verifiers still need fresh output; the original newly-broadcast browser interruption and restore-error failure-path remain open. No M1 waiver, M1 closure or M2 start. No code change or new transaction. Judging: Execution/Integration gain fresh user-side environment/wiring/custody/funding evidence; Craft has reproducible passing checks; Usefulness demand validation unchanged. Next run both existing read-only full-loop verifiers, then complete the remaining browser checks with exact capture of the required steps.


## Both public confirmation trails reverified from WSL · 23 November 2026
User supplied successful npm run verify:quote output for both original trails. Quote 1 ETH: origin 0x2c2292c4be6674774a69106c8f516a16409c8c0561b92c718e2024f6dd970b9a, Reactive 0x40c0f7778a403667cff17a25d1c21dc1a1e01644cb16384afa54f3ba48cda2f8, callback 0x676944ba23ce0dd5983f1ee529178a0367ef986f30be5f9cd26c840379ef636a. Quote 2 USDC: origin 0x1b410e4e98859bc8bce93bbe7a9beb93b5ac3bc67c25ececeed2b77ba75f290f, Reactive 0x187fc2615773c9725f7d1a7882709a21a1f16102b6bf0cfadba3fd271eaad6d5, callback 0xb66ec4bc2398038d7f5a9b90746a419e00d43b2ed67fe2ccf551c215edb844b6. Each reported full deposit-to-Reactive-to-confirmation verified and wrote its local deployments/evidence/quote-N.json. The fresh local snapshot files have not been fetched or committed by the assistant; do not claim their bytes are published. This is user-provided successful verifier output, alongside previously independently verified historical trails.

Fresh trail revalidation blocker resolved. No transaction sent. Execution/Integration proof refreshed; Craft gains reproducibility; user-demand evidence unchanged. M1 remains open only for remaining browser recovery acceptance (original newly-broadcast receipt interruption and restore-error retaining saved hash); no waiver and no M2 start. Next original interruption test must use the actual creation pause path and capture that pause before refresh, not restage a confirmed receipt or repeat manual lookup. Customer payment is not needed.


## Original creation interruption recovered · 23 November 2026
Reviewed user recording 20261123-0938-24.0269241.mp4 (30.43 seconds): the actual editor is at ?screen=new&receipt-check=pause, with Creation interruption check terms, total 0.0003 test ETH, deposit 0.0001, expiry November 27 18:00 and refund cutoff November 28 18:00 in browser locale. It shows creation submission followed by the saved-transaction banner and Step 1 complete pause notice, without navigation to a completed quote. Wallet panel shows confirmed Base Sepolia interaction. User supplies creation hash 0x0f6bd02457428fdbd321608ec66d7eccdfb2cb1b7f1e6c409076ecfb0f1fcc71 (not independently RPC-fetched in this step).

After instructions to refresh then use Check saved transaction, user supplies image(20261123-094339).png showing Quote #7, matching title/description/amounts/dates, Awaiting deposit and the successful creation-receipt recovery notice: saved service terms match and no new transaction sent. Accept the user-performed original creation pause/reload/recovery journey on this sequential recording/screenshot evidence. The refresh itself is not independently recorded, and this is a browser workflow proof with user-performed steps rather than an automated or independently replayed browser trace. Unlike the earlier staged existing-receipt check, the first recording shows the actual new-creation pause. Chain confirmation may precede client receipt processing; do not claim the transaction remained unmined while refreshing.

Original interruption-recovery gate now accepted with that provenance. Corrected earlier quote and this quote remain unpaid; no deposit or Reactive confirmation for either is claimed. Historical ETH/USDC full-loop proof remains separate. No new code/test/build in this evidence step. Remaining strict M1 item: failure-path verification that malformed/mismatched saved service terms produce a safe error while preserving the saved hash, covering the latest ordering fix. M1 remains open until this is checked; no M2 implementation started. Execution/Integration unchanged, Craft gains original browser recovery evidence, Usefulness unchanged.


## M1 recovery failure path and engineering acceptance · 23 November 2026
Extracted recoverPendingTransaction into pending.ts and wired checkPending to this same coordinator. A successful receipt runs restoration before clearing; if reading or restoring throws, clear is not called. Missing receipts remain tracked; mined failure can clear without invoking successful restoration. No signature/broadcast capability is added.

Extended the genuine local EVM/persistent-storage restart test: create a real local quote with an actual terms fingerprint, persist its real hash, restart storage/RPC, mine and read the successful receipt. Malformed encoded saved terms throw; the on-disk pending record remains exactly unchanged. Structurally valid changed-description terms fail the fingerprint check; record still unchanged. Restore original terms, run the coordinator again, recover the same creation receipt, clear the record and verify quoteCount remains one. This is fault injection in isolated test data, not altered customer data or public-network evidence. No user quote modified or paid.

Fresh TypeScript/production frontend build and all 46 local tests pass, zero failures/skips/cancellations. Test count unchanged because the existing integration test was expanded. This exercises the coordinator now used by React, not a separate actual browser error-screen recording. Original normal creation interruption has the prior user video/screenshot acceptance. No new live transaction, RPC health or deployment claim.

M1 engineering acceptance: quote creation and fixed terms; live ETH/USDC deposits and authenticated Reactive confirmation trails, both freshly reverified by user WSL; current WSL preflight/wiring/custody/funding pass; contract permission/amount/timing/principal/retry tests pass; targeted mobile fixes user-accepted; manual and staged browser recovery plus original newly-created quote pause/reload/recovery user evidence; malformed/mismatched terms retaining the saved hash now covered by the actual recovery coordinator integration. The former original-interruption blocker and the recovery-ordering failure-path item are resolved with their stated provenance; no unverified scenario has been relabelled as a browser/network pass.

M1 is accepted for its defined engineering scope on this combined evidence. This does not claim exhaustive browser/extension/device coverage, an independent security audit, no possible defects, validated demand, or M2 functionality. Source changes still need user local pull before appearing in their running app. Existing UI bundle-size warning remains. Full final-interface/mobile journey coverage remains M3/M4. Execution passes the live-loop requirement; Integration functions but stronger unattended policies remain M2; Usefulness solves the stated workflow but demand validation is still pending; Craft has passing builds/tests and recovery evidence with coverage limits. No numeric judging score or prize prediction. Next milestone is M2 unattended policies under the already approved plan; no M2 code or deployment started in this step.


## Completion documentation reconciled · 23 November 2026
Inspected the full main repository tree: five Markdown documents before this update plus LICENSE and two evidence JSON files. Added docs/M1_ACCEPTANCE.md, making six Markdown documents plus LICENSE. Updated current README, master-plan authority/milestone status, on-chain evidence status, progress summary and AGENTS completion-record rule. Removed stale current README claims that M1, browser recovery and health verification were still pending; preserved chronological progress history and historical evidence bytes. M1 checklist includes acceptance proof/provenance, source/test links, exact full-loop commands, user-browser media references (not committed media), point-in-time health, remaining warnings, and M2/M3/M4 exclusions. No excluded mistaken drafts are used as acceptance evidence.

Documentation verification: all six Markdown documents read, current links/paths and transaction hashes checked against fetched main tree and committed JSON snapshots; no tests rerun for docs-only changes. No new build/chain/browser pass, code change, transaction or deployment. M1 completion follows the previous recorded evidence, not this edit alone. Future milestones must maintain the same item-level completed/evidence/date/limits ledger before closure.


## M2 started: destination policy safety · 23 November 2026
M1 acceptance is preserved. M2 is active and NOT complete. Added docs/M2_ACCEPTANCE.md with per-area evidence and open gates. Implemented explicit immutable opt-in and policy-registration event, participant retry signal, authenticated receiver processPolicy entry and destination state/timestamp execution. Manual creation defaults to no automatic release. Refund reservation wins over late payout; duplicate callbacks cannot transfer twice; failed transfers preserve state/liability. No scheduler, version-3 terms UI or deployment enablement claimed.

First focused test exposed omitted option-policy assignment/event in the initial edit; fixed before commit. Focused suite then passed 7 checks. Expanded complete suite passed 53 tests, zero failures/skips/cancellations. New cases include proxy/sender authentication, expiry/cutoff boundary, ETH automatic payout once, manual-only policy, delayed cancellation refund, and mined reverting token refund/payout followed by safe retry. Fixtures are isolated, not live protocol/USDC evidence. All three contracts compile (0.8.29), frontend TypeScript/production build pass; bundle warning remains. ABI exported. No new dependency, public transaction, deployment, user quote change or fund movement.

Source bytecode changed for the upcoming policy deployment; current immutable M1 deployment is unchanged. Existing deployment journal must be preserved; do not delete it to bypass fingerprint mismatch or deploy this incomplete slice. Next: CRON bounded scheduler, out-of-order acknowledgements/retry/funding controls, versioned terms/UI and deployment/evidence tooling; then real browser-closed expiry/refund/release proof. Execution has local destination coverage only for M2; Integration and unattended usefulness still require scheduler/live proof; Craft improves tests and explicit gates. No M2 completion score.


## M2 bounded scheduler and local policy loops · 23 November 2026
Implemented SettlioReactive CRON100 scheduling using the documented legacy emitter on Reactive's own chain, exact topic/source/shape filtering and authenticated onlySystem delivery. Configure now installs ten precise origin lifecycle subscriptions. The two original confirmation/retry routes retain their semantics. Active policy jobs subscribe to CRON dynamically; no runnable jobs or an owner pause unsubscribes matching criteria. Owner resume settles debt first. CRON block cadence is only a wakeup; all expiry/cutoff/backoff logic uses timestamps, with destination escrow checks authoritative.

Per tick: at most eight jobs scanned round-robin and at most two callback requests. Requesting is not completion: jobs remain active until authenticated origin terminal events/PolicyChecked acknowledge outcome. Confirmation/cancellation flags survive delayed registration; terminal states cannot reopen; cancellation remains dominant. Failed request submission is isolated and scheduled again. Backoff is 60 seconds times attempt number; after six unacknowledged attempts, remove from runnable queue and emit PolicyNeedsAttention. A fresh participant request re-registers immutable terms, resets retry state and schedules immediate checking; this also recovers missed registration. No generic user method can fabricate policy state. Pause/idle controls bound repetitive spending, not a guarantee of fees or perpetual delivery; active jobs still require operator funding and public deployment admission/cost review.

Focused first scheduler suite passed 8 checks. Added scan-bound/fairness, actual local policy-expiry/payout/refund loops, and reordered fresh retry reconstruction. Review found retries otherwise waited until original expiry; corrected force-check handling and reran. Final full suite: 64 passed, zero failures/skips/cancellations, including M1 regression and M2 policy cases. Contracts compile with 0.8.29. Frontend TypeScript/production build passed for the same external ABI before the final internal retry-timing fix; the final contract build and entire suite passed after it. No frontend code/ABI changed in that final fix. Existing >500kB warning remains.

Actual local loops use genuine isolated origin/destination transactions, explicit protocol-forwarding fixtures and synthetic CRON records through a fixture at the system address. They are not live validator/Lasna CRON evidence or official USDC integration. No public transaction, deployment, user quote change or fund movement. Current immutable M1 subscriber still has its original two subscriptions; the ten-subscription scheduler is upcoming bytecode, not an upgrade at that address. Deployment tooling/journal must be versioned before deployment, and the old journal must never be deleted to bypass fingerprints.

Updated M2 ledger: scheduler/lifecycle control code locally verified, M2 still NOT ACCEPTED. Pending: policy-bound versioned terms and UI, operational job/funding/attention visibility, versioned deployment/preflight/evidence checks, public supported-network CRON and full browser-closed expiry/refund/automatic-release traces, live costs/delay and failure/recovery review. Execution has additional isolated loops only; Integration now has tested scheduling code but no live M2 delivery; Usefulness awaits usable policy UI/live workflow; Craft gains bounded work and acknowledged completion tests. M1 acceptance unchanged; no M3 started.


## M2 policy-bound terms and interface · 23 November 2026
Implemented version 3 share terms including an explicit automaticRelease boolean. Serialization for versions 1 and 2 is unchanged and golden fingerprints now guard compatibility. UI verifies the recorded policy flag and deployment version in addition to the fingerprint, wallets/options/amounts/deadlines. A version 1/2 link cannot masquerade as an automatic-release quote. Creation on policy deployments uses createQuoteWithPolicy and exposes a default-off merchant opt-in with plain-English payout/cancellation/service-delivery limits. The same choice is displayed before payment.

Added payDepositWithPolicy to require explicit customer acceptance of the recorded automatic flag. Legacy deposit entry points reject automatic-release quotes, preventing an old-call bypass. Manual-only legacy paths remain compatible. Local real-contract tests cover correct consent and inconsistent merchant hash/policy, and updated policy/scheduler tests use the explicit consent API. Updated escrow ABI and exposed scheduler POLICY_VERSION 3 for capability verification. Source bytecode is new; existing public M1 contracts and unpaid quotes are not modified.

Frontend creation distinguishes deterministic legacy empty-selector revert from unknown transport/nonempty revert/unsupported versions. M2 requires expected Base/Lasna chain IDs, callback proxy, authorised scheduler version and reciprocal immutable wiring; unknown/error checks pause creation instead of silently enabling policies. M1 capability detection requires no Lasna query and keeps new actions unavailable. Quote status reads Base separately; M2 automation status polls real scheduler jobs, pause/CRON/attention/attempt state plus both fee accounts' balance/reserve/debt. Failed observations are explicitly unknown, never successful default data. Nonzero fee funds are not represented as enough for a future callback.

Added eligible customer cancellation, participant automatic-check retry and merchant claim controls for policy deployments; wallet/account/chain and contracts still enforce authority/timestamps. Refund pending is distinguished from refund completed; release is not proof of service delivery. Explicit device timezone appears with dates. No existing public quote was cancelled, paid or released.

Validation: all three contracts compile (0.8.29), TypeScript and production frontend build pass; final 69 local tests pass with zero failures/skips/cancellations. Initial UI guard/terms run passed 68; added actual local consent/deposit linkage and legacy-bypass rejection checks, corrected the policy expiry assertion to use the new consent entry, then reran the full 69-test suite. Existing >500kB bundle warning remains. No browser/physical-device/extension journey or live M2 RPC/status/transaction pass claimed for the new interface. This is code and local integration coverage, not new public evidence.

Updated M2 ledger, README, plan and public-browser RPC configuration guidance. Remaining: versioned deployment/journal/preflight/health/evidence tooling, actual legacy/M2 browser regression, supported-network CRON delivery, browser-closed ETH/USDC refund/expiry/release, costs/delay, operational recovery/admission review. No public broadcast, redeployment, funds movement or M3 work. Execution/Integration gain local consent/compatibility proof, not live M2 execution; Usefulness gains explicit policy and recovery states but demand remains unvalidated; Craft gains guards, stable legacy hashes and honest unknown states. M2 remains open.


## M2 deployment intent safety — 23 November 2026
Added [deployment-state helpers](../script/m2-state.cjs) and [five focused checks](../test/m2-state.test.cjs). A separate testnet-m2.json journal validates policy/network version, deployer, source fingerprints and constructor funding; saves public unsigned intent/hash before broadcast; resumes the identical signed transaction; refuses nonce conflicts and preserves reverted receipts without a replacement. M1 journal filenames are rejected. Keys and raw signed transactions are not persisted. Exact active subscription parsing rejects missing/wrong-chain/source/scheduler filters and unexpected schemas.

Final full local suite: **74 passed, zero failures/skips/cancellations**. Interruption, occupied-nonce and reverted-creation checks use real isolated Anvil transactions; subscription-index responses are test fixtures. These are not public Reactive evidence. No contract/frontend source changed in this slice; no additional build pass claimed.

This completes the local deployment-state component only. It is not wired into a runnable M2 deployment command yet. Read-only network/CRON checks, source/runtime verification, deployment CLI, M2 evidence namespaces and live policy trace verification remain open. Do not run the legacy deployment command against M2 bytecode. No new public deployment, payment, refund or release occurred. M2 remains NOT ACCEPTED.

Judging: Execution and Integration gain local safety coverage only; live M2 loops remain required. Usefulness is unchanged. Craft gains reproducible restart/failure tests and an explicit incomplete gate. Next: integrate and test the versioned deployment/preflight/evidence commands before requesting any local-wallet deployment.


## M2 versioned command integration — 23 November 2026
Integrated preflight:m2, plan:m2, deploy:m2 and verify:m2. Plan/preflight/verify are read-only; only deploy loads a local signing key. M2 journals/locks are separate; M1 addresses, evidence and frontend configuration remain unchanged. Legacy deploy:testnet now rejects policy bytecode before reading a key or creating a lock. Confirmation evidence is namespaced for M2; unknown namespace/version combinations fail.

Added source/constructor/receipt checks and compiler runtime output. Runtime matching compares all bytes except compiler-declared constructor immutable references; those values are checked with reciprocal version/wiring/owner getters. No broad bytecode wildcard. Deploy saves each intent/hash before broadcast, validates resulting creations, resumes configure by saved intent and only reports verification after the active subscription index matches. Missing/lagging index leaves successful deployment intents recoverable.

New command integration uses two isolated Anvil chains with explicit protocol/USDC/CRON fixtures. It executes real contract creation/configuration, injects a subscription-index outage after successful broadcast, verifies retry sends no additional transaction, preserves the M1 file, rejects a changed source fingerprint and altered runtime, checks a key-free read-only plan and guards the legacy command. Fixture subscription responses and fixture CRON are not live Reactive/issuer evidence.

Actual checks: all three Solidity 0.8.29 contracts compile; TypeScript/production frontend build passes (existing 530.58kB chunk warning remains); final full suite **76 passed, zero failures/skips/cancellations**. Focused initial command integration also passed before adding the namespace/legacy guard checks. Public preflight attempt failed with no verified network observations; no live M2 deployment, subscription observation or callback is claimed. No public funds moved. Official Reactive contracts/CRON and rnk_getFilters documentation rechecked.

Execution/Integration: command flow has isolated proof only; live M2 execution remains a release blocker. Usefulness: preserved M1, explicit costs/unknown verification and safe resumption help operators. Craft: repeatable CLI, source/runtime guards and reproducible failure tests; bundle size and browser coverage remain weaknesses. No score/winning claim. M2 remains NOT ACCEPTED.

Next: user-local read-only preflight/plan, address any network/CRON/filter incompatibility, implement scheduled-policy evidence linkage/verifier, then perform new dedicated M2 deployment and full unattended expiry/refund/release trails. New browser/physical-device journeys, costs/delay and operational recovery/admission review remain open. M3 has not started.



## Live CRON preflight blocker — 23 November 2026
User WSL at commit 6e4856d ran preflight:m2 and received “No recent network CRON100 event observed.” Because commands used &&, plan:m2 did not run. The command checks protocol/USDC prerequisites before this branch, but the supplied output contains no CRON trace. No deployment was attempted. Empty matching results alone do not establish a network outage, missing emission or an incorrect event shape; the cause remains unverified. M1 is unaffected.

Rechecked current official https://dev.reactive.network/reactive-contracts: documented Lasna CRON emitter, topic and one unindexed uint256 agree with the implemented check. Added diagnose:cron, an explicitly read-only observation command: three nonoverlapping bounded 2,000-block topic windows, all emitter topics over the latest 256 blocks, the CRON100 topic across emitters over that same bounded window, and before/after block heights. Output separates empty responses, unavailable queries and incompatible sample shapes; raw RPC errors/URLs/keys are not printed. An unchanged head during immediate queries does not establish a halted network. Historical or alternate-emitter events never waive preflight.

Three focused diagnostic tests pass after correcting a fixture's chain-ID hex literal. Tests cover malformed/removed/out-of-range logs, bounded read-only queries, missing RPC responses and wrong-network rejection. This slice changes no existing preflight acceptance logic, contract, deployment or payment code. Prior full 76-test/build results remain historical; no new full-suite/build or live diagnostic pass is claimed.

Execution/Integration: live scheduling gate remains blocked, not waived. Usefulness: existing M1 flow is unaffected. Craft: improved actionable, secret-free diagnostics; root cause still pending. Next: run npm run diagnose:cron in WSL, inspect its actual output, and fix the confirmed cause before any deployment. M2 remains NOT ACCEPTED.



## Indexed CRON event correction — 23 November 2026
Root cause established from user WSL diagnostics at 2026-11-23T10:46:19.948Z: each of three nonoverlapping 2,000-block windows returned 20 CRON100-topic logs. Samples have two topics and zero data bytes; the head advanced from 9,049,714 to 9,049,716. Our unindexed-only parser rejected those logs. The scheduler shared that incorrect assumption and would have silently ignored indexed ticks. This supersedes the earlier unknown-cause status; the previous local fixture repeated the same wrong layout and therefore missed the integration defect.

Official source at revision [72710d2](https://github.com/Reactive-Network/system-smart-contracts/blob/72710d2b5f4e15e445da782aaef9f8bae59f4af9/src/SystemContract.sol) declares Cron100(uint256 indexed number); [Omni LegacySystemContract](https://github.com/Reactive-Network/system-smart-contracts/blob/72710d2b5f4e15e445da782aaef9f8bae59f4af9/src/omni/LegacySystemContract.sol) inherits that source and invokes _cron(block.number). Current prose documentation describes number as unindexed, contradicting source/live samples. Source and actual observations govern this correction. No supported dependency revision changed.

Corrected preflight and diagnostics through a shared strict indexed-event validator. Signature/emitter and one 32-byte indexed number are required; data must be empty. Preflight reports the indexed number. Diagnostics now report matchingIndexedCron100 and indexed-number samples. Scheduler requires opCode 2, empty data and zero unused topic slots, retaining onlySystem, chain/emitter/topic checks, deduplication, bounded work and timestamp deadlines. The block number is not used as a payment timer.

Replaced the deployment CRON fixture with a genuine locally emitted indexed log. Added a scheduler regression forwarding an actual indexed receipt through the isolated protocol: a due job requests a callback once, repeat delivery is ignored, and old unindexed/extra-topic/nonempty-data shapes cannot run the due job. Malformed-log diagnostics remain covered.

Checks: focused diagnostic/deployment/scheduler run **17 passed**; final full suite **80 passed, zero failures/skips/cancellations**. All three Solidity 0.8.29 contracts and TypeScript/production frontend build pass. Existing 530.58kB chunk warning remains. Local protocol/CRON tests are not public callback evidence. User-supplied samples establish the observed mismatch; no independently re-fetched public receipt or corrected user-local preflight pass is claimed.

This changes upcoming M2 subscriber bytecode. No public deployment, migration, payment or fee broadcast occurred; M1 is unchanged. Existing M2 journal fingerprints must still be preserved and inspected, never deleted to bypass source checks. Execution/Integration: concrete integration defect corrected locally, live Settlio CRON delivery still required. Usefulness: intended unattended workflow preserved. Craft: source cross-check and actual-event regression close a fixture blind spot; broader browser/live/cost checks remain open. M2 NOT ACCEPTED.

Next: user WSL reruns preflight:m2 then plan:m2, both read-only. Confirm the corrected live observation before considering deployment. Scheduled-policy evidence linkage/verifier, new public deployment, browser-closed expiry/ETH-USDC refund/release traces, costs and recovery are still pending.



## User WSL M2 preflight and planning passed — 23 November 2026
Provenance: user-pasted command output after pulling a3aef74. Both preflight:m2 and plan:m2 succeeded read-only. Base chain ID 84532, Lasna 5318007 and issuer-listed USDC prerequisites passed. Both reported CRON100 hash 0xab6db2a9d9a4b89640185913021f7f2f3ad29301f294ca4ec945fe361df2a4a7 at block 9050100, indexedNumber 9050100, indexed-number layout, 20 matching logs in the recent window. This supersedes the corrected-check-awaiting-live-rerun status. It is user-local public RPC evidence, not an independently rerun workspace query or a Settlio callback trace.

Planned deployer: 0xbf6301D7bca9F23A63A2d1Ed513d5120Dbb2288E.
Source creation hashes: SettlioReactive 0x1c0f86e6cb9b03fba627eefbd07133082973d9bdeaf5b3ab23b720ac79f36454; SettlioCallback 0x6668b40b266a9976095830bf87fcd6ea2c8c67721a6b9111c86da9fb28a241ae.
Creation gas estimates: Reactive 2053657, callback 2539060. Constructor funding: 0.1 native Lasna test REACT and 0.001 Base Sepolia ETH. Reported creation costs including funding and the planner gas margin: 0.3464388 Lasna native and 0.001018281232 Base ETH. Wallet observations: 9.8153534 Lasna native and 4.724033742548682146 Base ETH. These exceed the creation estimates; configuration and future subscription/CRON/callback fees are additional. No perpetual-delivery or fixed-fee guarantee.

No transaction was sent by either command; no new address, deployment, policy payment, refund or release is established. Prior 80-test/build results stand; this documentation-only update does not claim a new test run. M1 remains intact. Next operational step: dedicated M2 deploy with its preserved journal and a securely entered local testnet deployer key, followed by verify:m2; obtain actual addresses/hashes/output before enabling new frontend configuration. Scheduled-policy evidence verification, browser-closed live expiry/refund/release, costs, failure recovery and remaining browser checks remain open.

Judging: Execution/Integration gain an observed network wakeup prerequisite, not M2 delivery. Usefulness unchanged. Craft closes the preflight-blocker diagnosis with reproducible user output. M2 remains NOT ACCEPTED; M3/M4 remain pending.



## M2 deployment attempt stopped — outcome unverified · 23 November 2026
User entered the hidden local key prompt and deploy:m2 returned the generic “M2 command stopped” message. verify:m2 did not run because the commands were chained with &&. No public hashes or addresses from this attempt have been supplied. The error does not establish the failing stage, absence of a broadcast, complete failure, invalid key, insufficient funds or loss of funds. Preserve the journal and inspect it read-only before another deployment attempt. This supersedes the earlier no-attempt/deployment-pending current status.

Added status:m2: no signing-key access, file write, lock removal, nonce replacement or broadcast. It reads only whitelisted public fields, reports journal/lock presence, validates the M2 schema/networks and checks saved transaction receipts/hashes on the appropriate chain. It distinguishes succeeded, reverted, pending, missing-but-unknown, unavailable-RPC and mismatched-receipt outcomes. Saved “confirmed” alone is not trusted as a fresh receipt check. Unknown JSON fields/raw RPC messages are not printed.

Deployment errors now show fixed stage labels and allowlisted codes, including wallet-key, network-preflight, compile-and-journal, deployment operations and verification. Unknown raw messages are suppressed; no raw key/signing payload/RPC URL is logged. This improves future failures; it cannot reconstruct the exact stage of the user's previous generic error. No contract bytecode, journal fingerprint, subscriptions or frontend source changed.

Checks: five focused status/error checks pass, including an actual CLI invalid-key invocation with no secret in output. The local deployment integration also checks real successful saved receipts and journal preservation after a simulated index outage. Final full suite: **85 passed, zero failures/skips/cancellations**. No new contract/frontend build is claimed for this script-only change; previous builds remain the baseline. These are isolated tests, not verification of the user's attempt.

Execution/Integration: public M2 deployment and unattended loops remain unverified. Usefulness: inspect-before-retry prevents confusion around pending deployments. Craft: explicit, secret-free status/errors; actual failure root cause still open. M2 NOT ACCEPTED. Next: user runs status:m2 without a key and supplies its public output; diagnose the demonstrated state before resuming. Keep the existing M1 configuration and preserved deployment records.



## M2 deployments reported successful; filter wrapper correction · 23 November 2026
User status:m2 output reports successful current RPC receipts for deployReactive (Lasna nonce 2, block 9050953), deployCallback (Base nonce 112, block 62551090) and configure (Lasna nonce 3, block 9050973). Journal exists, lock absent. These observations establish user-reported successful operations, not a complete milestone or independently re-fetched workspace receipt verification. Preserve these contracts and their journal; no redeployment is required to fix the parser.

Reactive: 0xa2DBeB94c0a151e071A6c29999FE1c6B38217b85, creation hash 0x203cb01ad5e88677db960f65a8cb3324d70e0cb9d838036e9c2abfa26eaf0a75.
Callback: 0x1E44e729A2f2Fa2e64C1eDb9904A2eCD90C8A781, creation hash 0xdd859f335b11a37e314661b86cec8c3011452c1e5140947ff427aec6d6985b7c.
Escrow: 0x1694e56187f9422e364B42af3185d34a0D4b9bc0, reported by the M2 journal/status reader.
Configuration: 0x139facceb7a833911d42af29fd6bb2f20509da34bc05bea6a5b795fd7b892dd6.

Root cause of verify-deployment failure: the actual rnk_getFilters response has Version and TopicFilters (PascalCase, observed version 12309), while our parser only accepted the documented camelCase version/topicFilters wrapper. Inner ChainId/Contract/Topics/Configs/Active fields match the expected structure. The supplied first 5,000 characters do not include proof of Settlio's own ten subscriptions; complete verification still must query the full response.

Parser now explicitly accepts either top-level convention, preserves version reporting, rejects conflicting/malformed wrappers and invalid versions, and retains exact chain/source/topic/wildcard/subscriber/active checks. It does not guess arbitrary fields, accept inactive subscriptions or convert a schema error into success. Extended tests exercise both conventions and failure boundaries; the full local deployment/verification fixture now returns the observed PascalCase wrapper.

Final full local suite: **86 passed, zero failures/skips/cancellations**. No contract/frontend source, source fingerprint, deployment intent or principal changed. No new build/live verifier pass claimed for this script-only change. Previous contract/frontend builds remain the baseline. No transaction is sent by this correction.

Execution/Integration: successful deployment/configuration receipts are user-reported; complete runtime/wiring/subscription verification and unattended policy traces remain open. Usefulness unchanged. Craft: production-response casing regression fixes another fixture/documentation blind spot; browser, operational fees and recovery coverage remain pending. M2 NOT ACCEPTED. Next: pull main and run verify:m2 only, without a private key. Do not deploy again to clear this parser error.



## M2 deployment verification passed — user WSL, 23 November 2026
User pulled 6203604 and ran verify:m2 successfully without a key. Provenance is supplied live WSL command output, not an independently rerun workspace query. Report: policyVersion 3, wiringVerified true, ten active origin subscriptions, filterVersion 12314. Quote count and active jobs are both zero; scheduler not paused; cronActive false. The verifier requires inactive CRON when there is no runnable work, so this is the correct idle state, not an automation failure.

The read-only verifier checks recorded creation/configuration transactions, compiled creation/runtime bytecode with separately verified immutable wiring, chain IDs, versions, custody coverage and active exact subscriptions. These deployment checks are now COMPLETE at the reported observation. This does not verify future dynamic CRON activation/delivery or an end-user policy execution.

Custody observation: ETH balance/liability zero, USDC balance/liability zero. Lasna subscriber 0xa2DBeB94c0a151e071A6c29999FE1c6B38217b85 has balance 100000000000000000 (0.1 native test REACT), debt/reserves zero, needsAttention false. Base callback 0x1E44e729A2f2Fa2e64C1eDb9904A2eCD90C8A781 has balance 1000000000000000 (0.001 test ETH), debt/reserves zero, needsAttention false. These are current observations, not guaranteed capacity for later jobs. The new escrow remains 0x1694e56187f9422e364B42af3185d34a0D4b9bc0. Existing M1 addresses/quotes remain separate.

No source implementation changed or tests/builds rerun for this documentation-only update. Prior 86-test/script regression and contract/frontend builds remain the baseline. Local installed Vite loadEnv was inspected: explicitly supplied VITE process variables take precedence over dotenv values. Operator can open a separate M2 dev instance on strict port 5174 with only its process-scoped public escrow variable, preserving the configured M1 dev instance.

Judging: Execution has verified deployment prerequisites but no live M2 policy callbacks yet; Integration has verified origin subscriptions but dynamic CRON and unattended destination outcomes are pending; Usefulness requires completing merchant/customer live journeys; Craft gains reproducible recorded verification while broader browser/device/cost/recovery gates remain open. M2 NOT ACCEPTED. Next: open the M2 interface, verify the policy controls/version before creating a fresh timed quote, then collect genuine unattended expiry/refund/release traces and complete scheduled-policy evidence verification. Do not begin M3.



## M2 Quote 1 registration blocked — official live diagnostics · 23 November 2026
User created the unpaid automatic-expiry quote, creation hash 0x26d54a13b47dafeced742b46ae831140348aa535e7af71e8b35fc547fa1014f6. The supplied 11.67-second video shows M2 localhost:5174 Quote 1, photography automatic-expiry test, Awaiting deposit, 0.0001 ETH deposit/0.0003 total, manual release, deadline 23 November 13:00 WAT and full-refund cutoff 14:30 WAT. It displays “Waiting for the scheduler to observe this quote.” This is user/browser evidence, not callback proof.

User WSL verify:m2 then reports quoteCount 1, activeJobs 0, CRON false, paused false, ten origin subscriptions (filterVersion 12325), empty principal custody and unchanged fee balances with zero debt/reserves. This is not the expected end-to-end registration result, even though the structural verifier's queue/CRON consistency condition passes. Do not mark automation complete from wiringVerified alone.

Reached the public official read-only Reactive MCP at https://mcp.rnk.dev/mcp directly and inspected tool schemas before use. Independent service queries:
- validate_subscription: OK_VALID / proven for Base 84532, our escrow, exact PolicyRegistered topic 0x507cf77845a76d912db6ba6ca3fe5da2563fb037fbbc870d551aa9e27803e5ef, wildcard indexed quote ID. It reports one recent matching event, one subscriber, rcListed true and rcActive true; filterId 0x74caf4021f8749623cbfe403a6ea636c.
- trace_origin_event: origin receipt metadata includes our PolicyRegistered log at index 2, two topics, Base block 62555346. Sequence not found / cannot_prove; scanning stopped after 264 blocks at its 300-RPC request budget. This is inconclusive about delivery, not proof that no reaction could exist.
- get_network_info twice: SEQUENCER_STALLED / likely. First sample advanced Lasna 9052179 -> 9052182 with sequence frontier fixed at 179629726; later sample 9052238 -> 9052241 retained the same frontier. The service flags origin-ingestion stalling. This is a likely external blocker, not a confirmed network-wide outage; public RPC load balancing is an explicit service caveat.
- get_rc_health: ten active subscriptions, zero debt/reserves, balance 0.1 test REACT, zero observed reverts in 3001 blocks. LOW_RESERVES / likely is a separate heuristic based on ten assumed 60000-gas reactions (0.16 REACT cushion), not measured Settlio gas. Our pinned AbstractPayer source implements pay(), so the tool's conditional exclusion of contract balance must not be interpreted as proof of zero available funds. A larger fee buffer/cost review is still required before relying on repeated timed checks.

Committed labelled [diagnostic evidence](../deployments/evidence/m2/quote-1-registration-diagnostic.json), explicitly not a successful execution trace. Direct Base RPC from this workspace remained unavailable; origin metadata was retrieved through the official service. No source, test, contract, deployment or state-changing operation was modified by this investigation. Prior 86 tests/build results stand; no rerun claimed.

Execution/Integration: live registration, dynamic CRON and policy callbacks BLOCKED / UNVERIFIED. The root cause is not yet exclusively proven; exact filter validity and repeated likely-ingestion-stall observations narrow the investigation. Usefulness is not established by a blocked test. Craft gains source-cross-checked, provenance-labelled service evidence and honest scan limits; missing scheduled-policy verifier, fee buffer, cost/recovery and browser acceptance gates remain open. M2 NOT ACCEPTED.

Keep this quote unpaid and preserve its link/hash. Passing 13:00 WAT is intentional for the expiry test; an overdue deadline alone or a UI label is not proof of an authenticated expiry callback. Once ingestion resumes, recheck this same quote, provision adequate separate fees, and collect the actual origin/CRON -> Reactive -> Base result. No retry, new quote, redeployment, top-up or payment was performed by the assistant. No M3 work began.



## M2 registration/CRON recovered; fee debt and callback delivery remain open · 23 November 2026, about 15:16 WAT
Fresh independent official MCP observations supersede the earlier likely-ingestion-stall diagnosis: get_network_info reports OK_NETWORK / proven, frontier 179714802 -> 179714828 at Lasna heights 9061591 -> 9061595. This proves movement during that sample, not permanent network health.

Direct public read-only RPC checks (Base Sepolia publicnode, Lasna official RPC) show Quote 1 still status AwaitingDeposit (1), expiry 1795435200 (13:00 WAT), refund cutoff 1795440600 (14:30 WAT). jobs(1) now registered true, attempts 3, nextAt 1795440652, closed false, confirmed/cancelled/attention false. The original quote has registered; do not recreate it or alter its terms. Both deadlines are past, so only an authenticated expiry result can establish automated completion.

Independently retrieved three PolicyCallbackRequested logs for Quote 1. First reaction 0x80ff5a138037db5fff54218c6a95487cb7cf868f8f89479e0625b358141bfb92 (block 9058601); later requests 0xbb1d31d87ea2d46d884f390242ce03feeae2bf2adc263ad22c2fb6fe988779c3 and 0x07bc0f3491985978a7746a3f141721eb76e853a3b077eebd17986c3e5f64202e. Official trace_reactive_tx proves the first react() succeeded, gasUsed 127271, from a real Lasna CRON100 origin at block 9058600, hash 0x5f7362f65dea57beb12be0ceb49ea1bb378a2dfe6b6166b4d6edecb76558fb83, log index 2; it requested one callback to our Base receiver with gasLimit 1000000. This is real CRON -> Reactive -> callback-request evidence, not successful delivery or browser-closed acceptance.

Official trace labels CALLBACK_NOT_POSTED / cannot_prove: getCallbacks is empty; the service sees no posted results network-wide in its sampled 30000 blocks and no recipient CallbackFailure in its sampled Base interval. Return-report absence alone does not prove nondelivery. The separate Base quote status remains 1, so expiry has not been accepted at the observed state. Delivery investigation remains open.

Current hard blocker: official get_rc_health reports IN_DEBT_BLOCKED / proven, debt 14768500000000000 wei (0.0147685 test REACT), reserves zero, balance 9090600000000000 wei (0.0090906), eleven subscriptions total and none active. PaymentFailure and BlacklistContract are reported at block 9059001 in 0x84cc66b427da3d9b5852468bd9d1813303bc87ed08567c7ee88da061ecbe30ce. Initial 0.1 test REACT did not cover elapsed checks; the earlier low-fee warning must now be treated as a real operational failure. Contract pay() support does not exempt it from debt blocking.

Implemented fund:m2 for one fixed 1-test-REACT SYSTEM.depositTo(existing M2 subscriber) reserve payment. It validates Lasna, recorded deployer, existing creation receipt/compiled code and immutable target wiring; it does not require active subscriptions while recovering from debt. It shares the M2 lock and writes its fundReactive public intent/hash before broadcast. Rerunning resumes that same transaction, not a second deposit. status:m2 includes the optional funding operation. Safe fund-stage errors preserve existing secret suppression. It does not replace deployments, change constructor funding/source fingerprints or touch escrow principal.

Validation: full local suite 87 passed, zero failures/skips/cancellations, then six focused reserve/status checks passed after a final error-stage wrapper. A real isolated fixture deposit clears 0.0147685 fixture debt, credits 0.9852315 reserves, preserves subscriber balance and creation record, rejects wrong deployer, and repeats without another deposit; fixture accounting is not live protocol evidence. No contract/frontend source changed or new builds claimed. No public reserve payment was sent by the assistant; user-local key action is required.

Saved a labelled quote-1-recovery-diagnostic.json containing live observations/request logs and delivery limits. Execution/Integration now have live registration and CRON/request proof, but delivery, expiry/refund/release, full evidence verification and browser-closed testing remain incomplete. Usefulness awaits successful recovery and destination outcome. Craft gains journalled fee recovery; cost/admission thresholds and callback delivery remain weaknesses. M2 NOT ACCEPTED. Next: user runs fund:m2 once with the dedicated local key, verify debt/subscriptions, then inspect the same quote and trace actual destination delivery. A reserve payment fixes debt, not every callback problem.



## M2 Quote 1 authenticated expiry and fee recovery verified · 23 November 2026
User fund:m2 receipt 0xaaa3863b906620ce06546e69fd288c4b51deae460da3f6e958c0d06d14a68282 succeeded. Independently fetched its raw Lasna transaction and receipt: chain 5318007, value 1 test REACT, official SYSTEM recipient, decoded depositTo target equal to the recorded M2 subscriber, successful receipt at block 9062289. User immediate debt 0/reserves 0.9852315; later verify:m2 reserves 0.9684279. Independent official health at 14:31 UTC reports HEALTHY / proven, debt zero, reserves 0.9536594 and all 11 subscriptions active. Readings differ as paid reactions consume reserves; no future-fee guarantee. Saved funding-recovery-1.json with raw public evidence and provenance. No second fund operation was sent.

An independent Base read at 14:31 UTC still showed AwaitingDeposit; a later read at 14:35 UTC showed Expired (6). Scheduler jobs(1) is registered and closed, with nextAt zero and four attempts. Found successful Base callback 0x547bbbf96a201348cf818f4dcf97a55dacb9403b24892009d152c2e219064899 at block 62612635, timestamp 2026-11-23 14:33:15 UTC / 15:33:15 WAT. Its actual proxy call decodes deliverCallback version 0, Base chain ID, the configured M2 receiver and processPolicy(M2 Reactive address,1). The escrow emits QuoteExpired(1) and PolicyChecked(1,6) in that same successful receipt. Current immutable receiver/proxy/Reactive wiring was freshly queried and matched.

Added verify:expiry, a key-free verifier accepting quote ID and creation/CRON/reaction/callback hashes (optional journal path). It validates actual creation/policy terms and original processed fingerprint, exact indexed network CRON log, injected SYSTEM trigger input and receipt linkage, matching PolicyCallbackRequested/system CallbackRequest, delivered proxy configuration/authenticated sender and quote payload, successful expiry/outcome events, deadline/block timing, terminal quote and scheduler acknowledgement. It writes namespaced evidence only after all checks pass and whitelists public journal identity before saving.

Independently retrieved live RPC responses passed validateBundle, yielding quote-1-expiry.json. Full CLI collection from this workspace hit Node provider network detection/access failure; that attempt did not write new success evidence or send a transaction. Public responses were instead fetched through Python HTTP and checked by the same validator. User WSL reproduction of the complete CLI transport is still pending. No fabricated receipt or simulated production transaction is used.

Attribution limit: retries have identical payloads and the official return-report index still lacks mapping. The supplied real CRON/reaction #4 is a matching candidate, not uniquely identified as the one delivered. Report explicitly sets uniqueRetryAttribution false. Browser closure was not recorded; no browser-closed acceptance is claimed. The service's CALLBACK_NOT_POSTED / cannot_prove result is not proof of failed delivery: Base receipts now prove accepted expiry despite missing return reports. No exact-latency claim.

Validation: eight historical-public-evidence/tampering tests pass; full local suite 95 passes with zero failures/skips/cancellations. After optional journal-path and clearer result-label adjustments, the eight focused checks pass again. They replay genuine recorded evidence and do not count as fresh live execution. No contract/frontend bytecode or deployed address changed and no new contract/frontend build was needed/claimed. Existing build baseline remains.

Execution/Integration: COMPLETE for this scope — real quote registration, CRON/request and authenticated quote-linked expiry; fee-debt recovery independently verified. Usefulness: an unpaid booking becomes expired without a merchant expiry transaction; timing was delayed and browser-closed proof remains open. Craft: reproducible validation and explicit attribution/transport limits; measured costs/admission thresholds and broader journeys remain weak/open. M2 NOT ACCEPTED overall. Next: user reruns read-only verify:m2 and verify:expiry, checks the Expired page, then complete ETH/USDC refund/release and browser-closed acceptance. Keep the original 13:00/14:30 WAT terms; do not create a replacement quote for this result.



## M2 expiry CLI reproduced from user WSL — 23 November 2026
User pulled 8107f00 and successfully ran verify:m2 followed by verify:expiry. Public expiry result verifiedAt 2026-11-23T14:55:21.519Z (15:55:21 WAT), scope quote-linked authenticated live expiry, outcome Expired, schedulerClosed true. This closes the previously pending complete-CLI transport/reproduction gate. It does not change the historical independently collected snapshot timestamp; the user's refreshed local JSON has not been silently substituted for the published bundle.

The supplied result repeats the exact creation/CRON/associated reaction/callback hashes in quote-1-expiry.json and preserves uniqueRetryAttribution false and browserClosedEvidence not recorded. Those are explicit evidence limits, not hidden success claims. Browser-closed capture remains pending.

Fresh user verify:m2: ten origin subscriptions, filterVersion 12401, quoteCount 1, activeJobs 0, CRON false, paused false. The completed job has left the runnable queue; inactive CRON is the correct terminal idle state. ETH/USDC custody balance and liability all zero. Reactive debt zero, reserves 907803600000000000, balance 9090600000000000; callback debt/reserves zero, balance 999354797200000. Funding observations are current, not perpetual capacity claims.

Documentation-only status reconciliation; no code/build/test rerun or new transaction by the assistant. Prior 95-test full run/focused checks stand. Execution/Integration: authenticated live unpaid expiry plus user-reproduced evidence complete for this scope. Usefulness: next gate is a paid booking's cancellation/refund, not another expiry quote. Craft: reproducible public CLI now user-confirmed, while unique-attempt attribution, browser closure, costs/admission and remaining live workflows stay open. M2 NOT ACCEPTED overall.

Next planned test: a new ETH-only quote for the designated customer, total 0.0003 test ETH, deposit 0.0001; automatic release off and USDC unchecked. Planned payment deadline 23 November 17:00 WAT and refund cutoff 19:00 WAT, future relative to the observed 15:56 WAT preparation time. This is a proposed test template, not an existing quote or new transaction. Create/share first and collect the genuine creation receipt before paying/cancelling; refund acceptance requires exact same-asset return, cleared liability and authenticated Reactive delivery. Adjust future times if creating later; never alter the expired Quote 1's terms.


## M2 Quote 2 ETH cancellation/refund checkpoint — 23 November 2026
Independent read-only Base Sepolia/Lasna RPC collection and offline receipt/calldata/accounting assertions passed at 2026-11-23T15:21:49.670Z (16:21 WAT). Public raw receipts, transactions, CRON, current state and refund-block balance observations: [quote-2-eth-refund.json](../deployments/evidence/m2/quote-2-eth-refund.json).

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

**COMPLETE for this live USDC deposit/confirmation/cancellation/refund outcome; M2 NOT ACCEPTED overall.** Independent read-only Base Sepolia/Lasna collection and offline assertions passed at 2026-11-23T15:52:22.293Z (16:52 WAT). Raw public receipts, transactions, CRON, state, token balances and current fee-health response: [quote-4-usdc-refund.json](../deployments/evidence/m2/quote-4-usdc-refund.json).

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

Fee review: [fee-observation-2026-11-23.json](../deployments/evidence/m2/fee-observation-2026-11-23.json) contains actual historical SYSTEM reserve reads, calldata, block numbers and current fee parameters. Subscriber reserve debits across the accepted USDC confirmation/request blocks are **0.0299719** and **0.0168036 test REACT** respectively. These include all subscriber activity in those blocks and are not isolated transaction prices or complete per-quote costs. Lasna effectiveGasPrice is null on these receipts; no gasUsed-times-price figure is invented. Current observed reactive coefficient 1000/1000, surcharge 100000 gas; Base proxy coefficient 1100/1000, surcharge 80000 gas. Reserve observation 0.414101 test REACT; Reactive and callback debt zero. Rechecked official economy docs: configured surcharge/coefficient and price determine charging; zero debt and positive reserves do not guarantee future delivery. Protocol parameters can change.

Execution/Integration: real ETH/USDC refund trails independently re-collected and checked, with replay and tamper rejection. Usefulness: exact deposits returned to designated customers without a separate refund transaction. Craft: reproducible public CLI and preserved provenance; WSL transport reproduction, complete cost/admission budget and browser-closed/automatic-release evidence remain open. **M2 NOT ACCEPTED.** No new quote, payment, top-up or deployment by the assistant. Complete user key-free refund reproduction, then resolve sufficient separate fee budget before the next explicitly consented timed-release test; do not treat this partial fee review as an admission gate.


## M2 refund CLI reproduction complete — user WSL, 23 November 2026

User pulled bf81aae and successfully ran both default live refund commands, followed by verify:m2. Quote 2 ETH verifier result verifiedAt 2026-11-23T16:02:51.179Z (17:02:51 WAT); quote 4 USDC result 16:02:58.146Z (17:02:58 WAT). Both report Refunded, schedulerClosed true, exact refundUnits (100000000000000 wei ETH / 1000000 USDC units), current asset balance/liability zero. **Full user WSL refund CLI reproduction COMPLETE.** This closes the former transport/reproduction gate. Provenance is user-supplied successful terminal output, not independently fetched bytes of the newly written user-local snapshots; published bundles retain their genuine earlier verification dates.

The following verify:m2 output reports policyVersion 3, wiringVerified true, ten active origin subscriptions, filterVersion 12606, quoteCount 4, activeJobs zero, CRON false, paused false. ETH and USDC custody balance/liability are all zero. Reactive debt zero, reserves 414101000000000000 (0.414101 test REACT), balance 9090600000000000. Callback debt/reserves zero, balance 884378354010290 wei ETH. Idle CRON is expected after terminal acknowledgement. These are user-reported point-in-time observations, not future funding guarantees.

uniqueRetryAttribution remains false and browserClosedEvidence remains not recorded. Do not retroactively claim either from CLI success. No code/build/test rerun, deployment, quote creation or funding transaction in this documentation-only update; prior full 107-test and final 12-focused-check results stand. Historical failures remain preserved.

Judging: Execution/Integration — real ETH/USDC refund outcomes now reproduced by the user through the full read-only CLI; Usefulness — same-asset customer recovery supported by actual events/accounting; Craft — commands and evidence are reproducible, while full operating-cost/admission and browser-closed/automatic-release/recovery gates remain open. **M2 NOT ACCEPTED; M3 pending.** Next: establish a sufficient separately funded budget for the timed automatic-release test and an explicit browser-closure capture procedure before creating the next quote. Do not rerun the saved one-time fund:m2 intent expecting a new deposit or alter its journal.


## M2 conditional release budget and separate funding intent — 23 November 2026

Implemented read-only `npm run budget:m2 -- 30` for one isolated release test with cutoff no later than 30 minutes after creation and a fixed 15-minute delivery allowance. Requires Base/Lasna IDs, idle/unpaused scheduler, no fee debt, fresh RPC heads and at least three recent genuine indexed CRON100 observations. It models twice fastest sampled CRON cadence, twice current gas price/basefee, the 900000 source protocol gas cap plus configured surcharge, sixteen extra source events and eight destination callbacks at the configured 1000000 requested gas plus surcharge. It re-reads source/destination coefficients, surcharges and funds. This is a deliberately conservative conditional stress scenario, NOT a fee prediction, protocol guarantee, complete operating-cost acceptance or an on-chain admission control. Concurrent activity, higher rates/parameters/delays invalidate it.

Fresh independent actual collector via Python HTTP public RPC passed with `canStart: false`. [release-budget-before-funding.json](../deployments/evidence/m2/release-budget-before-funding.json) records actual sampled minimum CRON 105 seconds, modeled tick 52 seconds, 52 ticks plus 16 extra calls, modeled source requirement 13.6 test REACT against 0.414101 prepaid reserves (shortfall 13.185899). Destination requirement 114048000000000 wei ETH is covered by observed callback balance 884378354010290. Source/destination debt zero. Independent deployer balance read returned 8.4928356 test REACT, insufficient for a 14-token reserve payment plus gas. No full Node/WSL budget CLI reproduction is claimed yet.

Prepared `npm run fund:m2:release`: a separate fixed 14-test-REACT SYSTEM.depositTo(recorded existing M2 subscriber) operation `fundReactiveRelease`. Original `fund:m2` remains the 1-test-REACT recovery and its existing saved hash is preserved. New purpose shares the M2 lock, verifies schema/owner/network/source creation/immutable target wiring, saves its unsigned public intent/hash before broadcast and resumes that same hash on rerun. It neither creates arbitrary top-ups nor edits old intents. Safe stage/status reporting includes the new operation. This is implemented local tooling, not a new live deposit or authorization to claim funding succeeded.

Validation: six focused budget/funding checks passed; full suite **112 passed, zero failures/skips/cancellations**. Isolated real local-chain fixture verifies the new 14-token deposit is distinct, resumes without another transfer, preserves the original funding record/hash and does not persist keys. Pure budget tests reject low source/destination funds, debt, occupied/paused state, wrong networks, missing/nonmonotonic cadence and invalid horizon/rates. They are fixtures, not live funding proof. Initial full-test command ran outside the repo and exited before tests; corrected repo-root run passed all 112. No contract/frontend source, deployment or bytecode changed; no new build claimed.

[Release test procedure](RELEASE_TEST.md) is PREPARED / NOT EXECUTED: fresh absolute WAT payment deadline/cutoff after funding; explicit automatic-release consent; actual customer deposit/confirmation; recorded closure of both app tabs before cutoff; reopen for read-only checks after; no manual merchant claim/retry during observation. Prove same-asset deposit goes to merchant, liability clears and scheduler closes using genuine CRON/request/authenticated callback. Remaining balance collection is outside current build. Browser closure cannot be inferred retrospectively.

Official economy and faucet sources rechecked: https://dev.reactive.network/economy and https://dev.reactive.network/reactive-mainnet. Base Sepolia faucet 0x2afaFD298b23b62760711756088F75B7409f5967 exchanges 1 test ETH for 100 test REACT. Next user action is a 0.1 test ETH faucet request from the deployer (expected 10 test REACT), verify arrival, then explicitly run the new hidden-key reserve operation and rerun budget/verify:m2. No faucet/reserve transaction, key entry, new quote or automatic release occurred in this step.

Judging: Execution/Integration — budget reads are real but release/funding success still pending; Usefulness — avoids starting a timed journey with an unexplained fee shortfall; Craft — explicit scenario limits, separate recoverable intent, tested duplicate safety and closure procedure. M2 NOT ACCEPTED. No M3 work.


## M2 release-test funding verified and WSL budget pass — 23 November 2026

**COMPLETE: separate reserve deposit receipt and user WSL budget-command reproduction.** Independent Lasna receipt/transaction fetched at 2026-11-23T16:19:03.080930Z confirms successful transaction 0x8a0f11608a458b9e88a1da0ebdb98cc3436493921f9335da8cbef3d26b51f7cc, official SYSTEM recipient, recorded deployer sender, chain 5318007, value 14 test REACT and decoded depositTo(existing M2 Reactive). Public evidence: [release-funding-verified.json](../deployments/evidence/m2/release-funding-verified.json). The user signed this operation; no assistant key entry or broadcast. The earlier 1-token recovery remains a separate saved intent.

User WSL on bd271a6 reports budgetObservedAt 2026-11-23T16:17:22.097Z (17:17 WAT), reserves 14.414101 test REACT, modeled requirement 13.6, no source shortfall, callback requirement 114048000000000 vs available 884378354010290 wei ETH, canStart true. This closes live budget-CLI reproduction and the measured readiness shortfall for that conditional 30-minute isolated scenario, not general operating-cost/admission acceptance. No claim the stress allowance is the actual fee charged.

User verify:m2 reports wiring verified, ten origin subscriptions, filterVersion 12709, four quotes, zero active jobs, inactive idle CRON, unpaused; all ETH/USDC custody balances/liabilities and both fee debts zero. These state/budget readings have user-terminal provenance; they are not mislabelled as independently re-fetched readings. Published snapshot bytes and dates are preserved.

No code/test/build changes or reruns in this evidence/documentation update; prior 112-test suite stands. Execution/Integration: genuine reserve funding and healthy user prerequisites, automatic release still unproven. Usefulness: fee runway prepared for a consented timed booking. Craft: decoded public receipt and explicit scenario/provenance/closure limits. **M2 NOT ACCEPTED; M3 pending.**

Next: one ETH-only automatic-release quote with explicit consent, fresh absolute WAT payment deadline and full-refund cutoff within the budget horizon; independently verify creation, then customer payment/confirmation and recorded closure of both app tabs before cutoff. No cancellation or manual merchant claim during this release test. The next quote does not yet exist. Recheck readiness if setup/rates/traffic change; a conditional budget pass is not a delivery guarantee.


## M2 Quote 5 ETH automatic release verified — 23 November 2026

**COMPLETE for this authenticated on-chain ETH release/accounting/terminal scheduler outcome. M2 NOT ACCEPTED overall.** Independently fetched Base/Lasna receipts, transactions, exact origin/CRON inputs, current immutable wiring, historical blocks and balances passed offline assertions at 2026-11-23T17:05:31.005Z (18:05 WAT). Public bundle: [quote-5-eth-release.json](../deployments/evidence/m2/quote-5-eth-release.json).

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

**COMPLETE for authenticated USDC release, exact merchant accounting and terminal scheduler; reopening COMPLETE by video. Earlier tab closure is USER CONFIRMED. M2 overall NOT ACCEPTED.** Independent Base/Lasna public RPC evidence and offline assertions passed at 2026-11-23T17:46:15.671Z (18:46 WAT). Raw receipts, transactions, origin/CRON logs, block times, state, wiring, balances and recording provenance: [quote-6-usdc-release.json](../deployments/evidence/m2/quote-6-usdc-release.json).

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

Added read-only plan:recovery and one-time, journalled pause:recovery/resume:recovery owner commands for the existing deployment. [Procedure and restore command](RECOVERY_TEST.md). Initial pause requires idle/unpaused scheduler and zero ETH/USDC liabilities; restore remains available if jobs appeared while paused. Network, compiled Reactive creation, owner and callback wiring are checked; saved intent/hash and deployment lock prevent accidental duplicate sends. This does not create a quote, deposit or participant retry. No live owner action was sent during implementation.

Focused isolated two-network EVM tests cover wrong key/network, refused busy/funded pause, saved-hash reuse, participant request observation while paused, restoration of CRON for a waiting unpaid job and refusal to re-pause using the completed cycle. Local fixtures are not public proof. Full suite: **126 passed, zero failures, skips or cancellations**; no contract/frontend build was needed or claimed for this scripts-only change.

M2 remains NOT ACCEPTED: public participant-retry recovery is pending, source queue admission remains uncapped, and budget:m2 remains an off-chain conditional model. No contract, frontend or deployed bytecode changed; no redeployment. Current official network/economy references were rechecked: https://dev.reactive.network/origins-and-destinations and https://dev.reactive.network/economy. Existing public expiry/refund/release evidence and accepted user/video provenance remain unchanged. M3 has not started.

Judging: Execution — normal public trails retained; this new recovery scenario has local proof only. Integration — existing participant signal and scheduled policy restoration exercise real application paths in the fixture. Usefulness — recover an overdue unpaid booking without exposing a deposit. Craft — explicit restore procedure, nonce-safe intents, tests and honest operational limits. Next: user-local read-only plan:recovery and verify:m2, then one controlled unpaid recovery journey if readiness checks pass.


## M2 Quote 7 controlled recovery verified — 23 November 2026

**COMPLETE for the scoped live participant-retry / owner pause-and-restore / authenticated expiry journey. M2 overall NOT ACCEPTED.** Independent public Base/Lasna collection passed the existing expiry validator at 2026-11-23T21:14:20.200Z (22:14 WAT). Evidence: [expiry bundle](../deployments/evidence/m2/quote-7-expiry.json), [owner actions and participant retry](../deployments/evidence/m2/quote-7-controlled-recovery.json), [saved pre-resume observation](../deployments/evidence/m2/quote-7-before-resume-observation.json).

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

**V4 admission and destination integration IMPLEMENTED / LOCALLY VERIFIED / NOT DEPLOYED. M2 NOT ACCEPTED.** Separate source directory [admission](../packages/contracts/admission) and [design/remaining gates](../docs/ADMISSION_DESIGN.md). Existing V3 contracts/source/creation hashes/journals/evidence are preserved. No new wallet action or deployment was performed.

The new ledger starts closed, requires sponsor-authorized expiring merchant credits with an explicit funding-observation reference, caps concurrent/reserved work and total lifetime admissions, bounds new deadlines and shares a finite retry cooldown/count across confirmation and policy retry. Credits never hold customer principal. Consumed lifetime credits do not regenerate when a quote closes, so even delayed terminal acknowledgements cannot permit an unlimited sequence of distinct source jobs. Numeric limits are constructor inputs; small test values are fixture configuration, not public deployment defaults.

All V4 creation paths invoke the ledger. Refund/release/expiry close capacity exactly once; invalid creation and failed principal transfer roll back. Closing admission does not block existing payments, cancellation, callbacks or claims. The review identified that permanently exhausted participant retries could otherwise strand a reserved refund. V4 adds customer-only claimRefund for RefundPending, preserving same-asset liability/reentrancy/duplicate protections and independent of admission/network availability. Normal automatic refund remains available; this is an explicit recovery path.

Checks actually run: separate admission build passed EVM runtime/initcode size checks; **final full suite 134 passed, zero failures/skips/cancellations**. Tests include all creation methods, grants/capacity/lifetime/deadline boundaries, access control, rollback, duplicate closure, shared retries, cancellation after exhaustion, failed token callback followed by customer recovery with admission closed, token automatic release, native accounting and exact preservation of both V3 deployment fingerprints. No frontend build was claimed because its source was not changed. All new transactions were isolated local EVM fixtures, never public integration evidence.

Current public V3 deployment is still uncapped. Base cannot directly read Lasna reserves: the ledger observation is a trusted sponsor attestation, not a cross-chain funding proof or guarantee at future gas prices. Funding-aware grant planning/execution, new-version deployment/recovery journal and subscription checks, direct V4 Reactive end-to-end fixture coverage, V4 shared terms/plain-English interface and new public evidence remain OPEN. The immutable deployment must not be labelled patched; do not use the existing V3 deploy/journal for V4. No arbitrary production capacity/horizon or funding rate was silently selected.

Separately, user WSL live Quote 7 expiry verifier passed at 2026-11-23T21:19:15.048Z (22:19 WAT): Expired, schedulerClosed true, associated attempt 1. **Quote 7 user CLI reproduction COMPLETE** with user-terminal provenance. Its new local snapshot bytes were not fetched or fabricated into the earlier independent bundle; retry-attribution and browser-evidence limits remain intact.

Judging: Execution — accepted V3 public outcomes retained; new V4 code has local evidence only. Integration — admission occurs in contract creation, not only the page; automation and recovery guard customer accounting. Usefulness — finite sponsored work and refundable deposits survive retry exhaustion. Craft — version-isolated source, dedicated build, adversarial checks and explicit funding/deployment limits. Next: funding-aware grant tooling, direct V4 source integration and versioned interface/deployment verification. M3 remains pending.


## M2 V4 automation fixture and initial funding planner — 23 November 2026

**COMPLETE — LOCAL V4 origin/CRON/callback integration and read-only initial grant planning. NOT PUBLICLY DEPLOYED; M2 NOT ACCEPTED.** See [funding planner](../docs/ADMISSION_FUNDING.md), [planner source](../script/admission-budget.cjs), [budget tests](../test/admission-budget.test.cjs) and [two-chain integration](../test/admission-reactive.test.cjs).

Actual V4 contracts are deployed on isolated Base-ID/Lasna-ID Anvil fixtures. Real fixture quote/deposit receipts feed the V4 subscriber, duplicate origin records produce no duplicate request, forged react calls and wrong callback routes/senders fail, actual indexed CRON receipts cause policy requests, authenticated fixture proxy delivery produces release/expiry receipts, and both admission and source queues close. Earlier V3 regressions are no longer the only local source-integration checks. This is not public protocol execution.

New plan:admission is strictly read-only: no signer, key handling, file writes, grants, opening of admission or broadcasts. It requires explicit six-field public V4 identity, verifies four compiled runtimes/versions/wiring, sponsor and ten active origin subscriptions, pins state/code/balance reads and rechecks observation block hashes. Freshness, network IDs, empty closed initial state, zero fee debt and known scheduler constants are mandatory. Current filter-index and gas-price reads are separately current, not falsely block-pinned. Missing/unknown data stops planning; insufficient funds return canGrant=false. Source balance and all customer principal are excluded.

The conditional stress model budgets the whole immutable lifetime allowance, including first confirmation/cancellation attempt resets and participant resets, rather than assuming one six-attempt batch. It includes bounded request/event/acknowledgement work, per-quote horizon/backoff, queue draining, double sampled cadence/prices, current coefficients/surcharges and a 15-minute delivery assumption. It is neither an expected charge nor guaranteed affordability under arbitrary delay/prices. Initial grants only; incremental grant execution/accounting is deliberately not implemented. A public observation fingerprint is an attestation reference, not a cross-chain reserve proof.

The collector is exercised against actual isolated V4 bytecode/wiring and funded fee fixtures. The local RNK-index adapter derives filters from the fixture's actual subscription storage; controlled fixture clocks are explicit. No local protocol adapter, token or cost is mislabelled as a public observation.

Validation: **7 focused checks passed; final full suite 141 passed, zero failures/skips/cancellations.** CLI with missing arguments safely refuses. Contract/frontend sources did not change in this checkpoint; the previous V4 size-checked build remains the applicable build, not a newly claimed deployment/build. Both frozen V3 creation fingerprint regressions pass.

Remaining: finalize concrete testnet admission/funding configuration; implement journalled grant execution with freshness/state recheck and nonce-safe recovery; implement separate V4 deployment/configuration/subscription verification; add V4 terms/interface admission/retry/refund-recovery support; then collect genuine new public evidence. Existing V3 journals, links, code and accepted public outcomes remain unchanged. Do not call the public uncapped deployment patched or deploy V4 using deploy:m2. M3 pending.

Judging: Execution — new V4 source/destination flow works locally; public V4 proof pending. Integration — actual source event/CRON scheduling drives authenticated fixture outcomes and capacity closure. Usefulness — funded-work admission is checked without exposing principal. Craft — fail-closed observation/model checks, reproducible tests and explicit limits. No wallet action requested now.


## M2 V4 backend operations and recovery — 23 November 2026

**COMPLETE — LOCAL versioned deployment, capped initial funding and initial grant/open execution. NOT PUBLICLY DEPLOYED; M2 NOT ACCEPTED.** [Operator guide](../docs/V4_OPERATIONS.md) describes exact scope, command order, proposed configuration, frozen intents and limits.

New V4 commands plan/deploy/verify/status use only testnet-v4.json and .deploy-v4.lock. They freeze source/settings, preserve unsigned intent/hash before broadcast, verify compiled creation/runtime, constructor funding, owner/limits/wiring/configuration, active filters, scheduler and ETH/USDC custody. An index failure after successful creation/configuration blocks verification but does not discard those transactions; resuming reuses their hashes. Existing M1/M2 journals, source and public addresses remain unchanged.

Initial funding uses explicit source/destination value caps and separately saved SYSTEM/PROXY depositTo intents for the new fee accounts. No implicit funding or duplicated top-up. Initial grant execution stores its public funding observation/reference/proposal/expiry, rechecks freshness/funding before an unknown broadcast, and retains the same intent on recovery. Admission opening is a separate owner transaction that verifies the mined grant, unused/unexpired reserved batch and renewed lifetime budget. It never mints additional credits. Failed/stale/expired cycles stop for review; these commands do not silently renew a grant or replace a nonce.

The review corrected a real identity-validation edge case: source and destination contracts can have the same hexadecimal address on different chains. The planner now requires distinct Base identities but allows that cross-chain equality; the integrated fixture actually deploys that case. Artifact ABIs are cached within each operational process to avoid repeated compilation; source fingerprints still freeze in the journal and are rebuilt in each fresh CLI process.

config/v4-testnet.example.json is a **proposal for review**, not a deployed/approved production limit: six reserved/active slots, six lifetime quotes, 900-second cutoff horizon, one shared participant retry with 60-second cooldown, and seed constructor balances of 0.1 test REACT/0.001 test ETH. Seeds do not establish whole-lifetime funding. The proposed allowance permits a small set of sequential ETH/USDC verification journeys; actual prices and suitable limits still need user WSL review before public deployment. No old reserves or principal are migrated.

Actual checks: **final full suite 144 passed, zero failures/skips/cancellations.** New tests exercise preparation interruption, one-time recovery, wrong network/occupied nonce refusal, explicit setting/secret/path rejection, unavailable-index deployment recovery, capped fee deposits, original hash/nonce preservation, edited constructor-funding rejection, corrupt grant-reference rejection, expired-window opening refusal, separate open/grant reruns, legacy journal preservation and no key persistence. Temporary local clock tests were corrected to follow advancing fixture chains; production freshness guards were not relaxed. These are isolated EVM/protocol/index fixtures, never public V4 execution evidence.

Manual negative CLI checks: missing V4 status reports no journal, plan without config refuses, grant without local key refuses. None creates a deployment or sends a transaction. No contract/frontend source changed in this checkpoint, so prior compiled V4 bytecode/size checks remain applicable; no fresh frontend build or public deployment is claimed. Both V3 fingerprint regressions pass.

Judging: Execution — actual local deployment/funding/grant operations and recoveries pass; genuine public V4 evidence still pending. Integration — full backend prerequisite chain supports meaningful Reactive scheduling without paying fees from principal. Usefulness — prevents duplicate spending and opening unfunded/expired initial sponsorship. Craft — version-isolated recovery, capped values, explicit proposal and reproducible tests. Next: V4 functional terms/interface/admission/refund-recovery integration, then read-only user settings/cost review and bounded public verification. M3 remains pending.


## M2 V4 functional interface — 23 November 2026

**IMPLEMENTED / BUILD AND CONTRACT-BACKED HELPER TESTS PASS / BROWSER AND PUBLIC V4 JOURNEYS PENDING. M2 NOT ACCEPTED.** [Interface acceptance and exact browser blocker](../docs/V4_INTERFACE.md).

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

**COMPLETE within scope: admitted ETH deposit, Reactive confirmation, CRON-triggered automatic merchant release, exact principal deltas and both queues closed. M2 remains OPEN.** Evidence: [public receipt bundle](https://github.com/0xaje/Settlio/blob/main/deployments/evidence/v4/quote-1-release-verified.json), [browser provenance](https://github.com/0xaje/Settlio/blob/main/deployments/evidence/v4/quote-1-browser-evidence.json), [reproduction guide](https://github.com/0xaje/Settlio/blob/main/docs/V4_ETH_RELEASE.md).

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

New [next-grant tooling](https://github.com/0xaje/Settlio/blob/main/script/v4-next-grant.cjs) and [operator instructions](https://github.com/0xaje/Settlio/blob/main/docs/V4_NEXT_QUOTE.md) implement one explicit one-hour merchant credit for quote 2. Unlike expired unused allowance renewal, this requires the previous one-hour credit consumed, the sole admitted quote terminal with zero liabilities, its admission job closed AND its Reactive job closed, no active/reserved work, idle unpaused source, and the confirmed original one-hour grant transaction matching its saved public proposal. This prevents reducing the budget while a previous job still needs source work. Original funding/grant/open/renewal/window records remain unchanged.

Funding budgets all five remaining immutable lifetime admissions, not just the next single credit. A projection of the verified empty remaining capacity is passed to the existing stress model; maxLifetimeAdmissions on chain remains six, admitted remains one and spent lifetime allowance never regenerates. The raw observation, closure proof, explicit proposal and projected model reference are bound into the sponsor attestation. No general incremental grants, repeated quote-2 credits, further-cycle automation or implicit top-up is authorized. New nextQuoteGrant plan and grantNextQuote stage use the existing lock/saved-intent/nonce recovery. Fresh funding/state are reread before unknown broadcast; stale plans, conflicting/nonterminal state, unknown or insufficient funding and wrong sponsor block execution.

Independent public remaining-budget observation collected through the actual JS observer with a temporary Python HTTP transport: [snapshot](https://github.com/0xaje/Settlio/blob/main/deployments/evidence/v4/next-quote-budget-observation.json). Model required 205.6 test REACT versus 248.8223677 prepaid reserves, and 0.00185328 Base test ETH versus 0.0022222302696 callback funds; canGrant=true. These are recorded conditional observations, not a new signing plan, journal verification, expected actual fees or future delivery guarantee. All customer principal is excluded. User plan:next:v4 must freshly verify its own journal and actual prior grant before signing. The previous strict single-quote release verifier can legitimately stop passing its *current reserved=0* assertion once this next credit is issued; archived accepted historical quote-1 proof remains valid. Do not erase evidence or relax it to hide later state.

Validation: full npm test passed: 158 tests, zero failures/skips/cancellations; syntax check passed for next-grant script. No new public grant or USDC transaction was sent. Initial focused run 5/6 passed: the absent quote correctly triggered an earlier refusal than the test expected. The refusal-message matcher was corrected without weakening guards; repeated focused run 6/6 passed. The actual isolated two-chain fixture consumes one credit, refuses while active, expires the unpaid quote through an explicitly impersonated local callback, refuses before source acknowledgement, forwards the genuine local terminal receipt to the real Reactive contract, then grants once and recovers the same hash/nonce on repeat while preserving prior window history. This is local fixture evidence, not a public expiry or quote-2 result. Pure model tests cover all remaining admissions, no lifetime reset, stale/unknown/busy states, unacknowledged source and insufficient reserves. No contract/frontend source change, new build or public transaction is claimed.

Judging: Execution — accepted public V4 ETH trace and user reproduction retained; USDC pending. Integration — next admission depends on completed destination/source accounting and meaningful automation funding. Usefulness — one-hour workflow avoids the expired ten-minute trap, without replenishing consumed lifetime capacity. Craft — public read-only model observation, separate saved intent, refusal/idempotency checks and explicit provenance. Next: user read-only plan, then one signed credit when ready, then fresh USDC quote/approval/deposit/Reactive/policy evidence. Other M2 acceptance items and M3 remain open.

## 25 November 2026 — V4 quote 2 USDC release and approval correction

**Verified checkpoint; M2 remains OPEN.** The merchant's quote-2 grant succeeded in the user's WSL session (`0x586b1067459f8eb051b2fb68993a48c51ccf072255e3fa9637eafca86c8fd9b1`). Public quote 2 then received exactly 1 USDC, obtained an authenticated Reactive confirmation, and released exactly 1 USDC to its merchant after the refund cutoff. The admission slot and source job closed; both asset balances/liabilities and active/reserved work were zero at the archived observation. Lifetime admissions are now two of six; consumed slots do not regenerate.

Full receipts, transactions, block bindings, historical allowance reads and transfer/accounting checks are in [the quote-2 evidence bundle](https://github.com/0xaje/Settlio/blob/main/deployments/evidence/v4/quote-2-release-verified.json); the trace, commands and limits are in [V4_USDC_RELEASE.md](https://github.com/0xaje/Settlio/blob/main/docs/V4_USDC_RELEASE.md). Public collection observed at 2026-11-25T08:45:39.681Z used the actual JavaScript collector with a Python HTTP transport because this executor's direct Node RPC was unreliable. Recorded replay passed. Fresh normal ethers CLI reproduction in the user's WSL is still pending.

The two approval receipts each set the same escrow allowance to 1,000,000 units; neither transferred USDC. The second replaced the first allowance, and the single deposit consumed it to zero. Source review found that polling reset displayed allowance to zero while a read was pending, and the send handler trusted that cached value. The correction keeps unknown allowance distinct from zero, binds it to wallet/token/spender, exposes read errors with retry, and checks fresh allowance immediately before approval. Sufficient allowance sends no approval and does not automatically pay. This is a demonstrated code weakness; the exact cause of the user's historical second click was not recorded.

Recording review shows Released while the USDC page was still open, followed by navigation and reopening. It supports automatic UI update and reopening, **not browser closure before release**. Metadata is archived separately; raw video was not uploaded. Matching request/delivery evidence still does not uniquely attribute protocol return reports or guarantee latency/future funding.

Judging: Execution has genuine USDC deposit/confirmation/release receipts; Integration uses Reactive confirmation and CRON release meaningfully; Usefulness covers one payment without duplicate principal transfer; Craft improves approval handling and reproducible evidence, with browser-extension/mobile retesting still pending. V4 refund, expiry/recovery/admission acceptance and remaining M2 gates stay open. No new contract deployment, funding, credit, payment or future grant was sent by this checkpoint.

Validation for this checkpoint: `npm test` passed 165/165, with zero failed, skipped or cancelled; `npm run build:web` passed TypeScript and Vite production build. Existing >500 kB bundle warning remains. Focused approval tests passed 3/3 and V4 ETH/USDC evidence tests passed 10/10; these are included in the full count. No browser-extension/mobile retest is claimed.

## 25 November 2026 — USDC WSL reproduction complete; next V4 refund gate

**COMPLETE: fresh V4 quote-2 USDC CLI reproduction.** User Ubuntu-22.04 output for `npm run verify:release:v4 -- 2` at 2026-11-25T08:54:41.984Z reports Released, exactly 1,000,000 USDC units, cleared balance/liability, closed admission slot and idle scheduler. [Terminal provenance](https://github.com/0xaje/Settlio/blob/main/deployments/evidence/v4/quote-2-wsl-verification.json) is user-supplied; its regenerated local snapshot bytes were not substituted for the independently collected public bundle. This supersedes earlier WSL-pending notes, without changing browser/return-report limits.

**Next component: controlled V4 ETH cancellation/refund, still OPEN for live execution.** New `plan:refund:v4` / `grant:refund:v4` prepare one separate quote-3 credit. Both earlier quotes must be terminal and closed on destination and source, prior quote-2 grant consumed with matching confirmed receipt/calldata, custody and liabilities empty, no active/reserved work, and scheduler idle/unpaused. Fresh remaining-lifetime funding covers all four unconsumed admissions; no lifetime reset or automatic top-up. Separate `refundQuoteGrant` plan and `grantRefundQuote` saved operation preserve all previous history and recover the identical intent/hash on reruns. Only the explicit quote-2/quote-3 stages are supported; no general rolling grants or later credits. No contract bytecode, frontend or immutable limits change.

[Refund procedure and acceptance](https://github.com/0xaje/Settlio/blob/main/docs/V4_REFUND_TEST.md) requires the designated customer to cancel strictly before cutoff, actual same-asset refund, authenticated callback evidence, exact custody and both-chain completion. Earlier V3 ETH/USDC refund/expiry/recovery outcomes remain V3 evidence. V4 refund/expiry/recovery, admission refusal/limits, browser approval-fix/mobile journeys and final M2 item-by-item review remain open. No public grant, payment, refund, funding or deployment was sent in this preparation.

Official [economy](https://dev.reactive.network/economy) and [callback authentication](https://dev.reactive.network/callback-contracts) documentation rechecked: operational funding is separate on both chains and both callback guards remain necessary; deployed authentication was not changed. Judging: Execution retains genuine accepted V4 ETH/USDC release traces and fresh user reproduction; this refund preparation is local evidence only. Integration checks both-chain terminal acknowledgement before further sponsored automation. Usefulness adds the missing customer cancellation route on the actual V4 deployment. Craft preserves immutable lifetime consumption, saved-intent recovery and explicit incomplete gates. M2 is NOT accepted; M3 has not started.

Validation: full `npm test` passed 166/166 with zero failed/skipped/cancelled. Focused next-grant/actual two-chain operational tests passed 7/7; they execute a separate quote-3 grant, refuse outstanding work and missing source closure, recover the same hash without a second nonce, preserve quote-2/window history, reject another signer and edited plans, and budget the remaining lifetime rather than resetting it. Callback impersonation and protocol/filter fixtures are explicitly local; no public refund/grant proof is claimed. JavaScript syntax checks passed. No contract/frontend source changed in this checkpoint, so no new web build is claimed.

## 25 November 2026 — V4 quote 3 ETH refund verified

**COMPLETE within on-chain scope: quote-3 admitted ETH payment, authenticated confirmation, eligible customer cancellation, exact same-asset refund, cleared custody and both-chain closure. M2 remains OPEN.** The public [bundle](https://github.com/0xaje/Settlio/blob/main/deployments/evidence/v4/quote-3-refund-verified.json) and [read-only reproduction guide](https://github.com/0xaje/Settlio/blob/main/docs/V4_ETH_REFUND.md) preserve the trace. Collection observed at 2026-11-25T09:35:45.181Z used the actual JavaScript collector with a temporary Python HTTP transport; normal ethers CLI reproduction in the user's WSL is pending.

Grant `0xac55f94d6ad0a08058aa9211e93a14af58e721d22de26044b4903c7b3dae1fe7` matches the one consumed reservation/reference and sponsor calldata. Creation `0xc842c94e1036a3d1190108b7c9205c1986035129a64e6b63231261cac7bd31a2` explicitly enables automatic release. Deposit `0x05a8c90f18505a83a6409d0d60202e8b33f40737bd9970e7c70d23966a6de77c` records exactly 100000000000000 wei from the designated customer before expiry. Real deposit reaction `0xf3114a704f13dbbb9743bcbdad1fa179d6450ac063fa50423b9e146679765d5f` matches the deposit log fingerprint; authenticated confirmation callback `0x8681c10cea33fa36c0a906cc9195590d9fa3f71b8030296f8a624bb051c94422` confirms quote 3.

Customer cancellation `0x97a4980d213b96e5cd9e3c354d70062bd1fa025e0efafbbe6f288d0729f3fa6c` occurred at 10:26:33 WAT, before the 10:33 cutoff. Genuine indexed CRON `0xaf8ec945edeedd33a19d8477c79ec0762da5f8a54086d33802e13fd8d39cb2f5` is the source of matching policy reaction `0x672674d8c0f7c239e44491b857d610c723fbe69121c3e90208478d5d9daee8c3`. Proxy delivery `0xe97dbaef558927bfed00690711838bb7c2ad543af241be46b796334fd4bab2f8` refunded exactly 0.0001 ETH at 10:27:53 WAT. Exact refund-block customer increase and escrow decrease match principal; ETH and USDC balances/liabilities are zero. Admission job closed, active/reserved zero, lifetime admitted three of six; source job closed, active jobs zero, CRON false, scheduler unpaused. These observations do not replenish finite lifetime capacity.

New `verify:refund:v4` fixes the deployed V4 identity and quote-3/ETH scope, reuses the existing refund trace validator without changing its V3 CLI, and additionally checks versions, admission binding/events/counters, the grant receipt/reference, release consent, zero custody and source idle state. It is read-only, preserves a prior successful snapshot when validation fails, and supports explicit recorded replay. No browser-closed evidence was supplied; unique protocol return-report attribution is not established. Strict block balance deltas do not tolerate unrelated same-block account activity. No universal timing, service-delivery or future-funding claim.

Judging: Execution has genuine origin, confirmation, CRON/request and exact refund receipts; Integration uses meaningful Reactive observations and authenticated delivery, with terminal acknowledgement on both chains; Usefulness returns the eligible customer's deposit without merchant withdrawal; Craft adds reproducible scoped proof, failure tests and accurate provenance. V4 USDC refund, unpaid expiry/recovery, admission/journey review, approval-fix browser/mobile retest and final M2 acceptance remain open. No new deployment, funding, credit, payment or retry was sent by this verification work.

Validation: full `npm test` passed 173/173, zero failed/skipped/cancelled; focused existing/V4 refund evidence tests passed 19/19, and `npm run verify:refund:v4 -- --recorded` passed. Initial collection stopped at a verifier ABI mismatch (`setGrant` credits were declared uint256 instead of the deployed uint32); corrected before successful validation/snapshot creation. This was a verifier error, not a failed public transaction. All refund authentication/delta checks and V4 admission/closure guards passed after correction. Neither contracts nor frontend changed, so no additional web build is claimed. Fresh user WSL CLI reproduction remains pending.

## 25 November 2026 — ETH refund user reproduction complete; USDC refund preparation

**COMPLETE: fresh V4 ETH refund user CLI reproduction.** Ubuntu-22.04 `npm run verify:refund:v4` passed at 2026-11-25T09:39:22.125Z: quote 3 Refunded, exactly 100000000000000 wei, zero balance/liability, admission slot closed, source idle and automatic-release consent present. [User-terminal record](https://github.com/0xaje/Settlio/blob/main/deployments/evidence/v4/quote-3-wsl-verification.json) is separate from the independently collected public bundle; regenerated local snapshot bytes were not supplied or substituted. This supersedes earlier reproduction-pending notes, without claiming browser closure or unique protocol return-report attribution.

New `plan:usdc-refund:v4` and `grant:usdc-refund:v4` prepare one explicit quote-4 merchant credit for the next USDC refund journey. The confirmed quote-3 grant receipt/calldata must match its saved plan and be consumed; quotes 1, 2 and 3 must be terminal and closed on destination AND source; all custody/liabilities and active/reserved jobs must be zero, source idle/unpaused, current subscriptions/wiring verified, and fresh conditional remaining-lifetime funding sufficient. The model budgets all three remaining immutable lifetime admissions, not just the next credit. The six-admission limit never resets. Separate `usdcRefundQuoteGrant` plan / `grantUsdcRefundQuote` operation preserve earlier history and recover the same saved hash/nonce, with no automatic top-up, recurring credit, deployment, quote or payment.

[USDC refund procedure](https://github.com/0xaje/Settlio/blob/main/docs/V4_USDC_REFUND_TEST.md) requires selecting issuer USDC, an exact 1 USDC deposit and original-customer refund, actual cancellation/callback evidence and both-chain completion. The credit itself is asset-agnostic; correct USDC selection must be verified from the actual deposit. Approval is separate from payment, and sufficient existing allowance need not produce another approval receipt. No quote-4 public grant/deposit/refund is claimed yet. This is a bounded preparation component within M2; V4 USDC refund, unpaid expiry/recovery, admission/journey review and browser/mobile acceptance remain open. No quote-5 or later credit is supported here.

Judging: Execution retains accepted V4 ETH refund and release traces plus fresh user CLI reproduction; the new grant stage is currently local-test evidence. Integration requires completed cross-chain automation accounting before more sponsored work. Usefulness prepares the same customer cancellation protection for USDC. Craft preserves finite capacity, original intents and refusal/replay checks with clear operator instructions. Contracts, frontend and immutable limits are unchanged; M2 remains OPEN and M3 has not started.

Validation: full `npm test` passed 174/174 with zero failed/skipped/cancelled; focused remaining-model and actual two-chain operational checks passed 8/8. The extended fixture consumes/closes a third quote, refuses before source acknowledgement or while work is active, verifies the separate quote-4 plan/grant, rejects another signer and edited plans, repeats the same grant without another nonce, preserves all prior intents and checks successful operation status. Earlier closures must be complete, ordered and distinct; stale observations and insufficient reserves block readiness. These are isolated fixtures with explicit local callback impersonation, not public quote-4 transactions. Syntax checks passed. No contract/frontend source changed; no new web build claimed.

## 25 November 2026 — V4 quote 4 USDC refund verified

**COMPLETE within on-chain scope: admitted USDC deposit, authenticated confirmation, eligible cancellation, exact same-asset refund and both-chain closure. M2 remains OPEN.** The [public bundle](https://github.com/0xaje/Settlio/blob/main/deployments/evidence/v4/quote-4-refund-verified.json) and [reproduction guide](https://github.com/0xaje/Settlio/blob/main/docs/V4_USDC_REFUND.md) preserve this trace. Source collection observed at 2026-11-25T10:05:03.353Z used the actual JavaScript collector with temporary Python HTTP transport; recorded replay passed. Fresh normal ethers CLI reproduction in the user's WSL remains pending.

Merchant credit `0xd083d363fd6cdfe40c187483f7b5d53e4c9656b14afc3169a1d2a719623dd205` matches the consumed admission reference, successful sponsor grant calldata and the one-hour eligibility window. Creation `0xdf474974bab7427efe7db3dc4d774f7f0fe78f59ca9ce01c130c91fa763f89a6` opts into automatic release. Approval `0x5b33a769f3969dda1df59fac02ba012f02cec5c54427ccb37035f2b3023a1a01` sets exactly 1 USDC for the correct escrow and has no USDC transfer. Deposit `0x45d1ec116a5589e05c19fcb60e3fc7cdb43793962be4c564ee29825d47921213` selects USDC option 1 and transfers exactly 1000000 units from the designated customer. Actual deposit reaction `0xc82350b3056adcd4ef5a449bb7692dfb162a7393033815f4316749b6637fd913` matches its log fingerprint; authenticated confirmation callback `0x4566532304188e5689a86ab2a37f4b8a1ef5f99d42ace62d2fcc2262a5233de3` confirms quote 4.

Cancellation `0x7d10c2c23838bee56bb8becb2558ffacf4ed96f7bbb160da614e842f5ac0514d` at 11:00:14 WAT precedes the 11:09 refund cutoff. Genuine indexed CRON `0x64ee9e8eb784446cf8c0ff5041e377260c56944b53a6540116ebada9921359fe` feeds matching refund reaction `0x77a59afba07fdca0115eef2c961c3b23f0eecfaa13ba047413c1961902e83507`. Authenticated proxy callback `0x47f31f9fee141a75042e6da7aac9e3ab98f7ee2c6a67b89b713f31081c4a8c11` refunds exactly 1 USDC at 11:00:24 WAT. Token Transfer and exact customer/escrow refund-block balance deltas agree. Both assets' custody/liabilities clear; admission slot closed, active/reserved zero, admitted/quoteCount four; source job closed, jobs zero, CRON false and scheduler unpaused. Four lifetime admissions are consumed; two remain and never regenerate.

The existing V4 refund wrapper now supports explicit quote IDs 3 (ETH) and 4 (USDC), retaining default quote-3 CLI and historical replay compatibility. Fixed deployed identities, per-quote expected asset/amount, admission events/counters, source closure and grant binding remain mandatory. Quote 4 additionally checks its approval block/order, no approval-token transfer and agreement of token custody reads. V3 refund validation and CLI remain unchanged. No browser video was supplied for this refund; no continuous closure, exhaustive approval/mobile UI coverage or unique protocol return-report mapping is claimed. This refund occurred before cutoff; delayed-after-cutoff safety retains its separate test provenance.

Judging: Execution gains genuine USDC deposit/confirmation/cancellation/CRON/refund evidence and exact accounting; Integration uses the real Reactive route and terminal acknowledgement; Usefulness returns the eligible customer's original asset and amount; Craft adds scoped replay/refusal tests, reproduction and candid limits. V4 unpaid expiry/recovery, admission/journey review, browser/mobile and final M2 item-by-item acceptance remain open. No new deployment, funding, credit, payment, cancellation or retry was sent by this verification work.

Validation: full `npm test` passed 181/181 with zero failed/skipped/cancelled. Focused V3/V4 ETH/USDC refund evidence checks passed 26/26; `npm run verify:refund:v4 -- 4 --recorded` passed and syntax check passed. New refusal checks cover altered approval amount/block/order, missing deposit/refund transfers, incorrect token deltas/custody, wrong grant/counters/admission closure, forged callback/CRON route, open source work, late cancellation and changed opt-in. These replay genuine archived receipts and are not additional live transactions. Neither contracts nor frontend changed, so no new web build is claimed. Fresh user WSL quote-4 reproduction is still pending.

## 25 November 2026 — USDC refund user reproduction complete; unpaid-expiry preparation

**COMPLETE: fresh V4 quote-4 USDC refund user CLI reproduction.** Ubuntu-22.04 `npm run verify:refund:v4 -- 4` passed at 2026-11-25T10:08:50.256Z: exactly 1000000 USDC units Refunded, cleared balance/liability, admission slot closed and scheduler idle. [Terminal provenance](https://github.com/0xaje/Settlio/blob/main/deployments/evidence/v4/quote-4-wsl-verification.json) is user-supplied; its regenerated local bundle was not substituted for the independently collected public proof. Earlier WSL-pending notes are superseded, while browser-closure and return-report limits remain.

Next is **V4 unpaid automatic expiry**, still OPEN for live acceptance. New `plan:expiry:v4` / `grant:expiry:v4` implement one explicit quote-5 merchant credit only after all four earlier quotes are terminal and closed on destination/source, the confirmed quote-4 grant is consumed/matches its original calldata, custody/liabilities and active/reserved work are zero, and current wiring/subscriptions, idle/unpaused scheduler and fresh sufficient funding are verified. Funding covers both remaining immutable lifetime admissions; spent slots do not regenerate. A separate `expiryQuoteGrant` plan / `grantExpiryQuote` saved operation retains all earlier history and uses the existing identical-intent/hash/nonce recovery. No automatic funding, deployment, quote/payment or general later credit is created.

[Unpaid expiry procedure and acceptance](https://github.com/0xaje/Settlio/blob/main/docs/V4_EXPIRY_TEST.md) explicitly forbids deposit, approval, cancellation, claim or participant retry in the normal unattended test. Fresh short deadlines and a recording of creation/closure/wait/reopening are planned, not yet observed. A clock-derived Expired label is not proof; real CRON/request/authenticated destination expiry and both-chain completion are required. Manual retry, if later needed, must be labelled recovery rather than untouched unattended success. No public quote-5 grant/creation/expiry or browser-closed result is claimed by this preparation.

The stage mapping is now explicit for reviewed quotes 2 through 5; unsupported later stages fail. Contracts, frontend and immutable six-lifetime/900-second/retry limits are unchanged. M2 remains OPEN for live V4 expiry/recovery, remaining admission/journey review and browser/mobile acceptance; M3 has not started. Judging: Execution retains accepted live ETH/USDC refund/release traces and fresh user CLI reproductions; the new credit stage has local evidence only. Integration gates further work on both-chain terminal accounting. Usefulness closes unpaid offers without merchant action. Craft adds bounded saved intent/replay/refusal coverage and an honest browser-evidence procedure. No public transaction or customer-fund movement was sent by this preparation.

Validation: full `npm test` passed 182/182 with zero failed/skipped/cancelled; focused model/actual two-chain operational checks passed 9/9. The extended fixture consumes/closes four quotes, refuses pending destination/source work, verifies the separate fifth-credit plan and operation, rejects another signer and edited plan, recovers the same hash without another nonce, preserves all earlier grant records and verifies operation status. Model checks cover both remaining slots, complete ordered prior closures, stale/insufficient observations and unsupported later stages. Local impersonated callbacks and subscription fixtures are not public expiry evidence. Syntax checks passed. No contract/frontend source changed; no new web build claimed.

## 25 November 2026 — V4 quote 5 unpaid expiry verified

**COMPLETE within on-chain scope; M2 remains OPEN.** [Public proof](https://github.com/0xaje/Settlio/blob/main/deployments/evidence/v4/quote-5-expiry-verified.json), [guide](https://github.com/0xaje/Settlio/blob/main/docs/V4_UNPAID_EXPIRY.md) and [browser metadata](https://github.com/0xaje/Settlio/blob/main/deployments/evidence/v4/quote-5-browser-evidence.json) retain distinct chain/browser provenance. Collection observed at 2026-11-25T11:14:23.526Z used the actual JS collector with temporary Python HTTP transport; recorded replay passed. Fresh normal user WSL reproduction remains pending.

Grant `0xad31dc37dda52adc0e65e0bc0622e8a0f8823a21ef3150716591fd4361e0c470` matches the consumed one-credit admission reference. Creation `0xe543824cf95ec195efc92a93ba6272cbe37cc2e2577c2b1205e2a3f2a23e8cb3` at 12:01:46 WAT sets payment deadline 12:03 and cutoff 12:08, with merchant-release opt-in false. The original policy fingerprint is processed. Genuine indexed CRON `0x5a9359dc6952863c825777f06443e604ee7918008738491c75ea5a0b7d7db125` feeds request `0xdc5717617ee33a21c6c28f148a4b01c7a04e542a3253f7421f027839bcafc1cd` at 12:04:18. Authenticated proxy callback `0x5788d2770d4a9658ea71472df25a23da6079e881b0b4c5f163f1e92d2c9b17ad` emits QuoteExpired/terminal PolicyChecked at 12:04:20 WAT. Matching request/delivery is not unique protocol return-report attribution or a future latency guarantee.

The pinned quote history has no deposit, asset selection, confirmation, cancellation or participant retry. Admission job closed, active/reserved zero, quoteCount/admitted five; source registered/closed, nextAt zero, jobs zero, CRON false and scheduler unpaused. ETH and USDC custody/liabilities are zero. Five of six lifetime admissions are consumed; only one remains and does not regenerate. No customer principal moved.

New `verify:expiry:v4` fixes V4 identity/quote 5, shares the authentic CRON/request/delivery checks through an explicit version-4 identity parameter, and additionally verifies grant/admission, history, custody and terminal accounting. No legacy V3 journal is fabricated; the original V3 CLI retains strict default journal checks. Failed validation preserves the successful snapshot; recorded replay is explicit and is not a fresh network observation.

The 50.3333-second video (SHA-256 `f89a30731e325e47663e852bd3467e66df1cd2be72cc42e5737dccfe4477abd4`) was reviewed in five-second samples. Creation/quote/deadlines, quote-tab absence around 30 seconds and later reopening Expired with scheduler completion are observed. Qualified closure/reopening is recorded; continuous closure over the full wall-clock wait across the callback is not established. Raw video was not uploaded. RPC cannot prove browser actions; a clock-derived UI label alone was not used as expiry proof.

Validation: full `npm test` passed 190/190, zero failed/skipped/cancelled; focused historical/V4 expiry checks passed 16/16. Recorded CLI replay and syntax checks passed; replay was rechecked when finishing this checkpoint after interruption. Refusal checks cover failed/foreign receipts, altered CRON/proxy/sender payloads, unpaid/retry history contradictions, unclosed jobs/admission, nonzero custody/work, wrong grant/header identity, early expiry and altered policy terms. These replay archived real data, not additional public transactions. No contract/frontend changes or additional web build claimed.

Judging: Execution has real creation/CRON/request/authenticated expiry and source acknowledgement; Integration uses meaningful network scheduling without customer payment; Usefulness closes unpaid offers without a merchant expiry transaction; Craft provides reproducible scoped checks, refusal coverage and honest recording provenance. Controlled V4 recovery, remaining admission/journey review, browser/mobile and final M2 acceptance remain open; M3 has not started. No new deployment, funding, credit, payment, cancellation or retry was sent by this verification.

## 25 November 2026 — expiry reader compatibility and useful error reporting

User WSL `verify:expiry:v4` stopped with a generic read-only failure; no successful snapshot was written and no transaction was sent. **The exact underlying user RPC error remains unconfirmed.** Source inspection found one growing creation-to-current-head log request (45,827 blocks at diagnosis). The official Base endpoint returned HTTP 403 from this executor, while an alternate public RPC accepted that wide request. These observations do not establish that the user's provider rejected its block range or that on-chain expiry failed.

Grouped correction: quote history is read in contiguous pages of at most 1,000 blocks, four concurrent requests, through the same pinned observation head. Failed/non-array/out-of-page/duplicate responses and more than 1,000 pages fail closed; partial histories are not returned as successful proof. All identity, timestamp, callback, custody, no-deposit/retry and terminal-accounting checks remain unchanged. RPC errors now identify the network/method and safe error codes; provider URLs, raw errors and confidential values are not printed. The accepted historical bundle is preserved.

A fresh actual-JS collection using Python HTTP transport against an alternate public endpoint completed at 2026-11-25T13:38:07.182Z: 47 pages, maximum 1,000 blocks/page, four quote events, Expired, source idle and admission slot closed. [Diagnostic metadata](https://github.com/0xaje/Settlio/blob/main/deployments/evidence/v4/quote-5-history-read-check.json) is not a new public expiry execution or a substitute for user WSL reproduction. User retry remains pending; an endpoint outage or unsupported historical read can still stop safely.

Validation: full `npm test` passed 195/195, zero failed/skipped/cancelled. Focused pagination, sanitized errors and existing expiry evidence checks passed 21/21. Tests exercise fixed-head contiguous coverage, failed-page refusal, malformed/out-of-range/duplicate logs, bounded scan and non-disclosure of raw provider errors. Contracts, frontend, deployments, credits and principal are unchanged; no new web build claimed.

Judging: Execution retains the accepted authenticated quote-5 expiry, with local CLI reproduction still pending. Integration proof checks were preserved. Usefulness improves repeatable verification as the chain advances. Craft fixes growing history reads and the unhelpful diagnostic without masking a network failure or weakening acceptance. M2 remains OPEN; no new quote, retry, payment, funding or deployment is needed for this issue.

## 25 November 2026 — expiry user reproduction complete; final controlled-recovery preparation

**COMPLETE: fresh V4 unpaid-expiry user CLI reproduction.** `verify:expiry:v4` passed at 2026-11-25T13:44:12.937Z using PublicNode: quote 5 Expired, original CRON/request/authenticated callback, no deposit/participant retry observed, admission closed and source idle. [User-terminal provenance](https://github.com/0xaje/Settlio/blob/main/deployments/evidence/v4/quote-5-wsl-verification.json) remains separate from the independent public snapshot. The other endpoint failed eth_getLogs; its deeper transport/provider cause is not established. Earlier fresh-user-pending notes are superseded; browser/return-report limits remain.

One grouped [V4 recovery procedure](https://github.com/0xaje/Settlio/blob/main/docs/V4_CONTROLLED_RECOVERY.md) now includes final-credit planning/issuance plus status, controlled owner pause and saved restore. `plan:recovery:v4`/`grant:recovery:v4` require all five earlier quotes closed on both chains and budget the one remaining immutable admission. Separate recoveryQuoteGrant/grantRecoveryQuote preserve earlier intents. `pause:recovery:v4` requires five admissions, exactly one unused confirmed final credit with adequate time remaining, no jobs, unpaused source and zero custody/liabilities. `resume:recovery:v4` authenticates the saved owner pause and deliberately permits restoring queued work. Each owner action uses its own saved Lasna intent/hash; no automatic replacement, funding, extra credit or participant retry occurs. Old V3 recovery commands remain unchanged.

The sixth quote must remain unpaid. A single genuine participant retry while owner-paused, a pre-restore observation, owner restore, actual resumed request/callback and terminal acknowledgement are still required for **public V4 recovery acceptance**. Pause disables CRON only, not origin observations or all fees. This is a controlled owner action, not a fabricated protocol outage or untouched unattended success. Restore remains available if the operator stops or the unused credit expires. The sixth admission exhausts this deployment's immutable lifetime allowance; no seventh/rolling grant or reset is implemented.

Judging: Execution retains genuine ETH/USDC releases/refunds and unpaid expiry with user reproductions; new recovery tooling has isolated-test evidence only. Integration gates further work on completed cross-chain accounting and fresh automation funding. Usefulness provides a bounded delayed-automation recovery path. Craft groups the full flow, preserves original intents and makes restoration available while work is queued. Public recovery, remaining admission/journey/browser/mobile review and final test-deployment/demo availability acceptance remain OPEN. No contracts/frontend changes, deployment, funding, new credit, pause or restore was sent by this preparation; M3 has not started.

Validation for this grouped preparation: `npm test` passed 198/198, with zero failures, skips or cancellations. The focused operations/credit run passed 10/10, and the separate pause/network unit run passed 2/2. The two-chain recovery fixture explicitly uses local protocol/callback simulation and does not count as public recovery evidence. No contract or frontend source changed; no new web-build result is claimed.


## V4 quote 6 — controlled recovery public proof, 25 November 2026

Independent raw-RPC collection and the new `verify:recovery:v4` validator establish the final unpaid quote's controlled recovery. The [complete public bundle](../deployments/evidence/v4/quote-6-recovery-verified.json) records grant, owner pause, creation, a single consumed participant retry, owner restore, real network CRON, associated Reactive request, authenticated destination expiry and both-chain closure. The [user terminal observations](../deployments/evidence/v4/quote-6-user-observations.json) are separately labelled provenance; fresh user reproduction of the complete verifier remains pending. See [procedure and result](V4_CONTROLLED_RECOVERY.md).

Successful public hashes: grant `0x36c086ac6797e5c8c0eafcfa30ce95a1ee4d43442ea23411c1871896dbd7756f`; owner pause `0x0e2d517eb5315601012d9db7d0810e53f2b2b1da2b087c26fb12e80a67a07c4d`; creation `0x1ea3654d1081ad1593f0a14233a52896539d8a43728fabf64feb020aa5c8720e`; retry `0xf550fc2dbf043fb5664565f5e03b7444afc950a8da84036890ab5a32d12cf3cc`; owner restore `0x9113708fad9ad2e5ed405f1ec6b80f3d0b656c9909ca3508b3d847f270d9af6f`; CRON `0x4b127fc6fd7ee8c833765acd83430d104d60d5124b866536a3db645d80f290da`; associated reaction `0x2bb12c7d975ddffd62b1e7bdb7bd0ca0925d3604766a01b7f1a899f6144f47a5`; expiry callback `0x80e72e14b40270466409884920a052a5bd32ee1a686169745217532f16ba5773`.

The pinned Lasna block immediately before restore shows paused=true, CRON=false, one active job, zero request attempts, and the genuine PolicyRequested fingerprint already processed. Its block hash matches the restore block's parent. Retry occurred after the original payment deadline. Creation and retry have relayed top-level envelopes; source-matched escrow runtime at both historical blocks plus QuoteCreated/admission/PolicyRequested/RetryConsumed events establish the admitted merchant and authorized retry path. Exact internal merchant/customer retry caller attribution is not claimed; PublicNode debug_traceTransaction was unavailable. No direct merchant-to-escrow transaction is fabricated.

At the terminal checkpoint quote 6 is Expired, the admission and source job are closed, active/reserved/jobs are zero, the scheduler is unpaused, CRON is unsubscribed, and ETH/USDC custody and liabilities are zero. Six of six immutable lifetime admissions are consumed. This is **controlled owner-pause recovery**, not evidence of a protocol outage, untouched unattended execution, browser closure, unique protocol return-report attribution, measured production funding, or future delivery. Earlier scoped proofs remain preserved. Final demo availability after exhaustion, remaining admission/journey/browser/mobile review and fresh user verifier reproduction remain open. **M2 remains OPEN; M3 has not started.**

Judging, equally weighted: Execution has genuine resumed CRON/request/authenticated expiry; Integration shows Reactive resumes queued work and closes it after destination acknowledgement; Usefulness demonstrates recovery without paying or exposing customer principal; Craft adds a read-only reproducible verifier, historical state binding and honest relayed-route limits. No deployment, funding, credit, pause/restore or other public transaction was sent by this evidence/documentation change.

Validation for this grouped evidence checkpoint: full `npm test` passed 204/204 with zero failures, skips or cancellations; the expiry/history/recovery focused run passed 19/19; the final recovery mutation tests passed 6/6, including historical runtime tampering checks. The normal `verify:recovery:v4 -- --recorded` CLI passed as explicit archived replay. Independent public collection used the actual JavaScript collector/validator with a Python HTTPS RPC transport in this workspace; a fresh native Node/Ubuntu CLI reproduction by the user is still pending. No contract/frontend source changed, and no new web build is claimed.

Provisional M2 checkpoint assessment (equal weight, 1–5; self-review, not an external judging result): Execution 4/5 and Integration 4/5 for genuine multi-asset policy outcomes and controlled recovery; Usefulness 3/5 for the demonstrated workflow without claimed customer adoption/validation; Craft 3/5 while complete browser/mobile journeys, remaining acceptance review, demo availability and submission deliverables are open. These scores do not close M2.


## V4 controlled recovery user reproduction COMPLETE — 25 November 2026

Fresh Ubuntu `npm run verify:recovery:v4` passed at **2026-11-25T15:10:26.840Z (16:10:26 WAT)** on source commit `400447d18a3b4b6c1cf4e58732b1eec7588bb130`, with PublicNode Base Sepolia, official Lasna RPC and the recorded IPv4 Node options. [User-result provenance](../deployments/evidence/v4/quote-6-user-observations.json) is separate from the independently collected quote-6 bundle. The result confirms processed retry before restore, authenticated Expired outcome, closed source/admission, idle unpaused scheduler, zero observed customer principal and six consumed lifetime admissions. The **scoped V4 controlled recovery item, including fresh user CLI reproduction, is COMPLETE**. Earlier reproduction-pending notes are historical and superseded.

Relayed internal-caller attribution, unique return-report mapping and browser-closure limits are unchanged; no protocol outage, untouched unattended execution or future-delivery guarantee is claimed. No new public transaction, deployment, funding or credit is needed for this verification. The immutable six-quote capacity is exhausted. **M2 remains OPEN** for final admission/journey review, actual browser/mobile and approval usability checks, and the demo/deployment availability decision; M3 has not started. This update changes evidence/acceptance documentation only. The prior implementation checkpoint's 204/204 tests remain its recorded result; no new test run or build is claimed here. The four-criterion self-assessment remains unchanged pending those reviews.


## M2 permission/admission/journey code review — 25 November 2026

The [item-by-item final review](M2_FINAL_REVIEW.md) maps V4 actor/callback authentication, timestamp boundaries, exact custody, cancellation priority, repeated/delayed delivery, finite admission, bounded scheduling and reserved-refund recovery to current source and explicit V4 tests. The custody, escrow-permission, destination-policy and scheduler suites now instantiate both V3 and V4 rather than treating V3 coverage as V4 evidence. V4 fixtures open admission and reserve finite test credits; they remain isolated fixtures and are not new public transactions. The six genuine public outcomes and fresh user reproductions remain preserved.

A concrete frontend defect was fixed: complete original share-link terms now load when browser local storage is denied. A present malformed/empty fragment cannot silently fall back to cached terms, and changed terms remain rejected by the on-chain fingerprint check. There is no contract, ABI/interface, deployed-address, funding, quote or transaction change. A real wallet/browser connection was unavailable in this session, so browser/mobile visual checks and a fresh full approval/payment retest remain OPEN. The [safe next read-only checklist](M2_FINAL_REVIEW.md) checks the exhausted-capacity message, disabled creation and terminal quote display without consuming or signing anything.

COMPLETE here means the scoped source/V4 regression review and code repair, not all M2 acceptance. The six-admission test deployment remains exhausted; demo/live-try-out capacity and final demonstrated browser acceptance need separate review. Current callback/authentication/funding assumptions were checked against official Omni primary documentation and recorded in the review. **M2 remains OPEN; M3 has not started.** Four equally weighted self-review scores remain Execution 4/5, Integration 4/5, Usefulness 3/5 and Craft 3/5 while the real browser/demo gates are unresolved. No external audit or adoption is claimed.

Validation for this review: `npm run build:contracts`, `npm run build:admission` and `npm run build:web` passed. The final `npm test` passed **245/245** with zero failures, skips or cancellations (148130 ms). Focused versioned custody/permissions checks passed 38/38, focused policy/scheduler checks passed 38/38, and terms/share-link checks passed 10/10. These counts include isolated fixtures; they do not add live transactions to the public evidence. The web bundle warning remains approximately 540 kB minified / 178 kB gzip. No current real-wallet/mobile visual pass is claimed.


## Desktop capacity browser check COMPLETE — 25 November 2026

Reviewed the user's 13.568-second, 1920×1020 recording at localhost:5174. The Create quote screen visibly reports lifetime usage **6 of 6**, active bookings **0 of 6**, zero remaining sponsored credits, and “This test deployment has used its quote allowance.” Scrolling to the form bottom shows the disabled Create share link control and unavailable pointer. [Media provenance and SHA-256](../deployments/evidence/v4/desktop-capacity-browser-evidence.json) record the review; raw video is not committed. This is the requested desktop capacity-state observation, not a new transaction. Fields are blank, so no filled-form rejection was demonstrated. The wallet address, build commit and configured escrow are not visible in the clip; deployment context comes from the preceding launch configuration and separate RPC evidence.

This completes only that desktop visual item. Terminal quote-6 display, mobile/narrow-screen review, actual approval/payment retesting and demonstration availability remain OPEN. No signature, new quote, funding or deployment is required for the next read-only terminal-screen check. M2 remains OPEN and M3 has not started. No code changed and no additional test/build run is claimed; the previous 245/245 result remains its dated checkpoint evidence.


## Quote-6 terminal and emulated-mobile visual review — 25 November 2026

The user's full terminal screenshot and 24.333-second Chrome recording confirm quote 6 displays Expired and blocks payment, without payment/approval/policy-retry controls. The recording explicitly shows a **390 × 644 emulated viewport**, readable quote cards and navigation, wrapped title/addresses, stacked amount/terms sections, scheduler completion and expandable Contract details. No obvious horizontal clipping is visible in those screens. [Media provenance and SHA-256](../deployments/evidence/v4/quote-6-terminal-mobile-browser-evidence.json) preserve the scope; raw media is not committed. COMPLETE here means the observed desktop terminal-state and emulated narrow-screen rendering checks, not physical-mobile wallet operation or complete browser compatibility. Copy-link visibility is observed; successful clipboard copying is not demonstrated.

The recording exposed a minor text defect: the expired summary said “Deposit due today.” The frontend now says “Deposit amount” for expired, terminal or deadline-passed quotes; payment controls and contract enforcement are unchanged. A post-repair visual confirmation is pending. No contract, address, funding or public transaction changed.

The same recording shows a MetaMask global-provider assignment error matching [MetaMask's own provider-injection source](https://github.com/MetaMask/providers/blob/main/src/initializeInpageProvider.ts), plus content-script listener/orphaned-stream warnings. Another wallet extension is a likely provider-conflict cause, but the exact extension and attribution of every warning are unproven. Settlio source does not assign window.ethereum. The next safe diagnostic is to leave only the chosen Settlio wallet extension enabled, refresh the page and review fresh console output, as [MetaMask's connection guidance](https://support.metamask.com/more-web3/dapps/i-cant-connect-metamask-extension-to-a-dapp-/) recommends. Do not uninstall wallets, disclose keys, create another quote or repeat transactions for this check.

M2 remains OPEN for a clean wallet-environment reproduction, remaining approval/payment journey checks, post-repair wording confirmation, physical/mobile-browser scope where required and demo/deployment availability after six lifetime admissions. The console is not labelled error-free. M3 has not started; the four equally weighted self-review scores remain unchanged. This update records user media and changes one display label. The earlier 245/245 tests remain dated prior evidence; no new full test run is claimed for this text-only repair.

Validation of the display-label repair: fresh `npm run build:web` passed (TypeScript and Vite). The existing approximately 540 kB minified-bundle warning persists. No new full test run or public transaction was performed for this wording-only change.


## Handoff checkpoint validation — 25 November 2026

The six documented archived CLI commands were run successfully in explicit recorded/no-fresh-RPC mode: release quotes 1/2, refund quotes 3/4, expiry quote 5 and recovery quote 6. Outcomes were Released, Released, Refunded, Refunded, Expired and Expired. New README/current-status/handoff relative links were checked against repository paths; command names were checked against package.json. The complete previous README and M2 ledger text were preserved in their stated historical locations. No public RPC observation, transaction, build or new full regression run is claimed by these documentation checks.
