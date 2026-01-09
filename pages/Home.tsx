 
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Search, Flame, Clock, Trophy, ArrowRight, Crown, Coins, User, Star, LayoutGrid, List, ChevronDown, Radio, ChevronRight, ChevronLeft, ArrowLeftRight, Droplets, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../services/web3Service';
import { Button } from '../components/Button';
import { CardSkeleton, Skeleton } from '../components/Skeleton';
import { useStore } from '../contexts/StoreContext';
import { playSound } from '../services/audio';
import { TokenCard } from '../components/TokenCard';
import { TokenTable } from '../components/TokenTable';
import { MarketStats } from '../components/MarketStats';
import { StructuredData } from '../components/StructuredData';
import { Breadcrumb } from '../components/Breadcrumb';
import { HOME, CAROUSEL, LOADING } from '../constants/homeConstants';
import { validateSearchQuery } from '../utils';
import { useTokenSorting } from '../hooks/useTokenSorting';

const Home: React.FC = () => {
  const { tokens, watchlist, marketEvent } = useStore();
  const [filter, setFilter] = useState<'trending' | 'new' | 'created' | 'graduated' | 'watchlist' | 'live'>('trending');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [searchError, setSearchError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(HOME.INITIAL_VISIBLE_COUNT);
  const [newsBannerHeight, setNewsBannerHeight] = useState(0);

  // Hero Carousel State
  const [heroIndex, setHeroIndex] = useState(0);

  // Track NewsBanner height to adjust tabs position
  useEffect(() => {
    const updateBannerHeight = () => {
      const banner = document.getElementById('news-banner');
      if (banner) {
        setNewsBannerHeight(banner.offsetHeight);
      } else {
        setNewsBannerHeight(0);
      }
    };

    // Update immediately
    updateBannerHeight();

    // Observe only the parent container of news-banner for better performance
    const banner = document.getElementById('news-banner');
    const observer = banner?.parentElement ? new MutationObserver(() => {
      updateBannerHeight();
    }) : null;

    if (observer && banner.parentElement) {
      // Only observe direct children changes (banner being added/removed)
      observer.observe(banner.parentElement, {
        childList: true,
        subtree: false // Don't observe descendants for better performance
      });
    }

    // Also update when marketEvent changes
    const timer = setTimeout(updateBannerHeight, 100);

    return () => {
      observer?.disconnect();
      clearTimeout(timer);
    };
  }, [marketEvent]);

  
  // Data Safety Check & Loading
  useEffect(() => {
    // If tokens are present, loading is done
    if (tokens && tokens.length > 0) {
        setIsLoading(false);
    } else {
        // Fallback for very first load or if store is slow
        const timer = setTimeout(() => setIsLoading(false), LOADING.INITIAL_DELAY_MS);
        return () => clearTimeout(timer);
    }
  }, [tokens]);

  // Update Tab Title with Global MC
  useEffect(() => {
     if (tokens.length > 0) {
        const totalMC = tokens.reduce((acc, t) => acc + t.marketCap, 0);
        document.title = `DogePump | MC: ${formatCurrency(totalMC)}`;
     }
  }, [tokens]);

  // Use custom hook for token sorting (MUST be before metaInfo which uses it)
  const { sortedTokens } = useTokenSorting({
    tokens,
    search,
    filter,
    watchlist
  });

  // Dynamic meta descriptions based on filter
  const metaInfo = useMemo(() => {
    const filterDescriptions = {
      trending: {
        title: 'Trending Memecoins on Dogechain',
        description: `Discover the hottest trending memecoins on Dogechain. Browse ${sortedTokens.length} top-performing tokens, track real-time price movements, and find the next big gem in the crypto market.`,
        ogTitle: 'DogePump - Trending Memecoins',
      },
      new: {
        title: 'New Memecoin Launches on Dogechain',
        description: `Be the first to discover ${sortedTokens.length} newly launched memecoins on Dogechain. Get in early on the freshest tokens before they go viral.`,
        ogTitle: 'DogePump - New Token Launches',
      },
      live: {
        title: 'Live Streaming Tokens on Dogechain',
        description: `Watch live streams from ${sortedTokens.length} memecoin creators on Dogechain. See real-time token launches, ask questions, and interact with developers.`,
        ogTitle: 'DogePump - Live Streams',
      },
      graduated: {
        title: 'Graduated Memecoins on Dogechain DEX',
        description: `Browse ${sortedTokens.length} successfully graduated memecoins now trading on DEX. These tokens completed their bonding curve and are available for open trading.`,
        ogTitle: 'DogePump - Graduated Tokens',
      },
      watchlist: {
        title: 'Your Token Watchlist',
        description: `Track your favorite tokens. You have ${sortedTokens.length} tokens on your watchlist. Monitor price movements and stay updated on your investments.`,
        ogTitle: 'DogePump - My Watchlist',
      },
      created: {
        title: 'Tokens You Created',
        description: `Manage ${sortedTokens.length} memecoins you've launched on Dogechain. Track performance, manage liquidity, and engage with your community.`,
        ogTitle: 'DogePump - My Created Tokens',
      },
    };

    return filterDescriptions[filter];
  }, [filter, sortedTokens.length]);

  // Determine Hero Tokens (Top 3 Graduated/Progress)
  const topHeroTokens = useMemo(() => {
      return [...tokens]
      .filter(t => !t.delisted) // Filter out delisted tokens
      .sort((a, b) => b.progress - a.progress)
      .slice(0, CAROUSEL.HERO_TOKEN_COUNT);
  }, [tokens]);
  
  const currentHeroToken = topHeroTokens[heroIndex] || topHeroTokens[0];

  // Rotate Hero - Auto-rotation
  useEffect(() => {
    if (topHeroTokens.length <= 1) return;
    const interval = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % topHeroTokens.length);
    }, CAROUSEL.ROTATION_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [topHeroTokens.length]);

  const paginatedTokens = sortedTokens.slice(0, visibleCount);
  const hasMore = visibleCount < sortedTokens.length;

  const handleLoadMore = () => {
      setVisibleCount(prev => prev + HOME.PAGE_SIZE);
      playSound('click');
  };

  const nextHero = () => {
      setHeroIndex(prev => (prev + 1) % topHeroTokens.length);
      playSound('click');
  };

  const prevHero = () => {
      setHeroIndex(prev => (prev - 1 + topHeroTokens.length) % topHeroTokens.length);
      playSound('click');
  };

  return (
    <>
      <Helmet>
        <title>{metaInfo.title}</title>
        <meta name="description" content={metaInfo.description} />
        <link rel="canonical" href="https://dogepump.com/" />
        <meta property="og:title" content={metaInfo.ogTitle} />
        <meta property="og:description" content={metaInfo.description} />
        <meta property="og:url" content={`https://dogepump.com/?filter=${filter}`} />
        <meta name="twitter:title" content={metaInfo.ogTitle} />
        <meta name="twitter:description" content={metaInfo.description} />
      </Helmet>
      <StructuredData type="WebSite" data={{
        name: 'DogePump',
        url: 'https://dogepump.com',
        description: 'DogePump is the premier fair-launch memecoin platform on Dogechain. Discover trending tokens, launch your own memecoin, and join the most active community in crypto.',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://dogepump.com',
          'query-input': 'required'
        }
      }} />
      <div className="-mt-12 mb-8">
         <MarketStats />
      </div>
      
      <Breadcrumb items={[{ name: 'Home', url: '/' }]} />
      
      <div className="space-y-16 animate-fade-in pb-12">
        
        {/* Hero Section */}
        {(filter === 'trending' || filter === 'new') && currentHeroToken && (
          <section aria-labelledby="hero-heading" className="px-3 sm:px-4 md:px-0">
            <h2 id="hero-heading" className="sr-only">Featured Token</h2>
          <div className="relative group perspective-1000">
            {/* Ambient Glow */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] blur-[120px] rounded-full opacity-40 group-hover:opacity-60 transition duration-1000 pointer-events-none ${currentHeroToken.progress >= 100 ? 'bg-purple-500/20' : 'bg-doge/20'}`}></div>

            <div className={`relative rounded-[1rem] sm:rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden border bg-[#080808] shadow-[0_0_50px_-10px_rgba(0,0,0,0.8)] transition-transform duration-500 hover:shadow-[0_0_60px_-10px_rgba(212,175,55,0.15)] group-hover:-translate-y-1 preserve-3d ${currentHeroToken.progress >= 100 ? 'border-purple-500/30' : 'border-doge/20'}`}>

                {/* Dynamic Background */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-doge/5 via-transparent to-transparent opacity-50"></div>

                {/* Golden/Purple Border Gradient */}
                <div className={`absolute inset-0 rounded-[1rem] sm:rounded-[1.5rem] md:rounded-[2.5rem] p-[1px] bg-gradient-to-b to-transparent pointer-events-none ${currentHeroToken.progress >= 100 ? 'from-purple-500/40' : 'from-doge/30'}`}></div>

                {isLoading ? (
                  <div className="p-4 sm:p-6 md:p-16 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-12 items-center">
                      <div className="space-y-4 md:space-y-8">
                        <Skeleton className="w-32 h-6 sm:w-40 sm:h-8 rounded-full" />
                        <div className="space-y-2 md:space-y-4">
                            <Skeleton className="w-full h-16 sm:h-24" />
                            <Skeleton className="w-1/2 h-6 sm:h-10" />
                        </div>
                        <Skeleton className="w-3/4 h-12 sm:h-20" />
                      </div>
                      <Skeleton className="w-full h-48 sm:h-64 md:h-[400px] rounded-[1rem] sm:rounded-[1.5rem] md:rounded-[2.5rem]" />
                  </div>
                ) : (
                  <div className="relative p-4 sm:p-6 md:p-16 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-center z-10" key={currentHeroToken.id}>

                      {/* Nav Buttons */}
                      <button onClick={prevHero} className="absolute left-2 top-1/2 -translate-y-1/2 p-3 sm:p-2.5 md:p-3 rounded-full bg-black/50 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white transition-all z-20 sm:left-3 md:left-4 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center">
                          <ChevronLeft size={18} className="sm:w-5 md:w-6" />
                      </button>
                      <button onClick={nextHero} className="absolute right-2 top-1/2 -translate-y-1/2 p-3 sm:p-2.5 md:p-3 rounded-full bg-black/50 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white transition-all z-20 sm:right-3 md:right-4 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center">
                          <ChevronRight size={18} className="sm:w-5 md:w-6" />
                      </button>

                      <div className="space-y-4 sm:space-y-6 md:space-y-8 order-2 md:order-1 animate-fade-in">
                        <div className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border text-[10px] sm:text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(212,175,55,0.2)] animate-pulse-slow backdrop-blur-sm ${currentHeroToken.progress >= 100 ? 'bg-purple-500/10 border-purple-500/20 text-gold' : 'bg-doge/10 border-doge/20 text-doge'}`}>
                          <Crown size={12} className="sm:w-3.5 sm:h-3.5 fill-current" />
                          <span className="hidden xs:inline">{currentHeroToken.progress >= 100 ? 'King (Graduated)' : 'Top Trending'}</span>
                          <span className="xs:hidden">{currentHeroToken.progress >= 100 ? 'King' : 'Trending'}</span>
                        </div>

                        <div className="space-y-1 sm:space-y-2">
                          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-comic font-bold text-white leading-none drop-shadow-2xl break-words">
                            {currentHeroToken.name || 'Unknown Token'}
                          </h1>
                          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                            <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-sans font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">${currentHeroToken.ticker || 'N/A'}</span>
                            {currentHeroToken.creator === 'You' && <span className="px-2 sm:px-3 py-1 bg-doge/10 text-doge rounded-[8px] sm:rounded text-[10px] sm:text-xs font-bold border border-doge/20 flex items-center gap-1"><Coins size={10} /> Created by You</span>}
                          </div>
                        </div>

                        <p className="text-gray-400 text-sm sm:text-base md:text-lg leading-relaxed max-w-full pl-4 sm:pl-6 border-l-2 border-doge/40 italic relative">
                          <span className={`absolute -left-1 sm:-left-1.5 top-0 w-1 h-full shadow-[0_0_10px_rgba(212,175,55,0.5)] ${currentHeroToken.progress >= 100 ? 'bg-purple-500' : 'bg-doge'}`}></span>
                          "{currentHeroToken.description || 'No description available for this token.'}"
                        </p>

                        <div className="flex flex-wrap gap-3 sm:gap-6 p-3 sm:p-4 md:p-6 bg-black/40 rounded-xl sm:rounded-2xl border border-white/10 backdrop-blur-md shadow-inner">
                          <div className="space-y-0.5 sm:space-y-1">
                              <div className="text-[8px] sm:text-[10px] text-gray-500 uppercase font-bold tracking-wider">Market Cap</div>
                              <div className="text-xl sm:text-2xl md:text-3xl font-mono text-white font-medium tracking-tight">{formatCurrency(currentHeroToken.marketCap)}</div>
                          </div>
                          <div className="w-px bg-white/10 mx-1 sm:mx-2"></div>
                          <div className="space-y-0.5 sm:space-y-1">
                              <div className="text-[8px] sm:text-[10px] text-gray-500 uppercase font-bold tracking-wider text-doge">Bonding Curve</div>
                              <div className={`text-xl sm:text-2xl md:text-3xl font-mono font-bold text-glow ${currentHeroToken.progress >= 100 ? 'text-purple-400' : 'text-doge'}`}>
                                  {currentHeroToken.progress >= 100 ? '100%' : `${currentHeroToken.progress.toFixed(1)}%`}
                              </div>
                          </div>
                        </div>

                        <Link to={`/token/${currentHeroToken.id}`} className="inline-block group/btn">
                          <Button size="lg" className={`rounded-full px-6 sm:px-8 md:px-12 h-12 sm:h-14 md:h-16 text-base sm:text-lg md:text-xl shadow-[0_0_30px_rgba(212,175,55,0.3)] border border-white/20 relative overflow-hidden group-hover/btn:scale-105 transition-transform duration-300 ${currentHeroToken.progress >= 100 ? 'bg-gradient-to-r from-purple-600 to-purple-800' : 'bg-gradient-to-r from-doge to-doge-dark'}`}>
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500 rotate-12"></div>
                            <span className="relative z-10 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">Trade Now <ArrowRight size={16} className="sm:w-4 md:w-5" /></span>
                          </Button>
                        </Link>
                      </div>

                      {/* Hero Image */}
                      <div className="flex justify-center md:justify-end order-1 md:order-2 relative perspective-500 animate-fade-in">
                        <div className="relative w-40 h-40 sm:w-52 sm:h-52 md:w-72 md:h-72 lg:w-[400px] lg:h-[400px] group-hover:scale-[1.02] transition-transform duration-700 ease-in-out">
                            <div className={`absolute inset-0 bg-gradient-to-tr rounded-[1rem] sm:rounded-[1.5rem] md:rounded-[2.5rem] blur-3xl opacity-20 animate-pulse-slow ${currentHeroToken.progress >= 100 ? 'from-purple-500 to-transparent' : 'from-doge to-transparent'}`}></div>
                            <img
                              src={currentHeroToken.imageUrl || '/images/default-token.png'}
                              alt={currentHeroToken.name || 'Token image'}
                              className={`relative w-full h-full rounded-[1rem] sm:rounded-[1.5rem] md:rounded-[2.5rem] object-cover shadow-2xl border-2 rotate-3 group-hover:rotate-0 transition-all duration-700 grayscale-[20%] group-hover:grayscale-0 ${currentHeroToken.progress >= 100 ? 'border-purple-500/50' : 'border-white/10'}`}
                            />

                            {/* Floating Badges - Positioned to stay visible on all screens */}
                            <div className="absolute -top-3 sm:-top-4 md:-top-6 -right-3 sm:-right-4 md:-right-6 bg-[#0F0F0F]/90 backdrop-blur-xl border border-doge/30 p-2 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl shadow-2xl flex items-center gap-2 sm:gap-3 animate-float" style={{animationDelay: '1s'}}>
                              <div className="bg-doge/20 p-1.5 sm:p-2 rounded-lg text-doge"><Trophy size={14} className="sm:w-4 md:w-[18px]" /></div>
                              <div className="flex flex-col">
                                  <span className="text-[8px] sm:text-[9px] text-gray-400 font-bold uppercase tracking-wider">Rank</span>
                                  <span className="text-xs sm:text-sm font-bold text-white">#{heroIndex + 1} <span className="hidden sm:inline">Trending</span></span>
                              </div>
                            </div>
                        </div>
                      </div>
                  </div>
                )}
            </div>
          </div>
        </section>
        )}

        {/* Controls Container - Transparent background fix */}
        <div className="space-y-6 sticky z-40 backdrop-blur-xl py-2 rounded-2xl"
             style={{ top: `${newsBannerHeight + 112}px` }}>
            {/* Tabs Row */}
            <div className="relative flex justify-center">
                <div className="flex p-1.5 rounded-2xl overflow-x-auto max-w-full no-scrollbar">
                    <button
                        onClick={() => { setFilter('trending'); playSound('click'); setVisibleCount(HOME.INITIAL_VISIBLE_COUNT); }}
                        className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                        filter === 'trending' 
                            ? 'bg-doge text-black shadow-[0_0_20px_rgba(212,175,55,0.3)] scale-105' 
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Flame size={16} className={filter === 'trending' ? 'fill-black animate-pulse' : ''} /> Trending
                    </button>
                    <button
                        onClick={() => { setFilter('live'); playSound('click'); setVisibleCount(HOME.INITIAL_VISIBLE_COUNT); }}
                        className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                        filter === 'live' 
                            ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] scale-105' 
                            : 'text-gray-400 hover:text-red-500 hover:bg-white/5'
                        }`}
                    >
                        <Radio size={16} className={filter === 'live' ? 'animate-pulse' : ''} /> LIVE
                    </button>
                    <button
                        onClick={() => { setFilter('new'); playSound('click'); setVisibleCount(HOME.INITIAL_VISIBLE_COUNT); }}
                        className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                        filter === 'new' 
                            ? 'bg-[#00E054] text-black shadow-[0_0_20px_rgba(0,224,84,0.3)] scale-105' 
                            : 'text-gray-400 hover:text-green-400 hover:bg-white/5'
                        }`}
                    >
                        <Clock size={16} /> New
                    </button>
                    <button
                        onClick={() => { setFilter('graduated'); playSound('click'); setVisibleCount(HOME.INITIAL_VISIBLE_COUNT); }}
                        className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                        filter === 'graduated' 
                            ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)] scale-105 ring-1 ring-purple-400' 
                            : 'text-gray-400 hover:text-purple-400 hover:bg-white/5'
                        }`}
                    >
                        <Crown size={16} className={filter === 'graduated' ? 'fill-white' : ''}/> Graduated
                    </button>
                    <button
                        onClick={() => { setFilter('watchlist'); playSound('click'); setVisibleCount(HOME.INITIAL_VISIBLE_COUNT); }}
                        className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                        filter === 'watchlist' 
                            ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105' 
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Star size={16} className={filter === 'watchlist' ? 'fill-black' : ''}/> Watchlist
                    </button>
                    <button
                        onClick={() => { setFilter('created'); playSound('click'); setVisibleCount(HOME.INITIAL_VISIBLE_COUNT); }}
                        className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                        filter === 'created' 
                            ? 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] scale-105' 
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <User size={16} /> Created
                    </button>
                </div>
            </div>

            {/* Search & View Toggle Row */}
            <div className="relative flex flex-col gap-4 items-center px-4">
                {/* Search - Centered */}
                <div className="relative w-full md:w-[400px] group">
                    <div className="absolute inset-0 bg-doge/5 rounded-2xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-doge transition-colors" size={18} />
                    <input
                        id="token-search"
                        name="search"
                        type="text"
                        placeholder="Search token name or address..."
                        maxLength={HOME.SEARCH.MAX_LENGTH}
                        value={search}
                        onChange={(e) => {
                            const value = e.target.value;

                            // Validate and sanitize input
                            const validation = validateSearchQuery(value);

                            if (!validation.valid) {
                                setSearchError(validation.error || 'Invalid search query');
                                return;
                            }

                            // Clear error if valid
                            if (searchError) setSearchError('');

                            setSearch(validation.sanitized);
                        }}
                        className={`relative w-full bg-black/60 border rounded-2xl pl-12 pr-4 py-3 text-sm text-white outline-none transition-all placeholder:text-gray-600 shadow-inner ${
                            searchError ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-doge/50'
                        }`}
                    />
                    {searchError && (
                        <span className="absolute -bottom-5 left-0 text-xs text-red-400">{searchError}</span>
                    )}
                </div>

                {/* View Toggle - Centered below search */}
                <div className="bg-black/60 border border-white/10 rounded-2xl p-1 flex shrink-0 backdrop-blur-md">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                    >
                        <LayoutGrid size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                    >
                        <List size={18} />
                    </button>
                </div>
            </div>
        </div>

        {/* Token Grid / List */}
        {viewMode === 'grid' ? (
          <section aria-labelledby="tokens-heading">
            <h2 id="tokens-heading" className="sr-only">Token List</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-4 min-h-[300px]">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
              ) : (
                paginatedTokens.map((token) => (
                  <TokenCard key={token.id} token={token} />
                ))
              )}
            </div>
          </section>
        ) : (
          <section aria-labelledby="tokens-heading">
            <h2 id="tokens-heading" className="sr-only">Token List</h2>
            <div className="pb-4 min-h-[300px]">
              <TokenTable tokens={paginatedTokens} />
            </div>
          </section>
        )}

        {/* Load More Pagination - Only for list view, not needed for virtualized grid */}
        {viewMode === 'list' && !isLoading && hasMore && (
            <div className="flex justify-center pt-8 pb-12">
                <Button
                    onClick={handleLoadMore}
                    variant="secondary"
                    className="rounded-full px-8 py-4 gap-2 bg-white/5 border border-white/10 hover:bg-white/10"
                >
                    Show More Gems <ChevronDown size={16} />
                </Button>
            </div>
        )}

        {!isLoading && sortedTokens.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-6 border border-dashed border-white/10 rounded-[2.5rem] bg-white/[0.02]">
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center text-gray-600 shadow-inner animate-pulse">
                {filter === 'watchlist' ? <Star size={48} /> : filter === 'live' ? <Radio size={48} /> : <Search size={48} />}
              </div>
              <div>
                <h3 className="text-3xl font-bold text-white mb-2 font-comic">
                    {filter === 'watchlist' ? 'Your Watchlist is empty' : filter === 'live' ? 'No Live Streams' : `No ${filter !== 'trending' && filter !== 'new' ? filter : ''} gems found`}
                </h3>
                <p className="text-gray-500 max-w-xs mx-auto">
                  {filter === 'watchlist' ? 'Star tokens to track them here.' : filter === 'live' ? 'Devs are sleeping. Start a stream yourself!' : 'The blockchain is empty here. This is your chance to make history.'}
                </p>
              </div>
              <Link to={filter === 'watchlist' ? "/" : "/launch"}>
                  <Button variant="outline" className="rounded-full px-8 border-white/20">
                    {filter === 'watchlist' ? 'Browse Tokens' : 'Launch Coin'}
                  </Button>
              </Link>
          </div>
        )}
      </div>

      {/* DEX Highlights Section */}
      <section aria-labelledby="dex-heading" className="bg-gradient-to-br from-doge/10 to-purple-500/10 border border-doge/30 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] blur-[100px] rounded-full opacity-20 pointer-events-none bg-gradient-to-r from-doge/30 to-purple-500/30"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-doge/20 p-3 rounded-xl">
              <ArrowLeftRight size={24} className="text-doge" />
            </div>
            <div>
              <h2 id="dex-heading" className="text-3xl md:text-4xl font-comic font-bold text-white mb-2">
                Trade on DogePump DEX
              </h2>
              <p className="text-gray-400 text-lg">
                Swap tokens instantly with the best prices on Dogechain
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-doge/20 flex items-center justify-center">
                  <Droplets size={20} className="text-doge" />
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Top Pools</div>
                  <div className="text-2xl font-mono font-bold text-white">8</div>
                </div>
              </div>
              <p className="text-sm text-gray-400">Active liquidity pools</p>
            </div>
            <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <TrendingUp size={20} className="text-green-400" />
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Best APY</div>
                  <div className="text-2xl font-mono font-bold text-doge">73.5%</div>
                </div>
              </div>
              <p className="text-sm text-gray-400">Highest yield opportunity</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/dex/swap"
              onClick={() => playSound('click')}
              className="flex-1 flex items-center justify-center gap-3 bg-doge text-black px-8 py-4 rounded-2xl font-bold hover:bg-doge-light transition-all shadow-[0_0_30px_rgba(212,175,55,0.3)] hover:shadow-[0_0_40px_rgba(212,175,55,0.4)] border border-white/20"
            >
              <ArrowLeftRight size={20} />
              <span className="text-lg">Swap Now</span>
            </Link>
            <Link
              to="/dex/pools"
              onClick={() => playSound('click')}
              className="flex-1 flex items-center justify-center gap-3 bg-white/10 border border-white/20 text-white px-8 py-4 rounded-2xl font-bold hover:bg-white/20 hover:border-doge/50 transition-all"
            >
              <Droplets size={20} />
              <span className="text-lg">View Pools</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
