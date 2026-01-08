// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IDogePumpPair
 * @dev Interface for DogePumpPair contract
 * @notice AMM pair contract implementing constant product formula (x * y = k)
 */
interface IDogePumpPair {
    /// @notice Emitted when liquidity is added
    /// @param sender Address that added liquidity
    /// @param amount0 Amount of token0 added
    /// @param amount1 Amount of token1 added
    event Mint(address indexed sender, uint amount0, uint amount1);

    /// @notice Emitted when liquidity is removed
    /// @param sender Address that removed liquidity
    /// @param amount0 Amount of token0 removed
    /// @param amount1 Amount of token1 removed
    /// @param to Address that received tokens
    event Burn(
        address indexed sender,
        uint amount0,
        uint amount1,
        address indexed to
    );

    /// @notice Emitted when a swap occurs
    /// @param sender Address that initiated swap
    /// @param amount0In Amount of token0 input
    /// @param amount1In Amount of token1 input
    /// @param amount0Out Amount of token0 output
    /// @param amount1Out Amount of token1 output
    /// @param to Address that received output tokens
    event Swap(
        address indexed sender,
        uint amount0In,
        uint amount1In,
        uint amount0Out,
        uint amount1Out,
        address indexed to
    );

    /// @notice Emitted when reserves are synced
    /// @param reserve0 New reserve0 value
    /// @param reserve1 New reserve1 value
    event Sync(uint112 reserve0, uint112 reserve1);

    /// @notice Initializes the pair with token addresses
    /// @param _token0 First token address
    /// @param _token1 Second token address
    function initialize(address _token0, address _token1) external;

    /// @notice Executes a token swap
    /// @param amount0Out Amount of token0 to output
    /// @param amount1Out Amount of token1 to output
    /// @param to Address to receive output tokens
    /// @param data Additional data for flash loan callback
    function swap(
        uint amount0Out,
        uint amount1Out,
        address to,
        bytes calldata data
    ) external;

    /// @notice Recovers excess tokens from the pair
    /// @param to Address to receive recovered tokens
    function skim(address to) external;

    /// @notice Syncs reserves with actual token balances
    function sync() external;

    /// @notice Returns current reserves and last update timestamp
    /// @return reserve0 Current reserve0
    /// @return reserve1 Current reserve1
    /// @return blockTimestampLast Last block timestamp
    function getReserves()
        external
        view
        returns (
            uint112 reserve0,
            uint112 reserve1,
            uint32 blockTimestampLast
        );

    /// @notice Returns the cumulative price of token0
    /// @return Cumulative price0 value
    function price0CumulativeLast() external view returns (uint);

    /// @notice Returns the cumulative price of token1
    /// @return Cumulative price1 value
    function price1CumulativeLast() external view returns (uint);

    /// @notice Returns the last k value (reserve0 * reserve1)
    /// @return Last k value
    function kLast() external view returns (uint);

    /// @notice Mints LP tokens for liquidity provider
    /// @param to Address to receive LP tokens
    /// @return liquidity Amount of LP tokens minted
    function mint(address to) external returns (uint liquidity);

    /// @notice Burns LP tokens and returns underlying tokens
    /// @param to Address to receive underlying tokens
    /// @return amount0 Amount of token0 returned
    /// @return amount1 Amount of token1 returned
    function burn(address to) external returns (uint amount0, uint amount1);

    /// @notice Returns the minimum liquidity amount
    /// @return Minimum liquidity value
    function MINIMUM_LIQUIDITY() external pure returns (uint);
}
