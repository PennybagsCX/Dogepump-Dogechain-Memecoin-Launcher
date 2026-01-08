import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTokenSorting } from '../../../hooks/useTokenSorting';
import { Token } from '../../../types';

describe('useTokenSorting', () => {
  // Mock tokens for testing
  const mockTokens: Token[] = [
    {
      id: '1',
      name: 'DogeCoin',
      ticker: 'DOGE',
      description: 'Test token 1',
      imageUrl: 'https://example.com/image1.png',
      creator: 'You',
      contractAddress: '0x123',
      marketCap: 1000000,
      virtualLiquidity: 50000,
      volume: 100000,
      price: 0.5,
      progress: 85,
      createdAt: Date.now() - 1000 * 60 * 30, // 30 minutes ago
      supply: 1000000,
      boosts: 5,
      lastBoostedAt: Date.now() - 1000 * 60 * 2, // 2 minutes ago
      securityState: {
        mintRevoked: false,
        freezeRevoked: false,
        lpBurned: false,
      },
      sentiment: {
        bullish: 75,
        bearish: 25,
      },
    },
    {
      id: '2',
      name: 'ShibaInu',
      ticker: 'SHIB',
      description: 'Test token 2',
      imageUrl: 'https://example.com/image2.png',
      creator: 'Other',
      contractAddress: '0x456',
      marketCap: 500000,
      virtualLiquidity: 25000,
      volume: 50000,
      price: 0.3,
      progress: 60,
      createdAt: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
      supply: 1000000,
      boosts: 2,
      lastBoostedAt: Date.now() - 1000 * 60 * 10, // 10 minutes ago
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
    {
      id: '3',
      name: 'PepeCoin',
      ticker: 'PEPE',
      description: 'Test token 3',
      imageUrl: 'https://example.com/image3.png',
      creator: 'Other',
      contractAddress: '0x789',
      marketCap: 2000000,
      virtualLiquidity: 100000,
      volume: 200000,
      price: 0.8,
      progress: 100,
      createdAt: Date.now() - 1000 * 60 * 60 * 48, // 48 hours ago
      supply: 1000000,
      boosts: 10,
      lastBoostedAt: Date.now() - 1000 * 60 * 1, // 1 minute ago (recent!)
      securityState: {
        mintRevoked: false,
        freezeRevoked: false,
        lpBurned: false,
      },
      sentiment: {
        bullish: 80,
        bearish: 20,
      },
    },
    {
      id: '4',
      name: 'DelistedToken',
      ticker: 'BAD',
      description: 'Delisted token',
      imageUrl: 'https://example.com/image4.png',
      creator: 'Other',
      contractAddress: '0xabc',
      marketCap: 100000,
      virtualLiquidity: 5000,
      volume: 10000,
      price: 0.1,
      progress: 30,
      createdAt: Date.now() - 1000 * 60 * 60,
      supply: 1000000,
      boosts: 0,
      delisted: true, // This token is delisted
      delistedAt: Date.now(),
      delistedBy: 'admin',
      delistedReason: 'Scam',
      securityState: {
        mintRevoked: false,
        freezeRevoked: false,
        lpBurned: false,
      },
      sentiment: {
        bullish: 10,
        bearish: 90,
      },
    },
    {
      id: '5',
      name: 'LiveStreamToken',
      ticker: 'LIVE',
      description: 'Live streaming token',
      imageUrl: 'https://example.com/image5.png',
      creator: 'Other',
      contractAddress: '0xdef',
      marketCap: 300000,
      virtualLiquidity: 15000,
      volume: 30000,
      price: 0.4,
      progress: 45,
      createdAt: Date.now() - 1000 * 60 * 60 * 3,
      supply: 1000000,
      boosts: 3,
      isLive: true,
      streamViewers: 150,
      securityState: {
        mintRevoked: false,
        freezeRevoked: false,
        lpBurned: false,
      },
      sentiment: {
        bullish: 70,
        bearish: 30,
      },
    },
  ];

  it('should filter out delisted tokens', () => {
    const { result } = renderHook(() =>
      useTokenSorting({
        tokens: mockTokens,
        search: '',
        filter: 'trending',
        watchlist: [],
      })
    );

    expect(result.current.sortedTokens).toHaveLength(4);
    expect(result.current.sortedTokens.every(t => !t.delisted)).toBe(true);
  });

  it('should filter by search query (name)', () => {
    const { result } = renderHook(() =>
      useTokenSorting({
        tokens: mockTokens,
        search: 'Doge',
        filter: 'trending',
        watchlist: [],
      })
    );

    expect(result.current.sortedTokens).toHaveLength(1);
    expect(result.current.sortedTokens[0].name).toBe('DogeCoin');
  });

  it('should filter by search query (ticker)', () => {
    const { result } = renderHook(() =>
      useTokenSorting({
        tokens: mockTokens,
        search: 'SHIB',
        filter: 'trending',
        watchlist: [],
      })
    );

    expect(result.current.sortedTokens).toHaveLength(1);
    expect(result.current.sortedTokens[0].ticker).toBe('SHIB');
  });

  it('should filter by "created" filter', () => {
    const { result } = renderHook(() =>
      useTokenSorting({
        tokens: mockTokens,
        search: '',
        filter: 'created',
        watchlist: [],
      })
    );

    expect(result.current.sortedTokens).toHaveLength(1);
    expect(result.current.sortedTokens[0].creator).toBe('You');
  });

  it('should filter by "graduated" filter', () => {
    const { result } = renderHook(() =>
      useTokenSorting({
        tokens: mockTokens,
        search: '',
        filter: 'graduated',
        watchlist: [],
      })
    );

    expect(result.current.sortedTokens).toHaveLength(1);
    expect(result.current.sortedTokens[0].progress).toBeGreaterThanOrEqual(100);
  });

  it('should filter by "watchlist" filter', () => {
    const { result } = renderHook(() =>
      useTokenSorting({
        tokens: mockTokens,
        search: '',
        filter: 'watchlist',
        watchlist: ['1', '3'],
      })
    );

    expect(result.current.sortedTokens).toHaveLength(2);
    expect(result.current.sortedTokens.map(t => t.id).sort()).toEqual(['1', '3']);
  });

  it('should filter by "new" filter (tokens from last 24h)', () => {
    const { result } = renderHook(() =>
      useTokenSorting({
        tokens: mockTokens,
        search: '',
        filter: 'new',
        watchlist: [],
      })
    );

    // Token 1 (30 min ago), Token 2 (2h ago), Token 5 (3h ago) = 3 tokens
    // Token 3 is 48h ago (not new), Token 4 is delisted
    expect(result.current.sortedTokens).toHaveLength(3);
    expect(result.current.sortedTokens.every(t => {
      const age = Date.now() - t.createdAt;
      return age < 24 * 60 * 60 * 1000;
    })).toBe(true);
  });

  it('should filter by "live" filter', () => {
    const { result } = renderHook(() =>
      useTokenSorting({
        tokens: mockTokens,
        search: '',
        filter: 'live',
        watchlist: [],
      })
    );

    expect(result.current.sortedTokens).toHaveLength(1);
    expect(result.current.sortedTokens[0].isLive).toBe(true);
  });

  it('should sort trending tokens by recency of boosts/burns', () => {
    const { result } = renderHook(() =>
      useTokenSorting({
        tokens: mockTokens,
        search: '',
        filter: 'trending',
        watchlist: [],
      })
    );

    // PepeCoin should be first (boosted 1 minute ago)
    expect(result.current.sortedTokens[0].id).toBe('3');
    expect(result.current.sortedTokens[0].lastBoostedAt).toBeDefined();
  });

  it('should sort trending tokens by total boosts when not recent', () => {
    // Use tokens without recent boosts
    const tokensWithoutRecent = mockTokens.map(t => ({
      ...t,
      lastBoostedAt: undefined,
      lastBurnedAt: undefined,
    }));

    const { result } = renderHook(() =>
      useTokenSorting({
        tokens: tokensWithoutRecent,
        search: '',
        filter: 'trending',
        watchlist: [],
      })
    );

    // PepeCoin should still be first (most boosts: 10)
    expect(result.current.sortedTokens[0].id).toBe('3');
    expect(result.current.sortedTokens[0].boosts).toBe(10);
  });

  it('should sort live tokens by viewer count', () => {
    const liveTokens = [
      { ...mockTokens[4], streamViewers: 100 },
      { ...mockTokens[4], id: '6', streamViewers: 200, contractAddress: '0x666' },
      { ...mockTokens[4], id: '7', streamViewers: 50, contractAddress: '0x777' },
    ];

    const { result } = renderHook(() =>
      useTokenSorting({
        tokens: liveTokens,
        search: '',
        filter: 'live',
        watchlist: [],
      })
    );

    expect(result.current.sortedTokens[0].streamViewers).toBe(200);
    expect(result.current.sortedTokens[1].streamViewers).toBe(100);
    expect(result.current.sortedTokens[2].streamViewers).toBe(50);
  });

  it('should sort new tokens by creation time', () => {
    const { result } = renderHook(() =>
      useTokenSorting({
        tokens: mockTokens,
        search: '',
        filter: 'new',
        watchlist: [],
      })
    );

    // Should be sorted by createdAt descending (newest first)
    for (let i = 0; i < result.current.sortedTokens.length - 1; i++) {
      expect(result.current.sortedTokens[i].createdAt).toBeGreaterThanOrEqual(
        result.current.sortedTokens[i + 1].createdAt
      );
    }
  });

  it('should handle empty tokens array', () => {
    const { result } = renderHook(() =>
      useTokenSorting({
        tokens: [],
        search: '',
        filter: 'trending',
        watchlist: [],
      })
    );

    expect(result.current.sortedTokens).toHaveLength(0);
  });

  it('should handle null tokens', () => {
    const { result } = renderHook(() =>
      useTokenSorting({
        tokens: null as any,
        search: '',
        filter: 'trending',
        watchlist: [],
      })
    );

    expect(result.current.sortedTokens).toHaveLength(0);
  });

  it('should be case-insensitive for search', () => {
    const { result } = renderHook(() =>
      useTokenSorting({
        tokens: mockTokens,
        search: 'dogecoin',
        filter: 'trending',
        watchlist: [],
      })
    );

    expect(result.current.sortedTokens).toHaveLength(1);
    expect(result.current.sortedTokens[0].name).toBe('DogeCoin');
  });

  it('should handle search with spaces', () => {
    const { result } = renderHook(() =>
      useTokenSorting({
        tokens: mockTokens,
        search: '  Shiba  ',
        filter: 'trending',
        watchlist: [],
      })
    );

    expect(result.current.sortedTokens).toHaveLength(1);
    expect(result.current.sortedTokens[0].name).toBe('ShibaInu');
  });
});
