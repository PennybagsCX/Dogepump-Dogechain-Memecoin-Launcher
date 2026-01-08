import React from 'react';

interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({ 
  data, 
  color = '#D4AF37', 
  width = 120, 
  height = 40 
}) => {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1; // Avoid division by zero

  // Normalize data points to fit SVG dimensions
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const isPositive = data[data.length - 1] >= data[0];
  const strokeColor = isPositive ? '#00E054' : '#FF3B30'; // Green or Red based on trend

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      {/* Glow Effect */}
      <defs>
        <filter id={`glow-${isPositive ? 'up' : 'down'}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      <path
        d={`M ${points}`}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#glow-${isPositive ? 'up' : 'down'})`}
        className="opacity-80"
      />
      
      {/* End dot */}
      <circle 
        cx={(data.length - 1) / (data.length - 1) * width} 
        cy={height - ((data[data.length - 1] - min) / range) * height} 
        r="2" 
        fill={strokeColor}
        className="animate-pulse"
      />
    </svg>
  );
};