/**
 * GasEstimator Tests
 * Tests for gas cost estimation service
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ethers } from 'ethers';
import { GasEstimator } from '../GasEstimator';

describe('GasEstimator', () => {
  let gasEstimator: GasEstimator;
  let mockProvider: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock provider
    mockProvider = {
      getFeeData: vi.fn().mockResolvedValue({
        gasPrice: ethers.parseUnits('20', 'gwei'),
        maxFeePerGas: ethers.parseUnits('30', 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei'),
      }),
      estimateGas: vi.fn().mockResolvedValue(BigInt(200000)),
    };

    gasEstimator = new GasEstimator(mockProvider);
  });

  describe('getGasPrice', () => {
    it('should fetch gas price from provider', async () => {
      const gasPrice = await gasEstimator.getGasPrice();

      expect(mockProvider.getFeeData).toHaveBeenCalled();
      expect(gasPrice).toBeDefined();
    });

    it('should cache gas price', async () => {
      await gasEstimator.getGasPrice();
      await gasEstimator.getGasPrice();

      // Should only call provider once due to caching
      expect(mockProvider.getFeeData).toHaveBeenCalledTimes(1);
    });

    it('should clear cache and fetch new price', async () => {
      await gasEstimator.getGasPrice();
      gasEstimator.clearCache();
      await gasEstimator.getGasPrice();

      expect(mockProvider.getFeeData).toHaveBeenCalledTimes(2);
    });
  });

  describe('getGasPriceGwei', () => {
    it('should return gas price in gwei', async () => {
      mockProvider.getFeeData.mockResolvedValueOnce({
        gasPrice: ethers.parseUnits('25', 'gwei'),
      });

      const gasPriceGwei = await gasEstimator.getGasPriceGwei();

      expect(gasPriceGwei).toBe(25);
    });
  });

  describe('getGasPrices', () => {
    it('should return slow, average, and fast gas prices', async () => {
      mockProvider.getFeeData.mockResolvedValueOnce({
        gasPrice: ethers.parseUnits('20', 'gwei'),
      });

      const prices = await gasEstimator.getGasPrices();

      expect(prices.slow).toBeDefined();
      expect(prices.average).toBeDefined();
      expect(prices.fast).toBeDefined();

      // Fast should be higher than average, which should be higher than slow
      const slowGwei = parseFloat(ethers.formatUnits(prices.slow, 'gwei'));
      const avgGwei = parseFloat(ethers.formatUnits(prices.average, 'gwei'));
      const fastGwei = parseFloat(ethers.formatUnits(prices.fast, 'gwei'));

      expect(fastGwei).toBeGreaterThan(avgGwei);
      expect(avgGwei).toBeGreaterThan(slowGwei);
    });
  });

  describe('estimateSwapGas', () => {
    it('should estimate gas for single-hop swap', async () => {
      mockProvider.getFeeData.mockResolvedValueOnce({
        gasPrice: ethers.parseUnits('20', 'gwei'),
      });

      gasEstimator.setGasCostUSD(2000); // $2000 per ETH

      const estimate = await gasEstimator.estimateSwapGas(false);

      expect(estimate.gasLimit).toBe('200000'); // SWAP_GAS_LIMIT
      expect(estimate.gasPrice).toBeDefined();
      expect(estimate.gasCost).toBeDefined();
      expect(estimate.gasCostUSD).toBeGreaterThan(0);
      expect(estimate.estimatedTime).toBeGreaterThan(0);
    });

    it('should estimate gas for multi-hop swap', async () => {
      mockProvider.getFeeData.mockResolvedValueOnce({
        gasPrice: ethers.parseUnits('20', 'gwei'),
      });

      gasEstimator.setGasCostUSD(2000);

      const estimate = await gasEstimator.estimateSwapGas(true);

      expect(estimate.gasLimit).toBe('300000'); // SWAP_MULTI_HOP_GAS_LIMIT
    });
  });

  describe('estimateAddLiquidityGas', () => {
    it('should estimate gas for add liquidity', async () => {
      mockProvider.getFeeData.mockResolvedValueOnce({
        gasPrice: ethers.parseUnits('20', 'gwei'),
      });

      gasEstimator.setGasCostUSD(2000);

      const estimate = await gasEstimator.estimateAddLiquidityGas();

      expect(estimate.gasLimit).toBe('250000'); // ADD_LIQUIDITY_GAS_LIMIT
      expect(estimate.gasCostUSD).toBeGreaterThan(0);
    });
  });

  describe('estimateRemoveLiquidityGas', () => {
    it('should estimate gas for remove liquidity', async () => {
      mockProvider.getFeeData.mockResolvedValueOnce({
        gasPrice: ethers.parseUnits('20', 'gwei'),
      });

      gasEstimator.setGasCostUSD(2000);

      const estimate = await gasEstimator.estimateRemoveLiquidityGas();

      expect(estimate.gasLimit).toBe('200000'); // REMOVE_LIQUIDITY_GAS_LIMIT
      expect(estimate.gasCostUSD).toBeGreaterThan(0);
    });
  });

  describe('estimateCustomGas', () => {
    it('should estimate gas for custom gas limit', async () => {
      mockProvider.getFeeData.mockResolvedValueOnce({
        gasPrice: ethers.parseUnits('20', 'gwei'),
      });

      gasEstimator.setGasCostUSD(2000);

      const estimate = await gasEstimator.estimateCustomGas('500000');

      expect(estimate.gasLimit).toBe('500000');
      expect(estimate.gasCostUSD).toBeGreaterThan(0);
    });
  });

  describe('estimateTransactionGas', () => {
    it('should estimate gas for transaction', async () => {
      mockProvider.getFeeData.mockResolvedValueOnce({
        gasPrice: ethers.parseUnits('20', 'gwei'),
      });
      mockProvider.estimateGas.mockResolvedValueOnce(BigInt(150000));

      gasEstimator.setGasCostUSD(2000);

      const estimate = await gasEstimator.estimateTransactionGas(
        '0x7B4328c127B85369D9f82ca0503B000D09CF9180',
        '0xabcdef',
        '1000000000000000000'
      );

      expect(estimate.gasLimit).toBe('150000');
      expect(mockProvider.estimateGas).toHaveBeenCalledWith({
        to: '0x7B4328c127B85369D9f82ca0503B000D09CF9180',
        data: '0xabcdef',
        value: '1000000000000000000',
      });
    });
  });

  describe('getRecommendedGasPrice', () => {
    it('should return average gas price by default', async () => {
      mockProvider.getFeeData.mockResolvedValueOnce({
        gasPrice: ethers.parseUnits('20', 'gwei'),
      });

      const gasPrice = await gasEstimator.getRecommendedGasPrice();

      expect(gasPrice).toBeDefined();
    });

    it('should return slow gas price', async () => {
      mockProvider.getFeeData.mockResolvedValueOnce({
        gasPrice: ethers.parseUnits('20', 'gwei'),
      });

      const slow = await gasEstimator.getRecommendedGasPrice('slow');
      const average = await gasEstimator.getRecommendedGasPrice('average');

      const slowGwei = parseFloat(ethers.formatUnits(slow, 'gwei'));
      const avgGwei = parseFloat(ethers.formatUnits(average, 'gwei'));

      expect(slowGwei).toBeLessThan(avgGwei);
    });

    it('should return fast gas price', async () => {
      mockProvider.getFeeData.mockResolvedValueOnce({
        gasPrice: ethers.parseUnits('20', 'gwei'),
      });

      const fast = await gasEstimator.getRecommendedGasPrice('fast');
      const average = await gasEstimator.getRecommendedGasPrice('average');

      const fastGwei = parseFloat(ethers.formatUnits(fast, 'gwei'));
      const avgGwei = parseFloat(ethers.formatUnits(average, 'gwei'));

      expect(fastGwei).toBeGreaterThan(avgGwei);
    });
  });

  describe('convertGasCostToUSD', () => {
    it('should convert gas cost to USD', () => {
      gasEstimator.setGasCostUSD(2000); // $2000 per ETH

      const usd = gasEstimator.convertGasCostToUSD(
        ethers.parseEther('0.001').toString() // 0.001 ETH
      );

      expect(usd).toBe(2); // 0.001 * 2000 = 2 USD
    });
  });

  describe('formatGasCost', () => {
    it('should format small gas cost in gwei', () => {
      const formatted = gasEstimator.formatGasCost('5000000000'); // 5 gwei

      expect(formatted).toContain('gwei');
    });

    it('should format medium gas cost in mETH', () => {
      const formatted = gasEstimator.formatGasCost(
        ethers.parseEther('0.005').toString()
      );

      expect(formatted).toContain('mETH');
    });

    it('should format large gas cost in ETH', () => {
      const formatted = gasEstimator.formatGasCost(
        ethers.parseEther('0.1').toString()
      );

      expect(formatted).toContain('ETH');
    });
  });

  describe('formatGasCostUSD', () => {
    it('should format very small USD cost', () => {
      const formatted = gasEstimator.formatGasCostUSD(0.001);

      expect(formatted).toBe('<$0.01');
    });

    it('should format cents USD cost', () => {
      const formatted = gasEstimator.formatGasCostUSD(0.50);

      expect(formatted).toBe('$0.50');
    });

    it('should format dollars USD cost', () => {
      const formatted = gasEstimator.formatGasCostUSD(5.50);

      expect(formatted).toBe('$5.50');
    });
  });

  describe('formatGasLimit', () => {
    it('should format small gas limit', () => {
      const formatted = gasEstimator.formatGasLimit('500');

      expect(formatted).toBe('500');
    });

    it('should format medium gas limit in K', () => {
      const formatted = gasEstimator.formatGasLimit('150000');

      expect(formatted).toContain('K');
    });

    it('should format large gas limit in M', () => {
      const formatted = gasEstimator.formatGasLimit('1500000');

      expect(formatted).toContain('M');
    });
  });

  describe('formatGasPrice', () => {
    it('should format gas price in gwei', () => {
      const formatted = gasEstimator.formatGasPrice(
        ethers.parseUnits('25.5', 'gwei')
      );

      expect(formatted).toBe('25.50 gwei');
    });
  });

  describe('formatEstimatedTime', () => {
    it('should format seconds', () => {
      const formatted = gasEstimator.formatEstimatedTime(30);

      expect(formatted).toBe('30s');
    });

    it('should format minutes and seconds', () => {
      const formatted = gasEstimator.formatEstimatedTime(90);

      expect(formatted).toBe('1m 30s');
    });

    it('should format hours and minutes', () => {
      const formatted = gasEstimator.formatEstimatedTime(3661);

      expect(formatted).toBe('1h 1m');
    });
  });

  describe('formatGasEstimate', () => {
    it('should format complete gas estimate', async () => {
      mockProvider.getFeeData.mockResolvedValueOnce({
        gasPrice: ethers.parseUnits('20', 'gwei'),
      });

      gasEstimator.setGasCostUSD(2000);

      const estimate = await gasEstimator.estimateSwapGas();
      const formatted = gasEstimator.formatGasEstimate(estimate);

      expect(formatted.gasLimit).toBeDefined();
      expect(formatted.gasPrice).toBeDefined();
      expect(formatted.gasCost).toBeDefined();
      expect(formatted.gasCostUSD).toBeDefined();
      expect(formatted.estimatedTime).toBeDefined();
    });
  });

  describe('setGasCostUSD and getGasCostUSD', () => {
    it('should set and get gas cost USD rate', () => {
      gasEstimator.setGasCostUSD(2500);

      expect(gasEstimator.getGasCostUSD()).toBe(2500);
    });
  });

  describe('clearCache', () => {
    it('should clear gas price cache', async () => {
      await gasEstimator.getGasPrice();

      gasEstimator.clearCache();

      // Should fetch from provider again
      await gasEstimator.getGasPrice();

      expect(mockProvider.getFeeData).toHaveBeenCalledTimes(2);
    });
  });
});
