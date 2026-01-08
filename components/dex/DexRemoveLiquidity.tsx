import React, { useState, useCallback, useEffect } from 'react';
import { useDex } from '../../contexts/DexContext';
import { Pool } from '../../contexts/DexContext';
import { logInfo, logLiquidity } from '../../utils/dexLogger';
import Button from '../Button';

interface DexRemoveLiquidityProps {
  pool: Pool;
  lpBalance: string;
  className?: string;
}

const DexRemoveLiquidity: React.FC<DexRemoveLiquidityProps> = ({
  pool,
  lpBalance,
  className = '',
}) => {
  const {
    settings,
    isLoading,
    error,
    removeLiquidity,
    clearError,
  } = useDex();

  const [percentage, setPercentage] = useState(100);
  const [lpAmount, setLpAmount] = useState('');
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Play sound effect
  const playSound = useCallback((sound: 'click' | 'success' | 'error') => {
    if (!settings.soundsEnabled) return;

    const audio = new Audio(`/sounds/${sound}.mp3`);
    audio.volume = 0.3;
    audio.play().catch(() => {
      // Ignore autoplay errors
    });
  }, [settings.soundsEnabled]);

  // Show toast notification
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    if (!settings.notificationsEnabled) return;

    // This would use a toast library like react-hot-toast
    logInfo(`[${type.toUpperCase()}] ${message}`);
  }, [settings.notificationsEnabled]);

  // Calculate LP amount based on percentage
  useEffect(() => {
    if (lpBalance && percentage > 0) {
      const lpBalanceNum = parseFloat(lpBalance);
      const lpAmountNum = (lpBalanceNum * percentage) / 100;
      setLpAmount(lpAmountNum.toFixed(6));
    } else {
      setLpAmount('');
    }
  }, [lpBalance, percentage]);

  // Calculate token amounts to receive
  useEffect(() => {
    if (pool && lpAmount) {
      const lpAmountNum = parseFloat(lpAmount);
      const totalSupply = parseFloat(pool.totalSupply);
      const reserveA = parseFloat(pool.reserve0);
      const reserveB = parseFloat(pool.reserve1);

      if (totalSupply > 0) {
        const amountANum = (lpAmountNum * reserveA) / totalSupply;
        const amountBNum = (lpAmountNum * reserveB) / totalSupply;
        setAmountA(amountANum.toFixed(6));
        setAmountB(amountBNum.toFixed(6));
      }
    } else {
      setAmountA('');
      setAmountB('');
    }
  }, [pool, lpAmount]);

  // Handle percentage change
  const handlePercentageChange = useCallback((newPercentage: number) => {
    playSound('click');
    setPercentage(newPercentage);
  }, [playSound]);

  // Handle remove liquidity
  const handleRemoveLiquidity = useCallback(async () => {
    if (!lpAmount) {
      showToast('Please enter LP amount', 'error');
      return;
    }

    try {
      playSound('click');
      await removeLiquidity(lpAmount);
      playSound('success');
      showToast('Liquidity removed successfully!', 'success');
      setPercentage(100);
      setLpAmount('');
      setAmountA('');
      setAmountB('');
    } catch (err) {
      playSound('error');
      showToast('Failed to remove liquidity. Please try again.', 'error');
    }
  }, [lpAmount, removeLiquidity, playSound, showToast]);

  // Handle confirm remove liquidity
  const handleConfirmRemoveLiquidity = useCallback(async () => {
    setShowConfirmation(false);
    await handleRemoveLiquidity();
  }, [handleRemoveLiquidity]);

  // Handle quick percentage buttons
  const quickPercentages = [25, 50, 75, 100];

  return (
    <div className={`bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 space-y-4 ${className}`} role="region" aria-label="Remove liquidity">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-comic font-bold text-white">Remove Liquidity</h2>
        <div className="text-sm text-gray-400">
          {pool.tokenA.symbol}/{pool.tokenB.symbol}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm" role="alert" aria-live="polite">
          {error}
        </div>
      )}

      {/* Warning Message */}
      <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-400 text-sm" role="alert" aria-live="polite">
        <strong>Warning:</strong> Removing liquidity will burn your LP tokens and return your
        underlying tokens. You may lose impermanent loss if the price has changed since you added liquidity.
      </div>

      {/* Balance Display */}
      <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
        <div className="text-sm text-gray-400 font-medium">LP Balance</div>
        <div className="text-base font-mono font-bold text-white">{lpBalance || '0'}</div>
      </div>

      {/* Percentage Selector */}
      <div className="space-y-3">
        <div className="text-sm font-bold text-gray-300">Percentage to remove</div>

        {/* Slider */}
        <div className="relative">
          <input
            type="range"
            min="0"
            max="100"
            value={percentage}
            onChange={(e) => handlePercentageChange(Number(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-doge [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg"
            role="slider"
            aria-label="Percentage of liquidity to remove"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percentage}
            aria-valuetext={`${percentage}%`}
          />
          <div className="text-center text-lg font-mono font-bold text-doge mt-2" aria-live="polite" aria-atomic="true">{percentage}%</div>
        </div>

        {/* Quick Percentage Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {quickPercentages.map(p => (
            <button
              key={p}
              className={`py-3 rounded-xl text-sm font-bold transition-all ${
                percentage === p
                  ? 'bg-doge text-black shadow-lg shadow-doge/20'
                  : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
              onClick={() => handlePercentageChange(p)}
              aria-label={`Remove ${p}% of liquidity`}
              aria-pressed={percentage === p}
            >
              {p}%
            </button>
          ))}
        </div>
      </div>

      {/* Preview Section */}
      <div className="p-4 bg-white/5 border border-doge/20 rounded-xl space-y-3">
        <h3 className="text-base font-bold text-white">You will receive:</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-[#0A0A0A] rounded-xl border border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-doge/20 flex items-center justify-center text-sm font-bold text-doge">
                {pool.tokenA.symbol.charAt(0)}
              </div>
              <span className="text-white font-medium">{pool.tokenA.symbol}</span>
            </div>
            <span className="text-lg font-mono font-bold text-white" aria-label={`${amountA} ${pool.tokenA.symbol}`}>
              {amountA || '0.0'}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-[#0A0A0A] rounded-xl border border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-sm font-bold text-purple-400">
                {pool.tokenB.symbol.charAt(0)}
              </div>
              <span className="text-white font-medium">{pool.tokenB.symbol}</span>
            </div>
            <span className="text-lg font-mono font-bold text-white" aria-label={`${amountB} ${pool.tokenB.symbol}`}>
              {amountB || '0.0'}
            </span>
          </div>
        </div>
        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-sm">
          <span className="text-gray-400">LP Tokens to burn</span>
          <span className="font-mono font-bold text-doge">{lpAmount || '0.0'}</span>
        </div>
      </div>

      {/* Remove Button */}
      <Button
        className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-bold text-lg rounded-xl transition-all"
        onClick={() => {
          playSound('click');
          setShowConfirmation(true);
        }}
        disabled={!lpAmount || isLoading}
        isLoading={isLoading}
        aria-label="Remove liquidity"
      >
        {isLoading ? 'Removing...' : 'Remove Liquidity'}
      </Button>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="confirmation-title">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl w-full max-w-md animate-fade-in">
            <div className="p-6 space-y-4">
              <h3 id="confirmation-title" className="text-2xl font-comic font-bold text-white">Confirm Remove Liquidity</h3>

              <div className="space-y-3 p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">LP Tokens to burn</span>
                  <span className="font-mono font-bold text-white">{lpAmount}</span>
                </div>

                <div className="border-t border-white/10 pt-3">
                  <div className="text-sm text-gray-400 mb-2">You will receive:</div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-medium">{amountA} {pool.tokenA.symbol}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white font-medium">{amountB} {pool.tokenB.symbol}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg text-orange-400 text-sm">
                  <strong>Warning:</strong> This action cannot be undone. You will burn your LP tokens
                  and receive the underlying tokens.
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-white/5 border border-white/10 text-white hover:bg-white/10 py-3"
                  onClick={() => {
                    playSound('click');
                    setShowConfirmation(false);
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 font-bold"
                  onClick={handleConfirmRemoveLiquidity}
                  isLoading={isLoading}
                >
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DexRemoveLiquidity;
