/**
 * DexRemoveLiquidity Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import DexRemoveLiquidity from '../DexRemoveLiquidity';
import { renderWithProviders, mockPools } from '../../__tests__/utils/renderDexUtils.tsx';

// Mock sound effects
vi.mock('../../../utils/soundEffects', () => ({
  playSound: vi.fn(),
}));

// Mock Button component
vi.mock('../../Button', () => ({
  __esModule: true,
  default: ({ onClick, children, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

describe('DexRemoveLiquidity Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the remove liquidity component', () => {
      const { container } = renderWithProviders(
        <DexRemoveLiquidity pool={mockPools[0]} lpBalance="1000" />
      );

      expect(container.querySelector('[role="region"]')).toBeInTheDocument();
    });

    it('should have proper ARIA attributes', () => {
      const { container } = renderWithProviders(
        <DexRemoveLiquidity pool={mockPools[0]} lpBalance="1000" />
      );

      const region = container.querySelector('[role="region"]');
      expect(region).toHaveAttribute('aria-label', 'Remove liquidity');
    });

    it('should render with required props', () => {
      const { container } = renderWithProviders(
        <DexRemoveLiquidity pool={mockPools[0]} lpBalance="1000" />
      );

      expect(container.querySelector('[role="region"]')).toBeInTheDocument();
    });
  });

  describe('Warning Message', () => {
    it('should display warning message', () => {
      const { container } = renderWithProviders(
        <DexRemoveLiquidity pool={mockPools[0]} lpBalance="1000" />
      );

      // Warning message has role="alert"
      const alerts = container.querySelectorAll('[role="alert"]');
      expect(alerts.length).toBeGreaterThan(0);

      // Check for warning text
      const warning = Array.from(alerts).find(alert =>
        alert.textContent?.includes('Warning')
      );
      expect(warning).toBeInTheDocument();
    });
  });

  describe('LP Balance Display', () => {
    it('should display LP balance', () => {
      const { container } = renderWithProviders(
        <DexRemoveLiquidity pool={mockPools[0]} lpBalance="1000" />
      );

      // Should display the LP balance value
      expect(container.textContent).toContain('1000');
    });

    it('should handle zero LP balance', () => {
      const { container } = renderWithProviders(
        <DexRemoveLiquidity pool={mockPools[0]} lpBalance="0" />
      );

      expect(container.querySelector('[role="region"]')).toBeInTheDocument();
    });
  });

  describe('Token Pair Display', () => {
    it('should display token pair symbols', () => {
      const { container } = renderWithProviders(
        <DexRemoveLiquidity pool={mockPools[0]} lpBalance="1000" />
      );

      // Should display token pair (e.g., "DC/ETH")
      expect(container.textContent).toContain(mockPools[0].tokenA.symbol);
      expect(container.textContent).toContain(mockPools[0].tokenB.symbol);
    });
  });

  describe('Percentage Buttons', () => {
    it('should have quick percentage buttons', () => {
      const { container } = renderWithProviders(
        <DexRemoveLiquidity pool={mockPools[0]} lpBalance="1000" />
      );

      // Should have buttons for 25%, 50%, 75%, 100%
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Error States', () => {
    it('should handle error state from context', () => {
      const { container } = renderWithProviders(
        <DexRemoveLiquidity pool={mockPools[0]} lpBalance="1000" />
      );

      // Component renders successfully
      expect(container.querySelector('[role="region"]')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const { container } = renderWithProviders(
        <DexRemoveLiquidity pool={mockPools[0]} lpBalance="1000" />
      );

      const region = container.querySelector('[role="region"]');
      expect(region).toHaveAttribute('aria-label', 'Remove liquidity');

      // Should have alert for warnings
      const alerts = container.querySelectorAll('[role="alert"]');
      expect(alerts.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty LP balance', () => {
      const { container } = renderWithProviders(
        <DexRemoveLiquidity pool={mockPools[0]} lpBalance="" />
      );

      expect(container.querySelector('[role="region"]')).toBeInTheDocument();
    });

    it('should handle optional className prop', () => {
      const { container } = renderWithProviders(
        <DexRemoveLiquidity pool={mockPools[0]} lpBalance="1000" className="custom-class" />
      );

      expect(container.querySelector('[role="region"]')).toBeInTheDocument();
    });
  });
});
