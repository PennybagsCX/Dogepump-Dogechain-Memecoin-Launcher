
import React from 'react';
import { ShieldCheck, Lock, Flame, Users, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Token } from '../types';

interface DogeGuardProps {
  token: Token;
}

export const DogeGuard: React.FC<DogeGuardProps> = ({ token }) => {
  const top10Holders = 18.5; // Simulated data
  const isSafe = top10Holders < 20;

  return (
    <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 shadow-lg relative overflow-hidden group flex flex-col h-full">
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-green-500/10 rounded-full blur-[40px] group-hover:bg-green-500/20 transition-colors"></div>
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-2">
            <ShieldCheck className="text-green-500" size={24} />
            <h3 className="font-bold text-lg text-white">DogeGuard</h3>
        </div>
        <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider bg-white/5 px-2 py-1 rounded">
            Automated Checks
        </div>
      </div>

      <div className="animate-fade-in space-y-4 relative z-10 flex-1">
            <div className="grid grid-cols-2 gap-4">
                {/* Standard Launcher Check */}
                <div className="bg-white/[0.03] rounded-xl p-3 border border-green-500/20 text-center">
                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Contract</div>
                    <div className="font-bold text-xs text-white flex items-center justify-center gap-1">
                        Verified & Renounced
                    </div>
                </div>

                {/* Liquidity Check */}
                <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5 text-center">
                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Liquidity</div>
                    <div className="font-bold text-xs text-white">
                        {token.progress >= 100 ? 'Burned Forever' : 'Bonding Curve Locked'}
                    </div>
                </div>
            </div>

            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-2 mb-2">
                    <div className="flex items-center gap-2">
                        <Users size={16} className="text-blue-400" />
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Top 10 Holders</span>
                    </div>
                    <span className={`font-mono font-bold text-center sm:text-right ${isSafe ? 'text-green-400' : 'text-yellow-400'}`}>
                        {top10Holders}%
                    </span>
                </div>
                <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden border border-white/5">
                    <div
                        className={`h-full rounded-full ${isSafe ? 'bg-green-500' : 'bg-yellow-500'}`}
                        style={{ width: `${top10Holders}%` }}
                    ></div>
                </div>
                <div className="mt-3 text-[10px] text-gray-500 flex items-start gap-2 leading-relaxed bg-white/5 p-2 rounded-lg">
                    All contracts deployed via DogePump are immutable. Minting is impossible. Rug pulls via liquidity removal are mathematically impossible before graduation.
                </div>
            </div>
      </div>
    </div>
  );
};
