
import React, { useEffect, useState } from 'react';
import { Rocket, Crown, X, ArrowRight } from 'lucide-react';
import { Button } from './Button';
import { Confetti } from './Confetti';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tokenName: string;
  ticker: string;
  imageUrl: string;
}

export const GraduationOverlay: React.FC<Props> = ({ isOpen, onClose, tokenName, ticker, imageUrl }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      const timer1 = setTimeout(() => setStep(1), 1500); // Trigger celebration
      const timer2 = setTimeout(() => setStep(2), 3500); // Show migration status

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4">
      {/* Darkened Backdrop with Blur */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-fade-in" onClick={onClose}></div>
      
      {/* Confetti */}
      <Confetti />

      {/* Main Content */}
      <div className="relative z-10 max-w-lg w-full text-center space-y-8 animate-slide-up">
         
         {/* Animated Icon */}
         <div className="relative mx-auto w-40 h-40">
            <div className="absolute inset-0 bg-doge/20 rounded-full blur-[80px] animate-pulse-slow"></div>
            <div className={`w-full h-full rounded-full border-4 border-doge bg-black flex items-center justify-center shadow-[0_0_60px_#D4AF37] transition-all duration-1000 ${step >= 1 ? 'scale-110' : 'scale-100'}`}>
                <img src={imageUrl} className="w-36 h-36 rounded-full object-cover opacity-80" alt={tokenName} />
                <div className="absolute -bottom-4 bg-doge text-black px-4 py-1 rounded-full font-bold text-xs uppercase tracking-widest shadow-lg flex items-center gap-1">
                   <Crown size={14} fill="black" /> Graduated
                </div>
            </div>
         </div>

         <div className="space-y-4">
            <h2 className="text-5xl font-comic font-bold text-white leading-none drop-shadow-2xl">
              <Rocket size={32} className="inline-block mr-3 mb-1" />
         To The Moon!
            </h2>
            <p className="text-2xl text-gray-300 font-medium">
               <span className="text-doge font-bold">{tokenName}</span> has completed the bonding curve!
            </p>
         </div>

         {/* Migration Steps */}
         <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left space-y-4 backdrop-blur-md">
            <div className="flex items-center gap-4">
               <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${step >= 0 ? 'bg-green-500 text-black' : 'bg-white/10'}`}>
                  <CheckIcon />
               </div>
               <span className={step >= 0 ? 'text-white font-bold' : 'text-gray-500'}>Market Cap Goal Reached ($69k)</span>
            </div>
            <div className="flex items-center gap-4">
               <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${step >= 1 ? 'bg-green-500 text-black' : 'bg-white/10'}`}>
                  {step >= 1 ? <CheckIcon /> : <div className="w-2 h-2 bg-white/20 rounded-full"/>}
               </div>
               <span className={step >= 1 ? 'text-white font-bold' : 'text-gray-500'}>Liquidity Migrating to DEX</span>
            </div>
            <div className="flex items-center gap-4">
               <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${step >= 2 ? 'bg-green-500 text-black' : 'bg-white/10'}`}>
                  {step >= 2 ? <CheckIcon /> : <div className="w-2 h-2 bg-white/20 rounded-full"/>}
               </div>
               <span className={step >= 2 ? 'text-white font-bold' : 'text-gray-500'}>Contract Renounced & LP Burned</span>
            </div>
         </div>

         <Button size="lg" className="w-full rounded-xl py-6 text-xl shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:scale-105 transition-transform" onClick={onClose}>
            Trade on DogePump DEX <ArrowRight size={20} className="ml-2" />
         </Button>
      </div>
    </div>
  );
};

const CheckIcon = () => (
   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
);
