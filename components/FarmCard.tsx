import React from 'react';
import { useStore } from '../contexts/StoreContext';
import { TokenOwnerFarm, TokenOwnerFarmPosition } from '../types';
import { TrendingUp, Users, Clock, Award, Droplets } from 'lucide-react';
import { formatNumber } from '../utils';
import { InlineStakingPanel } from './InlineStakingPanel';

interface FarmCardProps {
  farm: TokenOwnerFarm;
  rewardToken?: any;
  stakingToken?: any;
  onManage?: () => void;
  onStake?: () => void;
  onClick?: () => void;
  showManageButton?: boolean;
  // Inline staking props
  showInlineStaking?: boolean;
  userStakingBalance?: number;
  userPosition?: TokenOwnerFarmPosition;
  onInlineStakingToggle?: (farmId: string) => void;
  isInlineStakingExpanded?: boolean;
}

export const FarmCard: React.FC<FarmCardProps> = React.memo<FarmCardProps>(({
  farm,
  rewardToken: propRewardToken,
  stakingToken: propStakingToken,
  onManage,
  onStake,
  onClick,
  showManageButton = true,
  // Inline staking props
  showInlineStaking = false,
  userStakingBalance = 0,
  userPosition,
  onInlineStakingToggle,
  isInlineStakingExpanded = false
}) => {
  const {
    tokens,
    getFarmStats
  } = useStore();

  const stakingToken = propStakingToken || tokens.find(t => t.id === farm.stakingTokenId);
  const rewardToken = propRewardToken || tokens.find(t => t.id === farm.rewardTokenId);
  const stats = getFarmStats(farm.id);

  const statusColors = {
    active: 'bg-green-500/10 border-green-500/30 text-green-400',
    paused: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    expired: 'bg-gray-500/10 border-gray-500/30 text-gray-400',
    closed: 'bg-red-500/10 border-red-500/30 text-red-400'
  };

  const calculateAPY = () => {
    if (!stats || stats.totalStaked === 0) return 0;
    const dailyRewards = farm.config.rewardRate * 86400 * stats.totalStaked;
    const annualRewards = dailyRewards * 365;
    const apy = (annualRewards / stats.totalStaked) * 100;
    return Math.min(apy, 50000); // Cap at 50,000%
  };

  const currentAPY = calculateAPY();

  const isClickable = onClick && !showManageButton;

  return (
    <div
      className={`bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden hover:border-doge/30 hover:shadow-lg hover:shadow-doge/10 transition-all ${isClickable ? 'cursor-pointer' : ''}`}
      onClick={isClickable ? onClick : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {/* Header */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Reward Token Icon */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-doge/20 to-doge/10 border-2 border-doge/30 flex items-center justify-center text-base font-bold text-doge shadow-lg">
              {rewardToken?.ticker?.charAt(0) || farm.rewardTokenId?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {rewardToken?.name || 'Unknown'} Farm
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-gray-500 text-xs">Stake</span>
                <span className="text-sm font-medium text-white">{stakingToken?.ticker || 'DC'}</span>
                <span className="text-gray-600 text-xs">→</span>
                <span className="text-gray-500 text-xs">Earn</span>
                <span className="text-sm font-medium text-doge">{rewardToken?.ticker || 'DC'}</span>
              </div>
            </div>
          </div>
          {/* Status Badge */}
          <div className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border ${statusColors[farm.status]}`}>
            {farm.status}
          </div>
        </div>
        {/* Description */}
        {farm.description && (
          <p className="text-gray-400 text-xs leading-relaxed">{farm.description}</p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="p-5 grid grid-cols-2 gap-3">
        {/* APY */}
        <div className="bg-white/5 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp size={14} className="text-doge" />
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">APY</div>
          </div>
          <div className="text-lg font-mono font-bold text-doge text-center">
            {currentAPY.toFixed(2)}%
          </div>
        </div>

        {/* Total Staked */}
        <div className="bg-white/5 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Droplets size={14} className="text-blue-400" />
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Staked</div>
          </div>
          <div className="text-lg font-mono font-bold text-white text-center">
            {stats?.totalStaked ? formatNumber(stats.totalStaked) : '0'}
          </div>
        </div>

        {/* Available Rewards */}
        <div className="bg-white/5 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Award size={14} className="text-green-400" />
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Available Rewards</div>
          </div>
          <div className="text-sm font-mono font-bold text-green-400 text-center" aria-label={`Available rewards ${farm.pool.availableRewards} ${rewardToken?.ticker || 'DC'}`}>
            {formatNumber(farm.pool.availableRewards)} <span className="text-xs text-gray-400 ml-1">{rewardToken?.ticker || 'DC'}</span>
          </div>
        </div>

        {/* Total Distributed */}
        <div className="bg-white/5 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock size={14} className="text-purple-400" />
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Distributed</div>
          </div>
          <div className="text-sm font-mono font-bold text-gray-300 text-center" aria-label={`Total distributed ${farm.pool.totalDistributed} ${rewardToken?.ticker || 'DC'}`}>
            {formatNumber(farm.pool.totalDistributed)} <span className="text-xs text-gray-400 ml-1">{rewardToken?.ticker || 'DC'}</span>
          </div>
        </div>
      </div>

      {/* Participants */}
      <div className="px-5 py-4 border-t border-white/5 bg-white/[0.02]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="w-7 h-7 rounded-full bg-gradient-to-br from-doge/20 to-doge/10 border-2 border-[#0A0A0A] flex items-center justify-center text-xs font-bold text-doge shadow-sm"
                  title={`Staker ${i}`}
                >
                  {i}
                </div>
              ))}
            </div>
            <span className="text-sm text-gray-400 font-medium">
              {formatNumber(stats?.uniqueStakers || 0)} <span className="text-gray-500 text-xs">stakers</span>
            </span>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Duration</div>
            <div className="text-sm font-mono font-bold text-white">
              {formatNumber(Math.ceil(farm.config.duration / 24 / 60 / 60 / 1000))} <span className="text-xs text-gray-400">days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      {showManageButton && (onManage || onStake) && (
        <div className={`p-4 border-t ${statusColors[farm.status]} bg-white/[0.02]`}>
          <div className="flex gap-3">
            {onManage && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onManage();
                }}
                disabled={farm.status !== 'active'}
                className={`flex-1 px-4 py-2.5 font-bold rounded-lg transition-all ${
                  farm.status === 'active'
                    ? 'bg-doge text-black hover:bg-doge-light'
                    : 'bg-white/5 text-gray-500 cursor-not-allowed'
                }`}
              >
                Manage Farm
              </button>
            )}
            {onStake && farm.status === 'active' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStake();
                }}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-doge to-doge-light hover:from-doge-light hover:to-doge text-black font-bold rounded-lg transition-all shadow-lg shadow-doge/20"
              >
                Stake Now
              </button>
            )}
          </div>
        </div>
      )}

      {/* Inline Staking Panel */}
      {showInlineStaking && (
        <InlineStakingPanel
          farm={farm}
          stakingToken={stakingToken}
          rewardToken={rewardToken}
          userBalance={userStakingBalance}
          initialPosition={userPosition}
          onStakeComplete={() => onInlineStakingToggle?.(farm.id)}
        />
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  // Only re-render if critical farm properties change
  return (
    prevProps.farm.id === nextProps.farm.id &&
    prevProps.farm.status === nextProps.farm.status &&
    prevProps.farm.pool.availableRewards === nextProps.farm.pool.availableRewards &&
    prevProps.farm.stats.totalStaked === nextProps.farm.stats.totalStaked &&
    prevProps.farm.stats.currentAPY === nextProps.farm.stats.currentAPY &&
    prevProps.farm.pool.totalDistributed === nextProps.farm.pool.totalDistributed &&
    prevProps.showManageButton === nextProps.showManageButton &&
    prevProps.showInlineStaking === nextProps.showInlineStaking &&
    prevProps.userStakingBalance === nextProps.userStakingBalance &&
    prevProps.userPosition?.stakedAmount === nextProps.userPosition?.stakedAmount &&
    prevProps.isInlineStakingExpanded === nextProps.isInlineStakingExpanded
  );
});
