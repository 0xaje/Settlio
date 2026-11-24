const {test}=require('node:test');
const assert=require('node:assert/strict');
const {validateUnused}=require('../script/v4-renew.cjs');
const observation={active:0n,admitted:0n,quoteCount:0n,activeJobs:0n,cronActive:false,paused:false,reserved:1n,baseTimestamp:1000n};
const grant={remaining:1n,validUntil:900n,fundingObservation:'reference'};
const plan={proposal:{credits:'1'},result:{validUntil:'900',fundingObservation:'reference'}};
test('renewal only replaces an expired, unchanged original grant on an entirely unused deployment',()=>{
 assert.doesNotThrow(()=>validateUnused(observation,grant,plan,1000n));
 for(const key of ['active','admitted','quoteCount','activeJobs'])assert.throws(()=>validateUnused({...observation,[key]:1n},grant,plan,1000n),/unused/);
 for(const key of ['paused','cronActive'])assert.throws(()=>validateUnused({...observation,[key]:true},grant,plan,1000n),/unused/);
 for(const change of [{remaining:0n},{validUntil:901n},{fundingObservation:'other'}])assert.throws(()=>validateUnused(observation,{...grant,...change},plan,1000n),/changed/);
 assert.throws(()=>validateUnused({...observation,reserved:2n},grant,plan,1000n),/changed/);
 assert.throws(()=>validateUnused({...observation,baseTimestamp:899n},grant,plan,1000n),/not expired/);
 assert.throws(()=>validateUnused(observation,grant,plan,899n),/not expired/);
});
