import React, { useState, useCallback, useEffect } from 'react';
import { Pool, LiquidityPosition, Token } from '../../contexts/DexContext';
import { TokenInfo } from '../../types';
import { Droplets, Search } from 'lucide-react';
import SectionHeader from './SectionHeader';
import PositionsEmptyState from './PositionsEmptyState';
import DexLiquidityPositions from './DexLiquidityPositions';
import DexPoolCard from './DexPoolCard';
import PoolStatsGrid from './PoolStatsGrid';
import PoolPriceChart from './PoolPriceChart';
import AddLiquidityPanel from './AddLiquidityPanel';
import RecentSwapsTable, { RecentSwap } from './RecentSwapsTable';
import ProvidersTable, { LiquidityProvider } from './ProvidersTable';
import { generateRecentSwapsForPool, generateLiquidityProvidersForPool, DummySwap } from '../../services/dex/dummyData';
import { playSound } from '../../services/audio';

interface DexUnifiedLiquidityProps {
  token: Token;
  pools: Pool[];
  liquidityPositions: LiquidityPosition[];
  dcToken: TokenInfo;
  onStake?: (position: LiquidityPosition) => void;
  onNavigateToFarm?: () => void;
  soundsEnabled?: boolean;
}

type SortOption = 'tvl' | 'volume' | 'apy';
type SortDirection = 'asc' | 'desc';

interface PoolDetails {
  recentSwaps: RecentSwap[];
  topProviders: LiquidityProvider[];
}

const DexUnifiedLiquidity: React.FC<DexUnifiedLiquidityProps> = ({
  token,
  pools,
  liquidityPositions,
  dcToken,
  onStake,
  onNavigateToFarm,
  soundsEnabled = true,
}) => {
  // State for collapsible sections
  const [positionsExpanded, setPositionsExpanded] = useState(false);
  const [poolsExpanded, setPoolsExpanded] = useState(false);

  // Pool search, sort, and pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('tvl');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [expandedPoolAddress, setExpandedPoolAddress] = useState<string | null>(null);
  const [poolDetailsCache, setPoolDetailsCache] = useState<Map<string, PoolDetails>>(new Map());

  // Filter positions for current token
  const tokenPositions = liquidityPositions.filter(position =>
    position.pool.tokenA.address === token.address ||
    position.pool.tokenB.address === token.address
  );

  // Initialize positions expanded state based on whether user has positions
  useEffect(() => {
    setPositionsExpanded(tokenPositions.length > 0);
  }, [tokenPositions.length]);

  // Initialize pools expanded state based on screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setPoolsExpanded(window.innerWidth >= 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

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
  }, []);

  // Handle sort change
  const handleSortChange = useCallback((newSortBy: SortOption) => {
    playSound('click');
    if (sortBy === newSortBy) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDirection('desc');
    }
  }, [sortBy]);

  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    playSound('click');
    setCurrentPage(newPage);
  }, []);

  // Handle pool expand/collapse
  const handlePoolExpand = useCallback((pool: Pool) => {
    playSound('click');
    setExpandedPoolAddress(prev => prev === pool.address ? null : pool.address);
  }, []);

  // Handle quick add - toggle expand/collapse and scroll if expanding
  const handleQuickAddScroll = useCallback((pool: Pool) => {
    playSound('click');
    if (expandedPoolAddress === pool.address) {
      setExpandedPoolAddress(null);
    } else {
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
  }, [expandedPoolAddress]);

  // Scroll to pools section
  const scrollToPools = useCallback(() => {
    setPoolsExpanded(true);
    setTimeout(() => {
      const poolsSection = document.querySelector('[data-pools-section]');
      if (poolsSection) {
        poolsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }, []);

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
    <div className="space-y-6 w-full">
      {/* Your Positions Section */}
      <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden">
        <SectionHeader
          title="Your Positions"
          count={tokenPositions.length}
          icon={Droplets}
          isExpanded={positionsExpanded}
          onToggle={() => setPositionsExpanded(!positionsExpanded)}
          theme="purple"
        />
        {positionsExpanded && (
          <div className="p-6 animate-fade-in">
            {tokenPositions.length === 0 ? (
              <PositionsEmptyState onBrowsePools={scrollToPools} />
            ) : (
              <DexLiquidityPositions
                positions={tokenPositions}
                onStake={onStake}
                soundsEnabled={soundsEnabled}
              />
            )}
          </div>
        )}
      </div>

      {/* All Pools Section */}
      <div
        data-pools-section
        className="bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden"
      >
        <SectionHeader
          title="All Pools"
          count={pools.length}
          icon={Search}
          isExpanded={poolsExpanded}
          onToggle={() => setPoolsExpanded(!poolsExpanded)}
          theme="purple"
        />
        {poolsExpanded && (
          <div className="p-6 animate-fade-in space-y-6">
            {/* Search Bar */}
            <div className="relative w-full">
              <input
                id="pool-search"
                name="poolSearch"
                type="text"
                placeholder="Search pools..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-doge/50 focus:ring-1 focus:ring-doge/50 outline-none transition-all placeholder:text-gray-600"
                aria-label="Search pools"
              />
            </div>

            {/* Sort Controls */}
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

            {/* Pools List */}
            {paginatedPools.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center" role="status">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search size={32} className="text-gray-600" />
                </div>
                <p className="text-gray-400">
                  {searchQuery ? 'No pools found matching your search.' : 'No pools available.'}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6 md:gap-8">
                  {paginatedPools.map(pool => {
                    const hasPosition = tokenPositions.some(pos => pos.pool.address === pool.address);

                    return (
                      <div key={pool.address} className="overflow-hidden">
                        <DexPoolCard
                          pool={pool}
                          onClick={handlePoolExpand}
                          onQuickAdd={handleQuickAddScroll}
                          isExpanded={expandedPoolAddress === pool.address}
                          hasPosition={hasPosition}
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
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-bold text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      aria-label="Previous page"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-400 px-4">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-bold text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      aria-label="Next page"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DexUnifiedLiquidity;
