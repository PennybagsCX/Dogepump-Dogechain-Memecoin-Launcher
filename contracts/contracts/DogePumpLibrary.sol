// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title DogePumpLibrary
 * @dev Library for DEX operations and calculations
 * @notice Provides helper functions for swaps and routing
 */
library DogePumpLibrary {
    /**
     * @notice Custom error for identical addresses
     * @dev Reverts if tokenA equals tokenB
     */
    error IdenticalAddresses();

    /**
     * @notice Custom error for zero address
     * @dev Reverts if address is zero
     */
    error ZeroAddress();

    /**
     * @notice Custom error for insufficient amount
     * @dev Reverts if amount is zero
     */
    error InsufficientAmount();

    /**
     * @notice Custom error for insufficient liquidity
     * @dev Reverts if reserves are zero
     */
    error InsufficientLiquidity();

    /**
     * @notice Custom error for invalid path
     * @dev Reverts if path has less than 2 tokens
     */
    error InvalidPath();

    /**
     * @notice Sorts two token addresses
     * @dev Returns tokens in ascending order
     * @param tokenA First token address
     * @param tokenB Second token address
     * @return token0 Lower address
     * @return token1 Higher address
     */
    function sortTokens(address tokenA, address tokenB)
        internal
        pure
        returns (address token0, address token1)
    {
        if (tokenA == tokenB) revert IdenticalAddresses();
        (token0, token1) = tokenA < tokenB
            ? (tokenA, tokenB)
            : (tokenB, tokenA);
        if (token0 == address(0)) revert ZeroAddress();
    }

    /**
     * @notice Calculates pair address using CREATE2 deterministic deployment
     * @dev Computes address based on factory and token pair
     * @param factory Factory contract address
     * @param tokenA First token address
     * @param tokenB Second token address
     * @return pair Pair contract address
     */
    function pairFor(
        address factory,
        address tokenA,
        address tokenB
    ) internal pure returns (address pair) {
        (address token0, address token1) = sortTokens(tokenA, tokenB);
        pair = address(
            uint160(
                uint(
                    keccak256(
                        abi.encodePacked(
                            hex'ff',
                            factory,
                            keccak256(abi.encodePacked(token0, token1)),
                            hex'96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f' // init code hash
                        )
                    )
                )
            )
        );
    }

    /**
     * @notice Gets reserves for a token pair
     * @dev Fetches reserves from pair contract
     * @param factory Factory contract address
     * @param tokenA First token address
     * @param tokenB Second token address
     * @return reserveA Reserve of tokenA
     * @return reserveB Reserve of tokenB
     */
    function getReserves(
        address factory,
        address tokenA,
        address tokenB
    ) internal view returns (uint reserveA, uint reserveB) {
        (address token0,) = sortTokens(tokenA, tokenB);
        address pair = pairFor(factory, tokenA, tokenB);
        
        (uint112 reserve0, uint112 reserve1,) = IDogePumpPair(pair)
            .getReserves();
        
        (reserveA, reserveB) = tokenA == token0
            ? (reserve0, reserve1)
            : (reserve1, reserve0);
    }

    /**
     * @notice Quotes output amount for given input
     * @dev Calculates based on constant product formula
     * @param amountA Input amount
     * @param reserveA Reserve of input token
     * @param reserveB Reserve of output token
     * @return amountB Output amount
     */
    function quote(
        uint amountA,
        uint reserveA,
        uint reserveB
    ) internal pure returns (uint amountB) {
        if (amountA == 0) revert InsufficientAmount();
        if (reserveA == 0 || reserveB == 0) revert InsufficientLiquidity();
        amountB = (amountA * reserveB) / reserveA;
    }

    /**
     * @notice Calculates output amount for a swap
     * @dev Includes 0.3% fee in calculation
     * @param amountIn Input amount
     * @param reserveIn Reserve of input token
     * @param reserveOut Reserve of output token
     * @return amountOut Output amount
     */
    function getAmountOut(
        uint amountIn,
        uint reserveIn,
        uint reserveOut
    ) internal pure returns (uint amountOut) {
        if (amountIn == 0) revert InsufficientAmount();
        if (reserveIn == 0 || reserveOut == 0) revert InsufficientLiquidity();
        
        uint amountInWithFee = amountIn * 997;
        uint numerator = amountInWithFee * reserveOut;
        uint denominator = reserveIn * 1000 + amountInWithFee;
        
        amountOut = numerator / denominator;
    }

    /**
     * @notice Calculates input amount for desired output
     * @dev Includes 0.3% fee in calculation
     * @param amountOut Desired output amount
     * @param reserveIn Reserve of input token
     * @param reserveOut Reserve of output token
     * @return amountIn Required input amount
     */
    function getAmountIn(
        uint amountOut,
        uint reserveIn,
        uint reserveOut
    ) internal pure returns (uint amountIn) {
        if (amountOut == 0) revert InsufficientAmount();
        if (reserveIn == 0 || reserveOut == 0) revert InsufficientLiquidity();
        
        uint numerator = reserveIn * amountOut * 1000;
        uint denominator = (reserveOut - amountOut) * 997;
        
        amountIn = (numerator / denominator) + 1;
    }

    /**
     * @notice Calculates output amounts for multi-hop swap
     * @dev Iterates through path and calculates each step
     * @param factory Factory contract address
     * @param amountIn Initial input amount
     * @param path Array of token addresses
     * @return amounts Array of amounts for each step
     */
    function getAmountsOut(
        address factory,
        uint amountIn,
        address[] memory path
    ) internal view returns (uint[] memory amounts) {
        if (path.length < 2) revert InvalidPath();
        
        amounts = new uint[](path.length);
        amounts[0] = amountIn;
        
        for (uint i; i < path.length - 1; i++) {
            (uint reserveIn, uint reserveOut) = getReserves(
                factory,
                path[i],
                path[i + 1]
            );
            amounts[i + 1] = getAmountOut(amounts[i], reserveIn, reserveOut);
        }
    }

    /**
     * @notice Calculates input amounts for multi-hop swap
     * @dev Iterates backwards through path
     * @param factory Factory contract address
     * @param amountOut Final desired output amount
     * @param path Array of token addresses
     * @return amounts Array of amounts for each step
     */
    function getAmountsIn(
        address factory,
        uint amountOut,
        address[] memory path
    ) internal view returns (uint[] memory amounts) {
        if (path.length < 2) revert InvalidPath();
        
        amounts = new uint[](path.length);
        amounts[amounts.length - 1] = amountOut;
        
        for (uint i = path.length - 1; i > 0; i--) {
            (uint reserveIn, uint reserveOut) = getReserves(
                factory,
                path[i - 1],
                path[i]
            );
            amounts[i - 1] = getAmountIn(
                amounts[i],
                reserveIn,
                reserveOut
            );
        }
    }
}

/**
 * @title IDogePumpPair
 * @dev Interface for pair contract (minimal)
 * @notice Used by library to call pair functions
 */
interface IDogePumpPair {
    /**
     * @notice Gets reserves from pair
     * @return reserve0 Reserve of token0
     * @return reserve1 Reserve of token1
     * @return blockTimestampLast Last update timestamp
     */
    function getReserves()
        external
        view
        returns (
            uint112 reserve0,
            uint112 reserve1,
            uint32 blockTimestampLast
        );

    /**
     * @notice Executes swap on pair
     * @param amount0Out Amount of token0 to output
     * @param amount1Out Amount of token1 to output
     * @param to Address to receive output
     * @param data Additional data for callback
     */
    function swap(
        uint amount0Out,
        uint amount1Out,
        address to,
        bytes calldata data
    ) external;

    /**
     * @notice Mints LP tokens
     * @param to Address to receive LP tokens
     * @return liquidity Amount minted
     */
    function mint(address to) external returns (uint liquidity);

    /**
     * @notice Burns LP tokens
     * @param to Address to receive underlying tokens
     * @return amount0 Amount of token0 returned
     * @return amount1 Amount of token1 returned
     */
    function burn(address to) external returns (uint amount0, uint amount1);
}
