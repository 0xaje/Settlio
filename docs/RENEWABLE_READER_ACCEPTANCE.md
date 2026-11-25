# V5 read-only reader — local acceptance

25 November 2026. **Read-only collection/reconciliation implemented and tested locally (including `finalized > latest` skew hardening). No public V5 deployment, funding or grant readiness is established. M2 remains open.**

## Implemented

[renewable-reader.cjs](../script/renewable-reader.cjs) collects a pinned fee snapshot and finalized-prefix event reconciliation for the local sponsor [commitment guard](RENEWABLE_COMMITMENT_ACCEPTANCE.md). It accepts explicit read transports, reviewed state/profile and a public creation/configuration manifest. It does not create providers from secret configuration, sign, broadcast, write journals or execute grants.

The transport wrapper permits only named read RPC methods. Canonical transaction/receipt/header checks, not supplied success booleans, produce the lifecycle facts. Successful results are recursively frozen and tracked in-process; JSON clones, edited/archived objects and reports for another identity/profile cannot authorize the reconciliation-command builder.

### Identity and fee snapshot

- Require Base Sepolia 84532 and Reactive Lasna 5318007 chain IDs.
- Match all four deployed application runtimes against compiled V5 source, then exact reviewed runtime hashes.
- Validate constructor transactions/receipts, deployer, creation address, value and complete encoded arguments. Verify immutable/configured wiring, owner/sponsor, service providers, origin chain, timer flag, horizon, work/active bounds and retry settings.
- Check the fixed Base proxy/source system addresses against separately reviewed service runtime hashes in the manifest. Those hashes are review inputs, not an automatic protocol audit.
- Pin latest resource/configuration reads to explicit block numbers. Check prepaid source reserves; callback receiver reserves plus its own balance; both debts and fee coefficients/surcharges. Do not count escrow/customer principal or source contract balance as spare fee backing.
- Record a gas-price quote during collection, conservatively compared with the pinned header base fee. The gas quote and native filter index are live API reads, not historical eth_call state.
- Timestamp observations at collection completion by default. Recheck latest/finalized block hashes and native filter index stability before returning. Strict freshness/schema checks run through the accounting guard.

The model-review reference and positive allowances are still operator inputs. The reader does not prove the economic adequacy of that model. It always returns canGrant: false.

### History and subscriptions

Require finalized tags; do not silently downgrade to latest when finality is unavailable. Constructor receipts establish history start points. Read contiguous inclusive pages through fixed finalized heads with bounded page size/page count; fail rather than return partial history when a page fails or a range exceeds the configured bound.

Each log must belong to its successful canonical receipt at its claimed index. Duplicate logs, wrong block headers, inconsistent transaction/receipt chains and unfinalized receipts fail collection. Replay grant replacement/expiry, admission, terminal state, source acknowledgement and settlement. Compare results with ledger counters, contiguous quote IDs, grant/job getters and escrow state. Counter changes or known grant changes between finalized and latest views stop reconciliation.

Verify twelve escrow subscriptions, ledger settlement subscription and the currently expected CRON tier through the native filter-index response. Ambiguous/missing schema or required filters stop collection. Paused/timer consistency is checked; this is not permission to issue new grants while paused. Operational availability/opening policy remains a separate issuer gate.

For every subscribed origin log, compute its actual origin-log key and check Reactive's processed mapping at the finalized source checkpoint. Unprocessed origin events remain backlog.

### Delivery reconciliation

Read modern system CallbackRequest events and cross-check accepted application request events. Decode expected version/configuration, source identity, recipient, gas limit and method/quote payload. Mixed/unsupported request envelopes stop collection.

Query documented getCallbacks return reports for each source transaction. Bind report sender, destination chain and callback ordinal, then verify each reported destination transaction/receipt through the expected deliverCallback envelope and injected Reactive sender. Duplicate delivery reuse, mismatched payloads, wrong routes or contradictory success reports fail. Keep destination hashes, finalized blocks, status and report errors in the report.

An empty report array stays pending. Unknown/zero destination hashes remain unresolved. A settled job cannot be treated as reconciled without the successful authenticated closure delivery matching its actual ledger SourceAcknowledged transaction, source settlement and zero observed backlog/pending delivery evidence.

Return-report tuple field zero is retained as report metadata; it is not assumed to be a destination-finality proof. Finality is checked against the actual destination receipt separately. The documented zero-based ordinal/modern-envelope codec is a supported candidate, not a newly demonstrated public capability.

## Accounting integration

reconciliationCommands builds only observation/confirmation/admission/terminal/settlement/unused-release commands from an original immutable reader result. It refuses observed grants or admissions without a matching reserved local intent. It never absorbs outside work as a free allowance or treats a missing transaction as failed.

The command list is returned, not persisted or sent. Existing revisioned journal operations remain the only provided persistence mechanism; a future issuer must commit/resume bookkeeping safely and recheck availability before any separately authorized signing step.

A copied JSON result cannot be fed back as new authoritative collection. Recorded public-proof replay remains separate and unchanged.

## Actual verification

Initial focused command:
`node --test test/renewable-reader.test.cjs test/renewable-commitments.test.cjs`
passed **18/18** before the extra multi-request case.

Full repository command `npm test` then passed **313/313**, zero failures/skips/cancellations (177.79 seconds). This is the full regression for the implemented reader and the then-existing four reader cases.

A fifth reader case was subsequently added to verify two callbacks in each source transaction and distinct report ordinals/delivery payloads. Final expanded focused command passed **19/19**, zero failures/skips/cancellations (60.99 seconds): five reader cases plus fourteen commitment cases. A new full 314-test run is not claimed for that additional coverage-only case.

The five reader groups cover:
1. Two distinct local chains with the actual V5 source/receiver/escrow/ledger, real local expiry and closure transactions, canonical history and reports; reconciliation clears only the correct held allowance.
2. Missing closure return reports keep backing unresolved despite terminal state on both chains.
3. Wrong chains, runtime drift, bounded-scan exhaustion and altered canonical checkpoints are rejected.
4. Missing native filters and omitted admission history are rejected; unprocessed actual origin logs remain backlog.
5. Multiple requests in one source transaction map to separate ordinals and four distinct destination deliveries, without conflating identical request envelopes.

Reader results are immutable; a JSON clone is refused by the command builder. RPC methods used by the reader are traced to ensure no transaction, signing or gas-estimation methods are invoked.

The first runs found a fixture API name collision and receipts that had not yet reached the local finalized tag. The fixture accessor was corrected and the test chains advanced to finality; validation was not relaxed. A test-clock mismatch when exercising completion-time observation stamping was also corrected. Final results above are from the corrected checks.

No production contract source changed in this step. No new contract/web build claim is needed: the reader compiles source for runtime verification during its tested collection. Last explicit renewable build remains the [timer checkpoint](RENEWABLE_TIMER_ACCEPTANCE.md).

## Evidence limitations

The [ReaderProtocolFixture](../test/fixtures/ReaderProtocolFixture.sol) is an explicitly isolated protocol transport/index/report stand-in. Tests run separate ephemeral Anvil chains with IDs 84532/5318007. Setup deploys/funds fixture contracts locally and submits local observations/reports; none are public Reactive transactions, real customer activity or measured public fees.

Chain IDs and reviewed runtimes alone do not establish endpoint provenance. This reader relies on honest RPC completeness, canonical data and the provider's finalized tag; it is not a consensus/light-client or cryptographic absence proof. Counter/receipt/event cross-checks detect important inconsistencies, not every possible dishonest RPC response.

The local native-index bridge is derived from fixture subscription storage. It is not a fresh Lasna rnk_getFilters observation. Modern report schema/index compatibility, native finalized support, service runtime provenance and coarse-event layouts still require public read-only verification. Existing V4 evidence is not converted into V5 evidence or unique public retry attribution.

There is no incremental trusted checkpoint importer yet. A deployment exceeding the bounded complete scan must stop for a separately reviewed checkpoint approach, not skip earlier history.

There is no production V5 manifest/profile/journal, reviewed full-obligation price model, signing integration or public grant. Unknown external grant epochs—including unsupported outside revocation paths—stop command generation instead of silently releasing local holds.

## Review, judging and next action

No public Execution/Integration points are added. Prior self-assessment stays Execution 20/25, Integration 20/25, Usefulness 15/25, Craft 15/25. Local reader/reconciliation implementation is complete for this step; formal M2 remains OPEN and original browser-evidence qualifications remain intact.

Next: consolidate the V5 readiness review and remaining M2 gates, including native read-only compatibility, operating profiles and the minimum separately authorized public evidence needed. Do not start deployment, request keys/tokens or repeat the six successful V4 journeys.

## Official reference points

Reviewed against the official [Reactive economy and callback reports](https://dev.reactive.network/economy) and [RNK RPC methods](https://dev.reactive.network/rnk-rpc-methods). These references inform the supported codec; local fixtures do not establish live node compatibility.
