import { BrowserProvider, Contract, FetchRequest, getAddress, isAddress, JsonRpcProvider, type Eip1193Provider } from 'ethers';
import abi from './escrow-abi.json';
import { ADMISSION_ESCROW_ABI, admissionContract } from './admission';
const contractABI = [...abi, ...ADMISSION_ESCROW_ABI];
import type { Quote } from './terms';
import { readPolicyVersion, assertPolicyWiring, REACTIVE_SYSTEM } from './policy';

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
  return new Contract(escrowAddress, contractABI, reader);
}

export async function walletContract(expectedAccount: string): Promise<Contract> {
  if (!window.ethereum) throw new Error('Open this page in a browser with a wallet.');
  if (!configured) throw new Error('The escrow has not been configured.');
  const provider = new BrowserProvider(window.ethereum);
  const chain = BigInt(await window.ethereum.request({ method: 'eth_chainId' }) as string);
  if (chain !== 84532n) throw new Error('Switch your wallet to Base Sepolia before continuing.');
  const signer = await provider.getSigner();
  if (getAddress(await signer.getAddress()) !== getAddress(expectedAccount)) throw new Error('Your wallet account changed. Review the quote again.');
  return new Contract(escrowAddress, contractABI, signer);
}

export function asQuote(id: bigint, value: Record<string, unknown>): Quote {
  return {
    id, merchant: value.merchant as string, customer: value.customer as string,
    total: BigInt(value.total as bigint), deposit: BigInt(value.deposit as bigint),
    expiresAt: BigInt(value.expiresAt as bigint), refundCutoff: BigInt(value.refundCutoff as bigint),
    termsHash: value.termsHash as string, status: Number(value.status),
    asset: value.asset as string, selectedOption: Number(value.selectedOption)
  };
}

export function errorMessage(error: unknown): string {
  const value = error as { code?: string | number; shortMessage?: string; message?: string };
  if (value.code === 4001 || value.code === 'ACTION_REJECTED') return 'You declined the wallet request. You can try again.';
  if (value.code === 'INSUFFICIENT_FUNDS') return 'Your wallet needs enough of the selected payment token, plus test ETH for gas.';
  if (value.code === 'CALL_EXCEPTION') return 'The contract rejected this action. Refresh the quote and check the amount, wallet, and deadline.';
  return value.shortMessage || value.message || 'This action could not be completed. Please try again.';
}

const reactiveRequest = new FetchRequest(import.meta.env.VITE_LASNA_RPC || 'https://lasna-rpc.rnk.dev');
reactiveRequest.timeout = 15000;
const reactiveReader = new JsonRpcProvider(reactiveRequest, undefined, { cacheTimeout: -1 });

export async function readPolicyDeployment(contract: Contract): Promise<
  { version: 0 } | { version: 3 | 4; receiver: Contract; scheduler: Contract }
> {
  const version = await readPolicyVersion(() => contract.POLICY_VERSION());
  if (version === 0) return { version };
  const receiverAddress = getAddress(await contract.callbackReceiver());
  const receiver = new Contract(receiverAddress, [
    'function escrow() view returns(address)', 'function _CALLBACK_SENDER() view returns(address)',
    'function _SERVICE_PROVIDER() view returns(address)'
  ], reader);
  const reactiveAddress = getAddress(await receiver._CALLBACK_SENDER());
  const scheduler = new Contract(reactiveAddress, [
    'function POLICY_VERSION() view returns(uint256)', 'function originChain() view returns(uint256)',
    'function originEscrow() view returns(address)', 'function callbackReceiver() view returns(address)',
    'function _SERVICE_PROVIDER() view returns(address)', 'function schedulerPaused() view returns(bool)',
    'function cronSubscribed() view returns(bool)', 'function activeJobCount() view returns(uint256)',
    'function jobs(uint256) view returns(uint64 expiresAt,uint64 refundCutoff,uint64 nextAt,uint8 attempts,bool automaticRelease,bool registered,bool confirmed,bool cancelled,bool closed,bool needsAttention,bool retryRequested)'
  ], reactiveReader);
  const [baseId, reactiveId, schedulerVersion, proxy, receiverEscrow, originChain, originEscrow, callbackReceiver, reactiveProvider] =
    await Promise.all([reader.send('eth_chainId', []), reactiveReader.send('eth_chainId', []),
      readPolicyVersion(() => scheduler.POLICY_VERSION()), receiver._SERVICE_PROVIDER(), receiver.escrow(),
      scheduler.originChain(), scheduler.originEscrow(), scheduler.callbackReceiver(), scheduler._SERVICE_PROVIDER()]);
  assertPolicyWiring({ baseChainId: BigInt(baseId), reactiveChainId: BigInt(reactiveId), schedulerVersion, escrowVersion: version,
    escrow: escrowAddress, receiver: receiverAddress, proxy, receiverEscrow, originChain, originEscrow, callbackReceiver, reactiveProvider });
  if (version === 4) {
    const block = await reader.getBlock('latest');
    if (!block) throw new Error('Base Sepolia block is unavailable.');
    await admissionContract(reader, contract, block.number);
  }
  return { version, receiver, scheduler };
}

export async function readAutomationStatus(id: bigint) {
  const deployment = await readPolicyDeployment(await readContract());
  if (deployment.version === 0) throw new Error('Automatic policies are not available on this deployment.');
  const { scheduler, receiver } = deployment;
  const proxy = getAddress(await receiver._SERVICE_PROVIDER());
  const receiverAddress = await receiver.getAddress(), schedulerAddress = await scheduler.getAddress();
  const billingAbi = ['function debt(address) view returns(uint256)', 'function reserves(address) view returns(uint256)'];
  const baseBilling = new Contract(proxy, billingAbi, reader);
  const reactiveBilling = new Contract(REACTIVE_SYSTEM, billingAbi, reactiveReader);
  const [job, paused, cron, nativeDebt, nativeReserves, nativeBalance, reactiveDebt, reactiveReserves, reactiveBalance] =
    await Promise.all([scheduler.jobs(id), scheduler.schedulerPaused(), scheduler.cronSubscribed(),
      baseBilling.debt(receiverAddress), baseBilling.reserves(receiverAddress), reader.getBalance(receiverAddress),
      reactiveBilling.debt(schedulerAddress), reactiveBilling.reserves(schedulerAddress), reactiveReader.getBalance(schedulerAddress)]);
  return { registered: Boolean(job.registered), closed: Boolean(job.closed), needsAttention: Boolean(job.needsAttention),
    nextAt: BigInt(job.nextAt), attempts: Number(job.attempts), paused: Boolean(paused), cron: Boolean(cron),
    feeAttention: nativeDebt > 0n || reactiveDebt > 0n || nativeReserves + nativeBalance === 0n || reactiveReserves + reactiveBalance === 0n,
    nativeDebt: BigInt(nativeDebt), reactiveDebt: BigInt(reactiveDebt) };
}
