const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {ContractFactory,Contract,keccak256}=require('ethers');
const start=require('./helpers/local-chain.cjs');
const compile=require('../script/compile.cjs');
const {deploy,plan}=require('../script/m2.cjs');
const {inspect,PROXY,SYSTEM,USDC,CRON,CRON_TOPIC}=require('../script/m2-network.cjs');
const {assertRuntime}=require('../script/m2-code.cjs');
const fixtures={'test/DeploymentFixture.sol':{content:`// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;
contract DeploymentProtocolFixture {
 function debt(address) external pure returns(uint256){return 0;}
 function reserves(address) external pure returns(uint256){return 0;}
 function subscribe(uint256,address,uint256,uint256,uint256,uint256) external {}
 function decimals() external pure returns(uint8){return 6;}
 function symbol() external pure returns(string memory){return "USDC";}
 function balanceOf(address) external pure returns(uint256){return 0;}
 function tick() external { bytes32 topic=0xb49937fb8970e19fd46d48f7e3fb00d659deac0347f79cd7cb542f0fc1503c70; assembly {log2(0,0,topic,number())} }
}`}};
test('M2 commands deploy, inspect and resume without changing M1 or duplicating transactions',async t=>{
 const base=await start(t,{chainId:84532}),lasna=await start(t,{chainId:5318007});
 const artifact=compile('DeploymentProtocolFixture',fixtures);
 async function install(chain,addresses){
  const c=await new ContractFactory(artifact.abi,artifact.evm.bytecode.object,chain.signers[3]).deploy();await c.waitForDeployment();
  for(const address of addresses) await chain.provider.send('anvil_setCode',[address,await chain.provider.getCode(c.target)]);
 }
 await install(base,[PROXY,USDC]);await install(lasna,[SYSTEM,CRON]);
 await (await new Contract(CRON,artifact.abi,lasna.signers[3]).tick()).wait();
 const directoryRoot=fs.mkdtempSync(path.join(os.tmpdir(),'settlio-m2-deploy-'));
 t.after(()=>fs.rmSync(directoryRoot,{recursive:true,force:true}));
 fs.mkdirSync(path.join(directoryRoot,'deployments'));
 const m1=path.join(directoryRoot,'deployments/testnet.json');fs.writeFileSync(m1,'M1 preserved');
 const env={DEPLOYER_PRIVATE_KEY:base.signers[0].signer.privateKey};
 // Both chains must use the same dedicated deployer. Fund that public address on Lasna locally.
 const publicAddress=await base.signers[0].getAddress();
 await lasna.provider.send('anvil_setBalance',[publicAddress,'0x3635c9adc5dea00000']);
 const journalFile=path.join(directoryRoot,'deployments/testnet-m2.json');
 const send=lasna.provider.send.bind(lasna.provider);
 let filtersUnavailable=true;
 lasna.provider.send=async(method,args)=>{
  if(method!=='rnk_getFilters') return send(method,args);
  if(filtersUnavailable) throw new Error('fixture index unavailable');
  const j=JSON.parse(fs.readFileSync(journalFile));
  const r=new Contract(j.contracts.SettlioReactive.address,compile('SettlioReactive').abi,lasna.provider);
  const names=['DEPOSIT_TOPIC','RETRY_TOPIC','POLICY_TOPIC','POLICY_RETRY_TOPIC','CANCEL_TOPIC','CONFIRMED_TOPIC','CHECKED_TOPIC','REFUNDED_TOPIC','EXPIRED_TOPIC','RELEASED_TOPIC'];
  return {version:1,topicFilters:await Promise.all(names.map(async name=>({ChainId:84532,Contract:j.escrow,Topics:['0x'+(await r[name]()).toString(16).padStart(64,'0'),null,null,null],Configs:[{Contract:r.target,Active:true}]})))};
 };
 const before=await base.provider.getTransactionCount(publicAddress);
 const estimate=await plan({deployer:publicAddress,base:base.provider,lasna:lasna.provider,env:{}});
 assert.equal(estimate.readOnly,true);assert.equal(await base.provider.getTransactionCount(publicAddress),before);
 // Deployment succeeds on-chain; an unavailable subscription index keeps verification incomplete.
 await assert.rejects(deploy({base:base.provider,lasna:lasna.provider,env,directoryRoot}),error=>error.m2Stage==='verify-deployment');
 const status=await require('../script/m2-status.cjs').deploymentStatus({directoryRoot,base:base.provider,lasna:lasna.provider});
 assert.deepEqual(status.operations.map(op=>op.state),['succeeded','succeeded','succeeded']);
 let journal=JSON.parse(fs.readFileSync(journalFile));
 assert.equal(journal.wiringVerified,undefined);
 const hashes=Object.values(journal.operations).map(x=>x.hash);
 const baseNonce=await base.provider.getTransactionCount(publicAddress),lasnaNonce=await lasna.provider.getTransactionCount(publicAddress);
 filtersUnavailable=false;
 const result=await deploy({base:base.provider,lasna:lasna.provider,env,directoryRoot});
 assert.equal(result.observation.wiringVerified,true);assert.equal(result.observation.subscriptions.originSubscriptions,10);
 assert.equal(await base.provider.getTransactionCount(publicAddress),baseNonce);
 assert.equal(await lasna.provider.getTransactionCount(publicAddress),lasnaNonce);
 journal=JSON.parse(fs.readFileSync(journalFile));
 assert.deepEqual(Object.values(journal.operations).map(x=>x.hash),hashes);
 assert.equal(fs.readFileSync(m1,'utf8'),'M1 preserved');
 assert.equal(JSON.stringify(journal).includes(env.DEPLOYER_PRIVATE_KEY),false);
 const tampered=structuredClone(journal);tampered.contracts.SettlioReactive.creationBytecodeHash='0x'+'00'.repeat(32);
 await assert.rejects(inspect(tampered,base.provider,lasna.provider),/source fingerprint/);
 const bytecode=await base.provider.getCode(journal.escrow);
 assert.equal(assertRuntime(bytecode,compile()),keccak256(bytecode));
 assert.throws(()=>assertRuntime('0x00',compile()),/runtime length/);
 await base.provider.send('anvil_setCode',[journal.escrow,bytecode.slice(0,-2)+'00']);
 await assert.rejects(inspect(journal,base.provider,lasna.provider),/runtime differs/);
});

test('M2 evidence is isolated and legacy deployment command refuses policy bytecode',()=>{
 const evidence=require('../script/evidence-path.cjs');
 assert.equal(evidence('/repo',{}),'/repo/deployments/evidence');
 assert.equal(evidence('/repo',{milestone:'M2',schemaVersion:1,policyVersion:3}),'/repo/deployments/evidence/m2');
 assert.throws(()=>evidence('/repo',{milestone:'M2',policyVersion:2}),/namespace/);
 const {spawnSync}=require('node:child_process');
 const result=spawnSync(process.execPath,['script/deploy-testnet.cjs'],{cwd:path.join(__dirname,'..'),encoding:'utf8',env:{...process.env,DEPLOYER_PRIVATE_KEY:''}});
 assert.equal(result.status,1);
 assert.match(result.stderr,/M2 source requires/);
});
