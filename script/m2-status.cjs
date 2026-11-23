// Read only whitelisted public journal fields and RPC state. Never reads a signing key.
const fs=require('node:fs');
const path=require('node:path');
const {getAddress}=require('ethers');
const {paths,BASE,LASNA,check}=require('./m2-state.cjs');
const {rpc}=require('./m2-network.cjs');
const root=path.join(__dirname,'..');
const hash=value=>typeof value==='string'&&/^0x[0-9a-f]{64}$/i.test(value)?value:null;
const address=value=>{try{return getAddress(value);}catch{return null;}};
async function deploymentStatus({directoryRoot=root,base,lasna}) {
 const files=paths(directoryRoot);
 const report={readOnly:true,journalExists:fs.existsSync(files.journal),lockExists:fs.existsSync(files.lock),operations:[],note:'Observation only. No key, file write, broadcast, nonce replacement or lock removal. Missing RPC transactions are unknown, not proof of failure. Preserve the journal before deciding how to resume.'};
 if(!report.journalExists) return report;
 let journal;try {journal=JSON.parse(fs.readFileSync(files.journal,'utf8'));}catch {check(false,'M2 journal cannot be decoded. Preserve it; no action was sent.');}
 check(journal?.milestone==='M2'&&journal.schemaVersion===1&&journal.policyVersion===3&&journal.baseChainId===BASE&&journal.reactiveChainId===LASNA,'M2 journal version/networks invalid. Preserve it for inspection.');
 report.deployer=address(journal.deployer);report.escrow=address(journal.escrow);
 for(const [key,expectedChain] of [['deployReactive',LASNA],['deployCallback',BASE],['configure',LASNA],...(journal.operations?.fundReactive?[['fundReactive',LASNA]]:[])]) {
  const op=journal.operations?.[key];if(!op) {report.operations.push({operation:key,state:'not-recorded'});continue;}
  const item={operation:key,chainId:expectedChain,hash:hash(op.hash),savedState:['prepared','broadcast','confirmed','failed'].includes(op.status)?op.status:'unknown',nonce:Number.isSafeInteger(op.unsigned?.nonce)&&op.unsigned.nonce>=0?op.unsigned.nonce:null};
  report.operations.push(item);
  if(!item.hash||op.unsigned?.chainId!==expectedChain){item.state='invalid-saved-intent';continue;}
  const provider=expectedChain===BASE?base:lasna;
  try {
   if(BigInt(await provider.send('eth_chainId',[]))!==BigInt(expectedChain)){item.state='wrong-rpc-network';continue;}
   const receipt=await provider.send('eth_getTransactionReceipt',[item.hash]);
   if(receipt){
    if(hash(receipt.transactionHash)?.toLowerCase()!==item.hash.toLowerCase()){item.state='receipt-mismatch';continue;}
    const status=BigInt(receipt.status);
    item.state=status===1n?'succeeded':status===0n?'reverted':'unknown-receipt-status';
    item.contractAddress=address(receipt.contractAddress);
    if(/^0x[0-9a-f]+$/i.test(receipt.blockNumber||''))item.block=Number(BigInt(receipt.blockNumber));
   } else {
    const tx=await provider.send('eth_getTransactionByHash',[item.hash]);
    item.state=tx&&hash(tx.hash)?.toLowerCase()===item.hash.toLowerCase()?(tx.blockNumber===null?'pending':'transaction-found-receipt-unavailable'):'not-found-outcome-unknown';
   }
  } catch {item.state='rpc-observation-unavailable';}
 }
 return report;
}
if(require.main===module){
 const base=rpc(process.env.BASE_SEPOLIA_RPC||'https://sepolia.base.org'),lasna=rpc(process.env.LASNA_RPC||'https://lasna-rpc.rnk.dev');
 deploymentStatus({base,lasna}).then(report=>console.log(JSON.stringify(report,null,2))).catch(error=>{console.error(error.m2Expected?error.message:'M2 state could not be inspected. Preserve deployment files. No transaction was sent.');process.exitCode=1;}).finally(()=>{base.destroy();lasna.destroy();});
}
module.exports={deploymentStatus};
