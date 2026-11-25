// Read-only quote-3 V4 ETH refund evidence; no key or transaction broadcasting.
const fs=require('node:fs'),path=require('node:path');
const {Interface,AbiCoder,getAddress,ZeroAddress}=require('ethers');
const core=require('./verify-refund.cjs'),{IDENTITY,GATE}=require('./verify-v4-release.cjs');
const {rpc,USDC}=require('./m2-network.cjs');
const A=AbiCoder.defaultAbiCoder(),E=new Interface(require('../apps/web/src/escrow-abi.json'));
const I=new Interface(['function POLICY_VERSION() view returns(uint256)','function admission() view returns(address)','function quoteCount() view returns(uint256)','function active() view returns(uint256)','function reserved() view returns(uint256)','function admitted() view returns(uint256)','function jobs(uint256) view returns(bool admitted,bool closed,uint32 retries,uint64 retryAfter)','function schedulerPaused() view returns(bool)','function balanceOf(address) view returns(uint256)','function liability(address) view returns(uint256)','function setGrant(address,uint32,uint64,bytes32)','event Admitted(uint256 indexed quoteId,address indexed merchant,uint64 cutoff,bytes32 fundingObservation)','event Closed(uint256 indexed quoteId)']);
const same=(a,b)=>getAddress(a)===getAddress(b);
function check(ok,message){if(!ok){const e=Error(message);e.refundVerification=true;throw e;}}
function event(receipt,name){const found=receipt.logs.filter(l=>same(l.address,GATE)&&!l.removed&&l.transactionHash.toLowerCase()===receipt.transactionHash.toLowerCase()&&l.blockHash.toLowerCase()===receipt.blockHash.toLowerCase()&&BigInt(l.blockNumber)===BigInt(receipt.blockNumber)).flatMap(l=>{try{const e=I.parseLog(l);return e?.name===name&&e.args.quoteId===3n?[e.args]:[];}catch{return [];}});check(found.length===1,'Missing or ambiguous V4 admission '+name);return found[0];}
function validate(b){
 for(const k of Object.keys(IDENTITY))check(b.identity&&same(b.identity[k],IDENTITY[k]),'Wrong V4 refund identity.');
 const result=core.validate(b),q=E.decodeFunctionResult('getQuote',b.state.quote.result)[0],s=b.v4;
 check(result.quoteId==='3'&&result.asset==='ETH'&&q.deposit===100000000000000n,'Wrong V4 refund quote/asset/amount.');
 const admitted=event(b.creation.receipt,'Admitted');event(b.refund.receipt,'Closed');
 check(same(admitted.merchant,q.merchant)&&admitted.cutoff===q.refundCutoff&&BigInt(admitted.fundingObservation)!==0n,'Admission terms mismatch.');
 const policy=b.creation.receipt.logs.filter(l=>same(l.address,IDENTITY.escrow)).flatMap(l=>{try{const p=E.parseLog(l);return p?.name==='PolicyRegistered'&&p.args.quoteId===3n?[p.args]:[];}catch{return [];}});
 check(policy.length===1&&policy[0].automaticRelease===true,'Automatic-release cancellation priority not covered.');
 for(const n of ['escrowVersion','reactiveVersion'])check(A.decode(['uint256'],s[n])[0]===4n,'Wrong V4 version.');
 check(same(A.decode(['address'],s.admission)[0],GATE),'Wrong admission gate.');
 const job=I.decodeFunctionResult('jobs',s.job);check(job.admitted&&job.closed,'Admission refund slot remains open.');
 for(const n of ['active','reserved','usdcBalance','usdcLiability'])check(BigInt(s[n])===0n,'V4 work or custody not empty: '+n);
 check(BigInt(s.quoteCount)===3n&&BigInt(s.admitted)===3n,'Wrong V4 lifetime checkpoint.');
 check(BigInt(b.state.balance.result)===0n&&BigInt(b.state.nativeLiability.result)===0n&&BigInt(b.state.liability.result)===0n,'ETH custody/liability not cleared.');
 check(BigInt(b.state.count.result)===0n&&!A.decode(['bool'],b.state.cron.result)[0]&&!A.decode(['bool'],s.paused)[0],'Source not idle and unpaused.');
 for(const n of ['deposit','confirmation','cancellation','refund']){const block=b.additional[n+'Block'].result;check(BigInt(block.number)===BigInt(b[n].receipt.blockNumber),'Evidence block number mismatch.');}
 const {receipt:r,transaction:t}=b.grant;
 check(BigInt(r.status)===1n&&BigInt(t.chainId)===84532n&&t.hash.toLowerCase()===r.transactionHash.toLowerCase()&&t.blockHash.toLowerCase()===r.blockHash.toLowerCase()&&BigInt(t.blockNumber)===BigInt(r.blockNumber)&&BigInt(r.blockNumber)<BigInt(b.creation.receipt.blockNumber),'Grant receipt/order mismatch.');
 check(same(t.from,q.merchant)&&same(t.to,GATE)&&BigInt(t.value)===0n,'Grant sender/target mismatch.');
 const [merchant,credits,until,reference]=I.decodeFunctionData('setGrant',t.input);
 check(same(merchant,q.merchant)&&credits===1n&&reference===admitted.fundingObservation&&until>BigInt(b.additional.creationBlock.result.timestamp),'Grant scope/reference/expiry mismatch.');
 check(b.additional.creationBlock.result.hash.toLowerCase()===b.creation.receipt.blockHash.toLowerCase()&&BigInt(b.additional.creationBlock.result.number)===BigInt(b.creation.receipt.blockNumber),'Creation block binding mismatch.');
 return {...result,policyVersion:4,scope:'V4 quote 3 admitted ETH deposit, authenticated confirmation, eligible cancellation and same-asset refund',identity:IDENTITY,admission:GATE,admissionSlotClosed:true,schedulerIdle:true,automaticReleaseEnabled:true};
}
async function collect(base,lasna,seed){
 const b=await core.collect(base,lasna,seed),height=b.observationBlocks.base,rheight=b.observationBlocks.lasna;
 const call=(p,to,name,args=[],block=height)=>p.send('eth_call',[{to,data:I.encodeFunctionData(name,args)},block]);
 const reads={escrowVersion:()=>call(base,IDENTITY.escrow,'POLICY_VERSION'),reactiveVersion:()=>call(lasna,IDENTITY.reactive,'POLICY_VERSION',[],rheight),admission:()=>call(base,IDENTITY.escrow,'admission'),job:()=>call(base,GATE,'jobs',[3]),active:()=>call(base,GATE,'active'),reserved:()=>call(base,GATE,'reserved'),admitted:()=>call(base,GATE,'admitted'),quoteCount:()=>call(base,IDENTITY.escrow,'quoteCount'),paused:()=>call(lasna,IDENTITY.reactive,'schedulerPaused',[],rheight),usdcBalance:()=>call(base,USDC,'balanceOf',[IDENTITY.escrow]),usdcLiability:()=>call(base,IDENTITY.escrow,'liability',[USDC])};
 b.v4=Object.fromEntries(await Promise.all(Object.entries(reads).map(async([k,read])=>[k,await read()])));
 const hash=seed.grant.receipt.transactionHash;const [receipt,transaction,creationBlock]=await Promise.all([base.send('eth_getTransactionReceipt',[hash]),base.send('eth_getTransactionByHash',[hash]),base.send('eth_getBlockByNumber',[b.creation.receipt.blockNumber,false])]);
 check(receipt&&transaction&&creationBlock,'Grant/creation block unavailable.');b.grant={receipt,transaction};b.additional.creationBlock={result:creationBlock};return b;
}
async function main(){const args=process.argv.slice(2);check(args.length<=1&&(!args[0]||args[0]==='--recorded'),'Use npm run verify:refund:v4 [-- --recorded]');const file=path.join(__dirname,'../deployments/evidence/v4/quote-3-refund-verified.json'),saved=JSON.parse(fs.readFileSync(file,'utf8'));
 if(args[0]==='--recorded'){console.log(JSON.stringify({...validate(saved.bundle),sourceObservedAt:saved.bundle.observedAt,mode:'recorded public evidence replay; no fresh RPC'},null,2));return;}
 const base=rpc(process.env.BASE_SEPOLIA_RPC||'https://sepolia.base.org'),lasna=rpc(process.env.LASNA_RPC||'https://lasna-rpc.rnk.dev');try{const bundle=await collect(base,lasna,saved.bundle),result=validate(bundle);fs.writeFileSync(file+'.tmp',JSON.stringify({result,bundle},null,2)+'\n');fs.renameSync(file+'.tmp',file);console.log(JSON.stringify(result,null,2));}finally{base.destroy();lasna.destroy();}}
if(require.main===module)main().catch(e=>{console.error(e.refundVerification?e.message:'V4 refund verification stopped; no transaction sent or successful snapshot written.');process.exitCode=1;});
module.exports={collect,validate};
