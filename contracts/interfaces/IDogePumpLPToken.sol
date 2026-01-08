// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IDogePumpLPToken
 * @dev Interface for DogePumpLPToken contract
 * @notice ERC-20 LP token representing share in a liquidity pool
 */
interface IDogePumpLPToken {
    /// @notice Returns the name of the token
    /// @return Token name
    function name() external view returns (string memory);

    /// @notice Returns the symbol of the token
    /// @return Token symbol
    function symbol() external view returns (string memory);

    /// @notice Returns the number of decimals used to get its user representation
    /// @return Number of decimals
    function decimals() external view returns (uint8);

    /// @notice Returns the total token supply
    /// @return Total supply
    function totalSupply() external view returns (uint256);

    /// @notice Returns the amount of tokens owned by an account
    /// @param account Address to query balance for
    /// @return Token balance of account
    function balanceOf(address account) external view returns (uint256);

    /// @notice Transfers tokens to a specified address
    /// @param to Address to transfer to
    /// @param amount Amount to transfer
    /// @return Success status
    function transfer(address to, uint256 amount) external returns (bool);

    /// @notice Approves an address to spend tokens on behalf of the caller
    /// @param spender Address to approve
    /// @param amount Amount to approve
    /// @return Success status
    function approve(address spender, uint256 amount) external returns (bool);

    /// @notice Returns the remaining number of tokens that spender can spend on behalf of owner
    /// @param owner Address that owns the tokens
    /// @param spender Address allowed to spend
    /// @return Remaining allowance
    function allowance(address owner, address spender)
        external
        view
        returns (uint256);

    /// @notice Transfers tokens from one address to another using allowance
    /// @param from Address to transfer from
    /// @param to Address to transfer to
    /// @param amount Amount to transfer
    /// @return Success status
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);

    /// @notice Increases the allowance granted to spender
    /// @param spender Address to increase allowance for
    /// @param addedValue Amount to increase allowance by
    /// @return New allowance
    function increaseAllowance(address spender, uint256 addedValue)
        external
        returns (bool);

    /// @notice Decreases the allowance granted to spender
    /// @param spender Address to decrease allowance for
    /// @param subtractedValue Amount to decrease allowance by
    /// @return New allowance
    function decreaseAllowance(address spender, uint256 subtractedValue)
        external
        returns (bool);

    /// @notice Mints new tokens (restricted to pair contract)
    /// @param to Address to mint tokens to
    /// @param amount Amount to mint
    function mint(address to, uint256 amount) external;

    /// @notice Burns tokens (restricted to pair contract)
    /// @param from Address to burn tokens from
    /// @param amount Amount to burn
    function burn(address from, uint256 amount) external;
}
