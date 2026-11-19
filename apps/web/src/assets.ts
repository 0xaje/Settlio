import { ZeroAddress, getAddress, formatUnits } from 'ethers';

// Only issuer-verified addresses are offered by the interface. USDT is pending verification.
export const assets = [
  { symbol: 'test ETH', address: ZeroAddress, decimals: 18 },
  { symbol: 'test USDC', address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', decimals: 6 }
];
export function knownAsset(address: string) {
  return assets.find(asset => getAddress(asset.address) === getAddress(address));
}
export function displayAmount(value: bigint, address = ZeroAddress): string {
  const asset = knownAsset(address);
  return asset ? formatUnits(value, asset.decimals) + ' ' + asset.symbol : value.toString() + ' base units · ' + address;
}
