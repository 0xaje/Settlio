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
