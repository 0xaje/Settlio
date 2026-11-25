// Local sponsor accounting only. Inputs are attestations until a verified reader supplies them.
// No RPC, signer, calldata generation, grant execution or automatic funding.
const fs = require('node:fs');
const path = require('node:path');
const { createHash, randomBytes } = require('node:crypto');
const SCHEMA = 'settlio-renewable-commitments/v1';
const FILE = 'renewable-commitments.local.json';
const clone = value => structuredClone(value);
const nowSeconds = () => Math.floor(Date.now() / 1000);
function check(ok, message) { if (!ok) throw Error(message); }
function keys(value, names) {
  check(value && typeof value === 'object' && !Array.isArray(value), 'Expected accounting object');
  check(Object.keys(value).length === names.length && names.every(k => Object.hasOwn(value, k)), 'Unexpected accounting fields');
}
function uint(value, max = (1n << 256n) - 1n) {
  check(typeof value === 'string' && /^(0|[1-9][0-9]*)$/.test(value), 'Expected canonical unsigned decimal');
  const n = BigInt(value); check(n <= max, 'Accounting integer out of range'); return n;
}
function positive(value, max) { const n = uint(value, max); check(n > 0n, 'Expected positive allowance'); return n; }
function address(value) { check(typeof value === 'string' && /^0x[0-9a-f]{40}$/.test(value) && BigInt(value) !== 0n, 'Expected normalized nonzero address'); }
function hash(value) { check(typeof value === 'string' && /^0x[0-9a-f]{64}$/.test(value) && BigInt(value) !== 0n, 'Expected nonzero hash'); }
function identifier(value) { check(typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(value), 'Invalid intent identifier'); }
function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  return JSON.stringify(value);
}
function digest(value) { return '0x' + createHash('sha256').update(canonical(value)).digest('hex'); }
function identity(value) {
  keys(value, ['policyVersion','baseChainId','sourceChainId','escrow','receiver','reactive','workLedger','sponsor']);
  check(value.policyVersion === 5 && value.baseChainId === '84532' && value.sourceChainId === '5318007', 'Wrong commitment version or chains');
  for (const name of ['escrow','receiver','reactive','workLedger','sponsor']) address(value[name]);
  check(new Set(['escrow','receiver','workLedger','sponsor'].map(k => value[k])).size === 4, 'Base roles must be distinct');
}
function validateProfile(p) {
  keys(p, ['sourceAllowanceWei','destinationAllowanceWei','sourceBufferWei','destinationBufferWei','maxHorizonSeconds','maxWork','maxGrantSeconds','maxObservationAgeSeconds','maxHeadAgeSeconds','sourcePriceCapWei','destinationPriceCapWei','sourceCoefficient','destinationCoefficient','sourceSurcharge','destinationSurcharge','adaptiveTimers','runtimeHashes','modelReviewHash']);
  for (const k of ['sourceAllowanceWei','destinationAllowanceWei','maxHorizonSeconds','maxWork','maxGrantSeconds','maxObservationAgeSeconds','maxHeadAgeSeconds','sourcePriceCapWei','destinationPriceCapWei','sourceCoefficient','destinationCoefficient']) positive(p[k]);
  for (const k of ['sourceBufferWei','destinationBufferWei','sourceSurcharge','destinationSurcharge']) uint(p[k]);
  positive(p.maxWork,(1n<<32n)-1n);
  positive(p.maxHorizonSeconds,(1n<<64n)-1n);positive(p.maxGrantSeconds,(1n<<64n)-1n);
  check(uint(p.maxObservationAgeSeconds) <= 120n && uint(p.maxHeadAgeSeconds) <= 180n, 'Observation freshness policy is too loose');
  check(typeof p.adaptiveTimers === 'boolean', 'Timer profile missing');
  keys(p.runtimeHashes, ['escrow','receiver','reactive','workLedger']);
  Object.values(p.runtimeHashes).forEach(hash); hash(p.modelReviewHash);
}
function profileHash(id, profile) { identity(id); validateProfile(profile); return digest({identity:id, profile}); }
function validateBlock(block) { keys(block,['number','hash','timestamp']); uint(block.number); hash(block.hash); uint(block.timestamp); }
function after(block, previous) {
  check(uint(block.number)>=uint(previous.number) && uint(block.timestamp)>=uint(previous.timestamp),'Evidence precedes its recorded commitment');
  check(block.number!==previous.number || canonical(block)===canonical(previous),'Conflicting pinned evidence block');
}
function validateSnapshot(s, state) {
  keys(s,['identity','observedAt','base','source','runtimeHashes','configuration','sourceFees','destinationFees','evidenceHash']);
  check(canonical(s.identity) === canonical(state.identity), 'Observation identity mismatch');
  uint(s.observedAt); validateBlock(s.base); validateBlock(s.source); hash(s.evidenceHash);
  keys(s.configuration,['maxHorizonSeconds','maxWork','adaptiveTimers']);
  check(s.configuration.maxHorizonSeconds===state.profile.maxHorizonSeconds && s.configuration.maxWork===state.profile.maxWork && s.configuration.adaptiveTimers===state.profile.adaptiveTimers,'Deployment limits differ from reviewed profile');
  check(canonical(s.runtimeHashes) === canonical(state.profile.runtimeHashes), 'Observed runtime differs from reviewed profile');
  keys(s.sourceFees,['payer','reservesWei','debtWei','gasPriceWei','coefficient','surcharge']);
  keys(s.destinationFees,['payer','reservesWei','balanceWei','debtWei','gasPriceWei','coefficient','surcharge']);
  check(s.sourceFees.payer === state.identity.reactive && s.destinationFees.payer === state.identity.receiver, 'Fee payer mismatch; escrow principal is excluded');
  for (const [name, fees] of [['source',s.sourceFees],['destination',s.destinationFees]]) {
    for (const key of Object.keys(fees).filter(k=>k!=='payer')) uint(fees[key]);
    positive(fees.gasPriceWei); positive(fees.coefficient);
  }
}
function validateState(s) {
  keys(s,['schema','revision','identity','profile','profileHash','snapshot','intents','jobs']);
  check(s.schema === SCHEMA && Number.isSafeInteger(s.revision) && s.revision >= 0, 'Invalid commitment journal');
  identity(s.identity); validateProfile(s.profile);
  check(s.profileHash === profileHash(s.identity,s.profile), 'Profile binding mismatch');
  if (s.snapshot !== null) validateSnapshot(s.snapshot,s);
  check(Array.isArray(s.intents) && Array.isArray(s.jobs), 'Invalid obligation lists');
  const ids = new Set(), merchantEpochs = new Set(), jobIds = new Set();
  for (const i of s.intents) {
    keys(i,['id','merchant','epoch','credits','remaining','expiresAt','confirmed','releasedUnused','transactionHash','preparedAt','confirmedAt']);
    identifier(i.id); address(i.merchant); positive(i.epoch,(1n<<64n)-1n); positive(i.credits,(1n<<32n)-1n); uint(i.remaining); uint(i.expiresAt,(1n<<64n)-1n);
    check(typeof i.confirmed === 'boolean' && typeof i.releasedUnused === 'boolean', 'Invalid intent flags');
    keys(i.preparedAt,['base','source']);validateBlock(i.preparedAt.base);validateBlock(i.preparedAt.source);
    if(i.confirmedAt!==null)validateBlock(i.confirmedAt);
    check(i.confirmed===(i.confirmedAt!==null),'Confirmation block missing');
    if (i.transactionHash !== null) hash(i.transactionHash);
    check(i.confirmed === (i.transactionHash !== null), 'Grant confirmation mismatch');
    check(!ids.has(i.id) && !merchantEpochs.has(i.merchant+':'+i.epoch), 'Duplicate grant intent'); ids.add(i.id); merchantEpochs.add(i.merchant+':'+i.epoch);
  }
  for (const job of s.jobs) {
    keys(job,['quoteId','intentId','terminal','settled','admissionEvidence','settlementEvidence','admittedAt']);
    positive(job.quoteId); identifier(job.intentId); hash(job.admissionEvidence);
    keys(job.admittedAt,['base','source']);validateBlock(job.admittedAt.base);validateBlock(job.admittedAt.source);
    check(typeof job.terminal === 'boolean' && typeof job.settled === 'boolean' && (!job.settled || job.terminal), 'Invalid job state');
    check(ids.has(job.intentId) && !jobIds.has(job.quoteId), 'Unknown intent or duplicate quote'); jobIds.add(job.quoteId);
    if (job.settlementEvidence !== null) hash(job.settlementEvidence);
    check(job.settled === (job.settlementEvidence !== null), 'Job settlement mismatch');
  }
  for (const i of s.intents) {
    const count = BigInt(s.jobs.filter(j=>j.intentId===i.id).length);
    check(uint(i.remaining)+count <= uint(i.credits) && (i.releasedUnused || uint(i.remaining)+count===uint(i.credits)), 'Credit accounting mismatch');
    check(!i.releasedUnused || i.remaining==='0', 'Released grant still has credits');
    check(i.confirmed || count===0n, 'Unconfirmed grant has jobs');
  }
  return s;
}
function create(id, profile) {
  const state={schema:SCHEMA,revision:0,identity:clone(id),profile:clone(profile),profileHash:profileHash(id,profile),snapshot:null,intents:[],jobs:[]};
  return validateState(state);
}
function change(state, operation) { validateState(state); const next=clone(state); operation(next); validateState(next); return next; }
function fresh(s, now) {
  check(Number.isSafeInteger(now) && now >= 0 && s.snapshot !== null, 'A funding observation is required');
  const n=BigInt(now), o=s.snapshot;
  check(uint(o.observedAt)<=n && n-uint(o.observedAt)<=uint(s.profile.maxObservationAgeSeconds), 'Stale or future observation');
  for (const block of [o.base,o.source]) check(uint(block.timestamp)<=n && n-uint(block.timestamp)<=uint(s.profile.maxHeadAgeSeconds), 'Stale or future chain head');
}
function observe(state, snapshot, now=nowSeconds()) {
  return change(state,s=>{
    validateSnapshot(snapshot,s);
    if(s.snapshot)check(uint(snapshot.observedAt)>=uint(s.snapshot.observedAt),'Observation time regressed');
    if(s.snapshot) for(const chain of ['base','source']) {
      const previous=s.snapshot[chain],next=snapshot[chain];
      check(uint(next.number)>=uint(previous.number), 'Chain head regressed; reconcile before reuse');
      check(next.number!==previous.number || canonical(next)===canonical(previous), 'Pinned block changed; reconcile before reuse');
      const field=chain==='base'?'destinationFees':'sourceFees';
      check(next.number!==previous.number || canonical(snapshot[field])===canonical(s.snapshot[field]),'Pinned fee fields changed without a new block');
      check(uint(next.timestamp)>=uint(previous.timestamp),'Chain time regressed');
    }
    s.snapshot=clone(snapshot); fresh(s,now);
  });
}
function totals(state) {
  validateState(state);
  const unused=state.intents.reduce((n,i)=>n+uint(i.remaining),0n), unsettled=BigInt(state.jobs.filter(j=>!j.settled).length),units=unused+unsettled;
  return {unusedCredits:unused.toString(),unsettledJobs:unsettled.toString(),sourceHeldWei:(units*uint(state.profile.sourceAllowanceWei)).toString(),destinationHeldWei:(units*uint(state.profile.destinationAllowanceWei)).toString()};
}
function reserve(state, proposal, now=nowSeconds()) {
  return change(state,s=>{
    keys(proposal,['id','merchant','epoch','credits','expiresAt']); identifier(proposal.id); address(proposal.merchant); positive(proposal.epoch,(1n<<64n)-1n); positive(proposal.credits,(1n<<32n)-1n); uint(proposal.expiresAt,(1n<<64n)-1n);
    const existing=s.intents.find(i=>i.id===proposal.id);
    if(existing)check(['id','merchant','epoch','credits','expiresAt'].every(k=>existing[k]===proposal[k]), 'Saved intent differs');
    fresh(s,now);
    check(uint(proposal.expiresAt)>BigInt(now) && uint(proposal.expiresAt)<=BigInt(now)+uint(s.profile.maxGrantSeconds), 'Invalid grant validity');
    if(!existing)for(const previous of s.intents.filter(i=>i.merchant===proposal.merchant)){
      check(uint(proposal.epoch)>uint(previous.epoch), 'Grant epoch cannot replay');
      check(previous.remaining==='0', 'Previous unused grant must be reconciled first');
    }
    const o=s.snapshot,p=s.profile;
    check(o.sourceFees.debtWei==='0' && o.destinationFees.debtWei==='0', 'Debt blocks new reservations');
    for(const [name,fees]of [['source',o.sourceFees],['destination',o.destinationFees]]) {
      check(uint(fees.gasPriceWei)<=uint(p[name+'PriceCapWei']) && fees.coefficient===p[name+'Coefficient'] && fees.surcharge===p[name+'Surcharge'], 'Fee parameters exceed reviewed profile');
    }
    const held=totals(s),count=existing?0n:uint(proposal.credits);
    check(uint(held.unusedCredits)+uint(held.unsettledJobs)+count<=uint(p.maxWork),'Work capacity is already committed');
    check(uint(o.sourceFees.reservesWei)>=uint(held.sourceHeldWei)+count*uint(p.sourceAllowanceWei)+uint(p.sourceBufferWei), 'Source fee allowance is already committed or insufficient');
    check(uint(o.destinationFees.reservesWei)+uint(o.destinationFees.balanceWei)>=uint(held.destinationHeldWei)+count*uint(p.destinationAllowanceWei)+uint(p.destinationBufferWei), 'Destination fee allowance is already committed or insufficient');
    if(existing)return;
    s.intents.push({...clone(proposal),remaining:proposal.credits,confirmed:false,releasedUnused:false,transactionHash:null,preparedAt:{base:clone(o.base),source:clone(o.source)},confirmedAt:null});
  });
}
function grant(state,id) { const i=state.intents.find(i=>i.id===id);check(i,'Unknown grant intent');return i; }
function fact(value,state) {
  keys(value,['identity','base','source','evidenceHash']);check(canonical(value.identity)===canonical(state.identity),'Evidence identity mismatch');
  validateBlock(value.base);validateBlock(value.source);hash(value.evidenceHash);
}
function caughtUp(s,evidence,now) {
  fresh(s,now);fact(evidence,s);
  for(const chain of ['base','source']) {
    const current=s.snapshot[chain],event=evidence[chain];
    check(uint(current.number)>=uint(event.number), 'Fee observation precedes obligation evidence');
    check(current.number!==event.number || canonical(current)===canonical(event), 'Evidence block differs from funding checkpoint');
    check(uint(current.timestamp)>=uint(event.timestamp),'Evidence timestamp exceeds funding checkpoint');
  }
}
function confirm(state,id,confirmation,now=nowSeconds()) {
  return change(state,s=>{
    keys(confirmation,['transactionHash','merchant','epoch','credits','expiresAt','profileHash','evidence']);
    const i=grant(s,id);hash(confirmation.transactionHash);caughtUp(s,confirmation.evidence,now);
    after(confirmation.evidence.base,i.preparedAt.base);after(confirmation.evidence.source,i.preparedAt.source);
    check(['merchant','epoch','credits','expiresAt'].every(k=>confirmation[k]===i[k]) && confirmation.profileHash===s.profileHash, 'Confirmed grant differs from reserved intent');
    if(i.confirmed)check(i.transactionHash===confirmation.transactionHash && canonical(i.confirmedAt)===canonical(confirmation.evidence.base),'Conflicting grant confirmation');
    else {i.confirmed=true;i.transactionHash=confirmation.transactionHash;i.confirmedAt=clone(confirmation.evidence.base);}
  });
}
function admit(state,id,admission) {
  return change(state,s=>{
    keys(admission,['quoteId','merchant','epoch','profileHash','expiresAt','refundCutoff','evidence']);positive(admission.quoteId);fact(admission.evidence,s);
    const i=grant(s,id);check(i.confirmed,'Grant confirmation required');
    after(admission.evidence.base,i.confirmedAt);after(admission.evidence.source,i.preparedAt.source);
    const at=uint(admission.evidence.base.timestamp),expiry=uint(admission.expiresAt,(1n<<64n)-1n),cutoff=uint(admission.refundCutoff,(1n<<64n)-1n);
    check(expiry>at && cutoff>=expiry && cutoff<=at+uint(s.profile.maxHorizonSeconds),'Admission exceeds reviewed horizon');
    check(admission.merchant===i.merchant && admission.epoch===i.epoch && admission.profileHash===s.profileHash,'Admission identity mismatch');
    const old=s.jobs.find(j=>j.quoteId===admission.quoteId);
    if(old){check(old.intentId===id && old.admissionEvidence===admission.evidence.evidenceHash,'Conflicting quote admission');return;}
    check(!i.releasedUnused && uint(i.remaining)>0n && uint(admission.evidence.base.timestamp)<uint(i.expiresAt),'No unused credit at admission time');
    i.remaining=(uint(i.remaining)-1n).toString();
    s.jobs.push({quoteId:admission.quoteId,intentId:id,terminal:false,settled:false,admissionEvidence:admission.evidence.evidenceHash,settlementEvidence:null,admittedAt:{base:clone(admission.evidence.base),source:clone(admission.evidence.source)}});
  });
}
function terminal(state,quoteId) {
  return change(state,s=>{const j=s.jobs.find(j=>j.quoteId===quoteId);check(j,'Unknown quote');j.terminal=true;});
}
function settle(state,quoteId,closure,now=nowSeconds()) {
  return change(state,s=>{
    keys(closure,['quoteId','epoch','profileHash','ledgerSettled','sourceSettled','pendingDeliveries','originBacklog','evidence']);
    const j=s.jobs.find(j=>j.quoteId===quoteId);check(j,'Unknown quote');caughtUp(s,closure.evidence,now);
    after(closure.evidence.base,j.admittedAt.base);after(closure.evidence.source,j.admittedAt.source);
    check(closure.quoteId===quoteId && closure.epoch===grant(s,j.intentId).epoch && closure.profileHash===s.profileHash,'Closure identity mismatch');
    check(j.terminal && closure.ledgerSettled===true && closure.sourceSettled===true && closure.pendingDeliveries==='0' && closure.originBacklog==='0','Closure or finite delivery tail is not reconciled');
    if(j.settled)check(j.settlementEvidence===closure.evidence.evidenceHash,'Conflicting settlement');
    else {j.settled=true;j.settlementEvidence=closure.evidence.evidenceHash;}
  });
}
function releaseUnused(state,id,reconciliation,now=nowSeconds()) {
  return change(state,s=>{
    keys(reconciliation,['merchant','intentEpoch','ledgerEpoch','remaining','admittedQuoteIds','evidence']);
    const i=grant(s,id);caughtUp(s,reconciliation.evidence,now);
    after(reconciliation.evidence.base,i.preparedAt.base);after(reconciliation.evidence.source,i.preparedAt.source);
    check(reconciliation.merchant===i.merchant && reconciliation.intentEpoch===i.epoch && uint(reconciliation.ledgerEpoch)>=uint(i.epoch) && reconciliation.remaining==='0','Unused grant is not closed on chain');
    check(Array.isArray(reconciliation.admittedQuoteIds),'Admitted history is missing');
    reconciliation.admittedQuoteIds.forEach(q=>positive(q));
    const known=s.jobs.filter(j=>j.intentId===id).map(j=>j.quoteId).sort();
    check(canonical([...reconciliation.admittedQuoteIds].sort())===canonical(known),'Admitted quote history must be reconciled before releasing unused credit');
    i.remaining='0';i.releasedUnused=true;
  });
}
function inspect(state,now=nowSeconds()) {
  const held=totals(state);let observationFresh=false;try{fresh(state,now);observationFresh=true;}catch{}
  return {schema:SCHEMA,revision:state.revision,profileHash:state.profileHash,...held,observationFresh,canGrant:false,
    enforcement:'Local sponsor guard only; chain-reader attestations are not independently verified here. Signing and grant execution are not implemented.'};
}
function filename(file) { check(path.basename(file)===FILE,'Use the separate renewable commitment journal; legacy journals are forbidden'); }
function secretFields(value) {
  if(!value||typeof value!=='object')return;
  for(const [key,child]of Object.entries(value)){check(!/private.?key|mnemonic|seed|raw.?transaction|signed.?transaction|rpc.?url/i.test(key),'Secret-bearing fields are forbidden');secretFields(child);}
}
function read(file) { filename(file);check(!fs.lstatSync(file).isSymbolicLink(),'Journal symlinks are forbidden');const s=JSON.parse(fs.readFileSync(file,'utf8'));secretFields(s);return validateState(s); }
function locked(file,operation) {
  filename(file);fs.mkdirSync(path.dirname(file),{recursive:true});const lock=file+'.lock';let fd;
  try{fd=fs.openSync(lock,'wx',0o600);}catch(error){throw Error(error.code==='EEXIST'?'Commitment journal is locked; preserve it and inspect the owning operation':'Commitment lock could not be acquired');}
  try{fs.writeFileSync(fd,JSON.stringify({pid:process.pid,startedAt:new Date().toISOString()})+'\n');fs.fsyncSync(fd);return operation();}finally{fs.closeSync(fd);fs.unlinkSync(lock);}
}
function write(file,state) {
  secretFields(state);validateState(state);
  const temporary=file+'.'+randomBytes(8).toString('hex')+'.tmp';let fd;
  try{fd=fs.openSync(temporary,'wx',0o600);fs.writeFileSync(fd,JSON.stringify(state,null,2)+'\n');fs.fsyncSync(fd);fs.closeSync(fd);fd=undefined;fs.renameSync(temporary,file);const directory=fs.openSync(path.dirname(file),'r');try{fs.fsyncSync(directory);}finally{fs.closeSync(directory);}}
  finally{if(fd!==undefined)fs.closeSync(fd);if(fs.existsSync(temporary))fs.unlinkSync(temporary);}
}
function initialize(file,state) { return locked(file,()=>{check(!fs.existsSync(file),'Commitment journal already exists');check(state.revision===0,'Initial journal revision must be zero');write(file,state);return state;}); }
function apply(state,command,now=nowSeconds()) {
  secretFields(command);keys(command,['type','payload']);
  const p=command.payload;
  switch(command.type){
    case 'observe': return observe(state,p,now);
    case 'reserve': return reserve(state,p,now);
    case 'confirm': keys(p,['id','confirmation']);return confirm(state,p.id,p.confirmation,now);
    case 'admit': keys(p,['id','admission']);return admit(state,p.id,p.admission);
    case 'terminal': keys(p,['quoteId']);return terminal(state,p.quoteId);
    case 'settle': keys(p,['quoteId','closure']);return settle(state,p.quoteId,p.closure,now);
    case 'releaseUnused': keys(p,['id','reconciliation']);return releaseUnused(state,p.id,p.reconciliation,now);
    default: throw Error('Unknown commitment operation');
  }
}
function transact(file,expectedRevision,command,now=nowSeconds()) {
  return locked(file,()=>{const state=read(file);check(state.revision===expectedRevision,'Stale commitment journal revision');const result=apply(state,command,now);result.revision++;write(file,result);return result;});
}
if(require.main===module){try{check(process.argv.length===4&&process.argv[2]==='inspect','Use inspect with the separate local commitment journal path');console.log(JSON.stringify(inspect(read(process.argv[3])),null,2));}catch{console.error('Local commitment inspection stopped; no grant, signature or transaction was created.');process.exitCode=1;}}
module.exports={create,observe,reserve,confirm,admit,terminal,settle,releaseUnused,totals,inspect,profileHash,validateState,initialize,transact,read,apply};
