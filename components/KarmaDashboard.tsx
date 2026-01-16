import React, { useState, useEffect } from 'react';
import { useStore } from '../contexts/StoreContext';
import { TrendingUp, TrendingDown, Lock, Unlock, Gift, Clock, Award, DollarSign } from 'lucide-react';

interface KarmaStats {
  token: {
    name: string;
    symbol: string;
    totalSupply: string;
    formattedTotalSupply: string;
    maxSupply: string;
    remainingSupply: string;
    formattedRemainingSupply: string;
    mintingActive: boolean;
    price: number;
  };
  staking: {
    totalStaked: string;
    formattedTotalStaked: string;
    totalRewardsDistributed: string;
    formattedTotalRewardsDistributed: string;
    totalStakers: string;
    currentAPY: string;
    formattedAPY: string;
  };
  buyback: {
    enabled: boolean;
    lastBuybackTime: string;
    karmaBalance: string;
    formattedKarmaBalance: string;
    feeBalance: string;
    formattedFeeBalance: string;
    availableFees: string;
    formattedAvailableFees: string;
  };
}

interface UserStakeInfo {
  walletAddress: string;
  stakedAmount: string;
  formattedStakedAmount: string;
  rewardsClaimed: string;
  formattedRewardsClaimed: string;
  pendingRewards: string;
  formattedPendingRewards: string;
  bonusMultiplier: number;
  bonusLabel: string;
  stakeSeconds: string;
  availableBalance: string;
  formattedAvailableBalance: string;
  bonusPeriod1End: number;
  bonusPeriod2End: number;
  currentTime: number;
}

interface APYHistoryPoint {
  timestamp: number;
  date: string;
  apy: number;
  totalStaked: number;
}

const KarmaDashboard: React.FC = () => {
  const { userWalletAddress, addNotification } = useStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<KarmaStats | null>(null);
  const [userStakeInfo, setUserStakeInfo] = useState<UserStakeInfo | null>(null);
  const [apyHistory, setApyHistory] = useState<APYHistoryPoint[]>([]);
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [staking, setStaking] = useState(false);
  const [unstaking, setUnstaking] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    loadKarmaData();
    const interval = setInterval(loadKarmaData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadKarmaData = async () => {
    try {
      const token = localStorage.getItem('token');

      // Load global stats
      const statsResponse = await fetch('/api/karma/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats(statsData.data);
        }
      }

      // Load user stake info
      if (token) {
        const stakeResponse = await fetch('/api/karma/stake-info', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (stakeResponse.ok) {
          const stakeData = await stakeResponse.json();
          if (stakeData.success) {
            setUserStakeInfo(stakeData.data);
          }
        }
      }

      // Load APY history
      const historyResponse = await fetch('/api/karma/history?limit=30');
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        if (historyData.success) {
          setApyHistory(historyData.data.history);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading $KARMA data:', error);
      setLoading(false);
    }
  };

  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      addNotification('error', 'Invalid Amount', 'Please enter a valid amount to stake');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      addNotification('error', 'Not Connected', 'Please connect your wallet first');
      return;
    }

    setStaking(true);
    try {
      const response = await fetch('/api/karma/stake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: stakeAmount }),
      });

      const data = await response.json();
      if (data.success) {
        addNotification('success', 'Staking Successful', `You staked ${stakeAmount} $KARMA`);
        setStakeAmount('');
        await loadKarmaData();
      } else {
        if (data.requiresApproval) {
          addNotification('warning', 'Approval Required', 'Please approve $KARMA for staking first');
        } else {
          addNotification('error', 'Staking Failed', data.error || 'Failed to stake tokens');
        }
      }
    } catch (error) {
      console.error('Error staking:', error);
      addNotification('error', 'Staking Failed', 'An error occurred while staking');
    } finally {
      setStaking(false);
    }
  };

  const handleUnstake = async () => {
    if (!unstakeAmount || parseFloat(unstakeAmount) <= 0) {
      addNotification('error', 'Invalid Amount', 'Please enter a valid amount to unstake');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      addNotification('error', 'Not Connected', 'Please connect your wallet first');
      return;
    }

    setUnstaking(true);
    try {
      const response = await fetch('/api/karma/unstake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: unstakeAmount }),
      });

      const data = await response.json();
      if (data.success) {
        addNotification('success', 'Unstaking Successful', `You unstaked ${unstakeAmount} $KARMA`);
        setUnstakeAmount('');
        await loadKarmaData();
      } else {
        addNotification('error', 'Unstaking Failed', data.error || 'Failed to unstake tokens');
      }
    } catch (error) {
      console.error('Error unstaking:', error);
      addNotification('error', 'Unstaking Failed', 'An error occurred while unstaking');
    } finally {
      setUnstaking(false);
    }
  };

  const handleClaimRewards = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      addNotification('error', 'Not Connected', 'Please connect your wallet first');
      return;
    }

    setClaiming(true);
    try {
      const response = await fetch('/api/karma/claim-rewards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        addNotification('success', 'Rewards Claimed', `You claimed ${data.data.formattedAmountClaimed} $KARMA`);
        await loadKarmaData();
      } else {
        addNotification('error', 'Claim Failed', data.error || 'Failed to claim rewards');
      }
    } catch (error) {
      console.error('Error claiming rewards:', error);
      addNotification('error', 'Claim Failed', 'An error occurred while claiming rewards');
    } finally {
      setClaiming(false);
    }
  };

  const handleApprove = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      addNotification('error', 'Not Connected', 'Please connect your wallet first');
      return;
    }

    try {
      const response = await fetch('/api/karma/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        addNotification('success', 'Approval Successful', 'You can now stake $KARMA tokens');
      } else {
        addNotification('error', 'Approval Failed', data.error || 'Failed to approve tokens');
      }
    } catch (error) {
      console.error('Error approving:', error);
      addNotification('error', 'Approval Failed', 'An error occurred while approving');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading $KARMA Dashboard...</p>
        </div>
      </div>
    );
  }

  const currentAPY = stats?.staking.formattedAPY || '0%';
  const apyNumber = parseFloat(currentAPY);
  const apyTrend = apyHistory.length > 1 ? apyHistory[apyHistory.length - 1].apy - apyHistory[apyHistory.length - 2].apy : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">$KARMA Staking Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Stake $KARMA tokens to earn rewards and support the Dogepump ecosystem</p>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Current APY */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">Current APY</span>
            </div>
            {apyTrend > 0 ? (
              <TrendingUp className="w-5 h-5 text-green-300" />
            ) : apyTrend < 0 ? (
              <TrendingDown className="w-5 h-5 text-red-300" />
            ) : null}
          </div>
          <div className="text-3xl font-bold mb-1">{currentAPY}</div>
          <div className="text-sm opacity-75">Dynamic APY based on market conditions</div>
        </div>

        {/* Total Staked */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Staked</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {stats?.staking.formattedTotalStaked || '0'}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {stats?.staking.totalStakers || '0'} stakers
          </div>
        </div>

        {/* Rewards Distributed */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Rewards Distributed</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {stats?.staking.formattedTotalRewardsDistributed || '0'}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">$KARMA tokens</div>
        </div>

        {/* Token Price */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Token Price</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            ${stats?.token.price?.toFixed(10) || '0.0000000001'}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">USD per $KARMA</div>
        </div>
      </div>

      {/* User Staking Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* User Balance */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Your $KARMA</h2>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Available Balance</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {userStakeInfo?.formattedAvailableBalance || '0'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Staked Amount</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {userStakeInfo?.formattedStakedAmount || '0'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending Rewards</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {userStakeInfo?.formattedPendingRewards || '0'}
              </div>
            </div>
            {userStakeInfo?.bonusMultiplier && userStakeInfo.bonusMultiplier > 100 && (
              <div className="bg-yellow-100 dark:bg-yellow-900 rounded-lg p-3">
                <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                  <Award className="w-4 h-4" />
                  <span className="font-semibold">{userStakeInfo.bonusLabel}</span>
                </div>
                <div className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  You earn {userStakeInfo.bonusMultiplier / 100}x rewards!
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stake */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Stake $KARMA</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount to Stake
              </label>
              <input
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
                <span>Available: {userStakeInfo?.formattedAvailableBalance || '0'}</span>
                <button
                  onClick={() => setStakeAmount(userStakeInfo?.formattedAvailableBalance || '0')}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  MAX
                </button>
              </div>
            </div>
            <button
              onClick={handleStake}
              disabled={staking || !stakeAmount}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {staking ? 'Staking...' : 'Stake $KARMA'}
            </button>
            <button
              onClick={handleApprove}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Approve $KARMA
            </button>
          </div>
        </div>

        {/* Unstake & Claim */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Unstake & Claim</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount to Unstake
              </label>
              <input
                type="number"
                value={unstakeAmount}
                onChange={(e) => setUnstakeAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
                <span>Staked: {userStakeInfo?.formattedStakedAmount || '0'}</span>
                <button
                  onClick={() => setUnstakeAmount(userStakeInfo?.formattedStakedAmount || '0')}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  MAX
                </button>
              </div>
            </div>
            <button
              onClick={handleUnstake}
              disabled={unstaking || !unstakeAmount}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {unstaking ? 'Unstaking...' : 'Unstake $KARMA'}
            </button>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Pending Rewards</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {userStakeInfo?.formattedPendingRewards || '0'}
                </span>
              </div>
              <button
                onClick={handleClaimRewards}
                disabled={claiming || !userStakeInfo?.pendingRewards || parseFloat(userStakeInfo.pendingRewards) === 0}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {claiming ? 'Claiming...' : 'Claim Rewards'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* APY History Chart */}
      {apyHistory.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">APY History (30 Days)</h2>
          <div className="h-64 flex items-end justify-between gap-1">
            {apyHistory.map((point, index) => (
              <div
                key={index}
                className="flex-1 flex flex-col items-center group"
              >
                <div
                  className="w-full bg-blue-500 hover:bg-blue-600 transition-colors rounded-t relative"
                  style={{ height: `${(point.apy / 100) * 100}%` }}
                >
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {point.apy.toFixed(2)}%
                  </div>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 transform -rotate-45 origin-left">
                  {new Date(point.timestamp).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bonus Period Info */}
      <div className="bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900 dark:to-orange-900 rounded-2xl p-6 shadow-lg">
        <div className="flex items-start gap-4">
          <Clock className="w-6 h-6 text-yellow-800 dark:text-yellow-200 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-bold text-yellow-900 dark:text-yellow-100 mb-2">
              Early Adopter Bonus Period
            </h3>
            <div className="space-y-2 text-sm text-yellow-800 dark:text-yellow-200">
              <p>
                <strong>First 30 Days:</strong> 2x rewards multiplier for stakes made during launch period
              </p>
              <p>
                <strong>Days 31-90:</strong> 1.5x rewards multiplier
              </p>
              <p>
                <strong>After 90 Days:</strong> Normal 1x rewards
              </p>
              <p className="mt-3 text-xs opacity-75">
                Bonus multiplier is locked at the time of staking and applies to all future rewards for that stake.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KarmaDashboard;
