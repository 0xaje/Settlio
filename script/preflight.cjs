const { JsonRpcProvider, FetchRequest } = require('ethers');
const networks = [
  { name: 'Base Sepolia', chainId: 84532n, url: process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org', contract: '0x476F44b11F5C942c58f4c8E3d0300E5710743585' },
  { name: 'Reactive Lasna', chainId: 5318007n, url: process.env.LASNA_RPC || 'https://lasna-rpc.rnk.dev', contract: '0x8888888888888888888888888888888888888888' }
];
async function main() {
  for (const network of networks) {
    const request = new FetchRequest(network.url);
    request.timeout = 10000;
    const provider = new JsonRpcProvider(request, undefined, { cacheTimeout: -1 });
    try {
      const chainId = BigInt(await provider.send('eth_chainId', []));
      if (chainId !== network.chainId) throw new Error('Unexpected chain ID');
      const code = await provider.getCode(network.contract);
      if (code === '0x') throw new Error('Expected protocol contract has no code');
      console.log(network.name + ': chain ID and protocol bytecode verified');
    } finally { provider.destroy(); }
  }
}
main().catch(() => {
  console.error('Network preflight failed. Check network access and RPC configuration. No transaction was sent.');
  process.exitCode = 1;
});
