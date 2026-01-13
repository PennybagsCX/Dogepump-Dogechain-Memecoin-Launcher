import React, { useCallback } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { playSound } from '../services/audio';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * ButtonGroupOption - Single option in a button group
 */
export interface ButtonGroupOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

/**
 * ButtonGroupProps - Props for the ButtonGroup component
 */
export interface ButtonGroupProps {
  /** Array of options to display as buttons */
  options: ButtonGroupOption[];
  /** Currently selected value */
  value: string;
  /** Callback when selection changes */
  onChange: (value: string) => void;
  /** Visual variant - affects styling behavior */
  variant?: 'default' | 'sort' | 'filter';
  /** Layout orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Disable entire group */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Show sort direction indicator (↑/↓) */
  showDirectionIndicator?: boolean;
  /** Current sort direction (for sort variant) */
  sortDirection?: 'asc' | 'desc';
  /** Callback when sort direction changes (for sort variant) */
  onSortDirectionChange?: (direction: 'asc' | 'desc') => void;
  /** Accessible label for the button group */
  ariaLabel?: string;
}

/**
 * ButtonGroup - A group of buttons for single selection with brand-consistent styling
 *
 * Follows the pattern established in DexUnifiedLiquidity.tsx (lines 262-296)
 *
 * @example
 * ```tsx
 * // Sort buttons with direction indicator
 * <ButtonGroup
 *   variant="sort"
 *   options={[
 *     { value: 'apy', label: 'APY' },
 *     { value: 'tvl', label: 'TVL' },
 *     { value: 'newest', label: 'Newest' }
 *   ]}
 *   value={sortBy}
 *   onChange={setSortBy}
 *   sortDirection={sortDirection}
 *   onSortDirectionChange={setSortDirection}
 *   showDirectionIndicator
 * />
 *
 * // Filter buttons
 * <ButtonGroup
 *   variant="filter"
 *   options={[
 *     { value: 'active', label: 'Active' },
 *     { value: 'all', label: 'All' },
 *     { value: 'paused', label: 'Paused' }
 *   ]}
 *   value={filterStatus}
 *   onChange={setFilterStatus}
 * />
 * ```
 */
export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  options,
  value,
  onChange,
  variant = 'default',
  orientation = 'horizontal',
  disabled = false,
  className,
  showDirectionIndicator = false,
  sortDirection = 'desc',
  onSortDirectionChange,
  ariaLabel,
}) => {
  // Handle button click
  const handleButtonClick = useCallback((optionValue: string, isDisabled: boolean) => {
    if (disabled || isDisabled) return;

    playSound('click');

    // Sort variant: toggle direction if clicking same button
    if (variant === 'sort' && optionValue === value && onSortDirectionChange) {
      onSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onChange(optionValue);
    }
  }, [disabled, variant, value, onChange, sortDirection, onSortDirectionChange]);

  const containerClasses = cn(
    'flex gap-2',
    orientation === 'vertical' ? 'flex-col' : 'flex-wrap',
    className
  );

  return (
    <div
      className={containerClasses}
      role="group"
      aria-label={ariaLabel || variant}
    >
      {options.map((option) => {
        const isActive = value === option.value;
        const isDisabled = disabled || option.disabled;

        const buttonClasses = cn(
          // Base styles
          'px-4 py-2 rounded-lg text-sm font-bold transition-all',
          'focus:outline-none focus:ring-2 focus:ring-doge/50',
          // Active state (from DexUnifiedLiquidity.tsx line 266)
          isActive
            ? 'bg-doge text-black shadow-lg shadow-doge/20'
            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10',
          // Disabled state
          isDisabled && 'opacity-50 cursor-not-allowed hover:bg-white/5 hover:text-gray-400'
        );

        const getDirectionIndicator = () => {
          if (!showDirectionIndicator || !isActive) return null;
          return sortDirection === 'asc' ? '↑' : '↓';
        };

        return (
          <button
            key={option.value}
            onClick={() => handleButtonClick(option.value, option.disabled || false)}
            className={buttonClasses}
            disabled={isDisabled}
            aria-pressed={isActive}
            aria-label={
              variant === 'sort' && isActive
                ? `${option.label} ${sortDirection === 'asc' ? 'ascending' : 'descending'}`
                : option.label
            }
          >
            {option.icon && <span className="mr-1">{option.icon}</span>}
            {option.label}
            {getDirectionIndicator()}
          </button>
        );
      })}
    </div>
  );
};

export default ButtonGroup;
