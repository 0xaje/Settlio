// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import {AbstractReactive} from "@reactive/src/base/AbstractReactive.sol";
import {ISystemContract} from "@reactive/src/interfaces/ISystemContract.sol";

/// @notice Confirmation subscriber and bounded, acknowledgement-driven policy scheduler.
contract SettlioReactive is AbstractReactive {
    error Unauthorized();
    error InvalidConfiguration();
    address public immutable owner;
    uint256 public immutable originChain;
    address public originEscrow;
    address public callbackReceiver;
    uint256 public constant POLICY_VERSION = 3;
    uint64 public constant CALLBACK_GAS_LIMIT = 1_000_000;
    uint256 public constant DEPOSIT_TOPIC = uint256(keccak256("DepositReceived(uint256,address,uint256)"));
    uint256 public constant RETRY_TOPIC = uint256(keccak256("ConfirmationRequested(uint256)"));
    uint256 public constant POLICY_TOPIC = uint256(keccak256("PolicyRegistered(uint256,uint64,uint64,bool)"));
    uint256 public constant POLICY_RETRY_TOPIC = uint256(keccak256("PolicyRequested(uint256)"));
    uint256 public constant CANCEL_TOPIC = uint256(keccak256("CancellationRequested(uint256)"));
    uint256 public constant CONFIRMED_TOPIC = uint256(keccak256("BookingConfirmed(uint256)"));
    uint256 public constant CHECKED_TOPIC = uint256(keccak256("PolicyChecked(uint256,uint8)"));
    uint256 public constant REFUNDED_TOPIC = uint256(keccak256("Refunded(uint256,uint256)"));
    uint256 public constant EXPIRED_TOPIC = uint256(keccak256("QuoteExpired(uint256)"));
    uint256 public constant RELEASED_TOPIC = uint256(keccak256("Released(uint256,uint256)"));
    address public constant CRON_SOURCE = 0x0000000000000000000000000000000000fffFfF;
    uint256 public constant CRON_TOPIC = 0xb49937fb8970e19fd46d48f7e3fb00d659deac0347f79cd7cb542f0fc1503c70;
    uint256 public constant MAX_SCANS = 8;
    uint256 public constant MAX_REQUESTS = 2;
    uint8 public constant MAX_ATTEMPTS = 6;
    uint64 public constant RETRY_SECONDS = 60;

    struct Job {
        uint64 expiresAt;
        uint64 refundCutoff;
        uint64 nextAt;
        uint8 attempts;
        bool automaticRelease;
        bool registered;
        bool confirmed;
        bool cancelled;
        bool closed;
        bool needsAttention;
        bool retryRequested;
    }
    mapping(uint256 => Job) public jobs;
    mapping(bytes32 => bool) public processed;
    uint256[] private activeJobs;
    mapping(uint256 => uint256) private position;
    uint256 public queueCursor;
    bool public schedulerPaused;
    bool public cronSubscribed;

    event Configured(address indexed escrow, address indexed receiver);
    event ConfirmationCallbackRequested(uint256 indexed quoteId, bytes32 indexed originLog);
    event PolicyCallbackRequested(uint256 indexed quoteId, uint8 attempt);
    event PolicyRequestFailed(uint256 indexed quoteId, uint8 attempt);
    event PolicyNeedsAttention(uint256 indexed quoteId);
    event CronSubscriptionChanged(bool active);
    event SchedulerPaused(bool paused);

    constructor(uint256 chain) payable {
        if (chain == 0) revert InvalidConfiguration();
        owner = msg.sender;
        originChain = chain;
    }

    function configure(address escrow, address receiver) external {
        if (msg.sender != owner) revert Unauthorized();
        if (originEscrow != address(0) || escrow == address(0) || receiver == address(0)) revert InvalidConfiguration();
        originEscrow = escrow;
        callbackReceiver = receiver;
        uint256[10] memory topics = [DEPOSIT_TOPIC, RETRY_TOPIC, POLICY_TOPIC, POLICY_RETRY_TOPIC,
            CANCEL_TOPIC, CONFIRMED_TOPIC, CHECKED_TOPIC, REFUNDED_TOPIC, EXPIRED_TOPIC, RELEASED_TOPIC];
        for (uint256 i; i < topics.length; ++i) {
            SYSTEM.subscribe(originChain, escrow, topics[i], REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE);
        }
        emit Configured(escrow, receiver);
    }

    function activeJobCount() external view returns (uint256) { return activeJobs.length; }

    /// @notice Pausing stops charged CRON ticks, not origin observation or escrow safety checks.
    function setSchedulerPaused(bool paused) external {
        if (msg.sender != owner) revert Unauthorized();
        schedulerPaused = paused;
        if (!paused) _coverDebt();
        _syncCron();
        emit SchedulerPaused(paused);
    }

    function react(LogRecord calldata log) external onlySystem {
        if (originEscrow == address(0)) return;
        bytes32 originLog = keccak256(abi.encode(log.chainId, log.blockHash, log.txHash, log.logIndex));
        if (processed[originLog]) return;
        if (log.chainId == block.chainid && log.contractAddress == CRON_SOURCE && log.topic0 == CRON_TOPIC) {
            if (log.opCode != 1 || log.data.length != 32) return;
            processed[originLog] = true;
            if (cronSubscribed && !schedulerPaused) _tick();
            return;
        }
        if (log.chainId != originChain || log.contractAddress != originEscrow || log.topic1 == 0) return;
        if (log.topic0 == DEPOSIT_TOPIC || log.topic0 == RETRY_TOPIC) {
            if (log.topic0 == DEPOSIT_TOPIC) {
                if (log.opCode != 3 || log.data.length != 32 || log.topic2 > type(uint160).max) return;
                if (abi.decode(log.data, (uint256)) == 0) return;
            } else if (log.opCode != 2 || log.data.length != 0) return;
            processed[originLog] = true;
            SYSTEM.requestCallbackV_1_0(_configuration("confirmBooking(address,uint256)", log.topic1));
            emit ConfirmationCallbackRequested(log.topic1, originLog);
            return;
        }
        if (log.opCode != 2 || !_validPolicyShape(log)) return;
        processed[originLog] = true;
        _observePolicy(log);
    }

    function _validPolicyShape(LogRecord calldata log) private pure returns (bool) {
        uint256 topic = log.topic0;
        if (topic == POLICY_TOPIC) {
            if (log.data.length != 96) return false;
            (uint256 expiry, uint256 cutoff, uint256 automatic) = abi.decode(log.data, (uint256,uint256,uint256));
            return expiry > 0 && expiry <= cutoff && cutoff <= type(uint64).max && automatic <= 1;
        }
        if (topic == CHECKED_TOPIC) return log.data.length == 32 && abi.decode(log.data,(uint256)) <= 7;
        if (topic == REFUNDED_TOPIC || topic == RELEASED_TOPIC) return log.data.length == 32;
        return (topic == POLICY_RETRY_TOPIC || topic == CANCEL_TOPIC || topic == CONFIRMED_TOPIC || topic == EXPIRED_TOPIC)
            && log.data.length == 0;
    }

    function _observePolicy(LogRecord calldata log) private {
        uint256 id = log.topic1;
        Job storage job = jobs[id];
        if (job.closed) return; // Terminal state cannot be reopened by a delayed origin log.
        uint256 topic = log.topic0;
        if (topic == REFUNDED_TOPIC || topic == EXPIRED_TOPIC || topic == RELEASED_TOPIC) {
            job.closed = true;
            job.needsAttention = false;
            _remove(id);
            return;
        }
        if (topic == POLICY_TOPIC) {
            (uint64 expiry, uint64 cutoff, bool automatic) = abi.decode(log.data,(uint64,uint64,bool));
            if (job.registered) {
                if (job.expiresAt != expiry || job.refundCutoff != cutoff || job.automaticRelease != automatic) return;
            } else {
                job.registered = true;
                job.expiresAt = expiry;
                job.refundCutoff = cutoff;
                job.automaticRelease = automatic;
            }
        } else if (topic == POLICY_RETRY_TOPIC) {
            job.retryRequested = true;
        } else if (topic == CANCEL_TOPIC) {
            if (!job.cancelled) { job.cancelled = true; job.attempts = 0; job.needsAttention = false; }
        } else if (topic == CONFIRMED_TOPIC) {
            if (!job.confirmed) { job.confirmed = true; job.attempts = 0; job.needsAttention = false; }
        } else if (topic == CHECKED_TOPIC) {
            uint256 state = abi.decode(log.data,(uint256));
            if (state == 5 || state == 6 || state == 7) {
                job.closed = true;
                job.needsAttention = false;
                _remove(id);
                return;
            }
            if (state == 4 && !job.cancelled) { job.cancelled = true; job.attempts = 0; job.needsAttention = false; }
            if (state == 3 && !job.confirmed) { job.confirmed = true; job.attempts = 0; job.needsAttention = false; }
        }
        if (!job.registered) return; // Flags survive out-of-order registration.
        bool forceCheck = job.retryRequested;
        if (forceCheck) {
            job.retryRequested = false;
            job.needsAttention = false;
            job.attempts = 0;
        }
        if (job.needsAttention) return;
        if (job.confirmed && !job.automaticRelease && !job.cancelled) { _remove(id); return; }
        uint64 due = (job.cancelled || forceCheck) ? uint64(block.timestamp) : job.confirmed ? job.refundCutoff : job.expiresAt;
        // A no-op destination acknowledgement may reflect clock skew. Back off
        // rather than repeatedly requesting the same too-early destination action.
        if (topic == CHECKED_TOPIC && due <= block.timestamp) due = uint64(block.timestamp) + RETRY_SECONDS;
        _schedule(id, due);
    }

    function _schedule(uint256 id, uint64 due) private {
        if (position[id] == 0) { activeJobs.push(id); position[id] = activeJobs.length; }
        jobs[id].nextAt = due;
        _syncCron();
    }

    function _remove(uint256 id) private {
        uint256 pos = position[id];
        if (pos != 0) {
            uint256 last = activeJobs[activeJobs.length - 1];
            activeJobs[pos - 1] = last;
            position[last] = pos;
            activeJobs.pop();
            delete position[id];
            jobs[id].nextAt = 0;
            queueCursor = activeJobs.length == 0 ? 0 : queueCursor % activeJobs.length;
        }
        _syncCron();
    }

    function _tick() private {
        uint256 scanned;
        uint256 requested;
        uint256 budget = activeJobs.length < MAX_SCANS ? activeJobs.length : MAX_SCANS;
        while (scanned < budget && activeJobs.length > 0 && requested < MAX_REQUESTS) {
            queueCursor %= activeJobs.length;
            uint256 id = activeJobs[queueCursor];
            queueCursor = (queueCursor + 1) % activeJobs.length;
            ++scanned;
            Job storage job = jobs[id];
            if (block.timestamp < job.nextAt) continue;
            if (job.attempts >= MAX_ATTEMPTS) {
                job.needsAttention = true;
                _remove(id);
                emit PolicyNeedsAttention(id);
                continue;
            }
            ++job.attempts;
            ++requested;
            job.nextAt = uint64(block.timestamp) + RETRY_SECONDS * job.attempts;
            // A request is not delivery. Keep the job until origin completion is
            // observed, and isolate request rejection so other due jobs can run.
            try SYSTEM.requestCallbackV_1_0(_configuration("processPolicy(address,uint256)", id)) {
                emit PolicyCallbackRequested(id, job.attempts);
            } catch {
                emit PolicyRequestFailed(id, job.attempts);
            }
        }
    }

    function _syncCron() private {
        bool wanted = !schedulerPaused && activeJobs.length > 0;
        if (wanted == cronSubscribed) return;
        cronSubscribed = wanted;
        if (wanted) SYSTEM.subscribe(block.chainid, CRON_SOURCE, CRON_TOPIC, REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE);
        else SYSTEM.unsubscribe(block.chainid, CRON_SOURCE, CRON_TOPIC, REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE);
        emit CronSubscriptionChanged(wanted);
    }

    function _configuration(string memory signature, uint256 id)
        private view returns (ISystemContract.CallbackConfiguration_V_1_0 memory)
    {
        return ISystemContract.CallbackConfiguration_V_1_0({chainId: originChain, recipient: callbackReceiver,
            gasLimit: CALLBACK_GAS_LIMIT, payload: abi.encodeWithSignature(signature, address(0), id)});
    }

    function coverDebt() external { _coverDebt(); }
}
