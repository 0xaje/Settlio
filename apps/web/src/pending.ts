// A receipt, not this browser record, determines whether a transaction succeeded.
export type PendingTransaction = { hash: string; escrow: string };
export function decodePending(value: string | null, escrow: string): PendingTransaction | null {
  try {
    const record = JSON.parse(value || 'null') as PendingTransaction | null;
    return record && /^0x[0-9a-f]{64}$/i.test(record.hash) &&
      /^0x[0-9a-f]{40}$/i.test(record.escrow) && record.escrow.toLowerCase() === escrow.toLowerCase() ? record : null;
  } catch { return null; }
}

import type { JsonRpcProvider, TransactionReceipt } from 'ethers';
export async function pendingReceipt(
  reader: Pick<JsonRpcProvider, 'send' | 'getTransactionReceipt'>,
  hash: string
): Promise<TransactionReceipt | null> {
  if (!/^0x[0-9a-f]{64}$/i.test(hash)) throw new Error('Invalid transaction hash.');
  if (BigInt(await reader.send('eth_chainId', [])) !== 84532n) throw new Error('The read connection is on the wrong network.');
  const receipt = await reader.getTransactionReceipt(hash);
  if (receipt && ((receipt.status !== 0 && receipt.status !== 1) || receipt.hash.toLowerCase() !== hash.toLowerCase())) {
    throw new Error('The receipt could not be verified. Check the explorer before trying again.');
  }
  return receipt;
}
