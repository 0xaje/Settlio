const {getAddress,keccak256,ContractFactory}=require('ethers');
const {check}=require('./m2-state.cjs');
function assertRuntime(code,artifact) {
 const runtime=artifact.evm.deployedBytecode;
 check(runtime?.object && /^0x[0-9a-f]+$/i.test(code),'M2 deployed runtime is unavailable.');
 const actual=Buffer.from(code.slice(2),'hex'),expected=Buffer.from(runtime.object,'hex');
 check(actual.length===expected.length,'M2 deployed runtime length differs from source.');
 // Constructor-patched immutable slots are verified separately through authenticated wiring getters.
 for(const locations of Object.values(runtime.immutableReferences||{})) for(const {start,length} of locations) {
  check(start>=0 && length>0 && start+length<=actual.length,'M2 compiler immutable references invalid.');
  actual.fill(0,start,start+length);expected.fill(0,start,start+length);
 }
 check(actual.equals(expected),'M2 deployed runtime differs from compiled source.');
 return keccak256(code);
}
async function assertCreation({entry,operation,artifact,args,provider,deployer,chainId}) {
 check(operation?.status==='confirmed' && entry.transactionHash===operation.hash,'M2 confirmed creation intent is missing.');
 const request=await new ContractFactory(artifact.abi,artifact.evm.bytecode.object).getDeployTransaction(...args);
 const [receipt,tx,code]=await Promise.all([provider.getTransactionReceipt(operation.hash),provider.getTransaction(operation.hash),provider.getCode(entry.address)]);
 check(receipt?.status===1 && receipt.contractAddress && getAddress(receipt.contractAddress)===getAddress(entry.address),'M2 creation receipt/address mismatch.');
 check(tx && tx.to===null && getAddress(tx.from)===getAddress(deployer) && tx.chainId===BigInt(chainId) && tx.data===request.data && tx.data===operation.unsigned.data && tx.value===BigInt(operation.unsigned.value) && tx.nonce===operation.unsigned.nonce,'M2 creation transaction differs from compiled constructor or saved intent.');
 check(entry.creationBytecodeHash===keccak256('0x'+artifact.evm.bytecode.object),'M2 creation source fingerprint mismatch.');
 return assertRuntime(code,artifact);
}
module.exports={assertRuntime,assertCreation};
