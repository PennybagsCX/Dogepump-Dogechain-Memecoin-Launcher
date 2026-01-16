// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Timers.sol";

/**
 * @title KARMA Token
 * @dev ERC-20 token for Dogepump platform rewards
 *      Tokens are only minted by buyback contract
 *      Total supply capped at maximum uint256 value
 *      Deployed on DogeChain mainnet
 */
contract KARMA is ERC20, Ownable, ReentrancyGuard {
    using Timers for Timestamp;

    // Constants - UPDATED: Max uint256 value for maximum supply
    uint256 public constant MAX_SUPPLY = type(uint256).max;
    uint256 public constant MINT_CAP_PER_TRANSACTION = type(uint112).max; // Max ~5.2e27 tokens per mint

    // State variables
    address public buybackContract;
    address public stakingContract;
    bool public mintingEnabled = true;

    // Time lock for critical operations (2 days)
    uint256 public constant TIME_LOCK_DURATION = 2 days;
    uint256 public constant TIME_LOCK_EXPIRY = 30 days;

    struct TimelockedCall {
        address caller;
        bytes data;
        uint256 executeAfter;
        bool executed;
    }

    mapping(bytes32 => TimelockedCall) public timelockedCalls;

    // Events
    event MintingStatusChanged(bool enabled);
    event BuybackContractSet(address indexed oldContract, address indexed newContract);
    event StakingContractSet(address indexed oldContract, address indexed newContract);
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    event CallQueued(bytes32 indexed id, address indexed caller, bytes data);
    event CallExecuted(bytes32 indexed id, address indexed caller);

    // Errors
    error MintingDisabled();
    error MaxSupplyExceeded(uint256 currentSupply, uint256 requestedAmount);
    error UnauthorizedMinter(address caller);
    error InvalidAddress();
    error MintCapExceeded(uint256 amount, uint256 cap);
    error NotCaller();
    error TooEarly();
    error TooLate();
    error AlreadyExecuted();

    /**
     * @dev Constructor initializes the token
     * @param name Token name
     * @param symbol Token symbol
     */
    constructor(string memory name, string memory symbol) ERC20(name, symbol) Ownable(msg.sender) {}

    /**
     * @dev Mint tokens - only callable by buyback contract
     * @param to Address to receive tokens
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount)
        external
        nonReentrant
        onlyAuthorizedMinter
    {
        if (!mintingEnabled) {
            revert MintingDisabled();
        }

        if (amount > MINT_CAP_PER_TRANSACTION) {
            revert MintCapExceeded(amount, MINT_CAP_PER_TRANSACTION);
        }

        uint256 newSupply = totalSupply() + amount;
        if (newSupply > MAX_SUPPLY) {
            revert MaxSupplyExceeded(totalSupply(), amount);
        }

        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @dev Burn tokens from caller's balance
     * @param amount Amount to burn
     */
    function burn(uint256 amount) external nonReentrant {
        if (amount == 0) {
            revert InvalidAddress();
        }

        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }

    /**
     * @dev Set buyback contract address (timelocked)
     * @param _buybackContract Address of buyback contract
     */
    function setBuybackContract(address _buybackContract) external onlyOwner {
        if (_buybackContract == address(0)) {
            revert InvalidAddress();
        }

        bytes32 id = keccak256(abi.encodePacked("setBuybackContract", _buybackContract));
        _queueTimelockedCall(id, abi.encodeWithSignature("setBuybackContract(address)", _buybackContract));
    }

    /**
     * @dev Set staking contract address (timelocked)
     * @param _stakingContract Address of staking contract
     */
    function setStakingContract(address _stakingContract) external onlyOwner {
        if (_stakingContract == address(0)) {
            revert InvalidAddress();
        }

        bytes32 id = keccak256(abi.encodePacked("setStakingContract", _stakingContract));
        _queueTimelockedCall(id, abi.encodeWithSignature("setStakingContract(address)", _stakingContract));
    }

    /**
     * @dev Internal function to set buyback contract (bypasses timelock)
     */
    function _setBuybackContract(address _buybackContract) external {
        address oldContract = buybackContract;
        buybackContract = _buybackContract;
        emit BuybackContractSet(oldContract, _buybackContract);
    }

    /**
     * @dev Internal function to set staking contract (bypasses timelock)
     */
    function _setStakingContract(address _stakingContract) external {
        address oldContract = stakingContract;
        stakingContract = _stakingContract;
        emit StakingContractSet(oldContract, _stakingContract);
    }

    /**
     * @dev Enable or disable minting (immediate, no timelock for emergency)
     * @param enabled True to enable, false to disable
     */
    function setMintingEnabled(bool enabled) external onlyOwner {
        mintingEnabled = enabled;
        emit MintingStatusChanged(enabled);
    }

    /**
     * @dev Queue a timelocked call for critical operations
     * @param id Unique identifier for the call
     * @param data Encoded function call data
     */
    function _queueTimelockedCall(bytes32 id, bytes memory data) internal {
        timelockedCalls[id] = TimelockedCall({
            caller: msg.sender,
            data: data,
            executeAfter: block.timestamp + TIME_LOCK_DURATION,
            executed: false
        });

        emit CallQueued(id, msg.sender, data);
    }

    /**
     * @dev Execute a timelocked call
     * @param id Unique identifier for the call
     */
    function executeTimelockedCall(bytes32 id) external onlyOwner {
        TimelockedCall storage callData = timelockedCalls[id];

        if (callData.caller != msg.sender) {
            revert NotCaller();
        }
        if (block.timestamp < callData.executeAfter) {
            revert TooEarly();
        }
        if (callData.executed) {
            revert AlreadyExecuted();
        }
        if (block.timestamp > callData.executeAfter + TIME_LOCK_EXPIRY) {
            revert TooLate();
        }

        callData.executed = true;
        (bool success, ) = address(this).call(callData.data);
        require(success, "Call execution failed");

        emit CallExecuted(id, msg.sender);
    }

    /**
     * @dev Check if caller is authorized to mint
     */
    modifier onlyAuthorizedMinter() {
        if (msg.sender != buybackContract && msg.sender != owner()) {
            revert UnauthorizedMinter(msg.sender);
        }
        _;
    }

    /**
     * @dev Get current minting status
     */
    function isMintingEnabled() external view returns (bool) {
        return mintingEnabled;
    }

    /**
     * @dev Get remaining supply that can be minted
     */
    function remainingSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalSupply();
    }

    /**
     * @dev Get token details (for frontend)
     */
    function getTokenDetails() external view returns (
        string memory name,
        string memory symbol,
        uint256 supply,
        uint256 maxSupply,
        uint256 remaining,
        bool mintingActive
    ) {
        return (
            name(),
            symbol(),
            totalSupply(),
            MAX_SUPPLY,
            remainingSupply(),
            mintingEnabled
        );
    }
}
