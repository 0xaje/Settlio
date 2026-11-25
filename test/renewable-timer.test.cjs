const {test}=require('node:test'),assert=require('node:assert/strict');
const {keccak256}=require('ethers');
const {setup,coder}=require('./helpers/renewable-protocol.cjs');
const IGNORE=BigInt('0xa65f96fc951c35ead38878e0f0b7a3c744a6f5ccc1476b313353ce31712313ad');
async function selected(f,changes={}){return f.tick({topic0:await f.source.currentCronTopic(),...changes});}
async function subscriptions(f,wanted){
 const topics=await Promise.all([f.source.CRON_TOPIC(),f.source.CRON1000_TOPIC(),f.source.CRON10000_TOPIC()]);
 for(const topic of topics){const key=keccak256(coder.encode(['address','uint256','address','uint256','uint256','uint256','uint256'],[f.source.target,31337,await f.source.CRON_SOURCE(),topic,IGNORE,IGNORE,IGNORE]));assert.equal(await f.system.subscriptions(key),topic===wanted);}
}
test('V5 opt-in adaptive timer transitions coarse to medium to fast without early destination expiry',async t=>{
 const f=await setup(t,{adaptive:true,horizon:864000}),{source,system,escrow,gate,now,forward,create,move,tick,deliver}=f;
 const expiry=now+86400;await forward(await create({expiry,cutoff:expiry+3600}));
 const fast=await source.CRON_TOPIC(),medium=await source.CRON1000_TOPIC(),coarse=await source.CRON10000_TOPIC();
 assert.equal(await source.adaptiveTimers(),true);assert.equal(await source.earliestDue(),BigInt(expiry));assert.equal(await source.currentCronTopic(),coarse);await subscriptions(f,coarse);
 await tick();assert.equal(await system.count(),0n); // stale/unsubscribed fast topic
 await move(expiry-21600);await selected(f);assert.equal(await source.currentCronTopic(),medium);await subscriptions(f,medium);
 await move(expiry-1800);await selected(f);assert.equal(await source.currentCronTopic(),fast);await subscriptions(f,fast);
 await tick({topic0:medium});assert.equal(await system.count(),0n);
 await move(expiry-1);await selected(f);assert.equal(await system.count(),0n);assert.equal((await escrow.getQuote(1)).status,1n);
 await move(expiry);await selected(f);assert.equal(await system.count(),1n);
 await forward(await deliver(0));assert.equal((await escrow.getQuote(1)).status,6n);assert.equal(await gate.unsettled(),1n);
 await selected(f);assert.equal(await source.currentCronTopic(),0n);assert.equal(await source.earliestDue(),0n);await subscriptions(f,0n);
 await forward(await deliver(1));assert.equal(await gate.unsettled(),0n);assert.equal((await source.closures(1)).settled,true);
});
test('V5 earliest-deadline heap remains exact across arbitrary insertions, reschedules and removals',async t=>{
 const f=await setup(t,{adaptive:true}),{source,now,record,send}=f,expected=new Map();
 const due=[80000,900,90000,3600,10000,500,50000,12000,2500,42000,700,60000];
 async function check(){assert.equal(await source.activeJobCount(),BigInt(expected.size));assert.equal(await source.earliestDue(),expected.size?BigInt(Math.min(...expected.values())):0n);}
 for(let n=1;n<=due.length;n++){const d=now+due[n-1];await send(record(await source.POLICY_TOPIC(),n,coder.encode(['uint64','uint64','bool'],[d,d+1000,true])));expected.set(n,d);await check();}
 const cancelled=await send(record(await source.CANCEL_TOPIC(),12));expected.set(12,(await f.provider.getBlock(cancelled.blockNumber)).timestamp);await check();
 const checked=await send(record(await source.CHECKED_TOPIC(),12,coder.encode(['uint8'],[1])));expected.set(12,(await f.provider.getBlock(checked.blockNumber)).timestamp+60);await check();
 for(const n of [3,1,12,6,11,7,5,2,4,8,9,10]){await send(record(await source.EXPIRED_TOPIC(),n));expected.delete(n);await check();}
 assert.equal(await source.cronSubscribed(),false);assert.equal(await source.currentCronTopic(),0n);
});
test('V5 explicit fast-only profile and adaptive pause/resume preserve subscription identity',async t=>{
 const fastOnly=await setup(t,{adaptive:false,horizon:864000});
 await fastOnly.forward(await fastOnly.create({expiry:fastOnly.now+86400,cutoff:fastOnly.now+90000}));
 assert.equal(await fastOnly.source.adaptiveTimers(),false);assert.equal(await fastOnly.source.currentCronTopic(),await fastOnly.source.CRON_TOPIC());
 const f=await setup(t,{adaptive:true,horizon:864000}),{source,now,forward,create,move,stranger}=f;
 await forward(await create({expiry:now+86400,cutoff:now+90000}));
 await assert.rejects(source.connect(stranger).setSchedulerPaused.staticCall(true));
 await(await source.setSchedulerPaused(true)).wait();await subscriptions(f,0n);assert.equal(await source.earliestDue(),BigInt(now+86400));
 await move(now+86400-1800);await(await source.setSchedulerPaused(false)).wait();
 assert.equal(await source.currentCronTopic(),await source.CRON_TOPIC());await subscriptions(f,await source.CRON_TOPIC());
});
test('V5 bounded heap handles a larger local queue without scanning all jobs for the earliest timer',async t=>{
 const f=await setup(t,{adaptive:true}),{source,now,send,record,system}=f;
 let minimum=Infinity,last;
 for(let n=1;n<=128;n++){const due=now+100000+((n*73)%257);minimum=Math.min(minimum,due);last=await send(record(await source.POLICY_TOPIC(),n,coder.encode(['uint64','uint64','bool'],[due,due+1000,true])));}
 assert.equal(await source.activeJobCount(),128n);assert.equal(await source.earliestDue(),BigInt(minimum));assert.ok(last.gasUsed<900000n);
 const cancelled=await send(record(await source.CANCEL_TOPIC(),128));assert.ok(cancelled.gasUsed<900000n);
 assert.equal(await source.currentCronTopic(),await source.CRON_TOPIC());
 await selected(f);assert.equal(await system.count(),1n);assert.equal((await source.jobs(128)).attempts,1n);
 assert.equal(await source.activeJobCount(),128n);
});
