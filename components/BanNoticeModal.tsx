
import React from 'react';
import { X, Ban, Mail, AlertTriangle, Send } from 'lucide-react';
import { Button } from './Button';
import { ModalPortal } from './ModalPortal';

interface BanNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  banReason?: string;
}

export const BanNoticeModal: React.FC<BanNoticeModalProps> = ({ isOpen, onClose, banReason }) => {
  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 flex items-center justify-center p-4 z-[200]">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
        <div className="relative bg-[#0A0A0A] border border-red-500/30 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-slide-up">

          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Ban size={24} className="text-red-500" />
              Account Restricted
            </h2>
            <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4">
            {/* Warning Icon */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle size={24} className="text-red-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-red-400 font-semibold mb-2">Action Blocked</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Your account has been restricted from performing this action on the DogePump platform.
                </p>
              </div>
            </div>

            {/* Ban Reason */}
            {banReason && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-1">
                  <strong>Reason:</strong>
                </p>
                <p className="text-gray-200 text-sm">{banReason}</p>
              </div>
            )}

            {/* Appeal Instructions */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Mail size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-blue-400 font-semibold mb-1">Appeal This Decision</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    If you believe this restriction is an error or would like to appeal this decision, please contact our support team.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <a
                      href="https://x.com/dogepump"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg text-gray-300 hover:text-white transition-colors"
                    >
                      <X size={14} />
                      @dogepump
                    </a>
                    <a
                      href="https://t.me/dogepump"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg text-gray-300 hover:text-white transition-colors"
                    >
                      <Send size={14} />
                      Telegram
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <Button
              onClick={onClose}
              className="w-full bg-white/5 hover:bg-white/10 text-white"
            >
              I Understand
            </Button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
