// Read-only planning for one isolated, short automatic-release test. No signer or writes.
const {Interface}=require('ethers');
const {rpc,SYSTEM,PROXY,CRON,CRON_TOPIC}=require('./m2-network.cjs');
const {isCron100}=require('./cron-event.cjs');
const {check}=require('./m2-state.cjs');
const R='0xa2DBeB94c0a151e071A6c29999FE1c6B38217b85',C='0x1E44e729A2f2Fa2e64C1eDb9904A2eCD90C8A781';
const I=new Interface(['function debt(address) view returns(uint256)','function reserves(address) view returns(uint256)','function _gasPriceCoeffPer1000() view returns(uint256)','function _extraGas() view returns(uint256)','function activeJobCount() view returns(uint256)','function schedulerPaused() view returns(bool)','function cronSubscribed() view returns(bool)']);
const ceil=(a,b)=>(a+b-1n)/b;
function calculate(o,minutes=30) {
 check(Number.isInteger(minutes)&&minutes>=10&&minutes<=30,'Test horizon must be 10–30 minutes from quote creation to refund cutoff.');
 check(BigInt(o.baseChain)===84532n&&BigInt(o.lasnaChain)===5318007n,'Wrong budget RPC networks.');
 check(o.activeJobs===0n&&!o.paused&&!o.cronActive,'Budget requires an idle unpaused M2 scheduler; do not add concurrent jobs.');
 check(o.reactiveDebt===0n&&o.callbackDebt===0n,'Clear source/destination fee debt before test admission.');
 check(o.cronTimes.length>=3,'At least three genuine recent CRON100 timestamps required.');
 const intervals=o.cronTimes.slice(1).map((t,i)=>BigInt(t)-BigInt(o.cronTimes[i]));
 check(intervals.every(n=>n>0n),'CRON timestamps are not increasing.');
 const minimum=intervals.reduce((a,b)=>a<b?a:b);
 // Model twice the fastest sampled CRON cadence and twice current fee rates.
 const modeledTickSeconds=minimum/2n;check(modeledTickSeconds>0n,'CRON cadence cannot be modeled.');
 const windowSeconds=BigInt(minutes*60+900); // fixed 15-minute delivery margin, no exact-latency promise
 const ticks=ceil(windowSeconds,modeledTickSeconds);
 const eventAllowance=16n; // creation, deposit, acknowledgements, participant recovery; no concurrent quotes
 const sourceCalls=ticks+eventAllowance;
 const positive=[o.reactivePrice,o.callbackPrice,o.reactiveCoeff,o.callbackCoeff,o.reactiveExtra,o.callbackExtra];
 check(positive.every(n=>n>0n),'Fee parameters unavailable or invalid.');
 const sourceCall=ceil(o.reactivePrice*2n*o.reactiveCoeff*(900000n+o.reactiveExtra),1000n);
 const destinationCall=ceil(o.callbackPrice*2n*o.callbackCoeff*(1000000n+o.callbackExtra),1000n);
 const sourceRequired=sourceCalls*sourceCall;
 const callbackRequired=8n*destinationCall; // confirmation/release plus up to six policy attempts
 const reactiveAvailable=o.reactiveReserves; // balance deliberately excluded from prepaid reserve admission
 const callbackAvailable=o.callbackReserves+o.callbackBalance;
 return {readOnly:true,scope:'conditional budget for one isolated timed-release test',cutoffWithinMinutes:minutes,deliveryMarginSeconds:900,observedMinimumCronSeconds:minimum.toString(),modeledTickSeconds:modeledTickSeconds.toString(),modeledCronTicks:ticks.toString(),reactiveCallAllowance:sourceCalls.toString(),reactiveRequiredWei:sourceRequired.toString(),reactivePrepaidReservesWei:reactiveAvailable.toString(),reactiveShortfallWei:(sourceRequired>reactiveAvailable?sourceRequired-reactiveAvailable:0n).toString(),callbackRequiredWei:callbackRequired.toString(),callbackAvailableWei:callbackAvailable.toString(),canStart:reactiveAvailable>=sourceRequired&&callbackAvailable>=callbackRequired,limits:['Conditional model: twice sampled CRON cadence, twice current gas prices, current coefficient/surcharge; not a protocol cost or delivery guarantee.','Assumes one quote, cutoff within the stated horizon, no concurrent jobs, sixteen extra source events, eight destination deliveries.','Higher rates, protocol changes, delayed ingestion, extra retries or external traffic invalidate the model.','No automatic funding or quote creation. Recheck immediately before creation; measured production cost/admission remains open.']};
}
async function observe(base,lasna) {
 const call=async(p,to,name,args=[])=>{const raw=await p.send('eth_call',[{to,data:I.encodeFunctionData(name,args)},'latest']);return I.decodeFunctionResult(name,raw)[0];};
 const bHead=await base.send('eth_getBlockByNumber',['latest',false]),rHead=await lasna.send('eth_getBlockByNumber',['latest',false]);
 const logs=(await lasna.send('eth_getLogs',[{address:CRON,topics:[CRON_TOPIC],fromBlock:'0x'+(BigInt(rHead.number)>2000n?BigInt(rHead.number)-2000n:0n).toString(16),toBlock:rHead.number}])).filter(isCron100).sort((a,b)=>Number(BigInt(a.blockNumber)-BigInt(b.blockNumber))).slice(-4);
 check(logs.length>=3,'Recent CRON observations unavailable.');
 const now=BigInt(Math.floor(Date.now()/1000));
 check(now-BigInt(rHead.timestamp)<=180n&&BigInt(rHead.timestamp)-now<=60n&&now-BigInt(bHead.timestamp)<=180n&&BigInt(bHead.timestamp)-now<=60n,'RPC head is stale or local clock is inconsistent.');
 const times=await Promise.all(logs.map(async l=>{const b=await lasna.send('eth_getBlockByNumber',[l.blockNumber,false]);check(b.hash.toLowerCase()===l.blockHash.toLowerCase(),'CRON block changed during observation.');return BigInt(b.timestamp);}));
 const keys={baseChain:()=>base.send('eth_chainId',[]),lasnaChain:()=>lasna.send('eth_chainId',[]),activeJobs:()=>call(lasna,R,'activeJobCount'),paused:()=>call(lasna,R,'schedulerPaused'),cronActive:()=>call(lasna,R,'cronSubscribed'),reactiveDebt:()=>call(lasna,SYSTEM,'debt',[R]),reactiveReserves:()=>call(lasna,SYSTEM,'reserves',[R]),reactiveCoeff:()=>call(lasna,SYSTEM,'_gasPriceCoeffPer1000'),reactiveExtra:()=>call(lasna,SYSTEM,'_extraGas'),callbackDebt:()=>call(base,PROXY,'debt',[C]),callbackReserves:()=>call(base,PROXY,'reserves',[C]),callbackBalance:()=>base.send('eth_getBalance',[C,'latest']),callbackCoeff:()=>call(base,PROXY,'_gasPriceCoeffPer1000'),callbackExtra:()=>call(base,PROXY,'_extraGas')};
 const o=Object.fromEntries(await Promise.all(Object.entries(keys).map(async([k,read])=>[k,await read()])));
 for(const k of Object.keys(o))if(!['paused','cronActive'].includes(k))o[k]=BigInt(o[k]);
 const [sourcePrice,destinationPrice]=await Promise.all([lasna.send('eth_gasPrice',[]),base.send('eth_gasPrice',[])]);
 o.reactivePrice=BigInt(sourcePrice)>BigInt(rHead.baseFeePerGas||0)?BigInt(sourcePrice):BigInt(rHead.baseFeePerGas||0);
 o.callbackPrice=BigInt(destinationPrice)>BigInt(bHead.baseFeePerGas||0)?BigInt(destinationPrice):BigInt(bHead.baseFeePerGas||0);
 check(BigInt(rHead.timestamp)-times[times.length-1]<=300n,'Latest CRON is stale.');
 o.cronTimes=times;o.observedAt=new Date().toISOString();o.cronLogs=logs;return o;
}
async function main(){const value=process.argv[2]??'30';check(/^\d+$/.test(value),'Supply a whole 10–30 minute test horizon.');const base=rpc(process.env.BASE_SEPOLIA_RPC||'https://sepolia.base.org'),lasna=rpc(process.env.LASNA_RPC||'https://lasna-rpc.rnk.dev');try{const observation=await observe(base,lasna);console.log(JSON.stringify({result:calculate(observation,Number(value)),observation},(_,v)=>typeof v==='bigint'?v.toString():v,2));}finally{base.destroy();lasna.destroy();}}
if(require.main===module)main().catch(e=>{console.error(e.m2Expected?e.message:'Budget observation unavailable. No funding or quote transaction was sent.');process.exitCode=1;});
module.exports={calculate,observe};
