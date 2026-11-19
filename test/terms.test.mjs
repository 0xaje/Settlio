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
