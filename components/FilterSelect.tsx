import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { useClickOutside } from '../hooks/useClickOutside';

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

type FilterSelectComponent = React.FC<FilterSelectProps> & { displayName?: string };

const baseTriggerClasses =
  'w-full rounded-xl bg-[#0b0a12] border border-white/10 px-3 py-2 text-left text-sm text-white shadow-inner shadow-purple-900/10 focus:outline-none focus:ring-2 focus:ring-purple-500/60 focus:border-purple-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between gap-2';

const baseDropdownClasses =
  'fixed z-50 rounded-xl border border-white/10 bg-[#0b0a12] shadow-2xl shadow-purple-900/30 backdrop-blur-xl overflow-hidden';

const baseOptionClasses =
  'w-full px-4 py-3 text-left text-sm text-white hover:bg-white/5 transition-colors focus:bg-white/5 focus:outline-none';

export const FilterSelect: FilterSelectComponent = ({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
  ariaLabel
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLabel = useMemo(() => options.find((opt) => opt.value === value)?.label, [options, value]);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    if (!disabled) {
      setIsOpen((prev) => !prev);
    }
  }, [disabled]);

  useClickOutside([containerRef, dropdownRef], close, isOpen);

  // Position calculation for portal dropdown
  useEffect(() => {
    if (!isOpen) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const margin = 8;
      const maxHeight = Math.min(320, window.innerHeight - rect.bottom - margin);

      setPosition({
        top: rect.bottom + window.scrollY + margin,
        left: rect.left + window.scrollX,
        width: rect.width,
        maxHeight: Math.max(180, maxHeight)
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  // Keyboard support
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  const handleSelect = useCallback(
    (next: string) => {
      onChange(next);
      close();
    },
    [close, onChange]
  );

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || placeholder}
        className={baseTriggerClasses}
      >
        <span className="truncate">{selectedLabel || placeholder}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && position &&
        createPortal(
          <div
            ref={dropdownRef}
            role="listbox"
            aria-activedescendant={value}
            className={baseDropdownClasses}
            style={{
              top: position.top,
              left: position.left,
              width: position.width,
              maxHeight: position.maxHeight
            }}
          >
            <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: position.maxHeight }}>
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={opt.value === value}
                  onClick={() => handleSelect(opt.value)}
                  className={`${baseOptionClasses} ${opt.value === value ? 'bg-white/10 text-doge' : ''}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

FilterSelect.displayName = 'FilterSelect';

export default FilterSelect;
