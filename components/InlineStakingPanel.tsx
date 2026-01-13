import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Wallet, Award, Lock, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { TokenOwnerFarm, TokenOwnerFarmPosition, Token } from '../types';
import { useStore } from '../contexts/StoreContext';
import { formatNumber } from '../utils';
import { useToast } from './Toast';
import { Button } from './Button';

interface InlineStakingPanelProps {
  farm: TokenOwnerFarm;
  stakingToken: Token | undefined;
  rewardToken: Token | undefined;
  userBalance: number;
  initialPosition?: TokenOwnerFarmPosition;
  onStakeComplete?: () => void;
}

export const InlineStakingPanel: React.FC<InlineStakingPanelProps> = ({
  farm,
  stakingToken,
  rewardToken,
  userBalance,
  initialPosition,
  onStakeComplete
}) => {
  const { stakeInFarm, unstakeFromFarm, harvestFarmRewards, getFarmPositions } = useStore();
  const { addToast } = useToast();

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'stake' | 'unstake' | 'harvest'>('stake');
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [selectedPercentage, setSelectedPercentage] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userPosition, setUserPosition] = useState(initialPosition);
  const [pendingRewards, setPendingRewards] = useState(0);

  // Recalculate pending rewards when position changes
  useEffect(() => {
    if (userPosition) {
      const now = Date.now();
      const timeSinceHarvest = (now - userPosition.lastHarvestTime) / 1000;
      const rewards = timeSinceHarvest * farm.config.rewardRate * userPosition.stakedAmount;
      setPendingRewards(userPosition.accumulatedRewards + rewards);
    } else {
      setPendingRewards(0);
    }
  }, [userPosition, farm.config.rewardRate]);

  // Update position when initialPosition changes
  useEffect(() => {
    setUserPosition(initialPosition);
  }, [initialPosition]);

  // Calculate current APY
  const currentAPY = farm.stats.totalStaked > 0
    ? Math.min((farm.config.rewardRate * 86400 * 365 * 100) / farm.stats.totalStaked, 50000)
    : 0;

  // Handle stake
  const handleStake = async () => {
    const amount = parseFloat(stakeAmount);
    if (!amount || amount <= 0) {
      addToast('error', 'Invalid Amount', 'Please enter a valid amount to stake.');
      return;
    }
    if (amount > userBalance) {
      addToast('error', 'Insufficient Balance', `You need ${formatNumber(amount - userBalance)} more ${stakingToken?.ticker || 'tokens'} to stake this amount.`);
      return;
    }
    if (amount < farm.config.minStakeAmount) {
      addToast('error', 'Amount Too Low', `Minimum stake amount is ${formatNumber(farm.config.minStakeAmount)} ${stakingToken?.ticker || 'tokens'}.`);
      return;
    }
    if (farm.config.maxStakeAmount > 0 && amount > farm.config.maxStakeAmount) {
      addToast('error', 'Amount Too High', `Maximum stake amount is ${formatNumber(farm.config.maxStakeAmount)} ${stakingToken?.ticker || 'tokens'}.`);
      return;
    }

    setIsProcessing(true);
    try {
      await stakeInFarm(farm.id, amount);
      setStakeAmount('');
      setSelectedPercentage(0);
      // Refresh position
      const positions = getFarmPositions(farm.id);
      setUserPosition(positions.find(p => p.farmId === farm.id));
      addToast('success', 'Staking Successful', `You staked ${formatNumber(amount)} ${stakingToken?.ticker || 'tokens'} in the farm!`);
      onStakeComplete?.();
    } catch (error: any) {
      console.error('Stake failed:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      addToast('error', 'Staking Failed', `Failed to stake: ${errorMessage}. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle unstake
  const handleUnstake = async () => {
    const amount = parseFloat(unstakeAmount);
    if (!amount || amount <= 0) {
      addToast('error', 'Invalid Amount', 'Please enter a valid amount to unstake.');
      return;
    }
    if (!userPosition || amount > userPosition.stakedAmount) {
      addToast('error', 'Insufficient Staked Amount', `You only have ${formatNumber(userPosition?.stakedAmount || 0)} ${stakingToken?.ticker || 'tokens'} staked.`);
      return;
    }

    // Check lock period
    if (userPosition.isLocked && userPosition.lockExpiresAt) {
      const now = Date.now();
      if (now < userPosition.lockExpiresAt) {
        const remainingTime = Math.ceil((userPosition.lockExpiresAt - now) / 1000 / 60); // minutes
        const hours = Math.floor(remainingTime / 60);
        const mins = remainingTime % 60;
        const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
        addToast('error', 'Position Locked', `Your position is locked for ${timeStr}. Please wait until the lock period expires.`);
        return;
      }
    }

    setIsProcessing(true);
    try {
      const result = await unstakeFromFarm(farm.id, amount);
      setUnstakeAmount('');
      addToast('success', 'Unstaking Successful', `Unstaked ${formatNumber(amount)} ${stakingToken?.ticker || 'tokens'} and harvested ${formatNumber(result.rewards)} ${rewardToken?.ticker || 'tokens'} in rewards!`);
      // Refresh position
      const positions = getFarmPositions(farm.id);
      setUserPosition(positions.find(p => p.farmId === farm.id));
      onStakeComplete?.();
    } catch (error: any) {
      console.error('Unstake failed:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      addToast('error', 'Unstaking Failed', `Failed to unstake: ${errorMessage}. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle harvest
  const handleHarvest = async () => {
    if (pendingRewards <= 0) {
      addToast('info', 'No Rewards', 'You have no rewards to harvest yet. Wait for your staked tokens to accumulate rewards.');
      return;
    }

    setIsProcessing(true);
    try {
      const rewards = await harvestFarmRewards(farm.id);
      addToast('success', 'Rewards Harvested', `Successfully harvested ${formatNumber(rewards)} ${rewardToken?.ticker || 'tokens'}!`);
      setPendingRewards(0);
      onStakeComplete?.();
    } catch (error: any) {
      console.error('Harvest failed:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      addToast('error', 'Harvest Failed', `Failed to harvest: ${errorMessage}. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Set max stake amount
  const setMaxStake = () => {
    const max = farm.config.maxStakeAmount > 0
      ? Math.min(userBalance, farm.config.maxStakeAmount)
      : userBalance;
    setStakeAmount(max.toString());
    setSelectedPercentage(100);
  };

  // Set percentage for stake
  const setPercentage = (pct: number) => {
    setSelectedPercentage(pct);
    const amount = farm.config.maxStakeAmount > 0
      ? Math.min(userBalance * (pct / 100), farm.config.maxStakeAmount)
      : userBalance * (pct / 100);
    setStakeAmount(amount.toString());
  };

  // Set max unstake amount
  const setMaxUnstake = () => {
    if (userPosition) {
      setUnstakeAmount(userPosition.stakedAmount.toString());
    }
  };

  return (
    <div className="bg-white/5 border-t border-doge/20 rounded-b-2xl overflow-hidden">
      {/* Expandable Header */}
      <div
        className="flex items-center justify-between cursor-pointer hover:bg-white/[0.02] p-4 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Wallet className="text-doge" size={18} />
          <span className="font-bold text-white">Quick Stake</span>
          {userPosition && (
            <span className="ml-2 px-2 py-0.5 bg-doge/20 text-doge text-xs font-bold rounded-lg">
              Position Active
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="text-gray-400 transition-transform" size={20} />
        ) : (
          <ChevronDown className="text-gray-400 transition-transform" size={20} />
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 pt-0 animate-fade-in border-t border-white/5">
          {/* Paused Farm Warning */}
          {farm.status !== 'active' && (
            <div className="flex items-start gap-2 bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 mb-4">
              <AlertCircle size={18} className="text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-bold text-orange-400">Farm {farm.status === 'paused' ? 'Paused' : farm.status}</div>
                <div className="text-xs text-gray-300">
                  This farm is currently {farm.status}. Staking is disabled.
                </div>
              </div>
            </div>
          )}

          {/* User Position Display */}
          {userPosition && (
            <div className="bg-doge/10 border border-doge/30 rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Wallet size={16} className="text-doge" />
                  Your Position
                </h4>
                <div className="flex items-center gap-1 text-doge text-sm font-bold">
                  <TrendingUp size={14} />
                  {currentAPY.toFixed(2)}%
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Staked</div>
                  <div className="text-lg font-bold text-white">
                    {formatNumber(userPosition.stakedAmount)} {stakingToken?.ticker}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Pending Rewards</div>
                  <div className="text-lg font-bold text-doge">
                    {formatNumber(pendingRewards)} {rewardToken?.ticker}
                  </div>
                </div>
              </div>
              {userPosition.isLocked && userPosition.lockExpiresAt && (
                <div className="mt-3 flex items-center gap-2 text-orange-400 text-sm">
                  <Lock size={14} />
                  <span>
                    Locked for {Math.ceil((userPosition.lockExpiresAt - Date.now()) / 1000 / 60)} minutes
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Tabs */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-4">
            <button
              onClick={() => setActiveTab('stake')}
              className={`flex-1 py-3 rounded-lg font-bold transition-all text-sm ${
                activeTab === 'stake'
                  ? 'bg-doge text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Stake
            </button>
            {userPosition && (
              <button
                onClick={() => setActiveTab('unstake')}
                className={`flex-1 py-3 rounded-lg font-bold transition-all text-sm ${
                  activeTab === 'unstake'
                    ? 'bg-doge text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Unstake
              </button>
            )}
            {userPosition && pendingRewards > 0 && (
              <button
                onClick={() => setActiveTab('harvest')}
                className={`flex-1 py-3 rounded-lg font-bold transition-all text-sm ${
                  activeTab === 'harvest'
                    ? 'bg-doge text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Harvest
              </button>
            )}
          </div>

          {/* Tab Content */}
          {activeTab === 'stake' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                  Amount to Stake
                </label>
                <div className="relative">
                  <input
                    id="stake-amount"
                    name="stakeAmount"
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-4 pr-24 text-white text-lg font-mono font-bold focus:border-doge/50 outline-none transition-all"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <span className="text-gray-400 font-bold text-sm">{stakingToken?.ticker}</span>
                    <button
                      onClick={setMaxStake}
                      className="px-3 py-1 bg-doge/20 text-doge rounded-lg text-xs font-bold hover:bg-doge/30 transition-colors"
                    >
                      MAX
                    </button>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Available: {formatNumber(userBalance)} {stakingToken?.ticker}</span>
                  <span>Min: {formatNumber(farm.config.minStakeAmount)}</span>
                </div>
              </div>

              {/* Percentage Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setPercentage(pct)}
                    className={`py-2 rounded-lg text-sm font-bold transition-all ${
                      selectedPercentage === pct
                        ? 'bg-doge text-black'
                        : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>

              {/* Lock Period Warning */}
              {farm.config.lockPeriod > 0 && (
                <div className="flex items-start gap-2 bg-orange-500/10 border border-orange-500/30 rounded-xl p-3">
                  <Clock size={18} className="text-orange-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-orange-400">Lock Period</div>
                    <div className="text-xs text-gray-300">
                      Your stake will be locked for {Math.ceil(farm.config.lockPeriod / 60)} minutes.
                      Early unstake will forfeit rewards.
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleStake}
                isLoading={isProcessing}
                disabled={!stakeAmount || parseFloat(stakeAmount) <= 0 || farm.status !== 'active'}
                className="w-full rounded-xl h-12 font-bold"
              >
                Stake {stakingToken?.ticker}
              </Button>
            </div>
          )}

          {activeTab === 'unstake' && userPosition && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                  Amount to Unstake
                </label>
                <div className="relative">
                  <input
                    id="unstake-amount"
                    name="unstakeAmount"
                    type="number"
                    value={unstakeAmount}
                    onChange={(e) => setUnstakeAmount(e.target.value)}
                    placeholder="0.00"
                    max={userPosition.stakedAmount}
                    className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-4 pr-24 text-white text-lg font-mono font-bold focus:border-doge/50 outline-none transition-all"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <span className="text-gray-400 font-bold text-sm">{stakingToken?.ticker}</span>
                    <button
                      onClick={setMaxUnstake}
                      className="px-3 py-1 bg-doge/20 text-doge rounded-lg text-xs font-bold hover:bg-doge/30 transition-colors"
                    >
                      MAX
                    </button>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Staked: {formatNumber(userPosition.stakedAmount)} {stakingToken?.ticker}</span>
                  <span>Rewards: {formatNumber(pendingRewards)} {rewardToken?.ticker}</span>
                </div>
              </div>

              {/* Lock Warning */}
              {userPosition.isLocked && userPosition.lockExpiresAt && (
                <div className="flex items-start gap-2 bg-orange-500/10 border border-orange-500/30 rounded-xl p-3">
                  <Lock size={18} className="text-orange-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-orange-400">Position Locked</div>
                    <div className="text-xs text-gray-300">
                      Your position is locked until {new Date(userPosition.lockExpiresAt).toLocaleTimeString()}.
                      Wait for the lock period to expire before unstaking.
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleUnstake}
                isLoading={isProcessing}
                disabled={!unstakeAmount || parseFloat(unstakeAmount) <= 0 || (userPosition.isLocked && userPosition.lockExpiresAt && Date.now() < userPosition.lockExpiresAt)}
                className="w-full rounded-xl h-12 font-bold"
              >
                Unstake {stakingToken?.ticker}
              </Button>
            </div>
          )}

          {activeTab === 'harvest' && userPosition && (
            <div className="space-y-4">
              <div className="bg-doge/10 border border-doge/30 rounded-2xl p-6 text-center">
                <Award size={48} className="text-doge mx-auto mb-4" />
                <h4 className="text-xl font-bold text-white mb-2">Ready to Harvest</h4>
                <div className="text-3xl font-bold text-doge mb-4">
                  {formatNumber(pendingRewards)} {rewardToken?.ticker}
                </div>
                <div className="text-sm text-gray-400 mb-6">
                  Rewards will be added to your wallet immediately
                </div>
                <Button
                  onClick={handleHarvest}
                  isLoading={isProcessing}
                  disabled={pendingRewards <= 0}
                  className="w-full rounded-xl h-12 font-bold"
                >
                  Harvest Rewards
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
