// Offline analysis only: no RPC, signer, grant readiness or file writes.
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const root=path.join(__dirname,'..');
const bundles=[1,2,3,4,5,6].map((n)=>`deployments/evidence/v4/quote-${n}-${n<3?'release':n<5?'refund':n===5?'expiry':'recovery'}-verified.json`);
const referencePath='deployments/evidence/v4/next-quote-budget-observation.json';
function uint(v,name){if(typeof v!=='string'||!(/^(0x[0-9a-fA-F]+|[0-9]+)$/).test(v))throw Error('Invalid unsigned integer: '+name);return BigInt(v);}
const hexHash=v=>typeof v==='string'&&/^0x[0-9a-fA-F]{64}$/.test(v);
const ceil=(a,b)=>(a+b-1n)/b;
function walk(value,visit,location='$'){
 if(!value||typeof value!=='object')return;visit(value,location);
 for(const [k,v]of Object.entries(value))walk(v,visit,location+'.'+k);
}
function inventory(documents){
 const chains=new Map(),receipts=new Map();
 for(const {document}of documents)walk(document,v=>{
  if(!hexHash(v.hash)||v.chainId==null)return;
  const key=v.hash.toLowerCase(),chain=uint(v.chainId,'transaction chainId').toString();
  if(chains.has(key)&&chains.get(key)!==chain)throw Error('Conflicting transaction chain');chains.set(key,chain);
 });
 for(const {file,document}of documents)walk(document,(v,location)=>{
  if(!hexHash(v.transactionHash)||v.gasUsed==null||!Array.isArray(v.logs)||!hexHash(v.blockHash))return;
  const hash=v.transactionHash.toLowerCase();
  const entry={hash,chainId:chains.get(hash)||null,blockHash:v.blockHash.toLowerCase(),gasUsed:uint(v.gasUsed,'gasUsed').toString(),
   status:v.status==null?null:uint(v.status,'status').toString(),effectiveGasPrice:v.effectiveGasPrice==null?null:uint(v.effectiveGasPrice,'effectiveGasPrice').toString(),
   l1Fee:v.l1Fee==null?null:uint(v.l1Fee,'l1Fee').toString(),from:v.from||null,to:v.to||null,references:[{file,location}]};
  if(receipts.has(hash)){
   const previous=receipts.get(hash);
   for(const key of ['chainId','blockHash','gasUsed','status','effectiveGasPrice','l1Fee','from','to']){
    if(previous[key]!=null&&entry[key]!=null&&String(previous[key]).toLowerCase()!==String(entry[key]).toLowerCase())throw Error('Conflicting duplicate receipt '+key);
    if(previous[key]==null)previous[key]=entry[key];
   }
   previous.references.push(...entry.references);
  }else receipts.set(hash,entry);
 });
 let baseExecution=0n,baseL1=0n,baseCount=0,sourceCount=0,sourceGas=0n,missingSourcePrice=0,unknown=0;
 for(const r of receipts.values()){
  r.envelopeExecutionWei=r.effectiveGasPrice==null?null:(BigInt(r.gasUsed)*BigInt(r.effectiveGasPrice)).toString();
  r.serviceChargeWei=null;
  if(r.chainId==='84532'&&r.envelopeExecutionWei!=null){baseExecution+=BigInt(r.envelopeExecutionWei);baseL1+=BigInt(r.l1Fee||0);baseCount++;}
  else if(r.chainId==='5318007'){sourceCount++;sourceGas+=BigInt(r.gasUsed);if(r.effectiveGasPrice==null)missingSourcePrice++;}
  else unknown++;
 }
 return {receipts:[...receipts.values()].sort((a,b)=>a.hash.localeCompare(b.hash)),summary:{uniqueReceipts:receipts.size,selectedBaseReceiptsWithEffectivePrice:baseCount,
  selectedBaseEnvelopeExecutionWei:baseExecution.toString(),selectedBaseReportedL1FeeWei:baseL1.toString(),selectedSourceReceipts:sourceCount,
  selectedSourceGasUnits:sourceGas.toString(),sourceReceiptsMissingEffectiveGasPrice:missingSourcePrice,unknownOrUnpricedOtherReceipts:unknown,
  scope:'Selected transaction-envelope observations only; not customer charges, protocol service billing, total project costs or a complete per-booking average.'}};
}
function fee(price,coefficient,gas,surcharge){
 if([price,coefficient,gas,surcharge].some(v=>typeof v!=='bigint')||price<=0n||coefficient<=0n||gas<=0n||surcharge<0n)throw Error('Invalid fee scenario');
 return ceil(price*coefficient*(gas+surcharge),1000n);
}
function scenarios(o,constants){
 const times=o.cronTimes.map((v)=>uint(v,'cron timestamp'));
 if(times.length<3)throw Error('Insufficient recorded cadence');
 const intervals=times.slice(1).map((v,i)=>v-times[i]);if(intervals.some(v=>v<=0n))throw Error('Invalid recorded cadence');
 const minimum=intervals.reduce((a,b)=>a<b?a:b),tick=minimum/2n;if(tick===0n)throw Error('Invalid modeled tick');
 const sourceUnit=fee(2n*uint(o.reactivePrice,'source price'),uint(o.reactiveCoeff,'source coefficient'),900000n,uint(o.reactiveExtra,'source surcharge'));
 const destUnit=fee(2n*uint(o.callbackPrice,'destination price'),uint(o.callbackCoeff,'destination coefficient'),constants.callbackGas,uint(o.callbackExtra,'destination surcharge'));
 const requestCap=constants.attempts*(1n+constants.recoveries),acceptedCap=1n+constants.recoveries;
 return {scope:'Partial hypothetical sensitivity only. Not a complete reserve requirement or an admission decision.',recordedMinimumCronSeconds:minimum.toString(),modeledTickSeconds:tick.toString(),
  sourceMaximumGasStressUnitWei:sourceUnit.toString(),destinationCallbackGasLimitStressUnitWei:destUnit.toString(),acknowledgementRequestCap:requestCap.toString(),
  acceptedAcknowledgementRequestCap:acceptedCap.toString(),acknowledgementSinglePassDestinationAllowanceWei:(acceptedCap*destUnit).toString(),
  profiles:[['15 minutes',900n],['24 hours',86400n],['7 days',604800n]].map(([label,horizon])=>({label,horizonSeconds:horizon.toString(),
   hypotheticalAlwaysSubscribedTicks:ceil(horizon,tick).toString(),timerOnlyMaximumGasStressWei:(ceil(horizon,tick)*sourceUnit).toString()})),
  assumptions:['Doubles the archived fee prices and sampled cadence; uses maximum source execution gas rather than measured idle gas.',
   'One continuously active timer subscription during the stated horizon. Concurrent jobs share a subscription; do not multiply these ticks blindly by concurrency.',
   'Acknowledgement delivery allowance assumes one billed destination attempt per accepted request. Protocol redelivery and changing prices can invalidate it.',
   'No deployment, configuration, ordinary policy/confirmation traffic, full retry/backoff/drain tail, origin observations or reserve contingency is included in these partial numbers.',
   'No V5 funding observation exists. Old V4 reserves are not available credit for another contract. Prices/cadence are historical, not current quotations.']};
}
function constant(text,name){const m=text.match(new RegExp('\\b'+name+'\\s*=\\s*([0-9_]+)\\s*;'));if(!m)throw Error('Unrecognized source constant '+name);return BigInt(m[1].replaceAll('_',''));}
function review(directory=root){
 const inputs=[];
 function read(file){const bytes=fs.readFileSync(path.join(directory,file));inputs.push({file,sha256:createHash('sha256').update(bytes).digest('hex')});return bytes.toString('utf8');}
 const observation=JSON.parse(read(referencePath)).observation;
 const docs=bundles.map(file=>({file,document:JSON.parse(read(file))}));
 const source=read('packages/contracts/renewable/SettlioReactiveV5.sol'),escrow=read('packages/contracts/renewable/SettlioEscrowV5.sol');
 const constants={attempts:constant(source,'ACK_ATTEMPTS_PER_BATCH'),recoveries:constant(source,'MAX_ACK_RECOVERIES'),callbackGas:constant(source,'CALLBACK_GAS_LIMIT')};
 if(constants.recoveries!==constant(escrow,'MAX_CLOSURE_RECOVERIES'))throw Error('Closure recovery bounds differ');
 const result={analysisScriptSha256:createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),mode:'offline archived evidence and hypothetical sensitivity',readOnly:true,canGrant:false,admissionDecision:'NOT_EVALUATED',inputs,
  archivedFeeReference:{file:referencePath,observedAtUnix:observation.observedAt,recordedAtUTC:new Date(Number(uint(observation.observedAt,'observation time'))*1000).toISOString(),
   sourcePriceWei:observation.reactivePrice,destinationPriceWei:observation.callbackPrice,fresh:false},
  receiptInventory:inventory(docs),scenarioAnalysis:scenarios(observation,constants),
  unresolved:['No complete application service-charge ledger or reliable normal-booking average is established.',
   'No full renewable commitment, fee-backlog or long-horizon funding admission model is implemented by this report.',
   'No new public integration evidence, reserve transferability or future delivery guarantee is established.']};
 return result;
}
if(require.main===module){try{if(process.argv.length!==2)throw Error('This offline review accepts no operation arguments');console.log(JSON.stringify(review(),null,2));}catch(error){console.error('Offline cost review stopped: '+error.message);process.exitCode=1;}}
module.exports={inventory,fee,scenarios,constant,review};
