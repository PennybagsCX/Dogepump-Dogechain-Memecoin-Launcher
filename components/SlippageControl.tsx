import React, { useState } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { playSound } from '../services/audio';

interface SlippageControlProps {
  value: string;
  onChange: (value: string) => void;
  onClose?: () => void; // Optional, for modal usage
  inline?: boolean; // New prop to determine if inline or modal
}

export const SlippageControl: React.FC<SlippageControlProps> = ({
  value,
  onChange,
  onClose,
  inline = true, // Default to inline mode
}) => {
  const presets = ['0.1', '0.5', '1', '3'] as const;
  const [customValue, setCustomValue] = useState(value);

  const isHighSlippage = parseFloat(value) > 3;
  const isCustomValue = !presets.includes(value as any);

  const handlePresetClick = (preset: string) => {
    playSound('click');
    onChange(preset);
    setCustomValue(preset);
    onClose?.();
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setCustomValue(newValue);
    if (newValue && parseFloat(newValue) >= 0) {
      onChange(newValue);
    }
  };

  // Inline version
  if (inline) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Slippage Tolerance</span>
          {isHighSlippage && (
            <div className="flex items-center gap-1 text-[10px] text-orange-400">
              <AlertTriangle size={12} />
              <span>High</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handlePresetClick(preset)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                value === preset && !isCustomValue
                  ? 'bg-doge text-black border-doge shadow-lg shadow-doge/20'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20'
              }`}
              aria-label={`Set slippage to ${preset}%`}
              aria-pressed={value === preset && !isCustomValue}
            >
              {preset}%
            </button>
          ))}

          <div className={`flex-1 relative ${isCustomValue ? 'flex-1' : ''}`}>
            <input
              type="number"
              value={customValue}
              onChange={handleCustomChange}
              placeholder="Custom"
              className={`w-full py-2 px-3 rounded-lg text-xs font-bold border bg-white/5 text-white outline-none transition-all text-center ${
                isCustomValue
                  ? 'border-doge text-doge'
                  : 'border-white/10 text-gray-400 focus:border-doge/50'
              }`}
              aria-label="Custom slippage percentage"
            />
            {isCustomValue && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-doge font-bold">%</div>
            )}
          </div>
        </div>

        {isHighSlippage && (
          <div className="flex items-start gap-2 text-[10px] text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-lg p-2">
            <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
            <span>High slippage may result in unfavorable trades</span>
          </div>
        )}
      </div>
    );
  }

  // Modal version (original)
  return (
    <div className="absolute inset-0 bg-[#0A0A0A] p-4 z-20 animate-fade-in flex flex-col justify-center gap-2">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold uppercase text-white">Set Slippage</span>
        <button
          type="button"
          onClick={() => {
            onClose?.();
            playSound('click');
          }}
          className="p-1 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Close slippage settings"
        >
          ×
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => handlePresetClick(preset)}
            className={`py-2 rounded-lg text-xs font-bold border min-h-[44px] transition-colors ${
              value === preset && !isCustomValue
                ? 'bg-doge text-black border-doge'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
            aria-label={`Set slippage to ${preset}%`}
            aria-pressed={value === preset && !isCustomValue}
          >
            {preset}%
          </button>
        ))}
      </div>

      {isHighSlippage && (
        <div className="flex items-center gap-2 text-[10px] text-orange-400 mt-2 bg-orange-500/10 border border-orange-500/20 rounded-lg p-2">
          <AlertTriangle size={12} />
          <span>High slippage may result in unfavorable trades</span>
        </div>
      )}
    </div>
  );
};

export default SlippageControl;
