import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react() as any],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@components': path.resolve(__dirname, './components'),
      '@pages': path.resolve(__dirname, './pages'),
      '@server': path.resolve(__dirname, './server'),
      '@utils': path.resolve(__dirname, './utils'),
      '@contexts': path.resolve(__dirname, './contexts'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.*',
        '**/*.d.ts',
        'dist/',
        'server/dist/',
      ],
      include: [
        'components/**/*.{ts,tsx}',
        'pages/**/*.{ts,tsx}',
        'server/**/*.{ts,tsx}',
      ],
    },
    include: [
      'components/**/*.{test,spec}.{ts,tsx}',
      'pages/**/*.{test,spec}.{ts,tsx}',
      'server/**/*.{test,spec}.{ts,tsx}',
      'services/**/*.{test,spec}.{ts,tsx}',
      '__tests__/**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: [
      'node_modules/',
      'dist/',
      'server/dist/',
      '**/*.config.*',
      '**/*.d.ts',
      'tests/**/*', // Exclude all tests in tests/ directory (Playwright tests)
      '**/__tests__/performance/dex/ContractPerformance.test.ts', // Exclude hardhat-specific test
    ],
  },
});
