/**
 * TEST DATA FOR DEVELOPMENT ONLY
 *
 * This file contains mock data used exclusively in development/testing environments.
 * All data here is isolated and NEVER imported in production builds.
 *
 * WARNING: This data should NEVER be used in production!
 * Set VITE_ENABLE_TEST_DATA=false in production to disable.
 */

import type { Trade, Token, Token as TokenType } from '../types';

/**
 * Check if test data mode is enabled
 * ONLY true in development with explicit opt-in via VITE_ENABLE_TEST_DATA=true
 */
export const isTestDataEnabled = import.meta.env.DEV && import.meta.env.VITE_ENABLE_TEST_DATA === 'true';

if (isTestDataEnabled) {
  console.warn(
    '⚠️ TEST DATA MODE ENABLED ⚠️\n' +
    'Mock data is being used for development purposes only.\n' +
    'NEVER enable this in production!\n' +
    'Set VITE_ENABLE_TEST_DATA=false to disable.'
  );
}

/**
 * Generate sample trades for chart testing
 *
 * ONLY used when VITE_ENABLE_TEST_DATA=true
 *
 * @param tokenId - Token ID to generate trades for
 * @param count - Number of trades to generate (default: 50)
 * @returns Array of mock trade objects
 */
export function generateTestTrades(tokenId: string, count: number = 50): Trade[] {
  const now = Date.now();
  const basePrice = 0.000001;

  return Array.from({ length: count }, (_, i) => {
    const timestamp = now - (count - i) * 60000; // One per minute
    const isBuy = Math.random() > 0.5;
    const priceVariation = (Math.random() - 0.5) * 0.1; // +/- 5% variation

    return {
      id: `test-trade-${tokenId}-${i}`,
      type: isBuy ? 'buy' : 'sell',
      amountDC: 100 + Math.random() * 500,
      amountToken: 1000000 + Math.random() * 2000000,
      price: basePrice * (1 + priceVariation),
      user: i % 5 === 0 ? 'You' : `0x${Math.random().toString(16).slice(2, 10)}`,
      timestamp,
      txHash: `0x${Math.random().toString(16).slice(2, 66)}`,
      tokenId,
      blockNumber: 4200000 + i,
      gasUsed: 21000 + Math.floor(Math.random() * 100000),
    };
  });
}

/**
 * Generate test price history points
 *
 * @param tokenId - Token ID
 * @param hours - Number of hours of history to generate
 * @returns Array of price history points
 */
export function generateTestPriceHistory(tokenId: string, hours: number = 24) {
  const now = Date.now();
  const hourInMs = 60 * 60 * 1000;
  const basePrice = 0.000001;

  return Array.from({ length: hours }, (_, i) => {
    const timestamp = now - (hours - i) * hourInMs;
    const trend = Math.sin(i / 10) * 0.2; // Cyclical trend
    const noise = (Math.random() - 0.5) * 0.1; // Random noise
    const price = basePrice * (1 + trend + noise);

    return {
      timestamp,
      price: Math.max(price, 0.0000001), // Ensure positive price
      volume: 1000 + Math.random() * 10000,
    };
  });
}

/**
 * Generate test holders for distribution testing
 *
 * @param count - Number of holders to generate (default: 20)
 * @returns Array of mock holder objects
 */
export function generateTestHolders(count: number = 20) {
  return Array.from({ length: count }, (_, i) => {
    const isYou = i === 0;
    const isContract = i === 1;
    const percentage = isYou || isContract
      ? Math.random() * 15 + 5 // 5-20% for contract/you
      : Math.random() * 5; // 0-5% for others

    return {
      address: isYou
        ? 'You'
        : isContract
        ? 'Bonding Curve'
        : `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
      percentage,
      isYou,
      isContract,
      color: isYou
        ? '#00E054'
        : isContract
        ? '#D4AF37'
        : `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
      value: percentage * 1000, // Mock USD value
    };
  });
}

/**
 * Generate a test token with random properties
 *
 * @param overrides - Properties to override from defaults
 * @returns Mock token object
 */
export function generateTestToken(overrides: Partial<TokenType> = {}): TokenType {
  const randomId = Math.random().toString(36).slice(2, 10);
  const randomPrice = 0.000001 + Math.random() * 0.00001;

  return {
    id: randomId,
    name: overrides.name || `Test Token ${randomId}`,
    ticker: overrides.ticker || `TEST${Math.floor(Math.random() * 1000)}`,
    description: overrides.description || 'This is a test token for development purposes only.',
    imageUrl: overrides.imageUrl || 'https://via.placeholder.com/150',
    creator: overrides.creator || 'You',
    contractAddress: overrides.contractAddress || `0x${Math.random().toString(16).slice(2, 42)}`,
    marketCap: overrides.marketCap || 1000 + Math.random() * 10000,
    virtualLiquidity: overrides.virtualLiquidity || 5000,
    volume: overrides.volume || 5000,
    price: overrides.price || randomPrice,
    progress: overrides.progress || Math.random() * 100,
    createdAt: overrides.createdAt || Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
    supply: overrides.supply || 1000000000,
    boosts: overrides.boosts || Math.floor(Math.random() * 10),
    lastBoostedAt: overrides.lastBoostedAt,
    lastBurnedAt: overrides.lastBurnedAt,
    aiPersona: overrides.aiPersona,
    twitter: overrides.twitter,
    telegram: overrides.telegram,
    website: overrides.website,
    discord: overrides.discord,
    securityState: overrides.securityState || {
      mintRevoked: false,
      freezeRevoked: false,
      lpBurned: false,
    },
    sentiment: overrides.sentiment || {
      bullish: Math.floor(Math.random() * 100),
      bearish: Math.floor(Math.random() * 50),
    },
    isLive: overrides.isLive || Math.random() > 0.9,
    streamViewers: overrides.streamViewers,
  };
}

/**
 * Generate multiple test tokens
 *
 * @param count - Number of tokens to generate
 * @returns Array of mock tokens
 */
export function generateTestTokens(count: number = 10): TokenType[] {
  return Array.from({ length: count }, () => generateTestToken());
}

/**
 * Generate test comments for a token
 *
 * @param tokenId - Token ID
 * @param count - Number of comments to generate
 * @returns Array of mock comments
 */
export function generateTestComments(tokenId: string, count: number = 10) {
  const sampleComments = [
    'This token is going to the moon! 🚀',
    'Love the project! 💎',
    'When farming?',
    'Great community here',
    'HODL to the moon!',
    'Dev is building something big',
    'Diamond hands only 💎🙌',
    'Early here, still accumulating',
    'Nice project, good team',
    'To the moon! 🌙',
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `test-comment-${i}`,
    tokenId,
    user: i % 3 === 0 ? 'You' : `0x${Math.random().toString(16).slice(2, 8)}`,
    text: sampleComments[i % sampleComments.length],
    timestamp: Date.now() - (count - i) * 60 * 60 * 1000, // One per hour
    likes: Math.floor(Math.random() * 50),
    imageUrl: Math.random() > 0.8 ? 'https://via.placeholder.com/300' : undefined,
  }));
}

/**
 * Generate test orders
 *
 * @param tokenId - Token ID
 * @param count - Number of orders to generate
 * @returns Array of mock orders
 */
export function generateTestOrders(tokenId: string, count: number = 5) {
  return Array.from({ length: count }, (_, i) => ({
    id: `test-order-${i}`,
    tokenId,
    type: Math.random() > 0.5 ? 'buy' : 'sell',
    mode: Math.random() > 0.5 ? 'limit' : 'stop',
    amount: 100 + Math.random() * 1000,
    price: 0.000001 + Math.random() * 0.00001,
    ticker: 'TEST',
    timestamp: Date.now() - Math.random() * 24 * 60 * 60 * 1000,
  }));
}

/**
 * Create a warning banner for test data mode
 * Display this prominently when test data is enabled
 */
export function TestDataWarningBanner() {
  if (!isTestDataEnabled) return null;

  return (
    <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-4 py-2 text-sm font-bold text-center">
      ⚠️ TEST DATA MODE - Using mock data for development only
    </div>
  );
}

/**
 * Log test data usage for debugging
 */
export function logTestDataUsage(context: string, details?: any) {
  if (!isTestDataEnabled) return;

  if (import.meta.env.DEV) {
    console.debug(`[TEST_DATA] Using test data in ${context}`, details || '');
  }
}
