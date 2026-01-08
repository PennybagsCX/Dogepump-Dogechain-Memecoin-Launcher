/**
 * Render Utilities for DEX Component Testing
 *
 * This file provides helper functions for rendering DEX components with
 * proper providers and mock contexts for testing.
 */import { ReactElement } from 'react';
import React from 'react';
import { render, RenderOptions, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, expect } from 'vitest';
import { DexContext, DexContextType } from '@/contexts/DexContext';
import { StoreContext, StoreContextType } from '@/contexts/StoreContext';
import { ethers } from 'ethers';

// ============================================================================
// Mock Data Generators
// ============================================================================

/**
 * Generate mock token data
 */
export const mockTokens = [
  {
    address: '0x1234567890123456789012345678901234567890',
    symbol: 'DC',
    name: 'DogeCoin',
    decimals: 18,
    logoURI: '/images/tokens/dc.png',
    balance: '1000000000000000000000', // 1000 DC
    price: 0.05,
  },
  {
    address: '0x0987654321098765432109876543210987654321',
    symbol: 'wDOGE',
    name: 'Wrapped Doge',
    decimals: 18,
    logoURI: '/images/tokens/wdoge.png',
    balance: '5000000000000000000000', // 5000 wDOGE
    price: 0.12,
  },
  {
    address: '0xabcdef1234567890abcdef1234567890abcdef12',
    symbol: 'PEPE',
    name: 'Pepe',
    decimals: 18,
    logoURI: '/images/tokens/pepe.png',
    balance: '100000000000000000000000', // 100000 PEPE
    price: 0.000001,
  },
];

/**
 * Generate mock pool data
 */
export const mockPools = [
  {
    address: '0xpool123456789012345678901234567890123456',
    tokenA: mockTokens[0],
    tokenB: mockTokens[1],
    reserve0: '10000000000000000000000', // 10000 DC
    reserve1: '5000000000000000000000', // 5000 wDOGE
    totalSupply: '7071067811865475244000', // ~7071 LP tokens
    tvl: 1100, // $1100
    volume24h: 150, // $150
    apy: 15.5, // 15.5%
    fee: 0.003, // 0.3%
    price0: 0.5, // 1 DC = 0.5 wDOGE
    price1: 2, // 1 wDOGE = 2 DC
  },
  {
    address: '0xpool987654321098765432109876543210987654',
    tokenA: mockTokens[1],
    tokenB: mockTokens[2],
    reserve0: '2000000000000000000000', // 2000 wDOGE
    reserve1: '200000000000000000000000', // 200000 PEPE
    totalSupply: '20000000000000000000000', // 20000 LP tokens
    tvl: 240, // $240
    volume24h: 30, // $30
    apy: 8.2, // 8.2%
    fee: 0.003, // 0.3%
    price0: 100, // 1 wDOGE = 100 PEPE
    price1: 0.01, // 1 PEPE = 0.01 wDOGE
  },
];

/**
 * Generate mock wallet data
 */
export const mockWallet = {
  address: '0xWallet123456789012345678901234567890123456',
  isConnected: true,
  chainId: 1,
  balance: '1000000000000000000000', // 1 ETH
};

/**
 * Generate mock swap route data
 */
export const mockSwapRoute = {
  path: [mockTokens[0], mockTokens[1]],
  amounts: ['1000000000000000000', '500000000000000000'], // 1 DC -> 0.5 wDOGE
  outputAmount: '500000000000000000', // 0.5 wDOGE
  priceImpact: 0.002, // 0.2%
  gasEstimate: '150000', // 150k gas
  gasCost: '0.0003', // 0.0003 ETH
  gasCostUSD: 0.12, // $0.12
};

/**
 * Generate mock transaction data
 */
export const mockTransaction = {
  id: 'tx_1234567890',
  hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  type: 'swap' as const,
  status: 'pending' as const,
  fromToken: mockTokens[0],
  toToken: mockTokens[1],
  amountIn: '1000000000000000000', // 1 DC
  amountOut: '500000000000000000', // 0.5 wDOGE
  timestamp: Date.now(),
  gasPrice: '20000000000', // 20 gwei
  gasLimit: '150000',
  nonce: 42,
};

// ============================================================================
// Mock Context Values
// ============================================================================

/**
 * Create a mock DexContext value
 */
export const createMockDexContext = (overrides?: Partial<DexContextType>): DexContextType => ({
  selectedTokenA: mockTokens[0],
  selectedTokenB: mockTokens[1],
  pools: mockPools,
  swapRoute: mockSwapRoute as any, // Mock route structure differs slightly from SwapRoute type
  priceImpact: 0.002,
  settings: {
    slippage: 0.5, // 0.5%
    deadline: 20, // 20 minutes
    expertMode: false,
    soundsEnabled: true,
    notificationsEnabled: true,
  },
  isLoading: false,
  error: null,
  setSelectedTokenA: vi.fn(),
  setSelectedTokenB: vi.fn(),
  setAmountIn: vi.fn(),
  setAmountOut: vi.fn(),
  swapTokens: vi.fn(),
  addLiquidity: vi.fn(),
  removeLiquidity: vi.fn(),
  calculateSwapOutput: vi.fn(),
  clearError: vi.fn(),
  updateSettings: vi.fn(),
  resetSettings: vi.fn(),
  ...overrides,
} as any); // Mock context may not perfectly match DexContextType

/**
 * Create a mock StoreContext value
 */
export const createMockStoreContext = (overrides?: Partial<StoreContextType>): StoreContextType => ({
  // wallet: mockWallet, // StoreContextType doesn't have wallet property
  tokens: mockTokens as any, // DEX tokens have different structure than main Token type
  // pools: mockPools, // StoreContextType doesn't have pools property
  // transactions: [mockTransaction], // StoreContextType doesn't have transactions property
  // updateWallet: vi.fn(), // StoreContextType doesn't have updateWallet method
  // updateTokens: vi.fn(), // StoreContextType doesn't have updateTokens method
  // updatePools: vi.fn(), // StoreContextType doesn't have updatePools method
  // updateTransactions: vi.fn(), // StoreContextType doesn't have updateTransactions method
  // Minimal required properties for StoreContextType
  trades: [],
  comments: [],
  myHoldings: [],
  lockedAssets: [],
  activeOrders: [],
  priceAlerts: [],
  farmPositions: [],
  tokenOwnerFarms: [],
  tokenOwnerFarmPositions: [],
  copyTargets: [],
  userBalanceDC: 0,
  priceHistory: {},
  watchlist: [],
  notifications: [],
  unreadCount: 0,
  lightboxImage: null,
  userProfile: {
    username: '',
    bio: '',
    avatarUrl: '',
    badges: [],
    karma: 0,
  },
  setNotifications: vi.fn(),
  settings: {
    slippage: '1',
    fastMode: false,
    audioEnabled: true,
    notificationsEnabled: true,
  },
  marketEvent: null,
  recentlyUnlockedBadge: null,
  networkStats: {
    blockHeight: 0,
    gasPrice: 0,
    tps: 0,
    lastUpdated: 0,
  },
  userAddress: null,
  reactionStats: {},
  userReactions: {},
  reports: [],
  adminActions: [],
  bannedUsers: [],
  warnedUsers: [],
  ...overrides,
} as any); // Mock context may not perfectly match StoreContextType

// ============================================================================
// Custom Render Functions
// ============================================================================

/**
 * Render options with DexProvider
 */
interface DexRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  dexContext?: Partial<DexContextType>;
  storeContext?: Partial<StoreContextType>;
}

/**
 * Render a component with DexProvider and StoreProvider
 */
export const renderWithProviders = (
  ui: ReactElement,
  { dexContext, storeContext, ...renderOptions }: DexRenderOptions = {}
) => {
  const mockDexValue = createMockDexContext(dexContext);
  const mockStoreValue = createMockStoreContext(storeContext);

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <StoreContext.Provider value={mockStoreValue}>
      <DexContext.Provider value={mockDexValue}>
        {children}
      </DexContext.Provider>
    </StoreContext.Provider>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    mockDexValue,
    mockStoreValue,
  };
};

/**
 * Render a component with only DexProvider
 */
export const renderWithDexProvider = (
  ui: ReactElement,
  { dexContext, ...renderOptions }: Omit<DexRenderOptions, 'storeContext'> = {}
) => {
  const mockDexValue = createMockDexContext(dexContext);

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <DexContext.Provider value={mockDexValue}>
      {children}
    </DexContext.Provider>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    mockDexValue,
  };
};

// ============================================================================
// Element Helpers
// ============================================================================

/**
 * Find a button by its text content
 */
export const findButtonByText = (text: string | RegExp) => {
  return screen.getByRole('button', { name: text });
};

/**
 * Find an input by its label
 */
export const findInputByLabel = (label: string | RegExp) => {
  return screen.getByLabelText(label);
};

/**
 * Find a text element by its content
 */
export const findByText = (text: string | RegExp) => {
  return screen.getByText(text);
};

/**
 * Find an element by its test ID
 */
export const findByTestId = (testId: string) => {
  return screen.getByTestId(testId);
};

/**
 * Find all elements by their role
 */
export const findAllByRole = (role: string) => {
  return screen.getAllByRole(role);
};

/**
 * Find all buttons by their text content
 */
export const findAllButtonsByText = (text: string | RegExp) => {
  return screen.getAllByRole('button', { name: text });
};

// ============================================================================
// Interaction Helpers
// ============================================================================

/**
 * Click a button by its text content
 */
export const clickButtonByText = async (text: string | RegExp) => {
  const button = findButtonByText(text);
  await userEvent.click(button);
};

/**
 * Type into an input by its label
 */
export const typeIntoInput = async (label: string | RegExp, value: string) => {
  const input = findInputByLabel(label);
  await userEvent.clear(input);
  await userEvent.type(input, value);
};

/**
 * Select an option from a select element
 */
export const selectOption = async (label: string | RegExp, option: string) => {
  const select = findInputByLabel(label);
  await userEvent.selectOptions(select, option);
};

/**
 * Click an element by its test ID
 */
export const clickByTestId = async (testId: string) => {
  const element = findByTestId(testId);
  await userEvent.click(element);
};

/**
 * Wait for an element to appear
 */
export const waitForElement = async (
  query: () => HTMLElement,
  timeout = 5000
) => {
  return await waitFor(query, { timeout });
};

/**
 * Wait for text to appear
 */
export const waitForText = async (text: string | RegExp, timeout = 5000) => {
  return await waitFor(() => screen.findByText(text), { timeout });
};

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Assert that an element is visible
 */
export const assertVisible = (element: HTMLElement) => {
  expect(element).toBeVisible();
};

/**
 * Assert that an element is not visible
 */
export const assertNotVisible = (element: HTMLElement) => {
  expect(element).not.toBeVisible();
};

/**
 * Assert that an element is disabled
 */
export const assertDisabled = (element: HTMLElement) => {
  expect(element).toBeDisabled();
};

/**
 * Assert that an element is enabled
 */
export const assertEnabled = (element: HTMLElement) => {
  expect(element).not.toBeDisabled();
};

/**
 * Assert that text is present in the document
 */
export const assertTextPresent = (text: string | RegExp) => {
  expect(screen.getByText(text)).toBeInTheDocument();
};

/**
 * Assert that text is not present in the document
 */
export const assertTextNotPresent = (text: string | RegExp) => {
  expect(screen.queryByText(text)).not.toBeInTheDocument();
};

/**
 * Assert that an element has a specific attribute
 */
export const assertHasAttribute = (
  element: HTMLElement,
  attribute: string,
  value?: string
) => {
  if (value !== undefined) {
    expect(element).toHaveAttribute(attribute, value);
  } else {
    expect(element).toHaveAttribute(attribute);
  }
};

/**
 * Assert that an element has a specific class
 */
export const assertHasClass = (element: HTMLElement, className: string) => {
  expect(element).toHaveClass(className);
};

// ============================================================================
// Accessibility Helpers
// ============================================================================

/**
 * Assert that an element has proper ARIA label
 */
export const assertAriaLabel = (element: HTMLElement, label: string) => {
  expect(element).toHaveAttribute('aria-label', label);
};

/**
 * Assert that an element is focusable
 */
export const assertFocusable = (element: HTMLElement) => {
  const tagName = element.tagName.toLowerCase();
  const focusableTags = ['button', 'input', 'select', 'textarea', 'a'];
  expect(focusableTags).toContain(tagName);
  expect(element).not.toHaveAttribute('disabled');
};

/**
 * Assert that an element has proper keyboard navigation
 */
export const assertKeyboardNavigable = (element: HTMLElement) => {
  expect(element).toHaveAttribute('tabindex');
};

// ============================================================================
// Mock Functions
// ============================================================================

/**
 * Create a mock contract
 */
export const createMockContract = (address: string) => {
  return {
    address,
    interface: new ethers.Interface([]),
    connect: vi.fn().mockReturnThis(),
    attach: vi.fn().mockReturnThis(),
    functions: {},
    callStatic: {},
    estimateGas: {},
    populateTransaction: {},
    staticCall: {},
  };
};

/**
 * Create a mock provider
 */
export const createMockProvider = () => {
  return {
    getNetwork: vi.fn().mockResolvedValue({ chainId: 1 }),
    getBalance: vi.fn().mockResolvedValue('1000000000000000000'),
    getBlockNumber: vi.fn().mockResolvedValue(12345),
    getTransaction: vi.fn().mockResolvedValue(null),
    getTransactionReceipt: vi.fn().mockResolvedValue(null),
    getCode: vi.fn().mockResolvedValue('0x'),
    sendTransaction: vi.fn().mockResolvedValue('0xhash'),
  };
};

/**
 * Create a mock signer
 */
export const createMockSigner = () => {
  return {
    getAddress: vi.fn().mockReturnValue(mockWallet.address),
    getBalance: vi.fn().mockResolvedValue('1000000000000000000'),
    signMessage: vi.fn().mockResolvedValue('0xsignature'),
    signTransaction: vi.fn().mockResolvedValue('0xsignature'),
    sendTransaction: vi.fn().mockResolvedValue('0xhash'),
  };
};

// ============================================================================
// Sound Mocks
// ============================================================================

/**
 * Mock sound playing function
 */
export const mockPlaySound = vi.fn();

/**
 * Setup sound mocks
 */
export const setupSoundMocks = () => {
  vi.mock('../../utils/sound', () => ({
    playSound: mockPlaySound,
  }));
};

/**
 * Reset sound mocks
 */
export const resetSoundMocks = () => {
  mockPlaySound.mockReset();
};

// ============================================================================
// Toast Mocks
// ============================================================================

/**
 * Mock toast notification function
 */
export const mockShowToast = vi.fn();

/**
 * Setup toast mocks
 */
export const setupToastMocks = () => {
  vi.mock('../../components/Toast', () => ({
    showToast: mockShowToast,
  }));
};

/**
 * Reset toast mocks
 */
export const resetToastMocks = () => {
  mockShowToast.mockReset();
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Wait for a specified amount of time
 */
export const wait = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Create a delay in tests
 */
export const delay = async (ms: number) => {
  await act(async () => {
    await wait(ms);
  });
};

/**
 * Format a number as USD
 */
export const formatUSD = (value: number): string => {
  if (value === 0) return '$0';
  if (value < 0.01) return '<$0.01';
  if (value < 1) return `$${value.toFixed(4)}`;
  if (value < 1000) return `$${value.toFixed(2)}`;
  if (value < 1000000) return `$${(value / 1000).toFixed(2)}K`;
  if (value < 1000000000) return `$${(value / 1000000).toFixed(2)}M`;
  return `$${(value / 1000000000).toFixed(2)}B`;
};

/**
 * Format a number as a percentage
 */
export const formatPercent = (value: number): string => {
  return `${(value * 100).toFixed(2)}%`;
};

/**
 * Format a token amount
 */
export const formatTokenAmount = (
  amount: string,
  decimals: number,
  symbol: string
): string => {
  const value = ethers.formatUnits(amount, decimals);
  return `${parseFloat(value).toFixed(6)} ${symbol}`;
};

// ============================================================================
// Re-exports
// ============================================================================

export { screen, waitFor, act } from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
