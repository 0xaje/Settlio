// Explicit M2 commands; importing this module never reads keys or broadcasts.
const fs=require('node:fs');
const path=require('node:path');
const {Wallet,Contract,ContractFactory,getAddress,getCreateAddress,parseEther,keccak256,ZeroAddress}=require('ethers');
const compile=require('./compile.cjs');
const {BASE,LASNA,check,paths,newJournal,assertJournal,saveJournal,runOperation}=require('./m2-state.cjs');
const {rpc,preflight,inspect,PROXY,USDC}=require('./m2-network.cjs');
const {assertCreation}=require('./m2-code.cjs');
const root=path.join(__dirname,'..');
const json=value=>JSON.stringify(value,(_,v)=>typeof v==='bigint'?v.toString():v,2);
function inputs(env) {
 const funding={reactive:parseEther(env.REACTIVE_FUND||'0.1').toString(),callback:parseEther(env.CALLBACK_FUND||'0.001').toString()};
 check(BigInt(funding.reactive)>0n&&BigInt(funding.callback)>0n,'Both M2 automation fee accounts require positive constructor funding.');
 const artifacts=Object.fromEntries(['SettlioReactive','SettlioCallback'].map(name=>[name,compile(name)]));
 const sourceHashes=Object.fromEntries(Object.entries(artifacts).map(([name,a])=>[name,keccak256('0x'+a.evm.bytecode.object)]));
 return {funding,artifacts,sourceHashes};
}
async function creation(artifact,args,value) {return new ContractFactory(artifact.abi,artifact.evm.bytecode.object).getDeployTransaction(...args,{value:BigInt(value),type:0});}
async function plan({deployer,base,lasna,env=process.env}) {
 deployer=getAddress(deployer);check(deployer!==ZeroAddress,'M2 deployer cannot be the zero address.');
 const network=await preflight(base,lasna),{funding,artifacts,sourceHashes}=inputs(env);
 const reactiveAddress=getCreateAddress({from:deployer,nonce:await lasna.getTransactionCount(deployer,'pending')});
 const requests=[await creation(artifacts.SettlioReactive,[BASE],funding.reactive),await creation(artifacts.SettlioCallback,[PROXY,reactiveAddress],funding.callback)];
 const estimates=await Promise.all(requests.map((request,i)=>(i?base:lasna).estimateGas({...request,from:deployer})));
 const [baseFee,lasnaFee,baseBalance,lasnaBalance]=await Promise.all([base.getFeeData(),lasna.getFeeData(),base.getBalance(deployer),lasna.getBalance(deployer)]);
 check(baseFee.gasPrice!==null&&lasnaFee.gasPrice!==null,'M2 fee estimates unavailable.');
 return {readOnly:true,deployer,network,sourceHashes,funding,creationGas:{reactive:estimates[0],callback:estimates[1]},walletBalances:{base:baseBalance,lasna:lasnaBalance},estimatedCreationCost:{base:BigInt(funding.callback)+estimates[1]*120n/100n*baseFee.gasPrice,lasna:BigInt(funding.reactive)+estimates[0]*120n/100n*lasnaFee.gasPrice},note:'Creation estimates only; configuration is estimated after deployment. Future subscription, CRON and callback fees are additional. No transaction sent.'};
}
async function deploy({base,lasna,env=process.env,directoryRoot=root}) {
 check(env.DEPLOYER_PRIVATE_KEY,'Set DEPLOYER_PRIVATE_KEY securely in your local shell. Never paste it into chat.');
 const baseSigner=new Wallet(env.DEPLOYER_PRIVATE_KEY,base),lasnaSigner=new Wallet(env.DEPLOYER_PRIVATE_KEY,lasna);
 const locations=paths(directoryRoot);fs.mkdirSync(locations.directory,{recursive:true});
 let lock;
 try {lock=fs.openSync(locations.lock,'wx');} catch {check(false,'M2 deployment lock exists. Confirm no process is running before inspecting or removing it.');}
 try {
  await preflight(base,lasna);
  const {funding,artifacts,sourceHashes}=inputs(env);
  const journal=fs.existsSync(locations.journal)?JSON.parse(fs.readFileSync(locations.journal,'utf8')):newJournal(baseSigner.address,sourceHashes,funding);
  assertJournal(journal,baseSigner.address,sourceHashes,funding);
  const save=()=>saveJournal(locations.journal,journal);save();
  async function deployOne(name,key,signer,args,value,chainId) {
   const artifact=artifacts[name],request=await creation(artifact,args,value);
   const receipt=await runOperation({journal,key,signer,request,chainId,save});
   check(receipt.contractAddress,'M2 creation receipt has no contract address.');
   const entry={address:getAddress(receipt.contractAddress),transactionHash:receipt.hash,chainId,creationBytecodeHash:sourceHashes[name]};
   if(journal.contracts[name]) check(json(journal.contracts[name])===json(entry),'M2 recorded deployment differs from the saved creation.');
   await assertCreation({entry,operation:journal.operations[key],artifact,args,provider:signer.provider,deployer:journal.deployer,chainId});
   journal.contracts[name]=entry;save();
   return new Contract(entry.address,artifact.abi,signer);
  }
  const reactive=await deployOne('SettlioReactive','deployReactive',lasnaSigner,[BASE],funding.reactive,LASNA);
  const callback=await deployOne('SettlioCallback','deployCallback',baseSigner,[PROXY,reactive.target],funding.callback,BASE);
  const escrow=getAddress(await callback.escrow());
  check(!journal.escrow || getAddress(journal.escrow)===escrow,'M2 escrow address differs from recorded receiver.');
  journal.escrow=escrow;save();
  const request=await reactive.configure.populateTransaction(escrow,callback.target);
  const receipt=await runOperation({journal,key:'configure',signer:lasnaSigner,request,chainId:LASNA,save});
  journal.configurationTransaction=receipt.hash;
  journal.paymentAssets={ETH:ZeroAddress,USDC};save();
  // A missing/lagging filter index blocks verification, without discarding successful deployment intents.
  const observation=await inspect(journal,base,lasna);
  journal.wiringVerified=true;journal.subscriptionsVerified=true;journal.verifiedAt=new Date().toISOString();save();
  return {journal:locations.journal,observation,note:'M2 deployment checks passed. Unattended policy execution is still unverified. M1 configuration has not been changed.'};
 } finally {fs.closeSync(lock);fs.unlinkSync(locations.lock);}
}
async function main() {
 const mode=process.argv[2];
 check(['plan','deploy','verify','preflight'].includes(mode),'Use plan, deploy, verify or preflight for M2.');
 const base=rpc(process.env.BASE_SEPOLIA_RPC||'https://sepolia.base.org'),lasna=rpc(process.env.LASNA_RPC||'https://lasna-rpc.rnk.dev');
 try {
  let result;
  if(mode==='preflight') result=await preflight(base,lasna);
  if(mode==='plan') {check(process.argv[3],'Supply the public deployer address after --. No private key is needed.');result=await plan({deployer:process.argv[3],base,lasna});}
  if(mode==='deploy') result=await deploy({base,lasna});
  if(mode==='verify') {const file=paths(root).journal;check(fs.existsSync(file),'M2 journal not found. No M2 deployment is claimed.');result=await inspect(JSON.parse(fs.readFileSync(file,'utf8')),base,lasna);}
  console.log(json(result));
 } finally {base.destroy();lasna.destroy();}
}
if(require.main===module) main().catch(error=>{console.error(error.m2Expected?error.message:'M2 command stopped. Check local configuration, RPC access, funds and the preserved M2 journal. No automatic replacement is authorised.');process.exitCode=1;});
module.exports={inputs,creation,plan,deploy};
