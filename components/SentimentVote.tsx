
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Token } from '../types';
import { useStore } from '../contexts/StoreContext';
import { Confetti } from './Confetti';
import { emojiSyncService } from '../services/emojiSyncService';

interface SentimentVoteProps {
  token: Token;
}

// Generate a unique user ID for this session
const getUserId = (): string => {
  let userId = localStorage.getItem('dogepump_user_id');
  if (!userId) {
    userId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('dogepump_user_id', userId);
  }
  return userId;
};

export const SentimentVote: React.FC<SentimentVoteProps> = ({ token }) => {
  const { voteSentiment } = useStore();
  const [hasVoted, setHasVoted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [userId] = useState<string>(() => getUserId());

  const sentiment = token.sentiment || { bullish: 0, bearish: 0 };
  const total = sentiment.bullish + sentiment.bearish || 1;
  const bullishPct = (sentiment.bullish / total) * 100;

  // Initialize emoji sync service and listen for sentiment vote messages
  useEffect(() => {
    try {
      emojiSyncService.initialize();
    } catch (error) {
      console.warn('[SentimentVote] Failed to initialize emojiSyncService:', error);
    }

    // Listen for sentiment vote messages from other tabs
    const unregister = emojiSyncService.onMessage((message) => {
      if (message.type === 'sentiment_vote' && message.tokenId === token.id) {
        // Update local state when receiving votes from other tabs
        // Note: The actual sentiment count update happens in StoreContext
        // We just need to ensure the component re-renders with updated data
      }
    });

    // Cleanup on unmount
    return () => {
      unregister();
    };
  }, [token.id]);

  const handleVote = (type: 'bullish' | 'bearish') => {
    if (hasVoted) return;

    // Vote locally via StoreContext
    voteSentiment(token.id, type);
    setHasVoted(true);

    // Broadcast the vote to other tabs
    try {
      emojiSyncService.broadcastSentimentVote(token.id, type, userId);
    } catch (error) {
      console.warn('[SentimentVote] Failed to broadcast sentiment vote:', error);
    }

    // Show confetti for bullish votes
    if (type === 'bullish') {
       setShowConfetti(true);
       setTimeout(() => setShowConfetti(false), 3000);
    }
  };

  return (
    <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4 shadow-lg relative overflow-hidden">
      {showConfetti && <div className="fixed inset-0 pointer-events-none z-50"><Confetti /></div>}
      
      <div className="flex justify-between items-center mb-3">
         <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Community Sentiment</h3>
         {hasVoted && <span className="text-xs text-doge font-bold">Voted!</span>}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch gap-2 sm:gap-0 mb-3">
         <button
           onClick={() => handleVote('bullish')}
           disabled={hasVoted}
           className={`flex-1 py-3 sm:py-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${hasVoted ? 'opacity-50 cursor-default' : 'hover:bg-white/5 hover:scale-[1.02] active:scale-95'}`}
         >
            <TrendingUp size={20} className="text-green-500" />
            <span className="text-xs font-bold text-green-500">Bullish</span>
         </button>

         <div className="h-px w-full sm:h-8 sm:w-px bg-white/10"></div>

         <button
           onClick={() => handleVote('bearish')}
           disabled={hasVoted}
           className={`flex-1 py-3 sm:py-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${hasVoted ? 'opacity-50 cursor-default' : 'hover:bg-white/5 hover:scale-[1.02] active:scale-95'}`}
         >
            <TrendingDown size={20} className="text-red-500" />
            <span className="text-xs font-bold text-red-500">Bearish</span>
         </button>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden flex">
         <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${bullishPct}%` }}></div>
         <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${100 - bullishPct}%` }}></div>
      </div>
      
      <div className="flex justify-between mt-1 text-[10px] font-mono text-gray-500 hidden sm:flex">
         <span>{bullishPct.toFixed(0)}%</span>
         <span>{(100 - bullishPct).toFixed(0)}%</span>
      </div>
    </div>
  );
};
