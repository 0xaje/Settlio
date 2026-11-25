const {test}=require('node:test'),assert=require('node:assert/strict');
const {Contract,ContractFactory,AbiCoder,id,ZeroAddress}=require('ethers');
const start=require('./helpers/local-chain.cjs'),compile=require('../script/compile-renewable.cjs');
const SYSTEM='0x8888888888888888888888888888888888888888',coder=AbiCoder.defaultAbiCoder();
const fixtures={'test/ClosureProtocolFixture.sol':{content:`// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;
import {IReactive} from "@reactive/src/interfaces/IReactive.sol";
import {ISystemContract} from "@reactive/src/interfaces/ISystemContract.sol";
// Isolated protocol transport, never a production proxy or a public proof.
contract ClosureProtocolFixture {
 bool public reject;
 bytes[] public payloads;
 address public lastRecipient;
 uint256 public lastChain;
 mapping(bytes32=>bool) public subscriptions;
 function debt(address) external pure returns(uint256){return 0;}
 function setReject(bool value) external {reject=value;}
 function count() external view returns(uint256){return payloads.length;}
 function subscribe(uint256 chain,address target,uint256 a,uint256 b,uint256 c,uint256 d) external {
  bytes32 key=keccak256(abi.encode(msg.sender,chain,target,a,b,c,d));require(!subscriptions[key]);subscriptions[key]=true;
 }
 function unsubscribe(uint256 chain,address target,uint256 a,uint256 b,uint256 c,uint256 d) external {
  bytes32 key=keccak256(abi.encode(msg.sender,chain,target,a,b,c,d));require(subscriptions[key]);subscriptions[key]=false;
 }
 function requestCallbackV_1_0(ISystemContract.CallbackConfiguration_V_1_0 calldata config) external {
  require(!reject,"fixture reject");payloads.push(config.payload);lastRecipient=config.recipient;lastChain=config.chainId;
 }
 function forward(address target,IReactive.LogRecord calldata record) external {IReactive(payable(target)).react(record);}
 function deliver(address target,address sender,bytes calldata payload) external {
  bytes memory data=payload;require(data.length>=36);assembly {mstore(add(data,36),sender)}
  (bool ok,bytes memory result)=target.call(data);if(!ok)assembly{revert(add(result,32),mload(result))}
 }
}`}};
const artifacts={};function art(n){return artifacts[n]??=compile(n,fixtures);}
async function setup(t,{capacity=2}={}){
 const {provider,signers}=await start(t),[owner,customer,stranger]=signers;
 async function deploy(n,args=[]){const a=art(n),c=await new ContractFactory(a.abi,a.evm.bytecode.object,owner).deploy(...args);await c.waitForDeployment();return c;}
 const proxy=await deploy('ClosureProtocolFixture');await provider.send('anvil_setCode',[SYSTEM,await provider.getCode(proxy.target)]);
 const system=new Contract(SYSTEM,art('ClosureProtocolFixture').abi,owner),source=await deploy('SettlioReactiveV5',[31337]);
 const receiver=await deploy('SettlioCallbackV5',[proxy.target,source.target,await owner.getAddress(),capacity,capacity,10000,60,1]);
 const escrow=new Contract(await receiver.escrow(),art('SettlioEscrowV5').abi,owner),gate=new Contract(await escrow.admission(),art('SettlioWorkLedger').abi,owner);
 await(await source.configure(escrow.target,receiver.target,gate.target)).wait();
 const profile=id('isolated closure profile'),terms=id('terms'),now=(await provider.getBlock('latest')).timestamp;
 await(await gate.setOpen(true)).wait();await(await gate.setGrant(await owner.getAddress(),1,capacity,now+9000,profile,id('attestation'))).wait();
 let sequence=100000;
 function record(topic,quoteId=1,data='0x',changes={}){const n=++sequence;return {chainId:31337,contractAddress:escrow.target,topic0:BigInt(topic),topic1:BigInt(quoteId),topic2:0,topic3:0,data,blockNumber:n,opCode:2,blockHash:BigInt(n),txHash:BigInt(n),logIndex:0,...changes};}
 async function send(log){return(await system.forward(source.target,log,{gasLimit:900000})).wait();}
 async function forward(receipt,{only,except}={}){for(const l of receipt.logs){if(![escrow.target,gate.target].some(a=>a.toLowerCase()===l.address.toLowerCase()))continue;
  if(only&&!only.includes(l.topics[0]))continue;if(except&&except.includes(l.topics[0]))continue;
  await send({chainId:31337,contractAddress:l.address,topic0:BigInt(l.topics[0]),topic1:BigInt(l.topics[1]||0),topic2:BigInt(l.topics[2]||0),topic3:BigInt(l.topics[3]||0),data:l.data,blockNumber:receipt.blockNumber,opCode:l.topics.length,blockHash:BigInt(receipt.blockHash),txHash:BigInt(receipt.hash),logIndex:l.index});
 }}
 async function tick(changes={}){return send(record(await source.CRON_TOPIC(),sequence+1,'0x',{contractAddress:await source.CRON_SOURCE(),...changes}));}
 async function move(ts){await provider.send('evm_setNextBlockTimestamp',[Number(ts)]);await provider.send('evm_mine',[]);}
 async function create({automatic=false}={}){return(await escrow.createQuoteWithPolicy(await customer.getAddress(),[{asset:ZeroAddress,total:300,deposit:100}],now+100,now+200,terms,automatic)).wait();}
 async function expire(quoteId=1){return(await proxy.deliver(receiver.target,source.target,receiver.interface.encodeFunctionData('processPolicy',[ZeroAddress,quoteId]))).wait();}
 async function deliver(index){return(await proxy.deliver(receiver.target,source.target,await system.payloads(index),{gasLimit:1500000})).wait();}
 return {provider,owner,customer,stranger,proxy,system,source,receiver,escrow,gate,profile,terms,now,record,send,forward,tick,move,create,expire,deliver};
}
test('V5 receiver authenticates proxy/source/domain and job identity before freeing work',async t=>{
 const f=await setup(t),{source,proxy,receiver,escrow,gate,profile,now,create,move,expire,stranger}=f;
 await assert.rejects(source.connect(stranger).configure.staticCall(escrow.target,receiver.target,gate.target));
 await assert.rejects(source.configure.staticCall(escrow.target,receiver.target,gate.target));
 await assert.rejects(receiver.pay.staticCall(1));
 await create();const payload=(chain=31337,target=escrow.target,epoch=1,p=profile)=>receiver.interface.encodeFunctionData('acknowledgeClosure',[ZeroAddress,chain,target,1,epoch,p]);
 await assert.rejects(receiver.acknowledgeClosure.staticCall(source.target,31337,escrow.target,1,1,profile));
 await assert.rejects(proxy.deliver.staticCall(receiver.target,await stranger.getAddress(),payload()));
 await assert.rejects(proxy.deliver.staticCall(receiver.target,source.target,payload())); // not terminal
 await move(now+100);await expire();assert.equal(await gate.unsettled(),1n);
 for(const data of [payload(31338),payload(31337,proxy.target),payload(31337,escrow.target,2),payload(31337,escrow.target,1,id('wrong'))])await assert.rejects(proxy.deliver.staticCall(receiver.target,source.target,data));
 await assert.rejects(gate.acknowledge.staticCall(1,1,profile));
 await(await proxy.deliver(receiver.target,source.target,payload())).wait();await(await proxy.deliver(receiver.target,source.target,payload())).wait();
 assert.equal(await gate.unsettled(),0n);assert.equal(await gate.active(),0n);
 await assert.rejects(escrow.requestClosureAcknowledgement.staticCall(1));
});
test('V5 local expiry round trip settles work only after authenticated closure delivery and observed ledger event',async t=>{
 const f=await setup(t),{source,system,receiver,escrow,gate,profile,now,create,forward,move,tick,deliver}=f;
 await forward(await create());assert.equal(await source.activeJobCount(),1n);
 await move(now+100);await tick();assert.equal(await system.count(),1n);
 assert.equal(receiver.interface.parseTransaction({data:await system.payloads(0)}).name,'processPolicy');
 const expiry=await deliver(0);assert.equal((await escrow.getQuote(1)).status,6n);assert.equal(await gate.unsettled(),1n);
 await forward(expiry);assert.equal((await source.jobs(1)).closed,true);await tick();assert.equal(await system.count(),2n);
 const decoded=receiver.interface.parseTransaction({data:await system.payloads(1)});assert.equal(decoded.name,'acknowledgeClosure');
 assert.equal(decoded.args[0],ZeroAddress);assert.equal(decoded.args[1],31337n);assert.equal(decoded.args[2],escrow.target);assert.equal(decoded.args[4],1n);assert.equal(decoded.args[5],profile);
 assert.equal(await system.lastRecipient(),receiver.target);assert.equal(await system.lastChain(),31337n);
 const settled=await deliver(1);assert.equal(await gate.unsettled(),0n);assert.equal(await source.activeJobCount(),0n);assert.equal((await source.closures(1)).awaitingDelivery,true);
 await forward(settled);assert.equal((await source.closures(1)).settled,true);assert.equal(await source.activeJobCount(),0n);assert.equal(await source.cronSubscribed(),false);
 await forward(expiry);await forward(settled);await tick();assert.equal(await system.count(),2n);
});
test('V5 delayed work registration and stale policy/deposit/retry logs cannot resurrect terminal work',async t=>{
 const f=await setup(t),{source,system,escrow,now,create,move,expire,forward,tick,record,send,profile}=f;
 const creation=await create(),workTopic='0x'+(await source.WORK_TOPIC()).toString(16).padStart(64,'0');
 await move(now+100);await forward(await expire());assert.equal((await source.jobs(1)).closed,true);assert.equal(await source.activeJobCount(),0n);
 await forward(creation,{only:[workTopic]});assert.equal(await source.activeJobCount(),1n);await tick();assert.equal(await system.count(),1n);
 for(const topic of [await source.RETRY_TOPIC(),await source.POLICY_RETRY_TOPIC()])await send(record(topic));
 await send(record(await source.DEPOSIT_TOPIC(),1,coder.encode(['uint256'],[100]),{opCode:3,topic2:BigInt(escrow.target)}));
 await forward(creation);assert.equal(await system.count(),1n);assert.equal((await source.jobs(1)).closed,true);assert.equal((await source.closures(1)).attempts,1n);
 await send(record(await source.WORK_TOPIC(),1,coder.encode(['uint64','bytes32'],[2,profile])));assert.equal((await source.closures(1)).epoch,1n);
});
test('V5 acknowledgement requests stop at a fixed cap; terminal recovery grants finite additional attempts',async t=>{
 const f=await setup(t),{source,system,escrow,gate,now,create,move,expire,forward,tick,profile,send,record,stranger}=f;
 await forward(await create());await move(now+100);await forward(await expire());
 await assert.rejects(escrow.connect(stranger).requestClosureAcknowledgement.staticCall(1));
 await(await system.setReject(true)).wait();
 async function exhaust(limit){while((await source.closures(1)).attempts<BigInt(limit)){const j=await source.jobs(1);const latest=(await f.provider.getBlock('latest')).timestamp;if(j.nextAt>BigInt(latest))await move(j.nextAt);await tick();}
  await move((await source.jobs(1)).nextAt);await tick();assert.equal(await source.activeJobCount(),0n);assert.equal(await source.cronSubscribed(),false);}
 await exhaust(3);assert.equal((await source.closures(1)).needsAttention,true);assert.equal(await gate.unsettled(),1n);
 const recovery1=await(await escrow.requestClosureAcknowledgement(1)).wait();await forward(recovery1);await forward(recovery1);
 await assert.rejects(escrow.requestClosureAcknowledgement.staticCall(1));await exhaust(6);
 const recovery2=await(await escrow.requestClosureAcknowledgement(1)).wait();await forward(recovery2);await exhaust(9);
 await assert.rejects(escrow.requestClosureAcknowledgement.staticCall(1));
 await send(record(await source.CLOSURE_RETRY_TOPIC(),1,coder.encode(['uint64','bytes32','uint8'],[1,profile,1])));assert.equal(await source.activeJobCount(),0n);
 await send(record(await source.CLOSURE_RETRY_TOPIC(),1,coder.encode(['uint64','bytes32','uint8'],[1,profile,3])));assert.equal((await source.closures(1)).attempts,9n);
 await tick();assert.equal(await system.count(),0n);assert.equal(await gate.unsettled(),1n);assert.equal(await f.provider.getBalance(escrow.target),0n);
});
test('V5 forged settled/work events and malformed CRON cannot erase or request work',async t=>{
 const f=await setup(t),{source,system,escrow,gate,create,forward,record,send,tick,now,move,expire}=f;
 await forward(await create());await move(now+100);await forward(await expire());
 const settled=await source.SETTLED_TOPIC();
 for(const changes of [{contractAddress:escrow.target},{contractAddress:gate.target,chainId:31338},{contractAddress:gate.target,opCode:3},{contractAddress:gate.target,data:coder.encode(['uint256'],[1])}])await send(record(settled,1,'0x',changes));
 assert.equal((await source.closures(1)).settled,false);assert.equal(await source.activeJobCount(),1n);
 await assert.rejects(source.react.staticCall(record(settled,1,'0x',{contractAddress:gate.target})));
 for(const changes of [{opCode:1},{opCode:3},{topic2:1},{topic3:1},{data:'0x12'},{chainId:31338},{contractAddress:escrow.target}])await tick(changes);
 assert.equal(await system.count(),0n);
 await send(record(await source.WORK_TOPIC(),1,'0x'));await send(record(await source.CLOSURE_RETRY_TOPIC(),1,'0x'));
 assert.equal((await source.closures(1)).recoveries,0n);await tick();assert.equal(await system.count(),1n);
});
test('V5 settled-before-registration tombstone and pause preserve finite closure work',async t=>{
 const f=await setup(t),{source,system,gate,receiver,escrow,profile,create,move,now,expire,forward,tick,record,send,proxy}=f;
 const creation=await create();await move(now+100);const expired=await expire();
 const settled=await(await proxy.deliver(receiver.target,source.target,receiver.interface.encodeFunctionData('acknowledgeClosure',[ZeroAddress,31337,escrow.target,1,1,profile]))).wait();
 await forward(settled);await forward(creation);await forward(expired);await tick();assert.equal(await source.activeJobCount(),0n);assert.equal(await system.count(),0n);
 // Local synthetic origin records exercise transport order only, never public evidence.
 await send(record(await source.WORK_TOPIC(),2,coder.encode(['uint64','bytes32'],[1,profile])));
 await send(record(await source.EXPIRED_TOPIC(),2));assert.equal(await source.activeJobCount(),1n);
 await(await source.setSchedulerPaused(true)).wait();await tick();assert.equal(await system.count(),0n);assert.equal(await source.cronSubscribed(),false);
 await(await source.setSchedulerPaused(false)).wait();await tick();assert.equal(await system.count(),1n);assert.equal((await source.jobs(2)).closed,true);
 assert.equal(await gate.unsettled(),0n); // synthetic quote 2 never existed on destination
});
test('V5 closure queue shares bounded scan/request budget and isolates rejected requests',async t=>{
 const f=await setup(t),{source,system,record,send,tick,profile}=f;
 // Synthetic source observations isolate queue mechanics; no destination outcome is claimed.
 for(let quote=1;quote<=12;quote++){
  await send(record(await source.WORK_TOPIC(),quote,coder.encode(['uint64','bytes32'],[1,profile])));
  await send(record(await source.EXPIRED_TOPIC(),quote));
 }
 await(await system.setReject(true)).wait();await tick();
 assert.equal((await source.closures(1)).attempts,1n);assert.equal((await source.closures(2)).attempts,1n);assert.equal(await system.count(),0n);
 await(await system.setReject(false)).wait();
 for(let n=0;n<6;n++){const before=await system.count();await tick();assert.ok((await system.count())-before<=2n);}
 assert.equal((await source.closures(12)).attempts,1n);assert.ok(await source.activeJobCount()<=2n);
});
test('V5 accepted-but-undelivered acknowledgement retains Base backing without autonomous source retry tails',async t=>{
 const f=await setup(t),{source,system,escrow,gate,create,forward,now,move,expire,tick,deliver}=f;
 await forward(await create());await move(now+100);await forward(await expire());await tick();
 assert.equal(await system.count(),1n);assert.equal(await source.activeJobCount(),0n);assert.equal(await source.cronSubscribed(),false);
 assert.equal((await source.closures(1)).awaitingDelivery,true);assert.equal(await gate.unsettled(),1n);
 await tick();assert.equal(await system.count(),1n);
 const recovery=await(await escrow.requestClosureAcknowledgement(1)).wait();await forward(recovery);await tick();
 assert.equal(await system.count(),2n);assert.equal((await source.closures(1)).attempts,2n);assert.equal(await source.activeJobCount(),0n);
 const receipt=await deliver(0);assert.equal(await gate.unsettled(),0n);await forward(receipt);
 await forward(recovery);await deliver(1);await tick();assert.equal(await source.activeJobCount(),0n);assert.equal(await system.count(),2n);
 await assert.rejects(escrow.requestClosureAcknowledgement.staticCall(1));
});
