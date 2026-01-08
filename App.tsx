
import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Layout from './components/Layout';
import { StoreProvider } from './contexts/StoreContext';
import { DexProvider } from './contexts/DexContext';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/Toast';
import { PageLoader } from './components/PageLoader';
import WebVitals from './components/WebVitals';
import { SkipLink } from './components/SkipLink';
import { PWAInstall } from './components/PWAInstall';
import { registerSW } from './utils/serviceWorkerRegistration';
import { OrganizationSchema, WebSiteSchema } from './components/StructuredDataEnhanced';
import { BanNoticeModal } from './components/BanNoticeModal';
import { WarningModal } from './components/WarningModal';
import { useStore } from './contexts/StoreContext';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy Load Pages
const Home = React.lazy(() => import('./pages/Home'));
const Launch = React.lazy(() => import('./pages/Launch'));
const TokenDetail = React.lazy(() => import('./pages/TokenDetail'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Leaderboard = React.lazy(() => import('./pages/Leaderboard'));
const DogeTV = React.lazy(() => import('./pages/DogeTV'));
const Earn = React.lazy(() => import('./pages/Earn'));
const Admin = React.lazy(() => import('./pages/Admin'));
const DexSwap = React.lazy(() => import('./pages/DexSwap'));
const DexPools = React.lazy(() => import('./pages/DexPools'));
const DexPoolDetail = React.lazy(() => import('./pages/DexPoolDetail'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

// Prefetch components for critical routes
// These will be loaded in the background during idle time
const prefetchDogeTV = () => import('./pages/DogeTV');
const prefetchTokenDetail = () => import('./pages/TokenDetail');

// Prefetch function using requestIdleCallback
const prefetchRoutes = () => {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => {
      prefetchDogeTV();
      prefetchTokenDetail();
    });
  } else {
    // Fallback for browsers that don't support requestIdleCallback
    setTimeout(() => {
      prefetchDogeTV();
      prefetchTokenDetail();
    }, 2000);
  }
};

const AppContent: React.FC = () => {
  const { banNoticeModal, closeBanNoticeModal, warningNoticeModal, closeWarningNoticeModal } = useStore();

  return (
    <DexProvider>
      <Router>
        <WebVitals />
        <OrganizationSchema />
        <WebSiteSchema />
        <SkipLink />
        <PWAInstall />
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/launch" element={<Launch />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/earn" element={<Earn />} />
              <Route path="/token/:id" element={<TokenDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:address" element={<Profile />} />
              <Route path="/tv" element={<DogeTV />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/dex/swap" element={<DexSwap />} />
              <Route path="/dex/pools" element={<DexPools />} />
              <Route path="/dex/liquidity" element={<Navigate to="/dex/pools" replace />} />
              <Route path="/dex/pool/:id" element={<DexPoolDetail />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Layout>
      </Router>
      <BanNoticeModal
        isOpen={banNoticeModal.isOpen}
        onClose={closeBanNoticeModal}
        reason={banNoticeModal.reason}
      />
      <WarningModal
        isOpen={warningNoticeModal.isOpen}
        onClose={closeWarningNoticeModal}
        reason={warningNoticeModal.reason}
        notes={warningNoticeModal.notes}
        warningCount={warningNoticeModal.warningCount}
        maxWarnings={warningNoticeModal.maxWarnings}
      />
    </DexProvider>
  );
};

const App: React.FC = () => {
  useEffect(() => {
    // Register service worker only in production to avoid caching issues in development
    if (import.meta.env.PROD) {
      registerSW();
    }

    // Prefetch critical routes for improved UX
    prefetchRoutes();
  }, []);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <ToastProvider>
          <StoreProvider>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </StoreProvider>
        </ToastProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
};

export default App;
