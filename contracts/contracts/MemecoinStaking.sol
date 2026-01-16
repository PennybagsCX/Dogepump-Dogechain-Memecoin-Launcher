// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Timers.sol";

/**
 * @title Memecoin Staking Contract
 * @dev Allows users to stake memecoins to earn $KARMA rewards
 *      Each supported token has its own reward rate
 *      Rewards calculated based on: amount × token price × reward rate × time
 *      Deployed on DogeChain mainnet
 */
contract MemecoinStaking is Ownable, ReentrancyGuard {
    using Timers for Timestamp;

    IERC20 public immutable karmaToken;

    struct TokenConfig {
        bool supported;
        uint256 rewardRate; // Basis points per day (e.g., 100 = 1% daily)
        uint256 minStakeAmount;
        uint256 maxStakeAmount;
        uint256 unstakeFeePercent; // Fee for unstaking (0-100)
    }

    struct Stake {
        uint256 amount;
        uint256 tokenPrice; // Price at stake time (USD with 18 decimals)
        uint256 startTime;
        uint256 lastRewardTime;
        uint256 pendingRewards;
        uint256 claimedRewards;
        bool active;
    }

    // Mapping: user => token => stake
    mapping(address => mapping(address => Stake)) public stakes;

    // Mapping: token => config
    mapping(address => TokenConfig) public tokenConfigs;

    // Total staked per token
    mapping(address => uint256) public totalStakedPerToken;

    // Supported tokens list
    address[] public supportedTokensList;

    // Reward calculation
    uint256 public constant REWARD_INTERVAL = 1 days;
    uint256 public constant BASIS_POINTS = 10000; // 100%
    uint256 public constant PRICE_DECIMALS = 1e18;

    // Events
    event MemecoinStaked(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 tokenPrice,
        uint256 timestamp
    );
    event MemecoinUnstaked(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 rewardsClaimed,
        uint256 timestamp
    );
    event RewardsClaimed(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );
    event TokenConfigUpdated(
        address indexed token,
        bool supported,
        uint256 rewardRate
    );
    event KarmaTokenUpdated(address indexed oldToken, address indexed newToken);

    // Errors
    error TokenNotSupported();
    error InvalidAmount();
    error InsufficientBalance();
    error NoStakeFound();
    error NoRewardsToClaim();
    error Unauthorized();
    error InvalidConfig();

    /**
     * @dev Constructor
     * @param _karmaToken Address of $KARMA token
     */
    constructor(address _karmaToken) Ownable(msg.sender) {
        if (_karmaToken == address(0)) {
            revert InvalidConfig();
        }
        karmaToken = IERC20(_karmaToken);
    }

    /**
     * @dev Stake memecoin to earn $KARMA
     * @param token Address of memecoin to stake
     * @param amount Amount to stake
     */
    function stake(address token, uint256 amount)
        external
        nonReentrant
    {
        // Check if token is supported
        TokenConfig memory config = tokenConfigs[token];
        if (!config.supported) {
            revert TokenNotSupported();
        }

        // Validate amount
        if (amount == 0 || amount < config.minStakeAmount) {
            revert InvalidAmount();
        }

        if (amount > config.maxStakeAmount) {
            revert InvalidAmount();
        }

        // Transfer tokens from user
        IERC20 memecoin = IERC20(token);
        uint256 balanceBefore = memecoin.balanceOf(address(this));

        bool success = memecoin.transferFrom(msg.sender, address(this), amount);
        require(success, "Transfer failed");

        uint256 balanceAfter = memecoin.balanceOf(address(this));
        uint256 actualAmount = balanceAfter - balanceBefore;

        // Get or create stake
        Stake storage userStake = stakes[msg.sender][token];

        // If existing stake, calculate pending rewards first
        if (userStake.amount > 0 && userStake.active) {
            uint256 pending = calculatePendingRewards(msg.sender, token);
            userStake.pendingRewards += pending;
        }

        // Update stake
        userStake.amount += actualAmount;
        userStake.lastRewardTime = block.timestamp;

        // If new stake, set start time
        if (userStake.startTime == 0) {
            userStake.startTime = block.timestamp;
            userStake.tokenPrice = getTokenPrice(token); // Should be passed as param or fetched from oracle
        }

        userStake.active = true;

        // Update totals
        totalStakedPerToken[token] += actualAmount;

        emit MemecoinStaked(msg.sender, token, actualAmount, userStake.tokenPrice, block.timestamp);
    }

    /**
     * @dev Unstake memecoin
     * @param token Address of memecoin to unstake
     * @param amount Amount to unstake
     */
    function unstake(address token, uint256 amount)
        external
        nonReentrant
    {
        Stake storage userStake = stakes[msg.sender][token];

        if (!userStake.active || userStake.amount == 0) {
            revert NoStakeFound();
        }

        if (amount == 0 || amount > userStake.amount) {
            revert InvalidAmount();
        }

        // Calculate final rewards
        uint256 pending = calculatePendingRewards(msg.sender, token);
        userStake.pendingRewards += pending;

        // Calculate unstake fee if any
        TokenConfig memory config = tokenConfigs[token];
        uint256 fee = 0;
        if (config.unstakeFeePercent > 0) {
            fee = (amount * config.unstakeFeePercent) / 100;
        }

        uint256 amountToReturn = amount - fee;

        // Update stake
        userStake.amount -= amount;
        totalStakedPerToken[token] -= amount;

        // If fully unstaking, mark as inactive
        if (userStake.amount == 0) {
            userStake.active = false;
        }

        userStake.lastRewardTime = block.timestamp;

        // Transfer tokens back
        IERC20 memecoin = IERC20(token);
        bool success = memecoin.transfer(msg.sender, amountToReturn);
        require(success, "Transfer failed");

        // Transfer fee to owner if any
        if (fee > 0) {
            memecoin.transfer(owner(), fee);
        }

        emit MemecoinUnstaked(msg.sender, token, amount, userStake.pendingRewards, block.timestamp);
    }

    /**
     * @dev Claim $KARMA rewards
     * @param token Address of memecoin to claim rewards for
     */
    function claimRewards(address token) external nonReentrant {
        Stake storage userStake = stakes[msg.sender][token];

        if (!userStake.active || userStake.amount == 0) {
            revert NoStakeFound();
        }

        // Calculate pending rewards
        uint256 pending = calculatePendingRewards(msg.sender, token);
        userStake.pendingRewards += pending;

        uint256 totalRewards = userStake.pendingRewards;

        if (totalRewards == 0) {
            revert NoRewardsToClaim();
        }

        // Update stake
        userStake.claimedRewards += totalRewards;
        userStake.pendingRewards = 0;
        userStake.lastRewardTime = block.timestamp;

        // Transfer $KARMA rewards
        uint256 balance = karmaToken.balanceOf(address(this));
        if (totalRewards > balance) {
            totalRewards = balance;
        }

        if (totalRewards > 0) {
            bool success = karmaToken.transfer(msg.sender, totalRewards);
            require(success, "Transfer failed");
        }

        emit RewardsClaimed(msg.sender, token, totalRewards, block.timestamp);
    }

    /**
     * @dev Calculate pending rewards for a user's stake
     * @param user Address of the user
     * @param token Address of memecoin
     * @return Pending rewards
     */
    function calculatePendingRewards(address user, address token) public view returns (uint256) {
        Stake memory userStake = stakes[user][token];

        if (!userStake.active || userStake.amount == 0) {
            return 0;
        }

        uint256 timeElapsed = block.timestamp - userStake.lastRewardTime;
        if (timeElapsed == 0) {
            return userStake.pendingRewards;
        }

        TokenConfig memory config = tokenConfigs[token];

        // Calculate rewards: (amount × price × rewardRate × time) / (basisPoints × 1 day)
        // This gives daily rewards based on token value
        uint256 rewardPerDay = (userStake.amount * userStake.tokenPrice * config.rewardRate) / (BASIS_POINTS * PRICE_DECIMALS);
        uint256 pendingNew = (rewardPerDay * timeElapsed) / REWARD_INTERVAL;

        return userStake.pendingRewards + pendingNew;
    }

    /**
     * @dev Get pending rewards for a user
     * @param user Address of the user
     * @param token Address of memecoin
     * @return Pending rewards
     */
    function getPendingRewards(address user, address token) external view returns (uint256) {
        return calculatePendingRewards(user, token);
    }

    /**
     * @dev Get stake information for a user
     * @param user Address of the user
     * @param token Address of memecoin
     * @return Stake information
     */
    function getStakeInfo(address user, address token) external view returns (
        uint256 amount,
        uint256 tokenPrice,
        uint256 startTime,
        uint256 pendingRewards,
        uint256 claimedRewards,
        bool active
    ) {
        Stake memory userStake = stakes[user][token];
        return (
            userStake.amount,
            userStake.tokenPrice,
            userStake.startTime,
            calculatePendingRewards(user, token),
            userStake.claimedRewards,
            userStake.active
        );
    }

    /**
     * @dev Get current APY for a token (estimated)
     * @param token Address of memecoin
     * @return Estimated APY in basis points
     */
    function getTokenAPY(address token) external view returns (uint256) {
        TokenConfig memory config = tokenConfigs[token];
        if (!config.supported) {
            return 0;
        }

        // APY = Daily Rate × 365
        // Example: 0.1% daily = 36.5% APY
        return config.rewardRate * 365;
    }

    /**
     * @dev Add or update supported token configuration
     * @param token Address of memecoin
     * @param supported Whether token is supported
     * @param rewardRate Daily reward rate in basis points
     * @param minStakeAmount Minimum stake amount
     * @param maxStakeAmount Maximum stake amount
     * @param unstakeFeePercent Fee for unstaking (0-100)
     */
    function setTokenConfig(
        address token,
        bool supported,
        uint256 rewardRate,
        uint256 minStakeAmount,
        uint256 maxStakeAmount,
        uint256 unstakeFeePercent
    ) external onlyOwner {
        if (rewardRate > BASIS_POINTS || unstakeFeePercent > 100) {
            revert InvalidConfig();
        }

        bool wasSupported = tokenConfigs[token].supported;

        tokenConfigs[token] = TokenConfig({
            supported: supported,
            rewardRate: rewardRate,
            minStakeAmount: minStakeAmount,
            maxStakeAmount: maxStakeAmount,
            unstakeFeePercent: unstakeFeePercent
        });

        // Add to list if newly supported
        if (supported && !wasSupported) {
            supportedTokensList.push(token);
        }

        emit TokenConfigUpdated(token, supported, rewardRate);
    }

    /**
     * @dev Set $KARMA token address
     * @param _karmaToken Address of $KARMA token
     */
    function setKarmaToken(address _karmaToken) external onlyOwner {
        if (_karmaToken == address(0)) {
            revert InvalidConfig();
        }

        address oldToken = address(karmaToken);
        karmaToken = IERC20(_karmaToken);

        emit KarmaTokenUpdated(oldToken, _karmaToken);
    }

    /**
     * @dev Fund reward pool with $KARMA tokens
     * @param amount Amount of $KARMA to add to pool
     */
    function fundRewardPool(uint256 amount) external onlyOwner {
        bool success = karmaToken.transferFrom(msg.sender, address(this), amount);
        require(success, "Transfer failed");
    }

    /**
     * @dev Get contract status
     * @return Total supported tokens, Total $KARMA balance
     */
    function getContractStatus() external view returns (
        uint256 totalSupportedTokens,
        uint256 karmaBalance
    ) {
        return (
            supportedTokensList.length,
            karmaToken.balanceOf(address(this))
        );
    }

    /**
     * @dev Get all supported tokens
     * @return Array of supported token addresses
     */
    function getSupportedTokens() external view returns (address[] memory) {
        return supportedTokensList;
    }

    /**
     * @dev Get token configuration
     * @param token Address of memecoin
     * @return Token configuration
     */
    function getTokenConfig(address token) external view returns (
        bool supported,
        uint256 rewardRate,
        uint256 minStakeAmount,
        uint256 maxStakeAmount,
        uint256 unstakeFeePercent
    ) {
        TokenConfig memory config = tokenConfigs[token];
        return (
            config.supported,
            config.rewardRate,
            config.minStakeAmount,
            config.maxStakeAmount,
            config.unstakeFeePercent
        );
    }

    /**
     * @dev Get total staked amount for a token
     * @param token Address of memecoin
     * @return Total amount staked
     */
    function getTotalStaked(address token) external view returns (uint256) {
        return totalStakedPerToken[token];
    }

    /**
     * @dev Emergency pause - disable all unstaking
     */
    bool public paused = false;

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

    /**
     * @dev Helper function to get token price (should be implemented with oracle)
     * @param token Address of token
     * @return Price in USD (with 18 decimals)
     */
    function getTokenPrice(address token) public view returns (uint256) {
        // TODO: Implement price oracle
        // For now, return placeholder
        return 1e15; // $0.001 placeholder
    }

    /**
     * @dev Allow contract to receive tokens
     */
    receive() external payable {}
}
