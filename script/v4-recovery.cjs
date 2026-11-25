// One controlled V4 pause/restore cycle. Imports never load a key or send a transaction.
const path=require('node:path');
const {Wallet,Contract,getAddress,keccak256,toUtf8Bytes}=require('ethers');
const state=require('./v4-state.cjs'),deployment=require('./v4-deploy.cjs'),compile=require('./compile-admission.cjs'),{rpc}=require('./m2-network.cjs');
const root=path.join(__dirname,'..'),same=(a,b)=>getAddress(a)===getAddress(b),fingerprint=p=>keccak256(toUtf8Bytes(JSON.stringify(p)));
let abi;const reactiveABI=()=>abi??=compile('SettlioReactiveV4').abi;
function canPause(v){return v.quoteCount===5n&&v.admission.admitted===5n&&v.admission.active===0n&&v.admission.reserved===1n&&v.admission.open===true&&v.activeJobs===0n&&!v.paused&&!v.cronActive&&v.nativeCustody.balance===0n&&v.nativeCustody.liability===0n&&v.usdcCustody.balance===0n&&v.usdcCustody.liability===0n;}
async function assertSavedPause(j,lasna,id){
 const op=j.operations.pauseRecoveryScheduler;state.check(op?.status==='confirmed','Confirmed saved V4 recovery pause required before resume.');
 const [tx,r]=await Promise.all([lasna.getTransaction(op.hash),lasna.getTransactionReceipt(op.hash)]),contract=new Contract(id.reactive,reactiveABI(),lasna);
 state.check(tx&&r?.status===1&&same(tx.from,j.deployer)&&same(tx.to,id.reactive)&&tx.chainId===5318007n&&tx.value===0n&&tx.data===contract.interface.encodeFunctionData('setSchedulerPaused',[true]),'Saved V4 recovery pause receipt mismatch.');
}
async function assertRecoveryGrant(j,base,id){
 const plan=j.recoveryQuoteGrant,op=j.operations.grantRecoveryQuote;
 state.check(plan&&plan.fingerprint===fingerprint(plan.payload)&&op?.status==='confirmed','Confirmed final recovery credit required before controlled pause.');
 const p=plan.payload;state.check(JSON.stringify(p.identity)===JSON.stringify(id)&&p.proposal.merchant===j.deployer&&p.proposal.credits==='1'&&p.result.completedLifetimeQuotes==='5'&&p.result.remainingLifetimeQuotes==='1','Final recovery credit scope mismatch.');
 const gate=new Contract(id.admission,compile('SettlioAdmission').abi,base),[tx,r,g]=await Promise.all([base.getTransaction(op.hash),base.getTransactionReceipt(op.hash),gate.grants(j.deployer)]);
 state.check(tx&&r?.status===1&&same(tx.from,j.deployer)&&same(tx.to,id.admission)&&tx.chainId===84532n&&tx.value===0n&&tx.data===gate.interface.encodeFunctionData('setGrant',[j.deployer,1,p.result.validUntil,p.result.fundingObservation]),'Final recovery grant receipt mismatch.');
 const block=await base.getBlock('latest');state.check(g.remaining===1n&&g.validUntil===BigInt(p.result.validUntil)&&g.fundingObservation===p.result.fundingObservation&&g.validUntil>BigInt(block.timestamp)+60n,'Final recovery credit consumed, changed or too near expiry; do not pause.');
}
async function status({base,lasna,directoryRoot=root}){
 const journal=state.read(directoryRoot),observation=await deployment.verify({journal,base,lasna}),id=deployment.publicIdentity(journal);
 return {...observation,recoveryPause:journal.operations.pauseRecoveryScheduler?.hash??null,recoveryResume:journal.operations.resumeRecoveryScheduler?.hash??null,pauseStateConditionsMet:canPause(observation),limits:['Read-only status; a final credit receipt is separately verified before pause.','Pause disables CRON only; origin observation and some fees continue.','A controlled owner pause is not evidence of a protocol outage.']};
}
async function execute({mode,base,lasna,directoryRoot=root,env=process.env}){
 state.check(mode==='pause'||mode==='resume','Use V4 recovery pause or resume.');state.check(env.DEPLOYER_PRIVATE_KEY,'Supply sponsor key only in the hidden local prompt.');
 const signer=new Wallet(env.DEPLOYER_PRIVATE_KEY,lasna);
 return state.locked(directoryRoot,async paths=>{
  const journal=state.read(directoryRoot);state.check(same(signer.address,journal.deployer),'Recovery signer differs from recorded sponsor.');
  const id=deployment.publicIdentity(journal),observation=await deployment.verify({journal,base,lasna}),key=mode==='pause'?'pauseRecoveryScheduler':'resumeRecoveryScheduler';
  if(!journal.operations[key]){
   if(mode==='pause'){
    state.check(!journal.operations.resumeRecoveryScheduler,'The one controlled recovery cycle has already been restored.');state.check(canPause(observation),'Pause requires five completed quotes, one unused final reservation, idle unpaused scheduler and zero custody/liabilities.');await assertRecoveryGrant(journal,base,id);
   }else{
    await assertSavedPause(journal,lasna,id);state.check(observation.paused,'Scheduler already unpaused without this saved restore; inspect before another action.');
    // Restore must not be blocked merely because work or principal appeared while paused.
   }
  }
  const r=new Contract(id.reactive,reactiveABI(),signer),receipt=await state.run({journal,key,signer,request:await r.setSchedulerPaused.populateTransaction(mode==='pause'),save:()=>state.save(paths.journal,journal)}),paused=await r.schedulerPaused();
  state.check(paused===(mode==='pause'),'Saved owner action succeeded but current pause state differs; no replacement or new action sent.');
  return {readOnly:false,operation:key,transactionHash:receipt.hash,reactive:id.reactive,paused,note:'One saved owner action per V4 recovery stage. Reruns recover the same hash/nonce. No quote, deposit, grant, funding or participant retry is created.'};
 });
}
async function main(){const mode=process.argv[2];state.check(['status','pause','resume'].includes(mode),'Use V4 recovery status, pause or resume.');const base=rpc(process.env.BASE_SEPOLIA_RPC||'https://base-sepolia-rpc.publicnode.com'),lasna=rpc(process.env.LASNA_RPC||'https://lasna-rpc.rnk.dev');try{const result=mode==='status'?await status({base,lasna}):await execute({mode,base,lasna});console.log(JSON.stringify(result,(_,v)=>typeof v==='bigint'?v.toString():v,2));}finally{base.destroy();lasna.destroy();}}
if(require.main===module)main().catch(e=>{console.error(e.v4Expected?e.message:'V4 recovery stopped; preserve journal and inspect status. No automatic replacement is authorized.');process.exitCode=1;});
module.exports={canPause,status,execute};
