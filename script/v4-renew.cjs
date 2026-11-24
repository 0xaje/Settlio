// One explicit renewal of an expired, wholly unused initial V4 grant. No funding or opening.
const {Wallet,Contract,getAddress,keccak256,toUtf8Bytes}=require('ethers');
const path=require('node:path');
const state=require('./v4-state.cjs'),deployment=require('./v4-deploy.cjs');
const budget=require('./admission-budget.cjs'),compile=require('./compile-admission.cjs');
const {rpc}=require('./m2-network.cjs');
const root=path.join(__dirname,'..');
const plain=x=>JSON.parse(JSON.stringify(x,(_,v)=>typeof v==='bigint'?v.toString():v));
const same=(a,b)=>getAddress(a)===getAddress(b);
let abi;const gateABI=()=>abi??=compile('SettlioAdmission').abi;
function validateUnused(observation,grant,plan,now){
 state.check(observation.active===0n&&observation.admitted===0n&&observation.quoteCount===0n&&observation.activeJobs===0n&&!observation.cronActive&&!observation.paused,'Renewal requires an entirely unused, idle deployment.');
 state.check(grant.remaining===BigInt(plan.proposal.credits)&&observation.reserved===grant.remaining&&grant.validUntil===BigInt(plan.result.validUntil)&&grant.fundingObservation===plan.result.fundingObservation,'Original unused grant changed; renewal refused.');
 state.check(observation.baseTimestamp>=grant.validUntil&&now>=grant.validUntil,'Original grant has not expired.');
}
async function inspect({base,lasna,directoryRoot=root,clock=()=>BigInt(Math.floor(Date.now()/1000))}){
 const journal=state.read(directoryRoot);await deployment.verify({journal,base,lasna});
 const id=deployment.publicIdentity(journal),plan=journal.initialGrant;
 state.check(plan&&journal.operations.grantInitial?.status==='confirmed','Confirmed original grant required.');
 const gate=new Contract(id.admission,gateABI(),base),op=journal.operations.grantInitial;
 const [receipt,tx]=await Promise.all([base.getTransactionReceipt(op.hash),base.getTransaction(op.hash)]);
 const data=gate.interface.encodeFunctionData('setGrant',[plan.proposal.merchant,plan.proposal.credits,plan.result.validUntil,plan.result.fundingObservation]);
 state.check(receipt?.status===1&&tx&&same(tx.from,journal.deployer)&&same(tx.to,id.admission)&&tx.chainId===84532n&&tx.value===0n&&tx.data===data,'Original grant transaction mismatch.');
 const observation=await budget.observe(base,lasna,id,clock);
 const grant=await gate.grants(plan.proposal.merchant,{blockTag:observation.baseBlock});
 validateUnused(observation,grant,plan,clock());
 // Exact original reservation was verified above. Model replacement, not incremental capacity.
 const proposal={merchant:plan.proposal.merchant,credits:String(grant.remaining),validSeconds:'600'};
 const result=budget.calculate({...observation,open:false,reserved:0n},proposal,clock());
 state.check(result.canGrant,'Current V4 lifetime funding has a shortfall; no renewal authorised.');
 return {journal,id,gate,proposal,observation:plain(observation),result};
}
function fingerprint(value){return keccak256(toUtf8Bytes(JSON.stringify(value)));}
async function renew(args){
 const {base,lasna,env=process.env,directoryRoot=root,clock=()=>BigInt(Math.floor(Date.now()/1000))}=args;
 state.check(env.DEPLOYER_PRIVATE_KEY,'Supply sponsor key only in the hidden local prompt.');
 const signer=new Wallet(env.DEPLOYER_PRIVATE_KEY,base);
 return state.locked(directoryRoot,async p=>{
  let journal=state.read(directoryRoot);state.check(same(signer.address,journal.deployer),'Renewal signer differs from sponsor.');
  await deployment.verify({journal,base,lasna});
  const id=deployment.publicIdentity(journal),gate=new Contract(id.admission,gateABI(),signer),key='renewExpiredGrant';
  const save=()=>state.save(p.journal,journal);
  if(!journal.expiredGrantRenewal){
   state.check(!journal.operations[key],'Renewal intent has no plan; preserve journal.');
   const checked=await inspect({base,lasna,directoryRoot,clock});
   const payload={identity:id,proposal:checked.proposal,observation:checked.observation,result:checked.result,originalHash:journal.operations.grantInitial.hash};
   journal.expiredGrantRenewal={payload,fingerprint:fingerprint(payload)};save();
  }
  const saved=journal.expiredGrantRenewal,payload=saved.payload;
  state.check(saved.fingerprint===fingerprint(payload)&&JSON.stringify(payload.identity)===JSON.stringify(id)&&payload.originalHash===journal.operations.grantInitial.hash,'Saved renewal plan integrity mismatch.');
  const op=journal.operations[key],known=op&&(await base.getTransactionReceipt(op.hash)||await base.getTransaction(op.hash));
  if(!known){
   state.check(clock()>=BigInt(payload.observation.observedAt)&&clock()-BigInt(payload.observation.observedAt)<=120n&&BigInt(payload.result.validUntil)>clock()+15n,'Saved renewal plan is stale; no automatic replacement.');
   const checked=await inspect({base,lasna,directoryRoot,clock});
   state.check(JSON.stringify(checked.proposal)===JSON.stringify(payload.proposal),'Renewal proposal changed.');
  }
  const request=await gate.setGrant.populateTransaction(payload.proposal.merchant,payload.proposal.credits,payload.result.validUntil,payload.result.fundingObservation);
  const receipt=await state.run({journal,key,signer,request,save});
  return {readOnly:false,operation:key,transactionHash:receipt.hash,identity:id,admissionOpen:await gate.open(),grant:plain(await gate.grants(payload.proposal.merchant)),note:'One renewal intent only; reruns recover this same hash. No funding, new deployment, admission opening, quote or payment. Original grant/open records retained. Grant expiry does not terminate a quote already accepted.'};
 });
}
async function main(){const mode=process.argv[2];state.check(['plan','renew'].includes(mode),'Use plan or renew.');const base=rpc(process.env.BASE_SEPOLIA_RPC||'https://sepolia.base.org'),lasna=rpc(process.env.LASNA_RPC||'https://lasna-rpc.rnk.dev');try{if(mode==='plan'){const p=await inspect({base,lasna});console.log(JSON.stringify({readOnly:true,identity:p.id,proposal:p.proposal,result:p.result},null,2));}else console.log(JSON.stringify(await renew({base,lasna}),null,2));}finally{base.destroy();lasna.destroy();}}
if(require.main===module)main().catch(e=>{console.error(e.v4Expected||e.admissionBudget||e.m2Expected?e.message:'V4 renewal stopped. Preserve the journal; inspect status.');process.exitCode=1;});
module.exports={inspect,renew,validateUnused};
