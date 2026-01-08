# Trollbox News Enhancement

## Overview

The Trollbox news system displays breaking **Dogecoin/$DOGE** news from multiple RSS sources directly in the Trollbox chat and NewsBanner. This enhancement improves the news reading experience by removing title truncation, adding clickable links to full articles, filtering for Dogecoin-related content only, and implementing a smart news cycling system to prevent duplicate news.

**Version**: 1.5
**Last Updated**: December 2025

---

## Features

### 1. Dogecoin-Only News Filtering

**Breaking news is filtered exclusively for Dogecoin-related content**, ensuring users only see relevant $DOGE news.

**Filtered Keywords**: `['dogecoin', 'doge', 'elon', 'shiba', 'meme']`

This ensures that:
- Only Dogecoin-related articles appear in the NewsBanner
- Trollbox HypeBot only posts $DOGE market events
- News remains focused on the Dogecoin ecosystem

### 2. Smart News Cycling

**News items are cycled based on recency, preventing duplicate announcements.**

The system implements a `NewsCycler` class that:
- Tracks which news items have already been shown
- Automatically cycles to the next unseen news item
- Persists shown news history to localStorage
- Clears history after 24 hours or when all items are shown
- Maintains a maximum of 50 shown news items in memory

This ensures that:
- The same news won't be shown repeatedly
- Users see a variety of Dogecoin news
- News cycling resets automatically after exhausting the list
- History expires daily to allow re-cycling of older news

### 3. Complete News Headlines

**Before**: News titles were truncated to 120 characters, causing important information to be cut off.

**After**: Full news headlines are now displayed without truncation, ensuring users see complete article titles.

### 4. Clickable Article Links

News messages in the Trollbox now include a clickable "Read More" link that:
- Opens the full article in a new tab
- Displays an external link icon for clear visual indication
- Uses the dogecoin gold (doge) color scheme for consistency

### 5. Multi-Source News Aggregation

The system fetches news from multiple RSS feeds and filters for Dogecoin-related content:
- **Reddit**: r/CryptoCurrency, r/Bitcoin, r/Dogecoin, r/ethereum
- **News Sites**: Cointelegraph, CoinDesk, Decrypt, Bitcoin.com

All sources are filtered to show only Dogecoin-related news.

### 6. Sentiment Analysis

News articles are automatically analyzed for market sentiment:
- **Bullish** (green): Positive market-moving news
- **Bearish** (red): Negative market-moving news
- **Neutral** (blue): Informational news

---

## Technical Implementation

### Files Modified

#### 1. `services/cryptoNewsService.ts`

**Change 1**: Smart News Cycling (line 242-345)

Added `NewsCycler` class to track shown news and cycle through items:

```typescript
class NewsCycler {
  private shownNewsIds: Set<string> = new Set();
  private MAX_SHOWN_HISTORY = 50;
  private NEWS_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

  markAsShown(newsId: string): void { ... }
  isShown(newsId: string): boolean { ... }
  getNextUnseen(news: NewsItem[]): NewsItem | null { ... }
  clearHistory(): void { ... }
  loadFromStorage(): void { ... }
}
```

**Impact**: News now cycles through available items, preventing duplicate displays.

**Change 2**: Updated getLatestBreakingNews to use cycling (line 430-468)

```typescript
// Before
const latestNews = news[0];

// After
const latestNews = newsCycler.getNextUnseen(news);
newsCycler.markAsShown(latestNews.id);
```

**Impact**: Each call returns the next unseen news item, cycling through all available news.

**Change 3**: Added clearShownNewsHistory export function (line 503-505)

```typescript
export function clearShownNewsHistory(): void {
  newsCycler.clearHistory();
}
```

**Impact**: Allows manual reset of news cycling if needed.

**Change 4**: Filter breaking news for Dogecoin only (line 440)

```typescript
// Before
const news = await fetchCryptoNews();

// After
const news = await getNewsByCrypto('DOGE');
```

**Impact**: Breaking news now only includes articles related to Dogecoin, DOGE, Elon, Shiba, or meme keywords.

**Change 5**: Removed title truncation (line 145)

```typescript
// Before
title: cleanTitle.length > 120 ? cleanTitle.substring(0, 117) + '...' : cleanTitle,

// After
title: cleanTitle,
```

**Impact**: News articles with long titles are now displayed in full.

**Change 6**: Strip URLs from news content (line 111-147)

Added URL stripping to both title and description cleaning:

```typescript
// Remove URLs (http, https, www, x.com, twitter.com, etc.)
.replace(/https?:\/\/[^\s]+/gi, '')
.replace(/www\.[^\s]+/gi, '')
.replace(/x\.com\/[^\s]+/gi, '')
.replace(/twitter\.com\/[^\s]+/gi, '')
.replace(/t\.me\/[^\s]+/gi, '')
// Remove "Sources:" prefix and text after URLs
.replace(/Sources?:.*$/gi, '')
```

**Impact**: URLs and source links are now stripped from news titles and descriptions, preventing them from appearing in Trollbox announcements. Users can still access full articles via the "Read More" link.

**Change 7**: Stable news ID generation (line 157-163)

Fixed news ID generation to use stable identifiers based on URL:

```typescript
// Before - ID changed on every fetch
id: `${source}-${index}-${Date.now()}`,

// After - ID is stable across fetches
const stableId = link
  ? Buffer.from(link).toString('base64').substring(0, 50)
  : `${source}-${index}`;

newsItems.push({
  id: stableId,
  // ...
});
```

**Impact**: Same news items now have consistent IDs across multiple fetches, allowing the NewsCycler to properly track and prevent duplicate announcements.

#### 2. `components/Trollbox.tsx`

**Changes**:
1. Added `sourceUrl?: string` field to Message interface (line 40)
2. Modified news message creation to include source URL (line 81)
3. Updated rendering to show clickable link (lines 376-386)

```typescript
// Message interface updated
interface Message {
  id: string;
  user: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
  imageUrl?: string;
  isAi?: boolean;
  sourceUrl?: string;  // NEW
}

// News message creation
const newMessage: Message = {
  id: Date.now().toString(),
  user: '🤖 HypeBot',
  text: `🚨 ${marketEvent.title.toUpperCase()}! ${marketEvent.description}`,
  timestamp: Date.now(),
  isSystem: true,
  sourceUrl: marketEvent.sourceUrl  // NEW
};

// Link rendering in message display
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
```

---

## User Experience

### How It Works

1. **News Detection**: The system monitors RSS feeds for crypto-related news
2. **Automatic Display**: When breaking news is detected, it appears in the Trollbox as a system message from "🤖 HypeBot"
3. **Full Headline**: Users see the complete article title and description
4. **Quick Access**: Users can click "Read More" to open the full article in a new tab

### Visual Design

News messages are displayed with:
- Yellow lightning bolt icon (🚨) for visual distinction
- Uppercase headline for emphasis
- Gray background with white border for system message styling
- Dogecoin gold colored "Read More" link
- External link icon for clarity

### Example

```
🤖 HypeBot
🚨 ELON MUSK TWEETS ABOUT DOGECOIN AGAIN, SENDS MEMECOINS SOARING!
Tesla CEO Elon Musk posted another tweet about Dogecoin...
[Read More ↗]
```

---

## News Sources

### Reddit (Community-Driven)
- r/CryptoCurrency - General crypto discussion
- r/Dogecoin - Dogecoin community news

### News Sites (Professional Journalism)
- **Cointelegraph**: Leading cryptocurrency news platform
- **CoinDesk**: Institutional crypto news
- **Decrypt**: User-friendly crypto coverage

### RSS Feed Configuration

Feeds are configured in `services/cryptoNewsService.ts`:

```typescript
const RSS_FEEDS = {
  reddit: {
    crypto: 'https://www.reddit.com/r/CryptoCurrency/.rss',
    dogecoin: 'https://www.reddit.com/r/Dogecoin/.rss',
  },
  news: {
    cointelegraph: 'https://cointelegraph.com/rss',
    coindesk: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
    decrypt: 'https://decrypt.co/feed',
  }
};
```

**Note**: Sources are optimized for Dogecoin news and reliable CORS proxy compatibility. Less reliable sources (bitcoin.com, r/Bitcoin, r/ethereum) have been removed to reduce errors and improve performance.

---

## Sentiment Analysis

### Bullish Indicators

Keywords that trigger bullish sentiment:
- surge, pump, rally, bull, breakout, soar, jump, gain
- rise, increase, peak, high, record, adoption, partnership
- launch, upgrade, etf, institutional, whale, accumulate
- moon, explode, profit, win, success, positive, growth

### Bearish Indicators

Keywords that trigger bearish sentiment:
- crash, dump, bear, plunge, fall, drop, decline, loss
- decrease, low, fear, panic, sell, ban, regulation, hack
- scam, collapse, bubble, correction, down, negative, risk

### Multiplier System

Sentiment affects market event multipliers:
- **Bullish**: Multiplier increases by 0.2 per bullish keyword (max 3.0)
- **Bearish**: Multiplier decreases by 0.15 per bearish keyword (min 0.5)
- **Neutral**: Base multiplier of 1.0

---

## Caching

The news system uses a 5-minute cache to:
- Reduce API calls to RSS feeds
- Improve performance
- Prevent rate limiting
- Ensure consistent user experience

Cache management is handled by the `NewsCache` class in `cryptoNewsService.ts`.

---

## CORS Handling

RSS feeds are fetched through multiple CORS proxies to bypass browser restrictions. The system tries 6 different proxies in order:

1. **allorigins.win** (primary - fastest)
2. **corsproxy.io** (fallback 1)
3. **codetabs.com/v1/proxy** (fallback 2)
4. **cors-anywhere.herokuapp.com** (fallback 3)
5. **corsproxy.github.io** (fallback 4)
6. **thingproxy.freeboard.io** (fallback 5)

**Features**:
- Automatic failover to next proxy if one fails
- Response validation to ensure XML content is received
- 10-second timeout per proxy request
- Graceful degradation - if all proxies fail, system continues without news
- Reduced console logging - only first proxy failure and summary are logged

**Error Handling**:
- Individual feed failures don't break the system
- Failed sources are skipped silently
- Warning logged only when all proxies fail for a specific source
- No spam - single warning per failed hostname

---

## Related Components

### NewsBanner Component

Located in `components/NewsBanner.tsx`, this component:
- Displays breaking news at the top of the page
- Shows color-coded banners by sentiment (green/red/blue)
- Includes source link and external link icon
- Can be dismissed by clicking the X button

### Store Integration

News is integrated through the store context:
- `marketEvent` state holds current news
- `setMarketEvent` function updates news display
- News appears in both Trollbox and NewsBanner simultaneously

---

## Testing Checklist

### Functionality
- [ ] News headlines display in full without truncation
- [ ] "Read More" link appears on news messages
- [ ] Clicking link opens article in new tab
- [ ] External link icon is visible
- [ ] Link color matches dogecoin gold theme

### Multiple Sources
- [ ] News from Reddit appears correctly
- [ ] News from Cointelegraph appears correctly
- [ ] News from CoinDesk appears correctly
- [ ] News from Decrypt appears correctly

### Sentiment Display
- [ ] Bullish news shows appropriate styling
- [ ] Bearish news shows appropriate styling
- [ ] Neutral news shows appropriate styling

### Edge Cases
- [ ] Very long headlines display fully
- [ ] Missing source URLs handled gracefully
- [ ] News messages don't break Trollbox layout
- [ ] Multiple news messages display correctly

---

## Troubleshooting

### News Not Appearing

**Possible Causes**:
1. CORS proxies are down
2. RSS feeds are unavailable
3. Network connectivity issues

**Solutions**:
- Check browser console for errors
- Verify network connectivity
- Wait 5 minutes for cache to refresh
- Check if RSS feeds are accessible

### Links Not Working

**Possible Causes**:
1. `sourceUrl` is undefined
2. URL is malformed
3. Article has been removed

**Solutions**:
- Verify `marketEvent.sourceUrl` is set
- Check RSS feed is returning valid URLs
- Test with different news sources

### Layout Issues

**Possible Causes**:
1. Very long headlines breaking layout
2. Multiple system messages overlapping

**Solutions**:
- Check CSS `max-w-[90%]` is applied
- Verify `break-words` class is present
- Test with various headline lengths

---

## Future Enhancements

### Potential Improvements
1. **User Preferences**: Allow users to filter news by source or sentiment
2. **News Search**: Add search functionality to find historical news
3. **Notification Alerts**: Optional push notifications for breaking news
4. **Custom Feeds**: Allow users to add custom RSS feeds
5. **News Sharing**: Share news to social media
6. **Read Later**: Save articles for later reading

### Technical Improvements
1. **WebSocket Updates**: Real-time news updates without polling
2. **Image Previews**: Show article thumbnails in news messages
3. **Categorization**: Better categorization of news types
4. **Relevance Scoring**: Show most relevant news first

---

## Security Considerations

### External Links
- All external links use `rel="noopener noreferrer"` to prevent security issues
- Links open in new tabs to avoid losing Trollbox state

### XSS Prevention
- News content is sanitized before display
- HTML tags are stripped from descriptions
- Only safe content is rendered in React components

### Rate Limiting
- 5-minute cache prevents excessive API calls
- Graceful degradation if sources fail

---

## Performance

### Optimization Strategies
1. **Caching**: 5-minute cache reduces API calls
2. **Lazy Loading**: News fetched on demand
3. **Parallel Requests**: Multiple RSS feeds fetched simultaneously
4. **Background Updates**: News fetched without blocking UI

### Metrics
- Cache duration: 5 minutes
- RSS timeout: 10 seconds per feed
- Maximum news items: 50 (from all sources)
- Update frequency: On cache expiration

---

## API Reference

### NewsItem Interface

```typescript
interface NewsItem {
  id: string;                    // Unique identifier
  title: string;                 // Full article title (NO LONGER TRUNCATED)
  description: string;           // Article summary (max 200 chars)
  url: string;                   // Link to full article
  source: string;                // Source name (e.g., "reddit/crypto")
  publishedAt: number;           // Timestamp
  sentiment: 'bullish' | 'bearish' | 'neutral';
  multiplier: number;            // Market effect multiplier
  keywords: string[];            // Detected keywords
}
```

### getLatestBreakingNews()

```typescript
async function getLatestBreakingNews(): Promise<{
  title: string;
  description: string;
  type: 'bullish' | 'bearish' | 'neutral';
  multiplier: number;
  source: string;
  sourceUrl: string;  // Link to article
} | null>
```

Returns the most recent news item or null if no news available.

---

## Related Documentation

- [ADMIN_GUIDE.md](ADMIN_GUIDE.md) - Admin panel features
- [COMPLETE_IMPLEMENTATION_SUMMARY.md](COMPLETE_IMPLEMENTATION_SUMMARY.md) - Full system overview
- [AUDIO_SYSTEM_GUIDE.md](AUDIO_SYSTEM_GUIDE.md) - Related Trollbox features

---

**Change Log**

### v1.5 (December 2025)
- Improved CORS proxy reliability with 6 fallback proxies
- Removed unreliable RSS sources (bitcoin.com, r/Bitcoin, r/ethereum)
- Optimized for DOGE news with fewer, more reliable sources
- Added response validation to ensure XML content is received
- Reduced console logging noise
- Better error handling with graceful degradation
- Individual feed failures no longer spam console

### v1.4 (December 2025)
- Fixed critical bug causing same news to appear repeatedly
- Changed news ID generation from `Date.now()` to stable URL-based hashing
- News items now have consistent IDs across multiple RSS fetches
- NewsCycler can now properly track and prevent duplicate announcements

### v1.3 (December 2025)
- Fixed URLs appearing in Trollbox news announcements
- Strip all HTTP/HTTPS URLs from news titles and descriptions
- Remove x.com, twitter.com, t.me, and www links from news content
- Remove "Sources:" prefix and any text following URLs
- Ensures clean, readable news in Trollbox without raw URLs

### v1.2 (December 2025)
- Added smart news cycling to prevent duplicate announcements
- Implemented NewsCycler class to track shown news items
- News now cycles through available items instead of repeating
- Automatic history expiry after 24 hours
- Maximum of 50 shown news items tracked in memory
- Added clearShownNewsHistory() export function for manual reset
- localStorage persistence for shown news history

### v1.1 (December 2025)
- Added Dogecoin-only news filtering
- Breaking news now filtered for $DOGE related content only
- Keywords: 'dogecoin', 'doge', 'elon', 'shiba', 'meme'
- Updated getLatestBreakingNews() to use getNewsByCrypto('DOGE')

### v1.0 (December 2025)
- Initial documentation
- Removed title truncation (120 char limit removed)
- Added clickable article links with external link icons
- Updated Message interface to include sourceUrl
- Enhanced news display in Trollbox

---

**Maintained By**: DogePump Team
**Last Updated**: December 2025
