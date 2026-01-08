import React, { useCallback } from 'react';
import { Token } from '../../contexts/DexContext';
import Button from '../Button';

interface SwapSummary {
  tokenIn: Token;
  tokenOut: Token;
  amountIn: string;
  amountOut: string;
  price: string;
  priceImpact: number;
  minimumReceived: string;
  priceImpactWarning?: boolean;
}

interface FeeSummary {
  gasCost: string;
  gasCostUSD: number;
  routerFee: string;
  routerFeeUSD: number;
  totalCostUSD: number;
}

interface DexTransactionSummaryProps {
  type: 'swap' | 'add_liquidity' | 'remove_liquidity';
  swapSummary?: SwapSummary;
  feeSummary?: FeeSummary;
  onConfirm?: () => void;
  onCancel?: () => void;
  className?: string;
  soundsEnabled?: boolean;
}

const DexTransactionSummary: React.FC<DexTransactionSummaryProps> = ({
  type,
  swapSummary,
  feeSummary,
  onConfirm,
  onCancel,
  className = '',
  soundsEnabled = true,
}) => {
  // Play sound effect
  const playSound = useCallback((sound: 'click' | 'hover') => {
    if (!soundsEnabled) return;

    const audio = new Audio(`/sounds/${sound}.mp3`);
    audio.volume = 0.2;
    audio.play().catch(() => {
      // Ignore autoplay errors
    });
  }, [soundsEnabled]);

  // Handle confirm
  const handleConfirm = useCallback(() => {
    playSound('click');
    onConfirm?.();
  }, [onConfirm, playSound]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    playSound('click');
    onCancel?.();
  }, [onCancel, playSound]);

  // Format USD value
  const formatUSD = (value: number): string => {
    if (value === 0) return '$0';
    if (value < 0.01) return '<$0.01';
    if (value < 1) return `$${value.toFixed(4)}`;
    if (value < 1000) return `$${value.toFixed(2)}`;
    if (value < 1000000) return `$${(value / 1000).toFixed(2)}K`;
    if (value < 1000000000) return `$${(value / 1000000).toFixed(2)}M`;
    return `$${(value / 1000000000).toFixed(2)}B`;
  };

  // Get title based on type
  const getTitle = (): string => {
    switch (type) {
      case 'swap':
        return 'Swap Summary';
      case 'add_liquidity':
        return 'Add Liquidity Summary';
      case 'remove_liquidity':
        return 'Remove Liquidity Summary';
      default:
        return 'Transaction Summary';
    }
  };

  // Get confirm button text based on type
  const getConfirmButtonText = (): string => {
    switch (type) {
      case 'swap':
        return 'Confirm Swap';
      case 'add_liquidity':
        return 'Confirm Add Liquidity';
      case 'remove_liquidity':
        return 'Confirm Remove Liquidity';
      default:
        return 'Confirm';
    }
  };

  return (
    <div className={`dex-transaction-summary ${className}`} role="dialog" aria-modal="true" aria-labelledby="transaction-summary-title" aria-label="Transaction summary">
      <header className="transaction-summary-header">
        <h2 id="transaction-summary-title">{getTitle()}</h2>
      </header>

      {swapSummary && (
        <>
          <div className="swap-summary">
            <div className="summary-row">
              <div className="summary-label">You pay</div>
              <div className="summary-value" aria-label={`You pay ${swapSummary.amountIn} ${swapSummary.tokenIn.symbol}`}>
                <span className="summary-amount">{swapSummary.amountIn}</span>
                <span className="summary-token">{swapSummary.tokenIn.symbol}</span>
              </div>
            </div>

            <div className="summary-arrow">↓</div>

            <div className="summary-row">
              <div className="summary-label">You receive</div>
              <div className="summary-value" aria-label={`You receive ${swapSummary.amountOut} ${swapSummary.tokenOut.symbol}`}>
                <span className="summary-amount">{swapSummary.amountOut}</span>
                <span className="summary-token">{swapSummary.tokenOut.symbol}</span>
              </div>
            </div>

            <div className="summary-divider" />

            <div className="summary-row">
              <div className="summary-label">Price</div>
              <div className="summary-value" aria-label={`Price ${swapSummary.price}`}>
                {swapSummary.price}
              </div>
            </div>

            <div className="summary-row">
              <div className="summary-label">Minimum received</div>
              <div className="summary-value" aria-label={`Minimum received ${swapSummary.minimumReceived} ${swapSummary.tokenOut.symbol}`}>
                <span className="summary-amount">{swapSummary.minimumReceived}</span>
                <span className="summary-token">{swapSummary.tokenOut.symbol}</span>
              </div>
            </div>

            <div className="summary-row">
              <div className="summary-label">Price Impact</div>
              <div
                className={`summary-value ${swapSummary.priceImpactWarning ? 'warning' : ''}`}
                aria-label={`Price impact ${swapSummary.priceImpact.toFixed(2)}%`}
              >
                {swapSummary.priceImpact.toFixed(2)}%
                {swapSummary.priceImpactWarning && (
                  <span className="warning-badge">High</span>
                )}
              </div>
            </div>
          </div>

          {swapSummary.priceImpactWarning && (
            <div className="price-impact-warning" role="alert" aria-live="assertive">
              <strong>Warning:</strong> High price impact detected. You may receive significantly less
              than expected. Consider reducing your swap amount or waiting for better liquidity.
            </div>
          )}
        </>
      )}

      {feeSummary && (
        <div className="fee-summary">
          <h3>Fees</h3>

          <div className="summary-row">
            <div className="summary-label">Gas Cost</div>
            <div className="summary-value" aria-label={`Gas cost ${feeSummary.gasCost} (${formatUSD(feeSummary.gasCostUSD)})`}>
              <span className="summary-amount">{feeSummary.gasCost}</span>
              <span className="summary-usd">{formatUSD(feeSummary.gasCostUSD)}</span>
            </div>
          </div>

          {feeSummary.routerFee && (
            <div className="summary-row">
              <div className="summary-label">Router Fee</div>
              <div className="summary-value" aria-label={`Router fee ${feeSummary.routerFee} (${formatUSD(feeSummary.routerFeeUSD)})`}>
                <span className="summary-amount">{feeSummary.routerFee}</span>
                <span className="summary-usd">{formatUSD(feeSummary.routerFeeUSD)}</span>
              </div>
            </div>
          )}

          <div className="summary-divider" />

          <div className="summary-row total">
            <div className="summary-label">Total Cost</div>
            <div className="summary-value" aria-label={`Total cost ${formatUSD(feeSummary.totalCostUSD)}`}>
              <strong>{formatUSD(feeSummary.totalCostUSD)}</strong>
            </div>
          </div>
        </div>
      )}

      <div className="transaction-summary-actions">
        <Button
          className="cancel-button"
          onClick={handleCancel}
          variant="secondary"
          aria-label="Cancel transaction"
        >
          Cancel
        </Button>
        <Button
          className="confirm-button"
          onClick={handleConfirm}
          disabled={swapSummary?.priceImpactWarning}
          aria-label={getConfirmButtonText()}
        >
          {getConfirmButtonText()}
        </Button>
      </div>

      {swapSummary?.priceImpactWarning && (
        <div className="transaction-summary-warning" role="alert" aria-live="polite">
          <strong>⚠️ High Price Impact</strong>
          <p>
            This transaction has a high price impact. You may receive significantly less than expected.
            Consider reducing your swap amount or waiting for better liquidity.
          </p>
        </div>
      )}
    </div>
  );
};

export default DexTransactionSummary;
