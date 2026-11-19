# Settlio

Settlio helps service providers create quotes, collect testnet deposits, confirm bookings through Reactive, expire unpaid quotes, and process eligible refunds.

## Current build
The escrow contract is implemented. Compilation and 9 local contract tests pass. The Reactive subscriber, authenticated callback receiver, deployment, frontend, and public full-loop evidence remain pending. M1 is open.

Read [the master plan](SETTLIO_MASTER_PLAN.md), [project instructions](AGENTS.md), and [current progress](docs/PROGRESS.md).

## Run contract checks
Requires Node.js 22 or later and npm. The test harness starts a local Anvil EVM on port 18545.

```sh
npm ci
npm run build:contracts
npm test
```

Local tests exercise actual escrow bytecode, using a local signer as callback receiver. They do not prove a live Reactive integration.

## Initial payment policy
Use native Base Sepolia test ETH with exact deposits and a designated customer wallet. Customers accept the immutable terms fingerprint when paying. Eligible cancellation before refundCutoff reserves a full refund. Merchant release is available after that cutoff for confirmed quotes without pending cancellation. The escrow holds customer principal separately from callback gas funding.

The example prices in approved design images are illustrative.

## Submission
Target track is Set It and Forget It. Execution, Integration, Usefulness, and Craft have equal weight. Required submission evidence includes public open-source code, deployed addresses, several verified full-loop traces, and a public video under three minutes.

MIT licensed.
