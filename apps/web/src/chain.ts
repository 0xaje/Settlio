import { BrowserProvider, Contract, FetchRequest, getAddress, isAddress, JsonRpcProvider, type Eip1193Provider } from 'ethers';
import abi from './escrow-abi.json';
import type { Quote } from './terms';

declare global {
  interface Window {
    ethereum?: Eip1193Provider & {
      on?: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}
const rawAddress = import.meta.env.VITE_ESCROW_ADDRESS || '';
export const escrowAddress = isAddress(rawAddress) ? getAddress(rawAddress) : '';
export const configured = !!escrowAddress && escrowAddress !== '0x0000000000000000000000000000000000000000';
const request = new FetchRequest(import.meta.env.VITE_BASE_SEPOLIA_RPC || 'https://sepolia.base.org');
request.timeout = 15000;
export const reader = new JsonRpcProvider(request, undefined, { cacheTimeout: -1 });
export const explorer = 'https://sepolia.basescan.org';

export async function readContract(): Promise<Contract> {
  if (!configured) throw new Error('Settlio needs a deployed escrow address before it can read quotes.');
  if (BigInt(await reader.send('eth_chainId', [])) !== 84532n) throw new Error('The read connection is on the wrong network.');
  if (await reader.getCode(escrowAddress) === '0x') throw new Error('No escrow contract was found at the configured address.');
  return new Contract(escrowAddress, abi, reader);
}

export async function walletContract(expectedAccount: string): Promise<Contract> {
  if (!window.ethereum) throw new Error('Open this page in a browser with a wallet.');
  if (!configured) throw new Error('The escrow has not been configured.');
  const provider = new BrowserProvider(window.ethereum);
  const chain = BigInt(await window.ethereum.request({ method: 'eth_chainId' }) as string);
  if (chain !== 84532n) throw new Error('Switch your wallet to Base Sepolia before continuing.');
  const signer = await provider.getSigner();
  if (getAddress(await signer.getAddress()) !== getAddress(expectedAccount)) throw new Error('Your wallet account changed. Review the quote again.');
  return new Contract(escrowAddress, abi, signer);
}

export function asQuote(id: bigint, value: Record<string, unknown>): Quote {
  return {
    id, merchant: value.merchant as string, customer: value.customer as string,
    total: BigInt(value.total as bigint), deposit: BigInt(value.deposit as bigint),
    expiresAt: BigInt(value.expiresAt as bigint), refundCutoff: BigInt(value.refundCutoff as bigint),
    termsHash: value.termsHash as string, status: Number(value.status)
  };
}

export function errorMessage(error: unknown): string {
  const value = error as { code?: string | number; shortMessage?: string; message?: string };
  if (value.code === 4001 || value.code === 'ACTION_REJECTED') return 'You declined the wallet request. You can try again.';
  if (value.code === 'INSUFFICIENT_FUNDS') return 'Your wallet needs enough test ETH for the deposit and gas.';
  if (value.code === 'CALL_EXCEPTION') return 'The contract rejected this action. Refresh the quote and check the amount, wallet, and deadline.';
  return value.shortMessage || value.message || 'This action could not be completed. Please try again.';
}
