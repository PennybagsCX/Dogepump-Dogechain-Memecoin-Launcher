
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Search, Rocket, Coins, User, Trophy, ArrowRight, X } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { playSound } from '../services/audio';
import { Token } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { tokens } = useStore();

  // Filter items based on query
  const pages = [
    { type: 'page', label: 'Launch Coin', path: '/launch', icon: Rocket, desc: 'Deploy a new token' },
    { type: 'page', label: 'Leaderboard', path: '/leaderboard', icon: Trophy, desc: 'Top traders & creators' },
    { type: 'page', label: 'Profile', path: '/profile', icon: User, desc: 'Your assets & stats' },
    { type: 'page', label: 'Board', path: '/', icon: Coins, desc: 'Main token list' },
  ];

  const filteredTokens = tokens
    .filter((t: Token) => 
      t.name.toLowerCase().includes(query.toLowerCase()) || 
      t.ticker.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 5)
    .map((t: Token) => ({
      type: 'token',
      label: t.name,
      subLabel: `$${t.ticker}`,
      path: `/token/${t.id}`,
      icon: null as any, // We'll render image manually
      image: t.imageUrl,
      desc: `MC: $${t.marketCap.toLocaleString()}`
    }));

  const filteredPages = pages.filter(p => p.label.toLowerCase().includes(query.toLowerCase()));

  // Combine results
  const items = [...filteredPages, ...filteredTokens];

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent | PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Use capture phase to avoid being blocked by children calling stopPropagation
    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('touchstart', handleClickOutside, true);
    document.addEventListener('pointerdown', handleClickOutside, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
      document.removeEventListener('pointerdown', handleClickOutside, true);
    };
  }, [isOpen, onClose]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % items.length);
        playSound('hover');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + items.length) % items.length);
        playSound('hover');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (items[selectedIndex]) {
          handleSelect(items[selectedIndex].path);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, items, selectedIndex]);

  const handleSelect = (path: string) => {
    playSound('click');
    navigate(path);
    onClose();
    setQuery('');
  };

  if (!isOpen) return null;

  const stopPropagation = (e: any) => e.stopPropagation();

  return createPortal(
    <div className="fixed inset-0 z-[2000]">
      {/* Dedicated backdrop to capture all outside clicks */}
      <div
        className="absolute inset-0 z-0 bg-transparent"
        onMouseDown={onClose}
        onTouchStart={onClose}
        onPointerDown={onClose}
        aria-hidden="true"
      />

      {/* Content layer anchored below header */}
      <div
        className="relative z-10 flex justify-center px-3 md:px-6"
        style={{ paddingTop: 'calc(var(--header-height, 72px) + 8px)' }}
        aria-modal="true"
        role="dialog"
      >
        <div
          ref={containerRef}
          className="w-full max-w-4xl bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh] animate-slide-down pointer-events-auto"
          onMouseDown={stopPropagation}
          onTouchStart={stopPropagation}
          onPointerDown={stopPropagation}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-white/5">
            <Search className="text-gray-500 shrink-0" size={18} />
            <input
              ref={inputRef}
              id="command-palette-search"
              name="command-palette-search"
              type="text"
              className="flex-1 bg-transparent border-none outline-none text-base md:text-lg text-white placeholder:text-gray-600 font-medium focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:border-transparent"
              placeholder="Search tokens, pages, or commands..."
              value={query}
              onChange={(e: { target: HTMLInputElement }) => setQuery(e.target.value)}
            />
            <div className="hidden md:flex gap-1">
              <span className="text-[10px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-gray-500">ESC</span>
            </div>
            <button onClick={onClose} className="md:hidden text-gray-500">
              <X size={18} />
            </button>
          </div>

          {/* Results */}
          <div className="overflow-y-auto p-2 custom-scrollbar">
            {items.length === 0 ? (
              <div className="py-10 text-center text-gray-600 text-sm">
                <p>No results found.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {/* Group Label */}
                <div className="px-3 py-2 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                  Suggestions
                </div>

                {items.map((item, index) => (
                  <button
                    key={item.path + index}
                    onClick={() => handleSelect(item.path)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-colors ${
                      index === selectedIndex ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {item.type === 'token' ? (
                        <img src={item.image} alt={item.label} className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${index === selectedIndex ? 'bg-doge text-black' : 'bg-white/5 text-gray-400'}`}>
                          <item.icon size={16} />
                        </div>
                      )}

                      <div>
                        <div className={`text-sm font-bold ${index === selectedIndex ? 'text-white' : 'text-gray-300'}`}>
                          {item.label}
                          {item.subLabel && <span className="ml-2 text-xs font-mono opacity-60 text-gray-400">{item.subLabel}</span>}
                        </div>
                        <div className="text-xs text-gray-500">{item.desc}</div>
                      </div>
                    </div>

                    {index === selectedIndex && (
                      <ArrowRight size={16} className="text-doge animate-pulse" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-white/[0.02] border-t border-white/5 flex justify-between items-center text-[10px] text-gray-600">
            <div className="flex gap-4">
              <span><strong className="text-gray-400">↑↓</strong> to navigate</span>
              <span><strong className="text-gray-400">↵</strong> to select</span>
            </div>
            <div>DogeCommander v1.0</div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

