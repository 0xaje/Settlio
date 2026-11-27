# Settlio — Submission & M4 Release Guide

**Event:** Reactive Omni Buildathon 2026 (Track: *Set It and Forget It*, deadline 5 December 2026)  
**Repository:** https://github.com/0xaje/Settlio (`main`, MIT License)  
**Public Frontend URL:** *[Pending M4 deployment — see Section 3]*  
**Public Demo Video (<3 min):** *[Pending M4 recording — see Section 4]*

---

## 1. Deployed V4 Contract Addresses & Supported Networks

| Component | Network | Address |
|---|---|---|
| **SettlioEscrowV4** | Base Sepolia (`84532`) | `0x5675C610d6f0aCe9f7933f3584D53dc4F567Dc6B` |
| **SettlioCallbackV4** | Base Sepolia (`84532`) | `0x49ff0a4Bfa918b0576315C31a0bcE561eEBf3Df0` |
| **SettlioAdmission** | Base Sepolia (`84532`) | `0x935Ef09F57B68D08fd9Fd315755b7Daf49871486` |
| **SettlioReactiveV4** | Reactive Lasna (`5318007`) | `0xFa1F509E21040bB4fE266B79E9583073914dFe6e` |
| **Base Sepolia USDC (Circle)** | Base Sepolia (`84532`) | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| **Base Callback Proxy** | Base Sepolia (`84532`) | `0x476F44b11F5C942c58f4c8E3d0300E5710743585` |

> [!NOTE]
> V4 was deployed with an immutable `6/6` lifetime admission cap for bounded testnet verification; all 6 slots are consumed and all 6 quotes are terminal with zero customer principal held. Separate **V5 renewable contracts** (`SettlioWorkLedger`, `SettlioEscrowV5`, `SettlioCallbackV5`, `SettlioReactiveV5`) and local commitment/reconciliation tooling are implemented and verified on isolated local Anvil chains (`317/317` full `npm test` pass at `e571391`), and are **not** publicly deployed.

---

## 2. Verified V4 Public End-to-End Loops

All six loops have verified Base Sepolia origin receipts, Reactive Lasna processing/CRON requests, authenticated Base Sepolia callbacks, and reproducible CLI verifiers (`npm run verify:*:v4 -- --recorded`):

| V4 Quote | Verified Public Outcome | Evidence Bundle |
|---|---|---|
| **Quote 1** | ETH deposit → Reactive confirmation → automatic release | [quote-1-release-verified.json](../deployments/evidence/v4/quote-1-release-verified.json) |
| **Quote 2** | USDC approval & deposit → Reactive confirmation → automatic release | [quote-2-release-verified.json](../deployments/evidence/v4/quote-2-release-verified.json) |
| **Quote 3** | Eligible cancellation → CRON/callback → exact ETH refund | [quote-3-refund-verified.json](../deployments/evidence/v4/quote-3-refund-verified.json) |
| **Quote 4** | Eligible cancellation → CRON/callback → exact USDC refund | [quote-4-refund-verified.json](../deployments/evidence/v4/quote-4-refund-verified.json) |
| **Quote 5** | Unpaid quote past deadline → CRON/callback → authenticated expiry | [quote-5-expiry-verified.json](../deployments/evidence/v4/quote-5-expiry-verified.json) |
| **Quote 6** | Owner pause → processed participant retry → restore → CRON/callback expiry | [quote-6-recovery-verified.json](../deployments/evidence/v4/quote-6-recovery-verified.json) |

---

## 3. Free Public Frontend Hosting (M4.1)

Deploy `apps/web` as a static Vite build to **Vercel**, **Cloudflare Pages**, or **Netlify**:
- **Build command:** `npm ci && npm run build:web`
- **Output directory:** `apps/web/dist`
- **Public environment variables (no private keys):**
  - `VITE_ESCROW_ADDRESS=0x5675C610d6f0aCe9f7933f3584D53dc4F567Dc6B`
  - `VITE_BASE_SEPOLIA_RPC=https://base-sepolia-rpc.publicnode.com`
  - `VITE_LASNA_RPC=https://lasna-rpc.rnk.dev`

---

## 4. Public Demo Video Script (Strictly Under 3 Minutes — Target 2:30)

1. **0:00–0:30 — Problem & Landing:** Show the hosted Landing page (*"Turn quotes into confirmed bookings"*), rotating service scenes (photographer, baker, tailor, event decorator), and *Automation rules*.
2. **0:30–1:00 — Merchant Workspace & Create Quote:** Open `Quotes`, filter real V4 Quotes `#1`–`#6`, then open `Create quote` to show ETH/USDC pricing, deadlines, automatic-release opt-in, live `Customer preview`, and honest `6/6` V4 capacity readout.
3. **1:00–1:45 — Customer Quote, Wallet Checkout & Receipt:** Open Quote `#1` / `#2` (Released) and Quote `#3` / `#4` (Refunded) or `#6` (Expired) to show verified terms, real `Receipt`, `AutomationStatus`, and Base Sepolia / Reactive Lasna explorer links.
4. **1:45–2:30 — How Reactive Automates It & V5 Architecture:** Briefly show the verified origin → Reactive → callback evidence in `deployments/evidence/v4/` and explain the local-only V5 renewable ledger/reader/commitment architecture (`317/317` passing tests) without claiming public V5 deployment.

---

## 5. Event-Period Work & Prior Dependencies

- **Built during event (19–27 November 2026):** All Settlio contracts (`src/`, `admission/`, `renewable/`), deployment/verification/accounting scripts (`script/`), React/TypeScript frontend (`apps/web/`), test suites (`test/`), and documentation (`docs/`).
- **Prior open-source dependencies:**
  - `Reactive-Network/reactive-lib-omni` (pinned commit `3ade0dcf1d27e67e5783ef807e73a1b9e0c0cce8`, installed via `npm run setup:reactive`)
  - `ethers` (`^6.17.0`), `react` / `react-dom` (`^19.3.1`), `@fontsource/inter` (`^5.3.0`), `solc` (`0.8.29`), `typescript` (`^7.0.2`), `vite` (`^8.3.8`), `@foundry-rs/anvil` & `@foundry-rs/forge` (`^1.7.1`)
- **License:** MIT ([LICENSE](../LICENSE)) for all Settlio source; upstream dependencies retain their respective licenses.
