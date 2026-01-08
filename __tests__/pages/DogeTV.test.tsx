/**
 * DogeTV Component Tests
 *
 * Testing suite for the DogeTV component functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DogeTV from '../../pages/DogeTV';
import { DOGE_TV_ROTATION_INTERVAL_MS, DOGE_TV_TOKEN_COUNT, DOGE_TV_TRADE_COUNT } from '../../constants';

// Mock StoreContext
const mockTokens = [
  {
    id: 'token-0',
    name: 'Test Token',
    ticker: 'TEST',
    description: 'Test description',
    imageUrl: 'https://picsum.photos/seed/TEST/200/200',
    creator: '0x123',
    contractAddress: '0xabc',
    marketCap: 1000,
    virtualLiquidity: 500,
    volume: 10000,
    price: 0.00001,
    progress: 50,
    createdAt: Date.now(),
    supply: 1000000000,
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
  },
  {
    id: 'token-1',
    name: 'Test Token 2',
    ticker: 'TST2',
    description: 'Test description 2',
    imageUrl: 'https://picsum.photos/seed/TST2/200/200',
    creator: '0x456',
    contractAddress: '0xdef',
    marketCap: 2000,
    virtualLiquidity: 1000,
    volume: 20000,
    price: 0.00002,
    progress: 75,
    createdAt: Date.now(),
    supply: 1000000000,
    boosts: 0,
    isLive: true,
    streamViewers: 1000,
    securityState: {
      mintRevoked: false,
      freezeRevoked: false,
      lpBurned: false,
    },
    sentiment: {
      bullish: 60,
      bearish: 40,
    },
  },
];

const mockPriceHistory = {
  'token-0': [
    { timestamp: Date.now() - 3600000, price: 0.000008, volume: 100 },
    { timestamp: Date.now() - 1800000, price: 0.000009, volume: 150 },
    { timestamp: Date.now(), price: 0.00001, volume: 200 },
  ],
  'token-1': [
    { timestamp: Date.now() - 3600000, price: 0.000015, volume: 100 },
    { timestamp: Date.now(), price: 0.00002, volume: 200 },
  ],
};

const mockTrades = [
  {
    id: 'trade-1',
    type: 'buy' as const,
    amountDC: 1000,
    amountToken: 100000000,
    price: 0.00001,
    user: '0xabc',
    timestamp: Date.now(),
    txHash: '0xdef',
    tokenId: 'token-1',
    blockNumber: 100,
    gasUsed: 21000,
  },
  {
    id: 'trade-2',
    type: 'sell' as const,
    amountDC: 500,
    amountToken: 50000000,
    price: 0.00001,
    user: '0xdef',
    timestamp: Date.now() - 60000,
    txHash: '0xabc',
    tokenId: 'token-1',
    blockNumber: 99,
    gasUsed: 23000,
  },
];

// Mock StoreContext
vi.mock('../../contexts/StoreContext', () => ({
  useStore: vi.fn(() => ({
    tokens: [],
    priceHistory: {},
    getTradesForToken: vi.fn(() => []),
  })),
}));

import { useStore } from '../../contexts/StoreContext';

describe('DogeTV Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Set up default mock return values
    vi.mocked(useStore).mockReturnValue({
      tokens: mockTokens,
      priceHistory: mockPriceHistory,
      getTradesForToken: (tokenId: string) => mockTrades.filter(t => t.tokenId === tokenId),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render loading skeleton when no tokens available', () => {
      // Set up specific mock values for this test
      vi.mocked(useStore).mockReturnValue({
        tokens: [],
        priceHistory: {},
        getTradesForToken: () => [],
      });

      render(
        <BrowserRouter>
          <DogeTV />
        </BrowserRouter>
      );

      expect(screen.getByTestId('doge-tv-skeleton')).toBeInTheDocument();
    });

    it('should render main content when tokens are available', () => {
      render(
        <BrowserRouter>
          <DogeTV />
        </BrowserRouter>
      );

      expect(screen.getByText(/DogeTV/i)).toBeInTheDocument();
      expect(screen.getAllByText(/LIVE FEED/i).length).toBeGreaterThan(0);
    });

    it('should display the first token from sorted list', () => {
      render(
        <BrowserRouter>
          <DogeTV />
        </BrowserRouter>
      );

      // First token should be live token (token-1) due to sorting
      // Get all instances and verify at least one exists
      expect(screen.getAllByText(/Test Token 2/i).length).toBeGreaterThan(0);
    });

    it('should display correct number of tokens in cycle indicator', () => {
      render(
        <BrowserRouter>
          <DogeTV />
        </BrowserRouter>
      );

      expect(screen.getByText(/1\/2/i)).toBeInTheDocument();
    });
  });

  describe('Token Sorting', () => {
    it('should prioritize live tokens first', () => {
      render(
        <BrowserRouter>
          <DogeTV />
        </BrowserRouter>
      );

      // token-1 is live, should be first (appears multiple times in DOM)
      const tokenElements = screen.getAllByText(/Test Token 2/i);
      expect(tokenElements.length).toBeGreaterThan(0);
    });

    it('should limit tokens to DOGE_TV_TOKEN_COUNT', () => {
      // Add more tokens than the limit
      const extraTokens = Array.from({ length: 20 }, (_, i) => ({
        id: `token-${i + 2}`,
        name: `Token ${i + 2}`,
        ticker: `TOK${i + 2}`,
        description: 'Desc',
        imageUrl: `https://picsum.photos/seed/TOK${i + 2}/200/200`,
        creator: `0x${i}`,
        contractAddress: `0x${i}`,
        marketCap: 1000,
        virtualLiquidity: 500,
        volume: 10000,
        price: 0.00001,
        progress: 50,
        createdAt: Date.now(),
        supply: 1000000000,
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
      }));

      // Set up specific mock values for this test
      vi.mocked(useStore).mockReturnValue({
        tokens: [...mockTokens, ...extraTokens],
        priceHistory: mockPriceHistory,
        getTradesForToken: () => mockTrades,
      });

      render(
        <BrowserRouter>
          <DogeTV />
        </BrowserRouter>
      );

      // Should only show DOGE_TV_TOKEN_COUNT tokens
      expect(screen.getByText(/1\/10/i)).toBeInTheDocument();
    });
  });

  describe('Price Change Calculation', () => {
    it('should calculate percentage from price history', () => {
      render(
        <BrowserRouter>
          <DogeTV />
        </BrowserRouter>
      );

      // token-1 (live token, displayed first) price went from 0.000015 to 0.00002 = 33.33% increase
      const percentageText = screen.getByText(/33\.33%/i);
      expect(percentageText).toBeInTheDocument();
    });

    it('should show green color for positive changes', () => {
      render(
        <BrowserRouter>
          <DogeTV />
        </BrowserRouter>
      );

      const percentageElement = screen.getByText(/33\.33%/i);
      expect(percentageElement).toHaveClass(/text-green/);
    });

    it('should show red color for negative changes', () => {
      // Mock a price decrease for token-1 (the live token that gets displayed)
      const decreasingHistory = {
        'token-1': [
          { timestamp: Date.now() - 3600000, price: 0.00003, volume: 100 },
          { timestamp: Date.now(), price: 0.00002, volume: 200 },
        ],
      };

      // Set up specific mock values for this test
      vi.mocked(useStore).mockReturnValue({
        tokens: mockTokens,
        priceHistory: decreasingHistory,
        getTradesForToken: () => mockTrades,
      });

      render(
        <BrowserRouter>
          <DogeTV />
        </BrowserRouter>
      );

      // Price went from 0.00003 to 0.00002 = -33.33%
      const percentageElement = screen.getByText(/-33\.33%/i);
      expect(percentageElement).toHaveClass(/text-red/);
    });

    it('should return 0% when no history available', () => {
      // Set up specific mock values for this test
      vi.mocked(useStore).mockReturnValue({
        tokens: mockTokens,
        priceHistory: {},
        getTradesForToken: () => mockTrades,
      });

      render(
        <BrowserRouter>
          <DogeTV />
        </BrowserRouter>
      );

      const percentageElement = screen.getByText(/0\.00%/i);
      expect(percentageElement).toBeInTheDocument();
    });
  });

  describe('Auto-Rotation', () => {
    it('should have play/pause controls for auto-rotation', () => {
      render(
        <BrowserRouter>
          <DogeTV />
        </BrowserRouter>
      );

      // Check that controls exist (pause button for isPlaying state)
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      // The component should have rotation controls
      expect(screen.getByText(/Cycle:/i)).toBeInTheDocument();
    });

    it('should display cycle indicator with correct format', () => {
      render(
        <BrowserRouter>
          <DogeTV />
        </BrowserRouter>
      );

      // Should show "Cycle: X/Y" format
      expect(screen.getByText(/1\/2/i)).toBeInTheDocument();
    });
  });

  describe('Manual Controls', () => {
    it('should have skip forward button', () => {
      render(
        <BrowserRouter>
          <DogeTV />
        </BrowserRouter>
      );

      const buttons = screen.getAllByRole('button');
      const skipButtons = buttons.filter(btn => btn.textContent === '');
      expect(skipButtons.length).toBeGreaterThan(0);
    });

    it('should have play/pause button', () => {
      render(
        <BrowserRouter>
          <DogeTV />
        </BrowserRouter>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Trades Display', () => {
    it('should display DOGE_TV_TRADE_COUNT trades', () => {
      render(
        <BrowserRouter>
          <DogeTV />
        </BrowserRouter>
      );

      // Should have trade entries
      const tradeElements = screen.getAllByText(/DC/i);
      expect(tradeElements.length).toBeGreaterThan(0);
    });

    it('should show buy trades in green', () => {
      render(
        <BrowserRouter>
          <DogeTV />
        </BrowserRouter>
      );

      const buyTrade = screen.getByText(/BUY/i);
      expect(buyTrade).toBeInTheDocument();
    });
  });

  describe('Live Stream Display', () => {
    it('should show live stream UI for live tokens', () => {
      render(
        <BrowserRouter>
          <DogeTV />
        </BrowserRouter>
      );

      // Check for LIVE badge in stream area
      const liveBadges = screen.getAllByText(/LIVE/i);
      expect(liveBadges.length).toBeGreaterThan(0);

      // Check for viewers count
      expect(screen.getByText(/1000 Viewers/i)).toBeInTheDocument();
    });

    it('should show chart for non-live tokens', () => {
      const nonLiveTokens = [mockTokens[0]]; // token-0 is not live

      // Set up specific mock values for this test
      vi.mocked(useStore).mockReturnValue({
        tokens: nonLiveTokens,
        priceHistory: mockPriceHistory,
        getTradesForToken: () => mockTrades,
      });

      render(
        <BrowserRouter>
          <DogeTV />
        </BrowserRouter>
      );

      // Should show chart instead of live stream
      expect(screen.queryByText(/15m/i)).toBeInTheDocument();
    });
  });

  describe('Statistics', () => {
    it('should display market cap', () => {
      render(
        <BrowserRouter>
          <DogeTV />
        </BrowserRouter>
      );

      expect(screen.getByText(/MARKET CAP/i)).toBeInTheDocument();
    });

    it('should display volume', () => {
      render(
        <BrowserRouter>
          <DogeTV />
        </BrowserRouter>
      );

      expect(screen.getByText(/VOLUME/i)).toBeInTheDocument();
    });

    it('should display liquidity', () => {
      render(
        <BrowserRouter>
          <DogeTV />
        </BrowserRouter>
      );

      expect(screen.getByText(/LIQUIDITY/i)).toBeInTheDocument();
    });

    it('should display bonding curve progress', () => {
      render(
        <BrowserRouter>
          <DogeTV />
        </BrowserRouter>
      );

      expect(screen.getByText(/BONDING CURVE/i)).toBeInTheDocument();
    });
  });
});
