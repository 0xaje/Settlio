import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readPolicyVersion, assertPolicyWiring, BASE_CALLBACK_PROXY, REACTIVE_SYSTEM } from '../apps/web/src/policy.ts';

test('policy detection distinguishes legacy empty revert from unavailable or unsupported deployment',async()=>{
  assert.equal(await readPolicyVersion(async()=>3n),3);
  assert.equal(await readPolicyVersion(async()=>{throw Object.assign(new Error('no selector'),{code:'CALL_EXCEPTION',data:'0x'});}),0);
  for(const failure of [{code:'TIMEOUT'},{code:'NETWORK_ERROR'},{code:'CALL_EXCEPTION',data:null},{code:'CALL_EXCEPTION',data:'0x1234'}]){
    await assert.rejects(readPolicyVersion(async()=>{throw Object.assign(new Error('unavailable'),failure);}));
  }
  assert.equal(await readPolicyVersion(async()=>4n),4);
  await assert.rejects(readPolicyVersion(async()=>5n),/not supported/);
});

test('automatic policies require matching chains version and immutable receiver wiring',()=>{
  const escrow='0x0000000000000000000000000000000000000001';
  const receiver='0x0000000000000000000000000000000000000002';
  const valid={baseChainId:84532n,reactiveChainId:5318007n,schedulerVersion:3,escrow,receiver,proxy:BASE_CALLBACK_PROXY,
    receiverEscrow:escrow,originChain:84532n,originEscrow:escrow,callbackReceiver:receiver,reactiveProvider:REACTIVE_SYSTEM};
  assert.doesNotThrow(()=>assertPolicyWiring(valid));
  assert.doesNotThrow(()=>assertPolicyWiring({...valid,escrowVersion:4,schedulerVersion:4}));
  assert.throws(()=>assertPolicyWiring({...valid,escrowVersion:4,schedulerVersion:3}),/could not be verified/);
  assert.throws(()=>assertPolicyWiring({...valid,escrowVersion:3,schedulerVersion:4}),/could not be verified/);
  for(const change of [{baseChainId:1n},{reactiveChainId:84532n},{schedulerVersion:0},{proxy:escrow},
    {receiverEscrow:receiver},{originChain:1n},{originEscrow:receiver},{callbackReceiver:escrow},{reactiveProvider:receiver}]){
    assert.throws(()=>assertPolicyWiring({...valid,...change}),/could not be verified/);
  }
});

test('real local policy quote matches shared consent and rejects bypassing automatic consent',async t=>{
  const { createRequire }=await import('node:module');const require=createRequire(import.meta.url);
  const { ContractFactory, ZeroAddress }=await import('ethers');
  const { encodeTerms, decodeTerms, matchesQuote, termsHash }=await import('../apps/web/src/terms.ts');
  const { provider,signers:[merchant,customer,receiver] }=await require('./helpers/local-chain.cjs')(t,{chainId:84532});
  const a=require('../script/compile.cjs')();
  const escrow=await new ContractFactory(a.abi,a.evm.bytecode.object,merchant).deploy(await receiver.getAddress());await escrow.waitForDeployment();
  assert.equal(await readPolicyVersion(()=>escrow.POLICY_VERSION()),3);
  const now=(await provider.getBlock('latest')).timestamp;
  const options=[{asset:ZeroAddress,total:'300',deposit:'100'}];
  const terms={version:3,automaticRelease:true,options,service:'Local consent verification',description:'Isolated contract evidence',
    merchant:await merchant.getAddress(),customer:await customer.getAddress(),total:'300',deposit:'100',expiresAt:now+1000,refundCutoff:now+2000};
  async function recorded(id){const q=await escrow.getQuote(id);return {id,merchant:q.merchant,customer:q.customer,total:q.total,deposit:q.deposit,
    expiresAt:q.expiresAt,refundCutoff:q.refundCutoff,termsHash:q.termsHash,status:Number(q.status),asset:q.asset,selectedOption:Number(q.selectedOption),
    options:(await escrow.getQuoteOptions(id)).map(o=>({asset:o.asset,total:String(o.total),deposit:String(o.deposit)})),policyVersion:3,automaticRelease:await escrow.automaticRelease(id)};}
  await (await escrow.createQuoteWithPolicy(terms.customer,options,terms.expiresAt,terms.refundCutoff,termsHash(terms),true)).wait();
  assert.equal(matchesQuote(decodeTerms(encodeTerms(terms)),await recorded(1n)),true);
  await assert.rejects(escrow.connect(customer).payDeposit.staticCall(1n,termsHash(terms),{value:100n}));
  await assert.rejects(escrow.connect(customer).payDepositOption.staticCall(1n,0,termsHash(terms),{value:100n}));
  await assert.rejects(escrow.connect(customer).payDepositWithPolicy.staticCall(1n,0,termsHash(terms),false,{value:100n}));
  await (await escrow.connect(customer).payDepositWithPolicy(1n,0,termsHash(terms),true,{value:100n})).wait();
  assert.equal((await recorded(1n)).status,2);assert.equal(await escrow.totalLiability(),100n);
  const manual={...terms,automaticRelease:false};
  // A merchant's inconsistent fingerprint cannot fool the UI or the explicit consent guard.
  await (await escrow.createQuoteWithPolicy(terms.customer,options,terms.expiresAt,terms.refundCutoff,termsHash(manual),true)).wait();
  assert.equal(matchesQuote(manual,await recorded(2n)),false);
  await assert.rejects(escrow.connect(customer).payDepositWithPolicy.staticCall(2n,0,termsHash(manual),false,{value:100n}));
  assert.equal((await recorded(2n)).status,1);
  await (await escrow.createQuoteWithPolicy(terms.customer,options,terms.expiresAt,terms.refundCutoff,termsHash(manual),false)).wait();
  assert.equal(matchesQuote(manual,await recorded(3n)),true);
  await assert.rejects(escrow.connect(customer).payDepositWithPolicy.staticCall(3n,0,termsHash(manual),true,{value:100n}));
  await (await escrow.connect(customer).payDepositWithPolicy(3n,0,termsHash(manual),false,{value:100n})).wait();
  assert.equal(await escrow.totalLiability(),200n);
});
