/**
 * Haptic feedback utility for mobile devices
 * Provides vibration feedback for user interactions
 */

export const hapticFeedback = {
  /**
   * Light vibration for subtle feedback
   */
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },

  /**
   * Medium vibration for standard feedback
   */
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(25);
    }
  },

  /**
   * Heavy vibration for important feedback
   */
  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  },

  /**
   * Success vibration pattern
   */
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 50, 50]);
    }
  },

  /**
   * Error vibration pattern
   */
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  },

  /**
   * Warning vibration pattern
   */
  warning: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([75, 25, 75]);
    }
  },

  /**
   * Button click feedback
   */
  click: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(15);
    }
  },

  /**
   * Trade confirmation feedback
   */
  tradeConfirm: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 50, 30]);
    }
  },

  /**
   * Custom vibration pattern
   * @param pattern - Array of vibration durations in ms
   */
  custom: (pattern: number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  },

  /**
   * Check if haptic feedback is supported
   */
  isSupported: (): boolean => {
    return 'vibrate' in navigator;
  }
};

export default hapticFeedback;
