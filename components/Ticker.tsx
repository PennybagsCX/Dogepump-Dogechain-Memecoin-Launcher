
import React from 'react';
import { TrendingUp, Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../contexts/StoreContext';
import { timeAgo } from '../utils';
import { formatNumber } from '../services/web3Service';

interface Activity {
  user: string;
  action: string;
  amount?: string;
  token: string;
  tokenId?: string;
  time: string;
}

const MOCK_ACTIVITIES: Activity[] = [
  { user: '0x3a...9f2', action: 'bought', amount: '5,000', token: 'Doge CEO', time: '1s ago', tokenId: 'mock-1' },
  { user: '0x7b...1c4', action: 'launched', token: 'SuperShiba', time: '5s ago', tokenId: 'mock-2' },
  { user: '0x1d...2e3', action: 'bought', amount: '250k', token: 'ElonWifHat', time: '12s ago', tokenId: 'mock-3' },
  { user: '0x99...888', action: 'sold', amount: '1,000', token: 'Moon Rocket', time: '40s ago', tokenId: 'mock-4' },
  { user: '0x4f...5a1', action: 'bought', amount: '10,000', token: 'Doge CEO', time: '1m ago', tokenId: 'mock-5' },
];

interface TickerProps {
  newsBannerHeight?: number;
}

export const Ticker: React.FC<TickerProps> = ({ newsBannerHeight = 0 }) => {
  const { trades, tokens, resolveUsername } = useStore();

  // Convert real trades to activity format
  const recentRealTrades = trades.slice(0, 10).map((t: any) => {
    const token = tokens.find((tk: any) => tk.id === t.tokenId);
    return {
      user: resolveUsername(t.user),
      action: t.type === 'buy' ? 'bought' : t.type === 'sell' ? 'sold' : t.type,
      amount: formatNumber(t.amountToken),
      token: token?.name || 'Unknown',
      tokenId: token?.id,
      time: timeAgo(t.timestamp)
    };
  });

  const displayActivities = recentRealTrades.length > 0
    ? [...recentRealTrades, ...MOCK_ACTIVITIES]
    : MOCK_ACTIVITIES;

  return (
    <div
      className="h-7 min-h-[28px] max-h-[28px] leading-[28px] overflow-hidden flex items-center relative w-full max-w-full bg-[#0D0D0D] border-t border-white/10 pointer-events-none"
      style={{ zIndex: 0 }}
    >
      <div className="absolute left-0 right-0 top-0 bottom-0 overflow-hidden w-full">
        <div className="animate-ticker flex items-center gap-12 whitespace-nowrap hover:[animation-play-state:paused]" style={{ width: 'max-content' }}>
          {[...displayActivities, ...displayActivities, ...displayActivities].map((activity, i) => (
          <div key={i} className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-gray-500">
            <span className="font-bold text-gray-400">{activity.user}</span>
            <span className={activity.action === 'bought' ? 'text-green-500 font-bold' : activity.action === 'sold' ? 'text-red-500 font-bold' : 'text-doge font-bold'}>
              {activity.action}
            </span>
            {activity.amount && <span className="text-white font-bold">{activity.amount}</span>}
            {activity.tokenId ? (
              <Link
                to={`/token/${activity.tokenId}`}
                className="font-bold text-white opacity-80 hover:text-doge hover:underline transition-colors cursor-pointer"
              >
                {activity.token}
              </Link>
            ) : (
              <span className="font-bold text-white opacity-80">{activity.token}</span>
            )}
            <span className="text-gray-600 text-[9px]">{activity.time}</span>
            {activity.action === 'launched' && <Rocket size={10} className="text-doge ml-1" />}
            {activity.action === 'bought' && <TrendingUp size={10} className="text-green-500 ml-1" />}
            </div>
          ))}
        </div>
      </div>
      
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker 60s linear infinite;
        }
      `}</style>
    </div>
  );
};
