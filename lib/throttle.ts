/**
 * Performance Optimization Utilities
 *
 * Provides React hooks for throttling and debouncing expensive operations
 * to prevent excessive re-renders and API calls.
 */

import { useRef, useCallback, useEffect } from 'react';

/**
 * Throttle a function to only run once per delay period
 *
 * Use this for high-frequency events like scroll, resize, or WebSocket updates
 * where you want to limit how often a function executes.
 *
 * @param callback - Function to throttle
 * @param delay - Minimum time between executions in milliseconds
 *
 * @example
 * const throttledScroll = useThrottle(handleScroll, 100);
 * <div onScroll={throttledScroll} />
 */
export function useThrottle<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRun.current;

      if (timeSinceLastRun >= delay) {
        // Clear any pending timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        // Execute immediately
        lastRun.current = now;
        callback(...args);
      } else if (!timeoutRef.current) {
        // Schedule execution for the end of the delay period
        const remainingDelay = delay - timeSinceLastRun;
        timeoutRef.current = setTimeout(() => {
          lastRun.current = Date.now();
          timeoutRef.current = null;
          callback(...args);
        }, remainingDelay);
      }
    },
    [callback, delay]
  ) as T;
}

/**
 * Debounce a function to only run after delay period of inactivity
 *
 * Use this for search inputs, autocomplete, or save-on-change operations
 * where you want to wait for user to stop typing before executing.
 *
 * @param callback - Function to debounce
 * @param delay - Time to wait after last call before executing in milliseconds
 *
 * @example
 * const debouncedSearch = useDebounce(handleSearch, 300);
 * <input onChange={(e) => debouncedSearch(e.target.value)} />
 */
export function useDebounce<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
        timeoutRef.current = null;
      }, delay);
    },
    [callback, delay]
  ) as T;
}

/**
 * Throttle async operations to prevent concurrent executions
 *
 * Use this for API calls or expensive async operations where you want
 * to prevent multiple concurrent executions.
 *
 * @param asyncFn - Async function to throttle
 * @param delay - Minimum time between executions in milliseconds
 *
 * @example
 * const throttledFetch = useAsyncThrottle(fetchUserData, 1000);
 * <button onClick={() => throttledFetch(userId)}>Refresh</button>
 */
export function useAsyncThrottle<T extends (...args: any[]) => Promise<any>>(
  asyncFn: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());
  const pendingPromise = useRef<Promise<any> | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastRun.current >= delay) {
        lastRun.current = now;
        const promise = asyncFn(...args);
        pendingPromise.current = promise;
        return promise;
      }

      // Return pending promise or a resolved promise
      return pendingPromise.current || Promise.resolve(null);
    },
    [asyncFn, delay]
  ) as T;
}

/**
 * Debounce async operations
 *
 * Similar to useDebounce but for async functions.
 *
 * @param asyncFn - Async function to debounce
 * @param delay - Time to wait after last call before executing in milliseconds
 *
 * @example
 * const debouncedSave = useAsyncDebounce(saveToDatabase, 500);
 * <input onChange={(e) => debouncedSave(e.target.value)} />
 */
export function useAsyncDebounce<T extends (...args: any[]) => Promise<any>>(
  asyncFn: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      return new Promise((resolve, reject) => {
        timeoutRef.current = setTimeout(async () => {
          try {
            const result = await asyncFn(...args);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, delay);
      });
    },
    [asyncFn, delay]
  ) as T;
}

/**
 * Create a throttle function for non-hook usage
 *
 * Use this in class components or outside React components.
 *
 * @param func - Function to throttle
 * @param delay - Minimum time between executions in milliseconds
 *
 * @example
 * const throttledLog = throttle(console.log, 1000);
 * throttledLog('Hello', 'World');
 */
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): T {
  let lastRun = Date.now();
  let timeout: NodeJS.Timeout | null = null;

  return ((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastRun = now - lastRun;

    if (timeSinceLastRun >= delay) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      lastRun = now;
      func(...args);
    } else if (!timeout) {
      const remainingDelay = delay - timeSinceLastRun;
      timeout = setTimeout(() => {
        lastRun = Date.now();
        timeout = null;
        func(...args);
      }, remainingDelay);
    }
  }) as T;
}

/**
 * Create a debounce function for non-hook usage
 *
 * Use this in class components or outside React components.
 *
 * @param func - Function to debounce
 * @param delay - Time to wait after last call before executing in milliseconds
 *
 * @example
 * const debouncedSearch = debounce(searchAPI, 300);
 * searchInput.addEventListener('input', (e) => debouncedSearch(e.target.value));
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): T {
  let timeout: NodeJS.Timeout | null = null;

  return ((...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, delay);
  }) as T;
}
