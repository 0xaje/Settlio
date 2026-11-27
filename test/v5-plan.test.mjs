import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { AbiCoder, Contract, ContractFactory, ZeroAddress, keccak256, parseEther } from 'ethers';
import {
  ADMISSION_ESCROW_ABI,
  assertCreationAllowed,
  creationUnavailable,
  readAdmissionState,
  retryUnavailable
} from '../apps/web/src/admission.ts';
import { BASE_CALLBACK_PROXY, REACTIVE_SYSTEM, assertPolicyWiring, readPolicyVersion } from '../apps/web/src/policy.ts';
import { decodeTerms, encodeTerms, matchesQuote, termsHash } from '../apps/web/src/terms.ts';

const require = createRequire(import.meta.url);
const start = require('./helpers/local-chain.cjs');
const compileLegacy = require('../script/compile.cjs');
const compileAdmission = require('../script/compile-admission.cjs');
const compileRenewable = require('../script/compile-renewable.cjs');
const { SYSTEM, PROXY, USDC } = require('../script/m2-network.cjs');
const v5State = require('../script/v5-state.cjs');
const v5 = require('../script/v5-deploy.cjs');

const config = {
  admission: { workLimit: '8', activeLimit: '4', horizon: '1000', cooldown: '60', retries: '1' },
  adaptiveTimers: true,
  constructorFunding: { reactive: '100000000000000000', callback: '1000000000000000' }
};

test('V5 planner validates configuration and estimates Base Sepolia + Lasna creation gas without keys or writes', async t => {
  assert.deepEqual(v5.settings(config), config);
  for (const bad of [
    { ...config, extra: true },
    { ...config, adaptiveTimers: 'yes' },
    { ...config, admission: { ...config.admission, workLimit: '2' } },
    { ...config, admission: { ...config.admission, horizon: '10' } },
    { ...config, constructorFunding: { reactive: '0', callback: '1' } }
  ]) {
    assert.throws(() => v5.settings(bad));
  }

  const baseChain = await start(t, { chainId: 84532 });
  const lasnaChain = await start(t, { chainId: 5318007 });
  await baseChain.provider.send('anvil_setCode', [BASE_CALLBACK_PROXY, '0x00']);
  const deployer = await baseChain.signers[0].getAddress();
  await (await lasnaChain.signers[0].sendTransaction({ to: deployer, value: parseEther('1') })).wait();
  const nonceBeforeBase = await baseChain.provider.getTransactionCount(deployer);
  const nonceBeforeLasna = await lasnaChain.provider.getTransactionCount(deployer);

  const result = await v5.plan({
    deployer,
    config,
    base: baseChain.provider,
    lasna: lasnaChain.provider,
    networkCheck: async () => ({ baseChainId: 84532, lasnaChainId: 5318007 })
  });

  assert.equal(result.readOnly, true);
  assert.equal(result.policyVersion, 5);
  assert.ok(result.creationGas.reactive > 0n);
  assert.ok(result.creationGas.callback > 0n);
  assert.ok(result.estimatedCreationCost.reactive > BigInt(config.constructorFunding.reactive));
  assert.ok(result.estimatedCreationCost.callback > BigInt(config.constructorFunding.callback));
  assert.equal(await baseChain.provider.getTransactionCount(deployer), nonceBeforeBase);
  assert.equal(await lasnaChain.provider.getTransactionCount(deployer), nonceBeforeLasna);
});

test('V5 interface reader, policy wiring, and renewable work-ledger limits operate on isolated SettlioEscrowV5', async t => {
  const { provider, signers: [merchant, customer, receiver] } = await start(t, { chainId: 84532 });
  const who = await merchant.getAddress();
  const escrowArtifact = compileRenewable('SettlioEscrowV5');
  const deployed = await new ContractFactory(escrowArtifact.abi, escrowArtifact.evm.bytecode.object, merchant).deploy(
    await receiver.getAddress(),
    who,
    8,
    4,
    1000,
    60,
    1
  );
  await deployed.waitForDeployment();

  const escrow = new Contract(deployed.target, [...compileLegacy().abi, ...ADMISSION_ESCROW_ABI], merchant);
  const ledger = new Contract(await escrow.admission(), compileRenewable('SettlioWorkLedger').abi, merchant);

  const receiverAddress = await receiver.getAddress();
  assert.equal(await readPolicyVersion(() => escrow.POLICY_VERSION()), 5);
  assertPolicyWiring({
    baseChainId: 84532n,
    reactiveChainId: 5318007n,
    escrowVersion: 5,
    schedulerVersion: 5,
    escrow: deployed.target,
    receiver: receiverAddress,
    proxy: BASE_CALLBACK_PROXY,
    receiverEscrow: deployed.target,
    originChain: 84532n,
    originEscrow: deployed.target,
    callbackReceiver: receiverAddress,
    reactiveProvider: REACTIVE_SYSTEM
  });

  async function state(id) {
    const block = await provider.getBlock('latest');
    return readAdmissionState(provider, escrow, who, id, () => BigInt(block.timestamp));
  }

  assert.match(creationUnavailable(await state()), /paused/);
  await (await ledger.setOpen(true)).wait();
  assert.match(creationUnavailable(await state()), /no sponsored/);

  const now = (await provider.getBlock('latest')).timestamp;
  await (await ledger.setGrant(who, 1, 2, now + 500, '0x' + '15'.repeat(32), '0x' + '16'.repeat(32))).wait();
  const ready = await state();
  assert.equal(ready.policyVersion, 5);
  assert.equal(ready.maxWork, 8n);
  assert.equal(ready.unsettled, 0n);
  assert.equal(creationUnavailable(ready), '');

  const terms = {
    version: 5,
    automaticRelease: true,
    options: [{ asset: ZeroAddress, total: '300', deposit: '100' }],
    service: 'Local V5 UI verification',
    description: 'Isolated V5 fixture',
    merchant: who,
    customer: await customer.getAddress(),
    total: '300',
    deposit: '100',
    expiresAt: now + 300,
    refundCutoff: now + 600
  };
  assertCreationAllowed(ready, terms.expiresAt, terms.refundCutoff);

  await (await escrow.createQuoteWithPolicy(terms.customer, terms.options, terms.expiresAt, terms.refundCutoff, termsHash(terms), true)).wait();
  const q = await escrow.getQuote(1);
  const quote = {
    id: 1n,
    merchant: q.merchant,
    customer: q.customer,
    total: q.total,
    deposit: q.deposit,
    expiresAt: q.expiresAt,
    refundCutoff: q.refundCutoff,
    termsHash: q.termsHash,
    status: Number(q.status),
    asset: q.asset,
    selectedOption: Number(q.selectedOption),
    options: terms.options,
    policyVersion: 5,
    automaticRelease: true
  };
  assert.equal(matchesQuote(decodeTerms(encodeTerms(terms)), quote), true);

  await (await escrow.connect(customer).payDepositWithPolicy(1, 0, termsHash(terms), true, { value: 100 })).wait();
  assert.equal(retryUnavailable(await state(1)), '');
  await (await escrow.connect(customer).requestPolicy(1)).wait();
  assert.match(retryUnavailable(await state(1)), /used up/);

  await (await escrow.connect(customer).requestCancellation(1)).wait();
  await (await escrow.connect(customer).claimRefund(1)).wait();
  assert.equal((await escrow.getQuote(1)).status, 5n);
  assert.equal(await escrow.totalLiability(), 0n);
});

test('V5 deploy, verify, open, grant, and status execute cleanly on isolated local chains', async t => {
  const baseChain = await start(t, { chainId: 84532 });
  const lasnaChain = await start(t, { chainId: 5318007 });
  const directoryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'v5-deploy-'));
  t.after(() => fs.rmSync(directoryRoot, { recursive: true, force: true }));

  const key = baseChain.signers[0].signer.privateKey;
  const owner = await baseChain.signers[0].getAddress();
  await lasnaChain.provider.send('anvil_setBalance', [owner, '0x21e19e0c9bab2400000']);

  const mockSource = {
    'test/V5MockProtocol.sol': {
      content: `// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;
contract V5MockProtocol {
  mapping(bytes32 => bool) public subscriptions;
  mapping(address => uint256) public reserves;
  function debt(address) external pure returns (uint256) { return 0; }
  function depositTo(address target) external payable { reserves[target] += msg.value; }
  function balanceOf(address) external pure returns (uint256) { return 0; }
  function subscribe(uint256 chain, address target, uint256 t0, uint256 t1, uint256 t2, uint256 t3) external {
    subscriptions[keccak256(abi.encode(msg.sender, chain, target, t0, t1, t2, t3))] = true;
  }
  function unsubscribe(uint256 chain, address target, uint256 t0, uint256 t1, uint256 t2, uint256 t3) external {
    subscriptions[keccak256(abi.encode(msg.sender, chain, target, t0, t1, t2, t3))] = false;
  }
}`
    }
  };
  const mockArtifact = compileAdmission('V5MockProtocol', mockSource);
  const proto = await new ContractFactory(mockArtifact.abi, mockArtifact.evm.bytecode.object, lasnaChain.signers[1]).deploy();
  await proto.waitForDeployment();
  const code = await lasnaChain.provider.getCode(proto.target);
  await lasnaChain.provider.send('anvil_setCode', [SYSTEM, code]);
  await baseChain.provider.send('anvil_setCode', [PROXY, code]);
  await baseChain.provider.send('anvil_setCode', [USDC, code]);

  const system = new Contract(SYSTEM, mockArtifact.abi, lasnaChain.provider);
  const reactiveAbi = compileRenewable('SettlioReactiveV5').abi;
  const lasnaProxy = new Proxy(lasnaChain.provider, {
    get(target, prop) {
      if (prop !== 'send') {
        const val = target[prop];
        return typeof val === 'function' ? val.bind(target) : val;
      }
      return async (method, args) => {
        if (method !== 'rnk_getFilters') return target.send(method, args);
        const j = v5State.read(directoryRoot);
        const r = new Contract(j.contracts.SettlioReactiveV5.address, reactiveAbi, lasnaChain.provider);
        const ignore = BigInt('0xa65f96fc951c35ead38878e0f0b7a3c744a6f5ccc1476b313353ce31712313ad');
        const filters = [];
        for (const name of [
          'WORK_TOPIC', 'CLOSURE_RETRY_TOPIC', 'DEPOSIT_TOPIC', 'RETRY_TOPIC', 'POLICY_TOPIC',
          'POLICY_RETRY_TOPIC', 'CANCEL_TOPIC', 'CONFIRMED_TOPIC', 'CHECKED_TOPIC', 'REFUNDED_TOPIC',
          'EXPIRED_TOPIC', 'RELEASED_TOPIC'
        ]) {
          const topic = await r[name]();
          const lookup = keccak256(
            AbiCoder.defaultAbiCoder().encode(
              ['address', 'uint256', 'address', 'uint256', 'uint256', 'uint256', 'uint256'],
              [r.target, 84532, j.escrow, topic, ignore, ignore, ignore]
            )
          );
          filters.push({
            ChainId: 84532,
            Contract: j.escrow,
            Topics: ['0x' + topic.toString(16).padStart(64, '0'), null, null, null],
            Configs: [{ Contract: r.target, Active: await system.subscriptions(lookup) }]
          });
        }
        const st = await r.SETTLED_TOPIC();
        const sk = keccak256(
          AbiCoder.defaultAbiCoder().encode(
            ['address', 'uint256', 'address', 'uint256', 'uint256', 'uint256', 'uint256'],
            [r.target, 84532, j.workLedger, st, ignore, ignore, ignore]
          )
        );
        filters.push({
          ChainId: 84532,
          Contract: j.workLedger,
          Topics: ['0x' + st.toString(16).padStart(64, '0'), null, null, null],
          Configs: [{ Contract: r.target, Active: await system.subscriptions(sk) }]
        });
        return { Version: 1, TopicFilters: filters };
      };
    }
  });

  const deployed = await v5.deploy({
    config,
    base: baseChain.provider,
    lasna: lasnaProxy,
    env: { DEPLOYER_PRIVATE_KEY: key },
    directoryRoot,
    networkCheck: async () => ({ baseChainId: 84532, reactiveChainId: 5318007 })
  });
  assert.equal(deployed.observation.wiringVerified, true);
  assert.equal(deployed.observation.adaptiveTimers, true);

  const opened = await v5.open({
    base: baseChain.provider,
    lasna: lasnaProxy,
    env: { DEPLOYER_PRIVATE_KEY: key },
    directoryRoot
  });
  assert.equal(opened.open, true);

  const granted = await v5.grant({
    merchant: owner,
    credits: '5',
    validSeconds: '86400',
    base: baseChain.provider,
    lasna: lasnaProxy,
    env: { DEPLOYER_PRIVATE_KEY: key },
    directoryRoot,
    clock: async () => BigInt((await baseChain.provider.getBlock('latest')).timestamp)
  });
  assert.equal(granted.remaining, 5n);
  assert.equal(granted.epoch, 1n);

  const stat = await v5.status({ base: baseChain.provider, lasna: lasnaProxy, directoryRoot });
  assert.equal(stat.journalExists, true);
  assert.equal(stat.operations.length, 5);
  assert.ok(stat.operations.every(op => op.state === 'succeeded'));
});
