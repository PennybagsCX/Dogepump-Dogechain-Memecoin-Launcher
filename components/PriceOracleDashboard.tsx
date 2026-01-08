/**
 * Price Oracle Admin Dashboard
 *
 * Displays real-time information about DC price oracle sources,
 * health status, and metrics for monitoring and debugging.
 *
 * Access: Append ?debug=true to URL or add to admin panel
 */

import { useState, useEffect } from 'react';
import { Activity, CheckCircle, XCircle, AlertCircle, RefreshCw, Database, Globe, DollarSign } from 'lucide-react';
import { priceOracleService } from '../services/priceOracleService';
import { poolPriceService } from '../services/poolPriceService';

interface PriceSourceStatus {
  name: string;
  status: 'active' | 'error' | 'inactive';
  price: number | null;
  lastUpdate: number;
  latency: number;
  error?: string;
}

interface OracleMetrics {
  currentSource: string;
  currentPrice: number;
  priceAge: number;
  isStale: boolean;
  poolAvailable: boolean;
  poolLiquidity: number;
  observationCount: number;
  updateCount: number;
  errorCount: number;
}

export function PriceOracleDashboard() {
  const [metrics, setMetrics] = useState<OracleMetrics | null>(null);
  const [sources, setSources] = useState<PriceSourceStatus[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const refreshStatus = async () => {
    setRefreshing(true);
    try {
      // Get current price source
      const priceSource = priceOracleService.getPriceSource();
      const currentPrice = priceOracleService.getCurrentPrice();
      const priceAge = priceOracleService.getPriceAge();
      const isStale = priceOracleService.isPriceStale();

      // Check pool availability
      const poolAvailable = await poolPriceService.isPoolAvailable();
      const poolInfo = poolAvailable ? await poolPriceService.getPoolInfo() : null;
      const observationCount = poolPriceService.getObservationCount();

      setMetrics({
        currentSource: priceSource.source,
        currentPrice,
        priceAge,
        isStale,
        poolAvailable,
        poolLiquidity: poolInfo?.liquidityUSD || 0,
        observationCount,
        updateCount: 0, // TODO: Track in priceOracleService
        errorCount: 0   // TODO: Track in priceOracleService
      });

      // Test each source
      const sourceTests: PriceSourceStatus[] = [];

      // Test Pool
      const poolStart = Date.now();
      try {
        const poolPrice = await poolPriceService.getDCPriceFromPool();
        sourceTests.push({
          name: 'DC/wDOGE Pool (TWAP)',
          status: poolPrice !== null ? 'active' : 'inactive',
          price: poolPrice,
          lastUpdate: Date.now(),
          latency: Date.now() - poolStart
        });
      } catch (error) {
        sourceTests.push({
          name: 'DC/wDOGE Pool (TWAP)',
          status: 'error',
          price: null,
          lastUpdate: Date.now(),
          latency: Date.now() - poolStart,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      setSources(sourceTests);
    } catch (error) {
      console.error('Failed to refresh oracle status:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: PriceSourceStatus['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'inactive':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const formatLatency = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (!metrics) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="w-6 h-6 animate-spin text-doge" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-800 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-doge flex-shrink-0" />
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-white">Price Oracle Status</h2>
            <p className="text-xs sm:text-sm text-gray-400">Real-time DC price monitoring</p>
          </div>
        </div>
        <button
          onClick={refreshStatus}
          disabled={refreshing}
          className="px-3 py-2 sm:px-4 sm:py-2 bg-doge hover:bg-doge-dark text-white rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors text-sm sm:text-base whitespace-nowrap"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Current Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-black/50 rounded-lg p-3 sm:p-4 border border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
            <span className="text-xs sm:text-sm text-gray-400">DC Price</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono break-all">
            ${metrics.currentPrice.toFixed(6)}
          </div>
          <div className="text-[10px] sm:text-xs text-gray-500 mt-1">
            Source: {metrics.currentSource}
          </div>
        </div>

        <div className="bg-black/50 rounded-lg p-3 sm:p-4 border border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
            <span className="text-xs sm:text-sm text-gray-400">Price Age</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono">
            {(metrics.priceAge / 1000).toFixed(1)}s
          </div>
          <div className={`text-[10px] sm:text-xs mt-1 ${metrics.isStale ? 'text-red-500' : 'text-green-500'}`}>
            {metrics.isStale ? '⚠️ Stale' : '✓ Fresh'}
          </div>
        </div>

        <div className="bg-black/50 rounded-lg p-3 sm:p-4 border border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 flex-shrink-0" />
            <span className="text-xs sm:text-sm text-gray-400">TWAP Obs</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono">
            {metrics.observationCount}
          </div>
          <div className="text-[10px] sm:text-xs text-gray-500 mt-1">
            5-minute window
          </div>
        </div>
      </div>

      {/* Pool Status */}
      {metrics.poolAvailable && (
        <div className="bg-green-900/20 rounded-lg p-3 sm:p-4 border border-green-500/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
              <span className="text-white font-semibold text-sm sm:text-base">DC/wDOGE Pool Active</span>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-green-400 font-mono text-xs sm:text-sm">
                Liquidity: ${metrics.poolLiquidity.toFixed(2)}
              </div>
              <div className="text-[10px] sm:text-xs text-green-400/70">
                Using on-chain TWAP (Primary)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Price Sources */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
          Price Sources
        </h3>
        <div className="space-y-2">
          {sources.map((source, idx) => (
            <div
              key={idx}
              className="bg-black/50 rounded-lg p-3 border border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                {getStatusIcon(source.status)}
                <div className="min-w-0 flex-1">
                  <div className="text-white font-medium text-sm truncate">{source.name}</div>
                  {source.error && (
                    <div className="text-[10px] sm:text-xs text-red-400 mt-1 break-all">{source.error}</div>
                  )}
                </div>
              </div>
              <div className="text-left sm:text-right">
                {source.price !== null && (
                  <div className="text-white font-mono text-xs sm:text-sm">
                    ${source.price.toFixed(6)}
                  </div>
                )}
                <div className="text-[10px] sm:text-xs text-gray-500">
                  {formatLatency(source.latency)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-900/20 rounded-lg p-3 sm:p-4 border border-blue-500/30">
        <h4 className="text-blue-400 font-semibold mb-2 text-sm sm:text-base">💡 Info</h4>
        <ul className="text-xs sm:text-sm text-gray-300 space-y-1">
          <li>• Pool price is primary source (on-chain, manipulation-resistant)</li>
          <li>• APIs used as fallback when pool unavailable</li>
          <li>• TWAP prevents flash loan attacks</li>
          <li>• Cache used when all sources fail</li>
        </ul>
      </div>

      {/* Debug Commands */}
      <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-700">
        <h4 className="text-gray-300 font-semibold mb-2 text-sm sm:text-base">🔧 Console Commands</h4>
        <div className="space-y-2 text-[10px] sm:text-xs font-mono text-gray-400">
          <div className="bg-black/50 p-2 rounded overflow-x-auto">
            <code className="block whitespace-nowrap overflow-x-auto break-all">
              priceOracleService.getCurrentPrice()
            </code>
          </div>
          <div className="bg-black/50 p-2 rounded overflow-x-auto">
            <code className="block whitespace-nowrap overflow-x-auto break-all">
              priceOracleService.getPriceSource()
            </code>
          </div>
          <div className="bg-black/50 p-2 rounded overflow-x-auto">
            <code className="block whitespace-nowrap overflow-x-auto break-all">
              await poolPriceService.getPoolInfo()
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
