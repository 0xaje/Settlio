// Controlled testnet recovery operations. Importing this module never reads keys or broadcasts.
const fs=require('node:fs'),path=require('node:path');
const {Wallet,Contract,Interface,getAddress}=require('ethers');
const compile=require('./compile.cjs');
const {paths,BASE,LASNA,check,runOperation,saveJournal}=require('./m2-state.cjs');
const {rpc,SYSTEM,PROXY,USDC}=require('./m2-network.cjs');
const {assertCreation}=require('./m2-code.cjs');
const {stage,format}=require('./m2-errors.cjs');
const root=path.join(__dirname,'..');
const publicHash=value=>typeof value==='string'&&/^0x[0-9a-f]{64}$/i.test(value)?value:null;
const same=(a,b)=>getAddress(a)===getAddress(b);
function journalAt(directoryRoot){const files=paths(directoryRoot);check(fs.existsSync(files.journal),'Existing M2 journal required.');const journal=JSON.parse(fs.readFileSync(files.journal,'utf8'));check(journal.milestone==='M2'&&journal.schemaVersion===1&&journal.policyVersion===3&&journal.baseChainId===BASE&&journal.reactiveChainId===LASNA,'M2 recovery journal/network mismatch.');return {files,journal};}
async function inspectRecovery({base,lasna,journal}){
  check(BigInt(await base.send('eth_chainId',[]))===BigInt(BASE)&&BigInt(await lasna.send('eth_chainId',[]))===BigInt(LASNA),'Recovery RPC networks differ from Base Sepolia/Lasna.');
  const entry=journal.contracts.SettlioReactive,artifact=compile('SettlioReactive');
  await assertCreation({entry,operation:journal.operations.deployReactive,artifact,args:[BASE],provider:lasna,deployer:journal.deployer,chainId:LASNA});
  const subscriber=new Contract(entry.address,artifact.abi,lasna);
  const receiver=new Contract(journal.contracts.SettlioCallback.address,compile('SettlioCallback').abi,base);
  const escrow=new Contract(journal.escrow,compile().abi,base);
  const [owner,version,chain,origin,target,system,receiverEscrow,sender,proxy,escrowReceiver,activeJobs,paused,cron,ethLiability,tokenLiability]=await Promise.all([subscriber.owner(),subscriber.POLICY_VERSION(),subscriber.originChain(),subscriber.originEscrow(),subscriber.callbackReceiver(),subscriber._SERVICE_PROVIDER(),receiver.escrow(),receiver._CALLBACK_SENDER(),receiver._SERVICE_PROVIDER(),escrow.callbackReceiver(),subscriber.activeJobCount(),subscriber.schedulerPaused(),subscriber.cronSubscribed(),escrow.totalLiability(),escrow.liability(USDC)]);
  check(same(owner,journal.deployer)&&version===3n&&chain===BigInt(BASE)&&same(origin,journal.escrow)&&same(target,receiver.target)&&same(system,SYSTEM)&&same(receiverEscrow,journal.escrow)&&same(sender,subscriber.target)&&same(proxy,PROXY)&&same(escrowReceiver,receiver.target),'Recovery contract wiring/owner/version mismatch.');
  check(cron===(!paused&&activeJobs>0n),'Recovery scheduler state inconsistent.');
  return {subscriber,readOnly:true,reactive:subscriber.target,owner,activeJobs,paused,cronActive:cron,nativeLiability:ethLiability,usdcLiability:tokenLiability};
}
function canPause(value){return value.activeJobs===0n&&!value.paused&&value.nativeLiability===0n&&value.usdcLiability===0n;}
async function planRecovery({base,lasna,directoryRoot=root}){
  const {journal}=journalAt(directoryRoot),state=await inspectRecovery({base,lasna,journal});
  const {subscriber,...publicState}=state;
  return {...publicState,canBeginControlledTest:canPause(state)&&!journal.operations.pauseScheduler&&!journal.operations.resumeScheduler,savedPause:publicHash(journal.operations.pauseScheduler?.hash),savedResume:publicHash(journal.operations.resumeScheduler?.hash),procedure:'Pause once while idle and liabilities are zero. Then arrange one unpaid quote and participant retry. Resume using the saved restore command. Never pay this test quote.',limits:['Owner pause disables CRON only, not origin observations or every source fee.','This is a controlled recovery test, not general admission protection or proof of a protocol outage.','Creation, pause, retry, resume and resulting expiry require genuine receipts before acceptance.']};
}
async function setRecoveryPause({mode,base,lasna,env=process.env,directoryRoot=root}){
  check(mode==='pause'||mode==='resume','Use pause or resume for controlled recovery.');
  check(env.DEPLOYER_PRIVATE_KEY,'Supply the testnet deployer key locally at the hidden prompt.');
  const signer=await stage('wallet-key',()=>new Wallet(env.DEPLOYER_PRIVATE_KEY,lasna));
  const {files,journal}=journalAt(directoryRoot);
  check(same(signer.address,journal.deployer),'Recovery key differs from recorded deployer.');
  let lock;try{lock=fs.openSync(files.lock,'wx');}catch{check(false,'M2 lock exists. Inspect active processes and saved status; do not delete it blindly.');}
  try{
    const key=mode==='pause'?'pauseScheduler':'resumeScheduler';
    const state=await inspectRecovery({base,lasna,journal});
    if(!journal.operations[key]){
      if(mode==='pause'){
        check(!journal.operations.resumeScheduler,'This one-time recovery cycle has already been restored.');
        check(canPause(state),'Controlled pause requires zero active jobs, no ETH/USDC liabilities and an unpaused scheduler.');
      }else{
        const pause=journal.operations.pauseScheduler;
        check(pause?.status==='confirmed','A confirmed saved controlled pause is required before this restore.');
        const receipt=await lasna.getTransactionReceipt(pause.hash),tx=await lasna.getTransaction(pause.hash);
        const expected=new Interface(compile('SettlioReactive').abi).encodeFunctionData('setSchedulerPaused',[true]);
        check(receipt?.status===1&&tx&&same(tx.from,journal.deployer)&&same(tx.to,state.reactive)&&tx.chainId===BigInt(LASNA)&&tx.value===0n&&tx.data===expected,'Saved pause receipt does not match the owner action.');
        // Restoring service must not be blocked because new jobs/principal appeared while paused.
      }
    }
    const request={to:state.reactive,value:0n,data:state.subscriber.interface.encodeFunctionData('setSchedulerPaused',[mode==='pause'])};
    const receipt=await stage(key,()=>runOperation({journal,key,signer,request,chainId:LASNA,save:()=>saveJournal(files.journal,journal)}));
    const paused=await state.subscriber.schedulerPaused();
    check(paused===(mode==='pause'),'Saved recovery operation succeeded but current pause state differs. Inspect before taking any new action.');
    return {readOnly:false,operation:key,transactionHash:receipt.hash,reactive:state.reactive,paused,note:'One saved owner action per recovery stage. Reruns reuse the same intent/hash; no replacement, deposit, quote, payment or participant retry is created.'};
  }finally{fs.closeSync(lock);fs.unlinkSync(files.lock);}
}
async function main(){const mode=process.argv[2];check(['plan','pause','resume'].includes(mode),'Use recovery plan, pause or resume.');const base=rpc(process.env.BASE_SEPOLIA_RPC||'https://sepolia.base.org'),lasna=rpc(process.env.LASNA_RPC||'https://lasna-rpc.rnk.dev');try{const result=mode==='plan'?await planRecovery({base,lasna}):await setRecoveryPause({mode,base,lasna});console.log(JSON.stringify(result,(_,v)=>typeof v==='bigint'?v.toString():v,2));}finally{base.destroy();lasna.destroy();}}
if(require.main===module)main().catch(e=>{console.error(format(e));process.exitCode=1;});
module.exports={canPause,inspectRecovery,planRecovery,setRecoveryPause};
