
import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Play, Pause, SkipForward, SkipBack, Maximize2, Minimize2, ArrowLeft, TrendingUp, Activity, Radio, Video } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { generateCandles } from '../utils/chartUtils';
import { formatNumber, formatCurrency } from '../services/web3Service';
import { timeAgo } from '../utils';
import { DOGE_TV_ROTATION_INTERVAL_MS, DOGE_TV_TOKEN_COUNT, DOGE_TV_TRADE_COUNT } from '../constants';
import { DogeTVSkeleton } from '../components/DogeTVSkeleton';
import { OptimizedImage } from '../components/OptimizedImage';
import { Trade } from '../types';

// Lazy load heavy components
const CandleChart = React.lazy(() => import('../components/CandleChart').then(m => ({ default: m.CandleChart })));
const AnimatedNumber = React.lazy(() => import('../components/AnimatedNumber').then(m => ({ default: m.AnimatedNumber })));

const DogeTV: React.FC = () => {
  const { tokens, priceHistory, getTradesForToken } = useStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter top trending tokens, prioritizing Live streams
  // Memoized to prevent recalculation on every render
  const trendingTokens = useMemo(() => {
    return [...tokens].sort((a, b) => {
      // Live tokens first
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;
      // Then by progress
      return b.progress - a.progress;
    }).slice(0, DOGE_TV_TOKEN_COUNT);
  }, [tokens]);

  const currentToken = trendingTokens[currentIndex];
  const history = currentToken ? (priceHistory[currentToken.id] || []) : [];
  const candles = generateCandles(history, '15m');
  const recentTrades = currentToken ? getTradesForToken(currentToken.id).slice(0, DOGE_TV_TRADE_COUNT) : [];

  // Calculate real price change percentage from history
  // Memoized to prevent recalculation on every render
  const priceChangePercentage = useMemo(() => {
    if (!currentToken || !history || history.length === 0) return 0;
    const firstPrice = history[0].price;
    if (!firstPrice || firstPrice === 0) return 0;
    return ((currentToken.price - firstPrice) / firstPrice) * 100;
  }, [currentToken?.price, history]);

  // Rotation Logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % trendingTokens.length);
      }, DOGE_TV_ROTATION_INTERVAL_MS);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, trendingTokens.length]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (!currentToken) return <DogeTVSkeleton />;

  return (
    <div
      ref={containerRef}
      className="lg:fixed lg:inset-0 lg:z-[200] z-10 bg-black text-white lg:overflow-hidden min-h-screen flex flex-col font-sans"
    >
       {/* TV Header */}
      <div className="sticky top-0 inset-x-0 md:static h-14 md:h-16 border-b border-white/10 bg-[#0A0A0A] flex items-center justify-between px-3 md:px-6 shrink-0 z-20">
          <div className="flex items-center gap-2 md:gap-4">
             <Link to="/" className="text-gray-500 hover:text-white transition-colors p-1">
                <ArrowLeft size={18} className="md:hidden" />
                <ArrowLeft size={20} className="hidden md:block" />
             </Link>
             <div className="flex flex-col leading-tight">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 md:w-3 md:h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_red]"></div>
                  <span className="font-bold font-comic text-base md:text-xl tracking-tight">DogeTV</span>
                </div>
                <span className="text-[10px] md:text-xs font-sans font-semibold text-gray-400 uppercase tracking-wide pl-4 md:pl-5">Live Feed</span>
             </div>
          </div>

          {/* Mobile token name - visible only on small screens */}
          <Link to={`/token/${currentToken.id}`} className="flex md:hidden items-center gap-1 bg-white/10 px-2 py-1 rounded-full">
              <span className="font-bold text-white text-[11px] max-w-[80px] truncate">{currentToken.name}</span>
              <span className="text-[10px] text-doge">{currentToken.ticker}</span>
          </Link>

          {/* Desktop token name - visible only on larger screens */}
          <Link to={`/token/${currentToken.id}`} className="hidden md:flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 transition-colors">
              <span className="font-bold text-white text-sm">{currentToken.name}</span>
              <span className="text-xs text-doge">${currentToken.ticker}</span>
          </Link>

          <div className="flex items-center gap-1 md:gap-3">
             <div className="hidden sm:flex bg-white/5 rounded-full px-2 md:px-3 py-1 items-center gap-1 md:gap-2 text-[10px] md:text-xs font-mono text-gray-400">
                <Activity size={10} className="text-doge"/>
                <span className="hidden md:inline">Cycle:</span> {currentIndex + 1}/{trendingTokens.length}
             </div>

             <button onClick={() => setCurrentIndex(prev => (prev - 1 + trendingTokens.length) % trendingTokens.length)} className="p-1.5 md:p-2 hover:bg-white/10 rounded-full">
                <SkipBack size={14} className="md:hidden" />
                <SkipBack size={16} className="hidden md:block" />
             </button>
             <button onClick={() => setIsPlaying(!isPlaying)} className="p-1.5 md:p-2 hover:bg-white/10 rounded-full">
                {isPlaying ? <Pause size={14} className="md:hidden" /> : <Play size={14} className="md:hidden" />}
                {isPlaying ? <Pause size={16} className="hidden md:block" /> : <Play size={16} className="hidden md:block" />}
             </button>
             <button onClick={() => setCurrentIndex(prev => (prev + 1) % trendingTokens.length)} className="p-1.5 md:p-2 hover:bg-white/10 rounded-full">
                <SkipForward size={14} className="md:hidden" />
                <SkipForward size={16} className="hidden md:block" />
             </button>

             <div className="hidden md:block w-px h-6 bg-white/10 mx-2"></div>
            <button
              onClick={toggleFullscreen}
              className="hidden md:inline-flex p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
       </div>

       {/* Main Content */}
       <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden overflow-visible relative">

           {/* Left: Chart & Key Stats */}
           <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-white/10 p-3 md:p-6 relative bg-black/50">
              <div className="absolute top-0 left-0 w-full h-1 bg-doge/50">
                 <div className="h-full bg-doge shadow-[0_0_10px_#D4AF37] transition-all duration-1000 ease-linear" style={{ width: isPlaying ? '100%' : '0%', transitionDuration: isPlaying ? '15s' : '0s' }}></div>
              </div>

              <Link to={`/token/${currentToken.id}`} className="flex justify-between items-start mb-4 md:mb-6 group cursor-pointer">
                 <div className="flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-4xl md:text-6xl font-black font-comic text-white mb-1 md:mb-2 flex items-center gap-2 md:gap-4 group-hover:text-doge transition-colors leading-tight">
                       {currentToken.name}
                       <span className="text-sm sm:text-xl md:text-2xl font-sans font-medium text-gray-500 bg-white/5 px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg border border-white/5 group-hover:border-doge/20 transition-colors">{currentToken.ticker}</span>
                    </h1>
                    <p className="text-gray-400 text-xs sm:text-sm md:text-lg max-w-2xl hidden sm:block">{currentToken.description}</p>
                 </div>
                 <div className="text-right pl-2">
                    <div className="text-2xl sm:text-4xl md:text-7xl font-mono font-medium text-doge tracking-tighter text-glow">
                       $<Suspense fallback={<span>{currentToken.price.toFixed(6)}</span>}>
                          <AnimatedNumber value={currentToken.price} />
                       </Suspense>
                    </div>
                    <div className={`text-sm md:text-xl font-bold flex items-center justify-end gap-1 md:gap-2 ${priceChangePercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                       {priceChangePercentage >= 0 ? <TrendingUp size={16} className="md:hidden" /> : <TrendingUp size={24} className="hidden md:block" style={{ transform: 'rotate(180deg)' }} />}
                       {priceChangePercentage >= 0 ? '+' : ''}{priceChangePercentage.toFixed(2)}%
                    </div>
                 </div>
              </Link>

              {currentToken.isLive ? (
                  <Link to={`/token/${currentToken.id}?action=stream`} className="flex-1 min-h-[200px] md:min-h-0 bg-black rounded-2xl md:rounded-3xl border border-red-500/30 overflow-hidden shadow-2xl relative mb-4 md:mb-6 group cursor-pointer hover:border-red-500/60 transition-colors">
                      {/* Simulated Live Stream */}
                      <OptimizedImage
                        src={currentToken.imageUrl}
                        alt={currentToken.name}
                        className="w-full h-full object-cover blur-md opacity-60"
                        loading="eager"
                        fetchPriority="low"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50"></div>

                      {/* Overlay Info */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                          <div className="bg-red-600/20 p-3 md:p-6 rounded-full animate-pulse border border-red-500/50">
                              <Video size={32} className="md:hidden text-red-500" />
                              <Video size={64} className="hidden md:block text-red-500" />
                          </div>
                          <h3 className="text-lg md:text-2xl font-bold text-white mt-2 md:mt-4 uppercase tracking-widest text-center">Live Broadcast</h3>
                          <p className="text-gray-400 text-xs md:text-sm">Dev is streaming right now</p>
                      </div>

                      <div className="absolute top-3 md:top-6 left-3 md:left-6 flex items-center gap-1 md:gap-2 bg-red-600 text-white px-2 md:px-3 py-1 md:py-1.5 rounded-lg font-bold text-[10px] md:text-sm uppercase tracking-widest shadow-lg animate-pulse">
                          <Radio size={12} className="md:hidden" />
                          <Radio size={16} className="hidden md:block" /> LIVE
                      </div>
                      <div className="absolute top-3 md:top-6 right-3 md:right-6 bg-black/60 backdrop-blur-md px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-white font-mono text-[10px] md:text-sm border border-white/10">
                          {currentToken.streamViewers} Viewers
                      </div>
                  </Link>
              ) : (
                  <div className="flex-1 min-h-[200px] md:min-h-0 bg-[#050505] rounded-2xl md:rounded-3xl border border-white/5 overflow-hidden shadow-2xl relative mb-4 md:mb-6">
                    <div className="absolute top-2 md:top-4 left-2 md:left-4 z-10 flex gap-2">
                        <span className="bg-white/10 text-gray-300 text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded">15m</span>
                    </div>
                    <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-gray-500 text-xs md:text-sm">Loading chart...</div>}>
                        <CandleChart data={candles} />
                    </Suspense>
                  </div>
              )}

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
                 <div className="bg-white/[0.03] p-2 md:p-4 rounded-xl md:rounded-2xl border border-white/5">
                    <div className="text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1">Market Cap</div>
                    <div className="text-base md:text-2xl font-mono text-white font-bold truncate">{formatCurrency(currentToken.marketCap)}</div>
                 </div>
                 <div className="bg-white/[0.03] p-2 md:p-4 rounded-xl md:rounded-2xl border border-white/5">
                    <div className="text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1">Volume (24h)</div>
                    <div className="text-base md:text-2xl font-mono text-white font-bold truncate">{formatNumber(currentToken.volume)}</div>
                 </div>
                 <div className="bg-white/[0.03] p-2 md:p-4 rounded-xl md:rounded-2xl border border-white/5">
                    <div className="text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1">Liquidity</div>
                    <div className="text-base md:text-2xl font-mono text-white font-bold truncate">{formatNumber(currentToken.virtualLiquidity)}</div>
                 </div>
                 <div className="bg-white/[0.03] p-2 md:p-4 rounded-xl md:rounded-2xl border border-white/5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-doge/5 to-transparent"></div>
                    <div className="relative z-10">
                       <div className="text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1">Bonding Curve</div>
                       <div className="text-base md:text-2xl font-mono text-doge font-bold">{currentToken.progress.toFixed(2)}%</div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Right: Info & Tape - Responsive */}
           <div className="lg:w-[400px] bg-[#080808] flex flex-col shrink-0 border-l border-white/10 overflow-hidden lg:max-h-none">
              <div className="flex-1 p-4 md:p-6 border-b border-white/5 lg:overflow-y-auto">
                 <h3 className="text-gray-500 font-bold uppercase text-xs tracking-widest mb-3 md:mb-4">About</h3>
                 <div className="flex gap-3 md:gap-4 mb-3 md:mb-4">
                    <Link to={`/token/${currentToken.id}`} className="block group flex-shrink-0 w-20 h-20 md:w-32 md:h-32">
                      <div className="w-full h-full rounded-xl md:rounded-2xl overflow-hidden bg-[#0f0f0f] border border-white/10 group-hover:border-doge/30 transition-colors">
                        <OptimizedImage
                          src={currentToken.imageUrl}
                          alt={currentToken.name}
                          className="w-full h-full object-cover"
                          loading="eager"
                          fetchPriority="high"
                        />
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                       <p className="text-xs md:text-sm text-gray-300 leading-relaxed">{currentToken.description}</p>
                       <Link to={`/token/${currentToken.id}`} className="inline-flex mt-2 text-doge text-xs font-bold hover:underline">View Full Details →</Link>
                    </div>
                 </div>
              </div>

              <div className="flex flex-col min-h-0 max-h-none md:min-h-[44vh] md:max-h-[60vh] lg:min-h-0 lg:max-h-none pb-16">
                 <div className="px-3 md:px-6 py-2 md:py-3 border-b border-white/5 bg-white/[0.02]">
                    <h3 className="text-gray-500 font-bold uppercase text-[10px] md:text-xs tracking-widest flex items-center gap-2">
                       <Activity size={12} className="md:hidden" />
                       <Activity size={14} className="hidden md:block" /> Live Trades
                    </h3>
                 </div>
                 <div className="flex-1 overflow-y-auto p-1 md:p-2 space-y-0.5 custom-scrollbar">
                    {recentTrades.slice(0, 10).map((trade: Trade) => (
                       <div key={trade.id} className="flex justify-between items-center gap-2 p-1.5 md:p-2 rounded hover:bg-white/5 text-[10px] md:text-xs font-mono animate-fade-in">
                          <span className="text-gray-500 truncate flex-1">{timeAgo(trade.timestamp)}</span>
                          <span className={`${trade.type === 'buy' ? 'text-green-500' : 'text-red-500'}`}>{trade.type === 'buy' ? 'BUY' : 'SELL'}</span>
                          <span className="text-white font-bold">{formatNumber(trade.amountToken)}</span>
                          <span className="text-gray-400 hidden sm:block">{formatNumber(trade.amountDC)} DC</span>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
       </div>
    </div>
  );
};

export default DogeTV;
