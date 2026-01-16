import React from 'react';
import { Award, TrendingUp, DollarSign, Activity, Shield, Zap, Users } from 'lucide-react';
import { formatNumber } from '../services/web3Service';

interface KarmaHeroTileProps {
  karmaPrice: number;
  karmaTVL: number;
  karmaAPY: number;
  karmaSupply: number;
  karmaMarketCap: number;
  totalStakers: number;
  stakedPercentage: number;
  lastUpdateTime: string;
}

export const KarmaHeroTile: React.FC<KarmaHeroTileProps> = ({
  karmaPrice,
  karmaTVL,
  karmaAPY,
  karmaSupply,
  karmaMarketCap,
  totalStakers,
  stakedPercentage,
  lastUpdateTime,
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0B0B0F] via-[#0B0B0F]/90 to-black shadow-2xl">
      {/* Decorative elements */}
      <div className="absolute -left-10 -top-10 h-36 w-36 rounded-full bg-doge/10 blur-3xl"></div>
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-doge/10 to-transparent"></div>

      <div className="relative px-5 py-6 sm:px-6 sm:py-7 md:px-8 md:py-9 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="shrink-0 p-4 rounded-2xl bg-[#0F0F12] border border-doge/30 text-doge shadow-lg">
            <Award size={28} className="fill-doge/30" />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-doge/80 font-semibold">$KARMA Token</p>
                <p className="text-lg sm:text-xl font-black text-white leading-tight">Governance & Rewards</p>
              </div>
              <span className="text-[10px] sm:text-xs bg-doge/10 px-2 py-1 rounded-full text-doge font-semibold uppercase tracking-widest border border-doge/30">Native</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white leading-tight">
              ${formatNumber(karmaPrice)} <span className="text-doge">$KARMA</span>
            </p>
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={16} className="text-doge" />
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total Value Locked</span>
            </div>
            <div className="text-xl font-mono font-bold text-white">
              ${formatNumber(karmaTVL)}
            </div>
          </div>
          <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-doge" />
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Staking APY</span>
            </div>
            <div className="text-xl font-mono font-bold text-doge">
              {formatNumber(karmaAPY)}%
            </div>
          </div>
          <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={16} className="text-doge" />
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Market Cap</span>
            </div>
            <div className="text-xl font-mono font-bold text-white">
              ${formatNumber(karmaMarketCap)}
            </div>
          </div>
        </div>

        {/* Token Details */}
        <div className="space-y-3 text-sm sm:text-base leading-relaxed text-gray-200">
          <p className="text-gray-300">
            $KARMA is the native governance and rewards token of DogePump. Stake $KARMA to earn more $KARMA, participate in governance decisions, and receive <span className="text-white font-semibold">bonus rewards</span> from memecoin staking.
          </p>

          {/* Feature highlights */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-doge font-semibold uppercase tracking-widest text-[11px] sm:text-xs">
              <Zap size={14} /> Multi-utility Token
            </div>
            <span className="text-[11px] sm:text-xs text-gray-400 sm:ml-auto">Governance + Staking + Rewards</span>
          </div>

          {/* Detailed stats */}
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px] sm:text-sm text-gray-300">
            <li className="flex items-start gap-2 bg-white/5 rounded-xl px-3 py-2 border border-white/5">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-doge"></span>
              <span>Total Supply: <span className="text-white font-semibold font-mono">{formatNumber(karmaSupply)} $KARMA</span></span>
            </li>
            <li className="flex items-start gap-2 bg-white/5 rounded-xl px-3 py-2 border border-white/5">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-doge"></span>
              <span>Staked: <span className="text-doge font-semibold font-mono">{stakedPercentage.toFixed(1)}%</span> of supply</span>
            </li>
            <li className="flex items-start gap-2 bg-white/5 rounded-xl px-3 py-2 border border-white/5">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-doge"></span>
              <span>Total Stakers: <span className="text-white font-semibold font-mono">{formatNumber(totalStakers)}</span></span>
            </li>
            <li className="flex items-start gap-2 bg-white/5 rounded-xl px-3 py-2 border border-white/5">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-doge"></span>
              <span>Last Update: <span className="text-gray-400 font-mono">{new Date(lastUpdateTime).toLocaleDateString()}</span></span>
            </li>
          </ul>
        </div>

        {/* Security badge */}
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-doge/5 border border-doge/20">
          <Shield size={16} className="text-doge" />
          <span className="text-xs text-gray-300">
            <span className="text-doge font-semibold">Audited & Secure</span> - Smart contracts verified
          </span>
        </div>
      </div>
    </div>
  );
};
