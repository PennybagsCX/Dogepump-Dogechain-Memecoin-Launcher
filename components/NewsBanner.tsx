
import React, { type ReactElement } from 'react';
import { TrendingUp, TrendingDown, X, Rocket, ExternalLink, Flame, Trophy, Sparkles } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';

export const NewsBanner: React.FC = () => {
  const { marketEvent, setMarketEvent } = useStore();

  if (!marketEvent || !marketEvent.active) return null;

  // Determine color scheme based on event type
  const colorScheme = marketEvent.colorScheme || 'green';

  // Color scheme configurations
  const colorConfigs: Record<'green' | 'purple' | 'gold' | 'rainbow', { bg: string; iconBg: string; icon: ReactElement }> = {
    green: {
      bg: 'bg-green-900/90',
      iconBg: 'bg-green-500 text-black',
      icon: <Rocket size={16} />
    },
    purple: {
      bg: 'bg-purple-900/90',
      iconBg: 'bg-purple-500 text-white',
      icon: <Flame size={16} />
    },
    gold: {
      bg: 'bg-yellow-900/90',
      iconBg: 'bg-yellow-500 text-black',
      icon: <Trophy size={16} />
    },
    rainbow: {
      bg: 'bg-gradient-to-r from-purple-900/90 via-pink-900/90 to-blue-900/90',
      iconBg: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
      icon: <Sparkles size={16} />
    }
  };

  const config = colorConfigs[colorScheme as keyof typeof colorConfigs];
  const isRainbow = colorScheme === 'rainbow';

  return (
    <div
      id="news-banner"
      className="relative overflow-hidden backdrop-blur-md border-b border-white/10 transition-all duration-500 mb-3"
      style={{
        zIndex: 50,
        width: '100%',
        maxWidth: '100%',
        marginLeft: 0,
        marginRight: 0
      }}
    >
      {/* Full-bleed background to avoid right-edge gap */}
      <div
        className={`absolute inset-0 ${config.bg}`}
        style={{
          width: '100%',
          maxWidth: '100%'
        }}
        aria-hidden
      />

      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4 flex-1 min-w-0">
           <div className={`p-2 rounded-full shrink-0 ${config.iconBg} animate-pulse`}>
              {config.icon}
           </div>
           <div className="flex-1 min-w-0">
              {marketEvent.sourceUrl ? (
                <a
                  href={marketEvent.sourceUrl}
                  className="block hover:bg-white/5 rounded-lg transition-colors active:bg-white/10"
                  onClick={(e: any) => {
                    // Ensure the link works properly on mobile
                    e.stopPropagation();
                  }}
                >
                  <h3 className="font-bold text-white text-sm flex items-center gap-2 pointer-events-none">
                     {marketEvent.title}
                     <ExternalLink size={12} className="shrink-0" />
                  </h3>
                  <p className="text-xs text-white/80 pointer-events-none">{marketEvent.description}</p>
                  {marketEvent.source && (
                    <div className="inline-flex items-center gap-1 text-xs text-white/60 mt-1 pointer-events-none">
                      {marketEvent.source}
                    </div>
                  )}
                </a>
              ) : (
                <>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                     {marketEvent.title}
                  </h3>
                  <p className="text-xs text-white/80">{marketEvent.description}</p>
                </>
              )}
           </div>
        </div>

        <button
          onClick={(e: any) => {
            e.preventDefault();
            e.stopPropagation();
            setMarketEvent(null);
          }}
          className="p-3 rounded-full hover:bg-black/20 text-white/60 hover:text-white transition-colors shrink-0 ml-2 active:bg-black/30"
          aria-label="Close launch banner"
        >
           <X size={16} />
        </button>
      </div>

      {/* Moving background effect */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.5)_50%,transparent_75%)] bg-[length:20px_20px] animate-shimmer pointer-events-none"></div>
      {/* Rainbow sparkle effect for graduations */}
      {isRainbow && (
        <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 animate-pulse pointer-events-none"></div>
      )}
    </div>
  );
};
