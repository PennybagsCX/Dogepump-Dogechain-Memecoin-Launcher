import React from 'react';
import { playSound } from '../services/audio';

interface QuickSelectGridProps {
  percentages: number[];
  onSelect: (percentage: number) => void;
  disabled?: boolean;
}

export const QuickSelectGrid: React.FC<QuickSelectGridProps> = ({
  percentages,
  onSelect,
  disabled = false,
}) => {
  return (
    <div className="grid grid-cols-4 gap-2">
      {percentages.map((percentage) => (
        <button
          key={percentage}
          type="button"
          onClick={() => {
            if (!disabled) {
              onSelect(percentage);
              playSound('click');
            }
          }}
          disabled={disabled}
          className="py-1.5 bg-white/[0.03] rounded-lg text-[10px] font-mono text-gray-500 hover:bg-white/10 hover:text-white transition-colors border border-white/5 hover:border-white/20 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={`Select ${percentage}% of balance`}
        >
          {percentage}%
        </button>
      ))}
    </div>
  );
};
