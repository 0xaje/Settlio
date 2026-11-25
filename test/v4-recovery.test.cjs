const {test}=require('node:test'),assert=require('node:assert/strict');
const {canPause}=require('../script/v4-recovery.cjs'),state=require('../script/v4-state.cjs');
const ready=()=>({quoteCount:5n,admission:{admitted:5n,active:0n,reserved:1n,open:true},activeJobs:0n,paused:false,cronActive:false,nativeCustody:{balance:0n,liability:0n},usdcCustody:{balance:0n,liability:0n}});
test('V4 controlled pause requires the final unused reservation and completely idle custody/work',()=>{
 assert.equal(canPause(ready()),true);
 for(const change of [{quoteCount:6n},{activeJobs:1n},{paused:true},{cronActive:true},{nativeCustody:{balance:1n,liability:0n}},{nativeCustody:{balance:1n,liability:1n}},{usdcCustody:{balance:1n,liability:1n}}])assert.equal(canPause({...ready(),...change}),false);
 for(const change of [{admitted:4n},{active:1n},{reserved:0n},{reserved:2n},{open:false}])assert.equal(canPause({...ready(),admission:{...ready().admission,...change}}),false);
});
test('V4 recovery stages are separate from V3 and use the correct transaction networks',()=>{assert.equal(state.stages.grantRecoveryQuote,84532);assert.equal(state.stages.pauseRecoveryScheduler,5318007);assert.equal(state.stages.resumeRecoveryScheduler,5318007);assert.equal(state.stages.pauseScheduler,undefined);assert.equal(state.stages.resumeScheduler,undefined);});
