import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronUp } from 'lucide-react';
import { Token } from '../types';
import { useStore } from '../contexts/StoreContext';
import { useToast } from './Toast';
import { playSound } from '../services/audio';
import { FEE_PERCENTAGE, GRADUATED_FEE_PERCENTAGE, GRADUATION_MARKETCAP_USD } from '../constants';
import { GraduationOverlay } from './GraduationOverlay';
import { TradeTypeSelector } from './TradeTypeSelector';
import { OrderModeSelector } from './OrderModeSelector';
import { AmountInput } from './AmountInput';
import { QuickSelectGrid } from './QuickSelectGrid';
import { TransactionSummary } from './TransactionSummary';
import { SlippageControl } from './SlippageControl';
import { LimitPriceInput } from './LimitPriceInput';
import { InfoBanner } from './InfoBanner';

interface MobileTradingSheetProps {
  token: Token;
  isOpen: boolean;
  onClose: () => void;
  initialTradeType?: 'buy' | 'sell' | 'burn' | 'karma';
  initialAmount?: string;
  onSuccess?: () => void;
}

export const MobileTradingSheet: React.FC<MobileTradingSheetProps> = ({
  token,
  isOpen,
  onClose,
  initialTradeType = 'buy',
  initialAmount,
  onSuccess,
}) => {
  const {
    buyToken,
    sellToken,
    burnToken,
    lockForKarma,
    placeOrder,
    userBalanceDC,
    myHoldings,
    settings,
    networkStats,
    updateSettings,
  } = useStore();
  const { addToast } = useToast();

  const [tradeType, setTradeType] = useState<'buy' | 'sell' | 'burn' | 'karma'>(initialTradeType);
  const [orderMode, setOrderMode] = useState<'market' | 'limit' | 'stop'>('market');
  const [amount, setAmount] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [slippage, setSlippage] = useState(settings.slippage);
  const [showSlippageSettings, setShowSlippageSettings] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<{ amount?: string; price?: string }>({});
  const [showGraduation, setShowGraduation] = useState(false);
  const [dismissedInfo, setDismissedInfo] = useState<{ burn?: boolean; karma?: boolean }>({});

  const userTokenBalance = myHoldings.find((h) => h.tokenId === token.id)?.balance || 0;
  const isGraduated = token.progress >= 100;
  const currentPrice = token.price;

  // Handle Copy Trade pre-fill
  useEffect(() => {
    if (initialAmount) {
      setAmount(initialAmount);
      setTradeType('buy');
      setOrderMode('market');
      if (settings.audioEnabled) playSound('click');
    }
  }, [initialAmount, settings.audioEnabled]);

  // Reset logic when trade type changes
  useEffect(() => {
    if (tradeType === 'burn' || tradeType === 'karma') {
      setOrderMode('market');
    }
    setErrors({});
  }, [tradeType, orderMode]);

  // Sync with global settings if they change
  useEffect(() => {
    setSlippage(settings.slippage);
  }, [settings.slippage]);

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const validateInputs = () => {
    const newErrors: { amount?: string; price?: string } = {};
    let isValid = true;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = 'Required';
      isValid = false;
    }

    if ((orderMode === 'limit' || orderMode === 'stop') &&
        (!limitPrice || isNaN(Number(limitPrice)) || Number(limitPrice) <= 0)) {
      newErrors.price = 'Required';
      isValid = false;
    }

    // Check balances
    if (tradeType === 'buy' && Number(amount) > userBalanceDC) {
      newErrors.amount = 'Insufficient $DC';
      isValid = false;
    }
    if ((tradeType === 'sell' || tradeType === 'burn' || tradeType === 'karma') &&
        Number(amount) > userTokenBalance) {
      newErrors.amount = `Insufficient ${token.ticker}`;
      isValid = false;
    }

    setErrors(newErrors);
    if (!isValid && settings.audioEnabled) playSound('error');
    return isValid;
  };

  const handleTrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setIsProcessing(true);
    if (settings.audioEnabled) playSound('click');

    // Use Fast Mode setting to reduce delay
    const delay = settings.fastMode ? 100 : 600;

    setTimeout(() => {
      setIsProcessing(false);

      const tradeAmount = parseFloat(amount);
      const price = parseFloat(limitPrice);

      if (orderMode === 'market') {
        if (tradeType === 'buy') {
          buyToken(token.id, tradeAmount);
          // Check graduation
          const estimatedNewMC = token.marketCap + tradeAmount;
          if ((estimatedNewMC / GRADUATION_MARKETCAP_USD) * 100 >= 100) {
            setShowGraduation(true);
            if (settings.audioEnabled) playSound('launch');
          } else {
            if (settings.audioEnabled) playSound('success');
          }
        } else if (tradeType === 'sell') {
          sellToken(token.id, tradeAmount);
          if (settings.audioEnabled) playSound('success');
        } else if (tradeType === 'burn') {
          burnToken(token.id, tradeAmount);
          if (settings.audioEnabled) playSound('launch');
        } else if (tradeType === 'karma') {
          lockForKarma(token.id, tradeAmount);
        }

        const actionLabel = tradeType === 'buy' ? 'Buy' : tradeType === 'sell' ? 'Sell' : tradeType === 'karma' ? 'Lock' : 'Burn';
        addToast('success', `${actionLabel} executed successfully!`, 'Trade Confirmed');
      } else {
        // Execute Limit/Stop Order logic via Store
        placeOrder(token.id, tradeType === 'burn' ? 'sell' : tradeType === 'karma' ? 'sell' : tradeType, orderMode, tradeAmount, price);
        if (settings.audioEnabled) playSound('success');
        addToast('success', 'Order placed successfully!', 'Order Confirmed');
      }

      setAmount('');
      setLimitPrice('');
      setErrors({});
      if (onSuccess) onSuccess();
      onClose();
    }, delay);
  };

  const handleMax = () => {
    if (settings.audioEnabled) playSound('click');
    if (tradeType === 'buy') {
      setAmount((userBalanceDC * 0.99).toFixed(2));
    } else {
      setAmount(userTokenBalance.toString());
    }
    setErrors({ ...errors, amount: undefined });
  };

  const handleQuickSelect = (percentage: number) => {
    const bal = tradeType === 'buy' ? userBalanceDC : userTokenBalance;
    setAmount((bal * (percentage / 100)).toFixed(2));
    setErrors({});
  };

  const handleSlippageChange = (value: string) => {
    setSlippage(value);
    updateSettings({ slippage: value });
  };

  const executionPrice = orderMode === 'limit' && limitPrice ? parseFloat(limitPrice) : currentPrice;
  const estimatedReceive = amount && executionPrice > 0
    ? (parseFloat(amount) / (tradeType === 'buy' ? executionPrice : 1 / executionPrice)).toFixed(2)
    : '0.00';

  const fee = amount
    ? (parseFloat(amount) * (token.progress >= 100 ? GRADUATED_FEE_PERCENTAGE : FEE_PERCENTAGE)).toFixed(4)
    : '0.0000';

  // Calculate estimated network fee based on gas price
  const networkFee = (21000 * networkStats.gasPrice / 1e9).toFixed(6);

  const isBuy = tradeType === 'buy';
  const isBurn = tradeType === 'burn';
  const isKarma = tradeType === 'karma';

  const bgColor = isBuy
    ? 'bg-green-500'
    : isBurn
      ? 'bg-orange-500'
      : isKarma
        ? 'bg-purple-600'
        : 'bg-red-500';

  if (!isOpen) return null;

  return (
    <>
      <GraduationOverlay
        isOpen={showGraduation}
        onClose={() => setShowGraduation(false)}
        tokenName={token.name}
        ticker={token.ticker}
        imageUrl={token.imageUrl}
      />

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[80] lg:hidden bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[81] lg:hidden flex flex-col justify-end"
        onClick={(e) => {
          // Close if clicking directly on sheet container (outside of content)
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div
          className="relative bg-[#0A0A0A] border-t border-white/10 rounded-t-3xl shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto"
          onClick={(e) => {
            // Prevent clicks on sheet content from closing the sheet
            e.stopPropagation();
          }}
          style={{ paddingTop: '80px' }}
        >
          {/* Drag Handle */}
          <div className="flex justify-center pt-2 pb-0">
            <div className="w-12 h-1.5 bg-gray-700 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex justify-between items-center px-4 pb-1">
            <h3 className="text-lg font-bold text-white font-comic">Trade {token.ticker}</h3>
            <button
              onClick={() => {
                onClose();
              }}
              className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
              aria-label="Close trading sheet"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleTrade} className="px-4 pb-4 space-y-4 relative">
            {/* Decorative Background */}
            <div
              className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-full blur-[100px] opacity-10 pointer-events-none transition-colors duration-500 ${bgColor}`}
            ></div>

            {/* Trade Type Selector */}
            <TradeTypeSelector value={tradeType} onChange={setTradeType} disabled={isProcessing} />

            {/* Order Mode Selector */}
            <div className="relative z-10">
              <OrderModeSelector value={orderMode} onChange={setOrderMode} tradeType={tradeType} disabled={isProcessing} />
            </div>

            {/* Info Banners */}
            <div className="relative z-10">
              {tradeType === 'burn' && !dismissedInfo.burn && (
                <InfoBanner
                  type="burn"
                  onClose={() => setDismissedInfo({ ...dismissedInfo, burn: true })}
                />
              )}
              {tradeType === 'karma' && !dismissedInfo.karma && (
                <InfoBanner
                  type="karma"
                  onClose={() => setDismissedInfo({ ...dismissedInfo, karma: true })}
                />
              )}
            </div>

            {/* Limit/Trigger Input */}
            {(orderMode === 'limit' || orderMode === 'stop') && tradeType !== 'burn' && tradeType !== 'karma' && (
              <div className="relative z-10">
                <LimitPriceInput
                  value={limitPrice}
                  onChange={(value) => {
                    setLimitPrice(value);
                    setErrors({ ...errors, price: undefined });
                  }}
                  mode={orderMode}
                  currentPrice={currentPrice}
                  error={errors.price}
                  tradeType={tradeType}
                />
              </div>
            )}

            {/* Amount Input */}
            <div className="relative z-10">
              <AmountInput
                id="mobile-trade-amount"
                value={amount}
                onChange={setAmount}
                currency={tradeType === 'buy' ? '$DC' : token.ticker}
                onMaxClick={handleMax}
                error={errors.amount}
                disabled={isProcessing}
                autoFocus
                tradeType={tradeType}
              />
            </div>

            {/* Quick Select Grid */}
            <div className="relative z-10">
              <QuickSelectGrid percentages={[25, 50, 75, 100]} onSelect={handleQuickSelect} disabled={isProcessing} />
            </div>

            {/* Transaction Summary */}
            <div className="relative z-10">
              <TransactionSummary
                estimatedReceive={estimatedReceive}
                receiveCurrency={tradeType === 'buy' ? token.ticker : '$DC'}
                protocolFee={fee}
                networkFee={networkFee}
                slippage={slippage}
                onSlippageClick={() => {
                  setShowSlippageSettings(!showSlippageSettings);
                  if (settings.audioEnabled) playSound('click');
                }}
                onSlippageChange={handleSlippageChange}
                tradeType={tradeType}
              />
            </div>

            {/* Action Button */}
            <div className="relative z-10">
              <button
                type="submit"
                disabled={isProcessing}
                className={`w-full h-14 text-base uppercase tracking-widest font-bold shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] rounded-xl border-0 relative overflow-hidden min-h-[56px] ${
                  tradeType === 'buy' ? 'shadow-[0_0_25px_rgba(0,224,84,0.2)]' :
                  tradeType === 'burn' ? 'shadow-[0_0_25px_rgba(234,88,12,0.2)]' :
                  tradeType === 'karma' ? 'shadow-[0_0_25px_rgba(147,51,234,0.2)]' :
                  'shadow-[0_0_25px_rgba(255,59,48,0.2)]'
                }`}
                style={{
                  backgroundColor: isBuy ? '#00E054' : isBurn ? '#ea580c' : isKarma ? '#9333ea' : '#FF3B30',
                  color: isBurn || isKarma ? 'white' : isBuy ? 'black' : 'white',
                }}
                aria-label={isProcessing ? 'Processing trade' : 'Execute trade'}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000"></div>
                {isProcessing ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <>
                    {tradeType === 'burn' ? 'Burn Tokens' :
                      tradeType === 'karma' ? 'Lock for Karma' :
                      orderMode === 'stop' && tradeType === 'buy' ? `Trigger Buy @ $${limitPrice}` :
                      orderMode !== 'market' ? `Place ${orderMode}` :
                      (tradeType === 'buy' ? 'Buy' : 'Sell')}
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Safe Area Padding */}
          <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
      </div>
    </>
  );
};
