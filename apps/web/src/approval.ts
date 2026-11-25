// Unknown approval is never treated as zero. A fresh read guards every approval send.
export type ApprovalState = { key: string; value: bigint };
export function approvalKey(asset: string, owner: string, spender: string): string {
  return [asset, owner, spender].map(value => value.toLowerCase()).join(':');
}
export function approvalValue(state: ApprovalState | null, key: string): bigint | null {
  return state?.key === key ? state.value : null;
}
export async function prepareDepositApproval<T>(
  token: { allowance(owner: string, spender: string): Promise<bigint>; approve(spender: string, amount: bigint): Promise<T> },
  owner: string, spender: string, deposit: bigint
): Promise<{ allowance: bigint; transaction: T | null }> {
  if (deposit <= 0n) throw new Error('The deposit amount must be positive.');
  const allowance = await token.allowance(owner, spender);
  if (allowance < 0n) throw new Error('The token approval could not be verified.');
  if (allowance >= deposit) return { allowance, transaction: null };
  // Some tokens require an existing insufficient approval to be reset first.
  const transaction = await token.approve(spender, allowance > 0n ? 0n : deposit);
  return { allowance, transaction };
}
