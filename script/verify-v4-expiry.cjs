// Fixed V4 quote-5 public proof; no fabricated legacy journal or transaction sending.
const fs=require('node:fs'),path=require('node:path');
const {Interface,AbiCoder,getAddress,keccak256}=require('ethers');
const core=require('./verify-expiry.cjs'),{IDENTITY,GATE}=require('./verify-v4-release.cjs'),{rpc,USDC,PROXY}=require('./m2-network.cjs');
const E=new Interface(require('../apps/web/src/escrow-abi.json')),A=AbiCoder.defaultAbiCoder();
const I=new Interface(['function POLICY_VERSION() view returns(uint256)','function admission() view returns(address)','function quoteCount() view returns(uint256)','function active() view returns(uint256)','function reserved() view returns(uint256)','function admitted() view returns(uint256)','function jobs(uint256) view returns(bool admitted,bool closed,uint32 retries,uint64 retryAfter)','function schedulerPaused() view returns(bool)','function activeJobCount() view returns(uint256)','function cronSubscribed() view returns(bool)','function processed(bytes32) view returns(bool)','function balanceOf(address) view returns(uint256)','function totalLiability() view returns(uint256)','function liability(address) view returns(uint256)','function callbackReceiver() view returns(address)','function escrow() view returns(address)','function _SERVICE_PROVIDER() view returns(address)','function _CALLBACK_SENDER() view returns(address)','function setGrant(address,uint32,uint64,bytes32)','event Admitted(uint256 indexed quoteId,address indexed merchant,uint64 cutoff,bytes32 fundingObservation)','event Closed(uint256 indexed quoteId)']);
const J=new Interface(['function jobs(uint256) view returns(uint64 expiresAt,uint64 refundCutoff,uint64 nextAt,uint8 attempts,bool automaticRelease,bool registered,bool confirmed,bool cancelled,bool closed,bool needsAttention,bool retryRequested)']);
const same=(a,b)=>getAddress(a)===getAddress(b),u=v=>A.decode(['uint256'],v)[0],bool=v=>A.decode(['bool'],v)[0];
function check(ok,message){if(!ok){const e=Error(message);e.expiryVerification=true;throw e;}}
function observedProvider(provider,network){return {send:async(method,params)=>{
 try{return await provider.send(method,params);}catch(error){
  if(error.expiryVerification)throw error;
  const code=typeof error.code==='string'&&/^[A-Z0-9_]{1,40}$/.test(error.code)?error.code:'unknown';
  const rpcCode=error.info?.error?.code;
  check(false,network+' '+method+' read failed ('+code+(Number.isSafeInteger(rpcCode)?', RPC '+rpcCode:'')+'). No successful snapshot written.');
 }
}};}
async function readHistory(provider,filter,fromBlock,toBlock){
 const start=BigInt(fromBlock),end=BigInt(toBlock),size=1000n;
 check(start>=0n&&end>=start,'Invalid history block range.');
 const pages=Number((end-start)/size+1n);check(pages<=1000,'History exceeds the bounded 1,000-page scan. Preserve the archived proof.');
 const logs=[],seen=new Set();
 for(let offset=0;offset<pages;offset+=4){
  const batch=await Promise.all(Array.from({length:Math.min(4,pages-offset)},async(_,i)=>{
   const first=start+BigInt(offset+i)*size,last=first+size-1n>end?end:first+size-1n;
   const rows=await provider.send('eth_getLogs',[{...filter,fromBlock:'0x'+first.toString(16),toBlock:'0x'+last.toString(16)}]);
   check(Array.isArray(rows),'History page did not return an array.');
   for(const row of rows)check(BigInt(row.blockNumber)>=first&&BigInt(row.blockNumber)<=last,'History log outside its requested page.');
   return rows;
  }));
  for(const rows of batch)for(const row of rows){const key=row.transactionHash.toLowerCase()+':'+BigInt(row.logIndex);check(!seen.has(key),'Duplicate history log.');seen.add(key);logs.push(row);}
 }
 return logs;
}
function gateEvent(r,name){const found=r.logs.filter(l=>same(l.address,GATE)&&!l.removed&&l.transactionHash.toLowerCase()===r.transactionHash.toLowerCase()&&l.blockHash.toLowerCase()===r.blockHash.toLowerCase()&&BigInt(l.blockNumber)===BigInt(r.blockNumber)).flatMap(l=>{try{const p=I.parseLog(l);return p?.name===name&&p.args.quoteId===5n?[p.args]:[];}catch{return [];}});check(found.length===1,'Missing/ambiguous admission '+name);return found[0];}
function validate(b){
 const result=core.validateBundle(b,{...IDENTITY,policyVersion:4}),s=b.v4,q=E.decodeFunctionResult('getQuote',s.quote)[0];
 check(result.quoteId==='5'&&q.status===6n&&q.total===300000000000000n&&q.deposit===100000000000000n,'Wrong V4 expiry quote/terms.');
 for(const key of ['merchant','customer','termsHash','expiresAt','refundCutoff','status'])check(String(q[key]).toLowerCase()===String(b.quote[key]).toLowerCase(),'Quote observation mismatch.');
 check(u(s.escrowVersion)===4n&&u(s.reactiveVersion)===4n&&same(A.decode(['address'],s.admission)[0],GATE),'Wrong V4 versions/admission.');
 const admitted=gateEvent(b.creation,'Admitted');gateEvent(b.callback,'Closed');
 check(same(admitted.merchant,q.merchant)&&admitted.cutoff===q.refundCutoff&&BigInt(admitted.fundingObservation)!==0n,'Admission terms/reference mismatch.');
 const policy=b.creation.logs.flatMap(l=>{try{const p=E.parseLog(l);return same(l.address,IDENTITY.escrow)&&p?.name==='PolicyRegistered'&&p.args.quoteId===5n?[p.args]:[];}catch{return [];}});
 check(policy.length===1&&policy[0].automaticRelease===false,'Unpaid expiry policy mismatch.');
 const job=I.decodeFunctionResult('jobs',s.gateJob),source=J.decodeFunctionResult('jobs',s.sourceJob);
 check(job.admitted&&job.closed&&source.registered&&source.closed&&source.nextAt===0n,'V4 terminal jobs not closed.');
 for(const key of ['active','reserved','nativeBalance','nativeLiability','usdcBalance','usdcLiability','activeJobs'])check(BigInt(s[key])===0n,'Nonempty custody/work: '+key);
 check(u(s.quoteCount)===5n&&u(s.admitted)===5n&&!bool(s.cron)&&!bool(s.paused),'Wrong idle expiry checkpoint.');
 check(Array.isArray(b.history)&&b.history.length>=4,'Quote event history unavailable.');
 const forbidden=new Set(['DepositReceived','AssetSelected','BookingConfirmed','CancellationRequested','PolicyRequested','ConfirmationRequested','Refunded','Released']);
 for(const l of b.history){check(same(l.address,IDENTITY.escrow)&&!l.removed&&BigInt(l.topics[1])===5n&&BigInt(l.blockNumber)>=BigInt(b.creation.blockNumber)&&BigInt(l.blockNumber)<=BigInt(b.observationBlocks.base),'History binding/range mismatch.');const p=E.parseLog(l);check(p&&!forbidden.has(p.name),'Unpaid/unretried expiry history contradicted.');}
 const {receipt:r,transaction:t}=b.grant;
 check(BigInt(r.status)===1n&&BigInt(t.chainId)===84532n&&t.hash.toLowerCase()===r.transactionHash.toLowerCase()&&t.blockHash.toLowerCase()===r.blockHash.toLowerCase()&&BigInt(t.blockNumber)===BigInt(r.blockNumber)&&BigInt(r.blockNumber)<BigInt(b.creation.blockNumber)&&same(t.from,q.merchant)&&same(t.to,GATE)&&BigInt(t.value)===0n,'Grant receipt/route mismatch.');
 const [merchant,credits,until,reference]=I.decodeFunctionData('setGrant',t.input);
 check(same(merchant,q.merchant)&&credits===1n&&reference===admitted.fundingObservation&&until>BigInt(b.creationBlock.timestamp),'Grant scope/reference mismatch.');
 check(b.creationTx.hash.toLowerCase()===b.creation.transactionHash.toLowerCase()&&BigInt(b.creationTx.chainId)===84532n&&b.creationTx.blockHash.toLowerCase()===b.creation.blockHash.toLowerCase()&&BigInt(b.creationTx.blockNumber)===BigInt(b.creation.blockNumber),'Creation transaction binding mismatch.');
 for(const [header,receipt]of [[b.creationBlock,b.creation],[b.reactionBlock,b.reaction],[b.callbackBlock,b.callback]])check(header.hash.toLowerCase()===receipt.blockHash.toLowerCase()&&BigInt(header.number)===BigInt(receipt.blockNumber),'Evidence header binding mismatch.');
 return {...result,policyVersion:4,scope:'V4 quote 5 admitted unpaid quote, authenticated CRON expiry and both-chain closure',identity:IDENTITY,admission:GATE,admissionSlotClosed:true,schedulerIdle:true,noDepositOrParticipantRetryObserved:true,browserClosedEvidence:'Qualified tab closure/reopening reviewed separately; continuous closed interval not established.',limits:[...result.limits,'RPC event history does not prove browser actions; video provenance is recorded separately.']};
}
async function collect(base,lasna,seed,quoteId=5){
 check([5,6].includes(quoteId),'Unsupported V4 expiry collector quote.');
 base=observedProvider(base,'Base Sepolia');lasna=observedProvider(lasna,'Reactive Lasna');
 const b={quoteId:String(quoteId),policyVersion:4,identity:IDENTITY,networks:{base:await base.send('eth_chainId',[]),lasna:await lasna.send('eth_chainId',[])}};
 check(BigInt(b.networks.base)===84532n&&BigInt(b.networks.lasna)===5318007n,'RPC network mismatch.');
 await Promise.all([['creation',base],['cron',lasna],['reaction',lasna],['callback',base]].map(async([key,p])=>{b[key]=await p.send('eth_getTransactionReceipt',[seed[key].transactionHash]);check(b[key],'Receipt unavailable: '+key);}));
 [b.creationTx,b.reactionTx,b.callbackTx,b.observationBlocks]=await Promise.all([base.send('eth_getTransactionByHash',[b.creation.transactionHash]),lasna.send('eth_getTransactionByHash',[b.reaction.transactionHash]),base.send('eth_getTransactionByHash',[b.callback.transactionHash]),Promise.all([base.send('eth_blockNumber',[]),lasna.send('eth_blockNumber',[])]).then(([base,lasna])=>({base,lasna}))]);
 const height=b.observationBlocks.base,rheight=b.observationBlocks.lasna,call=(p,to,iface,name,args=[],block=height)=>p.send('eth_call',[{to,data:iface.encodeFunctionData(name,args)},block]);
 const quote=await call(base,IDENTITY.escrow,E,'getQuote',[quoteId]),q=E.decodeFunctionResult('getQuote',quote)[0];b.quote=Object.fromEntries(['merchant','customer','termsHash','expiresAt','refundCutoff','status'].map(k=>[k,q[k]]));
 const reads={quote:()=>quote,escrowVersion:()=>call(base,IDENTITY.escrow,I,'POLICY_VERSION'),reactiveVersion:()=>call(lasna,IDENTITY.reactive,I,'POLICY_VERSION',[],rheight),admission:()=>call(base,IDENTITY.escrow,I,'admission'),gateJob:()=>call(base,GATE,I,'jobs',[quoteId]),sourceJob:()=>call(lasna,IDENTITY.reactive,J,'jobs',[quoteId],rheight),active:()=>call(base,GATE,I,'active'),reserved:()=>call(base,GATE,I,'reserved'),admitted:()=>call(base,GATE,I,'admitted'),quoteCount:()=>call(base,IDENTITY.escrow,I,'quoteCount'),nativeBalance:()=>base.send('eth_getBalance',[IDENTITY.escrow,height]),nativeLiability:()=>call(base,IDENTITY.escrow,I,'totalLiability'),usdcBalance:()=>call(base,USDC,I,'balanceOf',[IDENTITY.escrow]),usdcLiability:()=>call(base,IDENTITY.escrow,I,'liability',[USDC]),activeJobs:()=>call(lasna,IDENTITY.reactive,I,'activeJobCount',[],rheight),cron:()=>call(lasna,IDENTITY.reactive,I,'cronSubscribed',[],rheight),paused:()=>call(lasna,IDENTITY.reactive,I,'schedulerPaused',[],rheight)};
 b.v4=Object.fromEntries(await Promise.all(Object.entries(reads).map(async([key,read])=>[key,await read()])));
 const source=J.decodeFunctionResult('jobs',b.v4.sourceJob);b.job={registered:source.registered,closed:source.closed};
 const policy=b.creation.logs.find(l=>{try{return same(l.address,IDENTITY.escrow)&&E.parseLog(l)?.name==='PolicyRegistered';}catch{return false;}});check(policy,'Original policy event unavailable.');
 const fingerprint=keccak256(A.encode(['uint256','uint256','uint256','uint256'],[84532,BigInt(b.creation.blockHash),BigInt(b.creation.transactionHash),BigInt(policy.logIndex)]));
 b.originalPolicyProcessed=bool(await call(lasna,IDENTITY.reactive,I,'processed',[fingerprint],rheight));
 const wiring={escrowReceiver:[IDENTITY.escrow,'callbackReceiver'],receiverEscrow:[IDENTITY.receiver,'escrow'],receiverProxy:[IDENTITY.receiver,'_SERVICE_PROVIDER'],receiverSender:[IDENTITY.receiver,'_CALLBACK_SENDER']};
 b.wiring=Object.fromEntries(await Promise.all(Object.entries(wiring).map(async([k,[to,name]])=>[k,A.decode(['address'],await call(base,to,I,name))[0]])));
 [b.creationBlock,b.reactionBlock,b.callbackBlock,b.history]=await Promise.all([base.send('eth_getBlockByNumber',[b.creation.blockNumber,false]),lasna.send('eth_getBlockByNumber',[b.reaction.blockNumber,false]),base.send('eth_getBlockByNumber',[b.callback.blockNumber,false]),readHistory(base,{address:IDENTITY.escrow,topics:[null,'0x'+BigInt(quoteId).toString(16).padStart(64,'0')]},b.creation.blockNumber,height)]);
 const hash=seed.grant.receipt.transactionHash;const [receipt,transaction]=await Promise.all([base.send('eth_getTransactionReceipt',[hash]),base.send('eth_getTransactionByHash',[hash])]);check(receipt&&transaction,'Grant unavailable.');b.grant={receipt,transaction};
 b.observedAt=new Date().toISOString();return JSON.parse(JSON.stringify(b,(_,v)=>typeof v==='bigint'?v.toString():v));
}
async function main(){const args=process.argv.slice(2);check(args.length<=1&&(!args[0]||args[0]==='--recorded'),'Use npm run verify:expiry:v4 [-- --recorded]');const file=path.join(__dirname,'../deployments/evidence/v4/quote-5-expiry-verified.json'),saved=JSON.parse(fs.readFileSync(file,'utf8'));
 if(args[0]==='--recorded'){console.log(JSON.stringify({...validate(saved.bundle),sourceObservedAt:saved.bundle.observedAt,mode:'recorded public evidence replay; no fresh RPC'},null,2));return;}
 const base=rpc(process.env.BASE_SEPOLIA_RPC||'https://sepolia.base.org'),lasna=rpc(process.env.LASNA_RPC||'https://lasna-rpc.rnk.dev');try{const bundle=await collect(base,lasna,saved.bundle),result=validate(bundle);fs.writeFileSync(file+'.tmp',JSON.stringify({result,bundle},null,2)+'\n');fs.renameSync(file+'.tmp',file);console.log(JSON.stringify(result,null,2));}finally{base.destroy();lasna.destroy();}}
if(require.main===module)main().catch(e=>{console.error(e.expiryVerification?e.message:'V4 expiry verification stopped; no transaction sent or successful snapshot written.');process.exitCode=1;});
module.exports={collect,validate,readHistory,observedProvider};
