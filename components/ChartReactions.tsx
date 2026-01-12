import React, { useState, useRef, useEffect } from 'react';
import { Rocket, Skull, Diamond, Heart, Flame } from 'lucide-react';
import { playSound } from '../services/audio';
import type { ChartEmoji } from '../types';

interface Particle {
  id: string;
  x: number; // Percentage
  type: string;
  velocity: number;
  wobble: number;
}

export interface ChartReactionsProps {
  /** Current reaction counts for each emoji */
  counts?: {
    rocket: number;
    fire: number;
    diamond: number;
    skull: number;
  };
  /** The emoji the current user has reacted with (null if none) */
  userReaction?: ChartEmoji | null;
  /** Callback when user clicks an emoji */
  onReactionClick?: (emoji: ChartEmoji) => void;
  /** Whether to show the component */
  visible?: boolean;
}

export const ChartReactions: React.FC<ChartReactionsProps> = ({
  counts = { rocket: 0, fire: 0, diamond: 0, skull: 0 },
  userReaction = null,
  onReactionClick,
  visible = true
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const requestRef = useRef<number | null>(null);

  const emojis = [
    { id: 'rocket', label: '🚀', icon: Rocket, color: 'text-doge', count: counts.rocket },
    { id: 'fire', label: '🔥', icon: Flame, color: 'text-orange-500', count: counts.fire },
    { id: 'diamond', label: '💎', icon: Diamond, color: 'text-blue-400', count: counts.diamond },
    { id: 'skull', label: '💀', icon: Skull, color: 'text-gray-400', count: counts.skull },
  ];

  const spawnParticle = (type: ChartEmoji) => {
    const id = Math.random().toString(36);
    const x = 20 + Math.random() * 60; // Random start X (20-80%)
    
    setParticles(prev => [...prev, { 
       id, 
       x, 
       type, 
       velocity: 0.5 + Math.random() * 0.5, 
       wobble: Math.random() * Math.PI * 2 
    }]);

    // Auto remove
    setTimeout(() => {
       setParticles(prev => prev.filter(p => p.id !== id));
    }, 2000);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
       {/* Floating Particles */}
       {particles.map(p => (
          <div 
            key={p.id}
            className="absolute bottom-16 text-2xl animate-float-reaction transition-transform"
            style={{ 
               left: `${p.x}%`,
               animationDuration: `${2 / p.velocity}s`,
            }}
          >
             {p.type}
          </div>
       ))}

       {/* Reaction Bar */}
       <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-auto bg-black/60 backdrop-blur-md p-1.5 rounded-full border border-white/10 shadow-lg hover:scale-105 transition-transform">
          {emojis.map(emoji => {
            const isUserReacted = userReaction === emoji.label;
            return (
              <button
                key={emoji.id}
                aria-label={`${emoji.label} reaction`}
                onClick={() => {
                  const isRemoving = userReaction === emoji.label;
                  if (onReactionClick) {
                    onReactionClick(emoji.label as ChartEmoji);
                  }
                  if (!isRemoving) {
                    playSound('hover');
                    spawnParticle(emoji.label as ChartEmoji);
                  }
                }}
                className={`relative w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors active:scale-90 text-lg ${isUserReacted ? 'bg-doge/20 ring-2 ring-doge' : ''}`}
              >
                {emoji.label}
                {emoji.count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-white/90 text-black text-[8px] font-bold px-1 rounded-full min-w-[14px] text-center">
                    {emoji.count}
                  </span>
                )}
              </button>
            );
          })}
       </div>

       <style>{`
          @keyframes floatReaction {
             0% { transform: translateY(0) scale(0.5) rotate(0deg); opacity: 0; }
             10% { opacity: 1; transform: translateY(-20px) scale(1.2) rotate(-10deg); }
             100% { transform: translateY(-300px) scale(1) rotate(20deg); opacity: 0; }
          }
          .animate-float-reaction {
             animation-name: floatReaction;
             animation-timing-function: ease-out;
             animation-fill-mode: forwards;
          }
       `}</style>
    </div>
  );
};
