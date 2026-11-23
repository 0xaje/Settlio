const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {Interface}=require('ethers');
const {validate,collect}=require('../script/verify-refund.cjs');
const load=id=>JSON.parse(fs.readFileSync(path.join(__dirname,'../deployments/evidence/m2','quote-'+id+'-refund-verified.json'),'utf8')).bundle;
const change=(id,mutate)=>{const b=load(id);mutate(b);assert.throws(()=>validate(b));};
// Real archived public receipts are replayed here; these tests are not new live transactions.
for(const [id,asset,amount] of [[2,'ETH','100000000000000'],[4,'USDC','1000000']])test('recorded '+asset+' refund has authenticated trace and same-asset accounting',()=>{
  const r=validate(load(id));assert.equal(r.asset,asset);assert.equal(r.refundUnits,amount);assert.equal(r.outcome,'Refunded');assert.equal(r.schedulerClosed,true);assert.equal(r.uniqueRetryAttribution,false);assert.equal(r.browserClosedEvidence,'not recorded');
});
test('failed receipt and substituted receipt identity cannot pass',()=>{
  change(4,b=>b.refund.receipt.status='0x0');change(2,b=>b.refund.transaction.hash='0x'+'11'.repeat(32));
});
test('wrong network and unrelated deployment cannot pass',()=>{
  change(4,b=>b.networks.base='0x1');change(2,b=>b.identity.escrow='0x'+'11'.repeat(20));
});
test('forged proxy route and injected sender cannot pass',()=>{
  change(4,b=>b.refund.transaction.to=b.identity.escrow);
  change(2,b=>b.authentication._CALLBACK_SENDER='0x'+'00'.repeat(12)+'11'.repeat(20));
});
test('different CRON, origin log topic, and request target cannot pass',()=>{
  change(4,b=>b.authentication.cron.transactionHash='0x'+'11'.repeat(32));
  change(2,b=>b.authentication.cron.logs.find(l=>l.topics[0]==='0xb49937fb8970e19fd46d48f7e3fb00d659deac0347f79cd7cb542f0fc1503c70').topics[1]='0x'+'00'.repeat(32));
  change(4,b=>b.additional.refundReactionTx.result.from=b.identity.escrow);
});
test('token transfer cannot be fabricated by keeping only escrow outcome events',()=>{
  change(4,b=>b.refund.receipt.logs=b.refund.receipt.logs.filter(l=>l.address.toLowerCase()!=='0x036cbd53842c5426634e7929541ec2318f3dcf7e'));
});
test('wrong token delta and ETH recipient delta fail',()=>{
  change(4,b=>b.authentication.tokenCustomerafter=b.authentication.tokenCustomerbefore);
  change(2,b=>b.additional.customerafter.result=b.additional.customerbefore.result);
});
test('refund event amount and quote status are authoritative',()=>{
  const e=new Interface(require('../apps/web/src/escrow-abi.json'));
  change(4,b=>{const log=b.refund.receipt.logs.find(l=>{try{return e.parseLog(l)?.name==='Refunded';}catch{return false;}});log.data=e.encodeEventLog(e.getEvent('Refunded'),[4,999999]).data;});
  change(2,b=>{const q=e.decodeFunctionResult('getQuote',b.state.quote.result)[0].toArray();q[7]=4n;b.state.quote.result=e.encodeFunctionResult('getQuote',[q]);});
});
test('late cancellation, reversed request time, and open scheduler fail',()=>{
  change(4,b=>b.additional.cancellationBlock.result.timestamp='0xffffffffff');
  change(2,b=>b.additional.refundReactionBlock.result.timestamp='0x1');
  change(4,b=>{const words=b.state.job.result.slice(2).match(/.{64}/g);words[8]='0'.repeat(64);b.state.job.result='0x'+words.join('');});
});
test('current custody cannot hide an underfunded refund asset',()=>{
  change(4,b=>b.state.liability.result='0x1');change(2,b=>b.state.liability.result='0x1');
});
test('live collector refuses wrong RPC networks before receipt reads',async()=>{
  const calls=[];const p={send:async(m)=>{calls.push(m);return '0x1';}};
  await assert.rejects(collect(p,p,load(2)),/network/);assert.deepEqual(calls,['eth_chainId','eth_chainId']);
});
