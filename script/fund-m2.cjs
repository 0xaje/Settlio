// Separate fixed journalled deposits: 1 test REACT recovery; 14 test REACT release-test buffer.
const fs=require('node:fs'),path=require('node:path');
const {Wallet,Contract,Interface,getAddress,parseEther}=require('ethers');
const compile=require('./compile.cjs');
const {paths,check,LASNA,BASE,runOperation,saveJournal}=require('./m2-state.cjs');
const {rpc,SYSTEM}=require('./m2-network.cjs');
const {assertCreation}=require('./m2-code.cjs');
const {stage,format}=require('./m2-errors.cjs');
async function fund({provider,env=process.env,directoryRoot=path.join(__dirname,'..'),purpose='recovery'}) {
 check(['recovery','release-test'].includes(purpose),'Unknown M2 funding purpose.');
 const key=purpose==='recovery'?'fundReactive':'fundReactiveRelease';
 const amount=purpose==='recovery'?'1':'14';
 const files=paths(directoryRoot);
 check(fs.existsSync(files.journal),'Existing M2 journal required; no reserve payment sent.');
 check(env.DEPLOYER_PRIVATE_KEY,'Set the testnet deployer key locally at the hidden prompt.');
 const signer=await stage('wallet-key',async()=>new Wallet(env.DEPLOYER_PRIVATE_KEY,provider));
 let lock;try{lock=fs.openSync(files.lock,'wx');}catch{check(false,'M2 lock exists. Confirm no process is active; do not delete it blindly.');}
 try {
  const j=JSON.parse(fs.readFileSync(files.journal,'utf8'));
  check(j.milestone==='M2'&&j.schemaVersion===1&&j.policyVersion===3&&j.baseChainId===BASE&&j.reactiveChainId===LASNA,'M2 journal schema/network mismatch.');
  check(getAddress(j.deployer)===signer.address,'Key does not match recorded M2 deployer.');
  check(BigInt(await provider.send('eth_chainId',[]))===BigInt(LASNA),'Reserve funding requires Lasna 5318007.');
  const entry=j.contracts.SettlioReactive,artifact=compile('SettlioReactive');
  await assertCreation({entry,operation:j.operations.deployReactive,artifact,args:[BASE],provider,deployer:j.deployer,chainId:LASNA});
  const reactive=new Contract(entry.address,artifact.abi,provider);
  const [owner,version,chain,system,escrow]=await Promise.all([reactive.owner(),reactive.POLICY_VERSION(),reactive.originChain(),reactive._SERVICE_PROVIDER(),reactive.originEscrow()]);
  check(getAddress(owner)===signer.address&&version===3n&&chain===BigInt(BASE)&&getAddress(system)===getAddress(SYSTEM)&&getAddress(escrow)===getAddress(j.escrow),'M2 reserve target wiring mismatch.');
  const iface=new Interface(['function depositTo(address) payable']);
  const request={to:SYSTEM,data:iface.encodeFunctionData('depositTo',[entry.address]),value:parseEther(amount)};
  const save=()=>saveJournal(files.journal,j);
  const receipt=await stage(key,()=>runOperation({journal:j,key,signer,request,chainId:LASNA,save}));
  const service=new Contract(SYSTEM,['function debt(address) view returns(uint256)','function reserves(address) view returns(uint256)'],provider);
  const [debt,reserves,balance]=await Promise.all([service.debt(entry.address),service.reserves(entry.address),provider.getBalance(entry.address)]);
  return {readOnly:false,transactionHash:receipt.hash,target:entry.address,systemContract:SYSTEM,operation:key,depositWei:request.value,debt,reserves,balance,note:'The saved operation for this purpose is reused on rerun; it does not create a second deposit. Recovery and release-test intents are separate. Debt/reserves are point-in-time observations. A funding receipt is not policy-execution proof.'};
 } finally {fs.closeSync(lock);fs.unlinkSync(files.lock);}
}
if(require.main===module){const provider=rpc(process.env.LASNA_RPC||'https://lasna-rpc.rnk.dev');fund({provider,purpose:process.argv[2]||'recovery'}).then(r=>console.log(JSON.stringify(r,(_,v)=>typeof v==='bigint'?v.toString():v,2))).catch(e=>{console.error(format(e));process.exitCode=1;}).finally(()=>provider.destroy());}
module.exports={fund};
