# V4 expired unused grant recovery

This handles one expired original merchant allowance on an entirely unused V4 deployment. It does not modify contracts, migrate funds, renew consumed credits or increase lifetime capacity. Admission retains its current open/closed state. Existing source funding is rechecked, never replenished automatically.

## Read-only preparation

Keep the V4 frontend running and the form ready before signing a renewal. Do not submit using old deadlines.

```bash
cd ~/Settlio &&
git pull --ff-only origin main &&
NODE_OPTIONS="--dns-result-order=ipv4first --no-network-family-autoselection" \\
BASE_SEPOLIA_RPC=https://sepolia.base.org \\
LASNA_RPC=https://lasna-rpc.rnk.dev \\
npm run plan:renew:v4
```

The read-only plan issues nothing and does not start a new validity window. It requires the confirmed original transaction and an identical expired unused grant, quotes/admitted/active/source jobs all zero, no other reservations, idle scheduling, matching deployment identity and fresh sufficient whole-lifetime funding. The planner explicitly models replacing the exact verified original reservation; it does not accept arbitrary incremental grants.

## One explicit renewal, only when ready

```bash
cd ~/Settlio &&
(
  export NODE_OPTIONS="--dns-result-order=ipv4first --no-network-family-autoselection" &&
  export BASE_SEPOLIA_RPC=https://sepolia.base.org &&
  export LASNA_RPC=https://lasna-rpc.rnk.dev &&
  read -rsp "Sponsor private key (hidden): " DEPLOYER_PRIVATE_KEY &&
  printf '\\n' &&
  export DEPLOYER_PRIVATE_KEY &&
  npm run renew:v4 &&
  npm run verify:v4
)
```

The new 600-second expiry is calculated from a fresh Base observation; planning and broadcast consume some of that window. Never paste a key into chat. Refresh booking capacity after success and create promptly. Enable automatic release if testing release. Both payment deadline and refund cutoff must be future timestamps within the deployed 900-second horizon.

A dedicated journal payload and renewExpiredGrant operation preserve the original grant/open records and recover the same hash on rerun. They never extend a completed renewal on rerun. An expired/stale saved renewal, failed/unknown transaction or conflicting state needs review; do not delete/edit the journal, replace a nonce or run initial grant/funding again. This implementation does not automate a second renewal cycle. No quote already accepted is terminated when its merchant grant expires.

Validation and public outcome provenance are in the dated master/progress/M2 acceptance checkpoint. Public renewal remains pending until the user executes it and its receipt/state are verified.
