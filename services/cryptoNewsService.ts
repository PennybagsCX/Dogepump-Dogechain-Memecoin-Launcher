/**
 * Crypto News Service - Simplified for Reddit JSON API
 * Fetches Dogecoin related news from Reddit's JSON API
 * No API keys required, uses CORS proxy
 */

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  multiplier: number;
  keywords: string[];
}

// Reddit JSON API endpoints
const REDDIT_JSON_API = {
  dogecoin: 'https://www.reddit.com/r/Dogecoin/new.json?limit=50',
  dogecoinHot: 'https://www.reddit.com/r/Dogecoin/hot.json?limit=50',
  dogecoinDev: 'https://www.reddit.com/r/dogecoindev/new.json?limit=25',
};

// Multiple CORS proxies for redundancy - ordered by reliability
const CORS_PROXIES = [
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
];

/**
 * Fetch through CORS proxy with fallbacks
 */
async function fetchWithProxy(url: string): Promise<Response> {
  let lastError: Error | null = null;

  for (let i = 0; i < CORS_PROXIES.length; i++) {
    const proxy = CORS_PROXIES[i];
    try {
      const proxyUrl = proxy + encodeURIComponent(url);
      const response = await fetch(proxyUrl, {
        signal: AbortSignal.timeout(8000), // 8 second timeout per proxy
      });

      if (response.ok) {
        const text = await response.text();
        // Check if we got valid JSON (not HTML error page)
        if (text.startsWith('{') || text.startsWith('[')) {
          return new Response(text, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          });
        }
        // Silently try next proxy if we got HTML
      }
    } catch (error) {
      lastError = error as Error;
      continue;
    }
  }

  throw lastError || new Error('All CORS proxies failed');
}

/**
 * Parse Reddit JSON response and convert to NewsItem array
 */
async function parseRedditJSON(data: any, source: string): Promise<NewsItem[]> {
  if (!data?.data?.children || !Array.isArray(data.data.children)) {
    return [];
  }

  const newsItems: NewsItem[] = [];

  for (const post of data.data.children) {
    const postData = post.data;

    const title = postData.title || '';
    const selftext = postData.selftext || '';
    const url = postData.url || `https://www.reddit.com${postData.permalink}`;
    const publishedAt = postData.created_utc * 1000; // Convert to milliseconds

    // Skip posts without titles
    if (!title) {
      continue;
    }

    // Use selftext as description, or a truncated title
    const description = selftext
      ? selftext.substring(0, 200).replace(/\s+/g, ' ').trim()
      : title.substring(0, 150);

    // Analyze sentiment
    const { sentiment, multiplier, keywords } = analyzeSentiment(title + ' ' + description);

    newsItems.push({
      id: postData.id || `reddit-${source}-${Date.now()}-${Math.random()}`,
      title: title.replace(/\s+/g, ' ').trim(),
      description,
      url,
      source,
      publishedAt,
      sentiment,
      multiplier,
      keywords
    });
  }

  return newsItems;
}

// Keywords for sentiment analysis
const BULLISH_KEYWORDS = [
  'surge', 'pump', 'rally', 'bull', 'breakout', 'soar', 'jump', 'gain',
  'rise', 'increase', 'peak', 'high', 'record', 'adoption', 'partnership',
  'launch', 'upgrade', 'etf', 'institutional', 'whale', 'accumulate',
  'moon', 'explode', 'profit', 'win', 'success', 'positive', 'growth',
  'boom', 'bullish', 'rallying', 'skyrocket', 'uptrend', 'to the moon',
  'diamond hands', 'hodl', 'buy', 'rocket', 'profit', 'up', 'great',
  'amazing', 'awesome', 'love', 'best'
];

const BEARISH_KEYWORDS = [
  'crash', 'dump', 'bear', 'plunge', 'fall', 'drop', 'decline', 'loss',
  'decrease', 'low', 'fear', 'panic', 'sell', 'ban', 'regulation', 'hack',
  'scam', 'collapse', 'bubble', 'correction', 'down', 'negative', 'risk',
  'bearish', 'slump', 'tumble', 'plummet', 'downtrend', 'weakness',
  'paper hands', 'sell', 'dumping', 'crashing', 'bad', 'terrible',
  'worst', 'hate', 'fail', 'died'
];

/**
 * Analyze sentiment from text using keyword matching
 */
function analyzeSentiment(text: string): {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  multiplier: number;
  keywords: string[];
} {
  const lowerText = text.toLowerCase();
  const foundKeywords: string[] = [];

  let bullishCount = 0;
  let bearishCount = 0;

  BULLISH_KEYWORDS.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      bullishCount++;
      foundKeywords.push(keyword);
    }
  });

  BEARISH_KEYWORDS.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      bearishCount++;
      foundKeywords.push(keyword);
    }
  });

  let sentiment: 'bullish' | 'bearish' | 'neutral';
  let multiplier = 1.0;

  if (bullishCount > bearishCount) {
    sentiment = 'bullish';
    multiplier = 1.0 + (Math.min(bullishCount, 5) * 0.2);
  } else if (bearishCount > bullishCount) {
    sentiment = 'bearish';
    multiplier = 1.0 - (Math.min(bearishCount, 5) * 0.15);
  } else {
    sentiment = 'neutral';
    multiplier = 1.0;
  }

  // Clamp multiplier between 0.5 and 3.0
  multiplier = Math.max(0.5, Math.min(3.0, multiplier));

  return { sentiment, multiplier, keywords: foundKeywords };
}

/**
 * Cache management
 */
class NewsCache {
  private cache: Map<string, { data: NewsItem[]; timestamp: number }> = new Map();
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: NewsItem[]): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  get(key: string): NewsItem[] | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

const newsCache = new NewsCache();

/**
 * Rate limiter to prevent excessive API calls
 */
class RateLimiter {
  private lastFetchTime: number = 0;
  private readonly MIN_FETCH_INTERVAL_MS = 30 * 1000; // Minimum 30 seconds between fetches

  async throttle<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const timeSinceLastFetch = now - this.lastFetchTime;

    if (timeSinceLastFetch < this.MIN_FETCH_INTERVAL_MS) {
      const waitTime = this.MIN_FETCH_INTERVAL_MS - timeSinceLastFetch;
      console.log(`[NewsService] Rate limiting: waiting ${Math.round(waitTime / 1000)}s`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastFetchTime = Date.now();
    return fn();
  }

  reset(): void {
    this.lastFetchTime = 0;
  }
}

const newsRateLimiter = new RateLimiter();

/**
 * Fetch Reddit JSON through CORS proxy
 * Silently fails to allow mock news fallback
 */
async function fetchRedditJSON(url: string, sourceName: string): Promise<NewsItem[]> {
  const cacheKey = `reddit-${sourceName}`;
  const cached = newsCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetchWithProxy(url);

    if (!response.ok) {
      throw new Error(`CORS proxy returned ${response.status}`);
    }

    const data = await response.json();

    if (!data || !data.data) {
      throw new Error('Invalid Reddit JSON response');
    }

    const newsItems = await parseRedditJSON(data, sourceName);
    newsCache.set(cacheKey, newsItems);
    console.log(`[NewsService] Fetched ${newsItems.length} items from r/${sourceName}`);

    return newsItems;
  } catch (error) {
    // Silent fail - allows mock news fallback
    return [];
  }
}

/**
 * Generate mock DOGE news as fallback
 */
function generateMockNews(): NewsItem[] {
  const mockTitles = [
    { title: "DogeCoin surges 15% as Elon Musk tweets about the Shiba Inu", sentiment: 'bullish' as const },
    { title: "New Dogecoin partnership announced with major payment processor", sentiment: 'bullish' as const },
    { title: "Dogecoin community raises $1M for charity", sentiment: 'bullish' as const },
    { title: "DOGE to the moon! Whales accumulating massive amounts", sentiment: 'bullish' as const },
    { title: "DogeCoin integration coming to major social media platform", sentiment: 'bullish' as const },
    { title: "Market uncertainty hits Dogecoin price temporarily", sentiment: 'bearish' as const },
    { title: "Dogecoin developers announce new upgrade proposal", sentiment: 'neutral' as const },
    { title: "Record breaking transaction volume on Dogecoin network", sentiment: 'bullish' as const },
    { title: "Celebrity endorsement sends Dogecoin price soaring", sentiment: 'bullish' as const },
    { title: "Dogecoin listed on new major exchange platform", sentiment: 'bullish' as const },
  ];

  return mockTitles.map((item, index) => {
    const multiplier = item.sentiment === 'bullish' ? 1.5 : item.sentiment === 'bearish' ? 0.7 : 1.0;
    return {
      id: `mock-${index}`,
      title: item.title,
      description: item.title,
      url: 'https://www.reddit.com/r/dogecoin',
      source: 'dogecoin',
      publishedAt: Date.now() - (index * 3600000), // Spread over last 10 hours
      sentiment: item.sentiment,
      multiplier,
      keywords: item.sentiment === 'bullish' ? ['surge', 'moon'] : []
    };
  });
}

/**
 * Fetch news from all Reddit sources
 * Falls back to mock news if all APIs fail
 */
export async function fetchCryptoNews(): Promise<NewsItem[]> {
  return newsRateLimiter.throttle(async () => {
    // Fetch from all Reddit feeds in parallel
    const [dogecoinNew, dogecoinHot, dogecoinDev] = await Promise.allSettled([
      fetchRedditJSON(REDDIT_JSON_API.dogecoin, 'dogecoin-new'),
      fetchRedditJSON(REDDIT_JSON_API.dogecoinHot, 'dogecoin-hot'),
      fetchRedditJSON(REDDIT_JSON_API.dogecoinDev, 'dogecoin-dev'),
    ]);

    const allNews: NewsItem[] = [];

    if (dogecoinNew.status === 'fulfilled') {
      allNews.push(...dogecoinNew.value);
    }

    if (dogecoinHot.status === 'fulfilled') {
      allNews.push(...dogecoinHot.value);
    }

    if (dogecoinDev.status === 'fulfilled') {
      allNews.push(...dogecoinDev.value);
    }

    // If we got no news from any source, use mock data
    if (allNews.length === 0) {
      console.log('[NewsService] Using mock news (APIs unavailable)');
      return generateMockNews();
    }

    // Remove duplicates based on ID
    const seenIds = new Set();
    const uniqueNews = allNews.filter(item => {
      if (seenIds.has(item.id)) {
        return false;
      }
      seenIds.add(item.id);
      return true;
    });

    // Sort by published date, newest first
    uniqueNews.sort((a, b) => b.publishedAt - a.publishedAt);

    // Return top 50 most recent items
    return uniqueNews.slice(0, 50);
  });
}

/**
 * Track recently shown news to prevent duplicates
 */
class NewsCycler {
  private shownNewsIds: Set<string> = new Set();
  private MAX_SHOWN_HISTORY = 50;
  private NEWS_EXPIRY_MS = 24 * 60 * 60 * 1000;

  markAsShown(newsId: string): void {
    this.shownNewsIds.add(newsId);

    if (this.shownNewsIds.size > this.MAX_SHOWN_HISTORY) {
      const entriesArray = Array.from(this.shownNewsIds);
      const toRemove = entriesArray.slice(0, Math.floor(this.MAX_SHOWN_HISTORY / 2));
      toRemove.forEach(id => this.shownNewsIds.delete(id));
    }

    try {
      const data = {
        ids: Array.from(this.shownNewsIds),
        timestamp: Date.now()
      };
      localStorage.setItem('dogepump_shown_news', JSON.stringify(data));
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  isShown(newsId: string): boolean {
    return this.shownNewsIds.has(newsId);
  }

  getNextUnseen(news: NewsItem[]): NewsItem | null {
    for (const item of news) {
      if (!this.isShown(item.id)) {
        return item;
      }
    }

    if (news.length > 0) {
      console.log('[NewsCycler] All news items shown, clearing history');
      this.clearHistory();
      return news[0];
    }

    return null;
  }

  clearHistory(): void {
    this.shownNewsIds.clear();
    try {
      localStorage.removeItem('dogepump_shown_news');
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('dogepump_shown_news');
      if (stored) {
        const data = JSON.parse(stored);

        if (data.timestamp && Date.now() - data.timestamp > this.NEWS_EXPIRY_MS) {
          console.log('[NewsCycler] Stored news history expired, clearing');
          this.clearHistory();
          return;
        }

        if (Array.isArray(data.ids)) {
          this.shownNewsIds = new Set(data.ids);
          console.log('[NewsCycler] Loaded', this.shownNewsIds.size, 'shown news items from storage');
        }
      }
    } catch (e) {
      console.error('[NewsCycler] Failed to load from storage:', e);
    }
  }
}

const newsCycler = new NewsCycler();

// Initialize on load
if (typeof window !== 'undefined') {
  newsCycler.loadFromStorage();
}

/**
 * Get latest breaking news item
 * Returns a single news item formatted for the MarketEvent interface
 */
export async function getLatestBreakingNews(): Promise<{
  title: string;
  description: string;
  type: 'bullish' | 'bearish' | 'neutral';
  multiplier: number;
  source: string;
  sourceUrl: string;
} | null> {
  try {
    const news = await fetchCryptoNews();

    if (news.length === 0) {
      console.log('[NewsService] No news items available');
      return null;
    }

    // Get the next unseen news item
    const latestNews = newsCycler.getNextUnseen(news);

    if (!latestNews) {
      return null;
    }

    // Mark this news as shown
    newsCycler.markAsShown(latestNews.id);

    console.log(`[NewsService] Showing news: "${latestNews.title.substring(0, 50)}..." (${latestNews.sentiment})`);

    return {
      title: latestNews.title,
      description: latestNews.description,
      type: latestNews.sentiment,
      multiplier: latestNews.multiplier,
      source: latestNews.source,
      sourceUrl: latestNews.url
    };
  } catch (error) {
    console.error('[NewsService] Error fetching breaking news:', error);
    return null;
  }
}

/**
 * Get news filtered by cryptocurrency
 */
export async function getNewsByCrypto(symbol: 'BTC' | 'ETH' | 'DOGE' | 'ALL'): Promise<NewsItem[]> {
  const allNews = await fetchCryptoNews();

  if (symbol === 'ALL' || symbol === 'DOGE') {
    return allNews;
  }

  // For BTC/ETH, return empty as we only support DOGE now
  return [];
}

/**
 * Clear news cache
 */
export function clearNewsCache(): void {
  newsCache.clear();
}

/**
 * Clear shown news history
 */
export function clearShownNewsHistory(): void {
  newsCycler.clearHistory();
}

/**
 * Reset rate limiter
 */
export function resetFeedHealth(): void {
  newsRateLimiter.reset();
  console.log('[NewsService] Rate limiter reset');
}

/**
 * Get service status for debugging
 */
export function getFeedHealthStatus(): { [key: string]: string } {
  return {
    api: 'Reddit JSON via CORS Proxies',
    proxies: CORS_PROXIES.length.toString(),
    fallback: 'mock news',
    sources: Object.keys(REDDIT_JSON_API).join(', '),
    newsCache: 'active',
    rateLimiter: 'active',
    newsCycler: 'active'
  };
}
