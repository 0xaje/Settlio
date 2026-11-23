// Read-only quote-linked proof. Identical retry payloads cannot uniquely identify delivery attempt.
const fs=require('node:fs'),path=require('node:path');
const {Interface,AbiCoder,getAddress,keccak256}=require('ethers');
const {rpc,BASE,LASNA,PROXY,SYSTEM}=(()=>{const n=require('./m2-network.cjs'),s=require('./m2-state.cjs');return {...n,BASE:s.BASE,LASNA:s.LASNA};})();
const {CRON,CRON_TOPIC}=require('./cron-event.cjs');
const check=(ok,message)=>{if(!ok){const e=Error(message);e.expiryVerification=true;throw e;}};
const same=(a,b)=>getAddress(a)===getAddress(b);
const coder=AbiCoder.defaultAbiCoder();
const escrowABI=require('../apps/web/src/escrow-abi.json');
const escrowI=new Interface(escrowABI);
const receiverI=new Interface(['function processPolicy(address,uint256)','function escrow() view returns(address)','function _SERVICE_PROVIDER() view returns(address)','function _CALLBACK_SENDER() view returns(address)']);
const triggerI=new Interface(['function trigger(address target,tuple(uint256 chainId,address contractAddress,uint256 topic0,uint256 topic1,uint256 topic2,uint256 topic3,bytes data,uint256 blockNumber,uint256 opCode,uint256 blockHash,uint256 txHash,uint256 logIndex) record)']);
const proxyI=new Interface(['function deliverCallback(uint8 version,bytes config)']);
const reactionI=new Interface(['event PolicyCallbackRequested(uint256 indexed quoteId,uint8 attempt)']);
const systemI=new Interface(['event CallbackRequest(uint256 indexed chainId,address indexed sender,address indexed recipient,uint8 version,bytes configuration)']);
const recordConfig='tuple(uint256 chainId,address recipient,uint64 gasLimit,bytes payload)';
function event(receipt,iface,address,name,id){return receipt.logs.filter(l=>same(l.address,address)&&l.removed!==true&&l.transactionHash?.toLowerCase()===receipt.transactionHash?.toLowerCase()&&l.blockHash?.toLowerCase()===receipt.blockHash?.toLowerCase()&&BigInt(l.blockNumber)===BigInt(receipt.blockNumber)).map(l=>{try{return {log:l,event:iface.parseLog(l)};}catch{return null;}}).find(x=>x?.event?.name===name&&(id===undefined||x.event.args.quoteId===id));}
function validateBundle(b){
 const id=BigInt(b.quoteId),j=b.journal;
 check(id>0n&&j.milestone==='M2'&&j.schemaVersion===1&&j.policyVersion===3&&j.baseChainId===BASE&&j.reactiveChainId===LASNA,'Wrong M2 quote/journal identity.');
 const escrow=getAddress(j.escrow),reactive=getAddress(j.contracts.SettlioReactive.address),receiver=getAddress(j.contracts.SettlioCallback.address);
 check(BigInt(b.networks.base)===BigInt(BASE)&&BigInt(b.networks.lasna)===BigInt(LASNA),'RPC network mismatch.');
 for(const r of [b.creation,b.cron,b.reaction,b.callback])check(r&&BigInt(r.status)===1n&&Array.isArray(r.logs),'Missing or unsuccessful evidence receipt.');
 check(same(b.wiring.escrowReceiver,receiver)&&same(b.wiring.receiverEscrow,escrow)&&same(b.wiring.receiverProxy,PROXY)&&same(b.wiring.receiverSender,reactive),'Callback authentication wiring mismatch.');
 const registered=event(b.creation,escrowI,escrow,'PolicyRegistered',id),created=event(b.creation,escrowI,escrow,'QuoteCreated',id);
 check(registered&&created,'Creation receipt lacks matching quote and policy events.');
 const q=b.quote;
 check(BigInt(q.status)===6n&&same(q.merchant,created.event.args.merchant)&&same(q.customer,created.event.args.customer)&&q.termsHash.toLowerCase()===created.event.args.termsHash.toLowerCase(),'Quote outcome/identity does not match creation.');
 check(BigInt(q.expiresAt)===registered.event.args.expiresAt&&BigInt(q.refundCutoff)===registered.event.args.refundCutoff,'Recorded policy deadlines differ from creation.');
 check(b.originalPolicyProcessed===true&&b.job.registered===true&&b.job.closed===true,'Original policy observation or terminal scheduler acknowledgement missing.');
 const t=b.reactionTx;
 check(t.hash.toLowerCase()===b.reaction.transactionHash.toLowerCase()&&same(t.to,SYSTEM)&&same(t.from,'0x038E06667e42782E571EaB20432b9237F9bD6B82')&&BigInt(t.chainId)===BigInt(LASNA),'Reactive transaction route mismatch.');
 check(t.blockHash.toLowerCase()===b.reaction.blockHash.toLowerCase()&&BigInt(t.blockNumber)===BigInt(b.reaction.blockNumber),'Reactive transaction/receipt block mismatch.');
 const [target,record]=triggerI.decodeFunctionData('trigger',t.input);
 check(same(target,reactive)&&record.chainId===BigInt(LASNA)&&same(record.contractAddress,CRON)&&record.topic0===BigInt(CRON_TOPIC)&&record.opCode===2n&&record.data==='0x'&&record.topic2===0n&&record.topic3===0n,'Reaction was not triggered by the expected indexed CRON.');
 check(record.txHash===BigInt(b.cron.transactionHash)&&record.blockHash===BigInt(b.cron.blockHash)&&record.blockNumber===BigInt(b.cron.blockNumber),'CRON receipt does not match the reactive input.');
 const cronLog=b.cron.logs.find(l=>BigInt(l.logIndex)===record.logIndex);
 check(cronLog&&cronLog.removed!==true&&cronLog.transactionHash.toLowerCase()===b.cron.transactionHash.toLowerCase()&&cronLog.blockHash.toLowerCase()===b.cron.blockHash.toLowerCase()&&same(cronLog.address,CRON)&&cronLog.topics.length===2&&cronLog.topics[0].toLowerCase()===CRON_TOPIC&&BigInt(cronLog.topics[1])===record.topic1&&cronLog.data==='0x','Matching network CRON log missing.');
 const request=event(b.reaction,reactionI,reactive,'PolicyCallbackRequested',id);
 check(request,'Reactive policy request for this quote missing.');
 const sys=event(b.reaction,systemI,SYSTEM,'CallbackRequest');
 check(sys&&sys.event.args.chainId===BigInt(BASE)&&same(sys.event.args.sender,reactive)&&same(sys.event.args.recipient,receiver)&&sys.event.args.version===0n,'System callback request mismatch.');
 const config=coder.decode([recordConfig],sys.event.args.configuration)[0];
 check(config.chainId===BigInt(BASE)&&same(config.recipient,receiver)&&config.payload===receiverI.encodeFunctionData('processPolicy',['0x0000000000000000000000000000000000000000',id]),'Requested callback payload mismatch.');
 const cb=b.callbackTx;
 check(cb.hash.toLowerCase()===b.callback.transactionHash.toLowerCase()&&same(cb.to,PROXY)&&BigInt(cb.chainId)===BigInt(BASE)&&BigInt(cb.value)===0n,'Delivered callback route mismatch.');
 check(cb.blockHash.toLowerCase()===b.callback.blockHash.toLowerCase()&&BigInt(cb.blockNumber)===BigInt(b.callback.blockNumber),'Callback transaction/receipt block mismatch.');
 const [version,encoded]=proxyI.decodeFunctionData('deliverCallback',cb.input);const delivered=coder.decode([recordConfig],encoded)[0];
 check(version===0n&&delivered.chainId===BigInt(BASE)&&same(delivered.recipient,receiver)&&delivered.gasLimit===config.gasLimit&&delivered.payload===receiverI.encodeFunctionData('processPolicy',[reactive,id]),'Authenticated delivery payload differs from the policy request.');
 check(event(b.callback,escrowI,escrow,'QuoteExpired',id)&&event(b.callback,escrowI,escrow,'PolicyChecked',id)?.event.args.status===6n,'Successful expiry and policy outcome events missing.');
 check(BigInt(b.callbackBlock.timestamp)>=BigInt(q.expiresAt)&&b.callbackBlock.hash.toLowerCase()===b.callback.blockHash.toLowerCase(),'Expiry block precedes deadline or does not match receipt.');
 check(b.reactionBlock.hash.toLowerCase()===b.reaction.blockHash.toLowerCase()&&BigInt(b.reactionBlock.timestamp)<=BigInt(b.callbackBlock.timestamp),'Associated reaction occurs after expiry or has a mismatched block.');
 check(BigInt(b.creation.blockNumber)<BigInt(b.callback.blockNumber),'Expiry receipt predates creation.');
 return {verifiedAt:new Date().toISOString(),readOnly:true,scope:'quote-linked authenticated live expiry',quoteId:id.toString(),contracts:{escrow,reactive,receiver},creation:b.creation.transactionHash,cron:b.cron.transactionHash,associatedReaction:b.reaction.transactionHash,callback:b.callback.transactionHash,outcome:'Expired',schedulerClosed:true,associatedRequestAttempt:request.event.args.attempt.toString(),uniqueRetryAttribution:false,browserClosedEvidence:'not recorded',limits:['Identical retry payloads and absent return-report mapping prevent unique attribution of this delivery to the supplied matching reaction.','This verifies a matching real CRON/request and authenticated quote expiry; it does not prove refund, release, exact latency or browser closure.','Current state and wiring are separate point-in-time observations.']};
}
async function collect({base,lasna,journal,quoteId,creationHash,cronHash,reactionHash,callbackHash}){
 const {Contract}=require('ethers');const escrow=new Contract(journal.escrow,escrowABI,base),receiver=new Contract(journal.contracts.SettlioCallback.address,receiverI,base);
 const scheduler=new Contract(journal.contracts.SettlioReactive.address,['function processed(bytes32) view returns(bool)','function jobs(uint256) view returns(uint64,uint64,uint64,uint8,bool,bool,bool,bool,bool,bool,bool)'],lasna);
 const [bi,li,creation,cron,reaction,reactionTx,callback,callbackTx,q,job,er,re,rp,rs]=await Promise.all([base.send('eth_chainId',[]),lasna.send('eth_chainId',[]),base.send('eth_getTransactionReceipt',[creationHash]),lasna.send('eth_getTransactionReceipt',[cronHash]),lasna.send('eth_getTransactionReceipt',[reactionHash]),lasna.send('eth_getTransactionByHash',[reactionHash]),base.send('eth_getTransactionReceipt',[callbackHash]),base.send('eth_getTransactionByHash',[callbackHash]),escrow.getQuote(quoteId),scheduler.jobs(quoteId),escrow.callbackReceiver(),receiver.escrow(),receiver._SERVICE_PROVIDER(),receiver._CALLBACK_SENDER()]);
 check(creation&&callback,'Creation or callback receipt unavailable.');const policy=event(creation,escrowI,journal.escrow,'PolicyRegistered',BigInt(quoteId));check(policy,'Original policy event missing.');
 const fingerprint=keccak256(coder.encode(['uint256','uint256','uint256','uint256'],[BASE,BigInt(creation.blockHash),BigInt(creationHash),BigInt(policy.log.logIndex)]));
 const [processed,block,reactionBlock]=await Promise.all([scheduler.processed(fingerprint),base.send('eth_getBlockByNumber',[callback.blockNumber,false]),lasna.send('eth_getBlockByNumber',[reaction.blockNumber,false])]);
 return JSON.parse(JSON.stringify({quoteId:String(quoteId),journal,networks:{base:bi,lasna:li},creation,cron,reaction,reactionTx,callback,callbackTx,quote:Object.fromEntries(['merchant','customer','termsHash','expiresAt','refundCutoff','status'].map(k=>[k,q[k]])),job:{registered:job[5],closed:job[8]},originalPolicyProcessed:processed,wiring:{escrowReceiver:er,receiverEscrow:re,receiverProxy:rp,receiverSender:rs},callbackBlock:{number:block.number,hash:block.hash,timestamp:block.timestamp},reactionBlock:{number:reactionBlock.number,hash:reactionBlock.hash,timestamp:reactionBlock.timestamp}},(_,v)=>typeof v==='bigint'?v.toString():v));
}
async function main(){
 const [id,creationHash,cronHash,reactionHash,callbackHash,journalPath]=process.argv.slice(2);
 check(/^[1-9]\d*$/.test(id||'')&&[creationHash,cronHash,reactionHash,callbackHash].every(h=>/^0x[0-9a-f]{64}$/i.test(h||'')),'Usage: npm run verify:expiry -- ID CREATION_HASH CRON_HASH REACTION_HASH CALLBACK_HASH [JOURNAL_PATH]');
 const root=path.join(__dirname,'..'),journal=JSON.parse(fs.readFileSync(journalPath||path.join(root,'deployments/testnet-m2.json'),'utf8'));
 const base=rpc(process.env.BASE_SEPOLIA_RPC||'https://sepolia.base.org'),lasna=rpc(process.env.LASNA_RPC||'https://lasna-rpc.rnk.dev');
 try{const bundle=await collect({base,lasna,journal,quoteId:id,creationHash,cronHash,reactionHash,callbackHash});const result=validateBundle(bundle);const file=path.join(root,'deployments/evidence/m2','quote-'+id+'-expiry.json');fs.mkdirSync(path.dirname(file),{recursive:true});
 // Store only public identity from the local journal, not arbitrary user-added fields.
 bundle.journal={milestone:journal.milestone,schemaVersion:journal.schemaVersion,policyVersion:journal.policyVersion,baseChainId:journal.baseChainId,reactiveChainId:journal.reactiveChainId,escrow:journal.escrow,contracts:{SettlioReactive:{address:journal.contracts.SettlioReactive.address},SettlioCallback:{address:journal.contracts.SettlioCallback.address}}};
 fs.writeFileSync(file+'.tmp',JSON.stringify({result,bundle},null,2)+'\n');fs.renameSync(file+'.tmp',file);console.log(JSON.stringify(result,null,2));
 }finally{base.destroy();lasna.destroy();}
}
if(require.main===module)main().catch(e=>{console.error(e.expiryVerification?e.message:'Expiry verification stopped. Inspect public receipts/RPC access; no transaction was sent and no new successful evidence was written.');process.exitCode=1;});
module.exports={validateBundle,collect};
