import React, { useState } from 'react';
import { Heart, Droplets, Award } from 'lucide-react';
import { ReputationTile } from './ReputationTile';
import { MemecoinStakingTile } from './MemecoinStakingTile';
import { useAuth } from '../contexts/AuthContext';
import { Token } from '../types';

interface FarmTabProps {
  token: Token;
  userTokenBalance: number;
  userKarmaBalance: number;
}

type TabType = 'reputation' | 'memecoin' | 'karma';

export const FarmTab: React.FC<FarmTabProps> = ({
  token,
  userTokenBalance,
  userKarmaBalance,
}) => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('reputation');

  const tabs = [
    { id: 'reputation' as TabType, label: 'Reputation', icon: Heart, description: 'Earn reputation by engaging with this token' },
    { id: 'memecoin' as TabType, label: `Farm ${token.ticker}`, icon: Droplets, description: `Stake ${token.ticker} to earn $KARMA rewards` },
    { id: 'karma' as TabType, label: 'Farm $KARMA', icon: Award, description: 'Stake $KARMA to earn more $KARMA' },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 shadow-lg">
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-white font-comic">Earn Rewards</h2>
          <p className="text-sm text-gray-400">Choose how you want to earn rewards with this token</p>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                disabled={!isAuthenticated}
                className={`
                  relative overflow-hidden rounded-2xl p-4 border transition-all duration-300
                  ${isActive
                    ? 'bg-doge/10 border-doge/30 shadow-[0_0_20px_rgba(212,175,55,0.1)]'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }
                  ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    shrink-0 p-2 rounded-xl transition-colors
                    ${isActive ? 'bg-doge/20 text-doge' : 'bg-white/5 text-gray-400'}
                  `}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className={`
                      font-bold text-sm uppercase tracking-wider transition-colors
                      ${isActive ? 'text-doge' : 'text-gray-300'}
                    `}>
                      {tab.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 truncate">
                      {tab.description}
                    </div>
                  </div>
                </div>

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-doge/50 via-doge to-doge/50"></div>
                )}
              </button>
            );
          })}
        </div>

        {!isAuthenticated && (
          <div className="mt-4 text-center text-sm text-gray-500 bg-white/5 rounded-xl px-4 py-2">
            Connect your wallet to access earning features
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === 'reputation' && (
          <ReputationTile tokenId={token.id} tokenName={token.name} tokenSymbol={token.ticker} />
        )}

        {activeTab === 'memecoin' && (
          <MemecoinStakingTile
            tokenId={token.id}
            tokenName={token.name}
            tokenSymbol={token.ticker}
            tokenPrice={token.price}
            userBalance={userTokenBalance}
            contractAddress={token.contractAddress || ''}
          />
        )}

        {activeTab === 'karma' && (
          <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <Award className="text-doge" size={20} />
              <h3 className="font-bold text-sm uppercase tracking-wider text-white">
                Stake $KARMA to Earn $KARMA
              </h3>
              <div className="flex items-center gap-1.5 bg-doge/10 border border-doge/30 px-3 py-1.5 rounded-full ml-auto">
                <span className="text-xs font-bold text-doge">Coming Soon</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Award size={16} />
              <p>Stake your $KARMA tokens to earn more $KARMA. Single-sided staking with competitive APY.</p>
            </div>
            <div className="mt-4 p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
              <div className="text-center text-sm text-gray-400">
                Your $KARMA Balance: <span className="text-white font-mono font-bold">{userKarmaBalance.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
