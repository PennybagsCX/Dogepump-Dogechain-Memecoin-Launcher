import React, { useState } from 'react';
import { useStore } from '../contexts/StoreContext';
import { Token, TokenOwnerFarm } from '../types';
import { FarmCard } from './FarmCard';
import { CreateFarmModal } from './CreateFarmModal';

interface FarmManagementTabProps {
  token?: Token;
}

export const FarmManagementTab: React.FC<FarmManagementTabProps> = ({ token }) => {
  const {
    tokens,
    getMyFarms,
    tokenOwnerFarms
  } = useStore();

  const [selectedFarm, setSelectedFarm] = useState<TokenOwnerFarm | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Filter farms by specific token if provided, otherwise show all user's farms
  const allMyFarms = getMyFarms();
  const myFarms = token
    ? allMyFarms.filter(f => f.ownerTokenId === token.id)
    : allMyFarms;
  const activeFarms = myFarms.filter(f => f.status === 'active');
  const pausedFarms = myFarms.filter(f => f.status === 'paused');

  const handleManageFarm = (farm: TokenOwnerFarm) => {
    setSelectedFarm(farm);
    setShowEditModal(true);
  };

  const handleDepositRewards = (farm: TokenOwnerFarm) => {
    setSelectedFarm(farm);
    setShowDepositModal(true);
  };

  const handleCloseModals = () => {
    setSelectedFarm(null);
    setShowCreateModal(false);
    setShowDepositModal(false);
    setShowEditModal(false);
  };

  // Get user's created tokens
  const myCreatedTokens = tokens.filter(t => t.creator === 'You');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {token ? `${token.name} Farms` : 'My Farms'}
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            {token
              ? `Create and manage staking farms for ${token.name}`
              : 'Create and manage staking farms for your tokens'
            }
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-medium rounded-lg transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m0 0l6-6M12 20V4m0 0l-6 6" />
          </svg>
          {token ? `Create Farm for ${token.ticker}` : 'Create New Farm'}
        </button>
      </div>

      {/* No farms state */}
      {myFarms.length === 0 ? (
        <div className="bg-gray-800/50 border border-dashed border-gray-700 rounded-xl p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m0 0l-3-3M4 12h4m-2 0h-4m2 0v4m0 0l3-3m0 0l-3 3M18 12h4m-2 0h-4" />
            </svg>
            <h3 className="text-xl font-semibold text-white">No Farms Yet</h3>
            <p className="text-gray-400 mt-2">
              {token
                ? `Create a farm for ${token.name} to allow users to stake and earn your tokens!`
                : 'Create your first farm to allow users to stake and earn your tokens!'
              }
            </p>
          </div>
          {(token || myCreatedTokens.length > 0) ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors"
            >
              {token ? `Create Farm for ${token.ticker}` : 'Create Your First Farm'}
            </button>
          ) : (
            <p className="text-gray-500 text-sm">
              Launch a token first to create farms.
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Active Farms */}
          {activeFarms.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Active Farms ({activeFarms.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeFarms.map(farm => (
                  <FarmCard
                    key={farm.id}
                    farm={farm}
                    onManage={() => handleManageFarm(farm)}
                    onStake={() => {}}
                    showManageButton={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Paused Farms */}
          {pausedFarms.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                Paused Farms ({pausedFarms.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pausedFarms.map(farm => (
                  <FarmCard
                    key={farm.id}
                    farm={farm}
                    onManage={() => handleManageFarm(farm)}
                    showManageButton={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Farm Stats Summary */}
          <div className="bg-gray-800/50 border border-purple-500/20 rounded-xl p-6 mt-8">
            <h3 className="text-lg font-semibold text-white mb-4">
              {token ? `${token.name} Farm Summary` : 'Farm Summary'}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Total Farms</p>
                <p className="text-2xl font-bold text-white">{myFarms.length}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Active</p>
                <p className="text-2xl font-bold text-green-400">{activeFarms.length}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Paused</p>
                <p className="text-2xl font-bold text-yellow-400">{pausedFarms.length}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Staked</p>
                <p className="text-2xl font-bold text-purple-400">
                  {myFarms.reduce((sum, f) => sum + (f.stats?.totalStaked || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Create Farm Modal */}
      {showCreateModal && (token || myCreatedTokens.length > 0) && (
        <CreateFarmModal
          isOpen={showCreateModal}
          onClose={handleCloseModals}
          token={token || myCreatedTokens[0]} // Use provided token or default to first created token
        />
      )}

      {/* Deposit Rewards Modal */}
      {showDepositModal && selectedFarm && (
        <DepositRewardsModal
          isOpen={showDepositModal}
          onClose={handleCloseModals}
          farm={selectedFarm}
        />
      )}

      {/* Edit Farm Config Modal */}
      {showEditModal && selectedFarm && (
        <EditFarmConfigModal
          isOpen={showEditModal}
          onClose={handleCloseModals}
          farm={selectedFarm}
        />
      )}
    </div>
  );
};

// Placeholder for DepositRewardsModal - to be implemented
const DepositRewardsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  farm: TokenOwnerFarm;
}> = ({ isOpen, onClose, farm }) => {
  const { depositRewards, myHoldings, tokens } = useStore();

  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rewardToken = tokens.find(t => t.id === farm.rewardTokenId);
  const userBalance = myHoldings.find(h => h.tokenId === farm.rewardTokenId)?.balance || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const depositAmount = parseInt(amount);
      if (isNaN(depositAmount) || depositAmount <= 0) {
        alert('Please enter a valid amount');
        return;
      }

      if (depositAmount > userBalance) {
        alert(`Insufficient balance. You have ${userBalance} ${rewardToken?.ticker}`);
        return;
      }

      await depositRewards(farm.id, depositAmount);
      onClose();
    } catch (error) {
      console.error('Failed to deposit rewards:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-purple-500/30 rounded-xl shadow-2xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">Deposit Rewards</h2>
            <p className="text-gray-400 text-sm mt-1">
              Add {rewardToken?.ticker} to {farm.pool.rewardTokenId} farm
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
          <div>
            <label htmlFor="deposit-amount" className="block text-sm font-medium text-gray-300 mb-2">
              Deposit Amount ({rewardToken?.ticker})
            </label>
            <div className="relative">
              <input
                id="deposit-amount"
                name="depositAmount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                placeholder="Enter amount..."
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                {rewardToken?.ticker}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Your balance: {userBalance.toLocaleString()} {rewardToken?.ticker}
            </p>
          </div>

          {/* Pool Info */}
          <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Available in Pool:</span>
              <span className="text-white font-medium">{farm.pool.availableRewards.toLocaleString()} {rewardToken?.ticker}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total Distributed:</span>
              <span className="text-white font-medium">{farm.pool.totalDistributed.toLocaleString()} {rewardToken?.ticker}</span>
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
              disabled={isSubmitting || !amount}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Depositing...' : 'Deposit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Placeholder for EditFarmConfigModal - to be implemented
const EditFarmConfigModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  farm: TokenOwnerFarm;
}> = ({ isOpen, onClose, farm }) => {
  const { updateFarmConfig, pauseFarm, resumeFarm, closeFarm } = useStore();

  const [formData, setFormData] = useState({
    rewardRate: farm.config.rewardRate,
    duration: farm.config.duration / (24 * 60 * 60 * 1000), // Convert ms to days
    lockPeriod: farm.config.lockPeriod / (24 * 60 * 60 * 1000),
    maxStakeAmount: farm.config.maxStakeAmount,
    minStakeAmount: farm.config.minStakeAmount,
    isPaused: farm.config.isPaused
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateFarmConfig(farm.id, {
        rewardRate: formData.rewardRate,
        duration: formData.duration * 24 * 60 * 60 * 1000, // Convert days to ms
        lockPeriod: formData.lockPeriod * 24 * 60 * 60 * 1000,
        maxStakeAmount: formData.maxStakeAmount,
        minStakeAmount: formData.minStakeAmount,
        isPaused: formData.isPaused
      });
      onClose();
    } catch (error) {
      console.error('Failed to update farm config:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePauseResume = async () => {
    if (formData.isPaused) {
      await resumeFarm(farm.id);
    } else {
      await pauseFarm(farm.id);
    }
  };

  const handleCloseFarm = async () => {
    if (confirm('Are you sure you want to close this farm? All staked tokens will be returned and remaining rewards will be refunded.')) {
      await closeFarm(farm.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-purple-500/30 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">Manage Farm</h2>
            <p className="text-gray-400 text-sm mt-1">
              Configure your farm settings
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
          {/* Reward Rate */}
          <div>
            <label htmlFor="edit-farm-reward-rate" className="block text-sm font-medium text-gray-300 mb-2">
              Reward Rate (per token per second)
            </label>
            <input
              id="edit-farm-reward-rate"
              name="editRewardRate"
              type="number"
              step="0.00001"
              min="0.00001"
              max="0.001"
              value={formData.rewardRate}
              onChange={(e) => setFormData({ ...formData, rewardRate: parseFloat(e.target.value) })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Higher rates = higher APY. Current: {(formData.rewardRate * 86400 * 365 * 100).toFixed(2)}%
            </p>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Farm Duration (days)
            </label>
            <input
              id="edit-farm-duration"
              name="editDuration"
              type="number"
              min="1"
              max="365"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </div>

          {/* Lock Period */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Lock Period (days, 0 for no lock)
            </label>
            <input
              id="edit-farm-lock-period"
              name="editLockPeriod"
              type="number"
              min="0"
              max="365"
              value={formData.lockPeriod}
              onChange={(e) => setFormData({ ...formData, lockPeriod: parseInt(e.target.value) })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </div>

          {/* Stake Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Min Stake Amount
              </label>
              <input
                id="edit-farm-min-stake"
                name="editMinStakeAmount"
                type="number"
                min="1"
                value={formData.minStakeAmount}
                onChange={(e) => setFormData({ ...formData, minStakeAmount: parseInt(e.target.value) })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max Stake Amount
              </label>
              <input
                id="edit-farm-max-stake"
                name="editMaxStakeAmount"
                type="number"
                min="1"
                value={formData.maxStakeAmount}
                onChange={(e) => setFormData({ ...formData, maxStakeAmount: parseInt(e.target.value) })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-4 border-t border-gray-700">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Updating...' : 'Save Changes'}
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handlePauseResume}
                disabled={isSubmitting}
                className={`px-4 py-2 font-medium rounded-lg transition-all ${
                  formData.isPaused
                    ? 'bg-green-600 hover:bg-green-500 text-white'
                    : 'bg-yellow-600 hover:bg-yellow-500 text-white'
                }`}
              >
                {formData.isPaused ? '▶ Resume' : '⏸ Pause'}
              </button>
              <button
                type="button"
                onClick={handleCloseFarm}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🗑 Close Farm
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
