import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Fuel, Settings } from 'lucide-react';
import { playSound } from '../services/audio';
import { SlippageControl } from './SlippageControl';

interface TransactionSummaryProps {
  estimatedReceive: string;
  receiveCurrency: string;
  protocolFee: string;
  networkFee: string;
  slippage: string;
  onSlippageClick: () => void;
  onSlippageChange: (value: string) => void;
  tradeType: 'buy' | 'sell' | 'burn' | 'karma';
}

export const TransactionSummary: React.FC<TransactionSummaryProps> = ({
  estimatedReceive,
  receiveCurrency,
  protocolFee,
  networkFee,
  slippage,
  onSlippageClick,
  onSlippageChange,
  tradeType,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSlippageSettings, setShowSlippageSettings] = useState(false);

  // Hide for Burn/Karma modes
  if (tradeType === 'burn' || tradeType === 'karma') {
    return null;
  }

  return (
    <div className="bg-black/40 rounded-xl p-4 space-y-2 border border-white/5 text-xs relative overflow-hidden group">
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          playSound('click');
        }}
        className="w-full flex justify-between items-center"
        aria-expanded={isOpen}
        aria-label={`${isOpen ? 'Collapse' : 'Expand'} transaction summary`}
      >
        <span className="text-gray-500 font-medium">Receive (Est.)</span>
        <div className="flex items-center gap-2">
          <span className="text-white font-mono font-bold tracking-wide text-sm">
            ~ {estimatedReceive} <span className="text-gray-600 text-[10px]">{receiveCurrency}</span>
          </span>
          {isOpen ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
        </div>
      </button>

      {isOpen && (
        <div className="space-y-2 pt-2 border-t border-white/5 animate-fade-in">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-medium">Protocol Fee</span>
            <span className="text-gray-500 font-mono">{protocolFee} $DC</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-medium flex items-center gap-1">
              <Fuel size={10} /> Network Fee
            </span>
            <span className="text-gray-500 font-mono">~{networkFee} $DC</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-white/5">
            <span
              className="text-gray-500 flex items-center gap-1 cursor-pointer group-hover:text-gray-400 transition-colors"
              onClick={() => {
                setShowSlippageSettings(!showSlippageSettings);
                onSlippageClick();
              }}
            >
              Slippage <Settings size={10} className="transition-transform group-hover:rotate-90" />
            </span>
            <span
              className="text-doge font-mono bg-doge/10 px-1.5 py-0.5 rounded text-[10px] cursor-pointer hover:bg-doge/20 transition-colors"
              onClick={() => {
                setShowSlippageSettings(!showSlippageSettings);
                onSlippageClick();
              }}
            >
              {slippage}%
            </span>
          </div>
        </div>
      )}

      {/* Slippage Settings Overlay */}
      {showSlippageSettings && (
        <div className="absolute inset-0 bg-[#0A0A0A] z-30 rounded-xl">
          <SlippageControl
            value={slippage}
            onChange={(value) => {
              onSlippageChange(value);
              setShowSlippageSettings(false);
            }}
            onClose={() => setShowSlippageSettings(false)}
          />
        </div>
      )}
    </div>
  );
};
