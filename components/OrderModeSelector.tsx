import React from 'react';
import { playSound } from '../services/audio';

interface OrderModeSelectorProps {
  value: 'market' | 'limit' | 'stop';
  onChange: (mode: 'market' | 'limit' | 'stop') => void;
  tradeType: 'buy' | 'sell' | 'burn' | 'karma';
  disabled?: boolean;
}

export const OrderModeSelector: React.FC<OrderModeSelectorProps> = ({
  value,
  onChange,
  tradeType,
  disabled = false,
}) => {
  // Hide for Burn/Karma modes
  if (tradeType === 'burn' || tradeType === 'karma') {
    return null;
  }

  const modes = [
    { mode: 'market' as const, label: 'Market' },
    { mode: 'limit' as const, label: 'Limit' },
    { mode: 'stop' as const, label: tradeType === 'buy' ? 'Stop Buy' : 'Stop Loss' },
  ];

  return (
    <div className="flex p-1 rounded-xl bg-white/[0.03] border border-white/5 relative">
      {modes.map(({ mode, label }) => (
        <button
          key={mode}
          type="button"
          onClick={() => {
            if (!disabled) {
              onChange(mode);
              playSound('click');
            }
          }}
          disabled={disabled}
          aria-label={`Select ${label} order mode`}
          aria-pressed={value === mode}
          className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all min-h-[44px] ${
            value === mode
              ? 'bg-white/10 text-white shadow-sm border border-white/10'
              : 'text-gray-500 hover:text-gray-300'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};
