
import React, { useState } from 'react';
import { X, Flag, AlertTriangle, ShieldAlert, User, MessageSquare } from 'lucide-react';
import { Button } from './Button';
import { useToast } from './Toast';
import { playSound } from '../services/audio';
import { useStore } from '../contexts/StoreContext';
import { ModalPortal } from './ModalPortal';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenName?: string;
  commentId?: string;
  commentUser?: string;
  tokenId?: string;
  reportType?: 'token' | 'comment';
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  tokenName,
  commentId,
  commentUser,
  tokenId,
  reportType = 'token'
}) => {
  const { addToast } = useToast();
  const { reportComment, reportToken } = useStore();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reason) return;
    setIsSubmitting(true);
    playSound('click');

    try {
      if (reportType === 'comment' && commentId && tokenId) {
        await reportComment(commentId, tokenId, reason, description);
        addToast('success', 'Comment report submitted. Our moderators will review it.', 'Reported');
        playSound('success');
        onClose();
        setReason('');
        setDescription('');
      } else if (reportType === 'token' && tokenId) {
        await reportToken(tokenId, reason, description);
        addToast('success', 'Token report submitted. Our moderators will review it.', 'Flagged');
        playSound('success');
        onClose();
        setReason('');
        setDescription('');
      }
    } catch (error) {
      addToast('error', 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tokenReasons = [
    'scam',
    'harassment',
    'inappropriate',
    'spam',
    'other'
  ];

  const commentReasons = [
    'spam',
    'harassment',
    'inappropriate',
    'scam',
    'other'
  ];

  const commentReasonLabels = {
    spam: 'Spam',
    harassment: 'Harassment',
    inappropriate: 'Inappropriate Content',
    scam: 'Scam',
    other: 'Other'
  };

  const tokenReasonLabels = {
    scam: 'Rug Pull / Scam',
    harassment: 'Impersonation / Copycat',
    inappropriate: 'Hate Speech / Offensive',
    spam: 'Spam / Bot Activity',
    other: 'Other'
  };

  const reasons = reportType === 'comment' ? commentReasons : tokenReasons;

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
        <div className="relative bg-[#0A0A0A] border border-red-900/30 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-slide-up">
        
        <div className="flex justify-between items-center mb-6">
           <div className="flex items-center gap-3">
              <div className="bg-red-500/10 p-2 rounded-xl text-red-500">
                 {reportType === 'comment' ? <MessageSquare size={24} /> : <Flag size={24} />}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Report {reportType === 'comment' ? 'Comment' : 'Token'}
                </h2>
                {reportType === 'comment' && commentUser && (
                  <p className="text-xs text-gray-400">Comment by {commentUser}</p>
                )}
              </div>
           </div>
           <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white">
              <X size={20} />
           </button>
        </div>

        <p className="text-sm text-gray-400 mb-6">
           {reportType === 'comment'
             ? `Flagging this comment for review. False reports may lower your reputation score.`
             : `Flagging <span className="text-white font-bold">${tokenName}</span> for review. False reports may lower your reputation score.`
           }
        </p>

        <div className="space-y-3 mb-6">
           {reasons.map((r) => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center gap-3 ${
                   reason === r
                     ? 'bg-red-500/10 border-red-500 text-red-400'
                     : 'bg-white/[0.02] border-white/5 text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                 <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${reason === r ? 'border-red-500' : 'border-gray-600'}`}>
                    {reason === r && <div className="w-2 h-2 bg-red-500 rounded-full"></div>}
                 </div>
                 <span className="text-sm font-medium">
                   {reportType === 'comment' ? commentReasonLabels[r as keyof typeof commentReasonLabels] : tokenReasonLabels[r as keyof typeof tokenReasonLabels]}
                 </span>
              </button>
           ))}
        </div>

        {/* Additional details field for both token and comment reports */}
        <div className="space-y-2 mb-6">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
            Additional Details (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Please provide any additional context or details..."
            className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-red-500/50 outline-none transition-all placeholder:text-gray-800 resize-none"
            rows={3}
          />
        </div>

        <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3 flex items-start gap-3 mb-6">
           <ShieldAlert size={16} className="text-red-500 mt-0.5 shrink-0" />
           <p className="text-xs text-red-200/70 leading-relaxed">
              {reportType === 'comment'
                ? 'False reporting may result in account restrictions. Please only report comments that genuinely violate our community guidelines.'
                : 'Community safety is our priority. Tokens confirmed as scams will be flagged with a warning label immediately.'
              }
           </p>
        </div>

        <Button
           onClick={handleSubmit}
           disabled={!reason || isSubmitting}
           isLoading={isSubmitting}
           className="w-full bg-red-600 hover:bg-red-700 text-white border-0 shadow-lg shadow-red-900/20"
        >
           {isSubmitting ? 'Submitting...' : 'Submit Report'}
        </Button>

        </div>
      </div>
    </ModalPortal>
  );
};
