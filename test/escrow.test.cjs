const assert = require('node:assert/strict');
const startLocalChain = require('./helpers/local-chain.cjs');
const { test } = require('node:test');
const { ContractFactory, keccak256, toUtf8Bytes, parseEther } = require('ethers');
const compile = require('../script/compile.cjs');

test('escrow payment, permissions, deadline races and principal accounting', async t => {
  const { provider, signers } = await startLocalChain(t);
  const [merchant, customer, receiver, stranger] = signers;
  const artifact = compile();
  const escrow = await new ContractFactory(artifact.abi, artifact.evm.bytecode.object, merchant).deploy(await receiver.getAddress());
  await escrow.waitForDeployment();
  const terms = keccak256(toUtf8Bytes('Test fixture terms'));
  const deposit = parseEther('0.1');
  const total = parseEther('0.3');
  async function create() {
    const now = Number((await provider.getBlock('latest')).timestamp);
    await (await escrow.createQuote(await customer.getAddress(), total, deposit, now + 100, now + 200, terms)).wait();
    return { id: await escrow.quoteCount(), expiry: now + 100, cutoff: now + 200 };
  }
  async function moveTo(timestamp) {
    await provider.send('evm_setNextBlockTimestamp', [timestamp]);
    await provider.send('evm_mine', []);
  }
  const first = await create();
  await t.test('rejects wrong payer, amount and changed terms', async () => {
    await assert.rejects(escrow.connect(stranger).payDeposit.staticCall(first.id, terms, { value: deposit }));
    await assert.rejects(escrow.connect(customer).payDeposit.staticCall(first.id, terms, { value: 1n }));
    await assert.rejects(escrow.connect(customer).payDeposit.staticCall(first.id, keccak256(toUtf8Bytes('changed')), { value: deposit }));
  });
  await t.test('exact payment reserves principal and cannot be repeated', async () => {
    await (await escrow.connect(customer).payDeposit(first.id, terms, { value: deposit })).wait();
    assert.equal((await escrow.getQuote(first.id)).status, 2n);
    assert.equal(await escrow.totalLiability(), deposit);
    await assert.rejects(escrow.connect(customer).payDeposit.staticCall(first.id, terms, { value: deposit }));
  });
  await t.test('only callback receiver confirms and duplicates are harmless', async () => {
    await assert.rejects(escrow.confirmBooking.staticCall(first.id));
    await (await escrow.connect(receiver).confirmBooking(first.id)).wait();
    await (await escrow.connect(receiver).confirmBooking(first.id)).wait();
    assert.equal((await escrow.getQuote(first.id)).status, 3n);
    await assert.rejects(escrow.release.staticCall(first.id));
  });
  await t.test('cancellation reserves refund across cutoff and stale confirmation', async () => {
    await (await escrow.connect(customer).requestCancellation(first.id)).wait();
    await moveTo(first.cutoff);
    await assert.rejects(escrow.release.staticCall(first.id));
    await (await escrow.connect(receiver).confirmBooking(first.id)).wait();
    assert.equal((await escrow.getQuote(first.id)).status, 4n);
  });
  await t.test('refund pays exactly once and clears liability', async () => {
    const before = await provider.getBalance(await customer.getAddress());
    await assert.rejects(escrow.refund.staticCall(first.id));
    await (await escrow.connect(receiver).refund(first.id)).wait();
    assert.equal(await provider.getBalance(await customer.getAddress()), before + deposit);
    await (await escrow.connect(receiver).refund(first.id)).wait();
    assert.equal(await provider.getBalance(await customer.getAddress()), before + deposit);
    assert.equal(await escrow.totalLiability(), 0n);
  });
  const second = await create();
  await t.test('expiry boundary rejects payment even before expiry callback', async () => {
    await moveTo(second.expiry);
    await assert.rejects(escrow.connect(customer).payDeposit.staticCall(second.id, terms, { value: deposit }));
    await (await escrow.connect(receiver).expire(second.id)).wait();
    assert.equal((await escrow.getQuote(second.id)).status, 6n);
  });
  const third = await create();
  await (await escrow.connect(customer).payDeposit(third.id, terms, { value: deposit })).wait();
  await t.test('cancellation before confirmation wins against delayed callback', async () => {
    await (await escrow.connect(customer).requestCancellation(third.id)).wait();
    await (await escrow.connect(receiver).confirmBooking(third.id)).wait();
    assert.equal((await escrow.getQuote(third.id)).status, 4n);
    await (await escrow.connect(receiver).refund(third.id)).wait();
  });
  const fourth = await create();
  await (await escrow.connect(customer).payDeposit(fourth.id, terms, { value: deposit })).wait();
  await (await escrow.connect(receiver).confirmBooking(fourth.id)).wait();
  await t.test('merchant release at cutoff excludes cancellation and cannot repeat', async () => {
    await moveTo(fourth.cutoff);
    await assert.rejects(escrow.connect(customer).requestCancellation.staticCall(fourth.id));
    await assert.rejects(escrow.connect(stranger).release.staticCall(fourth.id));
    await (await escrow.release(fourth.id)).wait();
    await assert.rejects(escrow.release.staticCall(fourth.id));
    assert.equal(await escrow.totalLiability(), 0n);
    assert.equal(await provider.getBalance(await escrow.getAddress()), 0n);
  });
});
