// Local-only V5 issuer orchestrator for verified isolated Anvil fixtures.
// Never reads private keys from env/disk, never creates live RPC providers, and never broadcasts publicly.
const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const { Contract, Interface } = require('ethers');
const compile = require('./compile-renewable.cjs');
const accounting = require('./renewable-commitments.cjs');
const reader = require('./renewable-reader.cjs');

function check(ok, message) {
  if (!ok) throw Error(message);
}

function isLoopbackUrl(url) {
  return typeof url === 'string' && /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:[0-9]+)?(\/|$)/i.test(url);
}

function assertNoPublicUrl(provider, label) {
  const url = provider?.connection?.url ?? provider?._getConnection?.()?.url;
  if (url !== undefined) {
    check(isLoopbackUrl(url), `${label} uses a non-loopback RPC URL; public endpoints are forbidden`);
  }
}

async function assertIsolatedLocalFixture(base, source, signer) {
  check(signer && typeof signer.getAddress === 'function', 'Explicit local signer is required');
  check(signer.provider && typeof signer.provider.send === 'function', 'Signer must be attached to an isolated local provider');
  check(base && typeof base.send === 'function' && source && typeof source.send === 'function', 'Base and source RPC transports are required');

  assertNoPublicUrl(signer.provider, 'Signer provider');
  assertNoPublicUrl(base, 'Base provider');
  assertNoPublicUrl(source, 'Source provider');

  const [signerChain, baseChain, sourceChain, signerClient, baseClient, sourceClient] = await Promise.all([
    signer.provider.send('eth_chainId', []),
    base.send('eth_chainId', []),
    source.send('eth_chainId', []),
    signer.provider.send('web3_clientVersion', []),
    base.send('web3_clientVersion', []),
    source.send('web3_clientVersion', [])
  ]);

  check(BigInt(signerChain) === 84532n && BigInt(baseChain) === 84532n && BigInt(sourceChain) === 5318007n, 'Unsupported chain ID for isolated V5 fixture');
  for (const [label, client] of [['Signer', signerClient], ['Base', baseClient], ['Source', sourceClient]]) {
    check(typeof client === 'string' && /^anvil\//i.test(client), `${label} provider must be an isolated Anvil node`);
  }

  const [sGen, bGen, sLatest, bLatest] = await Promise.all([
    signer.provider.send('eth_getBlockByNumber', ['0x0', false]),
    base.send('eth_getBlockByNumber', ['0x0', false]),
    signer.provider.send('eth_getBlockByNumber', ['latest', false]),
    base.send('eth_getBlockByNumber', ['latest', false])
  ]);
  check(
    sGen?.hash && bGen?.hash && sGen.hash.toLowerCase() === bGen.hash.toLowerCase() &&
    sLatest?.hash && bLatest?.hash && sLatest.hash.toLowerCase() === bLatest.hash.toLowerCase(),
    'Signer provider does not match the inspected local Base chain'
  );
}

function observationFile(journalFile) {
  return journalFile + '.issuer-observations.json';
}

function readObservations(journalFile) {
  const file = observationFile(journalFile);
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeObservation(journalFile, intentId, observation) {
  const file = observationFile(journalFile);
  const next = { ...readObservations(journalFile), [intentId]: observation };
  const tmp = file + '.' + randomBytes(8).toString('hex') + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(next, null, 2) + '\n', { mode: 0o600 });
  fs.renameSync(tmp, file);
}

async function verifyExistingGrantEvent({ base, workLedgerAddress, ledgerAbi, proposal, profileHash, expectedObservation }) {
  const iface = new Interface(ledgerAbi);
  const topic = iface.getEvent('GrantSet').topicHash;
  const merchantTopic = '0x' + proposal.merchant.toLowerCase().replace(/^0x/, '').padStart(64, '0');
  const latestHex = (await base.send('eth_getBlockByNumber', ['latest', false])).number;
  const logs = await base.send('eth_getLogs', [{
    address: workLedgerAddress,
    fromBlock: '0x0',
    toBlock: latestHex,
    topics: [topic, merchantTopic]
  }]);
  check(Array.isArray(logs) && logs.length > 0, 'Existing grant epoch lacks GrantSet event history');
  const matching = logs
    .map(l => iface.parseLog(l))
    .filter(e => e && e.args.epoch === BigInt(proposal.epoch));
  check(matching.length === 1, 'Expected exactly one GrantSet event for existing epoch');
  const ev = matching[0].args;
  check(ev.merchant.toLowerCase() === proposal.merchant.toLowerCase(), 'Existing grant merchant mismatch');
  check(ev.epoch === BigInt(proposal.epoch), 'Existing grant epoch mismatch');
  check(ev.credits === BigInt(proposal.credits), 'Existing grant issued credits mismatch');
  check(ev.expires === BigInt(proposal.expiresAt), 'Existing grant expiration mismatch');
  check(ev.profile.toLowerCase() === profileHash.toLowerCase(), 'Existing grant profile mismatch');
  if (expectedObservation) {
    check(ev.observation.toLowerCase() === expectedObservation.toLowerCase(), 'Existing grant observation commitment mismatch');
  }
}

async function reconcile({ journalFile, base, source, manifest, now, previousCheckpoint = null }) {
  let state = accounting.read(journalFile);
  const report = await reader.collect({ base, source, state, manifest, now, previousCheckpoint });
  const commands = reader.reconciliationCommands(state, report);
  for (const command of commands) {
    state = accounting.transact(journalFile, state.revision, command, now);
  }
  return { state, report, checkpoint: report.checkpoint };
}

async function issueGrant({
  journalFile,
  base,
  source,
  manifest,
  proposal,
  signer,
  now,
  previousCheckpoint = null,
  openAdmission = false,
  localOnly = false
}) {
  check(localOnly === true, 'V5 issuer orchestrator is restricted to localOnly: true fixtures');
  await assertIsolatedLocalFixture(base, source, signer);

  const initialState = accounting.read(journalFile);
  const signerAddress = (await signer.getAddress()).toLowerCase();
  check(signerAddress === initialState.identity.sponsor, 'Signer does not match configured sponsor');

  let { state, report, checkpoint } = await reconcile({ journalFile, base, source, manifest, now, previousCheckpoint });

  state = accounting.transact(journalFile, state.revision, { type: 'reserve', payload: proposal }, now);
  const intent = state.intents.find(i => i.id === proposal.id);
  check(intent, 'Reserved grant intent missing after transact');

  const savedObservations = readObservations(journalFile);
  const expectedObservation = savedObservations[intent.id] ?? state.snapshot.evidenceHash;
  if (!savedObservations[intent.id]) {
    writeObservation(journalFile, intent.id, expectedObservation);
  }

  const ledgerArtifact = compile('SettlioWorkLedger');
  const workLedger = new Contract(state.identity.workLedger, ledgerArtifact.abi, signer);

  if (openAdmission && !(await workLedger.open())) {
    await (await workLedger.setOpen(true)).wait();
  }

  const onchainGrant = await workLedger.grants(proposal.merchant);
  if (onchainGrant[2] > BigInt(proposal.epoch)) {
    throw Error('Existing on-chain grant epoch exceeds proposal epoch');
  }
  if (onchainGrant[2] === BigInt(proposal.epoch)) {
    await verifyExistingGrantEvent({
      base,
      workLedgerAddress: state.identity.workLedger,
      ledgerAbi: ledgerArtifact.abi,
      proposal,
      profileHash: state.profileHash,
      expectedObservation
    });
    return { state, report, checkpoint, txHash: null, reusedExistingGrant: true };
  }

  const tx = await workLedger.setGrant(
    proposal.merchant,
    proposal.epoch,
    proposal.credits,
    proposal.expiresAt,
    state.profileHash,
    expectedObservation
  );
  const receipt = await tx.wait();
  check(receipt && receipt.status === 1, 'Local setGrant receipt unavailable or failed; financial hold preserved');
  return { state, report, checkpoint, txHash: receipt.hash, reusedExistingGrant: false };
}

module.exports = { reconcile, issueGrant, assertIsolatedLocalFixture };
