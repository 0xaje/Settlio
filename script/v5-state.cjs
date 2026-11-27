// V5-only public journal. Reuses the tested saved-intent engine, never V4/M2 file formats.
const fs = require('node:fs');
const path = require('node:path');
const { getAddress } = require('ethers');
const { runOperation } = require('./m2-state.cjs');

function check(value, message) {
  if (!value) {
    const error = new Error(message);
    error.v5Expected = true;
    throw error;
  }
}

const stages = {
  deployReactive: 5318007,
  deployCallback: 84532,
  configure: 5318007,
  openAdmission: 84532,
  grantInitial: 84532
};

function paths(root) {
  const directory = path.join(root, 'deployments');
  return {
    directory,
    journal: path.join(directory, 'testnet-v5.json'),
    lock: path.join(directory, '.deploy-v5.lock')
  };
}

function validate(journal) {
  check(
    journal?.milestone === 'M4-V5' &&
      journal.schemaVersion === 1 &&
      journal.policyVersion === 5 &&
      journal.baseChainId === 84532 &&
      journal.reactiveChainId === 5318007 &&
      journal.operations &&
      journal.contracts,
    'Wrong V5 journal; preserve existing M1/M2/V4 files.'
  );
  getAddress(journal.deployer);
}

function create(deployer, settings) {
  return {
    milestone: 'M4-V5',
    schemaVersion: 1,
    policyVersion: 5,
    baseChainId: 84532,
    reactiveChainId: 5318007,
    deployer: getAddress(deployer),
    settings,
    contracts: {},
    operations: {}
  };
}

function save(file, journal) {
  validate(journal);
  check(path.basename(file) === 'testnet-v5.json', 'Refusing to write outside the V5 journal.');
  function inspect(value) {
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      check(!/private.?key|mnemonic|signedTransaction|rawTransaction|rpcUrl/i.test(key), 'Confidential configuration cannot be saved.');
      inspect(child);
    }
  }
  inspect(journal);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file + '.tmp', JSON.stringify(journal, null, 2) + '\n', { mode: 0o600 });
  fs.renameSync(file + '.tmp', file);
}

function read(root) {
  const p = paths(root);
  check(fs.existsSync(p.journal), 'V5 journal is missing; no V5 deployment is claimed.');
  const journal = JSON.parse(fs.readFileSync(p.journal, 'utf8'));
  validate(journal);
  return journal;
}

async function locked(root, work) {
  const p = paths(root);
  fs.mkdirSync(p.directory, { recursive: true });
  let fd;
  try {
    fd = fs.openSync(p.lock, 'wx');
  } catch {
    check(false, 'V5 lock exists. Inspect processes/status before any removal.');
  }
  try {
    return await work(p);
  } finally {
    fs.closeSync(fd);
    fs.unlinkSync(p.lock);
  }
}

async function run({ journal, key, signer, request, save: write, timeout }) {
  validate(journal);
  check(Object.hasOwn(stages, key), 'Unknown V5 operation.');
  const chainId = stages[key];
  check(BigInt(await signer.provider.send('eth_chainId', [])) === BigInt(chainId), 'Wrong V5 operation network.');
  const view = { deployer: journal.deployer, operations: {} };
  if (journal.operations[key]) view.operations.configure = journal.operations[key];
  return runOperation({
    journal: view,
    key: 'configure',
    signer,
    request,
    chainId,
    timeout,
    save() {
      journal.operations[key] = view.operations.configure;
      write();
    }
  });
}

module.exports = { check, paths, validate, create, save, read, locked, run, stages };
