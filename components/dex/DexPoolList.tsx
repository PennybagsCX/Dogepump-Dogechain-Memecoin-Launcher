import React, { useState, useCallback, useEffect } from 'react';
import { Pool } from '../../contexts/DexContext';
import DexPoolCard from './DexPoolCard';
import PoolStatsGrid from './PoolStatsGrid';
import PoolPriceChart from './PoolPriceChart';
import AddLiquidityPanel from './AddLiquidityPanel';
import RecentSwapsTable, { RecentSwap } from './RecentSwapsTable';
import ProvidersTable, { LiquidityProvider } from './ProvidersTable';
import { Search } from 'lucide-react';
import { generateRecentSwapsForPool, generateLiquidityProvidersForPool, DummySwap } from '../../services/dex/dummyData';

interface DexPoolListProps {
  pools: Pool[];
  onPoolClick?: (pool: Pool) => void;
  className?: string;
  soundsEnabled?: boolean;
}

interface PoolDetails {
  recentSwaps: RecentSwap[];
  topProviders: LiquidityProvider[];
}

type SortOption = 'tvl' | 'volume' | 'apy';
type SortDirection = 'asc' | 'desc';

const DexPoolList: React.FC<DexPoolListProps> = ({
  pools,
  onPoolClick,
  className = '',
  soundsEnabled = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('tvl');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [expandedPoolAddress, setExpandedPoolAddress] = useState<string | null>(null);
  const [poolDetailsCache, setPoolDetailsCache] = useState<Map<string, PoolDetails>>(new Map());

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

  // Filter pools by search query
  const filteredPools = pools.filter(pool => {
    const query = searchQuery.toLowerCase();
    return (
      pool.tokenA.symbol.toLowerCase().includes(query) ||
      pool.tokenB.symbol.toLowerCase().includes(query) ||
      pool.tokenA.name.toLowerCase().includes(query) ||
      pool.tokenB.name.toLowerCase().includes(query)
    );
  });

  // Sort pools
  const sortedPools = [...filteredPools].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'tvl':
        comparison = a.tvl - b.tvl;
        break;
      case 'volume':
        comparison = a.volume24h - b.volume24h;
        break;
      case 'apy':
        comparison = a.apy - b.apy;
        break;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Paginate pools
  const totalPages = Math.ceil(sortedPools.length / itemsPerPage);
  const paginatedPools = sortedPools.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when search or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, sortDirection]);

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    playSound('click');
    setSearchQuery(e.target.value);
  }, [playSound]);

  // Handle sort change
  const handleSortChange = useCallback((newSortBy: SortOption) => {
    playSound('click');
    if (sortBy === newSortBy) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDirection('desc');
    }
  }, [sortBy, playSound]);

  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    playSound('click');
    setCurrentPage(newPage);
  }, [playSound]);

  // Handle pool click
  const handlePoolClick = useCallback((pool: Pool) => {
    playSound('click');
    onPoolClick?.(pool);
  }, [onPoolClick, playSound]);

  // Handle pool expand/collapse
  const handlePoolExpand = useCallback((pool: Pool) => {
    playSound('click');
    setExpandedPoolAddress(prev => prev === pool.address ? null : pool.address);
  }, [playSound]);

  // Handle quick add - toggle expand/collapse and scroll if expanding
  const handleQuickAddScroll = useCallback((pool: Pool) => {
    playSound('click');
    // Toggle: if already expanded, collapse it; if collapsed, expand and scroll
    if (expandedPoolAddress === pool.address) {
      // Already expanded - collapse it
      setExpandedPoolAddress(null);
    } else {
      // Collapsed - expand it and scroll to Add Liquidity panel
      setExpandedPoolAddress(pool.address);
      setTimeout(() => {
        const addLiquidityPanel = document.querySelector(
          `[data-pool-address="${pool.address}"] [data-add-liquidity-panel]`
        );
        if (addLiquidityPanel) {
          addLiquidityPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [playSound, expandedPoolAddress]);

  // Load pool details when expanded
  useEffect(() => {
    if (expandedPoolAddress && !poolDetailsCache.has(expandedPoolAddress)) {
      const pool = pools.find(p => p.address === expandedPoolAddress);
      if (pool) {
        const dummySwaps = generateRecentSwapsForPool(pool);
        const recentSwaps: RecentSwap[] = dummySwaps.map(ds => ({
          id: ds.id,
          from: ds.tokenIn.address,
          to: ds.tokenOut.address,
          amountIn: ds.amountIn,
          amountOut: ds.amountOut,
          timestamp: ds.timestamp,
          txHash: ds.txHash,
          tokenIn: { symbol: ds.tokenIn.symbol, address: ds.tokenIn.address },
          tokenOut: { symbol: ds.tokenOut.symbol, address: ds.tokenOut.address }
        }));
        const details: PoolDetails = {
          recentSwaps,
          topProviders: generateLiquidityProvidersForPool(pool)
        };
        setPoolDetailsCache(prev => new Map(prev).set(expandedPoolAddress, details));
      }
    }
  }, [expandedPoolAddress, pools]);

  return (
    <section className={`w-full max-w-full space-y-6 ${className}`} role="region" aria-label="Pool list">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-comic font-bold text-white">Pools</h2>
        <div className="relative w-full sm:w-auto">
          <input
            id="pool-search"
            name="poolSearch"
            type="text"
            role="searchbox"
            placeholder="Search pools..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full sm:w-64 bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-doge/50 focus:ring-1 focus:ring-doge/50 outline-none transition-all placeholder:text-gray-600"
            aria-label="Search pools by token name or symbol"
          />
        </div>
      </header>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Sort pools">
        <button
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            sortBy === 'tvl'
              ? 'bg-doge text-black shadow-lg shadow-doge/20'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
          }`}
          onClick={() => handleSortChange('tvl')}
          aria-label={`Sort by TVL ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
        >
          TVL {sortBy === 'tvl' && (sortDirection === 'asc' ? '↑' : '↓')}
        </button>
        <button
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            sortBy === 'volume'
              ? 'bg-doge text-black shadow-lg shadow-doge/20'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
          }`}
          onClick={() => handleSortChange('volume')}
          aria-label={`Sort by Volume ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
        >
          Volume {sortBy === 'volume' && (sortDirection === 'asc' ? '↑' : '↓')}
        </button>
        <button
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            sortBy === 'apy'
              ? 'bg-doge text-black shadow-lg shadow-doge/20'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
          }`}
          onClick={() => handleSortChange('apy')}
          aria-label={`Sort by APY ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
        >
          APY {sortBy === 'apy' && (sortDirection === 'asc' ? '↑' : '↓')}
        </button>
      </div>

      {paginatedPools.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center" role="status" aria-live="polite">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
            <Search size={32} className="text-gray-600" />
          </div>
          <p className="text-gray-400">
            {searchQuery ? 'No pools found matching your search.' : 'No pools available.'}
          </p>
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-6 md:gap-8" role="list" aria-label="Available pools">
            {paginatedPools.map(pool => (
              <li key={pool.address} className="overflow-hidden">
                <DexPoolCard
                  pool={pool}
                  onClick={handlePoolExpand}
                  onQuickAdd={handleQuickAddScroll}
                  isExpanded={expandedPoolAddress === pool.address}
                  soundsEnabled={soundsEnabled}
                />

                {/* Expanded Pool Details */}
                {expandedPoolAddress === pool.address && poolDetailsCache.has(pool.address) && (
                  <div key="expanded" data-pool-address={pool.address} className="mt-6 mb-2 animate-fade-in overflow-x-hidden">
                    <div className="bg-white/[0.02] border border-doge/20 rounded-2xl p-6 space-y-8 overflow-x-hidden">
                      <PoolStatsGrid
                        pool={pool}
                        topProviders={poolDetailsCache.get(pool.address)!.topProviders}
                      />
                      <div data-add-liquidity-panel>
                        <AddLiquidityPanel pool={pool} soundsEnabled={soundsEnabled} />
                      </div>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 p-6 bg-white/5 border border-white/10 rounded-2xl" role="navigation" aria-label="Pagination">
              <button
                className="px-6 py-2 rounded-lg bg-doge text-black font-bold hover:bg-doge-light transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                Previous
              </button>

              <div className="text-sm text-gray-400 font-medium" aria-live="polite">
                Page {currentPage} of {totalPages}
              </div>

              <button
                className="px-6 py-2 rounded-lg bg-doge text-black font-bold hover:bg-doge-light transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default DexPoolList;
