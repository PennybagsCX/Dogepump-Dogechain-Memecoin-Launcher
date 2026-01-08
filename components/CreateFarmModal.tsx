import React, { useState } from 'react';
import { useStore } from '../contexts/StoreContext';
import { Token } from '../types';

interface CreateFarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: Token;
}

export const CreateFarmModal: React.FC<CreateFarmModalProps> = ({ isOpen, onClose, token }) => {
  const { createFarm, myHoldings, userBalanceDC, tokens } = useStore();

  const [formData, setFormData] = useState({
    stakingTokenId: token.id,
    rewardTokenId: token.id,
    rewardRate: 0.0001,
    duration: 30, // 30 days
    lockPeriod: 0, // 0 days (no lock)
    maxStakeAmount: 1000000,
    minStakeAmount: 1,
    description: `Stake ${token.ticker} to earn ${token.ticker} rewards`,
    initialDeposit: 100000
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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

  // Get user's balance of the reward token
  const getTokenBalance = (tokenId: string): number => {
    if (tokenId === token.id) {
      return myHoldings.find(h => h.tokenId === tokenId)?.balance || 0;
    }
    return 0;
  };

  const rewardTokenBalance = getTokenBalance(formData.rewardTokenId);
  const canAffordDeposit = rewardTokenBalance >= formData.initialDeposit;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-purple-500/30 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-purple-500/20">
          <div>
            <h2 className="text-2xl font-bold text-white">Create Farm</h2>
            <p className="text-gray-400 text-sm mt-1">
              Create a staking farm for {token.name} ({token.ticker})
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
              <select
                value={formData.stakingTokenId}
                onChange={(e) => setFormData({ ...formData, stakingTokenId: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              >
                {myHoldings.filter(h => h.balance > 0).map(holding => {
                  const t = tokens.find(t => t.id === holding.tokenId);
                  return t ? (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.ticker})
                    </option>
                  ) : null;
                })}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Reward Token
              </label>
              <select
                value={formData.rewardTokenId}
                onChange={(e) => setFormData({ ...formData, rewardTokenId: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              >
                {myHoldings.filter(h => h.balance > 0).map(holding => {
                  const t = tokens.find(t => t.id === holding.tokenId);
                  return t ? (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.ticker})
                    </option>
                  ) : null;
                })}
              </select>
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
              onChange={(e) => setFormData({ ...formData, rewardRate: parseFloat(e.target.value) })}
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
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
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
              onChange={(e) => setFormData({ ...formData, lockPeriod: parseInt(e.target.value) })}
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
                onChange={(e) => setFormData({ ...formData, minStakeAmount: parseInt(e.target.value) })}
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
                onChange={(e) => setFormData({ ...formData, maxStakeAmount: parseInt(e.target.value) })}
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
                onChange={(e) => setFormData({ ...formData, initialDeposit: parseInt(e.target.value) })}
                className={`w-full bg-gray-800 border rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 ${!canAffordDeposit ? 'border-red-500' : 'border-gray-700'}`}
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
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none"
              placeholder="Describe your farm..."
            />
          </div>

          {/* APY Preview */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-purple-500/20">
            <h3 className="text-lg font-semibold text-purple-400 mb-2">Estimated APY</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Reward Rate:</span>
                <span className="text-white">{(formData.rewardRate * 86400 * 365 * 100).toFixed(2)}%</span>
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
          <div className="flex gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !canAffordDeposit}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
