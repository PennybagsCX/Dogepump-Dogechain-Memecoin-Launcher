import React, { useState, useEffect } from 'react';
import { useStore } from '../contexts/StoreContext';
import { TrendingUp, TrendingDown, Lock, Unlock, Gift, Clock, Award, DollarSign, Droplets, ArrowRight, Zap, Crown } from 'lucide-react';
import { KarmaHeroTile } from './KarmaHeroTile';
import { Breadcrumb } from './Breadcrumb';

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
    <div className="animate-slide-up pb-12">
      <Breadcrumb items={[
        { name: 'Home', url: '/' },
        { name: '$KARMA', url: '/karma' }
      ]} />

      {/* Page Header */}
      <div className="text-center relative py-8">
        {/* Glow behind header */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-doge/10 blur-[80px] rounded-full pointer-events-none"></div>

        <div className="inline-flex items-center justify-center w-20 h-20 bg-[#0A0A0A] border border-doge/20 rounded-3xl mb-6 shadow-[0_0_40px_rgba(212,175,55,0.2)] relative z-10 animate-float">
          <Award className="text-doge drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]" size={40} />
        </div>
        <h1 className="text-5xl md:text-6xl font-comic font-bold text-white mb-4 tracking-tight drop-shadow-xl relative z-10">$KARMA Staking</h1>
        <p className="text-gray-400 text-xl max-w-lg mx-auto leading-relaxed">
          Stake <span className="text-doge">$KARMA</span> to earn more $KARMA. Early adopters get <span className="text-white font-semibold">bonus multipliers</span>!
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Hero Tile */}
        <div className="lg:col-span-2">
          <KarmaHeroTile
            karmaPrice={stats?.token.price || 0.0000000001}
            karmaTVL={parseFloat(stats?.staking.totalStaked || '0') * (stats?.token.price || 0.0000000001)}
            karmaAPY={parseFloat(stats?.staking.currentAPY || '0')}
            karmaSupply={parseFloat(stats?.token.totalSupply || '0')}
            karmaMarketCap={parseFloat(stats?.token.totalSupply || '0') * (stats?.token.price || 0.0000000001)}
            totalStakers={parseInt(stats?.staking.totalStakers || '0')}
            stakedPercentage={parseFloat(stats?.staking.totalStaked || '0') / parseFloat(stats?.token.totalSupply || '1') * 100}
            lastUpdateTime={new Date().toISOString()}
          />
        </div>

        {/* Staking Interface Tile */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0B0B0F] via-[#0B0B0F]/90 to-black shadow-2xl">
          {/* Decorative elements */}
          <div className="absolute -left-10 -top-10 h-36 w-36 rounded-full bg-doge/10 blur-3xl"></div>
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-doge/10 to-transparent"></div>

          <div className="relative px-5 py-6 sm:px-6 sm:py-7 md:px-8 md:py-9 flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="shrink-0 p-4 rounded-2xl bg-[#0F0F12] border border-doge/30 text-doge shadow-lg">
                <Droplets size={28} className="fill-doge/30" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-doge/80 font-semibold">Stake $KARMA</p>
                    <p className="text-lg sm:text-xl font-black text-white leading-tight">Earn Rewards</p>
                  </div>
                  <span className="text-[10px] sm:text-xs bg-white/10 px-2 py-1 rounded-full text-gray-300 font-semibold uppercase tracking-widest">Active</span>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  {currentAPY} <span className="text-doge">APY</span>
                </p>
              </div>
            </div>

            {/* User Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/5 rounded-xl px-3 py-3 border border-white/5 text-center">
                <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Balance</div>
                <div className="text-sm font-mono font-bold text-white">
                  {userStakeInfo?.formattedAvailableBalance || '0'}
                </div>
              </div>
              <div className="bg-white/5 rounded-xl px-3 py-3 border border-white/5 text-center">
                <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Staked</div>
                <div className="text-sm font-mono font-bold text-doge">
                  {userStakeInfo?.formattedStakedAmount || '0'}
                </div>
              </div>
              <div className="bg-white/5 rounded-xl px-3 py-3 border border-white/5 text-center">
                <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Pending</div>
                <div className="text-sm font-mono font-bold text-green-400">
                  {userStakeInfo?.formattedPendingRewards || '0'}
                </div>
              </div>
            </div>

            {/* Stake Input */}
            <div className="space-y-3">
              <label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider ml-1">Stake Amount</label>
              <div className="relative">
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#050505] border border-white/10 rounded-2xl px-6 py-5 text-white text-lg focus:border-doge focus:ring-1 focus:ring-doge/50 outline-none transition-all placeholder:text-gray-800 font-mono"
                />
                <button
                  onClick={() => setStakeAmount(userStakeInfo?.formattedAvailableBalance || '0')}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-xs text-doge font-bold uppercase tracking-wider hover:underline"
                >
                  Max
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleStake}
                disabled={staking || !stakeAmount}
                className="w-full h-14 text-lg font-bold rounded-full bg-gradient-to-r from-doge to-doge-dark shadow-[0_0_30px_rgba(212,175,55,0.3)] border border-white/20 relative overflow-hidden group-hover/btn:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center gap-2"
              >
                {staking ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Staking...
                  </>
                ) : (
                  <>
                    Stake $KARMA <ArrowRight size={20} />
                  </>
                )}
              </button>

              <button
                onClick={handleApprove}
                className="w-full h-12 text-sm font-bold rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-gray-300"
              >
                Approve $KARMA
              </button>
            </div>

            {/* Bonus Badge */}
            {userStakeInfo?.bonusMultiplier && userStakeInfo.bonusMultiplier > 100 && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-doge/5 border border-doge/20">
                <Zap size={16} className="text-doge" />
                <span className="text-xs text-gray-300">
                  <span className="text-doge font-bold">{userStakeInfo.bonusLabel}</span> - You earn {userStakeInfo.bonusMultiplier / 100}x rewards!
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Unstake & Claim Tile */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0B0B0F] via-[#0B0B0F]/90 to-black shadow-2xl">
          {/* Decorative elements */}
          <div className="absolute -left-10 -top-10 h-36 w-36 rounded-full bg-green-500/10 blur-3xl"></div>
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-green-500/10 to-transparent"></div>

          <div className="relative px-5 py-6 sm:px-6 sm:py-7 md:px-8 md:py-9 flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="shrink-0 p-4 rounded-2xl bg-[#0F0F12] border border-green-500/30 text-green-400 shadow-lg">
                <Unlock size={28} className="fill-green-400/30" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-green-400/80 font-semibold">Manage Stake</p>
                    <p className="text-lg sm:text-xl font-black text-white leading-tight">Unstake & Claim</p>
                  </div>
                  <span className="text-[10px] sm:text-xs bg-white/10 px-2 py-1 rounded-full text-gray-300 font-semibold uppercase tracking-widest">Flexible</span>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  {userStakeInfo?.formattedPendingRewards || '0'} <span className="text-green-400">Pending</span>
                </p>
              </div>
            </div>

            {/* Info Section */}
            <div className="space-y-3 text-sm sm:text-base leading-relaxed text-gray-200">
              <p className="text-gray-300">
                Unstake your $KARMA tokens anytime or claim your accumulated rewards. Staking continues to earn rewards even after claiming.
              </p>
            </div>

            {/* Unstake Input */}
            <div className="space-y-3">
              <label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider ml-1">Unstake Amount</label>
              <div className="relative">
                <input
                  type="number"
                  value={unstakeAmount}
                  onChange={(e) => setUnstakeAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#050505] border border-white/10 rounded-2xl px-6 py-5 text-white text-lg focus:border-red-500 focus:ring-1 focus:ring-red-500/50 outline-none transition-all placeholder:text-gray-800 font-mono"
                />
                <button
                  onClick={() => setUnstakeAmount(userStakeInfo?.formattedStakedAmount || '0')}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-xs text-red-400 font-bold uppercase tracking-wider hover:underline"
                >
                  Max
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleUnstake}
                disabled={unstaking || !unstakeAmount}
                className="w-full h-12 text-sm font-bold rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 transition-all text-red-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {unstaking ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                    Unstaking...
                  </>
                ) : (
                  <>
                    Unstake $KARMA <ArrowRight size={18} />
                  </>
                )}
              </button>

              <button
                onClick={handleClaimRewards}
                disabled={claiming || !userStakeInfo?.pendingRewards || parseFloat(userStakeInfo.pendingRewards) === 0}
                className="w-full h-14 text-lg font-bold rounded-full bg-gradient-to-r from-green-500 to-green-600 shadow-[0_0_30px_rgba(34,197,94,0.3)] border border-white/20 relative overflow-hidden group-hover/btn:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center gap-2"
              >
                {claiming ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Claiming...
                  </>
                ) : (
                  <>
                    Claim Rewards <Gift size={20} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Bonus Periods Tile */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0B0B0F] via-[#0B0B0F]/90 to-black shadow-2xl">
          {/* Decorative elements */}
          <div className="absolute -left-10 -top-10 h-36 w-36 rounded-full bg-yellow-500/10 blur-3xl"></div>
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-yellow-500/10 to-transparent"></div>

          <div className="relative px-5 py-6 sm:px-6 sm:py-7 md:px-8 md:py-9 flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="shrink-0 p-4 rounded-2xl bg-[#0F0F12] border border-doge/30 text-doge shadow-lg">
                <Clock size={28} className="fill-doge/30" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-doge/80 font-semibold">Loyalty Rewards</p>
                    <p className="text-lg sm:text-xl font-black text-white leading-tight">Longer Stake = Higher Multiplier</p>
                  </div>
                  <span className="text-[10px] sm:text-xs bg-doge/10 px-2 py-1 rounded-full text-doge font-semibold uppercase tracking-widest border border-doge/30">Active</span>
                </div>
                <p className="text-sm text-gray-400">
                  Earn bonus multipliers by staking for longer periods
                </p>
              </div>
            </div>

            {/* Bonus Tiers */}
            <div className="space-y-3 text-sm sm:text-base leading-relaxed text-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-2 text-gray-300 font-bold uppercase tracking-widest text-[11px] sm:text-xs">
                  <TrendingUp size={14} /> Base Rate
                </div>
                <span className="text-[11px] sm:text-xs text-gray-400 sm:ml-auto">Standard 1x rewards</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 rounded-2xl bg-doge/5 border border-doge/20">
                <div className="flex items-center gap-2 text-doge font-bold uppercase tracking-widest text-[11px] sm:text-xs">
                  <Award size={14} /> Stake 30+ Days
                </div>
                <span className="text-[11px] sm:text-xs text-gray-400 sm:ml-auto">1.25x rewards multiplier</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 rounded-2xl bg-doge/5 border border-doge/20">
                <div className="flex items-center gap-2 text-doge font-bold uppercase tracking-widest text-[11px] sm:text-xs">
                  <Zap size={14} /> Stake 90+ Days
                </div>
                <span className="text-[11px] sm:text-xs text-gray-400 sm:ml-auto">1.5x rewards multiplier</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 rounded-2xl bg-yellow-500/5 border border-yellow-500/20">
                <div className="flex items-center gap-2 text-yellow-400 font-bold uppercase tracking-widest text-[11px] sm:text-xs">
                  <Crown size={14} /> Stake 180+ Days
                </div>
                <span className="text-[11px] sm:text-xs text-gray-400 sm:ml-auto">2x rewards multiplier</span>
              </div>
            </div>

            {/* Note */}
            <p className="text-[10px] text-gray-500 leading-relaxed">
              Bonus multiplier increases based on how long you continuously stake. Longer stakes earn higher multipliers, rewarding loyalty and reducing gaming.
            </p>
          </div>
        </div>

        {/* Stats Tile */}
        {apyHistory.length > 0 && (
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0B0B0F] via-[#0B0B0F]/90 to-black shadow-2xl">
            {/* Decorative elements */}
            <div className="absolute -left-10 -top-10 h-36 w-36 rounded-full bg-blue-500/10 blur-3xl"></div>
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-blue-500/10 to-transparent"></div>

            <div className="relative px-5 py-6 sm:px-6 sm:py-7 md:px-8 md:py-9 flex flex-col gap-5">
              {/* Header */}
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="shrink-0 p-4 rounded-2xl bg-[#0F0F12] border border-blue-500/30 text-blue-400 shadow-lg">
                  <TrendingUp size={28} className="fill-blue-400/30" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-blue-400/80 font-semibold">Analytics</p>
                      <p className="text-lg sm:text-xl font-black text-white leading-tight">APY History</p>
                    </div>
                    <span className="text-[10px] sm:text-xs bg-white/10 px-2 py-1 rounded-full text-gray-300 font-semibold uppercase tracking-widest">30 Days</span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Track APY trends over time
                  </p>
                </div>
              </div>

              {/* Chart */}
              <div className="h-48 flex items-end justify-between gap-1">
                {apyHistory.map((point, index) => {
                  const maxAPY = Math.max(...apyHistory.map(p => p.apy));
                  const height = maxAPY > 0 ? (point.apy / maxAPY) * 100 : 0;
                  const isTrendingUp = index > 0 && point.apy > apyHistory[index - 1].apy;

                  return (
                    <div
                      key={index}
                      className="flex-1 flex flex-col items-center group"
                    >
                      <div
                        className={`w-full hover:opacity-80 transition-opacity rounded-t relative ${
                          isTrendingUp ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ height: `${Math.max(height, 5)}%` }}
                      >
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-[#0A0A0A] border border-white/10 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {point.apy.toFixed(2)}%
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-600 mt-2 transform -rotate-45 origin-left">
                        {new Date(point.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white/5 rounded-xl px-3 py-2 border border-white/5">
                  <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Current</div>
                  <div className="text-sm font-mono font-bold text-white">{currentAPY}</div>
                </div>
                <div className="bg-white/5 rounded-xl px-3 py-2 border border-white/5">
                  <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Avg (30d)</div>
                  <div className="text-sm font-mono font-bold text-white">
                    {(apyHistory.reduce((sum, p) => sum + p.apy, 0) / apyHistory.length).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl px-3 py-2 border border-white/5">
                  <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Trend</div>
                  <div className={`text-sm font-mono font-bold ${apyTrend > 0 ? 'text-green-400' : apyTrend < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                    {apyTrend > 0 ? '+' : ''}{apyTrend.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KarmaDashboard;
