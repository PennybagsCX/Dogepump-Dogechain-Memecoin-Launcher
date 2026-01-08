import React from 'react';
import { Droplets, Plus } from 'lucide-react';

interface PositionsEmptyStateProps {
  onBrowsePools?: () => void;
  onCreatePool?: () => void;
  className?: string;
}

const PositionsEmptyState: React.FC<PositionsEmptyStateProps> = ({
  onBrowsePools,
  onCreatePool,
  className = '',
}) => {
  return (
    <div className={`bg-white/5 border border-white/10 rounded-2xl p-12 text-center ${className}`}>
      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
        <Droplets size={40} className="text-gray-600" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">No liquidity positions</h3>
      <p className="text-gray-400 mb-6 max-w-md mx-auto">
        You don't have any liquidity positions for this token yet. Add liquidity to start earning fees from trades.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {onBrowsePools && (
          <button
            onClick={onBrowsePools}
            className="px-6 py-3 bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-400 font-bold hover:bg-purple-500/30 transition-all flex items-center justify-center gap-2"
          >
            <Droplets size={18} />
            Browse All Pools
          </button>
        )}
        {onCreatePool && (
          <button
            onClick={onCreatePool}
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Create New Pool
          </button>
        )}
      </div>
    </div>
  );
};

export default PositionsEmptyState;
