import React, { useState, useEffect } from 'react';
import { Sprout, TrendingUp, Users, Clock, Award, Search, Filter } from 'lucide-react';
import { TokenOwnerFarm, Token } from '../types';
import { useStore } from '../contexts/StoreContext';
import { FarmCard } from './FarmCard';
import { Button } from './Button';
import { formatNumber } from '../services/web3Service';

interface FarmDiscoveryProps {
  onFarmClick?: (farm: TokenOwnerFarm) => void;
  activeTab?: 'core' | 'community';
}

export const FarmDiscovery: React.FC<FarmDiscoveryProps> = ({ onFarmClick, activeTab: propActiveTab }) => {
  const { tokenOwnerFarms, tokens } = useStore();
  const [internalActiveTab, setInternalActiveTab] = useState<'core' | 'community'>('core');
  const activeTab = propActiveTab || internalActiveTab;
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'apy' | 'tvl' | 'newest'>('apy');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused'>('active');

  // Get token details
  const getToken = (tokenId: string): Token | undefined => {
    return tokens.find(t => t.id === tokenId);
  };

  // Calculate current APY based on total staked
  const calculateCurrentAPY = (farm: TokenOwnerFarm): number => {
    const totalStaked = farm.stats.totalStaked;
    if (totalStaked === 0) return 0;
    const currentAPY = (farm.config.rewardRate * 86400 * 365 * 100) / totalStaked;
    return Math.min(currentAPY, 50000); // Cap at 50,000%
  };

  // Filter and sort farms
  const filteredFarms = React.useMemo(() => {
    let farms = [...tokenOwnerFarms];

    // Filter by tab
    farms = activeTab === 'core'
      ? farms.filter(f => f.ownerTokenId === 'platform')
      : farms.filter(f => f.ownerTokenId !== 'platform');

    // Filter by status
    if (filterStatus !== 'all') {
      farms = farms.filter(f => f.status === filterStatus);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      farms = farms.filter(f => {
        const rewardToken = getToken(f.rewardTokenId);
        const stakingToken = getToken(f.stakingTokenId);
        return (
          f.description?.toLowerCase().includes(query) ||
          rewardToken?.name.toLowerCase().includes(query) ||
          rewardToken?.ticker.toLowerCase().includes(query) ||
          stakingToken?.name.toLowerCase().includes(query) ||
          stakingToken?.ticker.toLowerCase().includes(query)
        );
      });
    }

    // Sort farms
    farms.sort((a, b) => {
      switch (sortBy) {
        case 'apy':
          return calculateCurrentAPY(b) - calculateCurrentAPY(a);
        case 'tvl':
          return b.stats.totalStaked - a.stats.totalStaked;
        case 'newest':
          return b.config.createdAt - a.config.createdAt;
        default:
          return 0;
      }
    });

    return farms;
  }, [tokenOwnerFarms, activeTab, filterStatus, searchQuery, sortBy, tokens]);

  // Stats
  const stats = React.useMemo(() => {
    const activeFarms = tokenOwnerFarms.filter(f => f.status === 'active');
    const totalTVL = activeFarms.reduce((sum, f) => sum + f.stats.totalStaked, 0);
    const totalRewards = tokenOwnerFarms.reduce((sum, f) => sum + f.pool.totalDistributed, 0);
    const totalParticipants = new Set(
      tokenOwnerFarms.flatMap(f => f.stats.participantCount > 0 ? [f.id] : [])
    ).size;

    return {
      totalFarms: tokenOwnerFarms.length,
      activeFarms: activeFarms.length,
      totalTVL,
      totalRewards,
      totalParticipants
    };
  }, [tokenOwnerFarms]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sprout className="text-doge" />
            Farm Discovery
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Stake tokens to earn rewards from community farms
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-3">
          <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <div className="text-xs text-gray-500 uppercase tracking-wider">Active Farms</div>
            <div className="text-lg font-bold text-white">{stats.activeFarms}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <div className="text-xs text-gray-500 uppercase tracking-wider">Total TVL</div>
            <div className="text-lg font-bold text-white">{formatNumber(stats.totalTVL)}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <div className="text-xs text-gray-500 uppercase tracking-wider">Rewards Distributed</div>
            <div className="text-lg font-bold text-white">{formatNumber(stats.totalRewards)}</div>
          </div>
        </div>
      </div>

      {/* Tabs - Only show if not controlled by parent */}
      {!propActiveTab && (
        <div className="flex gap-2">
          <button
            onClick={() => setInternalActiveTab('core')}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'core'
                ? 'bg-doge text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Award size={16} className="inline mr-2" />
            Core Farms
          </button>
          <button
            onClick={() => setInternalActiveTab('community')}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'community'
                ? 'bg-doge text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Users size={16} className="inline mr-2" />
            Community Farms
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            id="farm-search"
            name="farmSearch"
            type="text"
            placeholder="Search farms by name or token..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#050505] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:border-doge/50 outline-none transition-all"
          />
        </div>

        <div className="flex gap-2">
          <select
            id="farm-discovery-sort"
            name="farmSortBy"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-doge/50 outline-none cursor-pointer"
          >
            <option value="apy">Sort by APY</option>
            <option value="tvl">Sort by TVL</option>
            <option value="newest">Sort by Newest</option>
          </select>

          <select
            id="farm-discovery-filter"
            name="farmFilterStatus"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-doge/50 outline-none cursor-pointer"
          >
            <option value="active">Active</option>
            <option value="all">All Status</option>
            <option value="paused">Paused</option>
          </select>
        </div>
      </div>

      {/* Farm Grid */}
      {filteredFarms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFarms.map((farm) => (
            <FarmCard
              key={farm.id}
              farm={farm}
              rewardToken={getToken(farm.rewardTokenId)}
              stakingToken={getToken(farm.stakingTokenId)}
              onClick={() => onFarmClick?.(farm)}
              showManageButton={false}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Sprout size={48} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No farms found</p>
          <p className="text-gray-500 text-sm mt-2">
            {searchQuery ? 'Try a different search term' : 'Check back later for new farms'}
          </p>
        </div>
      )}
    </div>
  );
};
