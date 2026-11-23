// Read-only observations. This command cannot waive M2 preflight or deploy anything.
const {toQuantity,getAddress}=require('ethers');
const {rpc,CRON,CRON_TOPIC}=require('./m2-network.cjs');
const {check,LASNA}=require('./m2-state.cjs');
function summarize(logs,{from,to,address=CRON,topic=CRON_TOPIC}) {
 check(Array.isArray(logs),'CRON RPC returned a non-array log response.');
 const groups={};let matching=0;const samples=[];
 for(const log of logs) {
  const t=Array.isArray(log.topics)?log.topics[0]:null;
  const key=typeof t==='string'&&/^0x[0-9a-f]{64}$/i.test(t)?t.toLowerCase():'invalid-topic';
  groups[key]=(groups[key]||0)+1;
  let valid=false;
  try {const block=Number(BigInt(log.blockNumber));valid=log.removed!==true&&block>=from&&block<=to&&getAddress(log.address)===getAddress(address)&&log.topics.length===1&&key===topic&&/^0x[0-9a-f]{64}$/i.test(log.data)&&/^0x[0-9a-f]{64}$/i.test(log.transactionHash)&&/^0x[0-9a-f]{64}$/i.test(log.blockHash);} catch {}
  if(valid) matching++;
  if(samples.length<3) samples.push({address:/^0x[0-9a-f]{40}$/i.test(log.address||'')?log.address:null,block:/^0x[0-9a-f]+$/i.test(log.blockNumber||'')?log.blockNumber:null,hash:/^0x[0-9a-f]{64}$/i.test(log.transactionHash||'')?log.transactionHash:null,topic:key,topicCount:Array.isArray(log.topics)?log.topics.length:null,dataBytes:/^0x(?:[0-9a-f]{2})*$/i.test(log.data||'')?(log.data.length-2)/2:null});
 }
 return {fromBlock:from,toBlock:to,returned:logs.length,matchingDocumentedCron100:matching,topics:groups,samples};
}
async function diagnose(provider) {
 const chainId=Number(BigInt(await provider.send('eth_chainId',[])));
 check(chainId===LASNA,'CRON diagnosis requires Lasna chain ID 5318007.');
 const height=Number(BigInt(await provider.send('eth_blockNumber',[])));
 check(Number.isSafeInteger(height)&&height>=0,'CRON block height is invalid.');
 const block=await provider.send('eth_getBlockByNumber',[toQuantity(height),false]);
 const report={readOnly:true,observedAt:new Date().toISOString(),chainId,expectedEmitter:CRON,expectedTopic:CRON_TOPIC,head:{number:height,timestamp:block?.timestamp??null},queries:[],note:'Diagnostic observations only. Empty results cannot establish whether emission or RPC indexing is at fault. An unchanged head across these immediate queries does not prove a network halt. Historical events and alternate shapes/emitters do not waive current preflight. No deployment, subscription change or transaction is sent.'};
 async function probe(name,filter,range) {
  try {report.queries.push({name,status:'ok',...summarize(await provider.send('eth_getLogs',[{...filter,fromBlock:toQuantity(range.from),toBlock:toQuantity(range.to)}]),range)});}
  catch {report.queries.push({name,status:'unavailable',fromBlock:range.from,toBlock:range.to});}
 }
 for(let page=0;page<3;page++) {
  const to=height-page*2000;if(to<0) break;
  await probe('expected-cron100-page-'+(page+1),{address:CRON,topics:[CRON_TOPIC]},{from:Math.max(0,to-1999),to});
 }
 const range={from:Math.max(0,height-255),to:height};
 await probe('all-topics-at-documented-emitter',{address:CRON},range);
 await probe('cron100-topic-any-emitter',{topics:[CRON_TOPIC]},range);
 report.afterHeight=Number(BigInt(await provider.send('eth_blockNumber',[])));
 report.headAdvanced=report.afterHeight>height;
 return report;
}
if(require.main===module) {
 const provider=rpc(process.env.LASNA_RPC||'https://lasna-rpc.rnk.dev');
 diagnose(provider).then(report=>console.log(JSON.stringify(report,null,2))).catch(error=>{console.error(error.m2Expected?error.message:'CRON diagnosis could not read Lasna. Check RPC access; no transaction was sent.');process.exitCode=1;}).finally(()=>provider.destroy());
}
module.exports={diagnose,summarize};
