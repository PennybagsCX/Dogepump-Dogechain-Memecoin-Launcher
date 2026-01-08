/**
 * Dummy Data for DEX Demonstration
 * 
 * This file provides realistic dummy data for demonstrating the DEX functionality
 * before real contract integration is complete.
 */

import { Token, Pool } from '../../contexts/DexContext';

// Base tokens for the DEX
export const DUMMY_TOKENS: Token[] = [
  {
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'DC',
    name: 'DogePump Coin',
    decimals: 18,
    logoURI: '/tokens/dc.png',
    balance: '1000000',
    price: 1.0,
  },
  {
    address: '0x0000000000000000000000000000000000000001',
    symbol: 'wDOGE',
    name: 'Wrapped Doge',
    decimals: 18,
    logoURI: '/tokens/wdoge.png',
    balance: '500000',
    price: 0.15,
  },
  {
    address: '0x0000000000000000000000000000000000000002',
    symbol: 'TOKEN1',
    name: 'First Token',
    decimals: 18,
    logoURI: '/tokens/token1.png',
    balance: '100000',
    price: 0.5,
  },
  {
    address: '0x0000000000000000000000000000000000000003',
    symbol: 'TOKEN2',
    name: 'Second Token',
    decimals: 18,
    logoURI: '/tokens/token2.png',
    balance: '75000',
    price: 0.25,
  },
  {
    address: '0x0000000000000000000000000000000000000004',
    symbol: 'TOKEN3',
    name: 'Third Token',
    decimals: 18,
    logoURI: '/tokens/token3.png',
    balance: '50000',
    price: 1.2,
  },
  {
    address: '0x0000000000000000000000000000000000000005',
    symbol: 'TOKEN4',
    name: 'Fourth Token',
    decimals: 18,
    logoURI: '/tokens/token4.png',
    balance: '30000',
    price: 2.5,
  },
];

// Dummy pools with realistic TVL, volume, and APY values
export const DUMMY_POOLS: Pool[] = [
  {
    address: '0x0000000000000000000000000000000000000010',
    tokenA: DUMMY_TOKENS[0], // DC
    tokenB: DUMMY_TOKENS[1], // wDOGE
    reserve0: '500000000000000000000000000',
    reserve1: '3333333333333333333333333',
    totalSupply: '5773502691896257645091487',
    tvl: 550000,
    volume24h: 125000,
    apy: 45.2,
    fee: 0.3,
    price0: 1.0,
    price1: 0.15,
  },
  {
    address: '0x0000000000000000000000000000000000000011',
    tokenA: DUMMY_TOKENS[0], // DC
    tokenB: DUMMY_TOKENS[2], // TOKEN1
    reserve0: '200000000000000000000000000',
    reserve1: '400000000000000000000000000',
    totalSupply: '2828427124746190097603776',
    tvl: 300000,
    volume24h: 85000,
    apy: 38.7,
    fee: 0.3,
    price0: 1.0,
    price1: 0.5,
  },
  {
    address: '0x0000000000000000000000000000000000000012',
    tokenA: DUMMY_TOKENS[0], // DC
    tokenB: DUMMY_TOKENS[3], // TOKEN2
    reserve0: '150000000000000000000000000',
    reserve1: '600000000000000000000000000',
    totalSupply: '2449489742783178098197284',
    tvl: 225000,
    volume24h: 62000,
    apy: 52.3,
    fee: 0.3,
    price0: 1.0,
    price1: 0.25,
  },
  {
    address: '0x0000000000000000000000000000000000000013',
    tokenA: DUMMY_TOKENS[0], // DC
    tokenB: DUMMY_TOKENS[4], // TOKEN3
    reserve0: '100000000000000000000000000',
    reserve1: '83333333333333333333333',
    totalSupply: '1354006477742778079371202',
    tvl: 200000,
    volume24h: 48000,
    apy: 61.8,
    fee: 0.3,
    price0: 1.0,
    price1: 1.2,
  },
  {
    address: '0x0000000000000000000000000000000000000014',
    tokenA: DUMMY_TOKENS[0], // DC
    tokenB: DUMMY_TOKENS[5], // TOKEN4
    reserve0: '80000000000000000000000000',
    reserve1: '32000000000000000000000000',
    totalSupply: '1131370849898475998229984',
    tvl: 160000,
    volume24h: 35000,
    apy: 73.5,
    fee: 0.3,
    price0: 1.0,
    price1: 2.5,
  },
  {
    address: '0x0000000000000000000000000000000000000015',
    tokenA: DUMMY_TOKENS[1], // wDOGE
    tokenB: DUMMY_TOKENS[2], // TOKEN1
    reserve0: '100000000000000000000000000',
    reserve1: '300000000000000000000000000',
    totalSupply: '1732050807568877293527446',
    tvl: 150000,
    volume24h: 28000,
    apy: 42.1,
    fee: 0.3,
    price0: 0.15,
    price1: 0.5,
  },
  {
    address: '0x0000000000000000000000000000000000000016',
    tokenA: DUMMY_TOKENS[1], // wDOGE
    tokenB: DUMMY_TOKENS[3], // TOKEN2
    reserve0: '75000000000000000000000000',
    reserve1: '450000000000000000000000000',
    totalSupply: '1620185174601965448411612',
    tvl: 112500,
    volume24h: 22000,
    apy: 55.6,
    fee: 0.3,
    price0: 0.15,
    price1: 0.25,
  },
  {
    address: '0x0000000000000000000000000000000000000017',
    tokenA: DUMMY_TOKENS[2], // TOKEN1
    tokenB: DUMMY_TOKENS[3], // TOKEN2
    reserve0: '50000000000000000000000000',
    reserve1: '100000000000000000000000000',
    totalSupply: '1118033988749894848204587',
    tvl: 87500,
    volume24h: 18000,
    apy: 48.9,
    fee: 0.3,
    price0: 0.5,
    price1: 0.25,
  },
];

// Dummy liquidity positions
export interface DummyLiquidityPosition {
  id: string;
  pool: Pool;
  lpBalance: string;
  poolShare: number;
  tokenAAmount: string;
  tokenBAmount: string;
  valueUSD: number;
  isStaked: boolean;
  farmRewards?: string;
}

export const DUMMY_LIQUIDITY_POSITIONS: DummyLiquidityPosition[] = [
  {
    id: 'pos-1',
    pool: DUMMY_POOLS[0], // DC/wDOGE
    lpBalance: '57735026918962576450',
    poolShare: 1.0,
    tokenAAmount: '5000000000000000000000',
    tokenBAmount: '33333333333333333333',
    valueUSD: 5500,
    isStaked: false,
  },
  {
    id: 'pos-2',
    pool: DUMMY_POOLS[1], // DC/TOKEN1
    lpBalance: '28284271247461900976',
    poolShare: 1.0,
    tokenAAmount: '2000000000000000000000',
    tokenBAmount: '4000000000000000000000',
    valueUSD: 3000,
    isStaked: true,
    farmRewards: '125.5 DC',
  },
  {
    id: 'pos-3',
    pool: DUMMY_POOLS[2], // DC/TOKEN2
    lpBalance: '24494897427831780981',
    poolShare: 1.0,
    tokenAAmount: '1500000000000000000000',
    tokenBAmount: '6000000000000000000000',
    valueUSD: 2250,
    isStaked: false,
  },
];

// Dummy recent swaps
export interface DummySwap {
  id: string;
  pool: Pool;
  tokenIn: Token;
  tokenOut: Token;
  amountIn: string;
  amountOut: string;
  timestamp: number;
  txHash: string;
  user: string;
}

export const DUMMY_RECENT_SWAPS: DummySwap[] = [
  {
    id: 'swap-1',
    pool: DUMMY_POOLS[0],
    tokenIn: DUMMY_TOKENS[0],
    tokenOut: DUMMY_TOKENS[1],
    amountIn: '10000000000000000000000',
    amountOut: '66666666666666666666',
    timestamp: Date.now() - 300000,
    txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    user: '0x123...abc',
  },
  {
    id: 'swap-2',
    pool: DUMMY_POOLS[1],
    tokenIn: DUMMY_TOKENS[2],
    tokenOut: DUMMY_TOKENS[0],
    amountIn: '50000000000000000000000',
    amountOut: '25000000000000000000000',
    timestamp: Date.now() - 600000,
    txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    user: '0x456...def',
  },
  {
    id: 'swap-3',
    pool: DUMMY_POOLS[2],
    tokenIn: DUMMY_TOKENS[0],
    tokenOut: DUMMY_TOKENS[3],
    amountIn: '20000000000000000000000',
    amountOut: '80000000000000000000000',
    timestamp: Date.now() - 900000,
    txHash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
    user: '0x789...012',
  },
  {
    id: 'swap-4',
    pool: DUMMY_POOLS[3],
    tokenIn: DUMMY_TOKENS[4],
    tokenOut: DUMMY_TOKENS[0],
    amountIn: '10000000000000000000000',
    amountOut: '12000000000000000000000',
    timestamp: Date.now() - 1200000,
    txHash: '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
    user: '0xabc...789',
  },
  {
    id: 'swap-5',
    pool: DUMMY_POOLS[0],
    tokenIn: DUMMY_TOKENS[1],
    tokenOut: DUMMY_TOKENS[0],
    amountIn: '50000000000000000000000',
    amountOut: '75000000000000000000000',
    timestamp: Date.now() - 1500000,
    txHash: '0x3210987654abcdef3210987654abcdef3210987654abcdef3210987654abcdef',
    user: '0xdef...456',
  },
];

// Dummy top liquidity providers
export interface DummyLiquidityProvider {
  address: string;
  pool: Pool;
  totalValueProvided: number;
  poolShare: number;
  poolsCount: number;
}

export const DUMMY_TOP_LPS: DummyLiquidityProvider[] = [
  {
    address: '0x1234567890123456789012345678901234567890',
    pool: DUMMY_POOLS[0],
    totalValueProvided: 125000,
    poolShare: 22.7,
    poolsCount: 3,
  },
  {
    address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefab',
    pool: DUMMY_POOLS[1],
    totalValueProvided: 98000,
    poolShare: 32.7,
    poolsCount: 2,
  },
  {
    address: '0x9876543210987654321098765432109876543210',
    pool: DUMMY_POOLS[2],
    totalValueProvided: 75000,
    poolShare: 33.3,
    poolsCount: 1,
  },
  {
    address: '0x5432109876543210543210987654321054321098',
    pool: DUMMY_POOLS[3],
    totalValueProvided: 62000,
    poolShare: 31.0,
    poolsCount: 2,
  },
  {
    address: '0xfedcbafedcbafedcbafedcbafedcbafedcbafedcb',
    pool: DUMMY_POOLS[4],
    totalValueProvided: 48000,
    poolShare: 30.0,
    poolsCount: 1,
  },
];

// Generate recent swaps for each pool
export const generateRecentSwapsForPool = (pool: Pool): DummySwap[] => {
  const swaps: DummySwap[] = [];
  const now = Date.now();

  for (let i = 0; i < 20; i++) {
    const isInDirection = Math.random() > 0.5;
    swaps.push({
      id: `swap-${pool.address}-${i}`,
      pool,
      tokenIn: isInDirection ? pool.tokenA : pool.tokenB,
      tokenOut: isInDirection ? pool.tokenB : pool.tokenA,
      amountIn: (Math.random() * 100000 * 1e18).toString(),
      amountOut: (Math.random() * 100000 * 1e18).toString(),
      timestamp: now - (i * 300000) - Math.random() * 600000,
      txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      user: `0x${Math.random().toString(16).substr(2, 4)}...${Math.random().toString(16).substr(2, 3)}`,
    });
  }

  return swaps;
};

// Generate liquidity providers for each pool
export const generateLiquidityProvidersForPool = (pool: Pool): any[] => {
  const providers: any[] = [];
  const numProviders = 5 + Math.floor(Math.random() * 10);

  for (let i = 0; i < numProviders; i++) {
    const lpBalance = (Math.random() * parseFloat(pool.totalSupply) * 0.5).toString();
    const poolShare = (parseFloat(lpBalance) / parseFloat(pool.totalSupply)) * 100;
    const valueUSD = poolShare * pool.tvl / 100;

    providers.push({
      address: `0x${Math.random().toString(16).substr(2, 40)}`,
      lpBalance,
      poolShare,
      valueUSD,
    });
  }

  // Sort by pool share descending
  return providers.sort((a, b) => b.poolShare - a.poolShare);
};

// Helper function to get pool by token pair
export const getPoolByTokens = (tokenA: string, tokenB: string): Pool | undefined => {
  return DUMMY_POOLS.find(pool => {
    const matchA = pool.tokenA.address === tokenA && pool.tokenB.address === tokenB;
    const matchB = pool.tokenA.address === tokenB && pool.tokenB.address === tokenA;
    return matchA || matchB;
  });
};

// Helper function to get token by address
export const getTokenByAddress = (address: string): Token | undefined => {
  return DUMMY_TOKENS.find(token => token.address === address);
};

// Helper function to format token amount
export const formatTokenAmount = (amount: string, decimals: number = 18): string => {
  const value = parseFloat(amount) / Math.pow(10, decimals);
  if (value === 0) return '0';
  if (value < 0.000001) return value.toFixed(8);
  if (value < 0.01) return value.toFixed(6);
  if (value < 1) return value.toFixed(4);
  if (value < 1000) return value.toFixed(2);
  if (value < 1000000) return (value / 1000).toFixed(2) + 'K';
  if (value < 1000000000) return (value / 1000000).toFixed(2) + 'M';
  return (value / 1000000000).toFixed(2) + 'B';
};

// Helper function to format USD value
export const formatUSDValue = (value: number): string => {
  if (value === 0) return '$0';
  if (value < 0.01) return '$' + value.toFixed(6);
  if (value < 1) return '$' + value.toFixed(4);
  if (value < 1000) return '$' + value.toFixed(2);
  if (value < 1000000) return '$' + (value / 1000).toFixed(2) + 'K';
  if (value < 1000000000) return '$' + (value / 1000000).toFixed(2) + 'M';
  return '$' + (value / 1000000000).toFixed(2) + 'B';
};

// Helper function to calculate swap output (simplified constant product formula)
export const calculateSwapOutput = (
  amountIn: string,
  reserveIn: string,
  reserveOut: string,
  fee: number = 0.003
): string => {
  const amountInWei = BigInt(amountIn);
  const reserveInWei = BigInt(reserveIn);
  const reserveOutWei = BigInt(reserveOut);
  
  // Apply fee (0.3% = 0.003)
  const feeMultiplier = 1000 - Math.floor(fee * 1000);
  const amountInWithFee = (amountInWei * BigInt(feeMultiplier)) / 1000n;
  
  // Calculate output using constant product formula: (x * y) / (x + dx)
  const numerator = amountInWithFee * reserveOutWei;
  const denominator = reserveInWei + amountInWithFee;
  const amountOutWei = numerator / denominator;
  
  return amountOutWei.toString();
};
