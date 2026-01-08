/**
 * Blockchain Service
 * Handles server-side blockchain interactions for Dogechain
 */

import { ethers } from 'ethers';
import { config } from '../config.js';

// Dogechain RPC URL
const DOGECHAIN_RPC_URL = 'https://rpc.dogechain.dog';

// DC Token address on Dogechain
const DC_TOKEN_ADDRESS = '0x7B4328c127B85369D9f82ca0503B000D09CF9180';

// Minimal ERC20 ABI for balance checking
const ERC20_ABI = [
  // Read-Only Functions
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function name() view returns (string)',
];

// Cache provider instance
let provider: ethers.JsonRpcProvider | null = null;

/**
 * Get or create the RPC provider
 */
function getProvider(): ethers.JsonRpcProvider {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(DOGECHAIN_RPC_URL);
  }
  return provider;
}

/**
 * Verify an address format
 */
export function isValidAddress(address: string): boolean {
  return ethers.isAddress(address);
}

/**
 * Get native DOGE balance for an address
 */
export async function getNativeBalance(address: string): Promise<bigint> {
  if (!isValidAddress(address)) {
    throw new Error('Invalid address format');
  }

  try {
    const provider = getProvider();
    const balance = await provider.getBalance(address);
    return balance;
  } catch (error) {
    console.error('Error fetching native balance:', error);
    throw new Error('Failed to fetch native balance');
  }
}

/**
 * Get DC token balance for an address
 */
export async function getDCBalance(address: string): Promise<bigint> {
  if (!isValidAddress(address)) {
    throw new Error('Invalid address format');
  }

  try {
    const provider = getProvider();
    const tokenContract = new ethers.Contract(DC_TOKEN_ADDRESS, ERC20_ABI, provider);
    const balance = await tokenContract.balanceOf(address);
    return balance;
  } catch (error) {
    console.error('Error fetching DC balance:', error);
    throw new Error('Failed to fetch DC balance');
  }
}

/**
 * Get token info (decimals, symbol, name)
 */
export async function getTokenInfo(): Promise<{
  decimals: number;
  symbol: string;
  name: string;
  totalSupply: bigint;
}> {
  try {
    const provider = getProvider();
    const tokenContract = new ethers.Contract(DC_TOKEN_ADDRESS, ERC20_ABI, provider);

    const [decimals, symbol, name, totalSupply] = await Promise.all([
      tokenContract.decimals(),
      tokenContract.symbol(),
      tokenContract.name(),
      tokenContract.totalSupply(),
    ]);

    return {
      decimals,
      symbol,
      name,
      totalSupply,
    };
  } catch (error) {
    console.error('Error fetching token info:', error);
    throw new Error('Failed to fetch token info');
  }
}

/**
 * Check if an address has sufficient balance (native + DC)
 */
export async function verifySufficientBalance(
  address: string,
  requiredDC: bigint
): Promise<{
  sufficient: boolean;
  nativeBalance: string;
  dcBalance: string;
  requiredDC: string;
}> {
  if (!isValidAddress(address)) {
    throw new Error('Invalid address format');
  }

  if (requiredDC < 0n) {
    throw new Error('Required balance cannot be negative');
  }

  try {
    const [nativeBalance, dcBalance] = await Promise.all([
      getNativeBalance(address),
      getDCBalance(address),
    ]);

    const sufficient = dcBalance >= requiredDC;

    return {
      sufficient,
      nativeBalance: nativeBalance.toString(),
      dcBalance: dcBalance.toString(),
      requiredDC: requiredDC.toString(),
    };
  } catch (error) {
    console.error('Error verifying balance:', error);
    throw new Error('Failed to verify balance');
  }
}

/**
 * Format token amount from wei to human-readable
 */
export function formatTokenAmount(amount: string | bigint, decimals: number = 18): string {
  const balance = typeof amount === 'string' ? BigInt(amount) : amount;
  const divisor = BigInt(10 ** decimals);
  const whole = balance / divisor;
  const fraction = balance % divisor;

  // Format with proper decimal places
  const fractionStr = fraction.toString().padStart(decimals, '0');
  const trimmedFraction = fractionStr.replace(/0+$/, '');

  if (trimmedFraction.length === 0) {
    return whole.toString();
  }

  return `${whole}.${trimmedFraction}`;
}

/**
 * Close the provider connection (for cleanup)
 */
export function closeProvider(): void {
  if (provider) {
    provider.destroy();
    provider = null;
  }
}
