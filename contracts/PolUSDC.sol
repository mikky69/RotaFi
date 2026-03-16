// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title  PolUSDC
 * @notice Testnet stablecoin for RotaFi on Polkadot Hub Testnet.
 *         Mirrors USDC conventions: 6 decimals, symbol USDC.
 *
 *         On mainnet, replace with the real USDC/USDT ERC20 address
 *         available via Polkadot Asset Hub's ERC20 precompile.
 *
 * Faucet
 * ------
 *  Anyone can call faucet() to receive 1000 USDC (testnet only).
 *  Owner can mint arbitrary amounts for seeding demo circles.
 */
contract PolUSDC is ERC20, Ownable {
    uint256 public constant FAUCET_AMOUNT = 1_000 * 1e6; // 1,000 USDC
    uint256 public constant FAUCET_COOLDOWN = 24 hours;

    mapping(address => uint256) private _lastFaucet;

    event FaucetClaimed(address indexed recipient, uint256 amount);

    constructor(
        address initialOwner
    ) ERC20("Polkadot USD Coin", "USDC") Ownable(initialOwner) {
        // Mint 10M USDC to deployer for seeding / demo purposes
        _mint(initialOwner, 10_000_000 * 1e6);
    }

    /// @notice 6 decimals — matches real USDC
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /**
     * @notice Anyone can claim 1,000 USDC once per 24-hour period.
     *         Judges and testers can self-serve without needing the deployer.
     */
    function faucet() external {
        require(
            block.timestamp >= _lastFaucet[msg.sender] + FAUCET_COOLDOWN,
            "PolUSDC: faucet cooldown active (24h)"
        );
        _lastFaucet[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);
        emit FaucetClaimed(msg.sender, FAUCET_AMOUNT);
    }

    /**
     * @notice Owner can mint to any address (for seeding demo circles).
     * @param to     Recipient address
     * @param amount Amount in base units (1 USDC = 1_000_000)
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
