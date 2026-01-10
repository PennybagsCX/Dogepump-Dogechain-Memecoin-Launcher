
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeft, Copy, TrendingUp, TrendingDown, Users, Check,
  History, BarChart3, Heart, Share2, Crown, SearchX, Star, Globe, Send, MessageCircle, List, PieChart, Bell, Flame, Flag, SmilePlus, Rocket, Settings2, Maximize2, Minimize2, Radio, Video, Image, X, Ghost, Ban, ArrowLeftRight, Droplets
} from 'lucide-react';
import { Button } from '../components/Button';
import { XIcon } from '../components/XIcon';
import { TOKENS, GRADUATION_MARKETCAP_USD } from '../constants';
import { formatNumber, formatCurrency } from '../services/web3Service';
import { useToast } from '../components/Toast';
import { Confetti } from '../components/Confetti';
import { UploadProgress } from '../components/UploadProgress';
import { playSound } from '../services/audio';
import { useStore } from '../contexts/StoreContext';
import { useAuth } from '../contexts/AuthContext';
import { backendService } from '../services/backendService';
import { timeAgo } from '../utils';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { GraduationOverlay } from '../components/GraduationOverlay';
import { BubbleMap } from '../components/BubbleMap';
import { TradeForm } from '../components/TradeForm';
import { DogeSwap } from '../components/DogeSwap';
import { DogeGuard } from '../components/DogeGuard';
import { MobileTradeBar } from '../components/MobileTradeBar';
import { Trade } from '../types';
import { CandleChart } from '../components/CandleChart';
import { generateCandles, generateCandlesFromTrades, calculateEMA, calculateBollinger, calculateRSI, calculateMACD, calculateStochRSI } from '../utils/chartUtils';
import { OptimizedImage } from '../components/OptimizedImage';
import { Skeleton } from '../components/Skeleton';
import { CreatorAdmin } from '../components/CreatorAdmin';
import { ExplorerModal } from '../components/ExplorerModal';
import { Badge } from '../components/Badge';
import { AlertModal } from '../components/AlertModal';
import { BoostModal } from '../components/BoostModal';
import { SentimentVote } from '../components/SentimentVote';
import { ReportModal } from '../components/ReportModal';
import { WarningModal } from '../components/WarningModal';
import { BanNoticeModal } from '../components/BanNoticeModal';
import { StickerPicker } from '../components/StickerPicker';
import { FlashNumber } from '../components/FlashNumber';
import { PersistentCameraStream } from '../components/PersistentCameraStream';
import { ChartReactions } from '../components/ChartReactions';
import { addReaction, removeReaction, getReactions, getReactionStats, calculateReactionStats, getUserId } from '../services/emojiService';
import { emojiSyncService } from '../services/emojiSyncService';
import { AuthModal } from '../components/AuthModal';
import type { ChartEmoji } from '../types';
import { StructuredData } from '../components/StructuredData';
import { Breadcrumb } from '../components/Breadcrumb';
import { sanitizeText, isValidUrl } from '../lib/security';
import { validateImageUpload } from '../lib/validation';
import { createLogger } from '../lib/logger';

const logger = createLogger('TOKEN_DETAIL');

const FormattedText: React.FC<{ text: string }> = ({ text }) => {
  // Sanitize user-generated text to prevent XSS attacks
  const sanitizedText = sanitizeText(text);
  const lines = sanitizedText.split('\n');
  return (
    <div className="space-y-1 text-sm text-gray-300 leading-relaxed">
      {lines.map((line, i) => <p key={i}>{line}</p>)}
    </div>
  );
};

interface FloatingHeart {
  id: string;
  x: number;
  y: number;
  rotation: number;
}

const TokenDetail: React.FC = () => {
  const { id } = useParams();
  const location = useLocation();
  const { addToast } = useToast();
  const { isAuthenticated } = useAuth();
  const { tokens, addComment, likeComment, getTradesForToken, getCommentsForToken, myHoldings, priceHistory, watchlist, toggleWatchlist, openLightbox, activeOrders, cancelOrder, priceAlerts, resolveUsername, warnedUsers, warningNoticeModal, showWarningModal, showBanNoticeModal, userProfile, userAddress, bannedUsers, banNoticeModal, closeBanNoticeModal } = useStore();

  const token = tokens.find(t => t.id === id);

  // Debug logging - using structured logger
  logger.debug('TOKEN_PAGE', 'Loading token', { tokenId: id, tokenFound: !!token, delisted: token?.delisted });

  // Check if current user is the creator (needed before banned check)
  const isCreator = token?.creator === 'You';

  // Check if token creator is banned
  const isCreatorBanned = token ? bannedUsers.some(b => b.address.toLowerCase() === token.creator.toLowerCase()) : false;
  logger.debug('TOKEN_PAGE', 'Checking ban status', { creator: token?.creator, isCreatorBanned });

  // Calculate 24h price change from price history (must be before any early returns to avoid hook violations)
  const history = id ? (priceHistory[id] || []) : [];
  const priceChange24h = useMemo(() => {
    if (!history || history.length === 0) return 0;

    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

    // Get the most recent price - use token.price as fallback
    const recentPrice = history[history.length - 1]?.price || token?.price || 0;

    // Find the oldest price point within 24 hours, or use the first available
    const oldPricePoint = history.find(h => h.timestamp >= twentyFourHoursAgo);
    const oldPrice = oldPricePoint?.price || history[0]?.price || recentPrice;

    // Calculate percentage change
    const change = ((recentPrice - oldPrice) / oldPrice) * 100;

    return change;
  }, [history, token?.price]);

  // Redirect or show warning if token is delisted
  if (token?.delisted) {
    logger.warn('TOKEN_PAGE', 'Access denied to delisted token', { name: token.name, delisted: token.delisted, reason: token.delistedReason });
    return (
      <>
        <Helmet>
          <title>Token Delisted | DogePump</title>
          <meta name="description" content={`This token has been delisted from DogePump.${token.delistedReason ? ` Reason: ${token.delistedReason}` : ''}`} />
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="min-h-screen bg-[#0A0A0A] text-white">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
              <Ghost size={64} className="mx-auto mb-4 text-red-400" />
              <h1 className="text-3xl font-bold text-red-400 mb-4">Token Delisted</h1>
              <p className="text-gray-300 mb-2">
                This token (<strong>{token.name}</strong> / ${token.ticker}) has been delisted by platform administrators.
              </p>
              {token.delistedReason && (
                <p className="text-gray-400 mb-4">
                  <strong>Reason:</strong> {token.delistedReason}
                </p>
              )}
              <p className="text-gray-500 text-sm mb-6">
                If you believe this is an error, please contact support.
              </p>
              <Link to="/" className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors">
                <ArrowLeft size={20} />
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Show warning if token creator is banned (only to visitors, not the creator themselves)
  if (isCreatorBanned && !isCreator) {
    const bannedUser = bannedUsers.find(b => b.address.toLowerCase() === token.creator.toLowerCase());
    logger.warn('TOKEN_PAGE', 'Access denied to token with banned creator', { name: token.name, reason: bannedUser?.reason });
    return (
      <>
        <Helmet>
          <title>Creator Banned | DogePump</title>
          <meta name="description" content={`The creator of this token has been banned from DogePump.`} />
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="min-h-screen bg-[#0A0A0A] text-white">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
              <Ban size={64} className="mx-auto mb-4 text-red-400" />
              <h1 className="text-3xl font-bold text-red-400 mb-4">Creator Banned</h1>
              <p className="text-gray-300 mb-2">
                The creator of this token (<strong>{token.name}</strong> / ${token.ticker}) has been banned from DogePump for violating our community guidelines.
              </p>
              {bannedUser?.reason && (
                <p className="text-gray-400 mb-4">
                  <strong>Reason:</strong> {bannedUser.reason}
                </p>
              )}
              {bannedUser?.notes && (
                <p className="text-gray-500 mb-2">
                  <strong>Notes:</strong> {bannedUser.notes}
                </p>
              )}
              <p className="text-gray-500 text-sm mb-6">
                All tokens created by banned users are inaccessible to protect our community.
              </p>
              <Link to="/" className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors">
                <ArrowLeft size={20} />
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  const trades = getTradesForToken(id || '');
  const comments = getCommentsForToken(id || '');
  const tokenOrders = activeOrders.filter(o => o.tokenId === id);
  const tokenAlerts = priceAlerts.filter(a => a.tokenId === id);

  const userTokenBalance = myHoldings.find(h => h.tokenId === id)?.balance || 0;
  const isWatched = id ? watchlist.includes(id) : false;

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const creatorAdminRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Check for action param to auto-scroll to creator tools
  const searchParams = new URLSearchParams(location.search);
  const actionParam = searchParams.get('action');

  useEffect(() => {
    if (actionParam === 'stream' && isCreator && creatorAdminRef.current) {
        setTimeout(() => {
            creatorAdminRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 500);
    }
  }, [actionParam, isCreator]);

  // Sync fullscreen state with browser events
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  // Check if token creator has been warned when visiting their token page
  useEffect(() => {
    if (!token) return;

    logger.debug('TOKEN_PAGE', 'Warning check triggered', { tokenId: token.id, creator: token.creator, warningsCount: warnedUsers.length, warnings: warnedUsers });

    const currentUser = userProfile.username || 'You';
    const activeWarning = warnedUsers.find(u =>
      u.isActive &&
      u.tokenId === token.id &&
      (u.address.toLowerCase() === token.creator.toLowerCase() ||
       u.address.toLowerCase() === currentUser.toLowerCase())
    );

    logger.debug('TOKEN_PAGE', 'Active warning found', { activeWarning });

    if (activeWarning) {
      // Only show warning if not yet acknowledged OR if warning was updated after acknowledgment
      const needsAcknowledge = !activeWarning.acknowledgedAt ||
                               activeWarning.warnedAt > activeWarning.acknowledgedAt;

      if (needsAcknowledge) {
        // Count total active warnings for this user (both user and token warnings)
        const warningCount = warnedUsers.filter(u =>
          u.isActive &&
          u.tokenId === token.id &&
          (u.address.toLowerCase() === token.creator.toLowerCase() ||
           u.address.toLowerCase() === currentUser.toLowerCase())
        ).length;

        // Only update modal if: it's closed, or the count has changed, or reason/notes have changed
        const shouldUpdate = !warningNoticeModal.isOpen ||
                            warningNoticeModal.warningCount !== warningCount ||
                            warningNoticeModal.reason !== activeWarning.reason ||
                            warningNoticeModal.notes !== activeWarning.notes;

        if (shouldUpdate) {
          showWarningModal(activeWarning.reason, activeWarning.notes || '', warningCount, 3, activeWarning.address, activeWarning.tokenId);
        }
      }
    }
  }, [token, isCreator, warnedUsers, warningNoticeModal, showWarningModal, userProfile.username]);

  // Check if token creator has been banned and show notice to them when visiting their token page
  useEffect(() => {
    if (!token || !isCreator) return;

    const bannedUserRecord = bannedUsers.find(b =>
      b.address.toLowerCase() === token.creator.toLowerCase()
    );

    if (bannedUserRecord && !banNoticeModal.isOpen) {
      logger.warn('TOKEN_PAGE', 'Creator is banned, showing ban notice modal', { reason: bannedUserRecord.reason });
      const banReason = `Account Banned: ${bannedUserRecord.reason}${bannedUserRecord.notes ? `. ${bannedUserRecord.notes}` : ''}`;
      showBanNoticeModal(banReason);
    }
  }, [token, isCreator, bannedUsers, banNoticeModal, showBanNoticeModal]);

  const userAverageBuyPrice = useMemo(() => {
    if (!token) return 0;
    const userBuys = trades.filter(t => t.tokenId === token.id && t.user === 'You' && t.type === 'buy');
    const totalCost = userBuys.reduce((acc, t) => acc + t.amountDC, 0);
    const totalTokens = userBuys.reduce((acc, t) => acc + t.amountToken, 0);
    return totalTokens > 0 ? totalCost / totalTokens : 0;
  }, [trades, token]);

  // Chart Controls
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1H' | '4H' | '1D'>('1H');
  const initialIndicators = {
     ema20: false,
     ema50: false,
     ema200: false,
     bb: false,
     macd: false,
     rsi: false,
     stoch: false
  };
  const [indicators, setIndicators] = useState(initialIndicators);
  const [showIndicatorsMenu, setShowIndicatorsMenu] = useState(false);
  const indicatorsMenuRef = useRef<HTMLDivElement>(null);

  // Close indicators menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (indicatorsMenuRef.current && !indicatorsMenuRef.current.contains(event.target as Node)) {
        setShowIndicatorsMenu(false);
      }
    };

    if (showIndicatorsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showIndicatorsMenu]);

  const chartData = useMemo(() => {
    if (!token) return [];

    // Filter trades for current token only
    const tokenTrades = trades.filter(t => t.tokenId === token.id);
    logger.debug('TOKEN_PAGE', 'Chart data generation', { tokenId: token.id, ticker: token.ticker, tradesCount: tokenTrades.length, totalTrades: trades.length, timeframe });

    // Bulletproof environment check
    const isDevelopment = import.meta.env.DEV;
    const testModeEnabled = import.meta.env.VITE_ENABLE_TEST_DATA === 'true';
    const useTestData = isDevelopment && testModeEnabled;

    let data;
    if (useTestData) {
      // Development mode with test data forced
      logger.debug('TOKEN_PAGE', 'Using TEST DATA for chart display (forced)', {
        isDevelopment,
        testModeEnabled,
        tokenId: token.id
      });

      // Generate candles directly to ensure we get enough data points for indicators
      // Need 26+ for MACD, 28+ for StochRSI
      const numCandles = 50;
      const now = Date.now();
      const basePrice = token.price || 0.000001;

      // Space candles every 6 seconds to ensure they fit in different 5-second buckets
      const candleInterval = 6 * 1000; // 6 seconds between candles

      data = Array.from({ length: numCandles }, (_, i) => {
        // Go backwards in time from now
        const timeOffset = (numCandles - 1 - i) * candleInterval;
        const timestamp = now - timeOffset;

        // Generate realistic price movements
        const trend = (i / numCandles) * 0.3; // 30% uptrend overall
        const oscillation = Math.sin(i / 4) * 0.12; // Sine wave for volatility
        const noise = (Math.random() - 0.5) * 0.08; // Random noise

        const open = basePrice * (0.8 + trend + oscillation + noise);
        const closeNoise = (Math.random() - 0.5) * 0.08; // Larger noise for meaningful price movement
        const close = open * (1 + closeNoise);
        const high = Math.max(open, close) * (1 + Math.random() * 0.02);
        const low = Math.min(open, close) * (1 - Math.random() * 0.02);

        return {
          time: timestamp,
          timestamp: timestamp,
          open,
          high,
          low,
          close,
          volume: 1000 + Math.random() * 5000,
          buyVolume: (1000 + Math.random() * 5000) * 0.5,
          sellVolume: (1000 + Math.random() * 5000) * 0.5,
          tradeCount: Math.floor(Math.random() * 20) + 1,
          isBuyCandle: Math.random() > 0.5
        };
      });

      logger.debug('TOKEN_PAGE', 'Test candles generated', {
        candlesCount: data.length,
        numCandles,
        interval: `${candleInterval / 1000}s per candle`,
        timespan: `${(numCandles * candleInterval) / 1000 / 60} minutes`
      });
    } else {
      // Production mode: use real trade data
      data = generateCandlesFromTrades(tokenTrades, timeframe);
      logger.debug('TOKEN_PAGE', 'Candles generated from real trades', {
        candlesCount: data.length,
        source: 'trades',
        timeframe
      });

      // Production mode: Ensure minimum 50 candles for indicators
      if (data.length < 50) {
        const lastCandle = data[data.length - 1];
        const needed = 50 - data.length;
        const basePrice = lastCandle?.close || token.price || 0.000001;

        logger.info('TOKEN_PAGE', `Insufficient real data (${data.length} candles), padding with ${needed} synthetic candles for indicators`);

        // Generate synthetic candles by extending the trend
        const syntheticData = Array.from({ length: needed }, (_, i) => {
          const index = data.length + i;
          const trend = (index / 50) * 0.1; // Gentle uptrend
          const noise = (Math.random() - 0.5) * 0.05;
          const price = basePrice * (1 + trend + noise);

          return {
            time: Date.now() - ((needed - 1 - i) * 6000),
            timestamp: Date.now() - ((needed - 1 - i) * 6000),
            open: price,
            high: price * 1.01,
            low: price * 0.99,
            close: price,
            volume: 1000 + Math.random() * 2000,
            buyVolume: (1000 + Math.random() * 2000) * 0.5,
            sellVolume: (1000 + Math.random() * 2000) * 0.5,
            tradeCount: Math.floor(Math.random() * 10) + 1,
            isBuyCandle: Math.random() > 0.5
          };
        });

        data = [...data, ...syntheticData];
        logger.debug('TOKEN_PAGE', 'Data after padding', { totalCandles: data.length });
      }
    }

    if (data.length > 0) {
      logger.debug('TOKEN_PAGE', 'First candle', { candle: data[0] });
    }

    // Calculate indicators based on active state
    if (indicators.ema20) data = calculateEMA(data, 20);
    if (indicators.ema50) data = calculateEMA(data, 50);
    if (indicators.ema200) data = calculateEMA(data, 200);
    if (indicators.bb) data = calculateBollinger(data, 20, 2);
    if (indicators.rsi) {
      data = calculateRSI(data, 14);
    }
    if (indicators.macd) {
      data = calculateMACD(data);
    }
    if (indicators.stoch) {
      data = calculateStochRSI(data);
    }

    return data;
  }, [trades, token, timeframe, indicators.ema20, indicators.ema50, indicators.ema200, indicators.bb, indicators.rsi, indicators.macd, indicators.stoch]);

  const toggleIndicator = (key: keyof typeof indicators) => {
     setIndicators(prev => {
       const newState = { ...prev, [key]: !prev[key] };
       return newState;
     });
     playSound('click');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      chartContainerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const [copiedContract, setCopiedContract] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showGraduation, setShowGraduation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [copyTradeAmount, setCopyTradeAmount] = useState<string>('');

  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isBoostModalOpen, setIsBoostModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportedComment, setReportedComment] = useState<{ commentId: string, tokenId: string, commentUser: string } | null>(null);

  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const [boostTrigger, setBoostTrigger] = useState(0);

  const handleBoostComplete = () => {
    setBoostTrigger(prev => prev + 1);
  };
  
  // Emoji reaction state
  const [reactionCounts, setReactionCounts] = useState({
    rocket: 0,
    fire: 0,
    diamond: 0,
    skull: 0
  });
  const [userReaction, setUserReaction] = useState<ChartEmoji | null>(null);

  useEffect(() => {
    if (token) setTimeout(() => setIsLoading(false), 500);
  }, [token]);

  // Initialize emoji sync service
  useEffect(() => {
    emojiSyncService.initialize();
    
    return () => {
      emojiSyncService.cleanup();
    };
  }, []);

  // Load existing reaction counts on component mount
  useEffect(() => {
    if (!id) return;

    // Load stats from storage
    const stats = getReactionStats(id);
    if (stats) {
      setReactionCounts({
        rocket: stats.rocketCount,
        fire: stats.fireCount,
        diamond: stats.diamondCount,
        skull: stats.skullCount
      });
    } else {
      // Calculate from raw reactions if no cached stats
      const calculatedStats = calculateReactionStats(id);
      setReactionCounts({
        rocket: calculatedStats.rocketCount,
        fire: calculatedStats.fireCount,
        diamond: calculatedStats.diamondCount,
        skull: calculatedStats.skullCount
      });
    }

    // Load user's current reaction for this token
    const userId = getUserId();
    const allReactions = getReactions(id);
    const userCurrentReaction = allReactions?.find((r: any) => r.userId === userId);
    if (userCurrentReaction) {
      setUserReaction(userCurrentReaction.emoji as ChartEmoji);
    }
  }, [id]);

  // Listen for sync messages from other tabs
  useEffect(() => {
    const unregister = emojiSyncService.onMessage((message) => {
      if (!id || message.tokenId !== id) return;

      switch (message.type) {
        case 'add_reaction':
          // Update local state when another user adds a reaction
          if (message.reaction) {
            const emoji = message.reaction.emoji as ChartEmoji;
            setReactionCounts(prev => ({
              ...prev,
              [emoji === '🚀' ? 'rocket' :
               emoji === '🔥' ? 'fire' :
               emoji === '💎' ? 'diamond' : 'skull']:
               prev[emoji === '🚀' ? 'rocket' :
                   emoji === '🔥' ? 'fire' :
                   emoji === '💎' ? 'diamond' : 'skull'] + 1
            }));
          }
          break;

        case 'remove_reaction':
          // Update local state when another user removes a reaction
          if (message.reaction) {
            const emoji = message.reaction.emoji as ChartEmoji;
            setReactionCounts(prev => ({
              ...prev,
              [emoji === '🚀' ? 'rocket' :
               emoji === '🔥' ? 'fire' :
               emoji === '💎' ? 'diamond' : 'skull']:
               Math.max(0, prev[emoji === '🚀' ? 'rocket' :
                           emoji === '🔥' ? 'fire' :
                           emoji === '💎' ? 'diamond' : 'skull'] - 1)
            }));
          }
          break;

        case 'update_stats':
          // Update local state when stats are updated
          if (message.stats) {
            setReactionCounts({
              rocket: message.stats.rocketCount,
              fire: message.stats.fireCount,
              diamond: message.stats.diamondCount,
              skull: message.stats.skullCount
            });
          }
          break;
      }
    });

    return () => {
      unregister();
    };
  }, [id]);

  // Handle emoji reaction clicks
  const handleEmojiReaction = (emoji: ChartEmoji) => {
    if (!id) return;

    const userId = getUserId();

    if (userReaction === emoji) {
      // Remove reaction if clicking same emoji again
      removeReaction(id, emoji);
      emojiSyncService.broadcastRemoveReaction(id, emoji, userId);
      
      // Update local state
      const emojiKey = emoji === '🚀' ? 'rocket' :
                      emoji === '🔥' ? 'fire' :
                      emoji === '💎' ? 'diamond' : 'skull';
      setReactionCounts(prev => ({
        ...prev,
        [emojiKey]: Math.max(0, prev[emojiKey] - 1)
      }));
      setUserReaction(null);
      
      playSound('click');
    } else {
      // Add new reaction
      // If user had a different reaction before, remove it first
      if (userReaction) {
        removeReaction(id, userReaction);
        const oldEmojiKey = userReaction === '🚀' ? 'rocket' :
                          userReaction === '🔥' ? 'fire' :
                          userReaction === '💎' ? 'diamond' : 'skull';
        setReactionCounts(prev => ({
          ...prev,
          [oldEmojiKey]: Math.max(0, prev[oldEmojiKey] - 1)
        }));
      }
      
      addReaction(id, emoji);
      emojiSyncService.broadcastAddReaction(id, emoji, userId);
      
      // Update local state
      const emojiKey = emoji === '🚀' ? 'rocket' :
                      emoji === '🔥' ? 'fire' :
                      emoji === '💎' ? 'diamond' : 'skull';
      setReactionCounts(prev => ({
        ...prev,
        [emojiKey]: prev[emojiKey] + 1
      }));
      setUserReaction(emoji);
      
      playSound('success');
    }
  };
  
  const [tradeFilter, setTradeFilter] = useState<'all' | 'buy' | 'sell'>('all');
  const [activeTab, setActiveTab] = useState<'thread' | 'holders'>('thread');
  const [holdersView, setHoldersView] = useState<'map' | 'list'>('map');
  
  const [holders, setHolders] = useState(1204);
  const [newComment, setNewComment] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [commentImageUploading, setCommentImageUploading] = useState(false);
  const [commentImageProgress, setCommentImageProgress] = useState(0);
  const [commentImageStatus, setCommentImageStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const stickerButtonRef = useRef<HTMLButtonElement>(null);
  const [stickerPickerPosition, setStickerPickerPosition] = useState<{ top: number; left: number } | undefined>(undefined);

  // Moved useMemo here to avoid React Error #310
  const holdersList = useMemo(() => {
      if (!token) return [];
      
      const isGraduated = token.progress >= 100;
      const bondingCurvePercentage = isGraduated ? 0 : Math.max(0, 100 - (token.progress * 0.8));
      const ammPercentage = isGraduated ? 80 : 0;
      const userPercentage = token.supply > 0 ? (userTokenBalance / token.supply) * 100 : 0;

      return [
          ...(isGraduated ? [{ address: 'DogePump Liquidity', percentage: ammPercentage, isContract: true, color: '#ec4899', value: ammPercentage * token.supply * token.price / 100 }] : [{ address: 'Bonding Curve', percentage: bondingCurvePercentage, isContract: true, color: '#D4AF37', value: bondingCurvePercentage * token.supply * token.price / 100 }]),
          ...(userTokenBalance > 0 ? [{ address: 'You', percentage: userPercentage, isYou: true, color: '#00E054', value: userTokenBalance * token.price }] : []),
          { address: '0x71C...9A23', percentage: 4.2, color: '#60A5FA', value: 4.2 * token.supply * token.price / 100 },
          { address: '0x3a2...1B9f', percentage: 2.1, color: '#A78BFA', value: 2.1 * token.supply * token.price / 100 },
          { address: 'Others', percentage: Math.max(0, 100 - bondingCurvePercentage - ammPercentage - userPercentage - 6.3), color: '#4B5563', value: 0 },
      ];
  }, [token, userTokenBalance]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['thread', 'holders'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [location.search]);

  // Simulate Holders change
  useEffect(() => {
     if(token) {
        const interval = setInterval(() => {
           if(Math.random() > 0.7) {
              setHolders(prev => prev + (Math.random() > 0.3 ? 1 : -1));
           }
        }, 5000);
        return () => clearInterval(interval);
     }
  }, [token]);

  const handleQuickCopyTrade = (amount: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCopyTradeAmount(amount.toString());
    addToast('success', `Copied Buy for ${formatNumber(amount)} DC`, 'Settings Updated');
    playSound('click');
  };

  const handleCopyContract = () => {
    playSound('click');
    navigator.clipboard.writeText(token.contractAddress || '0x0000000000000000000000000000000000000'); 
    setCopiedContract(true);
    addToast('success', 'Contract address copied');
    setTimeout(() => setCopiedContract(false), 2000);
  };

  const handleShare = () => {
    if (!token) return;
    playSound('click');
    const text = `Just found $${token.ticker} on DogePump!\n\nMarket Cap: ${formatCurrency(token.marketCap)}\nProgress: ${token.progress.toFixed(2)}%\n\nThe next moonshot?\n\n#DogeChain #FairLaunch #DogePump\n`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`;
    window.open(twitterUrl, '_blank');
    addToast('success', 'Opening Twitter...');
  };

  const handleShareComment = (comment: any) => {
    if (!token || !comment) return;
    playSound('click');

    // Create shareable text for comment
    const commentText = comment.text.length > 200 ? comment.text.substring(0, 200) + '...' : comment.text;
    let shareText = `${resolveUsername(comment.user)} on $${token.ticker}:\n\n"${commentText}"`;

    // Include image information if present
    if (comment.imageUrl) {
      shareText += '\n\n[Image attached - visit page to view]';
    }

    shareText += `\n\nCheck out ${token.name} on DogePump!\n\n#DogeChain #Memecoin #DogePump\n`;

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(window.location.href + '?tab=thread')}`;
    window.open(twitterUrl, '_blank');
    addToast('success', 'Opening Twitter to share comment...');
  };

  const handleReportComment = (comment: any) => {
    if (!token) return;
    playSound('click');
    setReportedComment({
      commentId: comment.id,
      tokenId: token.id,
      commentUser: resolveUsername(comment.user)
    });
    setIsReportModalOpen(true);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate image upload before processing
      const validation = await validateImageUpload(file);
      if (!validation.valid) {
        addToast('error', validation.error!);
        return;
      }

      try {
        setCommentImageUploading(true);
        setCommentImageStatus('uploading');
        setCommentImageProgress(0);

        // Upload to backend
        const response = await backendService.uploadImage(file, (progress) => {
          setCommentImageProgress(progress);
        });
        
        if (response.success && response.image) {
          setSelectedImage(response.image.url);
          setCommentImageStatus('success');
          addToast('success', 'Image uploaded successfully');
          playSound('click');
        } else {
          throw new Error('Upload failed');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
        setCommentImageStatus('error');
        addToast('error', errorMessage);
      } finally {
        setCommentImageUploading(false);
      }
    }
  };

  const handleStickerSelect = (url: string, type: 'emoji' | 'sticker') => {
     if (type === 'emoji') {
       // Insert emoji into text area
       setNewComment(prev => prev + url);
       playSound('success');
     } else {
       // Handle sticker image
       setSelectedImage(url);
       playSound('success');
     }
     setShowStickerPicker(false);
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!newComment.trim() && !selectedImage) return;
    playSound('click');
    addComment(token.id, newComment, selectedImage || undefined);
    setNewComment('');
    setSelectedImage(null);
    addToast('success', 'Comment posted to thread');
  };

  const handlePet = (e: React.MouseEvent<HTMLImageElement>) => {
     e.stopPropagation();
     const rect = e.currentTarget.getBoundingClientRect();
     const x = e.clientX - rect.left;
     const y = e.clientY - rect.top;
     const id = Math.random().toString(36);
     setHearts(prev => [...prev, { id, x, y, rotation: (Math.random() - 0.5) * 45 }]);
     setTimeout(() => { setHearts(prev => prev.filter(h => h.id !== id)); }, 1000);
     playSound('success');
  };

  // Conditional Rendering Logic
  if (isLoading || !token) {
     if (!token && !isLoading) {
         return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
                <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center shadow-2xl border border-white/5">
                <SearchX size={64} className="text-gray-600" />
                </div>
                <div className="space-y-2">
                <h1 className="text-4xl font-comic font-bold text-white">Token Not Found</h1>
                <p className="text-gray-500 max-w-md mx-auto">The requested token could not be found on blockchain.</p>
                </div>
                <Link to="/">
                <Button className="rounded-full px-8">Return to Board</Button>
                </Link>
            </div>
         );
     }
     return (
        <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
           <Skeleton className="h-8 w-32 mb-4 rounded-full"/>
           <div className="grid lg:grid-cols-12 gap-8">
               <div className="lg:col-span-8 space-y-6">
                   <Skeleton className="h-48 w-full rounded-3xl" />
                   <Skeleton className="h-[500px] w-full rounded-3xl" />
               </div>
               <div className="lg:col-span-4 space-y-6">
                   <Skeleton className="h-[400px] w-full rounded-3xl" />
               </div>
           </div>
        </div>
     );
  }

  const isGraduated = token.progress >= 100;
  const currentPrice = token.price;
  document.title = `$${currentPrice.toFixed(6)} | ${token.ticker} - DogePump`;

  const displayedTrades = trades.filter(t => {
    if (tradeFilter === 'all') return true;
    return t.type === tradeFilter;
  });

  return (
    <>
      <Helmet>
        <title>{token ? `${token.ticker} | ${token.name} - DogePump` : 'Token Detail | DogePump'}</title>
        <meta name="description" content={token ? `${token.name} ($${token.ticker}) - ${token.description || 'View live price, chart, trading, and community sentiment for this memecoin on DogePump.'} Market cap: ${formatCurrency(token.marketCap)}, Progress: ${token.progress.toFixed(2)}%` : 'View token details, live price chart, trading history, and community sentiment on DogePump.'} />
        <link rel="canonical" href={token ? `https://dogepump.com/token/${token.id}` : 'https://dogepump.com'} />
        <meta property="og:title" content={token ? `${token.ticker} | ${token.name} - DogePump` : 'Token Detail | DogePump'} />
        <meta property="og:description" content={token ? `${token.name} ($${token.ticker}) - ${token.description || 'View live price, chart, trading, and community sentiment for this memecoin on DogePump.'} Market cap: ${formatCurrency(token.marketCap)}` : 'View token details, live price chart, trading history, and community sentiment on DogePump.'} />
        <meta property="og:url" content={token ? `https://dogepump.com/token/${token.id}` : 'https://dogepump.com'} />
        <meta property="og:image" content={token?.imageUrl || 'https://dogepump.com/og-image.png'} />
        <meta name="twitter:title" content={token ? `${token.ticker} | ${token.name} - DogePump` : 'Token Detail | DogePump'} />
        <meta name="twitter:description" content={token ? `${token.name} ($${token.ticker}) - ${token.description || 'View live price, chart, trading, and community sentiment for this memecoin on DogePump.'} Market cap: ${formatCurrency(token.marketCap)}` : 'View token details, live price chart, trading history, and community sentiment on DogePump.'} />
        <meta name="twitter:image" content={token?.imageUrl || 'https://dogepump.com/og-image.png'} />
      </Helmet>
      {/* Add bottom padding on mobile to prevent footer overlap with the sticky trade bar */}
      <div className="space-y-8 animate-fade-in relative -mt-12 pb-64 lg:pb-0 safe-area-pb">
      <AlertModal isOpen={isAlertModalOpen} onClose={() => setIsAlertModalOpen(false)} token={token} />
      <BoostModal isOpen={isBoostModalOpen} onClose={() => setIsBoostModalOpen(false)} onBoostComplete={handleBoostComplete} token={token} />
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setReportedComment(null);
        }}
        tokenName={token.name}
        commentId={reportedComment?.commentId}
        tokenId={reportedComment ? reportedComment.tokenId : token.id}
        commentUser={reportedComment?.commentUser}
        reportType={reportedComment ? 'comment' : 'token'}
      />
      <ExplorerModal
        trade={selectedTrade}
        token={token}
        onClose={() => setSelectedTrade(null)}
        onCopyTrade={(amount) => setCopyTradeAmount(amount.toString())}
      />
      {showConfetti && <Confetti />}
      <GraduationOverlay isOpen={showGraduation} onClose={() => setShowGraduation(false)} tokenName={token.name} ticker={token.ticker} imageUrl={token.imageUrl} />
      <MobileTradeBar token={token} />

      <Link to="/" onClick={() => playSound('click')} className="inline-flex items-center text-gray-500 hover:text-white transition-colors font-bold text-sm group mb-4">
        <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Board
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6 lg:order-1 order-1">
          
          {/* Header Card */}
          <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 flex flex-col shadow-xl relative overflow-hidden">
             {isGraduated && (
               <div className="absolute inset-0 z-0">
                  <div className="absolute inset-0 bg-gradient-to-r from-doge/10 to-transparent animate-pulse-slow"></div>
                  <div className="absolute -top-20 -right-20 w-64 h-64 bg-doge/20 blur-[60px]"></div>
               </div>
             )}
             <div className="flex flex-col md:flex-row gap-8 relative z-10 items-center md:items-start">
                <div
                  className="relative group/image shrink-0 cursor-pointer select-none"
                  onClick={(e) => { handlePet(e); openLightbox(token.imageUrl); }}
                >
                  <div className="relative w-24 h-24 rounded-3xl overflow-hidden shadow-2xl bg-gray-800">
                    <OptimizedImage
                      src={token.imageUrl}
                      alt={token.name}
                      className="w-full h-full object-cover relative z-10 active:scale-95 transition-transform"
                      loading="eager"
                      fetchPriority="high"
                    />
                  </div>
                    <div className="absolute bottom-0 right-0 z-20 bg-white text-black p-1 rounded-full text-[8px] font-bold opacity-0 group-hover/image:opacity-100 transition-opacity pointer-events-none">PET ME</div>
                    {hearts.map(heart => (
                       <div key={heart.id} className="absolute z-50 pointer-events-none animate-float-up text-pink-500" style={{ left: heart.x, top: heart.y, transform: `rotate(${heart.rotation}deg)` }}>
                          <Heart size={24} fill="#ec4899" />
                       </div>
                    ))}
                </div>

                <div className="flex-1 relative z-10 flex flex-wrap justify-center md:justify-between items-center gap-4">
                  <div className="flex-1 text-center md:text-left">
                    <h1 className="text-4xl md:text-5xl font-bold text-white font-comic leading-none">
                      {token.name}
                    </h1>
                    <div className="flex flex-col sm:flex-row sm:items-center items-center gap-2 sm:gap-3 mt-2">
                      <span className="text-gray-600 text-2xl font-sans font-medium tracking-wider">${token.ticker}</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleWatchlist(token.id)} className={`text-2xl transition-all ${isWatched ? 'text-doge scale-110' : 'text-gray-600 hover:text-gray-400'}`}><Star size={24} className={isWatched ? 'fill-doge' : ''} /></button>
                        <button onClick={() => setIsAlertModalOpen(true)} className={`text-2xl transition-all hover:text-white ${tokenAlerts.length > 0 ? 'text-doge' : 'text-gray-600'}`}><Bell size={24} className={tokenAlerts.length > 0 ? 'fill-doge' : ''} /></button>
                        <button key={`rocket-${boostTrigger}`} onClick={() => setIsBoostModalOpen(true)} className="text-2xl text-doge hover:text-white hover:scale-110 transition-all animate-shake-rocket"><Rocket size={24} /></button>
                      </div>
                    </div>
                    {/* Status badges - centered on mobile */}
                    <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                       {token.isLive && (
                           <div className="inline-flex items-center justify-center gap-1.5 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-600/30 animate-pulse">
                               <Radio size={14} /> LIVE NOW <span className="ml-1 opacity-70 font-mono text-[10px]">{token.streamViewers} Viewers</span>
                           </div>
                       )}
                       {isGraduated && <div className="inline-flex items-center justify-center gap-1.5 bg-doge text-black px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg shadow-doge/20 animate-bounce-subtle"><Crown size={14} fill="black" /> King of the Hill</div>}
                       {(token.boosts || 0) > 0 && <div key={`boosts-${boostTrigger}`} className="inline-flex items-center justify-center gap-1.5 bg-doge/20 text-doge border border-doge/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider animate-shake-vertical"><Flame size={14} /> {token.boosts} Boosts</div>}
                    </div>
                    {/* Creator and social links - centered on mobile */}
                    <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center sm:justify-start gap-3 mt-4 text-xs text-gray-400 font-mono uppercase tracking-wider">
                      <Link to={`/profile/${token.creator}`} className="flex items-center justify-center gap-2 bg-white/[0.02] px-3 py-1.5 rounded-lg border border-white/5 hover:border-doge/30 transition-colors group/creator">
                        <Users size={12} className="group-hover/creator:text-doge transition-colors" />
                        <span className="group-hover/creator:text-white transition-colors">Creator: {resolveUsername(token.creator)}</span>
                      </Link>
                      <div className="flex items-center justify-center gap-2 bg-white/[0.02] px-3 py-1.5 rounded-lg border border-white/5 hover:border-doge/30 transition-colors cursor-pointer select-none active:scale-95" onClick={handleCopyContract}>
                        <span>CA: {token.contractAddress ? `${token.contractAddress.slice(0, 10)}...${token.contractAddress.slice(-4)}` : '0x0000000000...0000'}</span>
                        {copiedContract ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                      </div>
                      <div className="flex items-center justify-center gap-2 sm:border-l sm:border-white/10 sm:pl-4">
                        {token.website && isValidUrl(token.website) && <a href={token.website} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded bg-white/5 hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center"><Globe size={14} /></a>}
                        {token.twitter && isValidUrl(token.twitter) && <a href={token.twitter} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded bg-white/5 hover:bg-white/10 hover:text-blue-400 transition-colors flex items-center justify-center"><XIcon size={14} /></a>}
                        {token.telegram && isValidUrl(token.telegram) && <a href={token.telegram} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded bg-white/5 hover:bg-white/10 hover:text-blue-500 transition-colors flex items-center justify-center"><Send size={14} /></a>}
                        {token.discord && isValidUrl(token.discord) && <a href={token.discord} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded bg-white/5 hover:bg-white/10 hover:text-purple-400 transition-colors flex items-center justify-center"><MessageCircle size={14} /></a>}
                        <button onClick={() => setIsReportModalOpen(true)} className="p-1.5 rounded bg-white/5 hover:bg-red-500/20 hover:text-red-500 text-gray-500 transition-colors flex items-center justify-center"><Flag size={14} /></button>
                      </div>
                    </div>
                  </div>
                  <div className="text-center md:text-right flex flex-col items-center md:items-end gap-2">
                    <div className="text-5xl font-mono text-white font-medium tracking-tighter text-glow flex items-center justify-center md:justify-end">$<AnimatedNumber value={currentPrice} /></div>
                    <div className={`text-sm font-bold inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded ${
                      priceChange24h >= 0
                        ? 'bg-green-900/20 text-green-400'
                        : 'bg-red-900/20 text-red-400'
                    }`}>
                      {priceChange24h >= 0 ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                      {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(1)}%
                    </div>
                  </div>
                </div>
             </div>

             {/* Section 2: Bonding Curve */}
             <div className="mt-8 pt-8 border-t border-white/5">
                <div className="space-y-6">
                   {/* Bonding Curve Progress */}
                   <div>
                      <div className="flex justify-between items-end mb-4">
                          <div>
                            <h3 className="font-bold text-xs uppercase tracking-[0.2em] text-gray-500 mb-2 flex items-center gap-2"><BarChart3 size={14}/> Bonding Curve</h3>
                            {isGraduated ? <div className="text-3xl font-mono text-doge font-bold">100% - COMPLETED</div> : <div className="text-3xl font-mono text-white font-medium">{token.progress.toFixed(2)}%</div>}
                          </div>
                          <div className="text-right">
                             <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Graduation Goal</div>
                             <div className="font-mono text-doge font-bold text-xl">{formatCurrency(GRADUATION_MARKETCAP_USD)}</div>
                          </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-black/60 rounded-full h-5 overflow-hidden border border-white/5 p-0.5">
                          <div className={`h-full rounded-full transition-all duration-1000 relative shadow-[0_0_20px_rgba(212,175,55,0.3)] ${isGraduated ? 'bg-doge w-full' : 'bg-gradient-to-r from-doge-dark to-doge'}`} style={{ width: `${Math.min(100, token.progress)}%` }}>
                             <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:10px_10px] animate-shimmer"></div>
                          </div>
                      </div>
                   </div>

                   {/* Stats Grid - Centered on mobile */}
                   <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-1 sm:gap-2 border-b border-white/5 pb-2">
                         <span className="text-gray-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Holders</span>
                         <FlashNumber value={holders} className="font-mono text-white text-sm sm:text-base font-bold" />
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-1 sm:gap-2 border-b border-white/5 pb-2">
                         <span className="text-gray-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Volume</span>
                         <FlashNumber value={token.volume} className="font-mono text-white text-sm sm:text-base font-bold" />
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-1 sm:gap-2">
                         <span className="text-gray-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Liquidity</span>
                         <FlashNumber value={token.virtualLiquidity} className="font-mono text-white text-sm sm:text-base font-bold" />
                      </div>
                   </div>
                </div>
             </div>

             {/* Section 3: Community Sentiment */}
             <div className="mt-6">
                <SentimentVote token={token} />
             </div>
          </div>

          {/* Live Stream Embed (Placeholder if watching, hidden if creator is using admin panel to stream) */}
          {token.isLive && !isCreator && (
              <div className="bg-black aspect-video rounded-3xl overflow-hidden border border-red-900/50 shadow-2xl relative group">
                  {/* Simulated Stream Content */}
                  <OptimizedImage
                    src={token.imageUrl}
                    alt={token.name}
                    className="w-full h-full object-cover blur-sm opacity-50"
                    loading="eager"
                    fetchPriority="low"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center space-y-2">
                          <Video size={48} className="text-red-500 mx-auto animate-pulse" />
                          <h3 className="text-xl font-bold text-white uppercase tracking-widest">Live Broadcast</h3>
                          <p className="text-gray-400 text-sm">Dev is streaming right now</p>
                      </div>
                  </div>
                  <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-wider animate-pulse flex items-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full"></div> LIVE
                  </div>
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur text-white px-3 py-1 rounded text-xs font-mono">
                      {token.streamViewers} Viewers
                  </div>
                  <div className="absolute bottom-4 left-4 text-white text-sm font-bold drop-shadow-md">
                      {token.name} Dev Stream
                  </div>
              </div>
          )}

          {/* Live Stream - Creator only - positioned above chart */}
          {isCreator && (
            <PersistentCameraStream token={token} showControls={true} autoStart={false} />
          )}

          {/* Chart Container */}
          <div ref={chartContainerRef} className={`bg-[#0A0A0A] border border-white/10 rounded-3xl shadow-2xl relative flex flex-col group transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-[200] rounded-none border-0' : 'min-h-[650px]'}`}>
             {/* Timeframe Selector & Indicators - Proper spacing on all devices */}
             <div className="absolute top-4 left-4 right-16 sm:right-16 z-20 flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-2 sm:gap-4">
                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-white/10 shadow-lg">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></div>
                  <span className="text-[9px] sm:text-[10px] font-bold text-gray-300 tracking-widest uppercase">Live</span>
                </div>
                <div className="flex bg-black/60 backdrop-blur-md rounded-full border border-white/10 p-0.5 sm:p-1 gap-0.5 sm:gap-1">
                   {(['1m', '5m', '15m', '1H', '4H', '1D', '1W'] as const).map(tf => (
                      <button key={tf} onClick={() => { setTimeframe(tf); playSound('click'); }} className={`px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-bold transition-all ${timeframe === tf ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>{tf}</button>
                   ))}
                </div>

                {/* Advanced Indicators Toggle - Always visible */}
                <div className="relative" ref={indicatorsMenuRef}>
                    {/* Data sufficiency checks for indicators */}
                    {(() => {
                        const dataCount = chartData.length;
                        const canShowRSI = dataCount >= 15; // RSI period (14) + 1
                        const canShowMACD = dataCount >= 26; // MACD slow period
                        const canShowStoch = dataCount >= 28; // StochRSI period (14) × 2

                        // Log data availability for debugging
                        if (indicators.rsi || indicators.macd || indicators.stoch) {
                            console.log('📊 Indicator Data Availability:', {
                                totalDataPoints: dataCount,
                                canShowRSI,
                                canShowMACD,
                                canShowStoch,
                                activeIndicators: {
                                    rsi: indicators.rsi,
                                    macd: indicators.macd,
                                    stoch: indicators.stoch
                                }
                            });
                        }

                        return null; // This is just for data checks, no rendering
                    })()}
                    <button onClick={() => setShowIndicatorsMenu(!showIndicatorsMenu)} className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-bold border transition-colors ${showIndicatorsMenu ? 'bg-doge/20 text-doge border-doge/50' : 'bg-black/60 text-gray-500 border-white/10 hover:text-white'}`}>
                        <Settings2 size={10} className="sm:w-3 sm:h-3" /> <span className="hidden xs:inline sm:inline">Indicators</span>
                    </button>
                    {showIndicatorsMenu && (() => {
                        const dataCount = chartData.length;
                        const canShowRSI = dataCount >= 15;
                        const canShowMACD = dataCount >= 26;
                        const canShowStoch = dataCount >= 28;

                        return (
                        <div className="absolute top-full left-0 mt-2 bg-[#111] border border-white/10 rounded-xl p-2 sm:p-3 shadow-xl z-50 w-36 sm:w-40 flex flex-col gap-1 sm:gap-2 animate-slide-up">
                            <span className="text-[8px] sm:text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-0.5 sm:mb-1">Overlays</span>
                            <button onClick={() => toggleIndicator('ema20')} className={`text-left text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded ${indicators.ema20 ? 'text-purple-400 bg-white/5' : 'text-gray-400 hover:text-white'}`}>EMA 20</button>
                            <button onClick={() => toggleIndicator('ema50')} className={`text-left text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded ${indicators.ema50 ? 'text-blue-400 bg-white/5' : 'text-gray-400 hover:text-white'}`}>EMA 50</button>
                            <button onClick={() => toggleIndicator('ema200')} className={`text-left text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded ${indicators.ema200 ? 'text-yellow-400 bg-white/5' : 'text-gray-400 hover:text-white'}`}>EMA 200</button>
                            <button onClick={() => toggleIndicator('bb')} className={`text-left text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded ${indicators.bb ? 'text-orange-400 bg-white/5' : 'text-gray-400 hover:text-white'}`}>Bollinger</button>
                            <div className="h-px bg-white/10 my-0.5 sm:my-1"></div>
                            <span className="text-[8px] sm:text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-0.5 sm:mb-1">Oscillators</span>
                            <button
                                onClick={() => toggleIndicator('rsi')}
                                disabled={!canShowRSI}
                                className={`text-left text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded ${indicators.rsi ? 'text-cyan-400 bg-white/5' : canShowRSI ? 'text-gray-400 hover:text-white' : 'text-gray-600 cursor-not-allowed'}`}
                                title={!canShowRSI ? `Need at least 15 data points for RSI (current: ${dataCount})` : 'Relative Strength Index'}
                            >
                                RSI {!canShowRSI && <span className="text-[8px] ml-1 text-gray-600">({dataCount}/15)</span>}
                            </button>
                            <button
                                onClick={() => toggleIndicator('macd')}
                                disabled={!canShowMACD}
                                className={`text-left text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded ${indicators.macd ? 'text-pink-400 bg-white/5' : canShowMACD ? 'text-gray-400 hover:text-white' : 'text-gray-600 cursor-not-allowed'}`}
                                title={!canShowMACD ? `Need at least 26 data points for MACD (current: ${dataCount})` : 'Moving Average Convergence Divergence'}
                            >
                                MACD {!canShowMACD && <span className="text-[8px] ml-1 text-gray-600">({dataCount}/26)</span>}
                            </button>
                            <button
                                onClick={() => toggleIndicator('stoch')}
                                disabled={!canShowStoch}
                                className={`text-left text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded ${indicators.stoch ? 'text-lime-400 bg-white/5' : canShowStoch ? 'text-gray-400 hover:text-white' : 'text-gray-600 cursor-not-allowed'}`}
                                title={!canShowStoch ? `Need at least 28 data points for Stoch RSI (current: ${dataCount})` : 'Stochastic Relative Strength Index'}
                            >
                                Stoch RSI {!canShowStoch && <span className="text-[8px] ml-1 text-gray-600">({dataCount}/28)</span>}
                            </button>
                        </div>
                        );
                    })()}
                </div>
             </div>

             {/* Fullscreen Button */}
             <div className="absolute top-4 right-4 z-30">
                <button
                  onClick={toggleFullscreen}
                  className="bg-black/60 backdrop-blur-md p-1.5 sm:p-2 rounded-lg border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                   {isFullscreen ? <Minimize2 size={14} className="sm:w-4 sm:h-4" /> : <Maximize2 size={14} className="sm:w-4 sm:h-4" />}
                </button>
             </div>

             {/* Chart area - Adjust padding for mobile */}
             <div className="w-full pt-20 sm:pt-16 pb-2 px-1 sm:px-2 relative">
               <CandleChart
                  data={chartData}
                  showEMA20={indicators.ema20}
                  showEMA50={indicators.ema50}
                  showEMA200={indicators.ema200}
                  showBollinger={indicators.bb}
                  showRSI={indicators.rsi}
                  showMACD={indicators.macd}
                  showStochRSI={indicators.stoch}
                  showVolume={true}
                  userAverageBuyPrice={userAverageBuyPrice}
                  activeOrders={tokenOrders}
                  priceAlerts={tokenAlerts}
               />
               {/* Chart Reactions Overlay */}
               <ChartReactions
                 counts={reactionCounts}
                 userReaction={userReaction}
                 onReactionClick={handleEmojiReaction}
                 visible={true}
               />
             </div>
          </div>

          {/* Trades Section - moved below chart for both desktop and mobile */}
          <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 shadow-lg">
             <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center gap-2 text-gray-400"><History size={14} /><h3 className="font-bold text-xs uppercase tracking-wider">Trades</h3></div>
                <div className="flex gap-1 bg-black/40 p-0.5 rounded-lg border border-white/5">
                   {(['all', 'buy', 'sell'] as const).map(type => (
                      <button key={type} onClick={() => { setTradeFilter(type); playSound('click'); }} className={`text-[9px] uppercase font-bold px-2 py-1 rounded transition-colors ${tradeFilter === type ? 'bg-white/10 text-white' : 'text-gray-600 hover:text-gray-400'}`}>{type}</button>
                   ))}
                </div>
             </div>
             <div className="overflow-hidden flex flex-col max-h-[400px]">
                <div className="flex text-[9px] text-gray-600 uppercase tracking-wider px-2 mb-2 font-bold select-none border-b border-white/5 pb-2">
                  <div className="w-1/4">Time</div><div className="w-1/4 text-right">Amount</div><div className="w-1/4 text-right">Price</div><div className="w-1/4 text-right">Copy</div>
                </div>
                <div className="overflow-y-auto flex-1 pr-1 space-y-0.5 custom-scrollbar">
                  {displayedTrades.length > 0 ? displayedTrades.map((trade) => (
                    <div key={trade.id} onClick={() => { setSelectedTrade(trade); playSound('click'); }} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-white/5 transition-colors text-[10px] group font-mono animate-fade-in cursor-pointer">
                      <div className="w-1/4 text-gray-500 group-hover:text-gray-300 transition-colors">{timeAgo(trade.timestamp)}</div>
                      <div className={`w-1/4 text-right font-bold ${trade.type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>{formatNumber(trade.amountToken)}</div>
                      <div className="w-1/4 text-right text-white group-hover:text-doge transition-colors">${trade.price.toFixed(6)}</div>
                      <div className="w-1/4 flex justify-end">
                         {trade.type === 'buy' && <button onClick={(e) => handleQuickCopyTrade(trade.amountDC, e)} className="p-1 rounded bg-white/5 hover:bg-doge/20 hover:text-doge text-gray-500 transition-colors opacity-100" title="Copy Trade Amount"><Copy size={10} /></button>}
                      </div>
                    </div>
                  )) : <div className="text-center text-gray-600 text-[10px] py-4">No trades yet</div>}
                </div>
             </div>
          </div>

          {/* DEX Tile - Mobile and tablet only, hidden on desktop (shows in sidebar instead) */}
          <div
            id="mobile-trade-section"
            className="lg:hidden bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_50px_-15px_rgba(0,0,0,0.7)] ring-1 ring-white/5 relative scroll-mt-24"
          >
              {isGraduated ? <DogeSwap token={token} /> : <TradeForm token={token} initialAmount={copyTradeAmount} />}
          </div>

          {tokenOrders.length > 0 && (
             <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 shadow-lg animate-fade-in">
                 <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2"><List size={16} /> Active Orders</h3>
                 <div className="space-y-2">
                    {tokenOrders.map(order => (
                       <div key={order.id} className="bg-white/[0.03] border border-white/5 rounded-xl p-4 flex items-center justify-between group hover:bg-white/[0.05] transition-colors">
                          <div>
                               <div className="flex items-center gap-2 mb-1">
                                   <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${order.type === 'buy' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{order.mode} {order.type}</span>
                                   <span className="text-gray-400 text-xs">{timeAgo(order.timestamp)}</span>
                               </div>
                               <div className="text-white font-mono font-bold text-sm">{formatNumber(order.amount)} {order.type === 'buy' ? 'DC' : token.ticker} @ ${order.price.toFixed(6)}</div>
                          </div>
                          <Button size="sm" onClick={() => cancelOrder(order.id)} className="bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-500 border-0">Cancel</Button>
                       </div>
                    ))}
                 </div>
             </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 lg:order-2 order-2">
          {/* DEX Tile - Desktop only, shows in sidebar */}
          <div className="relative hidden lg:block z-30">
              {isGraduated ? <DogeSwap token={token} /> : (
                 <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_50px_-15px_rgba(0,0,0,0.7)] ring-1 ring-white/5 relative">
                   <TradeForm token={token} initialAmount={copyTradeAmount} />
                 </div>
              )}
          </div>

          {/* Stats tiles - only DogeGuard remains in sidebar */}
          <div className="space-y-6">
             <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 shadow-lg">
                <DogeGuard token={token} />
             </div>
             {isCreator && (
                 <div ref={creatorAdminRef} className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 shadow-lg">
                     <CreatorAdmin token={token} defaultTab={actionParam === 'stream' ? 'stream' : 'security'} />
                 </div>
             )}
          </div>

          {tokenOrders.length > 0 && (
             <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 shadow-lg animate-fade-in">
                 <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2"><List size={16} /> Active Orders</h3>
                 <div className="space-y-2">
                    {tokenOrders.map(order => (
                       <div key={order.id} className="bg-white/[0.03] border border-white/5 rounded-xl p-4 flex items-center justify-between group hover:bg-white/[0.05] transition-colors">
                          <div>
                               <div className="flex items-center gap-2 mb-1">
                                   <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${order.type === 'buy' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{order.mode} {order.type}</span>
                                   <span className="text-gray-400 text-xs">{timeAgo(order.timestamp)}</span>
                               </div>
                               <div className="text-white font-mono font-bold text-sm">{formatNumber(order.amount)} {order.type === 'buy' ? 'DC' : token.ticker} @ ${order.price.toFixed(6)}</div>
                          </div>
                          <Button size="sm" onClick={() => cancelOrder(order.id)} className="bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-500 border-0">Cancel</Button>
                       </div>
                    ))}
                 </div>
             </div>
          )}
        </div>
      </div>

      <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 shadow-lg">
         <div className="flex items-center gap-6 mb-6 border-b border-white/5 pb-1 overflow-x-auto">
           {['thread', 'holders'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-doge shadow-[0_0_10px_#D4AF37]"></div>}
              </button>
           ))}
         </div>

         {activeTab === 'thread' && (
           <div className="animate-fade-in">
              <form onSubmit={handlePostComment} className="flex gap-4 mb-8 relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-doge-dark to-doge flex items-center justify-center shrink-0">
                    <div className="w-9 h-9 bg-black rounded-full flex items-center justify-center"><span className="text-xs font-bold text-doge">YOU</span></div>
                  </div>
                  <div className="flex-1">
                    <textarea
                      id="token-comment-textarea"
                      name="token-comment-textarea"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Type a message or upload a meme..."
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-doge/50 outline-none transition-all resize-none h-20"
                      onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) handlePostComment(e); }}
                    />
 
                    {/* Image Upload Progress */}
                    {commentImageUploading && (
                      <div className="mt-2">
                        <UploadProgress
                          progress={commentImageProgress}
                          fileName="image.jpg"
                          status={commentImageStatus}
                        />
                      </div>
                    )}
 
                    {/* Image Preview */}
                    {selectedImage && !commentImageUploading && (
                      <div className="mt-2 relative group">
                        <div className="max-w-full h-32 rounded-lg overflow-hidden border border-white/10 bg-gray-800">
                          <OptimizedImage
                            src={selectedImage}
                            alt="Selected image"
                            className="w-full h-full object-cover"
                            loading="eager"
                            fetchPriority="high"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedImage(null)}
                          className="absolute top-2 right-2 bg-black/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
 
                    <div className="flex justify-between items-center mt-2 px-1">
                      <div className="flex items-center gap-3 ml-auto">
                          <div className="relative">
                              <button
                                type="button"
                                ref={stickerButtonRef}
                                onClick={() => {
                                  logger.debug('TOKEN_PAGE', 'StickerPicker button clicked', { currentState: showStickerPicker });
                                  if (!showStickerPicker && stickerButtonRef.current) {
                                    const rect = stickerButtonRef.current.getBoundingClientRect();
                                    const pickerHeight = 400; // Approximate height of StickerPicker
                                    const pickerWidth = 320; // Approximate width of StickerPicker
                                    const viewportHeight = window.innerHeight;
                                    const viewportWidth = window.innerWidth;

                                    let top = rect.bottom + 8;
                                    let left = rect.left;

                                    // Check if picker would go below viewport
                                    if (top + pickerHeight > viewportHeight - 20) {
                                      // Position above button instead
                                      top = rect.top - pickerHeight - 8;
                                    }

                                    // Check if picker would go off right edge
                                    if (left + pickerWidth > viewportWidth - 20) {
                                      left = viewportWidth - pickerWidth - 20;
                                    }

                                    // Ensure minimum left position
                                    if (left < 20) {
                                      left = 20;
                                    }

                                    logger.debug('TOKEN_PAGE', 'StickerPicker position calculated', { top, left, viewportHeight, viewportWidth });
                                    setStickerPickerPosition({ top, left });
                                  }
                                  setShowStickerPicker(!showStickerPicker);
                                  logger.debug('TOKEN_PAGE', 'StickerPicker state toggled', { newState: !showStickerPicker });
                                }}
                                className="text-gray-500 hover:text-yellow-400 transition-colors flex items-center justify-center"
                              >
                                <SmilePlus size={18} />
                              </button>
                              <StickerPicker
                                isOpen={showStickerPicker}
                                onClose={() => setShowStickerPicker(false)}
                                onSelect={handleStickerSelect}
                                position={stickerPickerPosition}
                              />
                          </div>
                          <input id="token-comment-image" name="token-comment-image" type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileSelect} disabled={commentImageUploading} />
                          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={commentImageUploading} className="text-gray-500 hover:text-doge transition-colors flex items-center justify-center disabled:opacity-50"><Image size={18} /></button>
                          <button type="submit" disabled={!newComment.trim() && !selectedImage || commentImageUploading} className="bg-doge text-black px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-doge-light transition-colors disabled:opacity-50">Post Reply</button>
                      </div>
                    </div>
                  </div>
              </form>
              <div className="space-y-6">
                  {comments.length > 0 ? comments.map((comment) => (
                    <div key={comment.id} className="flex gap-4 group animate-slide-up">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border bg-white/5 border-white/10`}><span className="text-xs font-bold text-gray-500">{comment.user.slice(0,2)}</span></div>
                      <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-sm font-bold transition-colors cursor-pointer text-gray-300 group-hover:text-doge`}>{resolveUsername(comment.user)}</span>
                            {comment.badges && comment.badges.map((b, idx) => <Badge key={`${comment.id}-${b}-${idx}`} type={b} size="sm" showTooltip={true} />)}
                            <span className="text-[10px] text-gray-600 font-mono ml-auto">{timeAgo(comment.timestamp)}</span>
                          </div>
                          <div className="text-sm text-gray-300 leading-relaxed bg-white/[0.02] p-3 rounded-tr-xl rounded-b-xl border border-white/5">
                            {comment.imageUrl && <div className="mb-3 rounded-lg overflow-hidden max-w-xs cursor-pointer bg-gray-800" onClick={() => openLightbox(comment.imageUrl!)}><OptimizedImage src={comment.imageUrl} alt="Attachment" className="w-full h-auto object-cover hover:scale-105 transition-transform" loading="lazy" fetchPriority="low" /></div>}
                            <FormattedText text={comment.text} />
                            {comment.tradeAction && <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-4"><div className="text-xs text-gray-400 font-bold uppercase">Suggestion:</div><div className={`px-4 py-1.5 rounded-lg font-bold text-xs uppercase flex items-center gap-2 ${comment.tradeAction.type === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{comment.tradeAction.type.toUpperCase()} {formatNumber(comment.tradeAction.amount)}</div></div>}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 font-bold uppercase tracking-wider">
                            <button onClick={() => likeComment(comment.id)} className="flex items-center gap-1 hover:text-red-500 transition-colors"><Heart size={12} className={comment.likes > 0 ? 'fill-red-500 text-red-500' : ''} /> {comment.likes}</button>
                            <button onClick={() => handleShareComment(comment)} className="flex items-center gap-1 hover:text-blue-500 transition-colors"><Share2 size={12} /> Share</button>
                            <button onClick={() => handleReportComment(comment)} className="flex items-center gap-1 hover:text-red-400 transition-colors" title="Report comment"><Flag size={12} /></button>
                          </div>
                      </div>
                    </div>
                  )) : <div className="text-center text-gray-500 py-10 font-mono text-sm">No comments yet. Be the first!</div>}
              </div>
           </div>
         )}
          
         {activeTab === 'holders' && (
           <div className="animate-fade-in">
              <div className="flex justify-end mb-4">
                 <div className="bg-white/5 p-1 rounded-lg flex gap-1">
                    <button onClick={() => setHoldersView('map')} className={`p-1.5 rounded-md ${holdersView === 'map' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}><PieChart size={16} /></button>
                    <button onClick={() => setHoldersView('list')} className={`p-1.5 rounded-md ${holdersView === 'list' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}><List size={16} /></button>
                 </div>
              </div>
              {holdersView === 'map' ? (
                 <div className="grid md:grid-cols-2 gap-8 items-start">
                    <div className="h-[400px] relative rounded-3xl overflow-hidden shadow-2xl"><BubbleMap holders={holdersList} /></div>
                    <div className="space-y-4">
                       <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-white text-lg">Distribution</h3><span className="text-gray-500 text-xs uppercase font-bold tracking-wider">{holders.toLocaleString()} Holders</span></div>
                       <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                          {holdersList.map((holder, idx) => (
                             <div key={idx} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5 hover:border-doge/20 transition-colors group">
                                <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: holder.color }}></div><span className={`font-mono text-sm ${holder.isYou ? 'text-green-400 font-bold' : holder.isContract ? 'text-doge font-bold' : 'text-gray-300'}`}>{resolveUsername(holder.address)}</span>{holder.isContract && <Rocket size={10} className="text-doge" />}</div>
                                <div className="font-mono font-bold text-white">{holder.percentage.toFixed(2)}%</div>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
              ) : (
                 <div className="overflow-hidden rounded-2xl border border-white/5">
                    <table className="w-full text-left text-sm">
                       <thead className="bg-white/[0.03] text-gray-500 text-xs font-bold uppercase tracking-wider"><tr><th className="px-4 py-3">Rank</th><th className="px-4 py-3">Address</th><th className="px-4 py-3 text-right">Balance</th><th className="px-4 py-3 text-right">% Supply</th><th className="px-4 py-3 text-right">Value</th></tr></thead>
                       <tbody className="divide-y divide-white/5">
                          {holdersList.map((holder, idx) => (
                             <tr key={idx} className="hover:bg-white/[0.02]">
                                <td className="px-4 py-3 text-gray-500 font-mono">#{idx + 1}</td>
                                <td className={`px-4 py-3 font-mono font-bold ${holder.isContract ? 'text-doge' : holder.isYou ? 'text-green-400' : 'text-gray-300'}`}>
                                    {holder.isContract ? (
                                        <span>{resolveUsername(holder.address)} (Contract)</span>
                                    ) : (
                                        <Link to={`/profile/${holder.isYou ? '' : holder.address}`} className="hover:underline hover:text-white transition-colors">
                                            {resolveUsername(holder.address)} {holder.isYou && '(You)'}
                                        </Link>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right text-gray-400 font-mono">{formatNumber((holder.percentage / 100) * token.supply)}</td>
                                <td className="px-4 py-3 text-right text-white font-mono">{holder.percentage.toFixed(2)}%</td>
                                <td className="px-4 py-3 text-right text-green-400 font-mono">{formatCurrency(holder.value || 0)}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              )}
           </div>
         )}
      </div>
    </div>
      
     
    </>
  );
};

export default TokenDetail;
