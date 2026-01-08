import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
}

interface ToastContextType {
  addToast: (type: ToastType, message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string, title?: string) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev: Toast[]) => [...prev, { id, type, message, title }]);
    setTimeout(() => {
      setToasts((prev: Toast[]) => prev.filter((t: Toast) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev: Toast[]) => prev.filter((t: Toast) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-32 sm:bottom-28 md:bottom-24 lg:bottom-6 right-4 left-4 sm:left-auto sm:right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto min-w-0 max-w-full sm:min-w-[320px] sm:max-w-sm bg-[#0A0A0A]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] animate-slide-up flex gap-3 relative overflow-hidden group"
          >
            {/* Type Indicator Line */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
              toast.type === 'success' ? 'bg-[#00E054]' : 
              toast.type === 'error' ? 'bg-[#FF3B30]' : 'bg-[#D4AF37]'
            }`}></div>

            <div className={`mt-0.5 shrink-0 ${
               toast.type === 'success' ? 'text-[#00E054]' : 
               toast.type === 'error' ? 'text-[#FF3B30]' : 'text-[#D4AF37]'
            }`}>
              {toast.type === 'success' && <CheckCircle size={20} />}
              {toast.type === 'error' && <AlertTriangle size={20} />}
              {toast.type === 'info' && <Info size={20} />}
            </div>

            <div className="flex-1 min-w-0">
              {toast.title && <h4 className="text-white font-bold text-sm mb-1">{toast.title}</h4>}
              <p className="text-gray-400 text-xs leading-relaxed font-medium">{toast.message}</p>
            </div>

            <button 
              onClick={() => removeToast(toast.id)}
              className="text-gray-600 hover:text-white transition-colors self-start"
            >
              <X size={16} />
            </button>
            
            {/* Glow effect */}
            <div className={`absolute -right-10 -top-10 w-24 h-24 blur-[40px] opacity-20 rounded-full pointer-events-none ${
               toast.type === 'success' ? 'bg-[#00E054]' : 
               toast.type === 'error' ? 'bg-[#FF3B30]' : 'bg-[#D4AF37]'
            }`}></div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};