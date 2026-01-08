import React from 'react';
import { createPortal } from 'react-dom';
import { Wallet, ArrowUpRight } from 'lucide-react';
import { Token } from '../types';
import { useStore } from '../contexts/StoreContext';
import { formatNumber } from '../services/web3Service';
import { playSound } from '../services/audio';

interface MobileTradeBarProps {
  token: Token;
  onQuickTrade?: (type: 'buy' | 'sell') => void;
}

const TRADE_SECTION_ID = 'mobile-trade-section';

export const MobileTradeBar: React.FC<MobileTradeBarProps> = ({ token, onQuickTrade }) => {
  const { userBalanceDC } = useStore();

  const scrollToTradeSection = () => {
    const el = document.getElementById(TRADE_SECTION_ID);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleOpen = (type?: 'buy' | 'sell') => {
    if (type && onQuickTrade) onQuickTrade(type);
    scrollToTradeSection();
    playSound('click');
  };

  const isGraduated = token.progress >= 100;

  const bar = (
    <>
      {/* Sticky Footer Bar - Only show for non-graduated tokens */}
      {!isGraduated && (
        <div
          className="fixed bottom-0 left-0 right-0 z-[2000] lg:hidden bg-[#0A0A0A]/95 border-t border-white/10 px-4 pt-4 pb-3 safe-area-pb pointer-events-auto shadow-[0_-12px_30px_-12px_rgba(0,0,0,0.6)]"
          data-testid="mobile-trade-bar"
        >
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="text-white font-mono font-bold text-lg leading-none">${token.price.toFixed(6)}</div>
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1 mt-1">
                <Wallet size={10} /> {formatNumber(userBalanceDC)} DC
              </div>
            </div>
            <button
              onClick={() => handleOpen('buy')}
              className="flex-1 bg-doge-success text-black font-bold h-12 rounded-xl shadow-[0_0_15px_rgba(0,224,84,0.3)] hover:scale-105 transition-transform min-w-[44px] min-h-[48px]"
              aria-label="Buy tokens"
            >
              Buy
            </button>
            <button
              onClick={() => handleOpen('sell')}
              className="flex-1 bg-doge-error text-white font-bold h-12 rounded-xl shadow-[0_0_15px_rgba(255,59,48,0.3)] hover:scale-105 transition-transform min-w-[44px] min-h-[48px]"
              aria-label="Sell tokens"
            >
              Sell
            </button>
          </div>
        </div>
      )}

      {/* Graduated Token - Show DogeSwap Button */}
      {isGraduated && (
        <div className="fixed bottom-0 left-0 right-0 z-[2000] lg:hidden bg-[#0A0A0A]/95 border-t border-white/10 p-4 safe-area-pb pointer-events-auto shadow-[0_-12px_30px_-12px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="text-white font-mono font-bold text-lg leading-none">${token.price.toFixed(6)}</div>
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1 mt-1">
                <Wallet size={10} /> {formatNumber(userBalanceDC)} DC
              </div>
            </div>
            <button
              onClick={() => handleOpen('buy')}
              className="flex-1 bg-doge text-black font-bold h-12 rounded-xl shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:scale-105 transition-transform min-w-[44px] min-h-[48px] flex items-center justify-center gap-2"
              aria-label="Trade on DEX"
            >
              <ArrowUpRight size={20} /> Trade on DEX
            </button>
          </div>
        </div>
      )}
    </>
  );

  if (typeof document === 'undefined') return bar;
  return createPortal(bar, document.body);
};
