import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useDex } from '../contexts/DexContext';
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

  // Load pools on mount
  useEffect(() => {
    if (pools.length === 0) {
      loadPools();
    }
  }, [pools.length, loadPools]);

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
    // Create a new pool
    const newPool = {
      address: `pool-${Date.now()}`,
      tokenA: { symbol: token0, name: token0 },
      tokenB: { symbol: token1, name: token1 },
      tvl: parseFloat(amount0) * 2, // Simplified TVL calculation
      volume24h: 0,
      apy: 0,
      fee: 0.003,
      price0: 1,
      reserve0: parseFloat(amount0),
      reserve1: parseFloat(amount1)
    };

    setLocalPools(prev => [newPool, ...prev]);
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

      <div className="space-y-8 animate-fade-in relative -mt-12 overflow-x-hidden">
        {/* Breadcrumb */}
        <Breadcrumb items={[
          { name: 'Home', url: '/' },
          { name: 'DEX', url: '/dex/swap' },
          { name: 'Pools', url: '' }
        ]} />

        {/* Your Positions - Collapsible Section */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden">
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-comic font-bold text-white mb-2">
              Liquidity Pools
            </h1>
            <p className="text-gray-400 text-lg">
              Discover pools and add liquidity to earn trading fees
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/dex/swap"
              onClick={handleNavClick}
              className="flex items-center gap-2 px-4 py-2 bg-doge/10 border border-doge/30 rounded-xl text-doge hover:bg-doge/20 transition-all"
            >
              <ArrowLeftRight size={16} />
              <span className="text-sm font-bold">Swap</span>
            </Link>
            <button
              onClick={() => {
                playSound('click');
                setShowCreatePoolModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 hover:bg-green-500/20 transition-all"
            >
              <Plus size={16} />
              <span className="text-sm font-bold">Create Pool</span>
            </button>
          </div>
        </div>

        {/* Stats Cards - Dynamic based on view */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {!showPositions ? (
            <>
              {/* Pool Stats */}
              <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-doge/20 flex items-center justify-center">
                    <Droplets size={20} className="text-doge" />
                  </div>
                  <span className="text-gray-400 text-sm font-bold uppercase tracking-wider">Total TVL</span>
                </div>
                <div className="text-3xl font-mono font-bold text-white">{formatUSDValue(totalTVL)}</div>
              </div>
              <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <ArrowLeftRight size={20} className="text-green-400" />
                  </div>
                  <span className="text-gray-400 text-sm font-bold uppercase tracking-wider">24h Volume</span>
                </div>
                <div className="text-3xl font-mono font-bold text-white">{formatUSDValue(totalVolume)}</div>
              </div>
              <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Coins size={20} className="text-purple-400" />
                  </div>
                  <span className="text-gray-400 text-sm font-bold uppercase tracking-wider">Total Pools</span>
                </div>
                <div className="text-3xl font-mono font-bold text-white">{localPools.length}</div>
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
                <div className="text-3xl font-mono font-bold text-white">{formatUSDValue(totalValue)}</div>
              </div>
              <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <TrendingUp size={20} className="text-purple-400" />
                  </div>
                  <span className="text-gray-400 text-sm font-bold uppercase tracking-wider">Staked</span>
                </div>
                <div className="text-3xl font-mono font-bold text-white">{formatUSDValue(stakedValue)}</div>
              </div>
              <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Plus size={20} className="text-green-400" />
                  </div>
                  <span className="text-gray-400 text-sm font-bold uppercase tracking-wider">Pending Rewards</span>
                </div>
                <div className="text-3xl font-mono font-bold text-doge">{totalRewards.toFixed(2)} DC</div>
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
        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl">
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
        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">About Liquidity Pools</h2>
          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              Liquidity pools are the backbone of Dogepump DEX. By providing liquidity to a pool, you enable trading between token pairs and earn a share of the trading fees.
            </p>
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Benefits of Providing Liquidity</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-doge mt-1">•</span>
                    <span>Earn trading fees (0.3% of each swap)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-doge mt-1">•</span>
                    <span>Receive LP tokens representing your share</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-doge mt-1">•</span>
                    <span>Stake LP tokens to earn additional rewards</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-doge mt-1">•</span>
                    <span>Support the Dogechain ecosystem</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">How It Works</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-doge mt-1">•</span>
                    <span>Deposit equal value of both tokens</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-doge mt-1">•</span>
                    <span>Receive LP tokens in return</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-doge mt-1">•</span>
                    <span>LP tokens earn fees automatically</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-doge mt-1">•</span>
                    <span>Withdraw anytime with accumulated fees</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-doge/10 to-purple-500/10 border border-doge/30 rounded-2xl p-8 text-center">
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
      <CreatePoolModal
        isOpen={showCreatePoolModal}
        onClose={() => setShowCreatePoolModal(false)}
        onCreatePool={handleCreatePool}
        tokens={[
          { id: 'doge', symbol: 'DC', name: 'DogeChain', balance: '10000' },
          { id: 'usdc', symbol: 'USDC', name: 'USD Coin', balance: '5000' },
          { id: 'eth', symbol: 'ETH', name: 'Ethereum', balance: '2500' },
          { id: 'wdoge', symbol: 'wDOGE', name: 'Wrapped DOGE', balance: '8000' },
        ]}
        soundsEnabled={true}
      />
    </>
  );
};

export default DexPoolsPage;
