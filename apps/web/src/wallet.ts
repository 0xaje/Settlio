import type { Eip1193Provider } from 'ethers';

const chainId = '0x14a34';
export async function ensureBaseSepolia(wallet: Eip1193Provider): Promise<void> {
  if (BigInt(await wallet.request({ method: 'eth_chainId' }) as string) === 84532n) return;
  try {
    await wallet.request({ method: 'wallet_switchEthereumChain', params: [{ chainId }] });
  } catch (failure) {
    const error = failure as { code?: number; data?: { originalError?: { code?: number } } };
    if (error.code !== 4902 && error.data?.originalError?.code !== 4902) throw failure;
    await wallet.request({ method: 'wallet_addEthereumChain', params: [{
      chainId, chainName: 'Base Sepolia',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: ['https://sepolia.base.org'], blockExplorerUrls: ['https://sepolia.basescan.org']
    }] });
    await wallet.request({ method: 'wallet_switchEthereumChain', params: [{ chainId }] });
  }
  if (BigInt(await wallet.request({ method: 'eth_chainId' }) as string) !== 84532n) {
    throw new Error('Your wallet did not switch to Base Sepolia. Switch networks and connect again.');
  }
}
