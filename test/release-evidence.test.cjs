const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {Interface}=require('ethers');const {validate,collect,writeVerified}=require('../script/verify-release.cjs');
const E=new Interface(require('../apps/web/src/escrow-abi.json'));
const load=id=>JSON.parse(fs.readFileSync(path.join(__dirname,'../deployments/evidence/m2','quote-'+id+'-release-verified.json'),'utf8')).bundle;
const bad=(id,change)=>{let b=load(id);change(b);assert.throws(()=>validate(b));};
// These are genuine archived public receipts; replay is not a new live transaction.
for(const [id,asset,amount] of [[5,'ETH','100000000000000'],[6,'USDC','1000000']])test('recorded '+asset+' automatic release verifies without promoting browser claims',()=>{let r=validate(load(id));assert.equal(r.asset,asset);assert.equal(r.releaseUnits,amount);assert.equal(r.outcome,'Released');assert.equal(r.schedulerClosed,true);assert.equal(r.uniqueRetryAttribution,false);assert.match(r.browserEvidence,/separately reviewed/);});
test('failed receipts, copied logs and different chain identities are rejected',()=>{
 bad(5,b=>b.release.receipt.status='0x0');bad(6,b=>b.networks.base='0x1');
 bad(6,b=>b.release.receipt.logs.forEach(l=>l.transactionHash='0x'+'11'.repeat(32)));
 bad(5,b=>b.release.transaction.hash='0x'+'11'.repeat(32));
});
test('manual-only quote cannot count as opted-in automatic release',()=>{
 bad(5,b=>b.state.automatic='0x'+'0'.repeat(64));
 bad(6,b=>{let l=b.creation.receipt.logs.find(l=>{try{return E.parseLog(l)?.name==='PolicyRegistered';}catch{return false;}}),p=E.parseLog(l);l.data=E.encodeEventLog(E.getEvent('PolicyRegistered'),[p.args.quoteId,p.args.expiresAt,p.args.refundCutoff,false]).data;});
});
test('early delivery or request and mismatched historical blocks fail',()=>{
 bad(5,b=>b.blocks.release.timestamp='0x1');bad(6,b=>b.blocks.releaseReaction.timestamp='0x1');bad(5,b=>b.blocks.deposit.hash='0x'+'11'.repeat(32));
});
test('forged proxy, authorised sender and injected payload cannot pass',()=>{
 bad(6,b=>b.release.transaction.to=b.creation.receipt.logs[0].address);
 bad(5,b=>b.state['wire:_CALLBACK_SENDER']='0x'+'00'.repeat(12)+'11'.repeat(20));
 bad(6,b=>b.release.transaction.input=b.confirmation.transaction.input);
});
test('wrong CRON fingerprint, dispatcher or trigger log is rejected',()=>{
 bad(5,b=>b.cron.transactionHash='0x'+'11'.repeat(32));
 bad(6,b=>b.releaseReaction.transaction.from=b.release.transaction.from);
 bad(5,b=>b.cron.logs.find(l=>l.topics[0]==='0xb49937fb8970e19fd46d48f7e3fb00d659deac0347f79cd7cb542f0fc1503c70').topics[1]='0x'+'0'.repeat(64));
});
test('missing USDC transfer or approval and changed release amount are rejected',()=>{
 bad(6,b=>b.release.receipt.logs=b.release.receipt.logs.filter(l=>l.address.toLowerCase()!=='0x036cbd53842c5426634e7929541ec2318f3dcf7e'));
 bad(6,b=>delete b.approval);
 bad(5,b=>{let l=b.release.receipt.logs.find(l=>{try{return E.parseLog(l)?.name==='Released';}catch{return false;}});l.data=E.encodeEventLog(E.getEvent('Released'),[5,1]).data;});
});
test('merchant principal deltas, custody coverage and scheduler closure are mandatory',()=>{
 bad(5,b=>b.state.merchantafter=b.state.merchantbefore);bad(6,b=>b.state.liability='0x1');
 bad(6,b=>{let words=b.state.job.slice(2).match(/.{64}/g);words[8]='0'.repeat(64);b.state.job='0x'+words.join('');});
});
test('user/video annotations never turn into RPC proof of browser actions',()=>{
 let b=load(6),original=validate(b);b.videoEvidence={closure:{status:'FAKE FULL VIDEO PASS'}};let r=validate(b);assert.equal(r.browserEvidence,original.browserEvidence);assert.equal(r.uniqueRetryAttribution,false);
});
test('collector rejects wrong RPC networks before collecting receipts',async()=>{
 let calls=[],p={send:async method=>{calls.push(method);return '0x1';}};await assert.rejects(collect(p,p,load(5)),/network/);assert.deepEqual(calls,['eth_chainId','eth_chainId']);
});
test('a validation failure preserves an existing verified evidence file',t=>{
 let dir=fs.mkdtempSync(path.join(os.tmpdir(),'settlio-release-evidence-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));let file=path.join(dir,'verified.json');writeVerified(file,{sentinel:'preserve'});let before=fs.readFileSync(file,'utf8'),b=load(6);b.release.receipt.status='0x0';assert.throws(()=>{const result=validate(b);writeVerified(file,{result,bundle:b});});assert.equal(fs.readFileSync(file,'utf8'),before);assert.equal(fs.existsSync(file+'.tmp'),false);
});
