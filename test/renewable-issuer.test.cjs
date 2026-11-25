const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { ContractFactory, Contract, Interface, AbiCoder, keccak256, NonceManager } = require('ethers');
const start = require('./helpers/local-chain.cjs');
const compile = require('../script/compile-renewable.cjs');
const accounting = require('../script/renewable-commitments.cjs');
const reader = require('../script/renewable-reader.cjs');
const issuer = require('../script/renewable-issuer.cjs');

const coder = AbiCoder.defaultAbiCoder();
const CONFIG = 'tuple(uint256 chainId,address recipient,uint64 gasLimit,bytes payload)';
const fixture = { 'test/fixtures/ReaderProtocolFixture.sol': { content: fs.readFileSync('test/fixtures/ReaderProtocolFixture.sol', 'utf8') } };
const arts = {};
const art = n => arts[n] ??= compile(n, fixture);

async function setup(t) {
  const base = await start(t, { chainId: 84532 });
  const source = await start(t, { chainId: 5318007 });
  const owner = await base.signers[0].getAddress();
  await source.provider.send('anvil_setBalance', [owner, '0x3635c9adc5dea00000']);
  const ss = new NonceManager(base.signers[0].signer.connect(source.provider));
  async function deploy(name, signer, args = []) {
    const a = art(name);
    const c = await new ContractFactory(a.abi, a.evm.bytecode.object, signer).deploy(...args);
    await c.waitForDeployment();
    return c;
  }
  const prototype = await deploy('ReaderProtocolFixture', base.signers[0]);
  const code = await base.provider.getCode(prototype.target);
  await base.provider.send('anvil_setCode', [reader.PROXY, code]);
  await source.provider.send('anvil_setCode', [reader.SYSTEM, code]);
  const proxy = new Contract(reader.PROXY, art('ReaderProtocolFixture').abi, base.signers[0]);
  const system = new Contract(reader.SYSTEM, art('ReaderProtocolFixture').abi, ss);
  const reactive = await deploy('SettlioReactiveV5', ss, [84532, false]);
  const receiver = await deploy('SettlioCallbackV5', base.signers[0], [reader.PROXY, reactive.target, owner, 2, 2, 900, 60, 1]);
  const escrow = new Contract(await receiver.escrow(), art('SettlioEscrowV5').abi, base.signers[0]);
  const gate = new Contract(await escrow.admission(), art('SettlioWorkLedger').abi, base.signers[0]);
  await (await reactive.configure(escrow.target, receiver.target, gate.target)).wait();
  await (await system.depositTo(reactive.target, { value: 1000000000000000000n })).wait();
  await (await proxy.depositTo(receiver.target, { value: 1000000000000000000n })).wait();

  const lower = s => s.toLowerCase();
  const identity = {
    policyVersion: 5,
    baseChainId: '84532',
    sourceChainId: '5318007',
    escrow: lower(escrow.target),
    receiver: lower(receiver.target),
    reactive: lower(reactive.target),
    workLedger: lower(gate.target),
    sponsor: lower(owner)
  };
  const runtimeHashes = {};
  for (const [name, c, p] of [['escrow', escrow, base.provider], ['receiver', receiver, base.provider], ['reactive', reactive, source.provider], ['workLedger', gate, base.provider]]) {
    runtimeHashes[name] = keccak256(await p.getCode(c.target));
  }
  const profile = {
    sourceAllowanceWei: '10000000000000000',
    destinationAllowanceWei: '1000000000000000',
    sourceBufferWei: '1000',
    destinationBufferWei: '1000',
    maxHorizonSeconds: '900',
    maxWork: '2',
    maxGrantSeconds: '600',
    maxObservationAgeSeconds: '120',
    maxHeadAgeSeconds: '180',
    sourcePriceCapWei: '1000000000000',
    destinationPriceCapWei: '1000000000000',
    sourceCoefficient: '1000',
    destinationCoefficient: '1100',
    sourceSurcharge: '100000',
    destinationSurcharge: '80000',
    adaptiveTimers: false,
    runtimeHashes,
    modelReviewHash: keccak256('0x1234')
  };
  const manifest = {
    baseCreationHash: receiver.deploymentTransaction().hash,
    sourceCreationHash: reactive.deploymentTransaction().hash,
    configuration: { maxActive: '2', maxRetries: '1', retryInterval: '60', sourceConstructorWei: '0', destinationConstructorWei: '0' },
    serviceRuntimeHashes: { proxy: keccak256(code), system: keccak256(code) }
  };
  const baseRPC = { send: (m, p) => base.provider.send(m, p) };
  const sourceRPC = {
    send: async (m, p) => {
      if (m !== 'rnk_getFilters') return source.provider.send(m, p);
      const TopicFilters = [];
      for (let n = 0; n < Number(await system.countFilters()); n++) {
        const f = await system.getFunction('filters')(n);
        TopicFilters.push({
          ChainId: f.chain.toString(),
          Contract: f.target,
          Topics: ['0x' + f.topic.toString(16).padStart(64, '0'), ...[f.t1, f.t2, f.t3].map(v => v === BigInt('0xa65f96fc951c35ead38878e0f0b7a3c744a6f5ccc1476b313353ce31712313ad') ? null : '0x' + v.toString(16).padStart(64, '0'))],
          Configs: [{ Contract: f.subscriber, Active: f.active }]
        });
      }
      return { Version: Number(await system.version()), TopicFilters };
    }
  };
  async function now() {
    return Math.max((await base.provider.getBlock('latest')).timestamp, (await source.provider.getBlock('latest')).timestamp);
  }
  async function mineFinality() {
    for (const chain of [base, source]) await chain.provider.send('anvil_mine', ['0x80', '0x0']);
  }
  let sequence = 100000;
  async function trigger(log) {
    return (await system.trigger(reactive.target, log, { gasLimit: 900000 })).wait();
  }
  async function forward(receipt) {
    for (const l of receipt.logs) {
      if (![escrow.target, gate.target].some(a => lower(a) === lower(l.address))) continue;
      await trigger({
        chainId: 84532,
        contractAddress: l.address,
        topic0: BigInt(l.topics[0]),
        topic1: BigInt(l.topics[1] || 0),
        topic2: BigInt(l.topics[2] || 0),
        topic3: BigInt(l.topics[3] || 0),
        data: l.data,
        blockNumber: receipt.blockNumber,
        opCode: l.topics.length,
        blockHash: BigInt(receipt.blockHash),
        txHash: BigInt(receipt.hash),
        logIndex: l.index
      });
    }
  }
  async function tick() {
    const n = ++sequence;
    return trigger({
      chainId: 5318007,
      contractAddress: await reactive.CRON_SOURCE(),
      topic0: await reactive.CRON_TOPIC(),
      topic1: n,
      topic2: 0,
      topic3: 0,
      data: '0x',
      blockNumber: n,
      opCode: 2,
      blockHash: BigInt(n),
      txHash: BigInt(n),
      logIndex: 0
    });
  }
  const sysI = new Interface(['event CallbackRequest(uint256 indexed chainId,address indexed sender,address indexed recipient,uint8 version,bytes configuration)']);
  async function deliver(requestReceipt, index = 0) {
    const log = requestReceipt.logs.filter(l => lower(l.address) === reader.SYSTEM && l.topics[0] === sysI.getEvent('CallbackRequest').topicHash)[index];
    const e = sysI.parseLog(log).args;
    const cfg = coder.decode([CONFIG], e.configuration)[0];
    const parsed = receiver.interface.parseTransaction({ data: cfg.payload });
    const args = [...parsed.args];
    args[0] = reactive.target;
    const encoded = coder.encode([CONFIG], [[cfg.chainId, cfg.recipient, cfg.gasLimit, receiver.interface.encodeFunctionData(parsed.name, args)]]);
    const receipt = await (await proxy.deliverCallback(0, encoded)).wait();
    await (await system.recordReport(BigInt(requestReceipt.hash), requestReceipt.blockNumber, reactive.target, index, 84532, BigInt(receipt.hash), '0x')).wait();
    return receipt;
  }
  return { base, source, baseRPC, sourceRPC, escrow, gate, identity, profile, manifest, now, mineFinality, forward, tick, deliver };
}

test('V5 local issuer orchestrator reserves journal intent, issues grant, reconciles settlement and renews epoch', async t => {
  const f = await setup(t);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'settlio-issuer-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const journalFile = path.join(dir, 'renewable-commitments.local.json');
  accounting.initialize(journalFile, accounting.create(f.identity, f.profile));

  await f.mineFinality();
  const t0 = await f.now();
  await assert.rejects(
    issuer.issueGrant({
      journalFile,
      base: f.baseRPC,
      source: f.sourceRPC,
      manifest: f.manifest,
      proposal: { id: 'g1', merchant: f.identity.sponsor, epoch: '1', credits: '1', expiresAt: String(t0 + 500) },
      signer: f.base.signers[0],
      now: t0
    }),
    /localOnly/
  );
  await assert.rejects(
    issuer.issueGrant({
      journalFile,
      base: f.baseRPC,
      source: f.sourceRPC,
      manifest: f.manifest,
      proposal: { id: 'g1', merchant: f.identity.sponsor, epoch: '1', credits: '1', expiresAt: String(t0 + 500) },
      signer: f.base.signers[1],
      now: t0,
      localOnly: true
    }),
    /sponsor/
  );

  const g1 = await issuer.issueGrant({
    journalFile,
    base: f.baseRPC,
    source: f.sourceRPC,
    manifest: f.manifest,
    proposal: { id: 'g1', merchant: f.identity.sponsor, epoch: '1', credits: '1', expiresAt: String(t0 + 500) },
    signer: f.base.signers[0],
    now: t0,
    openAdmission: true,
    localOnly: true
  });
  assert.equal(g1.reusedExistingGrant, false);
  assert.ok(g1.txHash);
  assert.equal(accounting.totals(g1.state).unusedCredits, '1');

  // Re-running with the same intent after tx is mined is idempotent and does not broadcast a duplicate tx.
  await f.mineFinality();
  const g1Retry = await issuer.issueGrant({
    journalFile,
    base: f.baseRPC,
    source: f.sourceRPC,
    manifest: f.manifest,
    proposal: { id: 'g1', merchant: f.identity.sponsor, epoch: '1', credits: '1', expiresAt: String(t0 + 500) },
    signer: f.base.signers[0],
    now: await f.now(),
    localOnly: true
  });
  assert.equal(g1Retry.reusedExistingGrant, true);
  assert.equal(g1Retry.txHash, null);

  const now1 = await f.now();
  await f.forward(await (await f.escrow.createQuote(await f.base.signers[1].getAddress(), 300, 100, now1 + 100, now1 + 200, keccak256('0x1234'))).wait());
  for (const c of [f.base, f.source]) {
    await c.provider.send('evm_setNextBlockTimestamp', [now1 + 100]);
    await c.provider.send('evm_mine', []);
  }
  await f.forward(await f.deliver(await f.tick()));
  await f.forward(await f.deliver(await f.tick()));
  await f.mineFinality();

  const settled = await issuer.reconcile({ journalFile, base: f.baseRPC, source: f.sourceRPC, manifest: f.manifest, now: await f.now(), previousCheckpoint: g1Retry.checkpoint });
  assert.equal(accounting.totals(settled.state).sourceHeldWei, '0');

  const now2 = await f.now();
  const g2 = await issuer.issueGrant({
    journalFile,
    base: f.baseRPC,
    source: f.sourceRPC,
    manifest: f.manifest,
    proposal: { id: 'g2', merchant: f.identity.sponsor, epoch: '2', credits: '1', expiresAt: String(now2 + 500) },
    signer: f.base.signers[0],
    now: now2,
    previousCheckpoint: settled.checkpoint,
    localOnly: true
  });
  assert.equal(g2.reusedExistingGrant, false);
  assert.equal(accounting.totals(g2.state).unusedCredits, '1');
});
