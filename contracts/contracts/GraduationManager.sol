// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IGraduationManager.sol";
import "../interfaces/IDogePumpFactory.sol";
import "../interfaces/IDogePumpRouter.sol";

/**
 * @title GraduationManager
 * @dev Manages automatic migration from bonding curve to AMM pools
 * @notice Automatically creates AMM pools when tokens reach graduation threshold
 */
contract GraduationManager is IGraduationManager, Ownable, ReentrancyGuard, Pausable {
    /// @notice Factory contract address
    address public immutable override factory;

    /// @notice Router contract address
    address public immutable override router;

    /// @notice DC token address
    address public immutable override dcToken;

    /// @notice Price oracle address
    address public immutable override priceOracle;

    /// @notice Graduation threshold in DC (6900 DC = $6,900 USD)
    uint public override graduationThreshold;

    /// @notice Maps token to graduated status
    mapping(address => bool) public override isGraduated;

    /// @notice Maps token to AMM pool address
    mapping(address => address) public override getPoolForToken;

    /// @notice Maps token to graduation market cap
    mapping(address => uint) public override tokenGraduationMarketCap;

    /// @notice Custom error for already graduated
    error AlreadyGraduated();

    /// @notice Custom error for below threshold
    error BelowGraduationThreshold();

    /// @notice Custom error for no liquidity
    error NoLiquidityToMigrate();

    /// @notice Custom error for zero address
    error ZeroAddress();

    /**
     * @dev Initializes graduation manager
     * @param _factory DEX factory address
     * @param _router DEX router address
     * @param _dcToken DC token address
     * @param _priceOracle Price oracle address
     * @param _graduationThreshold Market cap threshold for graduation
     */
    constructor(
        address _factory,
        address _router,
        address _dcToken,
        address _priceOracle,
        uint _graduationThreshold
    ) Ownable(msg.sender) {
        if (_factory == address(0)) revert ZeroAddress();
        if (_router == address(0)) revert ZeroAddress();
        if (_dcToken == address(0)) revert ZeroAddress();
        if (_priceOracle == address(0)) revert ZeroAddress();
        if (_graduationThreshold == 0) revert("ZERO_THRESHOLD");

        factory = _factory;
        router = _router;
        dcToken = _dcToken;
        priceOracle = _priceOracle;
        graduationThreshold = _graduationThreshold;
    }

    /**
     * @notice Checks and executes graduation if threshold is met
     * @dev Can be called by anyone when token reaches threshold
     * @param token Address of token to check
     */
    function checkAndGraduate(address token) external override whenNotPaused {
        if (isGraduated[token]) revert AlreadyGraduated();
        
        // Only token owner can trigger graduation
        require(
            IBondingCurveToken(token).owner() == msg.sender,
            "Only token owner can graduate"
        );

        // Get current market cap from bonding curve contract
        uint marketCapUSD = IBondingCurveToken(token).getMarketCap();

        // Convert to DC using TWAP price oracle (more resistant to manipulation)
        uint dcPriceUSD = IPriceOracle(priceOracle).getTWAPDCPriceUSD();
        uint marketCapDC = (marketCapUSD * 1e18) / dcPriceUSD;

        // Check if threshold is met
        if (marketCapDC < graduationThreshold) revert BelowGraduationThreshold();

        // Execute graduation
        _executeGraduation(token, marketCapDC);
    }

    /**
     * @notice Manually triggers graduation (admin only)
     * @dev Allows admin to force graduation for testing or edge cases
     * @param token Address of token to graduate
     */
    function executeGraduation(address token) external override onlyOwner whenNotPaused {
        if (isGraduated[token]) revert AlreadyGraduated();
        _executeGraduation(token, 0); // Market cap will be fetched in function
    }

    /**
     * @notice Internal graduation execution logic
     * @dev Creates AMM pool and migrates liquidity
     * @param token Address of token to graduate
     * @param marketCapDC Market cap in DC (0 if not provided)
     */
    function _executeGraduation(address token, uint marketCapDC) internal nonReentrant {
        // Get market cap if not provided
        if (marketCapDC == 0) {
            uint marketCapUSD = IBondingCurveToken(token).getMarketCap();
            // Use TWAP for resistance to manipulation
            uint dcPriceUSD = IPriceOracle(priceOracle).getTWAPDCPriceUSD();
            marketCapDC = (marketCapUSD * 1e18) / dcPriceUSD;
        }

        // Create AMM pool
        address pool = IDogePumpFactory(factory).createPair(token, dcToken);
        getPoolForToken[token] = pool;
        tokenGraduationMarketCap[token] = marketCapDC;

        // Get virtual liquidity from bonding curve
        uint bondingCurveLiquidity = IBondingCurveToken(token).getVirtualLiquidity();
        if (bondingCurveLiquidity == 0) revert NoLiquidityToMigrate();

        // Calculate liquidity amounts for AMM pool
        // Split liquidity evenly between token and DC
        uint tokenAmount = bondingCurveLiquidity / 2;
        uint dcAmount = bondingCurveLiquidity / 2;

        // Transfer liquidity to pool
        // Note: This assumes caller has approved tokens or is the bonding curve contract
        IERC20(token).transferFrom(msg.sender, pool, tokenAmount);
        IERC20(dcToken).transferFrom(msg.sender, pool, dcAmount);

        // Mint LP tokens to creator
        uint liquidity = IDogePumpPair(pool).mint(msg.sender);

        // Burn bonding curve liquidity
        IBondingCurveToken(token).burnLiquidity(bondingCurveLiquidity);

        // Mark as graduated
        isGraduated[token] = true;

        emit TokenGraduated(token, pool, liquidity);
    }

    /**
     * @notice Sets new graduation threshold (admin only)
     * @param threshold New threshold value
     */
    function setGraduationThreshold(uint threshold) external override onlyOwner {
        if (threshold == 0) revert("ZERO_THRESHOLD");
        uint oldThreshold = graduationThreshold;
        graduationThreshold = threshold;
        emit GraduationThresholdUpdated(oldThreshold, threshold);
    }

    /**
     * @notice Pauses graduation operations (admin only)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpauses graduation operations (admin only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}

/**
 * @title IBondingCurveToken
 * @dev Interface for bonding curve token
 * @notice Used to get market cap and virtual liquidity
 */
interface IBondingCurveToken {
    /**
     * @notice Gets current market cap in USD
     * @return marketCap Market cap in USD (18 decimals)
     */
    function getMarketCap() external view returns (uint);
    
    /**
     * @notice Gets virtual liquidity in pool
     * @return liquidity Virtual liquidity amount
     */
    function getVirtualLiquidity() external view returns (uint);
    
    /**
     * @notice Gets token owner
     * @return owner Address of token owner
     */
    function owner() external view returns (address);
    
    /**
     * @notice Burns liquidity from bonding curve
     * @param amount Amount to burn
     */
    function burnLiquidity(uint amount) external;
}

/**
 * @title IPriceOracle
 * @dev Interface for price oracle
 * @notice Provides DC price in USD
 */
interface IPriceOracle {
    /**
     * @notice Gets DC price in USD
     * @return price DC price in USD (18 decimals)
     */
    function getDCPriceUSD() external view returns (uint);

    /**
     * @notice Gets TWAP DC price in USD (Time-Weighted Average Price)
     * @dev More resistant to manipulation than spot price
     * @return price TWAP DC price in USD (18 decimals)
     */
    function getTWAPDCPriceUSD() external view returns (uint);

    /**
     * @notice Gets wDOGE price in USD
     * @return price wDOGE price in USD (18 decimals)
     */
    function getWDOGEPriceUSD() external view returns (uint);
}

/**
 * @title IDogePumpPair
 * @dev Minimal interface for pair contract
 * @notice Used for minting LP tokens
 */
interface IDogePumpPair {
    /**
     * @notice Mints LP tokens
     * @param to Address to receive LP tokens
     * @return liquidity Amount minted
     */
    function mint(address to) external returns (uint liquidity);
}
