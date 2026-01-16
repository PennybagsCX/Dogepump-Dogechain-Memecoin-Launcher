// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Timers.sol";

/**
 * @title KARMA Staking Contract
 * @dev Flexible staking contract for KARMA tokens with dynamic APY calculation
 *      Includes time-weighted bonus multiplier for early stakers
 *      Deployed on DogeChain mainnet
 */
contract KARMAStaking is Ownable, ReentrancyGuard {
    using Timers for Timestamp;

    IERC20 public immutable karmaToken;
    address public feeCollector;

    // Staking bonus constants
    uint256 public immutable launchTimestamp;
    uint256 public constant BONUS_PERIOD_1_END = 30 days;
    uint256 public constant BONUS_PERIOD_2_END = 90 days;
    uint256 public constant BONUS_MULTIPLIER_1 = 200; // 2x
    uint256 public constant BONUS_MULTIPLIER_2 = 150; // 1.5x
    uint256 public constant BONUS_MULTIPLIER_NORMAL = 100; // 1x

    // State variables
    uint256 public totalStaked;
    uint256 public totalRewardsDistributed;
    uint256 public globalStakeSeconds; // Cumulative (amount × time)

    // User staking info
    struct Stake {
        uint256 amount;
        uint256 startTime;
        uint256 bonusMultiplier;
        uint256 stakeSeconds;
        uint256 rewardsClaimed;
    }

    mapping(address => Stake) public stakes;
    address[] public stakers;

    // Reward tracking for APY calculation
    struct RewardDistribution {
        uint256 timestamp;
        uint256 amount;
        uint256 totalStakedAtTime;
    }

    RewardDistribution[] public rewardHistory;

    // Events
    event Staked(address indexed user, uint256 amount, uint256 bonusMultiplier);
    event Unstaked(address indexed user, uint256 amount, uint256 rewards);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardsDistributed(uint256 amount, uint256 totalStaked);
    event FeeCollectorSet(address indexed oldCollector, address indexed newCollector);

    // Errors
    error ZeroAmount();
    error InsufficientStake();
    error NoRewards();
    error NotStaked();
    error InvalidAddress();

    /**
     * @dev Constructor
     * @param _karmaToken Address of KARMA token
     * @param _feeCollector Address of fee collector contract
     */
    constructor(address _karmaToken, address _feeCollector) Ownable(msg.sender) {
        if (_karmaToken == address(0) || _feeCollector == address(0)) {
            revert InvalidAddress();
        }

        karmaToken = IERC20(_karmaToken);
        feeCollector = _feeCollector;
        launchTimestamp = block.timestamp;
    }

    /**
     * @dev Get bonus multiplier based on stake time
     * @param stakeTime Timestamp when stake was created
     * @return Bonus multiplier (100-200)
     */
    function getBonusMultiplier(uint256 stakeTime) public view returns (uint256) {
        if (stakeTime < launchTimestamp + BONUS_PERIOD_1_END) {
            return BONUS_MULTIPLIER_1; // 2x bonus
        } else if (stakeTime < launchTimestamp + BONUS_PERIOD_2_END) {
            return BONUS_MULTIPLIER_2; // 1.5x bonus
        } else {
            return BONUS_MULTIPLIER_NORMAL; // No bonus
        }
    }

    /**
     * @dev Stake KARMA tokens
     * @param amount Amount to stake
     */
    function stake(uint256 amount) external nonReentrant {
        if (amount == 0) {
            revert ZeroAmount();
        }

        // Transfer tokens from user
        bool success = karmaToken.transferFrom(msg.sender, address(this), amount);
        require(success, "Transfer failed");

        Stake storage userStake = stakes[msg.sender];

        // Update global stake seconds for existing stake if any
        if (userStake.amount > 0) {
            uint256 elapsedSeconds = block.timestamp - userStake.startTime;
            uint256 stakeSeconds = userStake.amount * elapsedSeconds * userStake.bonusMultiplier / 100;
            globalStakeSeconds -= stakeSeconds;
            userStake.stakeSeconds += stakeSeconds;
        }

        // Calculate bonus multiplier
        uint256 bonusMultiplier = getBonusMultiplier(block.timestamp);

        // Update stake
        userStake.amount += amount;
        userStake.startTime = block.timestamp;
        userStake.bonusMultiplier = bonusMultiplier;

        // Add to stakers list if new staker
        if (userStake.amount == amount) {
            stakers.push(msg.sender);
        }

        // Update totals
        totalStaked += amount;
        stakes[msg.sender] = userStake;

        emit Staked(msg.sender, amount, bonusMultiplier);
    }

    /**
     * @dev Unstake KARMA tokens
     * @param amount Amount to unstake
     */
    function unstake(uint256 amount) external nonReentrant {
        Stake storage userStake = stakes[msg.sender];

        if (amount == 0 || amount > userStake.amount) {
            revert InsufficientStake();
        }

        // Calculate final stake seconds
        uint256 elapsedSeconds = block.timestamp - userStake.startTime;
        uint256 stakeSeconds = userStake.amount * elapsedSeconds * userStake.bonusMultiplier / 100;

        // Update user stake
        userStake.amount -= amount;
        userStake.stakeSeconds += stakeSeconds;

        // If fully unstaking, reset start time
        if (userStake.amount == 0) {
            userStake.startTime = 0;
            userStake.bonusMultiplier = 0;
        }

        // Update global totals
        totalStaked -= amount;
        globalStakeSeconds -= stakeSeconds;

        // Transfer tokens back
        bool success = karmaToken.transfer(msg.sender, amount);
        require(success, "Transfer failed");

        emit Unstaked(msg.sender, amount, userStake.rewardsClaimed);
    }

    /**
     * @dev Claim staking rewards
     */
    function claimRewards() external nonReentrant {
        Stake storage userStake = stakes[msg.sender];

        if (userStake.amount == 0) {
            revert NotStaked();
        }

        // Calculate pending rewards
        uint256 pending = calculateRewards(msg.sender);
        userStake.rewardsClaimed += pending;

        // Update stake seconds before reward distribution
        uint256 elapsedSeconds = block.timestamp - userStake.startTime;
        uint256 stakeSeconds = userStake.amount * elapsedSeconds * userStake.bonusMultiplier / 100;
        globalStakeSeconds -= userStake.stakeSeconds;
        userStake.stakeSeconds = stakeSeconds;
        userStake.startTime = block.timestamp; // Reset start time

        // Transfer rewards
        uint256 balance = karmaToken.balanceOf(address(this));
        if (pending > balance) {
            pending = balance;
        }

        if (pending > 0) {
            success = karmaToken.transfer(msg.sender, pending);
            require(success, "Transfer failed");
        } else {
            revert NoRewards();
        }

        emit RewardsClaimed(msg.sender, pending);
    }

    /**
     * @dev Calculate rewards for a user
     * @param user Address of the user
     * @return Pending rewards
     */
    function calculateRewards(address user) public view returns (uint256) {
        Stake memory userStake = stakes[user];

        if (userStake.amount == 0 || totalStaked == 0) {
            return 0;
        }

        // Calculate user's effective stake-seconds (including bonus)
        uint256 elapsedSeconds = block.timestamp - userStake.startTime;
        uint256 currentStakeSeconds = userStake.amount * elapsedSeconds * userStake.bonusMultiplier / 100;
        uint256 totalUserStakeSeconds = userStake.stakeSeconds + currentStakeSeconds;

        // Calculate user's share of reward pool
        uint256 userShare = (totalUserStakeSeconds * 1e18) / (globalStakeSeconds + totalStaked * elapsedSeconds / 2);

        return (userShare * totalRewardsDistributed) / 1e18;
    }

    /**
     * @dev Get pending rewards for a user
     * @param user Address of the user
     * @return Pending rewards
     */
    function getPendingRewards(address user) external view returns (uint256) {
        return calculateRewards(user);
    }

    /**
     * @dev Distribute rewards (called by buyback contract)
     * @param amount Amount of rewards to distribute
     */
    function distributeRewards(uint256 amount) external nonReentrant {
        if (msg.sender != feeCollector && msg.sender != owner()) {
            revert("Unauthorized");
        }

        if (amount == 0) {
            revert ZeroAmount();
        }

        // Transfer tokens to this contract
        bool success = karmaToken.transferFrom(msg.sender, address(this), amount);
        require(success, "Transfer failed");

        // Record distribution
        rewardHistory.push(RewardDistribution({
            timestamp: block.timestamp,
            amount: amount,
            totalStakedAtTime: totalStaked
        }));

        totalRewardsDistributed += amount;

        emit RewardsDistributed(amount, totalStaked);
    }

    /**
     * @dev Calculate current dynamic APY
     * @return Current APY in basis points (10000 = 100%)
     */
    function calculateCurrentAPY() external view returns (uint256) {
        if (totalStaked == 0 || rewardHistory.length == 0) {
            return 0;
        }

        // Get rewards from last 30 days
        uint256 thirtyDays = 30 days;
        uint256 rewardsLast30Days = 0;

        // Search from most recent backwards
        for (uint256 i = rewardHistory.length; i > 0; i--) {
            RewardDistribution memory dist = rewardHistory[i - 1];
            if (block.timestamp - dist.timestamp <= thirtyDays) {
                rewardsLast30Days += dist.amount;
            } else {
                break;
            }
        }

        if (rewardsLast30Days == 0) {
            return 0;
        }

        // Annualize rewards
        uint256 annualizedRewards = rewardsLast30Days * 12; // × 12 for annual

        // Calculate stake value (assuming 1 token = $1 for simplicity)
        // In production, this should fetch actual price from DEX
        uint256 stakeValue = totalStaked * 1e18; // placeholder price

        if (stakeValue == 0) {
            return 0;
        }

        // APY = (Annual Rewards / Stake Value) × 100
        // Return in basis points (10000 = 100%)
        uint256 apy = (annualizedRewards * 10000 * 1e18) / stakeValue;

        return apy;
    }

    /**
     * @dev Get staking info for a user
     * @param user Address of the user
     * @return amount, rewardsClaimed, pendingRewards, bonusMultiplier, stakeSeconds
     */
    function getStakeInfo(address user) external view returns (
        uint256 amount,
        uint256 rewardsClaimed,
        uint256 pendingRewards,
        uint256 bonusMultiplier,
        uint256 stakeSeconds
    ) {
        Stake memory userStake = stakes[user];
        return (
            userStake.amount,
            userStake.rewardsClaimed,
            calculateRewards(user),
            userStake.bonusMultiplier,
            userStake.stakeSeconds
        );
    }

    /**
     * @dev Get contract statistics
     * @return totalStaked, totalRewardsDistributed, totalStakers, currentAPY
     */
    function getContractStats() external view returns (
        uint256 _totalStaked,
        uint256 _totalRewardsDistributed,
        uint256 _totalStakers,
        uint256 _currentAPY
    ) {
        return (
            totalStaked,
            totalRewardsDistributed,
            stakers.length,
            calculateCurrentAPY()
        );
    }

    /**
     * @dev Set fee collector contract
     * @param _feeCollector Address of fee collector
     */
    function setFeeCollector(address _feeCollector) external onlyOwner {
        if (_feeCollector == address(0)) {
            revert InvalidAddress();
        }

        address oldCollector = feeCollector;
        feeCollector = _feeCollector;
        emit FeeCollectorSet(oldCollector, _feeCollector);
    }

    /**
     * @dev Get APY history for chart display
     * @param limit Maximum number of data points to return
     * @return Array of timestamps and APY values
     */
    function getAPYHistory(uint256 limit) external view returns (
        uint256[] memory timestamps,
        uint256[] memory apyValues
    ) {
        // Return recent reward distributions with calculated APY at each point
        // This is a simplified version - in production, you'd want to store APY history separately
        uint256 length = rewardHistory.length;
        if (limit > 0 && length > limit) {
            length = limit;
        }

        timestamps = new uint256[](length);
        apyValues = new uint256[](length);

        uint256 index = 0;
        for (uint256 i = 0; i < length; i++) {
            uint256 rewardIndex = rewardHistory.length - 1 - i;
            RewardDistribution memory dist = rewardHistory[rewardIndex];
            timestamps[index] = dist.timestamp;

            // Calculate APY at this point in time
            // (This would require more complex calculation in production)
            apyValues[index] = 0; // Placeholder
            index++;
        }
    }

    /**
     * @dev Emergency pause
     */
    bool public paused;

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    function pause() external onlyOwner {
        paused = true;
    }

    function unpause() external onlyOwner {
        paused = false;
    }
}
