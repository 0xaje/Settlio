const {test}=require('node:test'),assert=require('node:assert/strict');
const {id,ZeroAddress}=require('ethers');
const {setup,coder}=require('./helpers/renewable-protocol.cjs');
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
