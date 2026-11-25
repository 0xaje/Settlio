const assert = require('node:assert/strict');
const { test } = require('node:test');
const { ContractFactory, Contract, ZeroAddress, keccak256, toUtf8Bytes } = require('ethers');
const startLocalChain = require('./helpers/local-chain.cjs');
const compile = require('../script/compile.cjs');
const compileAdmission = require('../script/compile-admission.cjs');
const fixtures = { 'test/PolicyFixture.sol': { content: `
// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;
interface IPolicyReceiver { function processPolicy(address,uint256) external; }
contract PolicyProxyFixture {
    function debt(address) external pure returns(uint256) { return 0; }
    function deliver(address target,address sender,uint256 id) external { IPolicyReceiver(target).processPolicy(sender,id); }
}
contract PolicyTokenFixture {
    bool public fail;
    mapping(address=>uint256) public balanceOf;
    mapping(address=>mapping(address=>uint256)) public allowance;
    function setFail(bool value) external { fail=value; }
    function mint(address to,uint256 amount) external { balanceOf[to]+=amount; }
    function approve(address to,uint256 amount) external returns(bool) { allowance[msg.sender][to]=amount; return true; }
    function transferFrom(address from,address to,uint256 amount) external returns(bool) {
        allowance[from][msg.sender]-=amount; balanceOf[from]-=amount; balanceOf[to]+=amount; return true;
    }
    function transfer(address to,uint256 amount) external returns(bool) {
        if (fail) return false;
        balanceOf[msg.sender]-=amount; balanceOf[to]+=amount; return true;
    }
}
` } };

for(const version of [3,4]) test('V'+version+' destination policies authenticate, enforce timestamps and preserve reserved principal (isolated)', async t => {
  const { provider, signers: [merchant, customer, reactive, stranger] } = await startLocalChain(t);
  async function deploy(name,args=[]) {
    const artifact=version===4&&name==='SettlioCallback'?compileAdmission('SettlioCallbackV4',fixtures):compile(name,fixtures);
    const contract=await new ContractFactory(artifact.abi,artifact.evm.bytecode.object,merchant).deploy(...args);
    await contract.waitForDeployment(); return contract;
  }
  const proxy=await deploy('PolicyProxyFixture');
  const receiver=await deploy('SettlioCallback',version===4?[proxy.target,await reactive.getAddress(),await merchant.getAddress(),8,8,10000,60,2]:[proxy.target,await reactive.getAddress()]);
  const escrow=new Contract(await receiver.escrow(),version===4?compileAdmission('SettlioEscrowV4').abi:compile().abi,merchant);
  if(version===4){const gate=new Contract(await escrow.admission(),compileAdmission('SettlioAdmission').abi,merchant),now=(await provider.getBlock('latest')).timestamp;await(await gate.setOpen(true)).wait();await(await gate.setGrant(await merchant.getAddress(),8,now+100000,keccak256(toUtf8Bytes('isolated policy allowance')))).wait();}
  const token=await deploy('PolicyTokenFixture');
  const terms=keccak256(toUtf8Bytes('isolated policy terms; no live customer evidence'));
  const process=id=>proxy.deliver(receiver.target,reactive.getAddress(),id);
  async function move(timestamp) { await provider.send('evm_setNextBlockTimestamp',[timestamp]); await provider.send('evm_mine',[]); }
  async function create(automatic=true,asset=ZeroAddress) {
    const now=Number((await provider.getBlock('latest')).timestamp);
    const tx=await escrow.createQuoteWithPolicy(await customer.getAddress(),[{asset,total:300n,deposit:100n}],now+100,now+200,terms,automatic);
    const receipt=await tx.wait(); const id=await escrow.quoteCount();
    const log=receipt.logs.map(l=>{try{return escrow.interface.parseLog(l);}catch{return null;}}).find(l=>l?.name==='PolicyRegistered');
    assert.equal(log.args.automaticRelease,automatic);
    assert.equal(await escrow.automaticRelease(id),automatic);
    return {id,expiry:now+100,cutoff:now+200};
  }
  async function pay(q,asset=ZeroAddress) {
    if(asset!==ZeroAddress) {
      await (await token.mint(await customer.getAddress(),100n)).wait();
      await (await token.connect(customer).approve(escrow.target,100n)).wait();
    }
    await (await escrow.connect(customer).payDepositWithPolicy(q.id,0,terms,await escrow.automaticRelease(q.id),{value:asset===ZeroAddress?100n:0n})).wait();
  }
  await t.test('only authenticated callbacks apply policy and only participants request retries',async()=>{
    const q=await create();
    await assert.rejects(receiver.processPolicy.staticCall(await reactive.getAddress(),q.id));
    await assert.rejects(proxy.deliver.staticCall(receiver.target,await stranger.getAddress(),q.id));
    await assert.rejects(escrow.processPolicy.staticCall(q.id));
    await assert.rejects(escrow.releaseAutomatic.staticCall(q.id));
    await assert.rejects(escrow.connect(customer).payDeposit.staticCall(q.id,terms,{value:100n}));
    await assert.rejects(escrow.connect(customer).payDepositOption.staticCall(q.id,0,terms,{value:100n}));
    await assert.rejects(escrow.connect(customer).payDepositWithPolicy.staticCall(q.id,0,terms,false,{value:100n}));
    await assert.rejects(escrow.connect(stranger).requestPolicy.staticCall(q.id));
    await (await escrow.connect(customer).requestPolicy(q.id)).wait();
    await assert.rejects(proxy.deliver.staticCall(receiver.target,await reactive.getAddress(),999));
  });
  await t.test('unpaid expiry is harmless before deadline and effective at exact boundary',async()=>{
    const q=await create();
    await (await process(q.id)).wait();assert.equal((await escrow.getQuote(q.id)).status,1n);
    await move(q.expiry);
    await assert.rejects(escrow.connect(customer).payDepositWithPolicy.staticCall(q.id,0,terms,true,{value:100n}));
    await (await process(q.id)).wait();assert.equal((await escrow.getQuote(q.id)).status,6n);
    await (await process(q.id)).wait();assert.equal(await escrow.liability(ZeroAddress),0n);
  });
  await t.test('automatic release requires confirmation and cutoff, then pays ETH only once',async()=>{
    const q=await create();await pay(q);
    await (await process(q.id)).wait();assert.equal((await escrow.getQuote(q.id)).status,3n);
    await (await process(q.id)).wait();assert.equal(await escrow.liability(ZeroAddress),100n);
    await move(q.cutoff);
    const before=await provider.getBalance(await merchant.getAddress());
    // A different signer pays callback-fixture gas so merchant balance delta is exact.
    await (await proxy.connect(stranger).deliver(receiver.target,await reactive.getAddress(),q.id)).wait();
    assert.equal(await provider.getBalance(await merchant.getAddress()),before+100n);
    assert.equal((await escrow.getQuote(q.id)).status,7n);
    await (await process(q.id)).wait();assert.equal(await escrow.totalLiability(),0n);
  });
  await t.test('manual policy never releases automatically after cutoff',async()=>{
    const q=await create(false);await pay(q);await (await process(q.id)).wait();await move(q.cutoff);
    await (await process(q.id)).wait();assert.equal((await escrow.getQuote(q.id)).status,3n);
    assert.equal(await escrow.liability(ZeroAddress),100n);
    await (await escrow.release(q.id)).wait();assert.equal((await escrow.getQuote(q.id)).status,7n);
  });
  await t.test('cancellation reservation beats delayed payout and refunds the original token once',async()=>{
    const q=await create(true,token.target);await pay(q,token.target);await (await process(q.id)).wait();
    await (await escrow.connect(customer).requestCancellation(q.id)).wait();await move(q.cutoff);
    await (await token.setFail(true)).wait();
    await assert.rejects(async () => (await proxy.deliver(receiver.target,await reactive.getAddress(),q.id,{gasLimit:1000000})).wait());
    assert.equal((await escrow.getQuote(q.id)).status,4n);
    assert.equal(await escrow.liability(token.target),100n);assert.equal(await token.balanceOf(escrow.target),100n);
    await (await token.setFail(false)).wait();await (await process(q.id)).wait();
    assert.equal((await escrow.getQuote(q.id)).status,5n);
    assert.equal(await token.balanceOf(await customer.getAddress()),100n);
    assert.equal(await token.balanceOf(await merchant.getAddress()),0n);
    await (await process(q.id)).wait();assert.equal(await escrow.liability(token.target),0n);
  });
  await t.test('failed token payout rolls back status/liability and can retry exactly once',async()=>{
    const q=await create(true,token.target);await pay(q,token.target);await (await process(q.id)).wait();await move(q.cutoff);
    await (await token.setFail(true)).wait();
    await assert.rejects(async () => (await proxy.deliver(receiver.target,await reactive.getAddress(),q.id,{gasLimit:1000000})).wait());
    assert.equal((await escrow.getQuote(q.id)).status,3n);assert.equal(await escrow.liability(token.target),100n);
    await (await token.setFail(false)).wait();await (await process(q.id)).wait();
    assert.equal(await token.balanceOf(await merchant.getAddress()),100n);
    await (await process(q.id)).wait();assert.equal(await token.balanceOf(await merchant.getAddress()),100n);
    assert.equal(await escrow.liability(token.target),0n);
  });
});
