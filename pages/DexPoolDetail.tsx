import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useDex } from '../contexts/DexContext';
import { DUMMY_POOLS, generateRecentSwapsForPool, generateLiquidityProvidersForPool } from '../services/dex/dummyData';
import DexPoolDetail from '../components/dex/DexPoolDetail';
import Breadcrumb from '../components/Breadcrumb';
import { ArrowLeft, Droplets } from 'lucide-react';
import { playSound } from '../services/audio';

/**
 * DEX Pool Detail Page
 *
 * Page for viewing detailed information about a specific liquidity pool.
 * Shows pool stats, recent swaps, top liquidity providers, and price charts.
 */
const DexPoolDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { pools, loadPools } = useDex();
  const [recentSwaps, setRecentSwaps] = useState<any[]>([]);
  const [topProviders, setTopProviders] = useState<any[]>([]);

  // Find the pool by ID (MUST be before useEffect that uses it)
  const pool = pools.find(p => p.address === id) || DUMMY_POOLS.find(p => p.address === id);

  // Load pools on mount
  useEffect(() => {
    loadPools();
  }, [loadPools]);

  // Load recent swaps and providers when pool changes
  useEffect(() => {
    if (pool) {
      setRecentSwaps(generateRecentSwapsForPool(pool));
      setTopProviders(generateLiquidityProvidersForPool(pool));
    }
  }, [pool]);

  // If pool not found, show error
  if (!pool) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
        <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center shadow-2xl border border-white/5">
          <Droplets size={64} className="text-gray-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-comic font-bold text-white">Pool Not Found</h1>
          <p className="text-gray-500 max-w-md mx-auto">The requested liquidity pool could not be found.</p>
        </div>
        <Link to="/dex/pools">
          <button
            onClick={() => playSound('click')}
            className="bg-doge text-black px-8 py-3 rounded-xl font-bold hover:bg-doge-light transition-all"
          >
            Back to Pools
          </button>
        </Link>
      </div>
    );
  }

  // Handle swap
  const handleSwap = useCallback(() => {
    playSound('click');
    // Navigate to swap page with this pool pre-selected
    navigate('/dex/swap');
  }, [navigate]);

  const handleNavClick = () => {
    playSound('click');
  };

  return (
    <>
      <Helmet>
        <title>{pool.tokenA.symbol}/{pool.tokenB.symbol} Pool | Dogepump DEX</title>
        <meta name="description" content={`View detailed information about the ${pool.tokenA.symbol}/${pool.tokenB.symbol} liquidity pool on Dogepump DEX.`} />
        <meta name="keywords" content={`DEX, pool, liquidity, ${pool.tokenA.symbol}, ${pool.tokenB.symbol}, DogeChain`} />
        <link rel="canonical" href={`https://dogepump.com/dex/pool/${pool.address}`} />
        <meta property="og:title" content={`${pool.tokenA.symbol}/${pool.tokenB.symbol} Pool | Dogepump DEX`} />
        <meta property="og:description" content={`View detailed information about the ${pool.tokenA.symbol}/${pool.tokenB.symbol} liquidity pool.`} />
        <meta property="og:url" content={`https://dogepump.com/dex/pool/${pool.address}`} />
        <meta name="twitter:title" content={`${pool.tokenA.symbol}/${pool.tokenB.symbol} Pool | Dogepump DEX`} />
        <meta name="twitter:description" content={`View detailed information about the ${pool.tokenA.symbol}/${pool.tokenB.symbol} liquidity pool.`} />
      </Helmet>

      <div className="space-y-8 animate-fade-in relative -mt-12 overflow-x-hidden">
        {/* Breadcrumb */}
        <Breadcrumb items={[
          { name: 'Home', url: '/' },
          { name: 'DEX', url: '/dex/swap' },
          { name: 'Pools', url: '/dex/pools' },
          { name: `${pool.tokenA.symbol}/${pool.tokenB.symbol}`, url: '' }
        ]} />

        {/* Back Button */}
        <div className="flex items-center gap-2">
          <Link
            to="/dex/pools"
            onClick={handleNavClick}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-bold text-sm group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Pools
          </Link>
        </div>

        {/* Pool Detail Component */}
        <DexPoolDetail
          pool={pool}
          recentSwaps={recentSwaps}
          topProviders={topProviders}
          onSwap={handleSwap}
          soundsEnabled={true}
        />

        {/* Info Section */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">About This Pool</h2>
          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              This liquidity pool enables trading between {pool.tokenA.symbol} and {pool.tokenB.symbol} on Dogepump DEX.
              Liquidity providers earn a {pool.fee * 100}% fee on all trades in the pool.
            </p>
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Pool Information</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-doge mt-1">•</span>
                    <span>Pair: {pool.tokenA.symbol}/{pool.tokenB.symbol}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-doge mt-1">•</span>
                    <span>Fee Rate: {pool.fee * 100}%</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-doge mt-1">•</span>
                    <span>Pool Address: {pool.address.slice(0, 10)}...{pool.address.slice(-8)}</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Providing Liquidity</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-doge mt-1">•</span>
                    <span>Deposit both tokens in proportion</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-doge mt-1">•</span>
                    <span>Earn {pool.fee * 100}% of trading fees</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-doge mt-1">•</span>
                    <span>Withdraw anytime with your share</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DexPoolDetailPage;
