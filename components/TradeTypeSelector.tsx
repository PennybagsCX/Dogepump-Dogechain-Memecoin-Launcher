import React from 'react';
import { playSound } from '../services/audio';

interface TradeTypeSelectorProps {
  value: 'buy' | 'sell' | 'burn' | 'karma';
  onChange: (type: 'buy' | 'sell' | 'burn' | 'karma') => void;
  disabled?: boolean;
}

export const TradeTypeSelector: React.FC<TradeTypeSelectorProps> = ({ 
  value, 
  onChange, 
  disabled = false 
}) => {
  const tradeTypes = [
    { type: 'buy' as const, label: 'Buy', color: 'bg-doge-success', textColor: 'text-black' },
    { type: 'sell' as const, label: 'Sell', color: 'bg-doge-error', textColor: 'text-white' },
    { type: 'burn' as const, label: 'Burn', color: 'bg-orange-600', textColor: 'text-white' },
    { type: 'karma' as const, label: 'Karma', color: 'bg-purple-600', textColor: 'text-white' },
  ];

  return (
    <div className="grid grid-cols-4 bg-black/40 border-b border-white/5 p-2 gap-1 rounded-t-2xl">
      {tradeTypes.map(({ type, label, color, textColor }) => (
        <button
          key={type}
          type="button"
          onClick={() => {
            if (!disabled) {
              onChange(type);
              playSound('click');
            }
          }}
          disabled={disabled}
          aria-label={`Select ${label} trade type`}
          aria-pressed={value === type}
          className={`py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 relative overflow-hidden min-h-[44px] ${
            value === type
              ? `${textColor} ${color} shadow-[0_0_15px_rgba(212,175,55,0.4)]`
              : 'text-gray-500 hover:bg-white/5'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};
