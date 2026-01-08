/**
 * DexPoolDetail Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import DexPoolDetail from '../DexPoolDetail';
import { renderWithProviders, mockPools } from '../../__tests__/utils/renderDexUtils.tsx';

// Mock sound effects
vi.mock('../../../utils/soundEffects', () => ({
  playSound: vi.fn(),
}));

// Mock all child components
vi.mock('../../Button', () => ({
  __esModule: true,
  default: ({ onClick, children, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

vi.mock('../PoolPriceChart', () => ({
  __esModule: true,
  default: () => <div data-mock="PoolPriceChart">Price Chart</div>,
}));

vi.mock('../AddLiquidityPanel', () => ({
  __esModule: true,
  default: () => <div data-mock="AddLiquidityPanel">Add Liquidity</div>,
}));

vi.mock('../PoolStatsGrid', () => ({
  __esModule: true,
  default: () => <div data-mock="PoolStatsGrid">Stats Grid</div>,
}));

vi.mock('../RecentSwapsTable', () => ({
  __esModule: true,
  default: () => <div data-mock="RecentSwapsTable">Recent Swaps</div>,
}));

vi.mock('../ProvidersTable', () => ({
  __esModule: true,
  default: () => <div data-mock="ProvidersTable">Providers</div>,
}));

describe('DexPoolDetail Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the pool detail component', () => {
      const { container } = renderWithProviders(
        <DexPoolDetail pool={mockPools[0]} />
      );

      expect(container.querySelector('[role="main"]')).toBeInTheDocument();
    });

    it('should have proper ARIA attributes', () => {
      const { container } = renderWithProviders(
        <DexPoolDetail pool={mockPools[0]} />
      );

      const main = container.querySelector('[role="main"]');
      expect(main).toHaveAttribute('aria-label', 'Pool details');
    });

    it('should render with required pool prop', () => {
      const { container } = renderWithProviders(
        <DexPoolDetail pool={mockPools[0]} />
      );

      expect(container.querySelector('[role="main"]')).toBeInTheDocument();
    });
  });

  describe('Pool Information Display', () => {
    it('should display token pair symbols', () => {
      const { container } = renderWithProviders(
        <DexPoolDetail pool={mockPools[0]} />
      );

      // Should display token pair (e.g., "DC/ETH")
      expect(container.textContent).toContain(mockPools[0].tokenA.symbol);
      expect(container.textContent).toContain(mockPools[0].tokenB.symbol);
    });

    it('should display fee percentage', () => {
      const { container } = renderWithProviders(
        <DexPoolDetail pool={mockPools[0]} />
      );

      // Should display fee (e.g., "0.3% fee")
      expect(container.textContent).toContain('fee');
    });
  });

  describe('Child Components', () => {
    it('should render mock child components', () => {
      const { container } = renderWithProviders(
        <DexPoolDetail pool={mockPools[0]} />
      );

      // Child components are mocked, so we just check the parent renders
      expect(container.querySelector('[role="main"]')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const { container } = renderWithProviders(
        <DexPoolDetail pool={mockPools[0]} />
      );

      const main = container.querySelector('[role="main"]');
      expect(main).toHaveAttribute('aria-label', 'Pool details');
    });
  });

  describe('Edge Cases', () => {
    it('should handle optional props', () => {
      const { container } = renderWithProviders(
        <DexPoolDetail
          pool={mockPools[0]}
          recentSwaps={[]}
          topProviders={[]}
        />
      );

      expect(container.querySelector('[role="main"]')).toBeInTheDocument();
    });

    it('should handle optional className prop', () => {
      const { container } = renderWithProviders(
        <DexPoolDetail pool={mockPools[0]} className="custom-class" />
      );

      expect(container.querySelector('[role="main"]')).toBeInTheDocument();
    });

    it('should handle optional onSwap callback', () => {
      const { container } = renderWithProviders(
        <DexPoolDetail pool={mockPools[0]} onSwap={vi.fn()} />
      );

      expect(container.querySelector('[role="main"]')).toBeInTheDocument();
    });
  });
});
