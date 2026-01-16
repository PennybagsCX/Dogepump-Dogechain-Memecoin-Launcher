
/**
 * DogeSwap Component
 * Main DEX interface integrating real DEX functionality with existing platform features
 */

import React, { useState, useEffect } from 'react';
import { ArrowDown, ArrowLeftRight, Settings, Info, Wallet, RefreshCw, ExternalLink, ChevronDown, Search, X, Flame, Sparkles, Sprout, Wheat } from 'lucide-react';
import { Token } from '../types';
import { Button } from './Button';
import { useStore } from '../contexts/StoreContext';
import { useToast } from './Toast';
import { playSound } from '../services/audio';
import { formatNumber } from '../services/web3Service';
import DexSwap from './dex/DexSwap';
import DexUnifiedLiquidity from './dex/DexUnifiedLiquidity';
import DexPoolDetail from './dex/DexPoolDetail';
import { useDex } from '../contexts/DexContext';
import { TokenInfo } from '../types';

interface DogeSwapProps {
  token: Token;
}

export const DogeSwap: React.FC<DogeSwapProps> = ({ token: initialToken }) => {
  const { buyToken, sellToken, burnToken, lockForReputation, userBalanceDC, myHoldings, tokens, farmPositions, stakeToken, unstakeToken, harvestRewards } = useStore();
  const { addToast } = useToast();
  
  // Tab State - Extended to include DEX features
  const [activeTab, setActiveTab] = useState<'swap' | 'swap-dex' | 'burn' | 'reputation' | 'farm' | 'liquidity' | 'pool-detail'>('swap');
  const [selectedPoolAddress, setSelectedPoolAddress] = useState<string | null>(null);

  // DEX state
  const { pools, liquidityPositions } = useDex();
  
  // Convert token to TokenInfo format for DEX
  const dcTokenInfo: TokenInfo = {
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'DC',
    name: 'DogeChain',
    decimals: 18,
    logoURI: 'https://dogechain.dog/favicon.png',
  };
  
  const tokenInfo: TokenInfo = {
    address: initialToken.id,
    symbol: initialToken.ticker,
    name: initialToken.name,
    decimals: 18,
    logoURI: initialToken.imageUrl || '',
  };

  // State for token selection (Swap Tab)
  const [fromTokenId, setFromTokenId] = useState<string>('DC');
  const [toTokenId, setToTokenId] = useState<string>(initialToken.id);
  
  const [inputAmount, setInputAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectingSide, setSelectingSide] = useState<'from' | 'to' | null>(null); // 'from' or 'to'
  const [searchQuery, setSearchQuery] = useState('');

  // Get full token objects (DC is virtual here)
  const fromToken = fromTokenId === 'DC' ? { id: 'DC', ticker: 'DC', name: 'DogeChain', imageUrl: 'https://dogechain.dog/favicon.png', price: 1, balance: userBalanceDC } : tokens.find(t => t.id === fromTokenId);
  const toToken = toTokenId === 'DC' ? { id: 'DC', ticker: 'DC', name: 'DogeChain', imageUrl: 'https://dogechain.dog/favicon.png', price: 1, balance: userBalanceDC } : tokens.find(t => t.id === toTokenId);

  // Balances
  const fromBalance = fromTokenId === 'DC' ? userBalanceDC : (myHoldings.find(h => h.tokenId === fromTokenId)?.balance || 0);
  const initialTokenBalance = myHoldings.find(h => h.tokenId === initialToken.id)?.balance || 0;

  // Farm Data
  const farm = farmPositions.find(f => f.tokenId === initialToken.id);
  const isStaking = farm && farm.stakedAmount > 0;
  // Generate mock APY if not set
  const apy = farm?.apy || (initialToken.id.split('').reduce((a,b)=>a+b.charCodeAt(0),0) % 5000) + 100;

  // List of graduated tokens + current token (even if not graduated, for demo)
  const tradeableTokens = tokens.filter(t => t.progress >= 100 || t.id === initialToken.id);

  // DEX Math Simulation (Token A -> DC -> Token B)
  const getEstimatedOutput = (amountIn: number) => {
    if (!amountIn || amountIn <= 0 || !fromToken || !toToken) return 0;
    
    let valueInDC = 0;
    if (fromTokenId === 'DC') valueInDC = amountIn;
    else valueInDC = amountIn * (fromToken as Token).price;

    let amountOut = 0;
    if (toTokenId === 'DC') amountOut = valueInDC;
    else amountOut = valueInDC / (toToken as Token).price;

    // Apply Fee & Impact (Simulated)
    const fee = amountOut * 0.003; // 0.3%
    const impact = amountOut * 0.005; // 0.5% (simulated slippage)
    
    return amountOut - fee - impact;
  };

  const estimatedOutput = getEstimatedOutput(parseFloat(inputAmount));
  const priceImpact = (parseFloat(inputAmount) > 0 ? (0.5 + (parseFloat(inputAmount) / 1000)).toFixed(2) : "0.00");

  const handleAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputAmount || parseFloat(inputAmount) <= 0) return;
    
    // Determine balance to check based on tab
    let checkBalance = 0;
    let ticker = '';
    
    if (activeTab === 'swap') {
        checkBalance = fromBalance;
        ticker = fromToken?.ticker || '';
    } else if (activeTab === 'farm') {
        // Staking Logic Check
        checkBalance = initialTokenBalance;
        ticker = initialToken.ticker;
    } else {
        // Burn/Reputation always use the current token context (initialToken)
        checkBalance = initialTokenBalance;
        ticker = initialToken.ticker;
    }

    if (parseFloat(inputAmount) > checkBalance) {
        addToast('error', `Insufficient ${ticker} Balance`);
        return;
    }

    setIsProcessing(true);
    playSound('click');

    setTimeout(() => {
      const amount = parseFloat(inputAmount);

      if (activeTab === 'swap') {
          // Simulation Logic:
          if (fromTokenId !== 'DC') sellToken(fromTokenId, amount);
          if (toTokenId !== 'DC') {
              const dcValue = fromTokenId === 'DC' ? amount : amount * (fromToken as Token).price;
              buyToken(toTokenId, dcValue); 
          }
          addToast('success', `Swapped ${amount} ${fromToken?.ticker} for ${formatNumber(estimatedOutput)} ${toToken?.ticker}`, 'Swap Executed');
      } else if (activeTab === 'burn') {
          burnToken(initialToken.id, amount);
          addToast('success', `Burned ${amount} ${initialToken.ticker}`, 'Burn Complete');
          playSound('launch');
      } else if (activeTab === 'reputation') {
          lockForReputation(initialToken.id, amount);
          addToast('success', `Locked ${amount} ${initialToken.ticker}`, 'Reputation Earned');
          playSound('success');
      } else if (activeTab === 'farm') {
          stakeToken(initialToken.id, amount);
          // addToast handled in store
      }

      setIsProcessing(false);
      setInputAmount('');
    }, 1200);
  };

  const handleFarmHarvest = () => {
      harvestRewards(initialToken.id);
  };

  const handleFarmUnstake = () => {
      if (!farm) return;
      unstakeToken(initialToken.id, farm.stakedAmount);
      playSound('click');
  };

  const handleMax = () => {
     if (activeTab === 'swap') {
        setInputAmount(fromTokenId === 'DC' ? (userBalanceDC * 0.99).toFixed(2) : fromBalance.toString());
     } else {
        setInputAmount(initialTokenBalance.toString());
     }
     playSound('click');
  };

  const switchTokens = () => {
      const temp = fromTokenId;
      setFromTokenId(toTokenId);
      setToTokenId(temp);
      setInputAmount('');
      playSound('click');
  };

  const TokenModal = () => {
      if (!selectingSide) return null;
      
      const list = [{ id: 'DC', ticker: 'DC', name: 'DogeChain', imageUrl: 'https://dogechain.dog/favicon.png' }, ...tradeableTokens]
        .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.ticker.toLowerCase().includes(searchQuery.toLowerCase()));

      return (
          <div className="absolute inset-0 bg-[#111] z-50 p-4 animate-fade-in flex flex-col rounded-3xl">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-white">Select Token</h3>
                  <button onClick={() => setSelectingSide(null)} className="p-1 hover:bg-white/10 rounded-full"><X size={20}/></button>
              </div>
              <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16}/>
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="Search name or ticker" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 text-white outline-none focus:border-doge/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                  {list.map(t => (
                      <button 
                        key={t.id} 
                        onClick={() => {
                            if (selectingSide === 'from') {
                                setFromTokenId(t.id);
                                if (t.id === toTokenId) setToTokenId(fromTokenId); // Swap if same
                            } else {
                                setToTokenId(t.id);
                                if (t.id === fromTokenId) setFromTokenId(toTokenId); // Swap if same
                            }
                            setSelectingSide(null);
                            setSearchQuery('');
                            playSound('click');
                        }}
                        className="w-full flex items-center gap-3 p-3 hover:bg-white/10 rounded-xl transition-colors"
                      >
                          <img src={t.imageUrl || ''} className="w-8 h-8 rounded-full" />
                          <div className="text-left">
                              <div className="font-bold text-white">{t.ticker}</div>
                              <div className="text-xs text-gray-500">{t.name}</div>
                          </div>
                      </button>
                  ))}
              </div>
          </div>
      );
  };

  return (
    <div className="bg-[#111] border border-white/10 rounded-3xl px-8 py-6 shadow-2xl relative overflow-hidden">
       {/* Background Decor */}
       <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 rounded-full blur-[80px] pointer-events-none"></div>
       <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px] pointer-events-none"></div>

       <TokenModal />

       <div className="flex justify-between items-center mb-4 relative z-10">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                <RefreshCw size={16} />
             </div>
             <div>
                <h3 className="font-bold text-white text-lg leading-none">DogePump DEX</h3>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Internal AMM</span>
             </div>
          </div>
          <button onClick={() => setShowSettings(!showSettings)} className="text-gray-500 hover:text-white transition-colors">
             <Settings size={18} />
          </button>
       </div>

       {/* Secondary Tabs - Legacy Features */}
       <div className="grid grid-cols-3 gap-1 p-1 bg-white/5 rounded-xl mb-3 relative z-10">
          <button onClick={() => setActiveTab('swap')} className={`py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'swap' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>Swap</button>
          <button onClick={() => setActiveTab('burn')} className={`py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'burn' ? 'bg-orange-500/20 text-orange-500' : 'text-gray-500 hover:text-orange-400'}`}>Burn</button>
          <button onClick={() => setActiveTab('reputation')} className={`py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'reputation' ? 'bg-purple-500/20 text-purple-500' : 'text-gray-500 hover:text-purple-400'}`}>Reputation</button>
       </div>

       {/* Primary Tabs - DEX Features */}
       <div className="flex gap-2 p-1 bg-white/5 rounded-xl mb-4 relative z-10">
          <button onClick={() => { setActiveTab('liquidity'); playSound('click'); }} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'liquidity' ? 'bg-purple-500/20 text-purple-500' : 'text-gray-500 hover:text-purple-400'}`}>Liquidity & Pools</button>
          <button onClick={() => setActiveTab('farm')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'farm' ? 'bg-green-500/20 text-green-500' : 'text-gray-500 hover:text-green-400'}`}>Farm</button>
       </div>

       {showSettings && (
          <div className="mb-4 p-3 bg-white/5 rounded-xl border border-white/5 animate-fade-in relative z-10">
             <div className="text-xs font-bold text-gray-400 mb-2 uppercase">Slippage Tolerance</div>
             <div className="flex gap-2">
                {['0.1', '0.5', '1.0', '5.0'].map(val => (
                   <button 
                     key={val}
                     onClick={() => setSlippage(val)}
                     className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${slippage === val ? 'bg-purple-500 text-white' : 'bg-black/40 text-gray-400 hover:text-white'}`}
                   >
                      {val}%
                   </button>
                ))}
             </div>
          </div>
       )}

       {/* DEX Swap Tab */}
       {activeTab === 'swap-dex' && (
         <DexSwap defaultFromToken={dcTokenInfo} defaultToToken={tokenInfo} />
       )}
       
       {/* Liquidity Tab - Unified Interface */}
       {activeTab === 'liquidity' && (
         <DexUnifiedLiquidity
           token={initialToken}
           pools={pools}
           liquidityPositions={liquidityPositions}
           dcToken={dcTokenInfo}
           onStake={(position) => {
             setActiveTab('farm');
             playSound('click');
           }}
           soundsEnabled={true}
         />
       )}

       {/* Pool Detail Tab - Kept for backward compatibility */}
       {activeTab === 'pool-detail' && selectedPoolAddress && (
         <div>
           <button
             onClick={() => setActiveTab('liquidity')}
             className="mb-4 text-sm text-gray-400 hover:text-white flex items-center gap-2"
           >
             <ArrowDown size={16} className="rotate-90" /> Back to Liquidity & Pools
           </button>
           <DexPoolDetail poolAddress={selectedPoolAddress} />
         </div>
       )}

       {/* Legacy Farm Tab - Multi-Farm View */}
       {activeTab === 'farm' && (
          <div className="relative z-10 space-y-4">
             <div className="flex items-center gap-2 mb-2">
                <Sprout size={18} className="text-green-500" />
                <h3 className="text-sm font-bold text-white">Available Farms</h3>
                <span className="text-xs text-gray-500">({farmPositions.length} farms)</span>
             </div>

             {/* Farm Cards List */}
             <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {farmPositions.length === 0 ? (
                   <div className="text-center py-8 text-gray-500">
                      <Sprout size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No farms available yet</p>
                   </div>
                ) : (
                   farmPositions.map((farmPos) => {
                      const farmToken = tokens.find(t => t.id === farmPos.tokenId);
                      const farmApy = farmPos.apy || (farmPos.tokenId.split('').reduce((a,b) => a+b.charCodeAt(0), 0) % 5000) + 100;
                      const isStaking = farmPos.stakedAmount > 0;

                      return (
                         <div key={farmPos.tokenId} className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4 hover:border-green-500/30 transition-all">
                            {/* Farm Header */}
                            <div className="flex items-center gap-3 mb-3">
                               <img
                                  src={farmToken?.imageUrl || 'https://dogechain.dog/favicon.png'}
                                  className="w-10 h-10 rounded-full"
                                  alt={farmToken?.ticker || 'Token'}
                               />
                               <div className="flex-1">
                                  <div className="font-bold text-white">{farmToken?.name || 'Unknown Token'}</div>
                                  <div className="text-xs text-gray-500">{farmToken?.ticker || 'UNKNOWN'}</div>
                               </div>
                               <div className="text-right">
                                  <div className="text-xs text-gray-500">APY</div>
                                  <div className="font-mono font-bold text-green-400">{formatNumber(farmApy)}%</div>
                               </div>
                            </div>

                            {/* Farm Stats */}
                            <div className="grid grid-cols-2 gap-2 mb-3">
                               <div className="bg-white/[0.03] rounded-xl p-2 border border-white/5">
                                  <div className="text-[10px] text-gray-500 uppercase">Staked</div>
                                  <div className="font-mono font-bold text-white">{formatNumber(farmPos.stakedAmount)}</div>
                               </div>
                               <div className="bg-white/[0.03] rounded-xl p-2 border border-white/5">
                                  <div className="text-[10px] text-gray-500 uppercase">Earned</div>
                                  <div className="font-mono font-bold text-white">{formatNumber(farmPos.accumulatedRewards || 0)} DC</div>
                               </div>
                            </div>

                            {/* Farm Actions */}
                            {isStaking ? (
                               <div className="space-y-2">
                                  <button
                                     onClick={() => { handleFarmHarvest(); }}
                                     disabled={!farmPos.accumulatedRewards || farmPos.accumulatedRewards <= 0}
                                     className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-xs font-bold rounded-xl py-2.5 transition-colors"
                                  >
                                     Harvest Rewards
                                  </button>
                                  <div className="grid grid-cols-2 gap-2">
                                     <button
                                        onClick={() => { handleFarmUnstake(); }}
                                        className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl py-2.5 transition-colors"
                                     >
                                        Unstake
                                     </button>
                                     <button
                                        onClick={() => { setActiveTab('swap'); }}
                                        className="bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-bold rounded-xl py-2.5 transition-colors"
                                     >
                                        Stake More
                                     </button>
                                  </div>
                               </div>
                            ) : (
                               <button
                                  onClick={() => { setActiveTab('swap'); }}
                                  className="w-full bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/30 text-xs font-bold rounded-xl py-2.5 transition-colors"
                               >
                                  Stake {farmToken?.ticker || 'Tokens'}
                               </button>
                            )}
                         </div>
                      );
                   })
                )}
             </div>
          </div>
       )}

       {/* Context Header for Burn/Reputation */}
       {activeTab !== 'swap' && (
          <div className={`flex items-center gap-3 p-3 rounded-xl border my-6 ${activeTab === 'burn' ? 'bg-orange-500/10 border-orange-500/20' : 'bg-purple-500/10 border-purple-500/20'}`}>
             {activeTab === 'burn' ? <Flame size={20} className="text-orange-500"/> : <Sparkles size={20} className="text-purple-500"/>}
             <div className="text-xs text-gray-300">
                <span className="font-bold block text-white">{activeTab === 'burn' ? 'Burn Tokens' : 'Lock for Reputation'}</span>
                {activeTab === 'burn' ? 'Permanently destroy tokens to reduce supply.' : 'Lock tokens to increase airdrop allocation.'}
             </div>
          </div>
       )}

       <form onSubmit={handleAction} className="space-y-2 relative z-10">
              {/* Input Field (From / Amount) */}
              <div className="bg-[#050505] rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors group">
                <div className="flex justify-between mb-2">
                    <label htmlFor="swap-amount" className="text-xs font-bold text-gray-500 uppercase">{activeTab === 'swap' ? 'From' : 'Amount'}</label>
                    <div className="text-xs text-gray-400 font-mono flex items-center gap-1">
                      <Wallet size={10} />
                      {formatNumber(activeTab === 'swap' ? fromBalance : initialTokenBalance)}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <input
                      type="number"
                      id="swap-amount"
                      name="swapAmount"
                      placeholder="0.00"
                      value={inputAmount}
                      onChange={(e) => setInputAmount(e.target.value)}
                      className="bg-transparent text-3xl font-mono font-bold text-white outline-none w-full placeholder:text-gray-700"
                    />
                    {activeTab === 'swap' ? (
                        <button 
                          type="button" 
                          onClick={() => setSelectingSide('from')}
                          className="shrink-0 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl flex items-center gap-2 transition-colors min-w-[100px] justify-between"
                        >
                          <div className="flex items-center gap-2">
                              <img src={fromToken?.imageUrl} className="w-5 h-5 rounded-full" alt="Token" />
                              <span className="font-bold text-sm text-white">{fromToken?.ticker}</span>
                          </div>
                          <ChevronDown size={14} className="text-gray-400" />
                        </button>
                    ) : (
                        <div className="shrink-0 bg-white/5 px-3 py-1.5 rounded-xl flex items-center gap-2 min-w-[100px]">
                           <img src={initialToken.imageUrl} className="w-5 h-5 rounded-full" alt="Token" />
                           <span className="font-bold text-sm text-white">{initialToken.ticker}</span>
                        </div>
                    )}
                </div>
                <div className="flex justify-end mt-2">
                    <button type="button" onClick={handleMax} className="text-[10px] text-purple-400 font-bold hover:text-purple-300 uppercase tracking-wider">Max</button>
                </div>
              </div>

              {/* Swap Interface Extras */}
              {activeTab === 'swap' && (
                  <>
                    <div className="flex justify-center -my-3 relative z-20">
                        <button 
                          type="button"
                          onClick={switchTokens}
                          className="bg-[#1a1a1a] border border-white/10 p-2 rounded-xl text-gray-400 hover:text-white hover:scale-110 transition-all shadow-xl"
                        >
                            <ArrowDown size={16} />
                        </button>
                    </div>

                    <div className="bg-[#050505] rounded-2xl p-4 border border-white/5">
                        <div className="flex justify-between mb-2">
                            <span className="text-xs font-bold text-gray-500 uppercase">To (Estimate)</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-3xl font-mono font-bold text-gray-300 w-full">
                              {formatNumber(estimatedOutput)}
                            </div>
                            <button 
                              type="button" 
                              onClick={() => setSelectingSide('to')}
                              className="shrink-0 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl flex items-center gap-2 transition-colors min-w-[100px] justify-between"
                            >
                              <div className="flex items-center gap-2">
                                  <img src={toToken?.imageUrl} className="w-5 h-5 rounded-full" alt="Token" />
                                  <span className="font-bold text-sm text-white">{toToken?.ticker}</span>
                              </div>
                              <ChevronDown size={14} className="text-gray-400" />
                            </button>
                        </div>
                    </div>

                    <div className="p-3 space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Price Impact</span>
                            <span className={`font-mono font-bold ${parseFloat(priceImpact) > 2 ? 'text-red-400' : 'text-green-400'}`}>
                              {priceImpact}%
                            </span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Liquidity Provider Fee</span>
                            <span className="font-mono text-gray-300">0.3%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Route</span>
                            <span className="font-mono text-gray-300 flex items-center gap-1">
                              {fromToken?.ticker} <ArrowDown size={10} className="-rotate-90"/> {fromTokenId === 'DC' || toTokenId === 'DC' ? '' : 'DC > '} {toToken?.ticker}
                            </span>
                        </div>
                    </div>
                  </>
              )}

              <Button 
                type="submit" 
                isLoading={isProcessing}
                className={`w-full h-16 rounded-2xl text-lg font-bold border-0 shadow-lg ${
                   activeTab === 'swap' ? 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 shadow-purple-900/20' :
                   activeTab === 'burn' ? 'bg-orange-600 hover:bg-orange-500 shadow-orange-900/20' :
                   'bg-purple-600 hover:bg-purple-500 shadow-purple-900/20'
                }`}
              >
                {activeTab === 'swap' ? (
              <>
                <RefreshCw size={16} className="mr-2" />
                Swap
              </>
             ) : activeTab === 'burn' ? (
              <>
                <Flame size={16} className="mr-2" />
                Burn
              </>
             ) : (
              <>
                <Sparkles size={16} className="mr-2" />
                Lock
              </>
             )}
              </Button>
              
              {activeTab === 'swap' && (
                  <div className="text-center pt-2">
                    <a href="#" className="text-[10px] text-gray-600 hover:text-gray-400 flex items-center justify-center gap-1 transition-colors">
                        View Pair on Explorer <ExternalLink size={10} />
                    </a>
                  </div>
              )}
          </form>
    </div>
  );
};