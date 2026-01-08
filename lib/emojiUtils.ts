/**
 * Emoji Utilities
 *
 * Centralized emoji handling to eliminate code duplication
 * across the application.
 */

import type { ChartEmoji } from '../types';

export type EmojiKey = 'rocket' | 'fire' | 'diamond' | 'skull';

/**
 * Emoji to key mapping for consistent state management
 */
const EMOJI_TO_KEY: Record<ChartEmoji, EmojiKey> = {
  '🚀': 'rocket',
  '🔥': 'fire',
  '💎': 'diamond',
  '💀': 'skull',
};

/**
 * Key to emoji mapping for reverse lookup
 */
const KEY_TO_EMOJI: Record<EmojiKey, ChartEmoji> = {
  rocket: '🚀',
  fire: '🔥',
  diamond: '💎',
  skull: '💀',
};

/**
 * Emoji display names for UI
 */
const EMOJI_NAMES: Record<EmojiKey, string> = {
  rocket: 'Rocket',
  fire: 'Fire',
  diamond: 'Diamond',
  skull: 'Skull',
};

/**
 * Emoji colors for UI theming
 */
const EMOJI_COLORS: Record<EmojiKey, string> = {
  rocket: '#10B981', // green
  fire: '#EF4444', // red
  diamond: '#3B82F6', // blue
  skull: '#6B7280', // gray
};

/**
 * Convert emoji to state key
 * @param emoji - The emoji character
 * @returns The corresponding state key
 *
 * @example
 * emojiToKey('🚀') // returns 'rocket'
 */
export function emojiToKey(emoji: ChartEmoji): EmojiKey {
  return EMOJI_TO_KEY[emoji];
}

/**
 * Convert state key to emoji
 * @param key - The state key
 * @returns The corresponding emoji character
 *
 * @example
 * keyToEmoji('rocket') // returns '🚀'
 */
export function keyToEmoji(key: EmojiKey): ChartEmoji {
  return KEY_TO_EMOJI[key];
}

/**
 * Get emoji display name
 * @param key - The emoji key
 * @returns Human-readable name
 *
 * @example
 * getEmojiName('rocket') // returns 'Rocket'
 */
export function getEmojiName(key: EmojiKey): string {
  return EMOJI_NAMES[key];
}

/**
 * Get emoji color for UI
 * @param key - The emoji key
 * @returns CSS color value
 *
 * @example
 * getEmojiColor('rocket') // returns '#10B981'
 */
export function getEmojiColor(key: EmojiKey): string {
  return EMOJI_COLORS[key];
}

/**
 * Get all available emojis
 * @returns Array of all emoji keys
 *
 * @example
 * getAllEmojis() // returns ['rocket', 'fire', 'diamond', 'skull']
 */
export function getAllEmojis(): EmojiKey[] {
  return Object.keys(EMOJI_TO_KEY) as EmojiKey[];
}

/**
 * Check if emoji is valid
 * @param emoji - Emoji to validate
 * @returns True if emoji is supported
 *
 * @example
 * isValidEmoji('🚀') // returns true
 * isValidEmoji('❤️') // returns false
 */
export function isValidEmoji(emoji: string): emoji is ChartEmoji {
  return emoji in EMOJI_TO_KEY;
}

/**
 * Create reaction count object with zeros
 * @returns Object with all emoji counts initialized to 0
 *
 * @example
 * createEmptyReactionCounts()
 * // returns { rocket: 0, fire: 0, diamond: 0, skull: 0 }
 */
export function createEmptyReactionCounts(): Record<EmojiKey, number> {
  return {
    rocket: 0,
    fire: 0,
    diamond: 0,
    skull: 0,
  };
}

/**
 * Format reaction counts for display
 * @param counts - Reaction counts object
 * @returns Total number of reactions
 *
 * @example
 * getTotalReactions({ rocket: 5, fire: 3, diamond: 2, skull: 1 })
 * // returns 11
 */
export function getTotalReactions(counts: Record<EmojiKey, number>): number {
  return Object.values(counts).reduce((sum, count) => sum + count, 0);
}

/**
 * Get top reaction by count
 * @param counts - Reaction counts object
 * @returns The emoji key with highest count, or null if empty
 *
 * @example
 * getTopReaction({ rocket: 5, fire: 3, diamond: 2, skull: 1 })
 * // returns 'rocket'
 */
export function getTopReaction(counts: Record<EmojiKey, number>): EmojiKey | null {
  const entries = Object.entries(counts) as [EmojiKey, number][];

  if (entries.length === 0) return null;

  const [topKey] = entries.sort(([, a], [, b]) => b - a);
  return topKey;
}

/**
 * Calculate reaction percentages
 * @param counts - Reaction counts object
 * @returns Object with percentage for each emoji
 *
 * @example
 * getReactionPercentages({ rocket: 5, fire: 3, diamond: 2, skull: 0 })
 * // returns { rocket: 50, fire: 30, diamond: 20, skull: 0 }
 */
export function getReactionPercentages(
  counts: Record<EmojiKey, number>
): Record<EmojiKey, number> {
  const total = getTotalReactions(counts);

  if (total === 0) {
    return {
      rocket: 0,
      fire: 0,
      diamond: 0,
      skull: 0,
    };
  }

  const percentages: Record<EmojiKey, number> = {
    rocket: 0,
    fire: 0,
    diamond: 0,
    skull: 0,
  };

  for (const [key, count] of Object.entries(counts)) {
    percentages[key as EmojiKey] = Math.round((count / total) * 100);
  }

  return percentages;
}
