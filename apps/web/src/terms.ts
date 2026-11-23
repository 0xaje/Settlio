import { getAddress, keccak256, toUtf8Bytes } from 'ethers';

export type PaymentOption = { asset: string; total: string; deposit: string };

export type Terms = {
  version: 1 | 2 | 3 | 4;
  automaticRelease?: boolean;
  options?: PaymentOption[];
  service: string;
  description: string;
  merchant: string;
  customer: string;
  total: string;
  deposit: string;
  expiresAt: number;
  refundCutoff: number;
};

export type Quote = {
  id: bigint;
  merchant: string;
  customer: string;
  total: bigint;
  deposit: bigint;
  expiresAt: bigint;
  refundCutoff: bigint;
  termsHash: string;
  status: number;
  asset?: string;
  selectedOption?: number;
  options?: PaymentOption[];
  policyVersion?: number;
  automaticRelease?: boolean;
};

export function serializeTerms(terms: Terms): string {
  return JSON.stringify({
    version: terms.version, ...(terms.version >= 2 ? { options: terms.options?.map(option => ({ asset: getAddress(option.asset), total: option.total, deposit: option.deposit })) } : {}), ...(terms.version >= 3 ? { automaticRelease: terms.automaticRelease } : {}), service: terms.service, description: terms.description,
    merchant: getAddress(terms.merchant), customer: getAddress(terms.customer),
    total: terms.total, deposit: terms.deposit,
    expiresAt: terms.expiresAt, refundCutoff: terms.refundCutoff
  });
}

export function termsHash(terms: Terms): string {
  return keccak256(toUtf8Bytes(serializeTerms(terms)));
}

export function encodeTerms(terms: Terms): string {
  const bytes = new TextEncoder().encode(serializeTerms(terms));
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

export function decodeTerms(encoded: string): Terms {
  if (!encoded || encoded.length > 16000) throw new Error('This quote link has missing or oversized terms.');
  const bytes = Uint8Array.from(atob(encoded.replaceAll('-', '+').replaceAll('_', '/')), char => char.charCodeAt(0));
  const value: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  if (typeof value !== 'object' || value === null) throw new Error('Invalid quote terms.');
  const terms = value as Terms;
  if ((terms.version !== 1 && terms.version !== 2 && terms.version !== 3 && terms.version !== 4) || typeof terms.service !== 'string' || !terms.service.trim() ||
      terms.service.length > 120 || typeof terms.description !== 'string' || terms.description.length > 2000 ||
      typeof terms.total !== 'string' || !/^\d+$/.test(terms.total) ||
      typeof terms.deposit !== 'string' || !/^\d+$/.test(terms.deposit) ||
      !Number.isSafeInteger(terms.expiresAt) || !Number.isSafeInteger(terms.refundCutoff)) {
    throw new Error('Invalid quote terms.');
  }
  if (terms.version >= 3 && typeof terms.automaticRelease !== 'boolean') throw new Error('Invalid automatic release policy.');
  if (terms.version >= 2) {
    if (!Array.isArray(terms.options) || terms.options.length < 1 || terms.options.length > 3) throw new Error('Invalid payment options.');
    const assets = new Set();
    for (const option of terms.options) {
      const asset = getAddress(option.asset);
      if (assets.has(asset) || typeof option.total !== 'string' || !/^\d+$/.test(option.total) ||
          typeof option.deposit !== 'string' || !/^\d+$/.test(option.deposit) || BigInt(option.deposit) <= 0n ||
          BigInt(option.total) < BigInt(option.deposit)) throw new Error('Invalid payment option.');
      assets.add(asset);
    }
    if (terms.options[0].total !== terms.total || terms.options[0].deposit !== terms.deposit) throw new Error('Invalid primary payment option.');
  }
  serializeTerms(terms);
  return terms;
}

export function matchesQuote(terms: Terms, quote: Quote): boolean {
  try {
    return (terms.version >= 3 ? quote.policyVersion === terms.version && terms.automaticRelease === quote.automaticRelease : quote.policyVersion !== 4 && quote.automaticRelease !== true) &&
      termsHash(terms).toLowerCase() === quote.termsHash.toLowerCase() &&
      getAddress(terms.merchant) === getAddress(quote.merchant) &&
      getAddress(terms.customer) === getAddress(quote.customer) &&
      (terms.version === 1 ? (!quote.options || (quote.options.length === 1 && quote.options[0].asset === '0x0000000000000000000000000000000000000000')) && BigInt(terms.total) === quote.total && BigInt(terms.deposit) === quote.deposit : matchesOptions(terms, quote)) &&
      BigInt(terms.expiresAt) === quote.expiresAt && BigInt(terms.refundCutoff) === quote.refundCutoff;
  } catch { return false; }
}

function matchesOptions(terms: Terms, quote: Quote): boolean {
  const choices = terms.options;
  if (!choices || !quote.options || choices.length !== quote.options.length) return false;
  if (!choices.every((choice, index) => {
    const recorded = quote.options![index];
    return getAddress(choice.asset) === getAddress(recorded.asset) && BigInt(choice.total) === BigInt(recorded.total) &&
      BigInt(choice.deposit) === BigInt(recorded.deposit);
  })) return false;
  const selected = choices[quote.status === 1 ? 0 : quote.selectedOption ?? -1];
  return !!selected && getAddress(selected.asset) === getAddress(quote.asset!) &&
    BigInt(selected.total) === quote.total && BigInt(selected.deposit) === quote.deposit;
}
