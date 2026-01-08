/**
 * DEX Constants
 *
 * Centralized constants for DEX operations.
 * Replaces magic numbers throughout the DEX codebase.
 */

// ============================================================================
// FEE CONSTANTS
// ============================================================================

/**
 * Fee denominator for calculations
 * Example: (amount * 997) / 1000 = amount with 0.3% fee
 */
export const FEE_DENOMINATOR = 1000n;

/**
 * Fee numerator for 0.3% swap fee
 * Formula: outputAmount = (amountIn * reserveOut * FEE_NUMERATOR) / (reserveIn * FEE_DENOMINATOR + amountIn * FEE_NUMERATOR)
 */
export const FEE_NUMERATOR = 997n;

/**
 * Default swap fee percentage (0.3%)
 */
export const DEFAULT_SWAP_FEE_PERCENT = 0.3;

/**
 * Protocol fee percentage (0.3%)
 */
export const PROTOCOL_FEE_PERCENT = 0.003;

// ============================================================================
// TOKEN DECIMALS
// ============================================================================

/**
 * Default number of decimals for ERC20 tokens
 */
export const DEFAULT_TOKEN_DECIMALS = 18;

/**
 * Decimals for USDC and similar stablecoins
 */
export const USDC_DECIMALS = 6;

/**
 * Decimals for tokens with 8 decimal places (like some stablecoins)
 */
export const STABLECOIN_8_DECIMALS = 8;

// ============================================================================
// SLIPPAGE & DEADLINE
// ============================================================================

/**
 * Default slippage tolerance (0.5%)
 * Used when user hasn't customized slippage
 */
export const DEFAULT_SLIPPAGE_PERCENT = 0.5;

/**
 * Minimum slippage tolerance (0.1%)
 * Prevents setting slippage too low
 */
export const MIN_SLIPPAGE_PERCENT = 0.1;

/**
 * Maximum slippage tolerance (50%)
 * Prevents setting slippage dangerously high
 */
export const MAX_SLIPPAGE_PERCENT = 50;

/**
 * Default transaction deadline (20 minutes)
 * Time in minutes before a transaction expires
 */
export const DEFAULT_DEADLINE_MINUTES = 20;

/**
 * Minimum deadline (1 minute)
 */
export const MIN_DEADLINE_MINUTES = 1;

/**
 * Maximum deadline (1 hour = 60 minutes)
 */
export const MAX_DEADLINE_MINUTES = 60;

/**
 * Convert minutes to seconds for blockchain
 */
export const MINUTES_TO_SECONDS = 60;

/**
 * Default deadline in seconds (20 minutes * 60)
 */
export const DEFAULT_DEADLINE_SECONDS = DEFAULT_DEADLINE_MINUTES * MINUTES_TO_SECONDS;

// ============================================================================
// POOL CONSTANTS
// ============================================================================

/**
 * Minimum liquidity threshold for pool creation
 * Prevents dust pools
 */
export const MINIMUM_LIQUIDITY = 1000n;

/**
 * Minimum pool liquidity in USD
 * Used to filter low-liquidity pools
 */
export const MIN_POOL_LIQUIDITY_USD = 1000;

/**
 * Initial liquidity tokens to burn
 * Prevents first liquidity provider from draining the pool
 */
export const MINIMUM_LIQUIDITY_TO_BURN = 1000n;

// ============================================================================
// PRICE IMPACT
// ============================================================================

/**
 * Maximum acceptable price impact (5%)
 * Warns user when price impact exceeds this
 */
export const MAX_PRICE_IMPACT_PERCENT = 5;

/**
 * High price impact threshold (3%)
 * Shows warning when price impact exceeds this
 */
export const HIGH_PRICE_IMPACT_PERCENT = 3;

/**
 * Price impact warning threshold (1%)
 * Shows caution when price impact exceeds this
 */
export const WARNING_PRICE_IMPACT_PERCENT = 1;

// ============================================================================
// GAS CONSTANTS
// ============================================================================

/**
 * Maximum gas limit for transactions
 * Prevents excessively high gas limits
 */
export const MAX_GAS_LIMIT = 500000n;

/**
 * Default gas limit for simple swaps
 */
export const DEFAULT_SWAP_GAS_LIMIT = 200000n;

/**
 * Default gas limit for adding liquidity
 */
export const DEFAULT_ADD_LIQUIDITY_GAS_LIMIT = 300000n;

/**
 * Default gas limit for removing liquidity
 */
export const DEFAULT_REMOVE_LIQUIDITY_GAS_LIMIT = 250000n;

// ============================================================================
// ROUTING CONSTANTS
// ============================================================================

/**
 * Maximum number of hops in a swap route
 * Prevents excessively long swap paths
 */
export const MAX_HOPS = 3;

/**
 * Minimum output amount for routing
 * Prevents routing dust amounts
 */
export const MIN_OUTPUT_AMOUNT = 1n;

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

/**
 * Maximum token symbol length
 */
export const MAX_TOKEN_SYMBOL_LENGTH = 11;

/**
 * Maximum token name length
 */
export const MAX_TOKEN_NAME_LENGTH = 50;

/**
 * Minimum token amount (in wei)
 */
export const MIN_TOKEN_AMOUNT = 0n;

/**
 * Maximum token amount (prevents overflow)
 * Equal to uint256 max but safer for calculations
 */
export const MAX_TOKEN_AMOUNT = 115792089237316195423570985008687907853269984665640564039457584007913129639935n;

// ============================================================================
// UI CONSTANTS
// ============================================================================

/**
 * Number of pools to display per page
 */
export const POOLS_PER_PAGE = 10;

/**
 * Number of recent swaps to display
 */
export const RECENT_SWAPS_COUNT = 20;

/**
 * Number of top providers to display
 */
export const TOP_PROVIDERS_COUNT = 10;

/**
 * Refresh interval for pool data (milliseconds)
 */
export const POOL_DATA_REFRESH_INTERVAL = 30000; // 30 seconds

/**
 * Price cache TTL (milliseconds)
 */
export const PRICE_CACHE_TTL = 30000; // 30 seconds

/**
 * TWAP window duration (seconds)
 */
export const TWAP_WINDOW_SECONDS = 300; // 5 minutes

// ============================================================================
// CHAIN CONSTANTS
// ============================================================================

/**
 * Dogechain mainnet chain ID
 */
export const DOGECHAIN_CHAIN_ID = 2000;

/**
 * Dogechain mainnet hex chain ID
 */
export const DOGECHAIN_HEX_CHAIN_ID = '0x7d0';

/**
 * Dogechain mainnet RPC URL
 */
export const DOGECHAIN_MAINNET_RPC = 'https://rpc.dogechain.dog';

/**
 * Dogechain testnet RPC URL
 */
export const DOGECHAIN_TESTNET_RPC = 'https://rpc-testnet.dogechain.dog';

/**
 * Dogechain explorer URL
 */
export const DOGECHAIN_EXPLORER_URL = 'https://explorer.dogechain.dog';

/**
 * Dogechain testnet explorer URL
 */
export const DOGECHAIN_TESTNET_EXPLORER_URL = 'https://explorer-testnet.dogechain.dog';

// ============================================================================
// TOKEN ADDRESSES
// ============================================================================

/**
 * DC token address on Dogechain
 */
export const DC_TOKEN_ADDRESS = '0x7B4328c127B85369D9f82ca0503B000D09CF9180';

/**
 * wDOGE token address on Dogechain
 */
export const WDOGE_TOKEN_ADDRESS = '0xB7ddC6414bf4F5515b52D8BdD69973Ae205ff101';

// ============================================================================
// ERROR MESSAGES
// ============================================================================

/**
 * Error message for insufficient liquidity
 */
export const ERROR_INSUFFICIENT_LIQUIDITY = 'Insufficient liquidity in pool';

/**
 * Error message for slippage exceeded
 */
export const ERROR_SLIPPAGE_EXCEEDED = 'Slippage exceeded tolerance';

/**
 * Error message for expired transaction
 */
export const ERROR_TRANSACTION_EXPIRED = 'Transaction expired';

/**
 * Error message for invalid token address
 */
export const ERROR_INVALID_TOKEN_ADDRESS = 'Invalid token address';

/**
 * Error message for identical tokens
 */
export const ERROR_IDENTICAL_TOKENS = 'Cannot swap token for itself';

/**
 * Error message for insufficient balance
 */
export const ERROR_INSUFFICIENT_BALANCE = 'Insufficient token balance';

/**
 * Error message for insufficient allowance
 */
export const ERROR_INSUFFICIENT_ALLOWANCE = 'Insufficient allowance. Please approve token first.';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Convert percentage to basis points
 * @param percent Percentage value (e.g., 0.5 for 0.5%)
 * @returns Basis points (e.g., 50 for 0.5%)
 */
export const percentToBasisPoints = (percent: number): number => {
  return Math.floor(percent * 100);
};

/**
 * Convert basis points to percentage
 * @param bps Basis points (e.g., 50)
 * @returns Percentage (e.g., 0.5 for 0.5%)
 */
export const basisPointsToPercent = (bps: number): number => {
  return bps / 100;
};

/**
 * Calculate minimum output amount with slippage
 * @param amount Output amount
 * @param slippagePercent Slippage percentage (e.g., 0.5 for 0.5%)
 * @returns Minimum amount after slippage
 */
export const calculateMinAmount = (amount: string, slippagePercent: number): string => {
  const amountValue = parseFloat(amount);
  const minAmount = amountValue * (1 - slippagePercent / 100);
  return minAmount.toFixed(8);
};

/**
 * Validate token address
 * @param address Token address to validate
 * @returns True if valid Ethereum address
 */
export const isValidTokenAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Calculate deadline timestamp
 * @param minutes Minutes from now
 * @returns Unix timestamp
 */
export const calculateDeadline = (minutes: number = DEFAULT_DEADLINE_MINUTES): number => {
  return Math.floor(Date.now() / 1000) + (minutes * MINUTES_TO_SECONDS);
};
