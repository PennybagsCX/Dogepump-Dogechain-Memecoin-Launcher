import React from 'react';
import { Link } from 'react-router-dom';
import { Token } from '../types';
import { formatCurrency, formatNumber as formatNumberWeb3 } from '../services/web3Service';
import { timeAgo, formatNumber } from '../utils';
import { Zap, TrendingUp, Crown, Rocket } from 'lucide-react';
import { Sparkline } from './Sparkline';
import { useStore } from '../contexts/StoreContext';
import { OptimizedImage } from './OptimizedImage';

interface TokenTableProps {
  tokens: Token[];
}

export const TokenTable: React.FC<TokenTableProps> = ({ tokens }) => {
  const { priceHistory } = useStore();

  return (
    <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-xl animate-fade-in">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/[0.03] border-b border-white/5">
            <tr>
              <th className="px-6 py-4 font-bold text-gray-500 uppercase text-xs tracking-wider">Token</th>
              <th className="px-6 py-4 font-bold text-gray-500 uppercase text-xs tracking-wider text-right">Price</th>
              <th className="px-6 py-4 font-bold text-gray-500 uppercase text-xs tracking-wider hidden md:table-cell">Trend</th>
              <th className="px-6 py-4 font-bold text-gray-500 uppercase text-xs tracking-wider text-right hidden sm:table-cell">Mkt Cap</th>
              <th className="px-6 py-4 font-bold text-gray-500 uppercase text-xs tracking-wider text-right hidden lg:table-cell">Liquidity</th>
              <th className="px-6 py-4 font-bold text-gray-500 uppercase text-xs tracking-wider text-right hidden xl:table-cell">Volume</th>
              <th className="px-6 py-4 font-bold text-gray-500 uppercase text-xs tracking-wider text-right hidden sm:table-cell">Age</th>
              <th className="px-6 py-4 font-bold text-gray-500 uppercase text-xs tracking-wider text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {tokens.map((token) => {
              const history = priceHistory[token.id] || [];
              const sparkData = history.map(p => p.price);
              const isGraduated = token.progress >= 100;

              return (
                <tr key={token.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <Link to={`/token/${token.id}`} className="flex items-center gap-4 group-hover:translate-x-1 transition-transform">
                      <OptimizedImage
                        src={token.imageUrl}
                        alt={token.name}
                        className="w-10 h-10 rounded-lg object-cover bg-gray-800"
                        loading="lazy"
                        fetchPriority="low"
                      />
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                           {token.name}
                           {(token.boosts || 0) > 0 && <Rocket size={12} className="text-orange-500" />}
                        </div>
                        <div className="text-xs text-gray-500 font-mono group-hover:text-doge transition-colors">${token.ticker}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-white font-bold">
                    ${formatNumber(token.price.toFixed(6))}
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                     <div className="w-24 h-8 opacity-60 group-hover:opacity-100 transition-opacity">
                        <Sparkline data={sparkData} width={96} height={32} />
                     </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-gray-300 hidden sm:table-cell">
                    {formatCurrency(token.marketCap)}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-gray-400 hidden lg:table-cell">
                    {formatNumberWeb3(token.virtualLiquidity)}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-gray-400 hidden xl:table-cell">
                    {formatNumberWeb3(token.volume)}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-500 text-xs font-bold uppercase hidden sm:table-cell">
                    {timeAgo(token.createdAt).replace(' ago', '')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isGraduated ? (
                       <span className="inline-flex items-center gap-1 bg-doge/20 text-doge px-2 py-1 rounded text-[10px] font-bold uppercase border border-doge/20">
                          <Crown size={10} fill="currentColor" /> King
                       </span>
                    ) : (
                       <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] font-bold text-doge">{token.progress.toFixed(1)}%</span>
                          <div className="w-16 h-1 bg-gray-800 rounded-full overflow-hidden">
                             <div className="h-full bg-doge" style={{ width: `${token.progress}%` }}></div>
                          </div>
                       </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
