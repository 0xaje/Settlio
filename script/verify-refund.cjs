// Public RPC reads only. Recorded evidence is replayed explicitly with --recorded.
const fs = require('node:fs');
const path = require('node:path');
const { Interface, AbiCoder, ZeroAddress, getAddress, keccak256 } = require('ethers');
const { rpc, PROXY, SYSTEM, USDC } = require('./m2-network.cjs');
const { CRON, CRON_TOPIC } = require('./cron-event.cjs');
const ROOT = path.join(__dirname, '..');
const E = new Interface(require('../apps/web/src/escrow-abi.json'));
const T = new Interface(['event Transfer(address indexed from,address indexed to,uint256 value)', 'event Approval(address indexed owner,address indexed spender,uint256 value)', 'function balanceOf(address) view returns(uint256)']);
const Q = new Interface(['function jobs(uint256) view returns(uint64,uint64,uint64,uint8,bool,bool,bool,bool,bool,bool,bool)', 'function activeJobCount() view returns(uint256)', 'function cronSubscribed() view returns(bool)']);
const W = new Interface(['function escrow() view returns(address)', 'function callbackReceiver() view returns(address)', 'function _SERVICE_PROVIDER() view returns(address)', 'function _CALLBACK_SENDER() view returns(address)']);
const F = new Interface(['function confirmBooking(address,uint256)', 'function processPolicy(address,uint256)']);
const P = new Interface(['function deliverCallback(uint8,bytes)']);
const TRIGGER = new Interface(['function trigger(address,tuple(uint256 chainId,address contractAddress,uint256 topic0,uint256 topic1,uint256 topic2,uint256 topic3,bytes data,uint256 blockNumber,uint256 opCode,uint256 blockHash,uint256 txHash,uint256 logIndex))']);
const REQUEST = new Interface(['event PolicyCallbackRequested(uint256 indexed quoteId,uint8 attempt)', 'event ConfirmationCallbackRequested(uint256 indexed quoteId,bytes32 indexed originLog)']);
const SYS = new Interface(['event CallbackRequest(uint256 indexed chainId,address indexed sender,address indexed recipient,uint8 version,bytes configuration)']);
const A = AbiCoder.defaultAbiCoder();
const CONFIG = 'tuple(uint256 chainId,address recipient,uint64 gasLimit,bytes payload)';
function check(ok, message) { if (!ok) { const e = Error(message); e.refundVerification = true; throw e; } }
const same = (a,b) => getAddress(a) === getAddress(b);
const json = value => JSON.parse(JSON.stringify(value,(_,v)=>typeof v==='bigint'?v.toString():v));
function events(r, iface, address, name) {
  return r.logs.filter(l => same(l.address,address) && !l.removed && l.transactionHash.toLowerCase() === r.transactionHash.toLowerCase() && l.blockHash.toLowerCase() === r.blockHash.toLowerCase() && BigInt(l.blockNumber) === BigInt(r.blockNumber)).flatMap(l => {
    try { const p=iface.parseLog(l); return p?.name===name ? [{log:l,args:p.args}] : []; } catch { return []; }
  });
}
function one(r,iface,address,name,id) {
  const found=events(r,iface,address,name).filter(x=>id===undefined||x.args.quoteId===id);
  check(found.length===1, 'Missing or ambiguous '+name+' event.'); return found[0];
}
function linkedTx(tx,r,chain) {
  check(tx && tx.hash.toLowerCase()===r.transactionHash.toLowerCase() && tx.blockHash.toLowerCase()===r.blockHash.toLowerCase() && BigInt(tx.blockNumber)===BigInt(r.blockNumber) && BigInt(tx.chainId)===chain,'Transaction/receipt/network mismatch.');
}
function validate(b) {
  const q=E.decodeFunctionResult('getQuote',b.state.quote.result)[0];
  const created=b.creation.receipt.logs.map(l=>{try{return {l,p:E.parseLog(l)};}catch{return null;}}).find(x=>x?.p?.name==='QuoteCreated');
  check(created,'Missing creation event.'); const escrow=getAddress(created.l.address),id=created.p.args.quoteId;
  const receiver=A.decode(['address'],b.authentication.callbackReceiver)[0];
  const reactive=A.decode(['address'],b.authentication._CALLBACK_SENDER)[0];
  check(b.networks && BigInt(b.networks.base)===84532n && BigInt(b.networks.lasna)===5318007n,'Network identity missing.');
  check(same(A.decode(['address'],b.authentication.escrow)[0],escrow)&&same(A.decode(['address'],b.authentication._SERVICE_PROVIDER)[0],PROXY),'Callback wiring mismatch.');
  check(b.identity && same(b.identity.escrow,escrow)&&same(b.identity.reactive,reactive)&&same(b.identity.receiver,receiver),'Deployment identity mismatch.');
  for (const n of ['creation','deposit','confirmation','cancellation','refund']) {
    check(BigInt(b[n].receipt.status)===1n,'Unsuccessful '+n+' receipt.'); linkedTx(b[n].transaction,b[n].receipt,84532n);
  }
  const c=one(b.creation.receipt,E,escrow,'QuoteCreated',id).args;
  const policy=one(b.creation.receipt,E,escrow,'PolicyRegistered',id).args;
  check(q.status===5n&&same(q.merchant,c.merchant)&&same(q.customer,c.customer)&&q.termsHash===c.termsHash&&q.expiresAt===policy.expiresAt&&q.refundCutoff===policy.refundCutoff,'Quote identity/terms/outcome mismatch.');
  check(same(q.asset,ZeroAddress)||same(q.asset,USDC),'Unsupported refund asset.');
  const selected=one(b.deposit.receipt,E,escrow,'AssetSelected',id).args;
  const deposit=one(b.deposit.receipt,E,escrow,'DepositReceived',id).args;
  check(same(selected.asset,q.asset)&&selected.optionIndex===q.selectedOption&&same(deposit.customer,q.customer)&&deposit.amount===q.deposit&&q.deposit>0n,'Deposit asset/amount/customer mismatch.');
  one(b.confirmation.receipt,E,escrow,'BookingConfirmed',id);
  one(b.cancellation.receipt,E,escrow,'CancellationRequested',id);
  check(one(b.refund.receipt,E,escrow,'Refunded',id).args.amount===q.deposit&&one(b.refund.receipt,E,escrow,'PolicyChecked',id).args.status===5n,'Refund outcome mismatch.');
  for(const n of ['deposit','cancellation','refund'])check(b.additional[n+'Block'].result.hash.toLowerCase()===b[n].receipt.blockHash.toLowerCase(),'Evidence block mismatch.');
  check(BigInt(b.additional.depositBlock.result.timestamp)<q.expiresAt,'Deposit at/after payment deadline.');
  check(BigInt(b.additional.cancellationBlock.result.timestamp)<q.refundCutoff,'Cancellation outside refund window.');
  for(const [first,last] of [['creation','deposit'],['deposit','confirmation'],['confirmation','cancellation'],['cancellation','refund']]) check(BigInt(b[first].receipt.blockNumber)<BigInt(b[last].receipt.blockNumber),'Evidence order mismatch.');
  for(const n of ['confirmation','refund']) {
    const tx=b[n].transaction; check(same(tx.to,PROXY)&&BigInt(tx.value)===0n,'Wrong callback route.');
    const [version,data]=P.decodeFunctionData('deliverCallback',tx.input), cfg=A.decode([CONFIG],data)[0];
    const fn=n==='refund'?'processPolicy':'confirmBooking';
    check(version===0n&&cfg.chainId===84532n&&same(cfg.recipient,receiver)&&cfg.payload===F.encodeFunctionData(fn,[reactive,id]),'Delivered callback authentication/payload mismatch.');
    const r=b.additional[n+'ReactionReceipt'].result,t=b.additional[n+'ReactionTx'].result;
    const rb=b.additional[n+'ReactionBlock'].result,cb=b.additional[n==='refund'?'refundBlock':'confirmationBlock'].result;
    check(rb.hash.toLowerCase()===r.blockHash.toLowerCase()&&cb.hash.toLowerCase()===b[n].receipt.blockHash.toLowerCase()&&BigInt(rb.timestamp)<=BigInt(cb.timestamp),'Associated reaction block/timing mismatch.');
    if(n==='refund')check(BigInt(rb.timestamp)>=BigInt(b.additional.cancellationBlock.result.timestamp),'Refund request predates cancellation.');
    check(BigInt(r.status)===1n,'Unsuccessful reaction.'); linkedTx(t,r,5318007n);
    check(same(t.to,SYSTEM)&&same(t.from,'0x038E06667e42782E571EaB20432b9237F9bD6B82'),'Wrong reaction route.');
    const [target,record]=TRIGGER.decodeFunctionData('trigger',t.input);check(same(target,reactive)&&record.opCode===(n==='refund'?2n:3n),'Wrong reaction target/opcode.');
    const origin=n==='refund'?b.authentication.cron:b.deposit.receipt;
    check(record.txHash===BigInt(origin.transactionHash)&&record.blockHash===BigInt(origin.blockHash)&&record.blockNumber===BigInt(origin.blockNumber),'Reaction origin mismatch.');
    const log=origin.logs.find(l=>BigInt(l.logIndex)===record.logIndex);
    check(log&&!log.removed&&log.transactionHash.toLowerCase()===origin.transactionHash.toLowerCase()&&log.blockHash.toLowerCase()===origin.blockHash.toLowerCase()&&same(log.address,record.contractAddress)&&BigInt(log.topics[0])===record.topic0&&log.data===record.data,'Origin log mismatch.');
    for(let k=1;k<4;k++)check(BigInt(log.topics[k]||0)===record['topic'+k],'Origin indexed fields mismatch.');
    const requested=one(r,SYS,SYSTEM,'CallbackRequest').args, reqCfg=A.decode([CONFIG],requested.configuration)[0];
    check(requested.chainId===84532n&&same(requested.sender,reactive)&&same(requested.recipient,receiver)&&requested.version===0n&&reqCfg.chainId===84532n&&same(reqCfg.recipient,receiver)&&reqCfg.gasLimit===cfg.gasLimit&&reqCfg.payload===F.encodeFunctionData(fn,[ZeroAddress,id]),'Requested callback differs from delivery.');
    if(n==='refund') {
      check(BigInt(origin.status)===1n&&record.chainId===5318007n&&same(log.address,CRON)&&log.topics.length===2&&log.topics[0].toLowerCase()===CRON_TOPIC&&log.data==='0x','Not an indexed network CRON.');
      one(r,REQUEST,reactive,'PolicyCallbackRequested',id);
    } else {
      check(record.chainId===84532n&&same(record.contractAddress,escrow)&&BigInt(log.logIndex)===BigInt(one(origin,E,escrow,'DepositReceived',id).log.logIndex),'Not the quote deposit origin.');
      const fingerprint=keccak256(A.encode(['uint256','uint256','uint256','uint256'],[84532,record.blockHash,record.txHash,record.logIndex]));
      check(one(r,REQUEST,reactive,'ConfirmationCallbackRequested',id).args.originLog===fingerprint,'Deposit fingerprint mismatch.');
    }
  }
  const token=!same(q.asset,ZeroAddress);
  if(token) {
    check(b.approval&&BigInt(b.approval.receipt.status)===1n,'USDC approval receipt missing/failed.');
    linkedTx(b.approval.transaction,b.approval.receipt,84532n);
    const approval=one(b.approval.receipt,T,USDC,'Approval').args;
    check(same(approval.owner,q.customer)&&same(approval.spender,escrow)&&approval.value===q.deposit,'Exact USDC approval mismatch.');
    for(const [n,from,to] of [['deposit',q.customer,escrow],['refund',escrow,q.customer]]) {
      const transfers=events(b[n].receipt,T,USDC,'Transfer').filter(x=>same(x.args[0],from)&&same(x.args[1],to)&&x.args[2]===q.deposit);
      check(transfers.length===1,'Exact USDC transfer missing.');
    }
    check(BigInt(b.authentication.tokenCustomerafter)-BigInt(b.authentication.tokenCustomerbefore)===q.deposit&&BigInt(b.authentication.tokenEscrowbefore)-BigInt(b.authentication.tokenEscrowafter)===q.deposit,'USDC refund-block deltas mismatch.');
  } else check(BigInt(b.additional.customerafter.result)-BigInt(b.additional.customerbefore.result)===q.deposit&&BigInt(b.additional.escrowbefore.result)-BigInt(b.additional.escrowafter.result)===q.deposit,'ETH refund-block deltas mismatch.');
  const balance=BigInt(token?b.state.tokenEscrow.result:b.state.balance.result), liability=BigInt(b.state.liability.result);
  check(balance>=liability,'Refund-asset custody underfunded.');
  const native=BigInt(b.state.nativeLiability.result);
  check(BigInt(b.state.balance.result)>=native&&(!token?native===liability:true),'Native custody accounting mismatch.');
  const job=Q.decodeFunctionResult('jobs',b.state.job.result);
  check(job[5]&&job[8]&&job[2]===0n,'Scheduler terminal acknowledgement missing.');
  return {verifiedAt:new Date().toISOString(),readOnly:true,scope:'quote-linked authenticated same-asset refund',quoteId:id.toString(),asset:token?'USDC':'ETH',refundUnits:q.deposit.toString(),outcome:'Refunded',schedulerClosed:true,currentAssetBalance:balance.toString(),currentAssetLiability:liability.toString(),uniqueRetryAttribution:false,browserClosedEvidence:'not recorded',limits:['Matching requests and deliveries do not establish unique return-report attribution.','Balance deltas are block observations; unrelated same-block transfers may prevent strict delta verification.','This does not prove browser closure, automatic release, future funding or exact latency.']};
}
async function collect(base,lasna,seed) {
  const b=structuredClone(seed); delete b.result; delete b.fundingObservation;
  b.networks={base:await base.send('eth_chainId',[]),lasna:await lasna.send('eth_chainId',[])};
  check(BigInt(b.networks.base)===84532n&&BigInt(b.networks.lasna)===5318007n,'RPC network mismatch.');
  const read=(p,m,args)=>p.send(m,args);
  await Promise.all(['creation','deposit','confirmation','cancellation','refund',...(b.approval?['approval']:[])].map(async n=>{const hash=seed[n].receipt.transactionHash; const [receipt,transaction]=await Promise.all([read(base,'eth_getTransactionReceipt',[hash]),read(base,'eth_getTransactionByHash',[hash])]);check(receipt&&transaction,'Receipt unavailable.');b[n]={receipt,transaction};}));
  await Promise.all(['confirmation','refund'].map(async n=>{const hash=seed.additional[n+'ReactionReceipt'].result.transactionHash;const [r,t]=await Promise.all([read(lasna,'eth_getTransactionReceipt',[hash]),read(lasna,'eth_getTransactionByHash',[hash])]);check(r&&t,'Reaction unavailable.');b.additional[n+'ReactionReceipt']={result:r};b.additional[n+'ReactionTx']={result:t};b.additional[n+'ReactionBlock']={result:await read(lasna,'eth_getBlockByNumber',[r.blockNumber,false])};}));
  b.authentication.cron=await read(lasna,'eth_getTransactionReceipt',[seed.authentication.cron.transactionHash]);
  const created=b.creation.receipt.logs.flatMap(l=>{try{const p=E.parseLog(l);return p?.name==='QuoteCreated'?[{l,p}]:[];}catch{return [];}})[0];
  check(created,'Quote creation unavailable.'); const id=created.p.args.quoteId;
  const escrow=getAddress(created.l.address),receiver=A.decode(['address'],seed.authentication.callbackReceiver)[0],reactive=A.decode(['address'],seed.authentication._CALLBACK_SENDER)[0];
  b.identity={escrow,receiver,reactive};
  const baseHead=await read(base,'eth_blockNumber',[]),lasnaHead=await read(lasna,'eth_blockNumber',[]);
  b.observationBlocks={base:baseHead,lasna:lasnaHead};
  const call=(p,to,iface,name,args=[],height=baseHead)=>read(p,'eth_call',[{to,data:iface.encodeFunctionData(name,args)},height]);
  const rawQuote=await call(base,escrow,E,'getQuote',[id]),quote=E.decodeFunctionResult('getQuote',rawQuote)[0],token=!same(quote.asset,ZeroAddress);
  b.state={quote:{result:rawQuote}};
  await Promise.all([
    ...[['liability',E,'liability',[quote.asset]],['nativeLiability',E,'totalLiability',[]]].map(async([key,i,f,args])=>b.state[key]={result:await call(base,escrow,i,f,args)}),
    ...[['job','jobs',[id]],['count','activeJobCount',[]],['cron','cronSubscribed',[]]].map(async([key,f,args])=>b.state[key]={result:await call(lasna,reactive,Q,f,args,lasnaHead)}),
    (async()=>b.state.balance={result:await read(base,'eth_getBalance',[escrow,baseHead])})(),
    ...['escrow','_SERVICE_PROVIDER','_CALLBACK_SENDER','callbackReceiver'].map(async key=>b.authentication[key]=await call(base,key==='callbackReceiver'?escrow:receiver,W,key)),
    ...['deposit','confirmation','cancellation','refund'].map(async n=>b.additional[n+'Block']={result:await read(base,'eth_getBlockByNumber',[b[n].receipt.blockNumber,false])})
  ]);
  const height=BigInt(b.refund.receipt.blockNumber);
  await Promise.all(['before','after'].flatMap(label=>['escrow','customer'].map(async who=>{
    const block='0x'+(label==='before'?height-1n:height).toString(16),address=who==='escrow'?escrow:quote.customer;
    if(token)b.authentication['token'+(who==='escrow'?'Escrow':'Customer')+label]=await call(base,USDC,T,'balanceOf',[address],block);
    else b.additional[who+label]={result:await read(base,'eth_getBalance',[address,block])};
  })));
  if(token)b.state.tokenEscrow={result:await call(base,USDC,T,'balanceOf',[escrow])};
  b.observedAt=new Date().toISOString();return b;
}
async function main() {
  const [id,flag]=process.argv.slice(2);check(['2','4'].includes(id)&&(!flag||flag==='--recorded'),'Usage: npm run verify:refund -- 2|4 [--recorded]');
  const seedFile=path.join(ROOT,'deployments/evidence/m2',id==='2'?'quote-2-eth-refund.json':'quote-4-usdc-refund.json'),seed=JSON.parse(fs.readFileSync(seedFile,'utf8'));
  // Fixed public identities prevent a different deployment from being accepted as Settlio M2.
  const identity={escrow:'0x1694e56187f9422e364B42af3185d34a0D4b9bc0',reactive:'0xa2DBeB94c0a151e071A6c29999FE1c6B38217b85',receiver:'0x1E44e729A2f2Fa2e64C1eDb9904A2eCD90C8A781'};
  if(flag==='--recorded') {const saved=JSON.parse(fs.readFileSync(path.join(ROOT,'deployments/evidence/m2','quote-'+id+'-refund-verified.json'),'utf8'));const result=validate(saved.bundle);check(result.quoteId===id,'Wrong quote evidence.');for(const k of Object.keys(identity))check(same(saved.bundle.identity[k],identity[k]),'Wrong M2 deployment.');console.log(JSON.stringify({...result,sourceObservedAt:saved.bundle.observedAt,mode:'recorded public evidence replay; no fresh RPC'},null,2));return;}
  const base=rpc(process.env.BASE_SEPOLIA_RPC||'https://sepolia.base.org'),lasna=rpc(process.env.LASNA_RPC||'https://lasna-rpc.rnk.dev');
  try {const b=await collect(base,lasna,seed);for(const k of Object.keys(identity))check(same(b.identity[k],identity[k]),'Wrong M2 deployment.');const result=validate(b);check(result.quoteId===id,'Wrong quote evidence.');const output=path.join(ROOT,'deployments/evidence/m2','quote-'+id+'-refund-verified.json');fs.writeFileSync(output+'.tmp',JSON.stringify({result,bundle:b},null,2)+'\n');fs.renameSync(output+'.tmp',output);console.log(JSON.stringify(result,null,2));}
  finally {base.destroy();lasna.destroy();}
}
if(require.main===module) main().catch(e=>{console.error(e.refundVerification?e.message:'Refund verification stopped. Check public RPC/history access; no transaction sent or successful snapshot written.');process.exitCode=1;});
module.exports={validate,collect};
