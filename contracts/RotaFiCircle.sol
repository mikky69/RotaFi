// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title  RotaFiCircle
 * @notice One on-chain rotating savings circle (Ajo / Esusu / Chit Fund).
 *         Deployed per circle by RotaFiFactory.
 *
 * Lifecycle
 * ---------
 * 1. Deploy via RotaFiFactory  — creator = admin + member #1
 * 2. joinCircle()              — others join; round 1 auto-starts when memberCap is reached
 * 3. deposit()                 — each member pulls their USDC in (ERC20 transferFrom)
 * 4. triggerPayout()           — sends the full pot to the current round's recipient
 * 5. Repeat steps 3-4 for each round until all totalRounds are complete
 *
 * Security
 * --------
 * - ReentrancyGuard on deposit() and triggerPayout()
 * - SafeERC20 for all token transfers
 * - Pausable by DEFAULT_ADMIN_ROLE (deployer/factory) for emergency stop
 * - AccessControl roles: DEFAULT_ADMIN_ROLE (global pause), CIRCLE_ADMIN_ROLE (circle creator)
 * - CEI pattern: all state changes before external calls
 * - Custom errors (OZ v5 style) — cheaper than revert strings (~12% gas saving)
 */
contract RotaFiCircle is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ── Roles ──────────────────────────────────────────────────────────────
    bytes32 public constant CIRCLE_ADMIN_ROLE = keccak256("CIRCLE_ADMIN_ROLE");

    // ── Custom errors ──────────────────────────────────────────────────────
    error CircleFull();
    error AlreadyMember();
    error NotMember();
    error AlreadyDeposited();
    error CircleComplete();
    error CircleNotStarted();
    error RoundNotComplete();
    error InvalidParams(string reason);

    // ── Structs ────────────────────────────────────────────────────────────

    /// @dev Returned by getInfo() — full snapshot of the circle state
    struct CircleInfo {
        string  name;
        address admin;
        uint32  memberCap;
        uint32  memberCount;
        uint256 depositAmount;
        uint64  cycleSeconds;
        uint32  currentRound;
        uint32  totalRounds;
        bool    isActive;
        address usdcAddress;
        uint64  roundStartedAt;
    }

    /// @dev Returned by getCurrentRound()
    struct RoundView {
        uint32  roundIndex;
        address recipient;
        uint32  depositsIn;
        uint32  depositsNeeded;
        uint64  deadline;
    }

    /// @dev Stored on-chain for each completed round — avoids event-indexer dependency
    struct PayoutRecord {
        uint32  round;
        address recipient;
        uint256 amount;
        uint64  timestamp;
    }

    // ── Public state ───────────────────────────────────────────────────────
    string  public name;
    address public admin;
    uint32  public memberCap;
    uint32  public memberCount;
    uint256 public depositAmount;   // USDC base units (6 decimals)
    uint64  public cycleSeconds;
    uint32  public currentRound;    // 0 = filling phase; 1-based when active
    uint32  public totalRounds;     // == memberCap
    bool    public isActive;
    address public usdcAddress;
    uint64  public roundStartedAt;  // unix seconds

    // ── Private state ──────────────────────────────────────────────────────
    address[]  private _members;    // ordered join-sequence → payout position

    // round => member => deposited?
    mapping(uint32 => mapping(address => bool)) private _deposits;

    // On-chain payout records (one per completed round)
    PayoutRecord[] private _payoutHistory;

    // Late-payment flags (cleared on late deposit)
    mapping(address => bool) private _penalized;

    // ── Events ─────────────────────────────────────────────────────────────
    event MemberJoined(address indexed member, uint32 newMemberCount);
    event DepositMade(address indexed member, uint32 round);
    event PotPaidOut(address indexed recipient, uint256 amount, uint32 round);
    event MemberPenalized(address indexed member, uint32 round);
    event RoundStarted(uint32 indexed round, address indexed recipient, uint64 deadline);

    // ── Constructor ────────────────────────────────────────────────────────

    /**
     * @param _name           Human-readable circle name
     * @param _memberCap      Total seats (3–20). Equals totalRounds.
     * @param _depositAmount  USDC per cycle in base units (1 USDC = 1_000_000)
     * @param _cycleSeconds   Seconds per round (e.g. 604800 = 1 week)
     * @param _usdcAddress    ERC20 USDC token address on this network
     * @param _admin          Circle creator — given CIRCLE_ADMIN_ROLE
     */
    constructor(
        string memory _name,
        uint32        _memberCap,
        uint256       _depositAmount,
        uint64        _cycleSeconds,
        address       _usdcAddress,
        address       _admin
    ) {
        if (_memberCap < 3 || _memberCap > 20)  revert InvalidParams("memberCap must be 3-20");
        if (_depositAmount == 0)                 revert InvalidParams("depositAmount is 0");
        if (_cycleSeconds == 0)                  revert InvalidParams("cycleSeconds is 0");
        if (_usdcAddress == address(0))          revert InvalidParams("usdcAddress is zero");
        if (_admin == address(0))                revert InvalidParams("admin is zero");

        name          = _name;
        admin         = _admin;
        memberCap     = _memberCap;
        memberCount   = 1;
        depositAmount = _depositAmount;
        cycleSeconds  = _cycleSeconds;
        currentRound  = 0;
        totalRounds   = _memberCap;
        isActive      = true;
        usdcAddress   = _usdcAddress;
        roundStartedAt = 0;

        _members.push(_admin);

        // Grant roles — DEFAULT_ADMIN_ROLE allows pause/unpause
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(CIRCLE_ADMIN_ROLE,  _admin);
    }

    // ── Write: joinCircle ──────────────────────────────────────────────────

    /**
     * @notice Join this circle. Caller is appended to the payout rotation.
     *         When the last seat is filled, round 1 starts automatically.
     *         Requires prior ERC20 approval for at least depositAmount.
     */
    function joinCircle() external whenNotPaused {
        if (!isActive)                revert CircleComplete();
        if (memberCount >= memberCap) revert CircleFull();
        if (_isMember(msg.sender))    revert AlreadyMember();

        _members.push(msg.sender);
        memberCount++;

        // Last seat filled → start round 1
        if (memberCount == memberCap) {
            currentRound   = 1;
            roundStartedAt = uint64(block.timestamp);
            uint64 deadline = uint64(block.timestamp) + cycleSeconds;
            emit RoundStarted(1, _members[0], deadline);
        }

        emit MemberJoined(msg.sender, memberCount);
    }

    // ── Write: deposit ─────────────────────────────────────────────────────

    /**
     * @notice Deposit for the current round.
     *         Caller must have approved this contract for at least depositAmount
     *         on the USDC ERC20 contract before calling.
     */
    function deposit() external nonReentrant whenNotPaused {
        if (!isActive)                              revert CircleComplete();
        if (currentRound == 0)                      revert CircleNotStarted();
        if (!_isMember(msg.sender))                 revert NotMember();
        if (_deposits[currentRound][msg.sender])    revert AlreadyDeposited();

        // CEI: update state before external call
        _deposits[currentRound][msg.sender] = true;
        _penalized[msg.sender] = false; // clear late flag on deposit

        // Pull tokens from caller
        IERC20(usdcAddress).safeTransferFrom(msg.sender, address(this), depositAmount);

        emit DepositMade(msg.sender, currentRound);
    }

    // ── Write: flagLateMembers ─────────────────────────────────────────────

    /**
     * @notice Permissionlessly flag members who missed the deposit deadline.
     *         Can be called by anyone once the deadline has passed.
     *         Also called internally by triggerPayout().
     */
    function flagLateMembers() external {
        if (!isActive || currentRound == 0) return;
        if (block.timestamp <= roundStartedAt + cycleSeconds) return;
        _flagLate();
    }

    // ── Write: triggerPayout ───────────────────────────────────────────────

    /**
     * @notice Trigger payout to the current round's recipient.
     *         Can be called by any member once either:
     *           (a) all members have deposited, OR
     *           (b) the cycle deadline has passed.
     *         Pot = depositAmount × actual deposits received.
     *         Late members reduce the pot but do not block payout indefinitely.
     */
    function triggerPayout() external nonReentrant whenNotPaused {
        if (!isActive)              revert CircleComplete();
        if (currentRound == 0)      revert CircleNotStarted();
        if (!_isMember(msg.sender)) revert NotMember();

        uint64 deadline   = roundStartedAt + cycleSeconds;
        uint32 depositsIn = _countDeposits();
        bool   allIn      = depositsIn == memberCount;

        if (!allIn && block.timestamp < deadline) revert RoundNotComplete();

        address recipient = _members[currentRound - 1];

        // CEI: update all state before external token transfer
        uint32 closingRound = currentRound;
        _flagLate();

        if (currentRound >= totalRounds) {
            isActive = false;
        } else {
            currentRound++;
            roundStartedAt = uint64(block.timestamp);
            uint64 newDeadline = uint64(block.timestamp) + cycleSeconds;
            emit RoundStarted(currentRound, _members[currentRound - 1], newDeadline);
        }

        uint256 pot = depositAmount * depositsIn;

        // Store on-chain record (before external call is fine — state already updated)
        _payoutHistory.push(PayoutRecord({
            round:     closingRound,
            recipient: recipient,
            amount:    pot,
            timestamp: uint64(block.timestamp)
        }));

        emit PotPaidOut(recipient, pot, closingRound);

        // External call last (reentrancy guard active)
        if (pot > 0) {
            IERC20(usdcAddress).safeTransfer(recipient, pot);
        }
    }

    // ── Admin ──────────────────────────────────────────────────────────────

    /// @notice Emergency pause — blocks all write functions
    function pause()   external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }

    /// @notice Resume from pause
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }

    // ── Read: circle state ─────────────────────────────────────────────────

    /// @notice Full snapshot of circle state
    function getInfo() external view returns (CircleInfo memory) {
        return CircleInfo({
            name:          name,
            admin:         admin,
            memberCap:     memberCap,
            memberCount:   memberCount,
            depositAmount: depositAmount,
            cycleSeconds:  cycleSeconds,
            currentRound:  currentRound,
            totalRounds:   totalRounds,
            isActive:      isActive,
            usdcAddress:   usdcAddress,
            roundStartedAt: roundStartedAt
        });
    }

    /// @notice Current round details (zero-value struct if not started)
    function getCurrentRound() external view returns (RoundView memory) {
        if (currentRound == 0) return RoundView(0, address(0), 0, 0, 0);
        return RoundView({
            roundIndex:     currentRound,
            recipient:      _members[currentRound - 1],
            depositsIn:     _countDeposits(),
            depositsNeeded: memberCount,
            deadline:       roundStartedAt + cycleSeconds
        });
    }

    /// @notice Ordered member list — index 0 = first to receive the pot
    function getMembers() external view returns (address[] memory) {
        return _members;
    }

    /**
     * @notice Whether a member has deposited for the CURRENT round.
     * @param  member Address to check
     * @return true if deposited this round
     */
    function hasDeposited(address member) external view returns (bool) {
        if (currentRound == 0) return false;
        return _deposits[currentRound][member];
    }

    /**
     * @notice 1-based payout position of a member in the rotation.
     * @param  member Address to look up
     * @return position 1-based index, or 0 if not a member
     */
    function getMemberPosition(address member) external view returns (uint32) {
        for (uint256 i = 0; i < _members.length; i++) {
            if (_members[i] == member) return uint32(i + 1);
        }
        return 0;
    }

    /// @notice All completed round payouts stored on-chain
    function getPayoutHistory() external view returns (PayoutRecord[] memory) {
        return _payoutHistory;
    }

    /**
     * @notice Whether a member is currently penalized for a missed deposit.
     *         Cleared automatically when they deposit in a future round.
     */
    function isPenalized(address member) external view returns (bool) {
        return _penalized[member];
    }

    // ── Internal helpers ───────────────────────────────────────────────────

    function _isMember(address addr) internal view returns (bool) {
        for (uint256 i = 0; i < _members.length; i++) {
            if (_members[i] == addr) return true;
        }
        return false;
    }

    function _countDeposits() internal view returns (uint32 count) {
        for (uint256 i = 0; i < _members.length; i++) {
            if (_deposits[currentRound][_members[i]]) count++;
        }
    }

    /// @dev Flag all members who missed the deadline. Idempotent.
    function _flagLate() internal {
        if (block.timestamp <= roundStartedAt + cycleSeconds) return;
        uint32 round = currentRound;
        for (uint256 i = 0; i < _members.length; i++) {
            address member = _members[i];
            if (!_deposits[round][member] && !_penalized[member]) {
                _penalized[member] = true;
                emit MemberPenalized(member, round);
            }
        }
    }
}
