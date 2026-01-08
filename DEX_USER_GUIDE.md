# DEX User Guide

Complete user guide for the Dogepump Decentralized Exchange (DEX).

## Table of Contents

- [Introduction](#introduction)
- [Getting Started](#getting-started)
- [Swapping Tokens](#swapping-tokens)
- [Adding Liquidity](#adding-liquidity)
- [Removing Liquidity](#removing-liquidity)
- [Viewing LP Positions](#viewing-lp-positions)
- [Browsing Pools](#browsing-pools)
- [Understanding Slippage](#understanding-slippage)
- [Understanding Gas Fees](#understanding-gas-fees)
- [Understanding Price Impact](#understanding-price-impact)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)

---

## Introduction

### What is a DEX?

A **Decentralized Exchange (DEX)** is a peer-to-peer marketplace where cryptocurrency transactions occur directly between crypto traders. Unlike centralized exchanges (like Coinbase or Binance), DEXs don't rely on banks or brokers to execute trades.

### The Dogepump DEX

The Dogepump DEX is built on the Dogechain network and uses an **Automated Market Maker (AMM)** model. This means:

- **No Order Books**: Trades are executed against liquidity pools
- **Continuous Liquidity**: Liquidity is always available
- **Permissionless**: Anyone can create pools or add liquidity
- **Non-Custodial**: You always control your funds

### Key Concepts

#### Liquidity Pools
Liquidity pools are smart contracts that hold pairs of tokens. Users provide liquidity (both tokens in a pair) and earn fees from trades.

#### LP Tokens
When you add liquidity to a pool, you receive **LP (Liquidity Provider) tokens**. These represent your share of the pool and can be redeemed for your portion of the pool's assets plus earned fees.

#### Constant Product Formula
The DEX uses the formula `x * y = k` to determine prices, where:
- `x` = reserve of token A
- `y` = reserve of token B
- `k` = constant (total liquidity)

This ensures that as one token is bought, the other becomes more expensive, maintaining balance.

---

## Getting Started
 
### Prerequisites
 
Before using the DEX, you need:
 
1. **A Web3 Wallet**: MetaMask, Trust Wallet, or similar
2. **Dogechain**: Added to your wallet
3. **DC Tokens**: The native token for gas and trading
 
### Navigating to DEX

The Dogepump DEX is fully integrated into the platform and can be accessed through multiple navigation points:

#### Desktop Navigation
- **Navbar**: Click on the **"DEX"** link in the top navigation bar
- **Home Page**: Click on the **"Swap Now"** button in the DEX highlights section
- **Token Detail Page**: For graduated tokens, click on **"Swap"** or **"Add Liquidity"** buttons in the DEX Pool section

#### Mobile Navigation
- **Mobile Navigation Bar**: Tap on the **"DEX"** icon in the bottom navigation bar
- **Home Page**: Tap on the **"Swap Now"** button in the DEX highlights section
- **Token Detail Page**: For graduated tokens, tap on **"Swap"** or **"Add Liquidity"** buttons in the DEX Pool section

#### Direct URLs
You can also access DEX pages directly using these URLs:
- **Swap**: `/dex/swap`
- **Pools**: `/dex/pools`
- **Liquidity**: `/dex/liquidity`

### Adding Dogechain to Your Wallet

**MetaMask:**

1. Open MetaMask
2. Click the network dropdown
3. Click "Add Network" or "Custom RPC"
4. Enter the following details:
   - **Network Name**: Dogechain
   - **RPC URL**: `https://rpc.dogechain.dog`
   - **Chain ID**: `2000`
   - **Currency Symbol**: DC
   - **Block Explorer**: `https://explorer.dogechain.dog`

### Connecting Your Wallet

1. Navigate to the DEX page
2. Click "Connect Wallet"
3. Select your wallet provider
4. Approve the connection request

---

## Swapping Tokens

### How to Swap

1. **Select Tokens**
   - Click on the "From" token selector
   - Choose the token you want to swap
   - Click on the "To" token selector
   - Choose the token you want to receive

2. **Enter Amount**
   - Type the amount you want to swap in the "From" field
   - The "To" field will automatically calculate the expected output

3. **Review Details**
   - Check the exchange rate
   - Review the price impact
   - Check the minimum amount you'll receive (slippage)
   - Review gas fees

4. **Execute Swap**
   - Click "Swap"
   - Approve the transaction in your wallet
   - Wait for confirmation

### Understanding Swap Details

#### Exchange Rate
Shows the current rate: `1 Token A = X Token B`

#### Price Impact
The effect your trade has on the pool's price:
- **< 0.1%**: Excellent
- **0.1-1%**: Good
- **1-5%**: Acceptable
- **> 5%**: High impact, consider reducing amount

#### Minimum Received
The minimum amount you'll receive, accounting for slippage tolerance.

#### Gas Fees
The cost to execute the transaction on the blockchain.

### Advanced Swap Features

#### Multi-Hop Swaps
If there's no direct pool between two tokens, the DEX will find the best route through intermediate tokens (usually DC).

#### Slippage Settings
Adjust your slippage tolerance in settings:
- **Low (0.1%)**: More protection, higher chance of failure
- **Medium (0.5%)**: Balanced (default)
- **High (1%+)**: Less protection, lower chance of failure

---

## Adding Liquidity

### How to Add Liquidity

1. **Navigate to Liquidity**
   - Click on "Liquidity" in the DEX navigation

2. **Select Token Pair**
   - Choose the two tokens you want to provide liquidity for
   - If no pool exists, you'll create a new one

3. **Enter Amounts**
   - Enter the amount of the first token
   - The system will calculate the optimal amount of the second token
   - Or enter both amounts manually

4. **Review Details**
   - Check the LP tokens you'll receive
   - Review your pool share percentage
   - Check the price ratio

5. **Add Liquidity**
   - Click "Add Liquidity"
   - Approve token spending if required
   - Confirm the transaction

### First-Time Liquidity Provider

If you're the first to add liquidity to a pool:
- You set the initial price ratio
- This is a critical decision - ensure the ratio reflects market prices
- You'll receive 100% of the LP tokens initially

### Understanding LP Tokens

#### What are LP Tokens?
LP tokens represent your share of the liquidity pool. They:
- Track your ownership percentage
- Entitle you to trading fees
- Can be transferred or sold
- Increase in value as fees accumulate

#### Pool Share
Your percentage of the pool:
```
Pool Share = (Your LP Tokens / Total LP Tokens) × 100%
```

### Risks of Providing Liquidity

#### Impermanent Loss
When you provide liquidity, you're exposed to **impermanent loss**:
- Occurs when token prices diverge
- You could have more value if you just held the tokens
- "Impermanent" because it can reverse if prices return to original ratio

**Example:**
```
Initial: 1 ETH + 1000 USDC = $2000 total
Price change: ETH doubles to $2000
If held: 1 ETH + 1000 USDC = $3000
In pool: ~0.707 ETH + ~1414 USDC = ~$2828
Impermanent Loss: ~5.7%
```

---

## Removing Liquidity

### How to Remove Liquidity

1. **Navigate to Liquidity Positions**
   - Click on "Positions" in the DEX navigation

2. **Select Position**
   - Find the pool you want to remove liquidity from
   - Click on the position card

3. **Enter LP Amount**
   - Enter the amount of LP tokens to remove
   - Or click "Max" to remove all liquidity

4. **Review Details**
   - Check the token amounts you'll receive
   - Review the fees earned
   - Check gas fees

5. **Remove Liquidity**
   - Click "Remove Liquidity"
   - Confirm the transaction

### Partial vs Full Removal

#### Partial Removal
- Remove a percentage of your position
- Keep some liquidity in the pool
- Continue earning fees on remaining position

#### Full Removal
- Remove all your liquidity
- Receive all your tokens plus earned fees
- Stop earning fees from that pool

---

## Viewing LP Positions

### Accessing Your Positions

1. Navigate to the DEX
2. Click on "Positions"
3. View all your liquidity positions

### Position Information

Each position shows:

#### Pool Details
- Token pair
- Pool address
- Current TVL (Total Value Locked)

#### Your Position
- LP token balance
- Pool share percentage
- Value of your position

#### Performance
- Fees earned
- APY (Annual Percentage Yield)
- Price change

### Managing Positions

From the positions page, you can:
- View detailed pool information
- Add more liquidity
- Remove liquidity
- Track performance over time

---

## Browsing Pools

### Accessing Pools

1. Navigate to the DEX
2. Click on "Pools"
3. Browse all available liquidity pools

### Pool Information

Each pool displays:

#### Basic Info
- Token pair symbols
- Pool address
- Token logos

#### Metrics
- **TVL**: Total Value Locked in the pool
- **24h Volume**: Trading volume in the last 24 hours
- **APY**: Estimated annual return for liquidity providers
- **Price**: Current exchange rate

### Sorting and Filtering

#### Sort Options
- **TVL**: Sort by total value locked
- **Volume**: Sort by 24-hour trading volume
- **APY**: Sort by estimated annual return

#### Search
- Search by token symbol or name
- Find pools containing specific tokens

### Pool Details

Click on a pool to view:
- Detailed token information
- Historical price charts
- Recent transactions
- Liquidity providers list

---

## Understanding Slippage

### What is Slippage?

Slippage is the difference between the expected price of a trade and the price at which the trade is actually executed. It occurs because:

- Other trades happen between your transaction submission and confirmation
- Pool reserves change during this time
- Large trades significantly impact pool prices

### Slippage Tolerance

Your slippage tolerance is the maximum price deviation you're willing to accept:

#### Low Tolerance (0.1%)
- More protection against price changes
- Higher chance of transaction failure
- Best for stable pairs with high liquidity

#### Medium Tolerance (0.5%)
- Balanced protection
- Moderate failure rate
- Good for most trades

#### High Tolerance (1%+)
- Less protection
- Lower failure rate
- Necessary for volatile or low-liquidity pairs

### Setting Slippage

1. Click the settings (⚙️) icon
2. Adjust the slippage tolerance
3. Choose a preset or enter a custom value

### When to Adjust Slippage

**Increase slippage when:**
- Trading volatile tokens
- Trading in low-liquidity pools
- During high network congestion
- Transaction keeps failing

**Decrease slippage when:**
- Trading stable tokens
- Trading in high-liquidity pools
- Want maximum price protection

---

## Understanding Gas Fees

### What are Gas Fees?

Gas fees are payments made to network validators for processing your transactions on the blockchain. On Dogechain:

- Paid in DC tokens
- Vary based on network congestion
- Required for all transactions

### Gas Fee Components

#### Gas Limit
The maximum amount of gas units your transaction can use:
- Swap: ~150,000 - 300,000 gas
- Add Liquidity: ~200,000 - 250,000 gas
- Remove Liquidity: ~150,000 - 200,000 gas

#### Gas Price
The cost per gas unit (in gwei):
- Varies based on network demand
- Higher during peak times

#### Total Gas Cost
```
Total Gas Cost = Gas Limit × Gas Price
```

### Estimating Gas Fees

Before confirming a transaction, you'll see:
- Estimated gas cost in DC
- Estimated gas cost in USD
- Estimated confirmation time

### Reducing Gas Fees

#### Tips for Lower Gas
- **Trade during off-peak hours**: Lower network congestion
- **Use lower gas price**: Slower confirmation but cheaper
- **Batch transactions**: Combine multiple operations
- **Avoid complex routes**: Direct swaps use less gas

#### Gas Speed Settings

**Slow**
- Lowest cost
- Longest confirmation time (5+ minutes)
- Good for non-urgent transactions

**Average**
- Moderate cost
- Medium confirmation time (1-2 minutes)
- Default setting

**Fast**
- Highest cost
- Fastest confirmation time (<1 minute)
- Good for urgent transactions

---

## Understanding Price Impact

### What is Price Impact?

Price impact measures how much your trade affects the pool's exchange rate. It's caused by:

- Large trades relative to pool size
- Low liquidity pools
- Constant product formula mechanics

### Calculating Price Impact

The DEX calculates price impact automatically:

```
Price Impact = ((Expected Output - Actual Output) / Expected Output) × 100%
```

### Price Impact Ranges

#### Excellent (< 0.1%)
- Very small impact on pool price
- Trade has minimal effect on market
- Best for arbitrage and large trades

#### Good (0.1% - 1%)
- Acceptable impact
- Trade has minor effect
- Common for most trades

#### Acceptable (1% - 5%)
- Noticeable impact
- Trade significantly affects pool
- Consider reducing trade size

#### High (> 5%)
- Major impact on pool price
- You're paying a premium
- Strongly consider reducing amount

### Reducing Price Impact

#### Strategies
- **Reduce trade size**: Smaller trades have less impact
- **Wait for more liquidity**: Pool may grow over time
- **Use multiple pools**: Split large trades across pools
- **Trade during high liquidity**: More liquidity = less impact

#### When to Accept High Price Impact
- Urgent trades
- Low-liquidity tokens
- When price appreciation justifies the cost

---

## Troubleshooting

### Common Issues

#### Transaction Failed

**Possible Causes:**
- Insufficient slippage tolerance
- Insufficient gas
- Price moved significantly
- Token approval needed

**Solutions:**
1. Increase slippage tolerance
2. Increase gas limit
3. Wait and retry
4. Approve token spending

#### Transaction Stuck

**Possible Causes:**
- Low gas price
- Network congestion
- Nonce issues

**Solutions:**
1. Wait for confirmation
2. Speed up transaction (higher gas)
3. Cancel and retry

#### Insufficient Balance

**Possible Causes:**
- Not enough tokens for trade
- Not enough DC for gas fees

**Solutions:**
1. Check your token balances
2. Ensure you have enough DC for gas
3. Get more tokens or DC

#### Approval Required

**Possible Causes:**
- First-time trade with a token
- Router contract needs permission

**Solutions:**
1. Click "Approve" button
2. Confirm approval transaction
3. Retry your original transaction

#### Price Impact Too High

**Possible Causes:**
- Large trade size
- Low liquidity pool

**Solutions:**
1. Reduce trade amount
2. Increase slippage tolerance
3. Use a different pool

### Getting Help

If you encounter persistent issues:

1. **Check the FAQ** below
2. **Review the [Troubleshooting Guide](./DEX_TROUBLESHOOTING.md)**
3. **Contact Support** through official channels
4. **Check Community Forums** for similar issues

---

## FAQ

### General Questions

#### Q: Is the Dogepump DEX safe to use?
**A:** The DEX uses audited smart contracts with security features including reentrancy protection, access control, and pause mechanisms. However, always do your own research and never invest more than you can afford to lose.

#### Q: What tokens can I trade?
**A:** You can trade any ERC-20 token on Dogechain. Popular tokens include DC, wDOGE, and various memecoins launched on the platform.

#### Q: Do I need to create an account?
**A:** No, the DEX is non-custodial. You only need a Web3 wallet to interact with the smart contracts.

### Trading Questions

#### Q: Why did my swap fail?
**A:** Common reasons include: insufficient slippage tolerance, price moved significantly, insufficient gas, or unapproved tokens. Try increasing slippage or gas and retry.

#### Q: What's the minimum trade amount?
**A:** There's no hard minimum, but very small trades may fail due to dust limits and gas costs. Generally, trades worth less than $1 in gas fees are not practical.

#### Q: Can I cancel a pending transaction?
**A:** Yes, you can speed up or cancel pending transactions through the transaction queue. Speeding up resubmits with higher gas, while cancelling sends a zero-value transaction with the same nonce.

### Liquidity Questions

#### Q: How much can I earn from providing liquidity?
**A:** Earnings depend on trading volume in your pool and your share of the pool. Higher volume pools with your share generate more fees.

#### Q: What happens if I'm the only liquidity provider?
**A:** You set the initial price and earn all trading fees. However, you're also exposed to full impermanent loss risk and provide all the liquidity for trades.

#### Q: Can I lose money providing liquidity?
**A:** Yes, through impermanent loss. If token prices diverge significantly, you may have less value than if you simply held the tokens. However, trading fees can offset this loss over time.

#### Q: How do I remove my liquidity?
**A:** Go to "Positions", select your position, enter the LP token amount to remove, and confirm. You'll receive your share of the pool's tokens plus earned fees.

### Technical Questions

#### Q: What gas price should I use?
**A:** Use the "Average" setting for most transactions. Use "Fast" for urgent trades during high congestion. Use "Slow" for non-urgent transactions to save on fees.

#### Q: Why is my transaction taking so long?
**A:** Network congestion or low gas price can cause delays. You can speed up the transaction by resubmitting with a higher gas price.

#### Q: What's the difference between DC and wDOGE?
**A:** DC is the native token of Dogechain, used for gas fees. wDOGE (wrapped DOGE) is an ERC-20 representation of DOGE on Dogechain, used for trading and liquidity.

### Security Questions

#### Q: Is my wallet safe?
**A:** The DEX never has access to your private keys. You approve transactions in your wallet, and only you can sign them. Always verify transaction details before confirming.

#### Q: What happens if the DEX is hacked?
**A:** Liquidity providers could lose funds if the smart contracts are compromised. This is why thorough audits and security measures are critical. Never provide liquidity you can't afford to lose.

#### Q: Can I get scammed on the DEX?
**A:** Yes, be cautious of:
- Fake tokens with similar names
- Pools with suspiciously high APY
- Tokens with no liquidity or trading volume
- Always verify token addresses before trading

---

## Additional Resources

- [DEX Quick Start Guide](./DEX_QUICKSTART.md)
- [DEX Developer Guide](./DEX_DEVELOPER_GUIDE.md)
- [DEX API Reference](./DEX_API_REFERENCE.md)
- [DEX Security Guide](./DEX_SECURITY_GUIDE.md)
- [DEX Troubleshooting](./DEX_TROUBLESHOOTING.md)

---

**Last Updated:** December 30, 2025
