# V4 operations — separate deployment and initial sponsorship

Status: IMPLEMENTED AND LOCALLY TESTED. NOT PUBLICLY DEPLOYED. V4 interface integration and public policy evidence remain open; M2 is not accepted.

## Files and configuration

V4 uses deployments/testnet-v4.json and deployments/.deploy-v4.lock. It never writes the M1 or M2 journals. Preserve saved intents after a stop; do not edit/delete them to force another transaction. status:v4 reads saved hashes without a key, writes, nonce replacement or lock removal. Missing receipts are unknown.

config/v4-testnet.example.json is a proposed, editable testnet configuration, not an active product policy:
- Six concurrent/reserved slots and six lifetime accepted quotes.
- Refund cutoff at most 900 seconds (15 minutes) after creation.
- One shared participant retry, with a 60-second cooldown.
- Constructor seed balances: 0.1 test REACT on the subscriber and 0.001 test ETH on its callback receiver.

These seeds do not fund the whole sponsorship allowance. The funding model checks the entire lifetime budget separately. Numeric settings must be reviewed with actual fee observations before the first deployment and freeze in its journal afterward. Existing public V3 balances do not belong to V4 and are not moved.

## Read-only deployment review

```sh
npm run plan:v4 -- config/v4-testnet.example.json YOUR_PUBLIC_DEPLOYER_ADDRESS
```

This checks official testnet IDs, protocol/USDC/indexed CRON prerequisites, proposed settings/source fingerprints, predicted address, creation gas and wallet balances. Configuration and future execution fees are additional. It sends nothing and creates no deployment journal. Predicted addresses are not deployed addresses. Reject/adjust an unsuitable proposal before deploying.

## Ordered lifecycle

| Command | Action |
|---|---|
| plan:v4 -- CONFIG_JSON PUBLIC_DEPLOYER | Read-only initial creation/settings review |
| deploy:v4 -- CONFIG_JSON | Keyed creation of ReactiveV4, callback/embedded escrow/admission, then source configuration; admission stays closed |
| status:v4 | Read-only saved-intent receipt observations, including interrupted deployments |
| verify:v4 | Read-only compiled creation/runtime/constructor funding/limits, immutable wiring, source configuration, subscriptions, scheduler and ETH/USDC custody checks |
| plan:fund:v4 | Read-only model and exact initial reserve shortfalls for the whole lifetime allowance |
| fund:v4 -- SOURCE_MAX_WEI CALLBACK_MAX_WEI | Keyed, explicitly value-capped deposits through SYSTEM.depositTo(newReactive) and PROXY.depositTo(newCallback) |
| grant:v4 -- MERCHANT CREDITS VALID_SECONDS | Keyed one-time initial merchant grant after fresh positive funding/identity/subscription checks; still closed |
| open:v4 | Separate keyed opening after successful grant receipt, unused/unexpired credits and renewed funding checks |

Keyed commands read DEPLOYER_PRIVATE_KEY only from the local process environment. Use the existing hidden local shell prompt; never put a key in an argument, VITE variable, repository or chat. Environment files are not automatically loaded. No command is a public deployment claim until its genuine receipts are supplied and verified.

The current version-3 interface has not yet been upgraded for V4. Do not switch its escrow configuration or old share links now. No public deployment or grant is requested at this checkpoint.

## Intent and funding safety

Each unsigned intent/hash is saved before its first broadcast using the tested shared transaction engine through a V4-only adapter. Disk retains V4 schema/stage names. Reruns sign/check that same hash, verify chain/signer/request/value and recover its receipt; changed inputs, an occupied nonce or reverted receipt stop automatic replacement.

Creation settings and source fingerprints freeze before deployment. An unavailable subscription index can block verification after successful deployment/configuration; rerun the same saved deployment once the index is available rather than redeploying. Same hexadecimal addresses on different chains are valid; only the Base identities must be mutually distinct.

Funding caps apply to deposit value, not the signer's additional gas fees. Both initial shortfalls are checked against explicit caps before the first funding broadcast. One saved initial reserve deposit per network is reused on rerun. A later price increase may leave a shortfall; the command does not silently create another top-up. New funding purposes/caps after saved execution require explicit review/tooling.

The initial grant stores its public observation and canonical proposal/reference/expiry. Freshness and funding are rechecked before an unknown/unbroadcast intent is sent. Known pending/mined intents are recovered without replacing them. Opening is a separate operation that validates the mined owner grant and rechecks the one known reserved batch against the full lifetime model. It does not mint another grant.

Expired/stale/failed grants are refused rather than silently extending their expiry, erasing their history or replacing a nonce. Cleanup/new grant cycles and incremental grants are not implemented by these initial-cycle commands. If a transaction is still pending, use status and the explorer; never assume it failed because tracking stopped. A successful opening does not guarantee future fee affordability or delivery.

## Actual checks and limits

The isolated two-chain operations test uses real V4 deployment, funding and grant transactions with protocol fixtures. It deliberately makes the subscription index unavailable after creation/configuration, then proves resumption sends no second deployment. It verifies both chains' nonce counts and original hashes, capped funding/duplicate avoidance, grant/expiry/observation integrity, separate admission opening and repeat-call safety, public journal confidentiality and unchanged legacy sentinel file.

A separate preparation-interruption test proves the saved hash is persisted before broadcast, recovery sends once, and wrong-chain/occupied-nonce replacement is refused. Invalid config/legacy-path/secret persistence tests also pass. Contract fixtures, index adapters and controlled clocks are explicitly local; they are not public integration evidence.

Final full suite: **144 passed, zero failures/skips/cancellations**. The focused operations suite passed; both V3 fingerprint regressions remain passing. Negative CLI checks safely report a missing V4 journal or required config/key rather than broadcasting.

Official callback authentication/deployment order remains as documented at https://dev.reactive.network/callback-contracts; fee/debt/reserve semantics at https://dev.reactive.network/economy. V4 source and callback remain separate, and customer escrow is never a fee payer.

Next gates: V4 functional interface/shared terms and refund recovery, then read-only user WSL review of settings/cost, explicit bounded wallet operations and genuine V4 origin-to-Reactive-to-callback evidence. Do not mark M2 closed from local tests.
