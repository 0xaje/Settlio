const {test}=require('node:test');
const assert=require('node:assert/strict');
const {diagnose,summarize}=require('../script/diagnose-cron.cjs');
const {CRON,CRON_TOPIC}=require('../script/m2-network.cjs');
const range={from:10,to:20};
const log={address:CRON,topics:[CRON_TOPIC],data:'0x'+'00'.repeat(32),blockNumber:'0xf',transactionHash:'0x'+'11'.repeat(32),blockHash:'0x'+'22'.repeat(32)};
test('CRON diagnostics distinguish absent results from incompatible log shapes',()=>{
 assert.equal(summarize([],range).returned,0);
 assert.equal(summarize([log],range).matchingDocumentedCron100,1);
 for(const change of [{address:'0x'+'00'.repeat(20)},{topics:[CRON_TOPIC,CRON_TOPIC]},{data:'0x'},{removed:true},{blockNumber:'0x21'}]) assert.equal(summarize([{...log,...change}],range).matchingDocumentedCron100,0);
 assert.throws(()=>summarize({},range),/non-array/);
});
test('CRON diagnosis uses bounded public queries and reports missing RPC results without fabricating proof',async()=>{
 let count=0;const calls=[];
 const provider={async send(method,args){calls.push({method,args});if(method==='eth_chainId')return '0x'+(5318007).toString(16);if(method==='eth_blockNumber')return '0x1770';if(method==='eth_getBlockByNumber')return {timestamp:'0x100'};if(method==='eth_getLogs'){count++;if(count===2)throw new Error('sensitive RPC detail must not appear');return [];}throw new Error('unexpected method');}};
 const result=await diagnose(provider);
 assert.equal(result.chainId,5318007);assert.equal(result.queries.length,5);
 assert.equal(result.queries[1].status,'unavailable');assert.equal(result.queries[0].returned,0);
 assert.equal(JSON.stringify(result).includes('sensitive'),false);
 assert.equal(calls.every(x=>['eth_chainId','eth_blockNumber','eth_getBlockByNumber','eth_getLogs'].includes(x.method)),true);
 assert.deepEqual(result.queries.slice(0,3).map(x=>[x.fromBlock,x.toBlock]),[[4001,6000],[2001,4000],[1,2000]]);
});
test('CRON diagnosis refuses another network before querying logs',async()=>{
 const calls=[];await assert.rejects(diagnose({async send(method){calls.push(method);return '0x1';}}),/Lasna chain ID/);
 assert.deepEqual(calls,['eth_chainId']);
});
