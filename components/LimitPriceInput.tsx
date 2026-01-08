import React from 'react';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { playSound } from '../services/audio';

interface LimitPriceInputProps {
  value: string;
  onChange: (value: string) => void;
  mode: 'limit' | 'stop';
  currentPrice: number;
  error?: string;
  tradeType?: 'buy' | 'sell';
}

export const LimitPriceInput: React.FC<LimitPriceInputProps> = ({
  value,
  onChange,
  mode,
  currentPrice,
  error,
  tradeType = 'buy',
}) => {
  const isStop = mode === 'stop';
  const isBuy = tradeType === 'buy';

  const accentBorder = isStop ? 'focus-within:border-blue-500/50' : 'focus-within:border-doge/50';

  return (
    <div className="animate-slide-up">
      <div className="flex justify-between text-[10px] font-bold uppercase text-gray-500 px-1 mb-1.5">
        <label htmlFor={isStop ? 'stop-price-input' : 'limit-price-input'} className={isStop ? 'text-blue-400' : ''}>
          {isStop ? 'Trigger Price' : 'Limit Price'}
        </label>
        <button
          type="button"
          onClick={() => {
            onChange(currentPrice.toFixed(8));
            playSound('click');
          }}
          className="cursor-pointer hover:text-doge transition-colors"
          aria-label="Set price to current market price"
        >
          Set to Market
        </button>
      </div>
      <div
        className={`relative group bg-[#050505] border rounded-2xl transition-all ${
          error ? 'border-red-500 animate-shake' : `border-white/10 ${accentBorder}`
        }`}
      >
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-mono font-bold">$</div>
        <input
          id={isStop ? 'stop-price-input' : 'limit-price-input'}
          name={isStop ? 'stop-price-input' : 'limit-price-input'}
          type="number"
          placeholder="0.00000000"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent py-4 pl-8 pr-4 text-white text-right font-mono font-bold outline-none text-sm group-hover:bg-white/[0.02] transition-colors rounded-2xl"
          min="0"
          step="0.00000001"
          aria-label={`${isStop ? 'Trigger' : 'Limit'} price input`}
          aria-invalid={!!error}
          aria-describedby={error ? 'price-error' : undefined}
        />
      </div>
      {isStop && isBuy && (
        <p className="text-[10px] text-green-400 px-1 mt-1 flex items-center gap-1">
          <TrendingUp size={10} /> Buy if price rises to ${value || '0.00'}
        </p>
      )}
      {isStop && !isBuy && (
        <p className="text-[10px] text-red-400 px-1 mt-1 flex items-center gap-1">
          <TrendingUp size={10} /> Sell if price falls to ${value || '0.00'}
        </p>
      )}
      {error && (
        <p id="price-error" className="text-[10px] text-red-500 px-1 mt-1 flex items-center gap-1" role="alert">
          <AlertTriangle size={10} /> {error}
        </p>
      )}
    </div>
  );
};
