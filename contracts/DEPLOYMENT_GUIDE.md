# DogePump DEX Deployment Guide

Complete guide for deploying DogePump DEX smart contracts to DogeChain Network.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Installation](#installation)
4. [Compilation](#compilation)
5. [Testing](#testing)
6. [Deployment](#deployment)
7. [Verification](#verification)
8. [Post-Deployment](#post-deployment)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools
- Node.js 18.x or higher
- npm or yarn
- Git
- A wallet with DC tokens for gas fees

### Required Knowledge
- Basic understanding of Solidity and smart contracts
- Familiarity with Hardhat development framework
- Understanding of AMM (Automated Market Maker) concepts

### Network Information

#### DogeChain Mainnet
- **Chain ID:** 2000
- **RPC URL:** https://rpc.dogechain.dog
- **Explorer:** https://explorer.dogechain.dog
- **Native Currency:** DC (DogeChain)

#### DogeChain Testnet
- **Chain ID:** 2000
- **RPC URL:** https://rpc-testnet.dogechain.dog
- **Explorer:** https://explorer-testnet.dogechain.dog
- **Native Currency:** DC (DogeChain)

### Token Addresses

| Network | DC Token | wDOGE Token |
|----------|-----------|--------------|
| Mainnet | 0x7B4328c127B85369D9f82ca0503B000D09CF9180 | 0xB7ddC6414bf4F5515b52D8BdD69973Ae205ff101 |
| Testnet | (To be deployed) | (To be deployed) |

## Environment Setup

### 1. Clone Repository

```bash
cd /path/to/your/projects
git clone <repository-url>
cd dogepump-dex-contracts
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- Hardhat
- OpenZeppelin contracts
- TypeChain
- Ethers.js
- Testing libraries

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# DogeChain RPC URLs
DOGECHAIN_TESTNET_RPC=https://rpc-testnet.dogechain.dog
DOGECHAIN_MAINNET_RPC=https://rpc.dogechain.dog

# Explorer API Keys (optional, for verification)
DOGECHAIN_TESTNET_API_KEY=your_api_key
DOGECHAIN_MAINNET_API_KEY=your_api_key

# Wallet Mnemonic (GENERATE NEW WALLET FOR PRODUCTION)
# NEVER commit this file to version control!
TESTNET_MNEMONIC=test test wolf crazy sudden okay junior swap nuclear famous stove open
MAINNET_MNEMONIC=your_mainnet_mnemonic_here

# Optional Configuration
GAS_MULTIPLIER=1.2
GAS_PRICE_MODE=auto
```

**⚠️ SECURITY WARNING:** Never commit your `.env` file or share your mnemonic publicly!

## Installation

### Install Dependencies

```bash
npm install
```

### Verify Installation

```bash
npx hardhat --version
```

Expected output: `Hardhat version 2.19.0` or higher

## Compilation

### Compile All Contracts

```bash
npm run compile
```

This will:
1. Compile all Solidity contracts
2. Generate artifacts in `artifacts/contracts/`
3. Optimize bytecode (200 runs)
4. Generate TypeChain types

### Clean Previous Builds

```bash
npm run clean
```

## Testing

### Run All Tests

```bash
npm test
```

### Run Specific Test Suite

```bash
# Test Factory
npx hardhat test test/DogePumpFactory.test.ts

# Test Pair
npx hardhat test test/DogePumpPair.test.ts
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

Coverage reports will be generated in the `coverage/` directory.

### Expected Test Results

All tests should pass:
- ✅ DogePumpFactory: 13 tests
- ✅ DogePumpPair: 18 tests
- ✅ Total: 31 tests

## Deployment

### Testnet Deployment

#### Step 1: Deploy to Testnet

```bash
npm run deploy:testnet
```

This will:
1. Deploy DogePumpFactory
2. Deploy DogePumpRouter
3. Deploy GraduationManager
4. Create DC/wDOGE trading pair
5. Save deployment addresses to `deployments/testnet.json`

#### Step 2: Verify Testnet Deployment

```bash
# Verify Factory
npx hardhat verify --network dogechain-testnet <FACTORY_ADDRESS> <DEPLOYER_ADDRESS>

# Verify Router
npx hardhat verify --network dogechain-testnet <ROUTER_ADDRESS> <FACTORY_ADDRESS> <WDOGE_TOKEN_ADDRESS>

# Verify GraduationManager
npx hardhat verify --network dogechain-testnet <GRADUATION_MANAGER_ADDRESS> <FACTORY_ADDRESS> <ROUTER_ADDRESS> <DC_TOKEN_ADDRESS> <DEPLOYER_ADDRESS> <GRADUATION_THRESHOLD>
```

### Mainnet Deployment

#### Step 1: Deploy to Mainnet

```bash
npm run deploy:mainnet
```

This will:
1. Deploy DogePumpFactory
2. Deploy DogePumpRouter
3. Deploy GraduationManager
4. Create DC/wDOGE trading pair
5. Save deployment addresses to `deployments/mainnet.json`
6. Print verification commands

#### Step 2: Verify Mainnet Deployment

```bash
# Verify Factory
npx hardhat verify --network dogechain <FACTORY_ADDRESS> <DEPLOYER_ADDRESS>

# Verify Router
npx hardhat verify --network dogechain <ROUTER_ADDRESS> <FACTORY_ADDRESS> <WDOGE_TOKEN_ADDRESS>

# Verify GraduationManager
npx hardhat verify --network dogechain <GRADUATION_MANAGER_ADDRESS> <FACTORY_ADDRESS> <ROUTER_ADDRESS> <DC_TOKEN_ADDRESS> <DEPLOYER_ADDRESS> <GRADUATION_THRESHOLD>
```

### Deployment Script Details

The deployment scripts perform the following operations:

1. **Factory Deployment**
   - Deploys with deployer as feeToSetter
   - Gas: ~150,000

2. **Router Deployment**
   - Deploys with factory address and WDC token
   - Gas: ~100,000

3. **GraduationManager Deployment**
   - Deploys with factory, router, DC token, and price oracle
   - Sets graduation threshold to 6900 DC ($6,900 USD)
   - Gas: ~200,000

4. **Initial Pair Creation**
   - Creates DC/wDOGE pair automatically
   - Gas: ~250,000

### Deployment Output

After successful deployment, you'll see:

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

## Verification

### Prerequisites for Verification

1. **Explorer API Key**
   - Get an API key from DogeChain explorer
   - Add to `.env` file

2. **Contract Source Code**
   - Contracts must be public on GitHub
   - Source code must match deployed bytecode

### Verification Commands

The deployment script will print verification commands after deployment. Copy and run them:

```bash
# Example verification command
npx hardhat verify --network dogechain <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

### Constructor Arguments

| Contract | Constructor Arguments |
|-----------|-------------------|
| DogePumpFactory | `<DEPLOYER_ADDRESS>` |
| DogePumpRouter | `<FACTORY_ADDRESS> <WDOGE_TOKEN_ADDRESS>` |
| GraduationManager | `<FACTORY_ADDRESS> <ROUTER_ADDRESS> <DC_TOKEN_ADDRESS> <PRICE_ORACLE_ADDRESS> <GRADUATION_THRESHOLD>` |

### Verification Output

Successful verification:

```
Verifying DogePumpFactory on DogeChain...
Successfully verified contract DogePumpFactory on DogeChain explorer.
Contract address: 0x...
```

## Post-Deployment

### Export ABIs for Frontend

```bash
node scripts/export-abis.js
```

This will:
1. Copy all contract ABIs to `abis/` directory
2. Create `index.js` for easy importing
3. Output directory: `abis/`

### Frontend Integration

Import contracts in your frontend:

```typescript
import { ethers } from 'ethers';
import DogePumpFactory from './abis/DogePumpFactory.json';
import DogePumpRouter from './abis/DogePumpRouter.json';
import DogePumpPair from './abis/DogePumpPair.json';

const factory = new ethers.Contract(
  factoryAddress,
  DogePumpFactory.abi,
  provider
);

const router = new ethers.Contract(
  routerAddress,
  DogePumpRouter.abi,
  provider
);
```

### Update Frontend Configuration

Add deployed addresses to your frontend constants:

```typescript
// constants/dex.ts
export const DEX_CONTRACTS = {
  DOGECHAIN_ID: 2000,
  
  mainnet: {
    factory: '0x...', // Replace with deployed address
    router: '0x...', // Replace with deployed address
    graduationManager: '0x...', // Replace with deployed address
    dcWdogePair: '0x...', // Replace with deployed address
    
    // Native tokens
    DC: '0x7B4328c127B85369D9f82ca0503B000D09CF9180',
    wDOGE: '0xB7ddC6414bf4F5515b52D8BdD69973Ae205ff101',
  },
  
  testnet: {
    factory: '0x...', // Replace with deployed address
    router: '0x...', // Replace with deployed address
    graduationManager: '0x...', // Replace with deployed address
    dcWdogePair: '0x...', // Replace with deployed address
    
    // Native tokens
    DC: '0x...', // Replace with testnet address
    wDOGE: '0x...', // Replace with testnet address
  },
};
```

### Testing Deployed Contracts

After deployment, test the contracts:

1. **Factory Operations**
   ```bash
   # Create a test pair
   npx hardhat console --network dogechain-testnet
   > await factory.createPair(tokenA, tokenB)
   ```

2. **Router Operations**
   ```bash
   # Test a swap
   npx hardhat console --network dogechain-testnet
   > await router.swapExactTokensForTokens(amountIn, amountOutMin, path, to, deadline)
   ```

3. **Pair Operations**
   ```bash
   # Test adding liquidity
   npx hardhat console --network dogechain-testnet
   > await pair.mint(to)
   ```

## Troubleshooting

### Common Issues

#### Issue: "Insufficient funds for gas"

**Solution:** Ensure your wallet has enough DC tokens for gas fees.

```bash
# Check wallet balance
npx hardhat console --network dogechain-testnet
> (await ethers.provider.getBalance(deployer.address)).toString()
```

#### Issue: "Transaction reverted with error: K"

**Solution:** This is a constant product invariant error. Check:
- Pool has sufficient liquidity
- Swap amounts are correct
- No front-running occurred

#### Issue: "Contract verification failed"

**Solution:** 
1. Check constructor arguments match exactly
2. Ensure source code is public on GitHub
3. Wait for a few blocks before verifying
4. Check explorer API key is correct

#### Issue: "Network timeout"

**Solution:**
1. Check RPC URL is correct
2. Check network connectivity
3. Try alternative RPC endpoint
4. Increase timeout in hardhat config

### Gas Optimization

If you're experiencing high gas costs:

1. **Increase Gas Multiplier**
   ```env
   GAS_MULTIPLIER=1.5
   ```

2. **Use Fixed Gas Price**
   ```env
   GAS_PRICE_MODE=fixed
   ```

3. **Check Gas Price**
   ```bash
   npx hardhat run scripts/check-gas-price.js --network dogechain
   ```

### Getting Help

If you encounter issues:

1. **Check Logs**
   - Review deployment output
   - Check Hardhat console logs
   - Review transaction receipts

2. **Verify Contract Addresses**
   - Ensure you're using correct addresses
   - Check explorer for contract verification

3. **Test on Testnet First**
   - Always test on testnet before mainnet
   - Verify all functionality works correctly

4. **Community Support**
   - GitHub Issues: [Create issue]
   - Discord: [Join community]
   - Twitter: @DogePump

## Security Checklist

Before mainnet deployment, ensure:

- [ ] All contracts audited by security firm
- [ ] Testnet deployment completed successfully
- [ ] All tests passing with >90% coverage
- [ ] Gas optimization reviewed
- [ ] Reentrancy protection verified
- [ ] Access control verified
- [ ] Emergency procedures documented
- [ ] Frontend integration tested
- [ ] Monitoring setup configured

## Gas Estimates

| Operation | Gas Limit | Gas Cost (USD) |
|------------|------------|----------------|
| Create Pair | 150,000 | ~$0.01 |
| Add Liquidity | 250,000 | ~$0.02 |
| Remove Liquidity | 200,000 | ~$0.015 |
| Swap (single) | 100,000 | ~$0.008 |
| Swap (multi-hop) | 150,000 | ~$0.012 |

*Estimates based on 20 gwei gas price and $0.0002 DC/USD*

## Maintenance

### Upgrading Contracts

To upgrade contracts in the future:

1. Deploy new version
2. Migrate state if needed
3. Update frontend addresses
4. Deprecate old contracts

### Monitoring

Set up monitoring for:
- Contract events (Mint, Burn, Swap, PairCreated)
- Gas usage trends
- Error rates
- Transaction volumes

## Resources

- [DogeChain Documentation](https://docs.dogechain.dog)
- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/)
- [Ethers.js Documentation](https://docs.ethers.org/)

## License

MIT License - See LICENSE file for details.
