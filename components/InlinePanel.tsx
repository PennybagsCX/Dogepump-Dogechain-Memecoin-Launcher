import React, { ReactNode } from 'react';
import { AlertTriangle, X, Info, CheckCircle, AlertCircle } from 'lucide-react';

export interface InlinePanelProps {
  type: 'warning' | 'critical' | 'info' | 'success';
  title: string;
  message?: string;
  isDismissable?: boolean;
  onDismiss?: () => void;
  children?: ReactNode;
  className?: string;
  showDetails?: boolean;
  detailsContent?: ReactNode;
}

const InlinePanel: React.FC<InlinePanelProps> = ({
  type,
  title,
  message,
  isDismissable = false,
  onDismiss,
  children,
  className = '',
  showDetails = false,
  detailsContent,
}) => {
  // Type styles
  const typeStyles = {
    warning: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      icon: 'text-yellow-400',
      iconBg: 'bg-yellow-500/20',
      Icon: AlertTriangle,
    },
    critical: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      icon: 'text-red-400',
      iconBg: 'bg-red-500/20',
      Icon: AlertCircle,
    },
    info: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      icon: 'text-blue-400',
      iconBg: 'bg-blue-500/20',
      Icon: Info,
    },
    success: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      icon: 'text-green-400',
      iconBg: 'bg-green-500/20',
      Icon: CheckCircle,
    },
  };

  const styles = typeStyles[type];
  const Icon = styles.Icon;

  return (
    <div className={`${styles.bg} ${styles.border} border rounded-2xl overflow-hidden ${className}`}>
      {/* Main Content */}
      <div className="flex items-start gap-4 p-4">
        {/* Icon */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${styles.iconBg} flex items-center justify-center`}>
          <Icon size={20} className={styles.icon} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-bold">{title}</h3>
            {isDismissable && onDismiss && (
              <button
                onClick={onDismiss}
                className="ml-auto flex-shrink-0 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                aria-label="Dismiss"
              >
                <X size={14} className="text-gray-400" />
              </button>
            )}
          </div>
          {message && (
            <p className="text-sm text-gray-300 mt-1">{message}</p>
          )}
          {children && (
            <div className="mt-3">
              {children}
            </div>
          )}
        </div>
      </div>

      {/* Details Section */}
      {showDetails && detailsContent && (
        <div className="border-t border-white/10 p-4 bg-black/20">
          {detailsContent}
        </div>
      )}
    </div>
  );
};

export default InlinePanel;
