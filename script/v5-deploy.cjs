// Strictly read-only V5 deployment planner. Never reads private keys or sends transactions.
const fs = require('node:fs');
const { ContractFactory, getAddress, getCreateAddress, keccak256, ZeroAddress } = require('ethers');
const compile = require('./compile-renewable.cjs');
const { rpc, preflight, PROXY } = require('./m2-network.cjs');

const admissionKeys = ['workLimit', 'activeLimit', 'horizon', 'cooldown', 'retries'];
const json = value => JSON.stringify(value, (_, item) => (typeof item === 'bigint' ? item.toString() : item), 2);

function check(condition, message) {
  if (!condition) {
    const error = new Error(message);
    error.v5Expected = true;
    throw error;
  }
}

function settings(input) {
  check(
    input &&
      Object.keys(input).length === 3 &&
      input.admission &&
      typeof input.adaptiveTimers === 'boolean' &&
      input.constructorFunding,
    'Explicit V5 admission, adaptiveTimers, and constructorFunding configuration required.'
  );
  check(
    Object.keys(input.admission).length === admissionKeys.length &&
      admissionKeys.every(key => Object.hasOwn(input.admission, key)),
    'Unexpected V5 admission fields.'
  );
  check(
    Object.keys(input.constructorFunding).length === 2 &&
      ['reactive', 'callback'].every(key => Object.hasOwn(input.constructorFunding, key)),
    'Unexpected V5 funding fields.'
  );
  const out = { admission: {}, adaptiveTimers: input.adaptiveTimers, constructorFunding: {} };
  for (const key of admissionKeys) {
    const raw = String(input.admission[key]);
    check(/^[1-9]\d*$/.test(raw), 'V5 admission limits must be positive whole decimal values.');
    const value = BigInt(raw);
    const bits = key === 'horizon' || key === 'cooldown' ? 64n : 32n;
    check(value < 1n << bits, 'V5 admission configuration exceeds its Solidity type.');
    out.admission[key] = raw;
  }
  check(
    BigInt(out.admission.workLimit) >= BigInt(out.admission.activeLimit),
    'Work limit cannot be smaller than active capacity.'
  );
  check(BigInt(out.admission.horizon) >= 30n, 'The V5 planner requires at least a 30-second horizon.');
  for (const key of ['reactive', 'callback']) {
    const raw = String(input.constructorFunding[key]);
    check(
      /^[1-9]\d*$/.test(raw) && BigInt(raw) < 1n << 256n,
      'Constructor funding must be explicit positive native wei.'
    );
    out.constructorFunding[key] = raw;
  }
  return out;
}

let cachedArtifacts;
function artifacts() {
  return (cachedArtifacts ??= Object.fromEntries(
    ['SettlioReactiveV5', 'SettlioCallbackV5', 'SettlioEscrowV5', 'SettlioWorkLedger'].map(name => [name, compile(name)])
  ));
}

function frozen(config) {
  const built = artifacts();
  return {
    config: settings(config),
    sourceHashes: Object.fromEntries(
      Object.entries(built).map(([name, artifact]) => [name, keccak256('0x' + artifact.evm.bytecode.object)])
    )
  };
}

function argsFor(frozenConfig, reactive, deployer) {
  return [
    PROXY,
    reactive,
    deployer,
    ...admissionKeys.map(key => BigInt(frozenConfig.config.admission[key]))
  ];
}

async function creation(artifact, args, value) {
  return new ContractFactory(artifact.abi, artifact.evm.bytecode.object).getDeployTransaction(...args, {
    value: BigInt(value),
    type: 0
  });
}

async function plan({ deployer, config, base, lasna, networkCheck = preflight }) {
  deployer = getAddress(deployer);
  check(deployer !== ZeroAddress, 'Nonzero deployer required.');
  const frozenConfig = frozen(config);
  const built = artifacts();
  const network = await networkCheck(base, lasna);
  const predicted = getCreateAddress({
    from: deployer,
    nonce: await lasna.getTransactionCount(deployer, 'pending')
  });
  const source = await creation(
    built.SettlioReactiveV5,
    [84532, frozenConfig.config.adaptiveTimers],
    frozenConfig.config.constructorFunding.reactive
  );
  const destination = await creation(
    built.SettlioCallbackV5,
    argsFor(frozenConfig, predicted, deployer),
    frozenConfig.config.constructorFunding.callback
  );
  const [sourceGas, destinationGas, sourceFee, destinationFee, sourceBalance, destinationBalance] = await Promise.all([
    lasna.estimateGas({ ...source, from: deployer }),
    base.estimateGas({ ...destination, from: deployer }),
    lasna.getFeeData(),
    base.getFeeData(),
    lasna.getBalance(deployer),
    base.getBalance(deployer)
  ]);
  check(sourceFee.gasPrice && destinationFee.gasPrice, 'Gas price unavailable.');
  return {
    readOnly: true,
    policyVersion: 5,
    deployer,
    settings: frozenConfig,
    network,
    predictedReactive: predicted,
    creationGas: { reactive: sourceGas, callback: destinationGas },
    estimatedCreationCost: {
      reactive: BigInt(frozenConfig.config.constructorFunding.reactive) + (sourceGas * 120n) / 100n * sourceFee.gasPrice,
      callback: BigInt(frozenConfig.config.constructorFunding.callback) + (destinationGas * 120n) / 100n * destinationFee.gasPrice
    },
    walletBalances: { reactive: sourceBalance, base: destinationBalance },
    note: 'Read-only V5 creation estimate. Configuration, work-ledger grant, and future fees are additional. No deployment, funding, or grant sent.'
  };
}

async function main() {
  const [mode, file, deployer] = process.argv.slice(2);
  check(mode === 'plan', 'Only read-only V5 plan mode is enabled.');
  check(file && deployer, 'Usage: node script/v5-deploy.cjs plan <config.json> <deployer>');
  const config = settings(JSON.parse(fs.readFileSync(file, 'utf8')));
  const base = rpc(process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org');
  const lasna = rpc(process.env.LASNA_RPC || 'https://lasna-rpc.rnk.dev');
  try {
    console.log(json(await plan({ deployer, config, base, lasna })));
  } finally {
    base.destroy();
    lasna.destroy();
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error(error.v5Expected ? error.message : 'V5 planner failed.');
    process.exitCode = 1;
  });
}

module.exports = { settings, frozen, argsFor, plan };
