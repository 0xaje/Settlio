const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Interface,AbiCoder}=require('ethers');
const {validateBundle}=require('../script/verify-expiry.cjs');
// Historical public RPC evidence, not simulated activity or a fresh live run.
const original=require('../deployments/evidence/m2/quote-1-expiry.json').bundle;
const copy=()=>structuredClone(original);
test('historical live expiry verifies with retry-attribution and browser-closure limits',()=>{
 const result=validateBundle(copy());assert.equal(result.outcome,'Expired');assert.equal(result.schedulerClosed,true);assert.equal(result.uniqueRetryAttribution,false);assert.equal(result.browserClosedEvidence,'not recorded');
});
test('expiry verifier rejects failed receipts and another network',()=>{
 for(const field of ['creation','cron','reaction','callback']){const b=copy();b[field].status='0x0';assert.throws(()=>validateBundle(b),/unsuccessful/);}
 const b=copy();b.networks.base='0x1';assert.throws(()=>validateBundle(b),/network mismatch/);
});
test('expiry verifier rejects foreign sender receiver or proxy wiring',()=>{
 for(const mutate of [b=>b.wiring.receiverSender=b.journal.escrow,b=>b.callbackTx.to=b.journal.escrow,b=>b.reactionTx.from=b.journal.escrow]){const b=copy();mutate(b);assert.throws(()=>validateBundle(b),/wiring|route/);}
});
test('expiry verifier rejects an altered authenticated quote payload',()=>{
 const b=copy(),proxy=new Interface(['function deliverCallback(uint8,bytes)']),receiver=new Interface(['function processPolicy(address,uint256)']);
 const [v,bytes]=proxy.decodeFunctionData('deliverCallback',b.callbackTx.input);
 const coder=AbiCoder.defaultAbiCoder(),type='tuple(uint256 chainId,address recipient,uint64 gasLimit,bytes payload)';const c=coder.decode([type],bytes)[0];
 const changed=coder.encode([type],[[c.chainId,c.recipient,c.gasLimit,receiver.encodeFunctionData('processPolicy',[b.journal.contracts.SettlioReactive.address,2])]]);
 b.callbackTx.input=proxy.encodeFunctionData('deliverCallback',[v,changed]);assert.throws(()=>validateBundle(b),/delivery payload/);
});
test('expiry verifier rejects unrelated or malformed CRON origin',()=>{
 const b=copy();b.cron.transactionHash='0x'+'01'.repeat(32);assert.throws(()=>validateBundle(b),/CRON receipt/);
 const c=copy();const log=c.cron.logs.find(l=>l.topics[0]==='0xb49937fb8970e19fd46d48f7e3fb00d659deac0347f79cd7cb542f0fc1503c70');log.topics.pop();assert.throws(()=>validateBundle(c),/CRON log/);
});
test('expiry verifier rejects early expiry, mismatched blocks and future associated reactions',()=>{
 const b=copy();b.callbackBlock.timestamp='0x1';assert.throws(()=>validateBundle(b),/precedes deadline/);
 const c=copy();c.reactionBlock.timestamp='0x'+(BigInt(c.callbackBlock.timestamp)+1n).toString(16);assert.throws(()=>validateBundle(c),/after expiry/);
 const d=copy();d.callbackTx.blockHash='0x'+'00'.repeat(32);assert.throws(()=>validateBundle(d),/block mismatch/);
});
test('expiry verifier rejects unobserved policy, open scheduler and unchanged quote',()=>{
 for(const mutate of [b=>b.originalPolicyProcessed=false,b=>b.job.closed=false,b=>b.quote.status='1']){const b=copy();mutate(b);assert.throws(()=>validateBundle(b),/acknowledgement|outcome/);}
});
test('expiry verifier rejects copied outcome logs from another receipt',()=>{
 const b=copy();for(const log of b.callback.logs)log.transactionHash='0x'+'00'.repeat(32);assert.throws(()=>validateBundle(b),/outcome events/);
});
