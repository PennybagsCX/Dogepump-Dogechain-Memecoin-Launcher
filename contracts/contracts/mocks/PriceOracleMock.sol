// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PriceOracleMock
 * @dev Mock price oracle for testing
 * @notice Provides mock price feeds for DC and WDOGE tokens
 */
contract PriceOracleMock {
    uint private dcPriceUSD;
    uint private wdogePriceUSD;

    constructor(uint _dcPriceUSD, uint _wdogePriceUSD) {
        dcPriceUSD = _dcPriceUSD;
        wdogePriceUSD = _wdogePriceUSD;
    }

    /**
     * @notice Get DC price in USD
     * @return Price in USD (8 decimals)
     */
    function getDCPriceUSD() external view returns (uint) {
        return dcPriceUSD;
    }

    /**
     * @notice Get TWAP DC price in USD
     * @return TWAP price in USD (8 decimals)
     */
    function getTWAPDCPriceUSD() external view returns (uint) {
        return dcPriceUSD; // Same as spot for testing
    }

    /**
     * @notice Get WDOGE price in USD
     * @return Price in USD (8 decimals)
     */
    function getWDOGEPriceUSD() external view returns (uint) {
        return wdogePriceUSD;
    }

    /**
     * @notice Update prices (for testing)
     * @param _dcPriceUSD New DC price
     * @param _wdogePriceUSD New WDOGE price
     */
    function setPrices(uint _dcPriceUSD, uint _wdogePriceUSD) external {
        dcPriceUSD = _dcPriceUSD;
        wdogePriceUSD = _wdogePriceUSD;
    }
}
