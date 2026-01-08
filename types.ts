
export interface Token {
  id: string;
  name: string;
  ticker: string;
  description: string;
  imageUrl: string;
  creator: string;
  contractAddress: string; // Token contract address
  marketCap: number; // In USD for display
  virtualLiquidity: number; // In DC
  volume: number;
  price: number;
  progress: number; // 0 to 100% towards graduation
  createdAt: number;
  // Bonding curve params
  supply: number;
  boosts: number; // Number of times boosted
  lastBoostedAt?: number; // Timestamp of last boost
  lastBurnedAt?: number; // Timestamp of last burn
  aiPersona?: string; // The personality of the AI agent for this token
  // Socials
  twitter?: string;
  telegram?: string;
  website?: string;
  discord?: string;
  // Security State
  securityState: {
    mintRevoked: boolean;
    freezeRevoked: boolean;
    lpBurned: boolean;
  };
  // Admin State
  delisted?: boolean; // Whether token has been delisted by admin
  delistedAt?: number; // When it was delisted
  delistedBy?: string; // Admin who delisted it
  delistedReason?: string; // Reason for delisting
  // Community Sentiment
  sentiment: {
    bullish: number;
    bearish: number;
  };
  // Live Streaming
  isLive?: boolean;
  streamViewers?: number;
}

export type BadgeType = 'dev' | 'whale' | 'sniper' | 'diamond' | 'degen' | 'early' | 'burner' | 'farmer';

export interface Badge {
  id: BadgeType;
  label: string;
  icon: string;
  description: string;
  unlockedAt?: number;
}

export interface UserProfile {
  username: string;
  bio: string;
  avatarUrl: string;
  badges: Badge[];
  karma: number; // New Karma Points
}

export interface AppSettings {
  slippage: string;
  fastMode: boolean;
  audioEnabled: boolean;
  notificationsEnabled: boolean;
}

export interface Trade {
  id: string;
  type: 'buy' | 'sell' | 'burn';
  amountDC: number;
  amountToken: number;
  price: number;
  user: string;
  timestamp: number;
  txHash: string;
  tokenId: string;
  blockNumber: number;
  gasUsed: number;
}

export interface Order {
  id: string;
  tokenId: string;
  type: 'buy' | 'sell';
  mode: 'limit' | 'stop';
  amount: number; // DC for Buy, Tokens for Sell
  price: number; // Trigger Price
  ticker: string;
  timestamp: number;
}

export interface PriceAlert {
  id: string;
  tokenId: string;
  price: number;
  condition: 'above' | 'below';
  active: boolean;
  createdAt: number;
}

export interface FarmPosition {
  tokenId: string;
  stakedAmount: number;
  lastHarvestTime: number;
  accumulatedRewards: number;
  apy: number; // Mock APY
}

export interface LockedAsset {
  id: string;
  tokenId: string;
  amount: number;
  lockedAt: number;
}

export interface Comment {
  id: string;
  tokenId: string;
  user: string;
  text: string;
  timestamp: number;
  likes: number;
  imageUrl?: string;
  badges?: BadgeType[];
  tradeAction?: {
    type: 'buy' | 'sell';
    amount: number;
  };
  reports?: number;
  isReported?: boolean;
}

export interface UserState {
  address: string | null;
  chainId: number | null;
  balance: string;
  isConnected: boolean;
}

export interface Holding {
  tokenId: string;
  balance: number;
}

export interface PricePoint {
  timestamp: number;
  price: number;
  volume: number;
}

export interface Candle {
  time: string; // Display time
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  buyVolume: number;
  sellVolume: number;
  tradeCount: number;
  isBuyCandle: boolean; // true if buy volume > sell volume
  sma?: number | null;
}

export interface AppNotification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error' | 'trade' | 'rocket' | 'badge' | 'alert' | 'farm' | 'karma';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  link?: string;
}

export interface MarketEvent {
  id: string;
  title: string;
  description: string;
  type: 'bullish' | 'bearish' | 'neutral';
  multiplier: number; // Affects price movement magnitude
  active: boolean;
  expiresAt: number;
  source?: string; // News source name
  sourceUrl?: string; // URL to the news source
  launchType?: 'new' | 'trending' | 'milestone' | 'graduation'; // Token launch event type
  colorScheme?: 'green' | 'purple' | 'gold' | 'rainbow'; // Banner color scheme
}

export interface NetworkStats {
  blockHeight: number;
  gasPrice: number; // in Gwei
  tps: number;
  lastUpdated: number;
}

export interface Report {
  id: string;
  type: 'comment' | 'token' | 'user';
  commentId?: string;
  tokenId?: string;
  reporter: string;
  reportedUser: string;
  reason: 'spam' | 'harassment' | 'inappropriate' | 'scam' | 'other';
  description: string;
  timestamp: number;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  reviewedBy?: string;
  reviewedAt?: number;
  resolution?: string;
  adminNotes?: string; // Admin notes on the action taken
  actionTaken?: 'none' | 'resolved' | 'dismissed' | 'token_delisted' | 'user_banned' | 'warned';
}

export interface AdminAction {
  id: string;
  type: 'delist_token' | 'relist_token' | 'ban_user' | 'unban_user' | 'warn_user';
  targetType: 'token' | 'user';
  targetId: string;
  adminAddress: string;
  reason: string;
  notes: string;
  timestamp: number;
}

export interface BannedUser {
  address: string;
  bannedAt: number;
  bannedBy: string;
  reason: string;
  notes?: string;
  permanent: boolean;
  expiresAt?: number;
}

export interface WarnedUser {
  address: string;
  tokenId?: string; // If present, this is a token warning (for token creator), otherwise it's a user warning
  warnedAt: number;
  warnedBy: string;
  reason: string;
  notes?: string;
  isActive: boolean;
  expiresAt?: number;
  acknowledgedAt?: number; // Timestamp when user acknowledged the warning
}

export interface AdminDashboard {
  reports: Report[];
  stats: {
    totalReports: number;
    pendingReports: number;
    resolvedReports: number;
    dismissedReports: number;
  };
}

export interface CopyTarget {
  address: string;
  maxAmountDC: number; // Max DC to spend per copy trade
  active: boolean;
  totalCopiedVolume: number;
  lastCopiedAt?: number;
}

export enum NetworkStatus {
  DISCONNECTED,
  WRONG_NETWORK,
  CONNECTED,
  LOADING
}

/**
 * Represents an emoji reaction on a token chart
 * Used for user interactions with chart visualizations (🚀🔥💎💀)
 */
export interface EmojiReaction {
  /** Unique identifier for the reaction */
  id: string;
  /** ID of the token this reaction is associated with */
  tokenId: string;
  /** The emoji character (e.g., '🚀', '🔥', '💎', '💀') */
  emoji: string;
  /** ID of the user who created the reaction */
  userId: string;
  /** Unix timestamp when the reaction was created */
  timestamp: number;
  /** Number of times this emoji has been used (for aggregated reactions) */
  count: number;
}

/**
 * Statistics for emoji reactions on a token
 * Tracks counts for each emoji type and provides aggregate metrics
 */
export interface ReactionStats {
  /** ID of the token these stats belong to */
  tokenId: string;
  /** Count of rocket emoji reactions (🚀) */
  rocketCount: number;
  /** Count of fire emoji reactions (🔥) */
  fireCount: number;
  /** Count of diamond emoji reactions (💎) */
  diamondCount: number;
  /** Count of skull emoji reactions (💀) */
  skullCount: number;
  /** Total number of all emoji reactions combined */
  totalReactions: number;
  /** Unix timestamp when stats were last updated */
  lastUpdated: number;
}

/**
 * Comprehensive analytics data for emoji reactions
 * Provides insights into emoji usage patterns and popularity
 */
export interface EmojiAnalytics {
  /** ID of the token these analytics are for */
  tokenId: string;
  /** Array of most popular emojis, sorted by count */
  popularEmojis: {
    /** The emoji character */
    emoji: string;
    /** Number of times this emoji has been used */
    count: number;
    /** Percentage of total reactions this emoji represents */
    percentage: number;
  }[];
  /** Total number of emoji reactions across all types */
  totalReactions: number;
  /** Number of unique users who have reacted */
  uniqueReactors: number;
  /** Timestamp of the first reaction */
  firstReactionAt: number;
  /** Timestamp of the most recent reaction */
  lastReactionAt: number;
  /** Average number of reactions per hour (calculated over last 24h) */
  reactionsPerHour: number;
  /** Trend direction: 'up', 'down', or 'stable' based on recent activity */
  trend: 'up' | 'down' | 'stable';
}

/**
 * Message type for BroadcastChannel synchronization across browser tabs
 * Enables real-time emoji reaction updates between multiple tabs
 */
export interface SyncMessage {
  /** Type of sync message being sent */
  type: 'add_reaction' | 'remove_reaction' | 'update_stats' | 'sync_all' | 'sentiment_vote';
  /** ID of the token being synced */
  tokenId: string;
  /** The emoji reaction data (present for add/remove operations) */
  reaction?: EmojiReaction;
  /** Updated reaction stats (present for update operations) */
  stats?: ReactionStats;
  /** Sentiment vote data (present for sentiment_vote operations) */
  sentimentVote?: {
    /** Type of sentiment vote */
    voteType: 'bullish' | 'bearish';
  };
  /** Unique identifier for this sync message to prevent duplicates */
  messageId: string;
  /** Unix timestamp when the sync message was created */
  timestamp: number;
  /** ID of the user who initiated the sync */
  userId: string;
}

/**
 * Supported emoji types for chart reactions
 * Defines the standard set of emojis available for user interactions
 */
export type ChartEmoji = '🚀' | '🔥' | '💎' | '💀';

/**
 * Sentiment vote type for bullish/bearish indicators
 * Used in conjunction with emoji reactions to gauge market sentiment
 */
export type SentimentVote = 'bullish' | 'bearish';

/**
 * Comment with emoji reactions
 * Extends the base Comment type to include emoji reaction support
 */
export interface EmojiComment {
  /** Unique identifier for the comment */
  id: string;
  /** ID of the token this comment is on */
  tokenId: string;
  /** Username of the commenter */
  user: string;
  /** Comment text content */
  text: string;
  /** Unix timestamp when comment was created */
  timestamp: number;
  /** Number of likes on the comment */
  likes: number;
  /** Optional image URL attached to comment */
  imageUrl?: string;
  /** Badges earned by the commenter */
  badges?: BadgeType[];
  /** Optional trade action associated with comment */
  tradeAction?: {
    type: 'buy' | 'sell';
    amount: number;
  };
  /** Emoji reactions on this comment */
  reactions: EmojiReaction[];
  /** Total count of all emoji reactions */
  reactionCount: number;
  /** Number of times this comment has been reported */
  reports?: number;
  /** Whether this comment has been reported by current user */
  isReported?: boolean;
}

// ============================================================================
// Backend API Types
// ============================================================================

/**
 * Backend user profile
 */
export interface BackendUser {
  id: string;
  email: string;
  username: string;
  walletAddress?: string;
  role: 'user' | 'admin';
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

/**
 * Authentication tokens
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Authentication response
 */
export interface AuthResponse {
  success: boolean;
  user: BackendUser;
  tokens: AuthTokens;
}

/**
 * Login request
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Register request
 */
export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  walletAddress?: string;
}

/**
 * Image upload response
 */
export interface ImageUploadResponse {
  success: boolean;
  image: {
    id: string;
    url: string;
    filename: string;
    mimetype: string;
    size: number;
    uploadedAt: Date;
  };
}

/**
 * Backend comment
 */
export interface BackendComment {
  id: string;
  content: string;
  userId: string;
  username: string;
  imageId?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create comment request
 */
export interface CreateCommentRequest {
  content: string;
  imageId?: string;
}

/**
 * API error response
 */
export interface APIError {
  statusCode: number;
  error: string;
  message: string;
  details?: any;
}

// ============================================================================
// Token Owner Farm Types
// ============================================================================

/**
 * Configuration for a token owner's farm
 */
export interface FarmConfiguration {
  /** Reward distribution rate (tokens per second per staked unit) */
  rewardRate: number;
  /** Duration of farm in seconds (0 = indefinite) */
  duration: number;
  /** Minimum lock period in seconds (0 = no lock) */
  lockPeriod: number;
  /** Maximum total staking capacity (0 = unlimited) */
  maxStakeAmount: number;
  /** Minimum staking amount per user */
  minStakeAmount: number;
  /** Whether new stakes are allowed */
  isPaused: boolean;
  /** Timestamp when farm was created */
  createdAt: number;
  /** Timestamp when farm was last modified */
  updatedAt: number;
  /** Timestamp when farm expires (if duration > 0) */
  expiresAt?: number;
}

/**
 * Reward pool tracking for a farm
 */
export interface RewardPool {
  /** Unique pool identifier */
  id: string;
  /** ID of farm this pool belongs to */
  farmId: string;
  /** Token ID used as reward */
  rewardTokenId: string;
  /** Total rewards deposited by token owner */
  totalDeposited: number;
  /** Rewards currently available for distribution */
  availableRewards: number;
  /** Total rewards distributed to stakers */
  totalDistributed: number;
  /** Last timestamp when rewards were calculated */
  lastCalculatedAt: number;
}

/**
 * A farm created by a token owner
 */
export interface TokenOwnerFarm {
  /** Unique farm identifier */
  id: string;
  /** Token ID that owns this farm (creator's token) */
  ownerTokenId: string;
  /** Token ID that users stake to earn rewards */
  stakingTokenId: string;
  /** Token ID used as reward (can be same as owner token or different) */
  rewardTokenId: string;
  /** Farm configuration */
  config: FarmConfiguration;
  /** Reward pool information */
  pool: RewardPool;
  /** Farm statistics */
  stats: FarmStats;
  /** Farm status */
  status: 'active' | 'paused' | 'expired' | 'closed';
  /** Optional description for farm */
  description?: string;
}

/**
 * Farm statistics and metrics
 */
export interface FarmStats {
  /** Total amount staked across all users */
  totalStaked: number;
  /** Number of unique stakers */
  uniqueStakers: number;
  /** Current APY (calculated dynamically) */
  currentAPY: number;
  /** Total rewards distributed */
  totalRewardsDistributed: number;
  /** Average stake duration (in seconds) */
  avgStakeDuration: number;
  /** Last updated timestamp */
  lastUpdated: number;
}

/**
 * User's position in a token owner farm
 */
export interface TokenOwnerFarmPosition {
  /** Unique position identifier */
  id: string;
  /** Farm ID */
  farmId: string;
  /** User address */
  userAddress: string;
  /** Amount of tokens staked */
  stakedAmount: number;
  /** Timestamp when position was created */
  stakedAt: number;
  /** Last timestamp when rewards were claimed */
  lastHarvestTime: number;
  /** Accumulated but unclaimed rewards */
  accumulatedRewards: number;
  /** Whether position is locked */
  isLocked: boolean;
  /** Timestamp when lock expires */
  lockExpiresAt?: number;
}

/**
 * Request to create a new farm
 */
export interface CreateFarmRequest {
  ownerTokenId: string;
  stakingTokenId: string;
  rewardTokenId: string;
  rewardDepositAmount: number;
  config: Omit<FarmConfiguration, 'createdAt' | 'updatedAt' | 'expiresAt'>;
  description?: string;
}

/**
 * Request to deposit additional rewards
 */
export interface DepositRewardsRequest {
  farmId: string;
  amount: number;
}

/**
 * Request to update farm configuration
 */
export interface UpdateFarmConfigRequest {
  farmId: string;
  config: Partial<FarmConfiguration>;
}

/**
 * Request to stake in a farm
 */
export interface StakeInFarmRequest {
  farmId: string;
  amount: number;
}

/**
 * Request to unstake from a farm
 */
export interface UnstakeFromFarmRequest {
  farmId: string;
  amount: number;
}

/**
 * Request to harvest rewards
 */
export interface HarvestRewardsRequest {
  farmId: string;
}

/**
 * Farm list response
 */
export interface FarmListResponse {
  farms: TokenOwnerFarm[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DexPool {
  address: string;
  token0: TokenInfo;
  token1: TokenInfo;
  reserves: { token0: bigint; token1: bigint };
  totalSupply: bigint;
  tvl: number;
  volume24h: number;
  fee24h: number;
  apy?: number;
}

export interface DexLiquidityPosition {
  id: string;
  pool: DexPool;
  liquidity: bigint;
  token0Amount: bigint;
  token1Amount: bigint;
  valueUSD: number;
  poolShare: number;
  staked?: boolean;
  farmId?: string;
}

export interface DexSwapQuote {
  amountIn: bigint;
  amountOut: bigint;
  priceImpact: number;
  minimumOut: bigint;
  gasEstimate: bigint;
  gasCostUSD: number;
  path: string[];
}

export interface DexTransaction {
  id: string;
  type: 'swap' | 'addLiquidity' | 'removeLiquidity';
  hash?: string;
  status: 'pending' | 'confirming' | 'confirmed' | 'failed' | 'cancelled';
  timestamp: number;
  details: any;
}

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
  isNative?: boolean;
}

export interface TokenPrice {
  address: string;
  priceInDC: number;
  priceInUSD: number;
  priceInWDOGE: number;
  lastUpdated: number;
  change24h: number;
}

export interface PoolInfo {
  address: string;
  token0: TokenInfo;
  token1: TokenInfo;
  reserve0: bigint;
  reserve1: bigint;
  totalSupply: bigint;
  lpTokenAddress: string;
  createdAt: number;
  tvlUSD: number;
  volume24h: number;
  fees24h: number;
  apy: number;
}

export interface LPPosition {
  id: string;
  poolAddress: string;
  token0: TokenInfo;
  token1: TokenInfo;
  liquidity: bigint;
  lpTokenBalance: bigint;
  shareOfPool: number;
  valueUSD: number;
  unclaimedFees: bigint;
  stakedInFarm: boolean;
  farmId?: string;
}

export interface PendingTransaction {
  id: string;
  type: 'swap' | 'add_liquidity' | 'remove_liquidity' | 'create_pool';
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  details: any;
}

// ============================================================================
// Leaderboard Types
// ============================================================================

/**
 * Statistics for a trader on the leaderboard
 */
export interface TraderStats {
  address: string;
  volume: number;
  trades: number;
}

/**
 * Statistics for a token burner on the leaderboard
 */
export interface BurnerStats {
  address: string;
  burned: number;
  count: number;
}

/**
 * Statistics for a token creator on the leaderboard
 */
export interface CreatorStats {
  address: string;
  marketCapGen: number;
  launched: number;
}

/**
 * A single entry on the leaderboard with display information
 */
export interface LeaderboardEntry {
  rank: number;
  address: string;
  username: string;
  metric: string;
  subMetric: string;
  avatar?: string;
  winRate?: number;
  successRate?: number;
}

/**
 * Leaderboard pagination constant
 */
export const LEADERBOARD_PAGE_SIZE = 20;
