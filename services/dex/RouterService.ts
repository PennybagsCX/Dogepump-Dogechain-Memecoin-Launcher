import { ethers } from 'ethers';
import { Token, Pool, SwapRoute } from '../../contexts/DexContext';
import ContractService from './ContractService';
import PriceService from './PriceService';

export interface SwapQuote {
  route: string[];
  amountIn: string;
  amountOut: string;
  priceImpact: number;
  gasEstimate: string;
  path: string[];
}

export interface LiquidityQuote {
  amountA: string;
  amountB: string;
  liquidity: string;
  share: number;
}

export class RouterService {
  private contractService: ContractService;
  private priceService: PriceService;
  private routerAddress: string;
  private dcTokenAddress: string;

  constructor(
    contractService: ContractService,
    priceService: PriceService,
    routerAddress: string,
    dcTokenAddress: string
  ) {
    this.contractService = contractService;
    this.priceService = priceService;
    this.routerAddress = routerAddress;
    this.dcTokenAddress = dcTokenAddress;
  }

  /**
   * Get swap quote for direct swap (two tokens)
   */
  async getDirectSwapQuote(
    tokenIn: Token,
    tokenOut: Token,
    amountIn: string,
    pool: Pool
  ): Promise<SwapQuote> {
    // Determine which reserve is in and which is out
    let reserveIn: string;
    let reserveOut: string;
    let decimalsIn: number;
    let decimalsOut: number;

    if (tokenIn.address === pool.tokenA.address) {
      reserveIn = pool.reserve0;
      reserveOut = pool.reserve1;
      decimalsIn = pool.tokenA.decimals;
      decimalsOut = pool.tokenB.decimals;
    } else {
      reserveIn = pool.reserve1;
      reserveOut = pool.reserve0;
      decimalsIn = pool.tokenB.decimals;
      decimalsOut = pool.tokenA.decimals;
    }

    // Calculate amount out using constant product formula
    const amountInBN = ethers.parseUnits(amountIn, decimalsIn);
    const reserveInBN = ethers.parseUnits(reserveIn, decimalsIn);
    const reserveOutBN = ethers.parseUnits(reserveOut, decimalsOut);

    // Apply 0.3% fee
    const amountOutBN = (amountInBN * reserveOutBN * 997n) / (reserveInBN * 1000n + amountInBN * 997n);
    const amountOut = ethers.formatUnits(amountOutBN, decimalsOut);

    // Calculate price impact
    const priceImpact = await this.priceService.getSwapPriceImpact(
      amountIn,
      tokenIn,
      tokenOut,
      pool
    );

    // Estimate gas (simplified)
    const gasEstimate = await this.estimateSwapGas([tokenIn.address, tokenOut.address]);

    return {
      route: [tokenIn.address, tokenOut.address],
      amountIn,
      amountOut,
      priceImpact,
      gasEstimate,
      path: [tokenIn.address, tokenOut.address],
    };
  }

  /**
   * Get swap quote for multi-hop swap (through DC)
   */
  async getMultiHopSwapQuote(
    tokenIn: Token,
    tokenOut: Token,
    amountIn: string,
    poolIn: Pool,
    poolOut: Pool
  ): Promise<SwapQuote> {
    // First hop: tokenIn -> DC
    const firstHopQuote = await this.getDirectSwapQuote(tokenIn, poolIn.tokenA, amountIn, poolIn);

    // Second hop: DC -> tokenOut
    const secondHopQuote = await this.getDirectSwapQuote(poolOut.tokenA, tokenOut, firstHopQuote.amountOut, poolOut);

    // Calculate total price impact
    const totalPriceImpact = firstHopQuote.priceImpact + secondHopQuote.priceImpact;

    // Estimate gas (multi-hop uses more gas)
    const gasEstimate = await this.estimateSwapGas([
      tokenIn.address,
      this.dcTokenAddress,
      tokenOut.address,
    ]);

    return {
      route: [tokenIn.address, this.dcTokenAddress, tokenOut.address],
      amountIn,
      amountOut: secondHopQuote.amountOut,
      priceImpact: totalPriceImpact,
      gasEstimate,
      path: [tokenIn.address, this.dcTokenAddress, tokenOut.address],
    };
  }

  /**
   * Get best swap quote (direct or multi-hop)
   */
  async getBestSwapQuote(
    tokenIn: Token,
    tokenOut: Token,
    amountIn: string,
    pools: Pool[]
  ): Promise<SwapQuote> {
    // Check if direct pool exists
    const directPool = pools.find(
      p =>
        (p.tokenA.address === tokenIn.address && p.tokenB.address === tokenOut.address) ||
        (p.tokenA.address === tokenOut.address && p.tokenB.address === tokenIn.address)
    );

    if (directPool) {
      return await this.getDirectSwapQuote(tokenIn, tokenOut, amountIn, directPool);
    }

    // Check if multi-hop through DC is possible
    const poolIn = pools.find(
      p =>
        (p.tokenA.address === tokenIn.address && p.tokenB.address === this.dcTokenAddress) ||
        (p.tokenA.address === this.dcTokenAddress && p.tokenB.address === tokenIn.address)
    );

    const poolOut = pools.find(
      p =>
        (p.tokenA.address === tokenOut.address && p.tokenB.address === this.dcTokenAddress) ||
        (p.tokenA.address === this.dcTokenAddress && p.tokenB.address === tokenOut.address)
    );

    if (poolIn && poolOut) {
      return await this.getMultiHopSwapQuote(tokenIn, tokenOut, amountIn, poolIn, poolOut);
    }

    throw new Error('No valid swap route found');
  }

  /**
   * Execute swap
   */
  async executeSwap(
    tokenIn: Token,
    tokenOut: Token,
    amountIn: string,
    amountOutMin: string,
    slippage: number,
    deadline: number
  ): Promise<ethers.ContractTransactionReceipt> {
    const path = [tokenIn.address, tokenOut.address];

    // Check if direct pool exists, otherwise use multi-hop through DC
    const pools = await this.contractService.getPoolInfo(path[0] as any);
    const directPool = pools ? await this.contractService.getPoolInfo(path[0] as any) : null;

    if (!directPool) {
      // Use multi-hop through DC
      path.splice(1, 0, this.dcTokenAddress);
    }

    return await this.contractService.swapExactTokensForTokens(
      amountIn,
      amountOutMin,
      path,
      await this.contractService['signer']?.getAddress() || '',
      deadline
    );
  }

  /**
   * Get optimal liquidity amounts
   */
  async getOptimalLiquidityAmounts(
    tokenA: Token,
    tokenB: Token,
    amountA: string,
    pool: Pool
  ): Promise<{ amountA: string; amountB: string }> {
    // Determine which reserve is A and which is B
    let reserveA: string;
    let reserveB: string;

    if (tokenA.address === pool.tokenA.address) {
      reserveA = pool.reserve0;
      reserveB = pool.reserve1;
    } else {
      reserveA = pool.reserve1;
      reserveB = pool.reserve0;
    }

    // Calculate optimal amount B using constant product formula
    const amountABN = ethers.parseUnits(amountA, tokenA.decimals);
    const reserveABN = ethers.parseUnits(reserveA, tokenA.decimals);
    const reserveBBN = ethers.parseUnits(reserveB, tokenB.decimals);

    const amountBBN = (amountABN * reserveBBN) / reserveABN;
    const amountB = ethers.formatUnits(amountBBN, tokenB.decimals);

    return { amountA, amountB };
  }

  /**
   * Get liquidity quote
   */
  async getLiquidityQuote(
    tokenA: Token,
    tokenB: Token,
    amountA: string,
    amountB: string,
    pool: Pool
  ): Promise<LiquidityQuote> {
    // Calculate LP tokens to mint
    const liquidity = await this.calculateLiquidity(tokenA, tokenB, amountA, amountB, pool);

    // Calculate pool share
    const totalSupplyBN = ethers.parseUnits(pool.totalSupply, 18);
    const liquidityBN = ethers.parseUnits(liquidity, 18);
    const share = Number(liquidityBN * 10000n / totalSupplyBN) / 100; // Percentage with 2 decimals

    return {
      amountA,
      amountB,
      liquidity,
      share,
    };
  }

  /**
   * Calculate LP tokens to mint
   */
  async calculateLiquidity(
    tokenA: Token,
    tokenB: Token,
    amountA: string,
    amountB: string,
    pool: Pool
  ): Promise<string> {
    // Determine which reserve is A and which is B
    let reserveA: string;
    let reserveB: string;

    if (tokenA.address === pool.tokenA.address) {
      reserveA = pool.reserve0;
      reserveB = pool.reserve1;
    } else {
      reserveA = pool.reserve1;
      reserveB = pool.reserve0;
    }

    const amountABN = ethers.parseUnits(amountA, tokenA.decimals);
    const amountBBN = ethers.parseUnits(amountB, tokenB.decimals);
    const reserveABN = ethers.parseUnits(reserveA, tokenA.decimals);
    const reserveBBN = ethers.parseUnits(reserveB, tokenB.decimals);
    const totalSupplyBN = ethers.parseUnits(pool.totalSupply, 18);

    // Calculate minimum liquidity
    const liquidityA = (amountABN * totalSupplyBN) / reserveABN;
    const liquidityB = (amountBBN * totalSupplyBN) / reserveBBN;
    const liquidity = liquidityA < liquidityB ? liquidityA : liquidityB;

    return ethers.formatUnits(liquidity, 18);
  }

  /**
   * Get remove liquidity quote
   */
  async getRemoveLiquidityQuote(
    liquidityAmount: string,
    pool: Pool
  ): Promise<{ amountA: string; amountB: string }> {
    const totalSupplyBN = ethers.parseUnits(pool.totalSupply, 18);
    const liquidityBN = ethers.parseUnits(liquidityAmount, 18);

    const reserve0BN = ethers.parseUnits(pool.reserve0, pool.tokenA.decimals);
    const reserve1BN = ethers.parseUnits(pool.reserve1, pool.tokenB.decimals);

    const amount0BN = (liquidityBN * reserve0BN) / totalSupplyBN;
    const amount1BN = (liquidityBN * reserve1BN) / totalSupplyBN;

    return {
      amountA: ethers.formatUnits(amount0BN, pool.tokenA.decimals),
      amountB: ethers.formatUnits(amount1BN, pool.tokenB.decimals),
    };
  }

  /**
   * Estimate gas for swap
   */
  async estimateSwapGas(path: string[]): Promise<string> {
    // Simplified gas estimation
    const baseGas = 150000n;
    const perHopGas = 50000n;
    const totalGas = baseGas + (BigInt(path.length - 1) * perHopGas);

    return totalGas.toString();
  }

  /**
   * Estimate gas for add liquidity
   */
  async estimateAddLiquidityGas(): Promise<string> {
    return '200000';
  }

  /**
   * Estimate gas for remove liquidity
   */
  async estimateRemoveLiquidityGas(): Promise<string> {
    return '150000';
  }

  /**
   * Validate swap parameters
   */
  validateSwapParams(
    tokenIn: Token,
    tokenOut: Token,
    amountIn: string,
    slippage: number,
    deadline: number
  ): { valid: boolean; error?: string } {
    // Check if tokens are the same
    if (tokenIn.address === tokenOut.address) {
      return { valid: false, error: 'Cannot swap same token' };
    }

    // Check if amount is valid
    const amountInNum = parseFloat(amountIn);
    if (isNaN(amountInNum) || amountInNum <= 0) {
      return { valid: false, error: 'Invalid amount' };
    }

    // Check slippage
    if (slippage < 0 || slippage > 50) {
      return { valid: false, error: 'Invalid slippage tolerance' };
    }

    // Check deadline
    const currentTime = Math.floor(Date.now() / 1000);
    if (deadline <= currentTime) {
      return { valid: false, error: 'Invalid deadline' };
    }

    return { valid: true };
  }

  /**
   * Validate liquidity parameters
   */
  validateLiquidityParams(
    tokenA: Token,
    tokenB: Token,
    amountA: string,
    amountB: string,
    slippage: number,
    deadline: number
  ): { valid: boolean; error?: string } {
    // Check if tokens are the same
    if (tokenA.address === tokenB.address) {
      return { valid: false, error: 'Cannot add liquidity with same token' };
    }

    // Check if amounts are valid
    const amountANum = parseFloat(amountA);
    const amountBNum = parseFloat(amountB);

    if (isNaN(amountANum) || isNaN(amountBNum) || amountANum <= 0 || amountBNum <= 0) {
      return { valid: false, error: 'Invalid amounts' };
    }

    // Check slippage
    if (slippage < 0 || slippage > 50) {
      return { valid: false, error: 'Invalid slippage tolerance' };
    }

    // Check deadline
    const currentTime = Math.floor(Date.now() / 1000);
    if (deadline <= currentTime) {
      return { valid: false, error: 'Invalid deadline' };
    }

    return { valid: true };
  }

  /**
   * Calculate minimum output amount based on slippage
   */
  calculateMinAmountOut(amountOut: string, slippage: number, decimals: number): string {
    const amountOutNum = parseFloat(amountOut);
    const minAmountOut = amountOutNum * (1 - slippage / 100);
    return ethers.formatUnits(ethers.parseUnits(minAmountOut.toFixed(decimals), decimals), decimals);
  }

  /**
   * Calculate deadline timestamp
   */
  calculateDeadline(minutes: number): number {
    return Math.floor(Date.now() / 1000) + minutes * 60;
  }

  /**
   * Format swap route for display
   */
  formatSwapRoute(route: string[], tokens: Map<string, Token>): string {
    return route
      .map(address => tokens.get(address)?.symbol || address.slice(0, 8))
      .join(' → ');
  }

  /**
   * Get swap summary
   */
  getSwapSummary(quote: SwapQuote, tokenIn: Token, tokenOut: Token): {
    route: string;
    price: string;
    priceImpact: string;
    gasCost: string;
  } {
    const price = parseFloat(quote.amountOut) / parseFloat(quote.amountIn);

    return {
      route: `${tokenIn.symbol} → ${tokenOut.symbol}`,
      price: `1 ${tokenIn.symbol} = ${price.toFixed(6)} ${tokenOut.symbol}`,
      priceImpact: `${quote.priceImpact.toFixed(2)}%`,
      gasCost: `${quote.gasEstimate} gas`,
    };
  }
}

export default RouterService;
