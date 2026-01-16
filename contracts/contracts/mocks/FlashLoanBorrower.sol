// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../../interfaces/IDogePumpPair.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title FlashLoanBorrower
 * @dev Mock flash loan borrower for testing
 * @notice Tests flash loan functionality in DEX pairs
 */
contract FlashLoanBorrower {
    IDogePumpPair public pair;

    event FlashLoanExecuted(address token, address recipient, uint amount);

    constructor(address _pair) {
        pair = IDogePumpPair(_pair);
    }

    /**
     * @notice Execute flash loan
     * @param token Token to borrow
     * @param amount Amount to borrow
     * @param recipient Recipient of borrowed funds
     */
    function executeFlashLoan(
        address token,
        uint amount,
        address recipient
    ) external {
        // Approve pair to pull fee (0.3%)
        uint fee = (amount * 3) / 1000;
        IERC20(token).approve(address(pair), fee);

        // Execute flash loan
        pair.swap(amount, 0, address(this), abi.encode(token, recipient, amount));

        // Transfer borrowed amount to recipient
        IERC20(token).transfer(recipient, amount);

        emit FlashLoanExecuted(token, recipient, amount);
    }

    /**
     * @notice Callback for flash loan
     * @param sender Sender of the flash loan
     * @param amount0Out Amount of token0 borrowed
     * @param amount1Out Amount of token1 borrowed
     * @param data Encoded callback data
     */
    function dogePumpCall(
        address sender,
        uint amount0Out,
        uint amount1Out,
        bytes calldata data
    ) external {
        // Decode callback data
        (address token, address recipient, uint amount) = abi.decode(data, (address, address, uint));

        // Do something with the borrowed tokens (in real scenario, execute arbitrage)
        // For testing, just return them

        // Repay the loan + fee is handled by the pair contract automatically
    }
}
