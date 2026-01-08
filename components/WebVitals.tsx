import React, { useEffect } from 'react';
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';

export const WebVitals: React.FC = () => {
  useEffect(() => {
    // Only track in production
    if (import.meta.env.PROD) {
      // Largest Contentful Paint (LCP)
      onLCP((metric) => {
        console.log('LCP:', metric);
        // Send to analytics service here
        // Example: sendToAnalytics('LCP', metric.value);
      });

      // First Input Delay (FID)
      onFID((metric) => {
        console.log('FID:', metric);
        // Example: sendToAnalytics('FID', metric.value);
      });

      // First Contentful Paint (FCP)
      onFCP((metric) => {
        console.log('FCP:', metric);
        // Example: sendToAnalytics('FCP', metric.value);
      });

      // Time to First Byte (TTFB)
      onTTFB((metric) => {
        console.log('TTFB:', metric);
        // Example: sendToAnalytics('TTFB', metric.value);
      });

      // Cumulative Layout Shift (CLS)
      onCLS((metric) => {
        console.log('CLS:', metric);
        // Example: sendToAnalytics('CLS', metric.value);
      });
    }
  }, []);

  return null; // This component doesn't render anything
};

export default WebVitals;
