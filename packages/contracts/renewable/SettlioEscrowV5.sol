// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import {SettlioWorkLedger} from "packages/contracts/renewable/SettlioWorkLedger.sol";

/// @notice Holds customer principal separately from the callback receiver's gas funds.
interface IERC20PrincipalV5 {
    function balanceOf(address) external view returns (uint256);
}

/// @notice Local renewable-ledger integration; not deployed or connected to a network receiver.
contract SettlioEscrowV5 {
    enum Status { Missing, AwaitingDeposit, DepositReceived, Confirmed, RefundPending, Refunded, Expired, Released }

    struct Quote {
        address merchant;
        address customer;
        uint256 total;
        uint256 deposit;
        uint64 expiresAt;
        uint64 refundCutoff;
        bytes32 termsHash;
        Status status;
        address asset;
        uint256 selectedOption;
    }

    struct PaymentOption { address asset; uint256 total; uint256 deposit; }

    error InvalidQuote();
    error Unauthorized();
    error WrongState();
    error DeadlinePassed();
    error WrongAmount();
    error TransferFailed();
    error ReentrantCall();

    address public immutable callbackReceiver;
    uint256 public quoteCount;
    uint256 public totalLiability;
    mapping(uint256 => Quote) private quotes;
    mapping(uint256 => PaymentOption[]) private options;
    mapping(address => uint256) public liability;
    bool private entered;
    uint256 public constant POLICY_VERSION = 5;
    SettlioWorkLedger public immutable admission;
    uint64 public immutable retryInterval;
    uint32 public immutable maxRetries;
    mapping(uint256 => uint32) public retryCount;
    mapping(uint256 => uint64) public retryAfter;
    event WorkRegistered(uint256 indexed quoteId, uint64 epoch, bytes32 profile);
    mapping(uint256 => bool) public automaticRelease;

    event QuoteCreated(uint256 indexed quoteId, address indexed merchant, address indexed customer, uint64 expiresAt, bytes32 termsHash);
    event DepositReceived(uint256 indexed quoteId, address indexed customer, uint256 amount);
    event AssetSelected(uint256 indexed quoteId, address indexed asset, uint256 optionIndex);
    event BookingConfirmed(uint256 indexed quoteId);
    event CancellationRequested(uint256 indexed quoteId);
    event Refunded(uint256 indexed quoteId, uint256 amount);
    event QuoteExpired(uint256 indexed quoteId);
    event Released(uint256 indexed quoteId, uint256 amount);
    event ConfirmationRequested(uint256 indexed quoteId);
    event PolicyRegistered(uint256 indexed quoteId, uint64 expiresAt, uint64 refundCutoff, bool automaticRelease);
    event PolicyRequested(uint256 indexed quoteId);
    event PolicyChecked(uint256 indexed quoteId, Status status);

    constructor(address receiver, address sponsor, uint32 workLimit, uint32 activeLimit,
        uint64 horizon, uint64 cooldown, uint32 retries) {
        if (receiver == address(0) || cooldown == 0 || retries == 0) revert InvalidQuote();
        callbackReceiver = receiver;
        admission = new SettlioWorkLedger(address(this), sponsor, receiver, workLimit, activeLimit, horizon);
        retryInterval = cooldown;
        maxRetries = retries;
    }

    modifier onlyCallback() {
        if (msg.sender != callbackReceiver) revert Unauthorized();
        _;
    }

    modifier nonReentrant() {
        if (entered) revert ReentrantCall();
        entered = true;
        _;
        entered = false;
    }

    /// @dev Grant identity is read and consumed in the same atomic creation transaction.
    function _admit(uint256 id, uint64 expiry, uint64 cutoff) private {
        (, , uint64 epoch, bytes32 profile) = admission.grants(msg.sender);
        admission.admit(id, msg.sender, epoch, profile, expiry, cutoff);
        emit WorkRegistered(id, epoch, profile);
    }

    /// @dev Shared finite participant retry budget; cancellation/claims never consume it.
    function _consumeRetry(uint256 id) private {
        if (retryCount[id] >= maxRetries || block.timestamp < retryAfter[id]) revert WrongState();
        uint256 next = block.timestamp + retryInterval;
        if (next > type(uint64).max) revert InvalidQuote();
        retryCount[id]++;
        retryAfter[id] = uint64(next);
    }

    function getQuote(uint256 id) external view returns (Quote memory) {
        return quotes[id];
    }

    function createQuote(address customer, uint256 total, uint256 deposit, uint64 expiresAt, uint64 refundCutoff, bytes32 termsHash)
        external returns (uint256 id)
    {
        if (customer == address(0) || customer == msg.sender || deposit == 0 || total < deposit
            || expiresAt <= block.timestamp || refundCutoff < expiresAt || termsHash == bytes32(0)) revert InvalidQuote();
        _admit(quoteCount + 1, expiresAt, refundCutoff);
        id = ++quoteCount;
        quotes[id] = Quote(msg.sender, customer, total, deposit, expiresAt, refundCutoff, termsHash, Status.AwaitingDeposit, address(0), 0);
        options[id].push(PaymentOption(address(0), total, deposit));
        emit QuoteCreated(id, msg.sender, customer, expiresAt, termsHash);
        emit PolicyRegistered(id, expiresAt, refundCutoff, false);
    }

    /// @notice Amounts are merchant-set alternatives, not automatic currency conversion.
    function createQuoteWithOptions(address customer, PaymentOption[] calldata choices, uint64 expiresAt,
        uint64 refundCutoff, bytes32 termsHash) external returns (uint256 id)
    {
        return _createWithOptions(customer, choices, expiresAt, refundCutoff, termsHash, false);
    }

    /// @notice New quotes opt into payout eligibility, not proof of service delivery.
    function createQuoteWithPolicy(address customer, PaymentOption[] calldata choices, uint64 expiresAt,
        uint64 refundCutoff, bytes32 termsHash, bool enableAutomaticRelease) external returns (uint256 id)
    {
        return _createWithOptions(customer, choices, expiresAt, refundCutoff, termsHash, enableAutomaticRelease);
    }

    function _createWithOptions(address customer, PaymentOption[] calldata choices, uint64 expiresAt,
        uint64 refundCutoff, bytes32 termsHash, bool enableAutomaticRelease) private returns (uint256 id)
    {
        if (customer == address(0) || customer == msg.sender || choices.length == 0 || choices.length > 3
            || expiresAt <= block.timestamp || refundCutoff < expiresAt || termsHash == bytes32(0)) revert InvalidQuote();
        _admit(quoteCount + 1, expiresAt, refundCutoff);
        id = ++quoteCount;
        for (uint256 i; i < choices.length; ++i) {
            PaymentOption calldata choice = choices[i];
            if (choice.deposit == 0 || choice.total < choice.deposit ||
                (choice.asset != address(0) && choice.asset.code.length == 0)) revert InvalidQuote();
            for (uint256 j; j < i; ++j) if (choices[j].asset == choice.asset) revert InvalidQuote();
            options[id].push(choice);
        }
        PaymentOption calldata first = choices[0];
        quotes[id] = Quote(msg.sender, customer, first.total, first.deposit, expiresAt, refundCutoff,
            termsHash, Status.AwaitingDeposit, first.asset, 0);
        automaticRelease[id] = enableAutomaticRelease;
        emit QuoteCreated(id, msg.sender, customer, expiresAt, termsHash);
        emit PolicyRegistered(id, expiresAt, refundCutoff, enableAutomaticRelease);
    }

    function getQuoteOptions(uint256 id) external view returns (PaymentOption[] memory) { return options[id]; }

    /// @notice Backward-compatible ETH entry point for the first option only.
    function payDeposit(uint256 id, bytes32 acceptedTermsHash) external payable nonReentrant {
        if (automaticRelease[id] || options[id].length == 0 || options[id][0].asset != address(0)) revert InvalidQuote();
        _pay(id, 0, acceptedTermsHash);
    }

    function payDepositOption(uint256 id, uint256 optionIndex, bytes32 acceptedTermsHash) external payable nonReentrant {
        if (automaticRelease[id]) revert InvalidQuote();
        _pay(id, optionIndex, acceptedTermsHash);
    }

    /// @notice Explicit customer consent to the immutable automatic-release flag.
    function payDepositWithPolicy(uint256 id, uint256 optionIndex, bytes32 acceptedTermsHash, bool acceptedAutomaticRelease)
        external payable nonReentrant
    {
        if (acceptedAutomaticRelease != automaticRelease[id]) revert InvalidQuote();
        _pay(id, optionIndex, acceptedTermsHash);
    }

    function _pay(uint256 id, uint256 optionIndex, bytes32 acceptedTermsHash) private {
        Quote storage quote = quotes[id];
        if (msg.sender != quote.customer) revert Unauthorized();
        if (quote.status != Status.AwaitingDeposit) revert WrongState();
        if (block.timestamp >= quote.expiresAt) revert DeadlinePassed();
        if (acceptedTermsHash != quote.termsHash || optionIndex >= options[id].length) revert InvalidQuote();
        PaymentOption memory choice = options[id][optionIndex];
        if (msg.value != (choice.asset == address(0) ? choice.deposit : 0)) revert WrongAmount();
        quote.status = Status.DepositReceived;
        quote.asset = choice.asset;
        quote.total = choice.total;
        quote.deposit = choice.deposit;
        quote.selectedOption = optionIndex;
        liability[choice.asset] += choice.deposit;
        if (choice.asset == address(0)) totalLiability += choice.deposit;
        else {
            uint256 beforeBalance = IERC20PrincipalV5(choice.asset).balanceOf(address(this));
            _tokenCall(choice.asset, abi.encodeWithSignature("transferFrom(address,address,uint256)", msg.sender, address(this), choice.deposit));
            if (IERC20PrincipalV5(choice.asset).balanceOf(address(this)) != beforeBalance + choice.deposit) revert WrongAmount();
        }
        emit AssetSelected(id, choice.asset, optionIndex);
        // Preserve the subscribed event signature for all payment assets.
        emit DepositReceived(id, msg.sender, choice.deposit);
    }

    function _tokenCall(address asset, bytes memory data) private {
        (bool ok, bytes memory result) = asset.call(data);
        if (!ok || (result.length != 0 && (result.length != 32 || !abi.decode(result, (bool))))) revert TransferFailed();
    }

    function _sendPrincipal(Quote storage quote, address recipient) private {
        liability[quote.asset] -= quote.deposit;
        if (quote.asset == address(0)) {
            totalLiability -= quote.deposit;
            (bool sent,) = payable(recipient).call{value: quote.deposit}("");
            if (!sent) revert TransferFailed();
        } else {
            uint256 beforeEscrow = IERC20PrincipalV5(quote.asset).balanceOf(address(this));
            uint256 beforeRecipient = IERC20PrincipalV5(quote.asset).balanceOf(recipient);
            _tokenCall(quote.asset, abi.encodeWithSignature("transfer(address,uint256)", recipient, quote.deposit));
            if (IERC20PrincipalV5(quote.asset).balanceOf(address(this)) != beforeEscrow - quote.deposit ||
                IERC20PrincipalV5(quote.asset).balanceOf(recipient) != beforeRecipient + quote.deposit) revert WrongAmount();
        }
    }

    function confirmBooking(uint256 id) public onlyCallback {
        Quote storage quote = quotes[id];
        if (quote.status != Status.DepositReceived) return;
        quote.status = Status.Confirmed;
        emit BookingConfirmed(id);
    }

    /// @notice Emits a fresh origin event so a failed callback can be requested again.
    function requestConfirmation(uint256 id) external {
        Quote storage quote = quotes[id];
        if (msg.sender != quote.customer && msg.sender != quote.merchant) revert Unauthorized();
        if (quote.status != Status.DepositReceived) revert WrongState();
        _consumeRetry(id);
        emit ConfirmationRequested(id);
    }

    function requestCancellation(uint256 id) external {
        Quote storage quote = quotes[id];
        if (msg.sender != quote.customer) revert Unauthorized();
        if (quote.status != Status.DepositReceived && quote.status != Status.Confirmed) revert WrongState();
        if (block.timestamp >= quote.refundCutoff) revert DeadlinePassed();
        quote.status = Status.RefundPending;
        emit CancellationRequested(id);
    }

    function refund(uint256 id) public onlyCallback nonReentrant {
        Quote storage quote = quotes[id];
        if (quote.status != Status.RefundPending) return;
        quote.status = Status.Refunded;
        _sendPrincipal(quote, quote.customer);
        admission.close(id);
        emit Refunded(id, quote.deposit);
    }

    /// @notice Recovery for an already reserved refund, independent of sponsor/retry availability.
    /// Cancellation eligibility was checked when RefundPending was recorded.
    function claimRefund(uint256 id) external nonReentrant {
        Quote storage quote = quotes[id];
        if (msg.sender != quote.customer) revert Unauthorized();
        if (quote.status != Status.RefundPending) revert WrongState();
        quote.status = Status.Refunded;
        _sendPrincipal(quote, quote.customer);
        admission.close(id);
        emit Refunded(id, quote.deposit);
    }

    function expire(uint256 id) public onlyCallback {
        Quote storage quote = quotes[id];
        if (quote.status != Status.AwaitingDeposit || block.timestamp < quote.expiresAt) return;
        quote.status = Status.Expired;
        admission.close(id);
        emit QuoteExpired(id);
    }

    /// @notice Fresh participant signal for a delayed/failed policy callback.
    function requestPolicy(uint256 id) external {
        Quote storage quote = quotes[id];
        if (msg.sender != quote.customer && msg.sender != quote.merchant) revert Unauthorized();
        if (quote.status == Status.Missing || quote.status == Status.Refunded ||
            quote.status == Status.Expired || quote.status == Status.Released) revert WrongState();
        _consumeRetry(id);
        emit PolicyRegistered(id, quote.expiresAt, quote.refundCutoff, automaticRelease[id]);
        emit PolicyRequested(id);
    }

    function releaseAutomatic(uint256 id) public onlyCallback nonReentrant {
        Quote storage quote = quotes[id];
        if (!automaticRelease[id] || quote.status != Status.Confirmed ||
            block.timestamp < quote.refundCutoff) return;
        quote.status = Status.Released;
        _sendPrincipal(quote, quote.merchant);
        admission.close(id);
        emit Released(id, quote.deposit);
    }

    /// @notice Destination state and timestamps override stale scheduler requests.
    /// Refund reservation always takes precedence over an otherwise due payout.
    function processPolicy(uint256 id) external onlyCallback {
        Status status = quotes[id].status;
        if (status == Status.Missing) revert InvalidQuote();
        if (status == Status.RefundPending) refund(id);
        else if (status == Status.AwaitingDeposit) expire(id);
        else if (status == Status.DepositReceived) confirmBooking(id);
        else if (status == Status.Confirmed) releaseAutomatic(id);
        emit PolicyChecked(id, quotes[id].status);
    }

    function release(uint256 id) external nonReentrant {
        Quote storage quote = quotes[id];
        if (msg.sender != quote.merchant) revert Unauthorized();
        if (quote.status != Status.Confirmed || block.timestamp < quote.refundCutoff) revert WrongState();
        quote.status = Status.Released;
        _sendPrincipal(quote, quote.merchant);
        admission.close(id);
        emit Released(id, quote.deposit);
    }
}
