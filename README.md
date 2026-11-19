# Settlio

Settlio helps service providers create quotes, collect testnet deposits, confirm bookings through Reactive, expire unpaid quotes, and process eligible refunds.

## Current build
The escrow, Reactive subscriber, and authenticated callback receiver are implemented. All three compile and 17 local contract tests pass. Read-only checks reached Base Sepolia and Lasna and verified chain IDs and protocol bytecode. Deployment, frontend, and public full-loop evidence remain pending. M1 is open.

Read [the master plan](SETTLIO_MASTER_PLAN.md), [project instructions](AGENTS.md), and [current progress](docs/PROGRESS.md).

## Run contract checks
Requires Node.js 22 or later and npm. The test harness starts a local Anvil EVM on port 18545.

```sh
npm ci
npm run setup:reactive
npm run build:contracts
npm test
```

Local tests exercise actual contract bytecode with isolated protocol fixtures. They do not prove live Reactive delivery. The pinned official dependency is installed separately under lib/ with its original licensing.

## Initial payment policy
Use native Base Sepolia test ETH with exact deposits and a designated customer wallet. Customers accept the immutable terms fingerprint when paying. Eligible cancellation before refundCutoff reserves a full refund. Merchant release is available after that cutoff for confirmed quotes without pending cancellation. The escrow holds customer principal separately from callback gas funding.

The example prices in approved design images are illustrative.

## Submission
Target track is Set It and Forget It. Execution, Integration, Usefulness, and Craft have equal weight. Required submission evidence includes public open-source code, deployed addresses, several verified full-loop traces, and a public video under three minutes.

## Deploy the M1 integration
Run npm run preflight first. Fund a dedicated testnet wallet on Base Sepolia and Lasna. Set DEPLOYER_PRIVATE_KEY securely as an environment variable on your own machine, then run npm run deploy:testnet. .env.example documents variables but is not automatically loaded.

The script only accepts the two test chains. It deploys the subscriber, deploys a receiver that creates its escrow, configures subscriptions once, and records public addresses and hashes in deployments/testnet.json. Existing journal entries are reused after confirmation and source-fingerprint checks. Keep that journal if retrying. A stale deployment lock requires checking that the previous process has stopped.

Full live execution and interrupted-run recovery are pending validation. A successful deployment still needs a real customer deposit and independently verified callback. The M1 receiver supports confirmation only. Expiry/refund routing follows in M2.

MIT licensed for Settlio source. Upstream dependencies retain their own licensing.
