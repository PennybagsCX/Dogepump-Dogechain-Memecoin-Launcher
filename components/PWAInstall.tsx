/**
 * PWA Installation Component
 * Handles beforeinstallprompt event and shows install button
 */

import { useState, useEffect } from 'react';

export const PWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstall(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('[PWA] User accepted install prompt');
    } else {
      console.log('[PWA] User dismissed install prompt');
    }

    setDeferredPrompt(null);
    setShowInstall(false);
  };

  if (!showInstall) return null;

  return (
    <button
      onClick={handleInstallClick}
      className="fixed bottom-4 right-4 md:bottom-20 md:right-6 z-50 bg-doge-accent text-black px-4 py-2 rounded-lg font-medium hover:bg-yellow-400 transition-colors shadow-lg"
      aria-label="Install DogePump app"
    >
      <span className="flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Install App
      </span>
    </button>
  );
};

export default PWAInstall;
