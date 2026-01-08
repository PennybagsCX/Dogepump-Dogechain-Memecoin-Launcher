import React, { useEffect, useState, useRef } from 'react';
import { formatNumber, formatCurrency } from '../services/web3Service';

interface FlashNumberProps {
  value: number;
  type?: 'number' | 'currency';
  className?: string;
  prefix?: React.ReactNode;
}

export const FlashNumber: React.FC<FlashNumberProps> = ({ 
  value, 
  type = 'number', 
  className = '',
  prefix
}) => {
  const [flashClass, setFlashClass] = useState('');
  const prevValueRef = useRef(value);
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    const prevValue = prevValueRef.current;
    if (value !== prevValue) {
      if (value > prevValue) {
        setFlashClass('text-green-400 scale-110');
      } else if (value < prevValue) {
        setFlashClass('text-red-400 scale-110');
      }

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setFlashClass('');
      }, 800);

      prevValueRef.current = value;
    }
  }, [value]);

  const displayValue = type === 'currency' ? formatCurrency(value) : formatNumber(value);

  return (
    <span className={`transition-all duration-300 inline-block ${flashClass} ${className}`}>
      {prefix}
      {displayValue}
    </span>
  );
};