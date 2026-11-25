# Settlio continuation handoff

## Authenticated V5 closure protocol — 25 November 2026

[Closure acceptance](RENEWABLE_CLOSURE_ACCEPTANCE.md): actual V5 receiver and Reactive closure path are implemented locally with proxy/source/domain/epoch/profile checks, terminal tombstones and finite recovery. Accepted acknowledgement requests leave autonomous source work; Base keeps backing reserved until actual delivery. Final `npm test`: 287/287 passed, zero failures/skips/cancellations; `npm run build:renewable` passed for all four contracts. These are isolated local fixtures, not new public integration evidence. No V4/public deployment, funding or frontend change. M2 remains OPEN. Next: read-only renewable fee/admission reconciliation and horizon review, including acknowledgement costs; no token spend or deployment preparation authorized.

## Local renewable escrow integration — 25 November 2026

[Escrow acceptance](RENEWABLE_ESCROW_ACCEPTANCE.md): separate V5 escrow now consumes ledger grants atomically and closes active capacity only with successful terminal transitions. Refund claims bypass closed admission/retry exhaustion; missing source acknowledgement retains work capacity, not customer principal. Final `npm test`: 272/272 passed, zero failures/skips/cancellations; new ledger/escrow compilation and size checks passed. These are isolated local checks, not new public evidence. V4 source/deployment, web ABI and six proofs remain unchanged. M2 stays open. Next: authenticated versioned receiver and source closure with bounded acknowledgement recovery; economics and production settings remain pending. No deployment or spending authorized.

## Operating-model proposal prepared — 25 November 2026

[Ongoing admission and funding proposal](OPERATING_MODEL_PROPOSAL.md) is ready for review. Recommended direction: renewable sponsored finite batches with bounded unsettled cross-chain work; no permanent six-booking product cap. This is proposed design only. Exact quotas, duration profiles and pricing remain undecided; no contracts, operating commands or deployment permissions changed. M2 remains open and replacement deployment preparation remains cancelled. Next: user policy review before implementation.

Updated 25 November 2026. Read [CURRENT_STATUS.md](CURRENT_STATUS.md) first, then [AGENTS.md](../AGENTS.md), [SETTLIO_MASTER_PLAN.md](../SETTLIO_MASTER_PLAN.md), [V4 acceptance](V4_ACCEPTANCE.md), and relevant source/evidence. Work in public repository **0xaje/Settlio**, directly on **main**. Baseline reviewed for this handoff: `73dc15b8d1fa5fd62b9131a7f131d2aa04264fd6`; check actual current main before editing. Do not reset to that SHA if newer work exists.

## Start prompt for Antigravity or a new chat

```text
You are continuing Settlio in 0xaje/Settlio, not starting a new project.
Read AGENTS.md, docs/CURRENT_STATUS.md, docs/HANDOFF.md,
SETTLIO_MASTER_PLAN.md and the latest acceptance/progress records before working.
The master plan is the implementation source of truth; the latest explicit user
instructions supersede older historical entries. Preserve work directly on main.

M1 is accepted. Six scoped V4 M2 public flows and user CLI reproductions are proven.
M2 formal acceptance is still open; M3 full UI and M4 release are not complete.
The current deployment has used all SIX IMMUTABLE LIFETIME quote slots.
It still had substantial prepaid fee reserves at the recorded observation.
More tokens, a new wallet or a renewed grant cannot reset its lifetime counter.

The user CANCELLED fresh deployment preparation and has NO authorization open
for public deployment, funding, grants, new paid tests or token transfers.
Do not ask for keys or suggest sending more test tokens to proceed.
Do not repeat successful public tests merely to make another video.

First task: inspect current code/evidence and write a NO-SPEND operating-model
proposal using docs/HANDOFF.md's Next task acceptance conditions. Present options,
cost assumptions and tradeoffs before changing contracts or operation policy.
Do not silently close M2, waive original evidence conditions or begin M3/M4.

Keep the approved six-screen green/orange design, Georgia headings and Inter UI.
Do not replace it with another dashboard or fabricate metrics/bookings/transactions.
Keep customer principal separate from all automation funding.
Local fixtures are allowed for explicit adversarial tests, never as live evidence.

Check git status and actual main first; preserve existing changes. No branches,
PRs, force-push, history rewrite, journal deletion or nonce replacement.
Use coherent grouped commits and report exact checks, evidence and limitations.
If a file, tool, recording or credential is unavailable, say so rather than invent it.
```

## Next task

**Prepare a proposal, not a new deployment.** The user wants a usable product, not a service that permanently stops after six quotes. Do all useful analysis without another public transaction.

Acceptance conditions for that proposal:

1. Inspect `SettlioAdmission.sol`, `SettlioEscrowV4.sol`, `SettlioReactiveV4.sol` under [admission contracts](../packages/contracts/admission), [admission-budget.cjs](../script/admission-budget.cjs), and existing public evidence. Explain current active/reserved versus immutable lifetime accounting and why the old deployment cannot simply be reset.
2. Identify who pays automation fees, how a merchant receives bounded admission and how funding is checked without touching customer principal. Separate user needs, current verified behaviour, proposals and unresolved assumptions.
3. Compare a renewable/concurrency-based approach with finite sponsored batches. Neither may promise unlimited work without funding. Address replay, abandoned jobs, retries, failed delivery, sponsor misuse and price changes. Do not pretend Base can directly prove a Lasna reserve balance without a defined cross-chain mechanism or attestation trust assumption.
4. Address realistic service quote durations. The 900-second horizon was chosen for test expenditure; longer horizons need an explicit scheduling and cost design.
5. Use recorded receipts to analyse observed execution cost where possible. Report which fees are measured and which are modeled; a worst-case reserve forecast is not the normal booking price. Do not assume old prepaid reserves can be withdrawn/transferred. Cite current official Omni sources for protocol facts and timestamp any fresh read-only observations.
6. Preserve old addresses, proofs and journals. Explain any future migration/deployment requirement and what would remain unchanged. A code proposal cannot upgrade immutable deployed contracts.
7. Produce explicit recommendations, tradeoffs and acceptance tests. Keep proposed deployment/funding as a later concrete user decision, not an automatic follow-up to this handoff.
8. State the M2 acceptance boundary clearly: six public policy flows are verified, while the original strict browser-evidence qualifications are not silently waived. Full six-screen UI is M3; final submission video is M4. Do not create more proof transactions merely because stage tracking was previously confusing.

Stop after presenting the proposal for review unless the user gives another clearly scoped instruction. This stopping point concerns a new operating-policy decision, not routine permission to read code or fix documentation.

## Current evidence and source map

[CURRENT_STATUS.md](CURRENT_STATUS.md) contains addresses, six proof links, dated checks, current constraints and evidence limits. Key implementation:

| Area | Files |
|---|---|
| V4 contracts | [Admission](../packages/contracts/admission/SettlioAdmission.sol), [Escrow](../packages/contracts/admission/SettlioEscrowV4.sol), [Reactive](../packages/contracts/admission/SettlioReactiveV4.sol), [Callback](../packages/contracts/admission/SettlioCallbackV4.sol) |
| Deployment, saved intent and fee tools | [V4 operations](V4_OPERATIONS.md), [state](../script/v4-state.cjs), [deployment](../script/v4-deploy.cjs), [budget](../script/admission-budget.cjs) |
| Frontend | [main.tsx](../apps/web/src/main.tsx), [terms](../apps/web/src/terms.ts), [admission reader](../apps/web/src/admission.ts), [approval guard](../apps/web/src/approval.ts), [wallet](../apps/web/src/wallet.ts), [style](../apps/web/src/style.css) |
| Acceptance | [M1](M1_ACCEPTANCE.md), [current V4](V4_ACCEPTANCE.md), [M2 historical ledger](M2_ACCEPTANCE.md), [final source review](M2_FINAL_REVIEW.md) |
| Public proof and metadata | [V4 evidence directory](../deployments/evidence/v4), [on-chain ledger](../ONCHAIN-EVIDENCE.md) |
| Historical narrative | [progress](PROGRESS.md), [old README](../README_HISTORY.md); not new test results or the latest authority |

Existing V3 and M1 deployments have their own proof and journal identities. Never pass a fake V3 journal to validate V4. Never replace old quote fingerprints or weaken a strict historical counter check just because a later quote changed current state. Initial V4 code was separate from the verified V3 contracts; no new source contract version is deployed by this handoff.

## Environment and safe commands

User's checkout: WSL Ubuntu-22.04, account `oyeolorun`, path `~/Settlio`. An unrelated WSL distribution/account may not contain it. From Windows PowerShell the previously working entry is `wsl -d Ubuntu-22.04`. Antigravity should open the actual checkout rather than create a disconnected copy. Inspect `git status`, `git branch --show-current` and `git log -1` before any pull or edit. Use `git pull --ff-only origin main` only while preserving local work; never force/reset around a conflict.

Node >=22.18 is specified in package.json. Dependencies include ethers, React, TypeScript, Vite, solc 0.8.29 and local Foundry packages. For an installed checkout use:

```sh
npm run build:contracts
npm run build:admission
npm run build:web
npm test
```

These compile/run isolated local checks, not public transactions. If dependencies are absent, inspect the lockfile and pinned Reactive setup before `npm ci` / `npm run setup:reactive`; do not reinstall blindly or repeatedly run a full suite without relevant changes. Report failures and actual counts. Never run `deploy:*`, `fund:*`, `grant:*`, `open:*`, `renew:*`, `window:*`, `pause:*` or `resume:*` as setup or health checks.

Explicit archived public-evidence replays (no RPC, signer or new success snapshot):

```sh
npm run verify:release:v4 -- 1 --recorded
npm run verify:release:v4 -- 2 --recorded
npm run verify:refund:v4 -- 3 --recorded
npm run verify:refund:v4 -- 4 --recorded
npm run verify:expiry:v4 -- --recorded
npm run verify:recovery:v4 -- --recorded
```

Label these **recorded evidence replay**, not fresh public observations. Earlier quote verifiers' current counters may correctly reject fresh reruns now that lifetime consumption is six. Do not erase the archived files or loosen checks to hide that. Fresh `verify:recovery:v4` is read-only on-chain but writes a successful local public snapshot; preserve evidence and label its time if explicitly needed.

A working user RPC environment was:

```sh
NODE_OPTIONS="--dns-result-order=ipv4first --no-network-family-autoselection"
BASE_SEPOLIA_RPC=https://base-sepolia-rpc.publicnode.com
LASNA_RPC=https://lasna-rpc.rnk.dev
```

Assign or export those variables for the command being run. The official Base endpoint previously failed the user's eth_getLogs path; PublicNode succeeded. Do not turn a timeout into proof a transaction failed. A stale hash or missing receipt remains unknown. Ethers in this assistant workspace required a Python HTTPS transport for some independent raw-RPC collections; the user's native Ubuntu verifiers passed separately.

To inspect the existing frontend, keep any existing server open and use its displayed URL. For a new server:

```sh
VITE_ESCROW_ADDRESS=0x5675C610d6f0aCe9f7933f3584D53dc4F567Dc6B \\
VITE_BASE_SEPOLIA_RPC=https://base-sepolia-rpc.publicnode.com \\
VITE_LASNA_RPC=https://lasna-rpc.rnk.dev \\
npm run dev -- --port 5174 --strictPort
```

A used port may be another existing server; inspect it instead of killing unrelated processes. Public quote reads need no wallet signature. Test network identity before any wallet action. Localhost operation is not a verified public hosted release.

## Non-negotiable continuation rules

- Remain on main in 0xaje/Settlio; inspect remote and local work, preserve history and secrets. No force pushes, branches or pull requests.
- Finish one milestone before the next. Never inflate the completed scope or erase an earlier failure without its later dated correction.
- Preserve green/orange, Georgia/Inter and the approved six-screen hierarchy. Use live or genuinely archived data with honest labels; no fake product statistics or booking outcomes.
- No keys, seed phrases or raw signed transactions in chat, repository, frontend VITE variables or handoff. A future authorized signing operation must use the user's hidden local prompt, never an assistant-held wallet.
- The existing V4 journal is local `deployments/testnet-v4.json`; M1/V3 journals and locks have separate purposes. Missing local journal means unavailable, not permission to recreate or overwrite. Do not remove locks or replace nonces casually.
- Preserve customer principal, per-asset exact accounting and refund reservations. Automation charges are separate. Native Base timestamps and destination state remain authoritative.
- Use current official Omni documentation before integration changes: [contracts](https://dev.reactive.network/reactive-contracts), [callbacks](https://dev.reactive.network/callback-contracts), [economy](https://dev.reactive.network/economy), [networks](https://dev.reactive.network/origins-and-destinations).
- A new chat/IDE does not automatically inherit recordings, local journals, wallet access, remote permissions or this conversation. Public metadata includes media provenance/hashes; raw videos are not in Git. Say what is unavailable. Ask for the exact missing reference only if needed; do not redesign from memory.
- User instruction has priority over agent/skill defaults. No unsolicited public transactions, spending, deployment, fresh proof reruns or automatic funding. Avoid tiny per-step commits and endless repeated screenshots; group coherent reviewed work.

## Report format

State what changed, exact commands/checks actually run, evidence, weaknesses, pending decisions and next action. Give equally weighted Execution/Integration/Usefulness/Craft assessment when reviewing a milestone; the current 70/100 is a dated self-assessment, not an external score or a progress percentage. Docs-only changes need link/status validation, not invented new contract/browser test passes. Report an Antigravity “done” claim as unverified until its source and checks are reviewed.


## Handoff checkpoint validation — 25 November 2026

The six documented archived CLI commands were run successfully in explicit recorded/no-fresh-RPC mode: release quotes 1/2, refund quotes 3/4, expiry quote 5 and recovery quote 6. Outcomes were Released, Released, Refunded, Refunded, Expired and Expired. New README/current-status/handoff relative links were checked against repository paths; command names were checked against package.json. The complete previous README and M2 ledger text were preserved in their stated historical locations. No public RPC observation, transaction, build or new full regression run is claimed by these documentation checks.

To conserve context and credits, begin with the concise status and current headers. Search relevant master-plan amendments and source with `rg`; do not dump every historical log/large proof bundle into a new chat. Inspect actual proof fields/source as needed, and do not skip a relevant later decision merely to save tokens.
