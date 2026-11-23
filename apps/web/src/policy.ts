import { getAddress } from 'ethers';

export const BASE_CALLBACK_PROXY = '0x476F44b11F5C942c58f4c8E3d0300E5710743585';
export const REACTIVE_SYSTEM = '0x8888888888888888888888888888888888888888';

// Only a contract-call rejection represents the legacy missing selector.
// A transport error must remain unknown, never silently enable a fallback.
export async function readPolicyVersion(read: () => Promise<unknown>): Promise<0 | 3 | 4> {
  let value: unknown;
  try { value = await read(); }
  catch (error) {
    if ((error as { code?: string; data?: string }).code === 'CALL_EXCEPTION' && (error as { data?: string }).data === '0x') return 0;
    throw error;
  }
  if (BigInt(String(value)) !== 3n && BigInt(String(value)) !== 4n) throw new Error('This policy deployment version is not supported.');
  return Number(value) as 3 | 4;
}

export type PolicyWiring = {
  baseChainId: bigint; reactiveChainId: bigint; schedulerVersion: number; escrowVersion?: number;
  escrow: string; receiver: string; proxy: string; receiverEscrow: string;
  originChain: bigint; originEscrow: string; callbackReceiver: string; reactiveProvider: string;
};
export function assertPolicyWiring(value: PolicyWiring): void {
  const same = (a: string, b: string) => getAddress(a) === getAddress(b);
  if (value.baseChainId !== 84532n || value.reactiveChainId !== 5318007n || value.originChain !== 84532n ||
      ![3, 4].includes(value.escrowVersion ?? 3) || value.schedulerVersion !== (value.escrowVersion ?? 3) || !same(value.proxy, BASE_CALLBACK_PROXY) ||
      !same(value.receiverEscrow, value.escrow) || !same(value.originEscrow, value.escrow) ||
      !same(value.callbackReceiver, value.receiver) || !same(value.reactiveProvider, REACTIVE_SYSTEM)) {
    throw new Error('Automatic policy wiring could not be verified. Quote creation is paused.');
  }
}
