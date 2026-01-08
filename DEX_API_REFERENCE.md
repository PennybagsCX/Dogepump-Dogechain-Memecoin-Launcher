# DEX API Reference

Complete API reference for Dogepump DEX smart contracts, services, and components.

## Table of Contents

- [Smart Contract APIs](#smart-contract-apis)
  - [DogePumpFactory](#dogepumpfactory)
  - [DogePumpPair](#dogepumppair)
  - [DogePumpRouter](#dogepumprouter)
  - [DogePumpLPToken](#dogepumplptoken)
  - [GraduationManager](#graduationmanager)
- [Frontend Service APIs](#frontend-service-apis)
  - [ContractService](#contractservice)
  - [PriceService](#priceservice)
  - [RouterService](#routerservice)
  - [GasEstimator](#gasestimator)
  - [TransactionQueue](#transactionqueue)
- [Component APIs](#component-apis)
  - [DexSwap](#dexswap)
  - [DexPoolList](#dexpoollist)
  - [DexPoolCard](#dexpoolcard)
  - [DexAddLiquidity](#dexaddliquidity)
  - [DexRemoveLiquidity](#dexremoveliquidity)
  - [DexLiquidityPositions](#dexliquiditypositions)
  - [DexPoolDetail](#dexpooldetail)
  - [DexTransactionSummary](#dextransactionsummary)
  - [DexSettings](#dexsettings)
- [TypeScript Types](#typescript-types)
- [Event Interfaces](#event-interfaces)
- [Error Codes](#error-codes)

---

## Smart Contract APIs

### DogePumpFactory

Factory contract for creating and managing trading pairs.

**Contract Address**: `0x...` (to be filled after deployment)

#### Functions

##### createPair

Creates a new trading pair for two tokens.

```solidity
function createPair(address tokenA, address tokenB) external returns (address pair)
```

**Parameters:**
- `tokenA` (address): Address of the first token
- `tokenB` (address): Address of the second token

**Returns:**
- `pair` (address): Address of the created pair

**Emits:** `PairCreated` event

**Gas Estimate:** ~150,000 gas

**Example:**
```typescript
const pairAddress = await factory.createPair(tokenA.address, tokenB.address);
```

##### getPair

Returns the address of the pair for two tokens, or zero address if it doesn't exist.

```solidity
function getPair(address tokenA, address tokenB) external view returns (address pair)
```

**Parameters:**
- `tokenA` (address): Address of the first token
- `tokenB` (address): Address of the second token

**Returns:**
- `pair` (address): Address of the pair, or `address(0)` if not exists

**Example:**
```typescript
const pairAddress = await factory.getPair(tokenA.address, tokenB.address);
if (pairAddress === ethers.ZeroAddress) {
  console.log('Pair does not exist');
}
```

##### allPairs

Returns the address of the pair at the given index.

```solidity
function allPairs(uint256 index) external view returns (address pair)
```

**Parameters:**
- `index` (uint256): Index of the pair

**Returns:**
- `pair` (address): Address of the pair at the index

**Example:**
```typescript
const pairAddress = await factory.allPairs(0);
```

##### allPairsLength

Returns the total number of pairs created by the factory.

```solidity
function allPairsLength() external view returns (uint256)
```

**Returns:**
- `length` (uint256): Total number of pairs

**Example:**
```typescript
const totalPairs = await factory.allPairsLength();
```

##### setFeeTo

Sets the address that receives trading fees.

```solidity
function setFeeTo(address _feeTo) external
```

**Parameters:**
- `_feeTo` (address): Address to receive fees

**Access Control:** Owner only

**Emits:** `FeeToChanged` event

**Example:**
```typescript
await factory.setFeeTo(feeRecipient.address);
```

##### feeTo

Returns the address that receives trading fees.

```solidity
function feeTo() external view returns (address)
```

**Returns:**
- `feeTo` (address): Address receiving fees

**Example:**
```typescript
const feeRecipient = await factory.feeTo();
```

#### Events

##### PairCreated

Emitted when a new pair is created.

```solidity
event PairCreated(address indexed token0, address indexed token1, address pair, uint256)
```

**Parameters:**
- `token0` (address): Address of the first token (sorted)
- `token1` (address): Address of the second token (sorted)
- `pair` (address): Address of the created pair
- `uint256`: All pairs length

**Example:**
```typescript
factory.on('PairCreated', (token0, token1, pair, allPairsLength) => {
  console.log(`New pair created: ${pair}`);
});
```

##### FeeToChanged

Emitted when the fee recipient is changed.

```solidity
event FeeToChanged(address indexed oldFeeTo, address indexed newFeeTo)
```

**Parameters:**
- `oldFeeTo` (address): Previous fee recipient
- `newFeeTo` (address): New fee recipient

---

### DogePumpPair

Pair contract for managing liquidity and swaps.

**Contract Address**: `0x...` (varies per pair)

#### Functions

##### getReserves

Returns the reserves of the pair and the timestamp of the last update.

```solidity
function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)
```

**Returns:**
- `reserve0` (uint112): Reserve of token0
- `reserve1` (uint112): Reserve of token1
- `blockTimestampLast` (uint32): Timestamp of the last reserve update

**Example:**
```typescript
const { reserve0, reserve1, blockTimestampLast } = await pair.getReserves();
```

##### price0CumulativeLast

Returns the cumulative price of token0.

```solidity
function price0CumulativeLast() external view returns (uint256)
```

**Returns:**
- `price0CumulativeLast` (uint256): Cumulative price of token0

**Example:**
```typescript
const price0Cumulative = await pair.price0CumulativeLast();
```

##### price1CumulativeLast

Returns the cumulative price of token1.

```solidity
function price1CumulativeLast() external view returns (uint256)
```

**Returns:**
- `price1CumulativeLast` (uint256): Cumulative price of token1

**Example:**
```typescript
const price1Cumulative = await pair.price1CumulativeLast();
```

##### token0

Returns the address of the first token.

```solidity
function token0() external view returns (address)
```

**Returns:**
- `token0` (address): Address of token0

**Example:**
```typescript
const token0Address = await pair.token0();
```

##### token1

Returns the address of the second token.

```solidity
function token1() external view returns (address)
```

**Returns:**
- `token1` (address): Address of token1

**Example:**
```typescript
const token1Address = await pair.token1();
```

##### mint

Mints liquidity tokens to the provided address.

```solidity
function mint(address to) external nonReentrant returns (uint256 liquidity)
```

**Parameters:**
- `to` (address): Address to receive liquidity tokens

**Returns:**
- `liquidity` (uint256): Amount of liquidity tokens minted

**Emits:** `Mint` event

**Gas Estimate:** ~100,000 gas

**Example:**
```typescript
const liquidity = await pair.mint(userAddress);
```

##### burn

Burns liquidity tokens and returns the underlying tokens.

```solidity
function burn(address to) external nonReentrant returns (uint256 amount0, uint256 amount1)
```

**Parameters:**
- `to` (address): Address to receive the underlying tokens

**Returns:**
- `amount0` (uint256): Amount of token0 received
- `amount1` (uint256): Amount of token1 received

**Emits:** `Burn` event

**Gas Estimate:** ~100,000 gas

**Example:**
```typescript
const { amount0, amount1 } = await pair.burn(userAddress);
```

##### swap

Executes a token swap.

```solidity
function swap(uint256 amount0Out, uint256 amount1Out, address to, bytes calldata data) external nonReentrant
```

**Parameters:**
- `amount0Out` (uint256): Amount of token0 to receive (0 if not receiving)
- `amount1Out` (uint256): Amount of token1 to receive (0 if not receiving)
- `to` (address): Address to receive the output tokens
- `data` (bytes): Arbitrary data for flash loans

**Emits:** `Swap` event

**Gas Estimate:** ~100,000 gas

**Example:**
```typescript
await pair.swap(amount0Out, amount1Out, recipientAddress, '0x');
```

##### skim

Skims the excess tokens in the pair.

```solidity
function skim(address to) external
```

**Parameters:**
- `to` (address): Address to receive the skimmed tokens

**Example:**
```typescript
await pair skim(recipientAddress);
```

##### sync

Updates the reserves to the current balances.

```solidity
function sync() external
```

**Example:**
```typescript
await pair.sync();
```

#### Events

##### Mint

Emitted when liquidity is added.

```solidity
event Mint(address indexed sender, uint256 amount0, uint256 amount1)
```

**Parameters:**
- `sender` (address): Address that added liquidity
- `amount0` (uint256): Amount of token0 added
- `amount1` (uint256): Amount of token1 added

##### Burn

Emitted when liquidity is removed.

```solidity
event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to)
```

**Parameters:**
- `sender` (address): Address that removed liquidity
- `amount0` (uint256): Amount of token0 removed
- `amount1` (uint256): Amount of token1 removed
- `to` (address): Address that received the tokens

##### Swap

Emitted when a swap occurs.

```solidity
event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)
```

**Parameters:**
- `sender` (address): Address that initiated the swap
- `amount0In` (uint256): Amount of token0 sent
- `amount1In` (uint256): Amount of token1 sent
- `amount0Out` (uint256): Amount of token0 received
- `amount1Out` (uint256): Amount of token1 received
- `to` (address): Address that received the output

##### Sync

Emitted when reserves are synced.

```solidity
event Sync(uint112 reserve0, uint112 reserve1)
```

**Parameters:**
- `reserve0` (uint112): New reserve0 value
- `reserve1` (uint112): New reserve1 value

---

### DogePumpRouter

Router contract for facilitating swaps and liquidity operations.

**Contract Address**: `0x...` (to be filled after deployment)

#### Functions

##### factory

Returns the factory contract address.

```solidity
function factory() external view returns (address)
```

**Returns:**
- `factory` (address): Address of the factory contract

**Example:**
```typescript
const factoryAddress = await router.factory();
```

##### WETH

Returns the WETH (or WDC) address.

```solidity
function WETH() external view returns (address)
```

**Returns:**
- `WETH` (address): Address of the wrapped native token

**Example:**
```typescript
const wethAddress = await router.WETH();
```

##### swapExactTokensForTokens

Swaps an exact amount of input tokens for as many output tokens as possible.

```solidity
function swapExactTokensForTokens(
    uint256 amountIn,
    uint256 amountOutMin,
    address[] calldata path,
    address to,
    uint256 deadline
) external returns (uint256[] memory amounts)
```

**Parameters:**
- `amountIn` (uint256): Exact amount of input tokens to swap
- `amountOutMin` (uint256): Minimum amount of output tokens to receive
- `path` (address[]): Array of token addresses for the swap route
- `to` (address): Address to receive the output tokens
- `deadline` (uint256): Unix timestamp after which the transaction will revert

**Returns:**
- `amounts` (uint256[]): Array of token amounts for each step in the path

**Emits:** `Swap` events from pairs

**Gas Estimate:** ~150,000 - 300,000 gas (depends on path length)

**Example:**
```typescript
const amounts = await router.swapExactTokensForTokens(
  ethers.parseUnits('100', 18),
  ethers.parseUnits('95', 18),
  [tokenA.address, tokenB.address],
  userAddress,
  Math.floor(Date.now() / 1000) + 1200 // 20 minutes from now
);
```

##### swapTokensForExactTokens

Swaps as few input tokens as possible for an exact amount of output tokens.

```solidity
function swapTokensForExactTokens(
    uint256 amountOut,
    uint256 amountInMax,
    address[] calldata path,
    address to,
    uint256 deadline
) external returns (uint256[] memory amounts)
```

**Parameters:**
- `amountOut` (uint256): Exact amount of output tokens to receive
- `amountInMax` (uint256): Maximum amount of input tokens to spend
- `path` (address[]): Array of token addresses for the swap route
- `to` (address): Address to receive the output tokens
- `deadline` (uint256): Unix timestamp after which the transaction will revert

**Returns:**
- `amounts` (uint256[]): Array of token amounts for each step in the path

**Gas Estimate:** ~150,000 - 300,000 gas

**Example:**
```typescript
const amounts = await router.swapTokensForExactTokens(
  ethers.parseUnits('100', 18),
  ethers.parseUnits('105', 18),
  [tokenA.address, tokenB.address],
  userAddress,
  Math.floor(Date.now() / 1000) + 1200
);
```

##### addLiquidity

Adds liquidity to a token pair.

```solidity
function addLiquidity(
    address tokenA,
    address tokenB,
    uint256 amountADesired,
    uint256 amountBDesired,
    uint256 amountAMin,
    uint256 amountBMin,
    address to,
    uint256 deadline
) external returns (uint256 amountA, uint256 amountB, uint256 liquidity)
```

**Parameters:**
- `tokenA` (address): Address of the first token
- `tokenB` (address): Address of the second token
- `amountADesired` (uint256): Desired amount of tokenA to add
- `amountBDesired` (uint256): Desired amount of tokenB to add
- `amountAMin` (uint256): Minimum amount of tokenA to add
- `amountBMin` (uint256): Minimum amount of tokenB to add
- `to` (address): Address to receive the liquidity tokens
- `deadline` (uint256): Unix timestamp after which the transaction will revert

**Returns:**
- `amountA` (uint256): Actual amount of tokenA added
- `amountB` (uint256): Actual amount of tokenB added
- `liquidity` (uint256): Amount of liquidity tokens minted

**Emits:** `Mint` event from pair

**Gas Estimate:** ~200,000 - 250,000 gas

**Example:**
```typescript
const { amountA, amountB, liquidity } = await router.addLiquidity(
  tokenA.address,
  tokenB.address,
  ethers.parseUnits('100', 18),
  ethers.parseUnits('100', 18),
  ethers.parseUnits('95', 18),
  ethers.parseUnits('95', 18),
  userAddress,
  Math.floor(Date.now() / 1000) + 1200
);
```

##### removeLiquidity

Removes liquidity from a token pair.

```solidity
function removeLiquidity(
    address tokenA,
    address tokenB,
    uint256 liquidity,
    uint256 amountAMin,
    uint256 amountBMin,
    address to,
    uint256 deadline
) external returns (uint256 amountA, uint256 amountB)
```

**Parameters:**
- `tokenA` (address): Address of the first token
- `tokenB` (address): Address of the second token
- `liquidity` (uint256): Amount of liquidity tokens to burn
- `amountAMin` (uint256): Minimum amount of tokenA to receive
- `amountBMin` (uint256): Minimum amount of tokenB to receive
- `to` (address): Address to receive the underlying tokens
- `deadline` (uint256): Unix timestamp after which the transaction will revert

**Returns:**
- `amountA` (uint256): Amount of tokenA received
- `amountB` (uint256): Amount of tokenB received

**Emits:** `Burn` event from pair

**Gas Estimate:** ~150,000 - 200,000 gas

**Example:**
```typescript
const { amountA, amountB } = await router.removeLiquidity(
  tokenA.address,
  tokenB.address,
  ethers.parseUnits('10', 18),
  ethers.parseUnits('9', 18),
  ethers.parseUnits('9', 18),
  userAddress,
  Math.floor(Date.now() / 1000) + 1200
);
```

##### getAmountsOut

Calculates the output amounts for a given input amount and path.

```solidity
function getAmountsOut(uint256 amountIn, address[] calldata path) external view returns (uint256[] memory amounts)
```

**Parameters:**
- `amountIn` (uint256): Amount of input tokens
- `path` (address[]): Array of token addresses for the swap route

**Returns:**
- `amounts` (uint256[]): Array of output amounts for each step in the path

**Example:**
```typescript
const amounts = await router.getAmountsOut(
  ethers.parseUnits('100', 18),
  [tokenA.address, tokenB.address]
);
```

##### getAmountsIn

Calculates the input amounts for a given output amount and path.

```solidity
function getAmountsIn(uint256 amountOut, address[] calldata path) external view returns (uint256[] memory amounts)
```

**Parameters:**
- `amountOut` (uint256): Desired amount of output tokens
- `path` (address[]): Array of token addresses for the swap route

**Returns:**
- `amounts` (uint256[]): Array of input amounts for each step in the path

**Example:**
```typescript
const amounts = await router.getAmountsIn(
  ethers.parseUnits('100', 18),
  [tokenA.address, tokenB.address]
);
```

##### quote

Calculates the output amount for a given input amount based on reserves.

```solidity
function quote(uint256 amountA, uint256 reserveA, uint256 reserveB) external pure returns (uint256 amountB)
```

**Parameters:**
- `amountA` (uint256): Input amount
- `reserveA` (uint256): Reserve of the input token
- `reserveB` (uint256): Reserve of the output token

**Returns:**
- `amountB` (uint256): Calculated output amount

**Example:**
```typescript
const amountB = await router.quote(
  ethers.parseUnits('100', 18),
  ethers.parseUnits('1000', 18),
  ethers.parseUnits('1000', 18)
);
```

---

### DogePumpLPToken

ERC-20 token representing liquidity pool shares.

**Contract Address**: `0x...` (varies per pair)

#### Functions

##### name

Returns the token name.

```solidity
function name() external view returns (string)
```

**Returns:**
- `name` (string): Token name (e.g., "DogePump LP Token")

##### symbol

Returns the token symbol.

```solidity
function symbol() external view returns (string)
```

**Returns:**
- `symbol` (string): Token symbol (e.g., "DPLP")

##### decimals

Returns the number of decimals.

```solidity
function decimals() external view returns (uint8)
```

**Returns:**
- `decimals` (uint8): Number of decimals (usually 18)

##### totalSupply

Returns the total supply of tokens.

```solidity
function totalSupply() external view returns (uint256)
```

**Returns:**
- `totalSupply` (uint256): Total supply of LP tokens

##### balanceOf

Returns the balance of an address.

```solidity
function balanceOf(address account) external view returns (uint256)
```

**Parameters:**
- `account` (address): Address to query

**Returns:**
- `balance` (uint256): Token balance of the address

##### allowance

Returns the amount a spender is allowed to spend.

```solidity
function allowance(address owner, address spender) external view returns (uint256)
```

**Parameters:**
- `owner` (address): Token owner
- `spender` (address): Address to check allowance for

**Returns:**
- `allowance` (uint256): Amount the spender can spend

##### approve

Sets the amount a spender is allowed to spend.

```solidity
function approve(address spender, uint256 amount) external returns (bool)
```

**Parameters:**
- `spender` (address): Address to approve
- `amount` (uint256): Amount to approve

**Returns:**
- `success` (bool): Whether the approval was successful

**Emits:** `Approval` event

##### transfer

Transfers tokens to an address.

```solidity
function transfer(address to, uint256 amount) external returns (bool)
```

**Parameters:**
- `to` (address): Recipient address
- `amount` (uint256): Amount to transfer

**Returns:**
- `success` (bool): Whether the transfer was successful

**Emits:** `Transfer` event

##### transferFrom

Transfers tokens from one address to another.

```solidity
function transferFrom(address from, address to, uint256 amount) external returns (bool)
```

**Parameters:**
- `from` (address): Sender address
- `to` (address): Recipient address
- `amount` (uint256): Amount to transfer

**Returns:**
- `success` (bool): Whether the transfer was successful

**Emits:** `Transfer` event

---

### GraduationManager

Manages token graduation from bonding curve to DEX.

**Contract Address**: `0x...` (to be filled after deployment)

#### Functions

##### checkGraduation

Checks if a token should graduate to the DEX.

```solidity
function checkGraduation(address token) external view returns (bool shouldGraduate, uint256 currentMarketCap)
```

**Parameters:**
- `token` (address): Address of the token to check

**Returns:**
- `shouldGraduate` (bool): Whether the token should graduate
- `currentMarketCap` (uint256): Current market cap of the token

**Example:**
```typescript
const { shouldGraduate, currentMarketCap } = await graduationManager.checkGraduation(tokenAddress);
```

##### executeGraduation

Executes the graduation of a token to the DEX.

```solidity
function executeGraduation(address token) external
```

**Parameters:**
- `token` (address): Address of the token to graduate

**Emits:** `TokenGraduated` event

**Gas Estimate:** ~300,000 gas

**Example:**
```typescript
await graduationManager.executeGraduation(tokenAddress);
```

---

## Frontend Service APIs

### ContractService

Service for interacting with smart contracts.

#### Constructor

```typescript
constructor(provider: ethers.Provider, signer?: ethers.Signer | null)
```

**Parameters:**
- `provider`: Ethers provider for blockchain interaction
- `signer`: Optional signer for write operations

#### Methods

##### initialize

Initializes the service with factory and router addresses.

```typescript
async initialize(factoryAddress: string, routerAddress: string): Promise<void>
```

**Parameters:**
- `factoryAddress`: Address of the factory contract
- `routerAddress`: Address of the router contract

**Throws:**
- `Error`: If initialization fails

**Example:**
```typescript
await contractService.initialize(
  '0x...',
  '0x...'
);
```

##### getTokenInfo

Gets token information.

```typescript
async getTokenInfo(tokenAddress: string): Promise<Token>
```

**Parameters:**
- `tokenAddress`: Address of the token

**Returns:**
- `Token`: Token information object

**Throws:**
- `Error`: If token address is invalid

**Example:**
```typescript
const token = await contractService.getTokenInfo('0x...');
// { address, name, symbol, decimals, totalSupply }
```

##### getTokenBalance

Gets the balance of a token for an address.

```typescript
async getTokenBalance(tokenAddress: string, accountAddress: string): Promise<string>
```

**Parameters:**
- `tokenAddress`: Address of the token
- `accountAddress`: Address to check balance for

**Returns:**
- `string`: Token balance as a string

**Throws:**
- `Error`: If addresses are invalid

**Example:**
```typescript
const balance = await contractService.getTokenBalance('0x...', userAddress);
```

##### approveToken

Approves a token for spending.

```typescript
async approveToken(tokenAddress: string, spenderAddress: string, amount: string): Promise<ethers.ContractTransactionReceipt>
```

**Parameters:**
- `tokenAddress`: Address of the token to approve
- `spenderAddress`: Address to approve for spending
- `amount`: Amount to approve (as a string)

**Returns:**
- `ContractTransactionReceipt`: Transaction receipt

**Throws:**
- `Error`: If signer is not set or approval fails

**Example:**
```typescript
const receipt = await contractService.approveToken(
  '0x...',
  '0x...',
  '1000000000000000000000'
);
```

##### createPool

Creates a new trading pool.

```typescript
async createPool(tokenAAddress: string, tokenBAddress: string): Promise<string>
```

**Parameters:**
- `tokenAAddress`: Address of the first token
- `tokenBAddress`: Address of the second token

**Returns:**
- `string`: Address of the created pool

**Throws:**
- `Error`: If factory or signer is not initialized

**Example:**
```typescript
const poolAddress = await contractService.createPool(
  '0x...',
  '0x...'
);
```

##### getPairAddress

Gets the address of a pair for two tokens.

```typescript
async getPairAddress(tokenAAddress: string, tokenBAddress: string): Promise<string>
```

**Parameters:**
- `tokenAAddress`: Address of the first token
- `tokenBAddress`: Address of the second token

**Returns:**
- `string`: Address of the pair, or zero address if not exists

**Example:**
```typescript
const pairAddress = await contractService.getPairAddress(
  '0x...',
  '0x...'
);
```

##### getPoolInfo

Gets detailed information about a pool.

```typescript
async getPoolInfo(pairAddress: string): Promise<Pool>
```

**Parameters:**
- `pairAddress`: Address of the pair

**Returns:**
- `Pool`: Pool information object

**Example:**
```typescript
const pool = await contractService.getPoolInfo('0x...');
// { address, tokenA, tokenB, reserve0, reserve1, totalSupply, tvl, volume24h, apy, fee, price0, price1 }
```

##### addLiquidity

Adds liquidity to a pool.

```typescript
async addLiquidity(
  tokenAAddress: string,
  tokenBAddress: string,
  amountA: string,
  amountB: string,
  amountAMin: string,
  amountBMin: string,
  to: string,
  deadline: number
): Promise<ethers.ContractTransactionReceipt>
```

**Parameters:**
- `tokenAAddress`: Address of the first token
- `tokenBAddress`: Address of the second token
- `amountA`: Amount of tokenA to add
- `amountB`: Amount of tokenB to add
- `amountAMin`: Minimum amount of tokenA to add
- `amountBMin`: Minimum amount of tokenB to add
- `to`: Address to receive LP tokens
- `deadline`: Transaction deadline (Unix timestamp)

**Returns:**
- `ContractTransactionReceipt`: Transaction receipt

**Example:**
```typescript
const receipt = await contractService.addLiquidity(
  '0x...',
  '0x...',
  '1000000000000000000000',
  '1000000000000000000000',
  '950000000000000000000',
  '950000000000000000000',
  userAddress,
  Math.floor(Date.now() / 1000) + 1200
);
```

##### removeLiquidity

Removes liquidity from a pool.

```typescript
async removeLiquidity(
  tokenAAddress: string,
  tokenBAddress: string,
  liquidity: string,
  amountAMin: string,
  amountBMin: string,
  to: string,
  deadline: number
): Promise<ethers.ContractTransactionReceipt>
```

**Parameters:**
- `tokenAAddress`: Address of the first token
- `tokenBAddress`: Address of the second token
- `liquidity`: Amount of LP tokens to burn
- `amountAMin`: Minimum amount of tokenA to receive
- `amountBMin`: Minimum amount of tokenB to receive
- `to`: Address to receive tokens
- `deadline`: Transaction deadline (Unix timestamp)

**Returns:**
- `ContractTransactionReceipt`: Transaction receipt

**Example:**
```typescript
const receipt = await contractService.removeLiquidity(
  '0x...',
  '0x...',
  '1000000000000000000000',
  '900000000000000000000',
  '900000000000000000000',
  userAddress,
  Math.floor(Date.now() / 1000) + 1200
);
```

##### swapExactTokensForTokens

Swaps exact tokens for tokens.

```typescript
async swapExactTokensForTokens(
  amountIn: string,
  amountOutMin: string,
  path: string[],
  to: string,
  deadline: number
): Promise<ethers.ContractTransactionReceipt>
```

**Parameters:**
- `amountIn`: Exact amount of input tokens
- `amountOutMin`: Minimum amount of output tokens
- `path`: Array of token addresses for the route
- `to`: Address to receive output tokens
- `deadline`: Transaction deadline (Unix timestamp)

**Returns:**
- `ContractTransactionReceipt`: Transaction receipt

**Example:**
```typescript
const receipt = await contractService.swapExactTokensForTokens(
  '1000000000000000000000',
  '950000000000000000000',
  ['0x...', '0x...'],
  userAddress,
  Math.floor(Date.now() / 1000) + 1200
);
```

##### swapTokensForExactTokens

Swaps tokens for exact tokens.

```typescript
async swapTokensForExactTokens(
  amountOut: string,
  amountInMax: string,
  path: string[],
  to: string,
  deadline: number
): Promise<ethers.ContractTransactionReceipt>
```

**Parameters:**
- `amountOut`: Exact amount of output tokens
- `amountInMax`: Maximum amount of input tokens
- `path`: Array of token addresses for the route
- `to`: Address to receive output tokens
- `deadline`: Transaction deadline (Unix timestamp)

**Returns:**
- `ContractTransactionReceipt`: Transaction receipt

##### getAmountsOut

Calculates output amounts for a swap.

```typescript
async getAmountsOut(amountIn: string, path: string[]): Promise<string[]>
```

**Parameters:**
- `amountIn`: Input amount
- `path`: Array of token addresses for the route

**Returns:**
- `string[]`: Array of output amounts for each step

**Example:**
```typescript
const amounts = await contractService.getAmountsOut(
  '1000000000000000000000',
  ['0x...', '0x...']
);
```

##### listenToSwaps

Listens to swap events from a pair.

```typescript
listenToSwaps(pairAddress: string, callback: (event: any) => void): void
```

**Parameters:**
- `pairAddress`: Address of the pair to listen to
- `callback`: Function to call on swap events

**Example:**
```typescript
contractService.listenToSwaps('0x...', (event) => {
  console.log('Swap occurred:', event);
});
```

##### cleanup

Cleans up all listeners and contracts.

```typescript
cleanup(): void
```

**Example:**
```typescript
contractService.cleanup();
```

---

### PriceService

Service for calculating prices and metrics.

#### Constructor

```typescript
constructor(provider: ethers.Provider)
```

**Parameters:**
- `provider`: Ethers provider for blockchain interaction

#### Methods

##### calculatePoolPrice

Calculates the price from pool reserves.

```typescript
calculatePoolPrice(reserve0: string, reserve1: string, decimals0: number, decimals1: number): number
```

**Parameters:**
- `reserve0`: Reserve of token0
- `reserve1`: Reserve of token1
- `decimals0`: Decimals of token0
- `decimals1`: Decimals of token1

**Returns:**
- `number`: Price of token0 in terms of token1

**Example:**
```typescript
const price = priceService.calculatePoolPrice(
  '1000000000000000000000',
  '2000000000000000000000',
  18,
  18
);
// Returns: 2.0 (1 token0 = 2 token1)
```

##### calculateTVL

Calculates the Total Value Locked for a pool.

```typescript
calculateTVL(pool: Pool, tokenPrices: Map<string, number>): number
```

**Parameters:**
- `pool`: Pool information
- `tokenPrices`: Map of token addresses to prices

**Returns:**
- `number`: TVL in USD

**Example:**
```typescript
const tvl = priceService.calculateTVL(pool, tokenPrices);
```

##### calculateAPY

Calculates the Annual Percentage Yield for a pool.

```typescript
calculateAPY(pool: Pool, tokenPrices: Map<string, number>): number
```

**Parameters:**
- `pool`: Pool information
- `tokenPrices`: Map of token addresses to prices

**Returns:**
- `number`: APY as a percentage

**Example:**
```typescript
const apy = priceService.calculateAPY(pool, tokenPrices);
// Returns: 15.5 (15.5% APY)
```

##### calculatePriceImpact

Calculates the price impact of a swap.

```typescript
calculatePriceImpact(
  amountIn: string,
  amountOut: string,
  reserveIn: string,
  reserveOut: string,
  decimalsIn: number,
  decimalsOut: number
): number
```

**Parameters:**
- `amountIn`: Input amount
- `amountOut`: Output amount
- `reserveIn`: Reserve of input token
- `reserveOut`: Reserve of output token
- `decimalsIn`: Decimals of input token
- `decimalsOut`: Decimals of output token

**Returns:**
- `number`: Price impact as a percentage

**Example:**
```typescript
const priceImpact = priceService.calculatePriceImpact(
  '1000000000000000000000',
  '1950000000000000000000',
  '10000000000000000000000',
  '20000000000000000000000',
  18,
  18
);
// Returns: 2.5 (2.5% price impact)
```

##### getPoolPrice

Gets the price, TVL, and APY for a pool with caching.

```typescript
async getPoolPrice(pool: Pool): Promise<{ price0: number; price1: number; tvl: number; apy: number }>
```

**Parameters:**
- `pool`: Pool information

**Returns:**
- `price0`: Price of token0
- `price1`: Price of token1
- `tvl`: Total Value Locked
- `apy`: Annual Percentage Yield

**Example:**
```typescript
const { price0, price1, tvl, apy } = await priceService.getPoolPrice(pool);
```

##### formatPrice

Formats a price for display.

```typescript
formatPrice(price: number, decimals?: number): string
```

**Parameters:**
- `price`: Price to format
- `decimals`: Number of decimal places (default: 6)

**Returns:**
- `string`: Formatted price string

**Example:**
```typescript
const formatted = priceService.formatPrice(2.567890123, 6);
// Returns: "2.567890"
```

##### formatTVL

Formats TVL for display.

```typescript
formatTVL(tvl: number): string
```

**Parameters:**
- `tvl`: TVL to format

**Returns:**
- `string`: Formatted TVL string (e.g., "$1.5M")

**Example:**
```typescript
const formatted = priceService.formatTVL(1500000);
// Returns: "$1.50M"
```

---

### RouterService

Service for handling swap routing and quotes.

#### Constructor

```typescript
constructor(
  contractService: ContractService,
  priceService: PriceService,
  routerAddress: string,
  dcTokenAddress: string
)
```

**Parameters:**
- `contractService`: Contract service instance
- `priceService`: Price service instance
- `routerAddress`: Address of the router contract
- `dcTokenAddress`: Address of the DC token

#### Methods

##### getDirectSwapQuote

Gets a quote for a direct swap.

```typescript
async getDirectSwapQuote(
  tokenIn: Token,
  tokenOut: Token,
  amountIn: string,
  pool: Pool
): Promise<SwapQuote>
```

**Parameters:**
- `tokenIn`: Input token
- `tokenOut`: Output token
- `amountIn`: Input amount
- `pool`: Pool to use for the swap

**Returns:**
- `SwapQuote`: Swap quote information

**Example:**
```typescript
const quote = await routerService.getDirectSwapQuote(
  tokenA,
  tokenB,
  '1000000000000000000000',
  pool
);
// { route, amountIn, amountOut, priceImpact, gasEstimate, path }
```

##### getMultiHopSwapQuote

Gets a quote for a multi-hop swap.

```typescript
async getMultiHopSwapQuote(
  tokenIn: Token,
  tokenOut: Token,
  amountIn: string,
  poolIn: Pool,
  poolOut: Pool
): Promise<SwapQuote>
```

**Parameters:**
- `tokenIn`: Input token
- `tokenOut`: Output token
- `amountIn`: Input amount
- `poolIn`: First pool in the route
- `poolOut`: Second pool in the route

**Returns:**
- `SwapQuote`: Swap quote information

**Example:**
```typescript
const quote = await routerService.getMultiHopSwapQuote(
  tokenA,
  tokenC,
  '1000000000000000000000',
  poolAB,
  poolBC
);
```

##### getBestSwapQuote

Gets the best swap quote (direct or multi-hop).

```typescript
async getBestSwapQuote(
  tokenIn: Token,
  tokenOut: Token,
  amountIn: string,
  pools: Pool[]
): Promise<SwapQuote>
```

**Parameters:**
- `tokenIn`: Input token
- `tokenOut`: Output token
- `amountIn`: Input amount
- `pools`: Available pools

**Returns:**
- `SwapQuote`: Best swap quote

**Throws:**
- `Error`: If no valid route is found

**Example:**
```typescript
const quote = await routerService.getBestSwapQuote(
  tokenA,
  tokenB,
  '1000000000000000000000',
  pools
);
```

##### executeSwap

Executes a swap.

```typescript
async executeSwap(
  tokenIn: Token,
  tokenOut: Token,
  amountIn: string,
  amountOutMin: string,
  slippage: number,
  deadline: number
): Promise<ethers.ContractTransactionReceipt>
```

**Parameters:**
- `tokenIn`: Input token
- `tokenOut`: Output token
- `amountIn`: Input amount
- `amountOutMin`: Minimum output amount
- `slippage`: Slippage tolerance (percentage)
- `deadline`: Transaction deadline (Unix timestamp)

**Returns:**
- `ContractTransactionReceipt`: Transaction receipt

**Example:**
```typescript
const receipt = await routerService.executeSwap(
  tokenA,
  tokenB,
  '1000000000000000000000',
  '950000000000000000000',
  0.5,
  Math.floor(Date.now() / 1000) + 1200
);
```

##### validateSwapParams

Validates swap parameters.

```typescript
validateSwapParams(
  tokenIn: Token,
  tokenOut: Token,
  amountIn: string,
  slippage: number,
  deadline: number
): { valid: boolean; error?: string }
```

**Parameters:**
- `tokenIn`: Input token
- `tokenOut`: Output token
- `amountIn`: Input amount
- `slippage`: Slippage tolerance
- `deadline`: Transaction deadline

**Returns:**
- `valid`: Whether parameters are valid
- `error`: Error message if invalid

**Example:**
```typescript
const { valid, error } = routerService.validateSwapParams(
  tokenA,
  tokenB,
  '1000000000000000000000',
  0.5,
  Math.floor(Date.now() / 1000) + 1200
);
```

---

### GasEstimator

Service for estimating gas costs.

#### Constructor

```typescript
constructor(provider: ethers.Provider)
```

**Parameters:**
- `provider`: Ethers provider for blockchain interaction

#### Methods

##### getGasPrice

Gets the current gas price with caching.

```typescript
async getGasPrice(): Promise<string>
```

**Returns:**
- `string`: Current gas price in wei

**Example:**
```typescript
const gasPrice = await gasEstimator.getGasPrice();
```

##### getGasPrices

Gets gas prices for different speeds.

```typescript
async getGasPrices(): Promise<{ slow: string; average: string; fast: string }>
```

**Returns:**
- `slow`: Slow gas price
- `average`: Average gas price
- `fast`: Fast gas price

**Example:**
```typescript
const { slow, average, fast } = await gasEstimator.getGasPrices();
```

##### estimateSwapGas

Estimates gas for a swap.

```typescript
async estimateSwapGas(multiHop?: boolean): Promise<GasEstimate>
```

**Parameters:**
- `multiHop`: Whether the swap is multi-hop (default: false)

**Returns:**
- `GasEstimate`: Gas estimate information

**Example:**
```typescript
const estimate = await gasEstimator.estimateSwapGas(false);
// { gasLimit, gasPrice, gasCost, gasCostUSD, estimatedTime }
```

##### estimateAddLiquidityGas

Estimates gas for adding liquidity.

```typescript
async estimateAddLiquidityGas(): Promise<GasEstimate>
```

**Returns:**
- `GasEstimate`: Gas estimate information

**Example:**
```typescript
const estimate = await gasEstimator.estimateAddLiquidityGas();
```

##### estimateRemoveLiquidityGas

Estimates gas for removing liquidity.

```typescript
async estimateRemoveLiquidityGas(): Promise<GasEstimate>
```

**Returns:**
- `GasEstimate`: Gas estimate information

**Example:**
```typescript
const estimate = await gasEstimator.estimateRemoveLiquidityGas();
```

##### formatGasEstimate

Formats a gas estimate for display.

```typescript
formatGasEstimate(estimate: GasEstimate): {
  gasLimit: string;
  gasPrice: string;
  gasCost: string;
  gasCostUSD: string;
  estimatedTime: string;
}
```

**Parameters:**
- `estimate`: Gas estimate to format

**Returns:**
- Formatted gas estimate object

**Example:**
```typescript
const formatted = gasEstimator.formatGasEstimate(estimate);
// { gasLimit: "200K", gasPrice: "10.00 gwei", gasCost: "0.002 ETH", gasCostUSD: "$0.50", estimatedTime: "1m" }
```

---

### TransactionQueue

Service for managing transaction lifecycle.

#### Constructor

```typescript
constructor(provider: ethers.Provider, storageKey?: string)
```

**Parameters:**
- `provider`: Ethers provider for blockchain interaction
- `storageKey`: LocalStorage key for persistence (default: 'dex_transaction_queue')

#### Methods

##### addTransaction

Adds a transaction to the queue.

```typescript
addTransaction(transaction: Omit<QueuedTransaction, 'id' | 'timestamp' | 'status'>): QueuedTransaction
```

**Parameters:**
- `transaction`: Transaction to add (without id, timestamp, status)

**Returns:**
- `QueuedTransaction`: Added transaction with generated id and timestamp

**Example:**
```typescript
const tx = transactionQueue.addTransaction({
  type: 'swap',
  from: tokenA,
  to: tokenB,
  amountIn: '1000000000000000000000',
  amountOut: '1950000000000000000000',
  gasLimit: '200000',
  gasPrice: '10000000000'
});
```

##### updateTransactionStatus

Updates the status of a transaction.

```typescript
updateTransactionStatus(
  txId: string,
  status: TransactionStatus,
  updates?: Partial<QueuedTransaction>
): QueuedTransaction | null
```

**Parameters:**
- `txId`: Transaction ID
- `status`: New transaction status
- `updates`: Optional additional updates

**Returns:**
- `QueuedTransaction | null`: Updated transaction or null if not found

**Example:**
```typescript
const updated = transactionQueue.updateTransactionStatus('tx_123', 'confirmed', {
  hash: '0x...',
  confirmations: 1
});
```

##### getTransaction

Gets a transaction by ID.

```typescript
getTransaction(txId: string): QueuedTransaction | null
```

**Parameters:**
- `txId`: Transaction ID

**Returns:**
- `QueuedTransaction | null`: Transaction or null if not found

**Example:**
```typescript
const tx = transactionQueue.getTransaction('tx_123');
```

##### getPendingTransactions

Gets all pending transactions.

```typescript
getPendingTransactions(): QueuedTransaction[]
```

**Returns:**
- `QueuedTransaction[]`: Array of pending transactions

**Example:**
```typescript
const pending = transactionQueue.getPendingTransactions();
```

##### speedUpTransaction

Speeds up a transaction by increasing gas price.

```typescript
async speedUpTransaction(txId: string): Promise<QueuedTransaction | null>
```

**Parameters:**
- `txId`: Transaction ID

**Returns:**
- `QueuedTransaction | null`: Updated transaction or null if not found

**Example:**
```typescript
const updated = await transactionQueue.speedUpTransaction('tx_123');
```

##### cancelTransaction

Cancels a transaction.

```typescript
async cancelTransaction(txId: string): Promise<QueuedTransaction | null>
```

**Parameters:**
- `txId`: Transaction ID

**Returns:**
- `QueuedTransaction | null`: Updated transaction or null if not found

**Example:**
```typescript
const cancelled = await transactionQueue.cancelTransaction('tx_123');
```

##### getStatistics

Gets transaction statistics.

```typescript
getStatistics(): TransactionStatistics
```

**Returns:**
- `TransactionStatistics`: Transaction statistics

**Example:**
```typescript
const stats = transactionQueue.getStatistics();
// { total, pending, confirmed, failed, cancelled, speedingUp, successRate, averageConfirmationTime }
```

---

## Component APIs

### DexSwap

Main swap interface component.

#### Props

```typescript
interface DexSwapProps {
  className?: string;
}
```

**Properties:**
- `className`: Optional CSS class name

#### State

The component uses DexContext for state management.

#### Example

```typescript
<DexSwap className="my-swap" />
```

---

### DexPoolList

Pool browsing and filtering component.

#### Props

```typescript
interface DexPoolListProps {
  pools: Pool[];
  onPoolClick?: (pool: Pool) => void;
  className?: string;
  soundsEnabled?: boolean;
}
```

**Properties:**
- `pools`: Array of pools to display
- `onPoolClick`: Optional callback when a pool is clicked
- `className`: Optional CSS class name
- `soundsEnabled`: Whether sound effects are enabled

#### Example

```typescript
<DexPoolList
  pools={pools}
  onPoolClick={(pool) => console.log(pool)}
  soundsEnabled={true}
/>
```

---

### DexPoolCard

Pool display card component.

#### Props

```typescript
interface DexPoolCardProps {
  pool: Pool;
  onClick?: (pool: Pool) => void;
  className?: string;
  soundsEnabled?: boolean;
}
```

**Properties:**
- `pool`: Pool to display
- `onClick`: Optional callback when card is clicked
- `className`: Optional CSS class name
- `soundsEnabled`: Whether sound effects are enabled

#### Example

```typescript
<DexPoolCard
  pool={pool}
  onClick={(pool) => navigate(`/dex/pool/${pool.address}`)}
/>
```

---

### DexAddLiquidity

Add liquidity interface component.

#### Props

```typescript
interface DexAddLiquidityProps {
  pool?: Pool;
  className?: string;
}
```

**Properties:**
- `pool`: Optional pool to add liquidity to
- `className`: Optional CSS class name

#### Example

```typescript
<DexAddLiquidity pool={pool} />
```

---

### DexRemoveLiquidity

Remove liquidity interface component.

#### Props

```typescript
interface DexRemoveLiquidityProps {
  pool: Pool;
  className?: string;
}
```

**Properties:**
- `pool`: Pool to remove liquidity from
- `className`: Optional CSS class name

#### Example

```typescript
<DexRemoveLiquidity pool={pool} />
```

---

### DexLiquidityPositions

Liquidity position management component.

#### Props

```typescript
interface DexLiquidityPositionsProps {
  className?: string;
}
```

**Properties:**
- `className`: Optional CSS class name

#### Example

```typescript
<DexLiquidityPositions />
```

---

### DexPoolDetail

Pool detail view component.

#### Props

```typescript
interface DexPoolDetailProps {
  pool: Pool;
  className?: string;
}
```

**Properties:**
- `pool`: Pool to display details for
- `className`: Optional CSS class name

#### Example

```typescript
<DexPoolDetail pool={pool} />
```

---

### DexTransactionSummary

Transaction display component.

#### Props

```typescript
interface DexTransactionSummaryProps {
  transaction: Transaction;
  className?: string;
}
```

**Properties:**
- `transaction`: Transaction to display
- `className`: Optional CSS class name

#### Example

```typescript
<DexTransactionSummary transaction={tx} />
```

---

### DexSettings

Settings management component.

#### Props

```typescript
interface DexSettingsProps {
  className?: string;
}
```

**Properties:**
- `className`: Optional CSS class name

#### Example

```typescript
<DexSettings />
```

---

## TypeScript Types

### Token

```typescript
interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  balance?: string;
  price?: number;
}
```

### Pool

```typescript
interface Pool {
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
```

### SwapRoute

```typescript
interface SwapRoute {
  path: string[];
  outputAmount: string;
  priceImpact: number;
  gasEstimate: string;
}
```

### Transaction

```typescript
interface Transaction {
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
```

### DexSettings

```typescript
interface DexSettings {
  slippage: number;
  deadline: number;
  expertMode: boolean;
  soundsEnabled: boolean;
  notificationsEnabled: boolean;
}
```

### GasEstimate

```typescript
interface GasEstimate {
  gasLimit: string;
  gasPrice: string;
  gasCost: string;
  gasCostUSD: number;
  estimatedTime: number;
}
```

### SwapQuote

```typescript
interface SwapQuote {
  route: string[];
  amountIn: string;
  amountOut: string;
  priceImpact: number;
  gasEstimate: string;
  path: string[];
}
```

### LiquidityQuote

```typescript
interface LiquidityQuote {
  amountA: string;
  amountB: string;
  liquidity: string;
  share: number;
}
```

---

## Event Interfaces

### Swap Event

```typescript
interface SwapEvent {
  sender: string;
  amount0In: string;
  amount1In: string;
  amount0Out: string;
  amount1Out: string;
  to: string;
}
```

### Mint Event

```typescript
interface MintEvent {
  sender: string;
  amount0: string;
  amount1: string;
}
```

### Burn Event

```typescript
interface BurnEvent {
  sender: string;
  amount0: string;
  amount1: string;
  to: string;
}
```

### PairCreated Event

```typescript
interface PairCreatedEvent {
  token0: string;
  token1: string;
  pair: string;
  allPairsLength: number;
}
```

---

## Error Codes

### Contract Errors

| Code | Message | Description |
|------|----------|-------------|
| `INVALID_TOKEN_ADDRESS` | Invalid token address provided |
| `INSUFFICIENT_LIQUIDITY` | Not enough liquidity in the pool |
| `INSUFFICIENT_OUTPUT_AMOUNT` | Output amount is below minimum |
| `INVALID_DEADLINE` | Transaction deadline has passed |
| `TRANSFER_FAILED` | Token transfer failed |
| `K` | Constant product invariant violated |
| `FORBIDDEN` | Operation not allowed (access control) |

### Service Errors

| Code | Message | Description |
|------|----------|-------------|
| `SIGNER_NOT_SET` | Signer not initialized |
| `FACTORY_NOT_INITIALIZED` | Factory contract not initialized |
| `ROUTER_NOT_INITIALIZED` | Router contract not initialized |
| `INVALID_AMOUNT` | Invalid amount provided |
| `INVALID_SLIPPAGE` | Invalid slippage tolerance |
| `TRANSACTION_FAILED` | Transaction execution failed |

### Component Errors

| Code | Message | Description |
|------|----------|-------------|
| `TOKEN_NOT_SELECTED` | Token not selected |
| `INSUFFICIENT_BALANCE` | Insufficient token balance |
| `APPROVAL_REQUIRED` | Token approval required |
| `SWAP_FAILED` | Swap operation failed |
| `LIQUIDITY_FAILED` | Liquidity operation failed |

---

**Last Updated:** December 30, 2025
