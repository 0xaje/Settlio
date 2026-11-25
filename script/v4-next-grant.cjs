// Separate saved credits for quote 2 and the quote-3 refund check; no rolling grants.
const path=require('node:path');
const {Wallet,Contract,getAddress,keccak256,toUtf8Bytes}=require('ethers');
const state=require('./v4-state.cjs'),deployment=require('./v4-deploy.cjs'),budget=require('./admission-budget.cjs'),compile=require('./compile-admission.cjs');
const {rpc,USDC}=require('./m2-network.cjs');
const root=path.join(__dirname,'..'),plain=v=>JSON.parse(JSON.stringify(v,(_,x)=>typeof x==='bigint'?x.toString():x)),same=(a,b)=>getAddress(a)===getAddress(b);
const fingerprint=v=>keccak256(toUtf8Bytes(JSON.stringify(v)));
let built;const artifacts=()=>built??=Object.fromEntries(['SettlioAdmission','SettlioEscrowV4','SettlioReactiveV4'].map(n=>[n,compile(n).abi]));
function scope(completed){
 state.check(completed===1n||completed===2n,'Only reviewed quote-2 and quote-3 credit stages are supported.');
 return completed===1n?{prior:'operatorWindowGrant',priorKey:'grantOperatorWindow',plan:'nextQuoteGrant',key:'grantNextQuote'}:{prior:'nextQuoteGrant',priorKey:'grantNextQuote',plan:'refundQuoteGrant',key:'grantRefundQuote'};
}
function remainingModel(o,closed,proposal,now,completed=1n){
 scope(completed);
 state.check(o.open===true&&o.admitted===completed&&o.quoteCount===completed&&o.active===0n&&o.reserved===0n&&o.activeJobs===0n&&o.cronActive===false&&o.paused===false,`Next credit requires exactly ${completed===1n?'one':'two'} completed quotes and empty, open, idle capacity.`);
 state.check(closed.destinationClosed===true&&closed.sourceClosed===true&&[5n,6n,7n].includes(closed.status)&&closed.grantRemaining===0n,'Previous quote or consumed grant is not fully closed.');
 if(completed===2n)state.check(closed.earlier?.length===1&&closed.earlier[0].quoteId==='1'&&closed.earlier[0].destinationClosed===true&&closed.earlier[0].sourceClosed===true&&[5n,6n,7n].includes(closed.earlier[0].status),'Earlier quote closure proof required.');
 state.check(o.maxLifetime>o.admitted,'Lifetime quote allowance exhausted; it never regenerates.');
 const remaining=o.maxLifetime-o.admitted;
 const result=budget.calculate({...o,open:false,admitted:0n,quoteCount:0n,maxLifetime:remaining,maxActive:o.maxActive<remaining?o.maxActive:remaining},proposal,now,3600n);
 return {...result,scope:`conditional remaining finite V4 sponsorship budget after quote ${completed} closure`,completedLifetimeQuotes:completed.toString(),remainingLifetimeQuotes:remaining.toString(),fundingObservation:fingerprint(plain({identity:o.identity,observation:o,closed,proposal,modelReference:result.fundingObservation})),limits:[`Read-only remaining-lifetime model; one reviewed quote-${completed+1n} credit, no grant or funding sent.`,result.limits[1],result.limits[2],'Source balance and customer principal excluded. Arbitrary incremental grants are not supported.','Requires all previous quotes closed on both chains, consumed grant, idle capacity and fresh sufficient reserves. Lifetime consumption never resets.']};
}
async function inspect({base,lasna,directoryRoot=root,clock=()=>BigInt(Math.floor(Date.now()/1000)),completed=1n}){
 const stage=scope(completed);
 const journal=state.read(directoryRoot),verification=await deployment.verify({journal,base,lasna}),id=deployment.publicIdentity(journal),a=artifacts();
 state.check(verification.nativeCustody.balance===0n&&verification.nativeCustody.liability===0n&&verification.usdcCustody.balance===0n&&verification.usdcCustody.liability===0n,'Previous single-quote custody is not empty.');
 const gate=new Contract(id.admission,a.SettlioAdmission,base),escrow=new Contract(id.escrow,a.SettlioEscrowV4,base),reactive=new Contract(id.reactive,a.SettlioReactiveV4,lasna);
 const prior=journal[stage.prior],op=journal.operations[stage.priorKey];
 state.check(prior&&prior.fingerprint===fingerprint(prior.payload)&&op?.status==='confirmed','Confirmed previous one-hour grant history required.');
 const p=prior.payload,merchant=p.proposal.merchant;state.check(same(merchant,journal.deployer)&&p.proposal.credits==='1','Previous merchant/credit scope mismatch.');
 const [tx,receipt]=await Promise.all([base.getTransaction(op.hash),base.getTransactionReceipt(op.hash)]);
 state.check(tx&&receipt?.status===1&&same(tx.from,journal.deployer)&&same(tx.to,id.admission)&&tx.chainId===84532n&&tx.value===0n&&tx.data===gate.interface.encodeFunctionData('setGrant',[merchant,1,p.result.validUntil,p.result.fundingObservation]),'Previous one-hour grant receipt mismatch.');
 const observation=await budget.observe(base,lasna,id,clock);
 const [grant,destinationJob,sourceJob,quote,nativeLiability,usdcLiability]=await Promise.all([gate.grants(merchant,{blockTag:observation.baseBlock}),gate.jobs(completed,{blockTag:observation.baseBlock}),reactive.jobs(completed,{blockTag:observation.lasnaBlock}),escrow.getQuote(completed,{blockTag:observation.baseBlock}),escrow.totalLiability({blockTag:observation.baseBlock}),escrow.liability(USDC,{blockTag:observation.baseBlock})]);
 state.check(grant.validUntil===BigInt(p.result.validUntil)&&grant.fundingObservation===p.result.fundingObservation&&same(quote.merchant,merchant)&&nativeLiability===0n&&usdcLiability===0n,'Previous grant, merchant or liability changed.');
 const earlier=[];
 for(let quoteId=1n;quoteId<completed;quoteId++){
  const [d,s,q]=await Promise.all([gate.jobs(quoteId,{blockTag:observation.baseBlock}),reactive.jobs(quoteId,{blockTag:observation.lasnaBlock}),escrow.getQuote(quoteId,{blockTag:observation.baseBlock})]);
  state.check(d.admitted&&d.closed&&s.closed&&[5n,6n,7n].includes(q.status)&&same(q.merchant,merchant),'An earlier quote is not fully closed on both chains.');
  earlier.push({quoteId:quoteId.toString(),destinationClosed:true,sourceClosed:true,status:q.status});
 }
 const closed={destinationClosed:destinationJob.admitted&&destinationJob.closed,sourceClosed:sourceJob.closed,status:quote.status,grantRemaining:grant.remaining,...(completed===2n?{earlier}: {})};
 const proposal={merchant,credits:'1',validSeconds:'3600'},result=remainingModel(observation,closed,proposal,clock(),completed);
 return {journal,id,proposal,result,observation:plain(observation),closed:plain(closed),previousGrantHash:op.hash};
}
async function grant({base,lasna,env=process.env,directoryRoot=root,clock=()=>BigInt(Math.floor(Date.now()/1000)),completed=1n}){
 const stage=scope(completed);
 state.check(env.DEPLOYER_PRIVATE_KEY,'Supply sponsor key only through the hidden local prompt.');const signer=new Wallet(env.DEPLOYER_PRIVATE_KEY,base);
 return state.locked(directoryRoot,async paths=>{
  const journal=state.read(directoryRoot);state.check(same(signer.address,journal.deployer),'Next-grant signer differs from sponsor.');await deployment.verify({journal,base,lasna});
  const id=deployment.publicIdentity(journal),gate=new Contract(id.admission,artifacts().SettlioAdmission,signer),key=stage.key,save=()=>state.save(paths.journal,journal);
  if(!journal[stage.plan]){state.check(!journal.operations[key],'Saved next-grant intent lacks plan.');const checked=await inspect({base,lasna,directoryRoot,clock,completed});state.check(checked.result.canGrant,'Remaining-lifetime funding shortfall; no grant sent.');const payload={identity:id,proposal:checked.proposal,result:checked.result,observation:checked.observation,closed:checked.closed,previousGrantHash:checked.previousGrantHash};journal[stage.plan]={payload,fingerprint:fingerprint(payload)};save();}
  const saved=journal[stage.plan],p=saved.payload;
  state.check(saved.fingerprint===fingerprint(p)&&JSON.stringify(p.identity)===JSON.stringify(id)&&p.previousGrantHash===journal.operations[stage.priorKey]?.hash,'Saved next-grant plan integrity mismatch.');
  const op=journal.operations[key],known=op&&(await base.getTransactionReceipt(op.hash)||await base.getTransaction(op.hash));
  if(!known){state.check(clock()>=BigInt(p.observation.observedAt)&&clock()-BigInt(p.observation.observedAt)<=120n&&BigInt(p.result.validUntil)>clock()+15n,'Saved next-grant plan is stale; no automatic replacement.');const checked=await inspect({base,lasna,directoryRoot,clock,completed});state.check(checked.result.canGrant&&JSON.stringify(checked.proposal)===JSON.stringify(p.proposal),'Remaining funding or grant proposal changed; no broadcast.');}
  const request=await gate.setGrant.populateTransaction(p.proposal.merchant,p.proposal.credits,p.result.validUntil,p.result.fundingObservation),receipt=await state.run({journal,key,signer,request,save});
  return {readOnly:false,operation:key,transactionHash:receipt.hash,identity:id,admissionOpen:await gate.open(),grant:plain(await gate.grants(p.proposal.merchant)),note:`One saved quote-${completed+1n} credit. Reruns recover the same hash. No funding, deployment, payment or automatic future grants; lifetime consumption does not reset.`};
 });
}
async function main(){const mode=process.argv[2];state.check(['plan','grant','plan-refund','grant-refund'].includes(mode),'Use plan or grant.');const base=rpc(process.env.BASE_SEPOLIA_RPC||'https://sepolia.base.org'),lasna=rpc(process.env.LASNA_RPC||'https://lasna-rpc.rnk.dev');try{const completed=mode.endsWith('-refund')?2n:1n,isPlan=mode.startsWith('plan');let r=isPlan?await inspect({base,lasna,completed}):await grant({base,lasna,completed});if(isPlan){delete r.journal;r.readOnly=true;}console.log(JSON.stringify(r,null,2));}finally{base.destroy();lasna.destroy();}}
if(require.main===module)main().catch(e=>{console.error(e.v4Expected||e.admissionBudget||e.m2Expected?e.message:'V4 next grant stopped. Preserve journal and inspect status.');process.exitCode=1;});
module.exports={remainingModel,inspect,grant};
