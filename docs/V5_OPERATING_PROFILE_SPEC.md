# V5 candidate operating profile and reader hardening specification

25 November 2026. **Candidate engineering specification only — NOT approved production settings, deployed code, or spending authorization.**
Grounded in [`renewable-commitments.cjs`](../script/renewable-commitments.cjs), [`renewable-reader.cjs`](../script/renewable-reader.cjs), [`SettlioReactiveV5.sol`](../packages/contracts/renewable/SettlioReactiveV5.sol), and the read-only Base/Lasna observations in [V5 readiness review](V5_READINESS_REVIEW.md).

---

## 1. Candidate full-obligation operating profile

[`renewable-commitments.cjs`](../script/renewable-commitments.cjs) binds every sponsor reserve check to a canonical SHA-256 `profileHash` over `identity` and `profile`. Below are the exact schema fields, observed live protocol constants, and candidate horizon parameters for future review:

| Field | Candidate 24h profile | Candidate 7d profile | Source / rationale |
|---|---|---|---|
| `maxHorizonSeconds` | `"86400"` (24 hours) | `"604800"` (7 days) | Realistic booking horizons beyond the V4 `900`s test cap |
| `maxWork` | `"6"` (or `"12"` after review) | `"6"` (or `"12"` after review) | Bounds `reserved + unsettled` global work in [`SettlioWorkLedger.sol`](../packages/contracts/renewable/SettlioWorkLedger.sol) |
| `maxGrantSeconds` | `"86400"` | `"604800"` | Unused grant expiry; independent of already-admitted quotes |
| `maxObservationAgeSeconds` | `"120"` | `"120"` | Maximum allowed by `validateProfile` (`<= 120`) |
| `maxHeadAgeSeconds` | `"180"` | `"180"` | Maximum allowed by `validateProfile` (`<= 180`) |
| `adaptiveTimers` | `true` | `true` | Uses verified indexed `Cron10000` (>6h), `Cron1000` (>30m–6h), `Cron100` (<=30m) |
| `sourceCoefficient` | `"1000"` | `"1000"` | Observed live `SYSTEM._gasPriceCoeffPer1000()` on Lasna (`22:09 UTC`) |
| `sourceSurcharge` | `"100000"` | `"100000"` | Observed live `SYSTEM._extraGas()` on Lasna (`22:09 UTC`) |
| `destinationCoefficient` | `"1100"` | `"1100"` | Observed live `PROXY._gasPriceCoeffPer1000()` on Base (`22:09 UTC`) |
| `destinationSurcharge` | `"80000"` | `"80000"` | Observed live `PROXY._extraGas()` on Base (`22:09 UTC`) |
| `sourcePriceCapWei` / `destinationPriceCapWei` | Pending explicit price cap | Pending explicit price cap | Must be pinned above current base fee with margin; drift above cap halts new grants |
| `sourceAllowanceWei` / `destinationAllowanceWei` | Derived from full-obligation formula below | Derived from full-obligation formula below | **Must not reuse always-Cron100 stress table** |
| `sourceBufferWei` / `destinationBufferWei` | Explicit shared buffer >= 1 worst-case job | Explicit shared buffer >= 1 worst-case job | Absorbs shared CRON ticks and residual historical logs |

### Full-obligation per-quote budget components (must all be summed)

1. **Source (`Lasna` REACT) per-quote obligation:**
   - **Origin ingestion:** `WorkRegistered` + `PolicyRegistered` + `DepositReceived` + `BookingConfirmed` + `CancellationRequested` (optional) + terminal (`Released`/`QuoteExpired`/`Refunded`) + `Settled` + up to 2 participant retry/recovery signals.
   - **Policy & confirmation callbacks:** Up to `MAX_ATTEMPTS = 6` policy callback requests + confirmation request.
   - **Closure & recovery:** Up to `9` cumulative acknowledgement attempts (`3` initial + `2 × 3` finite recovery signals, [`RENEWABLE_CLOSURE_ACCEPTANCE.md`](RENEWABLE_CLOSURE_ACCEPTANCE.md)).
   - **Shared adaptive CRON ticks:** One shared subscription across active jobs (`Cron10000` while earliest deadline > 6h, `Cron1000` while > 30m and <= 6h, `Cron100` while <= 30m). Note: one short-horizon quote pulls the shared timer to `Cron100` for all concurrent jobs.
2. **Destination (`Base Sepolia` ETH) per-quote obligation:**
   - **Callback gas limit:** `CALLBACK_GAS_LIMIT = 1_000_000` per delivered callback (`PROXY` bills `(gasUsed + _extraGas) * gasPrice * _gasPriceCoeffPer1000 / 1000`).
   - **Deliveries:** Confirmation (`1`) + policy/expiry/release/refund (`1` + retry margin) + up to `3` accepted closure acknowledgement deliveries.

*Why numeric wei allowances remain pending:* Archived V4 receipts record `serviceChargeWei: null` ([cost review](RENEWABLE_COST_REVIEW.md)), so per-invocation Reactive service charges must be measured or explicitly bounded with a conservative multiplier before pinning `sourceAllowanceWei` and `destinationAllowanceWei`.

---

## 2. Reader hardening: Lasna `finalized > latest` skew

Live read-only checks at `22:09 UTC` on `https://lasna-rpc.rnk.dev` observed `latest = 9,249,189` and `finalized = 9,249,190` in sequential calls, because Lasna `finalized` tracks head closely and can advance by 1 block between concurrent `Promise.all` RPC calls.

**Current code ([`renewable-reader.cjs`](../script/renewable-reader.cjs#L48-L51)):**
- Fetches `latest` and `finalized` in `Promise.all(...)` and asserts `BigInt(finalized[chain].number) <= BigInt(heads[chain].number)`.
- Under a 1-block advancement between the two responses, this throws `'Unstable finalized checkpoint'` even on a healthy node.

**Implemented & locally verified (25 November 2026) in [`renewable-reader.cjs`](../script/renewable-reader.cjs#L48-L51):**
1. Queries `eth_getBlockByNumber('finalized', false)` **before** `eth_getBlockByNumber('latest', false)` on each chain (Base and Source in parallel), preserving `rawLatest` (`bh`/`sh`) for gas-price base-fee comparisons.
2. If `BigInt(f.number) > BigInt(l.number)`, performs **at most 1 re-fetch** of `latest` rather than silently downgrading `finalized` to `latest`, and still fails closed with `'Unstable finalized checkpoint'` if skew persists.
3. Regression coverage in [`test/renewable-reader.test.cjs`](../test/renewable-reader.test.cjs) verifies both 1-block transient skew recovery (`latestCalls === 2`, `canGrant === false`) and persistent skew rejection (`Unstable finalized checkpoint`). Targeted suite `node --test test/renewable-reader.test.cjs test/renewable-commitments.test.cjs` passed **19/19** (144.48s).

---

## 3. Incremental checkpointing design for `renewable-reader.cjs`

Currently, `renewable-reader.cjs` scans all contiguous logs from `baseCreationHash` / `sourceCreationHash` up to `finalized`, bounded by `pageSize <= 2000` and `maxPages <= 1000`. On Base Sepolia (~2s blocks), `2,000,000` blocks is ~46 days, and RPC `eth_getLogs` windows may be smaller in practice.

**Implemented & locally verified (25 November 2026) in [`renewable-reader.cjs`](../script/renewable-reader.cjs):**
1. **Signed/bound checkpoint output & input (`settlio-renewable-checkpoint/v1`):** `collect` returns `checkpoint` containing pinned `base`/`source` finalized blocks, `open`, `grants`, `jobs`, `unresolvedOrigins`, `unresolvedRequests`, `successfulClosure`, and `checkpointHash` bound to `identity`, `profileHash`, and `manifestHash`.
2. **Continuity & anti-reorg verification:** When `previousCheckpoint` is passed, `collect` verifies schema, identity/profile/manifest match, `checkpointHash`, creation/finalized bounds, and live canonical block hashes for both `previousCheckpoint.base` and `previousCheckpoint.source` before scanning `[prev + 1, finalized]`.
3. **Regression coverage:** [`test/renewable-reader.test.cjs`](../test/renewable-reader.test.cjs) verifies incremental resumption where a full scan exceeds `maxPages=1, pageSize=5` while incremental resume reconciles and releases held backing, and verifies tampered `checkpointHash` and reorged block hashes fail closed. Targeted suite `node --test test/renewable-reader.test.cjs test/renewable-commitments.test.cjs` passed **20/20** (175.70s).

---

## 4. Verification required before implementation sign-off

When implemented in an environment with `node_modules` installed (no tokens spent):
1. `node --test test/renewable-reader.test.cjs test/renewable-commitments.test.cjs` (including new Lasna `finalized`-skew and incremental-checkpoint tests).
2. `npm test` (full regression) and `npm run build:renewable`.
