// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Fee Collector Contract
 * @dev Accumulates trading fees and routes them to appropriate destinations
 *      1% of 2% platform fee goes to buyback
 *      1% of 2% platform fee goes to platform revenue
 *      Deployed on DogeChain mainnet
 */
contract FeeCollector is Ownable, ReentrancyGuard {
    IERC20 public immutable feeToken; // DC or WDOGE
    address public buybackContract;
    address public revenueWallet;

    uint256 public constant BUYBACK_BASIS_POINTS = 500; // 0.5% (half of 1% fee)
    uint256 public constant REVENUE_BASIS_POINTS = 500; // 0.5% (other half)

    // Events
    event FeesCollected(uint256 amount, uint256 timestamp);
    event BuybackWithdrawn(uint256 amount, address indexed to);
    event RevenueWithdrawn(uint256 amount, address indexed to);
    event BuybackContractSet(address indexed oldContract, address indexed newContract);
    event RevenueWalletSet(address indexed oldWallet, address indexed newWallet);

    // Errors
    error InvalidAddress();
    error InsufficientBalance();
    error Unauthorized();

    /**
     * @dev Constructor
     * @param _feeToken Address of fee token (DC or WDOGE)
     * @param _revenueWallet Address to receive platform revenue
     */
    constructor(address _feeToken, address _revenueWallet) Ownable(msg.sender) {
        if (_feeToken == address(0) || _revenueWallet == address(0)) {
            revert InvalidAddress();
        }

        feeToken = IERC20(_feeToken);
        revenueWallet = _revenueWallet;
    }

    /**
     * @dev Withdraw buyback fees (only callable by buyback contract)
     * @param amount Amount to withdraw
     * @param to Address to send to
     */
    function withdrawBuybackFees(uint256 amount, address to) external nonReentrant {
        if (msg.sender != buybackContract) {
            revert Unauthorized();
        }

        uint256 balance = feeToken.balanceOf(address(this));
        if (amount > balance || amount == 0) {
            revert InsufficientBalance();
        }

        bool success = feeToken.transfer(to, amount);
        require(success, "Transfer failed");

        emit BuybackWithdrawn(amount, to);
    }

    /**
     * @dev Withdraw platform revenue
     * @param amount Amount to withdraw
     */
    function withdrawRevenue(uint256 amount) external onlyOwner nonReentrant {
        uint256 balance = feeToken.balanceOf(address(this));
        if (amount > balance || amount == 0) {
            revert InsufficientBalance();
        }

        bool success = feeToken.transfer(revenueWallet, amount);
        require(success, "Transfer failed");

        emit RevenueWithdrawn(amount, revenueWallet);
    }

    /**
     * @dev Get buyback fee balance
     * @return Available buyback fees
     */
    function getBuybackFees() external view returns (uint256) {
        return feeToken.balanceOf(address(this));
    }

    /**
     * @dev Set buyback contract address
     * @param _buybackContract Address of buyback contract
     */
    function setBuybackContract(address _buybackContract) external onlyOwner {
        if (_buybackContract == address(0)) {
            revert InvalidAddress();
        }

        address oldContract = buybackContract;
        buybackContract = _buybackContract;
        emit BuybackContractSet(oldContract, _buybackContract);
    }

    /**
     * @dev Set revenue wallet address
     * @param _revenueWallet Address to receive revenue
     */
    function setRevenueWallet(address _revenueWallet) external onlyOwner {
        if (_revenueWallet == address(0)) {
            revert InvalidAddress();
        }

        address oldWallet = revenueWallet;
        revenueWallet = _revenueWallet;
        emit RevenueWalletSet(oldWallet, _revenueWallet);
    }

    /**
     * @dev Allow contract to receive fees
     */
    receive() external payable {}
}
