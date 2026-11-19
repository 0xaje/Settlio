const assert = require('node:assert/strict');
const startLocalChain = require('./helpers/local-chain.cjs');
const { test } = require('node:test');
const { ContractFactory, Contract, keccak256, toUtf8Bytes, parseEther, AbiCoder, ZeroAddress } = require('ethers');
const compile = require('../script/compile.cjs');

const fixtures = {
  'test/ProtocolFixture.sol': { content: `
// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;
import {IReactive} from "@reactive/src/interfaces/IReactive.sol";
import {ISystemContract} from "@reactive/src/interfaces/ISystemContract.sol";
interface IReceiver { function confirmBooking(address sender, uint256 id) external; function pay(uint256 amount) external; }
contract PaymentTokenFixture {
    mapping(address=>uint256) public balanceOf;
    mapping(address=>mapping(address=>uint256)) public allowance;
    function mint(address to,uint256 amount) external { balanceOf[to]+=amount; }
    function approve(address to,uint256 amount) external returns(bool) { allowance[msg.sender][to]=amount;return true; }
    function transferFrom(address from,address to,uint256 amount) external returns(bool) {
        allowance[from][msg.sender]-=amount;balanceOf[from]-=amount;balanceOf[to]+=amount;return true;
    }
}
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
  const { provider, signers } = await startLocalChain(t);
  const [owner, customer, stranger] = signers;
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
  await t.test('token deposit event traverses subscriber and authenticated confirmation without moving principal', async () => {
    const token = await deploy('PaymentTokenFixture');
    await (await token.mint(await customer.getAddress(), 1000000n)).wait();
    await (await token.connect(customer).approve(await escrow.getAddress(), 1000000n)).wait();
    await (await escrow.createQuoteWithOptions(await customer.getAddress(), [
      { asset: ZeroAddress, total: parseEther('0.3'), deposit: parseEther('0.1') },
      { asset: await token.getAddress(), total: 3000000n, deposit: 1000000n }
    ], now+1000, now+2000, terms)).wait();
    const id = await escrow.quoteCount();
    const tokenReceipt = await (await escrow.connect(customer).payDepositOption(id, 1, terms)).wait();
    const depositLog = tokenReceipt.logs.find(item => item.topics[0] === escrow.interface.getEvent('DepositReceived').topicHash);
    const tokenRecord = { ...record, topic1: BigInt(depositLog.topics[1]), topic2: BigInt(depositLog.topics[2]),
      data: depositLog.data, blockNumber: tokenReceipt.blockNumber, blockHash: BigInt(tokenReceipt.blockHash),
      txHash: BigInt(tokenReceipt.hash), logIndex: depositLog.index };
    const before = await system.requestCount();
    await (await system.forward(await reactive.getAddress(), tokenRecord)).wait();
    assert.equal(await system.requestCount(), before+1n);
    const decoded = receiver.interface.decodeFunctionData('confirmBooking', await system.lastPayload());
    assert.equal(decoded[1], id);
    await (await proxy.deliver(await receiver.getAddress(), await reactive.getAddress(), id)).wait();
    assert.equal((await escrow.getQuote(id)).status, 3n);
    assert.equal((await escrow.getQuote(id)).asset, await token.getAddress());
    assert.equal(await token.balanceOf(await escrow.getAddress()), 1000000n);
    assert.equal(await escrow.liability(await token.getAddress()), 1000000n);
    assert.equal(await escrow.totalLiability(), parseEther('0.2'));
  });

});
