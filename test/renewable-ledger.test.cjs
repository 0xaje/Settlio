const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs');
const {ContractFactory,ZeroAddress,ZeroHash,id}=require('ethers');
const start=require('./helpers/local-chain.cjs'),compile=require('../script/compile.cjs');
const path='packages/contracts/renewable/SettlioWorkLedger.sol';
const sources={[path]:{content:fs.readFileSync(path,'utf8')}};
const artifact=compile('SettlioWorkLedger',sources);
async function fixture(t){
 const {provider,signers}=await start(t),addresses=await Promise.all(signers.map(s=>s.getAddress()));
 const gate=await new ContractFactory(artifact.abi,artifact.evm.bytecode.object,signers[0]).deploy(addresses[0],addresses[1],addresses[2],2,2,1000);
 await gate.waitForDeployment();
 const sponsor=gate.connect(signers[1]),receiver=gate.connect(signers[2]),merchant=addresses[3],profile=id('reviewed profile'),observation=id('funding attestation');
 const now=(await provider.getBlock('latest')).timestamp;
 const grant=(epoch,credits=2)=>sponsor.setGrant(merchant,epoch,credits,now+500,profile,observation);
 const admit=(n,epoch=1)=>gate.admit(n,merchant,epoch,profile,now+600,now+900);
 async function counts(r,u,a,total){assert.deepEqual(await Promise.all([gate.reserved(),gate.unsettled(),gate.active(),gate.totalAdmitted()]),[r,u,a,total].map(BigInt));}
 return {provider,signers,addresses,gate,sponsor,receiver,merchant,profile,observation,now,grant,admit,counts};
}
test('renewable capacity waits for both-chain closure and retains replay tombstones',async t=>{
 const f=await fixture(t),{gate,sponsor,receiver,grant,admit,counts,merchant,profile,observation,now}=f;
 await(await grant(1)).wait();await assert.rejects(gate.admit.staticCall(1,merchant,1,profile,now+600,now+900));await(await sponsor.setOpen(true)).wait();
 await(await admit(1)).wait();await(await admit(2)).wait();await counts(0,2,2,2);
 await(await gate.close(1)).wait();await(await gate.close(2)).wait();await(await gate.close(2)).wait();await counts(0,2,0,2);
 await assert.rejects(sponsor.setGrant.staticCall(merchant,2,1,now+500,profile,observation));
 await(await receiver.acknowledge(1,1,profile)).wait();await(await receiver.acknowledge(1,1,profile)).wait();await counts(0,1,0,2);
 await(await grant(2,1)).wait();await(await admit(3,2)).wait();await counts(0,2,1,3);
 await assert.rejects(gate.admit.staticCall(1,merchant,2,profile,now+600,now+900));
 await(await receiver.acknowledge(2,1,profile)).wait();await(await receiver.acknowledge(3,2,profile)).wait();await counts(0,1,1,3);
 await(await gate.close(3)).wait();await counts(0,0,0,3);
 assert.equal((await gate.jobs(1)).settled,true);await(await grant(3)).wait();await counts(2,0,0,3);
});
test('roles, epoch/profile binding and early acknowledgement cannot release live work',async t=>{
 const {gate,sponsor,receiver,signers,merchant,profile,observation,now,grant,admit,counts}=await fixture(t);
 await assert.rejects(gate.setOpen.staticCall(true));await assert.rejects(gate.setGrant.staticCall(merchant,1,1,now+500,profile,observation));
 await assert.rejects(sponsor.setGrant.staticCall(ZeroAddress,1,1,now+500,profile,observation));
 await assert.rejects(sponsor.setGrant.staticCall(merchant,1,1,now+500,profile,ZeroHash));
 await(await grant(1)).wait();await(await sponsor.setOpen(true)).wait();
 await assert.rejects(gate.connect(signers[3]).admit.staticCall(1,merchant,1,profile,now+600,now+900));
 await assert.rejects(gate.admit.staticCall(1,merchant,2,profile,now+600,now+900));
 await assert.rejects(gate.admit.staticCall(1,merchant,1,id('wrong'),now+600,now+900));
 await(await admit(1)).wait();
 await assert.rejects(gate.acknowledge.staticCall(1,1,profile));await assert.rejects(receiver.close.staticCall(1));
 await assert.rejects(receiver.acknowledge.staticCall(1,2,profile));await assert.rejects(receiver.acknowledge.staticCall(1,1,id('wrong')));
 await assert.rejects(receiver.acknowledge.staticCall(999,1,profile));await assert.rejects(gate.close.staticCall(999));
 await(await receiver.acknowledge(1,1,profile)).wait();await counts(1,1,1,1);
 await(await sponsor.setOpen(false)).wait();await assert.rejects(gate.admit.staticCall(2,merchant,1,profile,now+600,now+900));await(await gate.close(1)).wait();await counts(1,0,0,1);
});
test('expired grants release unused reservations only and cannot replay epochs',async t=>{
 const {provider,gate,sponsor,merchant,profile,observation,now,counts}=await fixture(t);
 await(await sponsor.setGrant(merchant,1,2,now+100,profile,observation)).wait();await(await sponsor.setOpen(true)).wait();
 await(await gate.admit(1,merchant,1,profile,now+50,now+900)).wait();
 await assert.rejects(gate.expireGrant.staticCall(merchant));
 await provider.send('evm_setNextBlockTimestamp',[now+100]);await provider.send('evm_mine',[]);
 await assert.rejects(gate.admit.staticCall(2,merchant,1,profile,now+200,now+900));
 await(await gate.expireGrant(merchant)).wait();await counts(0,1,1,1);
 await assert.rejects(sponsor.setGrant.staticCall(merchant,1,1,now+500,profile,observation));
 await(await sponsor.setGrant(merchant,2,1,now+500,profile,observation)).wait();await counts(1,1,1,1);
 await assert.rejects(sponsor.setGrant.staticCall(merchant,3,2,now+500,profile,observation));
 assert.equal(await provider.getBalance(gate.target),0n);
});
test('multiple merchant reservations are serialized and replacement cannot erase obligations',async t=>{
 const {gate,sponsor,addresses,merchant,profile,observation,now,grant,admit,counts}=await fixture(t);
 await(await grant(1,1)).wait();await(await sponsor.setGrant(addresses[0],1,1,now+500,profile,observation)).wait();
 await assert.rejects(sponsor.setGrant.staticCall(addresses[2],1,1,now+500,profile,observation));
 await(await sponsor.setOpen(true)).wait();await(await admit(1)).wait();
 await(await sponsor.setGrant(merchant,2,0,0,ZeroHash,ZeroHash)).wait();await counts(1,1,1,1);
 await assert.rejects(sponsor.setGrant.staticCall(merchant,3,1,now+500,profile,observation));
 await assert.rejects(gate.admit.staticCall(2,addresses[0],1,profile,now+800,now+700));
 await assert.rejects(gate.admit.staticCall(2,addresses[0],1,profile,now+600,now+2000));
 await(await gate.admit(2,addresses[0],1,profile,now+600,now+900)).wait();await counts(0,2,2,2);
});
test('configuration and separate active bound reject invalid admissions at timestamp boundaries',async t=>{
 const {provider,signers}=await start(t),a=await Promise.all(signers.map(s=>s.getAddress()));
 const factory=new ContractFactory(artifact.abi,artifact.evm.bytecode.object,signers[0]);
 for(const args of [[ZeroAddress,a[1],a[2],2,1,1000],[a[0],a[1],a[2],1,2,1000],[a[0],a[1],a[2],2,1,0]]){
  await assert.rejects(provider.call({...await factory.getDeployTransaction(...args),from:a[0]}));
 }
 const gate=await factory.deploy(a[0],a[1],a[2],3,1,1000);await gate.waitForDeployment();
 const sponsor=gate.connect(signers[1]),now=(await provider.getBlock('latest')).timestamp,p=id('profile');
 await(await sponsor.setGrant(a[3],1,3,now+200,p,id('observation'))).wait();await(await sponsor.setOpen(true)).wait();
 await assert.rejects(gate.admit.staticCall(0,a[3],1,p,now+100,now+500));
 await provider.send('evm_setNextBlockTimestamp',[now+50]);await provider.send('evm_mine',[]);
 await assert.rejects(gate.admit.staticCall(1,a[3],1,p,now+50,now+500));
 await(await gate.admit(1,a[3],1,p,now+100,now+500)).wait();
 await assert.rejects(gate.admit.staticCall(2,a[3],1,p,now+100,now+500));
 await(await gate.close(1)).wait();await(await gate.admit(2,a[3],1,p,now+100,now+500)).wait();
 assert.equal(await gate.active(),1n);assert.equal(await gate.unsettled(),2n);assert.equal(await gate.reserved(),1n);
});
