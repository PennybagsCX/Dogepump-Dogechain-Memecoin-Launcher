import React, { useState, useCallback } from 'react';
import { Pool } from '../../contexts/DexContext';
import { Button } from '../Button';
import { Droplets, ChevronDown, X } from 'lucide-react';
import { formatNumber } from '../../utils';
import { logInfo, logLiquidity } from '../../utils/dexLogger';
import RemoveLiquidityPanel from './RemoveLiquidityPanel';
import StakeLiquidityPanel from './StakeLiquidityPanel';

interface LiquidityPosition {
  id: string;
  pool: Pool;
  lpBalance: string;
  poolShare: number;
  tokenAAmount: string;
  tokenBAmount: string;
  valueUSD: number;
  isStaked: boolean;
  farmRewards?: string;
}

interface DexLiquidityPositionsProps {
  positions: LiquidityPosition[];
  onStake?: (positionId: string) => void;
  onRemoveLiquidity?: (positionId: string) => void;
  onPoolClick?: (pool: Pool) => void;
  onRemovePosition?: (positionId: string) => void;
  className?: string;
  soundsEnabled?: boolean;
}

const DexLiquidityPositions: React.FC<DexLiquidityPositionsProps> = ({
  positions,
  onStake,
  onRemoveLiquidity,
  onPoolClick,
  onRemovePosition,
  className = '',
  soundsEnabled = true,
}) => {
  const [expandedPositions, setExpandedPositions] = useState<Set<string>>(new Set());
  const [removingPositionId, setRemovingPositionId] = useState<string | null>(null);
  const [stakingPositionId, setStakingPositionId] = useState<string | null>(null);

  // Play sound effect
  const playSound = useCallback((sound: 'click' | 'hover') => {
    if (!soundsEnabled) return;

    const audio = new Audio(`/sounds/${sound}.mp3`);
    audio.volume = 0.2;
    audio.play().catch(() => {
      // Ignore autoplay errors
    });
  }, [soundsEnabled]);

  // Show toast notification
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    // This would use a toast library like react-hot-toast
    logInfo(message, { type });
  }, []);

  // Toggle position expansion
  const handleToggleExpand = useCallback((positionId: string) => {
    playSound('click');
    setExpandedPositions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(positionId)) {
        newSet.delete(positionId);
      } else {
        newSet.add(positionId);
      }
      return newSet;
    });
  }, [playSound]);

  // Handle stake button
  const handleStake = useCallback((positionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('click');
    setStakingPositionId(positionId);
  }, [playSound]);

  // Handle stake complete
  const handleStakeComplete = useCallback((positionId: string) => {
    setStakingPositionId(null);
    onStake?.(positionId);
    showToast('Successfully staked position!', 'success');
  }, [onStake, showToast]);

  // Handle cancel staking
  const handleCancelStaking = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('click');
    setStakingPositionId(null);
  }, [playSound]);

  // Handle remove liquidity button
  const handleRemoveLiquidity = useCallback((positionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('click');
    setRemovingPositionId(positionId);
  }, [playSound]);

  // Handle pool click
  const handlePoolClick = useCallback((pool: Pool, e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('click');
    onPoolClick?.(pool);
  }, [onPoolClick, playSound]);

  // Handle cancel remove
  const handleCancelRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('click');
    setRemovingPositionId(null);
  }, [playSound]);

  // Format USD value
  const formatUSD = (value: number): string => {
    if (value === 0) return '$0';
    if (value < 1000) return `$${value.toFixed(2)}`;
    if (value < 1000000) return `$${(value / 1000).toFixed(2)}K`;
    if (value < 1000000000) return `$${(value / 1000000).toFixed(2)}M`;
    return `$${(value / 1000000000).toFixed(2)}B`;
  };

  return (
    <section className={`space-y-4 overflow-x-hidden ${className}`} role="region" aria-label="Liquidity positions">
      <header className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-comic font-bold text-white">Your Liquidity Positions</h2>
        <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg" role="status" aria-live="polite">
          <span className="text-sm text-gray-400 font-medium">
            {positions.length} position{positions.length !== 1 ? 's' : ''}
          </span>
        </div>
      </header>

      {positions.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center" role="status" aria-live="polite">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6" aria-hidden="true">
            <Droplets size={40} className="text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No liquidity positions</h3>
          <p className="text-gray-400">
            Add liquidity to a pool to start earning fees.
          </p>
        </div>
      ) : (
        <ul className="space-y-4" role="list" aria-label="List of liquidity positions">
          {positions.map(position => {
            const isExpanded = expandedPositions.has(position.id);

            return (
              <li
                key={position.id}
                className={`bg-[#0A0A0A] border ${isExpanded ? 'border-doge/30' : 'border-white/10'} rounded-2xl overflow-hidden transition-all`}
                role="article"
                aria-label={`Liquidity position ${position.pool.tokenA.symbol}/${position.pool.tokenB.symbol}, ${formatNumber(position.lpBalance)} LP tokens, ${formatNumber(position.valueUSD.toString())} USD`}
                aria-expanded={isExpanded}
              >
                <div
                  className="p-5 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => handleToggleExpand(position.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleToggleExpand(position.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Position ${position.pool.tokenA.symbol}/${position.pool.tokenB.symbol}`}
                >
                  {/* Pair Info - Full width on mobile */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex -space-x-2 flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-doge/20 to-doge/10 border-2 border-[#0A0A0A] flex items-center justify-center text-base font-bold text-doge shadow-lg">
                        {position.pool.tokenA.symbol.charAt(0)}
                      </div>
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-500/10 border-2 border-[#0A0A0A] flex items-center justify-center text-base font-bold text-purple-400 shadow-lg">
                        {position.pool.tokenB.symbol.charAt(0)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-base font-bold text-white">{position.pool.tokenA.symbol}</span>
                        <span className="text-gray-500">/</span>
                        <span className="text-base font-bold text-white">{position.pool.tokenB.symbol}</span>
                        {position.isStaked && (
                          <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/30 rounded-md">
                            <span className="text-xs font-bold text-purple-400">Staked</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid - Stacked on mobile, side-by-side on desktop */}
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="bg-white/5 rounded-xl p-3">
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Value</div>
                      <div className="text-sm font-mono font-bold text-white" aria-label={`Position value ${formatUSD(position.valueUSD)}`}>
                        {formatUSD(position.valueUSD)}
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-3">
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Share</div>
                      <div className="text-sm font-mono font-bold text-doge" aria-label={`Pool share ${position.poolShare.toFixed(2)}%`}>
                        {position.poolShare.toFixed(2)}%
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-3 min-w-0">
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">LP Tokens</div>
                      <div className="text-sm font-mono font-bold text-white break-all" aria-label={`LP tokens balance ${position.lpBalance}`}>
                        {formatNumber(position.lpBalance)}
                      </div>
                    </div>
                  </div>

                  {/* Expand Toggle */}
                  <div className="flex items-center justify-end">
                    <div
                      className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center transition-transform flex-shrink-0 cursor-pointer hover:bg-white/10 hover:scale-110"
                      style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleExpand(position.id);
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={isExpanded ? 'Collapse position details' : 'Expand position details'}
                      aria-expanded={isExpanded}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          handleToggleExpand(position.id);
                        }
                      }}
                    >
                      <ChevronDown size={16} className="text-gray-400" />
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-white/10 p-5 bg-white/[0.02] overflow-x-hidden">
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-white">Position Details</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <div className="bg-white/5 rounded-xl p-4 min-w-0">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Token A Amount</div>
                        <div className="text-sm font-mono font-bold text-white break-all" aria-label={`${position.tokenAAmount} ${position.pool.tokenA.symbol}`}>
                          {formatNumber(position.tokenAAmount)} {position.pool.tokenA.symbol}
                        </div>
                      </div>

                      <div className="bg-white/5 rounded-xl p-4 min-w-0">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Token B Amount</div>
                        <div className="text-sm font-mono font-bold text-white break-all" aria-label={`${position.tokenBAmount} ${position.pool.tokenB.symbol}`}>
                          {formatNumber(position.tokenBAmount)} {position.pool.tokenB.symbol}
                        </div>
                      </div>

                      <div className="bg-white/5 rounded-xl p-4 min-w-0">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">LP Token Balance</div>
                        <div className="text-sm font-mono font-bold text-white break-all" aria-label={`LP tokens ${position.lpBalance}`}>
                          {formatNumber(position.lpBalance)}
                        </div>
                      </div>

                      <div className="bg-white/5 rounded-xl p-4 min-w-0">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Pool Share</div>
                        <div className="text-sm font-mono font-bold text-doge break-all" aria-label={`${position.poolShare.toFixed(2)}%`}>
                          {position.poolShare.toFixed(2)}%
                        </div>
                      </div>

                      <div className="bg-white/5 rounded-xl p-4 sm:col-span-2 min-w-0">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Total Value</div>
                        <div className="text-lg font-mono font-bold text-white break-all" aria-label={`Total value ${formatUSD(position.valueUSD)}`}>
                          {formatUSD(position.valueUSD)}
                        </div>
                      </div>

                      {position.farmRewards && (
                        <div className="bg-doge/5 border border-doge/20 rounded-xl p-4 sm:col-span-2 min-w-0">
                          <div className="text-[10px] text-doge font-bold uppercase tracking-wider mb-1">Farm Rewards</div>
                          <div className="text-lg font-mono font-bold text-doge break-all" aria-label={`Farm rewards ${position.farmRewards}`}>
                            {formatNumber(position.farmRewards)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons or Panels */}
                    {stakingPositionId === position.id ? (
                      <div className="border-t border-white/10 pt-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-base font-bold text-white">Stake in Farm</h4>
                          <button
                            onClick={handleCancelStaking}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                            aria-label="Cancel staking"
                          >
                            <X size={16} className="text-gray-400" />
                          </button>
                        </div>
                        <StakeLiquidityPanel
                          pool={position.pool}
                          lpBalance={position.lpBalance}
                          onStakeComplete={() => handleStakeComplete(position.id)}
                          soundsEnabled={soundsEnabled}
                        />
                      </div>
                    ) : removingPositionId === position.id ? (
                      <div className="border-t border-white/10 pt-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-base font-bold text-white">Remove Liquidity</h4>
                          <button
                            onClick={handleCancelRemove}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                            aria-label="Cancel remove liquidity"
                          >
                            <X size={16} className="text-gray-400" />
                          </button>
                        </div>
                        <RemoveLiquidityPanel
                          pool={position.pool}
                          lpBalance={position.lpBalance}
                          onRemoveComplete={() => {
                            onRemovePosition?.(position.id);
                            setRemovingPositionId(null);
                          }}
                          soundsEnabled={soundsEnabled}
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-3">
                        {!position.isStaked && (
                          <Button
                            className="bg-doge text-black hover:bg-doge-light"
                            onClick={(e) => handleStake(position.id, e)}
                            aria-label={`Stake ${position.pool.tokenA.symbol}/${position.pool.tokenB.symbol} position`}
                          >
                            Stake in Farm
                          </Button>
                        )}
                        <Button
                          className="bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30"
                          onClick={(e) => handleRemoveLiquidity(position.id, e)}
                          aria-label={`Remove ${position.pool.tokenA.symbol}/${position.pool.tokenB.symbol} liquidity`}
                        >
                          Remove Liquidity
                        </Button>
                      </div>
                    )}
                  </div>
              )}
            </li>
          );
        })}
        </ul>
      )}
    </section>
  );
};

export default DexLiquidityPositions;
