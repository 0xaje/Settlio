// Local-only V5 issuer orchestrator for isolated Anvil testing.
// Never reads private keys from env/disk, never creates live RPC providers, and never broadcasts publicly.
const { Contract } = require('ethers');
const compile = require('./compile-renewable.cjs');
const accounting = require('./renewable-commitments.cjs');
const reader = require('./renewable-reader.cjs');

function check(ok, message) {
  if (!ok) throw Error(message);
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
  check(signer && typeof signer.getAddress === 'function', 'Explicit local signer is required');
  let { state, report, checkpoint } = await reconcile({ journalFile, base, source, manifest, now, previousCheckpoint });
  const signerAddress = (await signer.getAddress()).toLowerCase();
  check(signerAddress === state.identity.sponsor, 'Signer does not match configured sponsor');

  state = accounting.transact(journalFile, state.revision, { type: 'reserve', payload: proposal }, now);
  const intent = state.intents.find(i => i.id === proposal.id);
  check(intent, 'Reserved grant intent missing after transact');

  const ledgerArtifact = compile('SettlioWorkLedger');
  const workLedger = new Contract(state.identity.workLedger, ledgerArtifact.abi, signer);

  if (openAdmission && !(await workLedger.open())) {
    await (await workLedger.setOpen(true)).wait();
  }

  const onchainGrant = await workLedger.grants(proposal.merchant);
  if (onchainGrant[2] === BigInt(proposal.epoch)) {
    check(
      onchainGrant[3].toLowerCase() === state.profileHash.toLowerCase(),
      'Existing on-chain grant epoch has mismatched profileHash'
    );
    return { state, report, checkpoint, txHash: null, reusedExistingGrant: true };
  }

  const observation = state.snapshot.evidenceHash;
  const tx = await workLedger.setGrant(
    proposal.merchant,
    proposal.epoch,
    proposal.credits,
    proposal.expiresAt,
    state.profileHash,
    observation
  );
  const receipt = await tx.wait();
  check(receipt && receipt.status === 1, 'Local setGrant transaction failed');
  return { state, report, checkpoint, txHash: receipt.hash, reusedExistingGrant: false };
}

module.exports = { reconcile, issueGrant };
