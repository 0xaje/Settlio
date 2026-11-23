# Controlled M2 scheduler recovery test

Status: PREPARED; public recovery test NOT RUN. M2 remains open.

## Purpose and limits

Exercise the existing participant retry signal and owner scheduler restore using one unpaid quote. This deliberately interrupts CRON scheduling; it is not a protocol outage, failed refund, or proof that a participant retry alone caused a later callback. Existing normal expiry/refund/release evidence remains accepted.

No deposit is needed. Never pay this test quote. Pause stops CRON, not origin observations or all source fees. Public quote creation is still uncapped; the fee model is an off-chain conditional estimate, not admission enforcement. Do not describe this deployment as production hardened.

## Readiness first

From the existing checkout with its preserved deployments/testnet-m2.json:

```sh
cd ~/Settlio &&
git pull --ff-only origin main &&
npm run plan:recovery &&
npm run verify:m2
```

plan:recovery reads network identity, compiled Reactive deployment, immutable wiring, owner, jobs, scheduler state and ETH/USDC liabilities. It never reads a key or sends a transaction. canBeginControlledTest requires zero active jobs, zero liabilities, an unpaused scheduler, and no previously saved pause/resume cycle. Verify current subscriptions and funding separately with verify:m2. A green plan is a current observation; another public merchant can create a job after it.

## Restore command — prepare before pausing

This command restores the recorded scheduler even if jobs appeared while paused. It requires the existing confirmed pause journal and matching receipt. Never delete or edit journal intents.

```sh
cd ~/Settlio &&
(
  read -rsp "Deployer private key (hidden): " DEPLOYER_PRIVATE_KEY &&
  printf '\n' &&
  export DEPLOYER_PRIVATE_KEY &&
  npm run resume:recovery &&
  npm run verify:m2
)
```

If the test is abandoned after a successful pause, run this restore command immediately. A stop, crash or missing receipt is an unknown outcome: inspect status:m2 and the saved hash before rerunning the same command. Never make a replacement transaction or remove a lock without checking the active process.

## Controlled execution — only after readiness is reviewed

1. Recheck plan:recovery and verify:m2. Record the initial state.
2. Use the following hidden local key prompt to send the one saved owner pause:
```sh
cd ~/Settlio &&
(
  read -rsp "Deployer private key (hidden): " DEPLOYER_PRIVATE_KEY &&
  printf '\n' &&
  export DEPLOYER_PRIVATE_KEY &&
  npm run pause:recovery &&
  npm run verify:m2
)
```
3. Confirm the pause receipt and paused=true. Arrange one unpaid quote on the existing M2 escrow. Choose fresh payment deadline and full-refund cutoff in WAT at that time; do not reuse a stale template. Record its genuine creation receipt and immutable timestamps. Do not pay.
4. Once its deadline passes, the merchant or designated customer uses Retry automatic check. Record its successful Base transaction, PolicyRegistered/PolicyRequested logs and actual Reactive observation. The interface exposes this retry only when the awaiting-payment quote is overdue.
5. Restore with resume:recovery. Record the resume receipt, restored CRON subscription, real CRON/reaction/request, authenticated Base expiry and terminal scheduler acknowledgement.
6. Recheck verify:m2 and validate the collected receipts before marking the live recovery gate complete.

The two owner operations use separate journal keys pauseScheduler/resumeScheduler and the deployment lock. Reruns reuse their original unsigned intent/hash. They do not create or pay quotes, send participant retries, replace nonces, or repeat the cycle. Re-running the old pause after restore refuses the changed state rather than pausing again.

## Acceptance evidence

Required: saved owner pause and resume receipts; one unpaid quote's genuine creation and participant requestPolicy receipt; exact source processing linkage; real CRON/request/authenticated expiry and terminal job; final custody and funding observations. Preserve any failure honestly. A successful local fixture is not public integration evidence. If natural expiry would have occurred after restore regardless, do not claim the retry was uniquely necessary.
