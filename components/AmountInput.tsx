import React, { useEffect, useRef } from 'react';
import { playSound } from '../services/audio';

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  currency: string;
  onMaxClick?: () => void;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  tradeType?: 'buy' | 'sell' | 'burn' | 'karma';
  id?: string;
}

export const AmountInput: React.FC<AmountInputProps> = ({
  value,
  onChange,
  currency,
  onMaxClick,
  error,
  disabled = false,
  autoFocus = false,
  tradeType = 'buy',
  id = 'amount-input',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [autoFocus]);

  const isBuy = tradeType === 'buy';
  const isBurn = tradeType === 'burn';
  const isKarma = tradeType === 'karma';

  const accentBorder = isBuy
    ? 'focus-within:border-doge-success/50'
    : isBurn
      ? 'focus-within:border-orange-500/50'
      : isKarma
        ? 'focus-within:border-purple-500/50'
        : 'focus-within:border-doge-error/50';

  return (
    <div>
      <div className="flex justify-between items-center px-1 mb-1.5">
        <label htmlFor={id} className="text-[10px] font-bold text-gray-500 uppercase">Amount</label>
      </div>

      <div
        className={`relative group bg-[#050505] border rounded-2xl transition-all ${
          error ? 'border-red-500 animate-shake' : `border-white/10 ${accentBorder}`
        }`}
      >
        <input
          ref={inputRef}
          id={id}
          name={id}
          type="number"
          placeholder="0.00"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
          }}
          disabled={disabled}
          className="w-full bg-transparent py-5 pl-4 pr-24 text-white text-2xl font-mono font-bold outline-none group-hover:bg-white/[0.02] transition-colors rounded-2xl disabled:opacity-50"
          min="0"
          step="0.000001"
          aria-label="Amount input"
          aria-invalid={!!error}
          aria-describedby={error ? 'amount-error' : undefined}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {(tradeType === 'buy' || tradeType === 'sell' || tradeType === 'burn' || tradeType === 'karma') && (
            <button
              type="button"
              onClick={() => {
                if (!disabled) {
                  onMaxClick?.();
                  playSound('click');
                }
              }}
              disabled={disabled}
              className="text-[10px] bg-doge/10 text-doge px-2 py-1 rounded hover:bg-doge/20 transition-colors font-bold min-h-[28px] min-w-[44px] disabled:opacity-50"
              aria-label="Set to maximum amount"
            >
              MAX
            </button>
          )}
          <span className="text-xs font-bold text-gray-500 uppercase" title="Currency symbol">
            {currency}
          </span>
        </div>
      </div>
      {error && (
        <p id="amount-error" className="text-[10px] text-red-500 px-1 mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default AmountInput;
