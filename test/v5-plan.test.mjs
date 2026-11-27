import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { Contract, ContractFactory, ZeroAddress, parseEther } from 'ethers';
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
const compileRenewable = require('../script/compile-renewable.cjs');
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
