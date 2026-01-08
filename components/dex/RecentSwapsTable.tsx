import React from 'react';

export interface RecentSwap {
  id: string;
  from: string;
  to: string;
  amountIn: string;
  amountOut: string;
  timestamp: number;
  txHash: string;
  tokenIn?: {
    symbol: string;
    address: string;
  };
  tokenOut?: {
    symbol: string;
    address: string;
  };
}

interface RecentSwapsTableProps {
  recentSwaps: RecentSwap[];
  className?: string;
}

// Format number
const formatNumber = (value: number): string => {
  if (value === 0) return '0';
  if (value < 1000) return value.toFixed(2);
  if (value < 1000000) return `${(value / 1000).toFixed(2)}K`;
  if (value < 1000000000) return `${(value / 1000000).toFixed(2)}M`;
  return `${(value / 1000000000).toFixed(2)}B`;
};

// Format timestamp
const formatTimestamp = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
};

const RecentSwapsTable: React.FC<RecentSwapsTableProps> = ({
  recentSwaps,
  className = '',
}) => {
  return (
    <div className={`bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 ${className}`}>
      <h2 className="text-xl font-bold text-white mb-4">Recent Swaps</h2>

      {recentSwaps.length === 0 ? (
        <div className="text-center py-8 text-gray-500" role="status">
          No recent swaps in this pool.
        </div>
      ) : (
        <div className="space-y-3" role="list" aria-label="Recent swaps">
          {recentSwaps.slice(0, 10).map((swap) => (
            <div key={swap.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 hover:bg-white/[0.04] transition-colors" role="listitem">
              {/* Swap Direction */}
              <div className="flex items-center justify-between gap-3 mb-3">
                {/* From Token */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-doge/20 to-doge/10 flex items-center justify-center text-sm font-bold text-doge flex-shrink-0">
                    {swap.tokenIn?.symbol?.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-white font-mono text-sm font-bold truncate">{formatNumber(parseFloat(swap.amountIn || '0') / 1e18)}</div>
                    <div className="text-xs text-gray-500 truncate">{swap.tokenIn?.symbol || 'Unknown'}</div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex-shrink-0 text-doge text-lg">→</div>

                {/* To Token */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-500/10 flex items-center justify-center text-sm font-bold text-purple-400 flex-shrink-0">
                    {swap.tokenOut?.symbol?.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-white font-mono text-sm font-bold truncate">{formatNumber(parseFloat(swap.amountOut || '0') / 1e18)}</div>
                    <div className="text-xs text-gray-500 truncate">{swap.tokenOut?.symbol || 'Unknown'}</div>
                  </div>
                </div>
              </div>

              {/* Timestamp */}
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <div className="text-xs text-gray-600 font-mono">
                  {formatTimestamp(swap.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentSwapsTable;
