import { useEffect, RefObject } from 'react';

/**
 * Detects clicks outside specified refs
 * Handles both mouse and touch events
 * Uses capture phase for early detection
 */
export const useClickOutside = (
  refs: RefObject<HTMLElement>[],
  callback: () => void,
  isActive: boolean
) => {
  useEffect(() => {
    if (!isActive) return;

    const handleClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;

      // Check if click is outside all refs
      const isOutside = refs.every((ref) => {
        const current = ref.current;
        return current && !current.contains(target);
      });

      if (isOutside) {
        callback();
      }
    };

    // Use capture phase for early detection
    document.addEventListener('mousedown', handleClick, true);
    document.addEventListener('touchstart', handleClick, true);

    return () => {
      document.removeEventListener('mousedown', handleClick, true);
      document.removeEventListener('touchstart', handleClick, true);
    };
  }, [refs, callback, isActive]);
};
