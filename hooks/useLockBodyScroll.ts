import { useEffect, useRef } from 'react';

/**
 * Safely locks body scroll with guaranteed cleanup
 * Uses ref tracking to prevent cleanup issues and ensure scroll is always restored
 */
export const useLockBodyScroll = (isLocked: boolean) => {
  const lockedRef = useRef(false);

  useEffect(() => {
    if (isLocked && !lockedRef.current) {
      // Store original values
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;

      // Lock scroll
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      lockedRef.current = true;

      // Return cleanup function with closure over original values
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
        lockedRef.current = false;
      };
    } else if (!isLocked && lockedRef.current) {
      // Manual unlock if needed
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      lockedRef.current = false;
    }
  }, [isLocked]);
};
