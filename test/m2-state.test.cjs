const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {ZeroAddress}=require('ethers');
const start=require('./helpers/local-chain.cjs');
const {newJournal,assertJournal,saveJournal,runOperation,assertFilters}=require('../script/m2-state.cjs');
const source={SettlioReactive:'reactive-hash',SettlioCallback:'callback-hash'};
const funding={reactive:'100',callback:'10'};
test('M2 journal preserves M1 and rejects changed deployment inputs',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'settlio-m2-'));
 try {
 const j=newJournal(ZeroAddress,source,funding);
 assertJournal(j,ZeroAddress,source,funding);
 assert.throws(()=>assertJournal(j,ZeroAddress,{...source,SettlioReactive:'changed'},funding),/source changed/);
 assert.throws(()=>assertJournal(j,ZeroAddress,source,{...funding,reactive:'101'}),/funding changed/);
 assert.throws(()=>saveJournal(path.join(dir,'testnet.json'),j),/non-M2/);
 j.privateKey='never persist';
 assert.throws(()=>saveJournal(path.join(dir,'testnet-m2.json'),j),/confidential/);
 delete j.privateKey;
 saveJournal(path.join(dir,'testnet-m2.json'),j);
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir,'testnet-m2.json'))),j);
 } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
test('M2 subscription validation requires exact active source and scheduler',()=>{
 const reactive='0x0000000000000000000000000000000000000001';
 const escrow='0x0000000000000000000000000000000000000002';
 const topic='0x'+'ab'.repeat(32),cronTopic='0x'+'cd'.repeat(32);
 const options={reactive,escrow,topics:[topic],cronSource:ZeroAddress,cronTopic,cronExpected:false};
 const filter={ChainId:84532,Contract:escrow,Topics:[topic,null,null,null],Configs:[{Contract:reactive,Active:true}]};
 for(const upper of [false,true]) {
 const wrap=filters=>upper?{Version:12309,TopicFilters:filters}:{version:12309,topicFilters:filters};
 const result=wrap([filter]);
 assert.equal(assertFilters(result,options).originSubscriptions,1);
 assert.equal(assertFilters(result,options).filterVersion,12309);
 assert.throws(()=>assertFilters({},options),/schema/);
 assert.throws(()=>assertFilters(result,{...options,cronExpected:true}),/CRON/);
 for(const change of [{ChainId:1},{Contract:reactive},{Topics:[topic,'0x01']},{Configs:[{Contract:reactive,Active:false}]}]) {
 assert.throws(()=>assertFilters(wrap([{...filter,...change}]),options),/origin subscription/);
 }
 }

});
test('M2 saved intent resumes once after interruption before broadcast',async t=>{
 const {provider,signers}=await start(t,{chainId:84532});
 const signer=signers[0],from=await signer.getAddress(),to=await signers[1].getAddress();
 const journal=newJournal(from,source,funding);
 let persisted;
 const request={to,value:12345n};
 await assert.rejects(runOperation({journal,key:'configure',signer,request,chainId:84532,save(){persisted=JSON.stringify(journal);throw new Error('simulated interruption');}}),/simulated interruption/);
 assert.equal(await provider.getTransactionCount(from),0);
 assert.equal(await provider.getTransaction(journal.operations.configure.hash),null);
 assert.equal(/privateKey|rawTransaction|signedTransaction/.test(persisted),false);
 const restored=JSON.parse(persisted),hash=restored.operations.configure.hash;
 const before=await provider.getBalance(to);
 const args={journal:restored,key:'configure',signer,request,chainId:84532,save(){persisted=JSON.stringify(restored);}};
 const receipt=await runOperation(args);
 assert.equal(receipt.hash,hash);
 assert.equal(await provider.getBalance(to),before+12345n);
 await runOperation(args);
 assert.equal(await provider.getTransactionCount(from),1);
 assert.equal(await provider.getBalance(to),before+12345n);
});
test('M2 occupied nonce blocks replacement after saved preparation',async t=>{
 const {provider,signers}=await start(t,{chainId:84532});
 const signer=signers[0],from=await signer.getAddress(),to=await signers[1].getAddress();
 const journal=newJournal(from,source,funding),request={to,value:1n};
 await assert.rejects(runOperation({journal,key:'configure',signer,request,chainId:84532,save(){throw new Error('stop');}}),/stop/);
 await (await signer.sendTransaction({to,value:2n})).wait();
 await assert.rejects(runOperation({journal,key:'configure',signer,request,chainId:84532,save(){}}),/nonce is occupied/);
 assert.equal(await provider.getTransactionCount(from),1);
 assert.equal(await provider.getTransaction(journal.operations.configure.hash),null);
});
test('M2 reverted receipt remains failed without a new transaction',async t=>{
 const {provider,signers}=await start(t,{chainId:84532});
 const signer=signers[0],from=await signer.getAddress();
 // Real EVM creation executes REVERT. Explicit gas bypasses estimation only in this fixture.
 const journal=newJournal(from,source,funding),request={data:'0x60006000fd',gasLimit:100000n};
 const args={journal,key:'deployCallback',signer,request,chainId:84532,save(){}};
 await assert.rejects(runOperation(args),/failed on-chain/);
 const hash=journal.operations.deployCallback.hash;
 assert.equal(journal.operations.deployCallback.status,'failed');
 assert.equal((await provider.getTransactionReceipt(hash)).status,0);
 await assert.rejects(runOperation(args),/failed on-chain/);
 assert.equal(await provider.getTransactionCount(from),1);
 assert.equal(journal.operations.deployCallback.hash,hash);
});

test('M2 filter wrapper rejects ambiguous or malformed casing without interpreting it as empty subscriptions',()=>{
 const options={reactive:ZeroAddress,escrow:ZeroAddress,topics:[],cronSource:ZeroAddress,cronTopic:'0x'+'00'.repeat(32),cronExpected:false};
 for(const result of [null,[],{TopicFilters:null},{TopicFilters:[],topicFilters:[]},{TopicFilters:[],Version:1,version:2},{TopicFilters:[],Version:'12309'}]) assert.throws(()=>assertFilters(result,options),/schema|ambiguous|version invalid/);
});
