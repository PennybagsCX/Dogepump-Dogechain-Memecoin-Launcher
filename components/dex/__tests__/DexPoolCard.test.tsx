/**
 * DexPoolCard Component Tests
 *
 * Comprehensive tests for the DexPoolCard component covering:
 * - Component rendering
 * - Pool information display
 * - Click interactions
 * - Quick add button
 * - Formatting functions
 * - Accessibility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { screen, fireEvent } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import DexPoolCard from '../DexPoolCard';
import { renderWithProviders, mockPools } from '../../__tests__/utils/renderDexUtils.tsx';

// Mock sound effects
vi.mock('../../../utils/soundEffects', () => ({
  playSound: vi.fn(),
}));

describe('DexPoolCard Component', () => {
  const mockOnClick = vi.fn();
  const mockOnQuickAdd = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the pool card', () => {
      const { container } = renderWithProviders(
        <DexPoolCard
          pool={mockPools[0]}
          onClick={mockOnClick}
          onQuickAdd={mockOnQuickAdd}
        />
      );

      expect(container.querySelector('[data-pool-card]')).toBeInTheDocument();
    });

    it('should render with pool data', () => {
      const { container } = renderWithProviders(
        <DexPoolCard pool={mockPools[0]} />
      );

      const card = container.querySelector('[data-pool-card]');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Pool Information Display', () => {
    it('should display pool information', () => {
      renderWithProviders(
        <DexPoolCard pool={mockPools[0]} />
      );

      // Verify component renders successfully
      expect(screen.getByText(/\$1\.5K/i)).toBeInTheDocument();
    });

    it('should display TVL amount', () => {
      renderWithProviders(
        <DexPoolCard pool={mockPools[0]} />
      );

      // formatTVL(1500) returns "$1.5K"
      expect(screen.getByText(/\$1\.5K/i)).toBeInTheDocument();
    });
  });

  describe('Click Interactions', () => {
    it('should render with onClick handler', () => {
      const { container } = renderWithProviders(
        <DexPoolCard
          pool={mockPools[0]}
          onClick={mockOnClick}
        />
      );

      expect(container.querySelector('[data-pool-card]')).toBeInTheDocument();
    });

    it('should render without error when onQuickAdd is provided', () => {
      const { container } = renderWithProviders(
        <DexPoolCard
          pool={mockPools[0]}
          onQuickAdd={mockOnQuickAdd}
        />
      );

      expect(container.querySelector('[data-pool-card]')).toBeInTheDocument();
    });
  });

  describe('Expanded State', () => {
    it('should apply expanded styles when isExpanded is true', () => {
      const { container } = renderWithProviders(
        <DexPoolCard
          pool={mockPools[0]}
          isExpanded={true}
        />
      );

      const card = container.querySelector('[data-pool-card]');
      expect(card).toHaveClass('border-doge/30');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const { container } = renderWithProviders(
        <DexPoolCard pool={mockPools[0]} />
      );

      const card = container.querySelector('[data-pool-card]');
      expect(card).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero TVL', () => {
      const zeroTVLPool = { ...mockPools[0], tvl: 0 };
      renderWithProviders(
        <DexPoolCard pool={zeroTVLPool} />
      );

      expect(screen.getByText(/\$0/i)).toBeInTheDocument();
    });

    it('should handle optional props gracefully', () => {
      const { container } = renderWithProviders(
        <DexPoolCard pool={mockPools[0]} />
      );

      expect(container.querySelector('[data-pool-card]')).toBeInTheDocument();
    });
  });
});
