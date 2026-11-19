// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

/// @notice Holds customer principal separately from the callback receiver's gas funds.
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
    }

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
    bool private entered;

    event QuoteCreated(uint256 indexed quoteId, address indexed merchant, address indexed customer, uint64 expiresAt, bytes32 termsHash);
    event DepositReceived(uint256 indexed quoteId, address indexed customer, uint256 amount);
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
        quotes[id] = Quote(msg.sender, customer, total, deposit, expiresAt, refundCutoff, termsHash, Status.AwaitingDeposit);
        emit QuoteCreated(id, msg.sender, customer, expiresAt, termsHash);
    }

    /// @notice Payment accepts the immutable terms fingerprint displayed to the customer.
    function payDeposit(uint256 id, bytes32 acceptedTermsHash) external payable {
        Quote storage quote = quotes[id];
        if (msg.sender != quote.customer) revert Unauthorized();
        if (quote.status != Status.AwaitingDeposit) revert WrongState();
        if (block.timestamp >= quote.expiresAt) revert DeadlinePassed();
        if (acceptedTermsHash != quote.termsHash) revert InvalidQuote();
        if (msg.value != quote.deposit) revert WrongAmount();
        quote.status = Status.DepositReceived;
        totalLiability += msg.value;
        emit DepositReceived(id, msg.sender, msg.value);
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
        totalLiability -= quote.deposit;
        (bool sent,) = payable(quote.customer).call{value: quote.deposit}("");
        if (!sent) revert TransferFailed();
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
        totalLiability -= quote.deposit;
        (bool sent,) = payable(quote.merchant).call{value: quote.deposit}("");
        if (!sent) revert TransferFailed();
        emit Released(id, quote.deposit);
    }
}
