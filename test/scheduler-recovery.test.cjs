const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {ContractFactory,Contract,Wallet,NonceManager,keccak256,ZeroAddress}=require('ethers');
const start=require('./helpers/local-chain.cjs'),compile=require('../script/compile.cjs');
const {newJournal,saveJournal,runOperation}=require('../script/m2-state.cjs');
const {planRecovery,setRecoveryPause,canPause}=require('../script/scheduler-recovery.cjs');
const {SYSTEM,PROXY}=require('../script/m2-network.cjs');
const fixture={'test/RecoveryControlFixture.sol':{content:`// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;
import {IReactive} from "@reactive/src/interfaces/IReactive.sol";
contract RecoveryControlFixture {
 function debt(address) external pure returns(uint256){return 0;}
 function subscribe(uint256,address,uint256,uint256,uint256,uint256) external {}
 function unsubscribe(uint256,address,uint256,uint256,uint256,uint256) external {}
 function forward(address target,IReactive.LogRecord calldata record) external {IReactive(payable(target)).react(record);}
}`}};
test('controlled pause and resume preserve intents, reject busy admission and restore a live fixture job',async t=>{
 const base=await start(t,{chainId:84532}),lasna=await start(t,{chainId:5318007}),key=base.signers[0].signer.privateKey;
 const owner=await base.signers[0].getAddress();await lasna.provider.send('anvil_setBalance',[owner,'0x3635c9adc5dea00000']);const signer=new NonceManager(new Wallet(key,lasna.provider));
 const f=compile('RecoveryControlFixture',fixture),prototype=await new ContractFactory(f.abi,f.evm.bytecode.object,lasna.signers[3]).deploy();await prototype.waitForDeployment();await lasna.provider.send('anvil_setCode',[SYSTEM,await lasna.provider.getCode(prototype.target)]);
 const system=new Contract(SYSTEM,f.abi,lasna.signers[3]),a=compile('SettlioReactive'),r=await new ContractFactory(a.abi,a.evm.bytecode.object,signer).deploy(84532);const creation=r.deploymentTransaction();await creation.wait();
 await base.provider.send('anvil_setCode',[PROXY,'0x00']);
 const ca=compile('SettlioCallback'),receiver=await new ContractFactory(ca.abi,ca.evm.bytecode.object,base.signers[0]).deploy(PROXY,r.target);await receiver.waitForDeployment();const escrow=new Contract(await receiver.escrow(),compile().abi,base.signers[0]);await (await r.configure(escrow.target,receiver.target)).wait();
 const directoryRoot=fs.mkdtempSync(path.join(os.tmpdir(),'settlio-scheduler-recovery-'));t.after(()=>fs.rmSync(directoryRoot,{recursive:true,force:true}));const file=path.join(directoryRoot,'deployments/testnet-m2.json');let j=newJournal(owner,{SettlioReactive:keccak256('0x'+a.evm.bytecode.object)},{});j.escrow=escrow.target;j.contracts={SettlioReactive:{address:r.target,transactionHash:creation.hash,creationBytecodeHash:keccak256('0x'+a.evm.bytecode.object)},SettlioCallback:{address:receiver.target}};j.operations.deployReactive={hash:creation.hash,status:'confirmed',unsigned:{data:creation.data,value:'0',nonce:creation.nonce,chainId:5318007}};saveJournal(file,j);const originalCreation=JSON.stringify(j.operations.deployReactive);
 const args={base:base.provider,lasna:lasna.provider,directoryRoot,env:{DEPLOYER_PRIVATE_KEY:key}};
 const plan=await planRecovery(args);assert.equal(plan.canBeginControlledTest,true);assert.equal(plan.readOnly,true);
 await assert.rejects(setRecoveryPause({...args,mode:'pause',env:{DEPLOYER_PRIVATE_KEY:base.signers[1].signer.privateKey}}),/differs/);
 await assert.rejects(setRecoveryPause({...args,mode:'pause',base:lasna.provider}),/networks/);
 const paused=await setRecoveryPause({...args,mode:'pause'});assert.equal(paused.paused,true);const pauseNonce=await lasna.provider.getTransactionCount(owner);
 assert.equal((await setRecoveryPause({...args,mode:'pause'})).transactionHash,paused.transactionHash);assert.equal(await lasna.provider.getTransactionCount(owner),pauseNonce);
 const block=await base.provider.getBlock('latest'),terms=keccak256('0x1234');const made=await (await escrow.createQuoteWithPolicy(await base.signers[1].getAddress(),[{asset:ZeroAddress,total:300,deposit:100}],block.timestamp+1000,block.timestamp+2000,terms,false)).wait();
 async function forward(receipt){for(const l of receipt.logs){if(l.address.toLowerCase()!==escrow.target.toLowerCase())continue;await (await system.forward(r.target,{chainId:84532,contractAddress:escrow.target,topic0:BigInt(l.topics[0]),topic1:BigInt(l.topics[1]||0),topic2:BigInt(l.topics[2]||0),topic3:BigInt(l.topics[3]||0),data:l.data,blockNumber:receipt.blockNumber,opCode:l.topics.length,blockHash:BigInt(receipt.blockHash),txHash:BigInt(receipt.hash),logIndex:l.index})).wait();}}
 await forward(made);const id=await escrow.quoteCount();assert.equal(await r.activeJobCount(),1n);assert.equal(await r.cronSubscribed(),false);
 const participant=await (await escrow.connect(base.signers[1]).requestPolicy(id)).wait();await forward(participant);assert.equal((await r.jobs(id)).registered,true);
 const resumed=await setRecoveryPause({...args,mode:'resume'});assert.equal(resumed.paused,false);assert.equal(await r.activeJobCount(),1n);assert.equal(await r.cronSubscribed(),true);const resumeNonce=await lasna.provider.getTransactionCount(owner);
 assert.equal((await setRecoveryPause({...args,mode:'resume'})).transactionHash,resumed.transactionHash);assert.equal(await lasna.provider.getTransactionCount(owner),resumeNonce);
 await assert.rejects(setRecoveryPause({...args,mode:'pause'}),/current pause state differs/);assert.equal(await r.schedulerPaused(),false);assert.equal(await lasna.provider.getTransactionCount(owner),resumeNonce);
 // A new isolated journal copy cannot begin a pause while the real fixture queue is occupied.
 const busyRoot=fs.mkdtempSync(path.join(os.tmpdir(),'settlio-busy-recovery-'));t.after(()=>fs.rmSync(busyRoot,{recursive:true,force:true}));const busy=JSON.parse(fs.readFileSync(file));delete busy.operations.pauseScheduler;delete busy.operations.resumeScheduler;saveJournal(path.join(busyRoot,'deployments/testnet-m2.json'),busy);
 await assert.rejects(setRecoveryPause({...args,directoryRoot:busyRoot,mode:'pause'}),/zero active jobs/);assert.equal(await r.schedulerPaused(),false);
 const saved=JSON.parse(fs.readFileSync(file));assert.equal(JSON.stringify(saved.operations.deployReactive),originalCreation);assert.equal(fs.readFileSync(file,'utf8').includes(key),false);assert.equal(fs.existsSync(path.join(directoryRoot,'deployments/.deploy-m2.lock')),false);
 const status=await require('../script/m2-status.cjs').deploymentStatus(args);assert.equal(status.operations.find(x=>x.operation==='pauseScheduler').state,'succeeded');assert.equal(status.operations.find(x=>x.operation==='resumeScheduler').state,'succeeded');
});
test('pause preconditions exclude funded, occupied or already paused scenarios',async()=>{const s={activeJobs:0n,paused:false,nativeLiability:0n,usdcLiability:0n};assert.equal(canPause(s),true);for(const change of [{activeJobs:1n},{paused:true},{nativeLiability:1n},{usdcLiability:1n}])assert.equal(canPause({...s,...change}),false);await assert.rejects(runOperation({key:'pauseScheduler',chainId:84532}),/Lasna-only/);await assert.rejects(runOperation({key:'resumeScheduler',chainId:84532}),/Lasna-only/);});
