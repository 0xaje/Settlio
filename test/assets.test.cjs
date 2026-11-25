const assert = require('node:assert/strict');
const { test } = require('node:test');
const { ContractFactory, ZeroAddress, keccak256, toUtf8Bytes } = require('ethers');
const startLocalChain = require('./helpers/local-chain.cjs');
const compile = require('../script/compile.cjs');

// Adversarial local fixtures only. These are not issuer tokens or live network evidence.
const fixture = `// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;
contract TokenFixture {
 mapping(address=>uint256) public balanceOf;
 mapping(address=>mapping(address=>uint256)) public allowance;
 uint256 public mode;
 address public target; bytes public payload; bool public reentrySucceeded;
 function setReentry(address to,bytes calldata data) external {target=to;payload=data;}
 function mint(address to,uint256 value) external { balanceOf[to]+=value; }
 function setMode(uint256 value) external { mode=value; }
 function approve(address to,uint256 value) external returns(bool) { allowance[msg.sender][to]=value;return true; }
 function transferFrom(address from,address to,uint256 value) external returns(bool) {
  if(mode==1)return false;
  if(mode==4) (reentrySucceeded,)=target.call(payload);
  allowance[from][msg.sender]-=value; balanceOf[from]-=value; balanceOf[to]+= mode==2 ? value-1 : value;
  if(mode==3)assembly{return(0,0)}
  return true;
 }
 function transfer(address to,uint256 value) external returns(bool) {
  if(mode==1)return false;
  balanceOf[msg.sender]-=value; balanceOf[to]+=mode==2 ? value-1 : value;
  if(mode==3)assembly{return(0,0)}
  return true;
 }
}`;

for (const version of [3,4]) test('V'+version+' asset choices, exact custody and same-asset recovery (isolated)', async t => {
 const {provider,signers:[merchant,customer,receiver,stranger]}=await startLocalChain(t);
 const escrow=await require('./helpers/deploy-escrow.cjs')(version,{merchant,receiver,provider});
 const artifact=compile('TokenFixture',{'TokenFixture.sol':{content:fixture}});
 const deployToken=async()=>{const token=await new ContractFactory(artifact.abi,artifact.evm.bytecode.object,merchant).deploy();await token.waitForDeployment();await(await token.mint(await customer.getAddress(),1000000000n)).wait();return token;};
 const token=await deployToken(), second=await deployToken();
 const tokenAddress=await token.getAddress(), escrowAddress=await escrow.getAddress();
 const terms=keccak256(toUtf8Bytes('local asset options'));
 const choices=[{asset:ZeroAddress,total:3000n,deposit:1000n},{asset:tokenAddress,total:3000000n,deposit:1000000n},{asset:await second.getAddress(),total:4000000n,deposit:2000000n}];
 const create=async(custom=choices)=>{const now=(await provider.getBlock('latest')).timestamp;await(await escrow.createQuoteWithOptions(await customer.getAddress(),custom,now+100,now+200,terms)).wait();return {id:await escrow.quoteCount(),cutoff:now+200,expiry:now+100};};
 const first=await create();
 await t.test('rejects duplicate assets, invalid contracts and invalid amounts',async()=>{
  for(const invalid of [[],[choices[0],choices[0]],[{...choices[1],asset:await stranger.getAddress()}],[{...choices[1],deposit:0n}],[{...choices[1],deposit:4000000n}]]){
   const now=(await provider.getBlock('latest')).timestamp;
   await assert.rejects(escrow.createQuoteWithOptions.staticCall(await customer.getAddress(),invalid,now+100,now+200,terms));
  }
 });
 await t.test('enforces customer, terms, option bounds, ETH exclusion and token allowance',async()=>{
  await assert.rejects(escrow.connect(stranger).payDepositOption.staticCall(first.id,1,terms));
  await assert.rejects(escrow.connect(customer).payDepositOption.staticCall(first.id,1,terms,{value:1}));
  await assert.rejects(escrow.connect(customer).payDepositOption.staticCall(first.id,3,terms));
  await assert.rejects(escrow.connect(customer).payDepositOption.staticCall(first.id,1,keccak256(toUtf8Bytes('changed'))));
  await assert.rejects(escrow.connect(customer).payDepositOption.staticCall(first.id,1,terms));
 });
 await t.test('approval alone does not pay; token choice locks once and isolates liabilities',async()=>{
  await(await token.connect(customer).approve(escrowAddress,1000000n)).wait();
  assert.equal((await escrow.getQuote(first.id)).status,1n);
  await(await escrow.connect(customer).payDepositOption(first.id,1,terms)).wait();
  const quote=await escrow.getQuote(first.id);
  assert.equal(quote.asset,tokenAddress);assert.equal(quote.selectedOption,1n);assert.equal(quote.deposit,1000000n);
  assert.equal(await escrow.liability(tokenAddress),1000000n);assert.equal(await escrow.totalLiability(),0n);
  assert.equal(await token.allowance(await customer.getAddress(),escrowAddress),0n);
  await assert.rejects(escrow.connect(customer).payDepositOption.staticCall(first.id,0,terms,{value:1000}));
  const eth=await create();await(await escrow.connect(customer).payDepositOption(eth.id,0,terms,{value:1000})).wait();
  assert.equal(await escrow.totalLiability(),1000n);assert.equal(await escrow.liability(ZeroAddress),1000n);
  assert.equal(await escrow.liability(tokenAddress),1000000n);
 });
 await t.test('failed refund preserves reservation; retry returns tokens exactly once',async()=>{
  await(await escrow.connect(customer).requestCancellation(first.id)).wait();
  await(await token.setMode(1)).wait();
  await assert.rejects(escrow.connect(receiver).refund.staticCall(first.id));
  assert.equal((await escrow.getQuote(first.id)).status,4n);assert.equal(await escrow.liability(tokenAddress),1000000n);
  await(await token.setMode(2)).wait();await assert.rejects(escrow.connect(receiver).refund.staticCall(first.id));
  await(await token.setMode(0)).wait();
  const before=await token.balanceOf(await customer.getAddress());
  await(await escrow.connect(receiver).refund(first.id)).wait();await(await escrow.connect(receiver).refund(first.id)).wait();
  assert.equal(await token.balanceOf(await customer.getAddress()),before+1000000n);
  assert.equal(await escrow.liability(tokenAddress),0n);assert.equal(await escrow.totalLiability(),1000n);
 });
 await t.test('false and fee-on-transfer deposits roll back status and principal',async()=>{
  for(const mode of [1,2]){
   const q=await create();await(await token.connect(customer).approve(escrowAddress,1000000n)).wait();await(await token.setMode(mode)).wait();
   await assert.rejects(escrow.connect(customer).payDepositOption.staticCall(q.id,1,terms));
   assert.equal((await escrow.getQuote(q.id)).status,1n);assert.equal(await escrow.liability(tokenAddress),0n);
  }
 });
 await t.test('no-return tokens work; only confirmed merchant release after cutoff succeeds',async()=>{
  const q=await create();await(await token.setMode(3)).wait();await(await token.connect(customer).approve(escrowAddress,1000000n)).wait();
  await(await escrow.connect(customer).payDepositOption(q.id,1,terms)).wait();
  await assert.rejects(escrow.release.staticCall(q.id));await(await escrow.connect(receiver).confirmBooking(q.id)).wait();
  await assert.rejects(escrow.release.staticCall(q.id));
  await provider.send('evm_setNextBlockTimestamp',[q.cutoff]);await provider.send('evm_mine',[]);
  await assert.rejects(escrow.connect(stranger).release.staticCall(q.id));
  await(await escrow.release(q.id)).wait();assert.equal(await token.balanceOf(await merchant.getAddress()),1000000n);
  await assert.rejects(escrow.release.staticCall(q.id));assert.equal(await escrow.liability(tokenAddress),0n);
 });
 await t.test('reentrant token cannot enter payment again',async()=>{
  const q=await create();await(await token.setMode(4)).wait();
  await(await token.setReentry(escrowAddress,escrow.interface.encodeFunctionData('payDepositOption',[q.id,1,terms]))).wait();
  await(await token.connect(customer).approve(escrowAddress,1000000n)).wait();
  await(await escrow.connect(customer).payDepositOption(q.id,1,terms)).wait();
  assert.equal(await token.reentrySucceeded(),false);assert.equal((await escrow.getQuote(q.id)).status,2n);
  await(await escrow.connect(customer).requestCancellation(q.id)).wait();await(await escrow.connect(receiver).refund(q.id)).wait();
 });
 await t.test('third asset choice maintains its own liability and same-asset refund',async()=>{
  const q=await create(), address=await second.getAddress();
  await(await second.connect(customer).approve(escrowAddress,2000000n)).wait();
  await(await escrow.connect(customer).payDepositOption(q.id,2,terms)).wait();
  assert.equal(await escrow.liability(address),2000000n);assert.equal(await escrow.liability(tokenAddress),0n);
  await(await escrow.connect(customer).requestCancellation(q.id)).wait();
  const before=await second.balanceOf(await customer.getAddress());
  await(await escrow.connect(receiver).refund(q.id)).wait();
  assert.equal(await second.balanceOf(await customer.getAddress()),before+2000000n);assert.equal(await escrow.liability(address),0n);
 });
 await t.test('token payment rejects the exact expiry boundary',async()=>{
  const q=await create();await(await token.connect(customer).approve(escrowAddress,1000000n)).wait();
  await provider.send('evm_setNextBlockTimestamp',[q.expiry]);await provider.send('evm_mine',[]);
  await assert.rejects(escrow.connect(customer).payDepositOption.staticCall(q.id,1,terms));
 });
});
