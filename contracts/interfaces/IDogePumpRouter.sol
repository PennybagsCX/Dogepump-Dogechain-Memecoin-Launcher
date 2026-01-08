// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IDogePumpRouter
 * @dev Interface for DogePumpRouter contract
 * @notice Router contract for facilitating swaps and liquidity operations
 */
interface IDogePumpRouter {
    /// @notice Returns the factory contract address
    /// @return Factory address
    function factory() external view returns (address);
    
    /// @notice Returns the wrapped native token address (WDC)
    /// @return WDC token address
    function WDC() external view returns (address);

    /// @notice Adds liquidity to a pair
    /// @param tokenA Address of first token
    /// @param tokenB Address of second token
    /// @param amountADesired Desired amount of tokenA
    /// @param amountBDesired Desired amount of tokenB
    /// @param amountAMin Minimum amount of tokenA
    /// @param amountBMin Minimum amount of tokenB
    /// @param to Address to receive LP tokens
    /// @param deadline Transaction deadline timestamp
    /// @return amountA Actual amount of tokenA added
    /// @return amountB Actual amount of tokenB added
    /// @return liquidity Amount of LP tokens received
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB, uint liquidity);

    /// @notice Removes liquidity from a pair
    /// @param tokenA Address of first token
    /// @param tokenB Address of second token
    /// @param liquidity Amount of LP tokens to burn
    /// @param amountAMin Minimum amount of tokenA to receive
    /// @param amountBMin Minimum amount of tokenB to receive
    /// @param to Address to receive underlying tokens
    /// @param deadline Transaction deadline timestamp
    /// @return amountA Amount of tokenA received
    /// @return amountB Amount of tokenB received
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB);

    /// @notice Swaps exact input tokens for minimum output tokens
    /// @param amountIn Exact amount of input tokens
    /// @param amountOutMin Minimum amount of output tokens
    /// @param path Array of token addresses for swap route
    /// @param to Address to receive output tokens
    /// @param deadline Transaction deadline timestamp
    /// @return amounts Array of token amounts for each step
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    /// @notice Swaps tokens for exact output tokens with maximum input
    /// @param amountOut Exact amount of output tokens desired
    /// @param amountInMax Maximum amount of input tokens
    /// @param path Array of token addresses for swap route
    /// @param to Address to receive output tokens
    /// @param deadline Transaction deadline timestamp
    /// @return amounts Array of token amounts for each step
    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    /// @notice Swaps exact native tokens for output tokens
    /// @param amountOutMin Minimum amount of output tokens
    /// @param path Array of token addresses for swap route
    /// @param to Address to receive output tokens
    /// @param deadline Transaction deadline timestamp
    /// @return amounts Array of token amounts for each step
    function swapExactETHForTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable returns (uint[] memory amounts);

    /// @notice Swaps tokens for exact native tokens output
    /// @param amountOut Exact amount of native tokens desired
    /// @param amountInMax Maximum amount of input tokens
    /// @param path Array of token addresses for swap route
    /// @param to Address to receive native tokens
    /// @param deadline Transaction deadline timestamp
    /// @return amounts Array of token amounts for each step
    function swapTokensForExactETH(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    /// @notice Swaps exact tokens for native tokens
    /// @param amountIn Exact amount of input tokens
    /// @param amountOutMin Minimum amount of native tokens
    /// @param path Array of token addresses for swap route
    /// @param to Address to receive native tokens
    /// @param deadline Transaction deadline timestamp
    /// @return amounts Array of token amounts for each step
    function swapExactTokensForETH(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    /// @notice Calculates output amounts for a given input amount and path
    /// @param amountIn Input token amount
    /// @param path Array of token addresses for swap route
    /// @return amounts Array of output amounts for each step
    function getAmountsOut(uint amountIn, address[] calldata path)
        external
        view
        returns (uint[] memory amounts);

    /// @notice Calculates input amounts for a given output amount and path
    /// @param amountOut Output token amount
    /// @param path Array of token addresses for swap route
    /// @return amounts Array of input amounts for each step
    function getAmountsIn(uint amountOut, address[] calldata path)
        external
        view
        returns (uint[] memory amounts);

    /// @notice Quotes output amount for a given input amount
    /// @param amountA Input amount
    /// @param reserveA Reserve of input token
    /// @param reserveB Reserve of output token
    /// @return amountB Output amount
    function quote(
        uint amountA,
        uint reserveA,
        uint reserveB
    ) external pure returns (uint amountB);
}
