// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IDogePumpFactory
 * @dev Interface for DogePumpFactory contract
 * @notice Factory contract for creating and managing trading pairs
 */
interface IDogePumpFactory {
    /// @notice Emitted when a new pair is created
    /// @param token0 First token address (sorted)
    /// @param token1 Second token address (sorted)
    /// @param pair Address of the created pair
    /// @param index Index in allPairs array
    event PairCreated(
        address indexed token0,
        address indexed token1,
        address pair,
        uint index
    );

    /// @notice Creates a new trading pair for two tokens
    /// @param tokenA Address of first token
    /// @param tokenB Address of second token
    /// @return pair Address of the created pair
    function createPair(address tokenA, address tokenB) external returns (address pair);

    /// @notice Returns the pair address for two tokens
    /// @param tokenA Address of first token
    /// @param tokenB Address of second token
    /// @return pair Address of the pair (or zero address if not exists)
    function getPair(address tokenA, address tokenB) external view returns (address pair);

    /// @notice Returns the pair address at a specific index
    /// @param index Index in the allPairs array
    /// @return pair Address of the pair at index
    function allPairs(uint index) external view returns (address pair);

    /// @notice Returns the total number of pairs created
    /// @return Total number of pairs
    function allPairsLength() external view returns (uint);

    /// @notice Address that receives protocol fees
    /// @return Fee recipient address
    function feeTo() external view returns (address);

    /// @notice Sets the protocol fee recipient
    /// @param _feeTo New fee recipient address
    function setFeeTo(address _feeTo) external;

    /// @notice Address that can set the fee recipient
    /// @return Fee setter address
    function feeToSetter() external view returns (address);

    /// @notice Sets a new fee setter
    /// @param _feeToSetter New fee setter address
    function setFeeToSetter(address _feeToSetter) external;
}
