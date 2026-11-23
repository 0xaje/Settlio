const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {deploymentStatus}=require('../script/m2-status.cjs');
const {newJournal,saveJournal}=require('../script/m2-state.cjs');
const {stage,format}=require('../script/m2-errors.cjs');
const deployer='0x0000000000000000000000000000000000000001',hash='0x'+'11'.repeat(32);
function directory(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'settlio-status-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));return root;}
function journal(root){const j=newJournal(deployer,{},{});j.operations.deployReactive={hash,status:'prepared',unsigned:{chainId:5318007,nonce:0}};saveJournal(path.join(root,'deployments/testnet-m2.json'),j);return j;}
test('missing M2 journal is reported without RPC access or file creation',async t=>{
 const root=directory(t),provider={send(){throw Error('must not call');}};
 const report=await deploymentStatus({directoryRoot:root,base:provider,lasna:provider});
 assert.equal(report.journalExists,false);assert.equal(fs.existsSync(path.join(root,'deployments')),false);
});
test('M2 status distinguishes reverted pending and unknown without mutation',async t=>{
 const root=directory(t);journal(root);const file=path.join(root,'deployments/testnet-m2.json'),before=fs.readFileSync(file,'utf8');
 const calls=[];let receipt={transactionHash:hash,status:'0x0',blockNumber:'0x1',contractAddress:null},tx=null;
 const provider={async send(method,args){calls.push(method);if(method==='eth_chainId')return '0x'+(5318007).toString(16);if(method==='eth_getTransactionReceipt')return receipt;if(method==='eth_getTransactionByHash')return tx;throw Error('unexpected');}};
 const read=()=>deploymentStatus({directoryRoot:root,base:provider,lasna:provider});
 assert.equal((await read()).operations[0].state,'reverted');
 receipt=null;tx={hash,blockNumber:null};assert.equal((await read()).operations[0].state,'pending');
 tx=null;assert.equal((await read()).operations[0].state,'not-found-outcome-unknown');
 receipt={transactionHash:hash,status:'0x1',blockNumber:'0x2',contractAddress:deployer};assert.equal((await read()).operations[0].state,'succeeded');
 assert.equal(fs.readFileSync(file,'utf8'),before);
 assert.equal(calls.every(x=>['eth_chainId','eth_getTransactionReceipt','eth_getTransactionByHash'].includes(x)),true);
});
test('M2 status suppresses unknown fields and raw RPC errors; rejects another network',async t=>{
 const root=directory(t);const j=journal(root),file=path.join(root,'deployments/testnet-m2.json');
 j.privateKey='do-not-print-this';j.operations.deployReactive.status='do-not-print-this';fs.writeFileSync(file,JSON.stringify(j));
 let fail=false;
 const provider={async send(){if(fail)throw Error('do-not-print-this');return '0x1';}};
 let report=await deploymentStatus({directoryRoot:root,base:provider,lasna:provider});
 assert.equal(report.operations[0].state,'wrong-rpc-network');assert.equal(JSON.stringify(report).includes('do-not-print-this'),false);
 fail=true;report=await deploymentStatus({directoryRoot:root,base:provider,lasna:provider});
 assert.equal(report.operations[0].state,'rpc-observation-unavailable');assert.equal(JSON.stringify(report).includes('do-not-print-this'),false);
});
test('deployment stage errors expose only approved codes and static context',async()=>{
 for(const code of ['INVALID_ARGUMENT','rpc-message-containing-secret']) {
 let caught;try{await stage('wallet-key',async()=>{const e=Error('do-not-print-this');e.code=code;throw e;});}catch(e){caught=e;}
 const output=format(caught);assert.match(output,/wallet-key/);assert.equal(output.includes('do-not-print-this'),false);
 assert.equal(output.includes('rpc-message-containing-secret'),false);
 }
 assert.equal(format(Error('do-not-print-this')).includes('do-not-print-this'),false);
});
test('actual deployment CLI rejects an invalid key with a safe wallet stage message',()=>{
 const {spawnSync}=require('node:child_process');
 const result=spawnSync(process.execPath,['script/m2.cjs','deploy'],{cwd:path.join(__dirname,'..'),encoding:'utf8',env:{...process.env,DEPLOYER_PRIVATE_KEY:'invalid-key-private-fixture'}});
 assert.equal(result.status,1);assert.match(result.stderr,/wallet-key/);
 assert.equal((result.stdout+result.stderr).includes('invalid-key-private-fixture'),false);
});
