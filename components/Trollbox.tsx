
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Minus, Zap, SmilePlus, Send, Ban, Mail, AlertTriangle, Flag, X, ExternalLink } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { Link } from 'react-router-dom';
import { playSound } from '../services/audio';
import { StickerPicker } from './StickerPicker';
import * as reportsApi from '../services/reportsApi';
import backendService from '../services/backendService';

const USERNAMES = [
  "MoonBoi99", "DogeWhisperer", "DiamondHands", "WagmiWarrior", "PepeFrog", 
  "ShibaSlayer", "ElonMuskOdor", "CryptoKing", "AlphaSeeker", "BasedDev",
  "ChartGazer", "FudBuster", "GemHunter", "YoloSwaggins"
];

const MESSAGES = [
  "LFG {token} 🚀",
  "Just ape'd into {token}",
  "Is {token} safu?",
  "Wen Binance?",
  "{token} to the moon!",
  "Dev is based on {token}",
  "Chart looks bullish on {token}",
  "Floor is holding strong for {token}",
  "Anyone watching {token}?",
  "Send {token} higher!",
  "Just bought the dip on {token}",
  "Jeets getting rekt on {token} lol",
  "Only up from here fam"
];

interface Message {
  id: string;
  user: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
  imageUrl?: string;
  isAi?: boolean;
  sourceUrl?: string;
}

export const Trollbox: React.FC = () => {
  const { tokens, userProfile, settings, marketEvent, bannedUsers, warnedUsers, addNotification, userAddress, addReport } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'init', user: 'System', text: 'Welcome to the Trollbox! Be nice or get rekt.', timestamp: Date.now(), isSystem: true }
  ]);
  const [inputValue, setInputValue] = useState('');
  // Track messages sent by the current user
  const [myMessageIds, setMyMessageIds] = useState<Set<string>>(new Set());
  const [hasUnread, setHasUnread] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });

  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [messageToReport, setMessageToReport] = useState<Message | null>(null);
  const [reportReason, setReportReason] = useState<'spam' | 'harassment' | 'inappropriate' | 'scam' | 'other'>('spam');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setHasUnread(false);
    }
  }, [messages, isOpen]);

  // Market Event Hype Man
  useEffect(() => {
     if (marketEvent && marketEvent.active) {
        const newMessage: Message = {
           id: Date.now().toString(),
           user: '🤖 HypeBot',
           text: `🚨 ${marketEvent.title.toUpperCase()}! ${marketEvent.description}`,
           timestamp: Date.now(),
           isSystem: true,
           sourceUrl: marketEvent.sourceUrl
        };
        setMessages(prev => [...prev, newMessage]);
        if (!isOpen) setHasUnread(true);
     }
  }, [marketEvent]);

  // Simulation Loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7 && tokens.length > 0) {
        const token = tokens[Math.floor(Math.random() * tokens.length)];
        const template = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
        const text = template.replace("{token}", `$${token.ticker}`);
        const user = USERNAMES[Math.floor(Math.random() * USERNAMES.length)];
        
        const newMessage: Message = {
          id: Date.now().toString() + Math.random(),
          user,
          text,
          timestamp: Date.now()
        };

        setMessages(prev => [...prev, newMessage].slice(-50)); // Keep last 50
        
        if (!isOpen && settings.audioEnabled) {
           setHasUnread(true);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [tokens, isOpen, settings.audioEnabled]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;

    // Debug logging
    console.log('[Trollbox] User sending message:', {
      userAddress,
      profileUsername: userProfile.username,
      currentUser: userAddress || userProfile.username || 'Me'
    });
    console.log('[Trollbox] Warned users:', warnedUsers);
    console.log('[Trollbox] Banned users:', bannedUsers);

    // Check if user is banned (by address or username)
    const currentUserAddress = userAddress || userProfile.username || 'Me';
    const bannedUserRecord = bannedUsers.find(b =>
      b.address.toLowerCase() === currentUserAddress.toLowerCase() ||
      b.address.toLowerCase() === (userProfile.username || '').toLowerCase()
    );

    if (bannedUserRecord) {
      // Create a detailed ban notice message in the chat
      const banNoticeMessage: Message = {
        id: Date.now().toString(),
        user: 'System',
        text: `ACCOUNT BANNED: ${bannedUserRecord.reason}${bannedUserRecord.notes ? ` | ${bannedUserRecord.notes}` : ''} | Appeal: @dogepump (X) or t.me/dogepump`,
        timestamp: Date.now(),
        isSystem: true
      };

      setMessages(prev => [...prev, banNoticeMessage]);
      setInputValue('');
      return;
    }

    // Check if current user (by address or username) has active warnings
    const activeWarnings = warnedUsers.filter(w => {
      if (!w.isActive) return false;

      // Match by userAddress (for demo mode)
      if (userAddress && w.address.toLowerCase() === userAddress.toLowerCase()) {
        return true;
      }

      // Match by profile username
      if (userProfile.username && w.address.toLowerCase() === userProfile.username.toLowerCase()) {
        return true;
      }

      // Match by display name (for backwards compatibility with existing warnings)
      if (w.address.toLowerCase() === currentUserAddress.toLowerCase()) {
        return true;
      }

      return false;
    });

    console.log('[Trollbox] Active warnings found:', activeWarnings.length, activeWarnings);

    if (activeWarnings.length > 0) {
      const warningCount = activeWarnings.length;
      const warningMessage: Message = {
        id: Date.now().toString(),
        user: 'System',
        text: `⚠️ WARNING: You have ${warningCount} active warning${warningCount > 1 ? 's' : ''} on your account. Continued violations may result in a ban. Please review the community guidelines.`,
        timestamp: Date.now(),
        isSystem: true
      };

      setMessages(prev => [...prev, warningMessage]);
      // Don't return - let the message through but with warning
    }

    const userText = inputValue;
    const messageId = Date.now().toString();
    const newMessage: Message = {
      id: messageId,
      user: userProfile.username || 'Me',
      text: userText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newMessage]);
    setMyMessageIds(prev => new Set([...prev, messageId])); // Track this message as sent by current user
    setInputValue('');
    playSound('click');
  };

  const handleStickerSelect = (url: string, type: 'emoji' | 'sticker') => {
     // Check if user is banned
     const currentUserAddress = userAddress || userProfile.username || 'Me';
     const bannedUserRecord = bannedUsers.find(b =>
       b.address.toLowerCase() === currentUserAddress.toLowerCase() ||
       b.address.toLowerCase() === (userProfile.username || '').toLowerCase()
     );

     if (type === 'emoji') {
       // Insert emoji into the input field
       setInputValue(prev => prev + url);
     } else {
       // Check if banned before sending sticker
       if (bannedUserRecord) {
         // Create a detailed ban notice message in the chat
         const banNoticeMessage: Message = {
           id: Date.now().toString(),
           user: 'System',
           text: `ACCOUNT BANNED: ${bannedUserRecord.reason}${bannedUserRecord.notes ? ` | ${bannedUserRecord.notes}` : ''} | Appeal: @dogepump (X) or t.me/dogepump`,
           timestamp: Date.now(),
           isSystem: true
         };

         setMessages(prev => [...prev, banNoticeMessage]);
         setShowStickerPicker(false);
         return;
       }

       // Check if user has active warnings before sending sticker
       const activeWarnings = warnedUsers.filter(w => {
         if (!w.isActive) return false;

         // Match by userAddress (for demo mode)
         if (userAddress && w.address.toLowerCase() === userAddress.toLowerCase()) {
           return true;
         }

         // Match by profile username
         if (userProfile.username && w.address.toLowerCase() === userProfile.username.toLowerCase()) {
           return true;
         }

         // Match by display name (for backwards compatibility with existing warnings)
         if (w.address.toLowerCase() === currentUserAddress.toLowerCase()) {
           return true;
         }

         return false;
       });

       if (activeWarnings.length > 0) {
         const warningCount = activeWarnings.length;
         const warningMessage: Message = {
           id: Date.now().toString(),
           user: 'System',
           text: `⚠️ WARNING: You have ${warningCount} active warning${warningCount > 1 ? 's' : ''} on your account. Continued violations may result in a ban. Please review the community guidelines.`,
           timestamp: Date.now(),
           isSystem: true
         };

         setMessages(prev => [...prev, warningMessage]);
         // Don't return - let the sticker through but with warning
       }

       // Create sticker message
       const messageId = Date.now().toString();
       const newMessage: Message = {
          id: messageId,
          user: userProfile.username || 'Me',
          text: '',
          imageUrl: url,
          timestamp: Date.now()
       };
       setMessages(prev => [...prev, newMessage]);
       setMyMessageIds(prev => new Set([...prev, messageId])); // Track this message as sent by current user
     }
     setShowStickerPicker(false);
     playSound('success');
  };

  const handleToggleStickerPicker = () => {
     if (!showStickerPicker && emojiButtonRef.current) {
       const rect = emojiButtonRef.current.getBoundingClientRect();
       setPickerPosition({
         top: rect.top - 320, // Position above button (picker is ~320px tall)
         left: rect.left + rect.width / 2 - 160 // Center horizontally (picker is 320px wide)
       });
     }
     setShowStickerPicker(!showStickerPicker);
     playSound('click');
  };

  const handleReportMessage = (message: Message) => {
    console.log('[Trollbox] Report button clicked for message:', message.id);

    // For demo purposes, just check if userAddress exists (no full auth required)
    // This allows the trollbox reporting to work in demo mode
    if (!userAddress && !backendService.isAuthenticated()) {
      console.log('[Trollbox] User not authenticated, showing warning');
      addNotification({
        type: 'warning',
        title: 'Authentication Required',
        message: 'Please connect your wallet to report messages',
        duration: 3000
      });
      playSound('error');
      return;
    }

    console.log('[Trollbox] Opening report modal for message:', message.id);
    setMessageToReport(message);
    setReportReason('spam');
    setReportDescription('');
    setShowReportModal(true);
    playSound('click');
  };

  const handleSubmitReport = async () => {
    if (!messageToReport) return;

    // Double-check authentication before submitting
    if (!userAddress && !backendService.isAuthenticated()) {
      addNotification({
        type: 'error',
        title: 'Authentication Required',
        message: 'Please connect your wallet to submit reports',
        duration: 3000
      });
      setShowReportModal(false);
      playSound('error');
      return;
    }

    setIsSubmittingReport(true);

    try {
      // Include full message content in description since Trollbox messages aren't in the database
      const messageContent = messageToReport.imageUrl
        ? `[Image/Sticker: ${messageToReport.imageUrl}]`
        : messageToReport.text;

      const fullDescription = reportDescription
        ? `${reportDescription}\n\n---\nMessage from ${messageToReport.user} at ${new Date(messageToReport.timestamp).toLocaleString()}:\n${messageContent}`
        : `Message from ${messageToReport.user} at ${new Date(messageToReport.timestamp).toLocaleString()}:\n${messageContent}`;

      console.log('[Trollbox] Submitting report:', {
        type: 'trollbox',
        messageId: messageToReport.id,
        reason: reportReason
      });

      // For trollbox reports, we need to use the actual user's identity if this message
      // was sent by the current user, otherwise use the display username
      const actualReportedUser = myMessageIds.has(messageToReport.id)
        ? (userAddress || userProfile.username || 'Me')
        : messageToReport.user;

      console.log('[Trollbox] Reported user:', {
        messageId: messageToReport.id,
        displayUsername: messageToReport.user,
        isMyMessage: myMessageIds.has(messageToReport.id),
        actualReportedUser
      });

      // Add to reports via StoreContext (which properly maps trollbox -> user and handles undefined fields)
      await addReport(
        'trollbox',
        messageToReport.id,
        actualReportedUser,
        reportReason,
        fullDescription
      );

      // Check if reporter is an admin - if so, link to admin dashboard
      const isAdmin = userAddress && userAddress.toLowerCase() === '0x22f4194f6706e70abaa14ab352d0baa6c7ced24a';
      const notificationLink = isAdmin ? `/admin#comment-reports` : `/`;

      addNotification({
        type: 'success',
        title: 'Report Submitted',
        message: 'Thank you for helping keep the community safe!',
        link: notificationLink,
        duration: 3000
      });

      setShowReportModal(false);
      setMessageToReport(null);
      playSound('success');
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Report Failed',
        message: error instanceof Error ? error.message : 'Failed to submit report',
        duration: 5000
      });
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const formatMessage = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\$[A-Z0-9]{2,8})/g);
    return parts.map((part, i) => {
      if (part.startsWith('$')) {
        const ticker = part.slice(1);
        const token = tokens.find(t => t.ticker === ticker);
        if (token) {
          return (
            <Link 
              key={i} 
              to={`/token/${token.id}`} 
              className="text-doge hover:underline font-bold"
              onClick={(e) => e.stopPropagation()} 
            >
              {part}
            </Link>
          );
        }
      }
      return part;
    });
  };

  return (
    <>
      {/* Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => { setIsOpen(true); playSound('click'); }}
          className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-40 bg-doge text-black p-4 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:scale-110 transition-transform group"
        >
          <MessageSquare size={24} className="group-hover:rotate-12 transition-transform" />
          {hasUnread && (
            <span className="absolute top-0 right-0 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      <div 
        className={`fixed z-[100] transition-all duration-300 ease-in-out flex flex-col bg-[#0A0A0A] border border-white/10 shadow-2xl overflow-hidden
          ${isOpen 
            ? 'bottom-0 right-0 w-full h-[60vh] md:bottom-6 md:right-6 md:w-96 md:h-[500px] md:rounded-2xl opacity-100 scale-100' 
            : 'bottom-6 right-6 w-0 h-0 opacity-0 scale-90 pointer-events-none'
          }
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-white/[0.05] border-b border-white/5 backdrop-blur-md">
           <div className="flex items-center gap-2">
              <div className="bg-doge/20 p-1.5 rounded-lg text-doge">
                 <MessageSquare size={16} />
              </div>
              <span className="font-bold text-white font-comic">Trollbox</span>
              <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                 <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> {Math.floor(Math.random() * 500) + 1000} Online
              </span>
           </div>
           <div className="flex items-center gap-1">
              <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                 <Minus size={16} />
              </button>
           </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-black/40">
           {messages.map((msg) => {
              const isBanNotice = msg.isSystem && msg.text.includes('ACCOUNT BANNED');
              return (
              <div key={msg.id} className={`flex flex-col ${msg.isSystem ? 'items-center my-2' : 'items-start'}`}>
                 {msg.isSystem ? (
                    <span className={`text-[10px] px-3 py-2 rounded-lg uppercase font-bold tracking-wider border flex flex-col items-center gap-2 max-w-[90%] text-center break-words ${
                      isBanNotice
                        ? 'bg-red-500/10 text-red-400 border-red-500/30 text-[11px]'
                        : 'text-gray-500 bg-white/5 border-white/5'
                    }`}>
                        <div className="flex items-center gap-2">
                          {isBanNotice && <Ban size={12} className="text-red-400 flex-shrink-0"/>}
                          {msg.text.includes('🚨') && !isBanNotice && <Zap size={10} className="text-yellow-400"/>}
                          <span>{msg.text}</span>
                        </div>
                        {msg.sourceUrl && !isBanNotice && (
                          <a
                            href={msg.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[9px] text-doge hover:underline flex items-center gap-1 mt-1"
                          >
                            <ExternalLink size={10} />
                            Read More
                          </a>
                        )}
                    </span>
                 ) : (
                    <div className="max-w-[90%]">
                       <div className="flex items-baseline gap-2 mb-0.5">
                          <span className={`text-xs font-bold ${msg.user === (userProfile.username || 'Me') ? 'text-green-400' : 'text-gray-400'}`}>
                             {msg.user}
                          </span>
                          <span className="text-[9px] text-gray-600">{new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                          <button
                            onClick={() => handleReportMessage(msg)}
                            className="ml-2 p-1 opacity-40 hover:opacity-100 hover:bg-white/10 rounded transition-all"
                            title="Report message"
                          >
                            <Flag size={12} className="text-gray-500 hover:text-red-400" />
                          </button>
                       </div>
                       <div className={`text-sm break-words leading-snug text-gray-200`}>
                          {formatMessage(msg.text)}
                          {msg.imageUrl && (
                             <img src={msg.imageUrl} alt="Sticker" className="max-w-[120px] mt-1 rounded-lg" />
                          )}
                       </div>
                    </div>
                 )}
              </div>
              );
           })}
           <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-3 bg-white/[0.02] border-t border-white/5 flex gap-2 relative z-20">
           <div className="relative">
              <button
                ref={emojiButtonRef}
                type="button"
                onClick={handleToggleStickerPicker}
                className={`p-2 rounded-xl transition-colors ${showStickerPicker ? 'bg-doge text-black' : 'bg-white/5 text-gray-400 hover:text-white'}`}
              >
                 <SmilePlus size={18} />
              </button>
              {showStickerPicker && (
                  <StickerPicker
                      isOpen={true}
                      onClose={() => setShowStickerPicker(false)}
                      onSelect={handleStickerSelect}
                      position={pickerPosition}
                  />
              )}
           </div>
           <input
             id="trollbox-message-input"
             name="trollbox-message-input"
             type="text"
             value={inputValue}
             onChange={(e) => setInputValue(e.target.value)}
             placeholder="Type a message..."
             className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-doge/50 outline-none transition-colors"
           />
           <button 
             type="submit" 
             disabled={!inputValue.trim()}
             className="bg-doge hover:bg-doge-light text-black p-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
           >
              <Send size={18} />
           </button>
        </form>
      </div>

      {/* Report Modal - rendered outside trollbox to avoid overflow clipping */}
      {showReportModal && messageToReport && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flag size={20} className="text-red-400" />
                <h3 className="text-lg font-bold text-white">Report Message</h3>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Message Preview */}
            <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-xs font-bold text-gray-400">{messageToReport.user}</span>
                <span className="text-[9px] text-gray-600">
                  {new Date(messageToReport.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                </span>
              </div>
              <p className="text-sm text-gray-300 break-words">
                {messageToReport.text || <img src={messageToReport.imageUrl} alt="Sticker" className="max-w-[100px] rounded" />}
              </p>
            </div>

            {/* Report Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Reason</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value as any)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-doge/50 outline-none"
                >
                  <option value="spam">Spam</option>
                  <option value="harassment">Harassment</option>
                  <option value="inappropriate">Inappropriate Content</option>
                  <option value="scam">Scam</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description (Optional)</label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Provide additional details..."
                  rows={3}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-doge/50 outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowReportModal(false)}
                  disabled={isSubmittingReport}
                  className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReport}
                  disabled={isSubmittingReport}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmittingReport ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Flag size={16} />
                      Submit Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
