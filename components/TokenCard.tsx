 
import React, { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Zap, Crown, Check, Users, Rocket, Flame } from 'lucide-react';
import { Token } from '../types';
import { formatCurrency } from '../services/web3Service';
import { timeAgo, formatNumber } from '../utils';
import { playSound } from '../services/audio';
import { Sparkline } from './Sparkline';
import { useStore } from '../contexts/StoreContext';
import { Button } from './Button';
import { useToast } from './Toast';
import { ConfirmModal } from './ConfirmModal';
import { OptimizedImage } from './OptimizedImage';
import { FILTER_THRESHOLDS } from '../constants/homeConstants';
 
interface TokenCardProps {
  token: Token;
  preview?: boolean;
}

const TokenCardComponent: React.FC<TokenCardProps> = ({ token, preview = false }) => {
  const isGraduated = token.progress >= 100;
 
  // Recency Checks (for visuals)
  const now = Date.now();
  const isNew = now - token.createdAt < FILTER_THRESHOLDS.ONE_HOUR_MS;
  const isRecentlyBoosted = token.lastBoostedAt ? (now - token.lastBoostedAt < FILTER_THRESHOLDS.RECENT_BOOST_MS) : false;
  const isRecentlyBurned = token.lastBurnedAt ? (now - token.lastBurnedAt < FILTER_THRESHOLDS.RECENT_BOOST_MS) : false;
  const isBoosted = (token.boosts || 0) > 0;
  const isLive = token.isLive === true;
 
  const { priceHistory, buyToken, userBalanceDC } = useStore();
  const { addToast } = useToast();
  const [showQuickBuy, setShowQuickBuy] = useState(false);
  const [buyingAmount, setBuyingAmount] = useState<number | null>(null);
  const [pendingBuyAmount, setPendingBuyAmount] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Extract sparkline data
  const sparkData = useMemo(() => {
    if (preview) {
       return [10, 12, 11, 14, 13, 15, 16, 18, 17, 20];
    } else {
       const history = priceHistory[token.id] || [];
       return history.map(p => p.price);
    }
  }, [preview, priceHistory, token.id]);

  const executeBuy = useCallback(async (amount: number) => {
    try {
      buyToken(token.id, amount);
      playSound('success');
      addToast('success', `Aped ${amount} DC into ${token.ticker || 'token'}!`);
      setShowQuickBuy(false);
    } catch (error) {
      playSound('error');
      addToast('error', 'Transaction failed. Please try again.');
    } finally {
      setBuyingAmount(null);
      setPendingBuyAmount(null);
    }
  }, [buyToken, token.id, token.ticker, addToast]);

  const handleQuickBuy = useCallback((amount: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (preview) return;
    if (userBalanceDC < amount) {
        addToast('error', 'Insufficient Balance');
        playSound('error');
        return;
    }

    setBuyingAmount(amount);
    playSound('click');

    // Show confirmation modal for amounts > 100 DC
    if (amount > 100) {
      setPendingBuyAmount(amount);
      setShowConfirmModal(true);
    } else {
      // Execute immediately for smaller amounts
      executeBuy(amount);
    }
  }, [preview, userBalanceDC, executeBuy, addToast]);

  const toggleQuickBuy = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowQuickBuy(!showQuickBuy);
    playSound('click');
  }, [showQuickBuy]);

  // Determine container classes for Visual Hierarchy
  // Priority: LIVE (Red) > Recently Burned (Orange) > Recently Boosted (Gold) > Graduated (Purple) > New (Green) > Standard
  const containerClasses = useMemo(() => {
    let borderClass = 'border-white/10 hover:border-doge/40';
    let shadowClass = '';
    let ringClass = '';

    if (isLive) {
        borderClass = 'border-red-500/60';
        shadowClass = 'shadow-[0_0_30px_rgba(239,68,68,0.4)]';
        ringClass = 'ring-1 ring-red-500/40';
    } else if (isRecentlyBurned) {
        borderClass = 'border-orange-500/60';
        shadowClass = 'shadow-[0_0_30px_rgba(249,115,22,0.4)]';
        ringClass = 'ring-1 ring-orange-500/40';
    } else if (isRecentlyBoosted) {
        borderClass = 'border-doge/60';
        shadowClass = 'shadow-[0_0_30px_rgba(212,175,55,0.4)]';
        ringClass = 'ring-1 ring-doge/40';
    } else if (isGraduated) {
        borderClass = 'border-purple-500/50';
        shadowClass = 'shadow-[0_0_20px_rgba(168,85,247,0.3)]';
    } else if (isNew) {
        borderClass = 'border-green-500/40';
        shadowClass = 'shadow-[0_0_20px_rgba(34,197,94,0.2)]';
    } else if (isBoosted) {
        // Standard boosted (not recent flash)
        borderClass = 'border-doge/40';
        shadowClass = 'shadow-[0_0_15px_rgba(212,175,55,0.1)]';
    }

    return `relative flex flex-col h-full bg-[#0A0A0A] border rounded-[1.4rem] overflow-hidden transition-all duration-300 
      ${!preview && 'hover:-translate-y-2 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,1)]'} 
      ${borderClass} ${shadowClass} ${ringClass}
    `;
  }, [isLive, isRecentlyBurned, isRecentlyBoosted, isGraduated, isNew, isBoosted, preview]);
 
  const CardContent = (
    <div className={containerClasses}>
 
      {/* Quick Buy Overlay */}
      <div
        className={`absolute inset-0 bg-black/90 backdrop-blur-md z-20 flex flex-col items-center justify-center p-6 transition-opacity duration-300 ${showQuickBuy ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowQuickBuy(false); }}
      >
         <div className="text-center mb-6 space-y-1">
             <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-doge text-black mb-2 animate-bounce-subtle">
                 <Zap size={24} fill="black" />
             </div>
             <h3 className="text-xl font-comic font-bold text-white">Quick Ape</h3>
             <p className="text-xs text-gray-400">Instant buy. No confirmation.</p>
         </div>
 
         <div className="grid grid-cols-1 w-full gap-3">
             {[50, 100, 500].map(amount => (
                 <Button
                    key={amount}
                     variant="secondary"
                     className="w-full justify-between group/btn hover:border-doge hover:bg-doge/10"
                     onClick={(e) => handleQuickBuy(amount, e)}
                     disabled={buyingAmount !== null}
                 >
                    <span className="font-mono font-bold">{amount} DC</span>
                    {buyingAmount === amount ? (
                        <span className="animate-spin">⏳</span>
                    ) : (
                        <span className="text-gray-500 group-hover/btn:text-doge transition-colors">Buy</span>
                    )}
                 </Button>
             ))}
         </div>
      </div>
 
      {/* Card Header */}
      <div className="p-6 flex gap-5 relative overflow-hidden pb-4">
        {/* Background Glows based on state */}
        <div className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 transition-colors
            ${isLive ? 'bg-red-500/25' :
              isRecentlyBurned ? 'bg-orange-500/20' :
              isRecentlyBoosted ? 'bg-doge/20' :
              isGraduated ? 'bg-purple-500/20' :
              isNew ? 'bg-green-500/10' :
              'bg-doge/5 group-hover:bg-doge/10'}`}></div>
 
        <div className="relative shrink-0">
          <div className={`relative w-20 h-20 rounded-2xl overflow-hidden shadow-lg group-hover:scale-105 transition-transform duration-500 ${isGraduated ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-gray-900' : ''}`}>
             <OptimizedImage
                src={token.imageUrl || '/images/default-token.svg'}
                alt={token.name || 'Token'}
                width={80}
                height={80}
                className="w-full h-full object-cover bg-gray-800"
            />
          </div>
            {isGraduated && (
               <div className="absolute -bottom-2 -right-2 bg-purple-600 text-white p-1 rounded-full border border-black shadow-lg z-10 animate-bounce-subtle">
                    <Crown size={12} fill="white" />
                 </div>
            )}
            {!isGraduated && isRecentlyBurned && (
                <div className="absolute -bottom-2 -right-2 bg-orange-500 text-white p-1 rounded-full border border-black shadow-lg z-10 animate-pulse">
                    <Flame size={12} fill="white" />
                </div>
            )}
            {!isGraduated && !isRecentlyBurned && isBoosted && (
               <div className="absolute -bottom-2 -right-2 bg-doge text-black p-1 rounded-full border border-black shadow-lg z-10 flex items-center gap-0.5 px-1.5">
                    <Rocket size={10} fill="black" />
                    {token.boosts && token.boosts > 1 && <span className="text-[8px] font-bold">{token.boosts}</span>}
               </div>
            )}
        </div>
 
        <div className="flex flex-col min-w-0 relative z-10 justify-between py-0.5 w-full">
            <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-xl text-white truncate group-hover:text-doge transition-colors font-comic leading-tight max-w-[120px]">
                  {token.name || 'Token Name'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono text-gray-300 font-bold bg-white/5 px-1.5 py-0.5 rounded border border-white/5 group-hover:border-doge/30 transition-colors">${token.ticker || 'TICKER'}</span>
                  </div>
                </div>
 
                <div className="flex flex-col items-end gap-1">
                    {/* Sparkline placed in header */}
                    <div className="w-[60px] h-[20px] opacity-70 group-hover:opacity-100 transition-opacity">
                        <Sparkline data={sparkData} width={60} height={20} />
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2 mt-1">
               <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${isNew ? 'text-green-400' : 'text-gray-500'}`}>
                  <Activity size={10} /> {preview ? 'Just now' : timeAgo(token.createdAt)}
               </span>
               {token.creator === 'You' ? (
                  <span className="bg-doge/20 text-doge px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border border-doge/20">You</span>
               ) : (
                  <button
                     onClick={(e) => { e.stopPropagation(); window.location.hash = `/profile/${token.creator}`; }}
                     className="text-[9px] text-gray-500 hover:text-white flex items-center gap-0.5 z-20 bg-transparent border-none cursor-pointer"
                  >
                     <Users size={10} /> {token.creator.slice(0,4)}
                  </button>
               )}
            </div>
        </div>
      </div>
 
      <div className="mt-auto p-6 pt-0 space-y-4">
         <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed h-8 font-medium">
              {token.description || 'No description provided.'}
         </p>
 
         {/* Stats Grid */}
         <div className="grid grid-cols-2 gap-2 py-2 border-y border-white/5">
            <div className="bg-white/[0.02] p-2 rounded-lg group-hover:bg-white/[0.04] transition-colors">
              <div className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Market Cap</div>
              <div className="text-sm font-mono text-white font-bold">{formatCurrency(token.marketCap)}</div>
            </div>
            <div className="bg-white/[0.02] p-2 rounded-lg group-hover:bg-white/[0.04] transition-colors">
              <div className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Price</div>
              <div className="text-sm font-mono text-white font-bold">{formatNumber(token.price.toFixed(6))}</div>
            </div>
         </div>
 
         {/* Progress Bar */}
         <div className="space-y-2">
             <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider text-gray-500">
               <div className="flex items-center gap-1 group-hover:text-doge transition-colors"><Activity size={10} /> Bonding Curve</div>
               <span className={token.progress >= 100 ? 'text-purple-400 font-extrabold' : token.progress > 80 ? 'text-green-400' : 'text-doge'}>
                  {token.progress >= 100 ? 'GRADUATED' : `${token.progress.toFixed(2)}%`}
               </span>
             </div>
             <div className="h-2 w-full bg-black rounded-full overflow-hidden border border-white/10 group-hover:border-white/20 transition-colors">
               <div
                  className={`h-full rounded-full shadow-[0_0_15px_rgba(255,255,255,0.2)] relative ${isGraduated ? 'bg-purple-600' : 'bg-gradient-to-r from-doge-dark to-doge'}`}
                  style={{ width: `${Math.min(100, token.progress)}%` }}
               >
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/80 blur-[1px] animate-pulse"></div>
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:10px_10px] animate-shimmer"></div>
               </div>
             </div>
         </div>
 
         {/* Quick Ape Button - Moved below progress bar */}
         {!isGraduated && !preview && (
            <button
                   onClick={toggleQuickBuy}
                   className="w-full bg-doge text-black font-bold text-xs uppercase tracking-widest py-2.5 rounded-xl hover:bg-white hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-doge/20 z-20 group/ape mt-2"
                   title="Quick Ape"
               >
                   <Zap size={14} className="fill-black group-hover/ape:fill-black animate-bounce-subtle" />
                   QUICK APE
               </button>
         )}
         {isGraduated && !preview && (
             <div className="w-full bg-purple-500/20 text-purple-400 font-bold text-[10px] uppercase tracking-widest py-2.5 rounded-xl flex items-center justify-center gap-2 border border-purple-500/30">
                 Trade on DEX
             </div>
         )}
      </div>

      {/* Confirmation Modal for Large Purchases */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setPendingBuyAmount(null);
          setBuyingAmount(null);
        }}
        onConfirm={() => {
          if (pendingBuyAmount) {
            executeBuy(pendingBuyAmount);
          }
        }}
        title="Confirm Large Purchase"
        message={`You are about to purchase ${pendingBuyAmount || 0} DC worth of ${token.name || token.ticker || 'this token'}. This transaction will execute immediately on the blockchain.`}
        confirmText="Confirm Purchase"
        cancelText="Cancel"
        variant="warning"
      />
    </div>
  );
 
  // Return CardContent wrapped in a Link for navigation
  return preview ? CardContent : (
    <Link to={`/token/${token.id}`} className="group block h-full">
      {CardContent}
    </Link>
  );
};

export const TokenCard = React.memo(TokenCardComponent);
TokenCard.displayName = 'TokenCard';
