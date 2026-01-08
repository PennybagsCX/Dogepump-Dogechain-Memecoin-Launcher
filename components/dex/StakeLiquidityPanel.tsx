import React, { useState, useCallback } from 'react';
import { Pool } from '../../contexts/DexContext';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '../Button';
import { formatNumber } from '../../utils';
import { logLiquidity } from '../../utils/dexLogger';

interface StakeLiquidityPanelProps {
  pool: Pool;
  lpBalance: string;
  onStakeComplete?: () => void;
  soundsEnabled?: boolean;
}

const StakeLiquidityPanel: React.FC<StakeLiquidityPanelProps> = ({
  pool,
  lpBalance,
  onStakeComplete,
  soundsEnabled = true,
}) => {
  const [stakeAmount, setStakeAmount] = useState(lpBalance);
  const [isStaking, setIsStaking] = useState(false);

  // Play sound effect
  const playSound = useCallback((sound: 'click' | 'hover') => {
    if (!soundsEnabled) return;
    const audio = new Audio(`/sounds/${sound}.mp3`);
    audio.volume = 0.2;
    audio.play().catch(() => {
      // Ignore autoplay errors
    });
  }, [soundsEnabled]);

  // Handle stake
  const handleStake = useCallback(async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) return;

    setIsStaking(true);
    playSound('click');

    // Simulate staking transaction
    setTimeout(() => {
      setIsStaking(false);
      onStakeComplete?.();
      // In a real implementation, this would call a smart contract
      logLiquidity('stake', {
        poolAddress: pool.address,
        lpTokenAmount: stakeAmount,
        tokenA: pool.tokenA.symbol,
        tokenB: pool.tokenB.symbol
      });
    }, 2000);
  }, [stakeAmount, pool, onStakeComplete, playSound]);

  // Handle max amount
  const handleMax = useCallback(() => {
    playSound('click');
    setStakeAmount(lpBalance);
  }, [lpBalance, playSound]);

  const parsedBalance = parseFloat(lpBalance) || 0;
  const parsedAmount = parseFloat(stakeAmount) || 0;
  const isValidAmount = parsedAmount > 0 && parsedAmount <= parsedBalance;

  return (
    <div className="space-y-4">
      {/* Farm Info */}
      <div className="bg-doge/5 border border-doge/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={16} className="text-doge" />
          <span className="text-sm font-bold text-doge">Farm Rewards</span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-gray-400 mb-1">Estimated APY</div>
            <div className="text-lg font-bold text-white">12.5%</div>
          </div>
          <div>
            <div className="text-gray-400 mb-1">Reward Token</div>
            <div className="text-lg font-bold text-doge">DC</div>
          </div>
        </div>
      </div>

      {/* Stake Input */}
      <div>
        <label className="block text-sm font-bold text-white mb-2">
          Amount to Stake
        </label>
        <div className="relative">
          <input
            type="number"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            placeholder="0.0"
            className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 pr-20 text-white font-mono focus:border-doge/50 focus:ring-1 focus:ring-doge/50 outline-none transition-all"
            aria-label="Stake amount"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
            <button
              onClick={handleMax}
              className="px-2 py-1 bg-doge/10 hover:bg-doge/20 border border-doge/30 rounded-lg text-doge text-xs font-bold transition-all"
            >
              MAX
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2 text-sm">
          <span className="text-gray-400">Available:</span>
          <span className="text-white font-mono">{formatNumber(lpBalance)} LP</span>
        </div>
      </div>

      {/* Info Notice */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex gap-2">
        <AlertCircle size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-300">
          By staking your LP tokens, you'll earn DC rewards. You can unstake anytime.
        </p>
      </div>

      {/* Stake Button */}
      <Button
        className="w-full bg-doge text-black hover:bg-doge-light disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleStake}
        disabled={!isValidAmount || isStaking}
        aria-label="Stake LP tokens"
      >
        {isStaking ? 'Staking...' : `Stake ${formatNumber(stakeAmount)} LP Tokens`}
      </Button>
    </div>
  );
};

export default StakeLiquidityPanel;
