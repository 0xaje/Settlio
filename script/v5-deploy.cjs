// Version-isolated V5 plan/deploy/verify/status/open/grant commands.
// Only deploy, open, and grant read DEPLOYER_PRIVATE_KEY from the environment.
const fs = require('node:fs');
const path = require('node:path');
const { Contract, ContractFactory, Wallet, getAddress, getCreateAddress, keccak256, toUtf8Bytes, ZeroAddress } = require('ethers');
const compile = require('./compile-renewable.cjs');
const state = require('./v5-state.cjs');
const { rpc, preflight, PROXY, SYSTEM, USDC } = require('./m2-network.cjs');
const { assertCreation, assertRuntime } = require('./m2-code.cjs');

const root = path.join(__dirname, '..');
const admissionKeys = ['workLimit', 'activeLimit', 'horizon', 'cooldown', 'retries'];
const same = (a, b) => getAddress(a) === getAddress(b);
const json = value => JSON.stringify(value, (_, item) => (typeof item === 'bigint' ? item.toString() : item), 2);
const check = state.check;

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

function publicIdentity(journal) {
  return {
    policyVersion: 5,
    escrow: journal.escrow,
    callback: journal.contracts.SettlioCallbackV5.address,
    reactive: journal.contracts.SettlioReactiveV5.address,
    workLedger: journal.workLedger,
    sponsor: journal.deployer
  };
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
      reactive: BigInt(frozenConfig.config.constructorFunding.reactive) + ((sourceGas * 120n) / 100n) * sourceFee.gasPrice,
      callback: BigInt(frozenConfig.config.constructorFunding.callback) + ((destinationGas * 120n) / 100n) * destinationFee.gasPrice
    },
    walletBalances: { reactive: sourceBalance, base: destinationBalance },
    note: 'Read-only V5 creation estimate. Configuration, work-ledger grant, and future fees are additional. No deployment, funding, or grant sent.'
  };
}

async function verify({ journal, base, lasna }) {
  state.validate(journal);
  check(
    BigInt(await base.send('eth_chainId', [])) === 84532n && BigInt(await lasna.send('eth_chainId', [])) === 5318007n,
    'Wrong V5 verification networks.'
  );
  check(json(journal.settings) === json(frozen(journal.settings.config)), 'V5 source/settings changed. Keep the journal; review saved intents.');
  const built = artifacts();
  for (const [name, provider, args, key, chainId] of [
    ['SettlioReactiveV5', lasna, [84532, journal.settings.config.adaptiveTimers], 'deployReactive', 5318007],
    ['SettlioCallbackV5', base, argsFor(journal.settings, journal.contracts.SettlioReactiveV5.address, journal.deployer), 'deployCallback', 84532]
  ]) {
    check(
      journal.operations[key]?.unsigned?.value ===
        journal.settings.config.constructorFunding[name === 'SettlioReactiveV5' ? 'reactive' : 'callback'],
      'V5 constructor funding differs from saved configuration.'
    );
    await assertCreation({
      entry: journal.contracts[name],
      operation: journal.operations[key],
      artifact: built[name],
      args,
      provider,
      deployer: journal.deployer,
      chainId
    });
  }

  const id = publicIdentity(journal);
  const r = new Contract(id.reactive, built.SettlioReactiveV5.abi, lasna);
  const c = new Contract(id.callback, built.SettlioCallbackV5.abi, base);
  const e = new Contract(id.escrow, built.SettlioEscrowV5.abi, base);
  const l = new Contract(id.workLedger, built.SettlioWorkLedger.abi, base);
  assertRuntime(await base.getCode(id.escrow), built.SettlioEscrowV5);
  assertRuntime(await base.getCode(id.workLedger), built.SettlioWorkLedger);

  const [
    rv,
    ev,
    owner,
    origin,
    adaptive,
    originEscrow,
    target,
    reactiveLedger,
    service,
    callbackEscrow,
    proxy,
    sender,
    er,
    el,
    ewl,
    ls,
    maxWork,
    maxActive,
    maxHorizon,
    cooldown,
    retries
  ] = await Promise.all([
    r.POLICY_VERSION(),
    e.POLICY_VERSION(),
    r.owner(),
    r.originChain(),
    r.adaptiveTimers(),
    r.originEscrow(),
    r.callbackReceiver(),
    r.workLedger(),
    r._SERVICE_PROVIDER(),
    c.escrow(),
    c._SERVICE_PROVIDER(),
    c._CALLBACK_SENDER(),
    e.callbackReceiver(),
    e.admission(),
    l.escrow(),
    l.sponsor(),
    l.maxWork(),
    l.maxActive(),
    l.maxHorizon(),
    e.retryInterval(),
    e.maxRetries()
  ]);

  const expected = journal.settings.config.admission;
  check(
    rv === 5n &&
      ev === 5n &&
      same(owner, journal.deployer) &&
      origin === 84532n &&
      adaptive === journal.settings.config.adaptiveTimers &&
      same(originEscrow, id.escrow) &&
      same(target, id.callback) &&
      same(reactiveLedger, id.workLedger) &&
      same(service, SYSTEM) &&
      same(callbackEscrow, id.escrow) &&
      same(proxy, PROXY) &&
      same(sender, id.reactive) &&
      same(er, id.callback) &&
      same(el, id.workLedger) &&
      same(ewl, id.escrow) &&
      same(ls, journal.deployer) &&
      maxWork === BigInt(expected.workLimit) &&
      maxActive === BigInt(expected.activeLimit) &&
      maxHorizon === BigInt(expected.horizon) &&
      cooldown === BigInt(expected.cooldown) &&
      retries === BigInt(expected.retries),
    'V5 immutable wiring/version/limits mismatch.'
  );

  const configured = journal.operations.configure;
  const tx = configured && (await lasna.getTransaction(configured.hash));
  const receipt = configured && (await lasna.getTransactionReceipt(configured.hash));
  check(
    configured?.status === 'confirmed' &&
      receipt?.status === 1 &&
      tx &&
      same(tx.from, journal.deployer) &&
      same(tx.to, id.reactive) &&
      tx.chainId === 5318007n &&
      tx.value === 0n &&
      tx.data === r.interface.encodeFunctionData('configure', [id.escrow, id.callback, id.workLedger]),
    'V5 configuration receipt mismatch.'
  );

  const token = new Contract(USDC, ['function balanceOf(address) view returns(uint256)'], base);
  const [activeJobs, paused, cronActive, quoteCount, open, active, reserved, unsettled, totalAdmitted, nativeLiability, nativeBalance, mappedNative, tokenLiability, tokenBalance] =
    await Promise.all([
      r.activeJobCount(),
      r.schedulerPaused(),
      r.cronSubscribed(),
      e.quoteCount(),
      l.open(),
      l.active(),
      l.reserved(),
      l.unsettled(),
      l.totalAdmitted(),
      e.totalLiability(),
      base.getBalance(id.escrow),
      e.liability(ZeroAddress),
      e.liability(USDC),
      token.balanceOf(id.escrow)
    ]);

  check(
    cronActive === (!paused && activeJobs > 0n) &&
      nativeBalance >= nativeLiability &&
      mappedNative === nativeLiability &&
      tokenBalance >= tokenLiability &&
      active <= maxActive &&
      unsettled <= maxWork &&
      reserved + unsettled <= maxWork,
    'V5 scheduler/custody/work-ledger invariant failed.'
  );

  const filtersResponse = await lasna.send('rnk_getFilters', []);
  const topicFilters = filtersResponse?.TopicFilters || [];
  const expectedEscrowTopics = await Promise.all(
    [
      'WORK_TOPIC',
      'CLOSURE_RETRY_TOPIC',
      'DEPOSIT_TOPIC',
      'RETRY_TOPIC',
      'POLICY_TOPIC',
      'POLICY_RETRY_TOPIC',
      'CANCEL_TOPIC',
      'CONFIRMED_TOPIC',
      'CHECKED_TOPIC',
      'REFUNDED_TOPIC',
      'EXPIRED_TOPIC',
      'RELEASED_TOPIC'
    ].map(name => r[name]().then(v => '0x' + v.toString(16).padStart(64, '0')))
  );
  const settledTopic = '0x' + (await r.SETTLED_TOPIC()).toString(16).padStart(64, '0');
  const hasFilter = (contractAddr, topic0) =>
    topicFilters.some(
      f =>
        same(f.Contract || ZeroAddress, contractAddr) &&
        Array.isArray(f.Topics) &&
        String(f.Topics[0] || '').toLowerCase() === topic0.toLowerCase() &&
        Array.isArray(f.Configs) &&
        f.Configs.some(cfg => cfg.Active === true && same(cfg.Contract || ZeroAddress, id.reactive))
    );
  check(
    expectedEscrowTopics.every(t => hasFilter(id.escrow, t)) && hasFilter(id.workLedger, settledTopic),
    'V5 reactive event subscriptions are missing.'
  );

  return {
    readOnly: true,
    identity: id,
    wiringVerified: true,
    adaptiveTimers: adaptive,
    quoteCount,
    activeJobs,
    paused,
    cronActive,
    workLedger: { open, active, reserved, unsettled, totalAdmitted, maxActive, maxWork, maxHorizon },
    nativeCustody: { balance: nativeBalance, liability: nativeLiability },
    usdcCustody: { balance: tokenBalance, liability: tokenLiability }
  };
}

async function deploy({ config, base, lasna, env = process.env, directoryRoot = root, networkCheck = preflight }) {
  check(env.DEPLOYER_PRIVATE_KEY, 'Supply DEPLOYER_PRIVATE_KEY only through a hidden local prompt.');
  const bs = new Wallet(env.DEPLOYER_PRIVATE_KEY, base);
  const ls = new Wallet(env.DEPLOYER_PRIVATE_KEY, lasna);
  return state.locked(directoryRoot, async p => {
    await networkCheck(base, lasna);
    const frozenConfig = frozen(config);
    const journal = fs.existsSync(p.journal) ? state.read(directoryRoot) : state.create(bs.address, frozenConfig);
    check(
      same(journal.deployer, bs.address) && json(journal.settings) === json(frozenConfig),
      'V5 signer/source/settings differ from saved journal; do not replace it.'
    );
    const save = () => state.save(p.journal, journal);
    save();
    const built = artifacts();

    async function deployOne(name, key, signer, args, value, chainId) {
      const request = await creation(built[name], args, value);
      const receipt = await state.run({ journal, key, signer, request, save });
      check(receipt.contractAddress, `Missing ${name} creation address.`);
      const entry = {
        address: getAddress(receipt.contractAddress),
        transactionHash: receipt.hash,
        chainId,
        creationBytecodeHash: frozenConfig.sourceHashes[name]
      };
      if (journal.contracts[name]) check(json(journal.contracts[name]) === json(entry), `V5 saved ${name} entry differs.`);
      await assertCreation({
        entry,
        operation: journal.operations[key],
        artifact: built[name],
        args,
        provider: signer.provider,
        deployer: journal.deployer,
        chainId
      });
      journal.contracts[name] = entry;
      save();
      return new Contract(entry.address, built[name].abi, signer);
    }

    const r = await deployOne(
      'SettlioReactiveV5',
      'deployReactive',
      ls,
      [84532, frozenConfig.config.adaptiveTimers],
      frozenConfig.config.constructorFunding.reactive,
      5318007
    );
    const c = await deployOne(
      'SettlioCallbackV5',
      'deployCallback',
      bs,
      argsFor(frozenConfig, r.target, bs.address),
      frozenConfig.config.constructorFunding.callback,
      84532
    );

    const escrow = getAddress(await c.escrow());
    const workLedger = getAddress(await new Contract(escrow, built.SettlioEscrowV5.abi, base).admission());
    check(
      (!journal.escrow || same(journal.escrow, escrow)) && (!journal.workLedger || same(journal.workLedger, workLedger)),
      'V5 embedded address differs.'
    );
    journal.escrow = escrow;
    journal.workLedger = workLedger;
    save();

    await state.run({
      journal,
      key: 'configure',
      signer: ls,
      request: await r.configure.populateTransaction(escrow, c.target, workLedger),
      save
    });
    const observation = await verify({ journal, base, lasna });
    journal.wiringVerified = true;
    journal.verifiedAt = new Date().toISOString();
    save();
    return { journal: p.journal, observation };
  });
}

async function open({ base, lasna, env = process.env, directoryRoot = root }) {
  check(env.DEPLOYER_PRIVATE_KEY, 'Supply DEPLOYER_PRIVATE_KEY only through a hidden local prompt.');
  const signer = new Wallet(env.DEPLOYER_PRIVATE_KEY, base);
  return state.locked(directoryRoot, async p => {
    const journal = state.read(directoryRoot);
    check(same(signer.address, journal.deployer), 'V5 sponsor key differs from deployment.');
    await verify({ journal, base, lasna });
    const built = artifacts();
    const ledger = new Contract(journal.workLedger, built.SettlioWorkLedger.abi, signer);
    const save = () => state.save(p.journal, journal);
    const receipt = await state.run({
      journal,
      key: 'openAdmission',
      signer,
      request: await ledger.setOpen.populateTransaction(true),
      save
    });
    return { open: await ledger.open(), transactionHash: receipt.hash };
  });
}

async function grant({
  merchant,
  credits,
  validSeconds,
  epoch,
  base,
  lasna,
  env = process.env,
  directoryRoot = root,
  clock = () => BigInt(Math.floor(Date.now() / 1000))
}) {
  check(env.DEPLOYER_PRIVATE_KEY, 'Supply DEPLOYER_PRIVATE_KEY only through a hidden local prompt.');
  merchant = getAddress(merchant);
  check(merchant !== ZeroAddress, 'Nonzero merchant address required.');
  check(/^[1-9]\d*$/.test(String(credits)) && /^[1-9]\d*$/.test(String(validSeconds)), 'Positive credits and validSeconds required.');
  const signer = new Wallet(env.DEPLOYER_PRIVATE_KEY, base);
  return state.locked(directoryRoot, async p => {
    const journal = state.read(directoryRoot);
    check(same(signer.address, journal.deployer), 'V5 sponsor key differs from deployment.');
    await verify({ journal, base, lasna });
    const built = artifacts();
    const ledger = new Contract(journal.workLedger, built.SettlioWorkLedger.abi, signer);
    const current = await ledger.grants(merchant);
    const nextEpoch = epoch !== undefined ? BigInt(epoch) : BigInt(current.epoch) + 1n;
    const expires = (await clock()) + BigInt(validSeconds);
    const profile = keccak256(toUtf8Bytes('settlio-v5-renewable-default'));
    const observation = keccak256(
      toUtf8Bytes(
        JSON.stringify({
          escrow: journal.escrow,
          workLedger: journal.workLedger,
          merchant,
          epoch: nextEpoch.toString(),
          credits: String(credits),
          expires: expires.toString()
        })
      )
    );
    const save = () => state.save(p.journal, journal);
    const receipt = await state.run({
      journal,
      key: 'grantInitial',
      signer,
      request: await ledger.setGrant.populateTransaction(
        merchant,
        nextEpoch,
        BigInt(credits),
        expires,
        profile,
        observation
      ),
      save
    });
    const updated = await ledger.grants(merchant);
    return {
      merchant,
      epoch: updated.epoch,
      remaining: updated.remaining,
      expires: updated.expires,
      transactionHash: receipt.hash
    };
  });
}

async function status({ base, lasna, directoryRoot = root }) {
  const p = state.paths(directoryRoot);
  if (!fs.existsSync(p.journal)) {
    return { readOnly: true, journalExists: false, lockExists: fs.existsSync(p.lock), operations: [] };
  }
  const journal = state.read(directoryRoot);
  const operations = [];
  for (const [key, op] of Object.entries(journal.operations)) {
    check(Object.hasOwn(state.stages, key) && /^0x[0-9a-f]{64}$/i.test(op.hash), 'Invalid V5 saved operation.');
    const provider = state.stages[key] === 84532 ? base : lasna;
    check(BigInt(await provider.send('eth_chainId', [])) === BigInt(state.stages[key]), 'Wrong V5 status network.');
    const receipt = await provider.getTransactionReceipt(op.hash);
    operations.push({
      operation: key,
      hash: op.hash,
      savedState: op.status,
      state: receipt ? (receipt.status === 1 ? 'succeeded' : 'failed') : 'unknown',
      block: receipt?.blockNumber ?? null
    });
  }
  return {
    readOnly: true,
    journalExists: true,
    lockExists: fs.existsSync(p.lock),
    identity: journal.escrow ? publicIdentity(journal) : null,
    operations
  };
}

async function main() {
  const [mode, arg1, arg2, arg3] = process.argv.slice(2);
  check(['plan', 'deploy', 'verify', 'status', 'open', 'grant'].includes(mode), 'Use V5 plan, deploy, verify, status, open, or grant.');
  const base = rpc(process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org');
  const lasna = rpc(process.env.LASNA_RPC || 'https://lasna-rpc.rnk.dev');
  try {
    let result;
    if (mode === 'plan' || mode === 'deploy') {
      check(arg1, 'Explicit V5 config JSON path required.');
      const config = settings(JSON.parse(fs.readFileSync(arg1, 'utf8')));
      result =
        mode === 'plan'
          ? await plan({ deployer: arg2, config, base, lasna })
          : await deploy({ config, base, lasna });
    } else if (mode === 'verify') {
      result = await verify({ journal: state.read(root), base, lasna });
    } else if (mode === 'status') {
      result = await status({ base, lasna });
    } else if (mode === 'open') {
      result = await open({ base, lasna });
    } else {
      check(arg1 && arg2 && arg3, 'Usage: node script/v5-deploy.cjs grant <merchant> <credits> <validSeconds>');
      result = await grant({ merchant: arg1, credits: arg2, validSeconds: arg3, base, lasna });
    }
    console.log(json(result));
  } finally {
    base.destroy();
    lasna.destroy();
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error(error.v5Expected || error.m2Expected ? error.message : 'V5 operation failed: ' + (error.message || error));
    process.exitCode = 1;
  });
}

module.exports = { settings, frozen, argsFor, publicIdentity, plan, verify, deploy, open, grant, status };
