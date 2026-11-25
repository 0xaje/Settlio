const {test}=require('node:test'),assert=require('node:assert/strict');
const {readHistory,observedProvider}=require('../script/verify-v4-expiry.cjs');
test('history scans contiguous bounded pages through the fixed head without gaps',async()=>{
 const calls=[],p={send:async(method,[filter])=>{assert.equal(method,'eth_getLogs');calls.push(filter);return [{blockNumber:filter.fromBlock,transactionHash:'0x'+BigInt(filter.fromBlock).toString(16).padStart(64,'0'),logIndex:'0x0'}];}};
 const rows=await readHistory(p,{address:'escrow',topics:[null,'quote']},'0x64','0x1084');assert.equal(rows.length,5);
 assert.equal(BigInt(calls[0].fromBlock),100n);assert.equal(BigInt(calls.at(-1).toBlock),4228n);
 for(let i=0;i<calls.length;i++){assert(BigInt(calls[i].toBlock)-BigInt(calls[i].fromBlock)<1000n);assert.equal(calls[i].address,'escrow');assert.deepEqual(calls[i].topics,[null,'quote']);if(i)assert.equal(BigInt(calls[i-1].toBlock)+1n,BigInt(calls[i].fromBlock));}
});
test('a failed or malformed history page never returns a partial successful scan',async()=>{
 await assert.rejects(readHistory({send:async(_,p)=>{if(BigInt(p[0].fromBlock)>=1000n)throw Error('RPC page unavailable');return [];}},{},0n,2500n),/unavailable/);
 await assert.rejects(readHistory({send:async()=>null},{},0n,0n),/array/);
 await assert.rejects(readHistory({send:async()=>[{blockNumber:'0x1',transactionHash:'0x1',logIndex:'0x0'}]},{},0n,0n),/outside/);
});
test('duplicate history, reversed range and unbounded scan are refused',async()=>{
 const row={blockNumber:'0x0',transactionHash:'0x1',logIndex:'0x0'};
 await assert.rejects(readHistory({send:async()=>[row,row]},{},0n,1n),/Duplicate/);
 await assert.rejects(readHistory({}, {},2n,1n),/Invalid/);await assert.rejects(readHistory({}, {},0n,1000000n),/bounded/);
});
test('read errors expose network/method and safe codes without provider URLs or secrets',async()=>{
 const p=observedProvider({send:async()=>{throw Object.assign(Error('https://secret-provider.invalid/private-key-value'),{code:'UNKNOWN_ERROR',info:{error:{code:-32005,message:'private value'}}});}},'Base Sepolia');
 await assert.rejects(p.send('eth_getLogs',[]),e=>e.expiryVerification&&/Base Sepolia eth_getLogs.*UNKNOWN_ERROR.*-32005/.test(e.message)&&!e.message.includes('private')&&!e.message.includes('https'));
});
test('existing verification errors retain their specific message',async()=>{
 const expected=Object.assign(Error('Original policy event unavailable.'),{expiryVerification:true}),p=observedProvider({send:async()=>{throw expected;}},'Lasna');await assert.rejects(p.send('eth_call',[]),e=>e===expected);
});
