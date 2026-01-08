import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Users, Award, Activity, Calendar, Clock, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { TokenOwnerFarm, Token } from '../types';
import { useStore } from '../contexts/StoreContext';
import { formatNumber } from '../services/web3Service';

interface FarmAnalyticsProps {
  farm: TokenOwnerFarm;
  rewardToken: Token | undefined;
  stakingToken: Token | undefined;
}

interface AnalyticsData {
  hourly: { timestamp: number; tvl: number; rewards: number; participants: number }[];
  daily: { timestamp: number; tvl: number; rewards: number; participants: number }[];
}

export const FarmAnalytics: React.FC<FarmAnalyticsProps> = ({ farm, rewardToken, stakingToken }) => {
  const { getFarmStats, getFarmPositions } = useStore();
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData>({ hourly: [], daily: [] });

  // Calculate current APY
  const currentAPY = farm.stats.totalStaked > 0
    ? Math.min((farm.config.rewardRate * 86400 * 365 * 100) / farm.stats.totalStaked, 50000)
    : 0;

  // Get user positions
  const positions = getFarmPositions(farm.id);

  // Generate mock analytics data (in production, this would come from the backend)
  useEffect(() => {
    const generateAnalyticsData = (): AnalyticsData => {
      const now = Date.now();
      const hourly: AnalyticsData['hourly'] = [];
      const daily: AnalyticsData['daily'] = [];

      // Generate hourly data for the last 24 hours
      for (let i = 24; i >= 0; i--) {
        const timestamp = now - (i * 60 * 60 * 1000);
        const baseTVL = farm.stats.totalStaked * (0.9 + Math.random() * 0.2);
        const baseRewards = farm.pool.totalDistributed * (0.95 + Math.random() * 0.1);
        hourly.push({
          timestamp,
          tvl: baseTVL,
          rewards: baseRewards,
          participants: farm.stats.uniqueStakers
        });
      }

      // Generate daily data for the last 30 days
      for (let i = 30; i >= 0; i--) {
        const timestamp = now - (i * 24 * 60 * 60 * 1000);
        const baseTVL = farm.stats.totalStaked * (0.8 + Math.random() * 0.4);
        const baseRewards = farm.pool.totalDistributed * (0.9 + Math.random() * 0.2);
        daily.push({
          timestamp,
          tvl: baseTVL,
          rewards: baseRewards,
          participants: Math.floor(farm.stats.uniqueStakers * (0.9 + Math.random() * 0.2))
        });
      }

      return { hourly, daily };
    };

    setAnalytics(generateAnalyticsData());
  }, [farm.id, farm.stats.totalStaked, farm.pool.totalDistributed, farm.stats.uniqueStakers]);

  // Filter analytics data based on time range
  const filteredAnalytics = React.useMemo(() => {
    const now = Date.now();
    let startTime: number;

    switch (timeRange) {
      case '24h':
        startTime = now - (24 * 60 * 60 * 1000);
        return {
          hourly: analytics.hourly.filter(d => d.timestamp >= startTime),
          daily: []
        };
      case '7d':
        startTime = now - (7 * 24 * 60 * 60 * 1000);
        return {
          hourly: analytics.hourly,
          daily: analytics.daily.filter(d => d.timestamp >= startTime)
        };
      case '30d':
        startTime = now - (30 * 24 * 60 * 60 * 1000);
        return {
          hourly: analytics.hourly,
          daily: analytics.daily.filter(d => d.timestamp >= startTime)
        };
      case 'all':
        return analytics;
      default:
        return analytics;
    }
  }, [timeRange, analytics]);

  // Calculate metrics
  const metrics = React.useMemo(() => {
    const data = filteredAnalytics.daily.length > 0 ? filteredAnalytics.daily : filteredAnalytics.hourly;
    if (data.length === 0) {
      return {
        tvlChange: 0,
        rewardsChange: 0,
        participantsChange: 0,
        avgTVL: farm.stats.totalStaked,
        avgRewards: farm.pool.totalDistributed,
        avgParticipants: farm.stats.uniqueStakers
      };
    }

    const first = data[0];
    const last = data[data.length - 1];
    const avgTVL = data.reduce((sum, d) => sum + d.tvl, 0) / data.length;
    const avgRewards = data.reduce((sum, d) => sum + d.rewards, 0) / data.length;
    const avgParticipants = data.reduce((sum, d) => sum + d.participants, 0) / data.length;

    return {
      tvlChange: ((last.tvl - first.tvl) / first.tvl) * 100,
      rewardsChange: ((last.rewards - first.rewards) / first.rewards) * 100,
      participantsChange: ((last.participants - first.participants) / first.participants) * 100,
      avgTVL,
      avgRewards,
      avgParticipants
    };
  }, [filteredAnalytics]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    // In production, this would fetch fresh data from the backend
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    if (timeRange === '24h') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="text-doge" />
            Farm Analytics
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Performance metrics for {rewardToken?.name} Farm
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          <span className="text-sm font-bold text-white">Refresh</span>
        </button>
      </div>

      {/* Time Range Selector */}
      <div className="flex bg-white/5 rounded-xl p-1">
        {(['24h', '7d', '30d', 'all'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
              timeRange === range
                ? 'bg-doge text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {range === '24h' ? '24H' : range === '7d' ? '7D' : range === '30d' ? '30D' : 'ALL'}
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 uppercase tracking-wider">TVL</span>
            {metrics.tvlChange >= 0 ? (
              <ArrowUpRight size={16} className="text-green-400" />
            ) : (
              <ArrowDownRight size={16} className="text-red-400" />
            )}
          </div>
          <div className="text-2xl font-bold text-white">{formatNumber(farm.stats.totalStaked)}</div>
          <div className={`text-xs mt-1 ${metrics.tvlChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {metrics.tvlChange >= 0 ? '+' : ''}{metrics.tvlChange.toFixed(2)}%
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 uppercase tracking-wider">Rewards</span>
            {metrics.rewardsChange >= 0 ? (
              <ArrowUpRight size={16} className="text-green-400" />
            ) : (
              <ArrowDownRight size={16} className="text-red-400" />
            )}
          </div>
          <div className="text-2xl font-bold text-white">{formatNumber(farm.pool.totalDistributed)}</div>
          <div className={`text-xs mt-1 ${metrics.rewardsChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {metrics.rewardsChange >= 0 ? '+' : ''}{metrics.rewardsChange.toFixed(2)}%
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 uppercase tracking-wider">Participants</span>
            {metrics.participantsChange >= 0 ? (
              <ArrowUpRight size={16} className="text-green-400" />
            ) : (
              <ArrowDownRight size={16} className="text-red-400" />
            )}
          </div>
          <div className="text-2xl font-bold text-white">{formatNumber(farm.stats.participantCount)}</div>
          <div className={`text-xs mt-1 ${metrics.participantsChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {metrics.participantsChange >= 0 ? '+' : ''}{metrics.participantsChange.toFixed(2)}%
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 uppercase tracking-wider">APY</span>
            <TrendingUp size={16} className="text-doge" />
          </div>
          <div className="text-2xl font-bold text-doge">{currentAPY.toFixed(2)}%</div>
          <div className="text-xs text-gray-400 mt-1">
            Current rate
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="text-doge" />
          TVL Over Time
        </h4>
        <div className="h-64 flex items-end gap-1">
          {filteredAnalytics.daily.length > 0
            ? filteredAnalytics.daily.map((d, i) => {
                const maxTVL = Math.max(...filteredAnalytics.daily.map(d => d.tvl));
                const height = (d.tvl / maxTVL) * 100;
                return (
                  <div
                    key={d.timestamp}
                    className="flex-1 bg-doge/60 hover:bg-doge/80 transition-colors rounded-t-sm relative group"
                    style={{ height: `${height}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {formatNumber(d.tvl)}
                    </div>
                  </div>
                );
              })
            : filteredAnalytics.hourly.map((d, i) => {
                const maxTVL = Math.max(...filteredAnalytics.hourly.map(d => d.tvl));
                const height = (d.tvl / maxTVL) * 100;
                return (
                  <div
                    key={d.timestamp}
                    className="flex-1 bg-doge/60 hover:bg-doge/80 transition-colors rounded-t-sm relative group"
                    style={{ height: `${height}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {formatNumber(d.tvl)}
                    </div>
                  </div>
                );
              })
          }
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Clock className="text-doge" />
          Recent Activity
        </h4>
        <div className="space-y-3">
          {positions.slice(0, 5).map((position) => {
            const timeSinceStake = Math.floor((Date.now() - position.stakedAt) / 1000 / 60); // minutes
            return (
              <div key={position.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-doge/20 rounded-full flex items-center justify-center">
                    <Users size={18} className="text-doge" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">
                      {formatNumber(position.stakedAmount)} {stakingToken?.ticker} staked
                    </div>
                    <div className="text-xs text-gray-400">
                      {timeSinceStake < 60
                        ? `${timeSinceStake}m ago`
                        : timeSinceStake < 1440
                        ? `${Math.floor(timeSinceStake / 60)}h ago`
                        : `${Math.floor(timeSinceStake / 1440)}d ago`}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-doge">
                    {formatNumber(position.accumulatedRewards)} {rewardToken?.ticker}
                  </div>
                  <div className="text-xs text-gray-400">Pending</div>
                </div>
              </div>
            );
          })}
          {positions.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No recent activity
            </div>
          )}
        </div>
      </div>

      {/* Farm Details */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Calendar className="text-doge" />
          Farm Details
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Created</div>
            <div className="text-sm font-bold text-white">
              {new Date(farm.config.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Status</div>
            <div className={`text-sm font-bold ${
              farm.status === 'active' ? 'text-green-400' :
              farm.status === 'paused' ? 'text-orange-400' :
              farm.status === 'expired' ? 'text-red-400' :
              'text-gray-400'
            }`}>
              {farm.status.charAt(0).toUpperCase() + farm.status.slice(1)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Lock Period</div>
            <div className="text-sm font-bold text-white">
              {farm.config.lockPeriod > 0
                ? `${Math.ceil(farm.config.lockPeriod / 60)} minutes`
                : 'No lock'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Duration</div>
            <div className="text-sm font-bold text-white">
              {farm.config.expiresAt
                ? `${Math.ceil((farm.config.expiresAt - Date.now()) / 1000 / 60 / 60 / 24)} days remaining`
                : 'Unlimited'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
