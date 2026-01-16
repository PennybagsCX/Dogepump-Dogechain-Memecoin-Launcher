import React from 'react';
import { Award, TrendingUp, DollarSign, Activity, ArrowRight } from 'lucide-react';
import { formatNumber } from '../services/web3Service';

interface KarmaOverviewTileProps {
  karmaPrice: number;
  karmaTVL: number;
  karmaAPY: number;
  karmaSupply: number;
  stakedAmount: number;
  pendingRewards: number;
}

export const KarmaOverviewTile: React.FC<KarmaOverviewTileProps> = ({
  karmaPrice,
  karmaTVL,
  karmaAPY,
  karmaSupply,
  stakedAmount,
  pendingRewards,
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
                <p className="text-lg sm:text-xl font-black text-white leading-tight">Stake & Earn</p>
              </div>
              <span className="text-[10px] sm:text-xs bg-white/10 px-2 py-1 rounded-full text-gray-300 font-semibold uppercase tracking-widest">Rewards</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {formatNumber(karmaAPY)}% <span className="text-doge">APY</span>
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-xl px-3 py-2 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={14} className="text-doge" />
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Price</span>
            </div>
            <div className="text-lg font-mono font-bold text-white">
              ${formatNumber(karmaPrice)}
            </div>
          </div>
          <div className="bg-white/5 rounded-xl px-3 py-2 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <Activity size={14} className="text-doge" />
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">TVL</span>
            </div>
            <div className="text-lg font-mono font-bold text-white">
              ${formatNumber(karmaTVL)}
            </div>
          </div>
          <div className="bg-white/5 rounded-xl px-3 py-2 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={14} className="text-doge" />
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Your Stake</span>
            </div>
            <div className="text-lg font-mono font-bold text-white">
              {formatNumber(stakedAmount)}
            </div>
          </div>
          <div className="bg-white/5 rounded-xl px-3 py-2 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <Award size={14} className="text-doge" />
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Pending</span>
            </div>
            <div className="text-lg font-mono font-bold text-doge">
              {formatNumber(pendingRewards)}
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <a
          href="/karma"
          className="inline-flex items-center justify-center gap-2 w-full px-6 py-4 bg-gradient-to-r from-doge to-doge-dark rounded-2xl text-white font-bold uppercase tracking-wider text-sm hover:scale-105 transition-transform duration-300 shadow-[0_0_20px_rgba(212,175,55,0.3)]"
        >
          View $KARMA Dashboard <ArrowRight size={18} />
        </a>
      </div>
    </div>
  );
};
