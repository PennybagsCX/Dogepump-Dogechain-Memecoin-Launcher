/**
 * Token Launch Service
 * Generates breaking news about new token launches
 */

export interface Token {
  id: string;
  name: string;
  ticker: string;
}

export interface TokenLaunchEvent {
  id: string;
  title: string;
  description: string;
  type: 'bullish' | 'bearish' | 'neutral';
  multiplier: number;
  source: string;
  sourceUrl: string;
  tokenId?: string;
  tokenName?: string;
  tokenTicker?: string;
  launchType: 'new' | 'trending' | 'milestone' | 'graduation';
  // Color scheme for banner
  colorScheme: 'green' | 'purple' | 'gold' | 'rainbow';
}

// Token name generators
const TOKEN_PREFIXES = [
  "Super", "Safe", "Moon", "Doge", "Baby", "Based", "Chad", "Pepe", "Cyber",
  "Space", "Golden", "Rich", "Happy", "Lucky", "Rocket", "Diamond", "Based",
  "Mega", "Ultra", "Alpha", "Omega", "Prime", "Neon", "Quantum", "Hyper"
];

const TOKEN_SUFFIXES = [
  "Doge", "Inu", "Rocket", "Gem", "Coin", "Mars", "Swap", "Pump", "Hat",
  "CEO", "GPT", "X", "AI", "Cat", "Pepe", "Frog", "Whale", "Shark", "Elon",
  "Mars", "Moon", "Safe", "Moon", "Yield", "Farm", "Vault", "King"
];

// Token launch event templates
const LAUNCH_TEMPLATES = {
  new: [
    {
      title: (ticker: string, name: string) => `🚀 ${ticker} Just Launched!`,
      description: (ticker: string, name: string) => `${name} is now live on Dogepump! Early investors are rushing in. Be the first to grab your ${ticker} tokens!`,
      type: 'bullish' as const,
      multiplier: 2.5
    },
    {
      title: (ticker: string, name: string) => `🔥 NEW GEM: ${ticker}`,
      description: (ticker: string, name: string) => `${name} just launched and is already trending! Don't miss this opportunity!`,
      type: 'bullish' as const,
      multiplier: 2.0
    },
    {
      title: (ticker: string, name: string) => `⚡ ${ticker} Launch Alert!`,
      description: (ticker: string, name: string) => `${name} is now available! Fresh bonding curve, 100% liquidity locked. Ape in early!`,
      type: 'bullish' as const,
      multiplier: 2.2
    }
  ],
  trending: [
    {
      title: (ticker: string, name: string) => `📈 ${ticker} Trending #1`,
      description: (ticker: string, name: string) => `${name} is dominating the charts! Volume is skyrocketing as traders pile in.`,
      type: 'bullish' as const,
      multiplier: 2.8
    },
    {
      title: (ticker: string, name: string) => `🔥 ${ticker} On Fire!`,
      description: (ticker: string, name: string) => `${name} is seeing massive momentum! Whales are accumulating!`,
      type: 'bullish' as const,
      multiplier: 2.5
    }
  ],
  milestone: [
    {
      title: (ticker: string, name: string) => `💎 ${ticker} Hits 50% Bonding Curve`,
      description: (ticker: string, name: string) => `${name} is halfway to graduation! Liquidity migration imminent!`,
      type: 'bullish' as const,
      multiplier: 2.3
    },
    {
      title: (ticker: string, name: string) => `🎯 ${ticker} Milestone Reached`,
      description: (ticker: string, name: string) => `${name} just hit a major milestone! Community is celebrating!`,
      type: 'bullish' as const,
      multiplier: 2.0
    },
    {
      title: (ticker: string, name: string) => `🏆 ${ticker} Breaks Records`,
      description: (ticker: string, name: string) => `${name} just set a new record for fastest growth!`,
      type: 'bullish' as const,
      multiplier: 2.6
    }
  ],
  graduation: [
    {
      title: (ticker: string, name: string) => `🎓 ${ticker} Graduated to DEX!`,
      description: (ticker: string, name: string) => `${name} has graduated! Liquidity migrated to DEX. Full trading enabled!`,
      type: 'bullish' as const,
      multiplier: 3.0
    },
    {
      title: (ticker: string, name: string) => `✨ ${ticker} DEX Listing Live!`,
      description: (ticker: string, name: string) => `${name} graduated successfully! Now trading on DEX with full liquidity!`,
      type: 'bullish' as const,
      multiplier: 3.0
    }
  ]
};

/**
 * Generate a random token name
 */
function generateTokenName(): { name: string; ticker: string } {
  const prefix = TOKEN_PREFIXES[Math.floor(Math.random() * TOKEN_PREFIXES.length)];
  const suffix = TOKEN_SUFFIXES[Math.floor(Math.random() * TOKEN_SUFFIXES.length)];

  // Create name
  const name = `${prefix}${suffix}`;

  // Create ticker (shorter version)
  let ticker = name;
  if (name.length > 8) {
    ticker = prefix.substring(0, 4) + suffix.substring(0, 4);
  }
  ticker = ticker.toUpperCase();

  return { name, ticker };
}

/**
 * Generate a token launch event
 * @param existingTokens - Array of existing tokens to pick from (optional)
 * @param launchType - Type of launch event (optional, random if not specified)
 * @param customToken - Custom token data (optional, overrides existingTokens)
 */
export function generateTokenLaunchEvent(
  existingTokens?: Token[],
  launchType?: 'new' | 'trending' | 'milestone' | 'graduation',
  customToken?: { name: string; ticker: string; id?: string }
): TokenLaunchEvent {
  // Determine launch type
  const types: Array<'new' | 'trending' | 'milestone' | 'graduation'> = ['new', 'trending', 'milestone', 'graduation'];
  const selectedType = launchType || types[Math.floor(Math.random() * types.length)];

  // Select token - prioritize real tokens from array
  let token: { name: string; ticker: string; id?: string };

  if (customToken) {
    token = customToken;
  } else if (existingTokens && existingTokens.length > 0) {
    // Pick a random real token
    const randomToken = existingTokens[Math.floor(Math.random() * existingTokens.length)];
    token = {
      name: randomToken.name,
      ticker: randomToken.ticker,
      id: randomToken.id
    };
  } else {
    // Fallback to generated token
    token = generateTokenName();
  }

  // Get template for this launch type
  const templates = LAUNCH_TEMPLATES[selectedType];
  const template = templates[Math.floor(Math.random() * templates.length)];

  // Determine color scheme based on launch type
  const colorSchemeMap: Record<string, 'green' | 'purple' | 'gold' | 'rainbow'> = {
    'new': 'green',
    'trending': 'purple',
    'milestone': 'gold',
    'graduation': 'rainbow'
  };
  const colorScheme = colorSchemeMap[selectedType];

  // Generate source URL - link to token page if we have an ID
  const sourceUrl = token.id ? `/token/${token.id}` : '/';

  // Generate event
  const event: TokenLaunchEvent = {
    id: `launch-${Date.now()}-${Math.random()}`,
    title: template.title(token.ticker, token.name),
    description: template.description(token.ticker, token.name),
    type: template.type,
    multiplier: template.multiplier,
    source: 'Dogepump Launchpad',
    sourceUrl,
    tokenId: token.id,
    tokenName: token.name,
    tokenTicker: token.ticker,
    launchType: selectedType,
    colorScheme
  };

  return event;
}

/**
 * Track recently shown launch events to prevent duplicates
 */
class LaunchEventCycler {
  private shownEventIds: Set<string> = new Set();
  private MAX_SHOWN_HISTORY = 30;

  markAsShown(eventId: string): void {
    this.shownEventIds.add(eventId);

    if (this.shownEventIds.size > this.MAX_SHOWN_HISTORY) {
      const entriesArray = Array.from(this.shownEventIds);
      const toRemove = entriesArray.slice(0, Math.floor(this.MAX_SHOWN_HISTORY / 2));
      toRemove.forEach(id => this.shownEventIds.delete(id));
    }

    try {
      const data = {
        ids: Array.from(this.shownEventIds),
        timestamp: Date.now()
      };
      localStorage.setItem('dogepump_shown_launches', JSON.stringify(data));
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  isShown(eventId: string): boolean {
    return this.shownEventIds.has(eventId);
  }

  clearHistory(): void {
    this.shownEventIds.clear();
    try {
      localStorage.removeItem('dogepump_shown_launches');
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('dogepump_shown_launches');
      if (stored) {
        const data = JSON.parse(stored);
        if (Array.isArray(data.ids)) {
          this.shownEventIds = new Set(data.ids);
          console.log('[LaunchCycler] Loaded', this.shownEventIds.size, 'shown launch events from storage');
        }
      }
    } catch (e) {
      console.error('[LaunchCycler] Failed to load from storage:', e);
    }
  }
}

const launchCycler = new LaunchEventCycler();

// Initialize on load
if (typeof window !== 'undefined') {
  launchCycler.loadFromStorage();
}

/**
 * Get latest token launch event
 * @param existingTokens - Array of existing tokens to pick from (optional)
 * @param launchType - Type of launch event (optional, random if not specified)
 */
export async function getLatestTokenLaunch(
  existingTokens?: Token[],
  launchType?: 'new' | 'trending' | 'milestone' | 'graduation'
): Promise<{
  title: string;
  description: string;
  type: 'bullish' | 'bearish' | 'neutral';
  multiplier: number;
  source: string;
  sourceUrl: string;
  launchType?: 'new' | 'trending' | 'milestone' | 'graduation';
  colorScheme?: 'green' | 'purple' | 'gold' | 'rainbow';
} | null> {
  // Generate a new launch event with real tokens
  const launchEvent = generateTokenLaunchEvent(existingTokens, launchType);

  // Check if already shown (if we're tracking)
  if (launchCycler.isShown(launchEvent.id)) {
    // Generate a new one if this was already shown
    return getLatestTokenLaunch(existingTokens, launchType);
  }

  // Mark as shown
  launchCycler.markAsShown(launchEvent.id);

  console.log(`[TokenLaunchService] Showing launch: "${launchEvent.title}" (${launchEvent.launchType}, ${launchEvent.colorScheme})`);

  return {
    title: launchEvent.title,
    description: launchEvent.description,
    type: launchEvent.type,
    multiplier: launchEvent.multiplier,
    source: launchEvent.source,
    sourceUrl: launchEvent.sourceUrl,
    launchType: launchEvent.launchType,
    colorScheme: launchEvent.colorScheme
  };
}

/**
 * Generate multiple launch events for bulk operations
 */
export function generateMultipleLaunchEvents(count: number): TokenLaunchEvent[] {
  const events: TokenLaunchEvent[] = [];

  for (let i = 0; i < count; i++) {
    const event = generateTokenLaunchEvent();
    events.push(event);
  }

  return events;
}

/**
 * Clear shown launch history
 */
export function clearLaunchHistory(): void {
  launchCycler.clearHistory();
}

/**
 * Get service status for debugging
 */
export function getLaunchServiceStatus(): { [key: string]: string } {
  return {
    service: 'Token Launch Service',
    eventTemplates: Object.keys(LAUNCH_TEMPLATES).join(', '),
    launchCycler: 'active',
    tokenPrefixes: TOKEN_PREFIXES.length.toString(),
    tokenSuffixes: TOKEN_SUFFIXES.length.toString()
  };
}
