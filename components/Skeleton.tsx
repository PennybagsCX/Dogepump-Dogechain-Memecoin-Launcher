import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-white/5", className)}
      {...props}
    />
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="flex flex-col h-[400px] rounded-[1.4rem] border border-white/5 bg-[#0A0A0A] overflow-hidden">
    <div className="p-6 flex gap-5">
      <Skeleton className="w-20 h-20 rounded-2xl" />
      <div className="flex-1 py-1 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
    <div className="px-6 space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
    <div className="mt-auto p-6 space-y-4">
       <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
       </div>
       <Skeleton className="h-4 w-full rounded-full" />
    </div>
  </div>
);
