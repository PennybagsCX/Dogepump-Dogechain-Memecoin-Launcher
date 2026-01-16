import React from 'react';
import { Heart, Award } from 'lucide-react';

interface ReputationTileProps {
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
}

export const ReputationTile: React.FC<ReputationTileProps> = ({
  tokenId,
  tokenName,
  tokenSymbol,
}) => {
  return (
    <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <Heart className="text-red-400" size={20} />
        <h3 className="font-bold text-sm uppercase tracking-wider text-white">
          Reputation
        </h3>
        <div className="flex items-center gap-1.5 bg-red-400/10 border border-red-400/30 px-3 py-1.5 rounded-full ml-auto">
          <Award size={14} className="text-red-400" />
          <span className="text-xs font-bold text-red-400">Earn Rewards</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
          <p className="text-sm text-gray-300 leading-relaxed">
            Build your reputation by engaging with {tokenSymbol}. Like posts, leave comments, and participate in the community to earn reputation points and unlock exclusive rewards.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/5 rounded-xl px-3 py-3 border border-white/5 text-center">
            <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Likes</div>
            <div className="text-lg font-mono font-bold text-white">0</div>
          </div>
          <div className="bg-white/5 rounded-xl px-3 py-3 border border-white/5 text-center">
            <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Comments</div>
            <div className="text-lg font-mono font-bold text-white">0</div>
          </div>
          <div className="bg-white/5 rounded-xl px-3 py-3 border border-white/5 text-center">
            <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Points</div>
            <div className="text-lg font-mono font-bold text-red-400">0</div>
          </div>
        </div>

        <div className="flex items-start gap-2 text-[10px] text-gray-400">
          <Heart size={14} className="text-red-400 shrink-0 mt-0.5" />
          <p>
            Your reputation score increases with community engagement. Higher reputation leads to better rewards and visibility.
          </p>
        </div>
      </div>
    </div>
  );
};
