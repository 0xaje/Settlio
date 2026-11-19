const fs = require('node:fs');
const path = require('node:path');
const { JsonRpcProvider, FetchRequest, Wallet, ContractFactory, Contract, parseEther, ZeroAddress, keccak256 } = require('ethers');
const compile = require('./compile.cjs');

const root = path.join(__dirname, '..');
const directory = path.join(root, 'deployments');
const journalPath = path.join(directory, 'testnet.json');
const lockPath = path.join(directory, '.deploy.lock');
const proxy = '0x476F44b11F5C942c58f4c8E3d0300E5710743585';
const system = '0x8888888888888888888888888888888888888888';

function provider(url) {
  const request = new FetchRequest(url);
  request.timeout = 15000;
  return new JsonRpcProvider(request, undefined, { cacheTimeout: -1 });
}

async function main() {
  if (!process.env.DEPLOYER_PRIVATE_KEY) {
    throw new Error('Set DEPLOYER_PRIVATE_KEY securely in your local environment. Never paste it into chat or commit it.');
  }
  fs.mkdirSync(directory, { recursive: true });
  const lock = fs.openSync(lockPath, 'wx');
  const base = provider(process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org');
  const lasna = provider(process.env.LASNA_RPC || 'https://lasna-rpc.rnk.dev');
  try {
    if (BigInt(await base.send('eth_chainId', [])) !== 84532n ||
        BigInt(await lasna.send('eth_chainId', [])) !== 5318007n) {
      throw new Error('Wrong network. Deployment supports Base Sepolia and Lasna only.');
    }
    if (await base.getCode(proxy) === '0x' || await lasna.getCode(system) === '0x') {
      throw new Error('Protocol contract bytecode missing.');
    }
    const baseSigner = new Wallet(process.env.DEPLOYER_PRIVATE_KEY, base);
    const reactiveSigner = new Wallet(process.env.DEPLOYER_PRIVATE_KEY, lasna);
    const journal = fs.existsSync(journalPath) ? JSON.parse(fs.readFileSync(journalPath)) : {
      deployer: baseSigner.address, baseChainId: 84532, reactiveChainId: 5318007, contracts: {}
    };
    if (journal.deployer !== baseSigner.address) throw new Error('Journal belongs to a different deployer.');
    function save() {
      fs.writeFileSync(journalPath + '.tmp', JSON.stringify(journal, null, 2) + '\n');
      fs.renameSync(journalPath + '.tmp', journalPath);
    }
    async function deploy(name, signer, args, value) {
      const artifact = compile(name);
      const fingerprint = keccak256('0x' + artifact.evm.bytecode.object);
      const existing = journal.contracts[name];
      const rpc = signer.provider;
      if (existing) {
        if (existing.creationBytecodeHash !== fingerprint) throw new Error('Source changed since deployment. Review the journal before redeployment.');
        const receipt = await rpc.waitForTransaction(existing.transactionHash, 1, 120000);
        if (!receipt || receipt.status !== 1 || await rpc.getCode(existing.address) === '0x') {
          throw new Error('Recorded deployment has not succeeded. Review the journal.');
        }
        return new Contract(existing.address, artifact.abi, signer);
      }
      const contract = await new ContractFactory(artifact.abi, artifact.evm.bytecode.object, signer).deploy(...args, { value, type: 0 });
      const transaction = contract.deploymentTransaction();
      journal.contracts[name] = {
        address: await contract.getAddress(), transactionHash: transaction.hash,
        chainId: Number((await rpc.getNetwork()).chainId), creationBytecodeHash: fingerprint
      };
      save();
      const receipt = await transaction.wait(1, 120000);
      if (!receipt || receipt.status !== 1) throw new Error('Deployment did not succeed.');
      return contract;
    }
    const reactive = await deploy('SettlioReactive', reactiveSigner, [84532], parseEther(process.env.REACTIVE_FUND || '0.1'));
    const callback = await deploy('SettlioCallback', baseSigner, [proxy, await reactive.getAddress()], parseEther(process.env.CALLBACK_FUND || '0.001'));
    const escrow = await callback.escrow();
    if (await base.getCode(escrow) === '0x') throw new Error('Escrow creation failed.');
    journal.escrow = escrow;
    save();
    if (await reactive.originEscrow() === ZeroAddress) {
      const transaction = await reactive.configure(escrow, await callback.getAddress(), { type: 0 });
      journal.configurationTransaction = transaction.hash;
      save();
      const receipt = await transaction.wait(1, 120000);
      if (!receipt || receipt.status !== 1) throw new Error('Configuration did not succeed.');
    }
    if (await reactive.originEscrow() !== escrow ||
        await reactive.callbackReceiver() !== await callback.getAddress() ||
        await callback._CALLBACK_SENDER() !== await reactive.getAddress()) {
      throw new Error('Deployment wiring mismatch.');
    }
    journal.wiringVerified = true;
    journal.verifiedAt = new Date().toISOString();
    save();
    console.log('Deployment wiring verified. Public addresses and deployment hashes are in deployments/testnet.json.');
    console.log('A customer deposit and network callback still need live verification.');
  } finally {
    base.destroy(); lasna.destroy();
    fs.closeSync(lock);
    fs.unlinkSync(lockPath);
  }
}
main().catch(error => {
  // Do not print RPC errors or transaction objects which may contain private configuration.
  const allowed = ['Set DEPLOYER_PRIVATE_KEY', 'Wrong network', 'Protocol contract', 'Journal belongs', 'Source changed', 'Recorded deployment', 'Deployment did not', 'Escrow creation', 'Configuration did not', 'Deployment wiring'];
  console.error(allowed.some(prefix => error.message.startsWith(prefix)) ? error.message :
    'Deployment stopped. Check funds, RPC access, and the deployment journal before retrying. Remove deployments/.deploy.lock only after confirming no deployment process is running.');
  process.exitCode = 1;
});
