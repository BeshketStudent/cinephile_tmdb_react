import React from 'react';
import { motion } from 'motion/react';

export function MovieListSkeleton() {
  const skeletons = Array(6).fill(0);
  
  return (
    <div className="flex overflow-x-hidden gap-4 sm:gap-8 pb-10 px-1 sm:px-0">
      {skeletons.map((_, i) => (
        <div key={i} className="flex-none w-36 sm:w-44 md:w-52">
          <motion.div
            className="aspect-[2/3] w-full rounded-2xl bg-white/5 animate-pulse"
          />
          <div className="mt-3 space-y-2">
            <motion.div className="h-4 bg-white/5 rounded animate-pulse w-3/4" />
            <motion.div className="h-3 bg-white/5 rounded animate-pulse w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative h-[70vh] lg:h-[85vh] w-full bg-white/5 animate-pulse flex items-end">
        <div className="relative z-10 w-full px-6 lg:px-20 pb-20 pt-32 space-y-4">
            <div className="max-w-2xl text-left bg-white/5 h-12 w-3/4 rounded animate-pulse" />
            <div className="flex items-center gap-4 text-xs font-bold tracking-widest uppercase">
                <div className="h-4 w-16 bg-white/5 rounded animate-pulse" />
                <div className="h-4 w-16 bg-white/5 rounded animate-pulse" />
            </div>
            <div className="max-w-xl text-left bg-white/5 h-20 w-full rounded animate-pulse" />
        </div>
    </div>
  );
}
