# Settlio

Settlio helps service providers create quotes, collect testnet deposits, confirm bookings through Reactive, expire unpaid quotes, and process eligible refunds.

## Current build
The escrow, Reactive subscriber, and authenticated callback receiver are implemented. All three compile and 45 local contract/terms tests pass. The initial merchant/customer frontend passes TypeScript and production build checks. Read-only checks reached Base Sepolia and Lasna and verified chain IDs and protocol bytecode. Real ETH and USDC deposit-to-Reactive-to-confirmation callback flows are independently verified on public testnets; see [on-chain evidence](ONCHAIN-EVIDENCE.md). USDT provenance/support, full browser/mobile checks and recovery remain pending. M1 is open.

Read [the master plan](SETTLIO_MASTER_PLAN.md), [project instructions](AGENTS.md), and [current progress](docs/PROGRESS.md).

## Run contract checks
Requires Node.js 22.18 or later and npm. Each test suite starts an isolated Anvil EVM on an OS-assigned port, verifies its chain/accounts, and signs locally.

```sh
npm ci
npm run setup:reactive
npm run build:contracts
npm test
```

Local tests exercise actual contract bytecode with isolated protocol fixtures. They do not prove live Reactive delivery. The pinned official dependency is installed separately under lib/ with its original licensing.

## Initial payment policy
Merchants can offer native Base Sepolia test ETH and an optional USDC price on the same quote. Each price and deposit is set independently; no exchange rate is assumed. The designated customer selects one option. The first successful deposit locks its asset and amount. Token payments use an exact-amount approval followed by a separate payment transaction. Approval alone is not a deposit. Test ETH is still required for gas. Customers accept the immutable terms fingerprint when paying. Eligible cancellation before refundCutoff reserves a full refund. Merchant release is available after that cutoff for confirmed quotes without pending cancellation. The escrow tracks liabilities per asset, holds customer principal separately from callback gas funding, and returns the deposited asset on refund or release. Failed transfers revert the state change and preserve the claim. Fee-on-transfer/rebasing assets are unsupported; merchant-created custom token contracts are not vetted by the escrow, and the UI only enables the issuer-listed USDC address and ETH.

USDC on Base Sepolia uses Circle's documented address `0x036CbD53842c5426634e7929541eC2318f3dCF7e` (6 decimals). Source: https://developers.circle.com/stablecoins/usdc-contract-addresses . Test USDC: https://faucet.circle.com/ (select Base Sepolia). Preflight now also checks the token's code and metadata.\n\nUSDT remains an approved requirement but is not enabled: an official Base Sepolia USDT deployment has not been verified. No arbitrary test token is presented as Tether. The three-asset local tests use explicitly isolated adversarial fixtures and do not prove issuer integration.\n\nThe example prices in approved design images are illustrative.

## Submission
Target track is Set It and Forget It. Execution, Integration, Usefulness, and Craft have equal weight. Required submission evidence includes public open-source code, deployed addresses, several verified full-loop traces, and a public video under three minutes.

## Deploy the M1 integration
Run npm run preflight first. Fund a dedicated testnet wallet on Base Sepolia and Lasna. Set DEPLOYER_PRIVATE_KEY securely as an environment variable on your own machine, then run npm run deploy:testnet. .env.example documents variables but is not automatically loaded.

The script only accepts the two test chains. It deploys the subscriber, deploys a receiver that creates its escrow, configures subscriptions once, and records public addresses and hashes in deployments/testnet.json. Existing journal entries are reused after confirmation and source-fingerprint checks. Keep that journal if retrying. A stale deployment lock requires checking that the previous process has stopped.

Payment-options version 2 changes creation bytecode. The deployment journal records its version and enabled assets. Do not delete an existing journal to bypass a source-fingerprint mismatch; inspect its recorded deployments first.\n\nFull live execution and interrupted-run recovery are pending validation. A successful deployment still needs a real customer deposit and independently verified callback. The M1 receiver supports confirmation only. Expiry/refund routing follows in M2.

MIT licensed for Settlio source. Upstream dependencies retain their own licensing.

## Run the frontend
Use Node.js 22.18 or later. From the repository root run npm ci, npm run setup:reactive, npm run build:web, and npm run dev.

After testnet deployment, create apps/web/.env.local using the actual escrow address returned by the callback receiver. Restart the dev server after setting it.

```dotenv
VITE_ESCROW_ADDRESS=
VITE_BASE_SEPOLIA_RPC=https://sepolia.base.org
```

The empty configuration shows deployment instructions and disables transactions. It never supplies fabricated history.

## Next local deployment step
In an Ubuntu/WSL terminal, from your existing repository checkout, update main and run the checks.

```sh
git pull --ff-only origin main
npm ci
npm run setup:reactive
npm run build:contracts
npm test
npm run preflight
```

Use a dedicated testnet wallet funded with Base Sepolia ETH and Lasna lREACT. Enter its key privately at the terminal prompt, which hides the input.

```sh
read -r -s -p "Testnet deployer private key: " DEPLOYER_PRIVATE_KEY
export DEPLOYER_PRIVATE_KEY
npm run deploy:testnet
unset DEPLOYER_PRIVATE_KEY
```

Keep deployments/testnet.json to resume safely and share its public addresses and transaction hashes for verification. Do not share a key or an environment file.

The script's full deployment and restart recovery still require a funded live run. Check the transaction journal before retrying after any interruption.

The first UI currently supports quote creation, deposit, and confirmation. Refund/expiry routing and the marketing hero follow in later milestones. Terms in share links are readable by anyone with the link. The recipient must use the designated wallet.

## Wallet and receipt recovery
Connecting requests Base Sepolia and offers to add its official network details if the wallet reports error 4902. A declined network request is not bypassed. The selected network is rechecked before connection completes.

Submitted transaction hashes are saved locally per escrow. If the page reloads before a receipt arrives, a receipt-check banner pauses new submissions. Check the existing transaction before retrying. Successful creation can recover its share link when the browser saved its terms. Approval receipts do not establish payment or booking confirmation.

If no receipt is found, the outcome stays unknown. After checking the explorer and wallet, a user may stop local tracking; this neither cancels nor reverses the transaction and never automatically resubmits it. Replaced/dropped transactions still require manual diagnosis. Receipt recovery depends on browser storage and RPC availability. Cross-tab coordination and real wallet timeout/reload recovery have not been verified.

Run the read-only deployment health check from the checkout containing deployments/testnet.json:
```sh
npm run healthcheck
```
It checks network identity, immutable callback/provider wiring, ETH/USDC custody coverage, and separate automation balance/debt/reserves. It never reads a key or sends a transaction. A nonzero exit means a failed check, an unavailable RPC, or funding needing attention; inspect its output before any recovery transfer. The development-environment run timed out, so a successful live run remains pending.

The updated UI passed TypeScript/build and isolated wallet/receipt tests. Mobile visual checks and browser-based reload verification remain open because the test preview could not be reached. No redeployment is required for these frontend and read-only tooling changes.

## Core-first priority and optional messaging
Finish and prove Settlio's core website and unattended confirmation, unpaid expiry, eligible refund and recovery before integrating messaging. WhatsApp Business and iMessage via Photon are optional later convenience channels; other channels remain deferred. No messaging integration is implemented.

Photon can provide one API instead of a separate custom Meta adapter, but its documented WhatsApp Business integration still uses Meta Cloud API and business account/number provisioning. Consumer WhatsApp is separately described as forthcoming. Account entitlements remain unverified.

## Reproduce payment evidence
Run with your local public deployments/testnet.json:
```sh
npm run verify:quote -- 2 0x1b410e4e98859bc8bce93bbe7a9beb93b5ac3bc67c25ececeed2b77ba75f290f 0x187fc2615773c9725f7d1a7882709a21a1f16102b6bf0cfadba3fd271eaad6d5 0xb66ec4bc2398038d7f5a9b90746a419e00d43b2ed67fe2ccf551c215edb844b6
```
An optional final argument supplies another public deployment-journal path. The tool only reads chain data. It verifies receipts, deposit/asset/token events, origin-log fingerprint, callback request, authentication wiring and delivered confirmation, then saves a snapshot under deployments/evidence. No private key is needed.

Both committed ETH/USDC snapshots were generated by successful public-RPC runs. A quote-2 run with the quote-1 deposit was rejected without overwriting the verified snapshot. Historical receipts do not prove future delivery, expiry or refunds.

Subsequent user-provided WSL output passed the 42 tests, frontend build and live healthcheck with correct wiring, matched custody, zero automation debt and nonzero separate funding. Browser/mobile and full recovery checks remain open.

## Reopen a quote from its creation receipt
Expand Recover a created quote, paste its Base Sepolia creation transaction hash and select Find existing quote. This reads an existing successful QuoteCreated event from the configured escrow and opens the same quote. It never sends a payment or creates another quote. The customer cannot pay an unpaid quote while connected as its merchant.

Original service terms can be restored only if this browser saved them, or through the original complete share link. The fingerprint must match the receipt. A payment or approval hash is not a creation hash. This manual recovery control is distinct from automatic restoration after reloading during a pending transaction; the latter remains unverified in a real browser. The control's event checks have local tests; its live/browser check is pending.
