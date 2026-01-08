import React from 'react';
import { Sprout, TrendingUp } from 'lucide-react';
import { TokenOwnerFarm } from '../types';

interface FarmBadgeProps {
  farms: TokenOwnerFarm[];
  onClick?: () => void;
  compact?: boolean;
}

export const FarmBadge: React.FC<FarmBadgeProps> = ({ farms, onClick, compact = false }) => {
  // Get active farms for this token
  const activeFarms = farms.filter(f => f.status === 'active');

  if (activeFarms.length === 0) {
    return null;
  }

  // Calculate average APY
  const avgAPY = activeFarms.reduce((sum, farm) => {
    const apy = farm.stats.totalStaked > 0
      ? Math.min((farm.config.rewardRate * 86400 * 365 * 100) / farm.stats.totalStaked, 50000)
      : 0;
    return sum + apy;
  }, 0) / activeFarms.length;

  if (compact) {
    return (
      <button
        onClick={onClick}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-doge/20 border border-doge/40 rounded-lg hover:bg-doge/30 transition-all group"
      >
        <Sprout size={14} className="text-doge" />
        <span className="text-xs font-bold text-doge">
          {activeFarms.length} Farm{activeFarms.length > 1 ? 's' : ''}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-doge/20 to-green-500/20 border border-doge/40 rounded-xl hover:border-doge/60 transition-all group w-full"
    >
      <div className="p-2 bg-doge/30 rounded-lg group-hover:bg-doge/40 transition-colors">
        <Sprout size={20} className="text-doge" />
      </div>
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">
            {activeFarms.length} Active Farm{activeFarms.length > 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 border border-green-500/40 rounded-full">
            <TrendingUp size={10} className="text-green-400" />
            <span className="text-xs font-bold text-green-400">
              {avgAPY.toFixed(1)}% APY
            </span>
          </div>
        </div>
        <div className="text-xs text-gray-400 mt-0.5">
          Stake to earn rewards
        </div>
      </div>
    </button>
  );
};
