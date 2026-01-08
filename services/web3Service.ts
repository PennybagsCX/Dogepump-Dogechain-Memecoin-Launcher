
import { ethers } from 'ethers';
import { DOGECHAIN_HEX_ID, DOGECHAIN_ID, RPC_URL, EXPLORER_URL } from '../constants';

// Define a type for the Ethereum provider to avoid conflicts
interface EthereumRequest {
  method: string;
  params?: unknown[];
}

interface EthereumProvider {
  request: (args: EthereumRequest) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
}

// Safely access the Ethereum provider without modifying window.ethereum
const getEthereumProvider = (): EthereumProvider | null => {
  try {
    // Type-safe access to window.ethereum
    const ethereum = (window as unknown as { ethereum?: EthereumProvider }).ethereum;

    if (!ethereum) {
      return null;
    }

    // Check if ethereum has the required methods
    if (typeof ethereum.request !== 'function' || typeof ethereum.on !== 'function') {
      console.warn("Ethereum provider found but missing required methods");
      return null;
    }

    return ethereum;
  } catch (error) {
    // This happens when window.ethereum is accessed but conflicts exist
    // between multiple wallet extensions - it's safe to ignore and return null
    return null;
  }
};

// Types for better structure
export interface Web3State {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
}

// Initial State
let currentState: Web3State = {
  address: null,
  chainId: null,
  isConnected: false,
  provider: null,
  signer: null
};

// Listeners
let listeners: ((state: Web3State) => void)[] = [];

// Broadcast changes to UI
const notifyListeners = () => {
  listeners.forEach(l => l(currentState));
};

export const subscribeToWeb3 = (listener: (state: Web3State) => void) => {
  listeners.push(listener);
  listener(currentState);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
};

export const connectWallet = async (): Promise<Web3State> => {
  // Get the provider safely
  const ethereum = getEthereumProvider();

  // NO MOCK WALLET - Always require real wallet
  // This is a security-critical function that must authenticate with a real provider
  if (!ethereum) {
    throw new Error(
      "No crypto wallet detected. Please install MetaMask, Trust Wallet, or another Web3 wallet provider to continue.\n\n" +
      "Visit https://metamask.io to install MetaMask."
    );
  }

  try {
    const provider = new ethers.BrowserProvider(ethereum as any);
    // Request accounts
    const accounts = await provider.send("eth_requestAccounts", []);
    const network = await provider.getNetwork();
    const signer = await provider.getSigner();

    currentState = {
      address: accounts[0],
      chainId: Number(network.chainId),
      isConnected: true,
      provider,
      signer
    };

    // Setup event listeners for network/account changes
    ethereum.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length === 0) {
        // Disconnected
        currentState = { ...currentState, address: null, isConnected: false, signer: null };
      } else {
        currentState = { ...currentState, address: accounts[0] };
      }
      notifyListeners();
    });

    ethereum.on('chainChanged', (_chainId: string) => {
      // Reload page is recommended practice for chain changes, but we can also just update state
      window.location.reload();
    });

    notifyListeners();
    return currentState;
  } catch (error) {
    console.error("Failed to connect wallet:", error);
    throw error;
  }
};

export const switchToDogechain = async () => {
  const ethereum = getEthereumProvider();
  if (!ethereum) return true;

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: DOGECHAIN_HEX_ID }],
    });
    return true;
  } catch (switchError: unknown) {
    // Type guard for error with code property
    if (typeof switchError === 'object' && switchError !== null && 'code' in switchError) {
      const error = switchError as { code: number };
      // This error code indicates that the chain has not been added to MetaMask.
      if (error.code === 4902) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: DOGECHAIN_HEX_ID,
                chainName: 'Dogechain Mainnet',
                rpcUrls: [RPC_URL],
                nativeCurrency: {
                  name: 'Wrapped Doge',
                  symbol: 'wDOGE',
                  decimals: 18,
                },
                blockExplorerUrls: [EXPLORER_URL],
              },
            ],
          });
          return true;
        } catch (addError) {
          console.error("Failed to add Dogechain:", addError);
          return false;
        }
      }
    }
    console.error("Failed to switch network:", switchError);
    return false;
  }
};

export const formatAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  }).format(val);
};

export const formatNumber = (val: number) => {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    notation: "compact",
    compactDisplay: "short"
  }).format(val);
}
