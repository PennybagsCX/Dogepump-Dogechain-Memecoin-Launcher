import React, { useState, useCallback, useEffect } from 'react';
import { useDex } from '../../contexts/DexContext';
import { Token, Pool } from '../../contexts/DexContext';
import AmountInput from '../AmountInput';
import Button from '../Button';
import { logInfo, logLiquidity } from '../../utils/dexLogger';

interface DexAddLiquidityProps {
  pool?: Pool;
  className?: string;
}

const DexAddLiquidity: React.FC<DexAddLiquidityProps> = ({ pool, className = '' }) => {
  const {
    selectedTokenA,
    selectedTokenB,
    settings,
    isLoading,
    error,
    setSelectedTokenA,
    setSelectedTokenB,
    addLiquidity,
    clearError,
  } = useDex();

  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [optimalAmountB, setOptimalAmountB] = useState('');
  const [lpTokens, setLpTokens] = useState('');
  const [poolShare, setPoolShare] = useState(0);
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
    logInfo(`Toast: [${type.toUpperCase()}] ${message}`);
  }, [settings.notificationsEnabled]);

  // Calculate optimal amount B when amount A changes
  useEffect(() => {
    if (pool && selectedTokenA && selectedTokenB && amountA) {
      // Calculate optimal amount B using constant product formula
      const amountANum = parseFloat(amountA);
      const reserveA = parseFloat(pool.reserve0);
      const reserveB = parseFloat(pool.reserve1);

      if (reserveA > 0 && reserveB > 0) {
        const optimalB = (amountANum * reserveB) / reserveA;
        setOptimalAmountB(optimalB.toFixed(6));
        setAmountB(optimalB.toFixed(6));
      }
    } else {
      setOptimalAmountB('');
    }
  }, [pool, selectedTokenA, selectedTokenB, amountA]);

  // Calculate LP tokens and pool share
  useEffect(() => {
    if (pool && amountA && amountB) {
      const amountANum = parseFloat(amountA);
      const amountBNum = parseFloat(amountB);
      const totalSupply = parseFloat(pool.totalSupply);
      const reserveA = parseFloat(pool.reserve0);
      const reserveB = parseFloat(pool.reserve1);

      if (reserveA > 0 && reserveB > 0 && totalSupply > 0) {
        const liquidityA = (amountANum * totalSupply) / reserveA;
        const liquidityB = (amountBNum * totalSupply) / reserveB;
        const liquidity = Math.min(liquidityA, liquidityB);
        setLpTokens(liquidity.toFixed(6));

        const share = (liquidity / (totalSupply + liquidity)) * 100;
        setPoolShare(share);
      }
    } else {
      setLpTokens('');
      setPoolShare(0);
    }
  }, [pool, amountA, amountB]);

  // Handle amount A change
  const handleAmountAChange = useCallback((value: string) => {
    clearError();
    setAmountA(value);
  }, [clearError]);

  // Handle amount B change
  const handleAmountBChange = useCallback((value: string) => {
    clearError();
    setAmountB(value);
  }, [clearError]);

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

  // Handle max button click
  const handleMaxClick = useCallback((token: 'A' | 'B') => {
    playSound('click');
    if (token === 'A' && selectedTokenA?.balance) {
      setAmountA(selectedTokenA.balance);
    } else if (token === 'B' && selectedTokenB?.balance) {
      setAmountB(selectedTokenB.balance);
    }
  }, [selectedTokenA, selectedTokenB, playSound]);

  // Handle add liquidity
  const handleAddLiquidity = useCallback(async () => {
    if (!selectedTokenA || !selectedTokenB || !amountA || !amountB) {
      showToast('Please select tokens and enter amounts', 'error');
      return;
    }

    try {
      playSound('click');
      await addLiquidity(amountA, amountB);
      playSound('success');
      showToast('Liquidity added successfully!', 'success');
      setAmountA('');
      setAmountB('');
      setLpTokens('');
      setPoolShare(0);
    } catch (err) {
      playSound('error');
      showToast('Failed to add liquidity. Please try again.', 'error');
    }
  }, [selectedTokenA, selectedTokenB, amountA, amountB, addLiquidity, playSound, showToast]);

  // Handle confirm add liquidity
  const handleConfirmAddLiquidity = useCallback(async () => {
    setShowConfirmation(false);
    await handleAddLiquidity();
  }, [handleAddLiquidity]);

  // Calculate price ratio
  const getPriceRatio = useCallback(() => {
    if (!pool || !amountA || !amountB) return null;

    const amountANum = parseFloat(amountA);
    const amountBNum = parseFloat(amountB);

    if (amountANum === 0) return null;

    return `1 ${selectedTokenA?.symbol} = ${(amountBNum / amountANum).toFixed(6)} ${selectedTokenB?.symbol}`;
  }, [pool, amountA, amountB, selectedTokenA, selectedTokenB]);

  // Check if add button should be enabled
  const isAddEnabled = useCallback(() => {
    return selectedTokenA && selectedTokenB && amountA && amountB && !isLoading;
  }, [selectedTokenA, selectedTokenB, amountA, amountB, isLoading]);

  return (
    <div className={`dex-add-liquidity ${className}`} role="region" aria-label="Add liquidity">
      <div className="dex-add-liquidity-header">
        <h2>Add Liquidity</h2>
      </div>

      {error && (
        <div className="dex-add-liquidity-error" role="alert" aria-live="polite">
          {error}
        </div>
      )}

      <div className="dex-add-liquidity-inputs">
        <div className="dex-add-liquidity-input">
          <AmountInput
            id="add-liquidity-token-a"
            value={amountA}
            onChange={handleAmountAChange}
            placeholder="0.0"
            label="Token A"
            token={selectedTokenA}
            onTokenSelect={handleTokenASelect}
            disabled={isLoading}
            onMax={() => handleMaxClick('A')}
            aria-label="Amount of token A to add"
            role="textbox"
          />
          {selectedTokenA && (
            <div className="dex-add-liquidity-balance">
              Balance: {selectedTokenA.balance || '0'}
            </div>
          )}
        </div>

        <div className="dex-add-liquidity-plus">+</div>

        <div className="dex-add-liquidity-input">
          <AmountInput
            id="add-liquidity-token-b"
            value={amountB}
            onChange={handleAmountBChange}
            placeholder="0.0"
            label="Token B"
            token={selectedTokenB}
            onTokenSelect={handleTokenBSelect}
            disabled={isLoading}
            onMax={() => handleMaxClick('B')}
            aria-label="Amount of token B to add"
            role="textbox"
          />
          {selectedTokenB && (
            <div className="dex-add-liquidity-balance mb-6">
              Balance: {selectedTokenB.balance || '0'}
            </div>
          )}
        </div>
      </div>

      {getPriceRatio() && (
        <div className="dex-add-liquidity-price-ratio" aria-live="polite">
          {getPriceRatio()}
        </div>
      )}

      {optimalAmountB && amountB !== optimalAmountB && (
        <div className="dex-add-liquidity-optimal" role="alert" aria-live="polite">
          Optimal amount for {selectedTokenB?.symbol}: {optimalAmountB}
        </div>
      )}

      {lpTokens && (
        <div className="dex-add-liquidity-preview">
          <div className="dex-add-liquidity-lp-tokens">
            You will receive: <strong>{lpTokens} LP tokens</strong>
          </div>
          <div className="dex-add-liquidity-pool-share" aria-live="polite">
            Pool share: <strong>{poolShare.toFixed(2)}%</strong>
          </div>
        </div>
      )}

      <Button
        className="dex-add-liquidity-button"
        onClick={() => {
          playSound('click');
          setShowConfirmation(true);
        }}
        disabled={!isAddEnabled()}
        isLoading={isLoading}
        aria-label="Add liquidity"
      >
        {isLoading ? 'Adding...' : 'Add Liquidity'}
      </Button>

      {showConfirmation && (
        <div className="dex-add-liquidity-confirmation" role="dialog" aria-modal="true" aria-labelledby="confirmation-title">
          <div className="confirmation-content">
            <h3 id="confirmation-title">Confirm Add Liquidity</h3>
            <div className="confirmation-details">
              <div>Token A: {amountA} {selectedTokenA?.symbol}</div>
              <div>Token B: {amountB} {selectedTokenB?.symbol}</div>
              <div>LP Tokens: {lpTokens}</div>
              <div>Pool Share: {poolShare.toFixed(2)}%</div>
            </div>
            <div className="confirmation-actions">
              <Button
                className="confirmation-cancel"
                onClick={() => {
                  playSound('click');
                  setShowConfirmation(false);
                }}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button
                className="confirmation-confirm"
                onClick={handleConfirmAddLiquidity}
                isLoading={isLoading}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DexAddLiquidity;
