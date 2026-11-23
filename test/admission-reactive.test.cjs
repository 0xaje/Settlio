const {test}=require('node:test');
const assert=require('node:assert/strict');
const {ContractFactory,Contract,Interface,AbiCoder,keccak256,ZeroAddress,parseEther}=require('ethers');
const start=require('./helpers/local-chain.cjs'),compile=require('../script/compile-admission.cjs');
const {SYSTEM,PROXY,CRON}=require('../script/m2-network.cjs');
const fixtures={'test/AdmissionProtocolFixture.sol':{content:`// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;
import {IReactive} from "@reactive/src/interfaces/IReactive.sol";
import {ISystemContract} from "@reactive/src/interfaces/ISystemContract.sol";
contract AdmissionProtocolFixture {
 event Cron100(uint256 indexed number);
 event Requested(address indexed recipient,bytes payload);
 mapping(bytes32=>bool) public subscriptions;
 mapping(address=>uint256) public reserves;
 function depositTo(address target) external payable {reserves[target]+=msg.value;}
 function _gasPriceCoeffPer1000() external pure returns(uint256){return 1000;}
 function _extraGas() external pure returns(uint256){return 100000;}
 function debt(address) external pure returns(uint256){return 0;}
 function subscribe(uint256 c,address a,uint256 t0,uint256 t1,uint256 t2,uint256 t3) external {bytes32 k=keccak256(abi.encode(msg.sender,c,a,t0,t1,t2,t3));require(!subscriptions[k]);subscriptions[k]=true;}
 function unsubscribe(uint256 c,address a,uint256 t0,uint256 t1,uint256 t2,uint256 t3) external {bytes32 k=keccak256(abi.encode(msg.sender,c,a,t0,t1,t2,t3));require(subscriptions[k]);subscriptions[k]=false;}
 function requestCallbackV_1_0(ISystemContract.CallbackConfiguration_V_1_0 calldata config) external {emit Requested(config.recipient,config.payload);}
 function forward(address target,IReactive.LogRecord calldata record) external {IReactive(payable(target)).react(record);}
 function emitCron() external {emit Cron100(block.number);}
 function deliver(address receiver,bytes calldata data) external {(bool ok,bytes memory result)=receiver.call(data);if(!ok)assembly{revert(add(result,32),mload(result))}}
}`}};

test('V4 actual origin receipts traverse subscriber, indexed CRON and authenticated destination, closing admission and queue',async t=>{
 const base=await start(t,{chainId:84532}),lasna=await start(t,{chainId:5318007});
 async function deploy(name,chain,args=[]){const a=compile(name,fixtures),c=await new ContractFactory(a.abi,a.evm.bytecode.object,chain.signers[0]).deploy(...args);await c.waitForDeployment();return c;}
 const sourcePrototype=await deploy('AdmissionProtocolFixture',lasna),destinationPrototype=await deploy('AdmissionProtocolFixture',base);
 await lasna.provider.send('anvil_setCode',[SYSTEM,await lasna.provider.getCode(sourcePrototype.target)]);
 await lasna.provider.send('anvil_setCode',[CRON,await lasna.provider.getCode(sourcePrototype.target)]);
 await base.provider.send('anvil_setCode',[PROXY,await base.provider.getCode(destinationPrototype.target)]);
 const abi=compile('AdmissionProtocolFixture',fixtures).abi,system=new Contract(SYSTEM,abi,lasna.signers[0]);
 const emitter=new Contract(CRON,abi,lasna.signers[0]),proxy=new Contract(PROXY,abi,base.signers[0]);
 const reactive=await deploy('SettlioReactiveV4',lasna,[84532]);
 const owner=await base.signers[0].getAddress(),customer=base.signers[1],customerAddress=await customer.getAddress();
 const receiver=await deploy('SettlioCallbackV4',base,[PROXY,reactive.target,owner,2,3,1000,60,2]);
 const escrow=new Contract(await receiver.escrow(),compile('SettlioEscrowV4').abi,base.signers[0]);
 const gate=new Contract(await escrow.admission(),compile('SettlioAdmission').abi,base.signers[0]);
 await(await reactive.configure(escrow.target,receiver.target)).wait();
 assert.equal(await reactive.POLICY_VERSION(),4n);assert.equal(await escrow.POLICY_VERSION(),4n);
 // Controlled fixture clocks supply three genuine indexed CRON receipts before initial admission.
 let sourceTime=(await lasna.provider.getBlock('latest')).timestamp;
 for(let index=0;index<3;index++){sourceTime+=100;await lasna.provider.send('evm_setNextBlockTimestamp',[sourceTime]);await lasna.provider.send('evm_mine',[]);await(await emitter.emitCron()).wait();}
 await base.provider.send('evm_setNextBlockTimestamp',[sourceTime]);await base.provider.send('evm_mine',[]);
 await(await system.depositTo(reactive.target,{value:parseEther('100')})).wait();
 await(await base.signers[0].sendTransaction({to:receiver.target,value:parseEther('1')})).wait();
 const budget=require('../script/admission-budget.cjs');
 const fixtureClock=()=>BigInt(Math.max(sourceTime,(Date.now()/1000)|0));
 // The local RPC has no RNK index: adapt only that method using the fixture's actual subscription storage.
 const indexRPC={send:async(method,args)=>{
  if(method!=='rnk_getFilters')return lasna.provider.send(method,args);
  const ignore=BigInt('0xa65f96fc951c35ead38878e0f0b7a3c744a6f5ccc1476b313353ce31712313ad');
  const names=['DEPOSIT_TOPIC','RETRY_TOPIC','POLICY_TOPIC','POLICY_RETRY_TOPIC','CANCEL_TOPIC','CONFIRMED_TOPIC','CHECKED_TOPIC','REFUNDED_TOPIC','EXPIRED_TOPIC','RELEASED_TOPIC'];
  const filters=[];
  for(const name of names){const topic=await reactive[name]();const key=keccak256(AbiCoder.defaultAbiCoder().encode(['address','uint256','address','uint256','uint256','uint256','uint256'],[reactive.target,84532,escrow.target,topic,ignore,ignore,ignore]));filters.push({ChainId:84532,Contract:escrow.target,Topics:['0x'+topic.toString(16).padStart(64,'0'),null,null,null],Configs:[{Active:await system.subscriptions(key),Contract:reactive.target}]});}
  return {Version:1,TopicFilters:filters};
 }};
 const observed=await budget.observe(base.provider,indexRPC,{policyVersion:4,escrow:escrow.target,callback:receiver.target,reactive:reactive.target,admission:gate.target,sponsor:owner},fixtureClock);
 const planned=budget.calculate(observed,{merchant:owner,credits:2n,validSeconds:300n},fixtureClock());
 assert.equal(planned.canGrant,true);assert.equal(planned.lifetimeQuotesBudgeted,'3');assert.equal(await escrow.totalLiability(),0n);
 assert.equal(await base.provider.getBalance(escrow.target),0n);
 const now=Math.max((await base.provider.getBlock('latest')).timestamp,(await lasna.provider.getBlock('latest')).timestamp);
 await(await gate.setOpen(true)).wait();await(await gate.setGrant(owner,2,now+500,keccak256('0xabcdef'))).wait();
 let checkedSystemGuard=false;
 async function forwardReceipt(receipt,chain=84532,address=escrow.target){const requests=[];for(const log of receipt.logs){if(log.address.toLowerCase()!==address.toLowerCase())continue;if(chain===84532){let p;try{p=escrow.interface.parseLog(log)}catch{continue}if(!['PolicyRegistered','PolicyRequested','DepositReceived','ConfirmationRequested','CancellationRequested','BookingConfirmed','Refunded','QuoteExpired','Released','PolicyChecked'].includes(p.name))continue;}
  const record={chainId:chain,contractAddress:address,topic0:BigInt(log.topics[0]),topic1:BigInt(log.topics[1]||0),topic2:BigInt(log.topics[2]||0),topic3:BigInt(log.topics[3]||0),data:log.data,blockNumber:receipt.blockNumber,opCode:log.topics.length,blockHash:BigInt(receipt.blockHash),txHash:BigInt(receipt.hash),logIndex:log.index};
  if(!checkedSystemGuard){await assert.rejects(reactive.react.staticCall(record));checkedSystemGuard=true;}
  const applied=await(await system.forward(reactive.target,record)).wait();for(const l of applied.logs){if(l.address.toLowerCase()!==SYSTEM.toLowerCase())continue;try{const p=system.interface.parseLog(l);if(p.name==='Requested')requests.push(p.args);}catch{}}
 }return requests;}
 async function deliver(request){assert.equal(request.recipient,receiver.target);const p=receiver.interface.parseTransaction({data:request.payload});assert.equal(p.args[0],ZeroAddress);const data=receiver.interface.encodeFunctionData(p.name,[reactive.target,p.args[1]]);const result=await(await proxy.deliver(receiver.target,data)).wait();await forwardReceipt(result);return result;}
 async function tick(timestamp){const current=(await lasna.provider.getBlock('latest')).timestamp;if(timestamp>current){await lasna.provider.send('evm_setNextBlockTimestamp',[timestamp]);await lasna.provider.send('evm_mine',[]);}return forwardReceipt(await(await emitter.emitCron()).wait(),5318007,CRON);}
 const terms=keccak256('0x1234'),choices=[{asset:ZeroAddress,total:300,deposit:100}];
 const created=await(await escrow.createQuoteWithPolicy(customerAddress,choices,now+100,now+200,terms,true)).wait();await forwardReceipt(created);
 assert.equal(await reactive.activeJobCount(),1n);assert.equal(await reactive.cronSubscribed(),true);assert.equal(await gate.active(),1n);assert.deepEqual(await forwardReceipt(created),[]);assert.equal(await reactive.activeJobCount(),1n);
 const paid=await(await escrow.connect(customer).payDepositWithPolicy(1,0,terms,true,{value:100})).wait();const confirmation=await forwardReceipt(paid);assert.equal(confirmation.length,1);assert.deepEqual(await forwardReceipt(paid),[]);
 await assert.rejects(receiver.processPolicy.staticCall(reactive.target,1));
 await assert.rejects(proxy.deliver.staticCall(receiver.target,receiver.interface.encodeFunctionData('processPolicy',[owner,1])));
 await deliver(confirmation[0]);assert.equal((await escrow.getQuote(1)).status,3n);
 await base.provider.send('evm_setNextBlockTimestamp',[now+200]);await base.provider.send('evm_mine',[]);
 const release=await tick(now+200);assert.equal(release.length,1);await deliver(release[0]);
 assert.equal((await escrow.getQuote(1)).status,7n);assert.equal((await reactive.jobs(1)).closed,true);assert.equal(await gate.active(),0n);assert.equal(await reactive.activeJobCount(),0n);assert.equal(await reactive.cronSubscribed(),false);
 // Re-delivery cannot move principal or reopen either ledger.
 await deliver(release[0]);assert.equal(await escrow.totalLiability(),0n);assert.equal(await base.provider.getBalance(escrow.target),0n);assert.equal(await gate.active(),0n);
 const expired=await(await escrow.createQuoteWithPolicy(customerAddress,choices,now+300,now+400,terms,false)).wait();await forwardReceipt(expired);
 await base.provider.send('evm_setNextBlockTimestamp',[now+300]);await base.provider.send('evm_mine',[]);
 const expiry=await tick(now+300);assert.equal(expiry.length,1);await deliver(expiry[0]);
 assert.equal((await escrow.getQuote(2)).status,6n);assert.equal((await reactive.jobs(2)).closed,true);assert.equal(await gate.active(),0n);assert.equal(await gate.admitted(),2n);assert.equal(await reactive.activeJobCount(),0n);assert.equal(await reactive.cronSubscribed(),false);
});
