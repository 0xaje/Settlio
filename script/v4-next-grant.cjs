// One explicit credit for quote 2 after the sole previous quote is terminal on both chains.
const path=require('node:path');
const {Wallet,Contract,getAddress,keccak256,toUtf8Bytes}=require('ethers');
const state=require('./v4-state.cjs'),deployment=require('./v4-deploy.cjs'),budget=require('./admission-budget.cjs'),compile=require('./compile-admission.cjs');
const {rpc,USDC}=require('./m2-network.cjs');
const root=path.join(__dirname,'..'),plain=v=>JSON.parse(JSON.stringify(v,(_,x)=>typeof x==='bigint'?x.toString():x)),same=(a,b)=>getAddress(a)===getAddress(b);
const fingerprint=v=>keccak256(toUtf8Bytes(JSON.stringify(v)));
let built;const artifacts=()=>built??=Object.fromEntries(['SettlioAdmission','SettlioEscrowV4','SettlioReactiveV4'].map(n=>[n,compile(n).abi]));
function remainingModel(o,closed,proposal,now){
 state.check(o.open===true&&o.admitted===1n&&o.quoteCount===1n&&o.active===0n&&o.reserved===0n&&o.activeJobs===0n&&o.cronActive===false&&o.paused===false,'Next credit requires exactly one completed quote and empty, open, idle capacity.');
 state.check(closed.destinationClosed===true&&closed.sourceClosed===true&&[5n,6n,7n].includes(closed.status)&&closed.grantRemaining===0n,'Previous quote or consumed grant is not fully closed.');
 state.check(o.maxLifetime>o.admitted,'Lifetime quote allowance exhausted; it never regenerates.');
 const remaining=o.maxLifetime-o.admitted;
 const result=budget.calculate({...o,open:false,admitted:0n,quoteCount:0n,maxLifetime:remaining,maxActive:o.maxActive<remaining?o.maxActive:remaining},proposal,now,3600n);
 return {...result,scope:'conditional remaining finite V4 sponsorship budget after quote 1 closure',completedLifetimeQuotes:'1',remainingLifetimeQuotes:remaining.toString(),fundingObservation:fingerprint(plain({identity:o.identity,observation:o,closed,proposal,modelReference:result.fundingObservation})),limits:['Read-only remaining-lifetime model; one reviewed quote-2 credit, no grant or funding sent.',result.limits[1],result.limits[2],'Source balance and customer principal excluded. Arbitrary incremental grants are not supported.','Requires the sole previous quote closed on both chains, consumed grant, idle capacity and fresh sufficient reserves. Lifetime consumption never resets.']};
}
async function inspect({base,lasna,directoryRoot=root,clock=()=>BigInt(Math.floor(Date.now()/1000))}){
 const journal=state.read(directoryRoot),verification=await deployment.verify({journal,base,lasna}),id=deployment.publicIdentity(journal),a=artifacts();
 state.check(verification.nativeCustody.balance===0n&&verification.nativeCustody.liability===0n&&verification.usdcCustody.balance===0n&&verification.usdcCustody.liability===0n,'Previous single-quote custody is not empty.');
 const gate=new Contract(id.admission,a.SettlioAdmission,base),escrow=new Contract(id.escrow,a.SettlioEscrowV4,base),reactive=new Contract(id.reactive,a.SettlioReactiveV4,lasna);
 const prior=journal.operatorWindowGrant,op=journal.operations.grantOperatorWindow;
 state.check(prior&&prior.fingerprint===fingerprint(prior.payload)&&op?.status==='confirmed','Confirmed one-hour grant history required.');
 const p=prior.payload,merchant=p.proposal.merchant;state.check(same(merchant,journal.deployer)&&p.proposal.credits==='1','Previous merchant/credit scope mismatch.');
 const [tx,receipt]=await Promise.all([base.getTransaction(op.hash),base.getTransactionReceipt(op.hash)]);
 state.check(tx&&receipt?.status===1&&same(tx.from,journal.deployer)&&same(tx.to,id.admission)&&tx.chainId===84532n&&tx.value===0n&&tx.data===gate.interface.encodeFunctionData('setGrant',[merchant,1,p.result.validUntil,p.result.fundingObservation]),'Previous one-hour grant receipt mismatch.');
 const observation=await budget.observe(base,lasna,id,clock);
 const [grant,destinationJob,sourceJob,quote,nativeLiability,usdcLiability]=await Promise.all([gate.grants(merchant,{blockTag:observation.baseBlock}),gate.jobs(1,{blockTag:observation.baseBlock}),reactive.jobs(1,{blockTag:observation.lasnaBlock}),escrow.getQuote(1,{blockTag:observation.baseBlock}),escrow.totalLiability({blockTag:observation.baseBlock}),escrow.liability(USDC,{blockTag:observation.baseBlock})]);
 state.check(grant.validUntil===BigInt(p.result.validUntil)&&grant.fundingObservation===p.result.fundingObservation&&same(quote.merchant,merchant)&&nativeLiability===0n&&usdcLiability===0n,'Previous grant, merchant or liability changed.');
 const closed={destinationClosed:destinationJob.admitted&&destinationJob.closed,sourceClosed:sourceJob.closed,status:quote.status,grantRemaining:grant.remaining};
 const proposal={merchant,credits:'1',validSeconds:'3600'},result=remainingModel(observation,closed,proposal,clock());
 return {journal,id,proposal,result,observation:plain(observation),closed:plain(closed),previousGrantHash:op.hash};
}
async function grant({base,lasna,env=process.env,directoryRoot=root,clock=()=>BigInt(Math.floor(Date.now()/1000))}){
 state.check(env.DEPLOYER_PRIVATE_KEY,'Supply sponsor key only through the hidden local prompt.');const signer=new Wallet(env.DEPLOYER_PRIVATE_KEY,base);
 return state.locked(directoryRoot,async paths=>{
  const journal=state.read(directoryRoot);state.check(same(signer.address,journal.deployer),'Next-grant signer differs from sponsor.');await deployment.verify({journal,base,lasna});
  const id=deployment.publicIdentity(journal),gate=new Contract(id.admission,artifacts().SettlioAdmission,signer),key='grantNextQuote',save=()=>state.save(paths.journal,journal);
  if(!journal.nextQuoteGrant){state.check(!journal.operations[key],'Saved next-grant intent lacks plan.');const checked=await inspect({base,lasna,directoryRoot,clock});state.check(checked.result.canGrant,'Remaining-lifetime funding shortfall; no grant sent.');const payload={identity:id,proposal:checked.proposal,result:checked.result,observation:checked.observation,closed:checked.closed,previousGrantHash:checked.previousGrantHash};journal.nextQuoteGrant={payload,fingerprint:fingerprint(payload)};save();}
  const saved=journal.nextQuoteGrant,p=saved.payload;
  state.check(saved.fingerprint===fingerprint(p)&&JSON.stringify(p.identity)===JSON.stringify(id)&&p.previousGrantHash===journal.operations.grantOperatorWindow.hash,'Saved next-grant plan integrity mismatch.');
  const op=journal.operations[key],known=op&&(await base.getTransactionReceipt(op.hash)||await base.getTransaction(op.hash));
  if(!known){state.check(clock()>=BigInt(p.observation.observedAt)&&clock()-BigInt(p.observation.observedAt)<=120n&&BigInt(p.result.validUntil)>clock()+15n,'Saved next-grant plan is stale; no automatic replacement.');const checked=await inspect({base,lasna,directoryRoot,clock});state.check(checked.result.canGrant&&JSON.stringify(checked.proposal)===JSON.stringify(p.proposal),'Remaining funding or grant proposal changed; no broadcast.');}
  const request=await gate.setGrant.populateTransaction(p.proposal.merchant,p.proposal.credits,p.result.validUntil,p.result.fundingObservation),receipt=await state.run({journal,key,signer,request,save});
  return {readOnly:false,operation:key,transactionHash:receipt.hash,identity:id,admissionOpen:await gate.open(),grant:plain(await gate.grants(p.proposal.merchant)),note:'One saved quote-2 credit. Reruns recover the same hash. No funding, deployment, payment or automatic future grants; lifetime consumption does not reset.'};
 });
}
async function main(){const mode=process.argv[2];state.check(['plan','grant'].includes(mode),'Use plan or grant.');const base=rpc(process.env.BASE_SEPOLIA_RPC||'https://sepolia.base.org'),lasna=rpc(process.env.LASNA_RPC||'https://lasna-rpc.rnk.dev');try{let r=mode==='plan'?await inspect({base,lasna}):await grant({base,lasna});if(mode==='plan'){delete r.journal;r.readOnly=true;}console.log(JSON.stringify(r,null,2));}finally{base.destroy();lasna.destroy();}}
if(require.main===module)main().catch(e=>{console.error(e.v4Expected||e.admissionBudget||e.m2Expected?e.message:'V4 next grant stopped. Preserve journal and inspect status.');process.exitCode=1;});
module.exports={remainingModel,inspect,grant};
