// Pinned, read-only V5 collection. No signer, grant execution or journal writes.
const {Interface,AbiCoder,ContractFactory,keccak256,ZeroAddress,toQuantity,zeroPadValue}=require('ethers');
const {createHash}=require('node:crypto');
const compile=require('./compile-renewable.cjs'),{assertRuntime}=require('./m2-code.cjs'),accounting=require('./renewable-commitments.cjs');
const SYSTEM='0x8888888888888888888888888888888888888888',PROXY='0x476f44b11f5c942c58f4c8e3d0300e5710743585';
const coder=AbiCoder.defaultAbiCoder(),CONFIG='tuple(uint256 chainId,address recipient,uint64 gasLimit,bytes payload)';
const feeI=new Interface(['function debt(address) view returns(uint256)','function reserves(address) view returns(uint256)','function _gasPriceCoeffPer1000() view returns(uint256)','function _extraGas() view returns(uint256)','function getCallbacks(uint256) view returns(tuple(uint256,address,uint256,uint256,uint256,bytes)[])']);
const systemI=new Interface(['event CallbackRequest(uint256 indexed chainId,address indexed sender,address indexed recipient,uint8 version,bytes configuration)']);
const proxyI=new Interface(['function deliverCallback(uint8,bytes)']);
const collectedReports=new WeakSet();
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
const READ=new Set(['eth_chainId','eth_getBlockByNumber','eth_getCode','eth_getBalance','eth_gasPrice','eth_call','eth_getLogs','eth_getTransactionReceipt','eth_getTransactionByHash','rnk_getFilters']);
const plain=x=>JSON.parse(JSON.stringify(x,(_,v)=>typeof v==='bigint'?v.toString():v));
const digest=x=>'0x'+createHash('sha256').update(JSON.stringify(plain(x))).digest('hex');
const same=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.toLowerCase()===b.toLowerCase();
function check(ok,message){if(!ok){const e=Error(message);e.readerExpected=true;throw e;}}
function uint(v){check(typeof v==='string'&&/^(0x[0-9a-fA-F]+|[0-9]+)$/.test(v),'Malformed RPC integer');return BigInt(v);}
function hash(v){check(typeof v==='string'&&/^0x[0-9a-fA-F]{64}$/.test(v),'Malformed RPC hash');return v.toLowerCase();}
function rpc(provider){return async(method,args)=>{check(READ.has(method),'Reader refuses write RPC methods');return provider.send(method,args);};}
let artifacts;
function built(){return artifacts??=Object.fromEntries(['SettlioWorkLedger','SettlioEscrowV5','SettlioCallbackV5','SettlioReactiveV5'].map(n=>[n,compile(n)]));}
function header(raw){check(raw&&raw.number!=null,'Missing pinned block');return{number:uint(raw.number).toString(),hash:hash(raw.hash),timestamp:uint(raw.timestamp).toString()};}
function filterIndex(raw,identity,topics,ledgerTopic,cron,cronTopics){
 check(raw&&Object.hasOwn(raw,'TopicFilters')!==Object.hasOwn(raw,'topicFilters'),'Ambiguous filter index');
 check(!(Object.hasOwn(raw,'Version')&&Object.hasOwn(raw,'version')),'Ambiguous filter version');
 const filters=raw.TopicFilters??raw.topicFilters,version=raw.Version??raw.version;
 check(Array.isArray(filters)&&Number.isSafeInteger(version)&&version>=0,'Invalid filter index');
 const found=(chain,address,topic)=>filters.some(f=>{
  try{return BigInt(f.ChainId)===BigInt(chain)&&same(f.Contract,address)&&Array.isArray(f.Topics)&&f.Topics.length>0&&f.Topics.length<=4&&same(f.Topics[0],topic)&&f.Topics.slice(1).every(x=>x===null)&&Array.isArray(f.Configs)&&f.Configs.some(c=>c.Active===true&&same(c.Contract,identity.reactive));}catch{return false;}
 });
 for(const topic of topics)check(found(identity.baseChainId,identity.escrow,topic),'Required V5 escrow filter missing');
 check(found(identity.baseChainId,identity.workLedger,ledgerTopic),'Required V5 settlement filter missing');
 for(const topic of cronTopics)check(found(identity.sourceChainId,'0x0000000000000000000000000000000000ffffff',topic)===(topic===cron),'V5 timer filter differs from pinned state');
 return{version,requiredOriginFilters:topics.length+1};
}
async function collect({base,source,state,manifest,now,pageSize=2000,maxPages=1000}){
 try{const result=freeze(await collectChecked({base,source,state,manifest,now,pageSize,maxPages}));collectedReports.add(result);return result;}
 catch(e){if(e.readerExpected)throw e;const safe=Error('V5 read-only collection unavailable; no successful reconciliation produced');safe.readerExpected=true;throw safe;}
}
async function collectChecked({base,source,state,manifest,now,pageSize,maxPages}){
 accounting.validateState(state);check(Number.isSafeInteger(pageSize)&&pageSize>0&&pageSize<=2000&&Number.isSafeInteger(maxPages)&&maxPages>0&&maxPages<=1000,'Invalid history scan bounds');
 check(manifest&&Object.keys(manifest).sort().join(',')==='baseCreationHash,configuration,serviceRuntimeHashes,sourceCreationHash','Invalid public V5 manifest');
 const cfg=manifest.configuration;
 check(cfg&&Object.keys(cfg).sort().join(',')==='destinationConstructorWei,maxActive,maxRetries,retryInterval,sourceConstructorWei','Invalid constructor configuration');
 for(const value of Object.values(cfg))check(typeof value==='string'&&/^(0|[1-9][0-9]*)$/.test(value),'Invalid constructor value');
 const id=state.identity,p=state.profile,B=rpc(base),S=rpc(source),a=built();
 const ei=new Interface(a.SettlioEscrowV5.abi),ri=new Interface(a.SettlioReactiveV5.abi),ci=new Interface(a.SettlioCallbackV5.abi),gi=new Interface(a.SettlioWorkLedger.abi);
 const [bc,sc,bh,sh,bf,sf,filtersBefore]=await Promise.all([B('eth_chainId',[]),S('eth_chainId',[]),B('eth_getBlockByNumber',['latest',false]),S('eth_getBlockByNumber',['latest',false]),B('eth_getBlockByNumber',['finalized',false]),S('eth_getBlockByNumber',['finalized',false]),S('rnk_getFilters',[])]);
 check(uint(bc)===84532n&&uint(sc)===5318007n,'Wrong reader networks');
 const heads={base:header(bh),source:header(sh)},finalized={base:header(bf),source:header(sf)};
 for(const chain of ['base','source'])check(BigInt(finalized[chain].number)<=BigInt(heads[chain].number),'Unstable finalized checkpoint');
 const call=async(R,to,I,name,args=[],block)=>I.decodeFunctionResult(name,await R('eth_call',[{to,data:I.encodeFunctionData(name,args)},toQuantity(BigInt(block))]));
 const bcall=(to,I,name,args=[],block=heads.base.number)=>call(B,to,I,name,args,block),scall=(to,I,name,args=[],block=heads.source.number)=>call(S,to,I,name,args,block);
 const runtimeHashes={};
 for(const [name,address,artifact,R,block]of [['escrow',id.escrow,a.SettlioEscrowV5,B,heads.base.number],['receiver',id.receiver,a.SettlioCallbackV5,B,heads.base.number],['reactive',id.reactive,a.SettlioReactiveV5,S,heads.source.number],['workLedger',id.workLedger,a.SettlioWorkLedger,B,heads.base.number]]){
  runtimeHashes[name]=assertRuntime(await R('eth_getCode',[address,toQuantity(BigInt(block))]),artifact);
  check(same(runtimeHashes[name],p.runtimeHashes[name]),'Runtime hash differs from reviewed fee profile');
 }
 check(manifest.serviceRuntimeHashes&&Object.keys(manifest.serviceRuntimeHashes).sort().join(',')==='proxy,system','Missing service runtime review');
 for(const [name,address,R,block]of [['proxy',PROXY,B,heads.base.number],['system',SYSTEM,S,heads.source.number]]){
  const code=await R('eth_getCode',[address,toQuantity(BigInt(block))]);check(code&&code!=='0x'&&same(keccak256(code),manifest.serviceRuntimeHashes[name]),'Service runtime differs from reviewed manifest');
 }
 const wires=await Promise.all([bcall(id.escrow,ei,'POLICY_VERSION'),scall(id.reactive,ri,'POLICY_VERSION'),bcall(id.escrow,ei,'callbackReceiver'),bcall(id.escrow,ei,'admission'),bcall(id.receiver,ci,'escrow'),bcall(id.receiver,ci,'_SERVICE_PROVIDER'),bcall(id.receiver,ci,'_CALLBACK_SENDER'),scall(id.reactive,ri,'owner'),scall(id.reactive,ri,'originChain'),scall(id.reactive,ri,'originEscrow'),scall(id.reactive,ri,'callbackReceiver'),scall(id.reactive,ri,'workLedger'),scall(id.reactive,ri,'_SERVICE_PROVIDER'),bcall(id.workLedger,gi,'escrow'),bcall(id.workLedger,gi,'sponsor'),bcall(id.workLedger,gi,'maxWork'),bcall(id.workLedger,gi,'maxActive'),bcall(id.workLedger,gi,'maxHorizon'),scall(id.reactive,ri,'adaptiveTimers'),bcall(id.escrow,ei,'retryInterval'),bcall(id.escrow,ei,'maxRetries')]);
 const expected=[5n,5n,id.receiver,id.workLedger,id.escrow,PROXY,id.reactive,id.sponsor,84532n,id.escrow,id.receiver,id.workLedger,SYSTEM,id.escrow,id.sponsor,BigInt(p.maxWork),BigInt(cfg.maxActive),BigInt(p.maxHorizonSeconds),p.adaptiveTimers,BigInt(cfg.retryInterval),BigInt(cfg.maxRetries)];
 check(wires.every((v,i)=>typeof expected[i]==='string'?same(v[0],expected[i]):v[0]===expected[i]),'V5 immutable or configured wiring mismatch');
 const blocks=new Map(),receipts=new Map();
 async function canonicalBlock(chain,number){const key=chain+':'+number;if(!blocks.has(key)){const block=header(await (chain==='base'?B:S)('eth_getBlockByNumber',[toQuantity(BigInt(number)),false]));check(block.number===BigInt(number).toString(),'RPC returned the wrong block header number');blocks.set(key,block);}return blocks.get(key);}
 async function receipt(chain,txHash){
  const key=chain+':'+txHash.toLowerCase();if(receipts.has(key))return receipts.get(key);
  const R=chain==='base'?B:S;const [r,tx]=await Promise.all([R('eth_getTransactionReceipt',[txHash]),R('eth_getTransactionByHash',[txHash])]);
  check(r&&tx&&same(r.transactionHash,txHash)&&same(tx.hash,txHash)&&Array.isArray(r.logs),'Missing or substituted transaction receipt');
  check(uint(tx.chainId)===BigInt(chain==='base'?id.baseChainId:id.sourceChainId),'Transaction chain mismatch');
  const block=await canonicalBlock(chain,uint(r.blockNumber).toString());
  check(same(block.hash,r.blockHash)&&same(tx.blockHash,r.blockHash)&&uint(tx.blockNumber)===uint(r.blockNumber),'Noncanonical receipt block');
  check(uint(r.blockNumber)<=BigInt(finalized[chain].number),'Receipt is not finalized at this checkpoint');
  const result={receipt:r,transaction:tx,block};receipts.set(key,result);return result;
 }
 async function creation(chain,txHash,address,artifact,args,value){
  const v=await receipt(chain,txHash),tx=v.transaction,r=v.receipt;
  const request=await new ContractFactory(artifact.abi,artifact.evm.bytecode.object).getDeployTransaction(...args);
  check(uint(r.status)===1n&&same(r.contractAddress,address)&&tx.to===null&&same(tx.from,id.sponsor)&&same(tx.input??tx.data,request.data)&&uint(tx.value)===BigInt(value),'Creation receipt or constructor differs from source');
  return v.block;
 }
 const baseStart=await creation('base',manifest.baseCreationHash,id.receiver,a.SettlioCallbackV5,[PROXY,id.reactive,id.sponsor,p.maxWork,cfg.maxActive,p.maxHorizonSeconds,cfg.retryInterval,cfg.maxRetries],cfg.destinationConstructorWei);
 const sourceStart=await creation('source',manifest.sourceCreationHash,id.reactive,a.SettlioReactiveV5,[84532,p.adaptiveTimers],cfg.sourceConstructorWei);
 const originNames=['WorkRegistered','ClosureAcknowledgementRequested','DepositReceived','ConfirmationRequested','PolicyRegistered','PolicyRequested','CancellationRequested','BookingConfirmed','PolicyChecked','Refunded','QuoteExpired','Released'];
 const originTopics=originNames.map(n=>ei.getEvent(n).topicHash),settledTopic=gi.getEvent('Settled').topicHash;
 const cronTopics=await Promise.all(['CRON_TOPIC','CRON1000_TOPIC','CRON10000_TOPIC'].map(n=>scall(id.reactive,ri,n).then(v=>'0x'+v[0].toString(16).padStart(64,'0'))));
 const [currentCron,cronSubscribed,paused]=await Promise.all(['currentCronTopic','cronSubscribed','schedulerPaused'].map(n=>scall(id.reactive,ri,n).then(v=>v[0])));
 check(cronSubscribed===(currentCron!==0n)&&(!paused||currentCron===0n),'Inconsistent timer state');
 const cron=currentCron===0n?null:'0x'+currentCron.toString(16).padStart(64,'0');
 check(cron===null||cronTopics.includes(cron),'Unsupported current timer');const subscriptions=filterIndex(filtersBefore,id,originTopics,settledTopic,cron,cronTopics);
 async function logs(chain,from,address,topics){
  const R=chain==='base'?B:S,end=BigInt(finalized[chain].number),begin=BigInt(from),size=BigInt(pageSize);check(end>=begin,'Creation lies beyond finalized history');
  check((end-begin+size)/size<=BigInt(maxPages),'History exceeds bounded scan; no partial reconciliation');
  const result=[],seen=new Set();
  for(let start=begin;start<=end;start+=size){const stop=start+size-1n<end?start+size-1n:end;const page=await R('eth_getLogs',[{address,topics,fromBlock:toQuantity(start),toBlock:toQuantity(stop)}]);check(Array.isArray(page),'Malformed log page');
   for(const l of page){const n=uint(l.blockNumber);check(n>=start&&n<=stop&&!l.removed&&same(l.address,address)&&Array.isArray(l.topics),'Unexpected history log');
    const found=await receipt(chain,l.transactionHash);check(uint(found.receipt.status)===1n&&same(l.blockHash,found.block.hash),'Failed/noncanonical history receipt');
    const match=found.receipt.logs.find(x=>uint(x.logIndex??x.index)===uint(l.logIndex??l.index));
    check(match&&same(match.address,l.address)&&same(match.data,l.data)&&JSON.stringify(match.topics.map(x=>x.toLowerCase()))===JSON.stringify(l.topics.map(x=>x.toLowerCase())),'Log not present in canonical receipt');
    const key=l.transactionHash.toLowerCase()+':'+uint(l.logIndex??l.index);check(!seen.has(key),'Duplicate history log');seen.add(key);result.push(l);
   }
  }
  return result.sort((a,b)=>Number(uint(a.blockNumber)-uint(b.blockNumber))||Number(uint(a.transactionIndex)-uint(b.transactionIndex))||Number(uint(a.logIndex??a.index)-uint(b.logIndex??b.index)));
 }
 const ledgerLogs=await logs('base',baseStart.number,id.workLedger,[]),originLogs=await logs('base',baseStart.number,id.escrow,[originTopics]);
 const grants=[],jobs=new Map();let open=false;
 for(const l of ledgerLogs){const e=gi.parseLog(l),v=e.args;const eventEvidence={identity:id,base:await canonicalBlock('base',uint(l.blockNumber).toString()),source:finalized.source,evidenceHash:digest({chain:id.baseChainId,log:l})};
  if(e.name==='OpenChanged'){open=v.open;continue;}
  if(e.name==='GrantSet'){
   for(const old of grants.filter(g=>same(g.merchant,v.merchant))){check(BigInt(old.epoch)<v.epoch,'Nonmonotonic grant history');old.remaining='0';}
   grants.push({merchant:v.merchant.toLowerCase(),epoch:v.epoch.toString(),credits:v.credits.toString(),remaining:v.credits.toString(),expiresAt:v.expires.toString(),profileHash:v.profile,transactionHash:l.transactionHash,evidence:eventEvidence});continue;
  }
  if(e.name==='GrantExpired'){const g=grants.find(g=>same(g.merchant,v.merchant)&&BigInt(g.epoch)===v.epoch);check(g&&BigInt(g.remaining)===v.unused,'Grant expiry history mismatch');g.remaining='0';continue;}
  const q=v.id.toString();
  if(e.name==='Admitted'){
   check(!jobs.has(q),'Duplicate admitted quote');const g=grants.find(g=>same(g.merchant,v.merchant)&&BigInt(g.epoch)===v.epoch);
   check(g&&BigInt(g.remaining)>0n&&same(g.profileHash,v.profile),'Admission has no matching grant');g.remaining=(BigInt(g.remaining)-1n).toString();
   jobs.set(q,{quoteId:q,merchant:v.merchant.toLowerCase(),epoch:v.epoch.toString(),profileHash:v.profile,terminal:false,acknowledged:false,settled:false,admissionEvidence:eventEvidence,settlementEvidence:null,acknowledgementTransaction:null});continue;
  }
  const job=jobs.get(q);check(job,'Terminal event without admission history');
  if(e.name==='DestinationClosed'){check(!job.terminal,'Repeated terminal event');job.terminal=true;}
  else if(e.name==='SourceAcknowledged'){check(!job.acknowledged,'Repeated source acknowledgement');job.acknowledged=true;job.acknowledgementTransaction=l.transactionHash;}
  else if(e.name==='Settled'){check(job.terminal&&job.acknowledged&&!job.settled,'Invalid settlement history');job.settled=true;job.settlementEvidence=eventEvidence;}
  else check(false,'Unsupported ledger event');
 }
 const finalizedBase=finalized.base.number,finalizedSource=finalized.source.number;
 const [admitted,reserved,active,unsettled,onchainOpen,quoteCount]=await Promise.all([bcall(id.workLedger,gi,'totalAdmitted',[],finalizedBase),bcall(id.workLedger,gi,'reserved',[],finalizedBase),bcall(id.workLedger,gi,'active',[],finalizedBase),bcall(id.workLedger,gi,'unsettled',[],finalizedBase),bcall(id.workLedger,gi,'open',[],finalizedBase),bcall(id.escrow,ei,'quoteCount',[],finalizedBase)]).then(a=>a.map(v=>v[0]));
 check(admitted===BigInt(jobs.size)&&quoteCount===admitted&&active===BigInt([...jobs.values()].filter(j=>!j.terminal).length)&&unsettled===BigInt([...jobs.values()].filter(j=>!j.settled).length)&&reserved===grants.reduce((n,g)=>n+BigInt(g.remaining),0n)&&open===onchainOpen,'Incomplete ledger history or counter mismatch');
 for(let n=1n;n<=quoteCount;n++)check(jobs.has(n.toString()),'Quote history has gaps');
 for(const merchant of new Set(grants.map(g=>g.merchant))){const g=grants.filter(g=>g.merchant===merchant).at(-1),live=await bcall(id.workLedger,gi,'grants',[merchant],finalizedBase);check(live[0]===BigInt(g.remaining)&&live[1]===BigInt(g.expiresAt)&&live[2]===BigInt(g.epoch)&&same(live[3],g.profileHash),'Grant view differs from history');const latest=await bcall(id.workLedger,gi,'grants',[merchant]);check(live.every((v,n)=>typeof v==='string'?same(v,latest[n]):v===latest[n]),'Latest grant changes are not finalized');}
 const latestCounters=await Promise.all(['totalAdmitted','reserved','active','unsettled'].map(n=>bcall(id.workLedger,gi,n).then(v=>v[0])));
 check(latestCounters.every((v,n)=>v===[admitted,reserved,active,unsettled][n]),'Latest ledger changes are not finalized; reconciliation is incomplete');
 const backlog=new Map([...jobs.keys()].map(q=>[q,0]));
 for(const l of originLogs.concat(ledgerLogs.filter(l=>same(l.topics[0],settledTopic)))){
  const q=uint(l.topics[1]).toString();check(jobs.has(q),'Origin event without admitted quote');
  const originKey=keccak256(coder.encode(['uint256','uint256','uint256','uint256'],[84532,uint(l.blockHash),uint(l.transactionHash),uint(l.logIndex??l.index)]));
  if(!(await scall(id.reactive,ri,'processed',[originKey],finalizedSource))[0])backlog.set(q,backlog.get(q)+1);
 }
 const acceptedTopics=['ConfirmationCallbackRequested','PolicyCallbackRequested','ClosureCallbackRequested'].map(n=>ri.getEvent(n).topicHash);
 const acceptedLogs=await logs('source',sourceStart.number,id.reactive,[acceptedTopics]);
 const callbackLogs=await logs('source',sourceStart.number,SYSTEM,[systemI.getEvent('CallbackRequest').topicHash,null,zeroPadValue(id.reactive,32),zeroPadValue(id.receiver,32)]);
 const callbackGas=(await scall(id.reactive,ri,'CALLBACK_GAS_LIMIT'))[0];
 const pending=new Map([...jobs.keys()].map(q=>[q,0])),requests=[],usedDeliveries=new Set(),successfulClosure=new Set();
 check(acceptedLogs.length===callbackLogs.length,'Accepted-request history is incomplete');
 for(const l of acceptedLogs)check(callbackLogs.some(c=>same(c.transactionHash,l.transactionHash)),'Accepted request is absent from system history');
 const requestTransactions=[...new Set(callbackLogs.map(l=>l.transactionHash.toLowerCase()))];
 for(const requestHash of requestTransactions){
  const r=await receipt('source',requestHash);
  const all=r.receipt.logs.filter(l=>same(l.address,SYSTEM)&&same(l.topics[0],systemI.getEvent('CallbackRequest').topicHash));
  const reports=(await scall(SYSTEM,feeI,'getCallbacks',[BigInt(requestHash)],finalizedSource))[0];
  for(const report of reports)check(same(report[1],id.reactive)&&report[3]===84532n&&report[2]<BigInt(all.length),'Unsupported or mismatched callback report');
  for(let index=0;index<all.length;index++){
   const ev=systemI.parseLog(all[index]).args,configuration=coder.decode([CONFIG],ev.configuration)[0];
   check(configuration.gasLimit===callbackGas&&ev.chainId===84532n&&same(ev.sender,id.reactive)&&same(ev.recipient,id.receiver)&&ev.version===0n&&configuration.chainId===84532n&&same(configuration.recipient,id.receiver),'Mixed or unsupported callback request envelope');
   const payload=ci.parseTransaction({data:configuration.payload});check(payload&&['confirmBooking','processPolicy','acknowledgeClosure'].includes(payload.name)&&same(payload.args[0],ZeroAddress),'Unsupported callback payload');
   check(acceptedLogs.some(l=>same(l.transactionHash,requestHash)&&ri.parseLog(l).args.quoteId===(payload.name==='acknowledgeClosure'?payload.args[3]:payload.args[1])),'Request lacks matching application event');
   const q=(payload.name==='acknowledgeClosure'?payload.args[3]:payload.args[1]).toString(),job=jobs.get(q);check(job,'Request refers to an unknown admitted quote');
   if(payload.name==='acknowledgeClosure')check(payload.args[1]===84532n&&same(payload.args[2],id.escrow)&&payload.args[4]===BigInt(job.epoch)&&same(payload.args[5],job.profileHash),'Closure request identity mismatch');
   const matches=reports.filter(v=>v[2]===BigInt(index)),deliveries=[];
   if(matches.length===0)pending.set(q,pending.get(q)+1);
   for(const report of matches){
    if(report[4]===0n){pending.set(q,pending.get(q)+1);continue;}
    const deliveryHash='0x'+report[4].toString(16).padStart(64,'0');check(!usedDeliveries.has(deliveryHash),'Delivery report reused across requests');usedDeliveries.add(deliveryHash);
    const delivered=await receipt('base',deliveryHash),tx=delivered.transaction;
    check(same(tx.to,PROXY)&&uint(tx.value)===0n,'Delivery did not use the expected proxy');
    const [version,bytes]=proxyI.decodeFunctionData('deliverCallback',tx.input??tx.data),actual=coder.decode([CONFIG],bytes)[0];
    const args=[...payload.args];args[0]=id.reactive;
    check(version===0n&&actual.chainId===84532n&&same(actual.recipient,id.receiver)&&actual.gasLimit===configuration.gasLimit&&same(actual.payload,ci.encodeFunctionData(payload.name,args)),'Reported delivery payload differs from source request');
    check(report[5]!=='0x'||uint(delivered.receipt.status)===1n,'Successful report points to a failed transaction');
    if(payload.name==='acknowledgeClosure'&&report[5]==='0x')successfulClosure.add(q+':'+deliveryHash);
    deliveries.push({transactionHash:deliveryHash,block:delivered.block,status:uint(delivered.receipt.status).toString(),reportError:report[5],reportBlockMetadata:report[0].toString()});
   }
   requests.push({requestHash,index,quoteId:q,method:payload.name,reports:matches.length,deliveries});
  }
 }
 for(const job of jobs.values()){
  const [gateJob,quote,closure]=await Promise.all([bcall(id.workLedger,gi,'jobs',[job.quoteId],finalizedBase),bcall(id.escrow,ei,'getQuote',[job.quoteId],finalizedBase),scall(id.reactive,ri,'closures',[job.quoteId],finalizedSource)]);
  check(same(gateJob[0],job.merchant)&&gateJob[1]===BigInt(job.epoch)&&same(gateJob[2],job.profileHash)&&gateJob[3]===job.terminal&&gateJob[4]===job.acknowledged&&gateJob[5]===job.settled,'Job view differs from ledger history');
  const q=quote[0];check(same(q.merchant,job.merchant)&&[5n,6n,7n].includes(q.status)===job.terminal,'Quote terminal state differs from ledger');
  job.expiresAt=q.expiresAt.toString();job.refundCutoff=q.refundCutoff.toString();job.originBacklog=backlog.get(job.quoteId).toString();job.pendingDeliveries=pending.get(job.quoteId).toString();
  check(!job.settled || job.pendingDeliveries!=='0' || successfulClosure.has(job.quoteId+':'+job.acknowledgementTransaction.toLowerCase()),'Settled job lacks a matching authenticated delivery report');
  job.sourceSettled=closure.settled;job.reconciled=job.settled&&closure.settled&&job.originBacklog==='0'&&job.pendingDeliveries==='0';
 }
 const [sourceFees,destinationFees]=await Promise.all([[S,SYSTEM,id.reactive,heads.source.number],[B,PROXY,id.receiver,heads.base.number]].map(async([R,to,payer,block])=>{
  const [reserves,debt,coefficient,surcharge,gasPrice]=await Promise.all([call(R,to,feeI,'reserves',[payer],block),call(R,to,feeI,'debt',[payer],block),call(R,to,feeI,'_gasPriceCoeffPer1000',[],block),call(R,to,feeI,'_extraGas',[],block),R('eth_gasPrice',[])]);
  const head=R===S?sh:bh,price=uint(gasPrice)>uint(head.baseFeePerGas??'0x0')?uint(gasPrice):uint(head.baseFeePerGas??'0x0');
  return{payer,reservesWei:reserves[0].toString(),debtWei:debt[0].toString(),gasPriceWei:price.toString(),coefficient:coefficient[0].toString(),surcharge:surcharge[0].toString()};
 }));
 destinationFees.balanceWei=uint(await B('eth_getBalance',[id.receiver,toQuantity(BigInt(heads.base.number))])).toString();
 const filtersAfter=await S('rnk_getFilters',[]);check(digest(filtersBefore)===digest(filtersAfter),'Filter index changed during collection');
 for(const [chain,R]of [['base',B],['source',S]])for(const point of [heads[chain],finalized[chain]])check(same(header(await R('eth_getBlockByNumber',[toQuantity(BigInt(point.number)),false])).hash,point.hash),'Checkpoint changed during collection');
 const observedAt=now??Math.floor(Date.now()/1000);
 const snapshot={identity:id,observedAt:String(observedAt),base:heads.base,source:heads.source,runtimeHashes,configuration:{maxHorizonSeconds:p.maxHorizonSeconds,maxWork:p.maxWork,adaptiveTimers:p.adaptiveTimers},sourceFees,destinationFees,evidenceHash:digest({heads,finalized,runtimeHashes,sourceFees,destinationFees,subscriptions})};
 accounting.observe(state,snapshot,observedAt); // Validate freshness/schema without changing the caller's state.
 return plain({readOnly:true,canGrant:false,profileHash:state.profileHash,manifestHash:digest(manifest),scope:'RPC-backed pinned/finalized-prefix V5 reconciliation; trusted RPC completeness, not a light-client proof',snapshot,finalized,subscriptions,grants,jobs:[...jobs.values()],requests,history:{ledgerLogs:ledgerLogs.length,originLogs:originLogs.length,callbackRequests:callbackLogs.length},limits:['No journal writes, signing or grant authorization.','Empty callback reports remain pending; unsupported report schemas or delivery envelopes stop collection.','Native report index/codec compatibility and live coarse timer shape still require public validation.','This reader relies on honest RPC data and its finalized tag; it is not a consensus proof.']});
}
function reconciliationCommands(state,report){
 accounting.validateState(state);check(collectedReports.has(report),'Reconciliation requires an original immutable reader result');check(report?.readOnly===true&&report.canGrant===false&&report.profileHash===state.profileHash&&Object.keys(state.identity).every(k=>report.snapshot.identity[k]===state.identity[k]),'Invalid reader report identity');
 const commands=[{type:'observe',payload:report.snapshot}],idFor=new Map();
 for(const intent of state.intents){const grant=report.grants.find(g=>g.merchant===intent.merchant&&g.epoch===intent.epoch);if(!grant)continue;
  check(grant.credits===intent.credits&&grant.expiresAt===intent.expiresAt&&same(grant.profileHash,state.profileHash),'Observed grant differs from saved intent');
  idFor.set(intent.merchant+':'+intent.epoch,intent.id);
  commands.push({type:'confirm',payload:{id:intent.id,confirmation:{transactionHash:grant.transactionHash,merchant:grant.merchant,epoch:grant.epoch,credits:grant.credits,expiresAt:grant.expiresAt,profileHash:grant.profileHash,evidence:grant.evidence}}});
 }
 for(const grant of report.grants)check(idFor.has(grant.merchant+':'+grant.epoch),'Observed grant has no reserved local intent');
 for(const job of report.jobs){const id=idFor.get(job.merchant+':'+job.epoch);check(id,'Observed admission has no reserved local intent');
  commands.push({type:'admit',payload:{id,admission:{quoteId:job.quoteId,merchant:job.merchant,epoch:job.epoch,profileHash:job.profileHash,expiresAt:job.expiresAt,refundCutoff:job.refundCutoff,evidence:job.admissionEvidence}}});
  if(job.terminal)commands.push({type:'terminal',payload:{quoteId:job.quoteId}});
  if(job.reconciled)commands.push({type:'settle',payload:{quoteId:job.quoteId,closure:{quoteId:job.quoteId,epoch:job.epoch,profileHash:job.profileHash,ledgerSettled:true,sourceSettled:true,pendingDeliveries:'0',originBacklog:'0',evidence:{...job.settlementEvidence,base:report.finalized.base,source:report.finalized.source}}}});
 }
 for(const intent of state.intents){const grant=report.grants.find(g=>g.merchant===intent.merchant&&g.epoch===intent.epoch);if(!grant||grant.remaining!=='0')continue;
  const latest=report.grants.filter(g=>g.merchant===intent.merchant).at(-1);
  commands.push({type:'releaseUnused',payload:{id:intent.id,reconciliation:{merchant:intent.merchant,intentEpoch:intent.epoch,ledgerEpoch:latest.epoch,remaining:'0',admittedQuoteIds:report.jobs.filter(j=>j.merchant===intent.merchant&&j.epoch===intent.epoch).map(j=>j.quoteId),evidence:{...grant.evidence,base:report.finalized.base,source:report.finalized.source}}}});
 }
 return commands;
}
module.exports={collect,reconciliationCommands,SYSTEM,PROXY};
