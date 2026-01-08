
import React from 'react';
import { X, Copy, CheckCircle, ExternalLink, Box, Fuel, Clock, ArrowRight, Zap, Users, User, Wallet } from 'lucide-react';
import { Trade, Token } from '../types';
import { formatNumber, formatAddress } from '../services/web3Service';
import { EXPLORER_URL } from '../constants';
import { timeAgo } from '../utils';
import { Button } from './Button';
import { useToast } from './Toast';
import { useStore } from '../contexts/StoreContext';
import { Link } from 'react-router-dom';
import { ModalPortal } from './ModalPortal';

interface ExplorerModalProps {
  trade: Trade | null;
  token: Token | undefined;
  onClose: () => void;
  onCopyTrade?: (amountDC: number) => void;
}

export const ExplorerModal: React.FC<ExplorerModalProps> = ({ trade, token, onClose, onCopyTrade }) => {
  const { addToast } = useToast();
  const { followUser, unfollowUser, copyTargets, resolveUsername } = useStore();

  if (!trade) return null;

  // Check if user is already being followed
  const isFollowing = copyTargets.some(t => t.address === trade.user);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast('success', 'Copied to clipboard');
  };

  const handleCopyTrade = () => {
    if (onCopyTrade) {
       if (trade.type === 'buy') {
         onCopyTrade(trade.amountDC);
         addToast('success', `Copied buy settings for ${formatNumber(trade.amountDC)} DC`, 'Trade Pre-filled');
       } else {
         // For sell trades, copy the token amount to sell
         onCopyTrade(trade.amountToken);
         addToast('success', `Copied sell settings for ${formatNumber(trade.amountToken)} tokens`, 'Trade Pre-filled');
       }
    }
    onClose();
  };

  const handleAutoCopy = () => {
     if (isFollowing) {
        // If already following, unfollow them to allow re-following with new settings
        unfollowUser(trade.user);
        addToast('info', `Stopped auto-copying ${resolveUsername(trade.user)}`, 'Copy Trading Updated');
     } else {
        // If not following, start following them
        followUser(trade.user, 100); // Default to 100 DC max
        addToast('success', `Now auto-copying trades from ${resolveUsername(trade.user)}`, 'Auto-Copy Enabled');
     }
     onClose();
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
        <div className="relative bg-[#0A0A0A] border border-white/10 rounded-3xl max-w-2xl w-full shadow-2xl animate-slide-up overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#111] p-6 border-b border-white/5 flex justify-between items-start">
           <div>
              <div className="flex items-center gap-2 mb-2">
                 <div className="bg-doge text-black px-2 py-0.5 rounded text-xs font-bold uppercase">DogeScan</div>
                 <span className="text-gray-500 text-xs font-mono">Testnet</span>
              </div>
              <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
                 Tx: {trade.txHash.slice(0, 16)}...
                 <Copy size={14} className="text-gray-500 hover:text-white cursor-pointer" onClick={() => copyToClipboard(trade.txHash)} />
              </h2>
           </div>
           <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white">
              <X size={20} />
           </button>
        </div>

        {/* Status Bar */}
        <div className="bg-green-500/10 border-b border-green-500/20 px-6 py-3 flex items-center gap-2">
           <CheckCircle size={16} className="text-green-500" />
           <span className="text-sm font-bold text-green-500">Success</span>
           <span className="text-xs text-green-500/60 ml-auto">Confirmed in 2.1s</span>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
           
           {/* Action Card */}
           <div className="flex items-center gap-4 bg-white/[0.02] p-4 rounded-xl border border-white/5">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${trade.type === 'buy' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                 {trade.type === 'buy' ? 'BUY' : 'SELL'}
              </div>
              <div className="flex-1">
                 <div className="flex items-center gap-2 text-lg font-bold text-white">
                    {formatNumber(trade.amountToken)} <span className="text-gray-400">{token?.ticker}</span>
                    <ArrowRight size={16} className="text-gray-600" />
                    {formatNumber(trade.amountDC)} <span className="text-doge">DC</span>
                 </div>
                 <div className="text-xs text-gray-500">@ ${trade.price.toFixed(8)} / token</div>
              </div>
              
              {/* Copy Trade Actions */}
              {(trade.type === 'buy' || trade.type === 'sell') && trade.user !== 'You' && (
                 <div className="flex flex-col gap-2">
                    <Button size="sm" onClick={handleCopyTrade} className="gap-2 bg-white/10 hover:bg-white/20 border-0 text-white w-full">
                        <Zap size={14} /> Copy This {trade.type === 'buy' ? 'Buy' : 'Sell'}
                    </Button>
                    <Button size="sm" onClick={handleAutoCopy} variant="secondary" className={`gap-2 w-full text-xs ${isFollowing ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20' : ''}`}>
                        <Users size={14} /> {isFollowing ? 'Stop Auto-Copy' : 'Auto-Copy User'}
                    </Button>
                 </div>
              )}
           </div>

           <div className="grid gap-4">
              <div className="grid grid-cols-12 gap-4 text-sm">
                 <div className="col-span-4 text-gray-500 flex items-center gap-2"><Box size={14}/> Block Height</div>
                 <div className="col-span-8 text-blue-400 font-mono">#{trade.blockNumber}</div>
              </div>
              <div className="grid grid-cols-12 gap-4 text-sm">
                 <div className="col-span-4 text-gray-500 flex items-center gap-2"><Clock size={14}/> Timestamp</div>
                 <div className="col-span-8 text-white">{new Date(trade.timestamp).toLocaleString()} ({timeAgo(trade.timestamp)})</div>
              </div>
              
              {/* Detailed User Row - Refactored */}
              <div className="grid grid-cols-12 gap-4 text-sm items-start border-y border-white/5 py-3 my-2">
                 <div className="col-span-12 text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">From Details</div>
                 
                 <div className="col-span-6">
                    <div className="flex items-center gap-2 mb-1 text-gray-400 text-xs"><User size={12}/> User Profile</div>
                    <Link to={`/profile/${trade.user === 'You' ? '' : trade.user}`} onClick={onClose} className="text-white font-bold hover:text-doge hover:underline transition-colors flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg border border-white/5">
                        {resolveUsername(trade.user)}
                        {trade.user === 'You' && <span className="text-[10px] bg-white/10 px-1.5 rounded text-white font-normal no-underline">Me</span>}
                        <ExternalLink size={12} className="ml-auto opacity-50"/>
                    </Link>
                 </div>

                 <div className="col-span-6">
                    <div className="flex items-center gap-2 mb-1 text-gray-400 text-xs"><Wallet size={12}/> Wallet Address</div>
                    <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg border border-white/5">
                        <span className="text-xs text-gray-300 font-mono truncate flex-1">{formatAddress(trade.user)}</span>
                        <Copy size={12} className="text-gray-500 hover:text-white cursor-pointer" onClick={() => copyToClipboard(trade.user)} />
                        <a href={`${EXPLORER_URL}/address/${trade.user}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300" title="View on Explorer">
                            <ExternalLink size={12}/>
                        </a>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-12 gap-4 text-sm">
                 <div className="col-span-4 text-gray-500">Interacted With (To)</div>
                 <div className="col-span-8 text-white font-mono flex items-center gap-2">
                    DogePump: Router <ExternalLink size={12} className="text-gray-600"/>
                 </div>
              </div>
              <div className="grid grid-cols-12 gap-4 text-sm">
                 <div className="col-span-4 text-gray-500 flex items-center gap-2"><Fuel size={14}/> Gas Fee</div>
                 <div className="col-span-8 text-gray-300 font-mono">{trade.gasUsed} Gwei</div>
              </div>
           </div>

        </div>
        
        <div className="bg-[#111] p-4 border-t border-white/5 text-center">
            <button className="text-xs text-doge hover:text-white transition-colors font-bold uppercase tracking-wider">
               View Full On-Chain Data
            </button>
        </div>

        </div>
      </div>
    </ModalPortal>
  );
};
