
import React, { useEffect, useState, useRef } from 'react';
import { Badge } from './Badge';
import { Badge as BadgeType } from '../types';
import { Trophy } from 'lucide-react';
import { playSound } from '../services/audio';

interface AchievementPopupProps {
  badge: BadgeType | null;
  onClose: () => void;
}

export const AchievementPopup: React.FC<AchievementPopupProps> = ({ badge, onClose }) => {
  const [visible, setVisible] = useState(false);
  // Store the badge to display even while fading out after prop becomes null (though layout usually keeps it)
  const [displayBadge, setDisplayBadge] = useState<BadgeType | null>(null);
  
  useEffect(() => {
    if (badge) {
      setDisplayBadge(badge);
      setVisible(true);
      playSound('success');
      
      const timer = setTimeout(() => {
        setVisible(false);
        // Wait for exit animation to finish before calling onClose
        setTimeout(() => {
            onClose();
            setDisplayBadge(null);
        }, 500);
      }, 3000);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [badge, onClose]);

  if (!displayBadge) return null;

  return (
    <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[150] pointer-events-none transition-all duration-500 transform ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
      <div className="bg-[#0A0A0A] border-y-2 border-doge/50 w-[320px] md:w-[400px] relative overflow-hidden shadow-[0_0_50px_-10px_rgba(212,175,55,0.3)]">
         {/* Shiny background effect */}
         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-doge/10 to-transparent animate-shimmer"></div>
         
         <div className="flex items-center gap-4 p-4 relative z-10">
            <div className="w-16 h-16 bg-black border border-doge/30 rounded-full flex items-center justify-center shadow-lg shrink-0">
               <div className="scale-150">
                  <Badge type={displayBadge.id || 'early'} size="lg" showTooltip={false} />
               </div>
            </div>
            <div className="flex-1">
               <div className="flex items-center gap-2 text-doge text-xs font-bold uppercase tracking-widest mb-1">
                  <Trophy size={12} /> Achievement Unlocked
               </div>
               <h3 className="text-white font-comic font-bold text-xl leading-none mb-1">{displayBadge.label}</h3>
               <p className="text-gray-400 text-xs">{displayBadge.description}</p>
            </div>
         </div>

         {/* Progress bar/Timer */}
         <div className="h-1 bg-gray-800 w-full absolute bottom-0 left-0">
            <div className={`h-full bg-doge transition-all duration-[3000ms] ease-linear ${visible ? 'w-0' : 'w-full'}`}></div>
         </div>
      </div>
    </div>
  );
};
