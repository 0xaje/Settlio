import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {ContractFactory,Contract,ZeroAddress} from 'ethers';
import {readAdmissionState,creationUnavailable,assertCreationAllowed,retryUnavailable,ADMISSION_ESCROW_ABI} from '../apps/web/src/admission.ts';
import {termsHash,encodeTerms,decodeTerms,matchesQuote} from '../apps/web/src/terms.ts';
const require=createRequire(import.meta.url),compile=require('../script/compile-admission.cjs'),legacy=require('../script/compile.cjs'),start=require('./helpers/local-chain.cjs');
const sample=()=>({policyVersion:4,address:'0x0000000000000000000000000000000000000001',sponsor:'0x0000000000000000000000000000000000000002',blockNumber:1,blockTime:1000n,open:true,active:0n,reserved:2n,admitted:0n,maxActive:2n,maxLifetime:3n,maxHorizon:1000n,maxRetries:2n,retryInterval:60n,credits:2n,validUntil:1100n,jobAdmitted:true,jobClosed:false,retries:0n,retryAfter:0n});
test('creation UI refuses unknown, paused, exhausted, full, expired and missing allowances',()=>{
 assert.match(creationUnavailable(null),/not verified/);
 for(const change of [{open:false},{active:2n},{admitted:3n},{credits:0n},{validUntil:1000n}])assert.notEqual(creationUnavailable({...sample(),...change}),'');
 assert.equal(creationUnavailable(sample()),'');assert.doesNotThrow(()=>assertCreationAllowed(sample(),1100,2000));
 for(const [expiry,cutoff]of [[1000,1500],[1100,2001],[1200,1100],[NaN,1500]])assert.throws(()=>assertCreationAllowed(sample(),expiry,cutoff));
});
test('retry UI keeps unknown status blocked and respects shared allowance, cooldown and closure',()=>{
 assert.notEqual(retryUnavailable(null),'');assert.equal(retryUnavailable(sample()),'');
 for(const change of [{jobAdmitted:false},{jobClosed:true},{retries:undefined},{retries:2n},{retryAfter:1001n}])assert.notEqual(retryUnavailable({...sample(),...change}),'');
 assert.equal(retryUnavailable({...sample(),open:false,credits:0n,validUntil:0n}),'');
});
test('V4 interface reader and versioned terms operate on real isolated escrow and preserve refund recovery',async t=>{
 const {provider,signers:[merchant,customer,receiver]}=await start(t,{chainId:84532});
 const a=compile('SettlioEscrowV4'),e=await new ContractFactory(a.abi,a.evm.bytecode.object,merchant).deploy(await receiver.getAddress(),await merchant.getAddress(),2,3,1000,60,1);await e.waitForDeployment();
 // The frontend extends the legacy ABI with exactly the V4-only admission/recovery selectors.
 const escrow=new Contract(e.target,[...legacy().abi,...ADMISSION_ESCROW_ABI],merchant);
 const gate=new Contract(await escrow.admission(),compile('SettlioAdmission').abi,merchant),who=await merchant.getAddress();
 async function state(id){const b=await provider.getBlock('latest');return readAdmissionState(provider,escrow,who,id,()=>BigInt(b.timestamp));}
 assert.match(creationUnavailable(await state()),/paused/);await(await gate.setOpen(true)).wait();assert.match(creationUnavailable(await state()),/no sponsored/);
 const now=(await provider.getBlock('latest')).timestamp;
 await(await gate.setGrant(who,2,now+500,'0x'+'12'.repeat(32))).wait();assert.equal(creationUnavailable(await state()),'');
 const terms={version:4,automaticRelease:true,options:[{asset:ZeroAddress,total:'300',deposit:'100'}],service:'Local V4 UI verification',description:'Isolated fixture, not a public booking',merchant:who,customer:await customer.getAddress(),total:'300',deposit:'100',expiresAt:now+300,refundCutoff:now+600};
 assertCreationAllowed(await state(),terms.expiresAt,terms.refundCutoff);
 await(await escrow.createQuoteWithPolicy(terms.customer,terms.options,terms.expiresAt,terms.refundCutoff,termsHash(terms),true)).wait();
 const q=await escrow.getQuote(1),quote={id:1n,merchant:q.merchant,customer:q.customer,total:q.total,deposit:q.deposit,expiresAt:q.expiresAt,refundCutoff:q.refundCutoff,termsHash:q.termsHash,status:Number(q.status),asset:q.asset,selectedOption:Number(q.selectedOption),options:terms.options,policyVersion:4,automaticRelease:true};
 assert.equal(matchesQuote(decodeTerms(encodeTerms(terms)),quote),true);
 assert.equal(matchesQuote({...terms,automaticRelease:false},quote),false);
 assert.equal(matchesQuote({...terms,version:3},{...quote,termsHash:termsHash({...terms,version:3})}),false);
 const downgraded={...terms,version:2,automaticRelease:undefined};assert.equal(matchesQuote(downgraded,{...quote,termsHash:termsHash(downgraded),automaticRelease:false}),false);
 await assert.rejects(escrow.connect(customer).payDepositWithPolicy.staticCall(1,0,termsHash(terms),false,{value:100}));
 await(await escrow.connect(customer).payDepositWithPolicy(1,0,termsHash(terms),true,{value:100})).wait();
 assert.equal(retryUnavailable(await state(1)),'');await(await escrow.connect(customer).requestPolicy(1)).wait();assert.match(retryUnavailable(await state(1)),/used up/);
 await(await gate.setOpen(false)).wait();await(await escrow.connect(customer).requestCancellation(1)).wait();
 // No admission reader/scheduler RPC is needed by the customer's Base-only recovery transaction.
 await(await escrow.connect(customer).claimRefund(1)).wait();assert.equal((await escrow.getQuote(1)).status,5n);assert.equal(await escrow.totalLiability(),0n);assert.equal(await gate.active(),0n);
 assert.notEqual(retryUnavailable(await state(1)),'');
 const b=await provider.getBlock('latest');await assert.rejects(readAdmissionState(provider,escrow,who,undefined,()=>BigInt(b.timestamp)+181n),/stale/);
 const old=legacy(),v3=await new ContractFactory(old.abi,old.evm.bytecode.object,merchant).deploy(await receiver.getAddress());await v3.waitForDeployment();await assert.rejects(readAdmissionState(provider,v3,who),/version 4/);
});
