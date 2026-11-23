// Public deployment intents only. Never persist keys or signed transactions.
const fs = require('node:fs');
const path = require('node:path');
const { getAddress, keccak256 } = require('ethers');
const BASE = 84532, LASNA = 5318007;
function check(value, message) { if (!value) { const e = new Error(message); e.m2Expected = true; throw e; } }
function paths(root) { const directory = path.join(root, 'deployments'); return { directory, journal: path.join(directory, 'testnet-m2.json'), lock: path.join(directory, '.deploy-m2.lock') }; }
function newJournal(deployer, sourceHashes, funding) {
  return { milestone:'M2', schemaVersion:1, policyVersion:3, baseChainId:BASE, reactiveChainId:LASNA,
    deployer:getAddress(deployer), sourceHashes, funding, contracts:{}, operations:{} };
}
function assertJournal(journal, deployer, sourceHashes, funding) {
  check(journal?.milestone==='M2' && journal.schemaVersion===1 && journal.policyVersion===3 &&
    journal.baseChainId===BASE && journal.reactiveChainId===LASNA,'M2 journal schema or networks mismatch. Keep the M1 journal unchanged.');
  check(getAddress(journal.deployer)===getAddress(deployer),'M2 journal belongs to a different deployer.');
  check(journal.contracts && journal.operations,'M2 journal is incomplete.');
  for (const name of ['SettlioReactive','SettlioCallback']) check(journal.sourceHashes?.[name]===sourceHashes[name],'M2 source changed since journal creation. Review existing intents before any new deployment.');
  check(journal.funding?.reactive===funding.reactive && journal.funding?.callback===funding.callback,'M2 constructor funding changed. Review the existing journal; do not delete it.');
}
function saveJournal(filename, journal) {
  check(path.basename(filename)==='testnet-m2.json' && journal.milestone==='M2','Refusing to overwrite a non-M2 deployment journal.');
  function inspect(value) { if (!value || typeof value!=='object') return; for (const [key,child] of Object.entries(value)) { check(!/private.?key|mnemonic|signedTransaction|rawTransaction|rpcUrl/i.test(key),'Refusing to persist confidential deployment configuration.'); inspect(child); } }
  inspect(journal);
  fs.mkdirSync(path.dirname(filename),{recursive:true});
  fs.writeFileSync(filename+'.tmp',JSON.stringify(journal,null,2)+'\n',{mode:0o600});
  fs.renameSync(filename+'.tmp',filename);
}
function hydrate(unsigned) { return { type:0, chainId:BigInt(unsigned.chainId), nonce:unsigned.nonce,
  to:unsigned.to, data:unsigned.data, value:BigInt(unsigned.value), gasLimit:BigInt(unsigned.gasLimit), gasPrice:BigInt(unsigned.gasPrice) }; }
async function runOperation({journal,key,signer,request,chainId,save,timeout=120000}) {
  check(['deployReactive','deployCallback','configure','fundReactive','fundReactiveRelease'].includes(key),'Unknown M2 operation.');
  check(chainId===BASE || chainId===LASNA,'Unsupported M2 operation network.');
  check(!['fundReactive','fundReactiveRelease'].includes(key) || chainId===LASNA,'M2 reserve funding is Lasna-only.');
  const rpc=signer.provider, from=getAddress(await signer.getAddress());
  check(from===getAddress(journal.deployer),'M2 signer differs from journal deployer.');
  check(Number(BigInt(await rpc.send('eth_chainId',[])))===chainId,'M2 operation network mismatch.');
  const to=request.to ? getAddress(request.to) : null;
  const data=request.data||'0x', value=BigInt(request.value||0);
  let operation=journal.operations[key];
  if (!operation) {
    const nonce=await rpc.getTransactionCount(from,'pending');
    const fee=await rpc.getFeeData();check(fee.gasPrice!==null,'M2 gas price unavailable.');
    const gasLimit=request.gasLimit ? BigInt(request.gasLimit) : (await rpc.estimateGas({from,to,data,value}))*120n/100n;
    const unsigned={type:0,chainId,nonce,to,data,value:value.toString(),gasLimit:gasLimit.toString(),gasPrice:fee.gasPrice.toString()};
    const hash=keccak256(await signer.signTransaction(hydrate(unsigned)));
    operation={hash,unsigned,status:'prepared'};
    journal.operations[key]=operation;
    save(); // Must succeed BEFORE the first broadcast.
  }
  check(operation.unsigned?.chainId===chainId && operation.unsigned?.to===to && operation.unsigned?.data===data && BigInt(operation.unsigned.value)===value,'M2 saved intent does not match this operation.');
  check(/^0x[0-9a-f]{64}$/i.test(operation.hash),'M2 saved transaction hash is invalid.');
  const raw=await signer.signTransaction(hydrate(operation.unsigned));
  check(keccak256(raw)===operation.hash,'M2 saved intent hash changed. Stop and inspect the journal.');
  let receipt=await rpc.getTransactionReceipt(operation.hash);
  if (!receipt && !await rpc.getTransaction(operation.hash)) {
    const [latest,pending,balance]=await Promise.all([rpc.getTransactionCount(from,'latest'),rpc.getTransactionCount(from,'pending'),rpc.getBalance(from)]);
    check(latest===operation.unsigned.nonce && pending===operation.unsigned.nonce,'M2 nonce is occupied or changed. Inspect the wallet and saved hash; no replacement was sent.');
    check(balance>=BigInt(operation.unsigned.value)+BigInt(operation.unsigned.gasLimit)*BigInt(operation.unsigned.gasPrice),'M2 signer lacks funds for the saved transaction.');
    try { await rpc.broadcastTransaction(raw); }
    catch { check(await rpc.getTransaction(operation.hash) || await rpc.getTransactionReceipt(operation.hash),'M2 broadcast was not confirmed by RPC. The saved intent is retained; inspect before retrying.'); }
    operation.status='broadcast';save();
  }
  if (!receipt) receipt=await rpc.waitForTransaction(operation.hash,1,timeout);
  check(receipt!==null,'M2 transaction still has no receipt. The saved intent is retained.');
  if (receipt.status!==1) {operation.status='failed';operation.block=receipt.blockNumber;save();check(false,'M2 transaction failed on-chain. Inspect the saved intent; no automatic replacement will be sent.');}
  const tx=await rpc.getTransaction(operation.hash);
  check(tx && getAddress(tx.from)===from && (tx.to ? getAddress(tx.to) : null)===to && tx.data===data && tx.value===value && tx.nonce===operation.unsigned.nonce && tx.chainId===BigInt(chainId),'M2 mined transaction does not match the saved intent.');
  operation.status='confirmed';operation.block=receipt.blockNumber;save();
  return receipt;
}
function assertFilters(result,{reactive,escrow,topics,cronSource,cronTopic,cronExpected}) {
  // Live Lasna uses PascalCase; the published RPC example uses camelCase.
  const has=(key)=>result!==null && typeof result==='object' && Object.hasOwn(result,key);
  const lower=has('topicFilters'),upper=has('TopicFilters');
  check(lower!==upper,'Reactive filter index schema unavailable or ambiguous; subscriptions are not verified.');
  const filters=upper?result.TopicFilters:result.topicFilters;
  check(Array.isArray(filters),'Reactive filter index schema unavailable; subscriptions are not verified.');
  check(!(has('version')&&has('Version')),'Reactive filter index version is ambiguous; subscriptions are not verified.');
  const version=(upper?result.Version:result.version)??null;
  check(version===null || (Number.isSafeInteger(version)&&version>=0),'Reactive filter index version invalid; subscriptions are not verified.');
  const same=(a,b)=>{try{return getAddress(a)===getAddress(b);}catch{return false;}};
  function matches(chain,contract,topic) {
    return filters.some(filter=>{
      try {
        return BigInt(filter.ChainId)===BigInt(chain) && same(filter.Contract,contract) &&
          Array.isArray(filter.Topics) && String(filter.Topics[0]).toLowerCase()===topic.toLowerCase() &&
          filter.Topics.slice(1).every(value=>value===null) && filter.Topics.length<=4 &&
          Array.isArray(filter.Configs) && filter.Configs.some(config=>config.Active===true && same(config.Contract,reactive));
      } catch {return false;}
    });
  }
  for(const topic of topics) check(matches(BASE,escrow,topic),'A required active M2 origin subscription is missing.');
  check(matches(LASNA,cronSource,cronTopic)===cronExpected,'M2 CRON subscription does not match the current runnable/paused state.');
  return {originSubscriptions:topics.length,cronActive:cronExpected,filterVersion:version};
}
module.exports={BASE,LASNA,check,paths,newJournal,assertJournal,saveJournal,runOperation,assertFilters};
