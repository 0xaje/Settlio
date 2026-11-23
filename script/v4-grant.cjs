// One recoverable initial grant and a separate open-admission transaction. No implicit funding.
const {Wallet,Contract,getAddress,keccak256,toUtf8Bytes}=require('ethers');
const state=require('./v4-state.cjs');
const deployment=require('./v4-deploy.cjs');
const budget=require('./admission-budget.cjs');
const compile=require('./compile-admission.cjs');
const {rpc}=require('./m2-network.cjs');
const path=require('node:path');
const root=path.join(__dirname,'..'),plain=v=>JSON.parse(JSON.stringify(v,(_,x)=>typeof x==='bigint'?x.toString():x));
const same=(a,b)=>getAddress(a)===getAddress(b);
let gateABI;
const admissionABI=()=>gateABI??=compile('SettlioAdmission').abi;
function proposal(input){state.check(input&&Object.keys(input).length===3,'Explicit merchant, credits and validSeconds required.');const result={merchant:getAddress(input.merchant),credits:String(input.credits),validSeconds:String(input.validSeconds)};state.check(/^[1-9]\d*$/.test(result.credits)&&/^\d+$/.test(result.validSeconds),'Invalid grant proposal numbers.');return result;}
async function known(provider,operation){if(!operation)return false;return Boolean(await provider.getTransactionReceipt(operation.hash)||await provider.getTransaction(operation.hash));}
async function execute({mode,base,lasna,input,env=process.env,directoryRoot=root,clock=()=>BigInt(Math.floor(Date.now()/1000))}){
 state.check(['grant','open'].includes(mode),'Use grant or open for V4 sponsorship.');state.check(env.DEPLOYER_PRIVATE_KEY,'Supply the sponsor key only through the hidden local prompt.');const signer=new Wallet(env.DEPLOYER_PRIVATE_KEY,base);
 return state.locked(directoryRoot,async p=>{
 const journal=state.read(directoryRoot);state.check(same(signer.address,journal.deployer),'V4 sponsor key differs from deployment.');await deployment.verify({journal,base,lasna});
 const id=deployment.publicIdentity(journal),gate=new Contract(id.admission,admissionABI(),signer),save=()=>state.save(p.journal,journal);
 const readObservation=()=>budget.observe(base,lasna,id,clock);
 let request,key;
 if(mode==='grant'){
  const wanted=proposal(input);
  if(!journal.initialGrant){
   const observation=await readObservation(),result=budget.calculate(observation,wanted,clock());state.check(result.canGrant,'V4 lifetime funding model has a shortfall; no grant sent.');
   journal.initialGrant={proposal:wanted,result,initialObservation:plain(observation)};save();
  }
  const plan=journal.initialGrant;
  state.check(plan.result.fundingObservation===keccak256(toUtf8Bytes(JSON.stringify({identity:budget.identity(id),observation:plan.initialObservation,proposal:plan.proposal})))&&BigInt(plan.result.validUntil)===BigInt(plan.initialObservation.baseTimestamp)+BigInt(plan.proposal.validSeconds),'Saved V4 grant plan fingerprint/expiry mismatch.');
  state.check(JSON.stringify(wanted)===JSON.stringify(plan.proposal),'Saved V4 grant proposal differs; no replacement is allowed.');
  key='grantInitial';
  // A known pending/mined transaction is recovered, never replaced or reissued.
  if(!await known(base,journal.operations[key])){
   state.check(clock()>=BigInt(plan.initialObservation.observedAt)&&clock()-BigInt(plan.initialObservation.observedAt)<=120n&&BigInt(plan.result.validUntil)>clock()+15n,'Saved initial grant observation/expiry is stale. Inspect the saved intent; no automatic replacement.');
   const observation=await readObservation(),result=budget.calculate(observation,wanted,clock());state.check(result.canGrant,'V4 funding changed or is insufficient; no grant broadcast.');
   journal.initialGrant.latestObservation=plain(observation);save();
  }
  request=await gate.setGrant.populateTransaction(wanted.merchant,BigInt(wanted.credits),BigInt(plan.result.validUntil),plan.result.fundingObservation);
 }else{
  key='openAdmission';const plan=journal.initialGrant;
  state.check(plan&&journal.operations.grantInitial?.status==='confirmed','A confirmed saved initial grant is required before opening.');
  // Independently check its saved grant transaction, including after a crash before its status write.
  const operation=journal.operations.grantInitial,receipt=await base.getTransactionReceipt(operation.hash),tx=await base.getTransaction(operation.hash);
  const grantData=gate.interface.encodeFunctionData('setGrant',[plan.proposal.merchant,BigInt(plan.proposal.credits),BigInt(plan.result.validUntil),plan.result.fundingObservation]);
  state.check(receipt?.status===1&&tx&&same(tx.from,journal.deployer)&&same(tx.to,id.admission)&&tx.chainId===84532n&&tx.value===0n&&tx.data===grantData,'Recorded initial grant receipt/transaction mismatch.');
  if(!await known(base,journal.operations[key])){
   const observation=await readObservation(),grant=await gate.grants(plan.proposal.merchant);
   state.check(observation.open===false&&observation.active===0n&&observation.admitted===0n&&observation.reserved===BigInt(plan.proposal.credits)&&grant.remaining===BigInt(plan.proposal.credits)&&grant.validUntil===BigInt(plan.result.validUntil)&&grant.fundingObservation===plan.result.fundingObservation&&grant.validUntil>clock()+15n,'Initial grant changed, expired or already used; no admission opening sent.');
   // This is a funding recheck for the one known reserved batch, not a new/incremental grant.
   const result=budget.calculate({...observation,reserved:0n},plan.proposal,clock());state.check(result.canGrant,'V4 lifetime funding is insufficient before opening.');journal.initialGrant.preOpenObservation=plain(observation);save();
  }
  request=await gate.setOpen.populateTransaction(true);
 }
 const receipt=await state.run({journal,key,signer,request,save});
 return {readOnly:false,operation:key,transactionHash:receipt.hash,identity:id,admissionOpen:await gate.open(),grant:plain(await gate.grants(journal.initialGrant.proposal.merchant)),note:'One saved intent per stage. Reruns recover the original transaction; no extra credits, funding, quote or payment is created. Current grant state may have changed after successful execution.'};
 });
}
async function main(){const [mode,merchant,credits,validSeconds='300']=process.argv.slice(2);const base=rpc(process.env.BASE_SEPOLIA_RPC||'https://sepolia.base.org'),lasna=rpc(process.env.LASNA_RPC||'https://lasna-rpc.rnk.dev');try{const result=await execute({mode,base,lasna,input:mode==='grant'?{merchant,credits,validSeconds}:undefined});console.log(JSON.stringify(result,(_,v)=>typeof v==='bigint'?v.toString():v,2));}finally{base.destroy();lasna.destroy();}}
if(require.main===module)main().catch(e=>{console.error(e.v4Expected||e.admissionBudget||e.m2Expected?e.message:'V4 sponsorship stopped. Preserve the journal and inspect status; no automatic replacement is authorised.');process.exitCode=1;});
module.exports={proposal,execute};
