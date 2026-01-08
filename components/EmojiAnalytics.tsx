import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  RefreshCw, 
  Download, 
  Users, 
  Flame, 
  Smile,
  Clock,
  Filter,
  X,
  PieChart
} from 'lucide-react';
import { Button } from './Button';
import { useStore } from '../contexts/StoreContext';
import { getAnalytics, calculateAnalytics, getReactions, exportEmojiData } from '../services/emojiService';
import type { EmojiAnalytics as EmojiAnalyticsType, EmojiReaction, Token } from '../types';

interface EmojiAnalyticsProps {
  tokenId?: string;
  showHeader?: boolean;
  className?: string;
}

type TimePeriod = 'all' | '24h' | '7d';

export const EmojiAnalytics: React.FC<EmojiAnalyticsProps> = ({ 
  tokenId, 
  showHeader = true,
  className = ''
}) => {
  const { tokens, reactionStats } = useStore();
  const [analytics, setAnalytics] = useState<EmojiAnalyticsType | null>(null);
  const [filteredAnalytics, setFilteredAnalytics] = useState<EmojiAnalyticsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all');
  const [selectedToken, setSelectedToken] = useState<string | null>(tokenId || null);
  const [showTokenFilter, setShowTokenFilter] = useState(false);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = () => {
      setIsLoading(true);
      try {
        // Try to get analytics from service
        let data = getAnalytics();
        
        // If no data or specific token requested, calculate it
        if (!data || (selectedToken && data.tokenId !== selectedToken)) {
          if (selectedToken) {
            data = calculateAnalytics(selectedToken);
          } else {
            // Calculate analytics for all tokens combined
            data = calculateGlobalAnalytics();
          }
        }
        
        setAnalytics(data);
        applyTimeFilter(data, timePeriod);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedToken, timePeriod]);

  // Apply time period filter
  const applyTimeFilter = (data: EmojiAnalyticsType | null, period: TimePeriod) => {
    if (!data) {
      setFilteredAnalytics(null);
      return;
    }

    if (period === 'all') {
      setFilteredAnalytics(data);
      return;
    }

    const now = Date.now();
    const cutoffTime = period === '24h' ? now - 24 * 60 * 60 * 1000 : now - 7 * 24 * 60 * 60 * 1000;
    
    const reactions = getReactions(selectedToken || undefined);
    const filteredReactions = reactions.filter(r => r.timestamp >= cutoffTime);
    
    if (filteredReactions.length === 0) {
      setFilteredAnalytics({
        ...data,
        totalReactions: 0,
        uniqueReactors: 0,
        popularEmojis: [],
        reactionsPerHour: 0,
        trend: 'stable'
      });
      return;
    }

    const uniqueUsers = new Set(filteredReactions.map(r => r.userId));
    const emojiCounts = new Map<string, number>();
    
    filteredReactions.forEach(reaction => {
      const currentCount = emojiCounts.get(reaction.emoji) || 0;
      emojiCounts.set(reaction.emoji, currentCount + reaction.count);
    });

    const totalReactions = filteredReactions.reduce((sum, r) => sum + r.count, 0);
    const hoursElapsed = period === '24h' ? 24 : 168; // 7 days = 168 hours
    const reactionsPerHour = totalReactions / hoursElapsed;

    const popularEmojis = Array.from(emojiCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([emoji, count]) => ({
        emoji,
        count,
        percentage: totalReactions > 0 ? (count / totalReactions) * 100 : 0
      }));

    setFilteredAnalytics({
      ...data,
      totalReactions,
      uniqueReactors: uniqueUsers.size,
      popularEmojis,
      reactionsPerHour,
      trend: data.trend
    });
  };

  // Calculate global analytics across all tokens
  const calculateGlobalAnalytics = (): EmojiAnalyticsType => {
    const allReactions = getReactions();
    
    if (allReactions.length === 0) {
      return {
        tokenId: 'global',
        popularEmojis: [],
        totalReactions: 0,
        uniqueReactors: 0,
        firstReactionAt: 0,
        lastReactionAt: 0,
        reactionsPerHour: 0,
        trend: 'stable'
      };
    }

    const uniqueUsers = new Set(allReactions.map(r => r.userId));
    const emojiCounts = new Map<string, number>();
    const timestamps = allReactions.map(r => r.timestamp);

    allReactions.forEach(reaction => {
      const currentCount = emojiCounts.get(reaction.emoji) || 0;
      emojiCounts.set(reaction.emoji, currentCount + reaction.count);
    });

    const totalReactions = allReactions.reduce((sum, r) => sum + r.count, 0);

    const popularEmojis = Array.from(emojiCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([emoji, count]) => ({
        emoji,
        count,
        percentage: totalReactions > 0 ? (count / totalReactions) * 100 : 0
      }));

    const firstReactionAt = Math.min(...timestamps);
    const lastReactionAt = Math.max(...timestamps);

    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
    const recentReactions = allReactions.filter(r => r.timestamp >= twentyFourHoursAgo);
    const reactionsPerHour = recentReactions.length / 24;

    const twelveHoursAgo = now - 12 * 60 * 60 * 1000;
    const recentCount = allReactions.filter(r => r.timestamp >= twelveHoursAgo).length;
    const olderCount = allReactions.filter(
      r => r.timestamp >= twentyFourHoursAgo && r.timestamp < twelveHoursAgo
    ).length;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (recentCount > olderCount * 1.2) {
      trend = 'up';
    } else if (recentCount < olderCount * 0.8) {
      trend = 'down';
    }

    return {
      tokenId: 'global',
      popularEmojis,
      totalReactions,
      uniqueReactors: uniqueUsers.size,
      firstReactionAt,
      lastReactionAt,
      reactionsPerHour,
      trend
    };
  };

  // Get top tokens by reactions
  const topTokensByReactions = useMemo(() => {
    const tokenReactionCounts = tokens.map(token => {
      const stats = reactionStats[token.id];
      return {
        token,
        totalReactions: stats?.totalReactions || 0
      };
    }).sort((a, b) => b.totalReactions - a.totalReactions)
      .slice(0, 10);

    return tokenReactionCounts;
  }, [tokens, reactionStats]);

  // Get reactions per hour data for chart
  const getHourlyData = () => {
    const reactions = getReactions(selectedToken || undefined);
    const now = Date.now();
    const hours = 24;
    const hourlyData: { hour: string; count: number }[] = [];

    for (let i = hours - 1; i >= 0; i--) {
      const hourStart = now - (i + 1) * 60 * 60 * 1000;
      const hourEnd = now - i * 60 * 60 * 1000;
      
      const count = reactions.filter(r => r.timestamp >= hourStart && r.timestamp < hourEnd)
        .reduce((sum, r) => sum + r.count, 0);
      
      const hourLabel = i === 0 ? 'Now' : i === 1 ? '1h ago' : `${i}h ago`;
      hourlyData.push({ hour: hourLabel, count });
    }

    return hourlyData;
  };

  // Refresh analytics
  const handleRefresh = () => {
    setIsLoading(true);
    try {
      const data = selectedToken ? calculateAnalytics(selectedToken) : calculateGlobalAnalytics();
      setAnalytics(data);
      applyTimeFilter(data, timePeriod);
    } catch (error) {
      console.error('Failed to refresh analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Export analytics as JSON
  const handleExport = () => {
    try {
      const data = {
        analytics: filteredAnalytics,
        reactions: getReactions(selectedToken || undefined),
        reactionStats: selectedToken ? reactionStats[selectedToken] : reactionStats,
        exportedAt: new Date().toISOString(),
        timePeriod
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `emoji-analytics-${Date.now()}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export analytics:', error);
    }
  };

  // Get trend icon and color
  const getTrendDisplay = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return { icon: TrendingUp, color: 'text-green-400', label: 'Increasing' };
      case 'down':
        return { icon: TrendingDown, color: 'text-red-400', label: 'Decreasing' };
      default:
        return { icon: Minus, color: 'text-gray-400', label: 'Stable' };
    }
  };

  const currentData = filteredAnalytics || analytics;

  if (isLoading && !currentData) {
    return (
      <div className={`bg-[#0A0A0A] border border-white/10 rounded-xl p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3 text-gray-400">
            <RefreshCw className="animate-spin" size={24} />
            <span>Loading analytics...</span>
          </div>
        </div>
      </div>
    );
  }

  const hourlyData = getHourlyData();
  const maxHourlyCount = Math.max(...hourlyData.map(d => d.count), 1);
  const trendDisplay = currentData ? getTrendDisplay(currentData.trend) : null;

  return (
    <div className={`bg-[#0A0A0A] border border-white/10 rounded-xl ${className}`}>
      {showHeader && (
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
                <BarChart3 size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Emoji Analytics</h2>
                <p className="text-sm text-gray-400">
                  {selectedToken 
                    ? `Analytics for token ${tokens.find(t => t.id === selectedToken)?.name || selectedToken}`
                    : 'Global analytics across all tokens'
                  }
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleRefresh}
                isLoading={isLoading}
                variant="outline"
                size="sm"
              >
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              </Button>
              <Button
                onClick={handleExport}
                variant="outline"
                size="sm"
              >
                <Download size={16} />
              </Button>
            </div>
          </div>

          {/* Time Period Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setTimePeriod('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timePeriod === 'all'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setTimePeriod('24h')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timePeriod === '24h'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Last 24h
            </button>
            <button
              onClick={() => setTimePeriod('7d')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timePeriod === '7d'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Last 7d
            </button>
            <button
              onClick={() => setShowTokenFilter(!showTokenFilter)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                showTokenFilter
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Filter size={16} />
              {selectedToken ? tokens.find(t => t.id === selectedToken)?.name || 'Token' : 'All Tokens'}
            </button>
          </div>

          {/* Token Filter Dropdown */}
          {showTokenFilter && (
            <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-300">Select Token</span>
                <button
                  onClick={() => {
                    setSelectedToken(null);
                    setShowTokenFilter(false);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                <button
                  onClick={() => {
                    setSelectedToken(null);
                    setShowTokenFilter(false);
                  }}
                  className={`p-2 rounded-lg text-sm transition-colors ${
                    !selectedToken
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  All Tokens
                </button>
                {tokens.slice(0, 20).map(token => (
                  <button
                    key={token.id}
                    onClick={() => {
                      setSelectedToken(token.id);
                      setShowTokenFilter(false);
                    }}
                    className={`p-2 rounded-lg text-sm transition-colors ${
                      selectedToken === token.id
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    {token.ticker}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#050505] border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Total Reactions</span>
              <Smile size={20} className="text-purple-500" />
            </div>
            <div className="text-3xl font-bold text-white">
              {currentData?.totalReactions.toLocaleString() || 0}
            </div>
          </div>

          <div className="bg-[#050505] border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Unique Reactors</span>
              <Users size={20} className="text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-white">
              {currentData?.uniqueReactors.toLocaleString() || 0}
            </div>
          </div>

          <div className="bg-[#050505] border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Reactions/Hour</span>
              <Flame size={20} className="text-orange-500" />
            </div>
            <div className="text-3xl font-bold text-white">
              {currentData?.reactionsPerHour.toFixed(1) || '0.0'}
            </div>
          </div>

          <div className="bg-[#050505] border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Trend</span>
              {trendDisplay && <trendDisplay.icon size={20} className={trendDisplay.color} />}
            </div>
            <div className={`text-3xl font-bold ${trendDisplay?.color || 'text-white'}`}>
              {trendDisplay?.label || 'N/A'}
            </div>
          </div>
        </div>

        {/* Popular Emojis */}
        <div className="bg-[#050505] border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <PieChart size={20} className="text-purple-500" />
            Popular Emojis
          </h3>
          {currentData?.popularEmojis && currentData.popularEmojis.length > 0 ? (
            <div className="space-y-3">
              {currentData.popularEmojis.slice(0, 10).map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-2xl">{item.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium">{item.count.toLocaleString()} reactions</span>
                      <span className="text-gray-400 text-sm">{item.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No emoji reactions yet
            </div>
          )}
        </div>

        {/* Reactions Per Hour Chart */}
        <div className="bg-[#050505] border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock size={20} className="text-blue-500" />
            Reactions Per Hour (Last 24h)
          </h3>
          <div className="flex items-end justify-between gap-2 h-48">
            {hourlyData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-gradient-to-t from-purple-500 to-pink-500 rounded-t-sm transition-all duration-300 hover:from-purple-400 hover:to-pink-400"
                  style={{ 
                    height: `${(data.count / maxHourlyCount) * 100}%`,
                    minHeight: data.count > 0 ? '4px' : '2px'
                  }}
                  title={`${data.count} reactions`}
                />
                <span className="text-xs text-gray-500 rotate-45 origin-bottom-left">
                  {data.hour}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Tokens by Reactions */}
        {!selectedToken && (
          <div className="bg-[#050505] border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-green-500" />
              Top Tokens by Reactions
            </h3>
            {topTokensByReactions.length > 0 && topTokensByReactions[0].totalReactions > 0 ? (
              <div className="space-y-3">
                {topTokensByReactions.slice(0, 10).map((item, index) => (
                  <div
                    key={item.token.id}
                    className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <img
                      src={item.token.imageUrl}
                      alt={item.token.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white font-medium">{item.token.ticker}</span>
                        <span className="text-gray-400 text-sm">
                          {item.totalReactions.toLocaleString()} reactions
                        </span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                          style={{ 
                            width: `${(item.totalReactions / topTokensByReactions[0].totalReactions) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No reactions on tokens yet
              </div>
            )}
          </div>
        )}

        {/* Emoji Distribution Pie Chart (Simplified) */}
        {currentData?.popularEmojis && currentData.popularEmojis.length > 0 && (
          <div className="bg-[#050505] border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <PieChart size={20} className="text-pink-500" />
              Emoji Distribution
            </h3>
            <div className="flex flex-wrap gap-3">
              {currentData.popularEmojis.slice(0, 8).map((item, index) => {
                const colors = [
                  'from-purple-500 to-purple-600',
                  'from-pink-500 to-pink-600',
                  'from-blue-500 to-blue-600',
                  'from-green-500 to-green-600',
                  'from-yellow-500 to-yellow-600',
                  'from-red-500 to-red-600',
                  'from-indigo-500 to-indigo-600',
                  'from-orange-500 to-orange-600'
                ];
                const colorClass = colors[index % colors.length];
                
                return (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10"
                  >
                    <span className="text-xl">{item.emoji}</span>
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${colorClass}`} />
                    <span className="text-white text-sm font-medium">{item.percentage.toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
