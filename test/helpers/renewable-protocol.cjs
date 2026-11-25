const {Contract,ContractFactory,AbiCoder,id,ZeroAddress}=require('ethers');
const start=require('./local-chain.cjs'),compile=require('../../script/compile-renewable.cjs');
const SYSTEM='0x8888888888888888888888888888888888888888',coder=AbiCoder.defaultAbiCoder();
const fixtures={'test/ClosureProtocolFixture.sol':{content:`// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;
import {IReactive} from "@reactive/src/interfaces/IReactive.sol";
import {ISystemContract} from "@reactive/src/interfaces/ISystemContract.sol";
// Isolated protocol transport, never a production proxy or a public proof.
contract ClosureProtocolFixture {
 bool public reject;
 bytes[] public payloads;
 address public lastRecipient;
 uint256 public lastChain;
 mapping(bytes32=>bool) public subscriptions;
 function debt(address) external pure returns(uint256){return 0;}
 function setReject(bool value) external {reject=value;}
 function count() external view returns(uint256){return payloads.length;}
 function subscribe(uint256 chain,address target,uint256 a,uint256 b,uint256 c,uint256 d) external {
  bytes32 key=keccak256(abi.encode(msg.sender,chain,target,a,b,c,d));require(!subscriptions[key]);subscriptions[key]=true;
 }
 function unsubscribe(uint256 chain,address target,uint256 a,uint256 b,uint256 c,uint256 d) external {
  bytes32 key=keccak256(abi.encode(msg.sender,chain,target,a,b,c,d));require(subscriptions[key]);subscriptions[key]=false;
 }
 function requestCallbackV_1_0(ISystemContract.CallbackConfiguration_V_1_0 calldata config) external {
  require(!reject,"fixture reject");payloads.push(config.payload);lastRecipient=config.recipient;lastChain=config.chainId;
 }
 function forward(address target,IReactive.LogRecord calldata record) external {IReactive(payable(target)).react(record);}
 function deliver(address target,address sender,bytes calldata payload) external {
  bytes memory data=payload;require(data.length>=36);assembly {mstore(add(data,36),sender)}
  (bool ok,bytes memory result)=target.call(data);if(!ok)assembly{revert(add(result,32),mload(result))}
 }
}`}};
const artifacts={};function art(n){return artifacts[n]??=compile(n,fixtures);}
async function setup(t,{capacity=2,adaptive=false,horizon=10000}={}){
 const {provider,signers}=await start(t),[owner,customer,stranger]=signers;
 async function deploy(n,args=[]){const a=art(n),c=await new ContractFactory(a.abi,a.evm.bytecode.object,owner).deploy(...args);await c.waitForDeployment();return c;}
 const proxy=await deploy('ClosureProtocolFixture');await provider.send('anvil_setCode',[SYSTEM,await provider.getCode(proxy.target)]);
 const system=new Contract(SYSTEM,art('ClosureProtocolFixture').abi,owner),source=await deploy('SettlioReactiveV5',[31337,adaptive]);
 const receiver=await deploy('SettlioCallbackV5',[proxy.target,source.target,await owner.getAddress(),capacity,capacity,horizon,60,1]);
 const escrow=new Contract(await receiver.escrow(),art('SettlioEscrowV5').abi,owner),gate=new Contract(await escrow.admission(),art('SettlioWorkLedger').abi,owner);
 await(await source.configure(escrow.target,receiver.target,gate.target)).wait();
 const profile=id('isolated closure profile'),terms=id('terms'),now=(await provider.getBlock('latest')).timestamp;
 await(await gate.setOpen(true)).wait();await(await gate.setGrant(await owner.getAddress(),1,capacity,now+9000,profile,id('attestation'))).wait();
 let sequence=100000;
 function record(topic,quoteId=1,data='0x',changes={}){const n=++sequence;return {chainId:31337,contractAddress:escrow.target,topic0:BigInt(topic),topic1:BigInt(quoteId),topic2:0,topic3:0,data,blockNumber:n,opCode:2,blockHash:BigInt(n),txHash:BigInt(n),logIndex:0,...changes};}
 async function send(log){return(await system.forward(source.target,log,{gasLimit:900000})).wait();}
 async function forward(receipt,{only,except}={}){for(const l of receipt.logs){if(![escrow.target,gate.target].some(a=>a.toLowerCase()===l.address.toLowerCase()))continue;
  if(only&&!only.includes(l.topics[0]))continue;if(except&&except.includes(l.topics[0]))continue;
  await send({chainId:31337,contractAddress:l.address,topic0:BigInt(l.topics[0]),topic1:BigInt(l.topics[1]||0),topic2:BigInt(l.topics[2]||0),topic3:BigInt(l.topics[3]||0),data:l.data,blockNumber:receipt.blockNumber,opCode:l.topics.length,blockHash:BigInt(receipt.blockHash),txHash:BigInt(receipt.hash),logIndex:l.index});
 }}
 async function tick(changes={}){return send(record(await source.CRON_TOPIC(),sequence+1,'0x',{contractAddress:await source.CRON_SOURCE(),...changes}));}
 async function move(ts){await provider.send('evm_setNextBlockTimestamp',[Number(ts)]);await provider.send('evm_mine',[]);}
 async function create({automatic=false,expiry=now+100,cutoff=now+200}={}){return(await escrow.createQuoteWithPolicy(await customer.getAddress(),[{asset:ZeroAddress,total:300,deposit:100}],expiry,cutoff,terms,automatic)).wait();}
 async function expire(quoteId=1){return(await proxy.deliver(receiver.target,source.target,receiver.interface.encodeFunctionData('processPolicy',[ZeroAddress,quoteId]))).wait();}
 async function deliver(index){return(await proxy.deliver(receiver.target,source.target,await system.payloads(index),{gasLimit:1500000})).wait();}
 return {provider,owner,customer,stranger,proxy,system,source,receiver,escrow,gate,profile,terms,now,record,send,forward,tick,move,create,expire,deliver};
}
module.exports={setup,coder};
