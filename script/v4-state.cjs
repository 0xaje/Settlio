// V4-only public journal. Reuses the tested saved-intent engine, never its M2 file format.
const fs=require('node:fs'),path=require('node:path');
const {getAddress}=require('ethers');
const {runOperation}=require('./m2-state.cjs');
function check(value,message){if(!value){const e=Error(message);e.v4Expected=true;throw e;}}
const stages={deployReactive:5318007,deployCallback:84532,configure:5318007,fundReactiveInitial:5318007,fundCallbackInitial:84532,grantInitial:84532,openAdmission:84532,renewExpiredGrant:84532,grantOperatorWindow:84532,grantNextQuote:84532,grantRefundQuote:84532,grantUsdcRefundQuote:84532,grantExpiryQuote:84532,grantRecoveryQuote:84532,pauseRecoveryScheduler:5318007,resumeRecoveryScheduler:5318007};
function paths(root){const directory=path.join(root,'deployments');return {directory,journal:path.join(directory,'testnet-v4.json'),lock:path.join(directory,'.deploy-v4.lock')};}
function validate(j){check(j?.milestone==='M2-V4'&&j.schemaVersion===1&&j.policyVersion===4&&j.baseChainId===84532&&j.reactiveChainId===5318007&&j.operations&&j.contracts,'Wrong V4 journal; preserve existing M1/M2 files.');getAddress(j.deployer);}
function create(deployer,settings){return {milestone:'M2-V4',schemaVersion:1,policyVersion:4,baseChainId:84532,reactiveChainId:5318007,deployer:getAddress(deployer),settings,contracts:{},operations:{}};}
function save(file,j){validate(j);check(path.basename(file)==='testnet-v4.json','Refusing to write outside the V4 journal.');function inspect(value){if(!value||typeof value!=='object')return;for(const [key,child]of Object.entries(value)){check(!/private.?key|mnemonic|signedTransaction|rawTransaction|rpcUrl/i.test(key),'Confidential configuration cannot be saved.');inspect(child);}}inspect(j);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.tmp',JSON.stringify(j,null,2)+'\n',{mode:0o600});fs.renameSync(file+'.tmp',file);}
function read(root){const p=paths(root);check(fs.existsSync(p.journal),'V4 journal is missing; no V4 deployment is claimed.');const j=JSON.parse(fs.readFileSync(p.journal,'utf8'));validate(j);return j;}
async function locked(root,work){const p=paths(root);fs.mkdirSync(p.directory,{recursive:true});let fd;try{fd=fs.openSync(p.lock,'wx');}catch{check(false,'V4 lock exists. Inspect processes/status before any removal.');}try{return await work(p);}finally{fs.closeSync(fd);fs.unlinkSync(p.lock);}}
async function run({journal,key,signer,request,save:write,timeout}){validate(journal);check(Object.hasOwn(stages,key),'Unknown V4 operation.');const chainId=stages[key];check(BigInt(await signer.provider.send('eth_chainId',[]))===BigInt(chainId),'Wrong V4 operation network.');
 // Only the shared engine's in-memory view uses its configure key. Disk always retains the V4 stage name/schema.
 const view={deployer:journal.deployer,operations:{}};if(journal.operations[key])view.operations.configure=journal.operations[key];
 return runOperation({journal:view,key:'configure',signer,request,chainId,timeout,save(){journal.operations[key]=view.operations.configure;write();}});
}
module.exports={check,paths,validate,create,save,read,locked,run,stages};
