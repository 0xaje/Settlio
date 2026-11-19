import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ensureBaseSepolia } from '../apps/web/src/wallet.ts';
import { decodePending, pendingReceipt } from '../apps/web/src/pending.ts';

// Isolated wallet responses test error handling; they are not live wallet evidence.
test('already-correct wallet needs no network change request', async () => {
  const methods = [];
  await ensureBaseSepolia({ request: async ({method}) => { methods.push(method);return '0x14a34'; } });
  assert.deepEqual(methods, ['eth_chainId']);
});
test('unknown network is added with official testnet metadata then explicitly switched', async () => {
  const calls = [];let chain = '0x1', added = false;
  await ensureBaseSepolia({ request: async request => {
    calls.push(request);
    if (request.method === 'eth_chainId') return chain;
    if (request.method === 'wallet_addEthereumChain') { added = true; return null; }
    if (!added) throw { code: 4902 };
    chain = '0x14a34';return null;
  }});
  assert.deepEqual(calls.map(call => call.method), ['eth_chainId','wallet_switchEthereumChain','wallet_addEthereumChain','wallet_switchEthereumChain','eth_chainId']);
  const metadata = calls[2].params[0];
  assert.equal(metadata.chainId, '0x14a34');
  assert.equal(metadata.nativeCurrency.decimals, 18);
  assert.deepEqual(metadata.rpcUrls, ['https://sepolia.base.org']);
});
test('declined network change is not converted into an add-network request', async () => {
  const methods = [];
  await assert.rejects(ensureBaseSepolia({ request: async ({method}) => {
    methods.push(method);if (method === 'eth_chainId') return '0x1';throw { code:4001 };
  }}));
  assert.deepEqual(methods, ['eth_chainId','wallet_switchEthereumChain']);
});
test('wallet claiming a switch without changing chain cannot continue', async () => {
  await assert.rejects(ensureBaseSepolia({request:async ({method}) => method === 'eth_chainId' ? '0x1' : null}), /did not switch/);
});
test('pending transaction recovery rejects corrupt hashes and other deployments', () => {
  const escrow='0x0000000000000000000000000000000000000001';
  const record={hash:'0x'+'ab'.repeat(32),escrow};
  assert.deepEqual(decodePending(JSON.stringify(record),escrow),record);
  for(const bad of ['bad','{}','null',JSON.stringify({...record,hash:'0x123'}),JSON.stringify({...record,escrow:'0x0000000000000000000000000000000000000002'})]) {
    assert.equal(decodePending(bad,escrow),null);
  }
});

test('receipt recovery refuses a wrong network before reading a receipt', async () => {
  let read = false;
  await assert.rejects(pendingReceipt({ send:async()=> '0x1', getTransactionReceipt:async()=>{read=true;} },'0x'+'ab'.repeat(32)), /wrong network/);
  assert.equal(read,false);
});
test('receipt recovery preserves unknown pending outcome instead of treating it as failure', async () => {
  assert.equal(await pendingReceipt({send:async()=> '0x14a34',getTransactionReceipt:async()=> null},'0x'+'ab'.repeat(32)),null);
});
test('receipt recovery distinguishes mined success and failure without broadcasting', async () => {
  const hash='0x'+'ab'.repeat(32);
  for(const status of [0,1]) {
    const receipt={hash,status};
    assert.equal(await pendingReceipt({send:async()=> '0x14a34',getTransactionReceipt:async()=>receipt},hash),receipt);
  }
});
test('receipt recovery rejects mismatched or undecided receipts', async () => {
  const hash='0x'+'ab'.repeat(32);
  for(const receipt of [{hash,status:null},{hash:'0x'+'cd'.repeat(32),status:1}]) {
    await assert.rejects(pendingReceipt({send:async()=> '0x14a34',getTransactionReceipt:async()=>receipt},hash), /could not be verified/);
  }
});
