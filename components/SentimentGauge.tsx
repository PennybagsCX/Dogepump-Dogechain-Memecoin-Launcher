
import React from 'react';

interface SentimentGaugeProps {
  score: number; // 0 to 100
  size?: number;
}

export const SentimentGauge: React.FC<SentimentGaugeProps> = ({ score, size = 200 }) => {
  const radius = size * 0.4;
  const stroke = size * 0.08;
  const normalizedScore = Math.min(100, Math.max(0, score));
  const circumference = normalizedScore * Math.PI; // Half circle

  // Determine color based on score
  let color = '#ef4444'; // Red
  if (normalizedScore > 40) color = '#eab308'; // Yellow
  if (normalizedScore > 75) color = '#22c55e'; // Green
  if (normalizedScore > 90) color = '#D4AF37'; // Gold (Doge)

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size / 1.8 }}>
      <svg width={size} height={size} className="overflow-visible rotate-[180deg]">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
          <filter id="glow">
             <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
             <feMerge>
                 <feMergeNode in="coloredBlur"/>
                 <feMergeNode in="SourceGraphic"/>
             </feMerge>
          </filter>
        </defs>
        
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1f2937"
          strokeWidth={stroke}
          strokeDasharray={`${Math.PI * radius} ${Math.PI * radius}`}
          strokeLinecap="round"
          className="opacity-50"
        />

        {/* Value Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={normalizedScore > 90 ? "#D4AF37" : "url(#gaugeGradient)"}
          strokeWidth={stroke}
          strokeDasharray={`${(normalizedScore / 100) * Math.PI * radius} ${Math.PI * radius * 2}`}
          strokeLinecap="round"
          filter="url(#glow)"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      
      {/* Needle/Text Overlay */}
      <div className="absolute bottom-0 text-center flex flex-col items-center">
         <div className="text-4xl font-black font-comic tracking-tighter" style={{ color }}>
            {score}
         </div>
         <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Moon Score</div>
      </div>
    </div>
  );
};
