const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {ContractFactory,Contract,keccak256,ZeroAddress}=require('ethers');
const start=require('./helpers/local-chain.cjs'),compile=require('../script/compile-admission.cjs');
const sourcePath='packages/contracts/admission/SettlioAdmission.sol';
const sources={
 [sourcePath]:{content:fs.readFileSync(path.join(__dirname,'..',sourcePath),'utf8')},
 'test/AdmissionConsumerFixture.sol':{content:`// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;
import {SettlioAdmission} from "packages/contracts/admission/SettlioAdmission.sol";
// Isolated consumer only, not a production escrow.
contract AdmissionConsumerFixture {
 SettlioAdmission public immutable gate;
 constructor(address sponsor){gate=new SettlioAdmission(address(this),sponsor,2,3,1000,60,2);}
 function admit(uint256 id,address merchant,uint64 expiry,uint64 cutoff) external {gate.admit(id,merchant,expiry,cutoff);}
 function close(uint256 id) external {gate.close(id);}
 function retry(uint256 id) external {gate.consumeRetry(id);}
 function failedTerminal(uint256 id) external {gate.close(id);revert("principal transfer failed");}
 function failedCreation(uint256 id,address merchant,uint64 expiry,uint64 cutoff) external {gate.admit(id,merchant,expiry,cutoff);revert("invalid terms");}
}`}
};
test('admission enforces finite sponsored work and atomic capacity accounting',async t=>{
 const {provider,signers}=await start(t),merchant=await signers[1].getAddress(),stranger=await signers[2].getAddress();
 const a=compile('AdmissionConsumerFixture',sources);
 const consumer=await new ContractFactory(a.abi,a.evm.bytecode.object,signers[0]).deploy(await signers[0].getAddress());await consumer.waitForDeployment();
 const gate=new Contract(await consumer.gate(),compile('SettlioAdmission',sources).abi,signers[0]);
 const now=(await provider.getBlock('latest')).timestamp,observation=keccak256('0x1234');
 const admit=(id,simulate=false)=>consumer.admit[simulate?'staticCall':'send'](id,merchant,now+100,now+900);
 await t.test('closed by default; direct callers cannot bypass consumer or sponsor',async()=>{
  assert.equal(await gate.open(),false);await assert.rejects(admit(1,true));
  await assert.rejects(gate.connect(signers[2]).setOpen.staticCall(true));
  await assert.rejects(gate.connect(signers[2]).setGrant.staticCall(merchant,1,now+200,observation));
  await assert.rejects(gate.admit.staticCall(1,merchant,now+100,now+900));await assert.rejects(gate.close.staticCall(1));await assert.rejects(gate.consumeRetry.staticCall(1));
  await(await gate.setOpen(true)).wait();await assert.rejects(admit(1,true));
 });
 await t.test('global reservations, invalid terms and failed transfers preserve capacity',async()=>{
  await assert.rejects(gate.setGrant.staticCall(ZeroAddress,1,now+200,observation));
  await assert.rejects(gate.setGrant.staticCall(merchant,1,now+200,'0x'+'00'.repeat(32)));
  await(await gate.setGrant(merchant,2,now+200,observation)).wait();
  await assert.rejects(gate.setGrant.staticCall(stranger,1,now+200,observation));
  await assert.rejects(consumer.admit.staticCall(1,merchant,now+100,now+2000));
  await assert.rejects(consumer.admit.staticCall(1,merchant,now+900,now+100));
  await assert.rejects(async()=>{const tx=await consumer.failedCreation(1,merchant,now+100,now+900,{gasLimit:500000});await tx.wait();});
  assert.equal(await gate.admitted(),0n);assert.equal(await gate.reserved(),2n);
  await(await admit(1)).wait();await assert.rejects(admit(1,true));await(await admit(2)).wait();
  assert.equal(await gate.active(),2n);assert.equal(await gate.reserved(),0n);
  await assert.rejects(async()=>{const tx=await consumer.failedTerminal(1,{gasLimit:500000});await tx.wait();});assert.equal(await gate.active(),2n);assert.equal((await gate.jobs(1)).closed,false);
  await(await consumer.close(1)).wait();await(await consumer.close(1)).wait();assert.equal(await gate.active(),1n);await assert.rejects(consumer.close.staticCall(999));
 });
 await t.test('new-admission pause preserves bounded retries and cannot replenish lifetime quota',async()=>{
  await(await gate.setOpen(false)).wait();await(await consumer.retry(2)).wait();await assert.rejects(consumer.retry.staticCall(2));
  const next=(await gate.jobs(2)).retryAfter;await provider.send('evm_setNextBlockTimestamp',[Number(next)]);await provider.send('evm_mine',[]);
  await(await consumer.retry(2)).wait();await provider.send('evm_increaseTime',[61]);await provider.send('evm_mine',[]);
  await assert.rejects(consumer.retry.staticCall(2));await assert.rejects(consumer.retry.staticCall(1));await(await consumer.close(2)).wait();
  await(await gate.setGrant(merchant,1,now+500,observation)).wait();await assert.rejects(admit(3,true));await(await gate.setOpen(true)).wait();
  await(await consumer.admit(3,merchant,now+500,now+900)).wait();await(await consumer.close(3)).wait();
  assert.equal(await gate.active(),0n);assert.equal(await gate.admitted(),3n);await assert.rejects(gate.setGrant.staticCall(merchant,1,now+500,observation));assert.equal(await provider.getBalance(gate.target),0n);
 });
});
test('unused credits expire at the exact timestamp without reclaiming active jobs',async t=>{
 const {provider,signers}=await start(t),a=compile('SettlioAdmission',sources),owner=await signers[0].getAddress(),merchant=await signers[1].getAddress();
 const gate=await new ContractFactory(a.abi,a.evm.bytecode.object,signers[0]).deploy(owner,owner,2,3,1000,60,2);await gate.waitForDeployment();
 const now=(await provider.getBlock('latest')).timestamp;await(await gate.setOpen(true)).wait();await(await gate.setGrant(merchant,2,now+100,keccak256('0xabcd'))).wait();
 await(await gate.admit(1,merchant,now+50,now+200)).wait();await assert.rejects(gate.expireGrant.staticCall(merchant));
 await provider.send('evm_setNextBlockTimestamp',[now+100]);await provider.send('evm_mine',[]);
 await assert.rejects(gate.admit.staticCall(2,merchant,now+150,now+200));await(await gate.connect(signers[2]).expireGrant(merchant)).wait();
 assert.equal(await gate.reserved(),0n);assert.equal(await gate.active(),1n);assert.equal(await gate.admitted(),1n);await assert.rejects(gate.expireGrant.staticCall(merchant));
});
