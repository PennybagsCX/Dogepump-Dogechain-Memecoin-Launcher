// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IGraduationManager
 * @dev Interface for GraduationManager contract
 * @notice Manages automatic migration from bonding curve to AMM pools
 */
interface IGraduationManager {
    /// @notice Emitted when a token graduates to AMM pool
    /// @param token Address of graduated token
    /// @param pool Address of created AMM pool
    /// @param liquidityMigrated Amount of liquidity migrated
    event TokenGraduated(
        address indexed token,
        address indexed pool,
        uint liquidityMigrated
    );

    /// @notice Emitted when graduation threshold is updated
    /// @param oldThreshold Old threshold value
    /// @param newThreshold New threshold value
    event GraduationThresholdUpdated(
        uint oldThreshold,
        uint newThreshold
    );

    /// @notice Checks if token has graduated
    /// @param token Address to check
    /// @return graduated True if token has graduated
    function isGraduated(address token) external view returns (bool);

    /// @notice Gets AMM pool address for a token
    /// @param token Address to query
    /// @return pool Address of AMM pool (or zero address)
    function getPoolForToken(address token) external view returns (address);

    /// @notice Gets graduation threshold in DC
    /// @return threshold Market cap threshold for graduation
    function graduationThreshold() external view returns (uint);

    /// @notice Gets market cap at which token graduated
    /// @param token Address to query
    /// @return marketCap Market cap at graduation
    function tokenGraduationMarketCap(address token)
        external
        view
        returns (uint);

    /// @notice Checks and executes graduation if threshold is met
    /// @param token Address of token to check
    function checkAndGraduate(address token) external;

    /// @notice Manually triggers graduation (admin only)
    /// @param token Address of token to graduate
    function executeGraduation(address token) external;

    /// @notice Sets new graduation threshold (admin only)
    /// @param threshold New threshold value
    function setGraduationThreshold(uint threshold) external;

    /// @notice Gets DC token address
    /// @return dcToken DC token address
    function dcToken() external view returns (address);

    /// @notice Gets price oracle address
    /// @return priceOracle Price oracle address
    function priceOracle() external view returns (address);

    /// @notice Gets factory address
    /// @return factory DEX factory address
    function factory() external view returns (address);

    /// @notice Gets router address
    /// @return router DEX router address
    function router() external view returns (address);
}
