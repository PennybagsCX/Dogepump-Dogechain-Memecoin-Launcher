import React, { useState, useCallback } from 'react';
import { Pool } from '../../contexts/DexContext';
import Button from '../Button';
import PoolPriceChart from './PoolPriceChart';
import AddLiquidityPanel from './AddLiquidityPanel';
import PoolStatsGrid from './PoolStatsGrid';
import RecentSwapsTable, { RecentSwap } from './RecentSwapsTable';
import ProvidersTable, { LiquidityProvider } from './ProvidersTable';
import { formatNumber } from '../../utils';

interface DexPoolDetailProps {
  pool: Pool;
  recentSwaps?: RecentSwap[];
  topProviders?: LiquidityProvider[];
  onSwap?: () => void;
  className?: string;
  soundsEnabled?: boolean;
}

type Timeframe = '1H' | '24H' | '7D' | '30D' | 'ALL';

const DexPoolDetail: React.FC<DexPoolDetailProps> = ({
  pool,
  recentSwaps = [],
  topProviders = [],
  onSwap,
  className = '',
  soundsEnabled = true,
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('24H');

  // Play sound effect
  const playSound = useCallback((sound: 'click' | 'hover') => {
    if (!soundsEnabled) return;

    try {
      const audio = new Audio(`/sounds/${sound}.mp3`);
      audio.volume = 0.2;
      const playPromise = audio.play();
      // play() returns a Promise in modern browsers, but may be undefined in test environments
      if (playPromise) {
        playPromise.catch(() => {
          // Ignore autoplay errors
        });
      }
    } catch (error) {
      // Ignore errors in test environment
    }
  }, [soundsEnabled]);

  // Handle timeframe change
  const handleTimeframeChange = useCallback((timeframe: Timeframe) => {
    playSound('click');
    setSelectedTimeframe(timeframe);
  }, [playSound]);

  // Handle swap click
  const handleSwap = useCallback(() => {
    playSound('click');
    onSwap?.();
  }, [onSwap, playSound]);

  const timeframes: Timeframe[] = ['1H', '24H', '7D', '30D', 'ALL'];

  return (
    <main className={`space-y-6 ${className}`} role="main" aria-label="Pool details">
      {/* Pool Header */}
      <section className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-doge/20 to-doge/10 border-2 border-[#0A0A0A] flex items-center justify-center text-base font-bold text-doge shadow-lg">
                {pool.tokenA.symbol.charAt(0)}
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-500/10 border-2 border-[#0A0A0A] flex items-center justify-center text-base font-bold text-purple-400 shadow-lg">
                {pool.tokenB.symbol.charAt(0)}
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{pool.tokenA.symbol}/{pool.tokenB.symbol}</h1>
              <span className="text-sm text-gray-400">{pool.fee * 100}% fee</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="bg-white/10 hover:bg-white/20 text-white"
              onClick={handleSwap}
              aria-label="Swap in pool"
            >
              Swap
            </Button>
          </div>
        </div>
      </section>

      {/* Pool Stats */}
      <PoolStatsGrid pool={pool} topProviders={topProviders} />

      {/* Add Liquidity Panel */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <AddLiquidityPanel
          pool={pool}
          soundsEnabled={soundsEnabled}
        />
      </div>

      {/* Price Chart */}
      <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-white">Price</h2>
          <div className="flex gap-2 bg-white/5 p-1 rounded-lg" role="group" aria-label="Select timeframe">
            {timeframes.map(tf => (
              <button
                key={tf}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${selectedTimeframe === tf ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                onClick={() => handleTimeframeChange(tf)}
                aria-label={`View ${tf} price chart`}
                aria-pressed={selectedTimeframe === tf}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 mb-4">
          <div className="text-center text-gray-500 text-sm mb-4">
            1 {pool.tokenA.symbol} = <span className="text-white font-mono font-bold">{pool.price0.toFixed(6)}</span> {pool.tokenB.symbol}
          </div>
          <div className="text-center text-gray-500 text-sm">
            1 {pool.tokenB.symbol} = <span className="text-white font-mono font-bold">{pool.price1.toFixed(6)}</span> {pool.tokenA.symbol}
          </div>
        </div>

        {/* Price Chart */}
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4" style={{ height: '300px' }}>
          <PoolPriceChart
            poolAddress={pool.address}
            tokenASymbol={pool.tokenA.symbol}
            tokenBSymbol={pool.tokenB.symbol}
            timeframe={selectedTimeframe}
          />
        </div>
      </div>

      {/* Recent Swaps */}
      <RecentSwapsTable recentSwaps={recentSwaps} />

      {/* Top Liquidity Providers */}
      <ProvidersTable topProviders={topProviders} />
    </main>
  );
};

export default DexPoolDetail;
