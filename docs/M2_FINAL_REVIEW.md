# M2 final source and regression review

Reviewed 25 November 2026 against main `c6dba339178acd7798c8d393f8f5df3354c45a1c`, with the frontend repair and additional tests in this checkpoint. M2 is OPEN; M3 has not started. This is an item-by-item source/regression review, not an external security audit or a claim that every failure was reproduced on public networks.

## Acceptance conditions and evidence types

The code-review gate requires V4-specific checks for actor/callback authentication, exact principal accounting, deadlines, cancellation precedence, repeat/delayed callbacks, admission and retry bounds, and recovery without sponsored credits. A passing legacy V3 test alone cannot satisfy a V4 check. The same adversarial security suites now instantiate each version separately; V4 fixtures explicitly open admission and reserve finite test credits. These are isolated chains and fixture assets, not issuer USDC or public protocol transactions.

Public evidence remains the separate accepted V4 quote bundles: [ETH release](../deployments/evidence/v4/quote-1-release-verified.json), [USDC release](../deployments/evidence/v4/quote-2-release-verified.json), [ETH refund](../deployments/evidence/v4/quote-3-refund-verified.json), [USDC refund](../deployments/evidence/v4/quote-4-refund-verified.json), [unpaid expiry](../deployments/evidence/v4/quote-5-expiry-verified.json), and [controlled recovery](../deployments/evidence/v4/quote-6-recovery-verified.json). Their fresh user CLI reproductions are recorded separately. Public successful flows and local adversarial tests answer different questions.

## Reviewed invariants

All rows below mean COMPLETE for source review plus the linked isolated V4 regression coverage. They do not claim a new public failure transaction or that every possible attack has been ruled out.

| Invariant | Source | V4 checks / limits |
|---|---|---|
| Sponsor alone controls admission opening and credits | [Admission](../packages/contracts/admission/SettlioAdmission.sol) | [Admission tests](../test/admission.test.cjs): wrong sponsor and direct-consumer bypass rejected; closing admission preserves existing jobs |
| All three creation entry points require a grant; invalid creation rolls back reservation | [Escrow](../packages/contracts/admission/SettlioEscrowV4.sol) | [Integrated admission tests](../test/admission-escrow.test.cjs): closed/missing grant, malformed choices, exact accounting |
| Active/reserved/lifetime limits cannot be replenished by closing jobs or renewing unused credit | [Admission](../packages/contracts/admission/SettlioAdmission.sol) | [Admission tests](../test/admission.test.cjs), [operations](../test/v4-operations.test.cjs); live sixth consumption separately proven |
| Correct customer, exact native/token amount, selected option and accepted terms required | [Escrow](../packages/contracts/admission/SettlioEscrowV4.sol) | [Versioned custody tests](../test/assets.test.cjs), [versioned permissions](../test/escrow.test.cjs); approvals alone never change quote payment status |
| Token failure/fee deductions cannot create a false liability or short refund | [Escrow](../packages/contracts/admission/SettlioEscrowV4.sol) | [Versioned asset tests](../test/assets.test.cjs): false-return, fee-on-transfer and no-return tokens; independent asset liabilities; failed refund remains reserved |
| Repeat payment and token reentry cannot pay twice | [Escrow](../packages/contracts/admission/SettlioEscrowV4.sol) | [Versioned asset tests](../test/assets.test.cjs); the hostile fixture reentry is rejected, without claiming all token behaviours are covered |
| Payment is rejected at the exact expiry timestamp before any scheduled expiry callback | [Escrow](../packages/contracts/admission/SettlioEscrowV4.sol) | Native [permissions tests](../test/escrow.test.cjs) and token [asset tests](../test/assets.test.cjs), both V4 |
| Proxy and authorized Reactive sender are both required; direct forged callbacks rejected | [Receiver](../packages/contracts/admission/SettlioCallbackV4.sol) | [Versioned policy tests](../test/policy.test.cjs) and [two-chain V4 fixture](../test/admission-reactive.test.cjs); public callback payload/wiring authenticated separately |
| Timely customer cancellation reserves the refund and beats delayed confirmation or payout | [Escrow](../packages/contracts/admission/SettlioEscrowV4.sol) | [Versioned permissions](../test/escrow.test.cjs) and [policy tests](../test/policy.test.cjs); exact cutoff excludes new cancellation |
| Automatic release requires immutable customer consent, confirmation and cutoff | [Escrow](../packages/contracts/admission/SettlioEscrowV4.sol) | [Versioned policy tests](../test/policy.test.cjs): changed flag, early release and manual-policy auto-release rejected |
| Refunds/releases transfer once in the selected asset; failed transfer preserves status and liability | [Escrow](../packages/contracts/admission/SettlioEscrowV4.sol) | [Versioned assets](../test/assets.test.cjs), [policy tests](../test/policy.test.cjs), [V4 failed delivery](../test/admission-escrow.test.cjs) |
| Retry budget/cooldown are shared and cannot block eligible cancellation or reserved-refund recovery | [Admission](../packages/contracts/admission/SettlioAdmission.sol), [Escrow](../packages/contracts/admission/SettlioEscrowV4.sol) | [V4 admission escrow](../test/admission-escrow.test.cjs): wrong claim caller, exhausted retry, admission pause, direct customer claim, repeat claim and delayed callback |
| Reactive caller, origin, log shape and CRON are validated; duplicate logs do not request twice | [Reactive](../packages/contracts/admission/SettlioReactiveV4.sol) | [Versioned scheduler tests](../test/scheduler.test.cjs); fixture log construction is explicitly local, not live origin evidence |
| Reordered registration/confirmation/cancellation and no-op acknowledgements remain safe | [Reactive](../packages/contracts/admission/SettlioReactiveV4.sol) | [Versioned scheduler tests](../test/scheduler.test.cjs): delayed flags preserved, premature action backs off, manual confirmation stops charged work |
| Work scans/requests are bounded; one rejected request does not block another; exhausted attempts stop CRON billing | [Reactive](../packages/contracts/admission/SettlioReactiveV4.sol) | [Versioned scheduler tests](../test/scheduler.test.cjs): request isolation, round robin, max attempts, fresh bounded retry |
| Pause is owner-only and preserves jobs; restore can service queued work; only completion closes it | [Reactive](../packages/contracts/admission/SettlioReactiveV4.sol) | [Versioned scheduler](../test/scheduler.test.cjs), [operations fixture](../test/v4-operations.test.cjs) and genuine quote-6 public recovery |
| Customer principal has no fee-payment/admin withdrawal path | Escrow custody versus separate Receiver/Reactive payer contracts | Source review plus exact liability/failed payout tests. Current public zero balances are a checkpoint, not a future solvency guarantee |
| Terms and release consent are fingerprint-bound; network/account changes cannot authorize another context | [Terms](../apps/web/src/terms.ts), [Wallet](../apps/web/src/wallet.ts), [Approval](../apps/web/src/approval.ts) | [Terms](../test/terms.test.mjs), [wallet](../test/wallet.test.mjs), [approval](../test/approval.test.mjs) local checks; real wallet/mobile retest remains open |

## Browser defect found and fixed

Previously `loadTerms()` accessed local storage before decoding a present share-link fragment. A storage permission error therefore hid a valid complete share link and kept payment disabled. The reader now prioritizes the original fragment without accessing storage; cached terms are used only when no fragment exists. Invalid/empty supplied fragments cannot silently fall back to an unrelated cached copy. On-chain fingerprint, amount, payer and consent checks remain required. [Regression tests](../test/terms.test.mjs) cover denied storage, missing cache, malformed/changed link and valid cached fallback. This is code/test verification; it is not a fabricated successful wallet journey.

## Browser and demo gates still OPEN

The connected browser attempt returned: “Browser access requires the originating browser context.” No connected browser inspection, wallet signing or mobile screenshot was obtained. Existing CSS/viewport/reduced-motion rules are source evidence only. The web build's approximately 540 kB minified bundle warning remains a performance observation, not a failed build or a measured user-network diagnosis.

A safe next manual check needs no new quote or signature:

1. Pull this checkpoint in a second terminal, keeping the existing localhost server running, and refresh the Create quote page on the V4 deployment.
2. With the merchant connected, confirm lifetime usage is 6 of 6, “This test deployment has used its quote allowance” is shown, and Create share link is disabled. Do not try to create a seventh quote.
3. Open the original complete quote-6 share link. Confirm Expired is on-chain, there is no payment/approval or retry action for the terminal quote, and the copied original link retains its terms.
4. Check those read-only screens at desktop and a narrow/mobile viewport for legibility, accessible controls and horizontal overflow. Capture actual screenshots/observations; a stylesheet inspection cannot complete this item.

The deployment's immutable six-quote allowance is exhausted. A full new approval/payment browser journey cannot be repeated on it. Existing public journeys/recordings remain valid scoped evidence, but a new live demo/try-out capacity decision needs separate review; there is no automatic regrant, reset, redeployment or funding. The existing qualified closure/reopening recordings do not establish an uninterrupted browser-closed interval. The final public video must remain strictly under three minutes. M2 cannot be closed by treating these open gates as passed.

## Judging checkpoint

Equal weight, self-review only: Execution 4/5, Integration 4/5, Usefulness 3/5, Craft 3/5. V4 negative-path coverage and the storage repair strengthen verification/craft, while browser/mobile evidence, final availability and demonstration acceptance remain incomplete. No external audit, user adoption, new public transaction or prize result is claimed.

## Official Omni reference check

Reviewed current primary documentation on 25 November 2026: [Reactive contracts](https://dev.reactive.network/reactive-contracts) for system-only reactions, event filters and runtime subscription changes; [callback contracts](https://dev.reactive.network/callback-contracts) for proxy plus injected-sender authentication; [economy](https://dev.reactive.network/economy) for separate source/destination fees and targeted reserves; [origins/destinations](https://dev.reactive.network/origins-and-destinations) for supported-chain/proxy context. These references do not replace the recorded deployment wiring, receipts or funding observations, and no address/deployment was changed during this review.

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
