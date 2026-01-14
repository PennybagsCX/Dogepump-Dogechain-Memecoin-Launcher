import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useStore } from '../contexts/StoreContext';
import { Token, TokenOwnerFarm } from '../types';
import { FarmCard } from './FarmCard';
import { RewardDropdown } from './RewardDropdown';
import { Search, X } from 'lucide-react';

interface FarmManagementTabProps {
  token?: Token;
}

// Inline Create Farm Form Component
const CreateFarmForm: React.FC<{
  token: Token;
  onCancel: () => void;
}> = ({ token, onCancel }) => {
  const { createFarm, myHoldings, tokens } = useStore();

  const dcToken = tokens.find((t: Token) => t.ticker === 'DC');
  const karmaToken = tokens.find((t: Token) => t.ticker === 'KARMA');

  // Memoize reward options to prevent unnecessary re-renders
  const rewardOptions = useMemo(
    () => tokens.filter(Boolean) as Token[],
    [tokens]
  );

  const defaultStakingId = token.id;

  const [formData, setFormData] = useState({
    stakingTokenId: defaultStakingId,
    rewardTokenId: token.id,
    rewardRate: 0.0001,
    duration: 30,
    lockPeriod: 0,
    maxStakeAmount: 1000000,
    minStakeAmount: 1,
    description: '',
    initialDeposit: 100000
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stable onChange callback to prevent unnecessary re-renders
  const handleRewardTokenChange = useCallback((id: string) => {
    setFormData((prev) => ({ ...prev, rewardTokenId: id }));
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createFarm({
        ownerTokenId: token.id,
        stakingTokenId: formData.stakingTokenId,
        rewardTokenId: formData.rewardTokenId,
        rewardRate: formData.rewardRate,
        duration: formData.duration * 24 * 60 * 60 * 1000,
        lockPeriod: formData.lockPeriod * 24 * 60 * 60 * 1000,
        maxStakeAmount: formData.maxStakeAmount,
        minStakeAmount: formData.minStakeAmount,
        description: formData.description,
        initialDeposit: formData.initialDeposit
      });
      onCancel();
    } catch (error) {
      console.error('Failed to create farm:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTokenBalance = (tokenId: string): number => {
    if (tokenId === token.id) {
      return myHoldings.find((holding: { tokenId: string; balance: number }) => holding.tokenId === tokenId)?.balance || 0;
    }
    return 0;
  };

  const rewardTokenBalance = getTokenBalance(formData.rewardTokenId);
  const canAffordDeposit = rewardTokenBalance >= formData.initialDeposit;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
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
          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
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
          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
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
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
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
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
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
        <label className="block text-sm font-medium text-gray-300 mb-2 text-center">
          Farm Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={3}
          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-center focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none"
          placeholder="Describe your farm..."
        />
      </div>

      {/* APY Preview */}
      <div className="rounded-xl p-4 border border-white/10 bg-black/40 backdrop-blur-sm shadow-inner shadow-purple-900/20">
        <h3 className="text-lg font-semibold text-white mb-2">Estimated APY</h3>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-200">
          <div className="inline-flex items-center gap-1">
            <span className="text-gray-400">Reward Rate:</span>
            <span className="text-doge">{(formData.rewardRate * 86400 * 365 * 100).toFixed(2)}%</span>
          </div>
          <div className="inline-flex items-center gap-1">
            <span className="text-gray-400">Duration:</span>
            <span className="text-white">{formData.duration} days</span>
          </div>
          <div className="inline-flex items-center gap-1">
            <span className="text-gray-400">Lock Period:</span>
            <span className="text-white">{formData.lockPeriod} days</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:flex-1 px-6 py-3 border border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !canAffordDeposit}
          className="w-full sm:flex-1 px-6 py-3 bg-gradient-to-r from-doge to-doge-light hover:brightness-110 text-black font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating...' : 'Create Farm'}
        </button>
      </div>
    </form>
  );
};


export const FarmManagementTab: React.FC<FarmManagementTabProps> = ({ token }) => {
  const {
    tokens,
    getMyFarms,
    tokenOwnerFarms
  } = useStore();

  const [selectedFarm, setSelectedFarm] = useState<TokenOwnerFarm | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeFarmsSearchQuery, setActiveFarmsSearchQuery] = useState('');
  const [pausedFarmsSearchQuery, setPausedFarmsSearchQuery] = useState('');

  // Filter farms by specific token if provided, otherwise show all user's farms
  const allMyFarms = getMyFarms();
  const myFarms: TokenOwnerFarm[] = token
    ? allMyFarms.filter((f: TokenOwnerFarm) => f.ownerTokenId === token.id)
    : allMyFarms;

  // Filter farms helper function
  const filterFarms = (
    farms: TokenOwnerFarm[],
    query: string,
    tokens: Token[]
  ): TokenOwnerFarm[] => {
    if (!query) return farms;

    const q = query.toLowerCase();

    return farms.filter((farm) => {
      const stakingToken = tokens.find(t => t.id === farm.stakingTokenId);
      const rewardToken = tokens.find(t => t.id === farm.rewardTokenId);
      const ownerToken = tokens.find(t => t.id === farm.ownerTokenId);

      return (
        (rewardToken?.name?.toLowerCase() || '').includes(q) ||
        (rewardToken?.ticker?.toLowerCase() || '').includes(q) ||
        (rewardToken?.contractAddress?.toLowerCase() || '').includes(q) ||
        (stakingToken?.name?.toLowerCase() || '').includes(q) ||
        (stakingToken?.ticker?.toLowerCase() || '').includes(q) ||
        (stakingToken?.contractAddress?.toLowerCase() || '').includes(q) ||
        (ownerToken?.name?.toLowerCase() || '').includes(q) ||
        (ownerToken?.ticker?.toLowerCase() || '').includes(q) ||
        (ownerToken?.contractAddress?.toLowerCase() || '').includes(q) ||
        (farm.description?.toLowerCase() || '').includes(q)
      );
    });
  };

  // Apply search filtering using useMemo for performance
  const activeFarms = useMemo(
    () => filterFarms(
      myFarms.filter((f: TokenOwnerFarm) => f.status === 'active'),
      activeFarmsSearchQuery,
      tokens
    ),
    [myFarms, activeFarmsSearchQuery, tokens]
  );

  const pausedFarms = useMemo(
    () => filterFarms(
      myFarms.filter((f: TokenOwnerFarm) => f.status === 'paused'),
      pausedFarmsSearchQuery,
      tokens
    ),
    [myFarms, pausedFarmsSearchQuery, tokens]
  );

  const shouldHideHeader = myFarms.length === 0 && !showCreateForm;

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
    setShowCreateForm(false);
    setShowDepositModal(false);
    setShowEditModal(false);
  };

  // Get user's created tokens
  const myCreatedTokens = tokens.filter((t: Token) => t.creator === 'You');

  // FarmSearchInput component
  const FarmSearchInput: React.FC<{
    query: string;
    onChange: (query: string) => void;
    label: string;
    count: number;
  }> = ({ query, onChange, label, count }) => (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-bold text-white">{label}</label>
        <span className="text-[11px] text-gray-500">{count} farms</span>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
        <input
          type="text"
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          placeholder="Search by token name, symbol, address, or description"
          className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-gray-500 focus:border-doge/50 outline-none transition-colors"
          aria-label={`Search ${label}`}
        />
        {query && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      {!shouldHideHeader && (
        <div className="text-center">
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
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="mt-4 mx-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-medium rounded-lg transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m0 0l6-6M12 20V4m0 0l-6 6" />
            </svg>
            {token ? `Create Farm for ${token.ticker}` : 'Create New Farm'}
          </button>
        </div>
      )}

      {/* Inline Create Farm Form */}
      {showCreateForm && (token || myCreatedTokens.length > 0) && (
        <div className="relative overflow-hidden rounded-2xl border border-purple-500/25 bg-gradient-to-br from-[#080808] via-[#0c0c12] to-[#120c1c] shadow-2xl">
          <div className="pointer-events-none absolute -top-20 -right-10 h-48 w-48 rounded-full bg-purple-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl" />
          <button
            onClick={() => setShowCreateForm(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="px-6 pt-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/40 bg-black/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-purple-100">
              <span className="h-2 w-2 rounded-full bg-gradient-to-r from-purple-400 to-emerald-400 animate-pulse" />
              Farm Studio
            </div>
            <h2 className="mt-4 text-2xl font-bold text-white">Create Farm</h2>
            <p className="text-sm text-gray-300/90 mt-1">
              Launch a staking farm for {token ? `${token.name} (${token.ticker})` : 'your token'}
            </p>
          </div>
          <div className="p-6">
            <CreateFarmForm
              token={token || myCreatedTokens[0]}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}

      {/* No farms state */}
      {myFarms.length === 0 && !showCreateForm ? (
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
              onClick={() => setShowCreateForm(true)}
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
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <h3 className="text-lg font-semibold text-white">Active Farms</h3>
                </div>
                <FarmSearchInput
                  query={activeFarmsSearchQuery}
                  onChange={setActiveFarmsSearchQuery}
                  label="Active Farms"
                  count={myFarms.filter((f: TokenOwnerFarm) => f.status === 'active').length}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeFarms.map((farm: TokenOwnerFarm) => (
                  <FarmCard
                    key={farm.id}
                    farm={farm}
                    onManage={() => handleManageFarm(farm)}
                    onStake={() => {}}
                    showManageButton={true}
                  />
                ))}
                {activeFarms.length === 0 && activeFarmsSearchQuery && (
                  <div className="col-span-full py-8 text-center">
                    <p className="text-gray-500 text-sm">No active farms match your search.</p>
                    <button
                      onClick={() => setActiveFarmsSearchQuery('')}
                      className="mt-2 text-doge text-sm hover:underline"
                    >
                      Clear search
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Paused Farms */}
          {pausedFarms.length > 0 && (
            <div>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                  <h3 className="text-lg font-semibold text-white">Paused Farms</h3>
                </div>
                <FarmSearchInput
                  query={pausedFarmsSearchQuery}
                  onChange={setPausedFarmsSearchQuery}
                  label="Paused Farms"
                  count={myFarms.filter((f: TokenOwnerFarm) => f.status === 'paused').length}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pausedFarms.map((farm: TokenOwnerFarm) => (
                  <FarmCard
                    key={farm.id}
                    farm={farm}
                    onManage={() => handleManageFarm(farm)}
                    showManageButton={true}
                  />
                ))}
                {pausedFarms.length === 0 && pausedFarmsSearchQuery && (
                  <div className="col-span-full py-8 text-center">
                    <p className="text-gray-500 text-sm">No paused farms match your search.</p>
                    <button
                      onClick={() => setPausedFarmsSearchQuery('')}
                      className="mt-2 text-doge text-sm hover:underline"
                    >
                      Clear search
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Farm Stats Summary */}
          <div className="relative overflow-hidden rounded-2xl border border-purple-500/25 bg-gradient-to-br from-[#080808] via-[#0c0c12] to-[#120c1c] p-6 mt-8 shadow-2xl">
            <div className="pointer-events-none absolute -top-12 right-8 h-24 w-24 rounded-full bg-purple-500/20 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-16 left-4 h-28 w-28 rounded-full bg-emerald-500/15 blur-3xl" />
            <h3 className="text-lg font-semibold text-white mb-4 text-center">
              {token ? `${token.name} Farm Summary` : 'Farm Summary'}
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="group rounded-xl border border-white/5 bg-black/40 p-4 backdrop-blur-sm transition hover:border-purple-400/60 hover:-translate-y-0.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="h-2 w-2 rounded-full bg-purple-400" />
                    Total Farms
                  </div>
                  <p className="text-2xl font-bold text-white">{myFarms.length}</p>
                </div>
              </div>
              <div className="group rounded-xl border border-white/5 bg-black/40 p-4 backdrop-blur-sm transition hover:border-emerald-400/60 hover:-translate-y-0.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Active
                  </div>
                  <p className="text-2xl font-bold text-emerald-200">{activeFarms.length}</p>
                </div>
              </div>
              <div className="group rounded-xl border border-white/5 bg-black/40 p-4 backdrop-blur-sm transition hover:border-amber-300/70 hover:-translate-y-0.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="h-2 w-2 rounded-full bg-amber-300" />
                    Paused
                  </div>
                  <p className="text-2xl font-bold text-amber-200">{pausedFarms.length}</p>
                </div>
              </div>
              <div className="group rounded-xl border border-white/5 bg-black/40 p-4 backdrop-blur-sm transition hover:border-purple-300/70 hover:-translate-y-0.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="h-2 w-2 rounded-full bg-purple-300" />
                    Total Staked
                  </div>
                  <p className="text-2xl font-bold text-purple-200">
                    {myFarms.reduce((sum: number, f: TokenOwnerFarm) => sum + (f.stats?.totalStaked || 0), 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
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

  const rewardToken = tokens.find((t: Token) => t.id === farm.rewardTokenId);
  const userBalance = myHoldings.find((h: { tokenId: string; balance: number }) => h.tokenId === farm.rewardTokenId)?.balance || 0;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, rewardRate: parseFloat(e.target.value) })
              }
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, duration: parseInt(e.target.value, 10) || 0 })
              }
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, lockPeriod: parseInt(e.target.value, 10) || 0 })
              }
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, minStakeAmount: parseInt(e.target.value, 10) || 0 })
                }
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, maxStakeAmount: parseInt(e.target.value, 10) || 0 })
                }
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
