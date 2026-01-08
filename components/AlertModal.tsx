
import React, { useState } from 'react';
import { X, Bell, Trash2, ArrowUp, ArrowDown, TrendingUp } from 'lucide-react';
import { Token, PriceAlert } from '../types';
import { Button } from './Button';
import { useStore } from '../contexts/StoreContext';
import { ModalPortal } from './ModalPortal';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: Token;
}

export const AlertModal: React.FC<AlertModalProps> = ({ isOpen, onClose, token }) => {
  const { priceAlerts, addPriceAlert, removePriceAlert } = useStore();
  const [targetPrice, setTargetPrice] = useState(token.price.toFixed(8));

  if (!isOpen) return null;

  const tokenAlerts = priceAlerts.filter(a => a.tokenId === token.id);
  const priceNum = parseFloat(targetPrice);
  const condition = priceNum > token.price ? 'above' : 'below';

  const handleAdd = () => {
    if (!priceNum || isNaN(priceNum)) return;
    addPriceAlert(token.id, priceNum);
    setTargetPrice(token.price.toFixed(8)); // Reset
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
        <div className="relative bg-[#0A0A0A] border border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-slide-up">
        
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-xl font-bold text-white font-comic flex items-center gap-2">
              <Bell size={20} className="text-doge" /> Price Alerts
           </h2>
           <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white">
              <X size={20} />
           </button>
        </div>

        <div className="space-y-6">
           {/* Input Section */}
           <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
              <div className="flex justify-between items-center text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">
                 <span>Target Price</span>
                 <span className="text-doge cursor-pointer" onClick={() => setTargetPrice(token.price.toFixed(8))}>Current: ${token.price.toFixed(6)}</span>
              </div>
              
              <div className="relative group mb-4">
                 <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</div>
                 <input 
                   type="number" 
                   value={targetPrice}
                   onChange={(e) => setTargetPrice(e.target.value)}
                   className="w-full bg-black border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white font-mono font-bold focus:border-doge/50 outline-none transition-colors"
                   step="0.00000001"
                 />
              </div>

              <div className="flex items-center gap-3 mb-4 p-2 bg-black/40 rounded-lg border border-white/5 text-xs">
                 {condition === 'above' ? <ArrowUp size={16} className="text-green-500"/> : <ArrowDown size={16} className="text-red-500"/>}
                 <span className="text-gray-300">Alert when price goes <span className={`font-bold ${condition === 'above' ? 'text-green-500' : 'text-red-500'}`}>{condition.toUpperCase()}</span> target</span>
              </div>

              <Button onClick={handleAdd} className="w-full rounded-xl">Set Alert</Button>
           </div>

           {/* List Section */}
           <div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Active Alerts</div>
              <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                 {tokenAlerts.length === 0 ? (
                    <div className="text-center py-8 text-gray-600 text-xs">No active alerts for {token.ticker}.</div>
                 ) : (
                    tokenAlerts.map(alert => (
                       <div key={alert.id} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5 group hover:border-white/10 transition-colors">
                          <div className="flex items-center gap-3">
                             <div className={`p-1.5 rounded-lg ${alert.condition === 'above' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                <TrendingUp size={14} />
                             </div>
                             <div className="flex flex-col">
                                <span className="text-white font-mono font-bold text-sm">${alert.price.toFixed(6)}</span>
                                <span className="text-[10px] text-gray-500 uppercase font-bold">{alert.condition} current</span>
                             </div>
                          </div>
                          <button onClick={() => removePriceAlert(alert.id)} className="text-gray-600 hover:text-red-500 p-2 transition-colors">
                             <Trash2 size={14} />
                          </button>
                       </div>
                    ))
                 )}
              </div>
           </div>
        </div>

        </div>
      </div>
    </ModalPortal>
  );
};
