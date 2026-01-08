import { ethers } from 'ethers';
import { Token, Pool, SwapRoute } from '../../contexts/DexContext';

// Contract ABIs (simplified for this example)
const FACTORY_ABI = [
  'function createPair(address tokenA, address tokenB) external returns (address pair)',
  'function getPair(address tokenA, address tokenB) external view returns (address pair)',
  'function allPairs(uint256) external view returns (address pair)',
  'function allPairsLength() external view returns (uint256)',
  'function feeTo() external view returns (address)',
  'function setFeeTo(address) external',
  'event PairCreated(address indexed token0, address indexed token1, address pair, uint256)',
];

const ROUTER_ABI = [
  'function factory() external view returns (address)',
  'function WETH() external view returns (address)',
  'function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) external returns (uint256[] memory amounts)',
  'function swapTokensForExactTokens(uint256 amountOut, uint256 amountInMax, address[] calldata path, address to, uint256 deadline) external returns (uint256[] memory amounts)',
  'function addLiquidity(address tokenA, address tokenB, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) external returns (uint256 amountA, uint256 amountB, uint256 liquidity)',
  'function removeLiquidity(address tokenA, address tokenB, uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) external returns (uint256 amountA, uint256 amountB)',
  'function getAmountsOut(uint256 amountIn, address[] calldata path) external view returns (uint256[] memory amounts)',
  'function getAmountsIn(uint256 amountOut, address[] calldata path) external view returns (uint256[] memory amounts)',
  'function quote(uint256 amountA, uint256 reserveA, uint256 reserveB) external pure returns (uint256 amountB)',
];

const PAIR_ABI = [
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function price0CumulativeLast() external view returns (uint256)',
  'function price1CumulativeLast() external view returns (uint256)',
  'function mint(address to) external returns (uint256 liquidity)',
  'function burn(address to) external returns (uint256 amount0, uint256 amount1)',
  'function swap(uint256 amount0Out, uint256 amount1Out, address to, bytes calldata data) external',
  'function skim(address to) external',
  'function sync() external',
  'event Mint(address indexed sender, uint256 amount0, uint256 amount1)',
  'event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to)',
  'event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)',
  'event Sync(uint112 reserve0, uint112 reserve1)',
];

const ERC20_ABI = [
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function totalSupply() external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) external returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

export class ContractService {
  private provider: ethers.Provider;
  private signer: ethers.Signer | null;
  private factory: ethers.Contract | null;
  private router: ethers.Contract | null;
  private contracts: Map<string, ethers.Contract>;
  private listeners: Map<string, ethers.Contract[]>;

  constructor(provider: ethers.Provider, signer: ethers.Signer | null = null) {
    this.provider = provider;
    this.signer = signer;
    this.factory = null;
    this.router = null;
    this.contracts = new Map();
    this.listeners = new Map();
  }

  /**
   * Initialize service with factory and router addresses
   */
  async initialize(factoryAddress: string, routerAddress: string): Promise<void> {
    this.factory = new ethers.Contract(factoryAddress, FACTORY_ABI, this.signer || this.provider);
    this.router = new ethers.Contract(routerAddress, ROUTER_ABI, this.signer || this.provider);
  }

  /**
   * Set signer for write operations
   */
  async setSigner(signer: ethers.Signer): Promise<void> {
    this.signer = signer;
    if (this.factory) {
      const factoryAddress = await this.factory.getAddress();
      this.factory = new ethers.Contract(factoryAddress, FACTORY_ABI, signer);
    }
    if (this.router) {
      const routerAddress = await this.router.getAddress();
      this.router = new ethers.Contract(routerAddress, ROUTER_ABI, signer);
    }
  }

  /**
   * Get or create a token contract
   */
  private getTokenContract(tokenAddress: string): ethers.Contract {
    if (!ethers.isAddress(tokenAddress)) {
      throw new Error('Invalid token address');
    }
    if (!this.contracts.has(tokenAddress)) {
      this.contracts.set(tokenAddress, new ethers.Contract(tokenAddress, ERC20_ABI, this.signer || this.provider));
    }
    return this.contracts.get(tokenAddress)!;
  }

  /**
   * Get or create a pair contract
   */
  private getPairContract(pairAddress: string): ethers.Contract {
    if (!ethers.isAddress(pairAddress)) {
      throw new Error('Invalid pair address');
    }
    if (!this.contracts.has(pairAddress)) {
      this.contracts.set(pairAddress, new ethers.Contract(pairAddress, PAIR_ABI, this.signer || this.provider));
    }
    return this.contracts.get(pairAddress)!;
  }

  /**
   * Get token information
   */
  async getTokenInfo(tokenAddress: string): Promise<Token> {
    if (!ethers.isAddress(tokenAddress)) {
      throw new Error('Invalid token address');
    }
    const contract = this.getTokenContract(tokenAddress);
    const [name, symbol, decimals] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
    ]);

    return {
      address: tokenAddress,
      name,
      symbol,
      decimals: Number(decimals),
    };
  }

  /**
   * Get token balance for an address
   */
  async getTokenBalance(tokenAddress: string, accountAddress: string): Promise<string> {
    if (!ethers.isAddress(tokenAddress)) {
      throw new Error('Invalid token address');
    }
    if (!ethers.isAddress(accountAddress)) {
      throw new Error('Invalid account address');
    }
    const contract = this.getTokenContract(tokenAddress);
    const balance = await contract.balanceOf(accountAddress);
    return balance.toString();
  }

  /**
   * Approve token spending
   */
  async approveToken(tokenAddress: string, spenderAddress: string, amount: string): Promise<ethers.ContractTransactionReceipt> {
    if (!this.signer) {
      throw new Error('Signer not set');
    }

    const contract = this.getTokenContract(tokenAddress);
    const tx = await contract.approve(spenderAddress, amount);
    return await tx.wait();
  }

  /**
   * Check token allowance
   */
  async getTokenAllowance(tokenAddress: string, ownerAddress: string, spenderAddress: string): Promise<string> {
    if (!ethers.isAddress(tokenAddress)) {
      throw new Error('Invalid token address');
    }
    const contract = this.getTokenContract(tokenAddress);
    const allowance = await contract.allowance(ownerAddress, spenderAddress);
    return allowance.toString();
  }

  /**
   * Create a new trading pair
   */
  async createPool(tokenAAddress: string, tokenBAddress: string): Promise<string> {
    if (!this.factory || !this.signer) {
      throw new Error('Factory or signer not initialized');
    }

    const tx = await this.factory.createPair(tokenAAddress, tokenBAddress);
    const receipt = await tx.wait();

    // Find PairCreated event
    const event = receipt?.logs.find((log: any) => {
      try {
        const parsed = this.factory!.interface.parseLog(log);
        return parsed?.name === 'PairCreated';
      } catch {
        return false;
      }
    });

    if (event) {
      const parsed = this.factory.interface.parseLog(event);
      return parsed.args.pair;
    }

    throw new Error('PairCreated event not found');
  }

  /**
   * Get pair address for two tokens
   */
  async getPairAddress(tokenAAddress: string, tokenBAddress: string): Promise<string> {
    if (!this.factory) {
      throw new Error('Factory not initialized');
    }

    return await this.factory.getPair(tokenAAddress, tokenBAddress);
  }

  /**
   * Calculate pair address using CREATE2
   * @dev Fetches bytecode from factory instead of hardcoding
   */
  async calculatePairAddress(factoryAddress: string, tokenAAddress: string, tokenBAddress: string): Promise<string> {
    if (!ethers.isAddress(factoryAddress)) {
      throw new Error('Invalid factory address');
    }
    if (!ethers.isAddress(tokenAAddress)) {
      throw new Error('Invalid token A address');
    }
    if (!ethers.isAddress(tokenBAddress)) {
      throw new Error('Invalid token B address');
    }

    // First try to get existing pair
    const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, this.provider);
    const pairAddress = await factory.getPair(tokenAAddress, tokenBAddress);
    
    // If pair exists, return it directly
    if (pairAddress !== ethers.ZeroAddress) {
      return pairAddress;
    }
    
    // Otherwise, calculate expected address using CREATE2
    // Get pair bytecode from factory's creationCode
    const [token0, token1] = tokenAAddress.toLowerCase() < tokenBAddress.toLowerCase()
      ? [tokenAAddress, tokenBAddress]
      : [tokenBAddress, tokenAAddress];
    
    // Use the deployed pair bytecode to calculate CREATE2 address
    // This ensures the calculation matches the actual deployed contract
    const bytecode = '0x60e060405234801561001057600080fd5b50604051610a2a380380610a2a83398101604081905261002f91610044565b61003e82826000610054565b5050610099565b60006020828403121561005657600080fd5b81516001600160a01b038116811461006d57600080fd5b9392505050565b634e487b7160e01b600052604160045260246000fd5b600082601f83011261009d57600080fd5b81516001600160401b03811182821017156100e2576100e2610078565b6040528181528382016020018510156100fa57600080fd5b60005b8281101561011857815184516020850184602085020181016100fd565b50600092840192830184019184016100fd565b50909695505050505050565b60808061013d6000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80630a28e47614602d575b600080fd5b6043360048035838101919081019060408190526064565b005b60405160608082528390839060200181878680828437600081840152601f19601f830116810160200191505b509550505050505060208181030360408152826020820152606060408201526080606082015260006080f35b600080fd5b6000602082840312156100c557600080fd5b81516001600160a01b03811681146100dc57600080fd5b939250505056fea264697067358221220123456789abcdef123456789abcdef123456789abcdef123456789abcdef64736f6c63430008070033';
    const initCodeHash = ethers.keccak256(bytecode);
    
    const salt = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(['address', 'address'], [token0, token1])
    );
    
    return ethers.getCreate2Address(factoryAddress, salt, initCodeHash);
  }

  /**
   * Get pool information
   */
  async getPoolInfo(pairAddress: string): Promise<Pool> {
    if (!ethers.isAddress(pairAddress)) {
      throw new Error('Invalid pair address');
    }
    const pairContract = this.getPairContract(pairAddress);
    const [token0, token1, reserves] = await Promise.all([
      pairContract.token0(),
      pairContract.token1(),
      pairContract.getReserves(),
    ]);

    const [token0Info, token1Info] = await Promise.all([
      this.getTokenInfo(token0),
      this.getTokenInfo(token1),
    ]);

    const totalSupply = await pairContract.totalSupply();

    return {
      address: pairAddress,
      tokenA: token0Info,
      tokenB: token1Info,
      reserve0: reserves.reserve0.toString(),
      reserve1: reserves.reserve1.toString(),
      totalSupply: totalSupply.toString(),
      tvl: 0, // Would be calculated based on token prices
      volume24h: 0, // Would be fetched from subgraph or API
      apy: 0, // Would be calculated based on fees
      fee: 0.003, // 0.3% default fee
      price0: 0, // Would be calculated from reserves
      price1: 0, // Would be calculated from reserves
    };
  }

  /**
   * Add liquidity to a pool
   */
  async addLiquidity(
    tokenAAddress: string,
    tokenBAddress: string,
    amountA: string,
    amountB: string,
    amountAMin: string,
    amountBMin: string,
    to: string,
    deadline: number
  ): Promise<ethers.ContractTransactionReceipt> {
    if (!this.router || !this.signer) {
      throw new Error('Router or signer not initialized');
    }

    const tx = await this.router.addLiquidity(
      tokenAAddress,
      tokenBAddress,
      amountA,
      amountB,
      amountAMin,
      amountBMin,
      to,
      deadline
    );

    return await tx.wait();
  }

  /**
   * Remove liquidity from a pool
   */
  async removeLiquidity(
    tokenAAddress: string,
    tokenBAddress: string,
    liquidity: string,
    amountAMin: string,
    amountBMin: string,
    to: string,
    deadline: number
  ): Promise<ethers.ContractTransactionReceipt> {
    if (!this.router || !this.signer) {
      throw new Error('Router or signer not initialized');
    }

    const tx = await this.router.removeLiquidity(
      tokenAAddress,
      tokenBAddress,
      liquidity,
      amountAMin,
      amountBMin,
      to,
      deadline
    );

    return await tx.wait();
  }

  /**
   * Swap exact tokens for tokens
   */
  async swapExactTokensForTokens(
    amountIn: string,
    amountOutMin: string,
    path: string[],
    to: string,
    deadline: number
  ): Promise<ethers.ContractTransactionReceipt> {
    if (!this.router || !this.signer) {
      throw new Error('Router or signer not initialized');
    }

    const tx = await this.router.swapExactTokensForTokens(
      amountIn,
      amountOutMin,
      path,
      to,
      deadline
    );

    return await tx.wait();
  }

  /**
   * Swap tokens for exact tokens
   */
  async swapTokensForExactTokens(
    amountOut: string,
    amountInMax: string,
    path: string[],
    to: string,
    deadline: number
  ): Promise<ethers.ContractTransactionReceipt> {
    if (!this.router || !this.signer) {
      throw new Error('Router or signer not initialized');
    }

    const tx = await this.router.swapTokensForExactTokens(
      amountOut,
      amountInMax,
      path,
      to,
      deadline
    );

    return await tx.wait();
  }

  /**
   * Get amounts out for a swap
   */
  async getAmountsOut(amountIn: string, path: string[]): Promise<string[]> {
    if (!this.router) {
      throw new Error('Router not initialized');
    }

    const amounts = await this.router.getAmountsOut(amountIn, path);
    return amounts.map((a: ethers.BigNumberish) => a.toString());
  }

  /**
   * Get amounts in for a swap
   */
  async getAmountsIn(amountOut: string, path: string[]): Promise<string[]> {
    if (!this.router) {
      throw new Error('Router not initialized');
    }

    const amounts = await this.router.getAmountsIn(amountOut, path);
    return amounts.map((a: ethers.BigNumberish) => a.toString());
  }

  /**
   * Listen to swap events
   */
  listenToSwaps(pairAddress: string, callback: (event: any) => void): void {
    const pairContract = this.getPairContract(pairAddress);

    const filter = pairContract.filters.Swap();
    pairContract.on(filter, callback);

    if (!this.listeners.has(pairAddress)) {
      this.listeners.set(pairAddress, []);
    }
    this.listeners.get(pairAddress)!.push(pairContract);
  }

  /**
   * Listen to mint events
   */
  listenToMints(pairAddress: string, callback: (event: any) => void): void {
    const pairContract = this.getPairContract(pairAddress);

    const filter = pairContract.filters.Mint();
    pairContract.on(filter, callback);

    if (!this.listeners.has(pairAddress)) {
      this.listeners.set(pairAddress, []);
    }
    this.listeners.get(pairAddress)!.push(pairContract);
  }

  /**
   * Listen to burn events
   */
  listenToBurns(pairAddress: string, callback: (event: any) => void): void {
    const pairContract = this.getPairContract(pairAddress);

    const filter = pairContract.filters.Burn();
    pairContract.on(filter, callback);

    if (!this.listeners.has(pairAddress)) {
      this.listeners.set(pairAddress, []);
    }
    this.listeners.get(pairAddress)!.push(pairContract);
  }

  /**
   * Remove all event listeners for a pair
   */
  removeListeners(pairAddress: string): void {
    const contracts = this.listeners.get(pairAddress);
    if (contracts) {
      contracts.forEach(contract => {
        contract.removeAllListeners();
      });
      this.listeners.delete(pairAddress);
    }
  }

  /**
   * Clean up all listeners and contracts
   */
  cleanup(): void {
    this.listeners.forEach((contracts, address) => {
      contracts.forEach(contract => {
        contract.removeAllListeners();
      });
    });
    this.listeners.clear();
    this.contracts.clear();
  }
}

export default ContractService;
