const {test}=require('node:test'),assert=require('node:assert/strict');
const {inventory,fee,scenarios,constant,review}=require('../script/renewable-cost-review.cjs');
const hash=n=>'0x'+n.toString(16).padStart(64,'0');
const receipt={transactionHash:hash(1),blockHash:hash(2),gasUsed:'0x64',status:'0x1',effectiveGasPrice:'0x2',l1Fee:'0x3',logs:[]};
test('offline inventory deduplicates receipts and never equates envelope cost with service charges',()=>{
 const result=inventory([{file:'isolated-fixture-a',document:{receipt,transaction:{hash:hash(1),chainId:'0x14a34'}}},{file:'isolated-fixture-b',document:{receipt:{...receipt,gasUsed:'100'}}}]);
 assert.equal(result.summary.uniqueReceipts,1);assert.equal(result.summary.selectedBaseEnvelopeExecutionWei,'200');assert.equal(result.summary.selectedBaseReportedL1FeeWei,'3');
 assert.equal(result.receipts[0].references.length,2);assert.equal(result.receipts[0].serviceChargeWei,null);
});
test('unknown effective source price stays unknown; conflicting duplicates and malformed amounts fail',()=>{
 const r={...receipt,effectiveGasPrice:null};
 const result=inventory([{file:'isolated-fixture',document:{receipt:r,transaction:{hash:hash(1),chainId:'5318007',gasPrice:'1000'}}}]);
 assert.equal(result.receipts[0].envelopeExecutionWei,null);assert.equal(result.summary.sourceReceiptsMissingEffectiveGasPrice,1);
 assert.throws(()=>inventory([{file:'a',document:receipt},{file:'b',document:{...receipt,gasUsed:'101'}}]),/Conflicting/);
 assert.throws(()=>inventory([{file:'a',document:{...receipt,gasUsed:'-1'}}]),/Invalid unsigned/);
});
test('fee rounding and partial horizon sensitivity preserve units without grant readiness',()=>{
 assert.equal(fee(1n,1001n,1n,0n),2n);assert.throws(()=>fee(0n,1000n,1n,0n),/Invalid fee/);assert.throws(()=>fee(1n,1000n,1n,-1n),/Invalid fee/);
 const o={cronTimes:['100','200','300'],reactivePrice:'100000000000',callbackPrice:'6000000',reactiveCoeff:'1000',callbackCoeff:'1100',reactiveExtra:'100000',callbackExtra:'80000'};
 const r=scenarios(o,{attempts:3n,recoveries:2n,callbackGas:1000000n});
 assert.equal(r.modeledTickSeconds,'50');assert.equal(r.sourceMaximumGasStressUnitWei,'200000000000000000');assert.equal(r.profiles[0].timerOnlyMaximumGasStressWei,'3600000000000000000');
 assert.equal(r.acknowledgementRequestCap,'9');assert.equal(r.acceptedAcknowledgementRequestCap,'3');assert.equal(r.acknowledgementSinglePassDestinationAllowanceWei,'42768000000000');
 assert.ok(BigInt(r.profiles[2].timerOnlyMaximumGasStressWei)>BigInt(r.profiles[1].timerOnlyMaximumGasStressWei));
 assert.throws(()=>scenarios({...o,cronTimes:['100','100','200']},{attempts:3n,recoveries:2n,callbackGas:1000000n}),/Invalid recorded/);
 assert.throws(()=>constant('uint X = dynamic();','X'),/Unrecognized/);
});
test('archived review stays offline, fingerprints all inputs and refuses to declare grant readiness',()=>{
 const result=review();assert.equal(result.readOnly,true);assert.equal(result.canGrant,false);assert.equal(result.admissionDecision,'NOT_EVALUATED');assert.equal(result.archivedFeeReference.fresh,false);
 assert.deepEqual(result,require('../docs/analysis/renewable-cost-review.json'));
 assert.equal(result.inputs.length,9);assert.ok(result.inputs.every(x=>/^[a-f0-9]{64}$/.test(x.sha256)));
 assert.ok(result.receiptInventory.summary.uniqueReceipts>0);assert.ok(result.receiptInventory.receipts.every(r=>r.serviceChargeWei===null));
});
