const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {ContractFactory,Contract,Interface,AbiCoder,keccak256,ZeroAddress}=require('ethers');
const start=require('./helpers/local-chain.cjs'),compile=require('../script/compile-renewable.cjs'),accounting=require('../script/renewable-commitments.cjs'),reader=require('../script/renewable-reader.cjs');
const coder=AbiCoder.defaultAbiCoder(),CONFIG='tuple(uint256 chainId,address recipient,uint64 gasLimit,bytes payload)';
const fixture={'test/fixtures/ReaderProtocolFixture.sol':{content:fs.readFileSync('test/fixtures/ReaderProtocolFixture.sol','utf8')}};
const arts={};const art=n=>arts[n]??=compile(n,fixture);
async function setup(t){
 const base=await start(t,{chainId:84532}),source=await start(t,{chainId:5318007}),owner=await base.signers[0].getAddress();
 // Both chains use the same ephemeral owner solely to reproduce constructor ownership.
 await source.provider.send('anvil_setBalance',[owner,'0x3635c9adc5dea00000']);
 const sourceWallet=base.signers[0].signer.connect(source.provider);const {NonceManager}=require('ethers'),ss=new NonceManager(sourceWallet);
 async function deploy(name,signer,args=[]){const a=art(name),c=await new ContractFactory(a.abi,a.evm.bytecode.object,signer).deploy(...args);await c.waitForDeployment();return c;}
 const prototype=await deploy('ReaderProtocolFixture',base.signers[0]),code=await base.provider.getCode(prototype.target);
 await base.provider.send('anvil_setCode',[reader.PROXY,code]);await source.provider.send('anvil_setCode',[reader.SYSTEM,code]);
 const proxy=new Contract(reader.PROXY,art('ReaderProtocolFixture').abi,base.signers[0]),system=new Contract(reader.SYSTEM,art('ReaderProtocolFixture').abi,ss);
 const reactive=await deploy('SettlioReactiveV5',ss,[84532,false]);
 const receiver=await deploy('SettlioCallbackV5',base.signers[0],[reader.PROXY,reactive.target,owner,2,2,900,60,1]);
 const escrow=new Contract(await receiver.escrow(),art('SettlioEscrowV5').abi,base.signers[0]),gate=new Contract(await escrow.admission(),art('SettlioWorkLedger').abi,base.signers[0]);
 await(await reactive.configure(escrow.target,receiver.target,gate.target)).wait();
 await(await system.depositTo(reactive.target,{value:1000000000000000000n})).wait();await(await proxy.depositTo(receiver.target,{value:1000000000000000000n})).wait();
 const lower=s=>s.toLowerCase(),identity={policyVersion:5,baseChainId:'84532',sourceChainId:'5318007',escrow:lower(escrow.target),receiver:lower(receiver.target),reactive:lower(reactive.target),workLedger:lower(gate.target),sponsor:lower(owner)};
 const runtimeHashes={};for(const [name,c,p]of [['escrow',escrow,base.provider],['receiver',receiver,base.provider],['reactive',reactive,source.provider],['workLedger',gate,base.provider]])runtimeHashes[name]=keccak256(await p.getCode(c.target));
 const profile={sourceAllowanceWei:'10000000000000000',destinationAllowanceWei:'1000000000000000',sourceBufferWei:'1000',destinationBufferWei:'1000',maxHorizonSeconds:'900',maxWork:'2',maxGrantSeconds:'600',maxObservationAgeSeconds:'120',maxHeadAgeSeconds:'180',sourcePriceCapWei:'1000000000000',destinationPriceCapWei:'1000000000000',sourceCoefficient:'1000',destinationCoefficient:'1100',sourceSurcharge:'100000',destinationSurcharge:'80000',adaptiveTimers:false,runtimeHashes,modelReviewHash:keccak256('0x1234')};
 const manifest={baseCreationHash:receiver.deploymentTransaction().hash,sourceCreationHash:reactive.deploymentTransaction().hash,configuration:{maxActive:'2',maxRetries:'1',retryInterval:'60',sourceConstructorWei:'0',destinationConstructorWei:'0'},serviceRuntimeHashes:{proxy:keccak256(code),system:keccak256(code)}};
 const seen=[];
 const baseRPC={send:async(m,p)=>{seen.push(m);return base.provider.send(m,p);}};
 const sourceRPC={send:async(m,p)=>{seen.push(m);if(m!=='rnk_getFilters')return source.provider.send(m,p);
  const TopicFilters=[];for(let n=0;n<Number(await system.countFilters());n++){const f=await system.getFunction('filters')(n);TopicFilters.push({ChainId:f.chain.toString(),Contract:f.target,Topics:['0x'+f.topic.toString(16).padStart(64,'0'),...[f.t1,f.t2,f.t3].map(v=>v===BigInt('0xa65f96fc951c35ead38878e0f0b7a3c744a6f5ccc1476b313353ce31712313ad')?null:'0x'+v.toString(16).padStart(64,'0'))],Configs:[{Contract:f.subscriber,Active:f.active}]});}
  return{Version:Number(await system.version()),TopicFilters};
 }};
 async function now(){return Math.max((await base.provider.getBlock('latest')).timestamp,(await source.provider.getBlock('latest')).timestamp);}
 async function observe(state,changes={}){for(const chain of [base,source])await chain.provider.send('anvil_mine',['0x80','0x0']);return reader.collect({base:baseRPC,source:sourceRPC,state,manifest,now:await now(),...changes});}
 let sequence=100000;
 async function trigger(log){return(await system.trigger(reactive.target,log,{gasLimit:900000})).wait();}
 async function forward(receipt){for(const l of receipt.logs){if(![escrow.target,gate.target].some(a=>lower(a)===lower(l.address)))continue;
  await trigger({chainId:84532,contractAddress:l.address,topic0:BigInt(l.topics[0]),topic1:BigInt(l.topics[1]||0),topic2:BigInt(l.topics[2]||0),topic3:BigInt(l.topics[3]||0),data:l.data,blockNumber:receipt.blockNumber,opCode:l.topics.length,blockHash:BigInt(receipt.blockHash),txHash:BigInt(receipt.hash),logIndex:l.index});
 }}
 async function tick(){const n=++sequence;return trigger({chainId:5318007,contractAddress:await reactive.CRON_SOURCE(),topic0:await reactive.CRON_TOPIC(),topic1:n,topic2:0,topic3:0,data:'0x',blockNumber:n,opCode:2,blockHash:BigInt(n),txHash:BigInt(n),logIndex:0});}
 const sysI=new Interface(['event CallbackRequest(uint256 indexed chainId,address indexed sender,address indexed recipient,uint8 version,bytes configuration)']);
 async function deliver(requestReceipt,{report=true,index=0}={}){
  const log=requestReceipt.logs.filter(l=>lower(l.address)===reader.SYSTEM&&l.topics[0]===sysI.getEvent('CallbackRequest').topicHash)[index],e=sysI.parseLog(log).args,cfg=coder.decode([CONFIG],e.configuration)[0];
  const parsed=receiver.interface.parseTransaction({data:cfg.payload}),args=[...parsed.args];args[0]=reactive.target;
  const encoded=coder.encode([CONFIG],[[cfg.chainId,cfg.recipient,cfg.gasLimit,receiver.interface.encodeFunctionData(parsed.name,args)]]);
  const receipt=await(await proxy.deliverCallback(0,encoded)).wait();
  if(report)await(await system.recordReport(BigInt(requestReceipt.hash),requestReceipt.blockNumber,reactive.target,index,84532,BigInt(receipt.hash),'0x')).wait();
  return receipt;
 }
 return{base,source,baseRPC,sourceRPC,seen,system,proxy,reactive,receiver,escrow,gate,identity,profile,manifest,now,observe,forward,tick,deliver};
}
test('V5 read-only adapter verifies two-chain deployment, replays events and reconciles actual local settlement',async t=>{
 const f=await setup(t);let state=accounting.create(f.identity,f.profile),report=await f.observe(state,{now:undefined});state=accounting.observe(state,report.snapshot,Number(report.snapshot.observedAt));
 const now=Math.max(await f.now(),Number(report.snapshot.observedAt)),proposal={id:'reader-intent',merchant:f.identity.sponsor,epoch:'1',credits:'1',expiresAt:String(now+500)};
 state=accounting.reserve(state,proposal,now);await(await f.gate.setOpen(true)).wait();await(await f.gate.setGrant(proposal.merchant,1,1,proposal.expiresAt,state.profileHash,keccak256('0xabcd'))).wait();
 const creation=await(await f.escrow.createQuote(await f.base.signers[1].getAddress(),300,100,now+100,now+200,keccak256('0x1234'))).wait();await f.forward(creation);
 await f.base.provider.send('evm_setNextBlockTimestamp',[now+100]);await f.base.provider.send('evm_mine',[]);await f.source.provider.send('evm_setNextBlockTimestamp',[now+100]);await f.source.provider.send('evm_mine',[]);
 const request=await f.tick(),expired=await f.deliver(request);await f.forward(expired);
 const ackRequest=await f.tick(),settled=await f.deliver(ackRequest);await f.forward(settled);
 report=await f.observe(state);assert.equal(report.readOnly,true);assert.ok(Object.isFrozen(report)&&Object.isFrozen(report.jobs[0]));assert.equal(report.canGrant,false);assert.equal(report.jobs[0].reconciled,true);assert.equal(report.jobs[0].originBacklog,'0');assert.equal(report.jobs[0].pendingDeliveries,'0');assert.equal(report.requests.length,2);
 for(const command of reader.reconciliationCommands(state,report))state=accounting.apply(state,command,await f.now());
 assert.equal(accounting.totals(state).sourceHeldWei,'0');assert.equal(state.jobs[0].settled,true);assert.ok(f.seen.every(m=>!/(sendTransaction|sendRawTransaction|sign|estimateGas)/.test(m)));
 assert.throws(()=>reader.reconciliationCommands(state,JSON.parse(JSON.stringify(report))),/original immutable/);
 const missing={send:async(m,p)=>m==='eth_getLogs'&&p[0].address===reader.SYSTEM?[]:f.sourceRPC.send(m,p)};
 await assert.rejects(f.observe(state,{source:missing}),/history is incomplete/);
});
test('V5 adapter keeps missing callback return reports pending even when both-chain state is terminal',async t=>{
 const f=await setup(t);let state=accounting.create(f.identity,f.profile),initial=await f.observe(state);state=accounting.observe(state,initial.snapshot,await f.now());
 const now=await f.now();await(await f.gate.setOpen(true)).wait();await(await f.gate.setGrant(f.identity.sponsor,1,1,now+500,state.profileHash,keccak256('0xabcd'))).wait();
 await f.forward(await(await f.escrow.createQuote(await f.base.signers[1].getAddress(),300,100,now+100,now+200,keccak256('0x1234'))).wait());
 for(const c of [f.base,f.source]){await c.provider.send('evm_setNextBlockTimestamp',[now+100]);await c.provider.send('evm_mine',[]);}
 await f.forward(await f.deliver(await f.tick()));const ack=await f.tick();await f.forward(await f.deliver(ack,{report:false}));
 const r=await f.observe(state);assert.equal(r.jobs[0].settled,true);assert.equal(r.jobs[0].sourceSettled,true);assert.equal(r.jobs[0].reconciled,false);assert.ok(BigInt(r.jobs[0].pendingDeliveries)>0n);
 await assert.rejects(async()=>reader.reconciliationCommands(state,r),/reserved local intent/);
});
test('V5 adapter rejects wrong chains, runtime/wiring drift, truncated history and changing pinned checkpoints',async t=>{
 const f=await setup(t),state=accounting.create(f.identity,f.profile);
 await assert.rejects(f.observe(state,{source:{send:async(m,p)=>m==='eth_chainId'?'0x14a34':f.sourceRPC.send(m,p)}}),/networks/);
 const bad=structuredClone(state);bad.profile.runtimeHashes.reactive=keccak256('0x99');bad.profileHash=accounting.profileHash(bad.identity,bad.profile);
 await assert.rejects(f.observe(bad),/Runtime hash/);
 await assert.rejects(f.observe(state,{maxPages:1,pageSize:1}),/bounded scan/);
 const changed={send:async(m,p)=>{const result=await f.baseRPC.send(m,p);if(m==='eth_getBlockByNumber'&&p[0]!=='latest'&&p[0]!=='finalized')return{...result,hash:keccak256('0xdead')};return result;}};
 await assert.rejects(f.observe(state,{base:changed}),/Noncanonical|Checkpoint/);
 let latestCalls=0;
 const transientSkew={send:async(m,p)=>{const result=await f.sourceRPC.send(m,p);if(m==='eth_getBlockByNumber'&&p[0]==='latest'&&latestCalls++===0){const fin=await f.sourceRPC.send('eth_getBlockByNumber',['finalized',false]);return{...result,number:'0x'+((BigInt(fin.number)-1n).toString(16))};}return result;}};
 const recovered=await f.observe(state,{source:transientSkew});
 assert.equal(recovered.canGrant,false);
 assert.equal(latestCalls,2);
 const persistentSkew={send:async(m,p)=>{const result=await f.sourceRPC.send(m,p);if(m==='eth_getBlockByNumber'&&p[0]==='latest'){const fin=await f.sourceRPC.send('eth_getBlockByNumber',['finalized',false]);return{...result,number:'0x'+((BigInt(fin.number)-1n).toString(16))};}return result;}};
 await assert.rejects(f.observe(state,{source:persistentSkew}),/Unstable finalized checkpoint/);
});

test('V5 adapter refuses missing native filters and omitted admission history instead of releasing backing',async t=>{
 const f=await setup(t),state=accounting.create(f.identity,f.profile);
 const missingIndex={send:async(m,p)=>{const r=await f.sourceRPC.send(m,p);return m==='rnk_getFilters'?{...r,TopicFilters:r.TopicFilters.slice(1)}:r;}};
 await assert.rejects(f.observe(state,{source:missingIndex}),/filter missing/);
 const now=await f.now();await(await f.gate.setOpen(true)).wait();await(await f.gate.setGrant(f.identity.sponsor,1,1,now+500,state.profileHash,keccak256('0xabcd'))).wait();
 await(await f.escrow.createQuote(await f.base.signers[1].getAddress(),300,100,now+100,now+200,keccak256('0x1234'))).wait();
 const admittedTopic=f.gate.interface.getEvent('Admitted').topicHash;
 const truncated={send:async(m,p)=>{const r=await f.baseRPC.send(m,p);return m==='eth_getLogs'&&p[0].address===f.identity.workLedger?r.filter(l=>l.topics[0]!==admittedTopic):r;}};
 await assert.rejects(f.observe(state,{base:truncated}),/history|counter/);
 const r=await f.observe(state);assert.ok(BigInt(r.jobs[0].originBacklog)>0n);assert.equal(r.jobs[0].reconciled,false);
});

test('V5 reader binds multiple callbacks in the same source transaction to distinct reports and payloads',async t=>{
 const f=await setup(t);let state=accounting.create(f.identity,f.profile),r=await f.observe(state);state=accounting.observe(state,r.snapshot,await f.now());
 const now=await f.now(),proposal={id:'two-quotes',merchant:f.identity.sponsor,epoch:'1',credits:'2',expiresAt:String(now+500)};state=accounting.reserve(state,proposal,now);
 await(await f.gate.setOpen(true)).wait();await(await f.gate.setGrant(proposal.merchant,1,2,proposal.expiresAt,state.profileHash,keccak256('0xabcd'))).wait();
 for(let n=0;n<2;n++)await f.forward(await(await f.escrow.createQuote(await f.base.signers[1].getAddress(),300,100,now+100,now+200,keccak256('0x1234'))).wait());
 for(const c of [f.base,f.source]){await c.provider.send('evm_setNextBlockTimestamp',[now+100]);await c.provider.send('evm_mine',[]);}
 const expiryRequests=await f.tick();for(let index=0;index<2;index++)await f.forward(await f.deliver(expiryRequests,{index}));
 const ackRequests=await f.tick();for(let index=0;index<2;index++)await f.forward(await f.deliver(ackRequests,{index}));
 r=await f.observe(state);assert.equal(r.requests.length,4);assert.deepEqual(r.requests.map(x=>x.index).sort(),[0,0,1,1]);assert.ok(r.jobs.every(j=>j.reconciled));
 assert.equal(new Set(r.requests.flatMap(x=>x.deliveries.map(d=>d.transactionHash))).size,4);
 for(const command of reader.reconciliationCommands(state,r))state=accounting.apply(state,command,await f.now());assert.equal(accounting.totals(state).sourceHeldWei,'0');
});

test('V5 reader resumes incrementally from a verified finalized checkpoint and rejects tampered or reorged checkpoints',async t=>{
 const f=await setup(t);let state=accounting.create(f.identity,f.profile),r=await f.observe(state);state=accounting.observe(state,r.snapshot,await f.now());
 const now=await f.now(),proposal={id:'inc-1',merchant:f.identity.sponsor,epoch:'1',credits:'1',expiresAt:String(now+500)};state=accounting.reserve(state,proposal,now);
 await(await f.gate.setOpen(true)).wait();await(await f.gate.setGrant(proposal.merchant,1,1,proposal.expiresAt,state.profileHash,keccak256('0xabcd'))).wait();
 await f.forward(await(await f.escrow.createQuote(await f.base.signers[1].getAddress(),300,100,now+100,now+200,keccak256('0x1234'))).wait());
 const cp1=await f.observe(state,{previousCheckpoint:r.checkpoint});
 assert.equal(cp1.history.incremental,true);assert.equal(cp1.jobs.length,1);assert.equal(cp1.jobs[0].reconciled,false);
 for(const c of [f.base,f.source]){await c.provider.send('evm_setNextBlockTimestamp',[now+100]);await c.provider.send('evm_mine',[]);}
 await f.forward(await f.deliver(await f.tick()));
 await f.forward(await f.deliver(await f.tick()));
 // Full scan with tiny maxPages=1, pageSize=5 fails, while incremental resume from cp1.checkpoint succeeds.
 await assert.rejects(f.observe(state,{pageSize:5,maxPages:1}),/bounded scan/);
 const cp2=await f.observe(state,{previousCheckpoint:cp1.checkpoint,pageSize:200,maxPages:2});
 assert.equal(cp2.history.incremental,true);assert.equal(cp2.jobs[0].reconciled,true);
 for(const command of reader.reconciliationCommands(state,cp2))state=accounting.apply(state,command,await f.now());
 assert.equal(accounting.totals(state).sourceHeldWei,'0');
 const tampered=structuredClone(cp1.checkpoint);tampered.open=!tampered.open;
 await assert.rejects(f.observe(state,{previousCheckpoint:tampered}),/integrity digest/);
 const {createHash}=require('node:crypto');
 const canonicalJson=v=>Array.isArray(v)?'['+v.map(canonicalJson).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonicalJson(v[k])).join(',')+'}':JSON.stringify(v);
 const recompute=cp=>{const {integrityDigest,...b}=cp;return{...b,integrityDigest:'0x'+createHash('sha256').update(JSON.stringify(b)).digest('hex')};};
 assert.equal(cp1.checkpoint.provenance,'unauthenticated-integrity-digest');
 const forgedOpen=recompute({...structuredClone(cp1.checkpoint),open:!cp1.checkpoint.open});
 await assert.rejects(f.observe(state,{previousCheckpoint:forgedOpen}),/counter mismatch/);
 const forgedGrant=structuredClone(cp1.checkpoint);forgedGrant.grants[0].remaining='9';
 await assert.rejects(f.observe(state,{previousCheckpoint:recompute(forgedGrant)}),/counter mismatch|Grant view/);
 const forgedReorg=structuredClone(cp1.checkpoint);forgedReorg.base.hash=keccak256('0xbeef');
 await assert.rejects(f.observe(state,{previousCheckpoint:recompute(forgedReorg)}),/block hash mismatch/);
 const reorged={send:async(m,p)=>{const res=await f.baseRPC.send(m,p);if(m==='eth_getBlockByNumber'&&p[0]!=='latest'&&p[0]!=='finalized'&&BigInt(p[0])===BigInt(cp1.checkpoint.base.number))return{...res,hash:keccak256('0xbeef')};return res;}};
 await assert.rejects(f.observe(state,{base:reorged,previousCheckpoint:cp1.checkpoint}),/block hash mismatch/);
});
