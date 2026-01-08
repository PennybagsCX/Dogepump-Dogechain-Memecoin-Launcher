import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Droplets, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useDex, Pool, Token } from '../../contexts/DexContext';
import { formatNumber } from '../../utils';
import { logError, logLiquidity } from '../../utils/dexLogger';

interface AddLiquidityPanelProps {
  pool?: Pool;
  tokenA?: Token;
  tokenB?: Token;
  soundsEnabled?: boolean;
}

const AddLiquidityPanel: React.FC<AddLiquidityPanelProps> = ({
  pool,
  tokenA: propTokenA,
  tokenB: propTokenB,
  soundsEnabled = true,
}) => {
  const { addLiquidity, selectedTokenA, selectedTokenB } = useDex();
  const [isExpanded, setIsExpanded] = useState(false);

  // Use pool tokens or props, falling back to selected tokens
  const tokenA = pool?.tokenA || propTokenA || selectedTokenA;
  const tokenB = pool?.tokenB || propTokenB || selectedTokenB;

  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [deadline, setDeadline] = useState('20');
  const [isApprovedA, setIsApprovedA] = useState(false);
  const [isApprovedB, setIsApprovedB] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
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

  // Calculate amountB based on amountA and pool reserves
  useEffect(() => {
    if (!pool || !amountA || !isExpanded) {
      setAmountB('');
      return;
    }

    try {
      const amountAValue = parseFloat(amountA);
      if (isNaN(amountAValue) || amountAValue <= 0) {
        setAmountB('');
        return;
      }

      // Calculate required amountB using pool reserves
      const reserveA = parseFloat(pool.reserve0);
      const reserveB = parseFloat(pool.reserve1);
      const amountBValue = (amountAValue * reserveB) / reserveA;

      setAmountB(amountBValue.toFixed(6));
    } catch (error) {
      logError('Error calculating amountB', error, { amountA, reserveA: pool?.reserve0, reserveB: pool?.reserve1 });
    }
  }, [amountA, pool, isExpanded]);

  // Calculate pool share
  const calculatePoolShare = useCallback(() => {
    if (!pool || !amountA || !amountB) return 0;

    try {
      const totalSupply = parseFloat(pool.totalSupply);
      const amountAValue = parseFloat(amountA);
      const amountBValue = parseFloat(amountB);

      if (totalSupply === 0) return 100;

      const lpTokens = (amountAValue / parseFloat(pool.reserve0)) * totalSupply;
      return (lpTokens / (totalSupply + lpTokens)) * 100;
    } catch {
      return 0;
    }
  }, [pool, amountA, amountB]);

  const poolShare = calculatePoolShare();

  // Handle max amount
  const handleMaxA = useCallback(() => {
    playSound('click');
    if (tokenA?.balance) {
      setAmountA((parseFloat(tokenA.balance) * 0.99).toFixed(6));
    }
  }, [tokenA, playSound]);

  // Handle approve token A
  const handleApproveA = useCallback(async () => {
    playSound('click');
    setIsApprovedA(true);
  }, [playSound]);

  // Handle approve token B
  const handleApproveB = useCallback(async () => {
    playSound('click');
    setIsApprovedB(true);
  }, [playSound]);

  // Handle add liquidity
  const handleAddLiquidity = useCallback(async () => {
    if (!amountA || !amountB) return;

    playSound('click');
    setIsAdding(true);

    try {
      await addLiquidity(amountA, amountB);
      playSound('success');
      setAmountA('');
      setAmountB('');
      setIsApprovedA(false);
      setIsApprovedB(false);
      setIsExpanded(false);
    } catch (error) {
      logError('Error adding liquidity', error, { amountA, amountB, tokenA: tokenA?.symbol, tokenB: tokenB?.symbol });
    } finally {
      setIsAdding(false);
    }
  }, [amountA, amountB, addLiquidity, playSound]);

  // Check if form is valid
  const isValid = amountA && amountB && isApprovedA && isApprovedB;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      {/* Header - Always Visible */}
      <div
        className="p-5 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={handleToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-doge/20 flex items-center justify-center">
              <Plus size={20} className="text-doge" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Add Liquidity</h3>
              {tokenA && tokenB && (
                <p className="text-sm text-gray-400">
                  {tokenA.symbol}/{tokenB.symbol}
                </p>
              )}
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
        <div className="border-t border-white/10 p-4 sm:p-5 space-y-4 animate-fade-in overflow-x-hidden">
          {/* Token A Input */}
          <div className="bg-white/[0.02] border border-white/10 rounded-xl p-3 sm:p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Input</span>
              <button
                onClick={handleMaxA}
                className="text-xs text-doge hover:text-doge-light font-bold flex-shrink-0"
              >
                MAX
              </button>
            </div>
            <input
              type="number"
              value={amountA}
              onChange={(e) => setAmountA(e.target.value)}
              placeholder="0.0"
              className="w-full bg-transparent text-xl sm:text-2xl font-bold text-white outline-none mb-3"
            />
            <div className="flex items-center gap-2 bg-white/5 px-2 sm:px-3 py-2 rounded-lg mb-2 w-fit">
              {tokenA?.logoURI ? (
                <img
                  src={tokenA.logoURI}
                  alt={tokenA.symbol}
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-full"
                  onError={(e) => {
                    // Fallback to initial if image fails to load
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-doge/20 to-doge/10 flex items-center justify-center text-xs font-bold text-doge {tokenA?.logoURI ? 'hidden' : ''}"
                style={{ display: tokenA?.logoURI ? 'none' : 'flex' }}
              >
                {tokenA?.symbol?.charAt(0) || '?'}
              </div>
              <span className="text-xs sm:text-sm font-bold text-white">{tokenA?.symbol || 'Token'}</span>
            </div>
            <div className="text-xs text-gray-400 font-mono font-medium">
              Balance: {tokenA?.balance ? formatNumber(tokenA.balance) : '0'} {tokenA?.symbol || ''}
            </div>
          </div>

          {/* Plus Icon */}
          <div className="flex justify-center -my-2">
            <div className="w-8 h-8 rounded-full bg-[#0A0A0A] border-2 border-white/10 flex items-center justify-center z-10">
              <Plus size={16} className="text-gray-400" />
            </div>
          </div>

          {/* Token B Input */}
          <div className="bg-white/[0.02] border border-white/10 rounded-xl p-3 sm:p-4 overflow-hidden mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Input</span>
            </div>
            <input
              type="number"
              value={amountB}
              onChange={(e) => setAmountB(e.target.value)}
              placeholder="0.0"
              className="w-full bg-transparent text-xl sm:text-2xl font-bold text-white outline-none mb-3"
              disabled={!!pool}
            />
            <div className="flex items-center gap-2 bg-white/5 px-2 sm:px-3 py-2 rounded-lg mb-2 w-fit">
              {tokenB?.logoURI ? (
                <img
                  src={tokenB.logoURI}
                  alt={tokenB.symbol}
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-full"
                  onError={(e) => {
                    // Fallback to initial if image fails to load
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-500/10 flex items-center justify-center text-xs font-bold text-purple-400 {tokenB?.logoURI ? 'hidden' : ''}"
                style={{ display: tokenB?.logoURI ? 'none' : 'flex' }}
              >
                {tokenB?.symbol?.charAt(0) || '?'}
              </div>
              <span className="text-xs sm:text-sm font-bold text-white">{tokenB?.symbol || 'Token'}</span>
            </div>
            <div className="text-xs text-gray-400 font-mono font-medium">
              Balance: {tokenB?.balance ? formatNumber(tokenB.balance) : '0'} {tokenB?.symbol || ''}
            </div>
          </div>

          {/* Pool Share Info */}
          {amountA && amountB && (
            <div className="bg-doge/5 border border-doge/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Droplets size={16} className="text-doge" />
                <span className="text-sm font-bold text-doge">Pool Share</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Your Pool Share</span>
                  <span className="text-white font-bold">{poolShare.toFixed(2)}%</span>
                </div>
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
            <Info size={16} />
            Advanced Settings {showAdvanced ? '▲' : '▼'}
          </button>

          {showAdvanced && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2 block">
                  Slippage Tolerance
                </label>
                <div className="flex gap-2">
                  {['0.1', '0.5', '1.0'].map((value) => (
                    <button
                      key={value}
                      onClick={() => {
                        playSound('click');
                        setSlippage(value);
                      }}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors ${
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
                    onChange={(e) => setSlippage(e.target.value)}
                    className="flex-1 min-w-0 py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-white outline-none focus:border-doge/50 overflow-hidden truncate"
                    placeholder="Custom"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2 block">
                  Transaction Deadline (minutes)
                </label>
                <input
                  type="number"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-sm font-bold text-white outline-none focus:border-doge/50"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {!isApprovedA && (
              <button
                onClick={handleApproveA}
                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all"
              >
                Approve {tokenA?.symbol || 'Token A'}
              </button>
            )}
            {!isApprovedB && (
              <button
                onClick={handleApproveB}
                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all"
              >
                Approve {tokenB?.symbol || 'Token B'}
              </button>
            )}

            {isApprovedA && isApprovedB && (
              <button
                onClick={handleAddLiquidity}
                disabled={!isValid || isAdding}
                className={`w-full py-4 font-bold rounded-xl transition-all ${
                  isValid && !isAdding
                    ? 'bg-gradient-to-r from-doge to-doge-light hover:from-doge-light hover:to-doge text-black shadow-lg shadow-doge/20'
                    : 'bg-white/5 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isAdding ? 'Adding Liquidity...' : 'Add Liquidity'}
              </button>
            )}

            <div className="text-xs text-gray-500 text-center">
              By adding liquidity, you'll earn 0.3% of trading fees
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddLiquidityPanel;
