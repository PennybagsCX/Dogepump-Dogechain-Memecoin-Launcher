import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Trophy, TrendingUp, Medal, User, Crown, Flame, Search, ChevronDown } from 'lucide-react';
import { formatAddress, formatCurrency, formatNumber } from '../services/web3Service';
import { Link } from 'react-router-dom';
import { useStore } from '../contexts/StoreContext';
import { Button } from '../components/Button';
import { playSound } from '../services/audio';
import { LEADERBOARD_PAGE_SIZE, TraderStats, BurnerStats, CreatorStats, LeaderboardEntry } from '../types';
import { Breadcrumb } from '../components/Breadcrumb';

/**
 * Leaderboard Component
 *
 * Displays a "Hall of Fame" with three ranking categories:
 * - Top Traders: Ranked by trading volume and trade count
 * - Top Creators: Ranked by total market cap of tokens created
 * - Top Burners: Ranked by total value of tokens burned
 *
 * Features:
 * - Tab switching between categories
 * - Search filtering by address/username
 * - Podium display for top 3 users
 * - Paginated list with load more
 * - Highlights current user
 *
 * @component
 * @returns {JSX.Element} Rendered leaderboard page
 */
const Leaderboard: React.FC = () => {
  const { trades, tokens, userProfile, resolveUsername, userAddress } = useStore();
  const [activeTab, setActiveTab] = useState<'traders' | 'creators' | 'burners'>('traders');
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(LEADERBOARD_PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // --- Data Validation ---

  // Validate trade structure
  const isValidTrade = useCallback((trade: any): trade is { id: string; user: string; type: string; amountDC: number; amountToken: number; price: number } => {
    return !!(
      trade?.id &&
      trade?.user &&
      typeof trade?.amountDC === 'number' &&
      trade?.amountDC >= 0 &&
      typeof trade?.amountToken === 'number' &&
      typeof trade?.price === 'number' &&
      ['buy', 'sell', 'burn'].includes(trade?.type)
    );
  }, []);

  // Validate token structure
  const isValidToken = useCallback((token: any): token is { id: string; creator: string; marketCap: number } => {
    return !!(
      token?.id &&
      token?.creator &&
      typeof token?.marketCap === 'number' &&
      token?.marketCap >= 0
    );
  }, []);

  // Safe username resolution with error handling
  const safeResolveUsername = useCallback((address: string): string => {
    try {
      return resolveUsername(address);
    } catch (error) {
      console.error('[Leaderboard] Error resolving username:', error);
      return formatAddress(address);
    }
  }, [resolveUsername]);

  // Normalize address for comparison (handles legacy "You" strings)
  const normalizeAddress = useCallback((address: string): string => {
    if (address === 'You') return userAddress || 'You';
    return address;
  }, [userAddress]);

  // Sanitize username for display
  const sanitizeUsername = useCallback((username: string): string => {
    if (!username) return 'Unknown';
    // Remove any HTML tags and special characters that could be used for XSS
    return username.replace(/[<>]/g, '').trim();
  }, []);

  // --- Aggregation Logic ---

  const leaderboardData = useMemo(() => {
    // Early return if data not ready
    if (!trades?.length || !tokens?.length) {
      return { traders: [], creators: [], burners: [] };
    }

    // 1. Top Traders (Volume)
    const traderStats: Record<string, TraderStats> = {};

    // 2. Top Burners (Burn Amount)
    const burnerStats: Record<string, BurnerStats> = {};

    // Aggregate trade data
    trades.forEach((t: any) => {
      if (!isValidTrade(t)) {
        console.warn('[Leaderboard] Invalid trade:', t);
        return;
      }

      const user = t.user;

      // Trader Stats
      if (!traderStats[user]) traderStats[user] = { address: user, volume: 0, trades: 0 };
      traderStats[user].volume += t.amountDC;
      traderStats[user].trades += 1;

      // Burner Stats
      if (t.type === 'burn') {
        if (!burnerStats[user]) burnerStats[user] = { address: user, burned: 0, count: 0 };
        // Estimate burn value in DC at time of trade (price * amount)
        const burnValue = t.amountToken * t.price;
        burnerStats[user].burned += burnValue;
        burnerStats[user].count += 1;
      }
    });

    // 3. Top Creators (Market Cap Generated)
    const creatorStats: Record<string, CreatorStats> = {};

    tokens.forEach((t: any) => {
      if (!isValidToken(t)) {
        console.warn('[Leaderboard] Invalid token:', t);
        return;
      }

      const user = t.creator;
      if (!creatorStats[user]) creatorStats[user] = { address: user, marketCapGen: 0, launched: 0 };
      creatorStats[user].marketCapGen += t.marketCap;
      creatorStats[user].launched += 1;
    });

    // Convert to Arrays & Sort
    const currentUserAddr = userAddress || '';

    const traders = Object.values(traderStats)
      .sort((a, b) => b.volume - a.volume)
      .map((item, i) => ({
        rank: i + 1,
        ...item,
        username: sanitizeUsername(safeResolveUsername(item.address)),
        metric: formatNumber(item.volume) + ' DC',
        subMetric: item.trades + ' Trades',
        avatar: normalizeAddress(item.address) === currentUserAddr ? userProfile?.avatarUrl : undefined
      }));

    const creators = Object.values(creatorStats)
      .sort((a, b) => b.marketCapGen - a.marketCapGen)
      .map((item, i) => ({
        rank: i + 1,
        ...item,
        username: sanitizeUsername(safeResolveUsername(item.address)),
        metric: formatCurrency(item.marketCapGen),
        subMetric: item.launched + ' Launched',
        avatar: normalizeAddress(item.address) === currentUserAddr ? userProfile?.avatarUrl : undefined
      }));

    const burners = Object.values(burnerStats)
      .sort((a, b) => b.burned - a.burned)
      .map((item, i) => ({
        rank: i + 1,
        ...item,
        username: sanitizeUsername(safeResolveUsername(item.address)),
        metric: formatNumber(item.burned) + ' DC',
        subMetric: item.count + ' Burns',
        avatar: normalizeAddress(item.address) === currentUserAddr ? userProfile?.avatarUrl : undefined
      }));

    // Only add mock data in development mode
    if (import.meta.env.DEV) {
      if (traders.length < 3) {
        traders.push(
          { rank: traders.length + 1, address: '0xElon...Doge', username: 'ElonMuskOdor', volume: 500000, trades: 420, metric: '500k DC', subMetric: '420 Trades', avatar: undefined },
          { rank: traders.length + 2, address: '0xMoon...Boi', username: 'LamboSoon', volume: 250000, trades: 69, metric: '250k DC', subMetric: '69 Trades', avatar: undefined }
        );
      }
      if (creators.length < 3) {
        creators.push({ rank: creators.length + 1, address: '0xDev...Chad', username: 'BasedDev', marketCapGen: 1000000, launched: 5, metric: '$1.0M', subMetric: '5 Launched', avatar: undefined });
      }
    }

    return { traders, creators, burners };
  }, [trades, tokens, userProfile, userAddress, safeResolveUsername, sanitizeUsername, normalizeAddress, isValidTrade, isValidToken]);

  const rawData = leaderboardData[activeTab];

  // Memoize filtered data for performance
  const filteredData = useMemo(() => {
    if (!search) return rawData;

    const searchLower = search.toLowerCase();
    const currentUserAddr = userAddress || '';

    return rawData.filter(item => {
      const displayName = item.address === currentUserAddr ? (userProfile?.username || 'You') : item.username;
      return displayName.toLowerCase().includes(searchLower) ||
             item.address.toLowerCase().includes(searchLower);
    });
  }, [rawData, search, userProfile, userAddress]);

  const topThree = filteredData.slice(0, 3);
  const rest = filteredData.slice(3, visibleCount + 3);
  const hasMore = (visibleCount + 3) < filteredData.length;

  // Handle tab change with state reset
  const handleTabChange = useCallback((tab: 'traders' | 'creators' | 'burners') => {
    setActiveTab(tab);
    setVisibleCount(LEADERBOARD_PAGE_SIZE);
    setSearch(''); // Clear search on tab change
    playSound('click');
  }, []);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);

    // Simulate network delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300));

    setVisibleCount(prev => prev + LEADERBOARD_PAGE_SIZE);
    setIsLoadingMore(false);
    playSound('click');
  }, [isLoadingMore, hasMore]);

  // --- Loading State Management ---

  // Set loading to false when data is ready
  useEffect(() => {
    if (trades?.length > 0 && tokens?.length > 0) {
      setIsLoading(false);
    }
  }, [trades, tokens]);

  // --- Helper Functions ---

  // Helper for deterministic colors (theme-consistent: gold, purple, orange, warm tones)
  const getAvatarColor = (str: string) => {
      const colors = ['bg-gold', 'bg-doge', 'bg-orange-500', 'bg-yellow-500', 'bg-amber-500', 'bg-red-500'];
      const index = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return colors[index % colors.length];
  };

  const getThemeColor = () => {
      if (activeTab === 'traders') return 'text-gold';
      if (activeTab === 'creators') return 'text-doge'; // Purple
      if (activeTab === 'burners') return 'text-orange-500';
      return 'text-white';
  };

  const getBorderColor = () => {
      if (activeTab === 'traders') return 'border-gold';
      if (activeTab === 'creators') return 'border-doge';
      if (activeTab === 'burners') return 'border-orange-500';
      return 'border-white';
  };

  const getBgColor = () => {
      if (activeTab === 'traders') return 'bg-gold/20';
      if (activeTab === 'creators') return 'bg-doge/20';
      if (activeTab === 'burners') return 'bg-orange-500/20';
      return 'bg-white/20';
  };

  const currentThemeText = getThemeColor();
  const currentThemeBorder = getBorderColor();
  const currentThemeBg = getBgColor();

  // Loading state
  if (isLoading) {
    return (
      <>
        <Helmet>
          <title>Leaderboard | DogePump Dogechain</title>
          <meta name="description" content="Top traders, creators, and burners on DogePump Dogechain. Hall of Fame rankings updated in real-time." />
        </Helmet>
        <Breadcrumb items={[
          { name: 'Home', url: '/' },
          { name: 'Leaderboard', url: '/leaderboard' }
        ]} />
        <div className="flex items-center justify-center min-h-screen bg-[#0A0A0A]">
          <div className="text-center">
            <Trophy size={64} className="text-doge animate-pulse mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">Loading Hall of Fame...</h2>
            <p className="text-gray-400">Preparing leaderboard rankings</p>
          </div>
        </div>
      </>
    );
  }

  // Helper constant for current user address comparison
  const currentUserAddr = userAddress || '';

   return (
      <>
        <Helmet>
          <title>Leaderboard | DogePump Dogechain</title>
          <meta name="description" content="View top traders, creators, and token burners on DogePump. Track rankings, trading volume, and achievements on Dogechain." />
          <link rel="canonical" href="https://dogepump.com/leaderboard" />
          <meta property="og:title" content="Leaderboard | DogePump Dogechain" />
          <meta property="og:description" content="View top traders, creators, and token burners on DogePump. Track rankings, trading volume, and achievements on Dogechain." />
          <meta property="og:url" content="https://dogepump.com/leaderboard" />
          <meta name="twitter:title" content="Leaderboard | DogePump Dogechain" />
          <meta name="twitter:description" content="View top traders, creators, and token burners on DogePump. Track rankings, trading volume, and achievements on Dogechain." />
        </Helmet>
        <Breadcrumb
          items={[
            { name: 'Home', url: '/' },
            { name: 'Leaderboard', url: '/leaderboard' }
          ]}
        />
      <div className="w-full space-y-12 animate-fade-in pb-12">
       
       {/* Hero */}
      <div className="text-center relative py-8">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-doge/10 blur-[80px] rounded-full pointer-events-none"></div>
         <div className="inline-flex items-center justify-center w-20 h-20 bg-[#0A0A0A] border border-doge/20 rounded-3xl mb-6 shadow-[0_0_40px_rgba(212,175,55,0.2)] relative z-10 animate-float">
            <Trophy size={40} className="text-doge drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]" />
         </div>
         <h1 className="text-5xl md:text-6xl font-comic font-bold text-white mb-4 drop-shadow-xl relative z-10">
           Hall of <span className="text-doge">Fame</span>
         </h1>
         <p className="text-gray-400 max-w-lg mx-auto text-lg relative z-10">
           The top degens, creators, and diamond hands on Dogechain.
         </p>
      </div>

     {/* Tabs & Search */}
     <div className="flex flex-col items-center gap-8 mb-48 w-full">
         <div className="flex p-1.5 rounded-2xl justify-center w-full flex-wrap">
            <button
              onClick={() => handleTabChange('traders')}
              className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${activeTab === 'traders' ? 'bg-gold text-black shadow-[0_0_20px_rgba(212,175,55,0.3)] scale-105' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
               <TrendingUp size={16} /> <span className="hidden sm:inline">Top Traders</span><span className="sm:hidden">Traders</span>
            </button>
            <button
              onClick={() => handleTabChange('creators')}
              className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${activeTab === 'creators' ? 'bg-doge text-black shadow-[0_0_20px_rgba(147,51,234,0.3)] scale-105' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
               <Crown size={16} /> <span className="hidden sm:inline">Top Creators</span><span className="sm:hidden">Creators</span>
            </button>
            <button
              onClick={() => handleTabChange('burners')}
              className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${activeTab === 'burners' ? 'bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)] scale-105' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
               <Flame size={16} /> <span className="hidden sm:inline">Top Burners</span><span className="sm:hidden">Burners</span>
            </button>
         </div>

         <div className="relative w-full max-w-md px-4">
            <Search className="absolute left-6 sm:left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
               id="leaderboard-search"
               name="leaderboardSearch"
               type="text"
               placeholder="Search by address or name..."
               value={search}
               onChange={(e: { target: { value: string } }) => setSearch(e.target.value)}
               className="w-full bg-[#0A0A0A] border border-white/10 rounded-full py-3 pl-14 pr-6 text-white outline-none focus:border-doge/50 transition-all placeholder:text-gray-600 text-center"
            />
         </div>
      </div>

      {/* Podium (Hidden if searching) */}
     {!search && (
        <div className="flex flex-col md:flex-row justify-center items-center md:items-end gap-6 md:gap-12 min-h-[300px] md:min-h-[400px] mt-8 mb-32 px-4 w-full text-center md:text-left">
            {/* 2nd Place */}
            {topThree[1] && (
               <div className="order-2 md:order-1 flex flex-col items-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
                  <div className="relative mb-4 group">
                  <div className="w-24 h-24 rounded-full border-4 border-zinc-400 p-1 bg-[#0A0A0A] shadow-[0_0_30px_rgba(100,100,100,0.2)] overflow-hidden">
                     {topThree[1].avatar ? (
                           <img src={topThree[1].avatar} loading="lazy" decoding="async" className="w-full h-full rounded-full object-cover" alt="Rank 2" />
                     ) : (
                           <div className={`w-full h-full rounded-full flex items-center justify-center ${getAvatarColor(topThree[1].address)}`}>
                              <User size={32} className="text-white opacity-80"/>
                           </div>
                     )}
                  </div>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-zinc-400 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#0A0A0A] z-10">2</div>
                  </div>
                  <div className="text-center space-y-1 mb-4">
                  <Link to={`/profile/${topThree[1].address === currentUserAddr ? '' : topThree[1].address}`} className="font-bold text-white text-lg hover:text-doge transition-colors block">
                     {topThree[1].address === currentUserAddr ? userProfile?.username : topThree[1].username}
                  </Link>
                  <div className="text-zinc-500 font-mono text-[10px] bg-white/5 px-2 py-0.5 rounded inline-block">{formatAddress(topThree[1].address)}</div>
                  <div className="text-gray-400 font-mono text-sm pt-1">
                     {topThree[1].metric}
                  </div>
                  </div>
                  <div className="w-32 h-48 bg-gradient-to-t from-zinc-400/20 to-transparent rounded-t-2xl border-x border-t border-zinc-400/30 backdrop-blur-sm relative overflow-hidden group-hover:bg-zinc-400/10 transition-colors">
                  <div className="absolute bottom-4 left-0 right-0 text-center">
                     <Medal className="w-8 h-8 text-zinc-400 mx-auto opacity-50 mb-2" />
                     <div className="font-bold text-zinc-400 text-2xl">#2</div>
                  </div>
                  </div>
               </div>
            )}

            {/* 1st Place */}
            {topThree[0] && (
               <div className="order-1 md:order-2 flex flex-col items-center animate-slide-up z-10">
                  <div className="relative mb-6 flex justify-center">
                  <div className="absolute -top-12 flex justify-center w-full">
                     <Crown className={`w-12 h-12 ${currentThemeText} animate-bounce-subtle drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]`} />
                  </div>
                  <div className={`w-32 h-32 rounded-full border-4 ${currentThemeBorder} p-1 bg-[#0A0A0A] shadow-[0_0_50px_rgba(255,255,255,0.2)] relative overflow-hidden`}>
                     <div className={`absolute inset-0 rounded-full ${currentThemeBg} animate-ping opacity-20`}></div>
                     {topThree[0].avatar ? (
                           <img src={topThree[0].avatar} loading="lazy" decoding="async" className="w-full h-full rounded-full object-cover relative z-10" alt="Rank 1" />
                     ) : (
                           <div className={`w-full h-full rounded-full flex items-center justify-center relative z-10 ${getAvatarColor(topThree[0].address)}`}>
                              <User size={40} className="text-white opacity-80"/>
                           </div>
                     )}
                  </div>
                  <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 ${activeTab === 'traders' ? 'bg-gold text-black' : activeTab === 'creators' ? 'bg-doge text-black' : 'bg-orange-500 text-white'} font-bold w-10 h-10 rounded-full flex items-center justify-center border-4 border-[#0A0A0A] text-xl z-10`}>1</div>
                  </div>
                  <div className="text-center space-y-1 mb-4">
                  <Link to={`/profile/${topThree[0].address === currentUserAddr ? '' : topThree[0].address}`} className={`font-bold ${currentThemeText} text-xl hover:text-white transition-colors block`}>
                     {topThree[0].address === currentUserAddr ? userProfile?.username : topThree[0].username}
                  </Link>
                  <div className="text-gray-500 font-mono text-[10px] bg-white/5 px-2 py-0.5 rounded inline-block">{formatAddress(topThree[0].address)}</div>
                  <div className="text-white font-mono font-bold pt-1">
                     {topThree[0].metric}
                  </div>
                  <div className={`text-xs ${currentThemeText} opacity-60 uppercase tracking-widest font-bold`}>
                     {activeTab === 'burners' ? 'Chief Pyromaniac' : activeTab === 'creators' ? 'Top Launcher' : 'King of the Hill'}
                  </div>
                  </div>
                  <div className={`w-40 h-64 bg-gradient-to-t ${activeTab === 'traders' ? 'from-gold/30 to-transparent border-gold/30' : activeTab === 'creators' ? 'from-doge/30 to-transparent border-doge/30' : 'from-orange-500/30 to-transparent border-orange-500/30'} rounded-t-2xl border-x border-t backdrop-blur-md relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]`}>
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:10px_10px] animate-shimmer"></div>
                  <div className="absolute bottom-6 left-0 right-0 text-center">
                     <Trophy className={`w-12 h-12 ${currentThemeText} mx-auto mb-2 drop-shadow-lg`} />
                     <div className={`font-bold ${currentThemeText} text-4xl`}>#1</div>
                  </div>
                  </div>
               </div>
            )}

            {/* 3rd Place */}
            {topThree[2] && (
               <div className="order-3 flex flex-col items-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
                  <div className="relative mb-4 group">
                  <div className="w-24 h-24 rounded-full border-4 border-orange-700 p-1 bg-[#0A0A0A] shadow-[0_0_30px_rgba(194,65,12,0.2)] overflow-hidden">
                     {topThree[2].avatar ? (
                           <img src={topThree[2].avatar} loading="lazy" decoding="async" className="w-full h-full rounded-full object-cover" alt="Rank 3" />
                     ) : (
                           <div className={`w-full h-full rounded-full flex items-center justify-center ${getAvatarColor(topThree[2].address)}`}>
                              <User size={32} className="text-white opacity-80"/>
                           </div>
                     )}
                  </div>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-orange-700 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#0A0A0A] z-10">3</div>
                  </div>
                  <div className="text-center space-y-1 mb-4">
                  <Link to={`/profile/${topThree[2].address === currentUserAddr ? '' : topThree[2].address}`} className="font-bold text-white text-lg hover:text-doge transition-colors block">
                     {topThree[2].address === currentUserAddr ? userProfile?.username : topThree[2].username}
                  </Link>
                  <div className="text-gray-500 font-mono text-[10px] bg-white/5 px-2 py-0.5 rounded inline-block">{formatAddress(topThree[2].address)}</div>
                  <div className="text-gray-400 font-mono text-sm pt-1">
                     {topThree[2].metric}
                  </div>
                  </div>
                  <div className="w-32 h-36 bg-gradient-to-t from-orange-900/40 to-transparent rounded-t-2xl border-x border-t border-orange-700/30 backdrop-blur-sm relative overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  <div className="absolute bottom-4 left-0 right-0 text-center">
                     <Medal className="w-8 h-8 text-orange-700 mx-auto opacity-50 mb-2" />
                     <div className="font-bold text-orange-700 text-2xl">#3</div>
                  </div>
                  </div>
               </div>
            )}
         </div>
      )}

       {/* List */}
       <div className="w-full bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
         {/* Desktop Header */}
         <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-white/5 bg-white/[0.02] text-xs font-bold text-zinc-500 uppercase tracking-widest">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-5">User</div>
            <div className="col-span-3 text-right">{activeTab === 'traders' ? 'Volume' : activeTab === 'creators' ? 'Market Cap Gen' : 'Burned Value'}</div>
            <div className="col-span-3 text-right">{activeTab === 'traders' ? 'Trades' : activeTab === 'creators' ? 'Launched' : 'Burn Count'}</div>
         </div>
          <div className="divide-y divide-white/5">
             {(search ? filteredData : rest).length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 text-center">
                  <Trophy size={64} className="text-white/10 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">
                    {search ? 'No results found' : 'No rankings yet'}
                  </h3>
                  <p className="text-gray-400 mb-6">
                    {search ? 'Try adjusting your search terms' : 'Be the first to make it to the leaderboard!'}
                  </p>
                  {search && (
                    <Button onClick={() => setSearch('')} variant="secondary">Clear Search</Button>
                  )}
                </div>
             ) : (
                (search ? filteredData : rest).map((item) => (
                    <div key={item.rank} className={`group ${item.address === currentUserAddr ? 'bg-doge/5' : ''} hover:bg-white/[0.02] transition-colors`}>
                       {/* Mobile Layout */}
                       <div className="md:hidden flex items-center gap-3 px-4 py-3 w-full">
                          <div className="flex-shrink-0 w-8 text-center font-mono font-bold text-zinc-500 text-sm">
                             #{item.rank}
                          </div>
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                             {item.avatar ? (
                                <img src={item.avatar} loading="lazy" decoding="async" className="w-8 h-8 rounded-full object-cover flex-shrink-0" alt={`${item.username} avatar`} />
                             ) : (
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getAvatarColor(item.address)} flex-shrink-0`}>
                                   <User size={14} className="text-white" />
                                </div>
                             )}
                             <div className="min-w-0 flex-1">
                                <Link to={`/profile/${item.address === currentUserAddr ? '' : item.address}`} className={`font-bold text-sm ${item.address === currentUserAddr ? 'text-doge' : 'text-white'} group-hover:text-doge transition-colors block leading-tight truncate`}>
                                   {item.address === currentUserAddr ? userProfile?.username : item.username}
                                </Link>
                                <div className="text-[10px] text-zinc-500 font-mono mt-0.5 truncate">{formatAddress(item.address)}</div>
                             </div>
                          </div>
                          <div className="flex-shrink-0 ml-auto text-right">
                             <div className="font-mono text-gray-300 text-sm">{item.metric}</div>
                          </div>
                       </div>

                       {/* Desktop Layout */}
                       <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-4 items-center">
                          <div className="col-span-1 text-center font-mono font-bold text-zinc-500 text-base flex-shrink-0">
                             #{item.rank}
                          </div>
                          <div className="col-span-5 flex items-center gap-3 min-w-0">
                             {item.avatar ? (
                                <img src={item.avatar} loading="lazy" decoding="async" className="w-8 h-8 rounded-full object-cover flex-shrink-0" alt={`${item.username} avatar`} />
                             ) : (
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getAvatarColor(item.address)} flex-shrink-0`}>
                                   <User size={14} className="text-white" />
                                </div>
                             )}
                             <div className="min-w-0 flex-1">
                                <Link to={`/profile/${item.address === currentUserAddr ? '' : item.address}`} className={`font-bold text-base ${item.address === currentUserAddr ? 'text-doge' : 'text-white'} group-hover:text-doge transition-colors block leading-tight`}>
                                   {item.address === currentUserAddr ? userProfile?.username : item.username}
                                </Link>
                                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{formatAddress(item.address)}</div>
                             </div>
                          </div>
                          <div className="col-span-3 text-right font-mono text-gray-300 text-sm flex-shrink-0">
                             <div className="truncate">{item.metric}</div>
                          </div>
                          <div className="col-span-3 text-right text-gray-400 font-bold text-xs flex-shrink-0">
                             {item.subMetric}
                          </div>
                       </div>
                    </div>
                ))
             )}
          </div>
      </div>
      
       {hasMore && !search && (
           <div className="flex justify-center">
               <Button
                 onClick={handleLoadMore}
                 disabled={isLoadingMore}
                 variant="secondary"
                 className="rounded-full px-8 gap-2 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                   {isLoadingMore ? 'Loading...' : 'Load More'} <ChevronDown size={16} />
                </Button>
            </div>
        )}
    </div>
    </>
  );
};

export default Leaderboard;
