
import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Wallet, Check, Loader2, ShieldCheck, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { useStore } from '../contexts/StoreContext';
import { useToast } from '../components/Toast';
import { playSound } from '../services/audio';
import { formatNumber } from '../services/web3Service';

const Bridge: React.FC = () => {
  const { userBalanceDC, bridgeAssets } = useStore();
  const { addToast } = useToast();
  
  const [step, setStep] = useState(1); // 1: Input, 2: Confirming, 3: Oracle, 4: Minting, 5: Success
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');

  // Mock external Doge balance
  const externalBalance = 42069;

  const handleBridge = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    if (parseFloat(amount) > externalBalance) {
       addToast('error', 'Insufficient Doge in external wallet');
       return;
    }

    playSound('click');
    setStep(2);

    // Simulation Sequence
    setTimeout(() => {
       setStep(3); // Oracle
       setTxHash('0x' + Math.random().toString(16).slice(2));
    }, 2000);

    setTimeout(() => {
       setStep(4); // Minting
    }, 4500);

    setTimeout(() => {
       setStep(5); // Success
       playSound('success');
       bridgeAssets(parseFloat(amount));
       addToast('success', `Bridged ${amount} DOGE to $DC`, 'Bridge Complete');
    }, 6500);
  };

  return (
    <div className="max-w-xl mx-auto py-12 px-4 animate-fade-in">
       <Link to="/" className="inline-flex items-center text-gray-500 hover:text-white mb-8 transition-colors">
          <ArrowLeft size={16} className="mr-2" /> Back to App
       </Link>

       <div className="bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
          {/* Decor */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-doge/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

          <div className="relative z-10">
             <div className="text-center mb-8">
                <h1 className="text-3xl font-comic font-bold text-white mb-2">DogeBridge</h1>
                <p className="text-gray-400 text-sm">Transfer assets from Dogecoin to DogePump Chain.</p>
             </div>

             {step === 1 && (
                <div className="space-y-6">
                   {/* From */}
                   <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                      <div className="flex justify-between text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">
                         <span>From Network</span>
                         <span>Balance: {formatNumber(externalBalance)} DOGE</span>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-[#BA9F33] rounded-full flex items-center justify-center font-bold text-black shadow-lg border border-white/20">
                            Ð
                         </div>
                         <div className="flex-1">
                            <div className="text-white font-bold">Dogecoin Mainnet</div>
                            <div className="text-xs text-gray-500">Native Asset</div>
                         </div>
                      </div>
                   </div>

                   {/* Arrow */}
                   <div className="flex justify-center -my-3 relative z-20">
                      <div className="bg-[#1a1a1a] border border-white/10 p-2 rounded-full text-gray-500">
                         <ArrowRight size={16} className="rotate-90" />
                      </div>
                   </div>

                   {/* To */}
                   <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                      <div className="flex justify-between text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">
                         <span>To Network</span>
                         <span>Balance: {formatNumber(userBalanceDC)} DC</span>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-doge rounded-full flex items-center justify-center font-bold text-black shadow-lg border border-white/20">
                            <ShieldCheck size={20} />
                         </div>
                         <div className="flex-1">
                            <div className="text-white font-bold">DogePump Chain</div>
                            <div className="text-xs text-gray-500">Wrapped $DC</div>
                         </div>
                      </div>
                   </div>

                   {/* Input */}
                   <div>
                      <label htmlFor="bridge-amount" className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-2 block">Amount to Bridge</label>
                      <div className="relative group">
                         <input
                           id="bridge-amount"
                           name="bridgeAmount"
                           type="number"
                           value={amount}
                           onChange={(e) => setAmount(e.target.value)}
                           className="w-full bg-[#050505] border border-white/10 rounded-xl py-4 pl-4 pr-16 text-white font-mono font-bold text-lg focus:border-doge/50 outline-none transition-all"
                           placeholder="0.00"
                         />
                         <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">DOGE</div>
                      </div>
                   </div>

                   <Button size="lg" className="w-full rounded-xl h-14 font-bold text-lg" onClick={handleBridge}>
                      Bridge Assets
                   </Button>
                   
                   <p className="text-[10px] text-center text-gray-600">
                      Estimated time: ~5 minutes (6 confirmations). 
                      <br/>Network Fee: 1.0 DOGE.
                   </p>
                </div>
             )}

             {step > 1 && step < 5 && (
                <div className="py-12 text-center space-y-8">
                   <div className="relative w-32 h-32 mx-auto">
                      <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-doge border-t-transparent rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center text-doge font-bold text-2xl animate-pulse">
                         {step === 2 ? '1/3' : step === 3 ? '2/3' : '3/3'}
                      </div>
                   </div>
                   
                   <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white">
                         {step === 2 ? 'Confirming Transaction...' : step === 3 ? 'Waiting for Oracle...' : 'Minting $DC...'}
                      </h3>
                      <p className="text-sm text-gray-500">
                         {step === 2 ? 'Please wait for block confirmations.' : step === 3 ? 'Verifying deposit on Dogecoin network.' : 'Finalizing transfer on DogePump.'}
                      </p>
                   </div>

                   {txHash && (
                      <div className="bg-white/5 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono text-gray-400">
                         Tx: {txHash.slice(0, 10)}... <ExternalLink size={10} />
                      </div>
                   )}
                </div>
             )}

             {step === 5 && (
                <div className="py-12 text-center space-y-8">
                   <div className="w-32 h-32 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(34,197,94,0.3)]">
                      <Check size={64} />
                   </div>
                   <div className="space-y-2">
                      <h3 className="text-3xl font-bold text-white font-comic">Bridge Complete!</h3>
                      <p className="text-gray-400">Your $DC has been minted and sent to your wallet.</p>
                   </div>
                   <div className="flex flex-col gap-3">
                      <Link to="/profile">
                         <Button className="w-full rounded-xl">View Wallet</Button>
                      </Link>
                      <button onClick={() => { setStep(1); setAmount(''); }} className="text-sm text-gray-500 hover:text-white transition-colors">
                         Bridge More
                      </button>
                   </div>
                </div>
             )}
          </div>
       </div>
    </div>
  );
};

export default Bridge;
