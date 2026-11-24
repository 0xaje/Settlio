const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {Interface}=require('ethers'),{validate}=require('../script/verify-v4-release.cjs');
const file=path.join(__dirname,'../deployments/evidence/v4/quote-1-release-verified.json');
const load=()=>JSON.parse(fs.readFileSync(file,'utf8')).bundle;
const bad=edit=>{const b=load();edit(b);assert.throws(()=>validate(b));};
const word=n=>'0x'+BigInt(n).toString(16).padStart(64,'0');
test('archived genuine V4 admission to deposit confirmation and CRON release verifies with attribution limits',()=>{const r=validate(load());assert.equal(r.policyVersion,4);assert.equal(r.quoteId,'1');assert.equal(r.releaseUnits,'100000000000000');assert.equal(r.admissionSlotClosed,true);assert.equal(r.schedulerIdle,true);assert.equal(r.uniqueRetryAttribution,false);});
test('V4 identity/version and admission binding cannot be replaced by legacy evidence',()=>{bad(b=>b.v4.escrowVersion=word(3));bad(b=>b.v4.reactiveVersion=word(3));bad(b=>b.v4.admission='0x'+'0'.repeat(64));});
test('V4 release requires both admission receipt events and exact quote binding',()=>{
 bad(b=>b.creation.receipt.logs=b.creation.receipt.logs.filter(l=>l.address.toLowerCase()!=='0x935ef09f57b68d08fd9fd315755b7daf49871486'));
 bad(b=>b.release.receipt.logs=b.release.receipt.logs.filter(l=>l.address.toLowerCase()!=='0x935ef09f57b68d08fd9fd315755b7daf49871486'));
 const gate=new Interface(['event Admitted(uint256 indexed quoteId,address indexed merchant,uint64 cutoff,bytes32 fundingObservation)']);
 bad(b=>{const l=b.creation.receipt.logs.find(l=>l.address.toLowerCase()==='0x935ef09f57b68d08fd9fd315755b7daf49871486'),p=gate.parseLog(l);l.data=gate.encodeEventLog(gate.getEvent('Admitted'),[1,p.args.merchant,1,p.args.fundingObservation]).data;});
});
test('V4 source idle and destination capacity/custody closure are mandatory',()=>{for(const k of ['active','reserved','usdcBalance','usdcLiability'])bad(b=>b.v4[k]=word(1));bad(b=>b.v4.admitted=word(0));bad(b=>b.state.count=word(1));bad(b=>b.state.cron=word(1));bad(b=>b.v4.paused=word(1));bad(b=>b.v4.job='0x'+['1','0','0','0'].map(n=>BigInt(n).toString(16).padStart(64,'0')).join(''));});
test('V4 copied callback, altered origin, payout deltas and unsuccessful receipt fail',()=>{bad(b=>b.release.receipt.status='0x0');bad(b=>b.release.transaction.input=b.confirmation.transaction.input);bad(b=>b.cron.transactionHash='0x'+'11'.repeat(32));bad(b=>b.state.merchantafter=b.state.merchantbefore);});
test('browser annotations never establish continuous closure or unique request attribution',()=>{const b=load(),expected=validate(b);b.browserEvidence={continuousClosure:'claimed'};const r=validate(b);assert.equal(r.browserEvidence,expected.browserEvidence);assert.equal(r.uniqueRetryAttribution,false);});
