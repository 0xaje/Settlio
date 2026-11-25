import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ContractFactory } from 'ethers';
import start from './helpers/local-chain.cjs';
import compile from '../script/compile.cjs';
import { approvalKey, approvalValue, prepareDepositApproval } from '../apps/web/src/approval.ts';

test('unknown or another wallet/token/spender approval cannot authorize this UI context', () => {
  const key = approvalKey('0xAb', '0xCd', '0xEf');
  const state = { key, value: 1000000n };
  assert.equal(approvalValue(null, key), null);
  assert.equal(approvalValue(state, approvalKey('0xab', '0xcd', '0xef')), 1000000n);
  for (const changed of [['0x12', '0xcd', '0xef'], ['0xab', '0x12', '0xef'], ['0xab', '0xcd', '0x12']]) {
    assert.equal(approvalValue(state, approvalKey(...changed)), null);
  }
});

test('fresh actual token allowance prevents a second approval even with stale zero UI state', async t => {
  const { provider, signers } = await start(t);
  const sources = { 'test/ApprovalFixture.sol': { content: `// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;
contract ApprovalFixture {
 mapping(address => mapping(address => uint256)) public allowance;
 event Approval(address indexed owner,address indexed spender,uint256 value);
 function approve(address spender,uint256 value) external returns(bool){allowance[msg.sender][spender]=value;emit Approval(msg.sender,spender,value);return true;}
}` } };
  const a = compile('ApprovalFixture', sources);
  const token = await new ContractFactory(a.abi, a.evm.bytecode.object, signers[0]).deploy();
  await token.waitForDeployment();
  const customer = signers[1], owner = await customer.getAddress(), spender = await signers[2].getAddress();
  const contract = token.connect(customer);
  const adapter = { allowance: (o, s) => contract.allowance(o, s), approve: (s, v) => contract.approve(s, v) };
  const first = await prepareDepositApproval(adapter, owner, spender, 1000000n);
  assert(first.transaction); await first.transaction.wait();
  const nonce = await provider.getTransactionCount(owner);
  const staleUI = { key: approvalKey(token.target, owner, spender), value: 0n };
  assert.equal(approvalValue(staleUI, staleUI.key), 0n);
  const second = await prepareDepositApproval(adapter, owner, spender, 1000000n);
  assert.equal(second.transaction, null); assert.equal(second.allowance, 1000000n);
  assert.equal(await provider.getTransactionCount(owner), nonce);
  assert.equal(await contract.allowance(owner, spender), 1000000n);
  // The deliberate reset-then-approve path remains distinct from duplicate 1/1 approvals.
  await (await contract.approve(spender, 10n)).wait();
  const reset = await prepareDepositApproval(adapter, owner, spender, 1000000n);
  await reset.transaction.wait(); assert.equal(await contract.allowance(owner, spender), 0n);
  const exact = await prepareDepositApproval(adapter, owner, spender, 1000000n);
  await exact.transaction.wait(); assert.equal(await contract.allowance(owner, spender), 1000000n);
});

test('an unavailable allowance or invalid deposit cannot send an approval', async () => {
  let sent = false;
  const token = { allowance: async () => { throw Error('RPC unavailable'); }, approve: async () => { sent = true; } };
  await assert.rejects(prepareDepositApproval(token, 'owner', 'spender', 100n), /unavailable/);
  await assert.rejects(prepareDepositApproval(token, 'owner', 'spender', 0n), /positive/);
  assert.equal(sent, false);
});
