// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

/// @notice Standalone sponsored-work accounting. Not integrated or deployed.
/// Funding references are sponsor attestations, never cross-chain reserve proofs.
/// The immutable receiver must authenticate source closure before calling acknowledge.
contract SettlioWorkLedger {
    error Unauthorized();
    error InvalidInput();
    error CapacityExceeded();
    error AdmissionUnavailable();
    error UnknownJob();

    struct Grant { uint32 remaining; uint64 expires; uint64 epoch; bytes32 profile; }
    struct Job {
        address merchant;
        uint64 epoch;
        bytes32 profile;
        bool terminal;
        bool acknowledged;
        bool settled;
    }

    address public immutable escrow;
    address public immutable sponsor;
    address public immutable receiver;
    uint32 public immutable maxWork;
    uint32 public immutable maxActive;
    uint64 public immutable maxHorizon;
    uint32 public reserved;
    uint32 public unsettled;
    uint32 public active;
    uint256 public totalAdmitted;
    bool public open;
    mapping(address => Grant) public grants;
    mapping(uint256 => Job) public jobs;

    event GrantSet(address indexed merchant, uint64 epoch, uint32 credits, uint64 expires, bytes32 profile, bytes32 observation);
    event GrantExpired(address indexed merchant, uint64 epoch, uint32 unused);
    event OpenChanged(bool open);
    event Admitted(uint256 indexed id, address indexed merchant, uint64 epoch, bytes32 profile);
    event DestinationClosed(uint256 indexed id);
    event SourceAcknowledged(uint256 indexed id);
    event Settled(uint256 indexed id);

    constructor(address consumer, address issuer, address callback, uint32 workLimit, uint32 activeLimit, uint64 horizon) {
        if (consumer == address(0) || issuer == address(0) || callback == address(0) ||
            workLimit == 0 || activeLimit == 0 || activeLimit > workLimit || horizon == 0) revert InvalidInput();
        escrow = consumer; sponsor = issuer; receiver = callback;
        maxWork = workLimit; maxActive = activeLimit; maxHorizon = horizon;
    }

    modifier onlyEscrow() { if (msg.sender != escrow) revert Unauthorized(); _; }
    modifier onlySponsor() { if (msg.sender != sponsor) revert Unauthorized(); _; }

    function setOpen(bool enabled) external onlySponsor {
        open = enabled;
        emit OpenChanged(enabled);
    }

    /// @dev Replaces only unused credits. Epochs never reset, even after expiry.
    function setGrant(address merchant, uint64 epoch, uint32 credits, uint64 expires,
        bytes32 profile, bytes32 observation) external onlySponsor
    {
        Grant storage previous = grants[merchant];
        if (merchant == address(0) || epoch <= previous.epoch ||
            (credits != 0 && (expires <= block.timestamp || profile == bytes32(0) || observation == bytes32(0)))) revert InvalidInput();
        uint256 nextReserved = uint256(reserved) - previous.remaining + credits;
        if (nextReserved + unsettled > maxWork) revert CapacityExceeded();
        reserved = uint32(nextReserved);
        grants[merchant] = Grant(credits, expires, epoch, profile);
        emit GrantSet(merchant, epoch, credits, expires, profile, observation);
    }

    function expireGrant(address merchant) external {
        Grant storage grant = grants[merchant];
        if (grant.remaining == 0 || block.timestamp < grant.expires) revert InvalidInput();
        uint32 unused = grant.remaining;
        reserved -= unused;
        grant.remaining = 0;
        emit GrantExpired(merchant, grant.epoch, unused);
    }

    function admit(uint256 id, address merchant, uint64 epoch, bytes32 profile, uint64 expiry, uint64 cutoff) external onlyEscrow {
        Grant storage grant = grants[merchant];
        if (!open || grant.remaining == 0 || block.timestamp >= grant.expires) revert AdmissionUnavailable();
        if (id == 0 || jobs[id].merchant != address(0) || epoch != grant.epoch || profile != grant.profile ||
            expiry <= block.timestamp || cutoff < expiry || uint256(cutoff) > block.timestamp + maxHorizon) revert InvalidInput();
        if (active >= maxActive) revert CapacityExceeded();
        grant.remaining--; reserved--; unsettled++; active++; totalAdmitted++;
        jobs[id] = Job(merchant, epoch, profile, false, false, false);
        emit Admitted(id, merchant, epoch, profile);
    }

    /// @dev Called atomically with a successful destination terminal transition.
    function close(uint256 id) external onlyEscrow {
        Job storage job = jobs[id];
        if (job.merchant == address(0)) revert UnknownJob();
        if (job.terminal) return;
        job.terminal = true;
        active--;
        emit DestinationClosed(id);
        settle(id, job);
    }

    /// @dev Early valid acknowledgements are retained, never enough to free work alone.
    /// Chain/deployment/source authentication belongs to the immutable receiver.
    function acknowledge(uint256 id, uint64 epoch, bytes32 profile) external {
        if (msg.sender != receiver) revert Unauthorized();
        Job storage job = jobs[id];
        if (job.merchant == address(0)) revert UnknownJob();
        if (job.epoch != epoch || job.profile != profile) revert InvalidInput();
        if (job.acknowledged) return;
        job.acknowledged = true;
        emit SourceAcknowledged(id);
        settle(id, job);
    }

    function settle(uint256 id, Job storage job) private {
        if (!job.terminal || !job.acknowledged || job.settled) return;
        job.settled = true;
        unsettled--;
        emit Settled(id);
    }
}
