import React, { useCallback } from 'react';
import { Pool } from '../../contexts/DexContext';
import { formatNumber } from '../../utils';
import { Plus } from 'lucide-react';

interface DexPoolCardProps {
  pool: Pool;
  onClick?: (pool: Pool) => void;
  onQuickAdd?: (pool: Pool) => void;
  isExpanded?: boolean;
  hasPosition?: boolean;
  className?: string;
  soundsEnabled?: boolean;
}

const DexPoolCard: React.FC<DexPoolCardProps> = ({
  pool,
  onClick,
  onQuickAdd,
  isExpanded = false,
  hasPosition = false,
  className = '',
  soundsEnabled = true,
}) => {
  // Play sound effect
  const playSound = useCallback((sound: 'click' | 'hover') => {
    if (!soundsEnabled) return;

    const audio = new Audio(`/sounds/${sound}.mp3`);
    audio.volume = 0.2;
    audio.play().catch(() => {
      // Ignore autoplay errors
    });
  }, [soundsEnabled]);

  // Handle click
  const handleClick = useCallback(() => {
    playSound('click');
    onClick?.(pool);
  }, [pool, onClick, playSound]);

  // Handle quick add
  const handleQuickAdd = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('click');
    onQuickAdd?.(pool);
  }, [pool, onQuickAdd, playSound]);

  // Handle hover
  const handleMouseEnter = useCallback(() => {
    playSound('hover');
  }, [playSound]);

  // Format TVL
  const formatTVL = (tvl: number): string => {
    if (tvl === 0) return '$0';
    if (tvl < 1000) return `$${tvl.toFixed(1)}`;
    if (tvl < 1000000) return `$${(tvl / 1000).toFixed(1)}K`;
    if (tvl < 1000000000) return `$${(tvl / 1000000).toFixed(1)}M`;
    return `$${(tvl / 1000000000).toFixed(1)}B`;
  };

  // Format volume
  const formatVolume = (volume: number): string => {
    return formatTVL(volume);
  };

  // Format APY
  const formatAPY = (apy: number): string => {
    return `${apy.toFixed(1)}%`;
  };

  return (
    <article
      data-pool-card
      className={`bg-[#0A0A0A] border rounded-2xl p-5 hover:border-doge/30 hover:shadow-lg hover:shadow-doge/10 transition-all cursor-pointer group ${isExpanded ? 'border-doge/30 shadow-lg shadow-doge/10' : 'border-white/10'} ${className}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      role="button"
      tabIndex={0}
      aria-label={`Pool ${pool.tokenA.symbol}/${pool.tokenB.symbol} with ${formatTVL(pool.tvl)} total value locked`}
      aria-expanded={isExpanded}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Pair Info - Full width on mobile, side-by-side on desktop */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2 flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-doge/20 to-doge/10 border-2 border-[#0A0A0A] flex items-center justify-center text-sm font-bold text-doge shadow-lg">
              {pool.tokenA.symbol.charAt(0)}
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-500/10 border-2 border-[#0A0A0A] flex items-center justify-center text-sm font-bold text-purple-400 shadow-lg">
              {pool.tokenB.symbol.charAt(0)}
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-base sm:text-sm font-bold text-white">{pool.tokenA.symbol}</span>
            <span className="text-gray-500">/</span>
            <span className="text-base sm:text-sm font-bold text-white">{pool.tokenB.symbol}</span>
            {hasPosition && (
              <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/30 rounded-md">
                <span className="text-xs font-bold text-purple-400">Your Position</span>
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
          <div
            className="px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-lg group/fee relative cursor-pointer"
            title={`Pool fee: ${(pool.fee * 100).toFixed(1)}% charged on each swap in this pool`}
            onClick={(e) => {
              e.stopPropagation();
              // Fee information - could show modal or alert with more details
              const feeInfo = `Pool Fee Information:\n\nFee Rate: ${(pool.fee * 100).toFixed(2)}%\n\nThis fee is charged on each swap transaction in this pool. The fee is distributed to liquidity providers.`;
              alert(feeInfo);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                const feeInfo = `Pool Fee Information:\n\nFee Rate: ${(pool.fee * 100).toFixed(2)}%\n\nThis fee is charged on each swap transaction in this pool. The fee is distributed to liquidity providers.`;
                alert(feeInfo);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Pool fee information: ${(pool.fee * 100).toFixed(1)}%`}
          >
            <span className="text-xs font-bold text-green-400 whitespace-nowrap">{pool.fee * 100}% Fee</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-white/5 rounded-xl p-3">
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">TVL</div>
          <div className="text-sm font-mono font-bold text-white" aria-label={`Total value locked ${formatTVL(pool.tvl)}`}>
            {formatTVL(pool.tvl)}
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-3">
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Vol 24h</div>
          <div className="text-sm font-mono font-bold text-white" aria-label={`24 hour volume ${formatVolume(pool.volume24h)}`}>
            {formatVolume(pool.volume24h)}
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-3">
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">APY</div>
          <div className={`text-sm font-mono font-bold ${pool.apy > 50 ? 'text-doge' : 'text-white'}`} aria-label={`Annual percentage yield ${formatAPY(pool.apy)}`}>
            {formatAPY(pool.apy)}
          </div>
        </div>
      </div>

      {/* Price Info - Stacked on mobile, side-by-side on desktop */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 border-t border-white/5">
        <div className="text-xs text-gray-400">
          <span className="text-white font-medium">1 {pool.tokenA.symbol}</span>
          <span className="mx-1 text-gray-600">=</span>
          <span className="font-mono text-white">{formatNumber(pool.price0.toFixed(6))}</span>
          <span className="text-white font-medium ml-1">{pool.tokenB.symbol}</span>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {onQuickAdd && (
            <button
              onClick={handleQuickAdd}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-doge/10 hover:bg-doge/20 border border-doge/30 rounded-lg text-doge text-xs font-bold transition-all"
              aria-label="Quick add liquidity"
            >
              <Plus size={14} />
              Add
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default DexPoolCard;
