import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: parseInt(process.env.PORT || '3005'),
        host: '0.0.0.0',
        // SPA fallback for BrowserRouter
        historyApiFallback: true,
      },
      plugins: [
        react(),
        viteCompression({
          algorithm: 'gzip',
          ext: '.gz',
          threshold: 10240, // Only compress files larger than 10KB
        }),
        viteCompression({
          algorithm: 'brotliCompress',
          ext: '.br',
          threshold: 10240,
        }),
        mode === 'production' && visualizer({
          open: false,
          gzipSize: true,
          brotliSize: true,
          filename: 'dist/stats.html'
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // Build optimizations
      build: {
        target: 'esnext', // Support top-level await
        rollupOptions: {
          output: {
            manualChunks(id) {
              // Vendor libraries
              if (id.includes('node_modules')) {
                // React core
                if (id.includes('react') || id.includes('react-dom')) {
                  return 'vendor-react';
                }
                // Router
                if (id.includes('react-router-dom')) {
                  return 'vendor-router';
                }
                // UI library
                if (id.includes('lucide-react')) {
                  return 'vendor-ui';
                }
                // Charts - split into smaller chunks
                if (id.includes('recharts')) {
                  return 'vendor-charts';
                }
                // Blockchain
                if (id.includes('ethers')) {
                  return 'vendor-blockchain';
                }
                // Other node_modules
                return 'vendor';
              }

              // Context providers (extract to reduce main bundle)
              if (id.includes('/contexts/')) {
                return 'contexts';
              }

              // Services
              if (id.includes('/services/')) {
                return 'services';
              }

              // Utilities
              if (id.includes('/utils/')) {
                return 'utils';
              }

              // Route-specific chunks (granular splitting)
              if (id.includes('/pages/')) {
                // Admin page
                if (id.includes('/pages/Admin')) {
                  return 'route-admin';
                }
                // DEX pages
                if (id.includes('/pages/Dex')) {
                  return 'route-dex';
                }
                // Token detail page
                if (id.includes('/pages/TokenDetail')) {
                  return 'route-token-detail';
                }
                // DogeTV page
                if (id.includes('/pages/DogeTV')) {
                  return 'route-doge-tv';
                }
                // Profile page
                if (id.includes('/pages/Profile')) {
                  return 'route-profile';
                }
                // Earn page
                if (id.includes('/pages/Earn')) {
                  return 'route-earn';
                }
                // Launch page
                if (id.includes('/pages/Launch')) {
                  return 'route-launch';
                }
                // Leaderboard page
                if (id.includes('/pages/Leaderboard')) {
                  return 'route-leaderboard';
                }
                // Home page
                if (id.includes('/pages/Home')) {
                  return 'route-home';
                }
                // Other pages
                return 'routes';
              }

              // Components shared across routes - split by feature
              if (id.includes('/components/') && !id.includes('/components/dex/')) {
                // Token-related components
                if (id.includes('/components/Token') ||
                    id.includes('/components/TokenTable') ||
                    id.includes('/components/TokenCard') ||
                    id.includes('/components/OptimizedImage')) {
                  return 'components-token';
                }
                // Trading-related components
                if (id.includes('/components/Trade') ||
                    id.includes('/components/CandleChart') ||
                    id.includes('/components/Sparkline') ||
                    id.includes('/components/BubbleMap')) {
                  return 'components-trading';
                }
                // Auth/User-related components
                if (id.includes('/components/Profile') ||
                    id.includes('/components/Settings') ||
                    id.includes('/components/Upload') ||
                    id.includes('/components/Auth')) {
                  return 'components-auth';
                }
                // UI components (shared)
                if (id.includes('/components/Button') ||
                    id.includes('/components/Modal') ||
                    id.includes('/components/Toast') ||
                    id.includes('/components/Skeleton')) {
                  return 'components-ui';
                }
                // Other components
                return 'components';
              }

              // DEX components
              if (id.includes('/components/dex/')) {
                return 'components-dex';
              }
            },
          },
          onwarn(warning, warn) {
            // Suppress specific warnings if needed
            if (warning.code === 'MODULE_NOT_FOUND') return;
            warn(warning);
          },
        },
        chunkSizeWarningLimit: 500,
        sourcemap: false,
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: mode === 'production',
            drop_debugger: true,
          },
        },
      },
    };
});
