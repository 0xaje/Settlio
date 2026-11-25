// Fixed deployed V4 identity; read-only public evidence collection/replay, no signing.
const fs=require('node:fs'),path=require('node:path');
const {Interface,AbiCoder,getAddress}=require('ethers');
const core=require('./verify-release.cjs');
const {rpc,USDC,SYSTEM,PROXY}=require('./m2-network.cjs');
const IDENTITY={escrow:'0x5675C610d6f0aCe9f7933f3584D53dc4F567Dc6B',reactive:'0xFa1F509E21040bB4fE266B79E9583073914dFe6e',receiver:'0x49ff0a4Bfa918b0576315C31a0bcE561eEBf3Df0'};
const GATE='0x935Ef09F57B68D08fd9Fd315755b7Daf49871486';
const I=new Interface(['function POLICY_VERSION() view returns(uint256)','function admission() view returns(address)','function quoteCount() view returns(uint256)','function active() view returns(uint256)','function reserved() view returns(uint256)','function admitted() view returns(uint256)','function jobs(uint256) view returns(bool admitted,bool closed,uint32 retries,uint64 retryAfter)','function schedulerPaused() view returns(bool)','function debt(address) view returns(uint256)','function reserves(address) view returns(uint256)','function balanceOf(address) view returns(uint256)','event Admitted(uint256 indexed quoteId,address indexed merchant,uint64 cutoff,bytes32 fundingObservation)','event Closed(uint256 indexed quoteId)']);
const A=AbiCoder.defaultAbiCoder(),E=new Interface(require('../apps/web/src/escrow-abi.json'));
function check(ok,message){if(!ok){const e=Error(message);e.releaseVerification=true;throw e;}}
const same=(a,b)=>getAddress(a)===getAddress(b);
function admissionEvent(receipt,name,id){const matches=receipt.logs.filter(l=>same(l.address,GATE)&&!l.removed&&l.transactionHash.toLowerCase()===receipt.transactionHash.toLowerCase()&&l.blockHash.toLowerCase()===receipt.blockHash.toLowerCase()&&BigInt(l.blockNumber)===BigInt(receipt.blockNumber)).flatMap(l=>{try{const p=I.parseLog(l);return p?.name===name&&p.args.quoteId===id?[p]:[];}catch{return [];}});check(matches.length===1,'Missing/ambiguous V4 admission '+name);return matches[0].args;}
const T=new Interface(['event Approval(address indexed owner,address indexed spender,uint256 value)','event Transfer(address indexed from,address indexed to,uint256 value)','function allowance(address,address) view returns(uint256)']);
function validateApprovals(b,q){
 check(b.extraApproval&&b.approval,'Both approval receipts required.');
 check(b.extraApproval.receipt.transactionHash.toLowerCase()!==b.approval.receipt.transactionHash.toLowerCase()&&BigInt(b.extraApproval.receipt.blockNumber)<BigInt(b.approval.receipt.blockNumber)&&BigInt(b.approval.receipt.blockNumber)<BigInt(b.deposit.receipt.blockNumber),'Approval history order mismatch.');
 for(const name of ['extraApproval','approval']){
  const {receipt:r,transaction:t}=b[name],block=b.blocks[name];
  check(r&&t&&BigInt(r.status)===1n&&BigInt(t.chainId)===84532n&&t.hash.toLowerCase()===r.transactionHash.toLowerCase()&&t.blockHash.toLowerCase()===r.blockHash.toLowerCase()&&BigInt(t.blockNumber)===BigInt(r.blockNumber)&&block.hash.toLowerCase()===r.blockHash.toLowerCase()&&BigInt(block.number)===BigInt(r.blockNumber),'Approval receipt/block mismatch.');
  const events=r.logs.filter(l=>same(l.address,USDC)).map(l=>{check(!l.removed&&l.transactionHash.toLowerCase()===r.transactionHash.toLowerCase()&&l.blockHash.toLowerCase()===r.blockHash.toLowerCase()&&BigInt(l.blockNumber)===BigInt(r.blockNumber),'Approval log binding mismatch.');try{return T.parseLog(l);}catch{return null;}});
  const approvals=events.filter(e=>e?.name==='Approval');check(approvals.length===1&&same(approvals[0].args.owner,q.customer)&&same(approvals[0].args.spender,IDENTITY.escrow)&&approvals[0].args.value===q.deposit,'Approval owner/spender/amount mismatch.');
  check(!events.some(e=>e?.name==='Transfer'),'Approval receipt unexpectedly includes a USDC transfer.');
 }
 check(BigInt(b.v4.allowanceAfterFirst)===q.deposit&&BigInt(b.v4.allowanceAfterSecond)===q.deposit&&BigInt(b.v4.allowanceCurrent)===0n,'Repeated approval increased allowance or deposit did not consume it.');
}
function validate(bundle,quoteId='1'){
 check(['1','2'].includes(String(quoteId)),'Unsupported V4 release evidence quote.');const id=BigInt(quoteId);
 const result=core.validate(bundle,IDENTITY),s=bundle.v4;
 check(result.quoteId===id.toString()&&s,'Wrong or missing V4 quote observation.');
 const q=E.decodeFunctionResult('getQuote',bundle.state.quote)[0],admitted=admissionEvent(bundle.creation.receipt,'Admitted',id);
 check(same(admitted.merchant,q.merchant)&&admitted.cutoff===q.refundCutoff&&BigInt(admitted.fundingObservation)!==0n,'Admission terms/reference mismatch.');admissionEvent(bundle.release.receipt,'Closed',id);
 for(const k of ['escrowVersion','reactiveVersion'])check(A.decode(['uint256'],s[k])[0]===4n,'V4 version mismatch.');
 check(same(A.decode(['address'],s.admission)[0],GATE),'Wrong admission gate.');
 const job=I.decodeFunctionResult('jobs',s.job);check(job.admitted&&job.closed,'V4 quote admission slot not closed.');
 check(A.decode(['uint256'],s.active)[0]===0n&&A.decode(['uint256'],s.reserved)[0]===0n&&A.decode(['uint256'],s.admitted)[0]===id&&A.decode(['uint256'],s.quoteCount)[0]===id,'V4 single-quote counters mismatch.');
 check(BigInt(bundle.state.count)===0n&&!A.decode(['bool'],bundle.state.cron)[0]&&!A.decode(['bool'],s.paused)[0],'Scheduler did not return to idle.');
 check(BigInt(bundle.state.currentNativeBalance)===0n&&BigInt(bundle.state.nativeLiability)===0n&&BigInt(bundle.state.liability)===0n&&BigInt(s.usdcBalance)===0n&&BigInt(s.usdcLiability)===0n,'Single-quote custody/liabilities not cleared.');
 check(result.asset===(id===1n?'ETH':'USDC'),'Wrong asset for this V4 evidence quote.');
 if(id===2n)validateApprovals(bundle,q);
 return {...result,policyVersion:4,identity:IDENTITY,admission:GATE,admissionSlotClosed:true,schedulerIdle:true,scope:`V4 quote ${id} admitted ${result.asset} deposit, Reactive confirmation and CRON automatic release`};
}
async function collect(base,lasna,seed,quoteId='1'){
 check(['1','2'].includes(String(quoteId)),'Unsupported V4 release evidence quote.');const id=BigInt(quoteId);
 const bundle=await core.collect(base,lasna,seed,IDENTITY),b=bundle.observationBlocks.base,r=bundle.observationBlocks.lasna;
 const call=(provider,to,name,args=[],block=b)=>provider.send('eth_call',[{to,data:I.encodeFunctionData(name,args)},block]);
 const liability=new Interface(['function liability(address) view returns(uint256)']);
 const reads={escrowVersion:()=>call(base,IDENTITY.escrow,'POLICY_VERSION'),reactiveVersion:()=>call(lasna,IDENTITY.reactive,'POLICY_VERSION',[],r),admission:()=>call(base,IDENTITY.escrow,'admission'),job:()=>call(base,GATE,'jobs',[id]),active:()=>call(base,GATE,'active'),reserved:()=>call(base,GATE,'reserved'),admitted:()=>call(base,GATE,'admitted'),quoteCount:()=>call(base,IDENTITY.escrow,'quoteCount'),paused:()=>call(lasna,IDENTITY.reactive,'schedulerPaused',[],r),usdcBalance:()=>call(base,USDC,'balanceOf',[IDENTITY.escrow]),usdcLiability:()=>base.send('eth_call',[{to:IDENTITY.escrow,data:liability.encodeFunctionData('liability',[USDC])},b]),reactiveDebt:()=>call(lasna,SYSTEM,'debt',[IDENTITY.reactive],r),reactiveReserves:()=>call(lasna,SYSTEM,'reserves',[IDENTITY.reactive],r),callbackDebt:()=>call(base,PROXY,'debt',[IDENTITY.receiver]),callbackReserves:()=>call(base,PROXY,'reserves',[IDENTITY.receiver])};
 bundle.v4=Object.fromEntries(await Promise.all(Object.entries(reads).map(async([name,read])=>[name,await read()])));
 if(id===2n){
  check(seed.extraApproval?.receipt?.transactionHash,'First approval hash required for duplicate-approval evidence.');
  const h=seed.extraApproval.receipt.transactionHash;
  const [receipt,transaction]=await Promise.all([base.send('eth_getTransactionReceipt',[h]),base.send('eth_getTransactionByHash',[h])]);check(receipt&&transaction,'First approval unavailable.');bundle.extraApproval={receipt,transaction};
  const customer=E.decodeFunctionResult('getQuote',bundle.state.quote)[0].customer;
  for(const [key,block] of [['allowanceAfterFirst',receipt.blockNumber],['allowanceAfterSecond',bundle.approval.receipt.blockNumber],['allowanceCurrent',b]])bundle.v4[key]=await base.send('eth_call',[{to:USDC,data:T.encodeFunctionData('allowance',[customer,IDENTITY.escrow])},block]);
  bundle.blocks.extraApproval=await base.send('eth_getBlockByNumber',[receipt.blockNumber,false]);bundle.blocks.approval=await base.send('eth_getBlockByNumber',[bundle.approval.receipt.blockNumber,false]);
 }
 return bundle;
}
async function main(){const [arg,flag]=process.argv.slice(2),quoteId=arg&&arg!=='--recorded'?arg:'1',mode=arg==='--recorded'?arg:flag;check(['1','2'].includes(quoteId)&&(!mode||mode==='--recorded'),'Usage: npm run verify:release:v4 -- [1|2] [--recorded]');const file=path.join(__dirname,'../deployments/evidence/v4/quote-'+quoteId+'-release-verified.json'),saved=JSON.parse(fs.readFileSync(file,'utf8'));
 if(mode==='--recorded'){console.log(JSON.stringify({...validate(saved.bundle,quoteId),mode:'recorded public evidence replay; no fresh RPC',sourceObservedAt:saved.bundle.observedAt},null,2));return;}
 const base=rpc(process.env.BASE_SEPOLIA_RPC||'https://sepolia.base.org'),lasna=rpc(process.env.LASNA_RPC||'https://lasna-rpc.rnk.dev');try{const bundle=await collect(base,lasna,saved.bundle,quoteId),result=validate(bundle,quoteId);core.writeVerified(file,{result,bundle});console.log(JSON.stringify(result,null,2));}finally{base.destroy();lasna.destroy();}}

if(require.main===module)main().catch(e=>{console.error(e.releaseVerification?e.message:'V4 release verification stopped; no successful snapshot written or transaction sent.');process.exitCode=1;});
module.exports={IDENTITY,GATE,collect,validate};
