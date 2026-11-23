import { Contract, ZeroAddress, getAddress, type JsonRpcProvider } from 'ethers';

export const ADMISSION_ESCROW_ABI = ['function admission() view returns(address)', 'function claimRefund(uint256)'];
const admissionABI = [
  'function escrow() view returns(address)', 'function sponsor() view returns(address)',
  'function open() view returns(bool)', 'function active() view returns(uint32)',
  'function reserved() view returns(uint32)', 'function admitted() view returns(uint32)',
  'function maxActive() view returns(uint32)', 'function maxLifetimeAdmissions() view returns(uint32)',
  'function maxHorizon() view returns(uint64)', 'function retryInterval() view returns(uint64)',
  'function maxRetries() view returns(uint32)',
  'function grants(address) view returns(uint32 remaining,uint64 validUntil,bytes32 fundingObservation)',
  'function jobs(uint256) view returns(bool admitted,bool closed,uint32 retries,uint64 retryAfter)'
];
export type AdmissionState = {
  address: string; sponsor: string; blockNumber: number; blockTime: bigint;
  open: boolean; active: bigint; reserved: bigint; admitted: bigint;
  maxActive: bigint; maxLifetime: bigint; maxHorizon: bigint; maxRetries: bigint; retryInterval: bigint;
  credits: bigint; validUntil: bigint;
  jobAdmitted?: boolean; jobClosed?: boolean; retries?: bigint; retryAfter?: bigint;
};
export async function admissionContract(provider: JsonRpcProvider, escrow: Contract, blockTag: number): Promise<Contract> {
  if (BigInt(await provider.send('eth_chainId', [])) !== 84532n || BigInt(await escrow.POLICY_VERSION({ blockTag })) !== 4n) {
    throw new Error('Booking capacity is available only on the verified Base Sepolia version 4 deployment.');
  }
  const address = getAddress(await escrow.admission({ blockTag }));
  if (address === ZeroAddress || await provider.getCode(address, blockTag) === '0x') throw new Error('Booking capacity could not be verified.');
  const gate = new Contract(address, admissionABI, provider);
  const [boundEscrow, sponsor] = await Promise.all([gate.escrow({ blockTag }), gate.sponsor({ blockTag })]);
  if (getAddress(boundEscrow) !== getAddress(await escrow.getAddress()) || getAddress(sponsor) === ZeroAddress) {
    throw new Error('Booking capacity belongs to a different escrow or has no sponsor.');
  }
  return gate;
}
export async function readAdmissionState(provider: JsonRpcProvider, escrow: Contract, merchant: string, id?: bigint, clock: () => bigint = () => BigInt(Math.floor(Date.now() / 1000))): Promise<AdmissionState> {
  const block = await provider.getBlock('latest');
  if (!block) throw new Error('The current Base Sepolia block is unavailable.');
  const now = clock();
  if (now - BigInt(block.timestamp) > 180n || BigInt(block.timestamp) - now > 60n) throw new Error('Base Sepolia readings are stale or your device clock is incorrect. Refresh before continuing.');
  const gate = await admissionContract(provider, escrow, block.number), overrides = { blockTag: block.number };
  const [open, active, reserved, admitted, maxActive, maxLifetime, maxHorizon, maxRetries, retryInterval, grant, sponsor, job] = await Promise.all([
    gate.open(overrides), gate.active(overrides), gate.reserved(overrides), gate.admitted(overrides),
    gate.maxActive(overrides), gate.maxLifetimeAdmissions(overrides), gate.maxHorizon(overrides),
    gate.maxRetries(overrides), gate.retryInterval(overrides), gate.grants(getAddress(merchant), overrides),
    gate.sponsor(overrides), id === undefined ? Promise.resolve(null) : gate.jobs(id, overrides)
  ]);
  if (maxActive <= 0n || maxLifetime < maxActive || maxHorizon <= 0n || maxRetries <= 0n || retryInterval <= 0n ||
      active > admitted || active + reserved > maxActive || admitted + reserved > maxLifetime || grant.remaining > reserved) {
    throw new Error('Booking capacity readings are inconsistent. Refresh before continuing.');
  }
  const checked = await provider.getBlock(block.number);
  if (checked?.hash !== block.hash) throw new Error('The Base Sepolia block changed. Refresh booking capacity.');
  return { address: await gate.getAddress(), sponsor: getAddress(sponsor), blockNumber: block.number, blockTime: BigInt(block.timestamp),
    open: Boolean(open), active: BigInt(active), reserved: BigInt(reserved), admitted: BigInt(admitted),
    maxActive: BigInt(maxActive), maxLifetime: BigInt(maxLifetime), maxHorizon: BigInt(maxHorizon), maxRetries: BigInt(maxRetries), retryInterval: BigInt(retryInterval),
    credits: BigInt(grant.remaining), validUntil: BigInt(grant.validUntil),
    ...(job ? { jobAdmitted: Boolean(job.admitted), jobClosed: Boolean(job.closed), retries: BigInt(job.retries), retryAfter: BigInt(job.retryAfter) } : {}) };
}
export function creationUnavailable(value: AdmissionState | null, now?: bigint): string {
  if (!value) return 'Booking capacity is not verified yet.';
  if (!value.open) return 'New quotes are paused. Existing bookings and refunds remain available.';
  if (value.admitted >= value.maxLifetime) return 'This test deployment has used its quote allowance.';
  if (value.active >= value.maxActive) return 'Booking capacity is full. Wait for an existing booking to complete.';
  if (value.credits === 0n) return 'Your wallet has no sponsored quote allowance. Contact the operator.';
  if ((now ?? value.blockTime) >= value.validUntil) return 'Your sponsored quote allowance has expired. Contact the operator.';
  return '';
}
export function assertCreationAllowed(value: AdmissionState, expiresAt: number, cutoff: number): void {
  const unavailable = creationUnavailable(value);
  if (unavailable) throw new Error(unavailable);
  if (!Number.isSafeInteger(expiresAt) || !Number.isSafeInteger(cutoff) || BigInt(expiresAt) <= value.blockTime ||
      cutoff < expiresAt || BigInt(cutoff) > value.blockTime + value.maxHorizon) {
    throw new Error('Choose a future payment deadline and a refund cutoff within ' + value.maxHorizon.toString() + ' seconds of the current Base Sepolia time.');
  }
}
export function retryUnavailable(value: AdmissionState | null, now?: bigint): string {
  if (!value || value.jobAdmitted !== true || value.jobClosed !== false || value.retries === undefined || value.retryAfter === undefined) return 'Retry allowance is not verified yet.';
  if (value.retries >= value.maxRetries) return 'The retry allowance is used up. Reserved refunds can still be claimed by the customer.';
  if ((now ?? value.blockTime) < value.retryAfter) return 'Wait until the next retry time shown below.';
  return '';
}
