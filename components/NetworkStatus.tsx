
import React from 'react';
import { Box, Zap, Activity } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';

export const NetworkStatus: React.FC = () => {
  const { networkStats } = useStore();

  return (
    <div className="flex flex-col items-center gap-4 pt-4 mt-6 border-t border-white/5 text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider md:flex-row md:items-center md:gap-6 md:border-t-0 md:border-l md:pl-6 md:ml-6 md:pt-0 md:mt-0">
      <div
        className="group relative flex items-center gap-2 cursor-help focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-400/60 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0A0A0A]"
        tabIndex={0}
        aria-label="Current Block Height"
      >
        <Box size={12} className="group-hover:text-blue-400 transition-colors" />
        <span className="group-hover:text-white transition-colors">#{networkStats.blockHeight.toLocaleString()}</span>
        <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded bg-black/90 px-2 py-1 text-[9px] font-semibold text-white opacity-0 shadow-lg shadow-black/30 transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
          Current Block Height
        </div>
      </div>
      <div
        className="group relative flex items-center gap-2 cursor-help focus:outline-none focus-visible:ring-1 focus-visible:ring-yellow-400/60 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0A0A0A]"
        tabIndex={0}
        aria-label="Gas Price (Gwei)"
      >
        <Zap
          size={12}
          className={`transition-colors ${networkStats.gasPrice > 5 ? 'text-red-500' : 'group-hover:text-yellow-400'}`}
        />
        <span className={`transition-colors ${networkStats.gasPrice > 5 ? 'text-red-400' : 'group-hover:text-white'}`}>
          {networkStats.gasPrice.toFixed(1)} Gwei
        </span>
        <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded bg-black/90 px-2 py-1 text-[9px] font-semibold text-white opacity-0 shadow-lg shadow-black/30 transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
          Gas Price (Gwei)
        </div>
      </div>
      <div
        className="group relative flex items-center gap-2 cursor-help focus:outline-none focus-visible:ring-1 focus-visible:ring-green-400/60 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0A0A0A]"
        tabIndex={0}
        aria-label="Transactions Per Second"
      >
        <Activity size={12} className="group-hover:text-green-400 transition-colors" />
        <span className="group-hover:text-white transition-colors">{networkStats.tps} TPS</span>
        <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded bg-black/90 px-2 py-1 text-[9px] font-semibold text-white opacity-0 shadow-lg shadow-black/30 transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
          Transactions Per Second
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-green-500">Mainnet</span>
      </div>
    </div>
  );
};
