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

      <div className="space-y-8 animate-fade-in relative -mt-12 overflow-x-hidden">
        {/* Breadcrumb */}
        <Breadcrumb items={[
          { name: 'Home', url: '/' },
          { name: 'DEX', url: '/dex/swap' },
          { name: 'Swap', url: '' }
        ]} />

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-doge/20 flex items-center justify-center">
                <Coins size={20} className="text-doge" />
              </div>
              <span className="text-gray-400 text-sm font-bold uppercase tracking-wider">Total Pools</span>
            </div>
            <div className="text-3xl font-mono font-bold text-white">8</div>
          </div>
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <ArrowLeftRight size={20} className="text-green-400" />
              </div>
              <span className="text-gray-400 text-sm font-bold uppercase tracking-wider">24h Volume</span>
            </div>
            <div className="text-3xl font-mono font-bold text-white">$401K</div>
          </div>
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <TrendingUp size={20} className="text-purple-400" />
              </div>
              <span className="text-gray-400 text-sm font-bold uppercase tracking-wider">Best APY</span>
            </div>
            <div className="text-3xl font-mono font-bold text-doge">73.5%</div>
          </div>
        </div>

        {/* Swap Component */}
        <div className="max-w-2xl mx-auto">
          <DexSwap />
        </div>

        {/* Info Section */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">About Dogepump DEX</h2>
          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              Dogepump DEX is a decentralized exchange built on Dogechain, enabling fast and secure token swaps with low fees.
            </p>
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Key Features</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-doge mt-1">•</span>
                    <span>Low 0.3% trading fees</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-doge mt-1">•</span>
                    <span>Instant token swaps</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-doge mt-1">•</span>
                    <span>Best price routing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-doge mt-1">•</span>
                    <span>High liquidity pools</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Supported Tokens</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-doge mt-1">•</span>
                    <span>DC - DogePump Coin (native)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-doge mt-1">•</span>
                    <span>wDOGE - Wrapped Doge</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-doge mt-1">•</span>
                    <span>All launched memecoins</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-doge mt-1">•</span>
                    <span>Custom token pairs</span>
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

export default DexSwapPage;
