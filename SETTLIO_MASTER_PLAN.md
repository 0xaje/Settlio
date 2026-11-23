# Settlio master build plan
Version 2.0 · 19 November 2026

## Current payment scope · approved 20 November 2026
The user explicitly approved proceeding with ETH and USDC, with USDT marked Coming soon. This supersedes the earlier requirement to enable all three currencies for the current hackathon delivery and resolves the pending scope proposal below. USDT is a future integration, not an active M1 release blocker. No availability date or official deployment is promised.

Only ETH and the verified Base Sepolia USDC address are enabled in the interface. USDT may be displayed as a disabled Coming soon option; it cannot be quoted, approved or paid through that option. Generic token accounting remains, but no new token address or contract deployment is introduced by this amendment. Remaining M1 recovery gates stay open.

## Automatic deposit release · approved 21 November 2026
The user approved the recommendation to add automatic release after the agreed full-refund cutoff. This supersedes merchant-only manual release for newly created quotes explicitly accepting the new policy. Existing deployed quotes retain their original contract and terms.

- Merchant authorises automatic release when creating the quote; the customer reviews the same immutable policy before paying. Bind the release policy, asset amounts and timestamps into shared terms and the on-chain fingerprint.
- At or after refundCutoff, an authenticated scheduled callback may release the exact deposited asset and amount to the recorded merchant only if the quote is Confirmed and no eligible cancellation has reserved a refund. Cutoff eligibility does not attest service delivery or settle service-quality disputes.
- A cancellation accepted strictly before refundCutoff reserves the customer's full deposit immediately. A later callback must honour that reservation even after cutoff; release cannot consume it.
- Base block.timestamp and current escrow state are authoritative. Scheduling delay may postpone execution but must never enable early release or reopen expired payment. Repeated, stale and out-of-order callbacks must not duplicate transfers.
- Use official network CRON events with bounded due-job processing, isolated job failures, controlled retries and idle unsubscribe. Track successful destination outcomes rather than treating callback requests as completion. Verify live Lasna CRON delivery before calling scheduling operational.
- Maintain separate automation funding, visible funding/debt status and recovery. No customer principal funds network fees. Do not promise exact-second execution or perpetual operation without funding.
- New callback entry points, policy events and immutable wiring require a new deployment version. Preserve all old quote links, addresses and principal; no implicit upgrade or migration.
- This is M2 scope. M1 browser-interruption verification remains open; implementation starts only after its acceptance. M2 acceptance includes genuine unattended release and expiry, ETH/USDC same-asset refunds, deadline races, failed delivery/retry, no duplicate transfers, and origin/CRON/Reactive/callback evidence with both browser sessions closed.
- Documentation approval is not deployed functionality, a new test pass or a completed milestone.

## Current M1 acceptance · 23 November 2026
M1 quote/deposit/confirmation engineering scope is accepted. This supersedes historical M1-open status notes below. Acceptance evidence: genuine ETH and USDC full confirmation loops freshly reverified from user WSL; 46 passing local tests; current compiler/frontend/preflight/health passes; user-accepted targeted mobile fixes; manual recovery and original quote-creation pause/reload/recovery recording and screenshot; fault-injection verification of malformed/mismatched saved terms preserving the hash through the recovery coordinator used by the app. See docs/PROGRESS.md for exact provenance.

Local test fixtures are not live integration evidence. The failure-path coordinator was tested with a real isolated EVM receipt and persistent storage, not separately recorded in a browser. Browser screenshots/user actions are not independently replayed automation. No exhaustive device/extension coverage, independent security audit, validated customer demand or zero-defect claim. Full interface checks remain M3/M4. No gate waiver was used: the prior open recovery scenarios were exercised with these distinct kinds of evidence.

M2 is active but incomplete: unattended scheduled expiry, protected refunds and approved automatic release with live full-loop proof. No existing quote migration, redeployment or funds movement occurs merely because M1 is accepted. Existing corrected/recovery quotes remain unpaid.

## Authority and status
This plan is the implementation source of truth. Current milestone status: M0 complete; **M1 complete for its defined engineering scope**; M2 in progress; M3/M4 not complete. The [M1 acceptance record](docs/M1_ACCEPTANCE.md) is the item-by-item evidence ledger; it includes live, user-browser and isolated-test provenance and residual limits. Older M1-open notes below are historical and superseded by the dated current acceptance.

Historical Word/PDF planning exports represent earlier baselines and are not current. Do not claim scheduled refunds/expiry/automatic release, final design, exhaustive device coverage or submission completion from M1 acceptance.

## Approved decisions replacing version 1
- Work directly on main in https://github.com/0xaje/Settlio. Preserve concurrent changes and never rewrite history.
- Follow AGENTS.md. Finish and review each milestone before starting the next.
- Approved design reference is Settlio wallet payment flow board.png, approved in the conversation on 17 November.
- Six core surfaces are landing, merchant quote list, quote editor with customer preview, customer quote, wallet checkout, and booking receipt. Cancellation, expiry, refund, and processing states must be reachable within these journeys.
- Palette uses background #F0F4F1, primary text #162322, secondary text #62706E, accent #E99045, border #DCE3DF, dark green #174D3C, light green #A8D1BD, pale green #C8DDD3, white #FFFFFF.
- Georgia is the primary heading font. Inter is the body, forms, button, navigation, and numeric interface font.
- Hero rotates photographer, baker, tailor, and event decorator scenes. Pair each with an explicitly illustrative quote outcome. Gentle fades around five seconds, pause/manual controls, reduced-motion support, and mobile cropping checks are required.
- Headline is “Turn quotes into confirmed bookings”.
- Begin with independent service providers serving customers already comfortable with wallet payments. This is a starting audience hypothesis, not validated demand.
- Display the actual payment asset and units. Dollar amounts in design images are illustrative and do not establish an exchange rate.
- Product statuses distinguish unpaid, deposit received, confirming, confirmed, cancellation requested, refund pending, refunded, expired, and released where applicable. A transaction submission is not proof of confirmation.
- Initial engineering defaults selected under the user's build authorisation are native Base Sepolia test ETH, an exact deposit amount, a designated customer wallet, and customer cancellation strictly before refundCutoff. Enforce now < expiresAt <= refundCutoff at creation. Payment requires now < expiresAt. The designated customer may request a full refund while DepositReceived or Confirmed before the cutoff. Recording an eligible request immediately reserves the refund, even if delivery arrives after the cutoff. Merchant release becomes available at now >= refundCutoff only for confirmed quotes with no pending cancellation. The refundable principal cannot fund automation. These defaults are reversible before deployment and must be disclosed to the user.
- Objective contract rules cover payment and cancellation eligibility. Service quality and disputed delivery require a separately defined process beyond the initial scope.
- Current Omni documentation and reactive-lib-omni supersede legacy RVM tutorials.

## Approved payment amendment · 19 November 2026
This amendment supersedes the native-ETH-only engineering default. The user requires customer payment selection among ETH, USDC and USDT. ETH/USDC options and generic three-asset custody are implemented with local verification within M1. Official Base Sepolia USDT remains unverified and disabled; the full three-currency requirement is not complete. Do not deploy the old ETH-only contracts as the completed payment upgrade.

Acceptance conditions:
- Customer can select among merchant-authorised asset/amount options before depositing. A single fixed-asset quote is not sufficient to claim this requirement is met.
- Quote terms bind the allowed token addresses and exact amounts. No implicit 1:1 conversion between ETH and stablecoins, and no unapproved price-oracle dependency.
- The first successful authorised deposit locks the selected asset and amount; all later payment attempts fail.
- Refund and release return the deposited asset and amount. Liabilities are accounted separately per asset and cannot fund automation.
- Token deposits require exact receipt, safe token transfers, correct decimals, bounded approvals, permission checks, reentrancy protection and failure rollback.
- Verify official deployment provenance and obtain genuine testnet integration evidence for each advertised asset. USDT on Base Sepolia is not yet verified; do not relabel an arbitrary test token as official USDT.
- Update shared terms, frontend, ABI, deployment scripts and regression tests together before deployment. Existing 21 test passes cover the prior ETH-only implementation, not this upgrade.

## Approved core-first priority and optional messaging · 20 November 2026
The user reaffirmed Set It and Forget It as the core value. Finish and prove the core website, unattended confirmation, scheduled unpaid expiry, eligible refunds, custody and recovery before messaging integration. Existing sequential milestone gates remain in force. A messaging-service outage must not stop already-configured on-chain automation. Demonstrate automation after the initiating website/chat session is closed; manual retry is recovery evidence, not proof of unattended success.

Optional extension approved for planning after core completion:
- Prefer WhatsApp Business and iMessage through Photon. Start with the actually provisioned channel, verify its real conversation-to-booking journey, then add the second. Other channels remain deferred. Do not advertise a channel as working before verification.
- Conversational quote drafting collects the customer wallet, allowed assets and exact amounts, exact deadline/cutoff dates and time zone. Review the draft, use wallet-signed creation/payment, return a direct quote/checkout link and send notifications based on verified on-chain results.
- Keep one Settlio product and a fully usable website. Chat is optional; no forced social-platform selection before payment.
- Photon provides message transport. A runtime model may draft validated fields but cannot establish payment success or bypass wallet/contract authorization. No key collection, unrestricted transfers or chat-only spending authority.
- Use a persistent backend with authenticated webhooks, replay protection, idempotent processing and retryable notifications. Bind chat identities to wallets through explicit wallet authentication, not names or phone-number assumptions.
- Use the Photon API version matching the user's actual account. Subscription coverage, channel provisioning and credentials remain unverified. No secrets in chat.
- Photon can avoid a separate hand-built Meta adapter. Its documented WhatsApp Business channel still uses Meta Cloud API and business account/number provisioning. Consumer WhatsApp is separately listed as forthcoming; do not promise personal-account support.
- Implement only after core acceptance and with enough time to test and demonstrate it. No messaging code has started.
Sources checked: https://photon.codes/docs/beta/photon and https://photon.codes/platform/whatsapp .

Subsequent user WSL evidence passed all 42 tests, frontend build and read-only healthcheck: matching ETH/USDC custody, correct wiring, zero debt and nonzero automation balances. Browser/mobile, full recovery and USDT remain open within M1.

## Milestones and acceptance gates
M0 foundation and execution policy is complete for local implementation. Deliver AGENTS.md, this plan, licence, an honest README, environment check, and a recorded payment-policy decision. Policy defaults, local compiler, Anvil runtime, and current Omni source interfaces are checked. Deployment preparation continues within M1.
M1 quote and deposit to booking is COMPLETE as of 23 November 2026. See [M1 acceptance](docs/M1_ACCEPTANCE.md) for every accepted item, genuine ETH/USDC traces, WSL live health, 46-test checks, browser creation-recovery and local failure-path verification. Its evidence limits remain explicit. USDT is deferred by approval, not an open M1 requirement.
M2 unattended policies — IN PROGRESS, NOT ACCEPTED. Destination opt-in policy/callback safety, bounded CRON scheduler, explicit-consent payment and policy-interface code are implemented with 69 passing local checks. Version 3 binds the release flag; legacy shared fingerprints stay unchanged. Live/browser operational visibility, versioned deployment and genuine unattended evidence remain pending. See [M2 acceptance ledger](docs/M2_ACCEPTANCE.md). Completion requires scheduled unpaid expiry, authenticated eligible cancellation/refund, approved automatic release, custody accounting, repeated delivery, deadline races and recovery verified with genuine on-chain proof.
M3 complete approved interface. Connect the six surfaces to real state, accessible hero motion, responsive layouts, and independent user journeys.
M4 release and submission. Security/reliability review, reproducible public source, licence, deployments, several full-loop proofs, and public video under three minutes.

The old calendar is superseded by these gates. Deadline remains December 5. Target submission preparation by December 4. Dates are targets and never evidence of completion. Assess Execution, Integration, Usefulness, and Craft after each milestone. Mark unverified criteria explicitly.

## Initial evidence record
- Repository contents API returned “This repository is empty” on 19 November.
- No deployment addresses or transaction hashes verified.
- No build or test pass claimed.
- Next action is validate the Solidity toolchain and current Omni interfaces before M1.

## Original planning baseline
The following preserves version 1 requirements and context. Where it conflicts with the amendments above, version 2 decisions take precedence. Historical dates and original design tables are retained for provenance.


REACTIVE OMNI BUILDATHON 2026



SETTLIO
MASTER BUILD PLAN
Product · Brand · Frontend · Contracts · Reactive Automation · Security · Testing · Submission

Version 1.0 | 12 November 2026 | Planning baseline

STATUS: DESIGN APPROVED · BUILD NOT YET STARTED · EVENT ACTIVE

Mission: Build a real, verifiable quote-to-deposit automation product that lets businesses create
quotes, collect deposits, confirm bookings, expire unpaid offers, and process policy-eligible refunds.

This document is the source of truth. Changes to approved layout, scope, and architecture require an
explicit decision. No mock on-chain activity, invented evidence, or placeholder results may be
presented as real.




                        SETTLIO • MASTER BUILD PLAN • NOVEMBER 2026

01 Competition, timeline and non-negotiable rules
    Item                                               Decision / official requirement
    Event                                              Reactive Omni Buildathon 2026; Nov 5–Dec 5,
                                                       2026
    Track                                              Set It and Forget It — useful, persistent
                                                       automations
    Target                                             Compete for first prize ($2,000 in REACT); no
                                                       outcome guaranteed
    Network                                            Reactive Lasna testnet + Base Sepolia for initial
                                                       deployment
    Repository                                         Public and open-source by submission; include
                                                       an appropriate LICENSE
    Originality                                        Build Settlio during event; older projects only
                                                       as dependencies, not submission
    Time logic                                         Use timestamps, not block counts, for Base
                                                       Sepolia timers/deadlines
    Submission                                         Public repo; deployed contract addresses; full
                                                       origin-event→callback transaction hashes;
                                                       demo video <3 min



Official judging rubric — four equally weighted scores (1–5 each)
    Criterion                                          Required proof / release gate
    Execution                                          Live Reactive transactions and successful on-
                                                       chain callbacks; without these entry is not
                                                       scored further
    Integration                                        Reactive performs indispensable
                                                       payment/expiry/refund automation, not
                                                       decorative integration
    Usefulness                                         Real user problem, intuitive quote-to-payment
                                                       workflow, reduced manual follow-up
    Craft                                              Readable code, usable public demo, tests,
                                                       documentation another developer can follow



Target: 20/20. This is an aspiration, not an earned score. Execution is the initial eligibility gate, but
all four criteria carry equal judging weight.


Official references
     https://blog.reactive.network/reactive-omni-buildathon-thirty-days-to-find-out-what-one-second-
      buys/
     https://dev.reactive.network/
     https://dev.reactive.network/origins-and-destinations
     https://github.com/Reactive-Network/reactive-smart-contract-demos


02 Product definition and scope
Tagline (working): “Quotes that take care of themselves.” Settlio is a hackathon-only working brand;
avoid claiming trademark clearance or commercial exclusivity.




                         SETTLIO • MASTER BUILD PLAN • NOVEMBER 2026

Core user problem
Small service businesses lose time chasing deposits, manually confirming bookings, monitoring
expiring quotes, and resolving eligible cancellations. Settlio turns clear, accepted quote terms into
verifiable automatic outcomes.


Primary users
     Business owner: creates a service quote and shares a payment link.
     Customer: reviews terms, connects wallet, accepts and pays a testnet deposit.
     Reviewer/judge: opens public application and inspects actual transaction and callback evidence.


Must-have user journeys
     Create quote: service, customer reference, total price, deposit amount/percentage, quote expiry
      timestamp, cancellation/refund conditions.
     Share quote: public read-only customer page with terms and wallet-payment action.
     Deposit: customer signs genuine Base Sepolia escrow transaction before expiry.
     Reactive confirmation: origin deposit event triggers Lasna processing and authenticated Base
      Sepolia callback.
     Expiry: scheduled Reactive check marks eligible unpaid quotes expired, with no further
      payment accepted.
     Cancellation/refund: eligible cancellation is authenticated, event processed, and escrow returns
      permitted deposit once.
     Evidence: UI shows origin hash, callback hash, state, network and explorer links.


Explicit non-goals for first submission
     No PayPal, Stripe, fiat payout, paid AI model, cross-chain token bridge or production mainnet
      funds.
     No elaborate invoicing/accounting suite, multi-tenant billing or subscription system.
     No fake transaction feed, fake customers, simulated chain success, or hardcoded metrics shown
      as live.
     No additional UI redesign, gratuitous feature expansion or unrelated integrations.


03 Approved visual identity and UI design
The approved concept is a SIX-SCREEN composition: dark navy marketing landing hero; light
dashboard with navy sidebar and yellow selected navigation; Create Quote; Quote Details; Booking
Confirmed; Automation Rules. Preserve the page structure and general component hierarchy. Do not
replace it with a different dashboard.


Color tokens — Nightdesk-inspired, not copied layout
    Token                            Hex                               Use
    navy-900                         #0B1A33                           Landing background, sidebar,
                                                                       headings
    yellow-500                       #FFC72C                           Primary CTA, active nav,
                                                                       selected highlights
    blue-100                         #E6ECF5                           Soft panels / light blue surfaces
    white                            #FFFFFF                           Light surfaces and
                                                                       backgrounds


                          SETTLIO • MASTER BUILD PLAN • NOVEMBER 2026

    text-muted                        #8B97AA                            Secondary text on dark
                                                                         surfaces
    border-dark                       #34465F                            Dark-mode dividers
    border-light                      #E5E7EB                            Light-mode dividers



Semantic green for success and red for errors must meet contrast standards; final shades chosen
during implementation. Avoid using color as the only status indicator.


Typography and spacing
     Primary typeface: Archivo Variable; fallback: system-ui, sans-serif. License and font source to be
      verified before bundling.
     Type scale: 12 / 14 / 16 / 18 / 20 / 56 px; 56 px reserved for major landing headline, responsive
      clamp on mobile.
     8 px base spacing rhythm (4 px half-step permitted). 8 px default corner radius; pill
      buttons/chips where appropriate.
     Readable labels and simple English; short headings; avoid dense jargon, ornamental gradients,
      excessive shadows or generic card clutter.
     Maintain accessible contrast, keyboard focus indicators, legible small text, and responsive
      mobile layouts.


Six approved screens and requirements
    Screen                                             Structure and content
    Landing                                            Dark navy hero, yellow primary action, product
                                                       explanation and workflow.
    Dashboard                                          Navy sidebar, light main surface, quote stats
                                                       and recent REAL activity.
    Create Quote                                       Simple form: service, customer, amount,
                                                       deposit, deadline, refund terms.
    Quote Details                                      Share link, quote status, terms, payment
                                                       deadline, chain evidence.
    Booking Confirmed                                  Confirmation state, deposit, remaining balance,
                                                       explorer proof.
    Automation Rules                                   Readable view of automatic confirmation,
                                                       expiry, cancellation and refund conditions.



Light/dark mode
Light mode uses white/light content surfaces with navy text and yellow actions. Dark mode uses
navy surfaces with appropriate high-contrast text and restrained borders. Both modes preserve
information architecture and component positions.


Logo direction — pending explicit visual approval
Wordmark “Settlio” in Archivo, strong clean letterforms. Optional simple geometric mark suggesting
a check/settlement and forward motion, using navy and yellow. Avoid blockchain clichés, complex
gradients, or copying Nightdesk/QuoteSnap logos. Produce SVG and transparent PNG only after a
separate logo review. No finalized logo asset exists yet.




                          SETTLIO • MASTER BUILD PLAN • NOVEMBER 2026

04 Architecture and event flow
Recommended: Base Sepolia origin/destination (chain ID 84532), Reactive Lasna processing (chain ID
5318007). Testnet is allowed in this track; mainnet is not required. Confirm exact RPCs, callback
proxy, ABI, deployment and funding instructions against current docs at implementation time.

Flow: Business quote → customer wallet deposit → Base Sepolia escrow emits DepositReceived →
Lasna Reactive subscription processes event → authorized callback on Base Sepolia confirms
booking → frontend reads verified state and shows explorer evidence.


Contracts — proposed logical modules
    Module                                            Responsibilities
    SettlioEscrow.sol                                 Quote data, deposits, escrow, expiry/refund
                                                      state transitions and fund custody.
    SettlioReactive.sol                               Origin event subscriptions, processing, Cron-
                                                      based expiry checks, callback requests.
    SettlioCallback.sol                               Callback authorization, replay protection, safe
                                                      invocation of escrow transitions; can be
                                                      combined if security model permits.



Contract lifecycle
Created → AwaitingDeposit → Confirmed (valid deposit) OR Expired (unpaid past deadline).
Confirmed → CancellationRequested → RefundPending → Refunded when policy permits; otherwise
remains Confirmed or moves to a documented non-refundable terminal state. No ambiguous
double-terminal states.


Expiry automation caveat
Cron events provide scheduled triggers, not guaranteed execution at the exact second of a deadline.
Use timestamp comparisons and a bounded list/queue of pending quotes. Ensure deposit function
itself rejects expired quotes even if Cron callback is delayed. Test gas and funding costs; keep
batches small and recoverable.


Cancellation policy caveat
Use deterministic on-chain eligibility rules; cancellation window is separate from quote expiry.
Decide who may cancel and whether any service-provider authorization is needed. Never promise
refunds that the contract cannot safely enforce. Initial scope: full eligible deposit refund only.


05 Security and reliability requirements
     Callback verification: authorize official callback proxy and expected Reactive contract; verify
      current recommended pattern from docs.
     Replay/idempotency: each deposit, expiry and refund action can transition state once; duplicate
      callbacks must be harmless.
     Reentrancy protection and checks-effects-interactions for withdrawals/refunds; use audited
      libraries when suitable.
     Custody accounting: track per-quote deposits; prevent double refunds and owner withdrawal of
      escrow funds.


                          SETTLIO • MASTER BUILD PLAN • NOVEMBER 2026

     Deadline safety: compare block.timestamp to explicit expiresAt/refundCutoff timestamps; test
      equality boundaries.
     Failure handling: callback failures, insufficient funds, missing subscriptions and RPC outages
      must be observable and recoverable.
     Never store private keys in repo, logs, screenshots, or frontend bundle. Use environment
      variables and secret-safe CI.
     Quote IDs and state must be validated on chain; frontend/backend cannot be authoritative for
      fund movement.
     Verify supported origin/destination chain pairing; do not mix testnet and mainnet paths.
     Use events for all critical state transitions; maintain transaction-level evidence for judge
      verification.


06 Engineering stack and repository layout
    Area                                               Proposed choice
    Frontend                                           React + TypeScript + Vite
    UI                                                 Tailwind CSS + design tokens + Archivo
                                                       Variable
    Wallet                                             wagmi + viem; verify connector support
    Contracts                                          Solidity ^0.8.29 subject to Reactive docs;
                                                       Foundry for tests
    Reactive                                           Current Omni API and official examples; do not
                                                       reuse deprecated RVM-era patterns
    Application records                                Postgres or minimal indexed store, only if
                                                       needed for metadata
    Deployment                                         Free public frontend hosting; supported
                                                       testnets; verifiable explorer links



Suggested repo tree
     apps/web/ — landing, dashboard, customer pages
     packages/contracts/ — escrow, callback, Reactive contracts
     packages/shared/ — types, ABIs, chain config
     script/ — deployment and verification
     test/ — unit, integration and end-to-end tests
     docs/ARCHITECTURE.md, SECURITY.md, ONCHAIN-EVIDENCE.md, DESIGN-SYSTEM.md,
      SUBMISSION.md
     README.md, LICENSE, .env.example, .gitignore


07 Development phases and hard gates
    Dates                             Work                               Exit criteria
    Nov 12–14                         Verify docs/networks/faucets;      Working wallet/testnet
                                      create repo; establish design      environment; documented
                                      tokens and approved layouts        technical choices
    Nov 15–19                         Escrow contract, quote             Real deposit on Base Sepolia,
                                      lifecycle, payment flow, unit      explorer proof
                                      tests
    Nov 20–24                         Lasna Reactive event               At least one full
                                      subscription and callback;         origin→Reactive→callback
                                      expiry and refund automation       loop verified


                          SETTLIO • MASTER BUILD PLAN • NOVEMBER 2026

    Nov 25–28                        Connect all six screens, real      Public app reads chain state
                                     state, public share link,          correctly
                                     responsive light/dark
    Nov 29–Dec 2                     Adversarial tests,                 All release-blocking tests pass
                                     funding/retry tests, docs, audit
    Dec 3–4                          Video (<3min), public              All four submission artifacts
                                     deployment, proof index,           verified; submit before Dec 5
                                     submission form



Schedule is a target, not evidence that work has happened. If the Reactive proof loop slips, reduce
secondary UI scope rather than fabricating success.


08 Test matrix and acceptance criteria
    Test                                              Expected observable result
    Valid deposit before expiry                       Escrow event; Reactive processing;
                                                      authenticated callback; Confirmed state
    Payment at/after expiry                           Rejected by contract, regardless of Cron delay
    Unpaid quote past expiry                          Cron-triggered callback eventually marks
                                                      Expired
    Eligible cancellation                             Only permitted actor triggers; full deposit
                                                      refunded once
    Duplicate callback                                No second transition or transfer
    Refund callback retry                             No double refund; safe eventual state
    Unauthorized callback                             Reverted with no state change
    Insufficient callback funding                     Clear failure evidence, top-up and recovery
                                                      procedure
    RPC/indexer outage                                UI does not falsely report success; can refresh
                                                      from chain
    Mobile/light/dark                                 Core journeys functional and accessible on
                                                      mobile and desktop



Evidence discipline
For each tested workflow, save: network, contract address, origin tx hash, origin event/log, Reactive
transaction or verifiable processing proof, callback tx hash, destination state, explorer URLs,
timestamp, and test outcome. Do not invent hashes or mark an event complete without chain
verification.


09 Submission package and video
Mandatory four deliverables
     Public OPEN-SOURCE GitHub repository with LICENSE, source, scripts, tests and reproduction
      README.
     Deployed contract addresses with chain names and public explorer links.
     Several genuine hashes proving complete origin event → Reactive processing → callback.
     A publicly accessible demo video strictly under 3 minutes.




                            SETTLIO • MASTER BUILD PLAN • NOVEMBER 2026

Suggested 2:55 video storyboard
    Timestamp                                         Footage
    0:00–0:20                                         Real problem and one-line solution
    0:20–0:45                                         Business creates and shares quote
    0:45–1:20                                         Customer pays real testnet deposit
    1:20–1:50                                         Reactive event and booking callback proof
    1:50–2:20                                         Automatic expiry and eligible refund proof
    2:20–2:45                                         Explorers: origin hash, Reactive evidence,
                                                      callback hash
    2:45–2:55                                         Repo, deployed app, closing



If full live expiry cannot fit naturally, use an already verified short-deadline test quote and show its
real on-chain proof; do not simulate the action. Prefer recorded real screen capture and readable
transaction URLs.


Release blockers — submission must not proceed without
     Public repository and appropriate open-source license
     Original build provenance within event window
     Verified deployment addresses and chain details
     At least one successful real origin-to-callback Reactive loop, ideally one per automation type
     Readable, functional deployed app and complete README
     Demo video <3 minutes with working public link
     No private secrets, fabricated data, misleading screenshots or block-count deadlines


10 Open decisions and first build command sequence
Must resolve before committing implementation
     Verify current Omni subscription, callback, Cron, and proxy interfaces directly against docs and
      example contracts.
     Verify Base Sepolia/Lasna faucets, RPC endpoints, explorer availability and callback funding.
     Select wallet onboarding and whether quotes are stored fully on-chain or with optional
      metadata off-chain.
     Finalize cancellation actor and refund-window policy in plain English and on-chain logic.
     Confirm domain/hosting, open-source license, and approved logo artwork separately.


Immediate order of operations
     1. Create a NEW public repository for Settlio during the event and add LICENSE/README/design
      baseline.
     2. Install and test Foundry, Node and wallet/testnet configuration; protect keys.
     3. Deploy minimal Base Sepolia event emitter and Reactive Lasna subscriber.
     4. Verify a real destination callback; save origin and callback hashes in ONCHAIN-
      EVIDENCE.md.
     5. Replace minimal emitter with production escrow logic, implement full tests and integrate
      approved UI.




                            SETTLIO • MASTER BUILD PLAN • NOVEMBER 2026

Definition of done
Settlio is done only when a new user can open the deployed product, create/share a quote, pay a real
testnet deposit, see a verified Reactive-triggered booking confirmation, inspect working
expiry/refund paths, and follow public source/evidence to reproduce the core flow.

Document owner note: this is a build specification, not a claim that any contract or app has already
been deployed. Revisit technical parameters against live official documentation before deployment.




                       SETTLIO • MASTER BUILD PLAN • NOVEMBER 2026

## M1 review update · 20 November 2026
Added Base Sepolia add/switch handling and pending-receipt recovery without changing deployed contracts. TypeScript/build and 42 local tests pass. These new wallet responses and recovery cases are isolated tests, not additional live wallet evidence. The read-only health check was implemented but its live run timed out.

The extension browser was unavailable and the cloud browser could not reach the preview. Mobile rendering and browser reload recovery are explicitly unverified. USDT remains an approved but blocked requirement; official Tether/USDT0 source review did not verify Base Sepolia deployment provenance. Do not substitute an arbitrary token or silently change the approved scope. M1 remains open. Next gates are a successful health check from WSL, browser/mobile review, and resolving the USDT requirement.

## Mobile review status · 20 November 2026
User supplied a 390 x 600 Chrome responsive-mode recording of quote list/editor. Mobile history cards, sticky navigation, explicit scroll reset, shrinkable form grids and 16px mobile inputs were implemented; TypeScript/production build passed. Post-fix visual confirmation, confirmed customer quote view and physical-phone testing remain open. The recording also shows a wallet-extension provider conflict, still unresolved. M1 is not closed.

The user reaffirmed the previously approved design. Current functional screens are incomplete implementation; the approved palette, typography, surfaces and rotating professional hero remain the M3 source of truth. No redesign or messaging work began in this fix.

## Mobile acceptance update · 20 November 2026
The user confirms the updated responsive view works. Targeted mobile fixes have user-reported acceptance. Independent physical-device coverage remains a later full-interface verification task; no such pass is claimed. Continue M1 with a genuine receipt-recovery/reload check. Do not close M1 while recovery or approved payment requirements remain unresolved.

## Receipt recovery acceptance update · 20 November 2026
Quote #3 creation is verified, and its video shows a normal already-loaded unpaid quote. Interrupted-pending recovery remains unverified. Added manual read-only recovery from a genuine creation receipt, with saved-terms fingerprint checking; TypeScript/build and 45 local tests pass. The new browser control still needs user verification. It does not require another transaction or deposit and does not replace the interrupted-pending test. Stay in M1.

## Recovery status and payment-scope decision · 20 November 2026
Manual Quote #3 browser recovery is user-confirmed. A real local pending-transaction/reader-restart integration check passes as part of 46 local tests. It does not count as public-browser interruption proof, which remains unverified. M1 stays open.

Proposal awaiting user decision: constrain hackathon live payment scope to the already verified ETH/USDC flows and retain USDT as a later supported-network integration. Official Base Sepolia USDT provenance remains unverified. The earlier approved three-currency requirement is still active until the user explicitly approves a scope amendment. No substitute USDT or new payment integration is authorised by this proposal.


## M2 policy interface implementation status · 23 November 2026
Version 3 terms bind automaticRelease. Customer explicit consent is checked by the new payment entry point; legacy entries cannot pay automatic-release quotes. M1 shared links and deployment remain compatible. M2 creation is guarded by version/network/immutable wiring checks; transport errors cannot silently enable policies. Job/funding observations and pending/completed refund/release states are implemented but not yet browser/live verified. Final local checks: contracts/TypeScript/frontend build pass, 69 tests pass. Deployment tooling, new live deployments, browser regression, unattended traces, cost/delay and operational recovery remain open. See docs/M2_ACCEPTANCE.md; M2 is NOT complete.


## M2 deployment tooling status · 23 November 2026
Deployment-state/journal and exact subscription-filter helpers now have five focused checks; the final full local suite passes 74 tests. This component is not yet connected to a deployment CLI. Versioned preflight/CRON observations, source/runtime checks, M2 deployment and evidence commands remain pending. No public broadcast or M2 acceptance. See docs/M2_ACCEPTANCE.md for evidence and limits.


## M2 deployment command update · 23 November 2026
Versioned M2 preflight/plan/deploy/verify commands and confirmation evidence namespace are implemented. Separate journal/lock, saved-intent resumption, immutable wiring and compiled creation/runtime checks pass local two-chain tests including an unavailable index after broadcast and duplicate-free resume. Legacy deployment rejects M2 bytecode. Final contracts/frontend build and 76 local tests pass. Live preflight produced no verified observations from this workspace. Actual deployment, scheduled-policy evidence verifier, public unattended loops, browser journeys, costs and recovery remain pending; M2 is NOT ACCEPTED. Follow the README read-only checks before any user-local M2 deployment.


## M2 live CRON gate blocked · 23 November 2026
User WSL preflight returned no matching recent CRON100 event; planning did not run and no deployment was attempted. Documented emitter/topic/shape agree with source, but the live cause is not yet known. Added read-only diagnose:cron with three passing focused tests; preflight/deployment gates are unchanged. Diagnose actual public RPC responses before fixing the confirmed cause. No live scheduling pass or M2 completion.


## Indexed CRON correction · 23 November 2026
User diagnostics and official Solidity source show Cron100 indexes its number: two topics, empty data. The earlier unindexed-only preflight and scheduler assumption was an implementation defect, now corrected with strict indexed parsing and actual locally emitted-event regression. Final full suite: 80 passed; contracts/frontend builds pass. No public deployment or corrected live preflight pass yet. This supersedes the unknown-cause blocker; M2 still awaits user-local read-only preflight/plan and all public unattended execution gates. Timestamp deadlines and M1 contracts remain unchanged.


## M2 live preflight and plan passed · 23 November 2026
User WSL output on a3aef74 verifies the indexed CRON100 observation at block 9050100 (hash 0xab6db2a9d9a4b89640185913021f7f2f3ad29301f294ca4ec945fe361df2a4a7) and completes read-only planning for the dedicated deployer. Creation estimates are covered by reported balances; configuration/future fees remain additional. The CRON preflight blocker is resolved for this observation. Next: versioned M2 deployment and verification, then complete scheduled-policy trace verification and unattended live acceptance. No deployment or M2 callback is yet claimed. M2 NOT ACCEPTED.


## M2 deployment attempt requires read-only inspection · 23 November 2026
User-local deploy:m2 stopped with a generic error; partial broadcast/creation cannot yet be excluded. verify:m2 did not run. Preserve all journals; use the new key-free status:m2 command before any retry. Stage-safe errors and read-only receipt checks pass the final 85-test suite. No contract bytecode or source fingerprint changed in this update. Root cause and public deployment outcome remain unverified; M2 NOT ACCEPTED. No M3 work.


## M2 deployment receipts and subscription-parser fix · 23 November 2026
User WSL reports successful Reactive/callback creation and configuration receipts; preserve the M2 contracts/journal. Full verification stopped because live rnk_getFilters uses PascalCase Version/TopicFilters rather than the documented camelCase wrapper. Explicit support for both wrappers retains exact active subscription criteria and passes the final 86-test suite. No contract bytecode/fingerprint changed. Next is key-free verify:m2, not redeployment. Full runtime/wiring/filter report and unattended policy traces remain pending. M2 NOT ACCEPTED.


## M2 deployment checkpoints completed · 23 November 2026
User WSL verify:m2 on 6203604 passed source/runtime/creation/configuration/network/version/wiring, ten exact origin subscriptions, custody and separate funding checks (filter version 12314). Zero quotes/jobs correctly leave CRON inactive while unpaused. Record these deployment checkpoints as complete current observations; dynamic CRON delivery and unattended policy execution are still unverified. Next: separate M2 interface on port 5174 using process-scoped escrow 0x1694e56187f9422e364B42af3185d34a0D4b9bc0, then live policy journeys/evidence. M2 remains NOT ACCEPTED.


## M2 first live policy-registration blocker · 23 November 2026
M2 Quote 1 exists unpaid, but user verification reports zero jobs/CRON off. The official Reactive MCP confirms a valid exact active policy filter and one matching origin event, while two network checks flag likely origin-ingestion stalling. A bounded origin trace is inconclusive after its RPC budget was exhausted. Do not treat deployment/wiring success as automation proof or declare a confirmed network-wide outage. Preserve the same unpaid quote (13:00 WAT deadline, 14:30 cutoff); deadline passage alone is not callback proof. Recheck live registration when ingestion resumes, review/provision separate fee buffer and complete all unattended traces. M2 remains BLOCKED / NOT ACCEPTED; details/provenance are in the acceptance ledger and diagnostic JSON.


## M2 live scheduling and fee recovery update · 23 November 2026
Network sequencing is moving at the latest independent observation. Quote 1 is registered and three callback requests exist; official trace proves a real CRON -> successful Reactive -> callback request. Base quote remains AwaitingDeposit; delivery is unverified. Reactive now owes 0.0147685 test REACT and is debt-blocked with inactive subscriptions. Initial 0.1 funding was insufficient. Added a one-time journalled fund:m2 deposit of 1 test REACT through SYSTEM.depositTo, with recorded-target/source/network checks and duplicate-free resume. Full 87-test suite plus six final focused checks pass. No public top-up executed by the assistant. User-local reserve recovery, actual delivery, complete browser-closed flows, measured cost/admission and all remaining gates are still required; M2 NOT ACCEPTED.


## M2 first authenticated live expiry verified · 23 November 2026
Fee reserve payment independently verified: 1 test REACT via SYSTEM.depositTo, debt cleared and subscriptions restored. Quote 1 now Expired on Base, with authenticated callback 0x547bbbf96a201348cf818f4dcf97a55dacb9403b24892009d152c2e219064899 at 15:33:15 WAT; scheduler closed. verify:expiry checks real creation/CRON/request/proxy payload/events and records quote-linked proof; unique retry attribution and browser closure are explicitly not proven. Same validator passed independently fetched live receipts; full workspace CLI transport failed, WSL rerun pending. Full 95-test suite and final eight focused checks pass. Mark live on-chain expiry and fee recovery complete, not all M2. Refund/release/browser-closed/cost and remaining acceptance gates stay open.


## M2 user WSL expiry reproduction complete · 23 November 2026
User verify:m2 and verify:expiry on 8107f00 both passed at 15:55 WAT. Expired quote, closed scheduler and zero jobs/idle CRON independently collected earlier are now reproduced through the complete CLI from user WSL. Debt remains zero. Close the CLI-reproduction item; keep browser-closed and unique retry-attribution limits explicit. Next is a new ETH deposit/eligible cancellation/automatic same-asset refund, then other pending M2 flows. No M2-wide completion or M3 start.


## M2 ETH refund checkpoint complete · 23 November 2026
Quote 2 completed deposit, Reactive confirmation, eligible cancellation and authenticated automatic ETH refund. Independent receipt/calldata checks and refund-block customer/escrow deltas show exactly 0.0001 ETH returned; current ETH balance/liability zero, job closed and idle CRON off. Public evidence: deployments/evidence/m2/quote-2-eth-refund.json. Browser closure and unique request attribution are not asserted. No new code/build/test-suite run. USDC refund, automatic release, reproducible refund CLI, browser-closed and remaining operational gates stay open; M2 NOT ACCEPTED and M3 pending.


## M2 USDC refund checkpoint complete · 23 November 2026
Quote 4 completed genuine 1 USDC approval/deposit, Reactive confirmation, cancellation and authenticated automatic refund. Issuer-token Transfer and exact refund-block balance deltas verified; current USDC/native liabilities zero, scheduler closed and idle CRON off. Evidence: deployments/evidence/m2/quote-4-usdc-refund.json. Browser closure and unique request attribution not claimed. No new code/build/test-suite run. Next: reproducible refund verification and fee-cost/funding review before automatic-release/browser-closed live testing. About 0.414101 test REACT reserves/zero debt is a dated health observation, not a sufficient-future-funding guarantee. M2 NOT ACCEPTED; M3 pending.


## M2 refund verifier and partial fee review · 23 November 2026
Read-only verify:refund for accepted ETH/USDC trails implemented; fresh actual collector/validator checks pass via Python HTTP RPC transport and recorded CLI replay passes. Full suite 107 passed, final 12 focused checks passed after guard review. WSL CLI reproduction pending. Historical subscriber reserve block debits 0.0299719/0.0168036 test REACT measured; these are not full quote costs or an admission guarantee. Current measured reserve 0.414101, zero source/destination debt. No new contract/frontend build, deployment, funding or live quote. Resolve WSL reproduction and adequate fee budget before automatic release/browser-closed testing. M2 NOT ACCEPTED; M3 pending.


## M2 user WSL refund reproduction complete · 23 November 2026
User default live verify:refund for ETH Quote 2 and USDC Quote 4 passed at 17:02 WAT, followed by verify:m2. Close the WSL refund-reproduction checkpoint. Both assets have zero custody/liability; scheduler idle and source/destination debt zero in user output. Reserve 0.414101 test REACT is a dated observation. Original published snapshots are preserved; no newer user-local bytes fabricated. No code/test/build changes. Automatic release, browser-closed capture, operational budget/admission and remaining recovery/journey acceptance stay open. Establish fee budget and closure capture before a new timed-release quote. M2 NOT ACCEPTED; M3 pending.


## M2 release readiness budget and funding tooling · 23 November 2026
Conditional 30-minute isolated-test budget implemented and independently observed: modeled requirement 13.6 test REACT, reserves 0.414101, canStart false; callback fee buffer passes. This is a stress scenario, not expected actual cost. Deployer wallet observed 8.4928356 test REACT. New one-time 14-test-REACT fund:m2:release intent preserves the old 1-token recovery; tests pass including distinct/resumable deposit. Full suite 112 passes. No live funding/quote or contract/frontend build. Obtain sufficient test REACT, verify the explicit reserve deposit and rerun the model before creating a timed quote. docs/RELEASE_TEST.md specifies explicit consent, fresh WAT deadlines and recorded browser closure. Actual release, model validity over the journey, WSL budget/funding reproduction and full operating-cost/recovery acceptance remain open. M2 NOT ACCEPTED; M3 pending.


## M2 release funding and WSL budget readiness complete · 23 November 2026
Independent successful 14-test-REACT depositTo(existing subscriber) receipt verified: 0x8a0f11608a458b9e88a1da0ebdb98cc3436493921f9335da8cbef3d26b51f7cc. User WSL budget at 17:17 WAT passes: 14.414101 reserves vs 13.6 conditional stress allowance, callback funding sufficient; verify:m2 healthy/idle with zero liabilities/debt. Close this funding/readiness-reproduction checkpoint only. No code/build/test rerun. Next: a single ETH automatic-release quote with fresh deadline/cutoff, explicit customer consent and recorded browser closure. Release and full operating-cost/recovery/journey acceptance remain open. M2 NOT ACCEPTED; M3 pending.


## M2 ETH automatic release checkpoint complete · 23 November 2026
Quote 5 authentic scheduled release verified at 17:50:28 WAT after its 17:50 cutoff: 0.0001 ETH to merchant, exact merchant/escrow block deltas, zero native liabilities, closed job and idle CRON. Real deposit/confirmation and indexed CRON/request/delivery proof in deployments/evidence/m2/quote-5-eth-release.json. Supplied recording establishes Confirmed/Released UI/terms but not closure of both tabs; browser-closed gate remains pending. Reusable release CLI/WSL reproduction, USDC release and remaining operational acceptance stay open. No code/build/test rerun. Fresh isolated-test budget passes with 14.1183207 test REACT reserves vs 13.6 conditional allowance. Next: USDC release with recorded closure and fresh absolute WAT deadline/cutoff, not a repeat ETH transaction. M2 NOT ACCEPTED; M3 pending.


## M2 USDC release/accounting and reopening checkpoint complete · 23 November 2026
Quote 6 authenticated scheduled release verified at 18:20:37 WAT after 18:20 cutoff: actual issuer-USDC Transfer of 1 USDC to merchant, exact token block deltas, zero token/native liabilities and closed scheduler. Full trace in deployments/evidence/m2/quote-6-usdc-release.json. New video independently verifies fresh-tab reopening to the same Released quote. Earlier tab closure accepted as USER CONFIRMED following explicit clarification; no continuous recording is claimed and clips stay separately labelled. No additional quote/recording needed now. Reusable release verifier/WSL reproduction and remaining operational cost/recovery/journey gates remain open. Evidence/docs only; no build/test rerun. M2 NOT ACCEPTED; M3 pending.


## M2 release verifier implementation complete · 23 November 2026
Read-only verify:release for accepted ETH Quote 5 and USDC Quote 6 implemented. Fresh actual collector/validator passes on public RPC data via Python HTTP; recorded CLI replay passes. New namespaced verified bundles retain real times. Full suite 124 passed, including 12 focused release evidence/tamper/preservation checks. No contract/frontend source/build/deployment changes. Full user WSL live CLI reproduction remains pending; run both releases and verify:m2 next, then reconcile remaining operational acceptance. Human browser evidence stays separately classified. No additional quote, payment, recording or funding needed now. M2 NOT ACCEPTED; M3 pending.


## M2 user WSL release reproduction complete · 23 November 2026
User live verify:release for ETH Quote 5 and USDC Quote 6 passed at 18:57 WAT, then verify:m2 passed with zero principal liabilities/debt, no jobs and idle CRON. Source fee reserves observed 13.9554569 test REACT. Close release-CLI reproduction; keep original published snapshot dates and separately labelled browser/user evidence. No new tests/build/code/transaction. Remaining M2 review is specific: reconcile timing/idempotence/failure-recovery evidence, identify missing public participant-retry proof, and review active-job admission/fee budgeting (per-tick bounds exist; no global queue admission cap; budget check is off-chain). Do not claim these operational limits solved or start M3. No repeat quote/payment/recording needed now. See docs/M2_ACCEPTANCE.md remaining-gap matrix. M2 NOT ACCEPTED.


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
