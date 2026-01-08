/**
 * DEX Test Utilities
 *
 * Provides test utilities for DEX components including:
 * - renderWithProviders: Renders components with all necessary context providers
 * - Mock data: Tokens, pools, and positions for testing
 */
import React, { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from '../../Toast';
import { DexProvider, DexContextType } from '@/contexts/DexContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { StoreProvider } from '@/contexts/StoreContext';

// Import types from DexContext
import type { Token, Pool } from '@/contexts/DexContext';

// Mock tokens
export const mockTokens: Token[] = [
  {
    address: '0x1234567890123456789012345678901234567890',
    symbol: 'DC',
    name: 'DogeChain',
    decimals: 18,
    logoURI: 'https://example.com/dc.png',
    balance: '1000000000000000000000',
    price: 0.00001,
  },
  {
    address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    logoURI: 'https://example.com/eth.png',
    balance: '500000000000000000000',
    price: 3000,
  },
  {
    address: '0x9876543210987654321098765432109876543210',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logoURI: 'https://example.com/usdc.png',
    balance: '1000000000',
    price: 1,
  },
];

// Mock pools
export const mockPools: Pool[] = [
  {
    address: '0xPool123456789012345678901234567890123456789',
    tokenA: mockTokens[0],
    tokenB: mockTokens[1],
    reserve0: '1000000000000000000000',
    reserve1: '500000000000000000000',
    totalSupply: '1500000000000000000000',
    tvl: 1500,
    volume24h: 50000,
    apy: 12.5,
    fee: 0.3,
    price0: 0.5,
    price1: 2,
  },
  {
    address: '0xPoolabcdefabcdefabcdefabcdefabcdefabcdef',
    tokenA: mockTokens[1],
    tokenB: mockTokens[2],
    reserve0: '100000000000000000000',
    reserve1: '300000000000',
    totalSupply: '400000000000000000000',
    tvl: 400,
    volume24h: 20000,
    apy: 8.5,
    fee: 0.3,
    price0: 0.001,
    price1: 1000,
  },
];

/**
 * Creates a mock DexContext value for testing
 */
export const createMockDexContext = (overrides?: Partial<DexContextType>): DexContextType => ({
  // State
  pools: mockPools,
  selectedPool: mockPools[0],
  selectedTokenA: mockTokens[0],
  selectedTokenB: mockTokens[1],
  amountIn: '',
  amountOut: '',
  swapRoute: null,
  priceImpact: 0,
  transactions: [],
  liquidityPositions: [],
  settings: {
    slippage: 0.5,
    deadline: 20,
    expertMode: false,
    soundsEnabled: true,
    notificationsEnabled: true,
  },
  isLoading: false,
  error: null,

  // Actions
  setSelectedPool: vi.fn(),
  setSelectedTokenA: vi.fn(),
  setSelectedTokenB: vi.fn(),
  setAmountIn: vi.fn(),
  setAmountOut: vi.fn(),
  swapTokens: vi.fn().mockResolvedValue(undefined),
  addLiquidity: vi.fn().mockResolvedValue(undefined),
  removeLiquidity: vi.fn().mockResolvedValue(undefined),
  updateSettings: vi.fn(),
  resetSettings: vi.fn(),
  loadPools: vi.fn().mockResolvedValue(undefined),
  loadPoolDetails: vi.fn().mockResolvedValue(undefined),
  calculateSwapOutput: vi.fn().mockResolvedValue({
    path: ['0x123', '0xabc'],
    outputAmount: '1000000',
    priceImpact: 0.1,
    gasEstimate: '100000',
  }),
  cancelTransaction: vi.fn().mockResolvedValue(undefined),
  speedUpTransaction: vi.fn().mockResolvedValue(undefined),
  clearError: vi.fn(),
  getLiquidityPositions: vi.fn().mockReturnValue([]),

  ...overrides,
});

/**
 * Renders a component with all necessary providers
 *
 * @param ui - The React element to render
 * @param dexContextValue - Optional mock DexContext value
 * @returns The rendered component with testing utilities
 */
export function renderWithProviders(
  ui: ReactElement,
  dexContextValue?: DexContextType
) {
  // Create a wrapper component with all providers
  const AllProviders = ({ children }: { children: React.ReactNode }) => {
    const mockDexValue = dexContextValue || createMockDexContext();

    return (
      <BrowserRouter>
        <ToastProvider>
          <StoreProvider>
            <AuthProvider>
              <DexProvider value={mockDexValue}>
                {children}
              </DexProvider>
            </AuthProvider>
          </StoreProvider>
        </ToastProvider>
      </BrowserRouter>
    );
  };

  return {
    ...render(ui, { wrapper: AllProviders }),
  };
}

/**
 * Mocks the useDex hook for testing
 */
export const mockUseDex = (overrides?: Partial<DexContextType>) => {
  const mockValue = createMockDexContext(overrides);

  vi.mock('../../../contexts/DexContext', async () => {
    const actual = await vi.importActual<any>('../../../contexts/DexContext');
    return {
      ...actual,
      useDex: () => mockValue,
    };
  });

  return mockValue;
};
