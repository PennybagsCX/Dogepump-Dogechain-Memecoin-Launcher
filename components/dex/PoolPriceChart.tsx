import React, { useMemo } from 'react';

interface PoolPriceChartProps {
  poolAddress: string;
  tokenASymbol: string;
  tokenBSymbol: string;
  timeframe: string;
}

interface PricePoint {
  timestamp: number;
  price: number;
}

// Generate dummy price data
const generateDummyPriceData = (basePrice: number, count: number = 50): PricePoint[] => {
  const data: PricePoint[] = [];
  const now = Date.now();
  const interval = 3600000; // 1 hour intervals

  for (let i = count - 1; i >= 0; i--) {
    const timestamp = now - (i * interval);
    // Generate realistic price variation with random walk
    const variation = (Math.random() - 0.5) * basePrice * 0.05; // ±2.5% variation
    const trend = (count - i) * 0.001 * basePrice; // Slight upward trend
    const price = basePrice + variation + trend;
    data.push({ timestamp, price });
  }

  return data;
};

const PoolPriceChart: React.FC<PoolPriceChartProps> = ({
  poolAddress,
  tokenASymbol,
  tokenBSymbol,
  timeframe,
}) => {
  // Generate dummy data based on pool address (to make it consistent)
  const priceData = useMemo(() => {
    const basePrice = poolAddress.charCodeAt(poolAddress.length - 1) % 10 === 0 ? 1.0 : 0.5;
    return generateDummyPriceData(basePrice, 50);
  }, [poolAddress]);

  // Calculate chart dimensions and scales
  const width = 800;
  const height = 200;
  const padding = { top: 10, right: 10, bottom: 30, left: 50 };

  const prices = priceData.map(d => d.price);
  const minPrice = Math.min(...prices) * 0.99;
  const maxPrice = Math.max(...prices) * 1.01;
  const priceRange = maxPrice - minPrice;

  // Calculate color based on price trend
  const isUpwardTrend = priceData[priceData.length - 1].price > priceData[0].price;
  const chartColor = isUpwardTrend ? '#00E054' : '#FF3B30';

  // Generate SVG path for the line chart
  const generatePath = () => {
    if (priceData.length === 0) return '';

    const points = priceData.map((point, index) => {
      const x = padding.left + (index / (priceData.length - 1)) * (width - padding.left - padding.right);
      const y = padding.top + (1 - (point.price - minPrice) / priceRange) * (height - padding.top - padding.bottom);
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  // Generate gradient fill area
  const generateAreaPath = () => {
    const linePath = generatePath();
    if (!linePath) return '';

    const bottomLeft = `${padding.left},${height - padding.bottom}`;
    const bottomRight = `${width - padding.right},${height - padding.bottom}`;

    return `${linePath} L ${bottomRight} L ${bottomLeft} Z`;
  };

  // Format timestamp to label
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    if (timeframe === '1H') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Generate X-axis labels
  const xLabels = useMemo(() => {
    const labelCount = 6;
    const interval = Math.floor(priceData.length / labelCount);
    return priceData.filter((_, index) => index % interval === 0);
  }, [priceData, timeframe]);

  // Generate Y-axis labels
  const yLabels = useMemo(() => {
    const labelCount = 5;
    const labels: { price: number; y: number }[] = [];

    for (let i = 0; i < labelCount; i++) {
      const price = minPrice + (priceRange * i) / (labelCount - 1);
      const y = padding.top + (1 - i / (labelCount - 1)) * (height - padding.top - padding.bottom);
      labels.push({ price, y });
    }

    return labels;
  }, [minPrice, maxPrice, priceRange]);

  return (
    <div className="w-full">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="overflow-visible"
      >
        <defs>
          {/* Gradient for area fill */}
          <linearGradient id={`gradient-${poolAddress}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={chartColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={chartColor} stopOpacity="0" />
          </linearGradient>

          {/* Gradient for line glow */}
          <filter id={`glow-${poolAddress}`}>
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background grid lines (horizontal) */}
        {yLabels.map((label, index) => (
          <g key={index}>
            <line
              x1={padding.left}
              y1={label.y}
              x2={width - padding.right}
              y2={label.y}
              stroke="white"
              strokeOpacity="0.05"
              strokeWidth="1"
            />
            <text
              x={padding.left - 10}
              y={label.y}
              fill="white"
              fontSize="11"
              opacity="0.5"
              textAnchor="end"
              dominantBaseline="middle"
              fontFamily="monospace"
            >
              {label.price.toFixed(6)}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path
          d={generateAreaPath()}
          fill={`url(#gradient-${poolAddress})`}
          opacity="0.5"
        />

        {/* Line chart */}
        <path
          d={generatePath()}
          fill="none"
          stroke={chartColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#glow-${poolAddress})`}
        />

        {/* Data points (last 10 points only) */}
        {priceData.slice(-10).map((point, index) => {
          const actualIndex = priceData.length - 10 + index;
          const x = padding.left + (actualIndex / (priceData.length - 1)) * (width - padding.left - padding.right);
          const y = padding.top + (1 - (point.price - minPrice) / priceRange) * (height - padding.top - padding.bottom);

          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="3"
              fill={chartColor}
              opacity="0.8"
            />
          );
        })}

        {/* X-axis labels */}
        {xLabels.map((point, index) => {
          const x = padding.left + ((priceData.indexOf(point)) / (priceData.length - 1)) * (width - padding.left - padding.right);
          return (
            <text
              key={index}
              x={x}
              y={height - 10}
              fill="white"
              fontSize="10"
              opacity="0.5"
              textAnchor="middle"
              fontFamily="monospace"
            >
              {formatTimestamp(point.timestamp)}
            </text>
          );
        })}
      </svg>

      {/* Current price indicator */}
      <div className="flex items-center justify-between mt-2">
        <div className="text-xs text-gray-500">
          <span className="text-gray-400">Current:</span> {priceData[priceData.length - 1]?.price.toFixed(6)} {tokenBSymbol}/{tokenASymbol}
        </div>
        <div className={`text-xs font-bold ${isUpwardTrend ? 'text-green-400' : 'text-red-400'}`}>
          {isUpwardTrend ? '+' : '-'}{((Math.abs(priceData[priceData.length - 1]?.price - priceData[0]?.price || 0) / priceData[0]?.price * 100) || 0).toFixed(2)}%
        </div>
      </div>
    </div>
  );
};

export default PoolPriceChart;
