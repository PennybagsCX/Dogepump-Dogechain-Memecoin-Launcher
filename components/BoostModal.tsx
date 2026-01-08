
import React, { useState } from 'react';
import { X, Rocket, Flame, Zap } from 'lucide-react';
import { Token } from '../types';
import { Button } from './Button';
import { useStore } from '../contexts/StoreContext';
import { useToast } from './Toast';
import { playSound } from '../services/audio';
import { ModalPortal } from './ModalPortal';

interface BoostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBoostComplete?: () => void;
  token: Token;
}

export const BoostModal: React.FC<BoostModalProps> = ({ isOpen, onClose, onBoostComplete, token }) => {
  const { boostToken, userBalanceDC } = useStore();
  const { addToast } = useToast();
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [isBoosting, setIsBoosting] = useState(false);

  if (!isOpen) return null;

  const tiers = [
    { id: 1, label: 'Spark', amount: 100, icon: Zap, color: 'text-yellow-400' },
    { id: 2, label: 'Rocket', amount: 500, icon: Rocket, color: 'text-doge' },
    { id: 3, label: 'Supernova', amount: 1000, icon: Flame, color: 'text-orange-500' },
  ];

  const handleBoost = () => {
    if (!selectedTier) return;
    
    if (userBalanceDC < selectedTier) {
       addToast('error', 'Insufficient $DC Balance');
       return;
    }

    setIsBoosting(true);
    playSound('click');

    setTimeout(() => {
       boostToken(token.id, selectedTier);
       addToast('success', `Boosted ${token.ticker} successfully!`, 'To The Moon');
       setIsBoosting(false);
       onClose();
       onBoostComplete?.();
    }, 1500);
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
        <div className="relative bg-[#0A0A0A] border border-doge/30 rounded-3xl max-w-md w-full p-8 shadow-[0_0_50px_-10px_rgba(212,175,55,0.2)] animate-slide-up overflow-hidden">
        
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-doge/10 blur-[60px] rounded-full pointer-events-none"></div>

        <div className="flex justify-between items-center mb-6 relative z-10">
           <h2 className="text-2xl font-bold text-white font-comic flex items-center gap-2">
              <Rocket size={24} className="text-doge animate-bounce-subtle" /> Boost Token
           </h2>
           <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white">
              <X size={20} />
           </button>
        </div>

        <p className="text-gray-400 text-sm mb-6 relative z-10">
           Burn $DC to promote <span className="text-white font-bold">{token.name}</span>. Boosted tokens rank higher and get noticed by whales.
        </p>

        <div className="space-y-3 mb-8 relative z-10">
           {tiers.map((tier) => (
              <button
                key={tier.id}
                onClick={() => { setSelectedTier(tier.amount); playSound('click'); }}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                   selectedTier === tier.amount 
                     ? 'bg-doge/10 border-doge shadow-[0_0_15px_rgba(212,175,55,0.2)] scale-[1.02]' 
                     : 'bg-white/[0.02] border-white/10 hover:bg-white/5 hover:border-white/20'
                }`}
              >
                 <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full bg-black flex items-center justify-center border border-white/10 ${tier.color}`}>
                       <tier.icon size={20} />
                    </div>
                    <div className="text-left">
                       <div className="font-bold text-white">{tier.label}</div>
                       <div className="text-xs text-gray-500">{tier.amount} DC</div>
                    </div>
                 </div>
                 <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedTier === tier.amount ? 'border-doge' : 'border-gray-600'}`}>
                    {selectedTier === tier.amount && <div className="w-2.5 h-2.5 bg-doge rounded-full"></div>}
                 </div>
              </button>
           ))}
        </div>

        <Button 
           onClick={handleBoost} 
           disabled={!selectedTier} 
           isLoading={isBoosting}
           className="w-full h-14 text-lg font-bold relative z-10"
        >
           <Flame size={16} className="mr-2" />
         Burn & Boost
        </Button>

        </div>
      </div>
    </ModalPortal>
  );
};
