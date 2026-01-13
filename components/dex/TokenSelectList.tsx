import React, { useMemo, useState } from 'react';
import { Search, Check } from 'lucide-react';
import { Token } from '../../contexts/DexContext';

interface TokenSelectListProps {
  tokens: Token[];
  selectedToken: Token | null;
  label: string;
  onSelect: (token: Token) => void;
  className?: string;
  emptyState?: string;
}

const TokenSelectList: React.FC<TokenSelectListProps> = ({
  tokens,
  selectedToken,
  label,
  onSelect,
  className = '',
  emptyState = 'No tokens match your search.',
}) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query) return tokens;
    const q = query.toLowerCase();
    return tokens.filter(
      (t) =>
        t.symbol.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.address.toLowerCase().includes(q)
    );
  }, [query, tokens]);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-bold text-white">{label}</label>
        <span className="text-[11px] text-gray-500">{tokens.length} tokens</span>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
        <input
          type="text"
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          placeholder="Search by name, symbol, or address"
          className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-gray-500 focus:border-doge/50 outline-none transition-colors"
          aria-label={`Search ${label}`}
        />
      </div>

      <div className="border border-white/10 rounded-xl bg-white/[0.02] overflow-hidden">
        <div className="max-h-72 sm:max-h-80 overflow-y-auto custom-scrollbar">
          {filtered.length === 0 && (
            <div className="py-6 px-4 text-center text-sm text-gray-500">{emptyState}</div>
          )}
          {filtered.map((token) => {
            const isSelected = selectedToken?.address === token.address;
            return (
              <button
                key={token.address}
                onClick={() => onSelect(token)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  isSelected
                    ? 'bg-doge/10 text-doge border-l-2 border-doge'
                    : 'hover:bg-white/5 text-white'
                }`}
                aria-pressed={isSelected}
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-sm font-bold text-white">
                  {token.symbol?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold truncate">{token.symbol}</span>
                    {isSelected && <Check size={14} className="text-doge shrink-0" />}
                  </div>
                  <div className="text-xs text-gray-400 truncate">{token.name}</div>
                  {token.balance && (
                    <div className="text-[11px] text-gray-500">Balance: {token.balance}</div>
                  )}
                </div>
                <div className="text-[11px] text-gray-500 uppercase">{token.decimals}d</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TokenSelectList;
