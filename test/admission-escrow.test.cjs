const {test}=require('node:test');
const assert=require('node:assert/strict');
const {ContractFactory,Contract,keccak256,ZeroAddress}=require('ethers');
const start=require('./helpers/local-chain.cjs'),compile=require('../script/compile-admission.cjs');

test('V4 escrow gates every creation path, shares retry budget and releases slots only on terminal outcomes',async t=>{
 const {provider,signers}=await start(t),[receiver,merchant,customer,other]=signers;
 const a=compile('SettlioEscrowV4');
 const escrow=await new ContractFactory(a.abi,a.evm.bytecode.object,receiver)
  .deploy(await receiver.getAddress(),await receiver.getAddress(),2,4,1000,60,2);
 await escrow.waitForDeployment();
 const source='packages/contracts/admission/SettlioAdmission.sol';
 const ga=compile('SettlioAdmission',{[source]:{content:require('fs').readFileSync(require('path').join(__dirname,'..',source),'utf8')}});
 const gate=new Contract(await escrow.admission(),ga.abi,receiver);
 const now=(await provider.getBlock('latest')).timestamp,hash=keccak256('0x1234'),who=await customer.getAddress();
 const choices=[{asset:ZeroAddress,total:300,deposit:100}];
 const basic=(simulate=false)=>escrow.connect(merchant).createQuote[simulate?'staticCall':'send'](who,300,100,now+500,now+600,hash);
 const options=(simulate=false)=>escrow.connect(merchant).createQuoteWithOptions[simulate?'staticCall':'send'](who,choices,now+500,now+600,hash);
 const automatic=(simulate=false)=>escrow.connect(merchant).createQuoteWithPolicy[simulate?'staticCall':'send'](who,choices,now+500,now+600,hash,true);
 assert.equal(await escrow.POLICY_VERSION(),4n);
 for(const create of [basic,options,automatic])await assert.rejects(create(true));
 await(await gate.setOpen(true)).wait();
 for(const create of [basic,options,automatic])await assert.rejects(create(true));
 await(await gate.setGrant(await merchant.getAddress(),2,now+800,keccak256('0xabcd'))).wait();
 await assert.rejects(escrow.connect(merchant).createQuoteWithOptions.staticCall(who,[{asset:ZeroAddress,total:50,deposit:100}],now+500,now+600,hash));
 assert.equal(await gate.reserved(),2n);assert.equal(await escrow.quoteCount(),0n);
 await(await basic()).wait();await(await automatic()).wait();await assert.rejects(options(true));
 assert.equal(await gate.active(),2n);
 await(await escrow.connect(customer).payDepositWithPolicy(1,0,hash,false,{value:100})).wait();
 await assert.rejects(escrow.connect(other).requestPolicy.staticCall(1));
 await(await escrow.connect(merchant).requestConfirmation(1)).wait();
 await assert.rejects(escrow.connect(customer).requestPolicy.staticCall(1));
 await provider.send('evm_increaseTime',[60]);await provider.send('evm_mine',[]);
 await(await escrow.connect(customer).requestPolicy(1)).wait();
 await provider.send('evm_increaseTime',[60]);await provider.send('evm_mine',[]);
 await assert.rejects(escrow.connect(merchant).requestConfirmation.staticCall(1));
 // Admission pause/retry exhaustion never blocks the customer's timely cancellation.
 await(await gate.setOpen(false)).wait();
 await(await escrow.connect(customer).requestCancellation(1)).wait();
 assert.equal(await gate.active(),2n);assert.equal(await escrow.totalLiability(),100n);
 await(await escrow.processPolicy(1)).wait();await(await escrow.processPolicy(1)).wait();
 assert.equal((await escrow.getQuote(1)).status,5n);assert.equal(await gate.active(),1n);assert.equal(await escrow.totalLiability(),0n);
 await provider.send('evm_setNextBlockTimestamp',[now+500]);await provider.send('evm_mine',[]);
 await assert.rejects(escrow.connect(customer).payDepositWithPolicy.staticCall(2,0,hash,true,{value:100}));
 await(await escrow.processPolicy(2)).wait();await(await escrow.processPolicy(2)).wait();
 assert.equal((await escrow.getQuote(2)).status,6n);assert.equal(await gate.active(),0n);
 await(await gate.setOpen(true)).wait();await(await gate.setGrant(await merchant.getAddress(),1,now+900,keccak256('0xbcde'))).wait();
 await(await escrow.connect(merchant).createQuoteWithOptions(who,choices,now+700,now+800,hash)).wait();
 await(await escrow.connect(customer).payDepositWithPolicy(3,0,hash,false,{value:100})).wait();
 await(await escrow.confirmBooking(3)).wait();
 await provider.send('evm_setNextBlockTimestamp',[now+800]);await provider.send('evm_mine',[]);
 await(await escrow.connect(merchant).release(3)).wait();
 assert.equal((await escrow.getQuote(3)).status,7n);assert.equal(await gate.active(),0n);assert.equal(await gate.admitted(),3n);
 assert.equal(await provider.getBalance(escrow.target),0n);assert.equal(await provider.getBalance(gate.target),0n);
});

test('V4 failed token callback preserves custody; customer recovery bypasses exhausted retry credits',async t=>{
 const {provider,signers}=await start(t),[owner,merchant,customer,stranger]=signers;
 const fixture={'test/AdmissionTokenProxy.sol':{content:`// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;
contract AdmissionTokenFixture {
 mapping(address=>uint256) public balanceOf;
 mapping(address=>mapping(address=>uint256)) public allowance;
 bool public fail;
 function setFail(bool value) external {fail=value;}
 function mint(address to,uint256 amount) external {balanceOf[to]+=amount;}
 function approve(address to,uint256 amount) external returns(bool){allowance[msg.sender][to]=amount;return true;}
 function transferFrom(address from,address to,uint256 amount) external returns(bool){allowance[from][msg.sender]-=amount;balanceOf[from]-=amount;balanceOf[to]+=amount;return true;}
 function transfer(address to,uint256 amount) external returns(bool){if(fail)return false;balanceOf[msg.sender]-=amount;balanceOf[to]+=amount;return true;}
}
contract AdmissionProxyFixture {
 function debt(address) external pure returns(uint256){return 0;}
 function forward(address target,bytes calldata data) external { (bool ok,bytes memory result)=target.call(data);if(!ok)assembly{revert(add(result,32),mload(result))} }
}`}};
 async function deploy(name,args=[]){const a=compile(name,fixture),c=await new ContractFactory(a.abi,a.evm.bytecode.object,owner).deploy(...args);await c.waitForDeployment();return c;}
 const proxy=await deploy('AdmissionProxyFixture'),sender=await owner.getAddress();
 const receiver=await deploy('SettlioCallbackV4',[proxy.target,sender,sender,2,2,1000,60,2]);
 const escrow=new Contract(await receiver.escrow(),compile('SettlioEscrowV4').abi,merchant);
 const source='packages/contracts/admission/SettlioAdmission.sol';
 const ga=compile('SettlioAdmission',{[source]:{content:require('fs').readFileSync(require('path').join(__dirname,'..',source),'utf8')}});
 const gate=new Contract(await escrow.admission(),ga.abi,owner),token=await deploy('AdmissionTokenFixture');
 const now=(await provider.getBlock('latest')).timestamp,hash=keccak256('0x123456');
 await(await gate.setOpen(true)).wait();await(await gate.setGrant(await merchant.getAddress(),2,now+500,hash)).wait();
 await(await token.mint(await customer.getAddress(),200)).wait();
 await(await token.connect(customer).approve(escrow.target,200)).wait();
 const create=async()=>{await(await escrow.createQuoteWithPolicy(await customer.getAddress(),[{asset:token.target,total:300,deposit:100}],now+500,now+600,hash,true)).wait();return await escrow.quoteCount();};
 const id=await create();await(await escrow.connect(customer).payDepositWithPolicy(id,0,hash,true)).wait();
 const payload=(authorised,quote)=>receiver.interface.encodeFunctionData('processPolicy',[authorised,quote]);
 await assert.rejects(receiver.processPolicy.staticCall(sender,id));
 await assert.rejects(proxy.forward.staticCall(receiver.target,payload(await stranger.getAddress(),id)));
 await(await proxy.forward(receiver.target,payload(sender,id))).wait();
 await(await escrow.connect(customer).requestCancellation(id)).wait();await(await token.setFail(true)).wait();
 await assert.rejects(async()=>{const tx=await proxy.forward(receiver.target,payload(sender,id),{gasLimit:1000000});await tx.wait();});
 assert.equal((await escrow.getQuote(id)).status,4n);assert.equal(await escrow.liability(token.target),100n);assert.equal(await gate.active(),1n);
 await(await escrow.requestPolicy(id)).wait();
 await provider.send('evm_increaseTime',[60]);await provider.send('evm_mine',[]);
 await(await escrow.connect(customer).requestPolicy(id)).wait();
 await provider.send('evm_increaseTime',[60]);await provider.send('evm_mine',[]);
 await assert.rejects(escrow.connect(customer).requestPolicy.staticCall(id));
 await(await gate.setOpen(false)).wait();
 await assert.rejects(escrow.connect(stranger).claimRefund.staticCall(id));
 await(await token.setFail(false)).wait();
 await(await escrow.connect(customer).claimRefund(id)).wait();
 await assert.rejects(escrow.connect(customer).claimRefund.staticCall(id));
 await(await proxy.forward(receiver.target,payload(sender,id))).wait();
 await(await gate.setOpen(true)).wait();
 assert.equal(await token.balanceOf(await customer.getAddress()),200n);assert.equal(await gate.active(),0n);assert.equal(await escrow.liability(token.target),0n);
 const second=await create();await(await escrow.connect(customer).payDepositWithPolicy(second,0,hash,true)).wait();await(await proxy.forward(receiver.target,payload(sender,second))).wait();
 await provider.send('evm_setNextBlockTimestamp',[now+600]);await provider.send('evm_mine',[]);
 await(await proxy.forward(receiver.target,payload(sender,second))).wait();await(await proxy.forward(receiver.target,payload(sender,second))).wait();
 assert.equal((await escrow.getQuote(second)).status,7n);assert.equal(await token.balanceOf(await merchant.getAddress()),100n);assert.equal(await token.balanceOf(escrow.target),0n);assert.equal(await gate.active(),0n);assert.equal(await escrow.liability(token.target),0n);assert.equal(await escrow.totalLiability(),0n);
});

test('separate admission sources preserve both verified V3 creation fingerprints',()=>{
 const legacy=require('../script/compile.cjs');
 for(const [name,hash] of [
  ['SettlioReactive','0x1c0f86e6cb9b03fba627eefbd07133082973d9bdeaf5b3ab23b720ac79f36454'],
  ['SettlioCallback','0x6668b40b266a9976095830bf87fcd6ea2c8c67721a6b9111c86da9fb28a241ae']
 ])assert.equal(keccak256('0x'+legacy(name).evm.bytecode.object),hash);
});
