import React from 'react';
import { Flame, Sparkles, X } from 'lucide-react';
import { playSound } from '../services/audio';

interface InfoBannerProps {
  type: 'burn' | 'reputation';
  onClose?: () => void;
}

export const InfoBanner: React.FC<InfoBannerProps> = ({ type, onClose }) => {
  if (type === 'burn') {
    return (
      <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 flex items-center gap-3 animate-slide-up">
        <Flame className="text-orange-500 shrink-0" size={20} />
        <div className="flex-1 text-xs text-orange-200">
          <span className="font-bold block">Burn for Status</span>
          Permanently destroy tokens to reduce supply.
        </div>
        {onClose && (
          <button
            type="button"
            onClick={() => {
              onClose();
              playSound('click');
            }}
            className="p-1 hover:bg-orange-500/20 rounded-full transition-colors"
            aria-label="Dismiss burn info"
          >
            <X size={14} className="text-orange-500" />
          </button>
        )}
      </div>
    );
  }

  if (type === 'reputation') {
    return (
      <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 flex items-center gap-3 animate-slide-up">
        <Sparkles className="text-purple-500 shrink-0" size={20} />
        <div className="flex-1 text-xs text-purple-200">
          <span className="font-bold block">Lock for Reputation</span>
          Lock tokens to earn Reputation points for future airdrops.
        </div>
        {onClose && (
          <button
            type="button"
            onClick={() => {
              onClose();
              playSound('click');
            }}
            className="p-1 hover:bg-purple-500/20 rounded-full transition-colors"
            aria-label="Dismiss reputation info"
          >
            <X size={14} className="text-purple-500" />
          </button>
        )}
      </div>
    );
  }

  return null;
};
