import React from 'react';
import { Pool } from '../../contexts/DexContext';

interface LiquidityProvider {
  address: string;
  lpBalance: string;
  poolShare: number;
  valueUSD: number;
}

interface PoolStatsGridProps {
  pool: Pool;
  topProviders: LiquidityProvider[];
  className?: string;
}

// Format USD value
const formatUSD = (value: number): string => {
  if (value === 0) return '$0';
  if (value < 1000) return `$${value.toFixed(2)}`;
  if (value < 1000000) return `$${(value / 1000).toFixed(2)}K`;
  if (value < 1000000000) return `$${(value / 1000000).toFixed(2)}M`;
  return `$${(value / 1000000000).toFixed(2)}B`;
};

const PoolStatsGrid: React.FC<PoolStatsGridProps> = ({
  pool,
  topProviders,
  className = '',
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 ${className}`} role="list" aria-label="Pool statistics">
      <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-4 min-h-0 flex flex-col items-center text-center" role="listitem">
        <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1 w-full text-center">Total Value Locked</div>
        <div className="text-base sm:text-lg font-mono font-bold text-white break-words w-full text-center" aria-label={`TVL ${formatUSD(pool.tvl)}`}>
          {formatUSD(pool.tvl)}
        </div>
      </div>

      <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-4 min-h-0 flex flex-col items-center text-center" role="listitem">
        <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1 w-full text-center">Volume (24h)</div>
        <div className="text-base sm:text-lg font-mono font-bold text-white break-words w-full text-center" aria-label={`24 hour volume ${formatUSD(pool.volume24h)}`}>
          {formatUSD(pool.volume24h)}
        </div>
      </div>

      <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-4 min-h-0 flex flex-col items-center text-center" role="listitem">
        <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1 w-full text-center">Fees (24h)</div>
        <div className="text-base sm:text-lg font-mono font-bold text-green-400 break-words w-full text-center" aria-label={`24 hour fees ${formatUSD(pool.volume24h * pool.fee)}`}>
          {formatUSD(pool.volume24h * pool.fee)}
        </div>
      </div>

      <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-4 min-h-0 flex flex-col items-center text-center" role="listitem">
        <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1 w-full text-center">APY</div>
        <div className={`text-base sm:text-lg font-mono font-bold ${pool.apy > 50 ? 'text-doge' : 'text-white'} break-words w-full text-center`} aria-label={`Annual percentage yield ${pool.apy.toFixed(2)}%`}>
          {pool.apy.toFixed(2)}%
        </div>
      </div>

      <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-4 min-h-0 flex flex-col items-center text-center" role="listitem">
        <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1 w-full text-center">Providers</div>
        <div className="text-base sm:text-lg font-mono font-bold text-white break-words w-full text-center" aria-label={`${topProviders.length} liquidity providers`}>
          {topProviders.length}
        </div>
      </div>
    </div>
  );
};

export default PoolStatsGrid;
