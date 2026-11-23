# V4 initial sponsorship funding planner

Status: IMPLEMENTED AND LOCALLY VERIFIED. Not run against a public V4 deployment. No grant execution or public deployment is implemented by this command.

Run only after a separately verified V4 deployment supplies its public identity:

```sh
npm run plan:admission -- PUBLIC_V4_IDENTITY_JSON MERCHANT_ADDRESS CREDIT_COUNT VALID_SECONDS
```

The identity file must contain exactly policyVersion (number 4), escrow, callback, reactive, admission and sponsor (five nonzero public addresses; the four Base identities must be distinct, while source/destination addresses can coincide across chains). Do not pass a V3 deployment journal or an environment/key file. No default identity or fallback deployment is assumed. Validity is 30–600 seconds, at most the configured horizon, with at least 15 seconds remaining at calculation.

## Checks and output

The planner reads Base Sepolia and Lasna. It verifies all four compiled V4 runtimes, versions and immutable wiring, admission sponsor, ten active origin filters and inactive idle CRON. State/code/balances are read at pinned Base/Lasna heights, their hashes are rechecked, and indexed CRON logs are tied to matching block headers. Filter-index and gas-price RPC methods are current observations, not block-pinned historical proofs. Wrong/missing responses stop planning.

Only an initial empty, closed, unpaused deployment with no grants, accepted quotes or source jobs is supported. Both fee debts must be zero, head/observation timestamps fresh, and scheduler constants known. Incremental grants are deliberately rejected rather than reusing a stale initial budget.

Output is read-only: proposed merchant/credits/expiry, deterministic fundingObservation fingerprint over public observations/proposal, available/required source and callback amounts, and canGrant. A shortfall returns canGrant=false; invalid/unknown observations produce an error. Nothing is signed, written, funded, granted or opened. A successful result is not permission for another tool to act silently.

## Conditional allowance

Budget the entire immutable maxLifetimeAdmissions, not only the proposed credits. Confirmation and cancellation can each reset attempts once, and each participant policy retry can reset them again. The model uses maxRetries+3 batches, six policy attempts per batch, plus deposit/confirmation retry callbacks. Source origin allowances include participant signals and destination acknowledgements; CRON allowances include per-quote horizon/backoff windows, queue draining and a 15-minute assumed delivery margin.

The model doubles sampled fastest CRON cadence and current gas prices, then applies current source/proxy coefficients and surcharges, 900,000 source gas and the compiled 1,000,000 callback gas configuration. It is a stress allowance, not a protocol charge estimate, a mathematical guarantee under arbitrary delays, or the expected price of one booking. Future price/rate/protocol changes, prolonged delivery, extra traffic or unsafe sponsor actions can invalidate it.

Only source prepaid reserves count toward source readiness. Callback reserves plus its own ETH balance count on Base. Source balance and customer principal are excluded. The sponsor still attests funding; Base does not read Lasna reserves on-chain. Grant signing/recovery and freshness rechecks are now implemented separately in V4_OPERATIONS.md, with local verification; public operation remains pending.

## Actual verification

Six budget tests cover deterministic scope/reference, full lifetime/reset accounting, source/destination shortfalls, excluded principal/source balance, debt, networks, freshness, subscriptions, configuration, initial-state restriction, identity/proposal validation and RPC failure.

The separate two-chain local integration deploys actual V4 contracts, checks the collector against their bytecode/wiring, supplies funded isolated fee fixtures and genuine indexed CRON receipts, and verifies a positive conditional initial plan. Anvil lacks rnk_getFilters: that one method is adapted from the fixture's actual subscription storage. Controlled fixture clocks are explicitly injected; neither adapters nor fixtures are public protocol observations.

The same integration carries actual local creation/deposit logs through the real V4 reactive contract, rejects a forged react caller and wrong callback route/sender, rejects duplicate origin processing, delivers fixture-network callbacks through the receiver, observes real local expiry/release receipts, and verifies both admission slots and source queue close. These are isolated EVM transactions, not additional public hackathon evidence.

Final full suite: **141 passed, zero failures/skips/cancellations**; seven focused planner/integration checks passed. No public V4 observation, deployment or transaction was performed.

Public V4 deployment and grant execution proof, terms/interface integration and fresh public origin-to-callback proof remain pending. Backend execution tooling is locally verified in V4_OPERATIONS.md. M2 stays open; existing V3 public trails remain valid and its uncapped contract remains unchanged.
