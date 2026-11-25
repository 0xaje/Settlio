// Isolated fixtures only. Never creates or funds a public deployment.
const {Contract,ContractFactory,keccak256,toUtf8Bytes}=require('ethers');
const legacy=require('../../script/compile.cjs'),admission=require('../../script/compile-admission.cjs');
module.exports=async function deployEscrow(version,{merchant,receiver,provider,capacity=16}) {
 const artifact=version===4?admission('SettlioEscrowV4'):legacy();
 const factory=new ContractFactory(artifact.abi,artifact.evm.bytecode.object,merchant);
 const escrow=version===4
  ?await factory.deploy(await receiver.getAddress(),await merchant.getAddress(),capacity,capacity,1000,60,2)
  :await factory.deploy(await receiver.getAddress());
 await escrow.waitForDeployment();
 if(version===4){
  const gate=new Contract(await escrow.admission(),admission('SettlioAdmission').abi,merchant);
  const now=(await provider.getBlock('latest')).timestamp;
  await(await gate.setOpen(true)).wait();
  await(await gate.setGrant(await merchant.getAddress(),capacity,now+100000,keccak256(toUtf8Bytes('isolated V4 security-suite allowance')))).wait();
 }
 return escrow;
};
