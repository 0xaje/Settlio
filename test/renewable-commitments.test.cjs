const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {execFile}=require('node:child_process'),{promisify}=require('node:util');
const m=require('../script/renewable-commitments.cjs');
// Pure isolated accounting inputs, not live balances, reviewed prices or public proof.
const address=n=>'0x'+n.toString(16).padStart(40,'0'),hash=n=>'0x'+n.toString(16).padStart(64,'0');
function fixture(){
 const identity={policyVersion:5,baseChainId:'84532',sourceChainId:'5318007',escrow:address(1),receiver:address(2),reactive:address(3),workLedger:address(4),sponsor:address(5)};
 const profile={sourceAllowanceWei:'100',destinationAllowanceWei:'10',sourceBufferWei:'50',destinationBufferWei:'5',maxHorizonSeconds:'900',maxWork:'20',maxGrantSeconds:'600',maxObservationAgeSeconds:'120',maxHeadAgeSeconds:'180',sourcePriceCapWei:'20',destinationPriceCapWei:'5',sourceCoefficient:'1000',destinationCoefficient:'1100',sourceSurcharge:'100000',destinationSurcharge:'80000',adaptiveTimers:false,runtimeHashes:{escrow:hash(1),receiver:hash(2),reactive:hash(3),workLedger:hash(4)},modelReviewHash:hash(5)};
 const snapshot={identity,observedAt:'1000',base:{number:'100',hash:hash(100),timestamp:'995'},source:{number:'80',hash:hash(80),timestamp:'995'},runtimeHashes:profile.runtimeHashes,configuration:{maxHorizonSeconds:'900',maxWork:'20',adaptiveTimers:false},sourceFees:{payer:identity.reactive,reservesWei:'1000',debtWei:'0',gasPriceWei:'10',coefficient:'1000',surcharge:'100000'},destinationFees:{payer:identity.receiver,reservesWei:'100',balanceWei:'0',debtWei:'0',gasPriceWei:'2',coefficient:'1100',surcharge:'80000'},evidenceHash:hash(9)};
 const state=m.observe(m.create(identity,profile),snapshot,1000);
 const proposal={id:'intent-a',merchant:address(6),epoch:'1',credits:'6',expiresAt:'1500'};
 const evidence={identity,base:snapshot.base,source:snapshot.source,evidenceHash:hash(10)};
 const confirmation={transactionHash:hash(11),merchant:proposal.merchant,epoch:'1',credits:'6',expiresAt:'1500',profileHash:state.profileHash,evidence};
 const admission={quoteId:'1',merchant:proposal.merchant,epoch:'1',profileHash:state.profileHash,expiresAt:'1200',refundCutoff:'1300',evidence};
 const closure={quoteId:'1',epoch:'1',profileHash:state.profileHash,ledgerSettled:true,sourceSettled:true,pendingDeliveries:'0',originBacklog:'0',evidence};
 return {identity,profile,snapshot,state,proposal,evidence,confirmation,admission,closure};
}
function active(f){return m.admit(m.confirm(m.reserve(f.state,f.proposal,1000),'intent-a',f.confirmation,1000),'intent-a',f.admission);}
test('two-chain reservations cannot double-promise backing; same intent is idempotent and immutable',()=>{
 const f=fixture(),s=m.reserve(f.state,f.proposal,1000);
 assert.deepEqual(m.totals(s),{unusedCredits:'6',unsettledJobs:'0',sourceHeldWei:'600',destinationHeldWei:'60'});
 assert.deepEqual(m.reserve(s,f.proposal,1100),s);assert.throws(()=>m.reserve(s,f.proposal,1121),/Stale/);
 assert.throws(()=>m.reserve(s,{...f.proposal,credits:'5'},1000),/differs/);
 assert.throws(()=>m.reserve(s,{...f.proposal,id:'intent-b',merchant:address(7)},1000),/Source/);
 assert.throws(()=>m.reserve(s,{...f.proposal,id:'intent-b',epoch:'2'},1000),/Previous unused/);
 assert.equal(f.state.intents.length,0);
});
test('destination scarcity, debt, changed fees, incorrect runtime/payer and principal substitution fail closed',()=>{
 const f=fixture();
 for(const alter of [s=>s.destinationFees.reservesWei='1',s=>s.sourceFees.debtWei='1',s=>s.destinationFees.debtWei='1',s=>s.sourceFees.gasPriceWei='21',s=>s.destinationFees.coefficient='1200']){
  const o=structuredClone(f.snapshot);alter(o);const s=m.observe(m.create(f.identity,f.profile),o,1000);assert.throws(()=>m.reserve(s,f.proposal,1000));
 }
 for(const alter of [s=>s.sourceFees.payer=f.identity.escrow,s=>s.destinationFees.payer=f.identity.escrow,s=>s.runtimeHashes.receiver=hash(99),s=>s.configuration.maxHorizonSeconds='901',s=>s.sourceFees.balanceWei='999999']){
  const o=structuredClone(f.snapshot);alter(o);assert.throws(()=>m.observe(m.create(f.identity,f.profile),o,1000));
 }
});
test('stale/future/regressing or inconsistently pinned observations cannot refresh readiness',()=>{
 const f=fixture();assert.throws(()=>m.reserve(f.state,f.proposal,1121),/Stale/);
 assert.throws(()=>m.observe(f.state,{...f.snapshot,observedAt:'1001'},1000),/future/);
 for(const alter of [s=>s.base.number='99',s=>s.base.hash=hash(999),s=>s.sourceFees.reservesWei='2000',s=>s.observedAt='999']){
  const o=structuredClone(f.snapshot);alter(o);assert.throws(()=>m.observe(f.state,o,1000));
 }
});
test('admission moves allowance without freeing money and requires confirmed matching bounded terms',()=>{
 const f=fixture(),reserved=m.reserve(f.state,f.proposal,1000);
 assert.throws(()=>m.admit(reserved,'intent-a',f.admission),/confirmation/);
 const s=active(f);assert.equal(m.totals(s).sourceHeldWei,'600');assert.equal(m.totals(s).unsettledJobs,'1');
 assert.deepEqual(m.admit(s,'intent-a',f.admission),s);
 assert.throws(()=>m.admit(s,'intent-a',{...f.admission,quoteId:'2',epoch:'2'}),/identity/);
 assert.throws(()=>m.admit(s,'intent-a',{...f.admission,quoteId:'2',refundCutoff:'2000'}),/horizon/);
 assert.throws(()=>m.confirm(reserved,'intent-a',{...f.confirmation,credits:'5'},1000),/differs/);
});
test('terminal state alone never frees backing; pending deliveries/backlog and mismatched closure remain held',()=>{
 const f=fixture(),s=m.terminal(active(f),'1');assert.equal(m.totals(s).sourceHeldWei,'600');
 for(const change of [{pendingDeliveries:'1'},{originBacklog:'1'},{ledgerSettled:false},{sourceSettled:false},{quoteId:'2'},{epoch:'2'},{profileHash:hash(100)}])assert.throws(()=>m.settle(s,'1',{...f.closure,...change},1000));
 assert.equal(m.totals(s).sourceHeldWei,'600');
 const done=m.settle(s,'1',f.closure,1000);assert.equal(m.totals(done).sourceHeldWei,'500');assert.deepEqual(m.settle(done,'1',f.closure,1000),done);
});
test('settlement waits for post-evidence fee checkpoints but is not blocked by later debt or low balances',()=>{
 const f=fixture(),s=m.terminal(active(f),'1'),later=structuredClone(f.evidence);later.base.number='101';later.base.hash=hash(101);
 assert.throws(()=>m.settle(s,'1',{...f.closure,evidence:later},1000),/precedes/);
 const o=structuredClone(f.snapshot);o.observedAt='1010';o.base=later.base;o.source={number:'81',hash:hash(81),timestamp:'1005'};o.sourceFees.reservesWei='0';o.sourceFees.debtWei='1';
 const done=m.settle(m.observe(s,o,1010),'1',{...f.closure,evidence:later},1010);assert.equal(m.totals(done).sourceHeldWei,'500');
 assert.throws(()=>m.reserve(done,{...f.proposal,id:'intent-b',merchant:address(7),credits:'1'},1010),/Debt/);
});
test('clock expiry is insufficient; unused release requires reconciled on-chain epoch and complete admission history',()=>{
 const f=fixture(),s=active(f);assert.equal(m.totals(s).unusedCredits,'5');
 const proof={merchant:f.proposal.merchant,intentEpoch:'1',ledgerEpoch:'1',remaining:'0',admittedQuoteIds:['1'],evidence:f.evidence};
 assert.throws(()=>m.releaseUnused(s,'intent-a',{...proof,admittedQuoteIds:[]},1000),/history/);
 assert.throws(()=>m.releaseUnused(s,'intent-a',{...proof,remaining:'5'},1000),/closed/);
 const released=m.releaseUnused(s,'intent-a',proof,1000);assert.equal(m.totals(released).sourceHeldWei,'100');
 assert.equal(m.totals(released).unsettledJobs,'1');assert.deepEqual(m.releaseUnused(released,'intent-a',proof,1000),released);
 assert.throws(()=>m.admit(released,'intent-a',{...f.admission,quoteId:'2'}),/unused credit/);
});
test('review profile and work bounds remain explicit; status never authorizes a grant',()=>{
 const f=fixture();assert.throws(()=>m.create(f.identity,{...f.profile,maxObservationAgeSeconds:'121'}),/freshness/);
 const p={...f.profile,maxWork:'5'},o=structuredClone(f.snapshot);o.configuration.maxWork='5';
 const s=m.observe(m.create(f.identity,p),o,1000);assert.throws(()=>m.reserve(s,f.proposal,1000),/Work capacity/);
 assert.equal(m.inspect(f.state,1000).canGrant,false);assert.equal(m.inspect(f.state,1000).observationFresh,true);assert.equal(m.inspect(f.state,1121).observationFresh,false);
});
function temp(t){const directory=fs.mkdtempSync(path.join(os.tmpdir(),'settlio-commitments-'));t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));return path.join(directory,'renewable-commitments.local.json');}
test('journal uses atomic revisioned commands, rejects secrets and cannot overwrite legacy journals',t=>{
 const file=temp(t),f=fixture();m.initialize(file,f.state);assert.throws(()=>m.initialize(file,f.state),/already exists/);
 assert.throws(()=>m.initialize(path.join(path.dirname(file),'testnet-v4.json'),f.state),/legacy/);
 const before=fs.readFileSync(file,'utf8');assert.throws(()=>m.transact(file,0,{type:'reserve',payload:{...f.proposal,privateKey:'do-not-persist'}},1000),/Secret/);assert.equal(fs.readFileSync(file,'utf8'),before);
 m.transact(file,0,{type:'reserve',payload:f.proposal},1000);assert.equal(m.read(file).revision,1);
 assert.throws(()=>m.transact(file,0,{type:'reserve',payload:f.proposal},1000),/Stale/);
 assert.throws(()=>m.transact(file,1,{type:'reset',payload:{}},1000),/Unknown/);
 assert.equal(fs.statSync(file).mode&0o777,0o600);
 fs.writeFileSync(file+'.lock','owned-by-another-operation');assert.throws(()=>m.transact(file,1,{type:'reserve',payload:f.proposal},1000),/locked/);assert.equal(fs.readFileSync(file+'.lock','utf8'),'owned-by-another-operation');
});
test('concurrent processes cannot both reserve the same observed resources',async t=>{
 const file=temp(t),f=fixture();m.initialize(file,f.state);
 const modulePath=require.resolve('../script/renewable-commitments.cjs');
 const code=`const m=require(${JSON.stringify(modulePath)});try{m.transact(process.argv[1],0,{type:'reserve',payload:JSON.parse(process.argv[2])},1000);process.stdout.write('reserved');}catch{process.exitCode=1;}`;
 const run=promisify(execFile),a=f.proposal,b={...a,id:'intent-b',merchant:address(7)};
 const results=await Promise.allSettled([run(process.execPath,['-e',code,file,JSON.stringify(a)]),run(process.execPath,['-e',code,file,JSON.stringify(b)])]);
 assert.equal(results.filter(x=>x.status==='fulfilled').length,1);const s=m.read(file);assert.equal(s.revision,1);assert.equal(s.intents.length,1);assert.equal(m.totals(s).sourceHeldWei,'600');
});
test('inspect CLI reads only the separate journal and returns no signing authority',async t=>{
 const file=temp(t),f=fixture();m.initialize(file,f.state);const before=fs.readFileSync(file,'utf8');
 const r=await promisify(execFile)('npm',['run','--silent','inspect:commitments:renewable','--',file],{cwd:path.join(__dirname,'..')});
 assert.equal(JSON.parse(r.stdout).canGrant,false);assert.equal(fs.readFileSync(file,'utf8'),before);assert.equal(fs.existsSync(file+'.lock'),false);
});

test('saved-intent reuse rechecks funding without charging its allowance twice',()=>{
 const f=fixture(),s=m.reserve(f.state,f.proposal,1000),o=structuredClone(f.snapshot);
 o.observedAt='1010';o.base={number:'101',hash:hash(101),timestamp:'1005'};o.source={number:'81',hash:hash(81),timestamp:'1005'};
 o.sourceFees.reservesWei='649';
 const low=m.observe(s,o,1010);assert.throws(()=>m.reserve(low,f.proposal,1010),/Source/);
 o.sourceFees.reservesWei='650';assert.deepEqual(m.reserve(m.observe(s,o,1010),f.proposal,1010),m.observe(s,o,1010));
 assert.equal(m.totals(s).sourceHeldWei,'600');
});

test('receipt chronology cannot release backing using evidence older than preparation or admission',()=>{
 const f=fixture(),s=active(f),old=structuredClone(f.evidence);old.base={number:'99',hash:hash(99),timestamp:'990'};
 assert.throws(()=>m.admit(s,'intent-a',{...f.admission,quoteId:'2',evidence:old}),/precedes/);
 assert.throws(()=>m.settle(m.terminal(s,'1'),'1',{...f.closure,evidence:old},1000),/precedes/);
 const invalid=structuredClone(f.snapshot);invalid.base.timestamp='996';assert.throws(()=>m.observe(f.state,invalid,1000),/Pinned block/);
});

test('renewal reserves against remaining money while old jobs keep their original allowance',()=>{
 const f=fixture(),s=active(f),proof={merchant:f.proposal.merchant,intentEpoch:'1',ledgerEpoch:'1',remaining:'0',admittedQuoteIds:['1'],evidence:f.evidence};
 const released=m.releaseUnused(s,'intent-a',proof,1000);
 assert.throws(()=>m.reserve(released,{...f.proposal,id:'epoch-two',epoch:'2',credits:'9'},1000),/Source/);
 const renewed=m.reserve(released,{...f.proposal,id:'epoch-two',epoch:'2',credits:'8'},1000);
 assert.equal(m.totals(renewed).sourceHeldWei,'900');assert.equal(m.totals(renewed).unsettledJobs,'1');
 const settled=m.settle(m.terminal(renewed,'1'),'1',f.closure,1000);assert.equal(m.totals(settled).sourceHeldWei,'800');
 assert.equal(m.totals(settled).unusedCredits,'8');
});
