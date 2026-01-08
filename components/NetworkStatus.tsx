
import React from 'react';
import { Box, Zap, Activity, Server } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';

export const NetworkStatus: React.FC = () => {
  const { networkStats } = useStore();

  return (
    <div className="hidden md:flex items-center gap-6 text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider border-l border-white/5 pl-6 ml-6">
       <div className="flex items-center gap-2 group cursor-help" title="Current Block Height">
          <Box size={12} className="group-hover:text-blue-400 transition-colors" />
          <span className="group-hover:text-white transition-colors">#{networkStats.blockHeight.toLocaleString()}</span>
       </div>
       <div className="flex items-center gap-2 group cursor-help" title="Gas Price (Gwei)">
          <Zap size={12} className={`transition-colors ${networkStats.gasPrice > 5 ? 'text-red-500' : 'group-hover:text-yellow-400'}`} />
          <span className={`transition-colors ${networkStats.gasPrice > 5 ? 'text-red-400' : 'group-hover:text-white'}`}>
             {networkStats.gasPrice.toFixed(1)} Gwei
          </span>
       </div>
       <div className="flex items-center gap-2 group cursor-help" title="Transactions Per Second">
          <Activity size={12} className="group-hover:text-green-400 transition-colors" />
          <span className="group-hover:text-white transition-colors">{networkStats.tps} TPS</span>
       </div>
       <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-green-500">Mainnet</span>
       </div>
    </div>
  );
};
