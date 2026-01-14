import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Token } from '../types';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useClickOutside } from '../hooks/useClickOutside';
import { Search, X } from 'lucide-react';

interface RewardDropdownProps {
  value: string;
  onChange: (id: string) => void;
  options: Token[];
  disabled?: boolean;
  className?: string;
}

export const RewardDropdown = React.memo<RewardDropdownProps>(({
  value,
  onChange,
  options,
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Refs
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Stable callback for option selection
  const handleSelectOption = useCallback((id: string) => {
    onChange(id);
    setIsOpen(false);
    setSearchQuery(''); // Reset search when option selected
  }, [onChange]);

  // Stable callback for toggle
  const handleToggle = useCallback(() => {
    if (!disabled) {
      setIsOpen(prev => !prev);
    }
  }, [disabled]);

  // Stable callback for close
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSearchQuery(''); // Reset search when dropdown closes
  }, []);

  // Memoize selected token
  const selectedToken = useMemo(
    () => options.find((t) => t.id === value),
    [options, value]
  );

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;
    const q = searchQuery.toLowerCase();
    return options.filter((token) =>
      token.name?.toLowerCase().includes(q) ||
      token.ticker?.toLowerCase().includes(q) ||
      token.contractAddress?.toLowerCase().includes(q)
    );
  }, [options, searchQuery]);

  // Lock body scroll when open
  useLockBodyScroll(isOpen);

  // Focus trap when open
  useFocusTrap(dropdownRef, isOpen, triggerRef);

  // Click outside detection
  useClickOutside([containerRef, dropdownRef], handleClose, isOpen);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          handleClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          // Focus first option
          const firstOption = dropdownRef.current?.querySelector('button') as HTMLElement;
          firstOption?.focus();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // Calculate dropdown position
  const dropdownPosition = useMemo(() => {
    if (!triggerRef.current || !isOpen) return null;

    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = Math.min(256, window.innerHeight - rect.bottom - 16);

    return {
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: rect.width,
      maxHeight: dropdownHeight
    };
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-busy={disabled}
        className="w-full rounded-xl bg-gradient-to-r from-[#0f0c1d] to-[#120f24] border border-white/10 px-4 py-3 pr-12 text-left text-white shadow-inner shadow-purple-900/10 focus:outline-none focus:ring-2 focus:ring-purple-500/70 focus:border-purple-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="text-sm font-medium">
          {selectedToken ? `${selectedToken.name} (${selectedToken.ticker})` : 'Select reward token'}
        </div>
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-purple-200/80" aria-hidden="true">
          ▼
        </span>
      </button>

      {/* Dropdown Menu (Portal) */}
      {isOpen && dropdownPosition && createPortal(
        <div
          ref={dropdownRef}
          role="listbox"
          aria-activedescendant={value}
          className="fixed z-50 rounded-xl border border-white/10 bg-[#0b0a12] shadow-2xl shadow-purple-900/30 backdrop-blur-xl overflow-hidden"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            maxHeight: dropdownPosition.maxHeight
          }}
        >
          {/* Search Input */}
          <div className="p-3 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tokens..."
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-8 text-sm text-white placeholder:text-gray-500 focus:border-doge/50 outline-none transition-colors"
                aria-label="Search reward tokens"
                onClick={(e) => e.stopPropagation()}
              />
              {searchQuery && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchQuery('');
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1"
                  aria-label="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto max-h-64 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="py-8 px-4 text-center text-sm text-gray-500">
                No tokens match your search
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  role="option"
                  aria-selected={opt.id === value}
                  onClick={() => handleSelectOption(opt.id)}
                  className={`w-full px-4 py-3 text-left text-sm text-white hover:bg-white/5 transition-colors focus:bg-white/5 focus:outline-none ${
                    opt.id === value ? 'bg-white/10 text-doge' : ''
                  }`}
                >
                  {opt.name} ({opt.ticker})
                </button>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
});

RewardDropdown.displayName = 'RewardDropdown';

export default RewardDropdown;
