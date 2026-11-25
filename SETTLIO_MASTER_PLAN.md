# Settlio master build plan

## Local renewable escrow integration — 25 November 2026

[Escrow acceptance](docs/RENEWABLE_ESCROW_ACCEPTANCE.md): separate V5 escrow now consumes ledger grants atomically and closes active capacity only with successful terminal transitions. Refund claims bypass closed admission/retry exhaustion; missing source acknowledgement retains work capacity, not customer principal. Final `npm test`: 272/272 passed, zero failures/skips/cancellations; new ledger/escrow compilation and size checks passed. These are isolated local checks, not new public evidence. V4 source/deployment, web ABI and six proofs remain unchanged. M2 stays open. Next: authenticated versioned receiver and source closure with bounded acknowledgement recovery; economics and production settings remain pending. No deployment or spending authorized.

## Standalone renewable ledger implemented — 25 November 2026

User authorized the next local implementation step. [Ledger acceptance](docs/RENEWABLE_LEDGER_ACCEPTANCE.md): renewable finite grants, separate active/unsettled work, idempotent two-sided settlement, epoch/profile binding and retained replay records. Combined new-ledger/existing-admission tests passed 10/10; Solidity 0.8.29 compilation passed (4,751-byte runtime). These are local fixture checks only. No public operation or V4 change. Escrow/source/receiver integration and economics remain pending; M2 stays open. Next: local escrow integration with atomic principal-safety tests.

## Renewable admission planning — 25 November 2026

The user's continuation approves the operating-model direction for implementation planning: renewable finite sponsorship and bounded unsettled cross-chain work. [Implementation plan](docs/RENEWABLE_ADMISSION_PLAN.md) defines components, invariants, failures and acceptance tests. This does not approve numeric production settings, public operations or deployment. Current V4 and its six proofs remain unchanged; M2 remains open. Planning checks only; no new test/build result.

## Operating-model proposal prepared — 25 November 2026

[Ongoing admission and funding proposal](docs/OPERATING_MODEL_PROPOSAL.md) is ready for review. Recommended direction: renewable sponsored finite batches with bounded unsettled cross-chain work; no permanent six-booking product cap. This is proposed design only. Exact quotas, duration profiles and pricing remain undecided; no contracts, operating commands or deployment permissions changed. M2 remains open and replacement deployment preparation remains cancelled. Next: user policy review before implementation.

## Current continuation checkpoint — 25 November 2026

Read [CURRENT_STATUS.md](docs/CURRENT_STATUS.md) for the concise current record and [HANDOFF.md](docs/HANDOFF.md) before continuing in another chat/IDE. This source-of-truth plan and latest explicit user decisions govern implementation; older “current” paragraphs below are dated history. Their older counts and pending labels must not override newer accepted evidence. The old navy/yellow/Archivo design baseline is superseded by the later green/orange and Georgia/Inter approval below.

M0 and scoped M1 are complete. Six V4 M2 public policy journeys and fresh user CLI reproductions are verified. M2 formal acceptance remains OPEN: the operating/admission policy is not settled for ongoing use, and original strict browser-evidence qualifications are retained rather than silently waived. M3 complete approved interface is not complete or newly started here. M4 hosted release/submission is pending. The final video is M4, not another failed M2 transaction test.

The current V4 instance has six of six immutable lifetime admissions consumed and cannot create quote 7. This was bounded test policy, not an approved permanent product limit. Fee reserves and lifetime admission are different; more tokens or a new wallet cannot reset that counter. The user cancelled fresh deployment preparation and has authorized no new deployment, funding, grant or proof transaction. Reuse the six genuine proofs; no token spending is needed for current documentation or design analysis. Wallet-extension conflict is FIXED AS USER-REPORTED; independent clean-console evidence is not claimed and it must not be repeatedly presented as a contract failure.

Next authorized continuation preparation: preserve a complete handoff and propose, without implementation/spending, an ongoing admission/funding model with realistic service horizons and explicit trust/cost assumptions. A later policy/deployment decision needs a concrete reviewed proposal. This checkpoint does not approve another operating policy, close M2 or begin M3. All historical source, commitments and proof records are retained.

Last full test checkpoint: 245/245 in 4038b52; latest wording-only patch 73dc15b had a fresh web build, no new full-suite claim. This documentation-only consolidation adds no contract/browser test result. Equal-weight self-assessment remains Execution 20/25, Integration 20/25, Usefulness 15/25, Craft 15/25 (70/100).

## Preserved plan and dated amendments

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

Independent raw-RPC collection and the new `verify:recovery:v4` validator establish the final unpaid quote's controlled recovery. The [complete public bundle](deployments/evidence/v4/quote-6-recovery-verified.json) records grant, owner pause, creation, a single consumed participant retry, owner restore, real network CRON, associated Reactive request, authenticated destination expiry and both-chain closure. The [user terminal observations](deployments/evidence/v4/quote-6-user-observations.json) are separately labelled provenance; fresh user reproduction of the complete verifier remains pending. See [procedure and result](docs/V4_CONTROLLED_RECOVERY.md).

Successful public hashes: grant `0x36c086ac6797e5c8c0eafcfa30ce95a1ee4d43442ea23411c1871896dbd7756f`; owner pause `0x0e2d517eb5315601012d9db7d0810e53f2b2b1da2b087c26fb12e80a67a07c4d`; creation `0x1ea3654d1081ad1593f0a14233a52896539d8a43728fabf64feb020aa5c8720e`; retry `0xf550fc2dbf043fb5664565f5e03b7444afc950a8da84036890ab5a32d12cf3cc`; owner restore `0x9113708fad9ad2e5ed405f1ec6b80f3d0b656c9909ca3508b3d847f270d9af6f`; CRON `0x4b127fc6fd7ee8c833765acd83430d104d60d5124b866536a3db645d80f290da`; associated reaction `0x2bb12c7d975ddffd62b1e7bdb7bd0ca0925d3604766a01b7f1a899f6144f47a5`; expiry callback `0x80e72e14b40270466409884920a052a5bd32ee1a686169745217532f16ba5773`.

The pinned Lasna block immediately before restore shows paused=true, CRON=false, one active job, zero request attempts, and the genuine PolicyRequested fingerprint already processed. Its block hash matches the restore block's parent. Retry occurred after the original payment deadline. Creation and retry have relayed top-level envelopes; source-matched escrow runtime at both historical blocks plus QuoteCreated/admission/PolicyRequested/RetryConsumed events establish the admitted merchant and authorized retry path. Exact internal merchant/customer retry caller attribution is not claimed; PublicNode debug_traceTransaction was unavailable. No direct merchant-to-escrow transaction is fabricated.

At the terminal checkpoint quote 6 is Expired, the admission and source job are closed, active/reserved/jobs are zero, the scheduler is unpaused, CRON is unsubscribed, and ETH/USDC custody and liabilities are zero. Six of six immutable lifetime admissions are consumed. This is **controlled owner-pause recovery**, not evidence of a protocol outage, untouched unattended execution, browser closure, unique protocol return-report attribution, measured production funding, or future delivery. Earlier scoped proofs remain preserved. Final demo availability after exhaustion, remaining admission/journey/browser/mobile review and fresh user verifier reproduction remain open. **M2 remains OPEN; M3 has not started.**

Judging, equally weighted: Execution has genuine resumed CRON/request/authenticated expiry; Integration shows Reactive resumes queued work and closes it after destination acknowledgement; Usefulness demonstrates recovery without paying or exposing customer principal; Craft adds a read-only reproducible verifier, historical state binding and honest relayed-route limits. No deployment, funding, credit, pause/restore or other public transaction was sent by this evidence/documentation change.

Validation for this grouped evidence checkpoint: full `npm test` passed 204/204 with zero failures, skips or cancellations; the expiry/history/recovery focused run passed 19/19; the final recovery mutation tests passed 6/6, including historical runtime tampering checks. The normal `verify:recovery:v4 -- --recorded` CLI passed as explicit archived replay. Independent public collection used the actual JavaScript collector/validator with a Python HTTPS RPC transport in this workspace; a fresh native Node/Ubuntu CLI reproduction by the user is still pending. No contract/frontend source changed, and no new web build is claimed.

Provisional M2 checkpoint assessment (equal weight, 1–5; self-review, not an external judging result): Execution 4/5 and Integration 4/5 for genuine multi-asset policy outcomes and controlled recovery; Usefulness 3/5 for the demonstrated workflow without claimed customer adoption/validation; Craft 3/5 while complete browser/mobile journeys, remaining acceptance review, demo availability and submission deliverables are open. These scores do not close M2.


## V4 controlled recovery user reproduction COMPLETE — 25 November 2026

Fresh Ubuntu `npm run verify:recovery:v4` passed at **2026-11-25T15:10:26.840Z (16:10:26 WAT)** on source commit `400447d18a3b4b6c1cf4e58732b1eec7588bb130`, with PublicNode Base Sepolia, official Lasna RPC and the recorded IPv4 Node options. [User-result provenance](deployments/evidence/v4/quote-6-user-observations.json) is separate from the independently collected quote-6 bundle. The result confirms processed retry before restore, authenticated Expired outcome, closed source/admission, idle unpaused scheduler, zero observed customer principal and six consumed lifetime admissions. The **scoped V4 controlled recovery item, including fresh user CLI reproduction, is COMPLETE**. Earlier reproduction-pending notes are historical and superseded.

Relayed internal-caller attribution, unique return-report mapping and browser-closure limits are unchanged; no protocol outage, untouched unattended execution or future-delivery guarantee is claimed. No new public transaction, deployment, funding or credit is needed for this verification. The immutable six-quote capacity is exhausted. **M2 remains OPEN** for final admission/journey review, actual browser/mobile and approval usability checks, and the demo/deployment availability decision; M3 has not started. This update changes evidence/acceptance documentation only. The prior implementation checkpoint's 204/204 tests remain its recorded result; no new test run or build is claimed here. The four-criterion self-assessment remains unchanged pending those reviews.


## M2 permission/admission/journey code review — 25 November 2026

The [item-by-item final review](docs/M2_FINAL_REVIEW.md) maps V4 actor/callback authentication, timestamp boundaries, exact custody, cancellation priority, repeated/delayed delivery, finite admission, bounded scheduling and reserved-refund recovery to current source and explicit V4 tests. The custody, escrow-permission, destination-policy and scheduler suites now instantiate both V3 and V4 rather than treating V3 coverage as V4 evidence. V4 fixtures open admission and reserve finite test credits; they remain isolated fixtures and are not new public transactions. The six genuine public outcomes and fresh user reproductions remain preserved.

A concrete frontend defect was fixed: complete original share-link terms now load when browser local storage is denied. A present malformed/empty fragment cannot silently fall back to cached terms, and changed terms remain rejected by the on-chain fingerprint check. There is no contract, ABI/interface, deployed-address, funding, quote or transaction change. A real wallet/browser connection was unavailable in this session, so browser/mobile visual checks and a fresh full approval/payment retest remain OPEN. The [safe next read-only checklist](docs/M2_FINAL_REVIEW.md) checks the exhausted-capacity message, disabled creation and terminal quote display without consuming or signing anything.

COMPLETE here means the scoped source/V4 regression review and code repair, not all M2 acceptance. The six-admission test deployment remains exhausted; demo/live-try-out capacity and final demonstrated browser acceptance need separate review. Current callback/authentication/funding assumptions were checked against official Omni primary documentation and recorded in the review. **M2 remains OPEN; M3 has not started.** Four equally weighted self-review scores remain Execution 4/5, Integration 4/5, Usefulness 3/5 and Craft 3/5 while the real browser/demo gates are unresolved. No external audit or adoption is claimed.

Validation for this review: `npm run build:contracts`, `npm run build:admission` and `npm run build:web` passed. The final `npm test` passed **245/245** with zero failures, skips or cancellations (148130 ms). Focused versioned custody/permissions checks passed 38/38, focused policy/scheduler checks passed 38/38, and terms/share-link checks passed 10/10. These counts include isolated fixtures; they do not add live transactions to the public evidence. The web bundle warning remains approximately 540 kB minified / 178 kB gzip. No current real-wallet/mobile visual pass is claimed.


## Desktop capacity browser check COMPLETE — 25 November 2026

Reviewed the user's 13.568-second, 1920×1020 recording at localhost:5174. The Create quote screen visibly reports lifetime usage **6 of 6**, active bookings **0 of 6**, zero remaining sponsored credits, and “This test deployment has used its quote allowance.” Scrolling to the form bottom shows the disabled Create share link control and unavailable pointer. [Media provenance and SHA-256](deployments/evidence/v4/desktop-capacity-browser-evidence.json) record the review; raw video is not committed. This is the requested desktop capacity-state observation, not a new transaction. Fields are blank, so no filled-form rejection was demonstrated. The wallet address, build commit and configured escrow are not visible in the clip; deployment context comes from the preceding launch configuration and separate RPC evidence.

This completes only that desktop visual item. Terminal quote-6 display, mobile/narrow-screen review, actual approval/payment retesting and demonstration availability remain OPEN. No signature, new quote, funding or deployment is required for the next read-only terminal-screen check. M2 remains OPEN and M3 has not started. No code changed and no additional test/build run is claimed; the previous 245/245 result remains its dated checkpoint evidence.


## Quote-6 terminal and emulated-mobile visual review — 25 November 2026

The user's full terminal screenshot and 24.333-second Chrome recording confirm quote 6 displays Expired and blocks payment, without payment/approval/policy-retry controls. The recording explicitly shows a **390 × 644 emulated viewport**, readable quote cards and navigation, wrapped title/addresses, stacked amount/terms sections, scheduler completion and expandable Contract details. No obvious horizontal clipping is visible in those screens. [Media provenance and SHA-256](deployments/evidence/v4/quote-6-terminal-mobile-browser-evidence.json) preserve the scope; raw media is not committed. COMPLETE here means the observed desktop terminal-state and emulated narrow-screen rendering checks, not physical-mobile wallet operation or complete browser compatibility. Copy-link visibility is observed; successful clipboard copying is not demonstrated.

The recording exposed a minor text defect: the expired summary said “Deposit due today.” The frontend now says “Deposit amount” for expired, terminal or deadline-passed quotes; payment controls and contract enforcement are unchanged. A post-repair visual confirmation is pending. No contract, address, funding or public transaction changed.

The same recording shows a MetaMask global-provider assignment error matching [MetaMask's own provider-injection source](https://github.com/MetaMask/providers/blob/main/src/initializeInpageProvider.ts), plus content-script listener/orphaned-stream warnings. Another wallet extension is a likely provider-conflict cause, but the exact extension and attribution of every warning are unproven. Settlio source does not assign window.ethereum. The next safe diagnostic is to leave only the chosen Settlio wallet extension enabled, refresh the page and review fresh console output, as [MetaMask's connection guidance](https://support.metamask.com/more-web3/dapps/i-cant-connect-metamask-extension-to-a-dapp-/) recommends. Do not uninstall wallets, disclose keys, create another quote or repeat transactions for this check.

M2 remains OPEN for a clean wallet-environment reproduction, remaining approval/payment journey checks, post-repair wording confirmation, physical/mobile-browser scope where required and demo/deployment availability after six lifetime admissions. The console is not labelled error-free. M3 has not started; the four equally weighted self-review scores remain unchanged. This update records user media and changes one display label. The earlier 245/245 tests remain dated prior evidence; no new full test run is claimed for this text-only repair.

Validation of the display-label repair: fresh `npm run build:web` passed (TypeScript and Vite). The existing approximately 540 kB minified-bundle warning persists. No new full test run or public transaction was performed for this wording-only change.
