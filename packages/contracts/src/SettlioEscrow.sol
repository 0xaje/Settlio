// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

/// @notice Holds customer principal separately from the callback receiver's gas funds.
interface IERC20Principal {
    function balanceOf(address) external view returns (uint256);
}

contract SettlioEscrow {
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

    event QuoteCreated(uint256 indexed quoteId, address indexed merchant, address indexed customer, uint64 expiresAt, bytes32 termsHash);
    event DepositReceived(uint256 indexed quoteId, address indexed customer, uint256 amount);
    event AssetSelected(uint256 indexed quoteId, address indexed asset, uint256 optionIndex);
    event BookingConfirmed(uint256 indexed quoteId);
    event CancellationRequested(uint256 indexed quoteId);
    event Refunded(uint256 indexed quoteId, uint256 amount);
    event QuoteExpired(uint256 indexed quoteId);
    event Released(uint256 indexed quoteId, uint256 amount);
    event ConfirmationRequested(uint256 indexed quoteId);

    constructor(address receiver) {
        if (receiver == address(0)) revert InvalidQuote();
        callbackReceiver = receiver;
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

    function getQuote(uint256 id) external view returns (Quote memory) {
        return quotes[id];
    }

    function createQuote(address customer, uint256 total, uint256 deposit, uint64 expiresAt, uint64 refundCutoff, bytes32 termsHash)
        external returns (uint256 id)
    {
        if (customer == address(0) || customer == msg.sender || deposit == 0 || total < deposit
            || expiresAt <= block.timestamp || refundCutoff < expiresAt || termsHash == bytes32(0)) revert InvalidQuote();
        id = ++quoteCount;
        quotes[id] = Quote(msg.sender, customer, total, deposit, expiresAt, refundCutoff, termsHash, Status.AwaitingDeposit, address(0), 0);
        options[id].push(PaymentOption(address(0), total, deposit));
        emit QuoteCreated(id, msg.sender, customer, expiresAt, termsHash);
    }

    /// @notice Amounts are merchant-set alternatives, not automatic currency conversion.
    function createQuoteWithOptions(address customer, PaymentOption[] calldata choices, uint64 expiresAt,
        uint64 refundCutoff, bytes32 termsHash) external returns (uint256 id)
    {
        if (customer == address(0) || customer == msg.sender || choices.length == 0 || choices.length > 3
            || expiresAt <= block.timestamp || refundCutoff < expiresAt || termsHash == bytes32(0)) revert InvalidQuote();
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
        emit QuoteCreated(id, msg.sender, customer, expiresAt, termsHash);
    }

    function getQuoteOptions(uint256 id) external view returns (PaymentOption[] memory) { return options[id]; }

    /// @notice Backward-compatible ETH entry point for the first option only.
    function payDeposit(uint256 id, bytes32 acceptedTermsHash) external payable nonReentrant {
        if (options[id].length == 0 || options[id][0].asset != address(0)) revert InvalidQuote();
        _pay(id, 0, acceptedTermsHash);
    }

    function payDepositOption(uint256 id, uint256 optionIndex, bytes32 acceptedTermsHash) external payable nonReentrant {
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
            uint256 beforeBalance = IERC20Principal(choice.asset).balanceOf(address(this));
            _tokenCall(choice.asset, abi.encodeWithSignature("transferFrom(address,address,uint256)", msg.sender, address(this), choice.deposit));
            if (IERC20Principal(choice.asset).balanceOf(address(this)) != beforeBalance + choice.deposit) revert WrongAmount();
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
            uint256 beforeEscrow = IERC20Principal(quote.asset).balanceOf(address(this));
            uint256 beforeRecipient = IERC20Principal(quote.asset).balanceOf(recipient);
            _tokenCall(quote.asset, abi.encodeWithSignature("transfer(address,uint256)", recipient, quote.deposit));
            if (IERC20Principal(quote.asset).balanceOf(address(this)) != beforeEscrow - quote.deposit ||
                IERC20Principal(quote.asset).balanceOf(recipient) != beforeRecipient + quote.deposit) revert WrongAmount();
        }
    }

    function confirmBooking(uint256 id) external onlyCallback {
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

    function refund(uint256 id) external onlyCallback nonReentrant {
        Quote storage quote = quotes[id];
        if (quote.status != Status.RefundPending) return;
        quote.status = Status.Refunded;
        _sendPrincipal(quote, quote.customer);
        emit Refunded(id, quote.deposit);
    }

    function expire(uint256 id) external onlyCallback {
        Quote storage quote = quotes[id];
        if (quote.status != Status.AwaitingDeposit || block.timestamp < quote.expiresAt) return;
        quote.status = Status.Expired;
        emit QuoteExpired(id);
    }

    function release(uint256 id) external nonReentrant {
        Quote storage quote = quotes[id];
        if (msg.sender != quote.merchant) revert Unauthorized();
        if (quote.status != Status.Confirmed || block.timestamp < quote.refundCutoff) revert WrongState();
        quote.status = Status.Released;
        _sendPrincipal(quote, quote.merchant);
        emit Released(id, quote.deposit);
    }
}
