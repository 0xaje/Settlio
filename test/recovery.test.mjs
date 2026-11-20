import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Interface, keccak256, toUtf8Bytes } from 'ethers';
import { createdQuoteFromReceipt } from '../apps/web/src/recovery.ts';
const escrow='0x0000000000000000000000000000000000000001';
const other='0x0000000000000000000000000000000000000002';
const fingerprint=keccak256(toUtf8Bytes('isolated recovery test'));
const iface=new Interface(['event QuoteCreated(uint256 indexed quoteId,address indexed merchant,address indexed customer,uint64 expiresAt,bytes32 termsHash)']);
const encoded=iface.encodeEventLog(iface.getEvent('QuoteCreated'),[3,escrow,other,2000000000,fingerprint]);
const log={address:escrow,...encoded};
test('quote recovery uses the creation event rather than a current counter or transaction sender',()=>{
 assert.deepEqual(createdQuoteFromReceipt({status:1,logs:[log]},escrow),{id:3n,termsHash:fingerprint});
});
test('a matching creation event on another escrow cannot recover this deployment',()=>{
 assert.equal(createdQuoteFromReceipt({status:1,logs:[{...log,address:other}]},escrow),null);
});
test('failed receipts and payment-only logs cannot be treated as quote creation',()=>{
 assert.equal(createdQuoteFromReceipt({status:0,logs:[log]},escrow),null);
 const unrelated=new Interface(['event DepositReceived(uint256 indexed quoteId,address indexed customer,uint256 amount)']);
 const payment=unrelated.encodeEventLog(unrelated.getEvent('DepositReceived'),[3,other,100]);
 assert.equal(createdQuoteFromReceipt({status:1,logs:[{address:escrow,...payment}]},escrow),null);
});
