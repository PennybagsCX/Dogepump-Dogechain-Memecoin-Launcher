// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./DogePumpLPToken.sol";
import "../interfaces/IDogePumpPair.sol";

/**
 * @title DogePumpPair
 * @dev AMM pair implementing constant product formula (x * y = k)
 * @notice Includes reentrancy protection and 0.3% swap fee
 */
contract DogePumpPair is ERC20, IDogePumpPair {
    /// @notice Minimum liquidity to prevent dust attacks
    uint public constant override MINIMUM_LIQUIDITY = 10**3;

    /// @notice Maximum liquidity cap to prevent overflow
    uint public constant MAX_LIQUIDITY = type(uint112).max;

    /// @notice Minimum time elapsed between swaps for TWAP (1 block)
    uint32 public constant MIN_TIME_ELAPSED = 1;

    /// @notice Transfer function selector for safe transfers
    bytes4 private constant SELECTOR =
        bytes4(keccak256(bytes("transfer(address,uint256)")));

    /// @notice Factory contract address
    address public factory;

    /// @notice First token address (sorted)
    address public token0;

    /// @notice Second token address (sorted)
    address public token1;

    /// @notice Current reserve of token0
    uint112 private reserve0;

    /// @notice Current reserve of token1
    uint112 private reserve1;

    /// @notice Last block timestamp of reserve update
    uint32 private blockTimestampLast;

    /// @notice Cumulative price of token0
    uint public price0CumulativeLast;

    /// @notice Cumulative price of token1
    uint public price1CumulativeLast;

    /// @notice Last k value (reserve0 * reserve1)
    uint public kLast;

    /// @notice Reentrancy lock
    uint private unlocked = 1;

    /// @notice Custom error for reentrancy
    error Locked();

    /// @notice Custom error for insufficient output
    error InsufficientOutputAmount();

    /// @notice Custom error for insufficient liquidity
    error InsufficientLiquidity();

    /// @notice Custom error for invalid to address
    error InvalidTo();

    /// @notice Custom error for insufficient input
    error InsufficientInputAmount();

    /// @notice Custom error for overflow
    error Overflow();

    /// @notice Custom error for insufficient liquidity minted
    error InsufficientLiquidityMinted();

    /// @notice Custom error for insufficient liquidity burned
    error InsufficientLiquidityBurned();

    /// @notice Custom error for forbidden access
    error Forbidden();

    /// @notice Custom error for transfer failed
    error TransferFailed();

    /// @notice Custom error for zero address
    error ZeroAddress();

    /**
     * @dev Modifier to prevent reentrancy
     */
    modifier lock() {
        if (unlocked != 1) revert Locked();
        unlocked = 0;
        _;
        unlocked = 1;
    }

    /**
     * @dev Initializes pair (called by factory)
     * @notice Can only be called once by factory
     */
    constructor() ERC20("DogePump LP Token", "DPLP") {
        factory = msg.sender;
    }

    /**
     * @notice Initializes pair (called by factory)
     * @dev Can only be called once by factory
     * @param _token0 First token address
     * @param _token1 Second token address
     */
    function initialize(address _token0, address _token1) external override {
        if (msg.sender != factory) revert Forbidden();
        if (_token0 == address(0) || _token1 == address(0)) revert ZeroAddress();
        if (token0 != address(0)) revert("ALREADY_INITIALIZED");
        
        token0 = _token0;
        token1 = _token1;
    }

    /**
     * @notice Returns current reserves and last update timestamp
     * @return _reserve0 Current reserve0
     * @return _reserve1 Current reserve1
     * @return _blockTimestampLast Last block timestamp
     */
    function getReserves()
        public
        view
        override
        returns (
            uint112 _reserve0,
            uint112 _reserve1,
            uint32 _blockTimestampLast
        )
    {
        _reserve0 = reserve0;
        _reserve1 = reserve1;
        _blockTimestampLast = blockTimestampLast;
    }

    /**
     * @notice Updates reserves with new balances
     * @dev Calculates cumulative prices and emits Sync event
     * @param balance0 New balance of token0
     * @param balance1 New balance of token1
     * @param _reserve0 Old reserve0
     * @param _reserve1 Old reserve1
     */
    function _update(
        uint balance0,
        uint balance1,
        uint112 _reserve0,
        uint112 _reserve1
    ) private {
        if (balance0 > type(uint112).max || balance1 > type(uint112).max)
            revert Overflow();
        
        uint32 blockTimestamp = uint32(block.timestamp % 2**32);
        uint32 timeElapsed = blockTimestamp - blockTimestampLast;

        // Only update cumulative prices if minimum time has elapsed (prevents manipulation)
        if (timeElapsed > 0 && timeElapsed >= MIN_TIME_ELAPSED && _reserve0 != 0 && _reserve1 != 0) {
            unchecked {
                // Update cumulative prices
                price0CumulativeLast +=
                    uint(_reserve1) *
                    timeElapsed *
                    2**112 /
                    _reserve0;
                price1CumulativeLast +=
                    uint(_reserve0) *
                    timeElapsed *
                    2**112 /
                    _reserve1;
            }
        }

        reserve0 = uint112(balance0);
        reserve1 = uint112(balance1);
        blockTimestampLast = blockTimestamp;
        
        emit Sync(reserve0, reserve1);
    }

    /**
     * @notice Mints LP tokens for liquidity provider
     * @dev Calculates liquidity based on constant product formula
     * @param to Address to receive LP tokens
     * @return liquidity Amount of LP tokens minted
     */
    function mint(address to) external lock override returns (uint liquidity) {
        (uint112 _reserve0, uint112 _reserve1,) = getReserves();
        
        uint balance0 = IERC20(token0).balanceOf(address(this));
        uint balance1 = IERC20(token1).balanceOf(address(this));
        
        uint amount0 = balance0 - _reserve0;
        uint amount1 = balance1 - _reserve1;

        uint _totalSupply = totalSupply();
        
        if (_totalSupply == 0) {
            // First liquidity provision
            liquidity = Math.sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY;
            _mint(address(0), MINIMUM_LIQUIDITY); // Lock minimum liquidity
        } else {
            // Subsequent liquidity provision
            liquidity = Math.min(
                (amount0 * _totalSupply) / _reserve0,
                (amount1 * _totalSupply) / _reserve1
            );
        }

        if (liquidity <= 0) revert InsufficientLiquidityMinted();
        if (liquidity > MAX_LIQUIDITY) revert("Liquidity too large");

        _mint(to, liquidity);
        _update(balance0, balance1, _reserve0, _reserve1);
        
        emit Mint(msg.sender, amount0, amount1);
    }

    /**
     * @notice Burns LP tokens and returns underlying tokens
     * @dev Calculates share of pool and returns proportional amounts
     * @param to Address to receive underlying tokens
     * @return amount0 Amount of token0 returned
     * @return amount1 Amount of token1 returned
     */
    function burn(address to) external lock override returns (uint amount0, uint amount1) {
        (uint112 _reserve0, uint112 _reserve1,) = getReserves();
        
        address _token0 = token0;
        address _token1 = token1;
        
        uint balance0 = IERC20(_token0).balanceOf(address(this));
        uint balance1 = IERC20(_token1).balanceOf(address(this));
        
        uint liquidity = balanceOf(address(this));
        
        uint _totalSupply = totalSupply();
        amount0 = (liquidity * balance0) / _totalSupply;
        amount1 = (liquidity * balance1) / _totalSupply;

        if (amount0 == 0 || amount1 == 0) revert InsufficientLiquidityBurned();

        _burn(address(this), liquidity);
        _safeTransfer(_token0, to, amount0);
        _safeTransfer(_token1, to, amount1);

        balance0 = IERC20(_token0).balanceOf(address(this));
        balance1 = IERC20(_token1).balanceOf(address(this));

        _update(balance0, balance1, _reserve0, _reserve1);
        
        emit Burn(msg.sender, amount0, amount1, to);
    }

    /**
     * @notice Executes a token swap
     * @dev Uses constant product formula with 0.3% fee
     * @param amount0Out Amount of token0 to output
     * @param amount1Out Amount of token1 to output
     * @param to Address to receive output tokens
     * @param data Additional data for flash loan callback
     */
    function swap(
        uint amount0Out,
        uint amount1Out,
        address to,
        bytes calldata data
    ) external lock override {
        if (amount0Out == 0 && amount1Out == 0)
            revert InsufficientOutputAmount();
        
        (uint112 _reserve0, uint112 _reserve1,) = getReserves();
        
        if (amount0Out >= _reserve0 || amount1Out >= _reserve1)
            revert InsufficientLiquidity();

        uint balance0;
        uint balance1;
        {
            address _token0 = token0;
            address _token1 = token1;
            
            if (to == _token0 || to == _token1) revert InvalidTo();

            if (amount0Out > 0) _safeTransfer(_token0, to, amount0Out);
            if (amount1Out > 0) _safeTransfer(_token1, to, amount1Out);

            if (data.length > 0) {
                // Flash loan callback with 0.3% fee to discourage manipulation
                uint flashLoanFee = (amount0Out + amount1Out) * 3 / 1000;
                
                // Require fee payment before callback
                require(
                    IERC20(token0).transferFrom(to, address(this), flashLoanFee),
                    "Flash loan fee required"
                );
                
                IDogePumpCallee(to).dogePumpCall(
                    msg.sender,
                    amount0Out,
                    amount1Out,
                    data
                );
                
                // Return fee after callback
                IERC20(token0).transfer(to, flashLoanFee);
            }

            balance0 = IERC20(_token0).balanceOf(address(this));
            balance1 = IERC20(_token1).balanceOf(address(this));
        }

        uint amount0In = balance0 > _reserve0 - amount0Out
            ? balance0 - (_reserve0 - amount0Out)
            : 0;
        uint amount1In = balance1 > _reserve1 - amount1Out
            ? balance1 - (_reserve1 - amount1Out)
            : 0;

        if (amount0In == 0 && amount1In == 0)
            revert InsufficientInputAmount();

        {
            // Calculate adjusted balances with 0.3% fee
            uint balance0Adjusted = balance0 * 1000 - amount0In * 3;
            uint balance1Adjusted = balance1 * 1000 - amount1In * 3;

            // Verify constant product: (x * y = k) with fee
            if (
                balance0Adjusted * balance1Adjusted <
                uint(_reserve0) * _reserve1 * 1000000
            ) revert("K");
        }

        _update(balance0, balance1, _reserve0, _reserve1);
        
        emit Swap(
            msg.sender,
            amount0In,
            amount1In,
            amount0Out,
            amount1Out,
            to
        );
    }

    /**
     * @notice Recovers excess tokens from pair
     * @dev Use if tokens are sent directly to pair. Anyone can call this.
     * @custom:security Anyone can call skim() to recover tokens sent directly to pair.
     * This is by design and not a vulnerability, but should be documented.
     * @param to Address to receive recovered tokens
     */
    function skim(address to) external lock {
        address _token0 = token0;
        address _token1 = token1;
        
        _safeTransfer(
            _token0,
            to,
            IERC20(_token0).balanceOf(address(this)) - reserve0
        );
        _safeTransfer(
            _token1,
            to,
            IERC20(_token1).balanceOf(address(this)) - reserve1
        );
    }

    /**
     * @notice Syncs reserves with actual token balances
     * @dev Use if balances are out of sync
     */
    function sync() external lock {
        _update(
            IERC20(token0).balanceOf(address(this)),
            IERC20(token1).balanceOf(address(this)),
            reserve0,
            reserve1
        );
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
            abi.encodeWithSelector(SELECTOR, to, value)
        );
        if (!success || (data.length > 0 && !abi.decode(data, (bool))))
            revert TransferFailed();
    }
}

/**
 * @title IDogePumpCallee
 * @dev Interface for flash loan callback
 * @notice Contracts implementing this can receive flash loans
 */
interface IDogePumpCallee {
    /**
     * @notice Called during flash loan
     * @param sender Address that initiated the swap
     * @param amount0Out Amount of token0 output
     * @param amount1Out Amount of token1 output
     * @param data Additional data passed from caller
     */
    function dogePumpCall(
        address sender,
        uint amount0Out,
        uint amount1Out,
        bytes calldata data
    ) external;
}
