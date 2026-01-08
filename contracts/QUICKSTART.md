# DogePump DEX - Quick Start Guide

Get started with DogePump DEX smart contracts in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- Git installed
- Basic understanding of smart contracts

## Installation (2 minutes)

```bash
# Clone or navigate to contracts directory
cd /path/to/your/project/contracts

# Install dependencies
npm install

# This installs:
# - Hardhat (development framework)
# - OpenZeppelin (security contracts)
# - TypeChain (TypeScript types)
# - Ethers.js (blockchain interaction)
# - Testing libraries
```

## Configuration (1 minute)

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values
nano .env
```

Required environment variables:
```env
# DogeChain RPC URLs
DOGECHAIN_TESTNET_RPC=https://rpc-testnet.dogechain.dog
DOGECHAIN_MAINNET_RPC=https://rpc.dogechain.dog

# Explorer API Keys (optional)
DOGECHAIN_TESTNET_API_KEY=your_api_key
DOGECHAIN_MAINNET_API_KEY=your_api_key

# Wallet Mnemonic (GENERATE NEW WALLET)
# NEVER commit this file!
TESTNET_MNEMONIC=test test wolf crazy sudden okay junior swap nuclear famous stove open
MAINNET_MNEMONIC=your_mainnet_mnemonic_here
```

## Compilation (30 seconds)

```bash
# Compile all contracts
npm run compile

# Output:
# ✓ Compiled contracts in artifacts/contracts/
# ✓ Generated TypeChain types in typechain-types/
# ✓ Gas optimized (200 runs)
```

## Testing (1 minute)

```bash
# Run all tests
npm test

# Expected output:
# ✓ DogePumpFactory: 13 passing
# ✓ DogePumpPair: 18 passing
# ✓ Total: 31 passing tests
```

## Deployment to Testnet (2 minutes)

```bash
# Deploy to DogeChain testnet
npm run deploy:testnet

# This will:
# 1. Deploy DogePumpFactory
# 2. Deploy DogePumpRouter
# 3. Deploy GraduationManager
# 4. Create DC/wDOGE pair
# 5. Save addresses to deployments/testnet.json
```

Expected output:
```
Deploying DogePump DEX to Dogechain Testnet...
Network: dogechain-testnet
Chain ID: 2000
Deploying with account: 0x...

1. Deploying DogePumpFactory...
DogePumpFactory deployed to: 0x...

2. Deploying DogePumpRouter...
DogePumpRouter deployed to: 0x...

3. Deploying GraduationManager...
GraduationManager deployed to: 0x...

4. Creating DC/wDOGE pair...
DC/wDOGE pair created: 0x...

=== Deployment Summary ===
Factory: 0x...
Router: 0x...
GraduationManager: 0x...
DC/wDOGE Pair: 0x...

Deployment completed successfully!

Deployment addresses saved to: deployments/testnet.json
```

## Export ABIs (30 seconds)

```bash
# Export contract ABIs for frontend
node scripts/export-abis.js

# This will:
# 1. Copy all ABIs to abis/ directory
# 2. Create index.js for easy importing
```

Expected output:
```
Exporting contract ABIs...
✓ Exported DogePumpFactory.json
✓ Exported DogePumpPair.json
✓ Exported DogePumpRouter.json
✓ Exported DogePumpLPToken.json
✓ Exported GraduationManager.json
✓ Created index.js

ABIs exported successfully!
Output directory: abis/
```

## Frontend Integration (2 minutes)

### Import Contracts

```typescript
// Import ABIs
import DogePumpFactory from './abis/DogePumpFactory.json';
import DogePumpRouter from './abis/DogePumpRouter.json';
import DogePumpPair from './abis/DogePumpPair.json';

// Import types
import { DogePumpFactory } from './typechain-types/DogePumpFactory';
import { DogePumpRouter } from './typechain-types/DogePumpRouter';
import { DogePumpPair } from './typechain-types/DogePumpPair';

// Initialize contracts
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

const factory = new ethers.Contract(
  factoryAddress,
  DogePumpFactory.abi,
  signer
);

const router = new ethers.Contract(
  routerAddress,
  DogePumpRouter.abi,
  signer
);
```

### Example: Create a Pair

```typescript
// Create a new trading pair
const tx = await factory.createPair(tokenA, tokenB);
const receipt = await tx.wait();

// Get pair address from event
const event = receipt.events.find(e => e.event === 'PairCreated');
const pairAddress = event.args.pair;

// Initialize pair contract
const pair = new ethers.Contract(pairAddress, DogePumpPair.abi, signer);
```

### Example: Add Liquidity

```typescript
// Add liquidity to a pool
const tx = await router.addLiquidity(
  tokenA,
  tokenB,
  amountADesired,
  amountBDesired,
  amountAMin,
  amountBMin,
  userAddress,
  deadline
);
await tx.wait();
```

### Example: Swap Tokens

```typescript
// Swap tokens through DEX
const amounts = await router.getAmountsOut(amountIn, [tokenA, dcToken, tokenB]);

const tx = await router.swapExactTokensForTokens(
  amountIn,
  amounts[amounts.length - 1], // minimum output
  [tokenA, dcToken, tokenB],
  userAddress,
  deadline
);
await tx.wait();
```

## Key Contract Addresses

### DogeChain Mainnet (Chain ID: 2000)
- **DC Token:** `0x7B4328c127B85369D9f82ca0503B000D09CF9180`
- **wDOGE Token:** `0xB7ddC6414bf4F5515b52D8BdD69973Ae205ff101`

### Deployed Contracts (After Deployment)
- **Factory:** (Deployed address)
- **Router:** (Deployed address)
- **GraduationManager:** (Deployed address)
- **DC/wDOGE Pair:** (Deployed address)

## Common Commands

```bash
# Compile contracts
npm run compile

# Run tests
npm test

# Clean build artifacts
npm run clean

# Deploy to testnet
npm run deploy:testnet

# Deploy to mainnet
npm run deploy:mainnet

# Export ABIs
node scripts/export-abis.js

# Generate TypeScript types
npm run typechain
```

## Troubleshooting

### Issue: "Cannot find module"

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Compilation failed"

**Solution:**
```bash
# Clean and recompile
npm run clean
npm run compile
```

### Issue: "Test failed"

**Solution:**
```bash
# Check test output for specific error
npx hardhat test --grep "error"

# Run specific test file
npx hardhat test test/DogePumpPair.test.ts
```

## Next Steps

1. ✅ Review contract code in [`contracts/`](contracts/)
2. ✅ Read [`README.md`](contracts/README.md) for detailed documentation
3. ✅ Check [`IMPLEMENTATION_SUMMARY.md`](contracts/IMPLEMENTATION_SUMMARY.md) for complete overview
4. ⏳ Deploy to testnet and test functionality
5. ⏳ Schedule external security audit
6. ⏳ Integrate with frontend application
7. ⏳ Deploy to mainnet after audit

## Support

- 📖 Documentation: [`README.md`](contracts/README.md)
- 📖 Deployment Guide: [`DEPLOYMENT_GUIDE.md`](contracts/DEPLOYMENT_GUIDE.md)
- 📖 Implementation Summary: [`IMPLEMENTATION_SUMMARY.md`](contracts/IMPLEMENTATION_SUMMARY.md)
- 💬 GitHub Issues: [Create issue](https://github.com/your-repo/issues)
- 💬 Discord: [Join community](https://discord.gg/your-server)
- 🐦 Twitter: [@DogePump](https://twitter.com/dogepump)

## License

MIT License - See LICENSE file for details.
