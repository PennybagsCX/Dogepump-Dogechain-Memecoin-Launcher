import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { DUMMY_POOLS, DUMMY_TOKENS, DUMMY_LIQUIDITY_POSITIONS } from '../services/dex/dummyData';
import ContractService from '../services/dex/ContractService';
import { getReadOnlyProvider, Web3State, subscribeToWeb3 } from '../services/web3Service';
import { TOKENS } from '../constants';

// Types
export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  balance?: string;
  price?: number;
}

export interface Pool {
  address: string;
  tokenA: Token;
  tokenB: Token;
  reserve0: string;
  reserve1: string;
  totalSupply: string;
  tvl: number;
  volume24h: number;
  apy: number;
  fee: number;
  price0: number;
  price1: number;
}

export interface SwapRoute {
  path: string[];
  outputAmount: string;
  priceImpact: number;
  gasEstimate: string;
}

export interface Transaction {
  id: string;
  type: 'swap' | 'add_liquidity' | 'remove_liquidity';
  status: 'pending' | 'confirmed' | 'failed' | 'cancelled';
  hash?: string;
  from?: Token;
  to?: Token;
  amountIn?: string;
  amountOut?: string;
  timestamp: number;
  gasUsed?: string;
  gasPrice?: string;
}

export interface DexSettings {
  slippage: number;
  deadline: number;
  expertMode: boolean;
  soundsEnabled: boolean;
  notificationsEnabled: boolean;
}

export interface LiquidityPosition {
  pool: Pool;
  lpTokens: string;
  poolShare: number;
  valueUSD: number;
  unclaimedFees?: string;
}

export interface DexContextType {
  // State
  pools: Pool[];
  selectedPool: Pool | null;
  selectedTokenA: Token | null;
  selectedTokenB: Token | null;
  amountIn: string;
  amountOut: string;
  swapRoute: SwapRoute | null;
  priceImpact: number;
  transactions: Transaction[];
  liquidityPositions: LiquidityPosition[];
  settings: DexSettings;
  isLoading: boolean;
  error: string | null;

  // Actions
  setSelectedPool: (pool: Pool | null) => void;
  setSelectedTokenA: (token: Token | null) => void;
  setSelectedTokenB: (token: Token | null) => void;
  setAmountIn: (amount: string) => void;
  setAmountOut: (amount: string) => void;
  swapTokens: () => Promise<void>;
  addLiquidity: (amountA: string, amountB: string) => Promise<void>;
  removeLiquidity: (lpAmount: string) => Promise<void>;
  updateSettings: (settings: Partial<DexSettings>) => void;
  resetSettings: () => void;
  loadPools: () => Promise<void>;
  loadPoolDetails: (poolAddress: string) => Promise<void>;
  calculateSwapOutput: (amountIn: string, tokenIn: Token, tokenOut: Token) => Promise<SwapRoute>;
  cancelTransaction: (txId: string) => Promise<void>;
  speedUpTransaction: (txId: string) => Promise<void>;
  clearError: () => void;
  getLiquidityPositions: () => LiquidityPosition[];
}

const DexContext = createContext<DexContextType | undefined>(undefined);

const DEFAULT_SETTINGS: DexSettings = {
  slippage: 0.5,
  deadline: 20,
  expertMode: false,
  soundsEnabled: true,
  notificationsEnabled: true,
};

export const DexProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [pools, setPools] = useState<Pool[]>([]);
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [selectedTokenA, setSelectedTokenA] = useState<Token | null>(null);
  const [selectedTokenB, setSelectedTokenB] = useState<Token | null>(null);
  const [amountIn, setAmountIn] = useState<string>('');
  const [amountOut, setAmountOut] = useState<string>('');
  const [swapRoute, setSwapRoute] = useState<SwapRoute | null>(null);
  const [priceImpact, setPriceImpact] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<DexSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [liquidityPositions, setLiquidityPositions] = useState<LiquidityPosition[]>([]);
  const [contractService, setContractService] = useState<ContractService | null>(null);
  const [web3State, setWeb3State] = useState<Web3State>({
    address: null,
    chainId: null,
    isConnected: false,
    provider: null,
    signer: null
  });

  // Initialize ContractService
  useEffect(() => {
    const initService = async () => {
      // Use wallet provider if connected, otherwise use read-only provider
      const provider = web3State.isConnected && web3State.provider 
        ? web3State.provider 
        : getReadOnlyProvider();
      
      const service = new ContractService(provider, web3State.signer);
      
      // Initialize with contract addresses from constants/env
      // Note: We need to make sure these addresses are available in constants
      // For now using placeholders or values from TOKENS if available
      // Ideally these should come from a config file
      const FACTORY_ADDRESS = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"; // Replace with actual Factory address
      const ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Replace with actual Router address
      
      await service.initialize(FACTORY_ADDRESS, ROUTER_ADDRESS);
      setContractService(service);
    };
    
    initService();
  }, [web3State.isConnected, web3State.provider, web3State.signer]);

  // Subscribe to Web3 state changes
  useEffect(() => {
    const unsubscribe = subscribeToWeb3((state) => {
      setWeb3State(state);
    });
    return unsubscribe;
  }, []);

  // Initialize with real data on mount (once service is ready)
  useEffect(() => {
    if (contractService) {
      loadPools();
    }
  }, [contractService]);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('dexSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }

    // Load transactions from localStorage
    const savedTransactions = localStorage.getItem('dexTransactions');
    if (savedTransactions) {
      try {
        setTransactions(JSON.parse(savedTransactions));
      } catch (e) {
        console.error('Failed to load transactions:', e);
      }
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('dexSettings', JSON.stringify(settings));
  }, [settings]);

  // Save transactions to localStorage when they change
  useEffect(() => {
    localStorage.setItem('dexTransactions', JSON.stringify(transactions));
  }, [transactions]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadPools = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (contractService) {
        // Fetch pools from blockchain
        const realPools = await contractService.getPools(0, 20); // Fetch first 20 pools
        if (realPools.length > 0) {
          setPools(realPools);
          
          // Set default tokens from the first pool if available
          if (realPools[0]) {
             // Logic to find DC/wDOGE pair or default to first pool
             setSelectedTokenA(realPools[0].tokenA);
             setSelectedTokenB(realPools[0].tokenB);
          }
        } else {
          // Fallback to dummy if no pools found (fresh deployment)
          console.warn("No pools found on blockchain, using dummy data for display");
          setPools(DUMMY_POOLS);
        }
      } else {
        // Fallback if service not ready
        setPools(DUMMY_POOLS);
      }
    } catch (err) {
      console.error("Failed to load pools from blockchain:", err);
      setError(err instanceof Error ? err.message : 'Failed to load pools');
      // Fallback to dummy data on error so UI doesn't break
      setPools(DUMMY_POOLS);
    } finally {
      setIsLoading(false);
    }
  }, [contractService]);

  const loadPoolDetails = useCallback(async (poolAddress: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // This would call the ContractService to load pool details
      // For now, set selected pool
      const pool = pools.find(p => p.address === poolAddress);
      if (pool) {
        setSelectedPool(pool);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pool details');
    } finally {
      setIsLoading(false);
    }
  }, [pools]);

  const calculateSwapOutput = useCallback(async (
    amountIn: string,
    tokenIn: Token,
    tokenOut: Token
  ): Promise<SwapRoute> => {
    // Find pool for this token pair
    const pool = pools.find(p =>
      (p.tokenA.address === tokenIn.address && p.tokenB.address === tokenOut.address) ||
      (p.tokenA.address === tokenOut.address && p.tokenB.address === tokenIn.address)
    );
    
    if (!pool) {
      return {
        path: [tokenIn.address, tokenOut.address],
        outputAmount: '0',
        priceImpact: 0,
        gasEstimate: '150000',
      };
    }
    
    // Calculate output using pool reserves (simplified constant product formula)
    const amountInWei = ethers.parseUnits(amountIn, tokenIn.decimals);
    const isTokenA = pool.tokenA.address === tokenIn.address;
    const reserveIn = isTokenA ? pool.reserve0 : pool.reserve1;
    const reserveOut = isTokenA ? pool.reserve1 : pool.reserve0;
    
    // Calculate output: outputAmount = (amountIn * reserveOut) / (reserveIn + amountIn)
    const numerator = amountInWei * BigInt(reserveOut);
    const denominator = BigInt(reserveIn) + amountInWei;
    const outputAmountWei = numerator / denominator;
    
    // Calculate price impact (simplified)
    const priceImpact = (parseFloat(amountIn) / parseFloat(ethers.formatUnits(reserveIn, tokenIn.decimals))) * 100;
    
    return {
      path: [tokenIn.address, tokenOut.address],
      outputAmount: ethers.formatUnits(outputAmountWei, tokenOut.decimals),
      priceImpact: Math.min(priceImpact, 5), // Cap at 5%
      gasEstimate: '150000',
    };
  }, [pools]);

  const swapTokens = useCallback(async () => {
    if (!selectedTokenA || !selectedTokenB || !amountIn) {
      setError('Please select tokens and enter amount');
      return;
    }

    setIsLoading(true);
    setError(null);

    const txId = Date.now().toString();
    const newTx: Transaction = {
      id: txId,
      type: 'swap',
      status: 'pending',
      from: selectedTokenA,
      to: selectedTokenB,
      amountIn,
      amountOut: amountOut || '0',
      timestamp: Date.now(),
    };

    setTransactions(prev => [newTx, ...prev]);

    try {
      // This would call the ContractService to execute swap
      // For now, just simulate success
      setTransactions(prev =>
        prev.map(tx =>
          tx.id === txId ? { ...tx, status: 'confirmed', hash: '0x123...' } : tx
        )
      );
      setAmountIn('');
      setAmountOut('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Swap failed');
      setTransactions(prev =>
        prev.map(tx => (tx.id === txId ? { ...tx, status: 'failed' } : tx))
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedTokenA, selectedTokenB, amountIn, amountOut]);

  const addLiquidity = useCallback(async (amountA: string, amountB: string) => {
    if (!selectedTokenA || !selectedTokenB) {
      setError('Please select tokens');
      return;
    }

    setIsLoading(true);
    setError(null);

    const txId = Date.now().toString();
    const newTx: Transaction = {
      id: txId,
      type: 'add_liquidity',
      status: 'pending',
      from: selectedTokenA,
      to: selectedTokenB,
      amountIn: amountA,
      amountOut: amountB,
      timestamp: Date.now(),
    };

    setTransactions(prev => [newTx, ...prev]);

    try {
      // This would call the ContractService to add liquidity
      // For now, just simulate success
      setTransactions(prev =>
        prev.map(tx =>
          tx.id === txId ? { ...tx, status: 'confirmed', hash: '0x123...' } : tx
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Add liquidity failed');
      setTransactions(prev =>
        prev.map(tx => (tx.id === txId ? { ...tx, status: 'failed' } : tx))
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedTokenA, selectedTokenB]);

  const removeLiquidity = useCallback(async (lpAmount: string) => {
    if (!selectedPool) {
      setError('Please select a pool');
      return;
    }

    setIsLoading(true);
    setError(null);

    const txId = Date.now().toString();
    const newTx: Transaction = {
      id: txId,
      type: 'remove_liquidity',
      status: 'pending',
      from: selectedPool.tokenA,
      to: selectedPool.tokenB,
      amountIn: lpAmount,
      timestamp: Date.now(),
    };

    setTransactions(prev => [newTx, ...prev]);

    try {
      // This would call the ContractService to remove liquidity
      // For now, just simulate success
      setTransactions(prev =>
        prev.map(tx =>
          tx.id === txId ? { ...tx, status: 'confirmed', hash: '0x123...' } : tx
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Remove liquidity failed');
      setTransactions(prev =>
        prev.map(tx => (tx.id === txId ? { ...tx, status: 'failed' } : tx))
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedPool]);

  const updateSettings = useCallback((newSettings: Partial<DexSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const cancelTransaction = useCallback(async (txId: string) => {
    setTransactions(prev =>
      prev.map(tx => (tx.id === txId ? { ...tx, status: 'cancelled' } : tx))
    );
  }, []);

  const speedUpTransaction = useCallback(async (txId: string) => {
    // This would resubmit the transaction with higher gas
    // For now, just update status
    setTransactions(prev =>
      prev.map(tx =>
        tx.id === txId && tx.status === 'pending'
          ? { ...tx, gasPrice: (parseInt(tx.gasPrice || '0') + 1000000000).toString() }
          : tx
      )
    );
  }, []);

  const getLiquidityPositions = useCallback(() => {
    return liquidityPositions;
  }, [liquidityPositions]);

  const value: DexContextType = {
    pools,
    selectedPool,
    selectedTokenA,
    selectedTokenB,
    amountIn,
    amountOut,
    swapRoute,
    priceImpact,
    transactions,
    liquidityPositions,
    settings,
    isLoading,
    error,
    setSelectedPool,
    setSelectedTokenA,
    setSelectedTokenB,
    setAmountIn,
    setAmountOut,
    swapTokens,
    addLiquidity,
    removeLiquidity,
    updateSettings,
    resetSettings,
    loadPools,
    loadPoolDetails,
    calculateSwapOutput,
    cancelTransaction,
    speedUpTransaction,
    clearError,
    getLiquidityPositions,
  };

  return <DexContext.Provider value={value}>{children}</DexContext.Provider>;
};

export const useDex = () => {
  const context = useContext(DexContext);
  if (!context) {
    throw new Error('useDex must be used within DexProvider');
  }
  return context;
};

// Export DexContext for use in tests
export { DexContext };
