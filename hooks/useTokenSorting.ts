import { useMemo } from 'react';
import { Token } from '../types';
import { FILTER_THRESHOLDS } from '../constants/homeConstants';

export type FilterType = 'trending' | 'new' | 'created' | 'graduated' | 'watchlist' | 'live';

interface UseTokenSortingParams {
  tokens: Token[];
  search: string;
  filter: FilterType;
  watchlist: string[];
}

/**
 * Custom hook for sorting and filtering tokens
 * Handles all token display logic for the homepage
 */
export const useTokenSorting = ({
  tokens,
  search,
  filter,
  watchlist
}: UseTokenSortingParams) => {

  const sortedTokens = useMemo(() => {
    if (!tokens) return [];

    const trimmedSearch = search.trim().toLowerCase();

    return [...tokens]
    .filter(t => !t.delisted) // Filter out delisted tokens
    .filter(t => (t.name || '').toLowerCase().includes(trimmedSearch) || (t.ticker || '').toLowerCase().includes(trimmedSearch))
    .filter(t => {
      if (filter === 'created') return t.creator === 'You';
      if (filter === 'graduated') return t.progress >= 100;
      if (filter === 'watchlist') return watchlist.includes(t.id);
      if (filter === 'new') return (Date.now() - t.createdAt) < FILTER_THRESHOLDS.NEW_TOKEN_MS;
      if (filter === 'live') return t.isLive === true;
      return true;
    })
    .sort((a, b) => {
      if (filter === 'trending' || filter === 'live') {
         // Priority: Recently Boosted/Burned (Flash Logic) > Total Boosts > Progress > Market Cap
         const now = Date.now();
         const recencyA = Math.max(a.lastBoostedAt || 0, a.lastBurnedAt || 0);
         const recencyB = Math.max(b.lastBoostedAt || 0, b.lastBurnedAt || 0);

         // If boosted/burned within recent threshold, put at top
         const isRecentA = now - recencyA < FILTER_THRESHOLDS.RECENT_BOOST_MS;
         const isRecentB = now - recencyB < FILTER_THRESHOLDS.RECENT_BOOST_MS;

         if (isRecentA && !isRecentB) return -1;
         if (!isRecentA && isRecentB) return 1;
         if (isRecentA && isRecentB) return recencyB - recencyA;

         // For Live filter, sort by viewer count
         if (filter === 'live') return (b.streamViewers || 0) - (a.streamViewers || 0);

         // Total Boosts
         const boostA = a.boosts || 0;
         const boostB = b.boosts || 0;
         if (boostB !== boostA) return boostB - boostA;

         // Progress
         return b.progress - a.progress;
       }
       // New filter: Sort by creation time
       if (filter === 'new') return b.createdAt - a.createdAt;

       // Default fallback
       return b.marketCap - a.marketCap;
     });
  }, [tokens, search, filter, watchlist]);

  return { sortedTokens };
};
