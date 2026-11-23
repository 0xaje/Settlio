// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import {AbstractCallback} from "@reactive/src/base/AbstractCallback.sol";
import {IPayable} from "@reactive/src/interfaces/IPayable.sol";
import {SettlioEscrowV4} from "packages/contracts/admission/SettlioEscrowV4.sol";

/// @notice Pays network fees from its own balance, never from customer escrow.
contract SettlioCallbackV4 is AbstractCallback {
    error InvalidConfiguration();
    SettlioEscrowV4 public immutable escrow;

    constructor(IPayable proxy, address reactive, address sponsor, uint32 capacity, uint32 lifetimeLimit,
        uint64 horizon, uint64 cooldown, uint32 retries)
        payable AbstractCallback(proxy, reactive)
    {
        if (address(proxy) == address(0) || reactive == address(0) || address(proxy).code.length == 0) {
            revert InvalidConfiguration();
        }
        // Creating escrow here fixes its receiver without a mutable administrator.
        escrow = new SettlioEscrowV4(address(this), sponsor, capacity, lifetimeLimit, horizon, cooldown, retries);
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
