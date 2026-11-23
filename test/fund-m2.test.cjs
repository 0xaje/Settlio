const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {ContractFactory,Contract,keccak256,parseEther}=require('ethers');
const start=require('./helpers/local-chain.cjs'),compile=require('../script/compile.cjs');
const {newJournal,saveJournal}=require('../script/m2-state.cjs');const {fund}=require('../script/fund-m2.cjs');
const {SYSTEM}=require('../script/m2-network.cjs');
const fixture={'test/FeeReserveFixture.sol':{content:`// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;
contract FeeReserveFixture {
 mapping(address=>uint256) public debt;
 mapping(address=>uint256) public reserves;
 function seedDebt(address account,uint256 value) external {debt[account]=value;}
 function subscribe(uint256,address,uint256,uint256,uint256,uint256) external {}
 function depositTo(address target) external payable {uint256 amount=msg.value;uint256 owed=debt[target];if(amount<owed){debt[target]=owed-amount;}else{debt[target]=0;reserves[target]+=amount-owed;}}
}`}};
test('M2 fee recovery clears fixture debt into target reserves once and preserves deployment',async t=>{
 const {provider,signers}=await start(t,{chainId:5318007});const owner=signers[0];
 const f=compile('FeeReserveFixture',fixture),prototype=await new ContractFactory(f.abi,f.evm.bytecode.object,owner).deploy();await prototype.waitForDeployment();
 await provider.send('anvil_setCode',[SYSTEM,await provider.getCode(prototype.target)]);
 const a=compile('SettlioReactive'),r=await new ContractFactory(a.abi,a.evm.bytecode.object,owner).deploy(84532);const tx=r.deploymentTransaction();const receipt=await tx.wait();
 const escrow=await signers[1].getAddress();await (await r.configure(escrow,await signers[2].getAddress())).wait();
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'settlio-fund-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const j=newJournal(await owner.getAddress(),{SettlioReactive:keccak256('0x'+a.evm.bytecode.object)},{});
 j.escrow=escrow;j.contracts.SettlioReactive={address:r.target,transactionHash:tx.hash,creationBytecodeHash:keccak256('0x'+a.evm.bytecode.object)};
 j.operations.deployReactive={hash:tx.hash,status:'confirmed',unsigned:{data:tx.data,value:'0',nonce:tx.nonce,chainId:5318007}};
 const file=path.join(root,'deployments/testnet-m2.json');saveJournal(file,j);
 const service=new Contract(SYSTEM,f.abi,signers[3]);await (await service.seedDebt(r.target,parseEther('0.0147685'))).wait();
 const env={DEPLOYER_PRIVATE_KEY:owner.signer.privateKey};
 await assert.rejects(fund({provider,directoryRoot:root,env:{DEPLOYER_PRIVATE_KEY:signers[1].signer.privateKey}}),/does not match/);
 const before=await provider.getBalance(r.target);
 const result=await fund({provider,directoryRoot:root,env});assert.equal(result.debt,0n);assert.equal(result.reserves,parseEther('0.9852315'));assert.equal(await provider.getBalance(r.target),before);
 const nonce=await provider.getTransactionCount(await owner.getAddress());
 const second=await fund({provider,directoryRoot:root,env});assert.equal(second.transactionHash,result.transactionHash);assert.equal(await provider.getTransactionCount(await owner.getAddress()),nonce);assert.equal(second.reserves,result.reserves);
 const status=await require('../script/m2-status.cjs').deploymentStatus({provider,directoryRoot:root,base:provider,lasna:provider});
 assert.equal(status.operations.find(op=>op.operation==='fundReactive').state,'succeeded');
 await assert.rejects(fund({provider,directoryRoot:root,env,purpose:'anything'}),/purpose/);
 const oldIntent=JSON.stringify(JSON.parse(fs.readFileSync(file)).operations.fundReactive);
 const release=await fund({provider,directoryRoot:root,env,purpose:'release-test'});
 assert.equal(release.depositWei,parseEther('14'));assert.equal(release.operation,'fundReactiveRelease');assert.notEqual(release.transactionHash,result.transactionHash);
 const nonceAfterRelease=await provider.getTransactionCount(await owner.getAddress());
 const resumed=await fund({provider,directoryRoot:root,env,purpose:'release-test'});assert.equal(resumed.transactionHash,release.transactionHash);assert.equal(await provider.getTransactionCount(await owner.getAddress()),nonceAfterRelease);
 assert.equal(JSON.stringify(JSON.parse(fs.readFileSync(file)).operations.fundReactive),oldIntent);
 assert.equal((await fund({provider,directoryRoot:root,env})).transactionHash,result.transactionHash);
 const finalStatus=await require('../script/m2-status.cjs').deploymentStatus({directoryRoot:root,base:provider,lasna:provider});assert.equal(finalStatus.operations.find(op=>op.operation==='fundReactiveRelease').state,'succeeded');

 assert.equal(fs.readFileSync(file,'utf8').includes(env.DEPLOYER_PRIVATE_KEY),false);
 assert.equal(JSON.parse(fs.readFileSync(file)).operations.deployReactive.hash,tx.hash);assert.equal(fs.existsSync(path.join(root,'deployments/.deploy-m2.lock')),false);
});
