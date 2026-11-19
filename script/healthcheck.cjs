// Read-only verification. This script never constructs a signer or sends a transaction.
const fs = require('node:fs');
const path = require('node:path');
const { Contract, JsonRpcProvider, FetchRequest, getAddress, ZeroAddress } = require('ethers');
const PROXY = '0x476F44b11F5C942c58f4c8E3d0300E5710743585';
const SYSTEM = '0x8888888888888888888888888888888888888888';
const USDC = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
function rpc(url) { const request = new FetchRequest(url); request.timeout = 15000; return new JsonRpcProvider(request, undefined, {cacheTimeout:-1}); }
async function main() {
  const journal = JSON.parse(fs.readFileSync(process.argv[2] || path.join(__dirname, '../deployments/testnet.json'), 'utf8'));
  if (journal.baseChainId !== 84532 || journal.reactiveChainId !== 5318007) throw new Error('Journal network mismatch');
  const escrowAddress = getAddress(journal.escrow);
  const callbackAddress = getAddress(journal.contracts.SettlioCallback.address);
  const reactiveAddress = getAddress(journal.contracts.SettlioReactive.address);
  const base = rpc(process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org');
  const lasna = rpc(process.env.LASNA_RPC || 'https://lasna-rpc.rnk.dev');
  try {
    const [baseId,lasnaId] = await Promise.all([base.send('eth_chainId', []),lasna.send('eth_chainId', [])]);
    if (BigInt(baseId) !== 84532n || BigInt(lasnaId) !== 5318007n) throw new Error('RPC network mismatch');
    const escrow = new Contract(escrowAddress, ['function callbackReceiver() view returns(address)','function totalLiability() view returns(uint256)','function liability(address) view returns(uint256)','function quoteCount() view returns(uint256)'], base);
    const callback = new Contract(callbackAddress, ['function escrow() view returns(address)','function _CALLBACK_SENDER() view returns(address)','function _SERVICE_PROVIDER() view returns(address)'], base);
    const reactive = new Contract(reactiveAddress, ['function originChain() view returns(uint256)','function originEscrow() view returns(address)','function callbackReceiver() view returns(address)','function _SERVICE_PROVIDER() view returns(address)'], lasna);
    const equal = (a,b) => getAddress(a) === getAddress(b);
    const [escrowReceiver,receiverEscrow,sender,provider,chain,origin,recipient,reactiveProvider] = await Promise.all([
      escrow.callbackReceiver(), callback.escrow(), callback._CALLBACK_SENDER(), callback._SERVICE_PROVIDER(),
      reactive.originChain(), reactive.originEscrow(), reactive.callbackReceiver(), reactive._SERVICE_PROVIDER()
    ]);
    if (!equal(escrowReceiver,callbackAddress) || !equal(receiverEscrow,escrowAddress) || !equal(sender,reactiveAddress) ||
        !equal(provider,PROXY) || chain !== 84532n || !equal(origin,escrowAddress) || !equal(recipient,callbackAddress) ||
        !equal(reactiveProvider,SYSTEM)) throw new Error('Contract wiring mismatch');
    const token = new Contract(USDC,['function balanceOf(address) view returns(uint256)','function decimals() view returns(uint8)','function symbol() view returns(string)'],base);
    const [nativeLiability,mappedNative,nativeBalance,decimals,symbol,tokenLiability,tokenBalance] = await Promise.all([
      escrow.totalLiability(),escrow.liability(ZeroAddress),base.getBalance(escrowAddress),token.decimals(),token.symbol(),escrow.liability(USDC),token.balanceOf(escrowAddress)
    ]);
    if (decimals !== 6n || symbol !== 'USDC') throw new Error('USDC metadata mismatch');
    if (mappedNative !== nativeLiability || nativeBalance < nativeLiability || tokenBalance < tokenLiability) throw new Error('Custody coverage failed');
    async function funding(provider, service, target) {
      const contract = new Contract(service,['function debt(address) view returns(uint256)','function reserves(address) view returns(uint256)'],provider);
      const [debt,reserves,balance] = await Promise.all([contract.debt(target),contract.reserves(target),provider.getBalance(target)]);
      return { address:target, debt, reserves, balance, needsAttention:debt>0n || reserves+balance===0n };
    }
    const [reactiveFunding,callbackFunding] = await Promise.all([funding(lasna,SYSTEM,reactiveAddress),funding(base,PROXY,callbackAddress)]);
    const report = {readOnly:true,wiringVerified:true,quoteCount:await escrow.quoteCount(),custody:{native:{balance:nativeBalance,liability:nativeLiability},USDC:{balance:tokenBalance,liability:tokenLiability}},reactiveFunding,callbackFunding,
      note:'Funding reads are current observations, not a guarantee of future callback delivery. USDT, expiry/refund routing and full recovery remain pending.'};
    console.log(JSON.stringify(report,(_,v)=>typeof v==='bigint'?v.toString():v,2));
    if (reactiveFunding.needsAttention || callbackFunding.needsAttention) process.exitCode=1;
  } finally {base.destroy();lasna.destroy();}
}
main().catch(()=>{console.error('Read-only health check failed. Check the public deployment journal, RPC access, wiring and custody. No transaction was sent.');process.exitCode=1;});
