import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Clock, Users, Award, AlertCircle, Lock, Unlock, Wallet } from 'lucide-react';
import { TokenOwnerFarm, TokenOwnerFarmPosition, Token } from '../types';
import { useStore } from '../contexts/StoreContext';
import { Button } from './Button';
import { formatNumber } from '../services/web3Service';
import { useToast } from './Toast';

interface FarmStakingModalProps {
  farm: TokenOwnerFarm;
  rewardToken: Token | undefined;
  stakingToken: Token | undefined;
  onClose: () => void;
}

export const FarmStakingModal: React.FC<FarmStakingModalProps> = ({
  farm,
  rewardToken,
  stakingToken,
  onClose
}) => {
  const { stakeInFarm, unstakeFromFarm, harvestFarmRewards, myHoldings, getFarmPositions, getFarmStats } = useStore();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'stake' | 'unstake' | 'harvest'>('stake');
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [userPosition, setUserPosition] = useState<TokenOwnerFarmPosition | undefined>();
  const [pendingRewards, setPendingRewards] = useState(0);

  // Get user's position in this farm
  useEffect(() => {
    const positions = getFarmPositions(farm.id);
    const position = positions.find(p => p.farmId === farm.id);
    setUserPosition(position);

    // Calculate pending rewards
    if (position) {
      const now = Date.now();
      const timeSinceHarvest = (now - position.lastHarvestTime) / 1000;
      const rewards = timeSinceHarvest * farm.config.rewardRate * position.stakedAmount;
      setPendingRewards(position.accumulatedRewards + rewards);
    }
  }, [farm.id, getFarmPositions]);

  // Get user's balance of staking token
  const stakingTokenBalance = myHoldings.find(h => h.tokenId === farm.stakingTokenId)?.balance || 0;

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
    if (amount > stakingTokenBalance) {
      addToast('error', 'Insufficient Balance', `You need ${formatNumber(amount - stakingTokenBalance)} more ${stakingToken?.ticker || 'tokens'} to stake this amount.`);
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

    setLoading(true);
    try {
      await stakeInFarm(farm.id, amount);
      setStakeAmount('');
      // Refresh position
      const positions = getFarmPositions(farm.id);
      setUserPosition(positions.find(p => p.farmId === farm.id));
      addToast('success', 'Staking Successful', `You staked ${formatNumber(amount)} ${stakingToken?.ticker || 'tokens'} in the farm!`);
    } catch (error: any) {
      console.error('Stake failed:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      addToast('error', 'Staking Failed', `Failed to stake: ${errorMessage}. Please try again.`);
    } finally {
      setLoading(false);
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

    setLoading(true);
    try {
      const result = await unstakeFromFarm(farm.id, amount);
      setUnstakeAmount('');
      addToast('success', 'Unstaking Successful', `Unstaked ${formatNumber(amount)} ${stakingToken?.ticker || 'tokens'} and harvested ${formatNumber(result.rewards)} ${rewardToken?.ticker || 'tokens'} in rewards!`);
      // Refresh position
      const positions = getFarmPositions(farm.id);
      setUserPosition(positions.find(p => p.farmId === farm.id));
    } catch (error: any) {
      console.error('Unstake failed:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      addToast('error', 'Unstaking Failed', `Failed to unstake: ${errorMessage}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  // Handle harvest
  const handleHarvest = async () => {
    if (pendingRewards <= 0) {
      addToast('info', 'No Rewards', 'You have no rewards to harvest yet. Wait for your staked tokens to accumulate rewards.');
      return;
    }

    setLoading(true);
    try {
      const rewards = await harvestFarmRewards(farm.id);
      addToast('success', 'Rewards Harvested', `Successfully harvested ${formatNumber(rewards)} ${rewardToken?.ticker || 'tokens'}!`);
      setPendingRewards(0);
    } catch (error: any) {
      console.error('Harvest failed:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      addToast('error', 'Harvest Failed', `Failed to harvest: ${errorMessage}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  // Set max stake amount
  const setMaxStake = () => {
    const max = Math.min(stakingTokenBalance, farm.config.maxStakeAmount);
    setStakeAmount(max.toString());
  };

  // Set max unstake amount
  const setMaxUnstake = () => {
    if (userPosition) {
      setUnstakeAmount(userPosition.stakedAmount.toString());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0A0A0A] border border-doge/20 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#0A0A0A] border-b border-white/10 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            {rewardToken?.imageUrl && (
              <img
                src={rewardToken.imageUrl}
                alt={rewardToken.name}
                className="w-12 h-12 rounded-full border-2 border-doge/30"
              />
            )}
            <div>
              <h3 className="text-xl font-bold text-white">{rewardToken?.name} Farm</h3>
              <p className="text-sm text-gray-400">Earn {rewardToken?.ticker} by staking {stakingToken?.ticker}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Farm Stats */}
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <TrendingUp size={16} />
              <span className="text-xs uppercase tracking-wider">APY</span>
            </div>
            <div className="text-2xl font-bold text-doge">{currentAPY.toFixed(2)}%</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Wallet size={16} />
              <span className="text-xs uppercase tracking-wider">TVL</span>
            </div>
            <div className="text-2xl font-bold text-white">{formatNumber(farm.stats.totalStaked)}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Users size={16} />
              <span className="text-xs uppercase tracking-wider">Stakers</span>
            </div>
            <div className="text-2xl font-bold text-white">{formatNumber(farm.stats.participantCount)}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Award size={16} />
              <span className="text-xs uppercase tracking-wider">Rewards</span>
            </div>
            <div className="text-2xl font-bold text-white">{formatNumber(farm.pool.totalDistributed)}</div>
          </div>
        </div>

        {/* User Position */}
        {userPosition && (
          <div className="px-6 pb-4">
            <div className="bg-doge/10 border border-doge/30 rounded-2xl p-4">
              <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                <Wallet size={18} className="text-doge" />
                Your Position
              </h4>
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
                  <Lock size={16} />
                  <span>
                    Locked for {Math.ceil((userPosition.lockExpiresAt - Date.now()) / 1000 / 60)} minutes
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="px-6 pb-4">
          <div className="flex bg-white/5 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('stake')}
              className={`flex-1 py-3 rounded-lg font-bold transition-all ${
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
                className={`flex-1 py-3 rounded-lg font-bold transition-all ${
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
                className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                  activeTab === 'harvest'
                    ? 'bg-doge text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Harvest
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-6 pb-6">
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
                    <span className="text-gray-400 font-bold">{stakingToken?.ticker}</span>
                    <button
                      onClick={setMaxStake}
                      className="px-3 py-1 bg-doge/20 text-doge rounded-lg text-xs font-bold hover:bg-doge/30 transition-colors"
                    >
                      MAX
                    </button>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Available: {formatNumber(stakingTokenBalance)} {stakingToken?.ticker}</span>
                  <span>Min: {formatNumber(farm.config.minStakeAmount)}</span>
                </div>
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
                isLoading={loading}
                disabled={!stakeAmount || parseFloat(stakeAmount) <= 0}
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
                    <span className="text-gray-400 font-bold">{stakingToken?.ticker}</span>
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
                isLoading={loading}
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
                  isLoading={loading}
                  disabled={pendingRewards <= 0}
                  className="w-full rounded-xl h-12 font-bold"
                >
                  Harvest Rewards
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
