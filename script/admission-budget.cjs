// Read-only initial V4 sponsorship planner. No wallet, signing, writes or broadcasts.
const fs=require('node:fs');
const {Interface,getAddress,keccak256,toUtf8Bytes,toQuantity}=require('ethers');
const compile=require('./compile-admission.cjs');
const {assertRuntime}=require('./m2-code.cjs');
const {assertFilters}=require('./m2-state.cjs');
const {rpc,SYSTEM,PROXY,CRON,CRON_TOPIC}=require('./m2-network.cjs');
const {isCron100}=require('./cron-event.cjs');
function check(ok,message){if(!ok){const error=Error(message);error.admissionBudget=true;throw error;}}
const same=(a,b)=>getAddress(a)===getAddress(b),ceil=(a,b)=>(a+b-1n)/b;
const json=value=>JSON.stringify(value,(_,v)=>typeof v==='bigint'?v.toString():v);
let compiled;
function artifacts(){return compiled??=Object.fromEntries(['SettlioEscrowV4','SettlioCallbackV4','SettlioReactiveV4','SettlioAdmission'].map(name=>[name,compile(name)]));}
const feeI=new Interface(['function debt(address) view returns(uint256)','function reserves(address) view returns(uint256)','function _gasPriceCoeffPer1000() view returns(uint256)','function _extraGas() view returns(uint256)']);
function identity(value){
 check(value&&Object.keys(value).length===6&&['policyVersion','escrow','callback','reactive','admission','sponsor'].every(k=>Object.hasOwn(value,k))&&value.policyVersion===4,'Supply only the six public V4 identity fields; V3 journals are not accepted.');
 const result={policyVersion:4};for(const name of ['escrow','callback','reactive','admission','sponsor'])result[name]=getAddress(value[name]);
 check(new Set(['escrow','callback','admission','sponsor'].map(k=>result[k])).size===4&&Object.values(result).slice(1).every(a=>BigInt(a)!==0n),'V4 addresses must be nonzero; Base escrow, callback, admission and sponsor must be distinct.');return result;
}
function calculate(observation,proposal,now=BigInt(Math.floor(Date.now()/1000))){
 const o=observation,id=identity(o.identity);const merchant=getAddress(proposal.merchant),credits=BigInt(proposal.credits),validSeconds=BigInt(proposal.validSeconds??300);
 check(BigInt(merchant)!==0n&&credits>0n,'A nonzero merchant and positive credit count are required.');
 check(o.baseChain===84532n&&o.lasnaChain===5318007n,'Wrong budget networks.');
 check(now>=o.observedAt&&now-o.observedAt<=120n,'Funding observation is stale or from the future.');
 for(const timestamp of [o.baseTimestamp,o.lasnaTimestamp])check(now-timestamp<=180n&&timestamp-now<=60n,'RPC head is stale or clock is inconsistent.');
 check(o.open===false&&o.admitted===0n&&o.reserved===0n&&o.active===0n&&o.quoteCount===0n&&o.activeJobs===0n&&o.cronActive===false&&o.paused===false,'Planner supports only a fresh, closed, empty V4 deployment; incremental grants require separate accounting.');
 check(o.subscriptions?.originSubscriptions===10&&o.subscriptions.cronActive===false&&Number.isSafeInteger(o.subscriptions.filterVersion)&&o.subscriptions.filterVersion>=0,'Active origin subscriptions must be verified before sponsorship.');
 check(o.reactiveDebt===0n&&o.callbackDebt===0n,'Fee debt must be cleared before sponsorship.');
 check(o.maxActive>0n&&o.maxLifetime>=o.maxActive&&o.maxHorizon>0n&&o.maxRetries>0n&&o.retryInterval>0n&&credits<=o.maxActive&&credits<=o.maxLifetime,'Invalid admission limits or requested capacity.');
 check(validSeconds>=30n&&validSeconds<=600n&&validSeconds<=o.maxHorizon,'Grant validity must be 30–600 seconds and within the configured horizon.');
 check(o.baseTimestamp+validSeconds>now+15n,'Grant window is already too short; refresh the observation.');
 check(o.maxAttempts===6n&&o.sourceRetrySeconds===60n&&o.callbackGas===1000000n&&o.maxRequests===2n&&o.maxScans===8n,'Unknown scheduler configuration; review the model.');
 check(o.cronTimes.length>=3,'Recent indexed CRON observations required.');
 const intervals=o.cronTimes.slice(1).map((v,i)=>v-o.cronTimes[i]);check(intervals.every(v=>v>0n),'CRON timestamps must increase.');
 check(o.lasnaTimestamp-o.cronTimes.at(-1)<=300n&&o.cronTimes.at(-1)<=o.lasnaTimestamp,'Recent CRON is stale or invalid.');
 const tick=intervals.reduce((a,b)=>a<b?a:b)/2n;check(tick>0n,'CRON cadence cannot be modeled.');
 for(const name of ['reactivePrice','callbackPrice','reactiveCoeff','callbackCoeff'])check(typeof o[name]==='bigint'&&o[name]>0n,'Missing positive fee parameter.');
 for(const name of ['reactiveExtra','callbackExtra','reactiveReserves','callbackReserves','callbackBalance'])check(typeof o[name]==='bigint'&&o[name]>=0n,'Invalid fee balance or surcharge.');
 // First confirmation and first cancellation can each reset source attempts, as can each policy retry.
 const batches=o.maxRetries+3n;
 const policyCallbacks=batches*o.maxAttempts;
 const callbacksPerQuote=policyCallbacks+1n+o.maxRetries;
 const originCallsPerQuote=8n+2n*o.maxRetries+2n*callbacksPerQuote;
 const backoff=o.sourceRetrySeconds*o.maxAttempts*(o.maxAttempts+1n)/2n;
 const serviceWindow=o.maxHorizon+900n+batches*backoff;
 // Cover the entire immutable lifetime allowance, not only today's proposed credits.
 const drainTicks=ceil(o.maxLifetime*callbacksPerQuote,o.maxRequests)+ceil(o.maxLifetime*batches,o.maxScans);
 const cronCalls=o.maxLifetime*ceil(serviceWindow,tick)+drainTicks;
 const sourceCalls=cronCalls+o.maxLifetime*originCallsPerQuote;
 const sourceUnit=ceil(2n*o.reactivePrice*o.reactiveCoeff*(900000n+o.reactiveExtra),1000n);
 const destinationUnit=ceil(2n*o.callbackPrice*o.callbackCoeff*(o.callbackGas+o.callbackExtra),1000n);
 const sourceRequired=sourceCalls*sourceUnit,destinationRequired=o.maxLifetime*callbacksPerQuote*destinationUnit;
 const destinationAvailable=o.callbackReserves+o.callbackBalance;
 const reference=keccak256(toUtf8Bytes(json({identity:id,observation:o,proposal:{merchant,credits,validSeconds}})));
 return {readOnly:true,scope:'conditional initial finite V4 sponsorship budget',identity:id,merchant,credits:credits.toString(),validUntil:(o.baseTimestamp+validSeconds).toString(),fundingObservation:reference,lifetimeQuotesBudgeted:o.maxLifetime.toString(),attemptBatchesPerQuote:batches.toString(),callbacksPerQuote:callbacksPerQuote.toString(),sourceCallAllowance:sourceCalls.toString(),reactiveRequiredWei:sourceRequired.toString(),reactiveAvailableWei:o.reactiveReserves.toString(),callbackRequiredWei:destinationRequired.toString(),callbackAvailableWei:destinationAvailable.toString(),canGrant:o.reactiveReserves>=sourceRequired&&destinationAvailable>=destinationRequired,limits:['Read-only initial-deployment planner. It does not issue credits or open admission.','Sponsor attestation, not a cross-chain reserve proof or guaranteed future delivery.','Conditional model: double sampled cadence/prices, present fee parameters, finite lifetime work, six-attempt batches, 15-minute delivery margin. Longer delays, rate/fee changes, traffic or unsafe sponsor actions invalidate it.','Source balance and all customer deposits are excluded. Incremental grants are deliberately refused.','Recheck identity, empty/closed state, debt, reserves, price and observation freshness immediately before any future grant transaction.']};
}
async function observe(base,lasna,input,clock=()=>BigInt(Math.floor(Date.now()/1000))){
 const id=identity(input),baseHead=await base.send('eth_getBlockByNumber',['latest',false]),lasnaHead=await lasna.send('eth_getBlockByNumber',['latest',false]);
 check(baseHead&&lasnaHead,'RPC heads unavailable.');
 const built=artifacts(),bi=new Interface(built.SettlioEscrowV4.abi),ci=new Interface(built.SettlioCallbackV4.abi),ri=new Interface(built.SettlioReactiveV4.abi),gi=new Interface(built.SettlioAdmission.abi);
 const call=async(provider,to,iface,name,args=[],block)=>iface.decodeFunctionResult(name,await provider.send('eth_call',[{to,data:iface.encodeFunctionData(name,args)},block]))[0];
 const B=(to,iface,name,args=[])=>call(base,to,iface,name,args,baseHead.number),L=(to,iface,name,args=[])=>call(lasna,to,iface,name,args,lasnaHead.number);
 for(const [provider,address,name,block] of [[base,id.escrow,'SettlioEscrowV4',baseHead.number],[base,id.callback,'SettlioCallbackV4',baseHead.number],[base,id.admission,'SettlioAdmission',baseHead.number],[lasna,id.reactive,'SettlioReactiveV4',lasnaHead.number]])assertRuntime(await provider.send('eth_getCode',[address,block]),built[name]);
 const wiring=await Promise.all([B(id.escrow,bi,'POLICY_VERSION'),L(id.reactive,ri,'POLICY_VERSION'),B(id.escrow,bi,'callbackReceiver'),B(id.escrow,bi,'admission'),B(id.callback,ci,'escrow'),B(id.callback,ci,'_SERVICE_PROVIDER'),B(id.callback,ci,'_CALLBACK_SENDER'),L(id.reactive,ri,'originChain'),L(id.reactive,ri,'originEscrow'),L(id.reactive,ri,'callbackReceiver'),L(id.reactive,ri,'_SERVICE_PROVIDER'),B(id.admission,gi,'escrow'),B(id.admission,gi,'sponsor')]);
 check(wiring[0]===4n&&wiring[1]===4n&&same(wiring[2],id.callback)&&same(wiring[3],id.admission)&&same(wiring[4],id.escrow)&&same(wiring[5],PROXY)&&same(wiring[6],id.reactive)&&wiring[7]===84532n&&same(wiring[8],id.escrow)&&same(wiring[9],id.callback)&&same(wiring[10],SYSTEM)&&same(wiring[11],id.escrow)&&same(wiring[12],id.sponsor),'V4 immutable wiring/version mismatch.');
 const getters={open:()=>B(id.admission,gi,'open'),active:()=>B(id.admission,gi,'active'),reserved:()=>B(id.admission,gi,'reserved'),admitted:()=>B(id.admission,gi,'admitted'),maxActive:()=>B(id.admission,gi,'maxActive'),maxLifetime:()=>B(id.admission,gi,'maxLifetimeAdmissions'),maxHorizon:()=>B(id.admission,gi,'maxHorizon'),maxRetries:()=>B(id.admission,gi,'maxRetries'),retryInterval:()=>B(id.admission,gi,'retryInterval'),quoteCount:()=>B(id.escrow,bi,'quoteCount'),activeJobs:()=>L(id.reactive,ri,'activeJobCount'),cronActive:()=>L(id.reactive,ri,'cronSubscribed'),paused:()=>L(id.reactive,ri,'schedulerPaused'),maxAttempts:()=>L(id.reactive,ri,'MAX_ATTEMPTS'),sourceRetrySeconds:()=>L(id.reactive,ri,'RETRY_SECONDS'),callbackGas:()=>L(id.reactive,ri,'CALLBACK_GAS_LIMIT'),maxRequests:()=>L(id.reactive,ri,'MAX_REQUESTS'),maxScans:()=>L(id.reactive,ri,'MAX_SCANS'),reactiveDebt:()=>L(SYSTEM,feeI,'debt',[id.reactive]),reactiveReserves:()=>L(SYSTEM,feeI,'reserves',[id.reactive]),reactiveCoeff:()=>L(SYSTEM,feeI,'_gasPriceCoeffPer1000'),reactiveExtra:()=>L(SYSTEM,feeI,'_extraGas'),callbackDebt:()=>B(PROXY,feeI,'debt',[id.callback]),callbackReserves:()=>B(PROXY,feeI,'reserves',[id.callback]),callbackCoeff:()=>B(PROXY,feeI,'_gasPriceCoeffPer1000'),callbackExtra:()=>B(PROXY,feeI,'_extraGas')};
 const topicNames=['DEPOSIT_TOPIC','RETRY_TOPIC','POLICY_TOPIC','POLICY_RETRY_TOPIC','CANCEL_TOPIC','CONFIRMED_TOPIC','CHECKED_TOPIC','REFUNDED_TOPIC','EXPIRED_TOPIC','RELEASED_TOPIC'];
 const topics=await Promise.all(topicNames.map(name=>L(id.reactive,ri,name).then(value=>'0x'+value.toString(16).padStart(64,'0'))));
 const subscriptions=assertFilters(await lasna.send('rnk_getFilters',[]),{reactive:id.reactive,escrow:id.escrow,topics,cronSource:CRON,cronTopic:CRON_TOPIC,cronExpected:false});
 const values=Object.fromEntries(await Promise.all(Object.entries(getters).map(async([key,read])=>[key,await read()])));
 const logs=(await lasna.send('eth_getLogs',[{address:CRON,topics:[CRON_TOPIC],fromBlock:toQuantity(BigInt(lasnaHead.number)>2000n?BigInt(lasnaHead.number)-2000n:0n),toBlock:lasnaHead.number}])).filter(isCron100).sort((a,b)=>Number(BigInt(a.blockNumber)-BigInt(b.blockNumber))).slice(-4);
 const cronTimes=await Promise.all(logs.map(async log=>{const block=await lasna.send('eth_getBlockByNumber',[log.blockNumber,false]);check(block&&block.hash.toLowerCase()===log.blockHash.toLowerCase(),'CRON block mismatch.');return BigInt(block.timestamp);}));
 const [baseChain,lasnaChain,callbackBalance,sourcePrice,destinationPrice,baseAgain,lasnaAgain]=await Promise.all([base.send('eth_chainId',[]),lasna.send('eth_chainId',[]),base.send('eth_getBalance',[id.callback,baseHead.number]),lasna.send('eth_gasPrice',[]),base.send('eth_gasPrice',[]),base.send('eth_getBlockByNumber',[baseHead.number,false]),lasna.send('eth_getBlockByNumber',[lasnaHead.number,false])]);
 check(baseAgain?.hash===baseHead.hash&&lasnaAgain?.hash===lasnaHead.hash,'Observation blocks changed.');
 const maximum=(a,b)=>BigInt(a)>BigInt(b)?BigInt(a):BigInt(b);
 return {identity:id,...values,subscriptions,observedAt:clock(),baseChain:BigInt(baseChain),lasnaChain:BigInt(lasnaChain),baseBlock:baseHead.number,baseHash:baseHead.hash,baseTimestamp:BigInt(baseHead.timestamp),lasnaBlock:lasnaHead.number,lasnaHash:lasnaHead.hash,lasnaTimestamp:BigInt(lasnaHead.timestamp),callbackBalance:BigInt(callbackBalance),reactivePrice:maximum(sourcePrice,lasnaHead.baseFeePerGas||0),callbackPrice:maximum(destinationPrice,baseHead.baseFeePerGas||0),cronTimes,cronLogs:logs};
}
async function main(){const [file,merchant,credits,seconds='300']=process.argv.slice(2);check(file&&merchant&&/^[1-9]\d*$/.test(credits||'')&&/^\d+$/.test(seconds),'Usage: npm run plan:admission -- PUBLIC_V4_IDENTITY_JSON MERCHANT CREDITS [VALID_SECONDS]');const input=identity(JSON.parse(fs.readFileSync(file,'utf8'))),base=rpc(process.env.BASE_SEPOLIA_RPC||'https://sepolia.base.org'),lasna=rpc(process.env.LASNA_RPC||'https://lasna-rpc.rnk.dev');try{const observation=await observe(base,lasna,input);console.log(json({result:calculate(observation,{merchant,credits:BigInt(credits),validSeconds:BigInt(seconds)}),observation}));}finally{base.destroy();lasna.destroy();}}
if(require.main===module)main().catch(e=>{console.error(e.admissionBudget?e.message:'V4 funding observation unavailable. No grant or transaction was sent.');process.exitCode=1;});
module.exports={identity,calculate,observe};
