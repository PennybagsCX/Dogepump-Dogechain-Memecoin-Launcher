import React, { useState } from 'react';
import { User, Copy, Wallet, Coins, TrendingUp, TrendingDown, Share2, Users, Edit2, Download, ArrowUpRight, Trash2, Star, Video, Radio, Zap, Settings, StopCircle, Rocket, Trophy, AlertTriangle, Ban, Clock } from 'lucide-react';
import { Button } from '../components/Button';
import { formatCurrency, formatNumber, formatAddress } from '../services/web3Service';
import { useToast } from '../components/Toast';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useStore } from '../contexts/StoreContext';
import { timeAgo, generateShareCard, downloadCSV } from '../utils';
import { playSound } from '../services/audio';
import { SettingsModal } from '../components/SettingsModal';
import { Badge } from '../components/Badge';
import { PortfolioChart } from '../components/PortfolioChart';
import { CreatorAdmin } from '../components/CreatorAdmin';
import { OptimizedImage } from '../components/OptimizedImage';
import { Breadcrumb } from '../components/Breadcrumb';

const Profile: React.FC = () => {
  const { address } = useParams();
  const { addToast } = useToast();
  const { myHoldings, tokens, trades, userProfile, activeOrders, cancelOrder, priceHistory, userBalanceDC, watchlist, toggleWatchlist, copyTargets, unfollowUser, resolveUsername, userAddress, warnedUsers, bannedUsers } = useStore();
  const [activeTab, setActiveTab] = useState<'held' | 'dashboard' | 'activity' | 'orders' | 'watchlist' | 'moderation'>('held');
  const [showSettings, setShowSettings] = useState(false);
  const [managingTokenId, setManagingTokenId] = useState<string | null>(null);
  
  // Determine if viewing self or another user
  const isSelf = !address || address === 'You' || address === userAddress;
  const profileAddress = isSelf ? (userAddress || "0x71C...9A23") : address!;

  // Use real profile data if self
  const displayName = isSelf ? userProfile.username : resolveUsername(profileAddress);
  const displayBio = isSelf ? userProfile.bio : 'Just another diamond hand.';
  const displayAvatar = isSelf ? userProfile.avatarUrl : '';
  // Deduplicate badges by id to prevent React key warnings
  const badges = isSelf ? Array.from(
    new Map(userProfile.badges.map((b: any) => [b.id, b])).values()
  ) : [];

  // --- DATA FILTERING ---
  
  let displayedHoldings: any[] = [];
  
  if (isSelf) {
     displayedHoldings = myHoldings.map(h => {
        const token = tokens.find(t => t.id === h.tokenId);
        if (!token) return null;
        
        const currentValue = h.balance * token.price;
        const myBuys = trades.filter(t => t.tokenId === token.id && t.type === 'buy' && t.user === 'You');
        
        let totalCost = 0;
        let totalTokensBought = 0;
        
        myBuys.forEach(trade => {
           totalCost += trade.amountDC;
           totalTokensBought += trade.amountToken;
        });
   
        const avgBuyPrice = totalTokensBought > 0 ? totalCost / totalTokensBought : 0;
        const pnlPercent = avgBuyPrice > 0 ? ((token.price - avgBuyPrice) / avgBuyPrice) * 100 : 0;
   
        return { ...token, balance: h.balance, value: currentValue, pnl: pnlPercent, avgBuyPrice };
     }).filter(t => t !== null);
  } else {
     // Mock holdings for public profiles based on created tokens
     displayedHoldings = tokens
        .filter(t => t.creator === profileAddress)
        .map(t => ({
           ...t,
           balance: t.supply * 0.05,
           value: (t.supply * 0.05) * t.price,
           pnl: 100,
           avgBuyPrice: t.price * 0.5 
        }));
  }

  const watchlistTokens = tokens.filter(t => watchlist.includes(t.id));
  const totalPortfolioValue = displayedHoldings.reduce((acc, curr) => acc + curr.value, 0) + (isSelf ? userBalanceDC : 0);
  const createdTokens = tokens.filter(t => isSelf ? t.creator === 'You' : t.creator === profileAddress);
  const activityData = trades.filter(t => isSelf ? t.user === 'You' : t.user === profileAddress).sort((a, b) => b.timestamp - a.timestamp);

  const handleCopy = () => {
    navigator.clipboard.writeText(profileAddress);
    addToast('success', 'Address copied to clipboard');
  };

  const handleSharePnL = async (token: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    playSound('click');
    addToast('info', 'Preparing brag card...', 'Generating Image');
    
    try {
        const dataUrl = await generateShareCard({ ...token, progress: token.pnl }); 
        if (dataUrl) {
            // 1. Convert DataURL to Blob for Clipboard API
            const response = await fetch(dataUrl);
            const blob = await response.blob();

            // 2. Try to copy image to clipboard
            try {
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]);
                addToast('success', 'Image copied! Paste it in the tweet.', 'Ready to Flex');
            } catch (err) {
                // Fallback: Download it
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = `${token.ticker}_pnl_card.png`;
                link.click();
                addToast('success', 'Image downloaded!', 'Saved');
            }

            // 3. Open Twitter Intent with pre-filled text
            const pnlSymbol = token.pnl > 0 ? '↗' : '↘';
            const text = `I'm up ${token.pnl.toFixed(2)}% on $${token.ticker} via @DogePumpFun! ${pnlSymbol}\n\nFair Launch on Dogechain.\n\n#DogePump #Dogechain #Memecoins`;
            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent('https://dogepump.fun')}`;
            
            setTimeout(() => {
                window.open(twitterUrl, '_blank');
            }, 1500);
            playSound('success');
        }
    } catch (e) {
        addToast('error', 'Could not generate image.');
    }
  };

  const handleExportCSV = () => {
     const data = activityData.map(t => {
        const token = tokens.find(tk => tk.id === t.tokenId);
        return {
           Type: t.type.toUpperCase(),
           Token: token ? token.name : 'Unknown',
           Ticker: token ? token.ticker : '???',
           Amount: t.amountToken,
           Price: t.price,
           ValueDC: t.amountDC,
           Date: new Date(t.timestamp).toISOString(),
           TxHash: t.txHash
        };
     });
     
     downloadCSV(data, 'dogepump_activity.csv');
     playSound('success');
     addToast('success', 'Exported activity to CSV');
  };

  const managingToken = managingTokenId ? tokens.find(t => t.id === managingTokenId) : null;

  return (
    <div className="space-y-12 animate-fade-in pb-12">
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <Breadcrumb items={[
        { name: 'Home', url: '/' },
        { name: 'Profile', url: isSelf ? '/profile' : `/profile/${profileAddress}` }
      ]} />

      {/* Profile Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0A0A0A] border border-white/10 shadow-2xl p-8 md:p-12">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-doge/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        
        <div className="relative z-10 grid lg:grid-cols-2 gap-10">
           <div className="flex flex-col gap-8">
                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                    {/* Avatar */}
                    <div className="relative group">
                        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-doge-dark to-doge p-1 shadow-[0_0_40px_rgba(212,175,55,0.2)]">
                            <div className="w-full h-full bg-black rounded-full flex items-center justify-center overflow-hidden relative">
                                {displayAvatar ? (
                                    <OptimizedImage src={displayAvatar} alt="Avatar" className="w-full h-full object-cover" loading="eager" fetchPriority="high" />
                                ) : (
                                    <>
                                        <User size={48} className="text-doge opacity-50" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" style={{ mixBlendMode: 'overlay' }}></div>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="absolute bottom-0 right-0 bg-[#0A0A0A] border border-doge/30 text-doge p-2 rounded-full shadow-lg">
                            <Wallet size={14} />
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-2">
                        <div className="flex items-center justify-center md:justify-start gap-3">
                            <h1 className="text-3xl font-comic font-bold text-white">{displayName}</h1>
                            {isSelf && (
                                <button onClick={() => setShowSettings(true)} className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 hover:text-doge transition-colors">
                                    <Edit2 size={14} />
                                </button>
                            )}
                        </div>
                        <p className="text-gray-400 text-sm max-w-sm mx-auto md:mx-0 italic">"{displayBio}"</p>
                        <div className="flex items-center justify-center md:justify-start gap-3">
                            <span className="font-mono text-gray-500 bg-white/5 px-3 py-1 rounded-lg border border-white/5 flex items-center gap-2 text-xs">
                                {formatAddress(profileAddress)}
                                <Copy size={12} className="cursor-pointer hover:text-doge transition-colors" onClick={handleCopy}/>
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">Portfolio Value</div>
                        <div className="text-2xl font-mono text-white font-bold">{formatCurrency(totalPortfolioValue)}</div>
                    </div>
                    <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">Launched</div>
                        <div className="text-2xl font-mono text-doge font-bold">{createdTokens.length}</div>
                    </div>
                </div>
           </div>

           {/* Portfolio Chart Area */}
           {isSelf && (
                <div className="h-[400px] lg:h-[450px] bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
                    <div className="h-full w-full p-4">
                        <PortfolioChart
                            trades={trades}
                            tokens={tokens}
                            priceHistory={priceHistory}
                            currentBalance={totalPortfolioValue}
                        />
                    </div>
                </div>
           )}
        </div>
      </div>
      
      {/* Achievement Showcase */}
      {isSelf && badges.length > 0 && (
          <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-4 mb-4">
                  <Trophy size={18} className="text-doge" /> Achievements Unlocked
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                  {badges.map((badge: any) => (
                      <div key={badge.id} className="bg-white/[0.02] p-4 rounded-xl border border-white/5 flex flex-col items-center text-center gap-2 group hover:border-doge/30 transition-colors">
                          <div className="scale-125">
                              <Badge type={badge.id} size="md" showTooltip={false} />
                          </div>
                          <div>
                              <div className="text-xs font-bold text-white">{badge.label}</div>
                              <div className="text-[9px] text-gray-500">{new Date(badge.unlockedAt || Date.now()).toLocaleDateString()}</div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* Content Tabs */}
      <div className="space-y-6">
         <div className="flex gap-4 border-b border-white/10 pb-1 overflow-x-auto">
            <button 
              onClick={() => setActiveTab('held')}
              className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative shrink-0 ${
                activeTab === 'held' ? 'text-white' : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              Portfolio
              {activeTab === 'held' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-doge shadow-[0_0_10px_#D4AF37]"></div>}
            </button>
            <button 
              onClick={() => { setActiveTab('dashboard'); setManagingTokenId(null); }}
              className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative shrink-0 ${
                activeTab === 'dashboard' ? 'text-white' : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              Command Center
              {activeTab === 'dashboard' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-doge shadow-[0_0_10px_#D4AF37]"></div>}
            </button>
            {isSelf && (
                <button 
                  onClick={() => setActiveTab('watchlist')}
                  className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative shrink-0 ${
                    activeTab === 'watchlist' ? 'text-white' : 'text-gray-600 hover:text-gray-400'
                  }`}
                >
                  Watchlist
                  {activeTab === 'watchlist' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-doge shadow-[0_0_10px_#D4AF37]"></div>}
                </button>
            )}
            {isSelf && (
                <button 
                  onClick={() => setActiveTab('orders')}
                  className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative shrink-0 ${
                    activeTab === 'orders' ? 'text-white' : 'text-gray-600 hover:text-gray-400'
                  }`}
                >
                  Orders
                  {activeTab === 'orders' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-doge shadow-[0_0_10px_#D4AF37]"></div>}
                </button>
            )}
            <button
              onClick={() => setActiveTab('activity')}
              className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative shrink-0 ${
                activeTab === 'activity' ? 'text-white' : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              Activity
              {activeTab === 'activity' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-doge shadow-[0_0_10px_#D4AF37]"></div>}
            </button>
            {isSelf && (
              <button
                onClick={() => setActiveTab('moderation')}
                className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative shrink-0 ${
                  activeTab === 'moderation' ? 'text-white' : 'text-gray-600 hover:text-gray-400'
                }`}
              >
                Moderation
                {activeTab === 'moderation' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-doge shadow-[0_0_10px_#D4AF37]"></div>}
              </button>
            )}
         </div>

         <div className="min-h-[300px]">
           {activeTab === 'held' && (
             <div className="grid gap-4">
                {displayedHoldings.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">
                       {isSelf ? "You don't own any coins yet." : "This user holds no tokens."}
                    </div>
                ) : (
                    displayedHoldings.map((token, idx) => (
                    <Link to={`/token/${token.id}`} key={idx} className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 flex items-center justify-between hover:border-doge/30 transition-all group hover:bg-white/[0.02]">
                        <div className="flex items-center gap-4">
                            <OptimizedImage src={token.imageUrl} className="w-12 h-12 rounded-xl bg-gray-800 object-cover" alt={token.name} loading="lazy" fetchPriority="low" />
                            <div>
                            <h3 className="font-bold text-white group-hover:text-doge transition-colors">{token.name}</h3>
                            <span className="text-xs text-gray-500 font-mono">${token.ticker}</span>
                            </div>
                        </div>
                        
                        <div className="text-right flex items-center gap-8">
                            <div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider font-bold">Balance</div>
                                <div className="font-mono text-white font-bold">{formatNumber(token.balance)}</div>
                            </div>
                            <div className="hidden md:block">
                                <div className="text-xs text-gray-500 uppercase tracking-wider font-bold">Value</div>
                                <div className="font-mono text-white font-bold">{formatCurrency(token.value)}</div>
                            </div>
                            
                            {/* Entry vs Current Price */}
                            <div className="hidden lg:block text-right">
                                <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Entry / Curr</div>
                                <div className="font-mono text-sm text-gray-400">
                                    ${token.avgBuyPrice?.toFixed(6) || '0.00'} / <span className="text-white">${token.price.toFixed(6)}</span>
                                </div>
                            </div>

                            <div className={`hidden md:block font-mono font-bold ${token.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {token.pnl >= 0 ? '+' : ''}{token.pnl.toFixed(2)}%
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={(e) => handleSharePnL(token, e)} className="p-2 rounded-full bg-white/5 hover:bg-white/10 hover:text-white text-gray-500" title="Share PnL">
                                   <Share2 size={16} />
                                </button>
                                <ArrowUpRight size={16} className="text-gray-600 group-hover:text-white" />
                            </div>
                        </div>
                    </Link>
                    ))
                )}
             </div>
           )}

           {activeTab === 'watchlist' && (
             <div className="grid gap-4">
                {watchlistTokens.length === 0 ? (
                    <div className="text-center text-gray-500 py-10 flex flex-col items-center gap-2">
                       <Star size={32} className="text-gray-600" />
                       No favorites yet. Star tokens on the board!
                    </div>
                ) : (
                    watchlistTokens.map((token) => (
                    <Link to={`/token/${token.id}`} key={token.id} className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 flex items-center justify-between hover:border-doge/30 transition-all group hover:bg-white/[0.02]">
                        <div className="flex items-center gap-4">
                            <OptimizedImage src={token.imageUrl} className="w-12 h-12 rounded-xl bg-gray-800 object-cover" alt={token.name} loading="lazy" fetchPriority="low" />
                            <div>
                            <h3 className="font-bold text-white group-hover:text-doge transition-colors">{token.name}</h3>
                            <span className="text-xs text-gray-500 font-mono">${token.ticker}</span>
                            </div>
                        </div>
                        
                        <div className="text-right flex items-center gap-8">
                            <div className="hidden md:block">
                                <div className="text-xs text-gray-500 uppercase tracking-wider font-bold">Market Cap</div>
                                <div className="font-mono text-white font-bold">{formatCurrency(token.marketCap)}</div>
                            </div>
                            <div className="hidden md:block">
                                <div className="text-xs text-gray-500 uppercase tracking-wider font-bold">Price</div>
                                <div className="font-mono text-white font-bold">${token.price.toFixed(6)}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={(e) => { e.preventDefault(); toggleWatchlist(token.id); }} 
                                    className="p-2 rounded-full bg-doge/10 text-doge hover:bg-doge/20 transition-colors"
                                >
                                   <Star size={16} fill="currentColor" />
                                </button>
                                <ArrowUpRight size={16} className="text-gray-600 group-hover:text-white" />
                            </div>
                        </div>
                    </Link>
                    ))
                )}
             </div>
           )}

           {activeTab === 'dashboard' && (
             managingToken ? (
                 <div className="animate-fade-in">
                     <CreatorAdmin token={managingToken} onBack={() => setManagingTokenId(null)} defaultTab="stream" />
                 </div>
             ) : (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                    {/* Created Projects */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
                            <Rocket size={18} className="text-doge" /> My Projects
                        </h3>
                        {createdTokens.length === 0 ? (
                            <div className="p-8 text-center bg-white/[0.02] rounded-2xl border border-white/5 text-gray-500">
                                No projects launched yet.
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {createdTokens.map(token => (
                                    <Link
                                        to={`/token/${token.id}`}
                                        key={token.id}
                                        className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4 flex items-center justify-between group hover:border-white/20 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <OptimizedImage src={token.imageUrl} className="w-12 h-12 rounded-xl object-cover" alt={token.name} loading="lazy" fetchPriority="low" />
                                            <div>
                                                <div className="font-bold text-white">{token.name}</div>
                                                <div className="text-xs text-gray-500 font-mono">${token.ticker}</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {token.isLive && <div className="text-[10px] bg-red-600 text-white px-2 py-1 rounded flex items-center gap-1 animate-pulse"><Radio size={10}/> LIVE</div>}
                                            <Button 
                                                size="sm" 
                                                onClick={(e) => { e.preventDefault(); setManagingTokenId(token.id); playSound('click'); }}
                                                className="bg-white/10 hover:bg-white/20 border-0 text-white"
                                            >
                                                <Settings size={14} className="mr-2"/> Manage
                                            </Button>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Copy Trade Manager */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
                            <Zap size={18} className="text-blue-400" /> Copy Trading
                        </h3>
                        {copyTargets.length === 0 ? (
                            <div className="p-8 text-center bg-white/[0.02] rounded-2xl border border-white/5 text-gray-500">
                                Not following anyone. Copy users from the Explorer.
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {copyTargets.map(target => (
                                    <div key={target.address} className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4 flex items-center justify-between group hover:border-blue-500/30 transition-colors relative overflow-hidden">
                                        {target.active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>}
                                        <div className="flex items-center gap-4 pl-2">
                                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                                                <Users size={20} />
                                            </div>
                                            <div>
                                                <div className="font-mono font-bold text-white text-sm">{resolveUsername(target.address)}</div>
                                                <div className="text-[10px] text-gray-500">Max: {target.maxAmountDC} DC/trade</div>
                                            </div>
                                        </div>
                                        <div className="text-right flex items-center gap-4">
                                            <div>
                                                <div className="text-[10px] text-gray-500 uppercase">Copied Vol</div>
                                                <div className="text-sm font-mono text-white">{formatNumber(target.totalCopiedVolume)}</div>
                                            </div>
                                            <button 
                                                onClick={() => unfollowUser(target.address)} 
                                                className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-500 transition-colors"
                                                title="Stop Copying"
                                            >
                                                <StopCircle size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                 </div>
             )
           )}
           
           {activeTab === 'orders' && (
              <div className="space-y-2">
                 {activeOrders.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">No open orders.</div>
                 ) : (
                    activeOrders.map(order => (
                       <div key={order.id} className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:border-white/10 transition-colors">
                          <div className="flex items-center gap-4">
                             <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${order.type === 'buy' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                {order.type === 'buy' ? 'BUY' : 'SELL'}
                             </div>
                             <div>
                                <div className="text-sm font-bold text-white flex items-center gap-2">
                                   {formatNumber(order.amount)} {order.type === 'buy' ? 'DC' : order.ticker} 
                                   <Link to={`/token/${order.tokenId}`} className="text-gray-500 hover:text-white transition-colors">
                                      <ArrowUpRight size={14} />
                                   </Link>
                                </div>
                                <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                                   {order.mode} @ ${order.price.toFixed(6)}
                                </div>
                             </div>
                          </div>
                          <div className="flex items-center gap-4">
                             <div className="text-right hidden md:block">
                                <div className="text-xs text-gray-500">Value</div>
                                <div className="font-mono text-white text-sm">
                                   {order.type === 'buy' ? formatNumber(order.amount) : formatNumber(order.amount * order.price)} DC
                                </div>
                             </div>
                             <Button size="sm" onClick={() => cancelOrder(order.id)} className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border-0">
                                <Trash2 size={16} />
                             </Button>
                          </div>
                       </div>
                    ))
                 )}
              </div>
           )}

           {activeTab === 'activity' && (
             <div className="space-y-4">
                <div className="flex justify-end mb-4">
                   {activityData.length > 0 && (
                      <Button size="sm" variant="secondary" onClick={handleExportCSV} className="gap-2">
                         <Download size={14} /> Export CSV
                      </Button>
                   )}
                </div>
                {activityData.length === 0 ? (
                  <div className="text-center text-gray-500 py-10">No recent activity.</div>
                ) : (
                  activityData.map((trade, idx) => {
                    const token = tokens.find(t => t.id === trade.tokenId);
                    return (
                      <div key={trade.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex items-center justify-between animate-slide-up">
                         <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${trade.type === 'buy' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                               {trade.type === 'buy' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                            </div>
                            <div>
                               <div className="flex items-center gap-2">
                                  <span className="font-bold text-white uppercase">{trade.type}</span>
                                  <span className="text-gray-400 text-sm">
                                    {formatNumber(trade.amountToken)} {token?.ticker}
                                  </span>
                               </div>
                               <div className="text-xs text-gray-600 font-mono">
                                  {timeAgo(trade.timestamp)} • {token?.name}
                                </div>
                            </div>
                         </div>
                         <div className="text-right">
                            <div className="font-mono font-bold text-white">{formatNumber(trade.amountDC)} DC</div>
                            <div className="text-xs text-gray-500">@ ${trade.price.toFixed(6)}</div>
                         </div>
                      </div>
                    );
                  })
                )}
             </div>
           )}

          {activeTab === 'moderation' && (
            <div className="space-y-6 animate-fade-in">
              {/* Warnings Section */}
              <div className="bg-[#0A0A0A] border border-yellow-500/20 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle size={20} className="text-yellow-500" />
                  Warnings
                </h3>
                {warnedUsers.filter(w => w.isActive).length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <AlertTriangle size={32} className="mx-auto mb-2 text-gray-600" />
                    No active warnings
                  </div>
                ) : (
                  <div className="space-y-3">
                    {warnedUsers.filter(w => w.isActive).map((warning, idx) => (
                      <div key={idx} className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle size={16} className="text-yellow-500 shrink-0" />
                              <span className="text-sm font-semibold text-yellow-400">
                                {warning.reason}
                              </span>
                            </div>
                            {warning.notes && (
                              <p className="text-sm text-gray-300 mt-2">{warning.notes}</p>
                            )}
                            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {new Date(warning.warnedAt).toLocaleDateString()} at {new Date(warning.warnedAt).toLocaleTimeString()}
                              </span>
                              {warning.expiresAt && (
                                <span>Expires: {new Date(warning.expiresAt).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bans Section */}
              <div className="bg-[#0A0A0A] border border-red-500/20 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Ban size={20} className="text-red-500" />
                  Bans
                </h3>
                {bannedUsers.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <Ban size={32} className="mx-auto mb-2 text-gray-600" />
                    No bans on record
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bannedUsers.map((ban, idx) => (
                      <div key={idx} className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Ban size={16} className="text-red-500 shrink-0" />
                              <span className="text-sm font-semibold text-red-400">
                                {ban.reason}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                ban.permanent ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
                              }`}>
                                {ban.permanent ? 'Permanent' : 'Temporary'}
                              </span>
                            </div>
                            {ban.notes && (
                              <p className="text-sm text-gray-300 mt-2">{ban.notes}</p>
                            )}
                            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {new Date(ban.bannedAt).toLocaleDateString()} at {new Date(ban.bannedAt).toLocaleTimeString()}
                              </span>
                              {!ban.permanent && ban.expiresAt && (
                                <span>Expires: {new Date(ban.expiresAt).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Info Notice */}
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                <p className="text-sm text-blue-200">
                  <strong>Moderation Status:</strong> Active warnings and bans are shown above. Warnings expire after 30 days. For questions about your moderation status, please contact support.
                </p>
              </div>
            </div>
          )}
         </div>
      </div>
    </div>
  );
};

export default Profile;