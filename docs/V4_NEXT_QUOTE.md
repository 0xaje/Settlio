# V4 quote 2 merchant credit

Only for the next trial after the one-hour quote-1 grant was consumed and quote 1 is fully terminal on both chains. This does not renew an expired unused grant, replenish lifetime capacity, create a quote or transfer tokens. It preserves the current admission open state.

## Read-only plan

```bash
cd ~/Settlio &&
git pull --ff-only origin main &&
NODE_OPTIONS="--dns-result-order=ipv4first --no-network-family-autoselection" \\
BASE_SEPOLIA_RPC=https://sepolia.base.org \\
LASNA_RPC=https://lasna-rpc.rnk.dev \\
npm run plan:next:v4
```

It verifies the versioned journal, original one-hour grant receipt, current source/destination wiring, subscriptions, quote/gate/source closure, zero customer liabilities and no reserved/active work. The recorded public snapshot is advisory and is never substituted for these fresh checks. Required funding is the conservative model for all five remaining lifetime slots. This is not an expected transaction charge or a promise under future fee changes.

## Issue one credit when ready

```bash
cd ~/Settlio &&
(
  export NODE_OPTIONS="--dns-result-order=ipv4first --no-network-family-autoselection" &&
  export BASE_SEPOLIA_RPC=https://sepolia.base.org &&
  export LASNA_RPC=https://lasna-rpc.rnk.dev &&
  read -rsp "Sponsor private key (hidden): " DEPLOYER_PRIVATE_KEY &&
  printf '\\n' &&
  export DEPLOYER_PRIVATE_KEY &&
  npm run grant:next:v4 &&
  npm run verify:v4
)
```

The new expiry is one hour from a fresh Base observation; checking and broadcasting consume some time. It is separate from quote deadlines: both quote timestamps must still be in the future and within 900 seconds of creation. No automatic funding, payment, quote creation or opening occurs. Insufficient reserves stop the command.

The nextQuoteGrant plan and grantNextQuote operation are distinct from all earlier stages. Reruns recover the same transaction and never extend the expiry or issue another credit. Preserve the journal on stale/failed/unknown/conflicting outcomes. A generic third or later credit workflow is not implemented by this one operation.

After success, refresh booking capacity, enable USDC as an accepted option and opt into automatic release for its trial. The customer must choose USDC; an approval alone is not a deposit. Gather approval, deposit, confirmation, Reactive and policy hashes. Do not reuse expired quote timestamps; get fresh times at the form. Never paste a key into chat.

The quote-1 verifier intentionally expects its original single-quote current-state snapshot. New reservations can make fresh collection fail that narrow assertion. Keep its accepted historical bundle and use recorded replay for that historical scope; do not pretend later state was the earlier observation.
