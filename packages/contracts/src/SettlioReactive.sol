// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import {AbstractReactive} from "@reactive/src/base/AbstractReactive.sol";
import {ISystemContract} from "@reactive/src/interfaces/ISystemContract.sol";

/// @notice M1 subscriber for genuine deposit and participant retry events.
contract SettlioReactive is AbstractReactive {
    error Unauthorized();
    error InvalidConfiguration();
    address public immutable owner;
    uint256 public immutable originChain;
    address public originEscrow;
    address public callbackReceiver;
    uint64 public constant CALLBACK_GAS_LIMIT = 1_000_000;
    uint256 public constant DEPOSIT_TOPIC = uint256(keccak256("DepositReceived(uint256,address,uint256)"));
    uint256 public constant RETRY_TOPIC = uint256(keccak256("ConfirmationRequested(uint256)"));
    mapping(bytes32 => bool) public processed;
    event Configured(address indexed escrow, address indexed receiver);
    event ConfirmationCallbackRequested(uint256 indexed quoteId, bytes32 indexed originLog);

    constructor(uint256 chain) payable {
        if (chain == 0) revert InvalidConfiguration();
        owner = msg.sender;
        originChain = chain;
    }

    /// @notice One-time wiring after the callback receiver creates its escrow.
    function configure(address escrow, address receiver) external {
        if (msg.sender != owner) revert Unauthorized();
        if (originEscrow != address(0) || escrow == address(0) || receiver == address(0)) {
            revert InvalidConfiguration();
        }
        originEscrow = escrow;
        callbackReceiver = receiver;
        SYSTEM.subscribe(originChain, escrow, DEPOSIT_TOPIC, REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE);
        SYSTEM.subscribe(originChain, escrow, RETRY_TOPIC, REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE);
        emit Configured(escrow, receiver);
    }

    function react(LogRecord calldata log) external onlySystem {
        if (originEscrow == address(0) || log.chainId != originChain || log.contractAddress != originEscrow) return;
        if (log.topic0 == DEPOSIT_TOPIC) {
            if (log.opCode != 3 || log.data.length != 32 || log.topic2 > type(uint160).max) return;
            if (abi.decode(log.data, (uint256)) == 0) return;
        } else if (log.topic0 == RETRY_TOPIC) {
            if (log.opCode != 2 || log.data.length != 0) return;
        } else {
            return;
        }
        if (log.topic1 == 0) return;
        bytes32 originLog = keccak256(abi.encode(log.chainId, log.blockHash, log.txHash, log.logIndex));
        if (processed[originLog]) return;
        processed[originLog] = true;
        SYSTEM.requestCallbackV_1_0(ISystemContract.CallbackConfiguration_V_1_0({
            chainId: originChain,
            recipient: callbackReceiver,
            gasLimit: CALLBACK_GAS_LIMIT,
            payload: abi.encodeWithSignature("confirmBooking(address,uint256)", address(0), log.topic1)
        }));
        emit ConfirmationCallbackRequested(log.topic1, originLog);
    }

    function coverDebt() external {
        _coverDebt();
    }
}
