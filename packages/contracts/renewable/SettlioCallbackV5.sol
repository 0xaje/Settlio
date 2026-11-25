// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import {AbstractCallback} from "@reactive/src/base/AbstractCallback.sol";
import {IPayable} from "@reactive/src/interfaces/IPayable.sol";
import {SettlioEscrowV5} from "packages/contracts/renewable/SettlioEscrowV5.sol";

/// @notice Pays network fees from its own balance, never from customer escrow.
contract SettlioCallbackV5 is AbstractCallback {
    error InvalidConfiguration();
    SettlioEscrowV5 public immutable escrow;

    constructor(IPayable proxy, address reactive, address sponsor, uint32 workLimit, uint32 activeLimit,
        uint64 horizon, uint64 cooldown, uint32 retries)
        payable AbstractCallback(proxy, reactive)
    {
        if (address(proxy) == address(0) || reactive == address(0) || address(proxy).code.length == 0) {
            revert InvalidConfiguration();
        }
        // Creating escrow here fixes its receiver without a mutable administrator.
        escrow = new SettlioEscrowV5(address(this), sponsor, workLimit, activeLimit, horizon, cooldown, retries);
    }

    function confirmBooking(address reactive, uint256 quoteId)
        external onlyServiceProvider onlyCallbackSender(reactive)
    {
        escrow.confirmBooking(quoteId);
    }

    function processPolicy(address reactive, uint256 quoteId)
        external onlyServiceProvider onlyCallbackSender(reactive)
    {
        escrow.processPolicy(quoteId);
    }

    /// @notice Domain-bound confirmation that Reactive observed terminal escrow state.
    function acknowledgeClosure(address reactive, uint256 destinationChain, address destinationEscrow,
        uint256 quoteId, uint64 epoch, bytes32 profile)
        external onlyServiceProvider onlyCallbackSender(reactive)
    {
        if (destinationChain != block.chainid || destinationEscrow != address(escrow)) revert InvalidConfiguration();
        SettlioEscrowV5.Status status = escrow.getQuote(quoteId).status;
        if (status != SettlioEscrowV5.Status.Refunded && status != SettlioEscrowV5.Status.Expired &&
            status != SettlioEscrowV5.Status.Released) revert InvalidConfiguration();
        escrow.admission().acknowledge(quoteId, epoch, profile);
    }

    function coverDebt() external {
        _coverDebt();
    }
}
