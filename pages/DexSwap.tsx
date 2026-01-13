import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useDex } from '../contexts/DexContext';
import { DUMMY_TOKENS } from '../services/dex/dummyData';
import DexSwap from '../components/dex/DexSwap';
import Breadcrumb from '../components/Breadcrumb';
import { ArrowLeftRight, Coins, Droplets, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { playSound } from '../services/audio';

/**
 * DEX Swap Page
 * 
 * Main page for swapping tokens on the Dogepump DEX.
 * Provides a user-friendly interface for token swaps with price impact calculation.
 */
const DexSwapPage: React.FC = () => {
  const { selectedTokenA, selectedTokenB, setSelectedTokenA, setSelectedTokenB } = useDex();

  // Initialize default tokens on mount
  useEffect(() => {
    if (!selectedTokenA) {
      setSelectedTokenA(DUMMY_TOKENS[0]); // DC
    }
    if (!selectedTokenB) {
      setSelectedTokenB(DUMMY_TOKENS[1]); // wDOGE
    }
  }, [selectedTokenA, selectedTokenB, setSelectedTokenA, setSelectedTokenB]);

  const handleNavClick = () => {
    playSound('click');
  };

  return (
    <>
      <Helmet>
        <title>Swap Tokens | Dogepump DEX</title>
        <meta name="description" content="Swap tokens on Dogepump DEX. Trade DC, wDOGE, and all memecoins launched on the platform." />
        <meta name="keywords" content="DEX, swap, trade, DogeChain, DC, wDOGE, memecoin" />
        <link rel="canonical" href="https://dogepump.com/dex/swap" />
        <meta property="og:title" content="Swap Tokens | Dogepump DEX" />
        <meta property="og:description" content="Swap tokens on Dogepump DEX. Trade DC, wDOGE, and all memecoins launched on the platform." />
        <meta property="og:url" content="https://dogepump.com/dex/swap" />
        <meta name="twitter:title" content="Swap Tokens | Dogepump DEX" />
        <meta name="twitter:description" content="Swap tokens on Dogepump DEX. Trade DC, wDOGE, and all memecoins launched on the platform." />
      </Helmet>

      <div className="animate-fade-in relative overflow-x-hidden">
        {/* Breadcrumb */}
        <Breadcrumb items={[
          { name: 'Home', url: '/' },
          { name: 'DEX', url: '/dex/swap' },
          { name: 'Swap', url: '' }
        ]} />

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-comic font-bold text-white mb-2">
              Swap Tokens
            </h1>
            <p className="text-gray-400 text-lg">
              Trade tokens instantly with the best prices on Dogechain
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/dex/pools"
              onClick={handleNavClick}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:text-white hover:border-doge/50 hover:bg-white/10 transition-all"
            >
              <Droplets size={16} />
              <span className="text-sm font-bold">Pools</span>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-center gap-3 mb-3 text-center">
              <div className="w-10 h-10 rounded-xl bg-doge/20 flex items-center justify-center">
                <Coins size={20} className="text-doge" />
              </div>
              <span className="text-gray-400 text-sm font-bold uppercase tracking-wider">Total Pools</span>
            </div>
            <div className="text-3xl font-mono font-bold text-white text-center">8</div>
          </div>
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-center gap-3 mb-3 text-center">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <ArrowLeftRight size={20} className="text-green-400" />
              </div>
              <span className="text-gray-400 text-sm font-bold uppercase tracking-wider">24h Volume</span>
            </div>
            <div className="text-3xl font-mono font-bold text-white text-center">$401K</div>
          </div>
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-center gap-3 mb-3 text-center">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <TrendingUp size={20} className="text-purple-400" />
              </div>
              <span className="text-gray-400 text-sm font-bold uppercase tracking-wider">Best APY</span>
            </div>
            <div className="text-3xl font-mono font-bold text-doge text-center">73.5%</div>
          </div>
        </div>

        {/* Swap Component */}
        <div className="max-w-2xl mx-auto mt-8">
          <DexSwap />
        </div>

        {/* Info Section */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0B0B0F] via-[#0B0B0F]/90 to-black shadow-2xl mt-8">
          <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-doge/10 blur-3xl" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-doge/10 to-transparent" />
          <div className="relative px-6 py-7 md:px-8 md:py-10 flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="shrink-0 p-4 rounded-2xl bg-[#0F0F12] border border-doge/30 text-doge shadow-lg">
                <ArrowLeftRight size={28} className="fill-doge/30" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-doge/80 font-semibold">About</p>
                    <p className="text-xl md:text-2xl font-black text-white leading-tight">Dogepump DEX</p>
                  </div>
                  <span className="text-[10px] bg-white/10 px-2 py-1 rounded-full text-gray-300 font-semibold uppercase tracking-widest">Swap</span>
                </div>
                <p className="text-sm md:text-base text-gray-200 leading-relaxed">
                  Built on Dogechain for fast, low-fee swaps with auditable routing and deep liquidity.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5 text-gray-200 text-sm md:text-base leading-relaxed">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.16em] text-doge/80 font-semibold">Key Features</p>
                <ul className="grid grid-cols-1 gap-2 text-[13px] md:text-sm">
                  {[
                    '0.3% ultra-low trading fees',
                    'Instant token swaps with best route',
                    'Smart price impact protection',
                    'High liquidity pools backed by bonding curves'
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 bg-white/5 rounded-xl px-3 py-2 border border-white/5">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-doge" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.16em] text-doge/80 font-semibold">Supported Tokens</p>
                <ul className="grid grid-cols-1 gap-2 text-[13px] md:text-sm">
                  {[
                    'DC - DogePump Coin (native)',
                    'wDOGE - Wrapped Doge',
                    'All launched memecoins',
                    'Custom token pairs'
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
      </div>
    </>
  );
};

export default DexSwapPage;
