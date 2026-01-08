
export const DOGECHAIN_ID = 2000;
export const DOGECHAIN_HEX_ID = '0x7d0';

export const RPC_URL = 'https://rpc.dogechain.dog';
export const EXPLORER_URL = 'https://explorer.dogechain.dog';

export const TOKENS = {
  DC: '0x7B4328c127B85369D9f82ca0503B000D09CF9180',
  wDOGE: '0xB7ddC6414bf4F5515b52D8BdD69973Ae205ff101'
};

export const GRADUATION_MARKETCAP_USD = 6900; // $6,900 USD graduation threshold (CONFIGURABLE)
export const FEE_PERCENTAGE = 0.01; // 1%
export const GRADUATED_FEE_PERCENTAGE = 0.005; // 0.5%
export const LAUNCH_FEE = 10000; // 10,000 DC deployment fee
export const MAX_CREATOR_BUY_PERCENTAGE = 0.03; // 3% maximum for creator initial buy
export const TOTAL_SUPPLY = 1000000000; // 1 billion tokens total supply
export const INITIAL_TOKEN_PRICE = 0.000005; // Starting price

// Price Oracle Configuration
export const DC_TOKEN_ADDRESS = '0x7B4328c127B85369D9f82ca0503B000D09CF9180'; // DC token on DogeChain
export const WDOGE_TOKEN_ADDRESS = '0xB7ddC6414bf4F5515b52D8BdD69973Ae205ff101'; // wDOGE token on DogeChain
export const PRICE_UPDATE_INTERVAL = 30000; // Update price every 30 seconds
export const PRICE_CACHE_TTL = 60000; // Cache price for 1 minute
export const TWAP_WINDOW_SECONDS = 300; // 5-minute TWAP window
export const MIN_POOL_LIQUIDITY_USD = 1000; // Minimum $1,000 pool liquidity to trust pool price
export const MAX_PRICE_DEVIATION = 0.15; // Max 15% price change per update (anti-manipulation)

// API Endpoints (Free tiers)
export const DEXSCREENER_API_BASE = 'https://api.dexscreener.com/latest';
export const GECKOTERMINAL_API_BASE = 'https://api.geckoterminal.com/api/v2';

// Name Generators for Dummy Data
const PREFIXES = ["Super", "Safe", "Elon", "Moon", "Doge", "Baby", "Based", "Chad", "Pepe", "Cyber", "Space", "Golden", "Rich"];
const SUFFIXES = ["Doge", "Inu", "Rocket", "Gem", "Coin", "Mars", "Swap", "Pump", "WifHat", "CEO", "GPT", "X", "AI"];

export const generateRandomToken = (index: number) => {
  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
  const name = `${prefix} ${suffix}`;
  // Ensure unique ticker
  const ticker = (prefix.substring(0, 1) + suffix.substring(0, 3) + index).toUpperCase();
  
  const isPumped = Math.random() > 0.8;
  const progress = isPumped ? Math.random() * 40 + 60 : Math.random() * 30;
  
  return {
    id: `token-${index}`,
    name,
    ticker,
    description: `The official ${name} token for the Dogechain ecosystem. Much wow, very pump.`,
    imageUrl: `https://picsum.photos/seed/${ticker}/200/200`,
    creator: `0x${Math.random().toString(16).slice(2, 10)}...`,
    contractAddress: `0x${Math.random().toString(16).slice(2, 42).padStart(40, '0')}`,
    marketCap: 500 + (progress * 60),
    virtualLiquidity: 1000 + (progress * 100),
    volume: Math.floor(Math.random() * 50000),
    price: 0.000005 * (1 + (progress / 10)),
    progress: progress,
    createdAt: Date.now() - Math.floor(Math.random() * 10000000),
    aiPersona: "A generated distinct personality based on the token name.",
    twitter: `https://twitter.com/search?q=${ticker}`,
    telegram: `https://t.me/${ticker}_portal`,
    website: `https://${ticker.toLowerCase()}.fun`
  };
};

// Generate 20 Initial Tokens
export const SAMPLE_TOKENS = Array.from({ length: 20 }).map((_, i) => generateRandomToken(i));

// ============================================================================
// DogeTV Configuration
// ============================================================================

export const DOGE_TV_ROTATION_INTERVAL_MS = 15000; // 15 seconds per token
export const DOGE_TV_TOKEN_COUNT = 10; // Number of tokens to display in rotation
export const DOGE_TV_TRADE_COUNT = 15; // Number of recent trades to show
