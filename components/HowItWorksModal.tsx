
import React from 'react';
import { X, Rocket, TrendingUp, Lock, Flame } from 'lucide-react';
import { Button } from './Button';
import { ModalPortal } from './ModalPortal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const steps = [
    {
      icon: Rocket,
      title: "Pick a coin",
      desc: "Browse the board to find the next gem. Every coin on DogePump is a fair launch—no presales, no team allocations.",
      color: "text-doge"
    },
    {
      icon: TrendingUp,
      title: "Buy on the curve",
      desc: "Buy tokens using $DC. As more people buy, the price goes up according to the bonding curve. Sell anytime to lock in profits.",
      color: "text-green-400"
    },
    {
      icon: Lock,
      title: "Reach Market Cap",
      desc: "When the market cap hits $6,900, the bonding curve is complete. Trading stops on the curve.",
      color: "text-blue-400"
    },
    {
      icon: Flame,
      title: "Burn & Graduate",
      desc: "Liquidity is deposited into the internal DogePump DEX and burned forever. The contract is renounced, ensuring the coin is truly community-owned.",
      color: "text-orange-500"
    }
  ];

  return (
    <ModalPortal>
      <div className="fixed inset-0 flex items-center justify-center p-3 sm:p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
        <div className="relative bg-[#0A0A0A] border border-white/10 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl animate-slide-up overflow-hidden max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] overflow-y-auto">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-doge/10 blur-[80px] rounded-full pointer-events-none"></div>

        <div className="flex justify-between items-center mb-8 relative z-10">
          <h2 className="text-3xl font-comic font-bold text-white">How it works</h2>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6 relative z-10 mb-8">
           {steps.map((step, i) => (
             <div key={i} className="bg-white/[0.03] border border-white/5 p-5 rounded-2xl hover:bg-white/[0.05] transition-colors group">
                <div className={`w-10 h-10 rounded-xl bg-black flex items-center justify-center mb-4 shadow-inner ${step.color}`}>
                   <step.icon size={20} />
                </div>
                <h3 className="text-white font-bold text-lg mb-2 group-hover:text-doge transition-colors">{step.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
             </div>
           ))}
        </div>

        <div className="relative z-10 text-center">
           <Button onClick={onClose} className="w-full rounded-xl py-4 text-lg font-bold">
             I'm ready to pump
           </Button>
           <p className="text-xs text-gray-500 mt-4">
             DogePump prevents rugpulls by ensuring all created tokens are safe. Each coin on DogePump is a fair-launch with no team allocation.
           </p>
        </div>
        </div>
      </div>
    </ModalPortal>
  );
};
