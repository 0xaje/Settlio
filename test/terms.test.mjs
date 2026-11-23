import assert from 'node:assert/strict';
import { test } from 'node:test';
import { encodeTerms, decodeTerms, matchesQuote, termsHash } from '../apps/web/src/terms.ts';

const terms = {
  version: 1, service: 'Portrait session', description: 'Two hours · Àkúrẹ',
  merchant: '0x0000000000000000000000000000000000000001',
  customer: '0x0000000000000000000000000000000000000002',
  total: '300000000000000000', deposit: '100000000000000000',
  expiresAt: 2000000000, refundCutoff: 2000001000
};
const quote = {
  id: 1n, merchant: terms.merchant, customer: terms.customer,
  total: BigInt(terms.total), deposit: BigInt(terms.deposit),
  expiresAt: BigInt(terms.expiresAt), refundCutoff: BigInt(terms.refundCutoff),
  termsHash: termsHash(terms), status: 1
};
test('share terms preserve Unicode and match the recorded fingerprint', () => {
  assert.deepEqual(decodeTerms(encodeTerms(terms)), terms);
  assert.equal(matchesQuote(terms, quote), true);
});
test('changed description cannot be accepted under the original fingerprint', () => {
  assert.equal(matchesQuote({ ...terms, description: 'Changed scope' }, quote), false);
});
test('fingerprint alone cannot override differing on-chain payment terms', () => {
  for (const change of [{ total: 1n }, { deposit: 1n }, { refundCutoff: 1n }, { expiresAt: 1n },
    { customer: terms.merchant }, { merchant: terms.customer }]) {
    assert.equal(matchesQuote(terms, { ...quote, ...change }), false);
  }
});
test('invalid, oversized, and structurally incomplete terms fail decoding', () => {
  for (const value of ['bad%encoding', 'x'.repeat(16001), btoa('{}'), '']) {
    assert.throws(() => decodeTerms(value));
  }
});

test('all payment choices are bound; paid quote must match its locked option', () => {
  const options = [{ asset: '0x0000000000000000000000000000000000000000', total: terms.total, deposit: terms.deposit },
    { asset: '0x0000000000000000000000000000000000000003', total: '3000000', deposit: '1000000' }];
  const multi = { ...terms, version: 2, options };
  const unpaid = { ...quote, options, asset: options[0].asset, selectedOption: 0, termsHash: termsHash(multi) };
  assert.deepEqual(decodeTerms(encodeTerms(multi)), multi);
  assert.equal(matchesQuote(multi, unpaid), true);
  const paid = { ...unpaid, status: 2, asset: options[1].asset, selectedOption: 1, total: 3000000n, deposit: 1000000n };
  assert.equal(matchesQuote(multi, paid), true);
  for (const change of [{ asset: options[0].asset }, { selectedOption: 0 }, { deposit: 1n }, { options: [options[0]] }]) {
    assert.equal(matchesQuote(multi, { ...paid, ...change }), false);
  }
  assert.equal(matchesQuote({ ...multi, options: [options[0], { ...options[1], deposit: '2' }] }, unpaid), false);
  assert.equal(matchesQuote(terms, { ...quote, options }), false);
  assert.throws(() => decodeTerms(encodeTerms({ ...multi, options: [options[0], options[0]] })));
});

test('legacy share-link fingerprints stay unchanged across the policy upgrade',()=>{
  assert.equal(termsHash(terms),'0xb4ceeb3daa684bb7f63fa00eb6d7a38a0e89579f85e6f66aafcd188ccdbdd302');
  const options=[{asset:'0x0000000000000000000000000000000000000000',total:terms.total,deposit:terms.deposit},
    {asset:'0x0000000000000000000000000000000000000003',total:'3000000',deposit:'1000000'}];
  assert.equal(termsHash({...terms,version:2,options}),'0x425ea245fe2aa491ba0bf8ae4029ee95479e2817340df701738e6c6e38da2d11');
});

test('version 3 binds release consent to both share terms and the recorded policy',()=>{
  const options=[{asset:'0x0000000000000000000000000000000000000000',total:terms.total,deposit:terms.deposit}];
  const policy={...terms,version:3,options,automaticRelease:true};
  const recorded={...quote,options,asset:options[0].asset,selectedOption:0,policyVersion:3,automaticRelease:true,termsHash:termsHash(policy)};
  assert.deepEqual(decodeTerms(encodeTerms(policy)),policy);assert.equal(matchesQuote(policy,recorded),true);
  assert.equal(matchesQuote({...policy,automaticRelease:false},recorded),false);
  assert.equal(matchesQuote(policy,{...recorded,automaticRelease:false}),false);
  assert.equal(matchesQuote(policy,{...recorded,policyVersion:0}),false);
  assert.notEqual(termsHash(policy),termsHash({...policy,automaticRelease:false}));
  assert.throws(()=>decodeTerms(encodeTerms({...policy,automaticRelease:undefined})));
  assert.throws(()=>decodeTerms(encodeTerms({...policy,automaticRelease:'true'})));
  const legacy={...terms,version:2,options};
  assert.equal(matchesQuote(legacy,{...recorded,termsHash:termsHash(legacy)}),false);
});
