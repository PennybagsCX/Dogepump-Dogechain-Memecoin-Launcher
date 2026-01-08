/**
 * DogeTV Loading Skeleton
 *
 * Skeleton loader for the DogeTV page.
 * Provides visual feedback while data is loading.
 */

import React from 'react';
import { Activity } from 'lucide-react';

export const DogeTVSkeleton: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[200] bg-black text-white overflow-hidden flex flex-col font-sans" data-testid="doge-tv-skeleton">
       {/* TV Header Skeleton */}
       <div className="h-16 border-b border-white/10 bg-[#0A0A0A] flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-white/10 rounded-full animate-pulse" />
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500/30 rounded-full animate-pulse" />
                <div className="h-6 w-32 bg-white/10 rounded animate-pulse" />
             </div>
          </div>

          <div className="h-8 w-40 bg-white/10 rounded-full animate-pulse" />

          <div className="flex items-center gap-4">
             <div className="h-6 w-20 bg-white/5 rounded-full animate-pulse" />
             <div className="flex gap-2">
                <div className="w-8 h-8 bg-white/10 rounded-full animate-pulse" />
                <div className="w-8 h-8 bg-white/10 rounded-full animate-pulse" />
                <div className="w-8 h-8 bg-white/10 rounded-full animate-pulse" />
             </div>
          </div>
       </div>

       {/* Main Content Skeleton */}
       <div className="flex-1 flex overflow-hidden">
          {/* Left Section - Chart & Stats */}
          <div className="flex-1 flex flex-col border-r border-white/10 p-6 bg-black/50">
             {/* Token Name & Price */}
             <div className="mb-6">
                <div className="h-16 w-64 bg-white/10 rounded-lg mb-3 animate-pulse" />
                <div className="h-6 w-full max-w-2xl bg-white/5 rounded animate-pulse" />
             </div>

             {/* Chart Area */}
             <div className="flex-1 bg-[#050505] rounded-3xl border border-white/5 mb-6 relative overflow-hidden">
                <div className="absolute top-4 left-4 w-16 h-6 bg-white/10 rounded animate-pulse" />
                <div className="h-full flex items-center justify-center">
                   <Activity className="w-16 h-16 text-white/10 animate-pulse" />
                </div>
             </div>

             {/* Stats Grid */}
             <div className="grid grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                   <div key={i} className="bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                      <div className="h-4 w-24 bg-white/5 rounded mb-2 animate-pulse" />
                      <div className="h-8 w-32 bg-white/10 rounded animate-pulse" />
                   </div>
                ))}
             </div>
          </div>

          {/* Right Section - Info & Trades */}
          <div className="w-[400px] bg-[#080808] flex flex-col shrink-0 border-l border-white/10">
             {/* About Section */}
             <div className="h-1/2 p-6 border-b border-white/5">
                <div className="h-4 w-16 bg-white/5 rounded mb-4 animate-pulse" />
                <div className="h-48 w-full bg-white/5 rounded-2xl mb-4 animate-pulse" />
                <div className="space-y-2">
                   <div className="h-4 w-full bg-white/5 rounded animate-pulse" />
                   <div className="h-4 w-3/4 bg-white/5 rounded animate-pulse" />
                   <div className="h-4 w-1/2 bg-white/5 rounded animate-pulse" />
                </div>
             </div>

             {/* Live Trades Section */}
             <div className="h-1/2 flex flex-col">
                <div className="px-6 py-3 border-b border-white/5 bg-white/[0.02]">
                   <div className="h-4 w-24 bg-white/5 rounded animate-pulse" />
                </div>
                <div className="flex-1 p-2 space-y-1">
                   {[...Array(15)].map((_, i) => (
                      <div key={i} className="flex justify-between items-center p-2 rounded bg-white/[0.02]">
                         <div className="h-3 w-16 bg-white/5 rounded animate-pulse" />
                         <div className="h-3 w-12 bg-white/5 rounded animate-pulse" />
                         <div className="h-3 w-20 bg-white/5 rounded animate-pulse" />
                         <div className="h-3 w-24 bg-white/5 rounded animate-pulse" />
                      </div>
                   ))}
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

export default DogeTVSkeleton;
