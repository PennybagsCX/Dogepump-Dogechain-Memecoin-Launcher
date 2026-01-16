
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Token, Trade, Comment, Holding, PricePoint, AppNotification, UserProfile, AppSettings, Badge, BadgeType, Order, PriceAlert, FarmPosition, MarketEvent, NetworkStats, LockedAsset, CopyTarget, ReactionStats, ChartEmoji, EmojiReaction, Report, AdminAction, BannedUser, WarnedUser, TokenOwnerFarm, FarmConfiguration, RewardPool, FarmStats, TokenOwnerFarmPosition, CreateFarmRequest, DepositRewardsRequest, UpdateFarmConfigRequest, StakeInFarmRequest, UnstakeFromFarmRequest, HarvestRewardsRequest } from '../types';
import { farmService, calculateAPY, calculateCurrentAPY, setGlobalTokens, initializeFarmService } from '../services/farmService';
import { GRADUATION_MARKETCAP_USD, MAX_CREATOR_BUY_PERCENTAGE, TOTAL_SUPPLY, INITIAL_TOKEN_PRICE, PRICE_UPDATE_INTERVAL } from '../constants';
import { playSound } from '../services/audio';
import { generatePseudonym } from '../utils';
import { getUserId, getReactionStats, calculateReactionStats, updateReactionStats, addReaction, removeReaction } from '../services/emojiService';
import { emojiSyncService } from '../services/emojiSyncService';
import backendService from '../services/backendService';
import { priceOracleService } from '../services/priceOracleService';
import * as moderationApi from '../services/moderationApi';
import { getLatestTokenLaunch } from '../services/tokenLaunchService';
import { initializeDemoAuth, getAccessToken } from '../services/authService';

// Increment this version to force a data reset on client browsers
const DATA_VERSION = '1.9';

// Mock Username Registry
const USERNAME_MAP: Record<string, string> = {
   '0x71C...9A23': 'DiamondHands_420',
   '0x3a2...1B9f': 'DogeWhale',
   '0x881...Cc22': 'MoonSniper',
   '0xElon...Doge': 'ElonMuskOdor',
   '0xMoon...Boi': 'LamboSoon',
   '0xDev...Chad': 'BasedDev',
   '0x99...888': 'WagmiWarrior',
   '0x22F4194F6706E70aBaA14AB352D0baA6C7ceD24a': 'Admin'
};

// Generators for Inline Data
const PREFIXES = ["Super", "Safe", "Elon", "Moon", "Doge", "Baby", "Based", "Chad", "Pepe", "Cyber", "Space", "Golden", "Rich"];
const SUFFIXES = ["Doge", "Inu", "Rocket", "Gem", "Coin", "Mars", "Swap", "Pump", "WifHat", "CEO", "GPT", "X", "AI"];

/**
 * Create dummy farm data for testing purposes
 * Creates 5 farms with varied configurations for demonstration
 */
function createDummyFarms(): TokenOwnerFarm[] {
  const now = Date.now();
  
  return [
    {
      id: 'farm-superdoge-001',
      ownerTokenId: 'token-0',
      stakingTokenId: 'token-0',
      rewardTokenId: 'token-0',
      config: {
        rewardRate: 0.000577, // ~5000% APY
        duration: 2592000, // 30 days
        lockPeriod: 86400, // 1 day
        maxStakeAmount: 1000000,
        minStakeAmount: 100,
        isPaused: false,
        createdAt: now - 86400000, // 1 day ago
        updatedAt: now - 86400000,
      },
      pool: {
        id: 'pool-superdoge-001',
        farmId: 'farm-superdoge-001',
        rewardTokenId: 'token-0',
        totalDeposited: 500000,
        availableRewards: 500000,
        totalDistributed: 25000,
        lastCalculatedAt: now,
      },
      stats: {
        totalStaked: 125000,
        uniqueStakers: 45,
        currentAPY: 5000,
        totalRewardsDistributed: 25000,
        avgStakeDuration: 43200000, // 12 hours avg
        lastUpdated: now,
      },
      status: 'active',
      description: 'SuperDoge Farm - High APY rewards for staking SuperDoge tokens',
    },
    {
      id: 'farm-babyinu-002',
      ownerTokenId: 'token-0',
      stakingTokenId: 'token-0',
      rewardTokenId: 'token-0',
      config: {
        rewardRate: 0.000231, // ~2000% APY
        duration: 5184000, // 60 days
        lockPeriod: 172800, // 2 days
        maxStakeAmount: 500000,
        minStakeAmount: 50,
        isPaused: false,
        createdAt: now - 172800000, // 2 days ago
        updatedAt: now - 172800000,
      },
      pool: {
        id: 'pool-babyinu-002',
        farmId: 'farm-babyinu-002',
        rewardTokenId: 'token-0',
        totalDeposited: 750000,
        availableRewards: 725000,
        totalDistributed: 15000,
        lastCalculatedAt: now,
      },
      stats: {
        totalStaked: 87500,
        uniqueStakers: 32,
        currentAPY: 2000,
        totalRewardsDistributed: 15000,
        avgStakeDuration: 86400000, // 24 hours avg
        lastUpdated: now,
      },
      status: 'active',
      description: 'BabyInu Rewards - Medium APY with 2-day lock period',
    },
    {
      id: 'farm-mooncoin-003',
      ownerTokenId: 'token-0',
      stakingTokenId: 'token-0',
      rewardTokenId: 'token-0',
      config: {
        rewardRate: 0.000058, // ~500% APY
        duration: 7776000, // 90 days
        lockPeriod: 0, // No lock
        maxStakeAmount: 2000000,
        minStakeAmount: 10,
        isPaused: true, // Paused
        createdAt: now - 259200000, // 3 days ago
        updatedAt: now - 259200000,
      },
      pool: {
        id: 'pool-mooncoin-003',
        farmId: 'farm-mooncoin-003',
        rewardTokenId: 'token-0',
        totalDeposited: 1000000,
        availableRewards: 950000,
        totalDistributed: 50000,
        lastCalculatedAt: now,
      },
      stats: {
        totalStaked: 250000,
        uniqueStakers: 67,
        currentAPY: 500,
        totalRewardsDistributed: 50000,
        avgStakeDuration: 129600000, // 36 hours avg
        lastUpdated: now,
      },
      status: 'paused',
      description: 'MoonCoin Staking - Conservative APY with no lock period (currently paused)',
    },
    {
      id: 'farm-rocketyield-004',
      ownerTokenId: 'token-0',
      stakingTokenId: 'token-0',
      rewardTokenId: 'token-0',
      config: {
        rewardRate: 0.001155, // ~10000% APY
        duration: 1296000, // 15 days
        lockPeriod: 259200, // 3 days
        maxStakeAmount: 250000,
        minStakeAmount: 500,
        isPaused: false,
        createdAt: now - 43200000, // 12 hours ago
        updatedAt: now - 43200000,
      },
      pool: {
        id: 'pool-rocketyield-004',
        farmId: 'farm-rocketyield-004',
        rewardTokenId: 'token-4',
        totalDeposited: 250000,
        availableRewards: 250000,
        totalDistributed: 0,
        lastCalculatedAt: now,
      },
      stats: {
        totalStaked: 37500,
        uniqueStakers: 18,
        currentAPY: 10000,
        totalRewardsDistributed: 0,
        avgStakeDuration: 21600000, // 6 hours avg
        lastUpdated: now,
      },
      status: 'active',
      description: 'RocketYield - Very High APY with 3-day lock period',
    },
    {
      id: 'farm-safeharbor-005',
      ownerTokenId: 'token-0',
      stakingTokenId: 'token-0',
      rewardTokenId: 'token-0',
      config: {
        rewardRate: 0.000023, // ~200% APY
        duration: 31536000, // 1 year
        lockPeriod: 0, // No lock
        maxStakeAmount: 5000000,
        minStakeAmount: 1,
        isPaused: false,
        createdAt: now - 604800000, // 7 days ago
        updatedAt: now - 604800000,
      },
      pool: {
        id: 'pool-safeharbor-005',
        farmId: 'farm-safeharbor-005',
        rewardTokenId: 'token-5',
        totalDeposited: 2000000,
        availableRewards: 1950000,
        totalDistributed: 50000,
        lastCalculatedAt: now,
      },
      stats: {
        totalStaked: 500000,
        uniqueStakers: 123,
        currentAPY: 200,
        totalRewardsDistributed: 50000,
        avgStakeDuration: 259200000, // 72 hours avg
        lastUpdated: now,
      },
      status: 'active',
      description: 'SafeHarbor - Conservative APY with no lock period, long duration',
    },
  ];
}

const generateRandomToken = (index: number) => {
  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
  const name = `${prefix} ${suffix}`;
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
    marketCap: 500 + (progress * 60),
    virtualLiquidity: 1000 + (progress * 100),
    volume: Math.floor(Math.random() * 50000),
    price: 0.000005 * (1 + (progress / 10)),
    progress: progress,
    createdAt: Date.now() - Math.floor(Math.random() * 10000000),
    aiPersona: "A generated distinct personality based on the token name.",
    twitter: `https://twitter.com/search?q=${ticker}`,
    telegram: `https://t.me/${ticker}_portal`,
    discord: `https://discord.gg/${ticker.toLowerCase()}`,
    website: `https://${ticker.toLowerCase()}.fun`,
    supply: 1000000000,
    boosts: Math.floor(Math.random() * 20),
    securityState: {
      mintRevoked: Math.random() > 0.5,
      freezeRevoked: Math.random() > 0.5,
      lpBurned: Math.random() > 0.3
    },
    sentiment: {
      bullish: Math.floor(Math.random() * 500) + 100,
      bearish: Math.floor(Math.random() * 100)
    },
    isLive: false,
    streamViewers: 0
  };
};

const generateInitialTokens = () => {
  const baseTokens = Array.from({ length: 24 }).map((_, i) => generateRandomToken(i));

  return baseTokens.map((t, index) => {
    // 1. Ensure "Created" tokens exist (index 0 and 1)
    const isCreated = index < 2;
    const creator = isCreated ? 'You' : t.creator;

    // 2. Ensure "Graduated" tokens exist (index 5, 10, 15)
    const isGraduated = index % 5 === 0;
    const progress = isGraduated ? 100 : isCreated ? 5 : t.progress;
    const marketCap = isGraduated ? GRADUATION_MARKETCAP_USD * (1.2 + Math.random()) : t.marketCap;

    // 3. Ensure "Live" tokens exist (index 2, 7)
    const isLive = index === 2 || index === 7;

    // 4. Ensure "New" tokens exist (index 3, 4)
    const createdAt = (index === 3 || index === 4 || isCreated) ? Date.now() - (Math.random() * 60 * 60 * 1000) : t.createdAt;

    return {
      ...t,
      creator,
      progress,
      marketCap,
      createdAt,
      isLive,
      streamViewers: isLive ? Math.floor(Math.random() * 500) + 50 : 0
    };
  });
};

export interface StoreContextType {
  tokens: Token[];
  trades: Trade[];
  comments: Comment[];
  myHoldings: Holding[];
  lockedAssets: LockedAsset[];
  activeOrders: Order[];
  priceAlerts: PriceAlert[];
  farmPositions: FarmPosition[];
  tokenOwnerFarms: TokenOwnerFarm[];
  tokenOwnerFarmPositions: TokenOwnerFarmPosition[];
  copyTargets: CopyTarget[];
  userBalanceDC: number;
  priceHistory: Record<string, PricePoint[]>;
  watchlist: string[];
  notifications: AppNotification[];
  unreadCount: number;
  lightboxImage: string | null;
  userProfile: UserProfile;
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  settings: AppSettings;
  marketEvent: MarketEvent | null;
  recentlyUnlockedBadge: Badge | null;
  networkStats: NetworkStats;
  userAddress: string | null;
  reactionStats: Record<string, ReactionStats>;
  userReactions: Record<string, ChartEmoji | null>;
  reports: Report[];
  adminActions: AdminAction[];
  bannedUsers: BannedUser[];
  warnedUsers: WarnedUser[];
  banNoticeModal: { isOpen: boolean; reason?: string };
  warningNoticeModal: { isOpen: boolean; reason?: string; notes?: string; warningCount?: number; maxWarnings?: number; warningAddress?: string; warningTokenId?: string };
  // DEX State
  dexPools: any[];
  dexLpPositions: any[];
  dexSettings: { slippage: number; deadline: number; expertMode: boolean };
  dexTransactionQueue: any[];
  setDexPools: React.Dispatch<React.SetStateAction<any[]>>;
  setDexLpPositions: React.Dispatch<React.SetStateAction<any[]>>;
  setDexSettings: React.Dispatch<React.SetStateAction<{ slippage: number; deadline: number; expertMode: boolean }>>;
  setDexTransactionQueue: React.Dispatch<React.SetStateAction<any[]>>;
  launchToken: (name: string, ticker: string, description: string, image: string, persona: string, socials?: { twitter?: string, telegram?: string, website?: string, discord?: string }, initialBuyAmount?: number) => string;
  buyToken: (tokenId: string, amountDC: number, options?: { isLimitOrder?: boolean, isCopyTrade?: boolean }) => void;
  sellToken: (tokenId: string, amountToken: number, options?: { isLimitOrder?: boolean, isCopyTrade?: boolean }) => void;
  burnToken: (tokenId: string, amountToken: number) => void;
  lockForReputation: (tokenId: string, amountToken: number) => Promise<void>;
  unlockForReputation: (lockedAssetId: string) => Promise<void>;
  reputationPoints: number;
  boostToken: (tokenId: string, amountDC: number) => void;
  airdropToken: (tokenId: string, type: 'random' | 'holders', amountPerUser: number, count: number) => void;
  placeOrder: (tokenId: string, type: 'buy' | 'sell', mode: 'limit' | 'stop', amount: number, price: number) => void;
  cancelOrder: (orderId: string) => void;
  addPriceAlert: (tokenId: string, price: number) => void;
  removePriceAlert: (alertId: string) => void;
  stakeToken: (tokenId: string, amount: number) => void;
  unstakeToken: (tokenId: string, amount: number) => void;
  harvestRewards: (tokenId: string) => void;
  // Token Owner Farm Actions
  createFarm: (request: CreateFarmRequest) => Promise<string>;
  depositRewards: (farmId: string, amount: number) => Promise<void>;
  updateFarmConfig: (farmId: string, config: Partial<FarmConfiguration>) => Promise<void>;
  pauseFarm: (farmId: string) => Promise<void>;
  resumeFarm: (farmId: string) => Promise<void>;
  closeFarm: (farmId: string) => Promise<void>;
  stakeInFarm: (farmId: string, amount: number) => Promise<void>;
  unstakeFromFarm: (farmId: string, amount: number) => Promise<void>;
  harvestFarmRewards: (farmId: string) => Promise<number>;
  getFarm: (farmId: string) => TokenOwnerFarm | undefined;
  getMyFarms: () => TokenOwnerFarm[];
  getFarmPositions: (farmId?: string) => TokenOwnerFarmPosition[];
  getFarmStats: (farmId: string) => FarmStats | undefined;
  addComment: (tokenId: string, text: string, imageUrl?: string, tradeAction?: { type: 'buy' | 'sell'; amount: number }) => void;
  likeComment: (commentId: string) => void;
  toggleWatchlist: (tokenId: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  openLightbox: (src: string) => void;
  closeLightbox: () => void;
  resetStore: () => void;
  updateSecurity: (tokenId: string, key: 'mintRevoked' | 'freezeRevoked' | 'lpBurned') => void;
  updateTokenSocials: (tokenId: string, socials: { twitter?: string; telegram?: string; discord?: string; website?: string }) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  faucet: () => void;
  voteSentiment: (tokenId: string, type: 'bullish' | 'bearish') => void;
  setMarketEvent: (event: MarketEvent | null) => void;
  clearAchievement: () => void;
  toggleLiveStream: (tokenId: string, isLive: boolean) => void;
  followUser: (address: string, maxAmount: number) => void;
  unfollowUser: (address: string) => void;
  resolveUsername: (address: string) => string;
  addEmojiReaction: (tokenId: string, emoji: ChartEmoji) => void;
  removeEmojiReaction: (tokenId: string, emoji: ChartEmoji) => void;
  getEmojiReactionStats: (tokenId: string) => ReactionStats | null;
  getUserReaction: (tokenId: string) => ChartEmoji | null;
  initializeEmojiSystem: () => void;
  closeBanNoticeModal: () => void;
  closeWarningNoticeModal: () => void;
  showWarningModal: (reason: string, notes: string, warningCount?: number, maxWarnings?: number, warningAddress?: string, warningTokenId?: string) => void;
  showBanNoticeModal: (reason: string) => void;
  warnUser: (address: string, reason: string, notes: string, tokenId?: string) => void;
  addAdditionalWarning: (address: string, reason: string, notes: string, tokenId?: string) => void;
  clearWarning: (address: string) => void;
  resolveReport: (reportId: string, resolution: string, status: 'resolved' | 'dismissed', adminNotes?: string, actionTaken?: Report['actionTaken']) => void;
  delistToken: (tokenId: string, reason: string, notes: string) => Promise<void>;
  relistToken: (tokenId: string, notes: string) => Promise<void>;
  banUser: (address: string, reason: string, notes: string, permanent: boolean) => Promise<void>;
  unbanUser: (address: string, notes: string) => Promise<void>;
  isUserBanned: (address: string) => boolean;
  getTradesForToken: (tokenId: string) => Trade[];
  getCommentsForToken: (tokenId: string) => Comment[];
  addReport: (type: 'comment' | 'token' | 'trollbox', targetId: string, reportedUser: string, reason: Report['reason'], description: string) => Promise<string>;
  reportToken: (tokenId: string, reason: string, description: string) => Promise<void>;
  reportComment: (commentId: string, tokenId: string, reason: string, description: string) => Promise<void>;
  addNotification: (type: AppNotification["type"], title: string, message: string, link?: string) => void;
  bridgeAssets: (amount: number) => void;
}
const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

// Export StoreContext for use in tests
export { StoreContext };

// --- BADGE DEFINITIONS ---
const AVAILABLE_BADGES: Record<BadgeType, Badge> = {
  dev: { id: 'dev', label: 'Dev', icon: 'Rocket', description: 'Launched a token' },
  whale: { id: 'whale', label: 'Whale', icon: 'Crown', description: 'Holds > 1% of a token supply' },
  sniper: { id: 'sniper', label: 'Sniper', icon: 'Target', description: 'Bought a token early (first 5% of curve)' },
  diamond: { id: 'diamond', label: 'Diamond Hands', icon: 'Diamond', description: 'Held a token for a long time' },
  degen: { id: 'degen', label: 'Degen', icon: 'Zap', description: 'Made 10+ trades' },
  early: { id: 'early', label: 'Early Adopter', icon: 'Award', description: 'Connected wallet early' },
  burner: { id: 'burner', label: 'Pyromaniac', icon: 'Flame', description: 'Burned tokens for the greater good' },
  farmer: { id: 'farmer', label: 'Farmer', icon: 'Sprout', description: 'Staked tokens in a farm' }
};

// Token launch fallback events (used if token launch service fails)
const POSSIBLE_EVENTS = [
  { title: "🚀 BABYDOGE Just Launched!", description: "Early investors are rushing in! Fresh bonding curve, 100% liquidity locked.", type: 'bullish', multiplier: 2.5, source: "Dogepump Launchpad", sourceUrl: "/" },
  { title: "📈 MOONINU Trending #1", description: "Massive volume detected! Whales are accumulating!", type: 'bullish', multiplier: 2.8, source: "Dogepump Launchpad", sourceUrl: "/" },
  { title: "💎 SAFEDOGE Hits 50% Bonding Curve", description: "Halfway to graduation! Liquidity migration imminent!", type: 'bullish', multiplier: 2.3, source: "Dogepump Launchpad", sourceUrl: "/" },
  { title: "🎓 PEPECOIN Graduated to DEX!", description: "Successfully graduated! Liquidity migrated to DEX. Full trading enabled!", type: 'bullish', multiplier: 3.0, source: "Dogepump Launchpad", sourceUrl: "/" },
  { title: "🔥 CHADDOGE On Fire!", description: "Seeing massive momentum! Don't miss out!", type: 'bullish', multiplier: 2.5, source: "Dogepump Launchpad", sourceUrl: "/" },
  { title: "⚡ ROCKETDOGE Launch Alert!", description: "New token just dropped! Be the first to grab your tokens!", type: 'bullish', multiplier: 2.2, source: "Dogepump Launchpad", sourceUrl: "/" },
  { title: "🏆 ELONDOGE Breaks Records", description: "Just set a new record for fastest growth ever!", type: 'bullish', multiplier: 2.6, source: "Dogepump Launchpad", sourceUrl: "/" },
  { title: "✨ DIAMONDDOGE DEX Listing Live!", description: "Graduated successfully! Now trading on DEX with full liquidity!", type: 'bullish', multiplier: 3.0, source: "Dogepump Launchpad", sourceUrl: "/" },
];

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initial state load
  const [tokens, setTokens] = useState<Token[]>(() => {
    const savedVersion = localStorage.getItem('dogepump_version');
    const saved = localStorage.getItem('dogepump_tokens');

    // Force reset if version mismatch or no tokens
    if (savedVersion !== DATA_VERSION || !saved) {
       localStorage.setItem('dogepump_version', DATA_VERSION);
       return generateInitialTokens();
    }

    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Migration: Ensure all tokens have delisted fields
        const migrated = parsed.map((token: any) => ({
          ...token,
          delisted: token.delisted || false,
          delistedAt: token.delistedAt || undefined,
          delistedBy: token.delistedBy || undefined,
          delistedReason: token.delistedReason || undefined
        }));
        // Save migrated tokens back to localStorage
        localStorage.setItem('dogepump_tokens', JSON.stringify(migrated));
        console.log('[MIGRATION] Migrated', migrated.length, 'tokens with delisted fields');
        return migrated;
      }
    } catch (e) {
      console.error("Error loading tokens, using sample data");
    }
    return generateInitialTokens();
  });

  // Reports state - loaded from database via API
  const [reports, setReports] = useState<Report[]>([]);

  // Moderation state - now loaded from database via API
  const [adminActions, setAdminActions] = useState<AdminAction[]>([]);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [warnedUsers, setWarnedUsers] = useState<WarnedUser[]>([]);
  const [moderationDataLoaded, setModerationDataLoaded] = useState(false);

  const generateComprehensiveTrades = (): Trade[] => {
    const trades: Trade[] = [];
    const users = Object.keys(USERNAME_MAP);
    const tokenIds = Array.from({ length: 24 }, (_, i) => `token-${i}`);

    // Generate trades for the last 7 days to ensure good chart data
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    console.log(`🔧 Trade Generation: Starting for ${tokenIds.length} tokens`);

    tokenIds.forEach((tokenId, tokenIndex) => {
      // Generate 400-800 trades per token across 7 days for comprehensive chart data
      const tradeCount = Math.floor(Math.random() * 400) + 400;
      const basePrice = 0.000003 + (Math.random() * 0.00001); // Random base price per token

      console.log(`📊 Generating ${tradeCount} trades for ${tokenId}`);

      for (let i = 0; i < tradeCount; i++) {
        // Create more realistic trading patterns with momentum
        const progress = i / tradeCount;
        const momentum = Math.sin(progress * Math.PI * 2) * 0.3 + (progress - 0.5) * 0.4; // Price trend over time
        const isBuy = Math.random() > 0.4 + momentum; // Dynamic buy/sell ratio based on momentum
        const timeOffset = Math.random() * (7 * 24 * 60 * 60 * 1000); // Random time in last 7 days
        const priceVariation = momentum * 0.000003 + (Math.random() - 0.5) * 0.000001; // Price with trend
        const price = Math.max(0.000001, basePrice + priceVariation);

        // More varied trade amounts for realistic patterns
        const tradeSizeMultiplier = Math.random() > 0.8 ? (Math.random() * 5 + 2) : 1; // 20% of trades are large (2-7x normal)
        const baseAmountDC = Math.floor(Math.random() * 15000) + 1000; // 1000-16000 DC base
        const amountDC = Math.floor(baseAmountDC * tradeSizeMultiplier);
        const amountToken = amountDC / price;

        trades.push({
          id: `trade-${tokenId}-${i}`,
          type: isBuy ? 'buy' : 'sell',
          amountDC,
          amountToken: Math.floor(amountToken),
          price,
          user: users[Math.floor(Math.random() * users.length)],
          timestamp: weekAgo + timeOffset,
          txHash: `0x${Math.random().toString(16).slice(2, 66)}`,
          tokenId,
          blockNumber: 4200000 + Math.floor(Math.random() * 1000),
          gasUsed: isBuy ? 21000 : 23000
        });
      }

      // Add multiple burn events for realism
      const burnCount = Math.floor(Math.random() * 3) + 1; // 1-3 burn events per token
      for (let b = 0; b < burnCount; b++) {
        trades.push({
          id: `burn-${tokenId}-${b}`,
          type: 'burn',
          amountDC: 0,
          amountToken: Math.floor(Math.random() * 100000000) + 10000000, // Larger burn amounts
          price: basePrice,
          user: users[Math.floor(Math.random() * users.length)],
          timestamp: weekAgo + Math.random() * (7 * 24 * 60 * 60 * 1000),
          txHash: `0x${Math.random().toString(16).slice(2, 66)}`,
          tokenId,
          blockNumber: 4200000 + Math.floor(Math.random() * 1000),
          gasUsed: 15000
        });
      }
    });

    // Sort all trades by timestamp
    const sortedTrades = trades.sort((a, b) => a.timestamp - b.timestamp);
    console.log(`Trade Generation Complete: Generated ${sortedTrades.length} total trades`);
    return sortedTrades;
  };

  const [trades, setTrades] = useState<Trade[]>(() => {
    const saved = localStorage.getItem('dogepump_trades');
    return saved ? JSON.parse(saved) : generateComprehensiveTrades();
  });

  const [copyTargets, setCopyTargets] = useState<CopyTarget[]>(() => {
    const saved = localStorage.getItem('dogepump_copy_targets');
    return saved ? JSON.parse(saved) : [
       { address: '0x3a2...1B9f', maxAmountDC: 100, active: true, totalCopiedVolume: 0 },
       { address: '0xElon...Doge', maxAmountDC: 500, active: true, totalCopiedVolume: 2500 }
    ];
  });

  const [comments, setComments] = useState<Comment[]>(() => {
    const saved = localStorage.getItem('dogepump_comments');
    return saved ? JSON.parse(saved) : [];
  });

  const [myHoldings, setMyHoldings] = useState<Holding[]>(() => {
    const saved = localStorage.getItem('dogepump_holdings');
    return saved ? JSON.parse(saved) : [];
  });

  const [lockedAssets, setLockedAssets] = useState<LockedAsset[]>(() => {
    const saved = localStorage.getItem('dogepump_locked');
    return saved ? JSON.parse(saved) : [];
  });

  const [reputationPoints, setReputationPoints] = useState<number>(0);

  const [activeOrders, setActiveOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('dogepump_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>(() => {
    const saved = localStorage.getItem('dogepump_alerts');
    return saved ? JSON.parse(saved) : [];
  });

  const [farmPositions, setFarmPositions] = useState<FarmPosition[]>(() => {
    const saved = localStorage.getItem('dogepump_farms');
    return saved ? JSON.parse(saved) : [];
  });

  // Token Owner Farm State
  const [tokenOwnerFarms, setTokenOwnerFarms] = useState<TokenOwnerFarm[]>(() => {
    const saved = localStorage.getItem('dogepump_token_owner_farms');
    
    // Initialize with dummy farms if empty
    if (!saved || JSON.parse(saved).length === 0) {
      const dummyFarms = createDummyFarms();
      localStorage.setItem('dogepump_token_owner_farms', JSON.stringify(dummyFarms));
      // Also save to farmService storage key so farmService can load them
      localStorage.setItem('dogepump_farms', JSON.stringify(dummyFarms));
      console.log('[StoreContext] Initialized with dummy farms:', dummyFarms.length);
      return dummyFarms;
    }
    
    return saved ? JSON.parse(saved) : [];
  });

  const [tokenOwnerFarmPositions, setTokenOwnerFarmPositions] = useState<TokenOwnerFarmPosition[]>(() => {
     const saved = localStorage.getItem('dogepump_token_owner_farm_positions');
     return saved ? JSON.parse(saved) : [];
   });
  
  // DEX State
  const [dexPools, setDexPools] = useState<any[]>(() => {
    const saved = localStorage.getItem('dogepump_dex_pools');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [dexLpPositions, setDexLpPositions] = useState<any[]>(() => {
    const saved = localStorage.getItem('dogepump_dex_lp_positions');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [dexSettings, setDexSettings] = useState<{ slippage: number; deadline: number; expertMode: boolean }>(() => {
    const saved = localStorage.getItem('dogepump_dex_settings');
    const defaultSettings = { slippage: 0.5, deadline: 20, expertMode: false };
    return saved ? JSON.parse(saved) : defaultSettings;
  });
  
  const [dexTransactionQueue, setDexTransactionQueue] = useState<any[]>(() => {
    const saved = localStorage.getItem('dogepump_dex_transaction_queue');
    return saved ? JSON.parse(saved) : [];
  });

  const [userBalanceDC, setUserBalanceDC] = useState<number>(() => {
     const saved = localStorage.getItem('dogepump_balance');
     return saved ? parseFloat(saved) : 0;
  });

  const [priceHistory, setPriceHistory] = useState<Record<string, PricePoint[]>>(() => {
    const savedVersion = localStorage.getItem('dogepump_version');
    const saved = localStorage.getItem('dogepump_history');
    if (saved && savedVersion === DATA_VERSION) return JSON.parse(saved);
    
    // Initialize sample history
    const history: Record<string, PricePoint[]> = {};
    const generatedTokens = generateInitialTokens(); // Use local gen if needed
    
    generatedTokens.forEach(t => {
       const points: PricePoint[] = [];
       let currentPrice = t.price * 0.5;
       const now = Date.now();
       for (let i = 100; i >= 0; i--) {
          const time = now - (i * 5 * 60 * 1000); 
          const change = (Math.random() - 0.5) * 0.05; 
          currentPrice = currentPrice * (1 + change);
          points.push({ timestamp: time, price: currentPrice, volume: Math.random() * 5000 });
       }
       points[points.length - 1].price = t.price;
       history[t.id] = points;
    });
    return history;
  });

  const [watchlist, setWatchlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('dogepump_watchlist');
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('dogepump_notifications');
    if (!saved) return [];

    const parsed = JSON.parse(saved);
    // Migration: Ensure all notifications have link property
    const migrated = parsed.map((n: any) => ({
      ...n,
      link: n.link || undefined
    }));
    console.log('[StoreContext] Loaded notifications from localStorage:', migrated);
    return migrated;
  });
  
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('dogepump_profile');
    return saved ? JSON.parse(saved) : {
        username: 'Anonymous Doge',
        bio: 'Just another diamond hand.',
        avatarUrl: '',
        badges: [{ ...AVAILABLE_BADGES['early'], unlockedAt: Date.now() }],
        karma: 0
    };
  });

  // Load avatar URL from backend on mount if authenticated
  useEffect(() => {
    const loadBackendProfile = async () => {
      if (backendService.isAuthenticated()) {
        try {
          const backendUser = await backendService.getCurrentUser();
          if (backendUser && backendUser.avatarUrl) {
            setUserProfile(prev => ({
              ...prev,
              avatarUrl: backendUser.avatarUrl || ''
            }));
          }
        } catch (error) {
          console.error('Failed to load profile from backend:', error);
        }
      }
    };

    loadBackendProfile();
  }, []);

  // Initialize Price Oracle
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const initializePriceOracle = async () => {
      try {
        // Initial price fetch
        await priceOracleService.getDCPriceUSD();
        console.log('[PriceOracle] Initialized successfully');

        // Set up periodic updates every 30 seconds
        intervalId = setInterval(async () => {
          try {
            await priceOracleService.refreshPrice();
          } catch (error) {
            console.error('[PriceOracle] Failed to refresh price:', error);
          }
        }, PRICE_UPDATE_INTERVAL);
      } catch (error) {
        console.error('[PriceOracle] Initialization failed:', error);
      }
    };

    initializePriceOracle();

    // Cleanup on unmount
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  // Initialize farm service and set global tokens on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        initializeFarmService();
        
        // Set global tokens reference for farmService
        setGlobalTokens(tokens);
        console.log('[StoreContext] Set global tokens for farmService:', tokens.length);
      } catch (error) {
        console.error('[StoreContext] Failed to initialize farm service:', error);
      }
    }
  }, [tokens]);

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('dogepump_settings');
    const audioMigrationCompleted = localStorage.getItem('dogepump_audio_migration_v1');
    const defaultSettings = {
        slippage: '1',
        fastMode: false,
        audioEnabled: true,
        notificationsEnabled: true
    };

    if (!saved) {
      return defaultSettings;
    }

    const parsed = JSON.parse(saved);

    // One-time migration: Force audioEnabled to true if migration hasn't run yet
    if (!audioMigrationCompleted) {
      const migrated = {
        ...parsed,
        audioEnabled: true
      };
      // Mark migration as complete
      localStorage.setItem('dogepump_audio_migration_v1', 'true');
      return migrated;
    }

    // Migration complete, preserve user's audio choice going forward
    const migrated = {
      ...parsed,
      audioEnabled: parsed.audioEnabled !== undefined ? parsed.audioEnabled : defaultSettings.audioEnabled
    };

    return migrated;
  });

  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    blockHeight: 4206900,
    gasPrice: 2.5,
    tps: 15,
    lastUpdated: Date.now()
  });

  // User address - initialized from demo auth
  const [userAddress, setUserAddress] = useState<string>("0x71C...9A23");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const [marketEvent, setMarketEvent] = useState<MarketEvent | null>(null);
  const [recentlyUnlockedBadge, setRecentlyUnlockedBadge] = useState<Badge | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [banNoticeModal, setBanNoticeModal] = useState<{ isOpen: boolean; reason?: string }>({ isOpen: false });
  const [warningNoticeModal, setWarningNoticeModal] = useState<{ isOpen: boolean; reason?: string; notes?: string; warningCount?: number; maxWarnings?: number; warningAddress?: string; warningTokenId?: string }>({ isOpen: false });
  
  // Emoji reaction state
  const [reactionStats, setReactionStats] = useState<Record<string, ReactionStats>>(() => {
    const saved = localStorage.getItem('dogepump_reaction_stats');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [userReactions, setUserReactions] = useState<Record<string, ChartEmoji | null>>(() => {
    const saved = localStorage.getItem('dogepump_user_reactions');
    return saved ? JSON.parse(saved) : {};
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  // Persistence Effects
  useEffect(() => { localStorage.setItem('dogepump_tokens', JSON.stringify(tokens)); }, [tokens]);
  useEffect(() => { localStorage.setItem('dogepump_trades', JSON.stringify(trades)); }, [trades]);
  useEffect(() => { localStorage.setItem('dogepump_comments', JSON.stringify(comments)); }, [comments]);
  useEffect(() => { localStorage.setItem('dogepump_holdings', JSON.stringify(myHoldings)); }, [myHoldings]);
  useEffect(() => { localStorage.setItem('dogepump_locked', JSON.stringify(lockedAssets)); }, [lockedAssets]);
  useEffect(() => { localStorage.setItem('dogepump_orders', JSON.stringify(activeOrders)); }, [activeOrders]);
  useEffect(() => { localStorage.setItem('dogepump_alerts', JSON.stringify(priceAlerts)); }, [priceAlerts]);
  useEffect(() => { localStorage.setItem('dogepump_farms', JSON.stringify(farmPositions)); }, [farmPositions]);
  useEffect(() => { localStorage.setItem('dogepump_token_owner_farms', JSON.stringify(tokenOwnerFarms)); }, [tokenOwnerFarms]);
  useEffect(() => { localStorage.setItem('dogepump_token_owner_farm_positions', JSON.stringify(tokenOwnerFarmPositions)); }, [tokenOwnerFarmPositions]);
  useEffect(() => { localStorage.setItem('dogepump_copy_targets', JSON.stringify(copyTargets)); }, [copyTargets]);

  // Reports are persisted in database, not localStorage
  // Moderation data is now persisted in database, not localStorage
  useEffect(() => { localStorage.setItem('dogepump_balance', userBalanceDC.toString()); }, [userBalanceDC]);
  useEffect(() => { localStorage.setItem('dogepump_dex_pools', JSON.stringify(dexPools)); }, [dexPools]);
  useEffect(() => { localStorage.setItem('dogepump_dex_lp_positions', JSON.stringify(dexLpPositions)); }, [dexLpPositions]);
  useEffect(() => { localStorage.setItem('dogepump_dex_settings', JSON.stringify(dexSettings)); }, [dexSettings]);
  useEffect(() => { localStorage.setItem('dogepump_dex_transaction_queue', JSON.stringify(dexTransactionQueue)); }, [dexTransactionQueue]);

  // Initialize demo authentication on mount
  useEffect(() => {
    const initAuth = async () => {
      // Check if already authenticated
      const token = getAccessToken();
      if (token) {
        // For demo mode, always re-initialize to ensure we have a valid UUID user
        // Clear old tokens with fake user IDs
        console.log('[STORE] Clearing old demo token and fetching fresh one...');
        const { clearTokens } = await import('../services/authService');
        clearTokens();
      }

      // Initialize demo auth
      console.log('[STORE] Initializing demo authentication...');
      try {
        const success = await initializeDemoAuth();
        if (success) {
          console.log('[STORE] Demo authentication successful');
          setIsAuthenticated(true);
        } else {
          console.warn('[STORE] Demo authentication failed, continuing without auth');
        }
      } catch (error) {
        console.error('[STORE] Error initializing demo auth:', error);
      }
    };

    initAuth();
  }, []);

  // Load moderation data from database via API (runs after auth is complete)
  useEffect(() => {
    const loadModerationData = async () => {
      try {
        // Only load if authenticated
        if (!isAuthenticated) {
          console.log('[STORE] Not authenticated, skipping moderation data load');
          setModerationDataLoaded(true);
          return;
        }

        console.log('[STORE] Loading moderation data from database...');

        // Load warnings, bans, admin actions, and reports in parallel
        const [warningsData, bansData, actionsData, reportsData] = await Promise.allSettled([
          moderationApi.getAllWarnings().catch(() => []),
          moderationApi.getAllBans().catch(() => []),
          moderationApi.getAdminActions().catch(() => []),
          import('../services/reportsApi').then(m => m.getAllReports()).catch(() => [])
        ]);

        // Update state with results
        if (warningsData.status === 'fulfilled' && Array.isArray(warningsData.value)) {
          const formattedWarnings = warningsData.value.map((w: any) => ({
            id: w.id,
            address: w.wallet_address,
            tokenId: w.token_id,
            warnedAt: new Date(w.created_at).getTime(),
            warnedBy: w.warned_by || 'Admin',
            reason: w.warning_reason,
            notes: w.admin_notes || '',
            isActive: w.is_active,
            expiresAt: w.expires_at ? new Date(w.expires_at).getTime() : undefined,
            acknowledgedAt: w.acknowledged_at ? new Date(w.acknowledged_at).getTime() : undefined
          }));
          setWarnedUsers(formattedWarnings);
          console.log('[STORE] Loaded', formattedWarnings.length, 'warnings from database');
        } else {
          console.log('[STORE] Warnings data not fulfilled or no warnings array');
        }

        if (bansData.status === 'fulfilled' && Array.isArray(bansData.value)) {
          const formattedBans = bansData.value.map((b: any) => ({
            id: b.id,
            address: b.wallet_address,
            bannedAt: new Date(b.banned_at).getTime(),
            bannedBy: b.banned_by || 'Admin',
            reason: b.ban_reason,
            notes: b.admin_notes || '',
            permanent: b.is_automatic, // Using is_automatic as permanent flag
            expiresAt: b.unbanned_at ? new Date(b.unbanned_at).getTime() : undefined
          }));
          setBannedUsers(formattedBans);
          console.log('[STORE] Loaded', formattedBans.length, 'bans from database');
        }

        if (actionsData.status === 'fulfilled' && Array.isArray(actionsData.value)) {
          const formattedActions = actionsData.value.map((a: any) => ({
            id: a.id,
            type: a.action_type,
            targetType: a.target_type,
            targetId: a.target_id,
            adminAddress: a.admin_id || 'Admin',
            reason: a.reason,
            notes: a.notes || '',
            timestamp: new Date(a.created_at).getTime()
          }));
          setAdminActions(formattedActions);
          console.log('[STORE] Loaded', formattedActions.length, 'admin actions from database');
        }

        if (reportsData.status === 'fulfilled' && Array.isArray(reportsData.value)) {
          const formattedReports = reportsData.value.map((r: any) => ({
            id: r.id,
            type: r.type,
            commentId: r.comment_id,
            tokenId: r.token_id,
            reporter: r.reporter_username || 'Unknown',
            reportedUser: r.reported_username || 'Unknown',
            reason: r.reason,
            description: r.description,
            timestamp: new Date(r.created_at).getTime(),
            status: r.status,
            reviewedBy: r.reviewer_username,
            reviewedAt: r.reviewed_at ? new Date(r.reviewed_at).getTime() : undefined,
            resolution: r.resolution,
            adminNotes: r.admin_notes,
            actionTaken: r.action_taken
          }));
          setReports(formattedReports);
          console.log('[STORE] Loaded', formattedReports.length, 'reports from database');
        }

        setModerationDataLoaded(true);
        console.log('[STORE] ✅ Moderation data loaded successfully');
      } catch (error) {
        console.error('[STORE] Error loading moderation data:', error);
        setModerationDataLoaded(true); // Still mark as loaded to prevent infinite loop
      }
    };

    loadModerationData();
  }, [isAuthenticated]); // Run when auth status changes
  useEffect(() => { localStorage.setItem('dogepump_history', JSON.stringify(priceHistory)); }, [priceHistory]);
  useEffect(() => { localStorage.setItem('dogepump_watchlist', JSON.stringify(watchlist)); }, [watchlist]);
  useEffect(() => { localStorage.setItem('dogepump_notifications', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('dogepump_profile', JSON.stringify(userProfile)); }, [userProfile]);
  useEffect(() => { localStorage.setItem('dogepump_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('dogepump_reaction_stats', JSON.stringify(reactionStats)); }, [reactionStats]);
  useEffect(() => { localStorage.setItem('dogepump_user_reactions', JSON.stringify(userReactions)); }, [userReactions]);

  const addNotification = (
    typeOrConfig: AppNotification['type'] | { type: AppNotification['type']; title: string; message: string; link?: string; duration?: number },
    title?: string,
    message?: string,
    link?: string
  ) => {
    if (!settings.notificationsEnabled) return;

    // Support both old format addNotification('success', 'title', 'message', 'link')
    // and new format addNotification({ type: 'success', title: 'title', message: 'message', link: 'link', duration: 5000 })
    let type: AppNotification['type'];
    let notificationTitle: string;
    let notificationMessage: string;
    let notificationLink: string | undefined;

    if (typeof typeOrConfig === 'object') {
      type = typeOrConfig.type;
      notificationTitle = typeOrConfig.title;
      notificationMessage = typeOrConfig.message;
      notificationLink = typeOrConfig.link;
      // Duration is ignored for persistence, notifications persist until cleared
    } else {
      type = typeOrConfig;
      notificationTitle = title || '';
      notificationMessage = message || '';
      notificationLink = link;
    }

    const newNotification = {
      id: Date.now().toString() + Math.random().toString(),
      type,
      title: notificationTitle,
      message: notificationMessage,
      timestamp: Date.now(),
      read: false,
      link: notificationLink
    };

    console.log('[StoreContext] Creating notification:', newNotification);
    console.log('[StoreContext] Notification link:', notificationLink);

    setNotifications(prev => [newNotification, ...prev].slice(0, 50));
    if (settings.audioEnabled && type !== 'badge') playSound(type === 'alert' ? 'launch' : type === 'farm' ? 'success' : 'hover');
  };

  const unlockBadge = (type: BadgeType) => {
    const newBadge = { ...AVAILABLE_BADGES[type], unlockedAt: Date.now() };

    // Clear prev first to ensure animation replays
    setRecentlyUnlockedBadge(null);
    setTimeout(() => {
        setRecentlyUnlockedBadge(newBadge);
    }, 50);

    setUserProfile(prev => {
      // Check for duplicates using the latest state to prevent race conditions
      if (prev.badges.some(b => b.id === type)) return prev;

      return {
        ...prev,
        badges: [...prev.badges, newBadge]
      };
    });
  };

  const clearAchievement = () => {
      setRecentlyUnlockedBadge(null);
  };
  
  const markAllNotificationsRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const clearNotifications = () => setNotifications([]);
  const openLightbox = (src: string) => { setLightboxImage(src); if (settings.audioEnabled) playSound('click'); };
  const closeLightbox = () => setLightboxImage(null);

  const resolveUsername = (address: string): string => {
    if (!address) return 'Unknown';
    if (address === 'You' || address === userAddress) {
       return userProfile.username !== 'Anonymous Doge' ? userProfile.username : 'You';
    }
    const mapped = USERNAME_MAP[address];
    if (mapped) return mapped;
    return generatePseudonym(address); 
  };

  const updatePriceHistory = (tokenId: string, newPrice: number, vol: number) => {
    setPriceHistory(prev => {
      const history = prev[tokenId] || [];
      const newPoint = { timestamp: Date.now(), price: newPrice, volume: vol };
      const updated = [...history, newPoint].slice(-300);
      return { ...prev, [tokenId]: updated };
    });
  };
  
  const updateProfile = async (profile: Partial<UserProfile>) => {
    // Update local state immediately for responsiveness
    setUserProfile(prev => ({ ...prev, ...profile }));
    
    // If avatar URL changed and user is authenticated, sync with backend
    if (profile.avatarUrl && backendService.isAuthenticated()) {
      try {
        await backendService.updateProfile({ avatarUrl: profile.avatarUrl });
      } catch (error) {
        console.error('Failed to sync avatar URL with backend:', error);
        // Don't revert local state - keep the uploaded avatar visible
      }
    }
  };
  const updateSettings = (newSettings: Partial<AppSettings>) => setSettings(prev => ({ ...prev, ...newSettings }));

  useEffect(() => {
     const myTrades = trades.filter(t => t.user === 'You');
     if (myTrades.length >= 10) unlockBadge('degen');
  }, [trades.length]);

  // Fetch initial token launch on mount
  useEffect(() => {
    const fetchInitialLaunch = async () => {
      try {
        // Pass tokens to service so it can pick real ones
        const latestLaunch = await getLatestTokenLaunch(tokens);
        if (latestLaunch) {
          setMarketEvent({
            id: Date.now().toString(),
            ...latestLaunch,
            active: true,
            expiresAt: Date.now() + (60 * 1000) // Show for 60 seconds initially
          });
        }
      } catch (error) {
        console.error('Failed to fetch initial launch:', error);
      }
    };

    fetchInitialLaunch();
  }, []); // Run once on mount

  // Background Simulator
  useEffect(() => {
    const interval = setInterval(async () => {
      setNetworkStats(prev => ({
         blockHeight: prev.blockHeight + 1,
         gasPrice: Math.max(1.5, Math.min(10, prev.gasPrice + (Math.random() - 0.5) * 0.5)),
         tps: Math.floor(Math.random() * 15) + 15,
         lastUpdated: Date.now()
      }));

      // Token Launch Event Logic - Fetch token launch events
      // Reduced frequency: 2% probability every 3 seconds = ~2.5 minutes between fetches
      if (!marketEvent && Math.random() > 0.98) {
         try {
           // Pass current tokens to service for real token selection
           const latestLaunch = await getLatestTokenLaunch(tokens);
           if (latestLaunch) {
             setMarketEvent({
               id: Date.now().toString(),
               ...latestLaunch,
               active: true,
               expiresAt: Date.now() + (45 * 1000) // Show for 45 seconds
             });
             playSound('launch');
           }
         } catch (error) {
           // Fallback to mock events if token launch service fails
           const event = POSSIBLE_EVENTS[Math.floor(Math.random() * POSSIBLE_EVENTS.length)];
           setMarketEvent({
             id: Date.now().toString(),
             ...event,
             type: event.type as any,
             active: true,
             expiresAt: Date.now() + (30 * 1000)
           });
           playSound('launch');
         }
      } else if (marketEvent && Date.now() > marketEvent.expiresAt) {
         setMarketEvent(null);
      }

      setTokens(currentTokens => {
          if (currentTokens.length === 0) return currentTokens;
          
          return currentTokens.map(t => {
              if (Math.random() > 0.7) { // Only update some tokens
                  let buyBias = 0.45;
                  let volatilityMult = 1;

                  if (marketEvent && marketEvent.active) {
                     volatilityMult = marketEvent.multiplier;
                     if (marketEvent.type === 'bullish') buyBias = 0.7;
                     if (marketEvent.type === 'bearish') buyBias = 0.2;
                  }

                  const isBuy = Math.random() > (1 - buyBias);
                  const amountDC = (Math.random() * 200 + 10) * volatilityMult;
                  
                  let newPrice = t.price;
                  let newMC = t.marketCap;
                  let newProgress = t.progress;
                  
                  if (t.progress >= 100) {
                    const volatility = 0.02 * volatilityMult;
                    const movement = isBuy ? (1 + Math.random() * volatility) : (1 - Math.random() * volatility);
                    newPrice = t.price * movement;
                    newMC = t.marketCap * movement;
                    newProgress = 100;
                  } else {
                    if (isBuy) {
                        const priceIncrease = t.price * (amountDC / 50000); 
                        newPrice = t.price + priceIncrease;
                        newMC = t.marketCap + amountDC;
                        newProgress = Math.min(100, (newMC / GRADUATION_MARKETCAP_USD) * 100);
                    } else {
                        const priceDecrease = t.price * (amountDC / 50000);
                        newPrice = Math.max(0.0000001, t.price - priceDecrease);
                        newMC = Math.max(500, t.marketCap - amountDC);
                        newProgress = Math.min(100, (newMC / GRADUATION_MARKETCAP_USD) * 100);
                    }
                  }
                  
                  // Update History
                  setPriceHistory(ph => {
                        const history = ph[t.id] || [];
                        const newPoint = { timestamp: Date.now(), price: newPrice, volume: amountDC * (Math.random() * 2) };
                        return { ...ph, [t.id]: [...history, newPoint].slice(-300) };
                  });

                  return { 
                      ...t, 
                      price: newPrice, 
                      marketCap: newMC, 
                      volume: t.volume + amountDC, 
                      progress: newProgress, 
                      virtualLiquidity: isBuy ? t.virtualLiquidity + amountDC : Math.max(0, t.virtualLiquidity - amountDC),
                      streamViewers: t.isLive ? Math.max(0, (t.streamViewers || 0) + Math.floor(Math.random() * 10) - 4) : 0
                  };
              }
              return t;
          });
      });

      // Generate Live Trades
      if (Math.random() > 0.6) { // 40% chance every 3 seconds
        setTrades(currentTrades => {
          const tokenIds = Array.from({ length: 24 }, (_, i) => `token-${i}`);
          const randomTokenId = tokenIds[Math.floor(Math.random() * tokenIds.length)];
          const token = tokens.find(t => t.id === randomTokenId);

          if (!token) return currentTrades;

          const isBuy = Math.random() > 0.4; // 60% buys, 40% sells
          const amountDC = Math.floor(Math.random() * 5000) + 100; // 100-5100 DC
          const priceVariation = (Math.random() - 0.5) * token.price * 0.1; // 10% price variation
          const price = Math.max(0.000001, token.price + priceVariation);
          const amountToken = Math.floor(amountDC / price);
          const users = Object.keys(USERNAME_MAP);
          const randomUser = users[Math.floor(Math.random() * users.length)];

          const newTrade: Trade = {
            id: `live-${Date.now()}-${Math.random()}`,
            type: isBuy ? 'buy' : 'sell',
            amountDC,
            amountToken,
            price,
            user: randomUser,
            timestamp: Date.now(),
            txHash: `0x${Math.random().toString(16).slice(2, 66)}`,
            tokenId: randomTokenId,
            blockNumber: 4200000 + Math.floor(Math.random() * 1000),
            gasUsed: isBuy ? 21000 : 23000
          };

          // Keep only last 500 trades to prevent memory issues
          const updatedTrades = [...currentTrades, newTrade].sort((a, b) => a.timestamp - b.timestamp).slice(-500);

          // Auto-clear old trades (older than 4 hours)
          const fourHoursAgo = Date.now() - (4 * 60 * 60 * 1000);
          const filteredTrades = updatedTrades.filter(t => t.timestamp > fourHoursAgo);

          return filteredTrades;
        });
      }

    }, 3000);

    return () => clearInterval(interval);
  }, [marketEvent, tokens]);

  // Context Functions...
  // (Keep existing implementations for buy/sell/launch/etc.)
  const placeOrder = (tokenId: string, type: 'buy' | 'sell', mode: 'limit' | 'stop', amount: number, price: number) => {
    // ... existing implementation
    const token = tokens.find(t => t.id === tokenId);
    if (!token) return;
    if (type === 'buy') {
       if (userBalanceDC < amount) { addNotification('error', 'Order Failed', 'Insufficient DC balance.'); return; }
       setUserBalanceDC(prev => prev - amount);
    } else {
       const holding = myHoldings.find(h => h.tokenId === tokenId);
       if (!holding || holding.balance < amount) { addNotification('error', 'Order Failed', 'Insufficient token balance.'); return; }
       setMyHoldings(prev => prev.map(h => h.tokenId === tokenId ? { ...h, balance: h.balance - amount } : h));
    }
    const newOrder: Order = { id: Date.now().toString(), tokenId, type, mode, amount, price, ticker: token.ticker, timestamp: Date.now() };
    setActiveOrders(prev => [...prev, newOrder]);
    addNotification('info', 'Order Placed', `${mode.toUpperCase()} ${type.toUpperCase()} placed for ${token.ticker}`, `/token/${tokenId}`);
    if (settings.audioEnabled) playSound('click');
  };

  const cancelOrder = (orderId: string) => {
    // ... existing implementation
    const order = activeOrders.find(o => o.id === orderId);
    if (!order) return;
    if (order.type === 'buy') setUserBalanceDC(prev => prev + order.amount);
    else setMyHoldings(prev => {
          const exists = prev.find(h => h.tokenId === order.tokenId);
          if (exists) return prev.map(h => h.tokenId === order.tokenId ? { ...h, balance: h.balance + order.amount } : h);
          return [...prev, { tokenId: order.tokenId, balance: order.amount }];
    });
    setActiveOrders(prev => prev.filter(o => o.id !== orderId));
    addNotification('info', 'Order Cancelled', `Order for ${order.ticker} cancelled.`, `/token/${order.tokenId}`);
    if (settings.audioEnabled) playSound('click');
  };

  const addPriceAlert = (tokenId: string, price: number) => {
     // ... existing implementation
     const token = tokens.find(t => t.id === tokenId);
     if (!token) return;
     const condition = price > token.price ? 'above' : 'below';
     setPriceAlerts(prev => [...prev, { id: Date.now().toString(), tokenId, price, condition, active: true, createdAt: Date.now() }]);
     addNotification('info', 'Alert Set', `Notifying when ${token.ticker} goes ${condition} $${price.toFixed(6)}`, `/token/${tokenId}`);
     if (settings.audioEnabled) playSound('click');
  };

  const removePriceAlert = (alertId: string) => setPriceAlerts(prev => prev.filter(a => a.id !== alertId));

  const launchToken = (name: string, ticker: string, description: string, image: string, persona: string, socials?: any, initialBuyAmount?: number) => {
    // Check if user is banned (check both address and username "You")
    const currentUser = userProfile.username || 'You';
    if (isUserBanned(userAddress) || isUserBanned(currentUser)) {
      addNotification('error', 'Access Denied', 'You are banned from launching tokens.');
      return '';
    }

    // Validate creator initial buy doesn't exceed 5% of total supply
    if (initialBuyAmount && initialBuyAmount > 0) {
      const maxTokensAllowed = TOTAL_SUPPLY * MAX_CREATOR_BUY_PERCENTAGE; // 5% of supply
      const estimatedTokens = initialBuyAmount / INITIAL_TOKEN_PRICE;

      if (estimatedTokens > maxTokensAllowed) {
        const maxBuyAmountDC = maxTokensAllowed * INITIAL_TOKEN_PRICE;
        addNotification('error', 'Initial Buy Exceeded Limit',
          `Creators cannot buy more than ${MAX_CREATOR_BUY_PERCENTAGE * 100}% of total supply during launch. Maximum initial buy: ${maxBuyAmountDC.toFixed(0)} DC (~${(maxTokensAllowed / 1000000).toFixed(0)}M tokens)`);
        return '';
      }
    }

    const newToken: Token = {
      id: Date.now().toString(),
      name, ticker, description, imageUrl: image || 'https://picsum.photos/200', creator: 'You', marketCap: 500, virtualLiquidity: 1000, volume: 0, price: 0.000005, progress: 1, createdAt: Date.now(), supply: 1000000000, boosts: 0, aiPersona: persona, ...socials, securityState: { mintRevoked: false, freezeRevoked: false, lpBurned: false }, sentiment: { bullish: 1, bearish: 0 }
    };
    setUserBalanceDC(prev => prev - 20);
    setTokens(prev => [newToken, ...prev]);
    updatePriceHistory(newToken.id, newToken.price, 0);
    addNotification('rocket', 'Token Launched', `You launched ${name}!`, `/token/${newToken.id}`);
    unlockBadge('dev');
    if (initialBuyAmount && initialBuyAmount > 0) {
       setTimeout(() => { buyToken(newToken.id, initialBuyAmount); unlockBadge('sniper'); }, 100);
    }
    return newToken.id;
  };

  const buyToken = async (tokenId: string, amountDC: number, options: { isLimitOrder?: boolean, isCopyTrade?: boolean } = {}) => {
    if (!options.isLimitOrder && !options.isCopyTrade && userBalanceDC < amountDC) return;

    // Check if user is banned from trading (check both address and username "You")
    const currentUser = userProfile.username || 'You';
    if (isUserBanned(userAddress) || isUserBanned(currentUser)) {
      addNotification('error', 'Access Denied', 'You are banned from trading.');
      return;
    }

    try {
      // Get current DC price in USD
      const dcPriceUSD = await priceOracleService.getDCPriceUSD();

      setTokens(prev => {
        const idx = prev.findIndex(t => t.id === tokenId);
        if (idx === -1) return prev;
        const t = prev[idx];

        let newPrice = t.price, newMC = t.marketCap, newProgress = t.progress;
        if (t.progress >= 100) {
            const impact = amountDC / Math.max(t.virtualLiquidity, 10000);
            newPrice = t.price * (1 + impact);
            newMC = t.marketCap * (1 + impact);
        } else {
            const inc = t.price * (amountDC / 50000);
            newPrice = t.price + inc;
            newMC = t.marketCap + amountDC;
            // CORRECTED: Calculate USD market cap and progress
            const marketCapUSD = newMC * dcPriceUSD;
            newProgress = Math.min(100, (marketCapUSD / GRADUATION_MARKETCAP_USD) * 100);
        }

        const amountToken = amountDC / t.price;
        if (amountToken > 10000000) unlockBadge('whale');

        const trade: Trade = { id: Date.now().toString() + Math.random(), type: 'buy', amountDC, amountToken, price: t.price, user: 'You', timestamp: Date.now(), txHash: '0x'+Math.random().toString(16).slice(2), tokenId, blockNumber: networkStats.blockHeight, gasUsed: 21000 };

        setTimeout(() => {
            setTrades(pt => [trade, ...pt].slice(0, 500));
            updatePriceHistory(tokenId, newPrice, amountDC);
            setMyHoldings(ph => {
               const ex = ph.find(h => h.tokenId === tokenId);
               return ex ? ph.map(h => h.tokenId === tokenId ? { ...h, balance: h.balance + amountToken } : h) : [...ph, { tokenId, balance: amountToken }];
            });
        }, 0);

        const newTokens = [...prev];
        newTokens[idx] = { ...t, price: newPrice, marketCap: newMC, volume: t.volume + amountDC, progress: newProgress, virtualLiquidity: t.virtualLiquidity + amountDC };
        return newTokens;
      });
      if (!options.isLimitOrder) setUserBalanceDC(prev => prev - amountDC);
    } catch (error) {
      console.error('[StoreContext] buyToken error:', error);
      addNotification('error', 'Trade Failed', 'Failed to execute buy. Please try again.');
    }
  };

  const sellToken = async (tokenId: string, amountToken: number, options: { isLimitOrder?: boolean, isCopyTrade?: boolean } = {}) => {
    // Check if user is banned from trading (check both address and username "You")
    const currentUser = userProfile.username || 'You';
    if (isUserBanned(userAddress) || isUserBanned(currentUser)) {
      addNotification('error', 'Access Denied', 'You are banned from trading.');
      return;
    }

    try {
      // Get current DC price in USD
      const dcPriceUSD = await priceOracleService.getDCPriceUSD();

      setTokens(prev => {
        const idx = prev.findIndex(t => t.id === tokenId);
        if (idx === -1) return prev;
        const t = prev[idx];
        let receiveDC = 0, newPrice = t.price, newMC = t.marketCap, newProgress = t.progress;
        if (t.progress >= 100) {
              receiveDC = amountToken * t.price;
              const impact = receiveDC / Math.max(t.virtualLiquidity, 10000);
              newPrice = t.price * (1 - impact);
              newMC = t.marketCap * (1 - impact);
        } else {
              receiveDC = amountToken * t.price * 0.99;
              const dec = t.price * (receiveDC / 50000);
              newPrice = Math.max(0.0000001, t.price - dec);
              newMC = Math.max(500, t.marketCap - receiveDC);
              // CORRECTED: Calculate USD market cap and progress
              const marketCapUSD = newMC * dcPriceUSD;
              newProgress = Math.min(100, (marketCapUSD / GRADUATION_MARKETCAP_USD) * 100);
        }
        const trade: Trade = { id: Date.now().toString() + Math.random(), type: 'sell', amountDC: receiveDC, amountToken, price: t.price, user: 'You', timestamp: Date.now(), txHash: '0x'+Math.random().toString(16).slice(2), tokenId, blockNumber: networkStats.blockHeight, gasUsed: 21000 };
        setTimeout(() => {
           setTrades(pt => [trade, ...pt].slice(0, 500));
           updatePriceHistory(tokenId, newPrice, receiveDC);
           setUserBalanceDC(b => b + receiveDC);
           if (!options.isLimitOrder) {
              setMyHoldings(ph => {
                  const ex = ph.find(h => h.tokenId === tokenId);
                  return ex ? ph.map(h => h.tokenId === tokenId ? { ...h, balance: Math.max(0, h.balance - amountToken) } : h) : ph;
               });
           }
        }, 0);
        const newTokens = [...prev];
        newTokens[idx] = { ...t, price: newPrice, marketCap: newMC, volume: t.volume + receiveDC, progress: newProgress, virtualLiquidity: Math.max(0, t.virtualLiquidity - receiveDC) };
        return newTokens;
      });
    } catch (error) {
      console.error('[StoreContext] sellToken error:', error);
      addNotification('error', 'Trade Failed', 'Failed to execute sell. Please try again.');
    }
  };

  const burnToken = (tokenId: string, amountToken: number) => {
    // ... existing implementation
    setTokens(prev => {
        const idx = prev.findIndex(t => t.id === tokenId);
        if (idx === -1) return prev;
        const t = prev[idx];
        const trade: Trade = { id: Date.now().toString() + Math.random(), type: 'burn', amountDC: 0, amountToken, price: t.price, user: 'You', timestamp: Date.now(), txHash: '0xdead', tokenId, blockNumber: networkStats.blockHeight, gasUsed: 15000 };
        setTimeout(() => {
           setTrades(pt => [trade, ...pt].slice(0, 500));
           setMyHoldings(ph => {
              const ex = ph.find(h => h.tokenId === tokenId);
              return ex ? ph.map(h => h.tokenId === tokenId ? { ...h, balance: Math.max(0, h.balance - amountToken) } : h) : ph;
           });
           if (amountToken > 100000) unlockBadge('burner');
        }, 0);
        const newTokens = [...prev];
        newTokens[idx] = { ...t, supply: Math.max(0, t.supply - amountToken), lastBurnedAt: Date.now() };
        return newTokens;
      });
  };

  const lockForReputation = async (tokenId: string, amountToken: number) => {
     const token = tokens.find(t => t.id === tokenId);
     if (!token) return;

     // Calculate reputation points: 1 point per $1 USD of locked token value
     const pointsEarned = Math.floor(amountToken * token.price);

     // Update local state
     setMyHoldings(prev => prev.map(h => h.tokenId === tokenId ? { ...h, balance: Math.max(0, h.balance - amountToken) } : h));
     setLockedAssets(prev => [...prev, { id: Date.now().toString(), tokenId, amount: amountToken, lockedAt: Date.now() }]);

     // Update reputation points
     setReputationPoints(prev => prev + pointsEarned);

     if (settings.audioEnabled) playSound('success');
     addNotification('reputation', 'Assets Locked', `Earning ${pointsEarned} Reputation points for upcoming airdrops!`);

     // Call backend API to award points
     try {
       const response = await fetch('/api/reputation/award', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${localStorage.getItem('token')}`,
         },
         body: JSON.stringify({
           points: pointsEarned,
           reason: 'token_lock',
           token_id: tokenId,
           token_amount: amountToken,
         }),
       });

       if (!response.ok) {
         console.error('Failed to award reputation points:', await response.text());
       }
     } catch (error) {
       console.error('Error awarding reputation points:', error);
     }
  };

  const unlockForReputation = async (lockedAssetId: string) => {
     const lockedAsset = lockedAssets.find(la => la.id === lockedAssetId);
     if (!lockedAsset) return;

     const token = tokens.find(t => t.id === lockedAsset.tokenId);
     if (!token) return;

     // Calculate points to deduct
     const pointsToDeduct = Math.floor(lockedAsset.amount * token.price);

     // Check if user has enough points
     if (reputationPoints < pointsToDeduct) {
       addNotification('error', 'Insufficient Points', `Cannot unlock: need ${pointsToDeduct} reputation points.`);
       return;
     }

     // Update local state
     setMyHoldings(prev => prev.map(h => h.tokenId === lockedAsset.tokenId ? { ...h, balance: h.balance + lockedAsset.amount } : h));
     setLockedAssets(prev => prev.filter(la => la.id !== lockedAssetId));

     // Update reputation points
     setReputationPoints(prev => prev - pointsToDeduct);

     if (settings.audioEnabled) playSound('success');
     addNotification('reputation', 'Assets Unlocked', `${pointsToDeduct} reputation points deducted. Tokens returned to wallet.`);

     // Call backend API to deduct points
     try {
       const response = await fetch('/api/reputation/deduct', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${localStorage.getItem('token')}`,
         },
         body: JSON.stringify({
           points: pointsToDeduct,
           reason: 'token_unlock',
           token_id: lockedAsset.tokenId,
           token_amount: lockedAsset.amount,
         }),
       });

       if (!response.ok) {
         console.error('Failed to deduct reputation points:', await response.text());
       }
     } catch (error) {
       console.error('Error deducting reputation points:', error);
     }
  };

  const boostToken = (tokenId: string, amountDC: number) => {
     // ... existing implementation
     setTokens(prev => prev.map(t => t.id === tokenId ? { ...t, boosts: (t.boosts || 0) + 1, lastBoostedAt: Date.now() } : t));
     setUserBalanceDC(prev => prev - amountDC);
     if (settings.audioEnabled) playSound('launch');
  };

  const airdropToken = async (tokenId: string, type: 'random' | 'holders', amountPerUser: number, count: number) => {
     const token = tokens.find(t => t.id === tokenId);
     if (!token) return;

     const totalAmount = amountPerUser * count;

     setMyHoldings(prev => {
        const exists = prev.find(h => h.tokenId === tokenId);
        if (exists && exists.balance >= totalAmount) return prev.map(h => h.tokenId === tokenId ? { ...h, balance: h.balance - totalAmount } : h);
        return prev;
     });

     const newTrades: Trade[] = [];

     if (type === 'random') {
       // Random airdrop to users
       for(let i = 0; i < count; i++) {
         newTrades.push({
           id: Date.now().toString()+i,
           type: 'buy',
           amountDC: 0,
           amountToken: amountPerUser,
           price: token.price,
           user: `0x${Math.random().toString(16).slice(2,8)}`,
           timestamp: Date.now() - i,
           txHash: '0x'+Math.random().toString(16),
           tokenId: token.id,
           blockNumber: networkStats.blockHeight,
           gasUsed: 21000
         });
       }
     } else if (type === 'holders') {
       // Weighted airdrop to reputation point holders
       try {
         const response = await fetch('/api/reputation/leaderboard?limit=100');
         if (response.ok) {
           const data = await response.json();
           const topHolders = data.leaderboard || [];

           if (topHolders.length === 0) {
             addNotification('error', 'No Holders', 'No users with reputation points found. Airdropping randomly instead.');
             // Fallback to random
             for(let i = 0; i < count; i++) {
               newTrades.push({
                 id: Date.now().toString()+i,
                 type: 'buy',
                 amountDC: 0,
                 amountToken: amountPerUser,
                 price: token.price,
                 user: `0x${Math.random().toString(16).slice(2,8)}`,
                 timestamp: Date.now() - i,
                 txHash: '0x'+Math.random().toString(16),
                 tokenId: token.id,
                 blockNumber: networkStats.blockHeight,
                 gasUsed: 21000
               });
             }
           } else {
             // Calculate total reputation points
             const totalReputation = topHolders.reduce((sum: number, user: any) => sum + user.reputation_points, 0);

             // Distribute based on reputation share
             let distributedCount = 0;
             for (const holder of topHolders) {
               if (distributedCount >= count) break;

               const userShare = holder.reputation_points / totalReputation;
               const userCount = Math.max(1, Math.floor(count * userShare));

               for (let i = 0; i < Math.min(userCount, count - distributedCount); i++) {
                 newTrades.push({
                   id: Date.now().toString()+Date.now()+i,
                   type: 'buy',
                   amountDC: 0,
                   amountToken: amountPerUser,
                   price: token.price,
                   user: holder.username || `0x${Math.random().toString(16).slice(2,8)}`,
                   timestamp: Date.now() - i,
                   txHash: '0x'+Math.random().toString(16),
                   tokenId: token.id,
                   blockNumber: networkStats.blockHeight,
                   gasUsed: 21000
                 });
               }
               distributedCount += userCount;
             }
           }
         } else {
           console.error('Failed to fetch reputation leaderboard');
           // Fallback to random
           for(let i = 0; i < count; i++) {
             newTrades.push({
               id: Date.now().toString()+i,
               type: 'buy',
               amountDC: 0,
               amountToken: amountPerUser,
               price: token.price,
               user: `0x${Math.random().toString(16).slice(2,8)}`,
               timestamp: Date.now() - i,
               txHash: '0x'+Math.random().toString(16),
               tokenId: token.id,
               blockNumber: networkStats.blockHeight,
               gasUsed: 21000
             });
           }
         }
       } catch (error) {
         console.error('Error executing reputation-weighted airdrop:', error);
         // Fallback to random
         for(let i = 0; i < count; i++) {
           newTrades.push({
             id: Date.now().toString()+i,
             type: 'buy',
             amountDC: 0,
             amountToken: amountPerUser,
             price: token.price,
             user: `0x${Math.random().toString(16).slice(2,8)}`,
             timestamp: Date.now() - i,
             txHash: '0x'+Math.random().toString(16),
             tokenId: token.id,
             blockNumber: networkStats.blockHeight,
             gasUsed: 21000
           });
         }
       }
     }

     setTrades(prev => [...newTrades, ...prev].slice(0, 500));
  };

  const stakeToken = (tokenId: string, amount: number) => {
     // ... existing implementation
     const holding = myHoldings.find(h => h.tokenId === tokenId);
     if (!holding || holding.balance < amount) return;
     setMyHoldings(prev => prev.map(h => h.tokenId === tokenId ? { ...h, balance: h.balance - amount } : h));
     setFarmPositions(prev => {
        const existing = prev.find(f => f.tokenId === tokenId);
        if (existing) return prev.map(f => f.tokenId === tokenId ? { ...f, stakedAmount: f.stakedAmount + amount } : f);
        const mockAPY = Math.floor(Math.random() * 5000) + 100;
        return [...prev, { tokenId, stakedAmount: amount, lastHarvestTime: Date.now(), accumulatedRewards: 0, apy: mockAPY }];
     });
     unlockBadge('farmer');
     addNotification('farm', 'Staked Successfully', `Staked ${amount} tokens. Rewards started.`, `/token/${tokenId}`);
  };

  const unstakeToken = (tokenId: string, amount: number) => {
     // ... existing implementation
     const farm = farmPositions.find(f => f.tokenId === tokenId);
     if (!farm || farm.stakedAmount < amount) return;
     harvestRewards(tokenId);
     setFarmPositions(prev => {
        const existing = prev.find(f => f.tokenId === tokenId);
        if (existing) {
           const newAmount = existing.stakedAmount - amount;
           if (newAmount <= 0) return prev.filter(f => f.tokenId !== tokenId);
           return prev.map(f => f.tokenId === tokenId ? { ...f, stakedAmount: newAmount } : f);
        }
        return prev;
     });
     setMyHoldings(prev => {
        const existing = prev.find(h => h.tokenId === tokenId);
        if (existing) return prev.map(h => h.tokenId === tokenId ? { ...h, balance: h.balance + amount } : h);
        return [...prev, { tokenId, balance: amount }];
     });
     addNotification('info', 'Unstaked', `Returned ${amount} tokens to wallet.`, `/token/${tokenId}`);
  };

  const harvestRewards = (tokenId: string) => {
     // ... existing implementation
     setFarmPositions(prev => {
        const existing = prev.find(f => f.tokenId === tokenId);
        if (!existing || existing.accumulatedRewards <= 0) return prev;
        const reward = existing.accumulatedRewards;
        setUserBalanceDC(b => b + reward);
        addNotification('success', 'Harvested!', `Claimed ${reward.toFixed(2)} $DC rewards.`, `/token/${tokenId}`);
        if (settings.audioEnabled) playSound('success');
        return prev.map(f => f.tokenId === tokenId ? { ...f, accumulatedRewards: 0 } : f);
     });
  };

  const voteSentiment = (tokenId: string, type: 'bullish' | 'bearish') => {
     setTokens(prev => prev.map(t => t.id === tokenId ? { ...t, sentiment: { ...t.sentiment, [type]: t.sentiment[type] + 1 } } : t));
     if (settings.audioEnabled) type === 'bullish' ? playSound('success') : playSound('click');
  };

  const isUserBanned = (address: string): boolean => {
    return bannedUsers.some(u => {
      if (u.address.toLowerCase() !== address.toLowerCase()) return false;
      if (u.permanent) return true;
      // Check if temporary ban has expired
      return !u.expiresAt || u.expiresAt > Date.now();
    });
  };

  const addComment = (tokenId: string, text: string, imageUrl?: string, tradeAction?: { type: 'buy' | 'sell'; amount: number }) => {
    // Check if user is banned (check both address and username "You")
    const currentUser = userProfile.username || 'You';
    const bannedUser = bannedUsers.find(u =>
      u.address.toLowerCase() === userAddress.toLowerCase() ||
      u.address.toLowerCase() === currentUser.toLowerCase()
    );

    if (bannedUser) {
      // Show ban notice modal instead of just a notification
      setBanNoticeModal({ isOpen: true, reason: bannedUser.reason });
      return;
    }

    // Check if user has an active warning (check both address and username)
    const activeWarning = warnedUsers.find(u =>
      u.isActive &&
      (u.address.toLowerCase() === userAddress.toLowerCase() ||
       u.address.toLowerCase() === currentUser.toLowerCase())
    );

    if (activeWarning) {
      // Only show warning if not yet acknowledged OR if warning was updated after acknowledgment
      const needsAcknowledge = !activeWarning.acknowledgedAt ||
                               activeWarning.warnedAt > activeWarning.acknowledgedAt;

      if (needsAcknowledge) {
        // Count total active warnings for this user
        const warningCount = warnedUsers.filter(u =>
          u.isActive &&
          !u.tokenId &&
          (u.address.toLowerCase() === userAddress.toLowerCase() ||
           u.address.toLowerCase() === currentUser.toLowerCase())
        ).length;

        // Show warning notice modal with count and specific warning info
        setWarningNoticeModal({
          isOpen: true,
          reason: activeWarning.reason,
          notes: activeWarning.notes,
          warningCount,
          maxWarnings: 3,
          warningAddress: activeWarning.address,
          warningTokenId: activeWarning.tokenId
        });
        // Allow comment to proceed, but user acknowledges the warning
      }
    }

    const newComment: Comment = {
      id: Date.now().toString(),
      tokenId,
      user: userProfile.username || 'You',
      text,
      timestamp: Date.now(),
      likes: 0,
      imageUrl,
      badges: userProfile.badges.map(b => b.id),
      tradeAction
    };
    setComments(prev => [newComment, ...prev].slice(0, 100));
  };

  const likeComment = (commentId: string) => {
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, likes: c.likes + 1 } : c));
    if (settings.audioEnabled) playSound('success');
  };

  const toggleWatchlist = (tokenId: string) => {
    setWatchlist(prev => {
      const exists = prev.includes(tokenId);
      if (!exists) {
         addNotification('success', 'Watchlist', 'Token added.', `/token/${tokenId}`);
         return [...prev, tokenId];
      }
      return prev.filter(id => id !== tokenId);
    });
    if (settings.audioEnabled) playSound('click');
  };

  const toggleLiveStream = (tokenId: string, isLive: boolean) => {
     setTokens(prev => prev.map(t => t.id === tokenId ? { ...t, isLive, streamViewers: isLive ? 1 : 0 } : t));
     if (isLive) addNotification('success', 'Live Stream', 'You are now LIVE on DogeTV!', `/tv`);
  };

  const followUser = (address: string, maxAmount: number) => {
     setCopyTargets(prev => {
        if (prev.some(t => t.address === address)) return prev;
        return [...prev, { address, maxAmountDC: maxAmount, active: true, totalCopiedVolume: 0 }];
     });
     addNotification('success', 'Copy Trading', `Now following ${address}`, `/profile/${address}`);
  };

  const unfollowUser = (address: string) => {
     setCopyTargets(prev => prev.filter(t => t.address !== address));
     addNotification('info', 'Copy Trading', `Stopped following ${address}`);
  };

  const reportComment = async (commentId: string, tokenId: string, reason: string, description: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    try {
      // Format description to include comment content (similar to trollbox format)
      const commentTimestamp = new Date(comment.timestamp).toLocaleString();
      const fullDescription = description
        ? `Comment by ${comment.user} at ${commentTimestamp}:\n${comment.text}\n\nReason: ${description}`
        : `Comment by ${comment.user} at ${commentTimestamp}:\n${comment.text}`;

      // Use the API-based addReport function
      await addReport('comment', commentId, comment.user, reason as any, fullDescription);

      // Update comment report status
      setComments(prev => prev.map(c =>
        c.id === commentId
          ? { ...c, reports: (c.reports || 0) + 1, isReported: true }
          : c
      ));

      // Always link to admin dashboard's comment-reports tab
      // Admin users will see the admin UI, regular users will see "not authorized" if they don't have access
      const notificationLink = `/admin#comment-reports`;

      addNotification('success', 'Report Submitted', 'Thank you for helping keep our community safe', notificationLink);
    } catch (error) {
      console.error('[STORE] Failed to report comment:', error);
      // Error notification is already shown by addReport
    }
  };

  const reportToken = async (tokenId: string, reason: string, description: string) => {
    const token = tokens.find(t => t.id === tokenId);
    if (!token) return;

    try {
      // Use the API-based addReport function
      await addReport('token', tokenId, token.creator, reason as any, description);

      // Update token report status
      setTokens(prev => prev.map(t =>
        t.id === tokenId
          ? { ...t, reports: (t.reports || 0) + 1, isReported: true }
          : t
      ));

      // Always link to admin dashboard's token-reports tab
      // Admin users will see the admin UI, regular users will see "not authorized" if they don't have access
      const notificationLink = `/admin#token-reports`;

      addNotification('success', 'Token Report Submitted', 'Our moderators will review this token shortly', notificationLink);
    } catch (error) {
      console.error('[STORE] Failed to report token:', error);
      // Error notification is already shown by addReport
    }
  };

  const resolveReport = (reportId: string, resolution: string, status: 'resolved' | 'dismissed', adminNotes?: string, actionTaken?: Report['actionTaken']) => {
    const report = reports.find(r => r.id === reportId);
    setReports(prev => prev.map(r =>
      r.id === reportId
        ? {
            ...r,
            status,
            reviewedBy: userAddress || 'Admin',
            reviewedAt: Date.now(),
            resolution,
            adminNotes: adminNotes || '',
            actionTaken: actionTaken || status
          }
        : r
    ));

    // Link to the appropriate admin dashboard tab based on the report type
    const tab = report?.tokenId ? 'token-reports' : 'comment-reports';
    addNotification('success', 'Report Updated', `Report ${status === 'resolved' ? 'resolved' : 'dismissed'} successfully`, `/admin#${tab}`);
  };

  // Generic function to add a report (used by trollbox, comments, tokens)
  const addReport = async (
    type: 'comment' | 'token' | 'trollbox',
    targetId: string,
    reportedUser: string,
    reason: Report['reason'],
    description: string
  ) => {
    try {
      console.log('[STORE] addReport called with:', { type, targetId, reportedUser, reason });

      // Import reportsApi dynamically to avoid circular dependency
      const { createReport } = await import('../services/reportsApi');

      // Map trollbox type to user for API
      const apiType: 'comment' | 'token' | 'user' = type === 'trollbox' ? 'user' : type;

      // For trollbox, comment, and token reports, don't set reportedUserId or commentId since:
      // 1. Trollbox/comment/token users may not exist in the database or use display names
      // 2. Comments/trollbox use timestamp IDs, not UUIDs (foreign key constraint)
      // 3. Token creator is a display name, not a user ID UUID
      // The description field contains all the relevant information
      const reportedUserId = undefined;
      const commentId = undefined; // Never set commentId since comments use timestamp IDs, not UUIDs

      console.log('[STORE] Prepared report data:', { apiType, commentId, tokenId: type === 'token' ? targetId : undefined, reportedUserId });

      // Call API to create report
      const result = await createReport({
        type: apiType,
        commentId,
        tokenId: type === 'token' ? targetId : undefined,
        reportedUserId,
        reason,
        description,
      });

      console.log('[STORE] Report created via API:', result.report.id);

      // Add the new report to local state so it shows in admin dashboard immediately
      // This avoids the need for an admin-only API call to refresh all reports
      const newReport: Report = {
        id: result.report.id,
        type: apiType,
        commentId,
        tokenId: type === 'token' ? targetId : undefined,
        reporter: userProfile.username || userAddress || 'Anonymous',
        reportedUser: reportedUser || 'Unknown',
        reason,
        description,
        timestamp: Date.now(),
        status: 'pending'
      };

      setReports(prev => [newReport, ...prev]);
      console.log('[STORE] Added new report to local state, total reports:', reports.length + 1);

      return result.report.id;
    } catch (error) {
      console.error('[STORE] Failed to create report via API:', error);
      addNotification('error', 'Report Failed', error instanceof Error ? error.message : 'Failed to submit report');
      throw error;
    }
  };

  // Admin action functions
  const delistToken = async (tokenId: string, reason: string, notes: string) => {
    const now = Date.now();
    console.log('[ADMIN] Delisting token:', tokenId, 'Reason:', reason, 'Notes:', notes);

    try {
      // Call API to delist token
      const result = await moderationApi.delistToken(tokenId, { reason, notes });

      // Update local token state
      setTokens(prev => {
        const updated = prev.map(t =>
          t.id === tokenId
            ? {
                ...t,
                delisted: true,
                delistedAt: now,
                delistedBy: userAddress || 'Admin',
                delistedReason: reason
              }
            : t
        );
        console.log('[ADMIN] Token updated, delisted:', updated.find(t => t.id === tokenId)?.delisted);
        return updated;
      });

      // Reload admin actions
      const actions = await moderationApi.getAdminActions().catch(() => []);
      if (actions && actions.length > 0) {
        const formattedActions = actions.map((a: any) => ({
          id: a.id,
          type: a.action_type,
          targetType: a.target_type,
          targetId: a.target_id,
          adminAddress: a.admin_id || 'Admin',
          reason: a.reason,
          notes: a.notes || '',
          timestamp: new Date(a.created_at).getTime()
        }));
        setAdminActions(formattedActions);
      }

      // Update any related reports
      setReports(prev => prev.map(r =>
        r.tokenId === tokenId
          ? { ...r, status: 'resolved', resolution: `Token delisted: ${reason}`, adminNotes: notes, actionTaken: 'token_delisted' }
          : r
      ));

      addNotification('success', 'Token Delisted', `Token has been delisted. Reason: ${reason}`, `/admin#delisted-tokens`);
      console.log('[ADMIN] Delist complete for token:', tokenId);
    } catch (error: any) {
      console.error('[ADMIN] Error delisting token:', error);
      addNotification('error', 'Failed to Delist Token', error.message || 'Unknown error');
    }
  };

  const relistToken = async (tokenId: string, notes: string) => {
    console.log('[ADMIN] Re-listing token:', tokenId, 'Notes:', notes);

    try {
      // Call API to relist token
      const result = await moderationApi.relistToken(tokenId);

      // Update local token state
      setTokens(prev => {
        const updated = prev.map(t =>
          t.id === tokenId
            ? {
                ...t,
                delisted: false,
                delistedAt: undefined,
                delistedBy: undefined,
                delistedReason: undefined
              }
            : t
        );
        console.log('[ADMIN] Token re-listed, delisted:', updated.find(t => t.id === tokenId)?.delisted);
        return updated;
      });

      // Reload admin actions
      const actions = await moderationApi.getAdminActions().catch(() => []);
      if (actions && actions.length > 0) {
        const formattedActions = actions.map((a: any) => ({
          id: a.id,
          type: a.action_type,
          targetType: a.target_type,
          targetId: a.target_id,
          adminAddress: a.admin_id || 'Admin',
          reason: a.reason,
          notes: a.notes || '',
          timestamp: new Date(a.created_at).getTime()
        }));
        setAdminActions(formattedActions);
      }

      addNotification('success', 'Token Re-listed', `Token has been re-listed and is now visible.`, `/admin#delisted-tokens`);
      console.log('[ADMIN] Re-list complete for token:', tokenId);
    } catch (error: any) {
      console.error('[ADMIN] Error relisting token:', error);
      addNotification('error', 'Failed to Relist Token', error.message || 'Unknown error');
    }
  };

  const banUser = async (targetAddress: string, reason: string, notes: string, permanent: boolean = false) => {
    console.log('[ADMIN] Banning user:', targetAddress, 'Reason:', reason, 'Permanent:', permanent);

    try {
      // Check if user is already banned locally
      if (bannedUsers.find(u => u.address.toLowerCase() === targetAddress.toLowerCase() && u.permanent)) {
        addNotification('error', 'User Already Banned', 'This user is already banned.');
        return;
      }

      // Call API to ban user
      const result = await moderationApi.banUser({
        targetAddress,
        reason,
        notes
      });

      // Format the ban record
      const formattedBan: BannedUser = {
        address: result.wallet_address,
        bannedAt: new Date(result.banned_at).getTime(),
        bannedBy: result.banned_by || 'Admin',
        reason: result.ban_reason,
        notes: result.admin_notes || '',
        permanent: result.is_automatic,
        expiresAt: result.unbanned_at ? new Date(result.unbanned_at).getTime() : undefined
      };

      setBannedUsers(prev => [formattedBan, ...prev]);

      // Reload admin actions
      const actions = await moderationApi.getAdminActions().catch(() => []);
      if (actions && actions.length > 0) {
        const formattedActions = actions.map((a: any) => ({
          id: a.id,
          type: a.action_type,
          targetType: a.target_type,
          targetId: a.target_id,
          adminAddress: a.admin_id || 'Admin',
          reason: a.reason,
          notes: a.notes || '',
          timestamp: new Date(a.created_at).getTime()
        }));
        setAdminActions(formattedActions);
      }

      // Mark all active reports by this user as resolved
      setReports(prev => prev.map(r =>
        r.reportedUser.toLowerCase() === targetAddress.toLowerCase() && r.status === 'pending'
          ? { ...r, status: 'resolved', resolution: `User banned: ${reason}`, adminNotes: notes, actionTaken: 'user_banned' }
          : r
      ));

      addNotification('success', 'User Banned', `User has been banned. Reason: ${reason}`, `/admin#banned-users`);
      console.log('[ADMIN] Ban complete for user:', targetAddress);
    } catch (error: any) {
      console.error('[ADMIN] Error banning user:', error);
      addNotification('error', 'Failed to Ban User', error.message || 'Unknown error');
    }
  };

  const unbanUser = async (targetAddress: string, notes: string) => {
    console.log('[ADMIN] Unbanning user:', targetAddress);

    try {
      // Call API to unban user
      const result = await moderationApi.unbanUser(targetAddress);

      // Update local state - remove the ban
      setBannedUsers(prev => prev.filter(u =>
        !(u.address.toLowerCase() === targetAddress.toLowerCase() && u.permanent)
      ));

      // Reload admin actions
      const actions = await moderationApi.getAdminActions().catch(() => []);
      if (actions && actions.length > 0) {
        const formattedActions = actions.map((a: any) => ({
          id: a.id,
          type: a.action_type,
          targetType: a.target_type,
          targetId: a.target_id,
          adminAddress: a.admin_id || 'Admin',
          reason: a.reason,
          notes: a.notes || '',
          timestamp: new Date(a.created_at).getTime()
        }));
        setAdminActions(formattedActions);
      }

      addNotification('success', 'User Unbanned', 'User has been unbanned and can now comment.', `/admin#banned-users`);
      console.log('[ADMIN] Unban complete for user:', targetAddress);
    } catch (error: any) {
      console.error('[ADMIN] Error unbanning user:', error);
      addNotification('error', 'Failed to Unban User', error.message || 'Unknown error');
    }
  };

  const warnUser = async (targetAddress: string, reason: string, notes: string, tokenId?: string) => {
    console.log('[ADMIN] Warning user:', targetAddress, 'Reason:', reason, 'Notes:', notes, 'TokenId:', tokenId);

    try {
      // Call API to create warning (handles 3-strike logic server-side)
      const result = await moderationApi.createWarning({
        targetAddress,
        reason,
        notes,
        tokenId
      });

      if (result.penaltyApplied) {
        // Server applied automatic penalty (ban or delist)
        console.log('[ADMIN] Server applied automatic penalty');

        // Reload moderation data from server
        const [warnings, bans] = await Promise.all([
          moderationApi.getAllWarnings().catch(() => []),
          moderationApi.getAllBans().catch(() => [])
        ]);

        if (warnings && warnings.length > 0) {
          const formattedWarnings = warnings.map((w: any) => ({
            address: w.wallet_address,
            tokenId: w.token_id,
            warnedAt: new Date(w.created_at).getTime(),
            warnedBy: w.warned_by || 'Admin',
            reason: w.warning_reason,
            notes: w.admin_notes || '',
            isActive: w.is_active,
            expiresAt: w.expires_at ? new Date(w.expires_at).getTime() : undefined,
            acknowledgedAt: w.acknowledged_at ? new Date(w.acknowledged_at).getTime() : undefined
          }));
          setWarnedUsers(formattedWarnings);
        }

        if (bans && bans.length > 0) {
          const formattedBans = bans.map((b: any) => ({
            address: b.wallet_address,
            bannedAt: new Date(b.banned_at).getTime(),
            bannedBy: b.banned_by || 'Admin',
            reason: b.ban_reason,
            notes: b.admin_notes || '',
            permanent: b.is_automatic,
            expiresAt: b.unbanned_at ? new Date(b.unbanned_at).getTime() : undefined
          }));
          setBannedUsers(formattedBans);
        }

        // Reload admin actions
        const actions = await moderationApi.getAdminActions().catch(() => []);
        if (actions && actions.length > 0) {
          const formattedActions = actions.map((a: any) => ({
            id: a.id,
            type: a.action_type,
            targetType: a.target_type,
            targetId: a.target_id,
            adminAddress: a.admin_id || 'Admin',
            reason: a.reason,
            notes: a.notes || '',
            timestamp: new Date(a.created_at).getTime()
          }));
          setAdminActions(formattedActions);
        }

        addNotification('success', 'Automatic Penalty Applied', 'Penalty applied after 3 warnings');
        return;
      }

      // Warning was created successfully (less than 3 warnings)
      if (result.warning) {
        const formattedWarning: WarnedUser = {
          address: result.warning.wallet_address,
          tokenId: result.warning.token_id || undefined,
          warnedAt: new Date(result.warning.created_at).getTime(),
          warnedBy: result.warning.warned_by || 'Admin',
          reason: result.warning.warning_reason,
          notes: result.warning.admin_notes || '',
          isActive: result.warning.is_active,
          expiresAt: result.warning.expires_at ? new Date(result.warning.expires_at).getTime() : undefined,
          acknowledgedAt: result.warning.acknowledged_at ? new Date(result.warning.acknowledged_at).getTime() : undefined
        };

        setWarnedUsers(prev => [formattedWarning, ...prev]);

        // Reload admin actions
        const actions = await moderationApi.getAdminActions().catch(() => []);
        if (actions && actions.length > 0) {
          const formattedActions = actions.map((a: any) => ({
            id: a.id,
            type: a.action_type,
            targetType: a.target_type,
            targetId: a.target_id,
            adminAddress: a.admin_id || 'Admin',
            reason: a.reason,
            notes: a.notes || '',
            timestamp: new Date(a.created_at).getTime()
          }));
          setAdminActions(formattedActions);
        }

        addNotification('success', 'Warning Issued', `Warning ${result.warningCount}/3 issued. Reason: ${reason}`, `/admin#warnings`);
        console.log('[ADMIN] Warning complete for user:', targetAddress, 'Warning count:', result.warningCount);
      }
    } catch (error: any) {
      console.error('[ADMIN] Error issuing warning:', error);
      addNotification('error', 'Failed to Issue Warning', error.message || 'Unknown error');
    }
  };

  // clearWarning function removed - use API directly via moderationApi.clearWarning(warningId)

  const clearWarning = (targetAddress: string) => {
    setWarnedUsers(prev => prev.map(u =>
      u.address.toLowerCase() === targetAddress.toLowerCase()
        ? { ...u, isActive: false }
        : u
    ));
    addNotification('success', 'Warning Cleared', 'User warning has been cleared.');
  };

  const showWarningModal = (reason: string, notes: string, warningCount?: number, maxWarnings?: number, warningAddress?: string, warningTokenId?: string) => {
    setWarningNoticeModal({ isOpen: true, reason, notes, warningCount, maxWarnings, warningAddress, warningTokenId });
  };

  const showBanNoticeModal = (reason: string) => {
    setBanNoticeModal({ isOpen: true, reason });
  };

  const closeWarningNoticeModal = () => {
    // Mark only the specific warning that was shown as acknowledged
    if (warningNoticeModal.warningAddress) {
      setWarnedUsers(prev => prev.map(u => {
        // Match by address and tokenId (if present)
        const addressMatch = u.address.toLowerCase() === warningNoticeModal.warningAddress?.toLowerCase();
        const tokenMatch = warningNoticeModal.warningTokenId
          ? u.tokenId === warningNoticeModal.warningTokenId
          : !u.tokenId; // If no tokenId in modal, match only user warnings (no tokenId)

        if (addressMatch && tokenMatch && u.isActive && !u.acknowledgedAt) {
          return { ...u, acknowledgedAt: Date.now() };
        }
        return u;
      }));
    }
    setWarningNoticeModal({ isOpen: false });
  };

  const getTradesForToken = (tokenId: string) => trades.filter(t => t.tokenId === tokenId).sort((a,b) => b.timestamp - a.timestamp);
  const getCommentsForToken = (tokenId: string) => comments.filter(c => c.tokenId === tokenId).sort((a,b) => b.timestamp - a.timestamp);

  const resetStore = () => { localStorage.clear(); window.location.reload(); };
  
  const updateSecurity = (tokenId: string, key: 'mintRevoked' | 'freezeRevoked' | 'lpBurned') => {
    setTokens(prev => prev.map(t => t.id === tokenId ? { ...t, securityState: { ...t.securityState, [key]: true } } : t));
  };

  const updateTokenSocials = (tokenId: string, socials: any) => {
    setTokens(prev => prev.map(t => t.id === tokenId ? { ...t, ...socials } : t));
  };

  const faucet = () => {
    setUserBalanceDC(prev => prev + 1000);
    if (settings.audioEnabled) playSound('success');
    addNotification('success', 'Faucet', 'Received 1,000 $DC.');
  };

  // Emoji Reaction Functions
  const addEmojiReaction = (tokenId: string, emoji: ChartEmoji) => {
    const userId = getUserId();
    
    // Add reaction via emojiService
    addReaction(tokenId, emoji);
    
    // Update user reactions state
    setUserReactions(prev => ({ ...prev, [tokenId]: emoji }));
    
    // Calculate and update reaction stats
    const newStats = calculateReactionStats(tokenId);
    setReactionStats(prev => ({ ...prev, [tokenId]: newStats }));
    
    // Broadcast to other tabs via sync service
    emojiSyncService.broadcastAddReaction(tokenId, emoji, userId);
    
    // Play sound
    if (settings.audioEnabled) playSound('success');
  };

  const removeEmojiReaction = (tokenId: string, emoji: ChartEmoji) => {
    const userId = getUserId();
    
    // Remove reaction via emojiService
    removeReaction(tokenId, emoji);
    
    // Update user reactions state
    setUserReactions(prev => {
      const currentReaction = prev[tokenId];
      if (currentReaction === emoji) {
        const updated = { ...prev };
        delete updated[tokenId];
        return updated;
      }
      return prev;
    });
    
    // Calculate and update reaction stats
    const newStats = calculateReactionStats(tokenId);
    setReactionStats(prev => ({ ...prev, [tokenId]: newStats }));
    
    // Broadcast to other tabs via sync service
    emojiSyncService.broadcastRemoveReaction(tokenId, emoji, userId);
    
    // Play sound
    if (settings.audioEnabled) playSound('click');
  };

  const getEmojiReactionStats = (tokenId: string): ReactionStats | null => {
    return reactionStats[tokenId] || null;
  };

  const getUserReaction = (tokenId: string): ChartEmoji | null => {
    return userReactions[tokenId] || null;
  };

  const initializeEmojiSystem = () => {
    // Initialize emoji sync service
    emojiSyncService.initialize();
    
    // Load existing reaction stats from emojiService
    const allStats: Record<string, ReactionStats> = {};
    tokens.forEach(token => {
      const stats = getReactionStats(token.id);
      if (stats) {
        allStats[token.id] = stats;
      } else {
        // Calculate stats if not stored
        allStats[token.id] = calculateReactionStats(token.id);
      }
    });
    setReactionStats(allStats);
    
    // Set up sync message listener
    const unregister = emojiSyncService.onMessage((message) => {
      if (message.type === 'add_reaction' && message.reaction) {
        // Update reaction stats when another tab adds a reaction
        const newStats = calculateReactionStats(message.tokenId);
        setReactionStats(prev => ({ ...prev, [message.tokenId]: newStats }));
      } else if (message.type === 'remove_reaction' && message.reaction) {
        // Update reaction stats when another tab removes a reaction
        const newStats = calculateReactionStats(message.tokenId);
        setReactionStats(prev => ({ ...prev, [message.tokenId]: newStats }));
      } else if (message.type === 'update_stats' && message.stats) {
        // Update stats when received from another tab
        const stats = message.stats;
        setReactionStats(prev => ({ ...prev, [message.tokenId]: stats }));
      } else if (message.type === 'sentiment_vote' && message.sentimentVote) {
        // Update sentiment counts when another tab votes
        const { voteType } = message.sentimentVote;
        setTokens(prev => prev.map(t =>
          t.id === message.tokenId
            ? { ...t, sentiment: { ...t.sentiment, [voteType]: t.sentiment[voteType] + 1 } }
            : t
        ));
      } else if (message.type === 'sync_all') {
        // Request full sync from other tabs
        emojiSyncService.requestSyncAll();
      }
    });
    
    return unregister;
  };

  // Initialize emoji system on mount
  useEffect(() => {
    const cleanup = initializeEmojiSystem();
    return () => {
      emojiSyncService.cleanup();
      cleanup?.();
    };
  }, []);

  // Token Owner Farm Actions
  const createFarm = async (request: CreateFarmRequest): Promise<string> => {
    try {
      const farm = farmService.createFarm(request);
      setTokenOwnerFarms(prev => [...prev, farm]);
      addNotification('success', 'Farm Created', `Your ${farm.pool.rewardTokenId} farm is now live!`, `/farms`);
      if (settings.audioEnabled) playSound('launch');
      return farm.id;
    } catch (error: any) {
      addNotification('error', 'Farm Creation Failed', error.message || 'Failed to create farm');
      throw error;
    }
  };

  const depositRewards = async (farmId: string, amount: number): Promise<void> => {
    try {
      farmService.depositRewards(farmId, amount);
      setTokenOwnerFarms(prev => prev.map(f => f.id === farmId ? farmService.getFarmById(farmId)! : f));
      addNotification('success', 'Rewards Deposited', `Added ${amount} tokens to reward pool.`, `/farms`);
    } catch (error: any) {
      addNotification('error', 'Deposit Failed', error.message || 'Failed to deposit rewards');
      throw error;
    }
  };

  const updateFarmConfig = async (farmId: string, config: Partial<FarmConfiguration>): Promise<void> => {
    try {
      farmService.updateFarmConfig(farmId, config);
      setTokenOwnerFarms(prev => prev.map(f => f.id === farmId ? farmService.getFarmById(farmId)! : f));
      addNotification('success', 'Farm Updated', 'Farm configuration updated successfully.', `/farms`);
    } catch (error: any) {
      addNotification('error', 'Update Failed', error.message || 'Failed to update farm');
      throw error;
    }
  };

  const pauseFarm = async (farmId: string): Promise<void> => {
    try {
      farmService.pauseFarm(farmId);
      setTokenOwnerFarms(prev => prev.map(f => f.id === farmId ? farmService.getFarmById(farmId)! : f));
      addNotification('info', 'Farm Paused', 'Farm has been paused.', `/farms`);
    } catch (error: any) {
      addNotification('error', 'Pause Failed', error.message || 'Failed to pause farm');
      throw error;
    }
  };

  const resumeFarm = async (farmId: string): Promise<void> => {
    try {
      farmService.resumeFarm(farmId);
      setTokenOwnerFarms(prev => prev.map(f => f.id === farmId ? farmService.getFarmById(farmId)! : f));
      addNotification('success', 'Farm Resumed', 'Farm is now active.', `/farms`);
    } catch (error: any) {
      addNotification('error', 'Resume Failed', error.message || 'Failed to resume farm');
      throw error;
    }
  };

  const closeFarm = async (farmId: string): Promise<void> => {
    try {
      const { farm, refundedAmount } = farmService.closeFarm(farmId);
      setTokenOwnerFarms(prev => prev.map(f => f.id === farmId ? farm : f));
      addNotification('info', 'Farm Closed', `Farm closed. ${refundedAmount} tokens refunded.`, `/farms`);
    } catch (error: any) {
      addNotification('error', 'Close Failed', error.message || 'Failed to close farm');
      throw error;
    }
  };

  const stakeInFarm = async (farmId: string, amount: number): Promise<void> => {
    try {
      farmService.stakeInFarm({ farmId, amount });
      setTokenOwnerFarmPositions(prev => farmService.getUserFarmPositions(farmId));
      setTokenOwnerFarms(prev => prev.map(f => f.id === farmId ? farmService.getFarmById(farmId)! : f));
      addNotification('farm', 'Staked Successfully', `Staked ${amount} tokens in farm.`, `/farms`);
    } catch (error: any) {
      addNotification('error', 'Stake Failed', error.message || 'Failed to stake in farm');
      throw error;
    }
  };

  const unstakeFromFarm = async (farmId: string, amount: number): Promise<void> => {
    try {
      const { position, rewards } = farmService.unstakeFromFarm({ farmId, amount });
      setTokenOwnerFarmPositions(prev => farmService.getUserFarmPositions(farmId));
      setTokenOwnerFarms(prev => prev.map(f => f.id === farmId ? farmService.getFarmById(farmId)! : f));
      addNotification('info', 'Unstaked', `Unstaked ${amount} tokens. Claimed ${rewards.toFixed(2)} rewards.`, `/farms`);
    } catch (error: any) {
      addNotification('error', 'Unstake Failed', error.message || 'Failed to unstake from farm');
      throw error;
    }
  };

  const harvestFarmRewards = async (farmId: string): Promise<number> => {
    try {
      const rewards = farmService.harvestFarmRewards(farmId);
      setTokenOwnerFarmPositions(prev => farmService.getUserFarmPositions(farmId));
      addNotification('success', 'Harvested!', `Claimed ${rewards.toFixed(2)} tokens.`, `/farms`);
      if (settings.audioEnabled) playSound('success');
      return rewards;
    } catch (error: any) {
      addNotification('error', 'Harvest Failed', error.message || 'Failed to harvest rewards');
      throw error;
    }
  };

  const getFarm = (farmId: string): TokenOwnerFarm | undefined => {
    return farmService.getFarmById(farmId);
  };

  const getMyFarms = (): TokenOwnerFarm[] => {
    return farmService.getMyFarms();
  };

  const getFarmPositions = (farmId?: string): TokenOwnerFarmPosition[] => {
    return farmService.getUserFarmPositions(farmId);
  };

  const bridgeAssets = (amount: number) => {
    setUserBalanceDC(prev => prev + amount);
  };

  const getFarmStats = (farmId: string): FarmStats | undefined => {
    return farmService.getFarmStats(farmId);
  };

  return (
    <StoreContext.Provider value={{
      tokens, trades, comments, myHoldings, activeOrders, priceAlerts, farmPositions, tokenOwnerFarms, tokenOwnerFarmPositions, userBalanceDC, priceHistory, watchlist, notifications, unreadCount, lightboxImage, userProfile, setNotifications, settings, marketEvent, recentlyUnlockedBadge, networkStats, lockedAssets, copyTargets, reports, userAddress, reactionStats, userReactions, adminActions, bannedUsers, warnedUsers, banNoticeModal, warningNoticeModal,
      dexPools, dexLpPositions, dexSettings, dexTransactionQueue,
      setDexPools, setDexLpPositions, setDexSettings, setDexTransactionQueue,
      launchToken, buyToken, sellToken, burnToken, lockForReputation, unlockForReputation, reputationPoints, boostToken, airdropToken, placeOrder, cancelOrder, addPriceAlert, removePriceAlert, stakeToken, unstakeToken, harvestRewards, addComment, likeComment, reportComment, reportToken, addReport, resolveReport, delistToken, relistToken, banUser, unbanUser, warnUser, addAdditionalWarning: warnUser, clearWarning, showWarningModal, showBanNoticeModal, isUserBanned, getTradesForToken, getCommentsForToken, toggleWatchlist, markAllNotificationsRead, clearNotifications, addNotification, openLightbox, closeLightbox, resetStore, updateSecurity, updateTokenSocials, updateProfile, updateSettings, faucet, bridgeAssets, voteSentiment, setMarketEvent, clearAchievement, toggleLiveStream, followUser, unfollowUser, resolveUsername, addEmojiReaction, removeEmojiReaction, getEmojiReactionStats, getUserReaction, initializeEmojiSystem, closeBanNoticeModal: () => setBanNoticeModal({ isOpen: false }), closeWarningNoticeModal,
      createFarm, depositRewards, updateFarmConfig, pauseFarm, resumeFarm, closeFarm, stakeInFarm, unstakeFromFarm, harvestFarmRewards, getFarm, getMyFarms, getFarmPositions, getFarmStats
    }}>
      {children}
    </StoreContext.Provider>
  );
};
