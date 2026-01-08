
import React from 'react';
import { Loader2 } from 'lucide-react';
import { DogIcon } from './DogIcon';

export const PageLoader: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
       <div className="relative">
          <div className="w-16 h-16 border-4 border-white/10 border-t-doge rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center animate-bounce-subtle">
             <DogIcon size={24} className="text-doge" />
          </div>
       </div>
       <p className="mt-4 text-sm text-gray-500 font-mono animate-pulse">Fetching blocks...</p>
    </div>
  );
};
