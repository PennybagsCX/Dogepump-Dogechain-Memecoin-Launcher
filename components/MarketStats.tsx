import React from 'react';
import { TrendingUp, TrendingDown, Activity, PieChart, DollarSign, BarChart3 } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { formatCurrency, formatNumber as formatNumberWeb3 } from '../services/web3Service';
import { formatNumber } from '../utils';

export const MarketStats: React.FC = () => {
  const { tokens } = useStore();

  // Calculate aggregates
  const totalMarketCap = tokens.reduce((acc, t) => acc + t.marketCap, 0);
  const totalVolume = tokens.reduce((acc, t) => acc + t.volume, 0);
  const activeTokens = tokens.length;
  
  const topToken = [...tokens].sort((a, b) => b.marketCap - a.marketCap)[0];
  const dominance = totalMarketCap > 0 ? (topToken.marketCap / totalMarketCap) * 100 : 0;

  // Simulate Fear & Greed based on average 24h change (mocked via progress for now)
  const avgProgress = tokens.reduce((acc, t) => acc + t.progress, 0) / activeTokens;
  const fearGreedIndex = Math.min(100, Math.max(0, Math.floor(avgProgress + 20))); // Arbitrary calculation for demo
  
  let sentiment = 'Neutral';
  let sentimentColor = 'text-gray-400';
  if (fearGreedIndex > 75) { sentiment = 'Extreme Greed'; sentimentColor = 'text-green-500'; }
  else if (fearGreedIndex > 55) { sentiment = 'Greed'; sentimentColor = 'text-green-400'; }
  else if (fearGreedIndex < 25) { sentiment = 'Extreme Fear'; sentimentColor = 'text-red-500'; }
  else if (fearGreedIndex < 45) { sentiment = 'Fear'; sentimentColor = 'text-red-400'; }

  return (
    <div className="w-full bg-[#0A0A0A]/80 backdrop-blur-md border-b border-white/10 py-2 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-[10px] md:text-xs text-gray-400 overflow-x-auto no-scrollbar gap-3 sm:gap-6">

        <div className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
           <span>Tokens:</span>
           <span className="text-blue-400 font-bold">{formatNumber(activeTokens)}</span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
           <span>Market Cap:</span>
           <span className="text-green-400 font-bold font-mono">{formatCurrency(totalMarketCap)}</span>
           <span className="text-green-500/60 text-[9px] flex items-center"><TrendingUp size={10}/> 4.2%</span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
           <span>24h Vol:</span>
           <span className="text-white font-bold font-mono">{formatNumberWeb3(totalVolume)}</span>
        </div>

        <div className="hidden sm:flex items-center gap-2 whitespace-nowrap">
           <span>Dominance:</span>
           <span className="text-orange-400 font-bold">{topToken?.ticker || 'BTC'} {dominance.toFixed(1)}%</span>
        </div>

        <div className="hidden md:flex items-center gap-2 border-l border-white/10 pl-6 whitespace-nowrap">
           <Activity size={12} className={sentimentColor} />
           <span>Fear & Greed:</span>
           <span className={`font-bold ${sentimentColor}`}>{formatNumber(fearGreedIndex)} <span className="text-gray-500 font-normal">({sentiment})</span></span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
           <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shrink-0"></div>
           <span className="text-green-500 font-bold">Systems Operational</span>
        </div>

      </div>
    </div>
  );
};
