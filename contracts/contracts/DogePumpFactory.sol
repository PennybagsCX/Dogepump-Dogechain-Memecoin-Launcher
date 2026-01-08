// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IDogePumpFactory.sol";
import "./DogePumpPair.sol";

/**
 * @title DogePumpFactory
 * @dev Factory contract for creating and managing trading pairs
 * @notice Uses create2 for deterministic pair addresses
 */
contract DogePumpFactory is IDogePumpFactory, Ownable {
    /// @notice Address that receives protocol fees
    address public override feeTo;

    /// @notice Address that can set fee recipient
    address public override feeToSetter;

    /// @notice Maximum number of pairs to prevent DoS
    uint public constant MAX_PAIRS = 10000;

    /// @notice Mapping of token pairs to pair addresses
    mapping(address => mapping(address => address)) public override getPair;

    /// @notice Array of all created pairs
    address[] public override allPairs;

    /// @notice Custom error for identical addresses
    error IdenticalAddresses();

    /// @notice Custom error for zero address
    error ZeroAddress();

    /// @notice Custom error for pair already exists
    error PairExists();

    /// @notice Custom error for forbidden access
    error Forbidden();

    /**
     * @dev Initializes the factory with fee setter
     * @param _feeToSetter Address that can set fee recipient
     */
    constructor(address _feeToSetter) Ownable(msg.sender) {
        if (_feeToSetter == address(0)) revert ZeroAddress();
        feeToSetter = _feeToSetter;
    }

    /**
     * @notice Creates a new trading pair for two tokens
     * @dev Uses create2 for deterministic addresses
     * @param tokenA Address of first token
     * @param tokenB Address of second token
     * @return pair Address of created pair
     */
    function createPair(address tokenA, address tokenB)
        external
        override
        returns (address pair)
    {
        if (tokenA == tokenB) revert IdenticalAddresses();

        (address token0, address token1) = tokenA < tokenB
            ? (tokenA, tokenB)
            : (tokenB, tokenA);

        if (token0 == address(0)) revert ZeroAddress();
        if (getPair[token0][token1] != address(0)) revert PairExists();

        bytes memory bytecode = type(DogePumpPair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));

        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }

        DogePumpPair(pair).initialize(token0, token1);

        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair;
        allPairs.push(pair);

        emit PairCreated(token0, token1, pair, allPairs.length);
    }

    /**
     * @notice Sets the protocol fee recipient
     * @dev Only callable by feeToSetter
     * @param _feeTo New fee recipient address
     */
    function setFeeTo(address _feeTo) external override {
        if (msg.sender != feeToSetter) revert Forbidden();
        feeTo = _feeTo;
    }

    /**
     * @notice Sets a new fee setter
     * @dev Only callable by current feeToSetter
     * @param _feeToSetter New fee setter address
     */
    function setFeeToSetter(address _feeToSetter) external override {
        if (msg.sender != feeToSetter) revert Forbidden();
        if (_feeToSetter == address(0)) revert ZeroAddress();
        feeToSetter = _feeToSetter;
    }

    /**
     * @notice Returns total number of pairs created
     * @return Total number of pairs
     */
    function allPairsLength() external view override returns (uint) {
        return allPairs.length;
    }
}
