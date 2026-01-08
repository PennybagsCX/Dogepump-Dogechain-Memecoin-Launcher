
import React, { useState, useEffect, useRef } from 'react';
import { Wallet, Settings, AlertTriangle, XCircle, Rocket, ExternalLink, Keyboard, Flame, Fuel, Sparkles, TrendingUp } from 'lucide-react';
import { Token, Order } from '../types';
import { Button } from './Button';
import { useStore } from '../contexts/StoreContext';
import { useToast } from './Toast';
import { playSound } from '../services/audio';
import { formatNumber } from '../services/web3Service';
import { FEE_PERCENTAGE, GRADUATED_FEE_PERCENTAGE, GRADUATION_MARKETCAP_USD } from '../constants';
import { GraduationOverlay } from './GraduationOverlay';

interface TradeFormProps {
  token: Token;
  onSuccess?: () => void;
  initialAmount?: string; // Prop for Copy Trade
}

const TradeFormComponent: React.FC<TradeFormProps> = ({ token, onSuccess, initialAmount }) => {
  const { buyToken, sellToken, burnToken, lockForKarma, placeOrder, userBalanceDC, myHoldings, settings, networkStats } = useStore();
  const { addToast } = useToast();
  
  const [tradeType, setTradeType] = useState<'buy' | 'sell' | 'burn' | 'karma'>('buy');
  const [orderMode, setOrderMode] = useState<'market' | 'limit' | 'stop'>('market');
  const [amount, setAmount] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  // Use global settings slippage as initial value
  const [slippage, setSlippage] = useState(settings.slippage);
  const [showSettings, setShowSettings] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<{ amount?: string; price?: string }>({});
  const [showGraduation, setShowGraduation] = useState(false);
  const [copyFlash, setCopyFlash] = useState(false);

  const userTokenBalance = myHoldings.find(h => h.tokenId === token.id)?.balance || 0;
  const isGraduated = token.progress >= 100;
  const currentPrice = token.price;

  // Handle Copy Trade pre-fill
  useEffect(() => {
    if (initialAmount) {
      setAmount(initialAmount);
      setTradeType('buy'); 
      setOrderMode('market');
      if (settings.audioEnabled) playSound('click');
      setCopyFlash(true);
      setTimeout(() => setCopyFlash(false), 1000);
    }
  }, [initialAmount]);

  // Keyboard Shortcuts (B / S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key.toLowerCase() === 'b') {
        setTradeType('buy');
        if (settings.audioEnabled) playSound('hover');
      } else if (e.key.toLowerCase() === 's') {
        setTradeType('sell');
        if (settings.audioEnabled) playSound('hover');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings.audioEnabled]);

  // Reset logic
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
    if ((tradeType === 'sell' || tradeType === 'burn' || tradeType === 'karma') && Number(amount) > userTokenBalance) {
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
      }
      
      setAmount('');
      setLimitPrice('');
      setErrors({});
      if (onSuccess) onSuccess();
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

  const executionPrice = orderMode === 'limit' && limitPrice ? parseFloat(limitPrice) : currentPrice;
  const estimatedReceive = amount && executionPrice > 0 
    ? (parseFloat(amount) / (tradeType === 'buy' ? executionPrice : 1/executionPrice)).toFixed(2) 
    : '0.00';
  
  const fee = amount 
    ? (parseFloat(amount) * (token.progress >= 100 ? GRADUATED_FEE_PERCENTAGE : FEE_PERCENTAGE)).toFixed(4) 
    : '0.0000';

  // Calculate estimated network fee based on gas price (approx 21000 gas for transfer * price)
  // Scaled down for DC display
  const networkFee = (21000 * networkStats.gasPrice / 1e9).toFixed(6);

  const isBuy = tradeType === 'buy';
  const isBurn = tradeType === 'burn';
  const isKarma = tradeType === 'karma';
  
  const accentBorder = isBuy 
    ? 'focus-within:border-doge-success/50' 
    : isBurn 
        ? 'focus-within:border-orange-500/50'
        : isKarma
            ? 'focus-within:border-purple-500/50'
            : 'focus-within:border-doge-error/50';

  const bgColor = isBuy 
    ? 'bg-green-500' 
    : isBurn 
        ? 'bg-orange-500' 
        : isKarma
            ? 'bg-purple-600'
            : 'bg-red-500';

  return (
    <div className={`relative transition-colors duration-500 ${copyFlash ? 'bg-white/10' : ''}`}>
      <GraduationOverlay 
         isOpen={showGraduation} 
         onClose={() => setShowGraduation(false)} 
         tokenName={token.name} 
         ticker={token.ticker} 
         imageUrl={token.imageUrl} 
      />

      {isGraduated && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-center p-6 space-y-4 rounded-xl">
            <div className="w-16 h-16 bg-doge rounded-full flex items-center justify-center mb-2 shadow-[0_0_30px_#D4AF37]">
                <Rocket size={32} className="text-black" />
            </div>
            <h3 className="text-2xl font-comic font-bold text-white">Launched!</h3>
            <p className="text-gray-400 text-sm">Trading has moved to the decentralized exchange.</p>
            <Button className="w-full gap-2">
                Trade on DogeSwap <ExternalLink size={16} />
            </Button>
          </div>
      )}

      {/* Switcher */}
      <div className="grid grid-cols-2 sm:grid-cols-4 bg-black/40 border-b border-white/10 p-2 gap-1 rounded-t-2xl">
          <button 
            type="button"
            onClick={() => { setTradeType('buy'); if (settings.audioEnabled) playSound('click'); }}
            className={`py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 relative overflow-hidden ${
              tradeType === 'buy' 
                ? 'text-black bg-doge-success shadow-[0_0_15px_rgba(0,224,84,0.4)]' 
                : 'text-gray-500 hover:bg-white/5'
            }`}
          >
            Buy
          </button>
          <button 
            type="button"
            onClick={() => { setTradeType('sell'); if (settings.audioEnabled) playSound('click'); }}
            className={`py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 relative overflow-hidden ${
              tradeType === 'sell' 
                ? 'text-white bg-doge-error shadow-[0_0_15px_rgba(255,59,48,0.4)]' 
                : 'text-gray-500 hover:bg-white/5'
            }`}
          >
            Sell
          </button>
          <button 
            type="button"
            onClick={() => { setTradeType('burn'); if (settings.audioEnabled) playSound('click'); }}
            className={`py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 relative overflow-hidden ${
              tradeType === 'burn' 
                ? 'text-white bg-orange-600 shadow-[0_0_15px_rgba(234,88,12,0.4)]' 
                : 'text-gray-500 hover:bg-white/5'
            }`}
          >
             Burn
          </button>
          <button 
            type="button"
            onClick={() => { setTradeType('karma'); if (settings.audioEnabled) playSound('click'); }}
            className={`py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 relative overflow-hidden ${
              tradeType === 'karma' 
                ? 'text-white bg-purple-600 shadow-[0_0_15px_rgba(147,51,234,0.4)]' 
                : 'text-gray-500 hover:bg-white/5'
            }`}
          >
             Karma
          </button>
      </div>

      <div className="p-6 space-y-6 relative bg-[#0A0A0A] rounded-b-2xl">
          {/* Decorative Background */}
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-full blur-[100px] opacity-10 pointer-events-none transition-colors duration-500 ${bgColor}`}></div>

          {/* Order Type Selector */}
          {tradeType !== 'burn' && tradeType !== 'karma' && (
             <div className="flex p-1 rounded-xl bg-white/[0.03] border border-white/10 relative z-10">
               {['market', 'limit', 'stop'].map((mode) => (
                   <button
                     key={mode}
                     type="button"
                     onClick={() => { setOrderMode(mode as any); if (settings.audioEnabled) playSound('click'); }}
                     className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${
                       orderMode === mode
                         ? 'bg-white/10 text-white shadow-sm border border-white/10'
                         : 'text-gray-500 hover:text-gray-300'
                     }`}
                   >
                     {mode === 'stop' && tradeType === 'buy' ? 'Stop Buy' : mode === 'stop' ? 'Stop Loss' : mode}
                   </button>
               ))}
             </div>
          )}

          <form onSubmit={handleTrade} className="space-y-2 relative z-10 overflow-hidden">
              {/* Notification Tiles */}
              {tradeType === 'burn' && (
                 <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 flex items-center gap-3 mb-2">
                     <Flame className="text-orange-500 shrink-0" size={20} />
                     <div className="text-xs text-orange-200">
                        <span className="font-bold block">Burn for Status</span>
                        Permanently destroy tokens to reduce supply.
                     </div>
                 </div>
              )}

              {tradeType === 'karma' && (
                 <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 flex items-center gap-3 mb-8">
                     <Sparkles className="text-purple-500 shrink-0" size={20} />
                     <div className="text-xs text-purple-200">
                        <span className="font-bold block">Lock for Karma</span>
                        Lock tokens to earn Karma points for future airdrops.
                     </div>
                 </div>
              )}
              {/* Limit/Trigger Input */}
              {(orderMode === 'limit' || orderMode === 'stop') && tradeType !== 'burn' && tradeType !== 'karma' && (
                <div className="animate-slide-up">
                  <div className="flex justify-between text-xs font-bold uppercase text-gray-500 px-1 mb-1.5">
                      <span className={orderMode === 'stop' ? 'text-blue-400' : ''}>
                          {orderMode === 'stop' ? 'Trigger Price' : 'Limit Price'}
                      </span>
                      <span className="cursor-pointer hover:text-doge transition-colors" onClick={() => setLimitPrice(currentPrice.toFixed(8))}>Set to Market</span>
                  </div>
                  <div className={`relative group bg-[#050505] border rounded-2xl transition-all ${errors.price ? 'border-red-500' : `border-white/10 ${accentBorder}`}`}>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-mono font-bold">$</div>
                    <input
                      id="trade-limit-price"
                      name="trade-limit-price"
                      type="number"
                      placeholder="0.00000000"
                      value={limitPrice}
                      onChange={(e) => { setLimitPrice(e.target.value); setErrors({...errors, price: undefined}); }}
                      className="w-full bg-transparent py-4 pl-8 pr-4 text-white text-right font-mono font-bold outline-none text-sm group-hover:bg-white/[0.02] transition-colors rounded-2xl"
                      min="0"
                      step="0.00000001"
                    />
                  </div>
                  {orderMode === 'stop' && tradeType === 'buy' && (
                      <p className="text-xs text-green-400 px-1 mt-1 flex items-center gap-1">
                          <TrendingUp size={10} /> Buy if price rises to ${limitPrice || '0.00'}
                      </p>
                  )}
                  {errors.price && <p className="text-xs text-red-500 px-1 mt-1 flex items-center gap-1"><AlertTriangle size={10}/> {errors.price}</p>}
                </div>
              )}

              {/* Amount Input */}
              <div>
                <div className="flex justify-between items-center px-1 mb-1.5">
                  <label htmlFor="trade-amount" className="text-xs font-bold text-gray-500 uppercase">Amount</label>
                </div>

                <div className={`relative group bg-[#050505] border border-white/10 rounded-2xl overflow-hidden transition-all ${errors.amount ? 'border-red-500' : `${accentBorder}`}`}>
                  <input
                    id="trade-amount"
                    name="trade-amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); setErrors({...errors, amount: undefined}); }}
                    className="w-full bg-transparent py-5 pl-4 pr-24 text-white text-2xl font-mono font-bold outline-none group-hover:bg-white/[0.02] transition-colors rounded-2xl"
                    min="0"
                    step="0.000001"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      {(tradeType === 'buy' || tradeType === 'sell' || tradeType === 'burn' || tradeType === 'karma') && (
                        <button
                          type="button"
                          onClick={handleMax}
                          className="text-xs bg-doge/10 text-doge px-2 py-1 rounded hover:bg-doge/20 transition-colors font-bold"
                        >
                          MAX
                        </button>
                    )}
                    <span className="text-xs font-bold text-gray-500 uppercase" title="Token ticker symbol">
                      {tradeType === 'buy' ? '$DC' : token.ticker}
                    </span>
                  </div>
                </div>
                {errors.amount && <p className="text-xs text-red-500 px-1 mt-1 flex items-center gap-1"><AlertTriangle size={10}/> {errors.amount}</p>}
              </div>

              {/* Quick Select Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[25, 50, 75, 100].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        const bal = tradeType === 'buy' ? userBalanceDC : userTokenBalance;
                        setAmount((bal * (val/100)).toFixed(2));
                        setErrors({});
                        if (settings.audioEnabled) playSound('click');
                      }}
                      className="min-h-[44px] bg-white/[0.03] rounded-lg text-xs font-mono text-gray-500 hover:bg-white/10 hover:text-white transition-colors border border-white/10 hover:border-white/20"
                    >
                      {val}%
                    </button>
                ))}
              </div>

              {/* Transaction Summary */}
              {tradeType !== 'burn' && tradeType !== 'karma' && (
                <div className="bg-black/40 rounded-xl p-4 space-y-2 border border-white/10 text-xs relative overflow-hidden group">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Receive (Est.)</span>
                    <span className="text-white font-mono font-bold tracking-wide text-sm">~ {estimatedReceive} <span className="text-gray-600 text-xs">{tradeType === 'buy' ? token.ticker : '$DC'}</span></span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Protocol Fee</span>
                    <span className="text-gray-500 font-mono">{fee} $DC</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium flex items-center gap-1"><Fuel size={10}/> Network Fee</span>
                    <span className="text-gray-500 font-mono">~{networkFee} $DC</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-white/10">
                    <span 
                      className="text-gray-500 flex items-center gap-1 cursor-pointer group-hover:text-gray-400 transition-colors"
                      onClick={() => { setShowSettings(!showSettings); if (settings.audioEnabled) playSound('click'); }}
                    >
                      Slippage <Settings size={10} className="transition-transform group-hover:rotate-90"/>
                    </span>
                    <span 
                      className="text-doge font-mono bg-doge/10 px-1.5 py-0.5 rounded text-xs cursor-pointer hover:bg-doge/20 transition-colors"
                      onClick={() => { setShowSettings(!showSettings); if (settings.audioEnabled) playSound('click'); }}
                    >
                      {slippage}%
                    </span>
                  </div>
                  {/* Slippage Settings Popover */}
                  {showSettings && (
                    <div className="absolute inset-0 bg-[#0A0A0A] p-4 z-20 animate-fade-in flex flex-col justify-center gap-2">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold uppercase text-white">Set Slippage</span>
                          <button type="button" onClick={() => setShowSettings(false)}><XCircle size={14} className="text-gray-500 hover:text-white"/></button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {['0.5', '1', '2', '5'].map(val => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => { setSlippage(val); setShowSettings(false); if (settings.audioEnabled) playSound('click'); }}
                                className={`min-h-[44px] rounded-lg text-xs font-bold border ${slippage === val ? 'bg-doge text-black border-doge' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                              >
                                {val}%
                              </button>
                          ))}
                        </div>
                    </div>
                  )}
                </div>
              )}

              <Button
                type="submit"
                className={`w-full py-4 text-lg font-bold shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] rounded-xl border-0 relative overflow-hidden ${
                   tradeType === 'buy' ? 'shadow-[0_0_25px_rgba(0,224,84,0.2)]' :
                   tradeType === 'burn' ? 'shadow-[0_0_25px_rgba(234,88,12,0.2)]' :
                   tradeType === 'karma' ? 'shadow-[0_0_25px_rgba(147,51,234,0.2)]' :
                   'shadow-[0_0_25px_rgba(255,59,48,0.2)]'}`}
                variant={tradeType === 'buy' ? 'primary' : 'danger'}
                isLoading={isProcessing}
                style={{ backgroundColor: isBuy ? '#00E054' : isBurn ? '#ea580c' : isKarma ? '#9333ea' : '#FF3B30', color: isBurn || isKarma ? 'white' : isBuy ? 'black' : 'white' }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000"></div>
                {
                    tradeType === 'burn' ? 'Burn Tokens' : 
                    tradeType === 'karma' ? 'Lock for Karma' :
                    orderMode === 'stop' && tradeType === 'buy' ? `Trigger Buy @ $${limitPrice}` :
                    orderMode !== 'market' ? `Place ${orderMode}` : 
                    (tradeType === 'buy' ? 'Buy' : 'Sell')
                }
              </Button>
          </form>
      </div>
    </div>
  );
};

// Memoize with custom comparison for performance optimization
export const TradeForm = React.memo(TradeFormComponent, (prevProps, nextProps) => {
  return prevProps.token.id === nextProps.token.id &&
    prevProps.token.price === nextProps.token.price &&
    prevProps.initialAmount === nextProps.initialAmount;
});

TradeForm.displayName = 'TradeForm';
