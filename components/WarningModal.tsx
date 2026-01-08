
import React from 'react';
import { X, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Button } from './Button';
import { ModalPortal } from './ModalPortal';

interface WarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
  notes?: string;
  warningCount?: number;
  maxWarnings?: number;
}

export const WarningModal: React.FC<WarningModalProps> = ({ isOpen, onClose, reason, notes, warningCount = 1, maxWarnings = 3 }) => {
  if (!isOpen) return null;

  const warningsRemaining = maxWarnings - warningCount;
  const isFinalWarning = warningsRemaining === 0;

  return (
    <ModalPortal>
      <div className="fixed inset-0 flex items-center justify-center p-4 z-[200]">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
        <div className="relative bg-[#0A0A0A] border border-yellow-500/30 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-slide-up">

          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <AlertTriangle size={24} className="text-yellow-500" />
              Account Warning
            </h2>
            <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4">
            {/* Warning Count Badge */}
            <div className="flex justify-center mb-4">
              <div className={`px-4 py-2 rounded-full text-sm font-bold ${
                isFinalWarning
                  ? 'bg-red-500/20 text-red-400 border-2 border-red-500/40'
                  : warningCount >= 2
                    ? 'bg-orange-500/20 text-orange-400 border-2 border-orange-500/40'
                    : 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/40'
              }`}>
                {isFinalWarning ? '⚠️ FINAL WARNING' : `Warning ${warningCount} of ${maxWarnings}`}
              </div>
            </div>

            {/* Warning Message */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle size={24} className="text-yellow-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-yellow-400 font-semibold mb-2">You Have Received a Warning</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Your account has received a warning from the DogePump moderation team. Please review the details below.
                </p>
              </div>
            </div>

            {/* Warning Reason */}
            {reason && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-1">
                  <strong>Warning Reason:</strong>
                </p>
                <p className="text-gray-200 text-sm">{reason}</p>
              </div>
            )}

            {/* Admin Notes */}
            {notes && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-1">
                  <strong>Additional Notes:</strong>
                </p>
                <p className="text-gray-200 text-sm">{notes}</p>
              </div>
            )}

            {/* 3-Strike Rule Notice */}
            <div className={`${isFinalWarning ? 'bg-red-500/10 border-red-500/30' : 'bg-blue-500/10 border-blue-500/20'} border rounded-xl p-4`}>
              <div className="flex items-start gap-3">
                <Info size={20} className={isFinalWarning ? 'text-red-400 flex-shrink-0 mt-0.5' : 'text-blue-400 flex-shrink-0 mt-0.5'} />
                <div>
                  <h4 className={isFinalWarning ? 'text-red-400 font-semibold mb-1' : 'text-blue-400 font-semibold mb-1'}>
                    {isFinalWarning ? 'Final Warning - Action Will Be Taken' : '3-Strike Policy'}
                  </h4>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {isFinalWarning
                      ? 'This is your final warning. Any further violations will result in immediate account suspension or token delisting.'
                      : `You currently have ${warningCount} active warning${warningCount > 1 ? 's' : ''} out of ${maxWarnings}. After ${maxWarnings} warnings, your account may be banned or your tokens may be delisted.`
                    }
                  </p>
                  {warningsRemaining > 0 && (
                    <p className="text-gray-400 text-xs mt-2">
                      {warningsRemaining} warning{warningsRemaining > 1 ? 's' : ''} remaining before penalties are applied.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Community Guidelines Notice */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-gray-400 text-sm">
                <strong>Please Follow Community Guidelines</strong>
              </p>
              <p className="text-gray-300 text-xs mt-1 leading-relaxed">
                Continued violations may result in account restrictions or temporary bans. Please ensure your comments and actions comply with our community standards.
              </p>
            </div>
          </div>

          {/* Acknowledge Button */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <Button
              onClick={onClose}
              className={`w-full ${isFinalWarning ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'} text-white`}
            >
              <CheckCircle size={16} className="mr-2" />
              I Acknowledge This Warning
            </Button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
