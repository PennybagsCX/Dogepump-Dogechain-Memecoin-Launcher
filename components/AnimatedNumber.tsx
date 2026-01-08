import React, { useEffect, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  format?: (val: number) => string;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ 
  value, 
  format = (v) => v.toFixed(6), 
  className 
}) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let startTime: number;
    const startValue = displayValue;
    const endValue = value;
    const duration = 800; // ms

    if (startValue === endValue) return;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function (easeOutQuart)
      const ease = 1 - Math.pow(1 - progress, 4);
      
      const current = startValue + (endValue - startValue) * ease;
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }, [value]);

  return (
    <span className={className}>
      {format(displayValue)}
    </span>
  );
};