# DogePump DEX Smart Contracts

Production-ready Uniswap V2-style AMM implementation for DogePump Dogechain Memecoin Launcher.

## Overview

This repository contains the smart contracts for the DogePump DEX, a decentralized exchange built on DogeChain Network (Chain ID: 2000). The DEX implements a constant product AMM formula (x * y = k) with 0.3% swap fees.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  GraduationManager                   │
│  (Manages token graduation to AMM)              │
└─────────────────────────────────────────────────────────────────┘
                          │
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DogePumpRouter                    │
│  (Facilitates swaps and liquidity operations)       │
└─────────────────────────────────────────────────────────────────┘
                          │
            ┌─────────────┴─────────────┐
            │                           │
            ▼                           ▼
┌─────────────────────┐    ┌─────────────────────┐
│   DogePumpFactory  │    │   DogePumpPair    │
│  (Creates pairs)    │    │  (AMM liquidity)    │
└─────────────────────┘    └─────────────────────┘
            │                           │
            └───────────┬─────────────┘
                        │
                        ▼
              ┌─────────────────────┐
              │  DogePumpLPToken  │
              │  (ERC-20 LP token)  │
              └─────────────────────┘
```

## Contracts

### Core Contracts

#### DogePumpFactory.sol
Factory contract for creating and managing trading pairs.

**Features:**
- Deterministic pair addresses using CREATE2
- Automatic token ordering
- Protocol fee management
- Pair lookup by token addresses

**Key Functions:**
- `createPair(tokenA, tokenB)` - Create new trading pair
- `getPair(tokenA, tokenB)` - Get pair address
- `allPairs(index)` - Get pair by index
- `allPairsLength()` - Get total pairs count

#### DogePumpPair.sol
AMM pair implementing constant product formula (x * y = k).

**Features:**
- 0.3% swap fee (3 basis points)
- Reentrancy protection
- Flash loan support
- Minimum liquidity lock (1000 LP tokens)
- Cumulative price tracking for TWAP

**Key Functions:**
- `mint(to)` - Add liquidity
- `burn(to)` - Remove liquidity
- `swap(amount0Out, amount1Out, to, data)` - Execute swap
- `skim(to)` - Recover excess tokens
- `sync()` - Sync reserves with balances

**AMM Formula:**
```
x * y = k
amountOut = (amountIn * 997 * reserveOut) / (reserveIn * 1000 + amountIn * 997)
```

#### DogePumpRouter.sol
Router for facilitating swaps and liquidity operations.

**Features:**
- Single and multi-hop swaps
- Slippage protection
- Deadline enforcement
- Native token wrapping/unwrapping support

**Key Functions:**
- `swapExactTokensForTokens()` - Swap exact input for minimum output
- `swapTokensForExactTokens()` - Swap for exact output with maximum input
- `addLiquidity()` - Add liquidity to pool
- `removeLiquidity()` - Remove liquidity from pool
- `getAmountsOut()` - Calculate output amounts
- `getAmountsIn()` - Calculate input amounts

#### DogePumpLPToken.sol
ERC-20 LP token representing share in a liquidity pool.

**Features:**
- Standard ERC-20 implementation
- Mint/burn restricted to pair contract only
- Full OpenZeppelin security

**Key Functions:**
- `mint(to, amount)` - Mint LP tokens (pair only)
- `burn(from, amount)` - Burn LP tokens (pair only)

#### GraduationManager.sol
Manages automatic migration from bonding curve to AMM pools.

**Features:**
- Automatic graduation at $6,900 market cap
- AMM pool creation
- Liquidity migration from bonding curve
- Bonding curve token burning

**Key Functions:**
- `checkAndGraduate(token)` - Check and execute graduation
- `executeGraduation(token)` - Force graduation (admin)
- `setGraduationThreshold(threshold)` - Update threshold (admin)

#### DogePumpLibrary.sol
Library providing helper functions for DEX operations.

**Features:**
- Token sorting
- Pair address calculation (CREATE2)
- Reserve fetching
- Swap calculations with fees
- Multi-hop routing

## Token Addresses

### DogeChain Mainnet (Chain ID: 2000)
- **DC Token:** `0x7B4328c127B85369D9f82ca0503B000D09CF9180`
- **wDOGE Token:** `0xB7ddC6414bf4F5515b52D8BdD69973Ae205ff101`

### DogeChain Testnet
- **DC Token:** (To be deployed)
- **wDOGE Token:** (To be deployed)

## Installation

```bash
# Install dependencies
npm install

# Compile contracts
npm run compile

# Run tests
npm run test

# Generate TypeScript types
npm run typechain
```

## Deployment

### Prerequisites
- Node.js 18+
- Hardhat installed
- Environment variables configured

### Environment Variables

Create a `.env` file in the contracts directory:

```env
# DogeChain RPC URLs
DOGECHAIN_TESTNET_RPC=https://rpc-testnet.dogechain.dog
DOGECHAIN_MAINNET_RPC=https://rpc.dogechain.dog

# Explorer API Keys (for verification)
DOGECHAIN_TESTNET_API_KEY=your_api_key
DOGECHAIN_MAINNET_API_KEY=your_api_key

# Wallet Mnemonic (DO NOT COMMIT THIS)
TESTNET_MNEMONIC=your_testnet_mnemonic
MAINNET_MNEMONIC=your_mainnet_mnemonic
```

### Deploy to Testnet

```bash
npm run deploy:testnet
```

### Deploy to Mainnet

```bash
npm run deploy:mainnet
```

### Verify Contracts

```bash
# Verify testnet contracts
npm run verify:testnet -- <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>

# Verify mainnet contracts
npm run verify:mainnet -- <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

## Testing

### Run All Tests

```bash
npm test
```

### Run Specific Test File

```bash
npx hardhat test test/DogePumpFactory.test.ts
npx hardhat test test/DogePumpPair.test.ts
```

### Test Coverage

```bash
npm run test:coverage
```

Coverage reports will be generated in the `coverage/` directory.

### TypeScript Type-Checking Notes

The contract test files use `@ts-nocheck` at the top of each file. This is intentional and necessary because:

1. **Hardhat Runtime Environment**: These tests run in Hardhat's runtime, not in standard TypeScript
2. **Generated typechain-types**: Tests import from `../typechain-types/` which are generated after compilation
3. **Hardhat-Specific Imports**: Tests use `import { ethers } from 'hardhat'` which is only available in Hardhat runtime

**Why exclude from main TypeScript checking?**

These contract tests are:
- **Excluded from Vitest runs** via `vitest.config.ts` (excludes `contracts/test/`)
- **Excluded from `tsc --noEmit`** via the generated typechain-types not being available during static checking
- **Run separately using Hardhat** (`npx hardhat test`)

**How to run contract tests properly:**

```bash
# Step 1: Compile contracts to generate typechain-types
npx hardhat compile

# Step 2: Run tests with Hardhat
npx hardhat test
```

**Test files excluded from TypeScript checking:**
- `test/DogePumpFactory.test.ts`
- `test/DogePumpPair.test.ts`
- `test/DogePumpRouter.test.ts`
- `test/GraduationManager.test.ts`
- `test/security/*.test.ts` (12 security test files)

These tests **DO NOT** affect production code type-safety. All production TypeScript code is fully type-checked.

## Gas Optimization

All contracts are optimized for gas efficiency:

- **Factory:** ~150,000 gas (pair creation)
- **Pair:** ~100,000 gas (swap)
- **Router:** ~200,000 gas (swap with routing)
- **LP Token:** ~50,000 gas (mint/burn)

## Security Features

### Reentrancy Protection
- All external functions use `nonReentrant` or custom lock modifiers
- State updates happen after external calls

### Input Validation
- Zero address checks
- Amount validation
- Path validation

### Access Control
- Owner-only functions for admin operations
- Fee setter role management

### Flash Loan Protection
- Callback interface for flash loans
- Safe token transfers

## Frontend Integration

### Contract ABIs

After compilation, ABIs are available in `artifacts/contracts/`.

### TypeScript Types

TypeScript types are generated in `typechain-types/`.

### Example Usage

```typescript
import { ethers } from 'ethers';
import DogePumpFactory from './artifacts/contracts/DogePumpFactory/DogePumpFactory.json';

const factory = new ethers.Contract(
  factoryAddress,
  DogePumpFactory.abi,
  signer
);

// Create a pair
const tx = await factory.createPair(tokenA, tokenB);
const receipt = await tx.wait();

// Get pair address
const pairAddress = await factory.getPair(tokenA, tokenB);
```

## Development

### Compile Contracts

```bash
npm run compile
```

### Clean Build Artifacts

```bash
npm run clean
```

## Deployment Addresses

After deployment, addresses are saved to:
- `deployments/testnet.json` - Testnet deployments
- `deployments/mainnet.json` - Mainnet deployments

Example deployment file:

```json
{
  "network": "dogechain-mainnet",
  "chainId": 2000,
  "factory": "0x...",
  "router": "0x...",
  "graduationManager": "0x...",
  "dcWdogePair": "0x...",
  "dcToken": "0x7B4328c127B85369D9f82ca0503B000D09CF9180",
  "wdogeToken": "0xB7ddC6414bf4F5515b52D8BdD69973Ae205ff101",
  "deployer": "0x...",
  "timestamp": "2025-12-30T00:00:00.000Z"
}
```

## Security Audit

Before mainnet deployment:

1. ✅ Internal code review completed
2. ⏳ External security audit pending
3. ⏳ Bug bounty program setup
4. ⏳ Testnet deployment and testing

## License

MIT License - See LICENSE file for details.

## Support

For questions or issues:
- GitHub Issues: [Repository URL]
- Discord: [Discord URL]
- Twitter: @DogePump

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## Disclaimer

These smart contracts have not been audited by a third-party security firm. Use at your own risk. Always review the code and understand the implications before using on mainnet.
