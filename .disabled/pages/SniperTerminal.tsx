
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Target, Zap, Activity, Clock, Search, Crosshair, DollarSign, List, Filter, Lock, Unlock, Settings, Eye, AlertTriangle, Flame, ArrowUp, ArrowDown } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { Token } from '../types';
import { timeAgo } from '../utils';
import { formatNumber, formatCurrency } from '../services/web3Service';
import { playSound } from '../services/audio';
import { Button } from '../components/Button';
import { useToast } from '../components/Toast';
import { Link } from 'react-router-dom';

const SniperTerminal: React.FC = () => {
  const { tokens, buyToken, userBalanceDC } = useStore();
  const { addToast } = useToast();
  const [filter, setFilter] = useState('');
  const [sniperAmount, setSniperAmount] = useState('100');
  const [isAutoBuy, setIsAutoBuy] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  
  // Timeframe & Sorting State
  const [selectedTimeframe, setSelectedTimeframe] = useState<'5m' | '15m' | '1h' | '4h' | '24h'>('1h');
  const [sortColumn, setSortColumn] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const prevTokenCount = useRef(tokens.length);

  // Augment tokens with mock timeframe data
  const augmentedTokens = useMemo(() => {
     return tokens.map(t => ({
        ...t,
        change5m: (Math.random() * 10) - 2,
        change15m: (Math.random() * 20) - 5,
        change1h: (Math.random() * 40) - 10,
        change4h: (Math.random() * 60) - 15,
        change24h: (Math.random() * 100) - 20,
        vol5m: Math.random() * 1000,
        vol15m: Math.random() * 2000,
        vol1h: Math.random() * 5000 + 100,
        vol4h: Math.random() * 10000,
        vol24h: Math.random() * 50000
     }));
  }, [tokens]);

  const sortedTokens = useMemo(() => {
     let data = [...augmentedTokens]
        .filter(t => t.name.toLowerCase().includes(filter.toLowerCase()) || t.ticker.toLowerCase().includes(filter.toLowerCase()));
     
     data.sort((a, b) => {
        let valA = a[sortColumn as keyof typeof a];
        let valB = b[sortColumn as keyof typeof b];
        
        // Handle sorting logic
        if (sortDirection === 'asc') {
           return valA > valB ? 1 : -1;
        } else {
           return valA < valB ? 1 : -1;
        }
     });
     
     return data;
  }, [augmentedTokens, filter, sortColumn, sortDirection]);

  // Sound effect on new token
  useEffect(() => {
    if (tokens.length > prevTokenCount.current) {
        playSound('launch');
        addToast('info', 'New Token Detected in Mempool!', 'Sniper Alert');
        
        // Simulate Auto-Buy
        if (isAutoBuy) {
           const newToken = tokens[0];
           if (newToken) {
              handleQuickBuy(newToken, parseFloat(sniperAmount), true);
           }
        }
    }
    prevTokenCount.current = tokens.length;
  }, [tokens.length, isAutoBuy]);

  const handleQuickBuy = (token: Token, amount: number, auto = false) => {
      if (userBalanceDC < amount) {
          addToast('error', 'Insufficient Funds for Snipe');
          return;
      }
      playSound('click');
      buyToken(token.id, amount);
      addToast(auto ? 'warning' : 'success', `${auto ? 'Auto-Sniped' : 'Sniped'} ${token.ticker} for ${amount} DC`, 'Target Hit');
  };

  const getAgeBucket = (timestamp: number) => {
     const seconds = (Date.now() - timestamp) / 1000;
     if (seconds < 60) return '< 1m';
     if (seconds < 300) return '< 5m';
     if (seconds < 3600) return '< 1h';
     return '> 1h';
  };

  const handleSort = (col: string) => {
     if (sortColumn === col) {
        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
     } else {
        setSortColumn(col);
        setSortDirection('desc');
     }
     playSound('click');
  };

  const SortIcon = ({ col }: { col: string }) => {
     if (sortColumn !== col) return <div className="w-3 h-3"></div>;
     return sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  };

  const ChangeCell = ({ val }: { val: number }) => (
      <div className={`text-right font-mono font-bold ${val >= 0 ? 'text-[#00E054]' : 'text-red-500'}`}>
          {val >= 0 ? '+' : ''}{val.toFixed(1)}%
      </div>
  );

  // Dynamic keys based on selection
  const changeKey = `change${selectedTimeframe}` as keyof typeof augmentedTokens[0];
  const volKey = `vol${selectedTimeframe}` as keyof typeof augmentedTokens[0];

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col font-mono text-[#00E054] animate-fade-in -mx-4 sm:-mx-6 lg:-mx-8 -my-12 px-4 sm:px-6 lg:px-8 py-4">
       
       {/* Sniper Control Panel */}
       <div className="shrink-0 bg-[#0A0A0A] border-b-2 border-[#00E054]/30 pb-6 mb-4 flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-end sticky top-0 z-30 pt-2">
          <div className="flex items-center gap-4">
             <div className={`p-3 rounded-lg border-2 transition-colors ${isScanning ? 'bg-[#00E054]/10 border-[#00E054] text-[#00E054] animate-pulse' : 'bg-red-500/10 border-red-500 text-red-500'}`}>
                <Crosshair size={32} />
             </div>
             <div>
                <h1 className="text-2xl font-black tracking-widest uppercase flex items-center gap-3">
                   Mempool Sniper <span className="text-xs bg-[#00E054] text-black px-2 py-0.5 rounded font-bold">PRO</span>
                </h1>
                <div className="text-xs text-[#00E054]/70 flex items-center gap-4 mt-1 font-bold">
                   <span className="flex items-center gap-1"><Activity size={10} /> Live Feed Active</span>
                   <span className="flex items-center gap-1"><Target size={10} /> {sortedTokens.length} Targets</span>
                </div>
             </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 w-full xl:w-auto bg-[#00E054]/5 p-4 rounded-xl border border-[#00E054]/10">
             
             {/* Timeframe Selector */}
             <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#00E054]/70">Timeframe</label>
                <div className="flex bg-black rounded-lg border border-[#00E054]/20 p-1 gap-1">
                   {['5m', '15m', '1h', '4h', '24h'].map(tf => (
                      <button
                        key={tf}
                        onClick={() => { setSelectedTimeframe(tf as any); playSound('click'); }}
                        className={`px-3 py-1.5 text-[10px] font-bold rounded hover:bg-[#00E054]/20 transition-colors uppercase ${selectedTimeframe === tf ? 'bg-[#00E054] text-black' : 'text-[#00E054]'}`}
                      >
                         {tf}
                      </button>
                   ))}
                </div>
             </div>

             <div className="w-px h-10 bg-[#00E054]/20 mx-2 hidden md:block"></div>

             {/* Snipe Amount (DC) Section */}
             <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#00E054]/70">Snipe Amount (DC)</label>
                <div className="flex items-center gap-2">
                   <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00E054] font-bold">$</div>
                      <input
                        type="number"
                        value={sniperAmount}
                        onChange={(e) => setSniperAmount(e.target.value)}
                        className="bg-black border border-[#00E054]/40 rounded-lg pl-6 pr-2 py-2 text-sm text-white font-bold w-24 outline-none focus:border-[#00E054] focus:shadow-[0_0_10px_rgba(0,224,84,0.3)] transition-all"
                      />
                   </div>
                   <div className="flex bg-black rounded-lg border border-[#00E054]/20 p-1 gap-1">
                      {[100, 500, 1000].map(amt => (
                         <button
                           key={amt}
                           onClick={() => setSniperAmount(amt.toString())}
                           className={`px-2 py-1 text-[10px] font-bold rounded hover:bg-[#00E054]/20 transition-colors ${sniperAmount === amt.toString() ? 'bg-[#00E054] text-black' : 'text-[#00E054]'}`}
                        >
                           {amt}
                        </button>
                      ))}
                   </div>
                </div>
             </div>

             <div className="w-px h-10 bg-[#00E054]/20 mx-2 hidden md:block"></div>

             {/* Auto-Ape and Search Section */}
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                   <div
                     onClick={() => { setIsAutoBuy(!isAutoBuy); playSound('click'); }}
                     className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${isAutoBuy ? 'bg-red-500' : 'bg-[#00E054]/20'}`}
                   >
                      <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 ${isAutoBuy ? 'left-6' : 'left-1'}`}></div>
                   </div>
                   <div className="flex flex-col">
                      <span className={`text-[10px] font-bold uppercase ${isAutoBuy ? 'text-red-500 animate-pulse' : 'text-[#00E054]/50'}`}>Auto-Ape</span>
                      {isAutoBuy && <span className="text-[9px] text-red-400 font-bold">DANGER</span>}
                   </div>
                </div>
                
                <div className="relative group">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00E054]/50" size={14} />
                   <input
                     type="text"
                     value={filter}
                     onChange={(e) => setFilter(e.target.value)}
                     className="bg-black border border-[#00E054]/30 rounded-lg pl-8 pr-4 py-2 text-sm text-[#00E054] placeholder:text-[#00E054]/30 outline-none focus:border-[#00E054] w-40"
                     placeholder="Filter..."
                   />
                </div>
             </div>
          </div>
       </div>

       {/* Data Table */}
       <div className="flex-1 overflow-hidden bg-[#050505] border border-[#00E054]/20 rounded-xl relative flex flex-col shadow-[0_0_30px_rgba(0,224,84,0.05)]">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 text-[10px] font-black text-[#00E054]/60 uppercase tracking-widest border-b border-[#00E054]/20 bg-[#00E054]/5 shrink-0 select-none">
             <div className="col-span-2 cursor-pointer hover:text-[#00E054] flex items-center gap-1" onClick={() => handleSort('createdAt')}>
                Age <SortIcon col="createdAt" />
             </div>
             <div className="col-span-2 cursor-pointer hover:text-[#00E054] flex items-center gap-1" onClick={() => handleSort('name')}>
                Token <SortIcon col="name" />
             </div>
             <div className="col-span-2 text-right cursor-pointer hover:text-[#00E054] flex justify-end items-center gap-1" onClick={() => handleSort('marketCap')}>
                Mkt Cap <SortIcon col="marketCap" />
             </div>
             <div className="col-span-1 text-right cursor-pointer hover:text-[#00E054] flex justify-end items-center gap-1" onClick={() => handleSort('virtualLiquidity')}>
                Liq <SortIcon col="virtualLiquidity" />
             </div>
             <div className="col-span-2 text-right cursor-pointer hover:text-[#00E054] flex justify-end items-center gap-1" onClick={() => handleSort(changeKey as string)}>
                Chg ({selectedTimeframe}) <SortIcon col={changeKey as string} />
             </div>
             <div className="col-span-1 text-right cursor-pointer hover:text-[#00E054] flex justify-end items-center gap-1" onClick={() => handleSort(volKey as string)}>
                Vol ({selectedTimeframe}) <SortIcon col={volKey as string} />
             </div>
             <div className="col-span-2 text-center">Snipe</div>
          </div>

          {/* Scrollable List */}
          <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
             {sortedTokens.length === 0 ? (
                <div className="text-center py-20 text-[#00E054]/30 flex flex-col items-center justify-center h-full">
                   <Activity size={48} className="mx-auto mb-4 opacity-20 animate-pulse" />
                   <p className="font-bold tracking-widest">SCANNING MEMPOOL...</p>
                </div>
             ) : (
                sortedTokens.map(token => (
                   <div key={token.id} className="grid grid-cols-12 gap-2 px-3 py-2.5 items-center hover:bg-[#00E054]/5 transition-colors border-b border-[#00E054]/10 last:border-0 group text-xs animate-slide-up">
                      {/* Age */}
                      <div className="col-span-2 flex items-center gap-2 text-[#00E054]/80 font-mono">
                         <span className="w-1.5 h-1.5 bg-[#00E054] rounded-full animate-pulse shadow-[0_0_5px_#00E054]"></span>
                         <span className="font-bold">{getAgeBucket(token.createdAt)}</span>
                         <span className="text-[#00E054]/40 text-[9px]">({timeAgo(token.createdAt).replace(' ago', '')})</span>
                      </div>

                      {/* Token */}
                      <div className="col-span-2 flex items-center gap-3 overflow-hidden">
                         <div className="relative">
                            <img src={token.imageUrl} className="w-6 h-6 rounded bg-[#00E054]/10 border border-[#00E054]/30 object-cover shrink-0 grayscale group-hover:grayscale-0 transition-all" alt={token.name} />
                            {token.creator === 'You' && <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#00E054] rounded-full border border-black"></div>}
                         </div>
                         <div className="min-w-0">
                            <Link to={`/token/${token.id}`} className="font-bold text-[#00E054] hover:underline truncate block">
                               {token.ticker}
                            </Link>
                         </div>
                      </div>

                      {/* Market Cap */}
                      <div className="col-span-2 text-right font-mono text-white/90">
                         {formatCurrency(token.marketCap)}
                      </div>

                      {/* Liquidity */}
                      <div className="col-span-1 text-right font-mono text-white/90">
                         {formatNumber(token.virtualLiquidity)}
                      </div>

                      {/* Change (Dynamic) */}
                      <div className="col-span-2"><ChangeCell val={token[changeKey]} /></div>

                      {/* Volume (Dynamic) */}
                      <div className="col-span-1 text-right font-mono text-white/90">
                         {formatNumber(token[volKey])}
                      </div>

                      {/* Action */}
                      <div className="col-span-2 flex justify-center">
                         <button
                           onClick={() => handleQuickBuy(token, parseFloat(sniperAmount))}
                           className="bg-[#00E054] text-black text-[10px] font-black uppercase tracking-wider px-4 py-1.5 rounded hover:bg-white hover:scale-105 active:scale-95 transition-all flex items-center gap-1 shadow-[0_0_15px_rgba(0,224,84,0.3)] opacity-0 group-hover:opacity-100"
                         >
                            <Zap size={10} fill="black"/> BUY
                         </button>
                      </div>
                   </div>
                ))
             )}
          </div>
          
          {/* Footer Status */}
          <div className="px-4 py-2 border-t border-[#00E054]/20 flex justify-between items-center text-[10px] text-[#00E054]/50">
             <div>BLOCK: 4206912</div>
             <div className="flex gap-4">
                <span>GAS: 1.2 GWEI</span>
                <span>TPS: 15</span>
             </div>
          </div>
       </div>
    </div>
  );
};

export default SniperTerminal;
