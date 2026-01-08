import React from 'react';
import { ChevronDown } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  count?: number;
  icon?: LucideIcon;
  isExpanded: boolean;
  onToggle: () => void;
  theme?: 'purple' | 'blue' | 'green' | 'orange';
  className?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  count,
  icon: Icon,
  isExpanded,
  onToggle,
  theme = 'purple',
  className = '',
}) => {
  const themeColors = {
    purple: 'text-purple-400',
    blue: 'text-blue-400',
    green: 'text-green-400',
    orange: 'text-orange-400',
  };

  const bgColor = {
    purple: 'bg-purple-400/10',
    blue: 'bg-blue-400/10',
    green: 'bg-green-400/10',
    orange: 'bg-orange-400/10',
  };

  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/[0.08] border border-white/10 rounded-t-2xl transition-all ${className}`}
      aria-expanded={isExpanded}
      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${title}`}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`w-8 h-8 rounded-lg ${bgColor[theme]} flex items-center justify-center flex-shrink-0`}>
            <Icon size={18} className={themeColors[theme]} />
          </div>
        )}
        <h2 className="text-lg font-comic font-bold text-white">
          {title}
        </h2>
        {count !== undefined && (
          <span className="px-2 py-0.5 bg-white/10 border border-white/10 rounded-md">
            <span className="text-xs font-mono font-bold text-gray-400">{count}</span>
          </span>
        )}
      </div>
      <div
        className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center transition-transform duration-300 flex-shrink-0"
        style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
      >
        <ChevronDown size={16} className="text-gray-400" />
      </div>
    </button>
  );
};

export default SectionHeader;
