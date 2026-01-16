import React, { useState, useEffect } from 'react';
import { Droplets, Award, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { useToast } from './Toast';
import { useAuth } from '../contexts/AuthContext';
import { formatNumber } from '../services/web3Service';

interface MemecoinStakingTileProps {
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  tokenPrice: number;
  userBalance: number;
  contractAddress: string;
}

interface StakingPosition {
  id: string;
  amount: string;
  tokenPrice: string;
  stakedAt: string;
  pendingKarma: string;
  claimedKarma: string;
  active: boolean;
}

interface TokenConfig {
  tokenId: string;
  tokenSymbol: string;
  rewardRate: number;
  apyBasisPoints: number;
  formattedAPY: string;
  enabled: boolean;
  minStakeAmount: string;
  maxStakeAmount: string;
  unstakeFeePercent: number;
}

export const MemecoinStakingTile: React.FC<MemecoinStakingTileProps> = ({
  tokenId,
  tokenName,
  tokenSymbol,
  tokenPrice,
  userBalance,
  contractAddress,
}) => {
  const { addToast } = useToast();
  const { isAuthenticated } = useAuth();
  const [position, setPosition] = useState<StakingPosition | null>(null);
  const [tokenConfig, setTokenConfig] = useState<TokenConfig | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // Fetch staking position and token config on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchStakingPosition();
    }
    fetchTokenConfig();
  }, [tokenId, isAuthenticated]);

  const fetchStakingPosition = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/stake/memecoin/positions?tokenId=${tokenId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success && data.data.positions.length > 0) {
        setPosition(data.data.positions[0]);
      }
    } catch (error) {
      console.error('Error fetching staking position:', error);
    }
  };

  const fetchTokenConfig = async () => {
    try {
      const response = await fetch(`/api/stake/memecoin/${tokenId}`);
      const data = await response.json();
      if (data.success) {
        setTokenConfig(data.data);
      }
    } catch (error) {
      console.error('Error fetching token config:', error);
    }
  };

  const handleApprove = async () => {
    if (!isAuthenticated) {
      addToast('error', 'Please connect your wallet first');
      return;
    }

    setIsApproving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/stake/memecoin/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          tokenAddress: contractAddress,
          amount: stakeAmount,
        }),
      });

      const data = await response.json();
      if (data.success) {
        addToast('success', 'Approval successful! You can now stake.');
      } else {
        addToast('error', data.message || 'Approval failed');
      }
    } catch (error) {
      addToast('error', 'Failed to approve tokens');
    } finally {
      setIsApproving(false);
    }
  };

  const handleStake = async () => {
    if (!isAuthenticated) {
      addToast('error', 'Please connect your wallet first');
      return;
    }

    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      addToast('error', 'Please enter a valid amount');
      return;
    }

    if (parseFloat(stakeAmount) > userBalance) {
      addToast('error', 'Insufficient balance');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/stake/memecoin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          tokenId,
          amount: stakeAmount,
        }),
      });

      const data = await response.json();
      if (data.success) {
        addToast('success', `Staked ${stakeAmount} ${tokenSymbol} successfully!`);
        setStakeAmount('');
        fetchStakingPosition();
      } else {
        addToast('error', data.message || 'Staking failed');
      }
    } catch (error) {
      addToast('error', 'Failed to stake tokens');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnstake = async () => {
    if (!isAuthenticated) {
      addToast('error', 'Please connect your wallet first');
      return;
    }

    if (!unstakeAmount || parseFloat(unstakeAmount) <= 0) {
      addToast('error', 'Please enter a valid amount');
      return;
    }

    if (!position || parseFloat(unstakeAmount) > parseFloat(position.amount)) {
      addToast('error', 'Insufficient staked amount');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/stake/memecoin/unstake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          stakeId: position.id,
          amount: unstakeAmount,
        }),
      });

      const data = await response.json();
      if (data.success) {
        addToast('success', `Unstaked ${unstakeAmount} ${tokenSymbol} successfully!`);
        setUnstakeAmount('');
        fetchStakingPosition();
      } else {
        addToast('error', data.message || 'Unstaking failed');
      }
    } catch (error) {
      addToast('error', 'Failed to unstake tokens');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimRewards = async () => {
    if (!isAuthenticated) {
      addToast('error', 'Please connect your wallet first');
      return;
    }

    if (!position || parseFloat(position.pendingKarma) === 0) {
      addToast('error', 'No rewards to claim');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/stake/memecoin/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          stakeId: position.id,
        }),
      });

      const data = await response.json();
      if (data.success) {
        addToast('success', `Claimed ${formatNumber(parseFloat(position.pendingKarma))} $KARMA!`);
        fetchStakingPosition();
      } else {
        addToast('error', data.message || 'Claim failed');
      }
    } catch (error) {
      addToast('error', 'Failed to claim rewards');
    } finally {
      setIsLoading(false);
    }
  };

  if (!tokenConfig || !tokenConfig.enabled) {
    return (
      <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <Droplets className="text-doge" size={20} />
          <h3 className="font-bold text-sm uppercase tracking-wider text-white">Stake {tokenSymbol}</h3>
        </div>
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <AlertCircle size={16} />
          <span>Staking not available for this token yet</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Droplets className="text-doge" size={20} />
          <h3 className="font-bold text-sm uppercase tracking-wider text-white">
            Stake {tokenSymbol} to Earn $KARMA
          </h3>
        </div>
        {tokenConfig && (
          <div className="flex items-center gap-1.5 bg-doge/10 border border-doge/30 px-3 py-1.5 rounded-full">
            <TrendingUp size={14} className="text-doge" />
            <span className="text-xs font-bold text-doge">{tokenConfig.formattedAPY} APY</span>
          </div>
        )}
      </div>

      {/* Current Position */}
      {position && position.active && (
        <div className="mb-6 p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">
                Staked {tokenSymbol}
              </div>
              <div className="text-lg font-mono font-bold text-white">
                {formatNumber(parseFloat(position.amount))}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">
                Pending $KARMA
              </div>
              <div className="text-lg font-mono font-bold text-doge">
                {formatNumber(parseFloat(position.pendingKarma))}
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
            <div className="text-[10px] text-gray-500">
              Staked at {new Date(position.stakedAt).toLocaleDateString()}
            </div>
            <Button
              size="sm"
              onClick={handleClaimRewards}
              disabled={isLoading || parseFloat(position.pendingKarma) === 0}
              className="bg-doge text-black px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider"
            >
              Claim Rewards
            </Button>
          </div>
        </div>
      )}

      {/* Stake Section */}
      <div className="mb-4">
        <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2 block">
          Stake {tokenSymbol}
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            placeholder="0"
            className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-doge/50 outline-none transition-all"
            disabled={!isAuthenticated}
          />
          <Button
            size="sm"
            onClick={handleApprove}
            disabled={isApproving || !isAuthenticated || !stakeAmount}
            className="bg-white/5 hover:bg-white/10 text-white px-4 rounded-xl text-xs font-bold uppercase border-0"
          >
            {isApproving ? 'Approving...' : 'Approve'}
          </Button>
          <Button
            size="sm"
            onClick={handleStake}
            disabled={isLoading || !isAuthenticated || !stakeAmount}
            className="bg-doge text-black px-4 rounded-xl text-xs font-bold uppercase"
          >
            {isLoading ? 'Staking...' : 'Stake'}
          </Button>
        </div>
        <div className="flex items-center justify-between mt-2 text-[10px] text-gray-500">
          <span>Balance: {formatNumber(userBalance)} {tokenSymbol}</span>
          <button
            onClick={() => setStakeAmount(userBalance.toString())}
            className="text-doge hover:underline disabled:opacity-50"
            disabled={!isAuthenticated}
          >
            Max
          </button>
        </div>
      </div>

      {/* Unstake Section */}
      {position && position.active && (
        <div>
          <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2 block">
            Unstake {tokenSymbol}
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={unstakeAmount}
              onChange={(e) => setUnstakeAmount(e.target.value)}
              placeholder="0"
              className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-doge/50 outline-none transition-all"
              disabled={!isAuthenticated}
            />
            <Button
              size="sm"
              onClick={handleUnstake}
              disabled={isLoading || !isAuthenticated || !unstakeAmount}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 rounded-xl text-xs font-bold uppercase border border-red-500/30"
            >
              {isLoading ? 'Unstaking...' : 'Unstake'}
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2 text-[10px] text-gray-500">
            <span>Staked: {formatNumber(parseFloat(position.amount))} {tokenSymbol}</span>
            <button
              onClick={() => setUnstakeAmount(position.amount)}
              className="text-doge hover:underline disabled:opacity-50"
              disabled={!isAuthenticated}
            >
              Max
            </button>
          </div>
          {tokenConfig.unstakeFeePercent > 0 && (
            <div className="mt-2 text-[10px] text-yellow-400">
              Warning: {tokenConfig.unstakeFeePercent}% fee applies to early unstaking
            </div>
          )}
        </div>
      )}

      {/* Info Section */}
      <div className="mt-6 pt-4 border-t border-white/5">
        <div className="flex items-start gap-2 text-[10px] text-gray-400">
          <Award size={14} className="text-doge shrink-0 mt-0.5" />
          <p>
            Stake your {tokenSymbol} tokens to earn $KARMA rewards. Rewards are calculated based on your staked amount, token value, and staking duration.
          </p>
        </div>
      </div>
    </div>
  );
};
