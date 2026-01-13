import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useDex, Pool, Token } from '../contexts/DexContext';
import { DUMMY_POOLS, DUMMY_RECENT_SWAPS, DUMMY_LIQUIDITY_POSITIONS } from '../services/dex/dummyData';
import DexPoolList from '../components/dex/DexPoolList';
import DexLiquidityPositions from '../components/dex/DexLiquidityPositions';
import AddLiquidityPanel from '../components/dex/AddLiquidityPanel';
import CreatePoolModal from '../components/dex/CreatePoolModal';
import Breadcrumb from '../components/Breadcrumb';
import { ArrowLeftRight, Droplets, TrendingUp, Coins, Plus, Search, Wallet, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { playSound } from '../services/audio';
import { formatUSDValue } from '../services/dex/dummyData';

/**
 * DEX Pools Page
 * 
 * Discovery page for browsing and managing liquidity pools on Dogepump DEX.
 * Shows pool statistics, TVL, volume, and APY for all available pools.
 */
const DexPoolsPage: React.FC = () => {
  const { pools, loadPools, setSelectedPool } = useDex();
  const navigate = useNavigate();
  const [localPools, setLocalPools] = useState(DUMMY_POOLS);
  const [showRecentSwaps, setShowRecentSwaps] = useState(false);
  const [positions, setPositions] = useState(DUMMY_LIQUIDITY_POSITIONS);
  const [showPositions, setShowPositions] = useState(DUMMY_LIQUIDITY_POSITIONS.length > 0);
  const [showCreatePoolModal, setShowCreatePoolModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const createPoolInlineRef = useRef<HTMLDivElement | null>(null);
  const platformTokens: Token[] = [
    { address: 'dc', symbol: 'DC', name: 'DogeChain', decimals: 18, balance: '10000' },
    { address: 'karma', symbol: 'KARMA', name: 'Karma', decimals: 18, balance: '5000' },
    { address: 'moon', symbol: 'MOON', name: 'Moon Token', decimals: 18, balance: '2500' },
    { address: 'pump', symbol: 'PUMP', name: 'Pump Token', decimals: 18, balance: '8000' },
    { address: 'wow', symbol: 'WOW', name: 'Wow Token', decimals: 18, balance: '4200' },
  ];

  // Load pools on mount
  useEffect(() => {
    if (pools.length === 0) {
      loadPools();
    }
  }, [pools.length, loadPools]);

  // Track mobile breakpoint for inline create panel
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const handle = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(e.matches);
    handle(mq);
    mq.addEventListener('change', handle as EventListener);
    return () => mq.removeEventListener('change', handle as EventListener);
  }, []);

  // Handle pool click
  const handlePoolClick = useCallback((pool: any) => {
    playSound('click');
    setSelectedPool(pool);
    // Navigate to pool detail page
    navigate(`/dex/pool/${pool.address}`);
  }, [setSelectedPool, navigate]);

  // Toggle recent swaps
  const handleToggleSwaps = useCallback(() => {
    playSound('click');
    setShowRecentSwaps(!showRecentSwaps);
  }, [showRecentSwaps]);

  const handleNavClick = () => {
    playSound('click');
  };

  // Toggle positions section
  const handleTogglePositions = useCallback(() => {
    playSound('click');
    setShowPositions(prev => !prev);
  }, []);

  // Handle stake
  const handleStake = useCallback((positionId: string) => {
    playSound('click');
    setPositions(prev =>
      prev.map(pos =>
        pos.id === positionId ? { ...pos, isStaked: true } : pos
      )
    );
  }, []);

  // Handle remove position (when liquidity is successfully removed)
  const handleRemovePosition = useCallback((positionId: string) => {
    setPositions(prev => prev.filter(pos => pos.id !== positionId));
  }, []);

  // Handle create pool
  const handleCreatePool = useCallback((token0: string, token1: string, amount0: string, amount1: string) => {
    // Create a new pool (temporary client-only object)
    const newPool: Pool = {
      address: `pool-${Date.now()}`,
      tokenA: { address: token0, symbol: token0, name: token0, decimals: 18 },
      tokenB: { address: token1, symbol: token1, name: token1, decimals: 18 },
      reserve0: amount0,
      reserve1: amount1,
      totalSupply: '0',
      tvl: parseFloat(amount0) * 2, // Simplified TVL calculation
      volume24h: 0,
      apy: 0,
      fee: 0.3,
      price0: 1,
      price1: 1,
    };

    setLocalPools((prev) => [newPool, ...prev]);
    console.log('Pool created:', newPool);
  }, []);

  // Calculate total TVL
  const totalTVL = localPools.reduce((acc, pool) => acc + pool.tvl, 0);

  // Calculate total volume
  const totalVolume = localPools.reduce((acc, pool) => acc + pool.volume24h, 0);

  // Calculate personal stats
  const totalValue = positions.reduce((acc, pos) => acc + pos.valueUSD, 0);
  const stakedValue = positions.filter(pos => pos.isStaked).reduce((acc, pos) => acc + pos.valueUSD, 0);
  const totalRewards = positions.filter(pos => pos.farmRewards).reduce((acc, pos) => {
    return acc + parseFloat(pos.farmRewards || '0');
  }, 0);

  return (
    <>
      <Helmet>
        <title>Pools | Dogepump DEX</title>
        <meta name="description" content="Browse and discover liquidity pools on Dogepump DEX. Add liquidity and earn rewards." />
        <meta name="keywords" content="pools, liquidity, LP, yield farming, DogeChain" />
        <link rel="canonical" href="https://dogepump.com/dex/pools" />
        <meta property="og:title" content="Pools | Dogepump DEX" />
        <meta property="og:description" content="Browse and discover liquidity pools on Dogepump DEX. Add liquidity and earn rewards." />
        <meta property="og:url" content="https://dogepump.com/dex/pools" />
        <meta name="twitter:title" content="Pools | Dogepump DEX" />
        <meta name="twitter:description" content="Browse and discover liquidity pools on Dogepump DEX. Add liquidity and earn rewards." />
      </Helmet>

      <div className="animate-fade-in relative overflow-x-hidden">
        {/* Breadcrumb */}
        <Breadcrumb items={[
          { name: 'Home', url: '/' },
          { name: 'DEX', url: '/dex/swap' },
          { name: 'Pools', url: '' }
        ]} />

        {/* Your Positions - Collapsible Section */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden mt-8">
          <button
            onClick={handleTogglePositions}
            className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors"
            aria-expanded={showPositions}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-doge/20 flex items-center justify-center">
                <Wallet size={20} className="text-doge" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-white">Your Positions</h3>
                <p className="text-sm text-gray-400">
                  {positions.length === 0
                    ? 'No active positions'
                    : `${positions.length} position${positions.length > 1 ? 's' : ''}`
                  }
                </p>
              </div>
            </div>
          </button>

          {showPositions && (
            <div className="border-t border-white/10 p-6 animate-fade-in">
              <DexLiquidityPositions
                positions={positions}
                onStake={handleStake}
                onPoolClick={handlePoolClick}
                onRemovePosition={handleRemovePosition}
                soundsEnabled={true}
              />
            </div>
          )}
        </div>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-8 mb-8 md:mb-10">
          <div className="space-y-2 md:space-y-3">
            <h1 className="text-4xl md:text-5xl font-comic font-bold text-white mb-2">
              Liquidity Pools
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              Discover pools and add liquidity to earn trading fees
            </p>
          </div>
          <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 w-full sm:w-auto">
            <Link
              to="/dex/swap"
              onClick={handleNavClick}
              className="w-full sm:w-auto flex items-center justify-center gap-2 h-11 sm:h-12 px-3 sm:px-4 bg-doge/10 border border-doge/30 rounded-xl text-doge hover:bg-doge/20 transition-all font-bold text-sm"
            >
              <ArrowLeftRight size={16} />
              <span className="text-sm font-bold">Swap</span>
            </Link>
            <div className="w-full md:w-auto" ref={createPoolInlineRef}>
              <button
                onClick={() => {
                  playSound('click');
                  setShowCreatePoolModal(prev => {
                    const next = !prev;
                    return next;
                  });
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 h-11 sm:h-12 px-3 sm:px-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 hover:bg-green-500/20 transition-all font-bold text-sm"
              >
                <Plus size={16} />
                <span className="text-sm font-bold">{showCreatePoolModal && isMobile ? 'Hide' : 'Create Pool'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Inline Create Pool (mobile) full width below header actions */}
        {isMobile && showCreatePoolModal && (
          <div className="mt-3 mb-6 md:mb-8">
            <CreatePoolModal
              isOpen={showCreatePoolModal}
              onClose={() => setShowCreatePoolModal(false)}
              onCreatePool={handleCreatePool}
              tokens={platformTokens}
              soundsEnabled={true}
              inline
            />
          </div>
        )}

        {/* Stats Cards - Dynamic based on view */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 md:mb-10">
          {!showPositions ? (
            <>
              {/* Pool Stats */}
              <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-center gap-3 mb-3 text-center">
                  <div className="w-10 h-10 rounded-xl bg-doge/20 flex items-center justify-center">
                    <Droplets size={20} className="text-doge" />
                  </div>
                  <span className="text-gray-400 text-sm font-bold uppercase tracking-wider">Total TVL</span>
                </div>
                <div className="text-3xl font-mono font-bold text-white text-center">{formatUSDValue(totalTVL)}</div>
              </div>
              <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-center gap-3 mb-3 text-center">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <ArrowLeftRight size={20} className="text-green-400" />
                  </div>
                  <span className="text-gray-400 text-sm font-bold uppercase tracking-wider">24h Volume</span>
                </div>
                <div className="text-3xl font-mono font-bold text-white text-center">{formatUSDValue(totalVolume)}</div>
              </div>
              <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-center gap-3 mb-3 text-center">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Coins size={20} className="text-purple-400" />
                  </div>
                  <span className="text-gray-400 text-sm font-bold uppercase tracking-wider">Total Pools</span>
                </div>
                <div className="text-3xl font-mono font-bold text-white text-center">{localPools.length}</div>
              </div>
            </>
          ) : (
            <>
              {/* Personal Stats */}
              <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-doge/20 flex items-center justify-center">
                    <Wallet size={20} className="text-doge" />
                  </div>
                  <span className="text-gray-400 text-sm font-bold uppercase tracking-wider">Your Value</span>
                </div>
                <div className="text-3xl font-mono font-bold text-white text-center">{formatUSDValue(totalValue)}</div>
              </div>
              <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <TrendingUp size={20} className="text-purple-400" />
                  </div>
                  <span className="text-gray-400 text-sm font-bold uppercase tracking-wider">Staked</span>
                </div>
                <div className="text-3xl font-mono font-bold text-white text-center">{formatUSDValue(stakedValue)}</div>
              </div>
              <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Plus size={20} className="text-green-400" />
                  </div>
                  <span className="text-gray-400 text-sm font-bold uppercase tracking-wider">Pending Rewards</span>
                </div>
                <div className="text-3xl font-mono font-bold text-doge text-center">{totalRewards.toFixed(2)} DC</div>
              </div>
            </>
          )}
        </div>

        {/* Pool List */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
          <DexPoolList
            pools={localPools}
            onPoolClick={handlePoolClick}
            soundsEnabled={true}
          />
        </div>

        {/* Recent Pool Activity Toggle */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl mt-8 md:mt-10 mb-8 md:mb-10">
          <button
            onClick={handleToggleSwaps}
            className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <TrendingUp size={20} className="text-doge" />
              <div className="text-left">
                <h3 className="text-lg font-bold text-white">Recent Pool Activity</h3>
                <p className="text-sm text-gray-400">See latest add/remove liquidity events</p>
              </div>
            </div>
            <div className={`transform transition-transform ${showRecentSwaps ? 'rotate-180' : ''}`}>
              <ChevronDown size={20} className="text-gray-400" />
            </div>
          </button>

          {showRecentSwaps && (
            <div className="border-t border-white/10 p-6">
              <div className="space-y-3">
                {/* Pool Activity Events */}
                {[
                  { type: 'add', pool: 'DOGE/USDC', user: '0x8f3d...4a2b', value: '$1,250', time: '2 minutes ago' },
                  { type: 'remove', pool: 'DOGE/USDC', user: '0x2e7c...9d1f', value: '$500', time: '5 minutes ago' },
                  { type: 'add', pool: 'DOGE/ETH', user: '0x5a1b...3e8c', value: '$2,100', time: '8 minutes ago' },
                  { type: 'add', pool: 'USDC/ETH', user: '0x9c4d...2f7a', value: '$3,400', time: '12 minutes ago' },
                  { type: 'remove', pool: 'DOGE/USDC', user: '0x1b8e...6a3d', value: '$800', time: '15 minutes ago' },
                ].map((event, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5 hover:border-doge/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        event.type === 'add' ? 'bg-green-500/20' : 'bg-red-500/20'
                      }`}>
                        {event.type === 'add' ? (
                          <Plus size={14} className="text-green-400" />
                        ) : (
                          <span className="text-red-400 text-xs font-bold">−</span>
                        )}
                      </div>
                      <div>
                        <div className="text-white text-sm font-bold">
                          {event.type === 'add' ? 'Added liquidity to' : 'Removed liquidity from'} {event.pool}
                        </div>
                        <div className="text-xs text-gray-400 font-mono">{event.user}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${event.type === 'add' ? 'text-green-400' : 'text-red-400'}`}>
                        {event.type === 'add' ? '+' : '-'}{event.value}
                      </div>
                      <div className="text-xs text-gray-400">{event.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0B0B0F] via-[#0B0B0F]/90 to-black shadow-2xl">
          <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-doge/10 blur-3xl" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-doge/10 to-transparent" />
          <div className="relative px-6 py-7 md:px-8 md:py-10 flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="shrink-0 p-4 rounded-2xl bg-[#0F0F12] border border-doge/30 text-doge shadow-lg">
                <Droplets size={28} className="fill-doge/30" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-doge/80 font-semibold">About</p>
                    <p className="text-xl md:text-2xl font-black text-white leading-tight">Liquidity Pools</p>
                  </div>
                  <span className="text-[10px] bg-white/10 px-2 py-1 rounded-full text-gray-300 font-semibold uppercase tracking-widest">Pools</span>
                </div>
                <p className="text-sm md:text-base text-gray-200 leading-relaxed">
                  Provide equal-value tokens, earn fees on every swap, and support deep liquidity across Dogepump DEX.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5 text-gray-200 text-sm md:text-base leading-relaxed">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.16em] text-doge/80 font-semibold">Benefits</p>
                <ul className="grid grid-cols-1 gap-2 text-[13px] md:text-sm">
                  {[
                    'Earn 0.3% of each swap in the pool',
                    'Receive LP tokens representing your share',
                    'Stake LP tokens to stack extra rewards',
                    'Strengthen the Dogechain ecosystem'
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 bg-white/5 rounded-xl px-3 py-2 border border-white/5">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-doge" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.16em] text-doge/80 font-semibold">How It Works</p>
                <ul className="grid grid-cols-1 gap-2 text-[13px] md:text-sm">
                  {[
                    'Deposit equal value of both tokens',
                    'Receive LP tokens back instantly',
                    'LP tokens auto-earn fees as trades happen',
                    'Withdraw anytime with your share + fees'
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 bg-white/5 rounded-xl px-3 py-2 border border-white/5">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-doge" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-doge/10 to-purple-500/10 border border-doge/30 rounded-2xl p-8 text-center mt-8 md:mt-10">
          <h2 className="text-2xl font-bold text-white mb-2">Ready to Provide Liquidity?</h2>
          <p className="text-gray-300 mb-6">Browse pools and add liquidity to start earning fees</p>
          <button
            onClick={() => {
              playSound('click');
              const firstPoolCard = document.querySelector('[data-pool-card]');
              if (firstPoolCard) {
                firstPoolCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }}
            className="inline-flex items-center gap-2 bg-doge text-black px-8 py-3 rounded-xl font-bold hover:bg-doge-light transition-all"
          >
            <Plus size={18} />
            Browse Pools
          </button>
        </div>
      </div>

      {/* Create Pool Modal */}
      {!isMobile && (
        <CreatePoolModal
          isOpen={showCreatePoolModal}
          onClose={() => setShowCreatePoolModal(false)}
          onCreatePool={handleCreatePool}
          tokens={platformTokens}
          soundsEnabled={true}
        />
      )}
    </>
  );
};

export default DexPoolsPage;
