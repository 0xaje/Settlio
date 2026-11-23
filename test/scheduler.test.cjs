const assert = require('node:assert/strict');
const { test } = require('node:test');
const { ContractFactory, Contract, AbiCoder, keccak256, toUtf8Bytes, ZeroAddress } = require('ethers');
const startLocalChain = require('./helpers/local-chain.cjs');
const compile = require('../script/compile.cjs');
const systemAddress='0x8888888888888888888888888888888888888888';
const fixtures={ 'test/SchedulerFixture.sol':{content:`
// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;
import {IReactive} from "@reactive/src/interfaces/IReactive.sol";
import {ISystemContract} from "@reactive/src/interfaces/ISystemContract.sol";
interface IPolicyDestination { function processPolicy(address,uint256) external; }
contract SchedulerProtocolFixture {
    event Cron100(uint256 indexed number);
    function emitCron() external { emit Cron100(block.number); }
    uint256 public subscriptionCount;
    uint256 public unsubscriptionCount;
    uint256 public requestCount;
    mapping(uint256=>bool) public reject;
    mapping(uint256=>uint256) public requests;
    mapping(bytes32=>bool) public subscriptions;
    bytes public lastPayload;
    address public lastRecipient;
    uint256 public lastChain;
    function debt(address) external pure returns(uint256) { return 0; }
    function setReject(uint256 id,bool value) external { reject[id]=value; }
    function subscribe(uint256 chain,address target,uint256 t0,uint256 t1,uint256 t2,uint256 t3) external {
        bytes32 key=keccak256(abi.encode(msg.sender,chain,target,t0,t1,t2,t3));
        require(!subscriptions[key], "duplicate fixture subscription"); subscriptions[key]=true; subscriptionCount++;
    }
    function unsubscribe(uint256 chain,address target,uint256 t0,uint256 t1,uint256 t2,uint256 t3) external {
        bytes32 key=keccak256(abi.encode(msg.sender,chain,target,t0,t1,t2,t3));
        require(subscriptions[key], "wrong unsubscribe criteria"); subscriptions[key]=false; unsubscriptionCount++;
    }
    function requestCallbackV_1_0(ISystemContract.CallbackConfiguration_V_1_0 calldata config) external {
        (,uint256 id)=abi.decode(config.payload[4:],(address,uint256));
        require(!reject[id], "fixture request rejection");
        requestCount++;requests[id]++;lastPayload=config.payload;lastRecipient=config.recipient;lastChain=config.chainId;
    }
    function forward(address target,IReactive.LogRecord calldata record) external { IReactive(payable(target)).react(record); }
    function deliver(address receiver,address sender,uint256 id) external { IPolicyDestination(receiver).processPolicy(sender,id); }
}
`}};

test('M2 bounded CRON scheduling, acknowledgements, retry isolation and idle funding controls',async t=>{
 const {provider,signers:[owner,customer,stranger]}=await startLocalChain(t);
 async function deploy(name,args=[]) {const a=compile(name,fixtures);const c=await new ContractFactory(a.abi,a.evm.bytecode.object,owner).deploy(...args);await c.waitForDeployment();return c;}
 const prototype=await deploy('SchedulerProtocolFixture');
 await provider.send('anvil_setCode',[systemAddress,await provider.getCode(prototype.target)]);
 const system=new Contract(systemAddress,compile('SchedulerProtocolFixture',fixtures).abi,owner);
 const reactive=await deploy('SettlioReactive',[84532]);
 const receiver=await deploy('SettlioCallback',[prototype.target,reactive.target]);
 const escrow=new Contract(await receiver.escrow(),compile().abi,owner);
 await (await reactive.configure(escrow.target,receiver.target)).wait();
 const coder=AbiCoder.defaultAbiCoder();let sequence=0;
 const now=async()=>Number((await provider.getBlock('latest')).timestamp);
 async function move(ts){await provider.send('evm_setNextBlockTimestamp',[ts]);await provider.send('evm_mine',[]);}
 function record(topic,id=0,data='0x',changes={}) {const n=++sequence;return {chainId:84532,contractAddress:escrow.target,topic0:BigInt(topic),topic1:BigInt(id),topic2:0,topic3:0,data,blockNumber:n,opCode:2,blockHash:BigInt(n),txHash:BigInt(n),logIndex:0,...changes};}
 async function send(log){return (await system.forward(reactive.target,log,{gasLimit:900000})).wait();}
 async function policy(id,expiry,cutoff,automatic=true){return send(record(await reactive.POLICY_TOPIC(),id,coder.encode(['uint64','uint64','bool'],[expiry,cutoff,automatic])));}
 async function signal(topic,id){return send(record(topic,id));}
 async function tick(changes={}){return send(record(await reactive.CRON_TOPIC(),sequence+1,'0x',{chainId:31337,contractAddress:await reactive.CRON_SOURCE(),opCode:2,...changes}));}
 async function close(id){return signal(await reactive.EXPIRED_TOPIC(),id);}
   async function forwardReceipt(receipt){for(const log of receipt.logs){if(log.address.toLowerCase()!==escrow.target.toLowerCase())continue;await send({chainId:84532,contractAddress:escrow.target,topic0:BigInt(log.topics[0]),topic1:BigInt(log.topics[1]||0),topic2:BigInt(log.topics[2]||0),topic3:BigInt(log.topics[3]||0),data:log.data,blockNumber:receipt.blockNumber,opCode:log.topics.length,blockHash:BigInt(receipt.blockHash),txHash:BigInt(receipt.hash),logIndex:log.index});}}
 await t.test('forged/malformed CRON cannot run jobs; registration is deduplicated',async()=>{
   const start=await now();const log=record(await reactive.POLICY_TOPIC(),101,coder.encode(['uint64','uint64','bool'],[start+100,start+200,true]));
   await send(log);await send(log);
   assert.equal(await reactive.activeJobCount(),1n);assert.equal(await system.subscriptionCount(),11n);assert.equal(await reactive.cronSubscribed(),true);
   await assert.rejects(reactive.react.staticCall(log));
   for(const change of [{chainId:84532},{contractAddress:escrow.target},{opCode:1},{opCode:3},{topic2:1},{topic3:1},{data:coder.encode(['uint256'],[100])}])await tick(change);
   assert.equal(await system.requestCount(),0n);
   await signal(await reactive.POLICY_TOPIC(),102);assert.equal((await reactive.jobs(102)).registered,false);
   await close(101);assert.equal(await reactive.cronSubscribed(),false);assert.equal(await system.unsubscriptionCount(),1n);
 });
 await t.test('real indexed CRON receipt reaches a due job once; old unindexed shape cannot run it',async()=>{
   const start=await now();await policy(151,start,start+200);
   const source=await reactive.CRON_SOURCE();
   for(const changes of [{opCode:1,topic1:0,data:coder.encode(['uint256'],[100])},{opCode:3},{topic2:1},{topic3:1},{data:coder.encode(['uint256'],[100])}]) {
     await tick(changes);assert.equal(await system.requests(151),0n);
   }
   await provider.send('anvil_setCode',[source,await provider.getCode(prototype.target)]);
   const emitter=new Contract(source,compile('SchedulerProtocolFixture',fixtures).abi,owner);
   const receipt=await (await emitter.emitCron()).wait();
   const log=receipt.logs.find(item=>item.address.toLowerCase()===source.toLowerCase());
   assert.equal(log.topics[0],'0x'+(await reactive.CRON_TOPIC()).toString(16).padStart(64,'0'));
   assert.equal(log.topics.length,2);assert.equal(log.data,'0x');
   const observed={chainId:31337,contractAddress:source,topic0:BigInt(log.topics[0]),topic1:BigInt(log.topics[1]),topic2:0,topic3:0,data:log.data,blockNumber:receipt.blockNumber,opCode:log.topics.length,blockHash:BigInt(receipt.blockHash),txHash:BigInt(receipt.hash),logIndex:log.index};
   await send(observed);assert.equal(await system.requests(151),1n);
   await send(observed);assert.equal(await system.requests(151),1n);
   await close(151);
 });
 await t.test('request remains queued until destination acknowledgement; backoff prevents immediate repeats',async()=>{
   const start=await now();await policy(201,start,start+200);
   await tick();assert.equal(await system.requests(201),1n);assert.equal(await reactive.activeJobCount(),1n);
   const decoded=coder.decode(['address','uint256'],'0x'+(await system.lastPayload()).slice(10));
   assert.equal(decoded[0],ZeroAddress);assert.equal(decoded[1],201n);assert.equal(await system.lastRecipient(),receiver.target);assert.equal(await system.lastChain(),84532n);
   await tick();assert.equal(await system.requests(201),1n);
   await signal(await reactive.CONFIRMED_TOPIC(),201);assert.equal((await reactive.jobs(201)).nextAt,BigInt(start+200));
   await signal(await reactive.CANCEL_TOPIC(),201);await signal(await reactive.CONFIRMED_TOPIC(),201);
   assert.equal((await reactive.jobs(201)).cancelled,true);
   await send(record(await reactive.CHECKED_TOPIC(),201,coder.encode(['uint8'],[1])));
   assert.equal((await reactive.jobs(201)).cancelled,true);
   await send(record(await reactive.REFUNDED_TOPIC(),201,coder.encode(['uint256'],[100])));
   await policy(201,start,start+200);await signal(await reactive.POLICY_RETRY_TOPIC(),201);
   assert.equal((await reactive.jobs(201)).closed,true);assert.equal(await reactive.activeJobCount(),0n);
 });
 await t.test('out-of-order confirmation/cancellation precedes registration safely; manual policy stops when confirmed',async()=>{
   const start=await now();await signal(await reactive.CANCEL_TOPIC(),301);await signal(await reactive.CONFIRMED_TOPIC(),301);
   await policy(301,start+500,start+600);assert.equal((await reactive.jobs(301)).cancelled,true);assert.ok((await reactive.jobs(301)).nextAt<=BigInt(await now()));await close(301);
   await signal(await reactive.CONFIRMED_TOPIC(),302);await policy(302,start+500,start+600,false);
   assert.equal(await reactive.activeJobCount(),0n);assert.equal(await reactive.cronSubscribed(),false);
 });
 await t.test('one rejected request cannot block another job; each tick requests at most two',async()=>{
   const start=await now();for(const id of [401,402,403,404,405])await policy(id,start,start+1000);
   await (await system.setReject(401,true)).wait();const before=await system.requestCount();
   await tick();assert.ok((await system.requestCount())-before<=2n);assert.equal((await reactive.jobs(401)).attempts,1n);
   assert.ok((await system.requests(402))+(await system.requests(403))>0n);
   await tick();await tick();assert.ok((await system.requests(404))+(await system.requests(405))>0n);
   for(const id of [401,402,403,404,405])await close(id);
 });
 await t.test('six unacknowledged attempts stop billing; fresh participant signal requeues',async()=>{
   const start=await now();await policy(501,start,start+10000);
   for(let i=0;i<6;i++){const job=await reactive.jobs(501);if(Number(job.nextAt)>await now())await move(Number(job.nextAt));await tick();}
   assert.equal(await system.requests(501),6n);const job=await reactive.jobs(501);await move(Number(job.nextAt));await tick();
   assert.equal((await reactive.jobs(501)).needsAttention,true);assert.equal(await reactive.activeJobCount(),0n);assert.equal(await reactive.cronSubscribed(),false);
   await signal(await reactive.POLICY_RETRY_TOPIC(),501);assert.equal((await reactive.jobs(501)).attempts,0n);assert.equal(await reactive.activeJobCount(),1n);
   await close(501);
 });
 await t.test('owner pause/resume preserves jobs and unsubscribes charged ticks',async()=>{
   const start=await now();await policy(601,start,start+500);
   await assert.rejects(reactive.connect(stranger).setSchedulerPaused.staticCall(true));
   await (await reactive.setSchedulerPaused(true)).wait();assert.equal(await reactive.cronSubscribed(),false);
   await tick();assert.equal(await system.requests(601),0n);assert.equal(await reactive.activeJobCount(),1n);
   await (await reactive.setSchedulerPaused(false)).wait();assert.equal(await reactive.cronSubscribed(),true);
   await tick();assert.equal(await system.requests(601),1n);await close(601);
 });
 await t.test('scan budget is bounded and round-robin reaches later due work',async()=>{
   const start=await now();for(let i=0;i<8;i++)await policy(700+i,start+10000,start+20000);
   await policy(708,start,start+20000);await tick();assert.equal(await system.requests(708),0n);
   await tick();assert.equal(await system.requests(708),1n);
   for(let i=0;i<9;i++)await close(700+i);
 });
 await t.test('actual origin policy -> tick -> authenticated local expiry -> observed completion',async()=>{
   const start=await now(),expiry=start+50,cutoff=start+100;
   const terms=keccak256(toUtf8Bytes('isolated scheduler expiry fixture'));
   const creation=await (await escrow.createQuoteWithPolicy(await customer.getAddress(),[{asset:ZeroAddress,total:300n,deposit:100n}],expiry,cutoff,terms,true)).wait();
   const id=await escrow.quoteCount();

   await forwardReceipt(creation);await move(expiry);await tick();assert.ok(await system.requests(id)>0n);
   const delivery=await (await prototype.deliver(receiver.target,reactive.target,id)).wait();assert.equal((await escrow.getQuote(id)).status,6n);
   // Request alone did not clear the job. Only the genuine destination events do.
   assert.equal(await reactive.activeJobCount(),1n);await forwardReceipt(delivery);
   assert.equal(await reactive.activeJobCount(),0n);assert.equal(await reactive.cronSubscribed(),false);
 });
 await t.test('actual funded automatic payout and late cancellation refund are acknowledged once',async()=>{
   const terms=keccak256(toUtf8Bytes('isolated actual policy lifecycle'));
   async function funded() {
     const start=await now(),cutoff=start+100;
     const creation=await (await escrow.createQuoteWithPolicy(await customer.getAddress(),[{asset:ZeroAddress,total:300n,deposit:100n}],start+50,cutoff,terms,true)).wait();
     const id=await escrow.quoteCount();await forwardReceipt(creation);
     const deposit=await (await escrow.connect(customer).payDepositWithPolicy(id,0,terms,true,{value:100n})).wait();await forwardReceipt(deposit);
     const confirmation=await (await prototype.deliver(receiver.target,reactive.target,id)).wait();await forwardReceipt(confirmation);
     assert.equal((await escrow.getQuote(id)).status,3n);assert.equal((await reactive.jobs(id)).nextAt,BigInt(cutoff));
     return {id,cutoff};
   }
   const payout=await funded();await move(payout.cutoff);await tick();
   const before=await provider.getBalance(await owner.getAddress());
   const paid=await (await prototype.connect(stranger).deliver(receiver.target,reactive.target,payout.id)).wait();
   assert.equal(await provider.getBalance(await owner.getAddress()),before+100n);await forwardReceipt(paid);
   assert.equal((await reactive.jobs(payout.id)).closed,true);assert.equal(await reactive.activeJobCount(),0n);
   const refund=await funded();
   const cancelled=await (await escrow.connect(customer).requestCancellation(refund.id)).wait();await forwardReceipt(cancelled);
   await move(refund.cutoff);await tick();const customerBefore=await provider.getBalance(await customer.getAddress());
   const returned=await (await prototype.deliver(receiver.target,reactive.target,refund.id)).wait();await forwardReceipt(returned);
   assert.equal(await provider.getBalance(await customer.getAddress()),customerBefore+100n);
   assert.equal((await escrow.getQuote(refund.id)).status,5n);assert.equal((await reactive.jobs(refund.id)).closed,true);
   await (await prototype.deliver(receiver.target,reactive.target,refund.id)).wait();assert.equal(await escrow.totalLiability(),0n);
   assert.equal(await reactive.activeJobCount(),0n);assert.equal(await reactive.cronSubscribed(),false);
 });

 await t.test('fresh participant retry reconstructs missing policy registration and checks immediately',async()=>{
   const start=await now();const terms=keccak256(toUtf8Bytes('local missed registration recovery'));
   await (await escrow.createQuoteWithPolicy(await customer.getAddress(),[{asset:ZeroAddress,total:300n,deposit:100n}],start+1000,start+2000,terms,true)).wait();
   const id=await escrow.quoteCount();assert.equal((await reactive.jobs(id)).registered,false);
   const retry=await (await escrow.connect(customer).requestPolicy(id)).wait();
   // Deliver the request ahead of its registration to exercise reordered logs.
   const logs=retry.logs.filter(l=>l.address.toLowerCase()===escrow.target.toLowerCase());
   for(const log of [...logs].reverse())await forwardReceipt({...retry,logs:[log]});
   assert.equal((await reactive.jobs(id)).registered,true);
   assert.ok((await reactive.jobs(id)).nextAt<=BigInt(await now()));
   await tick();assert.ok(await system.requests(id)>0n);await close(id);
 });

});
