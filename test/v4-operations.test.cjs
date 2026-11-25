const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {ContractFactory,Contract,Wallet,keccak256,AbiCoder,parseEther}=require('ethers');
const start=require('./helpers/local-chain.cjs'),compile=require('../script/compile-admission.cjs');
const state=require('../script/v4-state.cjs'),v4=require('../script/v4-deploy.cjs'),funding=require('../script/v4-fund.cjs'),grants=require('../script/v4-grant.cjs');
const {SYSTEM,PROXY,USDC,CRON}=require('../script/m2-network.cjs');
const configuration={admission:{maxActive:'2',maxLifetimeAdmissions:'2',maxHorizon:'1000',retryInterval:'60',maxRetries:'1'},constructorFunding:{reactive:'100000000000000000',callback:'1000000000000000'}};
const fixture={'test/V4OperationsProtocol.sol':{content:`// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;
import {IReactive} from "@reactive/src/interfaces/IReactive.sol";
contract V4OperationsProtocol {
 event Cron100(uint256 indexed number);
 mapping(bytes32=>bool) public subscriptions;
 mapping(address=>uint256) public reserves;
 function debt(address) external pure returns(uint256){return 0;}
 function depositTo(address target) external payable {reserves[target]+=msg.value;}
 function _gasPriceCoeffPer1000() external pure returns(uint256){return 1000;}
 function _extraGas() external pure returns(uint256){return 100000;}
 function balanceOf(address) external pure returns(uint256){return 0;}
 function decimals() external pure returns(uint8){return 6;}
 function symbol() external pure returns(string memory){return "USDC";}
 function emitCron() external {emit Cron100(block.number);}
 function forward(address target,IReactive.LogRecord calldata record) external {IReactive(payable(target)).react(record);}
 function subscribe(uint256 chain,address target,uint256 t0,uint256 t1,uint256 t2,uint256 t3) external {subscriptions[keccak256(abi.encode(msg.sender,chain,target,t0,t1,t2,t3))]=true;}
 function unsubscribe(uint256 chain,address target,uint256 t0,uint256 t1,uint256 t2,uint256 t3) external {subscriptions[keccak256(abi.encode(msg.sender,chain,target,t0,t1,t2,t3))]=false;}
}`}};

test('V4 public settings reject ambiguous values and journal cannot overwrite legacy or persist secrets',()=>{
 assert.deepEqual(v4.settings(configuration),configuration);
 for(const change of [{...configuration,extra:true},{...configuration,admission:{...configuration.admission,maxActive:'0'}},{...configuration,admission:{...configuration.admission,maxHorizon:'1'}},{...configuration,admission:{...configuration.admission,maxActive:'3'}},{...configuration,constructorFunding:{reactive:'-1',callback:'1'}}])assert.throws(()=>v4.settings(change));
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'v4-public-'));try{const j=state.create('0x0000000000000000000000000000000000000001',{});assert.throws(()=>state.save(path.join(dir,'testnet-m2.json'),j),/outside/);j.privateKey='fixture marker, not a key';assert.throws(()=>state.save(path.join(dir,'testnet-v4.json'),j),/Confidential/);}finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('V4 saved intent survives a preparation interruption and refuses network/occupied nonce replacements',async t=>{
 const {provider,signers}=await start(t,{chainId:84532});const key=signers[0].signer.privateKey,signer=new Wallet(key,provider),j=state.create(signer.address,{}),to=await signers[1].getAddress();let persisted;
 const args={journal:j,key:'grantInitial',signer,request:{to,value:123n},save(){persisted=JSON.stringify(j);throw Error('fixture stop before broadcast');}};
 await assert.rejects(state.run(args),/fixture stop/);assert.equal(await provider.getTransactionCount(signer.address),0);
 const restored=JSON.parse(persisted),before=await provider.getBalance(to);const run={...args,journal:restored,save(){}};
 const receipt=await state.run(run);await state.run(run);assert.equal(receipt.hash,restored.operations.grantInitial.hash);assert.equal(await provider.getBalance(to),before+123n);assert.equal(await provider.getTransactionCount(signer.address),1);
 await assert.rejects(state.run({...run,key:'deployReactive'}),/network/);
 const busy=state.create(signer.address,{});await assert.rejects(state.run({...args,journal:busy,key:'openAdmission'}),/fixture stop/);await(await signer.sendTransaction({to,value:2n})).wait();await assert.rejects(state.run({...run,journal:busy,key:'openAdmission'}),/nonce is occupied/);
 assert.equal(JSON.stringify(restored).includes(key),false);
});

test('V4 deployment resumes after index failure; capped funding, initial grant and admission open are idempotent',{timeout:240000},async t=>{
 const base=await start(t,{chainId:84532}),source=await start(t,{chainId:5318007});
 const directoryRoot=fs.mkdtempSync(path.join(os.tmpdir(),'settlio-v4-operations-'));t.after(()=>fs.rmSync(directoryRoot,{recursive:true,force:true}));
 fs.mkdirSync(path.join(directoryRoot,'deployments'));fs.writeFileSync(path.join(directoryRoot,'deployments/testnet-m2.json'),'legacy sentinel');
 const key=base.signers[0].signer.privateKey,owner=await base.signers[0].getAddress();await source.provider.send('anvil_setBalance',[owner,'0x21e19e0c9bab2400000']);
 const fa=compile('V4OperationsProtocol',fixture),prototype=await new ContractFactory(fa.abi,fa.evm.bytecode.object,source.signers[3]).deploy();await prototype.waitForDeployment();const code=await source.provider.getCode(prototype.target);
 for(const address of [SYSTEM,CRON])await source.provider.send('anvil_setCode',[address,code]);
 for(const address of [PROXY,USDC])await base.provider.send('anvil_setCode',[address,code]);
 const system=new Contract(SYSTEM,fa.abi,source.provider),emitter=new Contract(CRON,fa.abi,source.signers[3]);let time=(await source.provider.getBlock('latest')).timestamp;
 for(let index=0;index<3;index++){time+=100;await source.provider.send('evm_setNextBlockTimestamp',[time]);await source.provider.send('evm_mine',[]);await(await emitter.emitCron()).wait();}
 await base.provider.send('evm_setNextBlockTimestamp',[time]);await base.provider.send('evm_mine',[]);
 const reactiveABI=compile('SettlioReactiveV4').abi;
 let failIndex=true;
 const lasna=new Proxy(source.provider,{get(target,property){if(property!=='send'){const value=target[property];return typeof value==='function'?value.bind(target):value;}return async(method,args)=>{
  if(method!=='rnk_getFilters')return target.send(method,args);
  if(failIndex)throw Error('fixture unavailable index');
  const j=state.read(directoryRoot),r=new Contract(j.contracts.SettlioReactiveV4.address,reactiveABI,source.provider);
  const ignore=BigInt('0xa65f96fc951c35ead38878e0f0b7a3c744a6f5ccc1476b313353ce31712313ad'),filters=[];
  for(const name of ['DEPOSIT_TOPIC','RETRY_TOPIC','POLICY_TOPIC','POLICY_RETRY_TOPIC','CANCEL_TOPIC','CONFIRMED_TOPIC','CHECKED_TOPIC','REFUNDED_TOPIC','EXPIRED_TOPIC','RELEASED_TOPIC']){const topic=await r[name](),lookup=keccak256(AbiCoder.defaultAbiCoder().encode(['address','uint256','address','uint256','uint256','uint256','uint256'],[r.target,84532,j.escrow,topic,ignore,ignore,ignore]));filters.push({ChainId:84532,Contract:j.escrow,Topics:['0x'+topic.toString(16).padStart(64,'0'),null,null,null],Configs:[{Contract:r.target,Active:await system.subscriptions(lookup)}]});}
  const ct=await r.CRON_TOPIC(),ck=keccak256(AbiCoder.defaultAbiCoder().encode(['address','uint256','address','uint256','uint256','uint256','uint256'],[r.target,5318007,CRON,ct,ignore,ignore,ignore]));filters.push({ChainId:5318007,Contract:CRON,Topics:['0x'+ct.toString(16).padStart(64,'0'),null,null,null],Configs:[{Contract:r.target,Active:await system.subscriptions(ck)}]});
  return {Version:1,TopicFilters:filters};
 };}});
 const args={config:{...configuration,admission:{...configuration.admission,maxLifetimeAdmissions:'6'}},base:base.provider,lasna,env:{DEPLOYER_PRIVATE_KEY:key},directoryRoot};
 const planned=await v4.plan({deployer:owner,...args});assert.equal(planned.readOnly,true);assert.equal(fs.existsSync(state.paths(directoryRoot).journal),false);
 await assert.rejects(v4.deploy(args),/unavailable index/);
 const saved=state.read(directoryRoot);assert.equal(Object.keys(saved.operations).length,3);const originalHashes=Object.fromEntries(Object.entries(saved.operations).map(([k,v])=>[k,v.hash]));
 const baseNonce=await base.provider.getTransactionCount(owner),sourceNonce=await source.provider.getTransactionCount(owner);
 failIndex=false;const deployed=await v4.deploy(args);assert.equal(deployed.observation.wiringVerified,true);assert.equal(deployed.observation.admission.open,false);
 assert.equal(await base.provider.getTransactionCount(owner),baseNonce);assert.equal(await source.provider.getTransactionCount(owner),sourceNonce);
 const changedFunding=structuredClone(state.read(directoryRoot));changedFunding.settings.config.constructorFunding.callback='2';await assert.rejects(v4.verify({journal:changedFunding,base:base.provider,lasna}),/constructor funding/);
 assert.equal(deployed.observation.identity.reactive,deployed.observation.identity.callback); // Same nonce/address on different chains is valid.
 await assert.rejects(v4.deploy({...args,config:{...configuration,admission:{...configuration.admission,maxHorizon:'1100'}}}),/settings differ/);
 const clock=()=>BigInt(Math.floor(Date.now()/1000)+300); // Follow the advancing fixture clocks shifted by three 100-second CRON intervals.
 const io={base:base.provider,lasna,directoryRoot,env:args.env,clock};
 const before=await funding.readiness(io);assert.equal(before.result.canGrant,false);
 await assert.rejects(funding.fund({...io,caps:{reactive:'0',callback:'0'}}),/caps/);assert.equal(state.read(directoryRoot).operations.fundReactiveInitial,undefined);
 const funded=await funding.fund({...io,caps:{reactive:parseEther('200').toString(),callback:parseEther('100').toString()}});assert.equal(funded.result.canGrant,true);
 const afterSourceNonce=await source.provider.getTransactionCount(owner),afterBaseNonce=await base.provider.getTransactionCount(owner);
 await funding.fund({...io,caps:{reactive:parseEther('200').toString(),callback:parseEther('100').toString()}});
 assert.equal(await source.provider.getTransactionCount(owner),afterSourceNonce);assert.equal(await base.provider.getTransactionCount(owner),afterBaseNonce);
 await assert.rejects(grants.execute({...io,mode:'open'}),/confirmed/);
 const input={merchant:owner,credits:'1',validSeconds:'600'};
 const granted=await grants.execute({...io,mode:'grant',input});assert.equal(granted.admissionOpen,false);
 const grantNonce=await base.provider.getTransactionCount(owner);await grants.execute({...io,mode:'grant',input});assert.equal(await base.provider.getTransactionCount(owner),grantNonce);
 const journalFile=state.paths(directoryRoot).journal,originalJournal=fs.readFileSync(journalFile,'utf8'),corrupt=JSON.parse(originalJournal);corrupt.initialGrant.result.fundingObservation='0x'+'00'.repeat(32);state.save(journalFile,corrupt);await assert.rejects(grants.execute({...io,mode:'grant',input}),/fingerprint/);fs.writeFileSync(journalFile,originalJournal);assert.equal(await base.provider.getTransactionCount(owner),grantNonce);
 await assert.rejects(grants.execute({...io,mode:'grant',input:{...input,credits:'2'}}),/proposal differs/);
 // A controlled future local clock must refuse opening before any transaction is prepared.
 const expiredClock=BigInt(state.read(directoryRoot).initialGrant.result.validUntil)+100n;
 await assert.rejects(grants.execute({...io,mode:'open',clock:()=>expiredClock}),/expired/);
 const opened=await grants.execute({...io,mode:'open'});assert.equal(opened.admissionOpen,true);const openedNonce=await base.provider.getTransactionCount(owner);
 await grants.execute({...io,mode:'open'});await grants.execute({...io,mode:'grant',input});assert.equal(await base.provider.getTransactionCount(owner),openedNonce);
 const renewal=require('../script/v4-renew.cjs');
 await assert.rejects(renewal.inspect(io),/not expired/);
 const originalGrant=structuredClone(state.read(directoryRoot).initialGrant);
 const initialGrantHash=state.read(directoryRoot).operations.grantInitial.hash;
 const initialOpenHash=state.read(directoryRoot).operations.openAdmission.hash;
 // Move real fixture chains beyond the grant, then emit fresh indexed CRON samples.
 let renewalTime=(await source.provider.getBlock('latest')).timestamp+700;
 for(let i=0;i<3;i++){renewalTime+=100;await source.provider.send('evm_setNextBlockTimestamp',[renewalTime]);await(await emitter.emitCron()).wait();}
 await base.provider.send('evm_setNextBlockTimestamp',[renewalTime]);await base.provider.send('evm_mine',[]);
 const renewalIO={...io,clock:()=>BigInt(renewalTime)};
 const renewalPlan=await renewal.inspect(renewalIO);assert.equal(renewalPlan.result.canGrant,true);assert.equal(state.read(directoryRoot).expiredGrantRenewal,undefined);
 await assert.rejects(renewal.renew({...renewalIO,env:{DEPLOYER_PRIVATE_KEY:base.signers[1].signer.privateKey}}),/differs/);
 const renewed=await renewal.renew(renewalIO);assert.equal(renewed.admissionOpen,true);assert.equal(renewed.grant[0],'1');assert(BigInt(renewed.grant[1])>BigInt(originalGrant.result.validUntil));
 const renewalNonce=await base.provider.getTransactionCount(owner);
 const repeated=await renewal.renew(renewalIO);assert.equal(repeated.transactionHash,renewed.transactionHash);assert.equal(await base.provider.getTransactionCount(owner),renewalNonce);
 assert.deepEqual(state.read(directoryRoot).initialGrant,originalGrant);assert.equal(state.read(directoryRoot).operations.grantInitial.hash,initialGrantHash);assert.equal(state.read(directoryRoot).operations.openAdmission.hash,initialOpenHash);
 const validRenewalJournal=fs.readFileSync(journalFile,'utf8'),edited=JSON.parse(validRenewalJournal);edited.expiredGrantRenewal.payload.proposal.credits='2';state.save(journalFile,edited);
 await assert.rejects(renewal.renew(renewalIO),/integrity/);fs.writeFileSync(journalFile,validRenewalJournal);
 await assert.rejects(renewal.inspect({...renewalIO,window:true}),/not expired/);
 const firstRenewal=structuredClone(state.read(directoryRoot).expiredGrantRenewal);
 renewalTime+=700;
 for(let i=0;i<3;i++){renewalTime+=100;await source.provider.send('evm_setNextBlockTimestamp',[renewalTime]);await(await emitter.emitCron()).wait();}
 await base.provider.send('evm_setNextBlockTimestamp',[renewalTime]);await base.provider.send('evm_mine',[]);
 const windowIO={...renewalIO,window:true};
 const windowPlan=await renewal.inspect(windowIO);assert.equal(windowPlan.proposal.validSeconds,'3600');assert.equal(windowPlan.result.canGrant,true);
 const windowGrant=await renewal.renew(windowIO);assert.equal(windowGrant.admissionOpen,true);assert.equal(BigInt(windowGrant.grant[1]),BigInt(renewalTime)+3600n);
 const windowNonce=await base.provider.getTransactionCount(owner);
 assert.equal((await renewal.renew(windowIO)).transactionHash,windowGrant.transactionHash);assert.equal(await base.provider.getTransactionCount(owner),windowNonce);
 assert.deepEqual(state.read(directoryRoot).expiredGrantRenewal,firstRenewal);assert.deepEqual(state.read(directoryRoot).initialGrant,originalGrant);
 assert.equal((await v4.verify({journal:state.read(directoryRoot),base:base.provider,lasna})).admission.admitted,0n);
 const next=require('../script/v4-next-grant.cjs');
 await assert.rejects(next.inspect(windowIO),/Previous grant|exactly one/);
 const e=new Contract(state.read(directoryRoot).escrow,compile('SettlioEscrowV4').abi,new Wallet(key,base.provider));
 const customer=await base.signers[1].getAddress(),terms=keccak256('0x123456');
 await(await e.createQuote(customer,300,100,renewalTime+100,renewalTime+200,terms)).wait();
 await assert.rejects(next.inspect(windowIO),/exactly one/);
 await base.provider.send('evm_setNextBlockTimestamp',[renewalTime+100]);await base.provider.send('evm_mine',[]);
 const callback=state.read(directoryRoot).contracts.SettlioCallbackV4.address;
 await base.provider.send('anvil_impersonateAccount',[callback]);
 const expired=await(await e.connect(await base.provider.getSigner(callback)).processPolicy(1)).wait();
 await base.provider.send('anvil_stopImpersonatingAccount',[callback]);
 // A destination terminal event alone cannot retire the source liability in the funding model.
 await assert.rejects(next.inspect(windowIO),/fully closed/);
 const expiredLog=expired.logs.find(l=>{try{return e.interface.parseLog(l)?.name==='QuoteExpired';}catch{return false;}});
 const record={chainId:84532,contractAddress:e.target,topic0:BigInt(expiredLog.topics[0]),topic1:1,topic2:0,topic3:0,data:expiredLog.data,blockNumber:expired.blockNumber,opCode:expiredLog.topics.length,blockHash:BigInt(expired.blockHash),txHash:BigInt(expired.hash),logIndex:expiredLog.index};
 await(await system.connect(new Wallet(key,source.provider)).forward(state.read(directoryRoot).contracts.SettlioReactiveV4.address,record)).wait();
 renewalTime+=400;
 for(let i=0;i<3;i++){renewalTime+=100;await source.provider.send('evm_setNextBlockTimestamp',[renewalTime]);await(await emitter.emitCron()).wait();}
 await base.provider.send('evm_setNextBlockTimestamp',[renewalTime]);await base.provider.send('evm_mine',[]);
 const nextPlan=await next.inspect(windowIO);assert.equal(nextPlan.result.remainingLifetimeQuotes,'5');assert.equal(nextPlan.result.canGrant,true);assert.equal(state.read(directoryRoot).nextQuoteGrant,undefined);
 const priorWindow=structuredClone(state.read(directoryRoot).operatorWindowGrant);
 const nextGrant=await next.grant(windowIO);assert.equal(nextGrant.grant[0],'1');
 const nextNonce=await base.provider.getTransactionCount(owner);assert.equal((await next.grant(windowIO)).transactionHash,nextGrant.transactionHash);assert.equal(await base.provider.getTransactionCount(owner),nextNonce);
 assert.deepEqual(state.read(directoryRoot).operatorWindowGrant,priorWindow);assert.equal((await v4.verify({journal:state.read(directoryRoot),base:base.provider,lasna})).admission.admitted,1n);
 // Quote-3 credit is a separate stage: no reuse of the quote-2 intent or capacity.
 const refundIO={...windowIO,completed:2n};
 await assert.rejects(next.inspect(refundIO),/Previous grant|exactly two/);
 await(await e.createQuote(customer,300,100,renewalTime+100,renewalTime+200,terms)).wait();
 await assert.rejects(next.inspect(refundIO),/exactly two/);
 await base.provider.send('evm_setNextBlockTimestamp',[renewalTime+100]);await base.provider.send('evm_mine',[]);
 await base.provider.send('anvil_impersonateAccount',[callback]);
 const expired2=await(await e.connect(await base.provider.getSigner(callback)).processPolicy(2)).wait();
 await base.provider.send('anvil_stopImpersonatingAccount',[callback]);
 await assert.rejects(next.inspect(refundIO),/fully closed/);
 const log2=expired2.logs.find(l=>{try{return e.interface.parseLog(l)?.name==='QuoteExpired';}catch{return false;}});
 await(await system.connect(new Wallet(key,source.provider)).forward(state.read(directoryRoot).contracts.SettlioReactiveV4.address,{...record,topic0:BigInt(log2.topics[0]),topic1:2,data:log2.data,blockNumber:expired2.blockNumber,opCode:log2.topics.length,blockHash:BigInt(expired2.blockHash),txHash:BigInt(expired2.hash),logIndex:log2.index})).wait();
 renewalTime+=400;
 for(let i=0;i<3;i++){renewalTime+=100;await source.provider.send('evm_setNextBlockTimestamp',[renewalTime]);await(await emitter.emitCron()).wait();}
 await base.provider.send('evm_setNextBlockTimestamp',[renewalTime]);await base.provider.send('evm_mine',[]);
 const refundPlan=await next.inspect(refundIO);assert.equal(refundPlan.result.remainingLifetimeQuotes,'4');assert.equal(refundPlan.closed.earlier.length,1);assert.equal(state.read(directoryRoot).refundQuoteGrant,undefined);
 await assert.rejects(next.grant({...refundIO,env:{DEPLOYER_PRIVATE_KEY:base.signers[1].signer.privateKey}}),/differs/);
 const previousNext=structuredClone(state.read(directoryRoot).nextQuoteGrant);
 const refundedGrant=await next.grant(refundIO),refundNonce=await base.provider.getTransactionCount(owner);
 assert.equal(refundedGrant.operation,'grantRefundQuote');assert.equal(refundedGrant.grant[0],'1');
 assert.equal((await next.grant(refundIO)).transactionHash,refundedGrant.transactionHash);assert.equal(await base.provider.getTransactionCount(owner),refundNonce);
 assert.deepEqual(state.read(directoryRoot).nextQuoteGrant,previousNext);assert.equal(state.read(directoryRoot).operations.grantNextQuote.hash,nextGrant.transactionHash);
 const intact=fs.readFileSync(journalFile,'utf8'),changed=JSON.parse(intact);changed.refundQuoteGrant.payload.proposal.credits='2';state.save(journalFile,changed);
 await assert.rejects(next.grant(refundIO),/integrity/);fs.writeFileSync(journalFile,intact);
 // One separate USDC-refund credit after the third fixture quote closes on both chains.
 const usdcIO={...windowIO,completed:3n};await assert.rejects(next.inspect(usdcIO),/Previous grant|exactly three/);
 await(await e.createQuote(customer,300,100,renewalTime+100,renewalTime+200,terms)).wait();
 await assert.rejects(next.inspect(usdcIO),/exactly three/);
 await base.provider.send('evm_setNextBlockTimestamp',[renewalTime+100]);await base.provider.send('evm_mine',[]);
 await base.provider.send('anvil_impersonateAccount',[callback]);
 const expired3=await(await e.connect(await base.provider.getSigner(callback)).processPolicy(3)).wait();
 await base.provider.send('anvil_stopImpersonatingAccount',[callback]);await assert.rejects(next.inspect(usdcIO),/fully closed/);
 const log3=expired3.logs.find(l=>{try{return e.interface.parseLog(l)?.name==='QuoteExpired';}catch{return false;}});
 await(await system.connect(new Wallet(key,source.provider)).forward(state.read(directoryRoot).contracts.SettlioReactiveV4.address,{...record,topic0:BigInt(log3.topics[0]),topic1:3,data:log3.data,blockNumber:expired3.blockNumber,opCode:log3.topics.length,blockHash:BigInt(expired3.blockHash),txHash:BigInt(expired3.hash),logIndex:log3.index})).wait();
 renewalTime+=400;for(let i=0;i<3;i++){renewalTime+=100;await source.provider.send('evm_setNextBlockTimestamp',[renewalTime]);await(await emitter.emitCron()).wait();}
 await base.provider.send('evm_setNextBlockTimestamp',[renewalTime]);await base.provider.send('evm_mine',[]);
 const usdcPlan=await next.inspect(usdcIO);assert.equal(usdcPlan.result.remainingLifetimeQuotes,'3');assert.equal(usdcPlan.closed.earlier.length,2);assert.equal(state.read(directoryRoot).usdcRefundQuoteGrant,undefined);
 await assert.rejects(next.grant({...usdcIO,env:{DEPLOYER_PRIVATE_KEY:base.signers[1].signer.privateKey}}),/differs/);
 const beforeUsdc=structuredClone(state.read(directoryRoot).refundQuoteGrant),ug=await next.grant(usdcIO),un=await base.provider.getTransactionCount(owner);
 assert.equal(ug.operation,'grantUsdcRefundQuote');assert.equal(ug.grant[0],'1');assert.equal((await next.grant(usdcIO)).transactionHash,ug.transactionHash);assert.equal(await base.provider.getTransactionCount(owner),un);
 assert.deepEqual(state.read(directoryRoot).refundQuoteGrant,beforeUsdc);assert.equal(state.read(directoryRoot).operations.grantRefundQuote.hash,refundedGrant.transactionHash);
 const validUsdc=fs.readFileSync(journalFile,'utf8'),badUsdc=JSON.parse(validUsdc);badUsdc.usdcRefundQuoteGrant.payload.proposal.credits='2';state.save(journalFile,badUsdc);await assert.rejects(next.grant(usdcIO),/integrity/);fs.writeFileSync(journalFile,validUsdc);
 // The unpaid-expiry credit is a distinct stage after four terminal fixture quotes.
 const expiryIO={...windowIO,completed:4n};await assert.rejects(next.inspect(expiryIO),/Previous grant|exactly four/);
 await(await e.createQuote(customer,300,100,renewalTime+100,renewalTime+200,terms)).wait();await assert.rejects(next.inspect(expiryIO),/exactly four/);
 await base.provider.send('evm_setNextBlockTimestamp',[renewalTime+100]);await base.provider.send('evm_mine',[]);await base.provider.send('anvil_impersonateAccount',[callback]);
 const expired4=await(await e.connect(await base.provider.getSigner(callback)).processPolicy(4)).wait();await base.provider.send('anvil_stopImpersonatingAccount',[callback]);await assert.rejects(next.inspect(expiryIO),/fully closed/);
 const log4=expired4.logs.find(l=>{try{return e.interface.parseLog(l)?.name==='QuoteExpired';}catch{return false;}});
 await(await system.connect(new Wallet(key,source.provider)).forward(state.read(directoryRoot).contracts.SettlioReactiveV4.address,{...record,topic0:BigInt(log4.topics[0]),topic1:4,data:log4.data,blockNumber:expired4.blockNumber,opCode:log4.topics.length,blockHash:BigInt(expired4.blockHash),txHash:BigInt(expired4.hash),logIndex:log4.index})).wait();
 renewalTime+=400;for(let i=0;i<3;i++){renewalTime+=100;await source.provider.send('evm_setNextBlockTimestamp',[renewalTime]);await(await emitter.emitCron()).wait();}await base.provider.send('evm_setNextBlockTimestamp',[renewalTime]);await base.provider.send('evm_mine',[]);
 const expiryPlan=await next.inspect(expiryIO);assert.equal(expiryPlan.result.remainingLifetimeQuotes,'2');assert.equal(expiryPlan.closed.earlier.length,3);assert.equal(state.read(directoryRoot).expiryQuoteGrant,undefined);
 await assert.rejects(next.grant({...expiryIO,env:{DEPLOYER_PRIVATE_KEY:base.signers[1].signer.privateKey}}),/differs/);
 const beforeExpiry=structuredClone(state.read(directoryRoot).usdcRefundQuoteGrant),eg=await next.grant(expiryIO),en=await base.provider.getTransactionCount(owner);
 assert.equal(eg.operation,'grantExpiryQuote');assert.equal(eg.grant[0],'1');assert.equal((await next.grant(expiryIO)).transactionHash,eg.transactionHash);assert.equal(await base.provider.getTransactionCount(owner),en);
 assert.deepEqual(state.read(directoryRoot).usdcRefundQuoteGrant,beforeExpiry);assert.equal(state.read(directoryRoot).operations.grantUsdcRefundQuote.hash,ug.transactionHash);
 const validExpiry=fs.readFileSync(journalFile,'utf8'),badExpiry=JSON.parse(validExpiry);badExpiry.expiryQuoteGrant.payload.proposal.credits='2';state.save(journalFile,badExpiry);await assert.rejects(next.grant(expiryIO),/integrity/);fs.writeFileSync(journalFile,validExpiry);
 // Final sixth credit and one controlled pause/restore cycle, isolated chains only.
 const recoveryIO={...windowIO,completed:5n},recovery=require('../script/v4-recovery.cjs');
 await assert.rejects(next.inspect(recoveryIO),/Previous grant|exactly five/);
 await(await e.createQuote(customer,300,100,renewalTime+100,renewalTime+200,terms)).wait();await assert.rejects(next.inspect(recoveryIO),/exactly five/);
 await base.provider.send('evm_setNextBlockTimestamp',[renewalTime+100]);await base.provider.send('evm_mine',[]);await base.provider.send('anvil_impersonateAccount',[callback]);
 const expired5=await(await e.connect(await base.provider.getSigner(callback)).processPolicy(5)).wait();await base.provider.send('anvil_stopImpersonatingAccount',[callback]);await assert.rejects(next.inspect(recoveryIO),/fully closed/);
 const log5=expired5.logs.find(l=>{try{return e.interface.parseLog(l)?.name==='QuoteExpired';}catch{return false;}});
 await(await system.connect(new Wallet(key,source.provider)).forward(state.read(directoryRoot).contracts.SettlioReactiveV4.address,{...record,topic0:BigInt(log5.topics[0]),topic1:5,data:log5.data,blockNumber:expired5.blockNumber,opCode:log5.topics.length,blockHash:BigInt(expired5.blockHash),txHash:BigInt(expired5.hash),logIndex:log5.index})).wait();
 renewalTime+=400;for(let i=0;i<3;i++){renewalTime+=100;await source.provider.send('evm_setNextBlockTimestamp',[renewalTime]);await(await emitter.emitCron()).wait();}await base.provider.send('evm_setNextBlockTimestamp',[renewalTime]);await base.provider.send('evm_mine',[]);
 const finalPlan=await next.inspect(recoveryIO);assert.equal(finalPlan.result.remainingLifetimeQuotes,'1');assert.equal(finalPlan.closed.earlier.length,4);
 await assert.rejects(recovery.execute({...recoveryIO,mode:'pause'}),/one unused final reservation/);
 const sixthGrant=await next.grant(recoveryIO),sixthNonce=await base.provider.getTransactionCount(owner);
 assert.equal((await next.grant(recoveryIO)).transactionHash,sixthGrant.transactionHash);assert.equal(await base.provider.getTransactionCount(owner),sixthNonce);
 assert.equal((await recovery.status(recoveryIO)).pauseStateConditionsMet,true);
 await assert.rejects(recovery.execute({...recoveryIO,mode:'pause',env:{DEPLOYER_PRIVATE_KEY:base.signers[1].signer.privateKey}}),/differs/);
 const paused=await recovery.execute({...recoveryIO,mode:'pause'}),pauseNonce=await source.provider.getTransactionCount(owner);
 assert.equal(paused.paused,true);assert.equal((await recovery.execute({...recoveryIO,mode:'pause'})).transactionHash,paused.transactionHash);assert.equal(await source.provider.getTransactionCount(owner),pauseNonce);
 async function forwardOrigin(receipt){for(const l of receipt.logs){if(l.address.toLowerCase()!==e.target.toLowerCase())continue;await(await system.connect(new Wallet(key,source.provider)).forward(state.read(directoryRoot).contracts.SettlioReactiveV4.address,{chainId:84532,contractAddress:e.target,topic0:BigInt(l.topics[0]),topic1:BigInt(l.topics[1]||0),topic2:BigInt(l.topics[2]||0),topic3:BigInt(l.topics[3]||0),data:l.data,blockNumber:receipt.blockNumber,opCode:l.topics.length,blockHash:BigInt(receipt.blockHash),txHash:BigInt(receipt.hash),logIndex:l.index})).wait();}}
 const created6=await(await e.createQuote(customer,300,100,renewalTime+100,renewalTime+200,terms)).wait();await forwardOrigin(created6);
 const r=new Contract(state.read(directoryRoot).contracts.SettlioReactiveV4.address,reactiveABI,source.provider);assert.equal(await r.activeJobCount(),1n);assert.equal(await r.cronSubscribed(),false);
 await base.provider.send('evm_setNextBlockTimestamp',[renewalTime+100]);await base.provider.send('evm_mine',[]);await source.provider.send('evm_setNextBlockTimestamp',[renewalTime+101]);await source.provider.send('evm_mine',[]);
 const retry=await(await e.connect(base.signers[1]).requestPolicy(6)).wait();await forwardOrigin(retry);assert.equal((await r.jobs(6)).attempts,0n);assert.equal(await r.cronSubscribed(),false);
 const gate=new Contract(state.read(directoryRoot).admission,compile('SettlioAdmission').abi,new Wallet(key,base.provider));assert.equal((await gate.jobs(6)).retries,1n);await assert.rejects(e.connect(base.signers[1]).requestPolicy(6));
 const resumed=await recovery.execute({...recoveryIO,mode:'resume'}),resumeNonce=await source.provider.getTransactionCount(owner);assert.equal(resumed.paused,false);assert.equal(await r.activeJobCount(),1n);assert.equal(await r.cronSubscribed(),true);
 assert.equal((await recovery.execute({...recoveryIO,mode:'resume'})).transactionHash,resumed.transactionHash);assert.equal(await source.provider.getTransactionCount(owner),resumeNonce);await assert.rejects(recovery.execute({...recoveryIO,mode:'pause'}),/current pause state differs/);assert.equal(await r.schedulerPaused(),false);
 await base.provider.send('anvil_impersonateAccount',[callback]);const terminal6=await(await e.connect(await base.provider.getSigner(callback)).processPolicy(6)).wait();await base.provider.send('anvil_stopImpersonatingAccount',[callback]);await forwardOrigin(terminal6);
 assert.equal(await r.activeJobCount(),0n);assert.equal(await r.cronSubscribed(),false);assert.equal((await gate.jobs(6)).closed,true);assert.equal(await gate.admitted(),6n);await assert.rejects(gate.setGrant(owner,1,renewalTime+3000,terms));
 assert.equal(state.read(directoryRoot).operations.grantExpiryQuote.hash,eg.transactionHash);assert.equal(state.read(directoryRoot).operations.grantRecoveryQuote.hash,sixthGrant.transactionHash);
 const final=state.read(directoryRoot);for(const [k,hash]of Object.entries(originalHashes))assert.equal(final.operations[k].hash,hash);
 assert.equal(fs.readFileSync(path.join(directoryRoot,'deployments/testnet-m2.json'),'utf8'),'legacy sentinel');assert.equal(fs.readFileSync(state.paths(directoryRoot).journal,'utf8').includes(key),false);assert.equal(fs.existsSync(state.paths(directoryRoot).lock),false);
 const status=await v4.status(io);assert(status.operations.every(op=>op.state==='succeeded'));
});
