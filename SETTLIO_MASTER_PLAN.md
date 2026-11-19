# Settlio master build plan
Version 2.0 · 19 November 2026

## Authority and status
This Markdown plan is the current implementation source of truth. It carries forward the original plan and replaces the conflicting decisions listed below. The original Word/PDF planning exports describe version 1 and require regeneration before being treated as current.
Repository inspection on 19 November returned an empty repository. Contract implementation is active. Three contracts compile with 21 passing local tests. The initial frontend builds and was checked in a local desktop browser. No public deployment, live callback loop, or earned judging score is verified.

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
This amendment supersedes the native-ETH-only engineering default. The user requires customer payment selection among ETH, USDC and USDT. Implementation is pending within M1; do not deploy the old ETH-only contracts as the completed payment upgrade.

Acceptance conditions:
- Customer can select among merchant-authorised asset/amount options before depositing. A single fixed-asset quote is not sufficient to claim this requirement is met.
- Quote terms bind the allowed token addresses and exact amounts. No implicit 1:1 conversion between ETH and stablecoins, and no unapproved price-oracle dependency.
- The first successful authorised deposit locks the selected asset and amount; all later payment attempts fail.
- Refund and release return the deposited asset and amount. Liabilities are accounted separately per asset and cannot fund automation.
- Token deposits require exact receipt, safe token transfers, correct decimals, bounded approvals, permission checks, reentrancy protection and failure rollback.
- Verify official deployment provenance and obtain genuine testnet integration evidence for each advertised asset. USDT on Base Sepolia is not yet verified; do not relabel an arbitrary test token as official USDT.
- Update shared terms, frontend, ABI, deployment scripts and regression tests together before deployment. Existing 21 test passes cover the prior ETH-only implementation, not this upgrade.

## Milestones and acceptance gates
M0 foundation and execution policy is complete for local implementation. Deliver AGENTS.md, this plan, licence, an honest README, environment check, and a recorded payment-policy decision. Policy defaults, local compiler, Anvil runtime, and current Omni source interfaces are checked. Deployment preparation continues within M1.
M1 quote and deposit to booking is active. Escrow, subscriber, and callback receiver compile and 21 local tests pass. Initial merchant/customer UI typechecks and builds, with limited desktop browser verification. Live read-only network preflight passed. Deployment and full live UI/callback evidence remain pending. Real Base Sepolia quote, second-wallet payment, Lasna processing, authenticated callback, correct UI states, and verified full-loop evidence.
M2 unattended policies. Scheduled unpaid expiry, authenticated eligible cancellation/refund, merchant release, custody accounting, repeated delivery, deadline races, and recovery all verified.
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
