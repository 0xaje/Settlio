const {test}=require('node:test');
const assert=require('node:assert/strict');
const {identity,calculate,observe}=require('../script/admission-budget.cjs');
const address=n=>'0x'+n.toString(16).padStart(40,'0');
const ids={policyVersion:4,escrow:address(1),callback:address(2),reactive:address(3),admission:address(4),sponsor:address(5)};
function snapshot(){return {identity:ids,subscriptions:{originSubscriptions:10,cronActive:false,filterVersion:1},baseChain:84532n,lasnaChain:5318007n,observedAt:1000n,baseTimestamp:1000n,lasnaTimestamp:1000n,open:false,admitted:0n,reserved:0n,active:0n,quoteCount:0n,activeJobs:0n,cronActive:false,paused:false,maxActive:2n,maxLifetime:3n,maxHorizon:1000n,maxRetries:2n,retryInterval:60n,maxAttempts:6n,sourceRetrySeconds:60n,callbackGas:1000000n,maxRequests:2n,maxScans:8n,reactiveDebt:0n,callbackDebt:0n,reactiveReserves:10n**25n,callbackReserves:0n,callbackBalance:10n**25n,reactivePrice:100000000000n,callbackPrice:6000000n,reactiveCoeff:1000n,callbackCoeff:1100n,reactiveExtra:100000n,callbackExtra:80000n,cronTimes:[700n,800n,900n]};}
const proposal={merchant:address(6),credits:1n,validSeconds:300n};
test('initial V4 model covers full lifetime and all attempt reset classes, with deterministic public reference',()=>{
 const o=snapshot(),p=calculate(o,proposal,1000n);assert.equal(p.canGrant,true);assert.equal(p.readOnly,true);assert.equal(p.lifetimeQuotesBudgeted,'3');assert.equal(p.attemptBatchesPerQuote,'5');assert.equal(p.callbacksPerQuote,'33');assert.equal(p.fundingObservation,calculate(o,proposal,1000n).fundingObservation);
 assert.notEqual(p.fundingObservation,calculate(o,{...proposal,credits:2n},1000n).fundingObservation);
 assert.equal(p.reactiveRequiredWei,calculate(o,{...proposal,credits:2n},1000n).reactiveRequiredWei);
});
test('source shortfall excludes source balance and customer principal; destination shortfall cannot pass',()=>{
 for(const changes of [{reactiveReserves:0n,reactiveBalance:10n**30n,customerPrincipal:10n**30n},{callbackReserves:0n,callbackBalance:0n}])assert.equal(calculate({...snapshot(),...changes},proposal,1000n).canGrant,false);
});
test('debt, wrong networks, stale/unknown observations and unsafe configuration are rejected',()=>{
 for(const changes of [{subscriptions:undefined},{subscriptions:{originSubscriptions:9,cronActive:false,filterVersion:1}},{subscriptions:{originSubscriptions:10,cronActive:true,filterVersion:1}},{subscriptions:{originSubscriptions:10,cronActive:false,filterVersion:null}},{reactiveDebt:1n},{callbackDebt:1n},{baseChain:1n},{lasnaChain:1n},{observedAt:800n},{observedAt:1001n},{baseTimestamp:500n},{lasnaTimestamp:1100n},{cronTimes:[700n,700n,900n]},{cronTimes:[]},{reactiveCoeff:0n},{callbackPrice:0n},{callbackExtra:-1n},{maxAttempts:7n},{maxRequests:3n},{maxScans:9n},{maxHorizon:0n},{maxLifetime:1n},{paused:undefined},{cronActive:undefined}])assert.throws(()=>calculate({...snapshot(),...changes},proposal,1000n));
 assert.throws(()=>calculate({...snapshot(),baseTimestamp:850n},{...proposal,validSeconds:30n},1000n),/window/);
});
test('incremental grants, open admission and outstanding work cannot reuse initial budget',()=>{
 for(const changes of [{open:true},{admitted:1n},{reserved:1n},{active:1n},{quoteCount:1n},{activeJobs:1n},{paused:true},{cronActive:true}])assert.throws(()=>calculate({...snapshot(),...changes},proposal,1000n),/fresh/);
});
test('identity accepts public V4 fields only and grant proposal enforces capacity and short validity',()=>{
 assert.deepEqual(identity(ids),ids);
 for(const input of [{...ids,policyVersion:3},{...ids,extra:'not-public-identity'},{...ids,escrow:address(0)},{...ids,admission:ids.escrow}])assert.throws(()=>identity(input));
 for(const changes of [{credits:0n},{credits:3n},{merchant:address(0)},{validSeconds:10n},{validSeconds:601n}])assert.throws(()=>calculate(snapshot(),{...proposal,...changes},1000n));
});

test('RPC failure cannot produce a successful funding plan',async()=>{
 const unavailable={send:async()=>{throw Error('fixture RPC unavailable');}};
 await assert.rejects(observe(unavailable,unavailable,ids),/unavailable/);
});

test('explicit one-hour operator window leaves quote horizon and whole-lifetime cost unchanged',()=>{
 const o=snapshot(),long={...proposal,validSeconds:3600n};
 assert.throws(()=>calculate(o,long,1000n));
 const result=calculate(o,long,1000n,3600n),short=calculate(o,proposal,1000n);
 assert.equal(result.validUntil,'4600');assert.equal(result.reactiveRequiredWei,short.reactiveRequiredWei);assert.equal(result.callbackRequiredWei,short.callbackRequiredWei);assert.equal(o.maxHorizon,1000n);
 assert.throws(()=>calculate(o,{...long,validSeconds:3601n},1000n,3600n));assert.throws(()=>calculate(o,long,1000n,7200n));
});
