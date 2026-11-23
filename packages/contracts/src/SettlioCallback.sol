// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import {AbstractCallback} from "@reactive/src/base/AbstractCallback.sol";
import {IPayable} from "@reactive/src/interfaces/IPayable.sol";
import {SettlioEscrow} from "./SettlioEscrow.sol";

/// @notice Pays network fees from its own balance, never from customer escrow.
contract SettlioCallback is AbstractCallback {
    error InvalidConfiguration();
    SettlioEscrow public immutable escrow;

    constructor(IPayable proxy, address reactive)
        payable AbstractCallback(proxy, reactive)
    {
        if (address(proxy) == address(0) || reactive == address(0) || address(proxy).code.length == 0) {
            revert InvalidConfiguration();
        }
        // Creating escrow here fixes its receiver without a mutable administrator.
        escrow = new SettlioEscrow(address(this));
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

    function coverDebt() external {
        _coverDebt();
    }
}
