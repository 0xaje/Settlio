// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

/// @notice Finite sponsored-work ledger for a future escrow deployment.
/// Funding observations are sponsor attestations, not cross-chain reserve proofs.
/// This contract never receives customer principal or grants access to it.
contract SettlioAdmission {
    error Unauthorized();
    error InvalidConfiguration();
    error AdmissionClosed();
    error CapacityExceeded();
    error InvalidGrant();
    error InvalidJob();
    error RetryUnavailable();

    struct Grant { uint32 remaining; uint64 validUntil; bytes32 fundingObservation; }
    struct Job { bool admitted; bool closed; uint32 retries; uint64 retryAfter; }
    address public immutable escrow;
    address public immutable sponsor;
    uint32 public immutable maxActive;
    uint32 public immutable maxLifetimeAdmissions;
    uint64 public immutable maxHorizon;
    uint64 public immutable retryInterval;
    uint32 public immutable maxRetries;
    uint32 public active;
    uint32 public reserved;
    uint32 public admitted;
    bool public open;
    mapping(address => Grant) public grants;
    mapping(uint256 => Job) public jobs;

    event AdmissionOpened(bool open);
    event GrantSet(address indexed merchant, uint32 credits, uint64 validUntil, bytes32 fundingObservation);
    event GrantExpired(address indexed merchant, uint32 credits);
    event Admitted(uint256 indexed quoteId, address indexed merchant, uint64 cutoff, bytes32 fundingObservation);
    event Closed(uint256 indexed quoteId);
    event RetryConsumed(uint256 indexed quoteId, uint32 count, uint64 retryAfter);

    constructor(address consumer, address issuer, uint32 capacity, uint32 lifetimeLimit,
        uint64 horizon, uint64 cooldown, uint32 retries)
    {
        if (consumer == address(0) || issuer == address(0) || capacity == 0 ||
            lifetimeLimit < capacity || horizon == 0 || cooldown == 0 || retries == 0) {
            revert InvalidConfiguration();
        }
        escrow = consumer;
        sponsor = issuer;
        maxActive = capacity;
        maxLifetimeAdmissions = lifetimeLimit;
        maxHorizon = horizon;
        retryInterval = cooldown;
        maxRetries = retries;
    }

    modifier onlyEscrow() { if (msg.sender != escrow) revert Unauthorized(); _; }
    modifier onlySponsor() { if (msg.sender != sponsor) revert Unauthorized(); _; }

    /// @notice Closing admission does not stop existing jobs, refunds or retries.
    function setOpen(bool enabled) external onlySponsor {
        open = enabled;
        emit AdmissionOpened(enabled);
    }

    /// @notice Replaces unused credits; never replenishes consumed lifetime capacity.
    /// The sponsor must check real source/destination funding before attesting.
    function setGrant(address merchant, uint32 credits, uint64 validUntil, bytes32 observation)
        external onlySponsor
    {
        if (merchant == address(0) || (credits != 0 &&
            (validUntil <= block.timestamp || observation == bytes32(0)))) revert InvalidGrant();
        uint256 nextReserved = uint256(reserved) - grants[merchant].remaining + credits;
        if (nextReserved + active > maxActive || nextReserved + admitted > maxLifetimeAdmissions) {
            revert CapacityExceeded();
        }
        reserved = uint32(nextReserved);
        grants[merchant] = Grant(credits, validUntil, observation);
        emit GrantSet(merchant, credits, validUntil, observation);
    }

    /// @notice Expired unused grants can be reclaimed by anyone, never active jobs.
    function expireGrant(address merchant) external {
        Grant storage grant = grants[merchant];
        if (grant.remaining == 0 || block.timestamp < grant.validUntil) revert InvalidGrant();
        uint32 credits = grant.remaining;
        reserved -= credits;
        delete grants[merchant];
        emit GrantExpired(merchant, credits);
    }

    function admit(uint256 id, address merchant, uint64 expiry, uint64 cutoff) external onlyEscrow {
        if (!open) revert AdmissionClosed();
        if (id == 0 || jobs[id].admitted || expiry <= block.timestamp || cutoff < expiry ||
            uint256(cutoff) > block.timestamp + maxHorizon) revert InvalidJob();
        Grant storage grant = grants[merchant];
        if (grant.remaining == 0 || block.timestamp >= grant.validUntil) revert InvalidGrant();
        if (active >= maxActive || admitted >= maxLifetimeAdmissions) revert CapacityExceeded();
        grant.remaining--;
        reserved--;
        active++;
        admitted++;
        jobs[id] = Job(true, false, 0, 0);
        emit Admitted(id, merchant, cutoff, grant.fundingObservation);
    }

    /// @notice The integrated escrow must call only after a successful terminal transition.
    /// Repeated terminal callbacks cannot free capacity twice.
    function close(uint256 id) external onlyEscrow {
        Job storage job = jobs[id];
        if (!job.admitted) revert InvalidJob();
        if (job.closed) return;
        job.closed = true;
        active--;
        emit Closed(id);
    }

    /// @notice Share this budget across confirmation and policy retries. Never gate cancellation.
    function consumeRetry(uint256 id) external onlyEscrow {
        Job storage job = jobs[id];
        if (!job.admitted || job.closed) revert InvalidJob();
        if (job.retries >= maxRetries || block.timestamp < job.retryAfter) revert RetryUnavailable();
        job.retries++;
        // A timestamp beyond uint64 cannot be represented safely in the ledger.
        uint256 next = block.timestamp + retryInterval;
        if (next > type(uint64).max) revert RetryUnavailable();
        job.retryAfter = uint64(next);
        emit RetryConsumed(id, job.retries, job.retryAfter);
    }
}
