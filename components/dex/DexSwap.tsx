import React, { useState, useEffect, useCallback } from 'react';
import { useDex } from '../../contexts/DexContext';
import { Token, SwapRoute } from '../../contexts/DexContext';
import AmountInput from '../AmountInput';
import Button from '../Button';
import SlippageControl from '../SlippageControl';
import { Settings, ArrowDown, AlertTriangle } from 'lucide-react';
import { logInfo, logError, logSwap, logTransaction } from '../../utils/dexLogger';

interface DexSwapProps {
  className?: string;
}

const DexSwap: React.FC<DexSwapProps> = ({ className = '' }) => {
  const {
    selectedTokenA,
    selectedTokenB,
    amountIn,
    amountOut,
    swapRoute,
    priceImpact,
    settings,
    isLoading,
    error,
    setSelectedTokenA,
    setSelectedTokenB,
    setAmountIn,
    setAmountOut,
    swapTokens,
    calculateSwapOutput,
    clearError,
  } = useDex();

  const [isSwapped, setIsSwapped] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Play sound effect
  const playSound = useCallback((sound: 'click' | 'success' | 'error') => {
    if (!settings.soundsEnabled) return;

    try {
      const audio = new Audio(`/sounds/${sound}.mp3`);
      audio.volume = 0.3;
      const playPromise = audio.play();
      // play() returns a Promise in modern browsers, but may be undefined in test environments
      if (playPromise) {
        playPromise.catch(() => {
          // Ignore autoplay errors
        });
      }
    } catch (error) {
      // Ignore errors in test environment
    }
  }, [settings.soundsEnabled]);

  // Show toast notification
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    if (!settings.notificationsEnabled) return;

    // This would use a toast library like react-hot-toast
    logInfo(`Toast: [${type.toUpperCase()}] ${message}`);
  }, [settings.notificationsEnabled]);

  // Calculate swap output when amount or tokens change
  useEffect(() => {
    if (selectedTokenA && selectedTokenB && amountIn) {
      calculateSwapOutput(amountIn, selectedTokenA, selectedTokenB)
        .then((route: SwapRoute) => {
          setAmountOut(route.outputAmount);
        })
        .catch(err => {
          logError('Failed to calculate swap output', err, {
            fromToken: selectedTokenA.symbol,
            toToken: selectedTokenB.symbol,
            amountIn
          });
        });
    } else {
      setAmountOut('');
    }
  }, [selectedTokenA, selectedTokenB, amountIn, calculateSwapOutput, setAmountOut]);

  // Swap token positions
  const handleSwapDirection = useCallback(() => {
    setIsSwapped(true);
    playSound('click');

    const tempToken = selectedTokenA;
    setSelectedTokenA(selectedTokenB);
    setSelectedTokenB(tempToken);

    const tempAmount = amountIn;
    setAmountIn(amountOut);
    setAmountOut(tempAmount);

    setTimeout(() => setIsSwapped(false), 300);
  }, [selectedTokenA, selectedTokenB, amountIn, amountOut, setSelectedTokenA, setSelectedTokenB, setAmountIn, setAmountOut, playSound]);

  // Handle amount input change
  const handleAmountInChange = useCallback((value: string) => {
    clearError();
    setAmountIn(value);
  }, [clearError, setAmountIn]);

  // Handle amount output change (reverse calculation)
  const handleAmountOutChange = useCallback((value: string) => {
    clearError();
    setAmountOut(value);
  }, [clearError, setAmountOut]);

  // Handle token A selection
  const handleTokenASelect = useCallback((token: Token) => {
    playSound('click');
    setSelectedTokenA(token);
  }, [playSound, setSelectedTokenA]);

  // Handle token B selection
  const handleTokenBSelect = useCallback((token: Token) => {
    playSound('click');
    setSelectedTokenB(token);
  }, [playSound, setSelectedTokenB]);

  // Handle swap execution
  const handleSwap = useCallback(async () => {
    if (!selectedTokenA || !selectedTokenB || !amountIn) {
      showToast('Please select tokens and enter amount', 'error');
      return;
    }

    try {
      playSound('click');
      await swapTokens();
      playSound('success');
      showToast('Swap successful!', 'success');
    } catch (err) {
      playSound('error');
      showToast('Swap failed. Please try again.', 'error');
    }
  }, [selectedTokenA, selectedTokenB, amountIn, swapTokens, playSound, showToast]);

  // Calculate price
  const getPrice = useCallback(() => {
    if (!selectedTokenA || !selectedTokenB || !amountIn || !amountOut) {
      return null;
    }
    const amountInNum = parseFloat(amountIn);
    const amountOutNum = parseFloat(amountOut);
    if (amountInNum === 0) return null;
    return `1 ${selectedTokenA.symbol} = ${(amountOutNum / amountInNum).toFixed(6)} ${selectedTokenB.symbol}`;
  }, [selectedTokenA, selectedTokenB, amountIn, amountOut]);

  // Check if price impact is high
  const isHighPriceImpact = useCallback(() => {
    return priceImpact > 5; // > 5% is considered high
  }, [priceImpact]);

  // Check if swap button should be enabled
  const isSwapEnabled = useCallback(() => {
    return selectedTokenA && selectedTokenB && amountIn && !isLoading && !isHighPriceImpact();
  }, [selectedTokenA, selectedTokenB, amountIn, isLoading, isHighPriceImpact]);

  return (
    <main className={`bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 mb-4 ${className}`} role="main" aria-label="Swap tokens interface">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-comic font-bold text-white">Swap</h2>
        <button
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            showSettings
              ? 'bg-doge text-black'
              : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-doge/50'
          }`}
          onClick={() => {
            playSound('click');
            setShowSettings(!showSettings);
          }}
          aria-label="Toggle swap settings"
          aria-expanded={showSettings}
        >
          <Settings size={20} />
        </button>
      </header>

      {/* Settings Panel - Inline, toggleable */}
      {showSettings && (
        <section className="mb-6 p-4 bg-white/5 border border-white/10 rounded-xl animate-fade-in" role="region" aria-label="Swap settings panel">
          <SlippageControl
            value={settings.slippage.toString()}
            onChange={(value) => {
              // Update slippage in settings
              // TODO: Implement setSettings function in DexContext
              logInfo('Slippage setting changed', { slippage: value });
            }}
          />
        </section>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm" role="alert" aria-live="polite">
          <span className="font-semibold">Error:</span> {error}
        </div>
      )}

      {/* Swap Inputs */}
      <section className="space-y-2 mb-4" aria-label="Swap inputs">
        {/* From Input */}
        <div className="bg-[#050505] border border-white/10 rounded-2xl p-4">
          <AmountInput
            id="swap-from-amount"
            value={amountIn}
            onChange={handleAmountInChange}
            currency={selectedTokenA?.symbol || 'Token'}
            onMaxClick={() => {
              if (selectedTokenA?.balance) {
                setAmountIn(selectedTokenA.balance);
                playSound('click');
              }
            }}
            disabled={isLoading}
            aria-label="Amount to swap from"
          />
          {selectedTokenA && (
            <div className="flex items-center justify-between mt-2 px-1">
              <div className="text-xs text-gray-500 font-medium">Balance:</div>
              <div className="text-sm font-mono font-bold text-white">{selectedTokenA.balance || '0'}</div>
            </div>
          )}
        </div>

        {/* Swap Direction Button */}
        <button
          className={`mx-auto w-12 h-12 rounded-full bg-doge border-4 border-[#0A0A0A] flex items-center justify-center text-black hover:bg-doge-light transition-all ${isSwapped ? 'rotate-180' : ''}`}
          onClick={handleSwapDirection}
          disabled={isLoading}
          aria-label="Swap direction"
        >
          <ArrowDown size={20} strokeWidth={3} />
        </button>

        {/* To Input */}
        <div className="bg-[#050505] border border-white/10 rounded-2xl p-4">
          <AmountInput
            id="swap-to-amount"
            value={amountOut}
            onChange={handleAmountOutChange}
            currency={selectedTokenB?.symbol || 'Token'}
            onMaxClick={() => {
              if (selectedTokenB?.balance) {
                setAmountOut(selectedTokenB.balance);
                playSound('click');
              }
            }}
            disabled={isLoading}
            aria-label="Amount to swap to"
          />
          {selectedTokenB && (
            <div className="flex items-center justify-between mt-2 px-1">
              <div className="text-xs text-gray-500 font-medium">Balance:</div>
              <div className="text-sm font-mono font-bold text-white">{selectedTokenB.balance || '0'}</div>
            </div>
          )}
        </div>
      </section>

      {/* Price Display */}
      {getPrice() && (
        <div className="mb-4 p-3 bg-white/5 rounded-xl text-sm text-gray-400 text-center" aria-live="polite">
          {getPrice()}
        </div>
      )}

      {/* Price Impact */}
      {priceImpact > 0 && (
        <div
          className={`mb-4 p-3 rounded-xl text-sm ${
            isHighPriceImpact()
              ? 'bg-red-500/10 border border-red-500/20 text-red-400'
              : 'bg-white/5 text-gray-400'
          }`}
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-center justify-between">
            <span>Price Impact:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold">{priceImpact.toFixed(2)}%</span>
              {isHighPriceImpact() && (
                <span className="flex items-center gap-1 text-xs font-bold">
                  <AlertTriangle size={14} />
                  High!
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Route Display */}
      {swapRoute && (
        <div className="mb-4 p-3 bg-white/5 rounded-xl text-sm text-gray-400" aria-live="polite">
          <div className="text-xs text-gray-500 font-medium mb-1">Route</div>
          <div className="font-mono">{swapRoute.path.join(' → ')}</div>
        </div>
      )}

      {/* Cost Breakdown */}
      {amountIn && amountOut && swapRoute && (
        <section className="mb-4 p-4 bg-white/5 border border-white/10 rounded-xl space-y-3" aria-label="Swap details">
          <h3 className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Swap Details</h3>

          {/* Gas Fee */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Estimated Gas Fee</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-white">~$0.15</span>
              <span className="text-xs text-gray-500">(0.0001 DC)</span>
            </div>
          </div>

          {/* Platform Fee */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Platform Fee</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-white">0.3%</span>
              <span className="text-xs text-gray-500">(~${(parseFloat(amountIn) * 0.003).toFixed(4)})</span>
            </div>
          </div>

          {/* Price Impact */}
          {priceImpact > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Price Impact</span>
              <span className={`font-mono ${isHighPriceImpact() ? 'text-red-400' : 'text-white'}`}>
                {priceImpact.toFixed(2)}%
              </span>
            </div>
          )}

          {/* Minimum Received */}
          <div className="flex items-center justify-between text-sm pt-2 border-t border-white/10">
            <span className="text-gray-400">Minimum Received</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-white">
                {(parseFloat(amountOut) * (1 - settings.slippage / 100)).toFixed(6)}
              </span>
              <span className="text-xs text-gray-500">{selectedTokenB?.symbol}</span>
            </div>
          </div>

          {/* Total Cost */}
          <div className="flex items-center justify-between text-sm pt-2 border-t border-white/10">
            <span className="text-gray-400 font-bold">Total Cost</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-doge font-bold">
                ~${(parseFloat(amountIn) * 0.003 + 0.15).toFixed(4)}
              </span>
              <span className="text-xs text-gray-500">(fees)</span>
            </div>
          </div>

          <div className="text-xs text-gray-500 text-center pt-2" role="note">
            Fees are estimated and may vary based on network conditions
          </div>
        </section>
      )}

      {/* Swap Button */}
      <Button
        className="w-full py-4 bg-doge text-black hover:bg-doge-light font-bold text-lg"
        onClick={handleSwap}
        disabled={!isSwapEnabled()}
        isLoading={isLoading}
        aria-label="Execute swap"
        type="button"
      >
        {isLoading ? 'Swapping...' : 'Swap'}
      </Button>

      {/* Warning Message */}
      {isHighPriceImpact() && (
        <div className="mt-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-start gap-3" role="alert" aria-live="assertive">
          <AlertTriangle size={20} className="text-orange-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-orange-400">
            <span className="font-bold">High price impact!</span> You may receive less than expected.
          </div>
        </div>
      )}
    </main>
  );
};

export default DexSwap;
