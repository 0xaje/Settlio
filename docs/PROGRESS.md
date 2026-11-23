# Settlio progress

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
