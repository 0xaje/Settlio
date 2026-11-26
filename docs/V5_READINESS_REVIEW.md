# V5 readiness review and remaining M2 gates

25 November 2026. **No-spend consolidation review against main `06c266f`.**
**M2 remains formally OPEN.** V5 is **not publicly deployed, funded, or publicly verified**. No public transaction, key request, token spend, or deployment authorization is made by this review.

This document consolidates the current boundary between:
- verified V4 public evidence ([V4 acceptance](V4_ACCEPTANCE.md), [M2 final review](M2_FINAL_REVIEW.md)),
- local-only V5 engineering ([ledger](RENEWABLE_LEDGER_ACCEPTANCE.md), [escrow](RENEWABLE_ESCROW_ACCEPTANCE.md), [closure](RENEWABLE_CLOSURE_ACCEPTANCE.md), [cost review](RENEWABLE_COST_REVIEW.md), [timer](RENEWABLE_TIMER_ACCEPTANCE.md), [commitments](RENEWABLE_COMMITMENT_ACCEPTANCE.md), [reader](RENEWABLE_READER_ACCEPTANCE.md)), and
- remaining protocol, economic, operational, and browser gates before M2 can close or any future V5 public rollout could be considered.

---

## 1. Acceptance conditions already satisfied by V4 public evidence

On Base Sepolia (`84532`) and Reactive Lasna (`5318007`), the immutable V4 deployment (`SettlioEscrowV4`, `SettlioCallbackV4`, `SettlioReactiveV4`, `SettlioAdmission`) has genuine, independently verified public evidence and user Ubuntu CLI reproductions for six journeys ([CURRENT_STATUS.md](CURRENT_STATUS.md)):

| Condition | Verified V4 public evidence | Preserved qualifications |
|---|---|---|
| ETH automatic release | Quote 1 deposit, Reactive confirmation, CRON/callback release, both-chain closure ([bundle](../deployments/evidence/v4/quote-1-release-verified.json)) | Qualified browser-tab closure provenance; no unique retry attribution |
| USDC automatic release | Quote 2 issuer-USDC approval, deposit, confirmation, CRON/callback release, closure ([bundle](../deployments/evidence/v4/quote-2-release-verified.json)) | Release occurred while browser tab was open; not closed-tab evidence |
| ETH cancellation & same-asset refund | Quote 3 deposit, confirmation, eligible cancellation, CRON/refund, closure ([V4_ETH_REFUND.md](V4_ETH_REFUND.md)) | Browser closure not recorded |
| USDC cancellation & same-asset refund | Quote 4 deposit, confirmation, eligible cancellation, CRON/refund, closure ([V4_USDC_REFUND.md](V4_USDC_REFUND.md)) | Browser closure not recorded |
| Unpaid scheduled expiry | Quote 5 CRON/request/authenticated expiry, closed jobs, zero custody ([V4_UNPAID_EXPIRY.md](V4_UNPAID_EXPIRY.md)) | Qualified closure/reopening video; continuous closed interval not recorded |
| Controlled owner pause, retry, restore & expiry | Quote 6 owner pause, consumed participant retry, restore, CRON/request/authenticated expiry ([V4_CONTROLLED_RECOVERY.md](V4_CONTROLLED_RECOVERY.md)) | Controlled owner recovery, not an untouched unattended run or protocol outage; exact relayed retry caller not traced |
| Finite V4 admission exhaustion & zero residual principal | All 6/6 immutable lifetime admissions consumed, all 6 quotes terminal, zero customer principal held | Permanent cap by design; cannot be reset by more tokens or another wallet |
| Desktop capacity & terminal UI | 1920×1020 exhausted-capacity recording ([provenance](../deployments/evidence/v4/desktop-capacity-browser-evidence.json)); 390×644 Chrome emulation of terminal Quote 6 ([provenance](../deployments/evidence/v4/quote-6-terminal-mobile-browser-evidence.json)); **25 November 23:46 WAT desktop screenshots** confirm post-repair **"Deposit amount"** label on Quote 6 | Blank-form capacity check only; not physical-mobile wallet testing; clipboard copy and clean console reported working by user (no console screenshot attached) |
| Wallet extension conflict | Marked **FIXED AS REPORTED BY USER** after last recording | No independent clean-console recheck supplied |

**What V4 does NOT satisfy for M2 closure:** ongoing renewable admission/funding policy, strict uninterrupted both-session-closed unattended proof, physical-mobile wallet/approval retesting, and post-repair UI visual checks.

---

## 2. V5 conditions verified only locally

All V5 work lives separately under [`packages/contracts/renewable/`](../packages/contracts/renewable/) and [`script/`](../script/) and has been tested **only against isolated local Anvil chains and protocol fixtures**. Local fixtures never count as live Reactive integration evidence.

| V5 component / invariant | Local verification summary | Explicit boundary |
|---|---|---|
| Renewable work ledger ([`SettlioWorkLedger.sol`](../packages/contracts/renewable/SettlioWorkLedger.sol)) | Finite renewable grants, separate `active` vs `unsettled` work, monotonic merchant epochs, idempotent two-sided settlement, permanent job/epoch tombstones ([ledger acceptance](RENEWABLE_LEDGER_ACCEPTANCE.md)) | Enforces work counts, not monetary solvency; sponsor input is trusted |
| Renewable escrow ([`SettlioEscrowV5.sol`](../packages/contracts/renewable/SettlioEscrowV5.sol)) | Atomic grant consumption/rollback on creation, destination close on terminal state, refund claims bypass closed admission and retry exhaustion, failed-transfer rollback ([escrow acceptance](RENEWABLE_ESCROW_ACCEPTANCE.md)) | Tested with local V5 asset/escrow/closure suites; not connected to web ABI |
| Authenticated closure & recovery ([`SettlioCallbackV5.sol`](../packages/contracts/renewable/SettlioCallbackV5.sol), [`SettlioReactiveV5.sol`](../packages/contracts/renewable/SettlioReactiveV5.sol)) | Proxy/Reactive/domain/epoch/profile checks, 12 escrow + 1 ledger subscription, terminal tombstones, accepted acknowledgement removes autonomous CRON while Base holds backing until delivery, bounded 3+2×3=9 attempts ([closure acceptance](RENEWABLE_CLOSURE_ACCEPTANCE.md)) | Tested on isolated EVM with injected proxy/system fixture; not live Lasna/Base delivery |
| Adaptive timer & earliest-deadline heap | Min-heap with quote-ID tie-break, opt-in `Cron100` / `Cron1000` / `Cron10000` tiers, bounded 8-scan / 2-request ticks, 128-item queue tested ([timer acceptance](RENEWABLE_TIMER_ACCEPTANCE.md)) | Candidate thresholds (>6h, >30m, <=30m) are unapproved local defaults; coarse CRON untested live |
| Offline cost/duration inventory ([`renewable-cost-review.cjs`](../script/renewable-cost-review.cjs)) | Deterministic inventory of 48 archived receipts separating transaction envelopes from unknown `serviceChargeWei`; always-Cron100 sensitivity scenarios ([cost review](RENEWABLE_COST_REVIEW.md)) | Stale reference prices/cadence; hypothetical stress table, not a funding recommendation |
| Two-chain fee commitment guard ([`renewable-commitments.cjs`](../script/renewable-commitments.cjs)) | Independent source/destination reserves held until reconciled settlement; SHA-256 profile binding; revisioned atomic JSON journals + exclusive locks, two-process race tested ([commitment acceptance](RENEWABLE_COMMITMENT_ACCEPTANCE.md)) | Local sponsor guard using attested inputs; `canGrant: false`; no production journal |
| Read-only V5 reconciliation ([`renewable-reader.cjs`](../script/renewable-reader.cjs)) | Runtime/constructor/wiring checks, pinned resources, `finalized` contiguous history, 13 subscription checks, `CallbackRequest`/`getCallbacks` ordinal/delivery verification; missing reports/backlog retain holds ([reader acceptance](RENEWABLE_READER_ACCEPTANCE.md)) | Uses [`ReaderProtocolFixture.sol`](../test/fixtures/ReaderProtocolFixture.sol) on local Anvil chains; relies on trusted RPC completeness; `canGrant: false` |

**Recorded test/build baselines:**
- Last full V5 contract build (`npm run build:renewable`): passed for all 4 contracts below EVM limits at [`b3c9899`](https://github.com/0xaje/Settlio/commit/b3c9899) ([timer acceptance](RENEWABLE_TIMER_ACCEPTANCE.md)).
- Last full test suite (`npm test`): **313/313** passed before adding the 5th multi-callback ordinal reader test; expanded focused reader/accounting suite then passed **19/19** ([reader acceptance](RENEWABLE_READER_ACCEPTANCE.md)). No 314-test full run is claimed.

---

## 3. Native protocol compatibility checks (read-only observations & remaining items)

### Verified read-only public observations — 25 November 2026 (~22:09 UTC / 23:09 WAT)

Strictly read-only RPC queries against Base Sepolia (`https://base-sepolia-rpc.publicnode.com`, chain `84532`) and Reactive Lasna (`https://lasna-rpc.rnk.dev`, chain `5318007`) with **zero tokens spent and zero transactions sent** established:

| Check | Observed result | Implication for V5 |
|---|---|---|
| `Cron1000` & `Cron10000` on Lasna (`0x000...fffFfF`) | `Cron1000` at block `9249000` (tx `0x8fada85defdcc8b029d61a285ae45a665925187f75193cbac13b40eb5567cea8`) and `Cron10000` at block `9240000` (tx `0xca3e3de8b3a5811bef106f0ab39067a8064f8015b1d335b775822ff18534bd39`) both emit **`topics.length == 2`** and **`data == "0x"`** | Confirms live Lasna coarse CRON events match the indexed-`uint256` layout expected by [`SettlioReactiveV5.sol`](../packages/contracts/renewable/SettlioReactiveV5.sol) |
| `finalized` RPC tag support | Base Sepolia `latest` `63,613,245` / `finalized` `63,608,570` (4,675-block lag). Lasna `finalized` `9,249,141` (then `9,249,190` while `latest` read `9,249,189` in sequential calls) | Both chains support `finalized`; however, Lasna `finalized` tracks head closely and can appear 1 block ahead of `latest` across concurrent/sequential load-balanced RPC calls, which would trip `finalized <= latest` in [`renewable-reader.cjs`](../script/renewable-reader.cjs) |
| Service runtime hashes & fee parameters | Base `PROXY` (`0x476f44b11f5c942c58f4c8e3d0300e5710743585`): `keccak256` `0xe9180319ff981b2d5933544a0ae074e451a6e82a7e1da45c1452539e15338f52`, `_gasPriceCoeffPer1000() == 1100`, `_extraGas() == 80000`. Lasna `SYSTEM` (`0x8888888888888888888888888888888888888888`): `keccak256` `0xcd91126ed666997bcf1522fd3f502aea129c440b353b8a8f3aa73636938010ad`, `_gasPriceCoeffPer1000() == 1000`, `_extraGas() == 100000` | Concrete runtime hashes and current fee parameters are now observed for manifest pinning |
| `rnk_getFilters` schema | Returned PascalCase `["Version", "TopicFilters"]` with `8,021` filters | Consistent with the PascalCase wrapper already handled |
| `CallbackRequest` & `getCallbacks` | `CallbackRequest` (`0xef94dbc6...`) emitted 22 logs in 2,000 blocks (`topics.length == 4`, non-empty data). Sample `getCallbacks(0xdabfe999...)` returned an empty array (`0x...20` + `0x...00`) | Matches earlier V4 observations: `getCallbacks` can be empty for `CallbackRequest` txs, which would keep [`renewable-reader.cjs`](../script/renewable-reader.cjs) holds in `pending` unless populated for V5 or reconciled by an approved destination-delivery proof |

### Compatibility items still remaining

1. **Populated `getCallbacks` tuple layout:** Because the sampled `CallbackRequest` returned an empty `getCallbacks` array, the exact 6-field tuple encoding and zero-based ordinal mapping of a *non-empty* live `getCallbacks` return report remain unverified on public Lasna.
2. **Lasna `finalized <= latest` race handling:** `renewable-reader.cjs` should be reviewed for fast-advancing/load-balanced Lasna `finalized` vs `latest` skew (see [candidate operating profile & reader hardening spec](V5_OPERATING_PROFILE_SPEC.md)).
3. **13-subscription dynamic CRON switching:** Live `rnk_getFilters` tracking across `Cron100` / `Cron1000` / `Cron10000` transitions has not been observed on a deployed V5 contract.

---

## 4. Economic assumptions and operating profiles remaining unapproved

No production V5 profile has been approved. The following parameters and economic gaps remain open:

1. **Unapproved operating profile parameters:**
   - Maximum active jobs, maximum global unsettled work bound, and per-merchant grant batch size.
   - Supported quote horizons (e.g., 24-hour vs 7-day vs test 900-second ceiling) and adaptive timer transition thresholds (currently candidate `> 6h` / `> 30m` / `<= 30m`).
   - Maximum gas price / base-fee caps, fee coefficient/surcharge drift bounds, observation freshness max-age, and contingency buffers.
2. **Missing full-obligation cost model:**
   - [`renewable-cost-review.cjs`](../script/renewable-cost-review.cjs) explicitly reports `serviceChargeWei: null` for all 48 archived receipts because envelope gas (`gasUsed × effectiveGasPrice`) does not measure Reactive application service charges.
   - The 24h (`326.2` REACT) and 7d (`2,282.4` REACT) stress numbers are an **always-Cron100 worst-case baseline**, not an adaptive-timer forecast or normal-booking cost model.
   - Total per-quote obligation must budget: origin observation, confirmation callback, policy/expiry/release/refund callbacks, closure acknowledgement + up to 2 finite recovery cycles (9 attempts / 3 accepted deliveries), plus residual historical event processing.
3. **Non-transferability of V4 reserves:**
   - V4's dated prepaid balance (`248.1593678` test REACT observed `2026-11-25T15:53:38.420Z`) is fee credit bound to the V4 Reactive contract and cannot be assumed withdrawable or transferable to V5.
4. **Commercial / fee-responsibility model:**
   - Platform-sponsored finite batches are proposed for initial operation ([OPERATING_MODEL_PROPOSAL.md](OPERATING_MODEL_PROPOSAL.md)); long-term merchant fee credits or pricing remain unapproved.

---

## 5. Issuer/signing, persistence, availability, and recovery requirements remaining

1. **Public signing / grant-issuance execution path:** [`renewable-commitments.cjs`](../script/renewable-commitments.cjs) and [`renewable-reader.cjs`](../script/renewable-reader.cjs) intentionally have `canGrant: false`. [`renewable-issuer.cjs`](../script/renewable-issuer.cjs) enforces `localOnly: true`, loopback-only URLs, `web3_clientVersion` matching `anvil/`, chain-ID/genesis/head match between `signer.provider` and `base`, sponsor address match, full `GrantSet` event verification (merchant, epoch, issued credits, expiry, profile, observation commitment) across partial consumption, and hold preservation on unavailable receipts—on isolated local Anvil chains only. Public signing still requires a separately authorized operator/key-prompt flow.
2. **History scan scaling (incremental checkpointing):** `renewable-reader.cjs` scans complete contiguous history from constructor receipts with a bounded page limit. Any deployment exceeding that scan bound will fail closed until a separately reviewed, trusted incremental checkpoint importer is built.
3. **Unknown external grant handling:** Direct on-chain grants or unsupported revocation paths outside the local journal cause `reconciliationCommands` to halt rather than silently releasing holds.
4. **Persistence & availability:** `renewable-commitments.cjs` uses single-host filesystem locks (`renewable-commitments.local.json`). Multi-host or HA operation would require a single authoritative coordinator or distributed transactional store, plus an explicit migration procedure for profile/identity changes that preserves all outstanding holds.
5. **Exhausted acknowledgement recovery policy:** After 9 cumulative source acknowledgement attempts (3 initial + 2 participant recovery signals), `SettlioReactiveV5` sets `needsAttention` and stops CRON. Base work capacity remains reserved (`unsettled`) until an authenticated closure arrives; an operator/evidence-backed reconciliation runbook is still needed for permanently lost cross-chain messages.
6. **Remaining M2 UI & browser gates:**
   - Physical-mobile browser/wallet usability and actual wallet approval/payment retest (blocked on V4 by 6/6 exhaustion; requires either local Anvil UI testing or a separately authorized future deployment).
   - Continuous browser-closed automation interval recording.
   - *(Completed/cleared 25 November 23:46 WAT: desktop Quote 6 screenshots confirm post-repair `"Deposit amount"` label; user-reported clipboard copy and clean console working well without separate console screenshot.)*

---

## 6. Minimum future public evidence needed (if separately authorized)

**No public deployment, funding, or transaction is authorized today.** If the user later authorizes a V5 deployment after resolving compatibility and profile economics, the minimum non-redundant public evidence required would be:

1. **Read-only live preflight pass:** Verified Lasna/Base `finalized` tag support, live `Cron1000`/`Cron10000` event shape (if adaptive mode is selected), `getCallbacks` report schema, and service runtime hashes—**zero tokens spent**.
2. **Single versioned V5 deployment & verification:** Verified creation/configuration receipts, runtime hashes, 13 active origin subscriptions, initial CRON idle state, and separate source/destination fee balances.
3. **Minimum V5 renewable-loop trace (1–2 quotes max, no repetition of all 6 V4 journeys):**
   - One grant issuance → quote creation → genuine origin/CRON/callback lifecycle → **authenticated `SourceAcknowledged` closure & `Settled` ledger event** → `renewable-reader.cjs` reconciliation freeing the held allowance and permitting a subsequent renewable grant/quote.
   - If adaptive timers are enabled, one observed tier transition or coarse tick in public logs.
   - Strictly timed **browser-sessions-closed** interval capture covering the unattended automated transition, plus mobile/desktop post-repair UI confirmation.

---

## 7. What can be completed now without spending tokens

All of the following engineering and verification work requires **zero test tokens and zero public transactions**:

1. **Live read-only native protocol checks:** Run read-only RPC queries against public Base Sepolia and Lasna endpoints (when reachable) to inspect `finalized` tag support, `Cron1000`/`Cron10000` historical logs, `rnk_getFilters`, `getCallbacks` on historical V4/system transactions, and proxy/system runtime hashes.
2. **Full-obligation cost model & candidate profile spec:** Define concrete 24h and 7d candidate profiles with explicit gas/price caps, acknowledgement allowances, and contingency buffers, and verify them against `renewable-commitments.cjs`.
3. **Incremental checkpoint design & local tests:** Design and locally test a trusted checkpoint importer for `renewable-reader.cjs` so long-lived deployments do not hit bounded full-history scan limits.
4. **Dry-run issuer orchestrator (local Anvil only):** Build and test the end-to-end command pipeline (`reader` → `commitments` → intent reservation → local Anvil signer → receipt confirmation → reconciliation) without live keys.
5. **Localhost UI / M2 browser checks (read-only on V4, interactive on local Anvil):**
   - Verify the `"Deposit amount"` label fix, clipboard copy, and clean console on `localhost:5174` against read-only V4 Quote 6 without signing or creating quotes.
   - Exercise V5 UI/wallet flows (if/when M3 work is authorized) against local Anvil chains.
