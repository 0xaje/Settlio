const { spawn } = require('node:child_process');
const { once } = require('node:events');
const path = require('node:path');
const { JsonRpcProvider, Wallet, HDNodeWallet, NonceManager } = require('ethers');

/// Starts an isolated local fixture. These ephemeral accounts never receive public-network funds.
module.exports = async function startLocalChain(t) {
  const mnemonic = Wallet.createRandom().mnemonic.phrase;
  const child = spawn(process.execPath, [
    path.join(__dirname, '../../node_modules/@foundry-rs/anvil/bin.mjs'),
    '--host', '127.0.0.1', '--port', '0', '--chain-id', '31337', '--mnemonic', mnemonic
  ], { stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32' });
  let provider;
  let exited = false;
  child.once('exit', () => { exited = true; });
  t.after(async () => {
    provider?.destroy();
    if (!exited && child.pid) {
      const exit = once(child, 'exit').catch(() => {});
      try {
        if (process.platform === 'win32') child.kill();
        else process.kill(-child.pid, 'SIGTERM');
      } catch (error) { if (error.code !== 'ESRCH') throw error; }
      await Promise.race([exit, new Promise(resolve => {
        const timer = setTimeout(resolve, 3000);
        timer.unref();
      })]);
    }
  });
  const url = await new Promise((resolve, reject) => {
    let buffer = '';
    const timer = setTimeout(() => reject(new Error('Anvil did not announce a listening address within 30 seconds.')), 30000);
    function finish(error, value) {
      clearTimeout(timer);
      child.stdout.removeListener('data', read);
      child.removeListener('error', failed);
      child.removeListener('exit', stopped);
      error ? reject(error) : resolve(value);
    }
    function read(chunk) {
      // Consume startup output privately. Never print mnemonic or account keys.
      buffer = (buffer + chunk.toString()).slice(-65536);
      const match = buffer.match(/Listening on (127\.0\.0\.1:\d+)/);
      if (match) finish(null, 'http://' + match[1]);
    }
    function failed() { finish(new Error('Anvil could not start. Reinstall the platform binary with npm ci.')); }
    function stopped(code) { finish(new Error('Anvil exited before it was ready (exit code ' + code + ').')); }
    child.stdout.on('data', read);
    child.stderr.on('data', () => {}); // Drain diagnostic output without exposing test keys.
    child.once('error', failed);
    child.once('exit', stopped);
  });
  provider = new JsonRpcProvider(url, undefined, { cacheTimeout: -1 });
  if (BigInt(await provider.send('eth_chainId', [])) !== 31337n) throw new Error('Unexpected local chain identity.');
  const accounts = await provider.send('eth_accounts', []);
  const wallets = Array.from({ length: 4 }, (_, index) =>
    HDNodeWallet.fromPhrase(mnemonic, undefined, "m/44'/60'/0'/0/" + index).connect(provider));
  for (let index = 0; index < wallets.length; index++) {
    if (accounts[index]?.toLowerCase() !== wallets[index].address.toLowerCase()) {
      throw new Error('The local node does not own the expected fixture accounts.');
    }
  }
  // Sign locally instead of relying on RPC eth_sendTransaction signing.
  return { provider, signers: wallets.map(wallet => new NonceManager(wallet)) };
};
