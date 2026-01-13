import React, { useState, useCallback, useEffect } from 'react';
import { Minus, Droplets, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useDex, Pool } from '../../contexts/DexContext';
import { formatNumber } from '../../utils';
import { logError, logLiquidity } from '../../utils/dexLogger';

interface RemoveLiquidityPanelProps {
  pool: Pool;
  lpBalance: string;
  onRemoveComplete?: () => void;
  soundsEnabled?: boolean;
}

const RemoveLiquidityPanel: React.FC<RemoveLiquidityPanelProps> = ({
  pool,
  lpBalance,
  onRemoveComplete,
  soundsEnabled = true,
}) => {
  const { removeLiquidity } = useDex();
  const [isExpanded, setIsExpanded] = useState(false);

  const [lpAmount, setLpAmount] = useState('');
  const [percentage, setPercentage] = useState(0);
  const [slippage, setSlippage] = useState('0.5');
  const [isRemoving, setIsRemoving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Play sound
  const playSound = useCallback((sound: 'click' | 'success') => {
    if (!soundsEnabled) return;
    const audio = new Audio(`/sounds/${sound}.mp3`);
    audio.volume = 0.2;
    audio.play().catch(() => {});
  }, [soundsEnabled]);

  // Toggle expand/collapse
  const handleToggle = useCallback(() => {
    playSound('click');
    setIsExpanded(!isExpanded);
  }, [isExpanded, playSound]);

  // Calculate token amounts to receive
  const calculateTokenAmounts = useCallback(() => {
    if (!lpAmount || percentage === 0) {
      return { tokenAAmount: '0', tokenBAmount: '0' };
    }

    try {
      const lpBalanceValue = parseFloat(lpBalance);
      const lpAmountValue = parseFloat(lpAmount);
      const share = lpAmountValue / lpBalanceValue;

      const tokenAAmount = share * parseFloat(pool.reserve0);
      const tokenBAmount = share * parseFloat(pool.reserve1);

      return {
        tokenAAmount: tokenAAmount.toFixed(6),
        tokenBAmount: tokenBAmount.toFixed(6),
      };
    } catch {
      return { tokenAAmount: '0', tokenBAmount: '0' };
    }
  }, [lpAmount, lpBalance, pool]);

  const { tokenAAmount, tokenBAmount } = calculateTokenAmounts();

  // Handle percentage selection
  const handlePercentage = useCallback((value: number) => {
    playSound('click');
    setPercentage(value);

    if (lpBalance) {
      const lpBalanceValue = parseFloat(lpBalance);
      const amount = (lpBalanceValue * value) / 100;
      setLpAmount(amount.toFixed(6));
    }
  }, [lpBalance, playSound]);

  // Update lpAmount when percentage changes
  useEffect(() => {
    if (percentage > 0 && lpBalance) {
      const lpBalanceValue = parseFloat(lpBalance);
      const amount = (lpBalanceValue * percentage) / 100;
      setLpAmount(amount.toFixed(6));
    } else if (percentage === 0) {
      setLpAmount('');
    }
  }, [percentage, lpBalance]);

  // Handle remove liquidity
  const handleRemoveLiquidity = useCallback(async () => {
    if (!lpAmount) return;

    playSound('click');
    setIsRemoving(true);

    try {
      await removeLiquidity(lpAmount);

      playSound('success');
      setLpAmount('');
      setPercentage(0);
      setIsExpanded(false);
      onRemoveComplete?.();
    } catch (error) {
      logError('Error removing liquidity', error, { lpAmount, pool: `${pool.tokenA.symbol}/${pool.tokenB.symbol}` });
    } finally {
      setIsRemoving(false);
    }
  }, [lpAmount, removeLiquidity, soundsEnabled, onRemoveComplete, playSound]);

  // Check if form is valid
  const isValid = lpAmount && percentage > 0;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      {/* Header - Always Visible */}
      <div
        className="p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={handleToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <Minus size={20} className="text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Remove Liquidity</h3>
              <p className="text-sm text-gray-400">
                {pool.tokenA.symbol}/{pool.tokenB.symbol}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronUp size={20} className="text-gray-400" />
            ) : (
              <ChevronDown size={20} className="text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-white/10 p-4 space-y-4 animate-fade-in overflow-hidden">
          {/* LP Token Input */}
          <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
            <div className="text-sm text-gray-400 mb-2">LP Tokens to Remove</div>
            <div className="flex items-center gap-3 min-w-0">
              <input
                type="number"
                value={lpAmount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setLpAmount(e.target.value);
                  // Calculate percentage based on input
                  if (lpBalance) {
                    const pct = (parseFloat(e.target.value || '0') / parseFloat(lpBalance)) * 100;
                    setPercentage(Math.min(100, Math.max(0, pct)));
                  }
                }}
                placeholder="0.0"
                className="flex-1 min-w-0 bg-transparent text-2xl font-bold text-white outline-none"
              />
              <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg flex-shrink-0">
                <Droplets size={16} className="text-purple-400" />
                <span className="text-sm font-bold text-white">LP</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500 break-all">
              Balance: {formatNumber(lpBalance)} LP tokens
            </div>
          </div>

          {/* Percentage Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                onClick={() => handlePercentage(pct)}
                className={`py-2 rounded-lg text-sm font-bold transition-all ${
                  percentage === pct
                    ? 'bg-red-500 text-white'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>

          {/* You Will Receive */}
          {lpAmount && percentage > 0 && (
            <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 animate-fade-in">
              <div className="text-sm font-bold text-green-400 mb-3">You Will Receive</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3 min-w-0">
                  <div className="flex items-center gap-2">
                    {pool.tokenA.logoURI ? (
                      <img
                        src={pool.tokenA.logoURI}
                        alt={pool.tokenA.symbol}
                        className="w-6 h-6 rounded-full"
                        onError={() => {}}
                      />
                    ) : null}
                    <div
                      className="w-6 h-6 rounded-full bg-gradient-to-br from-doge/20 to-doge/10 flex items-center justify-center text-xs font-bold text-doge {pool.tokenA.logoURI ? 'hidden' : ''}"
                      style={{ display: pool.tokenA.logoURI ? 'none' : 'flex' }}
                    >
                      {pool.tokenA.symbol.charAt(0)}
                    </div>
                    <span className="text-white font-bold">{pool.tokenA.symbol}</span>
                  </div>
                  <span className="text-white font-mono text-sm text-right break-all min-w-0">
                    {formatNumber(tokenAAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 min-w-0">
                  <div className="flex items-center gap-2">
                    {pool.tokenB.logoURI ? (
                      <img
                        src={pool.tokenB.logoURI}
                        alt={pool.tokenB.symbol}
                        className="w-6 h-6 rounded-full"
                        onError={() => {}}
                      />
                    ) : null}
                    <div
                      className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-500/10 flex items-center justify-center text-xs font-bold text-purple-400 {pool.tokenB.logoURI ? 'hidden' : ''}"
                      style={{ display: pool.tokenB.logoURI ? 'none' : 'flex' }}
                    >
                      {pool.tokenB.symbol.charAt(0)}
                    </div>
                    <span className="text-white font-bold">{pool.tokenB.symbol}</span>
                  </div>
                  <span className="text-white font-mono text-sm text-right break-all min-w-0">
                    {formatNumber(tokenBAmount)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Warning */}
          {percentage >= 100 && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-400">
                <p className="font-bold mb-1">Removing All Liquidity</p>
                <p className="text-xs text-red-300/80">
                  You are about to remove all of your liquidity from this pool. This action cannot be undone.
                </p>
              </div>
            </div>
          )}

          {/* Advanced Settings Toggle */}
          <button
            onClick={() => {
              playSound('click');
              setShowAdvanced(!showAdvanced);
            }}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Advanced Settings {showAdvanced ? '▲' : '▼'}
          </button>

          {showAdvanced && (
            <div className="animate-fade-in">
              <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2 block">
                Slippage Tolerance
              </span>
              <div className="flex gap-2 flex-wrap">
                {['0.1', '0.5', '1.0'].map((value) => (
                  <button
                    key={value}
                    onClick={() => {
                      playSound('click');
                      setSlippage(value);
                    }}
                    className={`flex-1 min-w-[80px] py-2 px-3 rounded-lg text-xs font-bold transition-colors ${
                      slippage === value
                        ? 'bg-doge text-black'
                        : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {value}%
                  </button>
                ))}
                <input
                  type="number"
                  value={slippage}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSlippage(e.target.value)}
                  className="flex-1 min-w-[90px] py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-white outline-none focus:border-doge/50"
                  placeholder="Custom"
                />
              </div>
            </div>
          )}

          {/* Remove Button */}
          <button
            onClick={handleRemoveLiquidity}
            disabled={!isValid || isRemoving}
            className={`w-full py-4 font-bold rounded-xl transition-all ${
              isValid && !isRemoving
                ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/20'
                : 'bg-white/5 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isRemoving ? 'Removing...' : 'Remove Liquidity'}
          </button>

          <div className="text-xs text-gray-500 text-center">
            By removing liquidity, you'll stop earning trading fees
          </div>
        </div>
      )}
    </div>
  );
};

export default RemoveLiquidityPanel;
