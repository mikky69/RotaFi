// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./RotaFiCircle.sol";

/**
 * @title  RotaFiFactory
 * @notice Factory + registry for RotaFiCircle deployments.
 *
 *         Each call to createCircle() deploys a fresh RotaFiCircle contract.
 *         The factory keeps a registry of all deployed circle addresses and
 *         provides discovery functions (getAllCircles, getOpenCircles, getCirclesByMember).
 */
contract RotaFiFactory is Ownable {
    // ── Structs ────────────────────────────────────────────────────────────

    /// @dev Lightweight view returned by discovery queries
    struct CircleEntry {
        address circleAddress;
        string name;
        address admin;
        uint32 memberCap;
        uint32 memberCount;
        uint256 depositAmount;
        uint64 cycleSeconds;
        uint32 currentRound;
        uint32 totalRounds;
        bool isActive;
        address usdcAddress;
    }

    // ── State ──────────────────────────────────────────────────────────────

    /// @notice All deployed RotaFiCircle contract addresses, in creation order
    address[] public allCircles;

    /// @notice member address => circles they belong to
    mapping(address => address[]) private _memberCircles;

    /// @notice O(1) lookup: is this address a known RotaFiCircle deployed by this factory?
    mapping(address => bool) private _knownCircle;

    // ── Events ─────────────────────────────────────────────────────────────

    event CircleDeployed(
        address indexed circleAddress,
        address indexed admin,
        string name,
        uint32 memberCap,
        uint256 depositAmount,
        uint64 cycleSeconds
    );

    // ── Errors ─────────────────────────────────────────────────────────────
    error NotACircle(address addr);

    // ── Constructor ────────────────────────────────────────────────────────

    /// @param initialOwner Factory owner address (receives Ownable admin rights)
    constructor(address initialOwner) Ownable(initialOwner) {}

    // ── Write: createCircle ────────────────────────────────────────────────

    /**
     * @notice Deploy a new RotaFiCircle. Caller becomes the circle admin + first member.
     * @param name           Human-readable circle name (max 60 chars)
     * @param memberCap      Total seats (3–20). Equals totalRounds.
     * @param depositAmount  USDC base units per cycle (1 USDC = 1_000_000)
     * @param cycleSeconds   Seconds per round (e.g. 604800 = 1 week, 2592000 = 30 days)
     * @param usdcAddress    ERC20 USDC token address on this network
     * @return circle        Address of the newly deployed RotaFiCircle
     */
    function createCircle(
        string calldata name,
        uint32 memberCap,
        uint256 depositAmount,
        uint64 cycleSeconds,
        address usdcAddress
    ) external returns (address circle) {
        // Deploy — constructor validates all params and reverts with descriptive errors
        RotaFiCircle sc = new RotaFiCircle(
            name,
            memberCap,
            depositAmount,
            cycleSeconds,
            usdcAddress,
            msg.sender // admin + member #1
        );

        circle = address(sc);
        allCircles.push(circle);
        _knownCircle[circle] = true;
        _memberCircles[msg.sender].push(circle);

        emit CircleDeployed(
            circle,
            msg.sender,
            name,
            memberCap,
            depositAmount,
            cycleSeconds
        );
    }

    // ── Write: recordJoin ──────────────────────────────────────────────────

    /**
     * @notice Called by a member after successfully calling RotaFiCircle.joinCircle().
     *         Records the membership in the factory registry so getCirclesByMember() works.
     * @param circleAddress The RotaFiCircle contract they just joined
     *
     * @dev This is a convenience registry call — it does NOT join the circle.
     *      The user must call RotaFiCircle.joinCircle() first, then call this.
     *      Alternatively, the frontend can track membership off-chain via MemberJoined events.
     */
    function recordJoin(address circleAddress) external {
        if (!_knownCircle[circleAddress]) revert NotACircle(circleAddress);
        _memberCircles[msg.sender].push(circleAddress);
    }

    // ── Read: discovery ────────────────────────────────────────────────────

    /// @notice Total number of circles ever deployed
    function totalCircles() external view returns (uint256) {
        return allCircles.length;
    }

    /**
     * @notice Get a CircleEntry view for a single circle.
     * @param circleAddress Address of a deployed RotaFiCircle
     */
    function getCircle(
        address circleAddress
    ) external view returns (CircleEntry memory) {
        return _toEntry(circleAddress);
    }

    /**
     * @notice All circles with open spots (joinable).
     *         Iterates on-chain — designed for moderate circle counts (< 1000).
     *         For production at scale, use events + off-chain indexing.
     */
    function getOpenCircles() external view returns (CircleEntry[] memory) {
        uint256 count;
        for (uint256 i = 0; i < allCircles.length; i++) {
            RotaFiCircle sc = RotaFiCircle(allCircles[i]);
            if (sc.isActive() && sc.memberCount() < sc.memberCap()) count++;
        }

        CircleEntry[] memory result = new CircleEntry[](count);
        uint256 idx;
        for (uint256 i = 0; i < allCircles.length; i++) {
            RotaFiCircle sc = RotaFiCircle(allCircles[i]);
            if (sc.isActive() && sc.memberCount() < sc.memberCap()) {
                result[idx++] = _toEntry(allCircles[i]);
            }
        }
        return result;
    }

    /**
     * @notice All circles a member belongs to (from factory registry).
     * @param  member  Address to query
     * @return Array of RotaFiCircle contract addresses
     */
    function getCirclesByMember(
        address member
    ) external view returns (address[] memory) {
        return _memberCircles[member];
    }

    /// @notice Full list of all deployed circle addresses
    function getAllCircles() external view returns (address[] memory) {
        return allCircles;
    }

    // ── Internal helpers ───────────────────────────────────────────────────

    function _toEntry(
        address circleAddress
    ) internal view returns (CircleEntry memory entry) {
        RotaFiCircle sc = RotaFiCircle(circleAddress);
        RotaFiCircle.CircleInfo memory info = sc.getInfo();
        entry = CircleEntry({
            circleAddress: circleAddress,
            name: info.name,
            admin: info.admin,
            memberCap: info.memberCap,
            memberCount: info.memberCount,
            depositAmount: info.depositAmount,
            cycleSeconds: info.cycleSeconds,
            currentRound: info.currentRound,
            totalRounds: info.totalRounds,
            isActive: info.isActive,
            usdcAddress: info.usdcAddress
        });
    }
}
