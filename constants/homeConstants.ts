/**
 * Homepage Constants
 * Centralized magic numbers and configuration values for the homepage
 */

export const HOME = {
  // Pagination
  INITIAL_VISIBLE_COUNT: 12,
  PAGE_SIZE: 12,

  // Filter Time Thresholds (in milliseconds)
  FILTER_THRESHOLDS: {
    NEW_TOKEN_HOURS: 24,
    NEW_TOKEN_MS: 24 * 60 * 60 * 1000, // 24 hours
    RECENT_BOOST_MINUTES: 5,
    RECENT_BOOST_MS: 5 * 60 * 1000, // 5 minutes
    RECENT_BURN_MS: 5 * 60 * 1000, // 5 minutes
    ONE_HOUR_MS: 60 * 60 * 1000, // 1 hour
  },

  // Hero Carousel
  CAROUSEL: {
    ROTATION_INTERVAL_MS: 5000, // 5 seconds
    HERO_TOKEN_COUNT: 3, // Top 3 tokens displayed
  },

  // Search
  SEARCH: {
    MAX_LENGTH: 100, // Maximum search query length
    DEBOUNCE_MS: 300, // Search debounce delay
  },

  // Market Stats
  MARKET_STATS: {
    UPDATE_INTERVAL_MS: 30000, // 30 seconds
  },

  // Loading States
  LOADING: {
    INITIAL_DELAY_MS: 800, // Initial loading timeout
    SKELETON_COUNT: 6, // Number of skeleton cards to show
  },
} as const;

// Derived values for easier use
export const { FILTER_THRESHOLDS, CAROUSEL, SEARCH, MARKET_STATS, LOADING } = HOME;
