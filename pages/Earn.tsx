
import React, { useState, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Sprout, Wheat, Tractor, Lock, ArrowRight, Info, AlertTriangle, Plus, Award, Users, Crown, Sparkles, TrendingUp, Wallet, Settings2 } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { formatCurrency, formatNumber } from '../services/web3Service';
import { Button } from '../components/Button';
import { playSound } from '../services/audio';
import { useToast } from '../components/Toast';
import { Link, useNavigate } from 'react-router-dom';
import { FarmDiscovery } from '../components/FarmDiscovery';
import { CreateFarmModal } from '../components/CreateFarmModal';
import { useAuth } from '../contexts/AuthContext';
import { FarmErrorBoundary } from '../components/error/FarmErrorBoundary';

const Earn: React.FC = () => {
  const { tokens, farmPositions, myHoldings, stakeToken, unstakeToken, harvestRewards, tokenOwnerFarms, createFarm, getMyFarms } = useStore();
  const { addToast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [stakeAmounts, setStakeAmounts] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'core' | 'community' | 'my-farms'>('core');
  const [isCreateFarmModalOpen, setIsCreateFarmModalOpen] = useState(false);
  const [selectedTokenForFarm, setSelectedTokenForFarm] = useState<any>(null);

  // Get farms owned by current user
  const myFarms = useMemo(() => {
    if (!isAuthenticated) return [];
    return getMyFarms();
  }, [tokenOwnerFarms, isAuthenticated]);

  // Only graduated tokens can have farms
  const farmableTokens = tokens.filter(t => t.progress >= 100);

  const handleStake = useCallback((tokenId: string) => {
    const amount = parseFloat(stakeAmounts[tokenId] || '0');
    const balance = myHoldings.find(h => h.tokenId === tokenId)?.balance || 0;

    if (amount <= 0) return;
    if (amount > balance) {
       addToast('error', 'Insufficient Balance');
       return;
    }

    stakeToken(tokenId, amount);
    setStakeAmounts({ ...stakeAmounts, [tokenId]: '' });
    playSound('click');
  }, [stakeAmounts, myHoldings, stakeToken, setStakeAmounts, playSound, addToast]);

  const handleUnstake = useCallback((tokenId: string) => {
    const farm = farmPositions.find(f => f.tokenId === tokenId);
    if (!farm || farm.stakedAmount <= 0) return;

    unstakeToken(tokenId, farm.stakedAmount); // Unstake all for simplicity in UI
    playSound('click');
  }, [farmPositions, unstakeToken, playSound]);

  const handleHarvest = useCallback((tokenId: string) => {
    harvestRewards(tokenId);
  }, [harvestRewards]);

  const handleMax = useCallback((tokenId: string) => {
     const balance = myHoldings.find(h => h.tokenId === tokenId)?.balance || 0;
     setStakeAmounts({ ...stakeAmounts, [tokenId]: balance.toString() });
     playSound('click');
  }, [myHoldings, setStakeAmounts, playSound]);

  const handleCreateFarm = useCallback((token: any) => {
    if (!isAuthenticated) {
      addToast('error', 'Please connect your wallet first');
      return;
    }
    setSelectedTokenForFarm(token);
    setIsCreateFarmModalOpen(true);
    playSound('click');
  }, [isAuthenticated, addToast, setSelectedTokenForFarm, setIsCreateFarmModalOpen, playSound]);

  const handleFarmClick = useCallback((farm: any) => {
    // Navigate to token detail page with farms tab
    navigate(`/token/${farm.stakingTokenId}?tab=farms`);
    playSound('click');
  }, [navigate, playSound]);

  return (
    <>
      <Helmet>
        <title>Earn Rewards | DogePump Dogechain</title>
        <meta name="description" content="Stake your graduated tokens on DogePump to earn passive $DC rewards. High APY yield farming with auto-compound rewards." />
        <link rel="canonical" href="https://dogepump.com/earn" />
        <meta property="og:title" content="Earn Rewards | DogePump Dogechain" />
        <meta property="og:description" content="Stake your graduated tokens on DogePump to earn passive $DC rewards. High APY yield farming with auto-compound rewards." />
        <meta property="og:url" content="https://dogepump.com/earn" />
        <meta name="twitter:title" content="Earn Rewards | DogePump Dogechain" />
        <meta name="twitter:description" content="Stake your graduated tokens on DogePump to earn passive $DC rewards. High APY yield farming with auto-compound rewards." />
      </Helmet>
    <div className="space-y-12 animate-fade-in pb-12">
       {/* Hero */}
       <div className="text-center relative py-8">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-500/10 blur-[80px] rounded-full pointer-events-none"></div>
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#0A0A0A] border border-green-500/20 rounded-3xl mb-6 shadow-[0_0_40px_rgba(34,197,94,0.2)] relative z-10 animate-float">
             <Tractor size={40} className="text-green-500" />
          </div>
          <h1 className="text-5xl md:text-6xl font-comic font-bold text-white mb-4 relative z-10">
             Doge<span className="text-green-500">Farm</span>
          </h1>
          <p className="text-gray-400 max-w-md mx-auto text-lg relative z-10">
             Stake your graduated tokens to earn passive $DC rewards. High risk, high yield.
          </p>

          {/* DEMO MODE Badge */}
          <div className="mt-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <AlertTriangle size={16} className="text-yellow-500" />
              <span className="text-yellow-500 text-sm font-semibold">DEMO MODE</span>
              <span className="text-gray-400 text-sm">• No real transactions</span>
            </div>
            <p className="text-xs text-gray-500 mt-2 max-w-sm mx-auto">
              All staking operations are simulations for testing purposes. No blockchain transactions occur.
            </p>
          </div>

          {/* Prominent Create Farm Button for Token Owners */}
          {isAuthenticated && (
            <div className="mt-8 relative z-10">
              <button
                onClick={() => { setIsCreateFarmModalOpen(true); playSound('click'); }}
                className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-doge to-doge-light text-black font-bold text-lg rounded-2xl shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:shadow-[0_0_50px_rgba(212,175,55,0.6)] hover:scale-105 transition-all duration-300"
              >
                <Sparkles size={24} className="animate-pulse" />
                <span>Create Farm</span>
                <Crown size={20} className="opacity-70" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </button>
              <p className="text-xs text-gray-500 mt-3">
                Launch your own staking farm and reward your community
              </p>
            </div>
          )}
       </div>

       {/* My Farms Section - Only visible if user has farms */}
       {isAuthenticated && myFarms.length > 0 && (
         <div className="bg-gradient-to-br from-doge/5 to-doge/10 border border-doge/30 rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-doge/20 blur-[80px] rounded-full pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Crown size={28} className="text-doge" />
                  <div>
                    <h2 className="text-2xl font-bold text-white">My Farms</h2>
                    <p className="text-sm text-gray-400">Manage your staking farms</p>
                  </div>
                </div>
                <button
                  onClick={() => { setActiveTab('my-farms'); playSound('click'); }}
                  className="px-4 py-2 bg-doge hover:bg-doge-light text-black font-bold rounded-xl transition-all flex items-center gap-2"
                >
                  <Settings2 size={16} />
                  Manage All
                </button>
              </div>

              {/* My Farms Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myFarms.slice(0, 3).map(farm => {
                  const rewardToken = tokens.find(t => t.id === farm.rewardTokenId);
                  const stakingToken = tokens.find(t => t.id === farm.stakingTokenId);
                  const currentAPY = farm.stats.totalStaked > 0
                    ? Math.min((farm.config.rewardRate * 86400 * 365 * 100) / farm.stats.totalStaked, 50000)
                    : 0;

                  return (
                    <div key={farm.id} className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-5 hover:border-doge/50 transition-all group">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {rewardToken?.imageUrl && (
                            <img src={rewardToken.imageUrl} alt={rewardToken.name} className="w-10 h-10 rounded-xl border-2 border-doge/30" />
                          )}
                          <div>
                            <h4 className="font-bold text-white text-sm">{rewardToken?.name || 'Unknown'}</h4>
                            <p className="text-xs text-gray-500">Stake {stakingToken?.ticker || 'TOKEN'}</p>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded-lg text-xs font-bold ${
                          farm.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {farm.status === 'active' ? 'Active' : 'Paused'}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-white/[0.02] rounded-lg p-2">
                          <div className="text-[10px] text-gray-500 uppercase tracking-wider">APY</div>
                          <div className="text-sm font-bold text-green-400">{currentAPY.toFixed(0)}%</div>
                        </div>
                        <div className="bg-white/[0.02] rounded-lg p-2">
                          <div className="text-[10px] text-gray-500 uppercase tracking-wider">TVL</div>
                          <div className="text-sm font-bold text-white">{formatNumber(farm.stats.totalStaked)}</div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => { navigate(`/token/${farm.stakingTokenId}?tab=farms`); playSound('click'); }}
                          className="flex-1 py-2 bg-doge/20 hover:bg-doge/30 text-doge text-xs font-bold rounded-lg transition-all"
                        >
                          View
                        </button>
                        <button
                          onClick={() => { navigate(`/token/${farm.stakingTokenId}?tab=farms`); playSound('click'); }}
                          className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg transition-all"
                        >
                          Manage
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {myFarms.length > 3 && (
                <button
                  onClick={() => { setActiveTab('my-farms'); playSound('click'); }}
                  className="mt-4 w-full py-3 bg-white/5 hover:bg-white/10 text-gray-300 font-bold rounded-xl transition-all"
                >
                  View All {myFarms.length} Farms
                </button>
              )}
            </div>
         </div>
       )}

       {/* Tabs */}
       <div className="flex gap-2 mb-8">
          <button
            onClick={() => { setActiveTab('core'); playSound('click'); }}
            className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'core'
                ? 'bg-doge text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Award size={16} className="inline mr-2" />
            Core Farms
          </button>
          <button
            onClick={() => { setActiveTab('community'); playSound('click'); }}
            className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'community'
                ? 'bg-doge text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Users size={16} className="inline mr-2" />
            Community Farms
          </button>
          {isAuthenticated && myFarms.length > 0 && (
            <button
              onClick={() => { setActiveTab('my-farms'); playSound('click'); }}
              className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'my-farms'
                  ? 'bg-doge text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <Crown size={16} className="inline mr-2" />
              My Farms
            </button>
          )}
       </div>

       {/* Core Farms Tab */}
       {activeTab === 'core' && (
          <FarmErrorBoundary>
            <>
            {/* Farm Grid */}
            {farmableTokens.length === 0 ? (
               <div className="text-center py-16 border border-dashed border-white/10 rounded-[2.5rem]">
                  <Sprout size={48} className="mx-auto text-gray-600 mb-4 opacity-50" />
                  <h3 className="text-2xl font-bold text-white mb-2">No Active Farms</h3>
                  <p className="text-gray-500">Wait for a token to graduate to start farming.</p>
                  <Link to="/">
                     <Button className="mt-6 rounded-full" variant="secondary">Find Gems</Button>
                  </Link>
               </div>
            ) : (
               <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
             {farmableTokens.map(token => {
                const farm = farmPositions.find(f => f.tokenId === token.id);
                const isStaking = farm && farm.stakedAmount > 0;
                const balance = myHoldings.find(h => h.tokenId === token.id)?.balance || 0;
                // Generate a deterministic pseudo-random APY if not staked, or use staked APY
                const apy = farm?.apy || (token.id.split('').reduce((a,b)=>a+b.charCodeAt(0),0) % 5000) + 100;

                return (
                   <div key={token.id} className="bg-[#0A0A0A] border border-white/10 rounded-[2rem] overflow-hidden shadow-xl group hover:border-green-500/30 transition-all duration-300 relative">
                      {/* Glow */}
                      {isStaking && <div className="absolute -top-20 -right-20 w-40 h-40 bg-green-500/20 blur-[60px] rounded-full pointer-events-none"></div>}
                      
                      {/* Clickable Header Area */}
                      <Link to={`/token/${token.id}`} className="block p-6 border-b border-white/5 relative z-10 hover:bg-white/5 transition-colors cursor-pointer group/header" onClick={(e) => playSound('click')}>
                         <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <img src={token.imageUrl} className="w-14 h-14 rounded-xl object-cover shadow-lg" alt={token.name} />
                                <div>
                                   <h3 className="font-bold text-white text-lg group-hover/header:text-doge transition-colors">{token.ticker}</h3>
                                   <div className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded inline-flex items-center gap-1">
                                      <Lock size={10} /> Core Pool
                                   </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">APY</div>
                                <div className="text-2xl font-mono font-bold text-green-400">{formatNumber(apy)}%</div>
                            </div>
                         </div>
                      </Link>

                      <div className="p-6 space-y-6 relative z-10">
                         {/* Stats */}
                         <div className="grid grid-cols-2 gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                            <div>
                               <div className="text-xs text-gray-500 mb-1">Earned</div>
                               <div className="font-mono font-bold text-white">{formatNumber(farm?.accumulatedRewards || 0)} DC</div>
                            </div>
                            <div className="text-right">
                               <div className="text-xs text-gray-500 mb-1">Staked</div>
                               <div className="font-mono font-bold text-white">{formatNumber(farm?.stakedAmount || 0)} {token.ticker}</div>
                            </div>
                         </div>

                         {/* Actions */}
                         {isStaking ? (
                            <div className="space-y-3">
                               <Button 
                                 onClick={(e) => { e.stopPropagation(); handleHarvest(token.id); }} 
                                 disabled={!farm?.accumulatedRewards || farm.accumulatedRewards <= 0}
                                 className="w-full bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl"
                               >
                                  Harvest Rewards <Wheat size={16} className="ml-2" />
                               </Button>
                               <Button 
                                 onClick={(e) => { e.stopPropagation(); handleUnstake(token.id); }}
                                 variant="secondary"
                                 className="w-full rounded-xl"
                               >
                                  Unstake & Exit
                               </Button>
                            </div>
                         ) : (
                            <div className="space-y-3">
                               <div className="relative">
                                  <input
                                    id={`stake-${token.id}`}
                                    name={`stake-${token.id}`}
                                    type="number"
                                    placeholder="0.00"
                                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white font-mono focus:border-green-500/50 outline-none"
                                    value={stakeAmounts[token.id] || ''}
                                    onChange={(e) => setStakeAmounts({ ...stakeAmounts, [token.id]: e.target.value })}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleMax(token.id); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-gray-300 transition-colors"
                                  >
                                     MAX
                                  </button>
                               </div>
                               <Button 
                                 onClick={(e) => { e.stopPropagation(); handleStake(token.id); }}
                                 disabled={balance <= 0}
                                 className="w-full bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl disabled:opacity-50"
                               >
                                  Approve & Stake
                               </Button>
                               <div className="text-center text-[10px] text-gray-500">
                                  Balance: {formatNumber(balance)} {token.ticker}
                               </div>
                            </div>
                         )}
                      </div>
                   </div>
                );
             })}
          </div>
            )}
          </>
          </FarmErrorBoundary>
       )}

       {/* My Farms Tab */}
       {activeTab === 'my-farms' && (
         <FarmErrorBoundary>
         <div className="space-y-6">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               <Crown size={24} className="text-doge" />
               <div>
                 <h2 className="text-2xl font-bold text-white">My Farms</h2>
                 <p className="text-sm text-gray-400">Manage all your staking farms</p>
               </div>
             </div>
             <button
               onClick={() => { setIsCreateFarmModalOpen(true); playSound('click'); }}
               className="px-6 py-3 bg-doge hover:bg-doge-light text-black font-bold rounded-xl transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.3)]"
             >
               <Plus size={18} />
               Create New Farm
             </button>
           </div>

           {myFarms.length === 0 ? (
             <div className="text-center py-16 border border-dashed border-white/10 rounded-3xl">
               <Crown size={64} className="text-gray-600 mx-auto mb-4" />
               <h3 className="text-2xl font-bold text-white mb-2">No Farms Yet</h3>
               <p className="text-gray-500 mb-6">You haven't created any farms yet. Start rewarding your community!</p>
               <button
                 onClick={() => { setIsCreateFarmModalOpen(true); playSound('click'); }}
                 className="px-8 py-4 bg-doge hover:bg-doge-light text-black font-bold rounded-xl transition-all"
               >
                 <Plus size={20} className="inline mr-2" />
                 Create Your First Farm
               </button>
             </div>
           ) : (
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
               {myFarms.map(farm => {
                 const rewardToken = tokens.find(t => t.id === farm.rewardTokenId);
                 const stakingToken = tokens.find(t => t.id === farm.stakingTokenId);
                 const currentAPY = farm.stats.totalStaked > 0
                   ? Math.min((farm.config.rewardRate * 86400 * 365 * 100) / farm.stats.totalStaked, 50000)
                   : 0;

                 return (
                   <div key={farm.id} className="bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden hover:border-doge/50 transition-all group">
                     {/* Header */}
                     <div className={`p-4 border-b border-white/5 ${farm.status === 'paused' ? 'bg-yellow-500/5' : ''}`}>
                       <div className="flex items-start justify-between">
                         <div className="flex items-center gap-3">
                           {rewardToken?.imageUrl && (
                             <img src={rewardToken.imageUrl} alt={rewardToken.name} className="w-12 h-12 rounded-xl border-2 border-doge/30" />
                           )}
                           <div>
                             <h4 className="font-bold text-white">{rewardToken?.name || 'Unknown'}</h4>
                             <p className="text-xs text-gray-400">Stake {stakingToken?.ticker || 'TOKEN'} to earn {rewardToken?.ticker || 'REWARD'}</p>
                           </div>
                         </div>
                         <div className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
                           farm.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                         }`}>
                           {farm.status === 'active' ? <TrendingUp size={12} /> : <Lock size={12} />}
                           {farm.status === 'active' ? 'Active' : 'Paused'}
                         </div>
                       </div>
                     </div>

                     {/* Stats */}
                     <div className="p-4 space-y-3">
                       <div className="grid grid-cols-2 gap-3">
                         <div className="bg-white/[0.02] rounded-xl p-3">
                           <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">APY</div>
                           <div className="text-xl font-bold text-green-400">{currentAPY.toFixed(0)}%</div>
                         </div>
                         <div className="bg-white/[0.02] rounded-xl p-3">
                           <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">TVL</div>
                           <div className="text-xl font-bold text-white">{formatNumber(farm.stats.totalStaked)}</div>
                         </div>
                         <div className="bg-white/[0.02] rounded-xl p-3">
                           <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Stakers</div>
                           <div className="text-xl font-bold text-white">{formatNumber(farm.stats.participantCount)}</div>
                         </div>
                         <div className="bg-white/[0.02] rounded-xl p-3">
                           <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Rewards</div>
                           <div className="text-xl font-bold text-white">{formatNumber(farm.pool.totalDistributed)}</div>
                         </div>
                       </div>

                       <div className="text-xs text-gray-500 bg-white/[0.02] rounded-lg p-2">
                         <p className="flex items-center gap-1">
                           <Info size={12} />
                           Reward Rate: {formatNumber(farm.config.rewardRate)} per second
                         </p>
                       </div>
                     </div>

                     {/* Actions */}
                     <div className="p-4 pt-0 flex gap-2">
                       <button
                         onClick={() => { navigate(`/token/${farm.stakingTokenId}?tab=farms`); playSound('click'); }}
                         className="flex-1 py-3 bg-doge hover:bg-doge-light text-black font-bold rounded-xl transition-all"
                       >
                         <Wallet size={16} className="inline mr-2" />
                         Manage Farm
                       </button>
                       <button
                         onClick={() => { navigate(`/token/${farm.stakingTokenId}?tab=farms`); playSound('click'); }}
                         className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all"
                       >
                         View Details
                       </button>
                     </div>
                   </div>
                 );
               })}
             </div>
           )}
         </div>
         </FarmErrorBoundary>
       )}

       {/* Community Farms Tab */}
       {activeTab === 'community' && (
         <FarmErrorBoundary>
          <FarmDiscovery onFarmClick={handleFarmClick} activeTab="community" />
         </FarmErrorBoundary>
       )}
       
       <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-2xl p-4 flex items-start gap-3 max-w-2xl mx-auto">
          <AlertTriangle size={20} className="text-yellow-500 shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-200/80">
             <strong>Risk Warning:</strong> Yield farming involves risks including smart contract bugs and impermanent loss. APY rates are dynamic and can change at any time.
          </div>
       </div>

       {/* Create Farm Modal */}
       {selectedTokenForFarm && (
          <CreateFarmModal
            isOpen={isCreateFarmModalOpen}
            onClose={() => { setIsCreateFarmModalOpen(false); setSelectedTokenForFarm(null); }}
            token={selectedTokenForFarm}
          />
       )}
   </div>
   </>
 );
};

export default Earn;