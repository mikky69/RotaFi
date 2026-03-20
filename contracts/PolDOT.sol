// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title  PolDOT
 * @notice Testnet DOT for RotaFi on Polkadot Hub Testnet.
 *         Mirrors native DOT decimals: 10.
 */
contract PolDOT is ERC20, Ownable {
    uint256 public constant FAUCET_AMOUNT = 100 * 1e10; // 100 DOT
    uint256 public constant FAUCET_COOLDOWN = 24 hours;

    mapping(address => uint256) private _lastFaucet;

    event FaucetClaimed(address indexed recipient, uint256 amount);

    constructor(
        address initialOwner
    ) ERC20("Polkadot Token", "DOT") Ownable(initialOwner) {
        // Mint 1M DOT to deployer for seeding / demo purposes
        _mint(initialOwner, 1_000_000 * 1e10);
    }

    /// @notice 10 decimals — matches native DOT
    function decimals() public pure override returns (uint8) {
        return 10;
    }

    /**
     * @notice Anyone can claim 100 DOT once per 24-hour period.
     */
    function faucet() external {
        require(
            block.timestamp >= _lastFaucet[msg.sender] + FAUCET_COOLDOWN,
            "PolDOT: faucet cooldown active (24h)"
        );
        _lastFaucet[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);
        emit FaucetClaimed(msg.sender, FAUCET_AMOUNT);
    }

    /**
     * @notice Owner can mint to any address.
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// @notice Seconds until a given address can use the faucet again (0 = now)
    function faucetCooldownRemaining(
        address user
    ) external view returns (uint256) {
        uint256 nextAvailable = _lastFaucet[user] + FAUCET_COOLDOWN;
        if (block.timestamp >= nextAvailable) return 0;
        return nextAvailable - block.timestamp;
    }
}
