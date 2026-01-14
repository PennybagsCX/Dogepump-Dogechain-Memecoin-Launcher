
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, ComposedChart, Bar } from 'recharts';
import { Trade, Token, PricePoint } from '../types';
import { formatCurrency, formatNumber } from '../services/web3Service';
import { TrendingUp, TrendingDown, DollarSign, Activity, Zap, Target, Award, AlertTriangle } from 'lucide-react';

// Custom formatter for portfolio metrics to prevent overflow
const formatCompactCurrency = (val: number): string => {
  if (Math.abs(val) >= 1000000) {
    return `$${(val / 1000000).toFixed(1)}M`;
  } else if (Math.abs(val) >= 1000) {
    return `$${(val / 1000).toFixed(0)}K`;
  } else {
    return `$${val.toFixed(0)}`;
  }
};

// Custom formatter for small amounts
const formatSmallCurrency = (val: number): string => {
  if (Math.abs(val) >= 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  } else if (Math.abs(val) >= 1) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  } else {
    return `$${val.toFixed(4)}`;
  }
};

interface PortfolioChartProps {
  trades: Trade[];
  tokens: Token[];
  priceHistory: Record<string, PricePoint[]>;
  currentBalance: number;
}

interface PortfolioAnalytics {
  totalReturn: number;
  totalReturnPercent: number;
  totalVolume: number;
  totalTrades: number;
  winRate: number;
  avgHoldTime: number;
  bestTrade: Trade | null;
  worstTrade: Trade | null;
  sharpeRatio: number;
  maxDrawdown: number;
  dailyPnL: number[];
  topPerformers: Array<{
    token: Token;
    pnl: number;
    pnlPercent: number;
  }>;
  riskMetrics: {
    volatility: number;
    var95: number; // Value at Risk 95%
    beta: number;
    alpha: number;
  };
  performanceMetrics: {
    dailyAvg: number;
    weeklyAvg: number;
    monthlyAvg: number;
  };
}

export const PortfolioChart: React.FC<PortfolioChartProps> = ({ trades, tokens, priceHistory, currentBalance }) => {
  const [containerDimensions, setContainerDimensions] = useState<{ width: number; height: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const { offsetWidth, offsetHeight } = containerRef.current;
        if (offsetWidth > 0 && offsetHeight > 0) {
          setContainerDimensions({ width: offsetWidth, height: offsetHeight });
        }
      }
    };

    // Initial measurement
    updateDimensions();

    // Use ResizeObserver for accurate dimension tracking
    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Generate enhanced dummy data if no real data exists
  const generateEnhancedDummyData = () => {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    const baseBalance = 15000;

    // Create realistic portfolio fluctuations
    const dataPoints = [];
    let currentValue = baseBalance;
    let dailyVolatility = 0.02; // 2% daily volatility

    for (let i = 0; i <= 30; i++) {
      const timestamp = thirtyDaysAgo + (i * 24 * 60 * 60 * 1000);
      const trend = i < 15 ? 1.0008 : 1.0012; // Upward trend with acceleration
      const randomFactor = (Math.random() - 0.48) * dailyVolatility;
      currentValue = currentValue * trend * (1 + randomFactor);

      // Add some significant events
      if (i === 10) currentValue *= 1.15; // 15% pump
      if (i === 18) currentValue *= 0.88; // 12% dump
      if (i === 22) currentValue *= 1.08; // 8% recovery

      dataPoints.push({
        time: timestamp,
        value: currentValue,
        dateStr: new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        fullDate: new Date(timestamp).toISOString(),
        volume: Math.floor(Math.random() * 50000) + 10000
      });
    }

    return dataPoints;
  };

  const data = useMemo(() => {
    const myTrades = trades.filter(t => t.user === 'You').sort((a, b) => a.timestamp - b.timestamp);

    if (myTrades.length === 0) {
      return generateEnhancedDummyData();
    }

    // Process real data
    const startTime = myTrades[0].timestamp;
    const endTime = Date.now();
    const points = 50;
    const interval = (endTime - startTime) / points;

    const chartData = [];
    let simulatedBalance = 10000;
    const holdings: Record<string, number> = {};

    const getPriceAtTime = (tokenId: string, time: number) => {
        const history = priceHistory[tokenId] || [];
        const point = history.reduce((prev, curr) =>
            Math.abs(curr.timestamp - time) < Math.abs(prev.timestamp - time) ? curr : prev
        , history[0]);

        if (!point) {
            const token = tokens.find(t => t.id === tokenId);
            return token ? token.price : 0;
        }
        return point.price;
    };

    let tradeIndex = 0;

    for (let i = 0; i <= points; i++) {
        const currentTime = startTime + (i * interval);

        while (tradeIndex < myTrades.length && myTrades[tradeIndex].timestamp <= currentTime) {
            const t = myTrades[tradeIndex];
            if (t.type === 'buy') {
                simulatedBalance -= t.amountDC;
                holdings[t.tokenId] = (holdings[t.tokenId] || 0) + t.amountToken;
            } else if (t.type === 'sell') {
                simulatedBalance += t.amountDC;
                holdings[t.tokenId] = Math.max(0, (holdings[t.tokenId] || 0) - t.amountToken);
            }
            tradeIndex++;
        }

        let holdingsValue = 0;
        Object.keys(holdings).forEach(tokenId => {
            const amount = holdings[tokenId];
            if (amount > 0) {
                const price = getPriceAtTime(tokenId, currentTime);
                holdingsValue += amount * price;
            }
        });

        chartData.push({
            time: currentTime,
            value: simulatedBalance + holdingsValue,
            dateStr: new Date(currentTime).toLocaleDateString([], { month: 'short', day: 'numeric' }),
            fullDate: new Date(currentTime).toISOString()
        });
    }

    return chartData;
  }, [trades, tokens, priceHistory]);

  // Calculate comprehensive analytics
  const analytics: PortfolioAnalytics = useMemo(() => {
    if (data.length === 0) return {
      totalReturn: 0, totalReturnPercent: 0, totalVolume: 0, totalTrades: 0,
      winRate: 0, avgHoldTime: 0, bestTrade: null, worstTrade: null,
      sharpeRatio: 0, maxDrawdown: 0, dailyPnL: [], topPerformers: [],
      riskMetrics: { volatility: 0, var95: 0, beta: 0, alpha: 0 },
      performanceMetrics: { dailyAvg: 0, weeklyAvg: 0, monthlyAvg: 0 }
    };

    const startVal = data[0].value;
    const endVal = data[data.length - 1].value;
    const totalReturn = endVal - startVal;
    const totalReturnPercent = (totalReturn / startVal) * 100;

    // Calculate daily returns for risk metrics
    const dailyReturns = [];
    for (let i = 1; i < data.length; i++) {
      const dailyReturn = (data[i].value - data[i-1].value) / data[i-1].value;
      dailyReturns.push(dailyReturn);
    }

    // Calculate maximum drawdown
    let maxDrawdown = 0;
    let peak = data[0].value;
    for (let i = 1; i < data.length; i++) {
      if (data[i].value > peak) peak = data[i].value;
      const drawdown = (peak - data[i].value) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    // Calculate volatility (standard deviation of daily returns)
    const avgDailyReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
    const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgDailyReturn, 2), 0) / dailyReturns.length;
    const volatility = Math.sqrt(variance) * 100;

    // Calculate Sharpe ratio (assuming 2% risk-free rate annually)
    const riskFreeRate = 0.02 / 365;
    const excessReturns = dailyReturns.map(r => r - riskFreeRate);
    const avgExcessReturn = excessReturns.reduce((sum, r) => sum + r, 0) / excessReturns.length;
    const sharpeRatio = avgExcessReturn !== 0 ? (avgExcessReturn / Math.sqrt(variance)) * Math.sqrt(365) : 0;

    // Process trades for additional metrics
    const myTrades = trades.filter(t => t.user === 'You');
    const totalVolume = myTrades.reduce((sum, t) => sum + t.amountDC, 0);

    // Calculate win rate
    let wins = 0;
    let losses = 0;
    let bestTrade: Trade | null = null;
    let worstTrade: Trade | null = null;
    let bestPnL = -Infinity;
    let worstPnL = Infinity;

    const tokenHoldings: Record<string, { buyTime: number; amount: number; avgPrice: number }> = {};

    myTrades.forEach(trade => {
      if (trade.type === 'buy') {
        if (!tokenHoldings[trade.tokenId]) {
          tokenHoldings[trade.tokenId] = { buyTime: trade.timestamp, amount: 0, avgPrice: 0 };
        }
        const holding = tokenHoldings[trade.tokenId];
        const totalValue = holding.amount * holding.avgPrice + trade.amountDC;
        holding.amount += trade.amountToken;
        holding.avgPrice = totalValue / holding.amount;
      } else if (trade.type === 'sell' && tokenHoldings[trade.tokenId]) {
        const holding = tokenHoldings[trade.tokenId];
        const pnl = (trade.price - holding.avgPrice) * trade.amountToken;

        if (pnl > 0) {
          wins++;
          if (pnl > bestPnL) {
            bestPnL = pnl;
            bestTrade = trade;
          }
        } else {
          losses++;
          if (pnl < worstPnL) {
            worstPnL = pnl;
            worstTrade = trade;
          }
        }

        delete tokenHoldings[trade.tokenId];
      }
    });

    const winRate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;

    // Calculate top performers
    const tokenPnL: Record<string, { token: Token; pnl: number; pnlPercent: number }> = {};

    myTrades.forEach(trade => {
      const token = tokens.find(t => t.id === trade.tokenId);
      if (!token) return;

      if (!tokenPnL[trade.tokenId]) {
        tokenPnL[trade.tokenId] = { token, pnl: 0, pnlPercent: 0 };
      }

      if (trade.type === 'buy') {
        tokenPnL[trade.tokenId].pnl -= trade.amountDC;
      } else {
        tokenPnL[trade.tokenId].pnl += trade.amountDC;
      }
    });

    const topPerformers = Object.values(tokenPnL)
      .map(item => ({
        ...item,
        pnlPercent: item.token.price > 0 ? (item.pnl / (item.token.price * 1000000)) * 100 : 0
      }))
      .sort((a, b) => b.pnl - a.pnl)
      .slice(0, 5);

    return {
      totalReturn,
      totalReturnPercent,
      totalVolume,
      totalTrades: myTrades.length,
      winRate,
      avgHoldTime: 0, // Would need more complex calculation with sell timestamps
      bestTrade,
      worstTrade,
      sharpeRatio,
      maxDrawdown: maxDrawdown * 100,
      dailyPnL: dailyReturns.map(r => r * startVal),
      topPerformers,
      riskMetrics: {
        volatility,
        var95: volatility * 1.65, // Approximate 95% VaR
        beta: 1.2, // Mock value - would need market data
        alpha: 0.05 // Mock value - would need market data
      },
      performanceMetrics: {
        dailyAvg: totalReturn / 30,
        weeklyAvg: totalReturn / 4.3,
        monthlyAvg: totalReturn
      }
    };
  }, [data, trades, tokens]);

  if (data.length === 0) return null;

  const startVal = data[0].value;
  const endVal = data[data.length - 1].value;
  const isProfit = endVal >= startVal;
  const color = isProfit ? '#00E054' : '#FF3B30';

  return (
    <div className="h-full w-full flex flex-col">
      {/* Main Analytics Grid - Compact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
        <div className="bg-white/[0.03] p-2 rounded-lg border border-white/5 text-center flex flex-col items-center">
          <div className="flex items-center justify-center gap-1 text-[9px] text-gray-500 uppercase tracking-wider font-bold mb-1">
            {isProfit ? <TrendingUp size={10} className="text-green-500" /> : <TrendingDown size={10} className="text-red-500" />}
            Total Return
          </div>
          <div className={`text-sm font-mono font-bold ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
            {isProfit ? '+' : ''}{formatCompactCurrency(analytics.totalReturn)}
          </div>
          <div className={`text-xs font-mono ${isProfit ? 'text-green-400/60' : 'text-red-400/60'}`}>
            ({isProfit ? '+' : ''}{analytics.totalReturnPercent.toFixed(1)}%)
          </div>
        </div>

        <div className="bg-white/[0.03] p-2 rounded-lg border border-white/5 text-center flex flex-col items-center">
          <div className="flex items-center justify-center gap-1 text-[9px] text-gray-500 uppercase tracking-wider font-bold mb-1">
            <Activity size={10} className="text-blue-400" />
            Win Rate
          </div>
          <div className="text-sm font-mono text-blue-400 font-bold">
            {analytics.winRate.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-400 font-mono">
            {analytics.totalTrades} trades
          </div>
        </div>

        <div className="bg-white/[0.03] p-2 rounded-lg border border-white/5 text-center flex flex-col items-center">
          <div className="flex items-center justify-center gap-1 text-[9px] text-gray-500 uppercase tracking-wider font-bold mb-1">
            <Zap size={10} className="text-yellow-400" />
            Sharpe
          </div>
          <div className="text-sm font-mono text-yellow-400 font-bold">
            {analytics.sharpeRatio.toFixed(2)}
          </div>
          <div className="text-xs text-gray-400 font-mono">
            Risk metric
          </div>
        </div>

        <div className="bg-white/[0.03] p-2 rounded-lg border border-white/5 text-center flex flex-col items-center">
          <div className="flex items-center justify-center gap-1 text-[9px] text-gray-500 uppercase tracking-wider font-bold mb-1">
            <AlertTriangle size={10} className="text-orange-400" />
            Max Drawdown
          </div>
          <div className="text-sm font-mono text-orange-400 font-bold">
            -{analytics.maxDrawdown.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-400 font-mono">
            Peak-trough
          </div>
        </div>
      </div>

      {/* Risk Metrics - Mini Row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-white/[0.02] p-1.5 rounded border border-white/5 text-center">
          <div className="text-[8px] text-gray-600 uppercase font-bold">Vol</div>
          <div className="text-xs font-mono text-purple-400">{analytics.riskMetrics.volatility.toFixed(0)}%</div>
        </div>
        <div className="bg-white/[0.02] p-1.5 rounded border border-white/5 text-center">
          <div className="text-[8px] text-gray-600 uppercase font-bold">VaR</div>
          <div className="text-xs font-mono text-red-400">{analytics.riskMetrics.var95.toFixed(0)}%</div>
        </div>
        <div className="bg-white/[0.02] p-1.5 rounded border border-white/5 text-center">
          <div className="text-[8px] text-gray-600 uppercase font-bold">Daily</div>
          <div className="text-xs font-mono text-white">{formatSmallCurrency(analytics.performanceMetrics.dailyAvg)}</div>
        </div>
      </div>

      {/* Main Chart - Takes most space */}
      <div ref={containerRef} className="flex-1 min-h-[180px] relative">
        {containerDimensions && (
          <ResponsiveContainer width={containerDimensions.width} height={containerDimensions.height}>
              <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={color} stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="dateStr"
                  stroke="rgba(255,255,255,0.1)"
                  fontSize={9}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="rgba(255,255,255,0.1)"
                  fontSize={9}
                  tickLine={false}
                  tickFormatter={(value: number) => `$${(value/1000).toFixed(0)}k`}
                  domain={['dataMin - 500', 'dataMax + 500']}
                />
                <Tooltip
                    contentStyle={{
                      backgroundColor: '#0A0A0A',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      fontSize: '11px',
                      padding: '8px'
                    }}
                    labelFormatter={(label) => label}
                    formatter={(value: number) => [formatCurrency(value), 'Portfolio Value']}
                />
                <Area
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top Performers - Compact */}
      {analytics.topPerformers.length > 0 && (
        <div className="border-t border-white/5 pt-2 mt-2">
          <div className="flex items-center gap-1 text-[9px] text-gray-500 uppercase tracking-wider font-bold mb-1">
            <Award size={9} className="text-doge" />
            Top Performers
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {analytics.topPerformers.slice(0, 3).map((performer) => (
              <div key={performer.token.id} className="flex items-center gap-1 bg-white/[0.02] rounded px-2 py-1 whitespace-nowrap flex-shrink-0">
                <img src={performer.token.imageUrl} className="w-3 h-3 rounded" alt={performer.token.ticker} />
                <span className="text-xs font-mono text-white">{performer.token.ticker}</span>
                <span className={`text-xs font-mono ${performer.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {performer.pnl >= 0 ? '+' : ''}{formatCompactCurrency(performer.pnl)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
