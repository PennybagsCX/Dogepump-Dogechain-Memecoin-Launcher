import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';
import { ModalPortal } from './ModalPortal';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning'
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: 'text-red-500',
      iconBg: 'bg-red-500/10',
      button: 'bg-red-600 hover:bg-red-700 text-white'
    },
    warning: {
      icon: 'text-doge',
      iconBg: 'bg-doge/10',
      button: 'bg-doge hover:bg-doge/90 text-black'
    },
    info: {
      icon: 'text-blue-500',
      iconBg: 'bg-blue-500/10',
      button: 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  };

  const styles = variantStyles[variant];

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
        <div className="relative bg-[#0A0A0A] border border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-slide-up">

          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${styles.iconBg}`}>
                <AlertTriangle size={24} className={styles.icon} />
              </div>
              <h2 className="text-xl font-bold text-white font-comic">
                {title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <p className="text-gray-300 mb-6 leading-relaxed">
            {message}
          </p>

          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="secondary"
              className="flex-1 rounded-xl"
            >
              {cancelText}
            </Button>
            <Button
              onClick={handleConfirm}
              className={`flex-1 rounded-xl ${styles.button}`}
            >
              {confirmText}
            </Button>
          </div>

        </div>
      </div>
    </ModalPortal>
  );
};
