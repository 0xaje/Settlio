const assert = require('node:assert/strict');
const { test } = require('node:test');
const { ContractFactory, JsonRpcProvider, keccak256, toUtf8Bytes } = require('ethers');
const startLocalChain = require('./helpers/local-chain.cjs');
const compile = require('../script/compile.cjs');
const { execFileSync } = require('node:child_process');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

// Node's real persistent Web Storage in separate processes. This exercises disk
// persistence, not browser origin policy, React mounting, or wallet behaviour.
function storageProcess(file, source, ...args) {
  return execFileSync(process.execPath,
    ['--experimental-webstorage', '--localstorage-file=' + file, '-e', source, ...args],
    { encoding: 'utf8', env: { ...process.env, NODE_NO_WARNINGS: '1' } }).trim();
}

// Actual local EVM/RPC interruption test; this is not public-network/browser evidence.
test('pending creation survives a reader restart and recovers once without resubmission', async t => {
  const { pendingReceipt, decodePending } = await import('../apps/web/src/pending.ts');
  const { createdQuoteFromReceipt } = await import('../apps/web/src/recovery.ts');
  const { provider, signers: [merchant, customer, receiver] } = await startLocalChain(t, { chainId: 84532 });
  const artifact = compile();
  const escrow = await new ContractFactory(artifact.abi, artifact.evm.bytecode.object, merchant).deploy(await receiver.getAddress());
  await escrow.waitForDeployment();
  const address = await escrow.getAddress();
  const now = (await provider.getBlock('latest')).timestamp;
  await provider.send('evm_setAutomine', [false]);
  const tx = await escrow.createQuote(await customer.getAddress(), 300n, 100n, now+3600, now+7200,
    keccak256(toUtf8Bytes('local interrupted receipt test')), { gasLimit: 1000000 });
  const saved = JSON.stringify({ hash: tx.hash, escrow: address });
  const directory = mkdtempSync(join(tmpdir(), 'settlio-storage-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const storageFile = join(directory, 'pending.store');
  const key = 'settlio:pending:84532:' + address;
  storageProcess(storageFile, 'localStorage.setItem(process.argv[1], process.argv[2]);', key, saved);
  assert.equal(await pendingReceipt(provider, tx.hash), null);
  const connection = provider._getConnection();
  provider.destroy();
  const restarted = new JsonRpcProvider(connection, undefined, {cacheTimeout:-1});
  t.after(() => restarted.destroy());
  // The writer has exited. A separate process reads the same persistent store.
  const persisted = storageProcess(storageFile, 'process.stdout.write(localStorage.getItem(process.argv[1]) || "");', key);
  assert.equal(persisted, saved);
  const restored = decodePending(persisted, address);
  assert.equal(decodePending(persisted, await customer.getAddress()), null);
  assert.equal(storageProcess(storageFile, 'process.stdout.write(localStorage.getItem(process.argv[1]) || "");', key + ':other'), '');
  assert.equal(restored.hash, tx.hash);
  assert.equal(await pendingReceipt(restarted, restored.hash), null);
  await restarted.send('evm_mine', []);
  const receipt = await pendingReceipt(restarted, restored.hash);
  assert.equal(receipt.status, 1);
  assert.equal(createdQuoteFromReceipt(receipt, address).id, 1n);
  assert.equal(await escrow.connect(restarted).quoteCount(), 1n);
  assert.equal((await pendingReceipt(restarted, restored.hash)).hash, tx.hash);
  assert.equal(await escrow.connect(restarted).quoteCount(), 1n);
  storageProcess(storageFile, 'localStorage.removeItem(process.argv[1]);', key);
  assert.equal(storageProcess(storageFile, 'process.stdout.write(localStorage.getItem(process.argv[1]) || "");', key), '');
});
