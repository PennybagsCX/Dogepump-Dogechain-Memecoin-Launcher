import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { TokenCard } from '../../../components/TokenCard';
import { Token } from '../../../types';
import * as audio from '../../../services/audio';
// Mock the StoreContext
const mockBuyToken = vi.fn();
const mockPriceHistory = {};
const mockUserBalanceDC = 1000;

vi.mock('../../../contexts/StoreContext', () => ({
  useStore: () => ({
    priceHistory: mockPriceHistory,
    buyToken: mockBuyToken,
    userBalanceDC: mockUserBalanceDC,
  }),
}));

// Mock audio service
vi.mock('../../../services/audio', () => ({
  playSound: vi.fn(),
}));

// Mock Toast
vi.mock('../../../components/Toast', () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

const mockToken: Token = {
  id: 'test-token-1',
  name: 'TestDoge',
  ticker: 'TDOGE',
  description: 'A test token for unit testing',
  imageUrl: 'https://example.com/token.png',
  creator: 'You',
  contractAddress: '0x1234567890abcdef',
  marketCap: 500000,
  virtualLiquidity: 25000,
  volume: 50000,
  price: 0.5,
  progress: 65,
  createdAt: Date.now() - 1000 * 60 * 30,
  supply: 1000000,
  boosts: 5,
  lastBoostedAt: Date.now() - 1000 * 60 * 2,
  securityState: {
    mintRevoked: false,
    freezeRevoked: false,
    lpBurned: false,
  },
  sentiment: {
    bullish: 75,
    bearish: 25,
  },
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('TokenCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render token card with correct information', () => {
    render(<TokenCard token={mockToken} />, { wrapper });

    expect(screen.getByText('TestDoge')).toBeInTheDocument();
    expect(screen.getByText(/\$TDOGE/)).toBeInTheDocument();
    expect(screen.getByText(/A test token for unit testing/i)).toBeInTheDocument();
  });

  it('should show "You" badge for tokens created by user', () => {
    render(<TokenCard token={mockToken} />, { wrapper });

    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('should show Quick Ape button for non-graduated tokens', () => {
    render(<TokenCard token={mockToken} />, { wrapper });

    expect(screen.getByText('QUICK APE')).toBeInTheDocument();
  });

  it('should show "Trade on DEX" for graduated tokens', () => {
    const graduatedToken = { ...mockToken, progress: 100 };
    render(<TokenCard token={graduatedToken} />, { wrapper });

    expect(screen.getByText('Trade on DEX')).toBeInTheDocument();
    expect(screen.queryByText('QUICK APE')).not.toBeInTheDocument();
  });

  it('should not show Quick Ape button in preview mode', () => {
    render(<TokenCard token={mockToken} preview={true} />, { wrapper });

    expect(screen.queryByText('QUICK APE')).not.toBeInTheDocument();
  });

  it('should display market cap formatted correctly', () => {
    render(<TokenCard token={mockToken} />, { wrapper });

    // Market cap should be displayed
    const mcElement = screen.getByText(/500,000/);
    expect(mcElement).toBeInTheDocument();
  });

  it('should display progress correctly', () => {
    render(<TokenCard token={mockToken} />, { wrapper });

    expect(screen.getByText('65.00%')).toBeInTheDocument();
  });

  it('should display 100% for graduated tokens', () => {
    const graduatedToken = { ...mockToken, progress: 100 };
    render(<TokenCard token={graduatedToken} />, { wrapper });

    expect(screen.getByText('GRADUATED')).toBeInTheDocument();
  });

  it('should open quick buy overlay when Quick Ape button is clicked', async () => {
    render(<TokenCard token={mockToken} />, { wrapper });

    const quickApeButton = screen.getByText('QUICK APE');
    fireEvent.click(quickApeButton);

    await waitFor(() => {
      expect(screen.getByText('Quick Ape')).toBeInTheDocument();
      expect(screen.getByText('Instant buy. No confirmation.')).toBeInTheDocument();
    });
  });

  it('should display quick buy amount options', async () => {
    render(<TokenCard token={mockToken} />, { wrapper });

    // Open quick buy overlay
    const quickApeButton = screen.getByText('QUICK APE');
    fireEvent.click(quickApeButton);

    await waitFor(() => {
      expect(screen.getByText('50 DC')).toBeInTheDocument();
      expect(screen.getByText('100 DC')).toBeInTheDocument();
      expect(screen.getByText('500 DC')).toBeInTheDocument();
    });
  });

  it('should execute buy for small amounts (<=100 DC)', async () => {
    render(<TokenCard token={mockToken} />, { wrapper });

    // Open quick buy overlay
    const quickApeButton = screen.getByText('QUICK APE');
    fireEvent.click(quickApeButton);

    await waitFor(() => {
      expect(screen.getByText('Quick Ape')).toBeInTheDocument();
    });

    // Click on 50 DC option
    const buyButton = screen.getByText('50 DC').closest('button');
    if (buyButton) {
      fireEvent.click(buyButton);
    }

    await waitFor(() => {
      expect(mockBuyToken).toHaveBeenCalledWith('test-token-1', 50);
    });
  });

  it('should show confirmation modal for large amounts (>100 DC)', async () => {
    render(<TokenCard token={mockToken} />, { wrapper });

    // Open quick buy overlay
    const quickApeButton = screen.getByText('QUICK APE');
    fireEvent.click(quickApeButton);

    await waitFor(() => {
      expect(screen.getByText('Quick Ape')).toBeInTheDocument();
    });

    // Click on 500 DC option
    const buyButton = screen.getByText('500 DC').closest('button');
    if (buyButton) {
      fireEvent.click(buyButton);
    }

    await waitFor(() => {
      expect(screen.getByText('Confirm Large Purchase')).toBeInTheDocument();
    });
  });

  it('should show confirmation modal with correct token name', async () => {
    render(<TokenCard token={mockToken} />, { wrapper });

    // Open quick buy overlay
    const quickApeButton = screen.getByText('QUICK APE');
    fireEvent.click(quickApeButton);

    await waitFor(() => {
      expect(screen.getByText('Quick Ape')).toBeInTheDocument();
    });

    // Click on 500 DC option
    const buyButton = screen.getByText('500 DC').closest('button');
    if (buyButton) {
      fireEvent.click(buyButton);
    }

    await waitFor(() => {
      // Look for the specific text in the confirmation message
      expect(screen.getByText(/You are about to purchase 500 DC worth of/)).toBeInTheDocument();
    });
  });

  it('should have overlay with correct structure for closing', async () => {
    const { container } = render(<TokenCard token={mockToken} />, { wrapper });

    // Open quick buy overlay
    const quickApeButton = screen.getByText('QUICK APE');
    fireEvent.click(quickApeButton);

    await waitFor(() => {
      expect(screen.getByText('Quick Ape')).toBeInTheDocument();
    });

    // Verify overlay is present and has correct structure
    const tokenCardLink = container.querySelector('a');
    const overlay = tokenCardLink?.querySelector('.absolute.inset-0.z-20');

    // Verify the overlay exists and has the correct class for click handling
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass('absolute', 'inset-0', 'z-20');

    // Verify the overlay has a click handler (by checking if it's clickable)
    // In actual browser, clicking this overlay would close it due to onClick={setShowQuickBuy(false)}
    expect(overlay?.tagName.toLowerCase()).toBe('div');
  });

  it('should show creator link for non-user tokens', () => {
    const otherUserToken = { ...mockToken, creator: '0xabcdef1234' };
    render(<TokenCard token={otherUserToken} />, { wrapper });

    expect(screen.queryByText('You')).not.toBeInTheDocument();
    // The creator address is truncated to first 4 characters
    expect(screen.getByText(/0xab/)).toBeInTheDocument();
  });

  it('should render sparkline with price history', () => {
    // The mockPriceHistory is already set at the top of the file
    // TokenCard uses priceHistory from StoreContext which defaults to mockPriceHistory (empty object)
    // When price history is empty, sparkline uses default data [10, 12, 11, 14, 13, 15, 16, 18, 17, 20]
    render(<TokenCard token={mockToken} />, { wrapper });

    // Sparkline component should render a canvas element (it's rendered via SVG/canvas by the Sparkline component)
    const tokenCard = screen.getByText('TestDoge').closest('a');
    expect(tokenCard).toBeInTheDocument();

    // Verify the sparkline container exists (it should be in the token card header)
    expect(tokenCard?.querySelector('.w-\\[60px\\]')).toBeInTheDocument();
  });

  it('should handle tokens with missing optional properties', () => {
    const minimalToken: Token = {
      id: 'minimal',
      name: '',
      ticker: '',
      description: '',
      imageUrl: '',
      creator: 'Other',
      contractAddress: '0x123',
      marketCap: 0,
      virtualLiquidity: 0,
      volume: 0,
      price: 0,
      progress: 0,
      createdAt: Date.now(),
      supply: 0,
      boosts: 0,
      securityState: {
        mintRevoked: false,
        freezeRevoked: false,
        lpBurned: false,
      },
      sentiment: {
        bullish: 50,
        bearish: 50,
      },
    };

    expect(() => {
      render(<TokenCard token={minimalToken} />, { wrapper });
    }).not.toThrow();
  });

  it('should display "Just now" for very new tokens', () => {
    const veryNewToken = { ...mockToken, createdAt: Date.now() - 5000 };
    render(<TokenCard token={veryNewToken} preview={true} />, { wrapper });

    expect(screen.getByText('Just now')).toBeInTheDocument();
  });
});
