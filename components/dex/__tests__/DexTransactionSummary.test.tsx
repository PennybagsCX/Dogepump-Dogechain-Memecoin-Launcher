/**
 * DexTransactionSummary Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import DexTransactionSummary from '../DexTransactionSummary';
import { renderWithProviders, mockTokens } from '../../__tests__/utils/renderDexUtils.tsx';

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

describe('DexTransactionSummary Component', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  const mockSwapSummary = {
    tokenIn: mockTokens[0],
    tokenOut: mockTokens[1],
    amountIn: '100',
    amountOut: '50',
    price: '0.5',
    priceImpact: 0.5,
    minimumReceived: '49.75',
  };

  const mockFeeSummary = {
    gasCost: '0.001',
    gasCostUSD: 2.5,
    routerFee: '0.0003',
    routerFeeUSD: 0.75,
    totalCostUSD: 3.25,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the transaction summary component', () => {
      const { container } = renderWithProviders(
        <DexTransactionSummary
          type="swap"
          swapSummary={mockSwapSummary}
          feeSummary={mockFeeSummary}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(container.querySelector('[role="dialog"]')).toBeInTheDocument();
    });

    it('should have proper ARIA attributes', () => {
      const { container } = renderWithProviders(
        <DexTransactionSummary
          type="swap"
          swapSummary={mockSwapSummary}
          feeSummary={mockFeeSummary}
        />
      );

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).toHaveAttribute('aria-label', 'Transaction summary');
    });

    it('should render with required props', () => {
      const { container } = renderWithProviders(
        <DexTransactionSummary type="swap" />
      );

      expect(container.querySelector('[role="dialog"]')).toBeInTheDocument();
    });
  });

  describe('Type Display', () => {
    it('should display correct title for swap type', () => {
      const { container } = renderWithProviders(
        <DexTransactionSummary type="swap" swapSummary={mockSwapSummary} />
      );

      expect(container.textContent).toContain('Swap Summary');
    });

    it('should display correct title for add_liquidity type', () => {
      const { container } = renderWithProviders(
        <DexTransactionSummary type="add_liquidity" swapSummary={mockSwapSummary} />
      );

      expect(container.textContent).toContain('Add Liquidity Summary');
    });

    it('should display correct title for remove_liquidity type', () => {
      const { container } = renderWithProviders(
        <DexTransactionSummary type="remove_liquidity" swapSummary={mockSwapSummary} />
      );

      expect(container.textContent).toContain('Remove Liquidity Summary');
    });
  });

  describe('Swap Summary Display', () => {
    it('should display token symbols', () => {
      const { container } = renderWithProviders(
        <DexTransactionSummary type="swap" swapSummary={mockSwapSummary} />
      );

      expect(container.textContent).toContain(mockTokens[0].symbol);
      expect(container.textContent).toContain(mockTokens[1].symbol);
    });

    it('should display amounts', () => {
      const { container } = renderWithProviders(
        <DexTransactionSummary type="swap" swapSummary={mockSwapSummary} />
      );

      expect(container.textContent).toContain('100');
      expect(container.textContent).toContain('50');
    });
  });

  describe('Price Impact Warning', () => {
    it('should not show warning when price impact is low', () => {
      const { container } = renderWithProviders(
        <DexTransactionSummary
          type="swap"
          swapSummary={{ ...mockSwapSummary, priceImpact: 0.5, priceImpactWarning: false }}
        />
      );

      // Should not have warning alert
      const warnings = container.querySelectorAll('[role="alert"]');
      const warningText = Array.from(warnings).some(w => w.textContent?.includes('High'));
      expect(warningText).toBe(false);
    });

    it('should show warning when price impact is high', () => {
      const { container } = renderWithProviders(
        <DexTransactionSummary
          type="swap"
          swapSummary={{ ...mockSwapSummary, priceImpact: 5.0, priceImpactWarning: true }}
        />
      );

      // Should have warning alert
      const warnings = container.querySelectorAll('[role="alert"]');
      const warningText = Array.from(warnings).some(w => w.textContent?.includes('High'));
      expect(warningText).toBe(true);
    });
  });

  describe('Fee Summary Display', () => {
    it('should display fee summary when provided', () => {
      const { container } = renderWithProviders(
        <DexTransactionSummary
          type="swap"
          swapSummary={mockSwapSummary}
          feeSummary={mockFeeSummary}
        />
      );

      expect(container.textContent).toContain('Gas Cost');
      expect(container.textContent).toContain('Total Cost');
    });

    it('should format USD values correctly', () => {
      const { container } = renderWithProviders(
        <DexTransactionSummary
          type="swap"
          swapSummary={mockSwapSummary}
          feeSummary={mockFeeSummary}
        />
      );

      // formatUSD(2.5) returns "$2.50"
      // formatUSD(3.25) returns "$3.25"
      expect(container.textContent).toContain('$2.50');
      expect(container.textContent).toContain('$3.25');
    });
  });

  describe('Buttons', () => {
    it('should have cancel and confirm buttons', () => {
      const { container } = renderWithProviders(
        <DexTransactionSummary
          type="swap"
          swapSummary={mockSwapSummary}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const { container } = renderWithProviders(
        <DexTransactionSummary
          type="swap"
          swapSummary={mockSwapSummary}
        />
      );

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).toHaveAttribute('aria-label', 'Transaction summary');
    });
  });

  describe('Edge Cases', () => {
    it('should handle type only', () => {
      const { container } = renderWithProviders(
        <DexTransactionSummary type="swap" />
      );

      expect(container.querySelector('[role="dialog"]')).toBeInTheDocument();
    });

    it('should handle optional className prop', () => {
      const { container } = renderWithProviders(
        <DexTransactionSummary type="swap" className="custom-class" />
      );

      expect(container.querySelector('[role="dialog"]')).toBeInTheDocument();
    });

    it('should handle optional callbacks', () => {
      const { container } = renderWithProviders(
        <DexTransactionSummary type="swap" swapSummary={mockSwapSummary} />
      );

      expect(container.querySelector('[role="dialog"]')).toBeInTheDocument();
    });
  });
});
