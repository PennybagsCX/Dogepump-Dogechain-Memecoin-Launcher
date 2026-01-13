import React, { useState, useCallback, useEffect } from 'react';
import { X, Plus, Droplets, AlertCircle, Check } from 'lucide-react';
import { Pool, Token } from '../../contexts/DexContext';
import AmountInput from '../AmountInput';
import Button from '../Button';
import { formatNumber } from '../../utils';
import TokenSelectList from './TokenSelectList';

interface CreatePoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePool: (token0: string, token1: string, amount0: string, amount1: string) => void;
  tokens: Token[];
  soundsEnabled?: boolean;
  inline?: boolean;
}

const CreatePoolModal: React.FC<CreatePoolModalProps> = ({
  isOpen,
  onClose,
  onCreatePool,
  tokens,
  soundsEnabled = true,
  inline = false,
}) => {
  const [step, setStep] = useState<'select' | 'amounts' | 'confirm'>('select');
  const [token0, setToken0] = useState<Token | null>(null);
  const [token1, setToken1] = useState<Token | null>(null);
  const [amount0, setAmount0] = useState('');
  const [amount1, setAmount1] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Play sound effect
  const playSound = useCallback((sound: 'click' | 'success' | 'error') => {
    if (!soundsEnabled) return;
    const audio = new Audio(`/sounds/${sound}.mp3`);
    audio.volume = 0.2;
    audio.play().catch(() => {});
  }, [soundsEnabled]);

  // Handle token selection
  const handleSelectToken0 = useCallback((token: Token) => {
    playSound('click');
    setToken0(token);
    if (token1 && token.address === token1.address) {
      setToken1(null);
    }
  }, [playSound, token1]);

  const handleSelectToken1 = useCallback((token: Token) => {
    playSound('click');
    setToken1(token);
    if (token0 && token.address === token0.address) {
      setToken0(null);
    }
  }, [playSound, token0]);

  // Proceed to amounts step
  const handleProceedToAmounts = useCallback(() => {
    if (!token0 || !token1) return;
    playSound('click');
    setStep('amounts');
  }, [token0, token1, playSound]);

  // Calculate amount1 based on amount0 and prices
  const handleAmount0Change = useCallback((value: string) => {
    setAmount0(value);
    // Simple 1:1 ratio for demo - in real app, use price oracle
    setAmount1(value);
  }, []);

  const handleAmount1Change = useCallback((value: string) => {
    setAmount1(value);
    // Simple 1:1 ratio for demo - in real app, use price oracle
    setAmount0(value);
  }, []);

  // Proceed to confirmation
  const handleProceedToConfirm = useCallback(() => {
    if (!amount0 || !amount1) return;
    playSound('click');
    setStep('confirm');
  }, [amount0, amount1, playSound]);

  // Create pool
  const handleCreatePool = useCallback(async () => {
    if (!token0 || !token1 || !amount0 || !amount1) return;

    setIsCreating(true);
    playSound('click');

    // Simulate pool creation
    setTimeout(() => {
      onCreatePool(token0.address, token1.address, amount0, amount1);
      setIsCreating(false);
      playSound('success');

      // Reset form
      setToken0(null);
      setToken1(null);
      setAmount0('');
      setAmount1('');
      setStep('select');
      onClose();
    }, 2000);
  }, [token0, token1, amount0, amount1, onCreatePool, onClose, playSound]);

  // Preselect DC (or KARMA fallback) when opened
  useEffect(() => {
    if (isOpen && !token0) {
      const dc = tokens.find(t => t.symbol === 'DC' || t.address === 'dc');
      const karma = tokens.find(t => t.symbol === 'KARMA' || t.address === 'karma');
      setToken0(dc || karma || null);
    }
  }, [isOpen, token0, tokens]);

  // Enforce base token rule: only DC or KARMA allowed as first token
  const baseTokens = tokens.filter(
    t => t.symbol === 'DC' || t.address === 'dc' || t.symbol === 'KARMA' || t.address === 'karma'
  );
  const availableTokens0 = baseTokens;

  // Second token: only platform tokens, excluding the selected base and excluding DC to enforce DC-paired pools
  const availableTokens1 = tokens.filter(
    t =>
      (!token0 || t.address !== token0.address) &&
      !(t.symbol === 'DC' || t.address === 'dc')
  );

  if (!isOpen) return null;

  // Use full-height standard buttons on mobile inline and modal for consistency
  const actionButtonSize: 'sm' | 'md' | 'lg' = 'lg';
  const actionButtonClass = inline ? '!h-12 !px-5 !text-base w-full rounded-xl' : '';

  const containerClass = inline
    ? 'relative w-full'
    : 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-stretch sm:items-center justify-center z-50 p-2 sm:p-6 overflow-y-auto';

  const cardClass = inline
    ? 'relative bg-[#0A0A0A] border border-white/10 rounded-xl sm:rounded-2xl w-full animate-fade-in shadow-2xl flex flex-col overflow-hidden'
    : 'relative bg-[#0A0A0A] border border-white/10 rounded-xl sm:rounded-2xl w-full max-w-xl sm:max-w-2xl animate-fade-in shadow-2xl flex flex-col max-h-[calc(100vh-0.5rem)] sm:max-h-[92vh] overflow-hidden';

  return (
    <div
      className={containerClass}
      onClick={() => {
        if (!inline) {
          playSound('click');
          onClose();
        }
      }}
      role="presentation"
    >
      {!inline && <div className="absolute inset-0" aria-hidden />}
      <div
        className={cardClass}
        onClick={(e: any) => e.stopPropagation()}
        role="dialog"
        aria-modal={!inline}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-4 sm:p-6 border-b border-white/10 ${inline ? '' : 'sticky top-0'} bg-[#0A0A0A] z-10`}>
          <h2 className="text-lg sm:text-2xl font-comic font-bold text-white">
            {step === 'select' && 'Select Tokens'}
            {step === 'amounts' && 'Add Liquidity'}
            {step === 'confirm' && 'Confirm Creation'}
          </h2>
          <button
            onClick={() => {
              playSound('click');
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            aria-label="Close modal"
          >
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className={`p-4 sm:p-6 space-y-4 ${inline ? '' : 'overflow-y-auto flex-1 min-h-0'}`}>
          {step === 'select' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TokenSelectList
                tokens={availableTokens0}
                selectedToken={token0}
                label="First Token (Base)"
                onSelect={handleSelectToken0}
                emptyState="No base tokens available."
              />
              <TokenSelectList
                tokens={availableTokens1}
                selectedToken={token1}
                label="Second Token (Pair)"
                onSelect={handleSelectToken1}
                emptyState="Search to find a token to pair."
              />
              {token0 && token1 && (
                <div className="sm:col-span-2 bg-doge/5 border border-doge/20 rounded-xl p-3 flex gap-2">
                  <Check size={16} className="text-doge flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-doge">
                    Selected pair: <span className="font-bold">{token0.symbol}/{token1.symbol}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 'amounts' && (
            <>
              <div>
                <label className="block text-sm font-bold text-white mb-2">
                  Deposit {token0?.symbol}
                </label>
                <AmountInput
                  id="create-pool-amount0"
                  value={amount0}
                  onChange={handleAmount0Change}
                  currency={token0?.symbol || 'Token'}
                  aria-label={`Amount of ${token0?.symbol} to deposit`}
                />
                <div className="flex items-center justify-between mt-2 px-1">
                  <div className="text-xs text-gray-500 font-medium">Balance:</div>
                  <div className="text-sm font-mono font-bold text-white">{token0?.balance || '0'}</div>
                </div>
              </div>

              <div className="flex justify-center">
                <Plus size={20} className="text-gray-500" />
              </div>

              <div>
                <label className="block text-sm font-bold text-white mb-2">
                  Deposit {token1?.symbol}
                </label>
                <AmountInput
                  id="create-pool-amount1"
                  value={amount1}
                  onChange={handleAmount1Change}
                  currency={token1?.symbol || 'Token'}
                  aria-label={`Amount of ${token1?.symbol} to deposit`}
                />
                <div className="flex items-center justify-between mt-2 px-1">
                  <div className="text-xs text-gray-500 font-medium">Balance:</div>
                  <div className="text-sm font-mono font-bold text-white">{token1?.balance || '0'}</div>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex gap-2">
                <AlertCircle size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-300">
                  By creating a pool, you'll provide liquidity for the {token0?.symbol}/{token1?.symbol} pair and earn trading fees.
                </p>
              </div>
            </>
          )}

          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">You'll deposit</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-doge/20 flex items-center justify-center text-sm font-bold text-doge">
                      {token0?.symbol?.charAt(0)}
                    </div>
                    <span className="text-white font-mono">{formatNumber(amount0)}</span>
                  </div>
                  <span className="text-white font-bold">{token0?.symbol}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-sm font-bold text-purple-400">
                      {token1?.symbol?.charAt(0)}
                    </div>
                    <span className="text-white font-mono">{formatNumber(amount1)}</span>
                  </div>
                  <span className="text-white font-bold">{token1?.symbol}</span>
                </div>

                <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                  <span className="text-sm text-gray-400">Share of pool</span>
                  <span className="text-white font-bold">100%</span>
                </div>
              </div>

              <div className="bg-doge/5 border border-doge/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Droplets size={16} className="text-doge" />
                  <span className="text-sm font-bold text-doge">Initial Liquidity Provider</span>
                </div>
                <p className="text-xs text-gray-300">
                  As the first liquidity provider, you'll set the initial price for this pool. You'll receive LP tokens representing your 100% share of the pool.
                </p>
              </div>

              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 flex gap-2">
                <AlertCircle size={16} className="text-orange-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-orange-300">
                  By creating this pool, you acknowledge the risks of providing liquidity, including impermanent loss.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 border-t border-white/10 flex flex-col sm:flex-row gap-3 sticky bottom-0 bg-[#0A0A0A]">
          {step === 'select' && (
            <div className={`gap-3 ${inline ? 'grid grid-cols-2' : 'flex flex-col sm:flex-row'}`}>
              <Button
                variant="ghost"
                size={actionButtonSize}
                className={`flex-1 border border-white/10 text-white hover:border-white/20 ${actionButtonClass} !bg-transparent !text-white`}
                onClick={() => {
                  playSound('click');
                  onClose();
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size={actionButtonSize}
                className={`flex-1 ${actionButtonClass} !bg-doge hover:!bg-doge-light !text-black !shadow-lg !shadow-doge/20`}
                onClick={handleProceedToAmounts}
                disabled={!token0 || !token1}
              >
                Next
              </Button>
            </div>
          )}

          {step === 'amounts' && (
            <div className={`gap-3 ${inline ? 'grid grid-cols-2' : 'flex flex-col sm:flex-row'}`}>
              <Button
                variant="ghost"
                size={actionButtonSize}
                className={`flex-1 border border-white/10 text-white hover:border-white/20 ${actionButtonClass} !bg-transparent !text-white`}
                onClick={() => {
                  playSound('click');
                  setStep('select');
                }}
              >
                Back
              </Button>
              <Button
                variant="primary"
                size={actionButtonSize}
                className={`flex-1 ${actionButtonClass} !bg-doge hover:!bg-doge-light !text-black !shadow-lg !shadow-doge/20`}
                onClick={handleProceedToConfirm}
                disabled={!amount0 || !amount1}
              >
                Review
              </Button>
            </div>
          )}

          {step === 'confirm' && (
            <div className={`gap-3 ${inline ? 'grid grid-cols-2' : 'flex flex-col sm:flex-row'}`}>
              <Button
                variant="ghost"
                size={actionButtonSize}
                className={`flex-1 border border-white/10 text-white hover:border-white/20 ${actionButtonClass} !bg-transparent !text-white`}
                onClick={() => {
                  playSound('click');
                  setStep('amounts');
                }}
              >
                Back
              </Button>
              <Button
                variant="primary"
                size={actionButtonSize}
                className={`flex-1 ${actionButtonClass} !bg-doge hover:!bg-doge-light !text-black !shadow-lg !shadow-doge/20`}
                onClick={handleCreatePool}
                disabled={isCreating}
                isLoading={isCreating}
              >
                {isCreating ? 'Creating...' : 'Create Pool'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatePoolModal;
