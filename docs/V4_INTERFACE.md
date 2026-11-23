# V4 functional interface checkpoint

Status: IMPLEMENTED / FRONTEND BUILD AND CONTRACT-BACKED HELPER TESTS PASS / BROWSER AND PUBLIC V4 JOURNEYS PENDING. M2 remains open.

## Implemented behavior

- Versions 0 (legacy missing selector), 3 and 4 are distinguished; transport failures do not become legacy capability. Escrow and scheduler policy versions must match. V4 additionally validates its Base admission contract and escrow/sponsor binding.
- Version 4 shared terms explicitly bind version and automatic-release consent. A version 3 or legacy fingerprint cannot be accepted as a version 4 quote, even if other recorded fields are copied. Existing version 1/2/3 serialization and recorded fingerprints remain unchanged.
- Merchant quote creation displays actual open/paused state, wallet allowance/expiry, active/lifetime counts and deadline horizon. Unknown/failed reads disable creation; numbers are never replaced with invented zeroes. A fresh Base admission read checks limits immediately before the wallet transaction is prepared.
- Reserved credits convert to an active quote; the interface does not incorrectly treat a full reservation pool as unavailable to a merchant who already owns one of those credits.
- V4 policy retries show shared allowance/cooldown. Missing/failed status or exhaustion disables the retry button. The handler rereads status before sending. Cancellation is independent of that allowance.
- Customer-only Claim reserved refund appears only on V4 RefundPending quotes. Its handler rechecks current Base quote/customer/version and sends the existing guarded claimRefund method. It does not depend on admission reads or a successful Lasna status query. Current source/RPC failure remains unknown rather than a fake automation success.
- Existing quote payment, cancellation, release, receipt recovery, ETH/USDC choices and disabled USDT remain supported. The configured escrow is not changed, old share links are not migrated and public V3 contracts are not patched.

Admission reads pin getters/code to one Base block, recheck its hash, enforce network/version/binding and consistency, and reject stale or implausibly future block timestamps. Status polls every ten seconds; contract timestamps and permissions remain authoritative. Available capacity does not promise future fee affordability.

## Actual validation

- npm run build:web passed TypeScript and production Vite build (174 transformed modules).
- Final full suite: **147 passed, zero failures/skips/cancellations**; 13 focused policy/terms/admission interface checks passed.
- New isolated EVM test uses the actual V4 escrow/ledger through the same frontend reader and extended ABI, creates a fingerprinted version 4 quote, verifies roundtrip/consent/version rejection, pays an actual local deposit, exhausts retries, pauses admission, reserves cancellation and recovers exact principal through the customer method.
- Pure guards exercise unknown, paused, expired, full and exhausted states; deadlines/cooldowns/closure are checked. Version 3/4 mismatches are rejected. Existing legacy fingerprint and V3 bytecode regressions pass.
- The exported legacy escrow ABI was compared byte-for-byte with main and is unchanged. Only the two V4-specific selector fragments are added to the interface's runtime ABI.
- The existing Vite >500 kB chunk warning remains (new JS bundle 538.58 kB, gzip 177.89 kB). The build succeeds; no bundle-size warning was hidden or represented as resolved. No contract or deployed address changed.

## Browser/mobile blocker — not a pass

A full isolated browser journey was prepared using actual local V4 EVM state and a temporary local fixture wallet. It did not execute: the installed Chromium launcher lacked its executable, and the official Playwright headless-browser download returned HTTP 403. The connected browser extension was unavailable in this conversation. The available cloud browser could not reach the workspace localhost server (connection refused); its error page then could not be inspected under the browser URL policy. No policy workaround was attempted.

Therefore no desktop/mobile screenshot, no measured overflow result, no successful browser wallet-extension journey and no public V4 user flow are claimed. The temporary local server/fixtures were stopped. Build and helper tests are useful evidence but do not establish rendered/mobile behavior. New panels and refund actions still require browser verification from a reachable environment or the user's WSL application after versioned deployment.

## Next gate

Review the proposed config and creation cost using plan:v4 (read-only). V4 deployment, separate funding/grant readiness, real ETH/USDC policy traces, browser/customer recovery checks and full milestone acceptance remain required. Do not deploy by replacing a V3 journal or rewrite old share-link targets.

This is M2 functional integration. M3's approved final landing page, rotating professional images, pause/reduced-motion behavior and complete mobile design remain separate pending work.
