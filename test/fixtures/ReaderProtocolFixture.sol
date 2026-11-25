// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;
import {IReactive} from "@reactive/src/interfaces/IReactive.sol";
import {ISystemContract} from "@reactive/src/interfaces/ISystemContract.sol";
/// @notice Isolated local transport/index/report fixture, never a public protocol implementation.
contract ReaderProtocolFixture {
    struct Filter { address subscriber; uint256 chain; address target; uint256 topic; uint256 t1; uint256 t2; uint256 t3; bool active; }
    Filter[] public filters;
    uint256 public version;
    mapping(address => uint256) public reserves;
    struct Report { uint256 number; address reactive; uint256 index; uint256 chain; uint256 txHash; bytes err; }
    mapping(uint256 => Report[]) private reports;
    event CallbackRequest(uint256 indexed chainId,address indexed sender,address indexed recipient,uint8 version,bytes configuration);
    function debt(address) external pure returns(uint256){return 0;}
    function _gasPriceCoeffPer1000() external view returns(uint256){return block.chainid==5318007?1000:1100;}
    function _extraGas() external view returns(uint256){return block.chainid==5318007?100000:80000;}
    function depositTo(address account) external payable {reserves[account]+=msg.value;}
    function countFilters() external view returns(uint256){return filters.length;}
    function subscribe(uint256 chain,address target,uint256 topic,uint256 t1,uint256 t2,uint256 t3) external {
        filters.push(Filter(msg.sender,chain,target,topic,t1,t2,t3,true));version++;
    }
    function unsubscribe(uint256 chain,address target,uint256 topic,uint256,uint256,uint256) external {
        for(uint256 n;n<filters.length;n++)if(filters[n].active&&filters[n].subscriber==msg.sender&&filters[n].chain==chain&&filters[n].target==target&&filters[n].topic==topic){filters[n].active=false;version++;return;}
        revert("missing fixture filter");
    }
    function requestCallbackV_1_0(ISystemContract.CallbackConfiguration_V_1_0 calldata config) external {
        emit CallbackRequest(config.chainId,msg.sender,config.recipient,0,abi.encode(config));
    }
    function trigger(address target,IReactive.LogRecord calldata record) external {IReactive(payable(target)).react(record);}
    function deliverCallback(uint8 version_,bytes calldata configuration) external {
        require(version_==0);ISystemContract.CallbackConfiguration_V_1_0 memory config=abi.decode(configuration,(ISystemContract.CallbackConfiguration_V_1_0));
        (bool ok,bytes memory result)=config.recipient.call(config.payload);if(!ok)assembly{revert(add(result,32),mload(result))}
    }
    function recordReport(uint256 requestHash,uint256 number,address reactive,uint256 index,uint256 chain,uint256 txHash,bytes calldata err) external {
        reports[requestHash].push(Report(number,reactive,index,chain,txHash,err));
    }
    function getCallbacks(uint256 requestHash) external view returns(Report[] memory){return reports[requestHash];}
}
