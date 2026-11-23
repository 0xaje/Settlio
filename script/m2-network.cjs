// Read-only network checks. No signer or transaction broadcast.
const {Contract,JsonRpcProvider,FetchRequest,getAddress,ZeroAddress,toQuantity}=require('ethers');
const compile=require('./compile.cjs');
const {BASE,LASNA,check,assertFilters}=require('./m2-state.cjs');
const {assertRuntime,assertCreation}=require('./m2-code.cjs');
const PROXY='0x476F44b11F5C942c58f4c8E3d0300E5710743585';
const SYSTEM='0x8888888888888888888888888888888888888888';
const USDC='0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const {CRON,CRON_TOPIC,isCron100}=require('./cron-event.cjs');
function rpc(url) {const request=new FetchRequest(url);request.timeout=15000;return new JsonRpcProvider(request,undefined,{cacheTimeout:-1});}
async function preflight(base,lasna) {
  check(BigInt(await base.send('eth_chainId',[]))===BigInt(BASE)&&BigInt(await lasna.send('eth_chainId',[]))===BigInt(LASNA),'M2 supports Base Sepolia and Lasna only.');
  const codes=await Promise.all([base.getCode(PROXY),base.getCode(USDC),lasna.getCode(SYSTEM),lasna.getCode(CRON)]);
  check(codes.every(code=>code!=='0x'),'M2 protocol, CRON emitter or USDC bytecode missing.');
  const token=new Contract(USDC,['function decimals() view returns(uint8)','function symbol() view returns(string)'],base);
  check(await token.decimals()===6n&&await token.symbol()==='USDC','M2 USDC metadata mismatch.');
  const last=await lasna.getBlockNumber();
  const logs=await lasna.send('eth_getLogs',[{address:CRON,topics:[CRON_TOPIC],fromBlock:toQuantity(Math.max(0,last-2000)),toBlock:toQuantity(last)}]);
  const observed=logs.filter(isCron100);
  check(observed.length>0,'No recent network CRON100 event with the indexed-number layout observed. Scheduling preflight is not proven; do not deploy.');
  const latest=observed[observed.length-1];
  return {readOnly:true,baseChainId:BASE,reactiveChainId:LASNA,usdc:USDC,cronObserved:{transactionHash:latest.transactionHash,block:Number(BigInt(latest.blockNumber)),indexedNumber:BigInt(latest.topics[1]).toString(),layout:'indexed-number',logsInWindow:observed.length}};
}
async function inspect(journal,base,lasna) {
  check(journal?.milestone==='M2'&&journal.policyVersion===3&&journal.baseChainId===BASE&&journal.reactiveChainId===LASNA,'M2 deployment journal missing or incompatible.');
  const escrowAddress=getAddress(journal.escrow),reactiveAddress=getAddress(journal.contracts.SettlioReactive.address),receiverAddress=getAddress(journal.contracts.SettlioCallback.address);
  const same=(a,b)=>getAddress(a)===getAddress(b);
  check(BigInt(await base.send('eth_chainId',[]))===BigInt(BASE)&&BigInt(await lasna.send('eth_chainId',[]))===BigInt(LASNA),'M2 health network mismatch.');
  const escrow=new Contract(escrowAddress,compile().abi,base),receiver=new Contract(receiverAddress,compile('SettlioCallback').abi,base),reactive=new Contract(reactiveAddress,compile('SettlioReactive').abi,lasna);
  const values=await Promise.all([escrow.POLICY_VERSION(),reactive.POLICY_VERSION(),escrow.callbackReceiver(),receiver.escrow(),receiver._CALLBACK_SENDER(),receiver._SERVICE_PROVIDER(),reactive.originChain(),reactive.originEscrow(),reactive.callbackReceiver(),reactive._SERVICE_PROVIDER(),reactive.owner()]);
  check(values[0]===3n&&values[1]===3n&&same(values[2],receiverAddress)&&same(values[3],escrowAddress)&&same(values[4],reactiveAddress)&&same(values[5],PROXY)&&values[6]===BigInt(BASE)&&same(values[7],escrowAddress)&&same(values[8],receiverAddress)&&same(values[9],SYSTEM)&&same(values[10],journal.deployer),'M2 immutable wiring/version mismatch.');
  for(const [name,provider,args,key,chainId] of [
    ['SettlioReactive',lasna,[BASE],'deployReactive',LASNA],
    ['SettlioCallback',base,[PROXY,reactiveAddress],'deployCallback',BASE]
  ]) await assertCreation({entry:journal.contracts[name],operation:journal.operations?.[key],artifact:compile(name),args,provider,deployer:journal.deployer,chainId});
  assertRuntime(await base.getCode(escrowAddress),compile());
  const config=journal.operations?.configure;
  const configTx=config && await lasna.getTransaction(config.hash);
  const configReceipt=config && await lasna.getTransactionReceipt(config.hash);
  check(config?.status==='confirmed' && configReceipt?.status===1 && configTx && same(configTx.from,journal.deployer) && same(configTx.to,reactiveAddress) && configTx.data===reactive.interface.encodeFunctionData('configure',[escrowAddress,receiverAddress]) && configTx.value===0n && configTx.chainId===BigInt(LASNA),'M2 configuration receipt/transaction mismatch.');
  const token=new Contract(USDC,['function balanceOf(address) view returns(uint256)'],base);
  const [nativeLiability,mappedNative,nativeBalance,tokenLiability,tokenBalance,count,activeJobs,cronActive,paused]=await Promise.all([escrow.totalLiability(),escrow.liability(ZeroAddress),base.getBalance(escrowAddress),escrow.liability(USDC),token.balanceOf(escrowAddress),escrow.quoteCount(),reactive.activeJobCount(),reactive.cronSubscribed(),reactive.schedulerPaused()]);
  check(nativeLiability===mappedNative&&nativeBalance>=nativeLiability&&tokenBalance>=tokenLiability,'M2 custody coverage failed.');
  check(cronActive===(!paused&&activeJobs>0n),'M2 CRON/runnable state mismatch.');
  const topicNames=['DEPOSIT_TOPIC','RETRY_TOPIC','POLICY_TOPIC','POLICY_RETRY_TOPIC','CANCEL_TOPIC','CONFIRMED_TOPIC','CHECKED_TOPIC','REFUNDED_TOPIC','EXPIRED_TOPIC','RELEASED_TOPIC'];
  const topics=await Promise.all(topicNames.map(async name=>'0x'+(await reactive[name]()).toString(16).padStart(64,'0')));
  const subscriptions=assertFilters(await lasna.send('rnk_getFilters',[]),{reactive:reactiveAddress,escrow:escrowAddress,topics,cronSource:CRON,cronTopic:CRON_TOPIC,cronExpected:cronActive});
  async function funding(provider,service,address) {const c=new Contract(service,['function debt(address) view returns(uint256)','function reserves(address) view returns(uint256)'],provider);const [debt,reserves,balance]=await Promise.all([c.debt(address),c.reserves(address),provider.getBalance(address)]);return {address,debt,reserves,balance,needsAttention:debt>0n||reserves+balance===0n};}
  const [reactiveFunding,callbackFunding]=await Promise.all([funding(lasna,SYSTEM,reactiveAddress),funding(base,PROXY,receiverAddress)]);
  return {readOnly:true,policyVersion:3,wiringVerified:true,subscriptions,quoteCount:count,activeJobs,cronActive,paused,custody:{ETH:{balance:nativeBalance,liability:nativeLiability},USDC:{balance:tokenBalance,liability:tokenLiability}},reactiveFunding,callbackFunding,note:'Current observations only. Deployment and subscriptions do not prove unattended policy execution or future funding.'};
}
module.exports={rpc,preflight,inspect,PROXY,SYSTEM,USDC,CRON,CRON_TOPIC};
