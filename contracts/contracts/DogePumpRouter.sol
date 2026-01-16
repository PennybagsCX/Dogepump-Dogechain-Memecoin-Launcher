// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../interfaces/IDogePumpRouter.sol";
import "../interfaces/IDogePumpFactory.sol";
import "./DogePumpLibrary.sol";

/**
 * @title DogePumpRouter
 * @dev Router for facilitating swaps and liquidity operations
 * @notice Provides convenient interface for DEX operations with circuit breakers
 */
contract DogePumpRouter is IDogePumpRouter, Ownable, Pausable {
    /// @notice Factory contract address
    address public immutable override factory;

    /// @notice Wrapped native token address (WDC)
    address public immutable override WDC;

    /// @notice Maximum slippage allowed (50%)
    uint public constant MAX_SLIPPAGE = 50;

    /// @notice Transfer function selector
    bytes4 private constant TRANSFER_SELECTOR =
        bytes4(keccak256(bytes("transfer(address,uint256)")));

    /// @notice TransferFrom function selector
    bytes4 private constant TRANSFER_FROM_SELECTOR =
        bytes4(keccak256(bytes("transferFrom(address,address,uint256)")));

    /// @notice Custom error for expired transaction
    error Expired();

    /// @notice Custom error for insufficient output amount
    error InsufficientOutputAmount();

    /// @notice Custom error for excessive input amount
    error ExcessiveInputAmount();

    /// @notice Custom error for insufficient A amount
    error InsufficientAAmount();

    /// @notice Custom error for insufficient B amount
    error InsufficientBAmount();

    /**
     * @dev Modifier to ensure transaction hasn't expired
     * @param deadline Transaction deadline timestamp
     */
    modifier ensure(uint deadline) {
        if (deadline < block.timestamp) revert Expired();
        _;
    }

    /**
     * @dev Initializes router with factory and WDC
     * @param _factory Factory contract address
     * @param _WDC Wrapped native token address
     */
    constructor(address _factory, address _WDC) Ownable(msg.sender) {
        if (_factory == address(0)) revert("ZERO_FACTORY");
        if (_WDC == address(0)) revert("ZERO_WDC");
        factory = _factory;
        WDC = _WDC;
    }

    /**
     * @notice Pauses the router (owner only)
     * @dev Emergency pause for critical situations
     */
    function pause() external onlyOwner {
        _pause();
        emit RouterPaused(msg.sender, block.timestamp);
    }

    /**
     * @notice Unpauses the router (owner only)
     * @dev Resumes normal operations
     */
    function unpause() external onlyOwner {
        _unpause();
        emit RouterUnpaused(msg.sender, block.timestamp);
    }

    /// @notice Event emitted when router is paused
    event RouterPaused(address indexed pausedBy, uint timestamp);

    /// @notice Event emitted when router is unpaused
    event RouterUnpaused(address indexed unpausedBy, uint timestamp);

    /**
     * @notice Adds liquidity to a pair
     * @dev Optimizes amounts based on current reserves
     * @param tokenA Address of first token
     * @param tokenB Address of second token
     * @param amountADesired Desired amount of tokenA
     * @param amountBDesired Desired amount of tokenB
     * @param amountAMin Minimum amount of tokenA
     * @param amountBMin Minimum amount of tokenB
     * @param to Address to receive LP tokens
     * @param deadline Transaction deadline timestamp
     * @return amountA Actual amount of tokenA added
     * @return amountB Actual amount of tokenB added
     * @return liquidity Amount of LP tokens received
     */
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    )
        external
        override
        whenNotPaused
        ensure(deadline)
        returns (uint amountA, uint amountB, uint liquidity)
    {
        (amountA, amountB) = _addLiquidity(
            tokenA,
            tokenB,
            amountADesired,
            amountBDesired,
            amountAMin,
            amountBMin
        );

        address pair = DogePumpLibrary.pairFor(factory, tokenA, tokenB);
        _safeTransferFrom(tokenA, msg.sender, pair, amountA);
        _safeTransferFrom(tokenB, msg.sender, pair, amountB);

        liquidity = IDogePumpPair(pair).mint(to);
    }

    /**
     * @notice Removes liquidity from a pair
     * @dev Burns LP tokens and returns underlying tokens
     * @param tokenA Address of first token
     * @param tokenB Address of second token
     * @param liquidity Amount of LP tokens to burn
     * @param amountAMin Minimum amount of tokenA to receive
     * @param amountBMin Minimum amount of tokenB to receive
     * @param to Address to receive underlying tokens
     * @param deadline Transaction deadline timestamp
     * @return amountA Amount of tokenA received
     * @return amountB Amount of tokenB received
     */
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    )
        external
        override
        whenNotPaused
        ensure(deadline)
        returns (uint amountA, uint amountB)
    {
        address pair = DogePumpLibrary.pairFor(factory, tokenA, tokenB);
        
        IERC20(pair).transferFrom(msg.sender, pair, liquidity);
        (uint amount0, uint amount1) = IDogePumpPair(pair).burn(to);

        (address token0,) = DogePumpLibrary.sortTokens(tokenA, tokenB);
        (amountA, amountB) = tokenA == token0
            ? (amount0, amount1)
            : (amount1, amount0);

        if (amountA < amountAMin) revert InsufficientAAmount();
        if (amountB < amountBMin) revert InsufficientBAmount();
    }

    /**
     * @notice Swaps exact input tokens for minimum output tokens
     * @dev Supports multi-hop routing
     * @param amountIn Exact amount of input tokens
     * @param amountOutMin Minimum amount of output tokens
     * @param path Array of token addresses for swap route
     * @param to Address to receive output tokens
     * @param deadline Transaction deadline timestamp
     * @return amounts Array of token amounts for each step
     */
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    )
        external
        override
        whenNotPaused
        ensure(deadline)
        returns (uint[] memory amounts)
    {
        amounts = DogePumpLibrary.getAmountsOut(factory, amountIn, path);
        
        if (amounts[amounts.length - 1] < amountOutMin)
            revert InsufficientOutputAmount();

        _safeTransferFrom(
            path[0],
            msg.sender,
            DogePumpLibrary.pairFor(factory, path[0], path[1]),
            amounts[0]
        );
        _swap(amounts, path, to);
    }

    /**
     * @notice Swaps tokens for exact output tokens with maximum input
     * @dev Supports multi-hop routing
     * @param amountOut Exact amount of output tokens desired
     * @param amountInMax Maximum amount of input tokens
     * @param path Array of token addresses for swap route
     * @param to Address to receive output tokens
     * @param deadline Transaction deadline timestamp
     * @return amounts Array of token amounts for each step
     */
    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    )
        external
        override
        whenNotPaused
        ensure(deadline)
        returns (uint[] memory amounts)
    {
        amounts = DogePumpLibrary.getAmountsIn(factory, amountOut, path);
        
        if (amounts[0] > amountInMax) revert ExcessiveInputAmount();

        _safeTransferFrom(
            path[0],
            msg.sender,
            DogePumpLibrary.pairFor(factory, path[0], path[1]),
            amounts[0]
        );
        _swap(amounts, path, to);
    }

    /**
     * @notice Swaps exact native tokens for output tokens
     * @dev Wraps native tokens to WDC first
     * @param amountOutMin Minimum amount of output tokens
     * @param path Array of token addresses for swap route
     * @param to Address to receive output tokens
     * @param deadline Transaction deadline timestamp
     * @return amounts Array of token amounts for each step
     */
    function swapExactETHForTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    )
        external
        payable
        override
        whenNotPaused
        ensure(deadline)
        returns (uint[] memory amounts)
    {
        if (path[0] != WDC) revert DogePumpLibrary.InvalidPath();
        
        uint amountIn = msg.value;
        amounts = DogePumpLibrary.getAmountsOut(factory, amountIn, path);
        
        if (amounts[amounts.length - 1] < amountOutMin)
            revert InsufficientOutputAmount();

        IWDC(WDC).deposit{value: amountIn}();
        
        address pair = DogePumpLibrary.pairFor(factory, path[0], path[1]);
        
        // Verify WDC balance before transfer
        uint wdcBalance = IERC20(WDC).balanceOf(address(this));
        require(wdcBalance >= amounts[0], "Insufficient WDC balance");
        
        _safeTransferFrom(path[0], address(this), pair, amounts[0]);
        _swap(amounts, path, to);
    }

    /**
     * @notice Swaps tokens for exact native tokens output
     * @dev Unwraps WDC to native at end
     * @param amountOut Exact amount of native tokens desired
     * @param amountInMax Maximum amount of input tokens
     * @param path Array of token addresses for swap route
     * @param to Address to receive native tokens
     * @param deadline Transaction deadline timestamp
     * @return amounts Array of token amounts for each step
     */
    function swapTokensForExactETH(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    )
        external
        override
        whenNotPaused
        ensure(deadline)
        returns (uint[] memory amounts)
    {
        if (path[path.length - 1] != WDC) revert DogePumpLibrary.InvalidPath();
        
        amounts = DogePumpLibrary.getAmountsIn(factory, amountOut, path);
        
        if (amounts[0] > amountInMax) revert ExcessiveInputAmount();

        _safeTransferFrom(
            path[0],
            msg.sender,
            DogePumpLibrary.pairFor(factory, path[0], path[1]),
            amounts[0]
        );
        _swap(amounts, path, address(this));
        
        IWDC(WDC).withdraw(amounts[amounts.length - 1]);
        payable(to).transfer(amounts[amounts.length - 1]);
    }

    /**
     * @notice Swaps exact tokens for native tokens
     * @dev Unwraps WDC to native at end
     * @param amountIn Exact amount of input tokens
     * @param amountOutMin Minimum amount of native tokens
     * @param path Array of token addresses for swap route
     * @param to Address to receive native tokens
     * @param deadline Transaction deadline timestamp
     * @return amounts Array of token amounts for each step
     */
    function swapExactTokensForETH(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    )
        external
        override
        whenNotPaused
        ensure(deadline)
        returns (uint[] memory amounts)
    {
        if (path[path.length - 1] != WDC) revert DogePumpLibrary.InvalidPath();
        
        amounts = DogePumpLibrary.getAmountsOut(factory, amountIn, path);
        
        if (amounts[amounts.length - 1] < amountOutMin)
            revert InsufficientOutputAmount();

        _safeTransferFrom(
            path[0],
            msg.sender,
            DogePumpLibrary.pairFor(factory, path[0], path[1]),
            amounts[0]
        );
        _swap(amounts, path, address(this));
        
        IWDC(WDC).withdraw(amounts[amounts.length - 1]);
        payable(to).transfer(amounts[amounts.length - 1]);
    }

    /**
     * @notice Calculates output amounts for a given input amount and path
     * @dev Returns array of amounts for each swap step
     * @param amountIn Input token amount
     * @param path Array of token addresses for swap route
     * @return amounts Array of output amounts for each step
     */
    function getAmountsOut(uint amountIn, address[] calldata path)
        public
        view
        override
        returns (uint[] memory amounts)
    {
        return DogePumpLibrary.getAmountsOut(factory, amountIn, path);
    }

    /**
     * @notice Calculates input amounts for a given output amount and path
     * @dev Returns array of amounts for each swap step
     * @param amountOut Output token amount
     * @param path Array of token addresses for swap route
     * @return amounts Array of input amounts for each step
     */
    function getAmountsIn(uint amountOut, address[] calldata path)
        public
        view
        override
        returns (uint[] memory amounts)
    {
        return DogePumpLibrary.getAmountsIn(factory, amountOut, path);
    }

    /**
     * @notice Quotes output amount for a given input amount
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
    ) public pure override returns (uint amountB) {
        return DogePumpLibrary.quote(amountA, reserveA, reserveB);
    }

    /**
     * @notice Adds liquidity with optimized amounts
     * @dev Calculates optimal amounts based on reserves
     * @param tokenA Address of first token
     * @param tokenB Address of second token
     * @param amountADesired Desired amount of tokenA
     * @param amountBDesired Desired amount of tokenB
     * @param amountAMin Minimum amount of tokenA
     * @param amountBMin Minimum amount of tokenB
     * @return amountA Actual amount of tokenA
     * @return amountB Actual amount of tokenB
     */
    function _addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin
    ) private returns (uint amountA, uint amountB) {
        // Create the pair if it doesn't exist yet
        if (IDogePumpFactory(factory).getPair(tokenA, tokenB) == address(0)) {
            IDogePumpFactory(factory).createPair(tokenA, tokenB);
        }

        (uint reserveA, uint reserveB) = DogePumpLibrary.getReserves(
            factory,
            tokenA,
            tokenB
        );

        if (reserveA == 0 && reserveB == 0) {
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            uint amountBOptimal = DogePumpLibrary.quote(
                amountADesired,
                reserveA,
                reserveB
            );
            
            if (amountBOptimal <= amountBDesired) {
                if (amountBOptimal < amountBMin) revert InsufficientBAmount();
                (amountA, amountB) = (amountADesired, amountBOptimal);
            } else {
                uint amountAOptimal = DogePumpLibrary.quote(
                    amountBDesired,
                    reserveB,
                    reserveA
                );
                
                if (amountAOptimal > amountADesired) revert("INTERNAL_ERROR");
                if (amountAOptimal < amountAMin) revert InsufficientAAmount();
                (amountA, amountB) = (amountAOptimal, amountBDesired);
            }
        }
    }

    /**
     * @notice Executes swaps along path
     * @dev Iterates through path and calls pair swaps
     * @param amounts Array of amounts for each step
     * @param path Array of token addresses
     * @param _to Final recipient address
     */
    function _swap(
        uint[] memory amounts,
        address[] memory path,
        address _to
    ) private {
        for (uint i; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            (address token0,) = DogePumpLibrary.sortTokens(input, output);
            uint amountOut = amounts[i + 1];
            (uint amount0Out, uint amount1Out) = input == token0
                ? (uint(0), amountOut)
                : (amountOut, uint(0));
            
            address to = i < path.length - 2
                ? DogePumpLibrary.pairFor(factory, output, path[i + 2])
                : _to;
            
            IDogePumpPair(DogePumpLibrary.pairFor(factory, input, output))
                .swap(amount0Out, amount1Out, to, new bytes(0));
        }
    }

    /**
     * @notice Safely transfers tokens
     * @dev Checks return value of transfer call
     * @param token Address of token to transfer
     * @param from Address to transfer from
     * @param to Address to transfer to
     * @param value Amount to transfer
     */
    function _safeTransferFrom(
        address token,
        address from,
        address to,
        uint value
    ) private {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(TRANSFER_FROM_SELECTOR, from, to, value)
        );
        if (!success || (data.length > 0 && !abi.decode(data, (bool))))
            revert("TRANSFER_FAILED");
    }

    /**
     * @notice Safely transfers tokens
     * @dev Checks return value of transfer call
     * @param token Address of token to transfer
     * @param to Address to transfer to
     * @param value Amount to transfer
     */
    function _safeTransfer(
        address token,
        address to,
        uint value
    ) private {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(TRANSFER_SELECTOR, to, value)
        );
        if (!success || (data.length > 0 && !abi.decode(data, (bool))))
            revert("TRANSFER_FAILED");
    }

    /**
     * @notice Emergency withdraw function (admin only)
     * @dev Allows recovery of accidentally sent tokens
     * @param token Token address to withdraw (address(0) for native)
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).transfer(owner(), amount);
        }
    }
}

/**
 * @title IWDC
 * @dev Interface for wrapped native token
 * @notice Standard WETH-like interface for WDC
 */
interface IWDC {
    /**
     * @notice Wraps native tokens to WDC
     * @dev Mints WDC by depositing native tokens
     */
    function deposit() external payable;

    /**
     * @notice Unwraps WDC to native tokens
     * @dev Burns WDC and sends native tokens
     * @param amount Amount to unwrap
     */
    function withdraw(uint amount) external;
}
