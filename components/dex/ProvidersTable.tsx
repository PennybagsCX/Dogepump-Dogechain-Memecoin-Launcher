import React from 'react';

export interface LiquidityProvider {
  address: string;
  lpBalance: string;
  poolShare: number;
  valueUSD: number;
}

interface ProvidersTableProps {
  topProviders: LiquidityProvider[];
  className?: string;
}

// Format USD value
const formatUSD = (value: number): string => {
  if (value === 0) return '$0';
  if (value < 1000) return `$${value.toFixed(2)}`;
  if (value < 1000000) return `$${(value / 1000).toFixed(2)}K`;
  if (value < 1000000000) return `$${(value / 1000000).toFixed(2)}M`;
  return `$${(value / 1000000000).toFixed(2)}B`;
};

const ProvidersTable: React.FC<ProvidersTableProps> = ({
  topProviders,
  className = '',
}) => {
  return (
    <div className={`bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 ${className}`}>
      <h2 className="text-xl font-bold text-white mb-4">Top Liquidity Providers</h2>

      {topProviders.length === 0 ? (
        <div className="text-center py-8 text-gray-500" role="status">
          No liquidity providers in this pool yet.
        </div>
      ) : (
        <div className="space-y-2 overflow-hidden" role="list" aria-label="Top liquidity providers">
          {topProviders.slice(0, 10).map((provider, index) => (
            <div key={provider.address} className="bg-white/[0.02] border border-white/5 rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-4 overflow-x-auto" role="listitem">
              <div className="text-sm font-bold text-gray-500 flex-shrink-0 w-6 sm:w-8">#{index + 1}</div>
              <div className="font-mono text-white text-xs sm:text-sm flex-1 min-w-0 truncate">
                {provider.address.slice(0, 8)}...{provider.address.slice(-4)}
              </div>
              <div className="text-xs sm:text-sm font-bold text-doge min-w-0" aria-label={`Pool share ${provider.poolShare.toFixed(2)}%`}>
                {provider.poolShare.toFixed(2)}%
              </div>
              <div className="text-xs sm:text-sm font-mono text-white min-w-0" aria-label={`Value ${formatUSD(provider.valueUSD)}`}>
                {formatUSD(provider.valueUSD)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProvidersTable;
