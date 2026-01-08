
import React from 'react';
import { X, Command, Keyboard } from 'lucide-react';
import { ModalPortal } from './ModalPortal';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    {
      category: 'General',
      items: [
        { label: 'Command Palette', keys: ['⌘', 'K'] },
        { label: 'Close Modal', keys: ['Esc'] },
      ]
    },
    {
      category: 'Trading',
      items: [
        { label: 'Set Buy Mode', keys: ['B'] },
        { label: 'Set Sell Mode', keys: ['S'] },
      ]
    },
    {
      category: 'Navigation',
      items: [
        { label: 'Scroll Lists', keys: ['↑', '↓'] },
        { label: 'Select Item', keys: ['↵'] },
      ]
    }
  ];

  return (
    <ModalPortal>
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
        <div className="relative bg-[#0A0A0A] border border-white/10 rounded-3xl max-w-lg w-full p-8 shadow-2xl animate-slide-up">
        
        <div className="flex justify-between items-center mb-8">
           <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-xl text-white">
                 <Keyboard size={24} />
              </div>
              <h2 className="text-2xl font-bold text-white font-comic">Keyboard Shortcuts</h2>
           </div>
           <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white">
              <X size={20} />
           </button>
        </div>

        <div className="space-y-8">
           {shortcuts.map((group) => (
              <div key={group.category}>
                 <h3 className="text-xs font-bold text-doge uppercase tracking-widest mb-4 border-b border-white/5 pb-2">{group.category}</h3>
                 <div className="space-y-3">
                    {group.items.map((item, idx) => (
                       <div key={idx} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-300">{item.label}</span>
                          <div className="flex gap-2">
                             {item.keys.map((key, k) => (
                                <kbd key={k} className="min-w-[2rem] h-8 flex items-center justify-center px-2 rounded-lg bg-[#1a1a1a] border-b-2 border-white/20 text-gray-300 font-mono text-xs font-bold shadow-sm">
                                   {key}
                                </kbd>
                             ))}
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           ))}
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 text-center text-xs text-gray-500">
           Pro Tip: Use <kbd className="px-1.5 py-0.5 rounded bg-white/5 border-white/10 border-b mx-1">Tab</kbd> to navigate form fields quickly.
        </div>

        </div>
      </div>
    </ModalPortal>
  );
};
