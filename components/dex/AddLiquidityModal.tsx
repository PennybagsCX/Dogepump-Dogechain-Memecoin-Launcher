import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Droplets, Info, Check } from 'lucide-react';
import { useDex, Pool, Token } from '../../contexts/DexContext';
import { formatNumber } from '../../utils';
import { logError, logLiquidity } from '../../utils/dexLogger';

interface AddLiquidityModalProps {
  isOpen: boolean;
  onClose: () => void;
  pool?: Pool;
  tokenA?: Token;
  tokenB?: Token;
  soundsEnabled?: boolean;
}

const AddLiquidityModal: React.FC<AddLiquidityModalProps> = ({
  isOpen,
  onClose,
  pool,
  tokenA: propTokenA,
  tokenB: propTokenB,
  soundsEnabled = true,
}) => {
  const { addLiquidity, selectedTokenA, selectedTokenB } = useDex();

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

  // Calculate amountB based on amountA and pool reserves
  useEffect(() => {
    if (!pool || !amountA) {
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
      // Formula: (amountA * reserveB) / reserveA
      const reserveA = parseFloat(pool.reserve0);
      const reserveB = parseFloat(pool.reserve1);
      const amountBValue = (amountAValue * reserveB) / reserveA;

      setAmountB(amountBValue.toFixed(6));
    } catch (error) {
      logError('Error calculating amountB', error, { amountA, reserveA: pool?.reserve0, reserveB: pool?.reserve1 });
    }
  }, [amountA, pool]);

  // Calculate pool share
  const calculatePoolShare = useCallback(() => {
    if (!pool || !amountA || !amountB) return 0;

    try {
      const totalSupply = parseFloat(pool.totalSupply);
      const amountAValue = parseFloat(amountA);
      const amountBValue = parseFloat(amountB);

      if (totalSupply === 0) return 100;

      // Calculate LP tokens to receive (simplified)
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

  const handleMaxB = useCallback(() => {
    playSound('click');
    if (tokenB?.balance) {
      setAmountB((parseFloat(tokenB.balance) * 0.99).toFixed(6));
    }
  }, [tokenB, playSound]);

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
      onClose();
    } catch (error) {
      logError('Error adding liquidity', error, { amountA, amountB, tokenA: tokenA?.symbol, tokenB: tokenB?.symbol });
    } finally {
      setIsAdding(false);
    }
  }, [amountA, amountB, addLiquidity, playSound, onClose]);

  // Check if form is valid
  const isValid = amountA && amountB && isApprovedA && isApprovedB;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={() => {
        playSound('click');
        onClose();
      }}
      role="presentation"
    >
      <div
        className="bg-[#0A0A0A] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl animate-slide-up"
        onClick={(e: any) => e.stopPropagation()}
        role="dialog"
        aria-modal
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-doge/20 flex items-center justify-center">
              <Plus size={20} className="text-doge" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Add Liquidity</h2>
              <p className="text-xs text-gray-400">
                {tokenA?.symbol}/{tokenB?.symbol}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playSound('click');
              onClose();
            }}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Token A Input */}
          <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Input</span>
              <button
                onClick={handleMaxA}
                className="text-xs text-doge hover:text-doge-light font-bold"
              >
                MAX
              </button>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={amountA}
                onChange={(e: any) => setAmountA(e.target.value)}
                placeholder="0.0"
                className="flex-1 bg-transparent text-2xl font-bold text-white outline-none"
              />
              <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-doge/20 to-doge/10 flex items-center justify-center text-xs font-bold text-doge">
                  {tokenA?.symbol.charAt(0)}
                </div>
                <span className="text-sm font-bold text-white">{tokenA?.symbol}</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Balance: {tokenA?.balance ? formatNumber(tokenA.balance) : '0'} {tokenA?.symbol}
            </div>
          </div>

          {/* Plus Icon */}
          <div className="flex justify-center -my-2">
            <div className="w-8 h-8 rounded-full bg-[#0A0A0A] border-2 border-white/10 flex items-center justify-center z-10">
              <Plus size={16} className="text-gray-400" />
            </div>
          </div>

          {/* Token B Input */}
          <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Input</span>
              <button
                onClick={handleMaxB}
                className="text-xs text-doge hover:text-doge-light font-bold"
              >
                MAX
              </button>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={amountB}
                onChange={(e: any) => setAmountB(e.target.value)}
                placeholder="0.0"
                className="flex-1 bg-transparent text-2xl font-bold text-white outline-none"
                disabled={!!pool}
              />
              <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-500/10 flex items-center justify-center text-xs font-bold text-purple-400">
                  {tokenB?.symbol.charAt(0)}
                </div>
                <span className="text-sm font-bold text-white">{tokenB?.symbol}</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Balance: {tokenB?.balance ? formatNumber(tokenB.balance) : '0'} {tokenB?.symbol}
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
                <div className="flex justify-between">
                  <span className="text-gray-400">{tokenA?.symbol}/{tokenB?.symbol}</span>
                  <span className="text-white font-bold">
                    {pool ? pool.tvl + (parseFloat(amountA) || 0) : '-'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Settings */}
          <div>
            <button
              onClick={() => {
                playSound('click');
                setShowAdvanced(!showAdvanced);
              }}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <Info size={16} />
              Advanced Settings
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-4 animate-fade-in">
                <div>
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
                            : 'bg-white/5 text-gray-400 hover:text-white'
                        }`}
                      >
                        {value}%
                      </button>
                    ))}
                    <input
                      type="number"
                      value={slippage}
                      onChange={(e) => setSlippage(e.target.value)}
                      className="flex-1 min-w-[90px] py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-white outline-none focus:border-doge/50"
                      placeholder="Custom"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="transaction-deadline" className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2 block">
                    Transaction Deadline (minutes)
                  </label>
                  <input
                    id="transaction-deadline"
                    name="transactionDeadline"
                    type="number"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-sm font-bold text-white outline-none focus:border-doge/50"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 space-y-3">
          {/* Approve Buttons */}
          {!isApprovedA && (
            <button
              onClick={handleApproveA}
              className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              Approve {tokenA?.symbol}
            </button>
          )}
          {!isApprovedB && (
            <button
              onClick={handleApproveB}
              className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              Approve {tokenB?.symbol}
            </button>
          )}

          {/* Add Liquidity Button */}
          {isApprovedA && isApprovedB && (
            <button
              onClick={handleAddLiquidity}
              disabled={!isValid || isAdding}
              className={`w-full py-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                isValid && !isAdding
                  ? 'bg-gradient-to-r from-doge to-doge-light hover:from-doge-light hover:to-doge text-black shadow-lg shadow-doge/20'
                  : 'bg-white/5 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isAdding ? (
                <>Adding Liquidity...</>
              ) : (
                <>
                  <Plus size={18} />
                  Add Liquidity
                </>
              )}
            </button>
          )}

          {/* Info */}
          <div className="text-xs text-gray-500 text-center">
            <p>By adding liquidity, you'll earn 0.3% of trading fees</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddLiquidityModal;
