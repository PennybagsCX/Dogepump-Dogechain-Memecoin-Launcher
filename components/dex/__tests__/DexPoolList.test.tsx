/**
 * DexPoolList Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import DexPoolList from '../DexPoolList';
import { renderWithProviders, mockPools } from '../../__tests__/utils/renderDexUtils.tsx';

// Mock sound effects
vi.mock('../../../utils/soundEffects', () => ({
  playSound: vi.fn(),
}));

// Mock child components
vi.mock('../../lucide-react', () => ({
  Search: () => <div data-mock="Search">Search</div>,
}));

describe('DexPoolList Component', () => {
  const mockOnPoolClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the pool list', () => {
      const { container } = renderWithProviders(
        <DexPoolList pools={mockPools} onPoolClick={mockOnPoolClick} />
      );

      expect(container.querySelector('[role="region"]')).toBeInTheDocument();
    });

    it('should have proper ARIA attributes', () => {
      const { container } = renderWithProviders(
        <DexPoolList pools={mockPools} onPoolClick={mockOnPoolClick} />
      );

      const region = container.querySelector('[role="region"]');
      expect(region).toHaveAttribute('aria-label', 'Pool list');
    });

    it('should render with pools prop', () => {
      const { container } = renderWithProviders(
        <DexPoolList pools={mockPools} onPoolClick={mockOnPoolClick} />
      );

      expect(container.querySelector('[role="region"]')).toBeInTheDocument();
    });
  });

  describe('Search Input', () => {
    it('should have search input', () => {
      const { container } = renderWithProviders(
        <DexPoolList pools={mockPools} onPoolClick={mockOnPoolClick} />
      );

      const searchInput = container.querySelector('input[aria-label="Search pools by token name or symbol"]');
      expect(searchInput).toBeInTheDocument();
    });

    it('should have proper input attributes', () => {
      const { container } = renderWithProviders(
        <DexPoolList pools={mockPools} onPoolClick={mockOnPoolClick} />
      );

      const searchInput = container.querySelector('input[aria-label="Search pools by token name or symbol"]');
      expect(searchInput).toHaveAttribute('type', 'text');
      expect(searchInput).toHaveAttribute('placeholder', 'Search pools...');
    });
  });

  describe('Sort Buttons', () => {
    it('should have sort buttons', () => {
      const { container } = renderWithProviders(
        <DexPoolList pools={mockPools} onPoolClick={mockOnPoolClick} />
      );

      const sortGroup = container.querySelector('[role="group"][aria-label="Sort pools"]');
      expect(sortGroup).toBeInTheDocument();

      const buttons = sortGroup?.querySelectorAll('button');
      expect(buttons?.length).toBe(3); // TVL, Volume, APY
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no pools', () => {
      const { container } = renderWithProviders(
        <DexPoolList pools={[]} onPoolClick={mockOnPoolClick} />
      );

      const emptyState = container.querySelector('[role="status"]');
      expect(emptyState).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('should not show pagination for single page', () => {
      const { container } = renderWithProviders(
        <DexPoolList pools={mockPools.slice(0, 5)} onPoolClick={mockOnPoolClick} />
      );

      const pagination = container.querySelector('[role="navigation"]');
      expect(pagination).not.toBeInTheDocument();
    });

    it('should have navigation role when multiple pages', () => {
      // Create 15 pools (more than default itemsPerPage of 10)
      const manyPools = Array.from({ length: 15 }, (_, i) => ({
        ...mockPools[0],
        address: `pool-${i}`,
      }));

      const { container } = renderWithProviders(
        <DexPoolList pools={manyPools} onPoolClick={mockOnPoolClick} />
      );

      const pagination = container.querySelector('[role="navigation"]');
      expect(pagination).toBeInTheDocument();
      expect(pagination).toHaveAttribute('aria-label', 'Pagination');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const { container } = renderWithProviders(
        <DexPoolList pools={mockPools} onPoolClick={mockOnPoolClick} />
      );

      const region = container.querySelector('[role="region"]');
      expect(region).toHaveAttribute('aria-label', 'Pool list');
    });

    it('should have sort group with proper ARIA', () => {
      const { container } = renderWithProviders(
        <DexPoolList pools={mockPools} onPoolClick={mockOnPoolClick} />
      );

      const sortGroup = container.querySelector('[role="group"][aria-label="Sort pools"]');
      expect(sortGroup).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty pools array', () => {
      const { container } = renderWithProviders(
        <DexPoolList pools={[]} onPoolClick={mockOnPoolClick} />
      );

      expect(container.querySelector('[role="region"]')).toBeInTheDocument();
    });

    it('should handle optional onPoolClick callback', () => {
      const { container } = renderWithProviders(
        <DexPoolList pools={mockPools} />
      );

      expect(container.querySelector('[role="region"]')).toBeInTheDocument();
    });

    it('should handle optional className prop', () => {
      const { container } = renderWithProviders(
        <DexPoolList pools={mockPools} className="custom-class" />
      );

      expect(container.querySelector('[role="region"]')).toBeInTheDocument();
    });
  });
});
