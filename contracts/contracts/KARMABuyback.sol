// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Timers.sol";

/**
 * @title KARMA Buyback Contract
 * @dev Handles fee collection and KARMA token buyback
 *      Swaps collected fees for KARMA tokens via DEX
 *      Distributes tokens to staking contract
 *      Deployed on DogeChain mainnet
 */
contract KARMABuyback is Ownable, ReentrancyGuard {
    using Timers for Timestamp;

    IERC20 public immutable karmaToken;
    IERC20 public immutable feeToken; // DC or WDOGE
    IDexRouter public immutable dexRouter;

    address public stakingContract;

    // Buyback settings
    uint256 public constant BUYBACK_INTERVAL = 1 hours;
    uint256 public constant SLIPPAGE_TOLERANCE = 50; // 0.5% (in basis points)
    uint256 public constant MIN_LIQUIDITY_THRESHOLD = 1000 * 1e18; // Minimum liquidity in fee tokens

    uint256 public lastBuybackTime;
    bool public buybackEnabled = true;

    // Events
    event BuybackExecuted(uint256 timestamp, uint256 feesSwapped, uint256 karmaBought, uint256 karmaPrice);
    event TokensDistributed(uint256 amount);
    event StakingContractSet(address indexed oldContract, address indexed newContract);
    event BuybackStatusChanged(bool enabled);
    event ManualBuyback(uint256 feesAmount, uint256 karmaBought);

    // Errors
    error InvalidAddress();
    error InsufficientAllowance();
    error InsufficientBalance();
    error BuybackTooSoon();
    error BuybackDisabled();
    error SlippageTooHigh();
    error LowLiquidity();

    // DEX Router Interface
    interface IDexRouter {
        function swapExactTokensForTokens(
            uint256 amountIn,
            uint256 amountOutMin,
            address[] calldata path,
            address to,
            uint256 deadline
        ) external returns (uint256[] memory amounts);

        function getAmountsOut(
            uint256 amountIn,
            address[] calldata path
        ) external view returns (uint256[] memory amounts);
    }

    /**
     * @dev Constructor
     * @param _karmaToken Address of KARMA token
     * @param _feeToken Address of fee token (DC or WDOGE)
     * @param _dexRouter Address of DEX router
     */
    constructor(
        address _karmaToken,
        address _feeToken,
        address _dexRouter
    ) Ownable(msg.sender) {
        if (_karmaToken == address(0) || _feeToken == address(0) || _dexRouter == address(0)) {
            revert InvalidAddress();
        }

        karmaToken = IERC20(_karmaToken);
        feeToken = IERC20(_feeToken);
        dexRouter = IDexRouter(_dexRouter);
    }

    /**
     * @dev Execute buyback (can be called manually or automated)
     * @param feeAmount Amount of fee tokens to swap
     * @param minKarmaOut Minimum KARMA tokens to receive (slippage protection)
     */
    function executeBuyback(uint256 feeAmount, uint256 minKarmaOut)
        external
        nonReentrant
        returns (uint256 karmaBought)
    {
        if (!buybackEnabled) {
            revert BuybackDisabled();
        }

        if (feeAmount == 0) {
            feeAmount = feeToken.balanceOf(address(this));
        }

        if (feeAmount == 0) {
            return 0;
        }

        // Check allowance
        if (feeToken.allowance(address(this), address(dexRouter)) < feeAmount) {
            revert InsufficientAllowance();
        }

        // Get expected output
        address[] memory path = new address[](2);
        path[0] = address(feeToken);
        path[1] = address(karmaToken);

        uint256[] memory amountsOut = dexRouter.getAmountsOut(feeAmount, path);
        uint256 expectedKarma = amountsOut[1];

        // Check minimum liquidity
        if (expectedKarma == 0) {
            revert LowLiquidity();
        }

        // Calculate slippage
        uint256 slippage = (expectedKarma * (10000 - SLIPPAGE_TOLERANCE)) / 10000;

        if (minKarmaOut == 0) {
            minKarmaOut = slippage;
        }

        if (minKarmaOut > expectedKarma) {
            revert SlippageTooHigh();
        }

        // Execute swap
        uint256 balanceBefore = karmaToken.balanceOf(address(this));
        dexRouter.swapExactTokensForTokens{value: 0}(
            feeAmount,
            minKarmaOut,
            path,
            address(this),
            block.timestamp + 1 hours
        );

        uint256 balanceAfter = karmaToken.balanceOf(address(this));
        karmaBought = balanceAfter - balanceBefore;

        // Auto-distribute to staking contract
        if (stakingContract != address(0)) {
            karmaToken.transfer(stakingContract, karmaBought);
            // Note: Staking contract will need to call distributeRewards()
            emit TokensDistributed(karmaBought);
        }

        lastBuybackTime = block.timestamp;

        emit BuybackExecuted(block.timestamp, feeAmount, karmaBought, expectedKarma);
    }

    /**
     * @dev Distribute KARMA tokens to stakers manually
     * @param amount Amount to distribute
     */
    function distributeToStakers(uint256 amount) external onlyOwner {
        if (stakingContract == address(0)) {
            revert InvalidAddress();
        }

        bool success = karmaToken.transfer(stakingContract, amount);
        require(success, "Transfer failed");

        emit TokensDistributed(amount);
    }

    /**
     * @dev Set staking contract address
     * @param _stakingContract Address of staking contract
     */
    function setStakingContract(address _stakingContract) external onlyOwner {
        if (_stakingContract == address(0)) {
            revert InvalidAddress();
        }

        address oldContract = stakingContract;
        stakingContract = _stakingContract;
        emit StakingContractSet(oldContract, _stakingContract);
    }

    /**
     * @dev Enable or disable buyback
     * @param enabled True to enable, false to disable
     */
    function setBuybackEnabled(bool enabled) external onlyOwner {
        buybackEnabled = enabled;
        emit BuybackStatusChanged(enabled);
    }

    /**
     * @dev Recover tokens (excluding KARMA and fee tokens)
     * @param token Address of token to recover
     * @param amount Amount to recover
     */
    function recoverTokens(address token, uint256 amount) external onlyOwner {
        if (token == address(karmaToken) || token == address(feeToken)) {
            revert("Cannot recover KARMA or fee tokens");
        }

        IERC20(token).transfer(owner(), amount);
    }

    /**
     * @dev Get contract status
     * @return _buybackEnabled, _lastBuybackTime, _stakingContract, _karmaBalance, _feeBalance
     */
    function getStatus() external view returns (
        bool _buybackEnabled,
        uint256 _lastBuybackTime,
        address _stakingContract,
        uint256 _karmaBalance,
        uint256 _feeBalance
    ) {
        return (
            buybackEnabled,
            lastBuybackTime,
            stakingContract,
            karmaToken.balanceOf(address(this)),
            feeToken.balanceOf(address(this))
        );
    }

    /**
     * @dev Allow contract to receive fees
     */
    receive() external payable {}
}
