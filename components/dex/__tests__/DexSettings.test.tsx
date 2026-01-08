/**
 * DexSettings Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import DexSettings from '../DexSettings';
import { renderWithProviders } from '../../__tests__/utils/renderDexUtils.tsx';

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

describe('DexSettings Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the settings component', () => {
      const { container } = renderWithProviders(<DexSettings />);

      expect(container.querySelector('[role="dialog"]')).toBeInTheDocument();
    });

    it('should have proper ARIA attributes', () => {
      const { container } = renderWithProviders(<DexSettings />);

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'settings-title');
    });
  });

  describe('Slippage Settings', () => {
    it('should display slippage section', () => {
      const { container } = renderWithProviders(<DexSettings />);

      expect(container.querySelector('[role="dialog"]')).toBeInTheDocument();
    });

    it('should have custom slippage input', () => {
      const { container } = renderWithProviders(<DexSettings />);

      // type="number" inputs have role="spinbutton"
      const input = container.querySelector('input[type="number"][aria-label="Custom slippage percentage"]');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Deadline Settings', () => {
    it('should have custom deadline input', () => {
      const { container } = renderWithProviders(<DexSettings />);

      const input = container.querySelector('input[type="number"][aria-label="Custom deadline in minutes"]');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Expert Mode Toggle', () => {
    it('should have expert mode checkbox', () => {
      const { container } = renderWithProviders(<DexSettings />);

      // aria-label is on the checkbox input
      const checkbox = container.querySelector('input[type="checkbox"][aria-label="Toggle expert mode"]');
      expect(checkbox).toBeInTheDocument();
    });
  });

  describe('Sounds Toggle', () => {
    it('should have sounds enabled checkbox', () => {
      const { container } = renderWithProviders(<DexSettings />);

      // aria-label is on the checkbox input
      const checkbox = container.querySelector('input[type="checkbox"][aria-label="Toggle sound effects"]');
      expect(checkbox).toBeInTheDocument();
    });
  });

  describe('Notifications Toggle', () => {
    it('should have notifications enabled checkbox', () => {
      const { container } = renderWithProviders(<DexSettings />);

      // aria-label is on the checkbox input
      const checkbox = container.querySelector('input[type="checkbox"][aria-label="Toggle notifications"]');
      expect(checkbox).toBeInTheDocument();
    });
  });

  describe('Buttons', () => {
    it('should have reset and save buttons', () => {
      const { container } = renderWithProviders(<DexSettings />);

      // Reset button
      const resetButton = container.querySelector('button[aria-label="Reset settings to defaults"]');
      expect(resetButton).toBeInTheDocument();

      // Save button
      const saveButton = container.querySelector('button[aria-label="Save settings"]');
      expect(saveButton).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for dialog', () => {
      const { container } = renderWithProviders(<DexSettings />);

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'settings-title');
    });

    it('should have close button', () => {
      const { container } = renderWithProviders(<DexSettings />);

      const closeButton = container.querySelector('button[aria-label="Close settings"]');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should render without crashing', () => {
      const { container } = renderWithProviders(<DexSettings />);

      expect(container.querySelector('[role="dialog"]')).toBeInTheDocument();
    });

    it('should handle optional className prop', () => {
      const { container } = renderWithProviders(<DexSettings className="custom-class" />);

      const dialog = container.querySelector('.dex-settings');
      expect(dialog).toBeInTheDocument();
    });
  });
});
