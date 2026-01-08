
import React, { useState } from 'react';
import { X, Loader2, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { playSound } from '../services/audio';
import { ModalPortal } from './ModalPortal';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (walletType: string) => Promise<void>;
}

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose, onConnect }) => {
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'connecting' | 'signing' | 'success'>('select');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const wallets = [
    { id: 'rabby', name: 'Rabby Wallet', icon: '/rabby-wallet.png', color: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
    { id: 'metamask', name: 'MetaMask', icon: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg', color: 'bg-orange-500/10 border-orange-500/20 text-orange-500' },
    { id: 'trustwallet', name: 'Trust Wallet', icon: 'https://trustwallet.com/assets/images/media/assets/TWT.png', color: 'bg-blue-500/10 border-blue-500/20 text-blue-500' },
    { id: 'walletconnect', name: 'WalletConnect', icon: 'https://raw.githubusercontent.com/WalletConnect/walletconnect-assets/master/Logo/Blue%20(Default)/Logo.svg', color: 'bg-blue-500/10 border-blue-500/20 text-blue-500' },
    { id: 'coinbase', name: 'Coinbase Wallet', icon: 'https://avatars.githubusercontent.com/u/18060234?s=280&v=4', color: 'bg-blue-600/10 border-blue-600/20 text-blue-600' },
  ];

  const handleConnect = async (walletId: string) => {
    setConnectingWallet(walletId);
    setStep('connecting');
    setError(null);
    playSound('click');

    try {
      // Simulate connection steps for realism
      await new Promise(resolve => setTimeout(resolve, 800));
      setStep('signing');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      await onConnect(walletId);
      
      setStep('success');
      playSound('success');
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (err) {
      setError('Connection rejected');
      setStep('select');
      playSound('error');
    } finally {
      setConnectingWallet(null);
    }
  };

  const handleClose = () => {
    setStep('select');
    setConnectingWallet(null);
    setError(null);
    onClose();
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={handleClose}></div>
        <div className="relative bg-[#0A0A0A] border border-white/10 rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-slide-up overflow-hidden">
        
        <div className="flex justify-between items-center mb-6 relative z-10">
           <h2 className="text-xl font-bold text-white font-comic">Connect Wallet</h2>
           <button onClick={handleClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white">
              <X size={20} />
           </button>
        </div>

        {step === 'select' && (
           <div className="space-y-3 relative z-10">
              {wallets.map(wallet => (
                 <button
                   key={wallet.id}
                   onClick={() => handleConnect(wallet.id)}
                   className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${wallet.color} hover:bg-opacity-20 bg-[#0A0A0A]`}
                 >
                    <div className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-full p-1 overflow-hidden">
                        <img src={wallet.icon} alt={wallet.name} className="w-full h-full object-contain" />
                    </div>
                    <span className="font-bold text-white">{wallet.name}</span>
                    {wallet.id === 'rabby' && <span className="ml-auto text-[10px] bg-white/10 px-2 py-1 rounded text-gray-300 uppercase tracking-wider">Recommended</span>}
                 </button>
              ))}
              {error && (
                 <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle size={14} /> {error}
                 </div>
              )}
           </div>
        )}

        {step === 'connecting' && (
           <div className="py-8 text-center space-y-4 relative z-10">
              <div className="relative w-16 h-16 mx-auto">
                 <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
                 <div className="absolute inset-0 border-4 border-doge border-t-transparent rounded-full animate-spin"></div>
                 <div className="absolute inset-0 flex items-center justify-center p-3">
                    <img src={wallets.find(w => w.id === connectingWallet)?.icon} className="w-full h-full object-contain opacity-50" />
                 </div>
              </div>
              <div>
                 <h3 className="text-white font-bold">Connecting...</h3>
                 <p className="text-xs text-gray-500 mt-1">Please check your wallet extension</p>
              </div>
           </div>
        )}

        {step === 'signing' && (
           <div className="py-8 text-center space-y-4 relative z-10">
              <div className="relative w-16 h-16 mx-auto bg-white/5 rounded-2xl flex items-center justify-center animate-pulse">
                 <FileText size={30} />
              </div>
              <div>
                 <h3 className="text-white font-bold">Verify Ownership</h3>
                 <p className="text-xs text-gray-500 mt-1">Signing secure message...</p>
              </div>
           </div>
        )}

        {step === 'success' && (
           <div className="py-8 text-center space-y-4 relative z-10">
              <div className="w-16 h-16 mx-auto bg-green-500/20 text-green-500 rounded-full flex items-center justify-center animate-bounce-subtle">
                 <CheckCircle size={32} />
              </div>
              <div>
                 <h3 className="text-white font-bold">Connected!</h3>
                 <p className="text-xs text-gray-500 mt-1">Welcome back, Diamond Hands.</p>
              </div>
           </div>
        )}

        <div className="absolute top-0 right-0 w-64 h-64 bg-doge/5 rounded-full blur-[60px] pointer-events-none"></div>
        </div>
      </div>
    </ModalPortal>
  );
};
