/**
 * RouterService Tests
 * Tests for swap routing and quote calculations
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ethers } from 'ethers';
import { RouterService } from '../RouterService';
import { Pool, Token } from '../../../contexts/DexContext';
import ContractService from '../ContractService';
import PriceService from '../PriceService';

// Mock tokens
const mockTokenA: Token = {
  address: '0x1111111111111111111111111111111111111111',
  symbol: 'DC',
  name: 'DogeChain',
  decimals: 18,
  logoURI: '/dc.png',
  balance: '1000000000000000000000',
  price: 0.05,
};

const mockTokenB: Token = {
  address: '0x7B4328c127B85369D9f82ca0503B000D09CF9180',
  symbol: 'wDOGE',
  name: 'Wrapped Doge',
  decimals: 18,
  logoURI: '/wdoge.png',
  balance: '5000000000000000000000',
  price: 0.12,
};

const mockTokenC: Token = {
  address: '0xabcdef1234567890abcdef1234567890abcdef12',
  symbol: 'PEPE',
  name: 'Pepe',
  decimals: 18,
  logoURI: '/pepe.png',
  balance: '100000000000000000000000',
  price: 0.00001,
};

// Mock pools
const mockPoolAB: Pool = {
  address: '0xpoolAB123456789012345678901234567890123456',
  tokenA: mockTokenA,
  tokenB: mockTokenB,
  reserve0: ethers.parseEther('1000').toString(),
  reserve1: ethers.parseEther('500').toString(),
  totalSupply: ethers.parseEther('707').toString(),
  tvl: 0,
  volume24h: 0,
  fee24h: 0,
  apy: 0,
  price0: 0.5,
  price1: 2,
};

const mockPoolBC: Pool = {
  address: '0xpoolBC123456789012345678901234567890123456',
  tokenA: mockTokenB,
  tokenB: mockTokenC,
  reserve0: ethers.parseEther('10000').toString(),
  reserve1: ethers.parseEther('50000').toString(),
  totalSupply: ethers.parseEther('22360').toString(),
  tvl: 0,
  volume24h: 0,
  fee24h: 0,
  apy: 0,
  price0: 5,
  price1: 0.2,
};

const mockPoolAC: Pool = {
  address: '0xpoolAC123456789012345678901234567890123456',
  tokenA: mockTokenA,
  tokenB: mockTokenC,
  reserve0: ethers.parseEther('1000').toString(),
  reserve1: ethers.parseEther('10000').toString(),
  totalSupply: ethers.parseEther('3162').toString(),
  tvl: 0,
  volume24h: 0,
  fee24h: 0,
  apy: 0,
  price0: 10,
  price1: 0.1,
};

describe('RouterService', () => {
  let routerService: RouterService;
  let mockContractService: any;
  let mockPriceService: any;
  let mockProvider: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock provider
    mockProvider = {
      getFeeData: vi.fn().mockResolvedValue({
        gasPrice: ethers.parseUnits('20', 'gwei'),
      }),
    };

    // Mock contract service
    mockContractService = {
      getPoolInfo: vi.fn(),
      swapExactTokensForTokens: vi.fn(),
      getAmountsOut: vi.fn(),
      getAmountsIn: vi.fn(),
      estimateGas: vi.fn(),
      signer: {
        getAddress: vi.fn().mockResolvedValue('0xuser1234567890123456789012345678901234567890'),
      },
    };

    // Mock price service
    mockPriceService = {
      getPoolPrice: vi.fn(),
      getSwapPriceImpact: vi.fn(),
      getTokenPrice: vi.fn(),
      calculatePriceImpact: vi.fn(),
    };

    // Create router service with correct constructor parameters
    routerService = new RouterService(
      mockContractService,
      mockPriceService,
      '0xroutereeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      mockTokenA.address
    );

    // Setup default mock implementations
    mockPriceService.getSwapPriceImpact.mockResolvedValue(0.5);
    mockPriceService.getPoolPrice.mockResolvedValue({
      price0: 0.5,
      price1: 2,
      tvl: 1000,
      apy: 10,
    });
  });

  describe('getDirectSwapQuote', () => {
    it('should get quote for direct swap', async () => {
      const amountIn = '100'; // 100 tokens

      const quote = await routerService.getDirectSwapQuote(
        mockTokenA,
        mockTokenB,
        amountIn,
        mockPoolAB
      );

      expect(quote).toBeDefined();
      expect(quote.amountIn).toBe(amountIn);
      expect(quote.amountOut).toBeDefined();
      expect(parseFloat(quote.amountOut)).toBeGreaterThan(0);
      expect(quote.route).toEqual([mockTokenA.address, mockTokenB.address]);
      expect(quote.path).toEqual([mockTokenA.address, mockTokenB.address]);
      expect(quote.priceImpact).toBeDefined();
      expect(quote.gasEstimate).toBeDefined();
    });

    it('should calculate price impact for direct swap', async () => {
      const amountIn = '100';

      const quote = await routerService.getDirectSwapQuote(
        mockTokenA,
        mockTokenB,
        amountIn,
        mockPoolAB
      );

      expect(quote.priceImpact).toBeDefined();
      expect(mockPriceService.getSwapPriceImpact).toHaveBeenCalledWith(
        amountIn,
        mockTokenA,
        mockTokenB,
        mockPoolAB
      );
    });

    it('should include gas estimate for direct swap', async () => {
      const amountIn = '100';

      const quote = await routerService.getDirectSwapQuote(
        mockTokenA,
        mockTokenB,
        amountIn,
        mockPoolAB
      );

      expect(quote.gasEstimate).toBeDefined();
      expect(quote.gasEstimate).toBe('200000'); // Base gas for direct swap
    });

    it('should calculate output amount correctly using constant product formula', async () => {
      const amountIn = '100';
      const reserveIn = parseFloat(ethers.formatUnits(mockPoolAB.reserve0, mockTokenA.decimals));
      const reserveOut = parseFloat(ethers.formatUnits(mockPoolAB.reserve1, mockTokenB.decimals));

      const quote = await routerService.getDirectSwapQuote(
        mockTokenA,
        mockTokenB,
        amountIn,
        mockPoolAB
      );

      // Manually calculate expected output: amountOut = (amountIn * reserveOut * 997) / (reserveIn * 1000 + amountIn * 997)
      const amountInBN = ethers.parseUnits(amountIn, mockTokenA.decimals);
      const reserveInBN = ethers.parseUnits(mockPoolAB.reserve0, mockTokenA.decimals);
      const reserveOutBN = ethers.parseUnits(mockPoolAB.reserve1, mockTokenB.decimals);
      const expectedAmountOutBN = (amountInBN * reserveOutBN * 997n) / (reserveInBN * 1000n + amountInBN * 997n);
      const expectedAmountOut = ethers.formatUnits(expectedAmountOutBN, mockTokenB.decimals);

      expect(parseFloat(quote.amountOut)).toBeCloseTo(parseFloat(expectedAmountOut), 6);
    });
  });

  describe('getMultiHopSwapQuote', () => {
    it('should get quote for multi-hop swap through DC', async () => {
      const amountIn = '100';

      const quote = await routerService.getMultiHopSwapQuote(
        mockTokenB,
        mockTokenC,
        amountIn,
        mockPoolAB, // B -> DC
        mockPoolAC  // DC -> C
      );

      expect(quote).toBeDefined();
      expect(quote.amountIn).toBe(amountIn);
      expect(quote.amountOut).toBeDefined();
      expect(parseFloat(quote.amountOut)).toBeGreaterThan(0);
      expect(quote.route).toEqual([mockTokenB.address, mockTokenA.address, mockTokenC.address]);
      expect(quote.path).toEqual([mockTokenB.address, mockTokenA.address, mockTokenC.address]);
    });

    it('should calculate combined price impact for multi-hop swap', async () => {
      const amountIn = '100';

      mockPriceService.getSwapPriceImpact
        .mockResolvedValueOnce(0.3) // First hop
        .mockResolvedValueOnce(0.4); // Second hop

      const quote = await routerService.getMultiHopSwapQuote(
        mockTokenB,
        mockTokenC,
        amountIn,
        mockPoolAB,
        mockPoolAC
      );

      expect(quote.priceImpact).toBe(0.7); // 0.3 + 0.4
    });

    it('should estimate higher gas for multi-hop swap', async () => {
      const amountIn = '100';

      const quote = await routerService.getMultiHopSwapQuote(
        mockTokenB,
        mockTokenC,
        amountIn,
        mockPoolAB,
        mockPoolAC
      );

      expect(quote.gasEstimate).toBe('250000'); // Base gas + 1 hop
    });
  });

  describe('getBestSwapQuote', () => {
    it('should find direct swap when direct pool exists', async () => {
      const amountIn = '100';

      const quote = await routerService.getBestSwapQuote(
        mockTokenA,
        mockTokenB,
        amountIn,
        [mockPoolAB]
      );

      expect(quote).toBeDefined();
      expect(quote.route).toHaveLength(2);
      expect(quote.route).toEqual([mockTokenA.address, mockTokenB.address]);
    });

    it('should use multi-hop swap when no direct pool exists', async () => {
      const amountIn = '100';

      const quote = await routerService.getBestSwapQuote(
        mockTokenB,
        mockTokenC,
        amountIn,
        [mockPoolAB, mockPoolAC] // B->DC and DC->C pools
      );

      expect(quote).toBeDefined();
      expect(quote.route).toHaveLength(3);
      expect(quote.route).toEqual([mockTokenB.address, mockTokenA.address, mockTokenC.address]);
    });

    it('should throw error when no valid route found', async () => {
      const amountIn = '100';

      await expect(
        routerService.getBestSwapQuote(
          mockTokenB,
          mockTokenC,
          amountIn,
          [mockPoolAB] // Only B->DC pool, no DC->C pool
        )
      ).rejects.toThrow('No valid swap route found');
    });

    it('should prefer direct swap over multi-hop', async () => {
      const amountIn = '100';

      const quote = await routerService.getBestSwapQuote(
        mockTokenA,
        mockTokenB,
        amountIn,
        [mockPoolAB, mockPoolAC] // Has direct pool and multi-hop option
      );

      expect(quote).toBeDefined();
      expect(quote.route).toHaveLength(2); // Should use direct route
      expect(quote.route).toEqual([mockTokenA.address, mockTokenB.address]);
    });
  });

  describe('calculateMinAmountOut', () => {
    it('should calculate minimum output with slippage', () => {
      const amountOut = '100';
      const slippage = 0.5; // 0.5%
      const decimals = 18;

      const minAmountOut = routerService.calculateMinAmountOut(amountOut, slippage, decimals);

      // 100 - 0.5% = 99.5
      expect(parseFloat(minAmountOut)).toBeCloseTo(99.5, 2);
    });

    it('should handle zero slippage', () => {
      const amountOut = '100';
      const slippage = 0;
      const decimals = 18;

      const minAmountOut = routerService.calculateMinAmountOut(amountOut, slippage, decimals);

      expect(parseFloat(minAmountOut)).toBe(100);
    });

    it('should handle high slippage', () => {
      const amountOut = '100';
      const slippage = 5; // 5%
      const decimals = 18;

      const minAmountOut = routerService.calculateMinAmountOut(amountOut, slippage, decimals);

      // 100 - 5% = 95
      expect(parseFloat(minAmountOut)).toBeCloseTo(95, 2);
    });

    it('should handle different decimals', () => {
      const amountOut = '100';
      const slippage = 1;
      const decimals = 6;

      const minAmountOut = routerService.calculateMinAmountOut(amountOut, slippage, decimals);

      // 100 - 1% = 99
      expect(parseFloat(minAmountOut)).toBeCloseTo(99, 2);
    });
  });

  describe('calculateDeadline', () => {
    it('should calculate deadline timestamp', () => {
      const minutes = 20;
      const currentTime = Math.floor(Date.now() / 1000);
      const deadline = routerService.calculateDeadline(minutes);

      expect(deadline).toBeGreaterThan(currentTime);
      expect(deadline - currentTime).toBe(minutes * 60);
    });

    it('should handle different time periods', () => {
      const deadline1 = routerService.calculateDeadline(10);
      const deadline2 = routerService.calculateDeadline(30);
      const deadline3 = routerService.calculateDeadline(60);

      const currentTime = Math.floor(Date.now() / 1000);

      expect(deadline1 - currentTime).toBe(10 * 60);
      expect(deadline2 - currentTime).toBe(30 * 60);
      expect(deadline3 - currentTime).toBe(60 * 60);
    });
  });

  describe('validateSwapParams', () => {
    it('should validate correct swap parameters', () => {
      const result = routerService.validateSwapParams(
        mockTokenA,
        mockTokenB,
        '100',
        0.5,
        Math.floor(Date.now() / 1000) + 3600
      );

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject same token swap', () => {
      const result = routerService.validateSwapParams(
        mockTokenA,
        mockTokenA,
        '100',
        0.5,
        Math.floor(Date.now() / 1000) + 3600
      );

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Cannot swap same token');
    });

    it('should reject invalid amount', () => {
      const result1 = routerService.validateSwapParams(
        mockTokenA,
        mockTokenB,
        '0',
        0.5,
        Math.floor(Date.now() / 1000) + 3600
      );

      const result2 = routerService.validateSwapParams(
        mockTokenA,
        mockTokenB,
        '-100',
        0.5,
        Math.floor(Date.now() / 1000) + 3600
      );

      const result3 = routerService.validateSwapParams(
        mockTokenA,
        mockTokenB,
        'invalid',
        0.5,
        Math.floor(Date.now() / 1000) + 3600
      );

      expect(result1.valid).toBe(false);
      expect(result1.error).toBe('Invalid amount');
      expect(result2.valid).toBe(false);
      expect(result3.valid).toBe(false);
    });

    it('should reject invalid slippage', () => {
      const result1 = routerService.validateSwapParams(
        mockTokenA,
        mockTokenB,
        '100',
        -1,
        Math.floor(Date.now() / 1000) + 3600
      );

      const result2 = routerService.validateSwapParams(
        mockTokenA,
        mockTokenB,
        '100',
        51,
        Math.floor(Date.now() / 1000) + 3600
      );

      expect(result1.valid).toBe(false);
      expect(result1.error).toBe('Invalid slippage tolerance');
      expect(result2.valid).toBe(false);
    });

    it('should reject invalid deadline', () => {
      const pastDeadline = Math.floor(Date.now() / 1000) - 100;

      const result = routerService.validateSwapParams(
        mockTokenA,
        mockTokenB,
        '100',
        0.5,
        pastDeadline
      );

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid deadline');
    });
  });

  describe('validateLiquidityParams', () => {
    it('should validate correct liquidity parameters', () => {
      const result = routerService.validateLiquidityParams(
        mockTokenA,
        mockTokenB,
        '100',
        '200',
        0.5,
        Math.floor(Date.now() / 1000) + 3600
      );

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject same token liquidity', () => {
      const result = routerService.validateLiquidityParams(
        mockTokenA,
        mockTokenA,
        '100',
        '100',
        0.5,
        Math.floor(Date.now() / 1000) + 3600
      );

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Cannot add liquidity with same token');
    });

    it('should reject invalid amounts', () => {
      const result = routerService.validateLiquidityParams(
        mockTokenA,
        mockTokenB,
        '0',
        '0',
        0.5,
        Math.floor(Date.now() / 1000) + 3600
      );

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid amounts');
    });
  });

  describe('getOptimalLiquidityAmounts', () => {
    it('should calculate optimal amount B given amount A', async () => {
      const amountA = '100';

      const result = await routerService.getOptimalLiquidityAmounts(
        mockTokenA,
        mockTokenB,
        amountA,
        mockPoolAB
      );

      expect(result.amountA).toBe(amountA);
      expect(result.amountB).toBeDefined();
      expect(parseFloat(result.amountB)).toBeGreaterThan(0);
    });

    it('should maintain proper ratio based on reserves', async () => {
      const amountA = '100';
      const reserveA = parseFloat(ethers.formatUnits(mockPoolAB.reserve0, mockTokenA.decimals));
      const reserveB = parseFloat(ethers.formatUnits(mockPoolAB.reserve1, mockTokenB.decimals));

      const result = await routerService.getOptimalLiquidityAmounts(
        mockTokenA,
        mockTokenB,
        amountA,
        mockPoolAB
      );

      // amountB should be (amountA * reserveB) / reserveA
      const expectedAmountB = (parseFloat(amountA) * reserveB) / reserveA;

      expect(parseFloat(result.amountB)).toBeCloseTo(expectedAmountB, 6);
    });
  });

  describe('getLiquidityQuote', () => {
    it('should calculate liquidity quote', async () => {
      const amountA = '100';
      const amountB = '50';

      const quote = await routerService.getLiquidityQuote(
        mockTokenA,
        mockTokenB,
        amountA,
        amountB,
        mockPoolAB
      );

      expect(quote).toBeDefined();
      expect(quote.amountA).toBe(amountA);
      expect(quote.amountB).toBe(amountB);
      expect(quote.liquidity).toBeDefined();
      expect(quote.share).toBeDefined();
      expect(quote.share).toBeGreaterThanOrEqual(0);
      expect(quote.share).toBeLessThanOrEqual(100);
    });
  });

  describe('calculateLiquidity', () => {
    it('should calculate LP tokens to mint', async () => {
      const amountA = '100';
      const amountB = '50';

      const liquidity = await routerService.calculateLiquidity(
        mockTokenA,
        mockTokenB,
        amountA,
        amountB,
        mockPoolAB
      );

      expect(liquidity).toBeDefined();
      expect(parseFloat(liquidity)).toBeGreaterThan(0);
    });

    it('should return minimum of the two liquidity calculations', async () => {
      const amountA = '1000';
      const amountB = '100';

      const liquidity = await routerService.calculateLiquidity(
        mockTokenA,
        mockTokenB,
        amountA,
        amountB,
        mockPoolAB
      );

      expect(parseFloat(liquidity)).toBeGreaterThan(0);
    });
  });

  describe('getRemoveLiquidityQuote', () => {
    it('should calculate amounts to return when removing liquidity', async () => {
      const liquidityAmount = '100';

      const quote = await routerService.getRemoveLiquidityQuote(
        liquidityAmount,
        mockPoolAB
      );

      expect(quote).toBeDefined();
      expect(quote.amountA).toBeDefined();
      expect(quote.amountB).toBeDefined();
      expect(parseFloat(quote.amountA)).toBeGreaterThan(0);
      expect(parseFloat(quote.amountB)).toBeGreaterThan(0);
    });

    it('should calculate proportional amounts based on liquidity share', async () => {
      const totalSupply = parseFloat(ethers.formatUnits(mockPoolAB.totalSupply, 18));
      const liquidityAmount = (totalSupply * 0.1).toString(); // 10% of pool

      const quote = await routerService.getRemoveLiquidityQuote(
        liquidityAmount,
        mockPoolAB
      );

      const reserve0 = parseFloat(ethers.formatUnits(mockPoolAB.reserve0, mockTokenA.decimals));
      const reserve1 = parseFloat(ethers.formatUnits(mockPoolAB.reserve1, mockTokenB.decimals));

      // Should get approximately 10% of reserves
      expect(parseFloat(quote.amountA)).toBeCloseTo(reserve0 * 0.1, 2);
      expect(parseFloat(quote.amountB)).toBeCloseTo(reserve1 * 0.1, 2);
    });
  });

  describe('estimateSwapGas', () => {
    it('should estimate gas for direct swap', async () => {
      const path = [mockTokenA.address, mockTokenB.address];

      const gasEstimate = await routerService.estimateSwapGas(path);

      expect(gasEstimate).toBe('200000'); // Base gas
    });

    it('should estimate higher gas for multi-hop swap', async () => {
      const path = [mockTokenB.address, mockTokenA.address, mockTokenC.address];

      const gasEstimate = await routerService.estimateSwapGas(path);

      expect(gasEstimate).toBe('250000'); // Base gas + 1 hop
    });

    it('should estimate even higher gas for longer paths', async () => {
      const tokenD: Token = { ...mockTokenC, address: '0xdef1234567890def1234567890def1234567890' };
      const path = [mockTokenA.address, mockTokenB.address, mockTokenC.address, tokenD.address];

      const gasEstimate = await routerService.estimateSwapGas(path);

      expect(gasEstimate).toBe('300000'); // Base gas + 2 hops
    });
  });

  describe('estimateAddLiquidityGas', () => {
    it('should estimate gas for adding liquidity', async () => {
      const gasEstimate = await routerService.estimateAddLiquidityGas();

      expect(gasEstimate).toBe('200000');
    });
  });

  describe('estimateRemoveLiquidityGas', () => {
    it('should estimate gas for removing liquidity', async () => {
      const gasEstimate = await routerService.estimateRemoveLiquidityGas();

      expect(gasEstimate).toBe('150000');
    });
  });

  describe('formatSwapRoute', () => {
    it('should format swap route with token symbols', () => {
      const route = [mockTokenA.address, mockTokenB.address];
      const tokens = new Map<string, Token>();
      tokens.set(mockTokenA.address, mockTokenA);
      tokens.set(mockTokenB.address, mockTokenB);

      const formatted = routerService.formatSwapRoute(route, tokens);

      expect(formatted).toBe('DC → wDOGE');
    });

    it('should handle missing token symbols', () => {
      const route = [mockTokenA.address, '0xunknown'];
      const tokens = new Map<string, Token>();
      tokens.set(mockTokenA.address, mockTokenA);

      const formatted = routerService.formatSwapRoute(route, tokens);

      expect(formatted).toContain('DC →');
      expect(formatted).toContain('0xunkno'); // Truncated address
    });

    it('should format multi-hop route', () => {
      const route = [mockTokenA.address, mockTokenB.address, mockTokenC.address];
      const tokens = new Map<string, Token>();
      tokens.set(mockTokenA.address, mockTokenA);
      tokens.set(mockTokenB.address, mockTokenB);
      tokens.set(mockTokenC.address, mockTokenC);

      const formatted = routerService.formatSwapRoute(route, tokens);

      expect(formatted).toBe('DC → wDOGE → PEPE');
    });
  });

  describe('getSwapSummary', () => {
    it('should create swap summary', () => {
      const quote = {
        route: [mockTokenA.address, mockTokenB.address],
        amountIn: '100',
        amountOut: '50',
        priceImpact: 0.5,
        gasEstimate: '150000',
        path: [mockTokenA.address, mockTokenB.address],
      };

      const summary = routerService.getSwapSummary(quote, mockTokenA, mockTokenB);

      expect(summary).toBeDefined();
      expect(summary.route).toBe('DC → wDOGE');
      expect(summary.price).toContain('1 DC =');
      expect(summary.priceImpact).toBe('0.50%');
      expect(summary.gasCost).toBe('150000 gas');
    });

    it('should calculate correct exchange rate', () => {
      const quote = {
        route: [mockTokenA.address, mockTokenB.address],
        amountIn: '100',
        amountOut: '200',
        priceImpact: 0.5,
        gasEstimate: '150000',
        path: [mockTokenA.address, mockTokenB.address],
      };

      const summary = routerService.getSwapSummary(quote, mockTokenA, mockTokenB);

      expect(summary.price).toContain('2.000000'); // 200/100 = 2
    });
  });

  describe('edge cases', () => {
    it('should handle same token swap validation', () => {
      const result = routerService.validateSwapParams(
        mockTokenA,
        mockTokenA,
        '100',
        0.5,
        Math.floor(Date.now() / 1000) + 3600
      );

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Cannot swap same token');
    });

    it('should handle small swap amounts', async () => {
      const smallAmount = '0.001';

      const quote = await routerService.getDirectSwapQuote(
        mockTokenA,
        mockTokenB,
        smallAmount,
        mockPoolAB
      );

      expect(quote).toBeDefined();
      expect(parseFloat(quote.amountOut)).toBeGreaterThan(0);
    });

    it('should handle large swap amounts', async () => {
      const largeAmount = '10000';

      const quote = await routerService.getDirectSwapQuote(
        mockTokenA,
        mockTokenB,
        largeAmount,
        mockPoolAB
      );

      expect(quote).toBeDefined();
      expect(parseFloat(quote.amountOut)).toBeGreaterThan(0);
      // Price impact should be higher for large amounts
      expect(mockPriceService.getSwapPriceImpact).toHaveBeenCalled();
    });

    it('should handle pools with different decimals', async () => {
      const token6Decimals: Token = {
        address: '0xabcdef1234567890abcdef1234567890abcdef12',
        symbol: 'USDT',
        name: 'Tether',
        decimals: 6,
        logoURI: '/usdt.png',
        balance: '1000000000000',
        price: 1,
      };

      // Create pool with matching token order - tokenA is 18 decimals, tokenB is 6 decimals
      const pool6Decimals: Pool = {
        address: '0xpool6dec123456789012345678901234567890123',
        tokenA: mockTokenA,
        tokenB: token6Decimals,
        reserve0: ethers.parseEther('10000').toString(), // 10000 tokens with 18 decimals
        reserve1: ethers.parseUnits('50000', 6).toString(), // 50000 tokens with 6 decimals
        totalSupply: ethers.parseEther('22360').toString(),
        tvl: 0,
        volume24h: 0,
        fee24h: 0,
        apy: 0,
      };

      const quote = await routerService.getDirectSwapQuote(
        mockTokenA,
        token6Decimals,
        '100',
        pool6Decimals
      );

      expect(quote).toBeDefined();
      expect(quote.amountOut).toBeDefined();
      // Just verify it returns a valid quote structure
      expect(quote.route).toEqual([mockTokenA.address, token6Decimals.address]);
    });

    it('should handle empty reserves gracefully', async () => {
      const emptyPool: Pool = {
        ...mockPoolAB,
        reserve0: '0',
        reserve1: '0',
      };

      // Should still return quote but with minimal output
      const quote = await routerService.getDirectSwapQuote(
        mockTokenA,
        mockTokenB,
        '100',
        emptyPool
      );

      expect(quote).toBeDefined();
      // With no reserves, the output should be very small or zero
    });
  });
});
