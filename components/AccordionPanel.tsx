import React, { ReactNode, ComponentType } from 'react';
import { ChevronDown, ChevronUp, LucideIcon } from 'lucide-react';

export interface AccordionPanelProps {
  // Header props
  title: string;
  subtitle?: string;
  icon?: LucideIcon | ComponentType<{ size?: number; className?: string }>;
  iconColor?: string;
  badge?: string | ReactNode;
  isExpanded: boolean;
  onToggle: () => void;

  // Content props
  children: ReactNode;

  // Style props
  variant?: 'default' | 'warning' | 'critical' | 'success' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

const AccordionPanel: React.FC<AccordionPanelProps> = ({
  title,
  subtitle,
  icon: Icon,
  iconColor = 'text-doge',
  badge,
  isExpanded,
  onToggle,
  children,
  variant = 'default',
  size = 'md',
  className = '',
  disabled = false,
}) => {
  // Variant styles
  const variantStyles = {
    default: 'border border-white/10',
    warning: 'border border-yellow-500/30',
    critical: 'border border-red-500/30',
    success: 'border border-green-500/30',
    info: 'border border-blue-500/30',
  };

  // Size styles
  const sizeStyles = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const contentSizeStyles = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div className={`rounded-2xl overflow-hidden ${variantStyles[variant]} ${className}`}>
      {/* Header */}
      <button
        onClick={disabled ? undefined : onToggle}
        disabled={disabled}
        aria-expanded={isExpanded}
        aria-controls="accordion-content"
        id="accordion-header"
        className={`w-full flex items-center justify-between ${sizeStyles[size]} hover:bg-white/5 transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        <div className="flex items-center gap-3 flex-1">
          {Icon && (
            <div className={`flex-shrink-0 ${iconColor}`}>
              <Icon size={size === 'sm' ? 18 : size === 'lg' ? 24 : 20} />
            </div>
          )}
          <div className="text-left flex-1">
            <div className="text-white font-bold">{title}</div>
            {subtitle && (
              <div className="text-sm text-gray-400">{subtitle}</div>
            )}
          </div>
          {badge && (
            <div className="flex-shrink-0">
              {typeof badge === 'string' ? (
                <span className="px-2 py-1 bg-doge/20 text-doge text-xs font-bold rounded-lg">
                  {badge}
                </span>
              ) : (
                badge
              )}
            </div>
          )}
        </div>
        <div className={`transform transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}>
          {isExpanded ? (
            <ChevronUp size={size === 'sm' ? 18 : size === 'lg' ? 24 : 20} className="text-gray-400" />
          ) : (
            <ChevronDown size={size === 'sm' ? 18 : size === 'lg' ? 24 : 20} className="text-gray-400" />
          )}
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div
          id="accordion-content"
          role="region"
          aria-labelledby="accordion-header"
          className={`border-t border-white/10 ${contentSizeStyles[size]} animate-fade-in`}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default AccordionPanel;
