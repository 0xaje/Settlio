import { Interface, getAddress } from 'ethers';

const events = new Interface([
  'event QuoteCreated(uint256 indexed quoteId,address indexed merchant,address indexed customer,uint64 expiresAt,bytes32 termsHash)'
]);
type CreationReceipt = {
  status: number | null;
  logs: readonly { address: string; topics: readonly string[]; data: string }[];
};
export function createdQuoteFromReceipt(receipt: CreationReceipt, escrow: string): { id: bigint; termsHash: string } | null {
  if (receipt.status !== 1) return null;
  for (const log of receipt.logs) {
    if (getAddress(log.address) !== getAddress(escrow)) continue;
    const parsed = events.parseLog(log);
    if (parsed?.name === 'QuoteCreated' && parsed.args.quoteId > 0n) {
      return { id: parsed.args.quoteId as bigint, termsHash: parsed.args.termsHash as string };
    }
  }
  return null;
}
