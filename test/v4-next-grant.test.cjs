const {test}=require('node:test'),assert=require('node:assert/strict');
const {remainingModel}=require('../script/v4-next-grant.cjs');
const load=()=>JSON.parse(require('fs').readFileSync(require('path').join(__dirname,'../deployments/evidence/v4/quote-1-release-verified.json'),'utf8')).bundle;
function input(){const b=load(),i=b.v4;const {AbiCoder}=require('ethers'),a=AbiCoder.defaultAbiCoder(),u=x=>a.decode(['uint256'],x)[0];return {identity:{policyVersion:4,escrow:b.result?.escrow||'0x5675C610d6f0aCe9f7933f3584D53dc4F567Dc6B',callback:'0x49ff0a4Bfa918b0576315C31a0bcE561eEBf3Df0',reactive:'0xFa1F509E21040bB4fE266B79E9583073914dFe6e',admission:'0x935Ef09F57B68D08fd9Fd315755b7Daf49871486',sponsor:'0xbf6301D7bca9F23A63A2d1Ed513d5120Dbb2288E'},open:true,active:0n,reserved:0n,admitted:1n,quoteCount:1n,activeJobs:0n,cronActive:false,paused:false,maxActive:6n,maxLifetime:6n,maxHorizon:900n,maxRetries:1n,retryInterval:60n,maxAttempts:6n,sourceRetrySeconds:60n,callbackGas:1000000n,maxRequests:2n,maxScans:8n,reactiveDebt:0n,callbackDebt:0n,reactiveReserves:u(i.reactiveReserves),callbackReserves:u(i.callbackReserves),callbackBalance:10n**16n,reactiveCoeff:1000n,callbackCoeff:1100n,reactiveExtra:100000n,callbackExtra:80000n,reactivePrice:10n**11n,callbackPrice:6000000n,subscriptions:{originSubscriptions:10,cronActive:false,filterVersion:1},baseChain:84532n,lasnaChain:5318007n,observedAt:1000n,baseTimestamp:1000n,lasnaTimestamp:1000n,cronTimes:[700n,800n,900n]};}
// Controlled model inputs are unit fixtures; they are not fresh public fee observations.
const closed={destinationClosed:true,sourceClosed:true,status:7n,grantRemaining:0n};
const proposal={merchant:'0xbf6301D7bca9F23A63A2d1Ed513d5120Dbb2288E',credits:'1',validSeconds:'3600'};
test('remaining model budgets all five unconsumed lifetime quotes and does not regenerate the first',()=>{const o=input(),r=remainingModel(o,closed,proposal,1000n);assert.equal(r.lifetimeQuotesBudgeted,'5');assert.equal(r.remainingLifetimeQuotes,'5');assert.equal(r.completedLifetimeQuotes,'1');assert.equal(o.admitted,1n);assert.equal(o.maxLifetime,6n);assert.equal(r.validUntil,'4600');});
test('next credit refuses active work, unsettled source closure and existing grant capacity',()=>{for(const change of [{active:1n},{reserved:1n},{admitted:0n},{admitted:2n},{quoteCount:2n},{activeJobs:1n},{cronActive:true},{paused:true},{open:false}])assert.throws(()=>remainingModel({...input(),...change},closed,proposal,1000n));for(const change of [{sourceClosed:false},{destinationClosed:false},{status:3n},{grantRemaining:1n}])assert.throws(()=>remainingModel(input(),{...closed,...change},proposal,1000n));});
test('remaining allowance funding checks remain strict and proposal is bound to reference',()=>{assert.equal(remainingModel({...input(),reactiveReserves:0n},closed,proposal,1000n).canGrant,false);assert.throws(()=>remainingModel({...input(),observedAt:800n},closed,proposal,1000n));assert.throws(()=>remainingModel({...input(),maxLifetime:1n},closed,proposal,1000n));assert.notEqual(remainingModel(input(),closed,proposal,1000n).fundingObservation,remainingModel(input(),closed,{...proposal,validSeconds:'3000'},1000n).fundingObservation);});

test('quote-3 refund credit budgets only four remaining lifetime admissions and binds earlier closure',()=>{
 const o={...input(),admitted:2n,quoteCount:2n},c={...closed,earlier:[{quoteId:'1',destinationClosed:true,sourceClosed:true,status:7n}]};
 const r=remainingModel(o,c,proposal,1000n,2n);assert.equal(r.remainingLifetimeQuotes,'4');assert.equal(r.completedLifetimeQuotes,'2');assert.equal(r.lifetimeQuotesBudgeted,'4');assert.equal(o.maxLifetime,6n);
 for(const change of [{earlier:[]},{earlier:[{...c.earlier[0],sourceClosed:false}]},{earlier:[{...c.earlier[0],status:3n}]}])assert.throws(()=>remainingModel(o,{...c,...change},proposal,1000n,2n));
 for(const change of [{admitted:1n},{quoteCount:3n},{reserved:1n},{activeJobs:1n}])assert.throws(()=>remainingModel({...o,...change},c,proposal,1000n,2n));
 assert.throws(()=>remainingModel(o,c,proposal,1000n,5n));assert.equal(remainingModel({...o,reactiveReserves:0n},c,proposal,1000n,2n).canGrant,false);
});

test('quote-4 USDC refund preparation budgets three remaining slots and requires both earlier closures',()=>{
 const o={...input(),admitted:3n,quoteCount:3n},earlier=[{quoteId:'1',destinationClosed:true,sourceClosed:true,status:7n},{quoteId:'2',destinationClosed:true,sourceClosed:true,status:7n}],c={...closed,status:5n,earlier};
 const r=remainingModel(o,c,proposal,1000n,3n);assert.equal(r.remainingLifetimeQuotes,'3');assert.equal(r.completedLifetimeQuotes,'3');assert.equal(r.lifetimeQuotesBudgeted,'3');assert.equal(o.admitted,3n);assert.equal(o.maxLifetime,6n);
 for(const earlier of [c.earlier.slice(0,1),[c.earlier[0],c.earlier[0]],[c.earlier[1],c.earlier[0]],[c.earlier[0],{...c.earlier[1],sourceClosed:false}]])assert.throws(()=>remainingModel(o,{...c,earlier},proposal,1000n,3n));
 for(const change of [{admitted:2n},{quoteCount:2n},{active:1n},{reserved:1n},{activeJobs:1n},{paused:true}])assert.throws(()=>remainingModel({...o,...change},c,proposal,1000n,3n));
 assert.throws(()=>remainingModel({...o,observedAt:800n},c,proposal,1000n,3n));assert.equal(remainingModel({...o,reactiveReserves:0n},c,proposal,1000n,3n).canGrant,false);
});

test('quote-5 expiry preparation budgets the final two slots without regenerating earlier admissions',()=>{
 const o={...input(),admitted:4n,quoteCount:4n},earlier=[1,2,3].map(n=>({quoteId:String(n),destinationClosed:true,sourceClosed:true,status:n===3?5n:7n})),c={...closed,status:5n,earlier};
 const r=remainingModel(o,c,proposal,1000n,4n);assert.equal(r.remainingLifetimeQuotes,'2');assert.equal(r.completedLifetimeQuotes,'4');assert.equal(r.lifetimeQuotesBudgeted,'2');assert.equal(o.maxLifetime,6n);assert.equal(o.admitted,4n);
 for(const earlier of [c.earlier.slice(0,2),[c.earlier[0],c.earlier[1],c.earlier[1]],[c.earlier[0],c.earlier[1],{...c.earlier[2],sourceClosed:false}]])assert.throws(()=>remainingModel(o,{...c,earlier},proposal,1000n,4n));
 for(const change of [{quoteCount:3n},{active:1n},{reserved:1n},{activeJobs:1n},{cronActive:true},{paused:true}])assert.throws(()=>remainingModel({...o,...change},c,proposal,1000n,4n));
 assert.equal(remainingModel({...o,reactiveReserves:0n},c,proposal,1000n,4n).canGrant,false);assert.throws(()=>remainingModel({...o,observedAt:800n},c,proposal,1000n,4n));assert.throws(()=>remainingModel(o,c,proposal,1000n,5n));
});
