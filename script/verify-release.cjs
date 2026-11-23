// Read-only reproduction of the accepted M2 ETH/USDC automatic-release trails.
const fs=require('node:fs'),path=require('node:path');
const {Interface,AbiCoder,ZeroAddress,getAddress,keccak256}=require('ethers');
const {rpc,PROXY,SYSTEM,USDC}=require('./m2-network.cjs');
const {CRON,CRON_TOPIC}=require('./cron-event.cjs');
const ROOT=path.join(__dirname,'..');
const IDENTITY={escrow:'0x1694e56187f9422e364B42af3185d34a0D4b9bc0',reactive:'0xa2DBeB94c0a151e071A6c29999FE1c6B38217b85',receiver:'0x1E44e729A2f2Fa2e64C1eDb9904A2eCD90C8A781'};
const E=new Interface(require('../apps/web/src/escrow-abi.json'));
const T=new Interface(['event Transfer(address indexed from,address indexed to,uint256 value)','event Approval(address indexed owner,address indexed spender,uint256 value)','function balanceOf(address) view returns(uint256)']);
const Q=new Interface(['function jobs(uint256) view returns(uint64,uint64,uint64,uint8,bool,bool,bool,bool,bool,bool,bool)','function activeJobCount() view returns(uint256)','function cronSubscribed() view returns(bool)']);
const W=new Interface(['function escrow() view returns(address)','function callbackReceiver() view returns(address)','function _SERVICE_PROVIDER() view returns(address)','function _CALLBACK_SENDER() view returns(address)']);
const F=new Interface(['function confirmBooking(address,uint256)','function processPolicy(address,uint256)']);
const P=new Interface(['function deliverCallback(uint8,bytes)']);
const TRIGGER=new Interface(['function trigger(address,tuple(uint256 chainId,address contractAddress,uint256 topic0,uint256 topic1,uint256 topic2,uint256 topic3,bytes data,uint256 blockNumber,uint256 opCode,uint256 blockHash,uint256 txHash,uint256 logIndex))']);
const REQUEST=new Interface(['event PolicyCallbackRequested(uint256 indexed quoteId,uint8 attempt)','event ConfirmationCallbackRequested(uint256 indexed quoteId,bytes32 indexed originLog)']);
const SYS=new Interface(['event CallbackRequest(uint256 indexed chainId,address indexed sender,address indexed recipient,uint8 version,bytes configuration)']);
const A=AbiCoder.defaultAbiCoder(),CONFIG='tuple(uint256 chainId,address recipient,uint64 gasLimit,bytes payload)';
const same=(a,b)=>getAddress(a)===getAddress(b);
function check(ok,message){if(!ok){const e=Error(message);e.releaseVerification=true;throw e;}}
function event(r,iface,address,name,id){
  const found=r.logs.filter(l=>same(l.address,address)&&!l.removed&&l.transactionHash.toLowerCase()===r.transactionHash.toLowerCase()&&l.blockHash.toLowerCase()===r.blockHash.toLowerCase()&&BigInt(l.blockNumber)===BigInt(r.blockNumber)).flatMap(l=>{try{const p=iface.parseLog(l);return p?.name===name&&(id===undefined||p.args.quoteId===id)?[{log:l,args:p.args}]:[];}catch{return [];}});
  check(found.length===1,'Missing or ambiguous '+name+' event.');return found[0];
}
function validate(b){
  const {escrow,reactive,receiver}=IDENTITY,s=b.state;
  check(BigInt(b.networks.base)===84532n&&BigInt(b.networks.lasna)===5318007n,'RPC network mismatch.');
  for(const n of ['creation','deposit','confirmation','release','confirmationReaction','releaseReaction',...(b.approval?['approval']:[])]){
    const {receipt:r,transaction:t}=b[n];
    check(r&&t&&BigInt(r.status)===1n,'Unsuccessful or unavailable evidence.');
    check(t.hash.toLowerCase()===r.transactionHash.toLowerCase()&&t.blockHash.toLowerCase()===r.blockHash.toLowerCase()&&BigInt(t.blockNumber)===BigInt(r.blockNumber)&&BigInt(t.chainId)===(n.endsWith('Reaction')?5318007n:84532n),'Transaction/receipt/network mismatch.');
    if(n!=='approval')check(b.blocks[n].hash.toLowerCase()===r.blockHash.toLowerCase()&&BigInt(b.blocks[n].number)===BigInt(r.blockNumber),'Evidence block mismatch.');
  }
  const q=E.decodeFunctionResult('getQuote',s.quote)[0];
  const created=event(b.creation.receipt,E,escrow,'QuoteCreated'),id=created.args.quoteId;
  const policy=event(b.creation.receipt,E,escrow,'PolicyRegistered',id).args;
  check(q.status===7n&&q.deposit>0n&&q.total>=q.deposit&&same(q.merchant,created.args.merchant)&&same(q.customer,created.args.customer)&&q.termsHash===created.args.termsHash&&q.expiresAt===policy.expiresAt&&q.refundCutoff===policy.refundCutoff,'Quote identity/terms/outcome mismatch.');
  check(policy.automaticRelease&&A.decode(['bool'],s.automatic)[0],'Quote did not opt into automatic release.');
  check(same(q.asset,ZeroAddress)||same(q.asset,USDC),'Unsupported release asset.');
  const token=!same(q.asset,ZeroAddress),deposit=event(b.deposit.receipt,E,escrow,'DepositReceived',id).args,selected=event(b.deposit.receipt,E,escrow,'AssetSelected',id).args;
  check(same(deposit.customer,q.customer)&&deposit.amount===q.deposit&&same(selected.asset,q.asset)&&selected.optionIndex===q.selectedOption,'Deposit asset/amount/customer mismatch.');
  event(b.confirmation.receipt,E,escrow,'BookingConfirmed',id);
  check(event(b.release.receipt,E,escrow,'Released',id).args.amount===q.deposit&&event(b.release.receipt,E,escrow,'PolicyChecked',id).args.status===7n,'Released outcome mismatch.');
  check(BigInt(b.blocks.deposit.timestamp)<q.expiresAt&&BigInt(b.blocks.release.timestamp)>=q.refundCutoff,'Deposit deadline or automatic-release cutoff violated.');
  for(const [a,z] of [['creation','deposit'],['deposit','confirmation'],['confirmation','release']])check(BigInt(b[a].receipt.blockNumber)<BigInt(b[z].receipt.blockNumber),'Evidence order mismatch.');
  for(const [key,value] of Object.entries({callbackReceiver:receiver,escrow,_SERVICE_PROVIDER:PROXY,_CALLBACK_SENDER:reactive}))check(same(A.decode(['address'],s['wire:'+key])[0],value),'Callback authentication wiring mismatch.');
  let attempt;
  for(const [n,fn] of [['confirmation','confirmBooking'],['release','processPolicy']]){
    const tx=b[n].transaction;
    check(same(tx.to,PROXY)&&BigInt(tx.value)===0n,'Wrong callback route.');
    const [version,data]=P.decodeFunctionData('deliverCallback',tx.input),delivered=A.decode([CONFIG],data)[0];
    check(version===0n&&delivered.chainId===84532n&&same(delivered.recipient,receiver)&&delivered.payload===F.encodeFunctionData(fn,[reactive,id]),'Delivered callback sender/recipient/payload mismatch.');
    const r=b[n+'Reaction'].receipt,t=b[n+'Reaction'].transaction;
    check(same(t.to,SYSTEM)&&same(t.from,'0x038E06667e42782E571EaB20432b9237F9bD6B82'),'Wrong Reactive transaction route.');
    const [target,record]=TRIGGER.decodeFunctionData('trigger',t.input),origin=n==='release'?b.cron:b.deposit.receipt;
    check(same(target,reactive)&&record.opCode===(n==='release'?2n:3n),'Wrong reaction target/opcode.');
    check(origin&&BigInt(origin.status)===1n&&record.txHash===BigInt(origin.transactionHash)&&record.blockHash===BigInt(origin.blockHash)&&record.blockNumber===BigInt(origin.blockNumber),'Reaction origin mismatch.');
    const log=origin.logs.find(l=>BigInt(l.logIndex)===record.logIndex);
    check(log&&!log.removed&&log.transactionHash.toLowerCase()===origin.transactionHash.toLowerCase()&&log.blockHash.toLowerCase()===origin.blockHash.toLowerCase()&&BigInt(log.blockNumber)===BigInt(origin.blockNumber)&&same(log.address,record.contractAddress)&&log.data===record.data,'Original trigger log mismatch.');
    for(let k=0;k<4;k++)check(BigInt(log.topics[k]||0)===record['topic'+k],'Trigger indexed fields mismatch.');
    const request=event(r,SYS,SYSTEM,'CallbackRequest').args,cfg=A.decode([CONFIG],request.configuration)[0];
    check(request.chainId===84532n&&same(request.sender,reactive)&&same(request.recipient,receiver)&&request.version===0n&&cfg.chainId===84532n&&same(cfg.recipient,receiver)&&cfg.gasLimit===delivered.gasLimit&&cfg.payload===F.encodeFunctionData(fn,[ZeroAddress,id]),'Requested callback differs from delivered policy.');
    check(BigInt(b.blocks[n+'Reaction'].timestamp)<=BigInt(b.blocks[n].timestamp),'Associated request is later than delivery.');
    if(n==='release'){
      check(BigInt(b.blocks.releaseReaction.timestamp)>=q.refundCutoff,'Scheduled release request precedes cutoff.');
      check(record.chainId===5318007n&&same(log.address,CRON)&&log.topics.length===2&&log.topics[0].toLowerCase()===CRON_TOPIC&&log.data==='0x','Not a genuine indexed CRON100 origin.');
      attempt=event(r,REQUEST,reactive,'PolicyCallbackRequested',id).args.attempt;
    }else{
      check(record.chainId===84532n&&same(log.address,escrow)&&BigInt(log.logIndex)===BigInt(event(origin,E,escrow,'DepositReceived',id).log.logIndex),'Not this quote deposit origin.');
      const fingerprint=keccak256(A.encode(['uint256','uint256','uint256','uint256'],[84532,record.blockHash,record.txHash,record.logIndex]));
      check(event(r,REQUEST,reactive,'ConfirmationCallbackRequested',id).args.originLog===fingerprint,'Deposit fingerprint mismatch.');
    }
  }
  if(token){
    check(b.approval,'USDC approval evidence missing.');const approval=event(b.approval.receipt,T,USDC,'Approval').args;
    check(same(approval.owner,q.customer)&&same(approval.spender,escrow)&&approval.value===q.deposit,'USDC approval mismatch.');
    for(const [n,from,to] of [['deposit',q.customer,escrow],['release',escrow,q.merchant]]){const a=event(b[n].receipt,T,USDC,'Transfer').args;check(same(a.from,from)&&same(a.to,to)&&a.value===q.deposit,'Exact same-asset principal transfer missing.');}
  }
  check(BigInt(s.merchantafter)-BigInt(s.merchantbefore)===q.deposit&&BigInt(s.escrowbefore)-BigInt(s.escrowafter)===q.deposit,'Merchant/escrow release-block deltas mismatch.');
  const balance=BigInt(token?s.tokenEscrow:s.currentNativeBalance),liability=BigInt(s.liability),native=BigInt(s.nativeLiability);
  check(balance>=liability&&BigInt(s.currentNativeBalance)>=native&&(token||native===liability),'Current principal custody coverage failed.');
  const job=Q.decodeFunctionResult('jobs',s.job);check(job[0]===q.expiresAt&&job[1]===q.refundCutoff&&job[4]&&job[5]&&job[6]&&job[8]&&job[2]===0n,'Automatic job terminal acknowledgement missing.');
  return {verifiedAt:new Date().toISOString(),readOnly:true,scope:'quote-linked authenticated same-asset automatic release',quoteId:id.toString(),asset:token?'USDC':'ETH',releaseUnits:q.deposit.toString(),outcome:'Released',releaseAtUTC:new Date(Number(BigInt(b.blocks.release.timestamp))*1000).toISOString(),schedulerClosed:true,currentAssetBalance:balance.toString(),currentAssetLiability:liability.toString(),associatedRequestAttempt:attempt.toString(),uniqueRetryAttribution:false,browserEvidence:'See separately reviewed recording/user evidence in M2 acceptance ledger; RPC does not verify browser actions.',limits:['Matching real requests/deliveries do not establish unique protocol return-report attribution.','Strict block-level balance deltas can reject unrelated same-block account activity.','This does not prove continuous browser closure, service delivery, future funding or full M2 acceptance.']};
}
async function collect(base,lasna,seed){
  const b=structuredClone(seed);delete b.result;delete b.nextTestBudget;
  b.networks={base:await base.send('eth_chainId',[]),lasna:await lasna.send('eth_chainId',[])};
  check(BigInt(b.networks.base)===84532n&&BigInt(b.networks.lasna)===5318007n,'RPC network mismatch.');
  await Promise.all(['creation','deposit','confirmation','release','confirmationReaction','releaseReaction',...(b.approval?['approval']:[])].map(async n=>{const p=n.endsWith('Reaction')?lasna:base,h=seed[n].receipt.transactionHash;const [receipt,transaction]=await Promise.all([p.send('eth_getTransactionReceipt',[h]),p.send('eth_getTransactionByHash',[h])]);check(receipt&&transaction,'Public receipt/transaction unavailable.');b[n]={receipt,transaction};}));
  b.cron=await lasna.send('eth_getTransactionReceipt',[seed.cron.transactionHash]);
  const {escrow,receiver,reactive}=IDENTITY,id=event(b.creation.receipt,E,escrow,'QuoteCreated').args.quoteId;
  const [bh,rh]=await Promise.all([base.send('eth_blockNumber',[]),lasna.send('eth_blockNumber',[])]);b.observationBlocks={base:bh,lasna:rh};
  const call=(p,to,iface,name,args=[],height=bh)=>p.send('eth_call',[{to,data:iface.encodeFunctionData(name,args)},height]);
  b.state={quote:await call(base,escrow,E,'getQuote',[id])};b.blocks={};
  const quote=E.decodeFunctionResult('getQuote',b.state.quote)[0],token=!same(quote.asset,ZeroAddress);
  await Promise.all([
    ...[['liability','liability',[quote.asset]],['nativeLiability','totalLiability',[]],['automatic','automaticRelease',[id]]].map(async([k,f,args])=>b.state[k]=await call(base,escrow,E,f,args)),
    ...[['job','jobs',[id]],['count','activeJobCount',[]],['cron','cronSubscribed',[]]].map(async([k,f,args])=>b.state[k]=await call(lasna,reactive,Q,f,args,rh)),
    (async()=>b.state.currentNativeBalance=await base.send('eth_getBalance',[escrow,bh]))(),
    ...['escrow','callbackReceiver','_SERVICE_PROVIDER','_CALLBACK_SENDER'].map(async k=>b.state['wire:'+k]=await call(base,k==='callbackReceiver'?escrow:receiver,W,k)),
    ...['creation','deposit','confirmation','release','confirmationReaction','releaseReaction'].map(async n=>b.blocks[n]=await (n.endsWith('Reaction')?lasna:base).send('eth_getBlockByNumber',[b[n].receipt.blockNumber,false]))
  ]);
  const height=BigInt(b.release.receipt.blockNumber);
  await Promise.all(['merchant','escrow'].flatMap(who=>['before','after'].map(async label=>{const address=who==='merchant'?quote.merchant:escrow,block='0x'+(label==='before'?height-1n:height).toString(16);b.state[who+label]=token?await call(base,USDC,T,'balanceOf',[address],block):await base.send('eth_getBalance',[address,block]);})));
  if(token)b.state.tokenEscrow=await call(base,USDC,T,'balanceOf',[escrow]);
  b.observedAt=new Date().toISOString();return b;
}
function writeVerified(file,data){const text=JSON.stringify(data,null,2)+'\n';fs.writeFileSync(file+'.tmp',text);fs.renameSync(file+'.tmp',file);}
async function main(){
  const [id,mode]=process.argv.slice(2);check(['5','6'].includes(id)&&(!mode||mode==='--recorded'),'Usage: npm run verify:release -- 5|6 [--recorded]');
  const folder=path.join(ROOT,'deployments/evidence/m2'),seed=JSON.parse(fs.readFileSync(path.join(folder,id==='5'?'quote-5-eth-release.json':'quote-6-usdc-release.json'),'utf8'));
  if(mode==='--recorded'){const saved=JSON.parse(fs.readFileSync(path.join(folder,'quote-'+id+'-release-verified.json'),'utf8'));const result=validate(saved.bundle);check(result.quoteId===id,'Wrong quote evidence.');console.log(JSON.stringify({...result,sourceObservedAt:saved.bundle.observedAt,mode:'recorded public evidence replay; no fresh RPC'},null,2));return;}
  const base=rpc(process.env.BASE_SEPOLIA_RPC||'https://sepolia.base.org'),lasna=rpc(process.env.LASNA_RPC||'https://lasna-rpc.rnk.dev');
  try{const bundle=await collect(base,lasna,seed),result=validate(bundle);check(result.quoteId===id,'Wrong quote evidence.');writeVerified(path.join(folder,'quote-'+id+'-release-verified.json'),{result,bundle});console.log(JSON.stringify(result,null,2));}
  finally{base.destroy();lasna.destroy();}
}
if(require.main===module)main().catch(e=>{console.error(e.releaseVerification?e.message:'Release verification stopped. Check public RPC/history access; no transaction sent or successful snapshot written.');process.exitCode=1;});
module.exports={validate,collect,writeVerified};
