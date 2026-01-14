import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useStore } from '../contexts/StoreContext';
import { Token } from '../types';
import { RewardDropdown } from './RewardDropdown';

interface CreateFarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: Token;
}

export const CreateFarmModal: React.FC<CreateFarmModalProps> = ({ isOpen, onClose, token }) => {
  const { createFarm, myHoldings, userBalanceDC, tokens } = useStore();

  const dcToken = tokens.find((t: Token) => t.ticker === 'DC');
  const karmaToken = tokens.find((t: Token) => t.ticker === 'KARMA');

  const [formData, setFormData] = useState({
    stakingTokenId: token.id,
    rewardTokenId: token.id,
    rewardRate: 0.0001,
    duration: 30, // 30 days
    lockPeriod: 0, // 0 days (no lock)
    maxStakeAmount: 1000000,
    minStakeAmount: 1,
    description: '',
    initialDeposit: 100000
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createFarm({
        ownerTokenId: token.id,
        stakingTokenId: formData.stakingTokenId,
        rewardTokenId: formData.rewardTokenId,
        rewardRate: formData.rewardRate,
        duration: formData.duration * 24 * 60 * 60 * 1000, // Convert days to ms
        lockPeriod: formData.lockPeriod * 24 * 60 * 60 * 1000,
        maxStakeAmount: formData.maxStakeAmount,
        minStakeAmount: formData.minStakeAmount,
        description: formData.description,
        initialDeposit: formData.initialDeposit
      });
      onClose();
    } catch (error) {
      console.error('Failed to create farm:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Memoize reward options to prevent unnecessary re-renders
  const rewardOptions = useMemo(
    () => tokens.filter(Boolean) as Token[],
    [tokens]
  );

  // Stable onChange callback to prevent unnecessary re-renders
  const handleRewardTokenChange = useCallback((id: string) => {
    setFormData((prev) => ({ ...prev, rewardTokenId: id }));
  }, []);

  // Get user's balance of the reward token
  const getTokenBalance = (tokenId: string): number => {
    if (tokenId === token.id) {
      return myHoldings.find((holding: { tokenId: string; balance: number }) => holding.tokenId === tokenId)?.balance || 0;
    }
    return 0;
  };

  const rewardTokenBalance = getTokenBalance(formData.rewardTokenId);
  const canAffordDeposit = rewardTokenBalance >= formData.initialDeposit;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
      <div className="relative overflow-hidden rounded-2xl border border-purple-500/25 bg-gradient-to-br from-[#080808] via-[#0c0c12] to-[#120c1c] shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-emerald-400/15 blur-3xl" />
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-purple-500/20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/40 bg-black/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-purple-100">
              <span className="h-2 w-2 rounded-full bg-gradient-to-r from-purple-400 to-emerald-400 animate-pulse" />
              Farm Studio
            </div>
            <h2 className="text-2xl font-bold text-white mt-3">Create Farm</h2>
            <p className="text-gray-300/90 text-sm mt-1">
              Launch a staking farm for {token.name} ({token.ticker})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Token Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Staking Token
              </label>
              <input
                value={`${token.name} (${token.ticker})`}
                disabled
                className="w-full rounded-xl bg-black/50 border border-white/10 px-4 py-3 text-white placeholder-gray-500 cursor-not-allowed shadow-inner shadow-purple-900/10"
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Reward Token
              </label>
              <RewardDropdown
                value={formData.rewardTokenId}
                onChange={handleRewardTokenChange}
                options={rewardOptions}
              />
            </div>
          </div>

          {/* Reward Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Reward Rate (per token per second)
            </label>
            <input
              id="farm-reward-rate"
              name="rewardRate"
              type="number"
              step="0.00001"
              min="0.00001"
              max="0.001"
              value={formData.rewardRate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, rewardRate: parseFloat(e.target.value) })
              }
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              placeholder="0.0001"
            />
            <p className="text-xs text-gray-500 mt-1">
              Higher rates = higher APY. Max rate: 0.001
            </p>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Farm Duration (days)
            </label>
            <input
              id="farm-duration"
              name="duration"
              type="number"
              min="1"
              max="365"
              value={formData.duration}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, duration: parseInt(e.target.value, 10) || 0 })
              }
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              placeholder="30"
            />
            <p className="text-xs text-gray-500 mt-1">
              Farm will expire after this duration
            </p>
          </div>

          {/* Lock Period */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Lock Period (days, 0 for no lock)
            </label>
            <input
              id="farm-lock-period"
              name="lockPeriod"
              type="number"
              min="0"
              max="365"
              value={formData.lockPeriod}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, lockPeriod: parseInt(e.target.value, 10) || 0 })
              }
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              placeholder="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Staked tokens will be locked for this period
            </p>
          </div>

          {/* Stake Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Min Stake Amount
              </label>
              <input
                id="farm-min-stake"
                name="minStakeAmount"
                type="number"
                min="1"
                value={formData.minStakeAmount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, minStakeAmount: parseInt(e.target.value, 10) || 0 })
                }
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                placeholder="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max Stake Amount
              </label>
              <input
                id="farm-max-stake"
                name="maxStakeAmount"
                type="number"
                min="1"
                value={formData.maxStakeAmount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, maxStakeAmount: parseInt(e.target.value, 10) || 0 })
                }
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                placeholder="1000000"
              />
            </div>
          </div>

          {/* Initial Deposit */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Initial Reward Deposit
            </label>
            <div className="relative">
              <input
                id="farm-initial-deposit"
                name="initialDeposit"
                type="number"
                min="1"
                value={formData.initialDeposit}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, initialDeposit: parseInt(e.target.value, 10) || 0 })
                }
                className={`w-full bg-black/40 border rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 ${!canAffordDeposit ? 'border-red-500' : 'border-white/10'}`}
                placeholder="100000"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                {token.ticker}
              </span>
            </div>
            {!canAffordDeposit && (
              <p className="text-xs text-red-400 mt-1">
                Insufficient balance. You have {rewardTokenBalance} {token.ticker}.
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              These tokens will be deposited into the reward pool for stakers to earn
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Farm Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none"
              placeholder="Describe your farm..."
            />
          </div>

          {/* APY Preview */}
          <div className="rounded-xl p-4 border border-white/10 bg-black/40 backdrop-blur-sm shadow-inner shadow-purple-900/20">
            <h3 className="text-lg font-semibold text-white mb-2">Estimated APY</h3>
            <div className="space-y-1 text-sm text-gray-200">
              <div className="flex justify-between">
                <span className="text-gray-400">Reward Rate:</span>
                <span className="text-doge">{(formData.rewardRate * 86400 * 365 * 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Duration:</span>
                <span className="text-white">{formData.duration} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Lock Period:</span>
                <span className="text-white">{formData.lockPeriod} days</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !canAffordDeposit}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-doge to-doge-light hover:brightness-110 text-black font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Farm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Import tokens for the select dropdown
const tokens: Token[] = [];
