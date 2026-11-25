const {test}=require('node:test'),assert=require('node:assert/strict');
const {Contract,ContractFactory,ZeroAddress,id}=require('ethers');
const start=require('./helpers/local-chain.cjs'),compile=require('../script/compile-renewable.cjs');
async function setup(t){
 const {provider,signers}=await start(t),[merchant,customer,receiver,stranger]=signers;
 const a=compile(),escrow=await new ContractFactory(a.abi,a.evm.bytecode.object,merchant).deploy(await receiver.getAddress(),await merchant.getAddress(),2,2,1000,60,1);await escrow.waitForDeployment();
 const gate=new Contract(await escrow.admission(),compile('SettlioWorkLedger').abi,merchant),now=(await provider.getBlock('latest')).timestamp,p=id('isolated profile'),h=id('terms');
 await(await gate.setOpen(true)).wait();await(await gate.setGrant(await merchant.getAddress(),1,2,now+900,p,id('attestation'))).wait();
 async function counts(r,u,a){assert.deepEqual(await Promise.all([gate.reserved(),gate.unsettled(),gate.active()]),[r,u,a].map(BigInt));}
 return {provider,merchant,customer,receiver,stranger,escrow,gate,now,p,h,counts};
}
test('V5 actual creation rollback, terminal backpressure and renewable admission are atomic',async t=>{
 const {provider,merchant,customer,receiver,escrow,gate,now,p,h,counts}=await setup(t),who=await customer.getAddress();
 const invalid=[{asset:ZeroAddress,total:50,deposit:100}];
 await assert.rejects(async()=>{await(await escrow.createQuoteWithOptions(who,invalid,now+100,now+200,h,{gasLimit:1500000})).wait();});
 assert.equal(await escrow.quoteCount(),0n);assert.equal(await gate.totalAdmitted(),0n);await counts(2,0,0);
 await(await escrow.createQuote(who,300,100,now+100,now+200,h)).wait();
 await(await escrow.createQuoteWithPolicy(who,[{asset:ZeroAddress,total:300,deposit:100}],now+100,now+200,h,true)).wait();
 await counts(0,2,2);assert.equal(await escrow.POLICY_VERSION(),5n);
 await provider.send('evm_setNextBlockTimestamp',[now+100]);await provider.send('evm_mine',[]);
 await assert.rejects(escrow.connect(customer).payDeposit.staticCall(1,h,{value:100}));
 await(await escrow.connect(receiver).processPolicy(1)).wait();await(await escrow.connect(receiver).processPolicy(2)).wait();await counts(0,2,0);
 await assert.rejects(gate.setGrant.staticCall(await merchant.getAddress(),2,1,now+900,p,id('attestation')));
 await(await gate.connect(receiver).acknowledge(1,1,p)).wait();await(await gate.connect(receiver).acknowledge(1,1,p)).wait();await counts(0,1,0);
 await(await gate.setGrant(await merchant.getAddress(),2,1,now+900,p,id('attestation'))).wait();
 await(await escrow.createQuoteWithOptions(who,[{asset:ZeroAddress,total:300,deposit:100}],now+500,now+600,h)).wait();await counts(0,2,1);
 assert.equal(await gate.totalAdmitted(),3n);assert.equal((await gate.jobs(3)).epoch,2n);
});
test('V5 refund claim survives closed admission, exhausted retries and absent closure acknowledgement',async t=>{
 const {provider,customer,receiver,stranger,escrow,gate,now,p,h,counts}=await setup(t);
 await(await escrow.createQuoteWithPolicy(await customer.getAddress(),[{asset:ZeroAddress,total:300,deposit:100}],now+100,now+200,h,true)).wait();
 await(await escrow.connect(customer).payDepositWithPolicy(1,0,h,true,{value:100})).wait();
 await(await escrow.requestConfirmation(1)).wait();await assert.rejects(escrow.connect(customer).requestPolicy.staticCall(1));
 await(await gate.setOpen(false)).wait();await(await escrow.connect(customer).requestCancellation(1)).wait();
 await provider.send('evm_setNextBlockTimestamp',[now+200]);await provider.send('evm_mine',[]);
 await(await escrow.connect(receiver).releaseAutomatic(1)).wait();assert.equal((await escrow.getQuote(1)).status,4n);
 await assert.rejects(escrow.connect(stranger).claimRefund.staticCall(1));
 const before=await provider.getBalance(escrow.target);assert.equal(before,100n);
 await(await escrow.connect(customer).claimRefund(1)).wait();assert.equal((await escrow.getQuote(1)).status,5n);
 assert.equal(await provider.getBalance(escrow.target),0n);assert.equal(await escrow.totalLiability(),0n);await counts(1,1,0);
 await assert.rejects(escrow.connect(customer).claimRefund.staticCall(1));await(await escrow.connect(receiver).processPolicy(1)).wait();await counts(1,1,0);
 await(await gate.connect(receiver).acknowledge(1,1,p)).wait();await counts(1,0,0);
});
test('V5 failed token refund and merchant payout retain principal and active work',async t=>{
 const {provider,merchant,customer,receiver,escrow,gate,now,p,h,counts}=await setup(t);
 const fixture={'test/RefundToken.sol':{content:`// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;
contract RefundToken {
 mapping(address=>uint256) public balanceOf;
 mapping(address=>mapping(address=>uint256)) public allowance;
 bool public fail;
 function mint(address a,uint256 n) external {balanceOf[a]+=n;}
 function approve(address a,uint256 n) external returns(bool){allowance[msg.sender][a]=n;return true;}
 function setFail(bool v) external {fail=v;}
 function transferFrom(address a,address b,uint256 n) external returns(bool){allowance[a][msg.sender]-=n;balanceOf[a]-=n;balanceOf[b]+=n;return true;}
 function transfer(address a,uint256 n) external returns(bool){if(fail)return false;balanceOf[msg.sender]-=n;balanceOf[a]+=n;return true;}
}`}};
 const a=compile('RefundToken',fixture),token=await new ContractFactory(a.abi,a.evm.bytecode.object,merchant).deploy();await token.waitForDeployment();
 await(await token.mint(await customer.getAddress(),200)).wait();await(await token.connect(customer).approve(escrow.target,200)).wait();
 for(let n=1;n<=2;n++){
  await(await escrow.createQuoteWithPolicy(await customer.getAddress(),[{asset:token.target,total:300,deposit:100}],now+100,now+200,h,true)).wait();
  await(await escrow.connect(customer).payDepositWithPolicy(n,0,h,true)).wait();await(await escrow.connect(receiver).confirmBooking(n)).wait();
 }
 await(await escrow.connect(customer).requestCancellation(1)).wait();await(await token.setFail(true)).wait();
 await assert.rejects(async()=>{await(await escrow.connect(receiver).refund(1,{gasLimit:1500000})).wait();});await counts(0,2,2);
 assert.equal((await escrow.getQuote(1)).status,4n);assert.equal(await escrow.liability(token.target),200n);
 await provider.send('evm_setNextBlockTimestamp',[now+200]);await provider.send('evm_mine',[]);
 await assert.rejects(async()=>{await(await escrow.connect(receiver).releaseAutomatic(2,{gasLimit:1500000})).wait();});await counts(0,2,2);
 assert.equal((await escrow.getQuote(2)).status,3n);assert.equal(await token.balanceOf(escrow.target),200n);
 await(await gate.setOpen(false)).wait();await(await token.setFail(false)).wait();
 await(await escrow.connect(customer).claimRefund(1)).wait();await(await escrow.connect(receiver).releaseAutomatic(2)).wait();
 await(await escrow.connect(receiver).releaseAutomatic(2)).wait();await counts(0,2,0);
 assert.equal(await token.balanceOf(await customer.getAddress()),100n);assert.equal(await token.balanceOf(await merchant.getAddress()),100n);
 assert.equal(await escrow.liability(token.target),0n);assert.equal(await token.balanceOf(escrow.target),0n);
 await(await gate.connect(receiver).acknowledge(1,1,p)).wait();await(await gate.connect(receiver).acknowledge(2,1,p)).wait();await counts(0,0,0);
});
