import { getAddress, keccak256, toUtf8Bytes } from 'ethers';

export type Terms = {
  version: 1;
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
};

export function serializeTerms(terms: Terms): string {
  return JSON.stringify({
    version: 1, service: terms.service, description: terms.description,
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
  if (terms.version !== 1 || typeof terms.service !== 'string' || !terms.service.trim() ||
      terms.service.length > 120 || typeof terms.description !== 'string' || terms.description.length > 2000 ||
      typeof terms.total !== 'string' || !/^\d+$/.test(terms.total) ||
      typeof terms.deposit !== 'string' || !/^\d+$/.test(terms.deposit) ||
      !Number.isSafeInteger(terms.expiresAt) || !Number.isSafeInteger(terms.refundCutoff)) {
    throw new Error('Invalid quote terms.');
  }
  serializeTerms(terms);
  return terms;
}

export function matchesQuote(terms: Terms, quote: Quote): boolean {
  try {
    return termsHash(terms).toLowerCase() === quote.termsHash.toLowerCase() &&
      getAddress(terms.merchant) === getAddress(quote.merchant) &&
      getAddress(terms.customer) === getAddress(quote.customer) &&
      BigInt(terms.total) === quote.total && BigInt(terms.deposit) === quote.deposit &&
      BigInt(terms.expiresAt) === quote.expiresAt && BigInt(terms.refundCutoff) === quote.refundCutoff;
  } catch { return false; }
}
