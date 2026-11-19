# Settlio

Settlio is being built to help service providers create quotes, collect testnet deposits, confirm bookings through Reactive, expire unpaid quotes, and process policy-eligible refunds.

## Current status
Foundation stage. No contract deployment, working application, or successful live Reactive loop has been verified. Design images are illustrative.

Read [the master plan](SETTLIO_MASTER_PLAN.md) and [project instructions](AGENTS.md) before contributing. All authorised work goes directly to main.

## First build milestone
A merchant creates a quote, a designated customer pays the exact deposit in native Base Sepolia test ETH, Lasna processes the deposit event, and an authenticated callback confirms the booking. Collect origin, Reactive, and callback transaction hashes and verify the final state.

## Initial policy
Payment must arrive before quote expiry. Customer cancellation before the agreed refund cutoff reserves the full deposit for refund. Funds remain protected while that request is pending. Merchant withdrawal becomes available after the cutoff for confirmed quotes without pending cancellation. Refundable principal is separate from automation gas funds. These are engineering defaults recorded in the master plan.

## Judging and release
Execution, Integration, Usefulness, and Craft are equally weighted. A public open-source repository, deployed addresses, several verified full-loop traces, and a public video under three minutes are required for submission. Evidence is collected as development proceeds.

## Verification
Node and npm are available. npm package registry access was checked successfully. Foundry is not currently installed in the active workspace. Compilation and tests are pending.
