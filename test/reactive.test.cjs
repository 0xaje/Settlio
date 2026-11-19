const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { test } = require('node:test');
const { JsonRpcProvider, ContractFactory, Contract, keccak256, toUtf8Bytes, parseEther, AbiCoder, ZeroAddress } = require('ethers');
const compile = require('../script/compile.cjs');

const fixtures = {
  'test/ProtocolFixture.sol': { content: `
// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;
import {IReactive} from "@reactive/src/interfaces/IReactive.sol";
import {ISystemContract} from "@reactive/src/interfaces/ISystemContract.sol";
interface IReceiver { function confirmBooking(address sender, uint256 id) external; function pay(uint256 amount) external; }
contract ProtocolFixture {
    bool public failRequests;
    function setFailRequests(bool value) external { failRequests = value; }
    uint256 public subscriptionCount;
    uint256 public requestCount;
    bytes public lastPayload;
    address public lastRecipient;
    uint256 public lastChain;
    receive() external payable {}
    function debt(address) external pure returns(uint256) { return 0; }
    function subscribe(uint256,address,uint256,uint256,uint256,uint256) external { subscriptionCount++; }
    function requestCallbackV_1_0(ISystemContract.CallbackConfiguration_V_1_0 calldata config) external {
        require(!failRequests, "fixture failure");
        requestCount++; lastPayload = config.payload; lastRecipient = config.recipient; lastChain = config.chainId;
    }
    function forward(address reactive, IReactive.LogRecord calldata record) external { IReactive(payable(reactive)).react(record); }
    function deliver(address target, address sender, uint256 id) external { IReceiver(target).confirmBooking(sender,id); }
    function bill(address target, uint256 amount) external { IReceiver(target).pay(amount); }
}
` }
};

test('local protocol fixture validates M1 subscription and callback boundaries', async t => {
  const child = spawn(process.execPath, ['node_modules/@foundry-rs/anvil/bin.mjs', '--port', '18546', '--silent'], { stdio: 'ignore' });
  const provider = new JsonRpcProvider('http://127.0.0.1:18546', undefined, { cacheTimeout: -1 });
  t.after(() => { provider.destroy(); child.kill(); });
  let ready = false;
  for (let attempt = 0; attempt < 50; attempt++) {
    try { await provider.getBlockNumber(); ready = true; break; }
    catch { await new Promise(resolve => setTimeout(resolve, 100)); }
  }
  assert.ok(ready);
  const owner = await provider.getSigner(0);
  const customer = await provider.getSigner(1);
  const stranger = await provider.getSigner(2);
  async function deploy(name, args = [], value = 0n) {
    const artifact = compile(name, fixtures);
    const contract = await new ContractFactory(artifact.abi, artifact.evm.bytecode.object, owner).deploy(...args, { value });
    await contract.waitForDeployment();
    return contract;
  }
  const prototype = await deploy('ProtocolFixture');
  const systemAddress = '0x8888888888888888888888888888888888888888';
  await provider.send('anvil_setCode', [systemAddress, await provider.getCode(await prototype.getAddress())]);
  const system = new Contract(systemAddress, compile('ProtocolFixture', fixtures).abi, owner);
  const proxy = await deploy('ProtocolFixture');
  const reactive = await deploy('SettlioReactive', [84532]);
  const receiver = await deploy('SettlioCallback', [await proxy.getAddress(), await reactive.getAddress()], parseEther('0.01'));
  const escrow = new Contract(await receiver.escrow(), compile().abi, owner);
  await t.test('wiring is owner-only and immutable after two subscriptions', async () => {
    await assert.rejects(reactive.connect(stranger).configure.staticCall(await escrow.getAddress(), await receiver.getAddress()));
    await (await reactive.configure(await escrow.getAddress(), await receiver.getAddress())).wait();
    assert.equal(await system.subscriptionCount(), 2n);
    await assert.rejects(reactive.configure.staticCall(await escrow.getAddress(), await receiver.getAddress()));
  });
  const terms = keccak256(toUtf8Bytes('local integration fixture'));
  const now = Number((await provider.getBlock('latest')).timestamp);
  await (await escrow.createQuote(await customer.getAddress(), parseEther('0.3'), parseEther('0.1'), now+1000, now+2000, terms)).wait();
  const receipt = await (await escrow.connect(customer).payDeposit(1, terms, { value: parseEther('0.1') })).wait();
  const log = receipt.logs.find(item => item.topics[0] === escrow.interface.getEvent('DepositReceived').topicHash);
  const record = {
    chainId: 84532, contractAddress: await escrow.getAddress(),
    topic0: BigInt(log.topics[0]), topic1: BigInt(log.topics[1]), topic2: BigInt(log.topics[2]), topic3: 0n,
    data: log.data, blockNumber: receipt.blockNumber, opCode: 3,
    blockHash: BigInt(receipt.blockHash), txHash: BigInt(receipt.hash), logIndex: log.index
  };
  await t.test('react entry rejects forged callers and filters foreign/malformed logs', async () => {
    await assert.rejects(reactive.react.staticCall(record));
    for (const change of [{ chainId: 1 }, { contractAddress: ZeroAddress }, { opCode: 2 }, { data: '0x' }]) {
      await (await system.forward(await reactive.getAddress(), { ...record, ...change })).wait();
    }
    assert.equal(await system.requestCount(), 0n);
  });
  await t.test('deposit requests correct sender-slot payload and deduplicates the same log', async () => {
    await (await system.forward(await reactive.getAddress(), record)).wait();
    await (await system.forward(await reactive.getAddress(), record)).wait();
    assert.equal(await system.requestCount(), 1n);
    assert.equal(await system.lastRecipient(), await receiver.getAddress());
    assert.equal(await system.lastChain(), 84532n);
    const decoded = receiver.interface.decodeFunctionData('confirmBooking', await system.lastPayload());
    assert.equal(decoded[0], ZeroAddress);
    assert.equal(decoded[1], 1n);
  });
  await t.test('callback requires both proxy and authorised reactive sender', async () => {
    await assert.rejects(receiver.confirmBooking.staticCall(await reactive.getAddress(),1));
    await assert.rejects(proxy.deliver.staticCall(await receiver.getAddress(), await stranger.getAddress(),1));
    await (await proxy.deliver(await receiver.getAddress(), await reactive.getAddress(),1)).wait();
    await (await proxy.deliver(await receiver.getAddress(), await reactive.getAddress(),1)).wait();
    assert.equal((await escrow.getQuote(1)).status, 3n);
  });
  await t.test('network billing cannot spend escrow principal', async () => {
    await assert.rejects(receiver.pay.staticCall(1));
    await (await proxy.bill(await receiver.getAddress(),parseEther('0.001'))).wait();
    assert.equal(await provider.getBalance(await escrow.getAddress()), parseEther('0.1'));
    assert.equal(await escrow.totalLiability(), parseEther('0.1'));
    await assert.rejects(proxy.bill.staticCall(await receiver.getAddress(),parseEther('1')));
  });
  await t.test('fresh participant retry events can request delivery after an earlier request', async () => {
    await (await escrow.createQuote(await customer.getAddress(), parseEther('0.3'), parseEther('0.1'), now+1000, now+2000, terms)).wait();
    await (await escrow.connect(customer).payDeposit(2, terms, { value: parseEther('0.1') })).wait();
    await assert.rejects(escrow.connect(stranger).requestConfirmation.staticCall(2));
    const retryReceipt = await (await escrow.connect(customer).requestConfirmation(2)).wait();
    const retryLog = retryReceipt.logs[0];
    const retry = { ...record, topic0: BigInt(retryLog.topics[0]), topic1: BigInt(retryLog.topics[1]), opCode: 2, topic2: 0n, data: '0x', txHash: BigInt(retryReceipt.hash), blockHash: BigInt(retryReceipt.blockHash), logIndex: retryLog.index };
    await (await system.forward(await reactive.getAddress(), retry)).wait();
    assert.equal(await system.requestCount(), 2n);
    await (await proxy.deliver(await receiver.getAddress(), await reactive.getAddress(),2)).wait();
    assert.equal((await escrow.getQuote(2)).status, 3n);
  });
  await t.test('a rejected callback request rolls back deduplication so the log can retry', async () => {
    const failed = { ...record, txHash: record.txHash+100n };
    const key = keccak256(AbiCoder.defaultAbiCoder().encode(['uint256','uint256','uint256','uint256'], [failed.chainId, failed.blockHash, failed.txHash, failed.logIndex]));
    await (await system.setFailRequests(true)).wait();
    await assert.rejects(system.forward.staticCall(await reactive.getAddress(),failed));
    assert.equal(await reactive.processed(key), false);
    await (await system.setFailRequests(false)).wait();
    await (await system.forward(await reactive.getAddress(),failed)).wait();
    assert.equal(await reactive.processed(key), true);
  });
});
