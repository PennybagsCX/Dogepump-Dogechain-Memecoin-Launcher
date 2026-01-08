// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DogePumpLPToken
 * @dev ERC-20 LP token representing share in a liquidity pool
 * @notice Only the pair contract can mint or burn LP tokens
 */
contract DogePumpLPToken is ERC20, Ownable {
    /// @notice Address of the pair contract that can mint/burn
    address public immutable pair;

    /// @notice Custom error for unauthorized minting
    error UnauthorizedMint();

    /// @notice Custom error for unauthorized burning
    error UnauthorizedBurn();

    /// @notice Custom error for zero address
    error ZeroAddress();

    /**
     * @dev Initializes the LP token
     * @param _pair Address of the pair contract
     */
    constructor(address _pair) ERC20("DogePump LP Token", "DPLP") Ownable(msg.sender) {
        if (_pair == address(0)) revert ZeroAddress();
        pair = _pair;
    }

    /**
     * @notice Mints LP tokens (restricted to pair contract)
     * @param to Address to mint tokens to
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external {
        if (msg.sender != pair) revert UnauthorizedMint();
        _mint(to, amount);
    }

    /**
     * @notice Burns LP tokens (restricted to pair contract)
     * @param from Address to burn tokens from
     * @param amount Amount to burn
     */
    function burn(address from, uint256 amount) external {
        if (msg.sender != pair) revert UnauthorizedBurn();
        _burn(from, amount);
    }
}
