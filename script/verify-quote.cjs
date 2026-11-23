// Verify public receipts only. No signer, private key, broadcast or message delivery.
const fs = require('node:fs');
const path = require('node:path');
const {Contract,Interface,AbiCoder,JsonRpcProvider,FetchRequest,getAddress,keccak256,ZeroAddress} = require('ethers');
const ROOT = path.join(__dirname,'..');
const SYSTEM = '0x8888888888888888888888888888888888888888';
const PROXY = '0x476F44b11F5C942c58f4c8E3d0300E5710743585';
function rpc(url) { const request=new FetchRequest(url);request.timeout=15000;return new JsonRpcProvider(request,undefined,{cacheTimeout:-1}); }
function check(value,message) { if(!value) { const error=new Error(message); error.verificationFailure=true; throw error; } }
const same=(a,b)=>getAddress(a)===getAddress(b);
async function main() {
  const [rawId,originHash,reactiveHash,callbackHash,journalFile]=process.argv.slice(2);
  check(/^[1-9]\d*$/.test(rawId||'') && [originHash,reactiveHash,callbackHash].every(value=>/^0x[0-9a-f]{64}$/i.test(value||'')), 'Usage: npm run verify:quote -- QUOTE_ID ORIGIN_HASH REACTIVE_HASH CALLBACK_HASH [JOURNAL_PATH]');
  const id=BigInt(rawId);
  const journal=JSON.parse(fs.readFileSync(journalFile||path.join(ROOT,'deployments/testnet.json'),'utf8'));
  check(journal.baseChainId===84532 && journal.reactiveChainId===5318007,'Journal network mismatch');
  const escrowAddress=getAddress(journal.escrow), reactiveAddress=getAddress(journal.contracts.SettlioReactive.address), receiverAddress=getAddress(journal.contracts.SettlioCallback.address);
  const base=rpc(process.env.BASE_SEPOLIA_RPC||'https://sepolia.base.org'),lasna=rpc(process.env.LASNA_RPC||'https://lasna-rpc.rnk.dev');
  try {
    const [bi,li]=await Promise.all([base.send('eth_chainId',[]),lasna.send('eth_chainId',[])]);
    check(BigInt(bi)===84532n&&BigInt(li)===5318007n,'RPC network mismatch');
    const [origin,reactive,callback,callbackTx]=await Promise.all([base.getTransactionReceipt(originHash),lasna.getTransactionReceipt(reactiveHash),base.getTransactionReceipt(callbackHash),base.getTransaction(callbackHash)]);
    check([origin,reactive,callback].every(receipt=>receipt?.status===1)&&callbackTx,'A supplied transaction is missing or unsuccessful');
    const escrow=new Contract(escrowAddress,require('../apps/web/src/escrow-abi.json'),base);
    const receiver=new Contract(receiverAddress,['function escrow() view returns(address)','function _CALLBACK_SENDER() view returns(address)','function _SERVICE_PROVIDER() view returns(address)'],base);
    const [quote,configuredReceiver,receiverEscrow,sender,provider]=await Promise.all([escrow.getQuote(id),escrow.callbackReceiver(),receiver.escrow(),receiver._CALLBACK_SENDER(),receiver._SERVICE_PROVIDER()]);
    check(same(configuredReceiver,receiverAddress)&&same(receiverEscrow,escrowAddress)&&same(sender,reactiveAddress)&&same(provider,PROXY),'Callback authentication wiring mismatch');
    function events(receipt,iface,address) { return receipt.logs.filter(log=>same(log.address,address)).map(log=>({log,event:iface.parseLog(log)})); }
    const originEvents=events(origin,escrow.interface,escrowAddress);
    const deposit=originEvents.find(item=>item.event?.name==='DepositReceived'&&item.event.args.quoteId===id);
    const selection=originEvents.find(item=>item.event?.name==='AssetSelected'&&item.event.args.quoteId===id);
    check(deposit&&selection,'Deposit or asset selection event missing');
    check(same(deposit.event.args.customer,quote.customer)&&deposit.event.args.amount===quote.deposit&&same(selection.event.args.asset,quote.asset),'Deposit does not match quote');
    if(quote.asset!==ZeroAddress) {
      const tokenInterface=new Interface(['event Transfer(address indexed from,address indexed to,uint256 value)']);
      const transfer=events(origin,tokenInterface,quote.asset).find(item=>item.event?.name==='Transfer'&&same(item.event.args.from,quote.customer)&&same(item.event.args.to,escrowAddress)&&item.event.args.value===quote.deposit);
      check(transfer,'Exact token transfer into escrow missing');
    }
    const coder=AbiCoder.defaultAbiCoder();
    const originLog=keccak256(coder.encode(['uint256','uint256','uint256','uint256'],[84532,BigInt(origin.blockHash),BigInt(originHash),deposit.log.index]));
    const reactiveInterface=new Interface(['event ConfirmationCallbackRequested(uint256 indexed quoteId,bytes32 indexed originLog)']);
    const requested=events(reactive,reactiveInterface,reactiveAddress).find(item=>item.event?.args.quoteId===id&&item.event.args.originLog===originLog);
    check(requested,'Reactive origin fingerprint mismatch');
    const callbackInterface=new Interface(['function confirmBooking(address,uint256)']);
    let matchedRequest=false;
    for(const log of reactive.logs.filter(log=>same(log.address,SYSTEM))) {
      try {
        const [version,bytes]=coder.decode(['uint256','bytes'],log.data);
        const config=coder.decode(['tuple(uint256 chainId,address recipient,uint64 gasLimit,bytes payload)'],bytes)[0];
        const args=callbackInterface.decodeFunctionData('confirmBooking',config.payload);
        if(version===0n&&config.chainId===84532n&&same(config.recipient,receiverAddress)&&args[0]===ZeroAddress&&args[1]===id) matchedRequest=true;
      } catch { /* Other system events are not callback configurations. */ }
    }
    check(matchedRequest,'Matching system callback request missing');
    const payload=callbackInterface.encodeFunctionData('confirmBooking',[reactiveAddress,id]);
    check(same(callbackTx.to,PROXY)&&callbackTx.data.toLowerCase().includes(receiverAddress.slice(2).toLowerCase())&&callbackTx.data.toLowerCase().includes(payload.slice(2).toLowerCase()),'Delivered callback payload mismatch');
    check(events(callback,escrow.interface,escrowAddress).some(item=>item.event?.name==='BookingConfirmed'&&item.event.args.quoteId===id),'Successful booking event missing');
    const report={verifiedAt:new Date().toISOString(),readOnly:true,quoteId:id,contracts:{escrow:escrowAddress,reactive:reactiveAddress,receiver:receiverAddress},origin:{hash:originHash,block:origin.blockNumber,blockHash:origin.blockHash,logIndex:deposit.log.index,status:origin.status},reactive:{hash:reactiveHash,block:reactive.blockNumber,originLog,status:reactive.status},callback:{hash:callbackHash,block:callback.blockNumber,status:callback.status},quote:{customer:quote.customer,merchant:quote.merchant,asset:quote.asset,deposit:quote.deposit,total:quote.total,currentStatus:quote.status},note:'Receipts prove a historical deposit/confirmation loop. Current quote status may have changed since confirmation. This does not prove refunds, expiry, mainnet readiness or future delivery.'};
    const directory=require('./evidence-path.cjs')(ROOT,journal);
    const evidencePath=path.relative(ROOT,directory);fs.mkdirSync(directory,{recursive:true});
    const output=JSON.stringify(report,(_,value)=>typeof value==='bigint'?value.toString():value,2)+'\n';
    const filename=path.join(directory,'quote-'+id+'.json');fs.writeFileSync(filename+'.tmp',output);fs.renameSync(filename+'.tmp',filename);
    console.log('Verified full deposit-to-Reactive-to-confirmation loop. Public evidence saved to '+evidencePath+'/quote-'+id+'.json.');
  } finally {base.destroy();lasna.destroy();}
}
main().catch(error=>{console.error(error.verificationFailure?error.message:'Receipt verification failed. Check network access, supplied hashes, deployment journal and event linkage. No transaction was sent and no successful evidence file was written.');process.exitCode=1;});
