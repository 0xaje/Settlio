// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import {AbstractReactive} from "@reactive/src/base/AbstractReactive.sol";
import {ISystemContract} from "@reactive/src/interfaces/ISystemContract.sol";

/// @notice Confirmation subscriber and bounded, acknowledgement-driven policy scheduler.
contract SettlioReactiveV5 is AbstractReactive {
    error Unauthorized();
    error InvalidConfiguration();
    address public immutable owner;
    uint256 public immutable originChain;
    address public originEscrow;
    address public callbackReceiver;
    address public workLedger;
    uint256 public constant WORK_TOPIC = uint256(keccak256("WorkRegistered(uint256,uint64,bytes32)"));
    uint256 public constant SETTLED_TOPIC = uint256(keccak256("Settled(uint256)"));
    uint256 public constant CLOSURE_RETRY_TOPIC = uint256(keccak256("ClosureAcknowledgementRequested(uint256,uint64,bytes32,uint8)"));
    uint8 public constant ACK_ATTEMPTS_PER_BATCH = 3;
    uint8 public constant MAX_ACK_RECOVERIES = 2;
    struct Closure {
        uint64 epoch;
        bytes32 profile;
        uint8 attempts;
        uint8 recoveries;
        bool known;
        bool settled;
        bool needsAttention;
        bool awaitingDelivery;
    }
    mapping(uint256 => Closure) public closures;
    event ClosureCallbackRequested(uint256 indexed quoteId, uint8 attempt);
    event ClosureRequestFailed(uint256 indexed quoteId, uint8 attempt);
    event ClosureNeedsAttention(uint256 indexed quoteId);
    uint256 public constant POLICY_VERSION = 5;
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
    uint256 public constant CRON1000_TOPIC = uint256(keccak256("Cron1000(uint256)"));
    uint256 public constant CRON10000_TOPIC = uint256(keccak256("Cron10000(uint256)"));
    // Candidate local profiles: public cadence/layout and lateness need review.
    uint64 public constant MEDIUM_WINDOW_SECONDS = 1800;
    uint64 public constant COARSE_WINDOW_SECONDS = 21600;
    bool public immutable adaptiveTimers;
    uint256 public currentCronTopic;
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
    bool public schedulerPaused;
    bool public cronSubscribed;

    event Configured(address indexed escrow, address indexed receiver);
    event ConfirmationCallbackRequested(uint256 indexed quoteId, bytes32 indexed originLog);
    event PolicyCallbackRequested(uint256 indexed quoteId, uint8 attempt);
    event PolicyRequestFailed(uint256 indexed quoteId, uint8 attempt);
    event PolicyNeedsAttention(uint256 indexed quoteId);
    event CronSubscriptionChanged(bool active);
    event SchedulerPaused(bool paused);
    event CronIntervalChanged(uint256 previousTopic, uint256 nextTopic);

    constructor(uint256 chain, bool enableAdaptiveTimers) payable {
        if (chain == 0) revert InvalidConfiguration();
        owner = msg.sender;
        originChain = chain;
        adaptiveTimers = enableAdaptiveTimers;
    }

    function configure(address escrow, address receiver, address ledger) external {
        if (msg.sender != owner) revert Unauthorized();
        if (originEscrow != address(0) || escrow == address(0) || receiver == address(0) || ledger == address(0) || ledger == escrow) revert InvalidConfiguration();
        originEscrow = escrow;
        callbackReceiver = receiver;
        workLedger = ledger;
        uint256[12] memory topics = [WORK_TOPIC, CLOSURE_RETRY_TOPIC, DEPOSIT_TOPIC, RETRY_TOPIC, POLICY_TOPIC, POLICY_RETRY_TOPIC,
            CANCEL_TOPIC, CONFIRMED_TOPIC, CHECKED_TOPIC, REFUNDED_TOPIC, EXPIRED_TOPIC, RELEASED_TOPIC];
        for (uint256 i; i < topics.length; ++i) {
            SYSTEM.subscribe(originChain, escrow, topics[i], REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE);
        }
        SYSTEM.subscribe(originChain, ledger, SETTLED_TOPIC, REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE);
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
        if (log.chainId == block.chainid && log.contractAddress == CRON_SOURCE && (log.topic0 == CRON_TOPIC || log.topic0 == CRON1000_TOPIC || log.topic0 == CRON10000_TOPIC)) {
            // Cron100(uint256 indexed number): signature + indexed block number, no data.
            if (log.opCode != 2 || log.data.length != 0 || log.topic2 != 0 || log.topic3 != 0) return;
            processed[originLog] = true;
            if (cronSubscribed && !schedulerPaused && log.topic0 == currentCronTopic) _tick();
            return;
        }
        if (log.chainId == originChain && log.contractAddress == workLedger && log.topic0 == SETTLED_TOPIC) {
            if (log.opCode != 2 || log.topic1 == 0 || log.topic2 != 0 || log.topic3 != 0 || log.data.length != 0) return;
            processed[originLog] = true;
            closures[log.topic1].settled = true;
            closures[log.topic1].needsAttention = false;
            closures[log.topic1].awaitingDelivery = false;
            jobs[log.topic1].closed = true;
            _remove(log.topic1);
            return;
        }
        if (log.chainId != originChain || log.contractAddress != originEscrow || log.topic1 == 0) return;
        if (log.topic2 != 0 || log.topic3 != 0) {
            if (log.topic0 != DEPOSIT_TOPIC) return;
        }
        if (log.topic0 == WORK_TOPIC || log.topic0 == CLOSURE_RETRY_TOPIC) {
            _observeWork(log, originLog);
            return;
        }
        if (log.topic0 == DEPOSIT_TOPIC || log.topic0 == RETRY_TOPIC) {
            if (log.topic0 == DEPOSIT_TOPIC) {
                if (log.opCode != 3 || log.data.length != 32 || log.topic3 != 0 || log.topic2 == 0 || log.topic2 > type(uint160).max) return;
                if (abi.decode(log.data, (uint256)) == 0) return;
            } else if (log.opCode != 2 || log.data.length != 0) return;
            processed[originLog] = true;
            if (jobs[log.topic1].closed) return;
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
            _closePolicy(id);
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
                _closePolicy(id);
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

    function _observeWork(LogRecord calldata log, bytes32 originLog) private {
        bool recovery = log.topic0 == CLOSURE_RETRY_TOPIC;
        if (log.opCode != 2 || log.topic2 != 0 || log.topic3 != 0 || log.data.length != (recovery ? 96 : 64)) return;
        uint256 epoch;
        bytes32 profile;
        uint256 number;
        if (recovery) (epoch, profile, number) = abi.decode(log.data, (uint256, bytes32, uint256));
        else (epoch, profile) = abi.decode(log.data, (uint256, bytes32));
        if (epoch == 0 || epoch > type(uint64).max || profile == bytes32(0) ||
            (recovery && (number == 0 || number > MAX_ACK_RECOVERIES))) return;
        Closure storage closure = closures[log.topic1];
        if (closure.known && (closure.epoch != epoch || closure.profile != profile)) return;
        processed[originLog] = true;
        bool newlyKnown = !closure.known;
        closure.known = true;
        closure.epoch = uint64(epoch);
        closure.profile = profile;
        if (recovery) {
            if (number <= closure.recoveries) return;
            closure.recoveries = uint8(number);
        } else if (!newlyKnown) return;
        // A real terminal-only recovery event can arrive before the terminal log.
        if (recovery) jobs[log.topic1].closed = true;
        if (jobs[log.topic1].closed) _queueClosure(log.topic1);
    }

    function _closePolicy(uint256 id) private {
        jobs[id].closed = true;
        jobs[id].needsAttention = false;
        _queueClosure(id);
    }

    function _queueClosure(uint256 id) private {
        Closure storage closure = closures[id];
        if (!closure.known || closure.settled) { _remove(id); return; }
        if (closure.attempts >= ACK_ATTEMPTS_PER_BATCH * (1 + closure.recoveries)) {
            closure.needsAttention = true;
            _remove(id);
            return;
        }
        closure.needsAttention = false;
        closure.awaitingDelivery = false;
        _schedule(id, uint64(block.timestamp));
    }

    function _requestClosure(uint256 id) private {
        Closure storage closure = closures[id];
        ++closure.attempts;
        _setNextAt(id, uint64(block.timestamp) + RETRY_SECONDS * closure.attempts);
        ISystemContract.CallbackConfiguration_V_1_0 memory config = ISystemContract.CallbackConfiguration_V_1_0({
            chainId: originChain, recipient: callbackReceiver, gasLimit: CALLBACK_GAS_LIMIT,
            payload: abi.encodeWithSignature("acknowledgeClosure(address,uint256,address,uint256,uint64,bytes32)",
                address(0), originChain, originEscrow, id, closure.epoch, closure.profile)
        });
        try SYSTEM.requestCallbackV_1_0(config) {
            // Stop autonomous source work before a successful destination ack can
            // free its reservation. Accepted is not delivered: Base keeps the
            // reservation until delivery, and only a finite origin recovery can
            // schedule another request if that delivery fails or remains missing.
            closure.awaitingDelivery = true;
            _remove(id);
            emit ClosureCallbackRequested(id, closure.attempts);
        }
        catch { emit ClosureRequestFailed(id, closure.attempts); }
    }

    /// @notice Root deadline is exact; no full queue scan is needed for timer choice.
    function earliestDue() external view returns (uint64) {
        return activeJobs.length == 0 ? 0 : jobs[activeJobs[0]].nextAt;
    }

    function _earlier(uint256 a, uint256 b) private view returns (bool) {
        return jobs[a].nextAt < jobs[b].nextAt || (jobs[a].nextAt == jobs[b].nextAt && a < b);
    }

    function _swap(uint256 a, uint256 b) private {
        uint256 first = activeJobs[a];
        activeJobs[a] = activeJobs[b];
        activeJobs[b] = first;
        position[activeJobs[a]] = a + 1;
        position[first] = b + 1;
    }

    function _repair(uint256 index) private {
        if (index > 0 && _earlier(activeJobs[index], activeJobs[(index - 1) / 2])) {
            while (index > 0) {
                uint256 parent = (index - 1) / 2;
                if (!_earlier(activeJobs[index], activeJobs[parent])) break;
                _swap(index, parent);
                index = parent;
            }
        } else {
            while (index * 2 + 1 < activeJobs.length) {
                uint256 child = index * 2 + 1;
                if (child + 1 < activeJobs.length && _earlier(activeJobs[child + 1], activeJobs[child])) ++child;
                if (!_earlier(activeJobs[child], activeJobs[index])) break;
                _swap(index, child);
                index = child;
            }
        }
    }

    function _setNextAt(uint256 id, uint64 due) private {
        jobs[id].nextAt = due;
        _repair(position[id] - 1);
    }

    function _schedule(uint256 id, uint64 due) private {
        if (position[id] == 0) { activeJobs.push(id); position[id] = activeJobs.length; }
        _setNextAt(id, due);
        _syncCron();
    }

    function _remove(uint256 id) private {
        uint256 pos = position[id];
        if (pos != 0) {
            uint256 index = pos - 1;
            uint256 last = activeJobs[activeJobs.length - 1];
            activeJobs[index] = last;
            position[last] = pos;
            activeJobs.pop();
            delete position[id];
            if (index < activeJobs.length) _repair(index);
            jobs[id].nextAt = 0;
        }
        _syncCron();
    }

    function _tick() private {
        uint256 scanned;
        uint256 requested;
        uint256 budget = activeJobs.length < MAX_SCANS ? activeJobs.length : MAX_SCANS;
        while (scanned < budget && activeJobs.length > 0 && requested < MAX_REQUESTS) {
            uint256 id = activeJobs[0];
            ++scanned;
            Job storage job = jobs[id];
            if (block.timestamp < job.nextAt) break;
            if (job.closed) {
                Closure storage closure = closures[id];
                if (!closure.known || closure.settled) { _remove(id); continue; }
                if (closure.attempts >= ACK_ATTEMPTS_PER_BATCH * (1 + closure.recoveries)) {
                    closure.needsAttention = true;
                    _remove(id);
                    emit ClosureNeedsAttention(id);
                    continue;
                }
                ++requested;
                _requestClosure(id);
                continue;
            }
            if (job.attempts >= MAX_ATTEMPTS) {
                job.needsAttention = true;
                _remove(id);
                emit PolicyNeedsAttention(id);
                continue;
            }
            ++job.attempts;
            ++requested;
            _setNextAt(id, uint64(block.timestamp) + RETRY_SECONDS * job.attempts);
            // A request is not delivery. Keep the job until origin completion is
            // observed, and isolate request rejection so other due jobs can run.
            try SYSTEM.requestCallbackV_1_0(_configuration("processPolicy(address,uint256)", id)) {
                emit PolicyCallbackRequested(id, job.attempts);
            } catch {
                emit PolicyRequestFailed(id, job.attempts);
            }
        }
        // Even a tick with no due jobs can move from a coarse to a finer tier.
        _syncCron();
    }

    function _syncCron() private {
        uint256 next;
        if (!schedulerPaused && activeJobs.length > 0) {
            uint64 due = jobs[activeJobs[0]].nextAt;
            next = CRON_TOPIC;
            if (adaptiveTimers && uint256(due) > block.timestamp + COARSE_WINDOW_SECONDS) next = CRON10000_TOPIC;
            else if (adaptiveTimers && uint256(due) > block.timestamp + MEDIUM_WINDOW_SECONDS) next = CRON1000_TOPIC;
        }
        if (next == currentCronTopic) return;
        uint256 previous = currentCronTopic;
        if (previous != 0) SYSTEM.unsubscribe(block.chainid, CRON_SOURCE, previous, REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE);
        currentCronTopic = next;
        cronSubscribed = next != 0;
        if (next != 0) SYSTEM.subscribe(block.chainid, CRON_SOURCE, next, REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE);
        if ((previous == 0) != (next == 0)) emit CronSubscriptionChanged(next != 0);
        emit CronIntervalChanged(previous, next);
    }

    function _configuration(string memory signature, uint256 id)
        private view returns (ISystemContract.CallbackConfiguration_V_1_0 memory)
    {
        return ISystemContract.CallbackConfiguration_V_1_0({chainId: originChain, recipient: callbackReceiver,
            gasLimit: CALLBACK_GAS_LIMIT, payload: abi.encodeWithSignature(signature, address(0), id)});
    }

    function coverDebt() external { _coverDebt(); }
}
