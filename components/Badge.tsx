
import React from 'react';
import { BadgeType } from '../types';
import { Rocket, Diamond, Crown, Zap, Target, Award } from 'lucide-react';

interface BadgeProps {
  type: BadgeType;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ type, size = 'md', showTooltip = true }) => {
  const config = {
    dev: { icon: Rocket, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', label: 'Dev' },
    whale: { icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', label: 'Whale' },
    sniper: { icon: Target, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Sniper' },
    diamond: { icon: Diamond, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: 'Diamond Hands' },
    degen: { icon: Zap, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', label: 'Degen' },
    early: { icon: Award, color: 'text-gray-300', bg: 'bg-white/10', border: 'border-white/20', label: 'Early' },
  };

  const { icon: Icon, color, bg, border, label } = config[type] || config['early'];

  const sizeClasses = {
    sm: 'p-0.5',
    md: 'p-1',
    lg: 'p-2',
  };

  const iconSizes = {
    sm: 10,
    md: 14,
    lg: 20,
  };

  return (
    <div className={`relative group/badge inline-flex items-center justify-center rounded-md border ${bg} ${border} ${sizeClasses[size]}`} title={showTooltip ? label : undefined}>
      <Icon size={iconSizes[size]} className={color} />
      {showTooltip && (
         <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover/badge:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-white/10 font-bold">
            {label}
         </div>
      )}
    </div>
  );
};
