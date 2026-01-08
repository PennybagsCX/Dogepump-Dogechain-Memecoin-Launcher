# DEX Quick Start Guide

Get started with the Dogepump DEX in just 5 minutes.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Step 1: Connect Your Wallet](#step-1-connect-your-wallet)
- [Step 2: Get DC Tokens](#step-2-get-dc-tokens)
- [Step 3: Make Your First Swap](#step-3-make-your-first-swap)
- [Step 4: Add Liquidity](#step-4-add-liquidity)
- [Step 5: View Your Positions](#step-5-view-your-positions)
- [Next Steps](#next-steps)
- [Need Help?](#need-help)

---

## Prerequisites

Before you begin, make sure you have:

### Required Items

- [ ] **Web3 Wallet**: MetaMask, Trust Wallet, or similar
- [ ] **Dogechain Network**: Added to your wallet
- [ ] **DC Tokens**: For gas fees and trading

### Quick Wallet Setup

If you don't have a wallet yet:

1. **Install MetaMask** (recommended)
   - Visit [metamask.io](https://metamask.io)
   - Download and install the extension
   - Create a new wallet
   - **IMPORTANT**: Save your seed phrase securely!

2. **Add Dogechain to MetaMask**
   - Open MetaMask
   - Click network dropdown (top right)
   - Click "Add Network" → "Add a network manually"
   - Enter these details:
     ```
     Network Name: Dogechain
     New RPC URL: https://rpc.dogechain.dog
     Chain ID: 2000
     Currency Symbol: DC
     Block Explorer URL: https://explorer.dogechain.dog
     ```
   - Click "Save"

3. **Get DC Tokens**
   - Visit a faucet or exchange
   - Get some DC tokens for gas fees
   - You'll need at least 0.1 DC to start

---

## Step 1: Connect Your Wallet

### Connecting to the DEX

1. **Navigate to the DEX**
   - Go to the Dogepump platform
   - Click on "DEX" in the navigation menu

2. **Connect Your Wallet**
   - Click the "Connect Wallet" button (top right)
   - Select your wallet provider (e.g., MetaMask)
   - Approve the connection request in your wallet

3. **Verify Connection**
   - You should see your wallet address displayed
   - Your DC balance should be visible
   - The DEX interface should now be active

### Troubleshooting Connection Issues

**Wallet not connecting?**
- Make sure you're on the Dogechain network
- Refresh the page and try again
- Check that your wallet is unlocked

**Wrong network?**
- Click on the network selector in MetaMask
- Select "Dogechain"
- Refresh the DEX page

---

## Step 2: Get DC Tokens

### What are DC Tokens?

DC is the native token of the Dogechain network, used for:
- Paying gas fees (transaction costs)
- Trading as a base pair token
- Providing liquidity in pools

### Getting DC Tokens

#### Option 1: From a Faucet (Testnet)

If you're on testnet:
1. Visit the Dogechain faucet
2. Enter your wallet address
3. Complete the captcha
4. Receive free testnet DC

#### Option 2: From an Exchange

If you're on mainnet:
1. Create an account on a supported exchange
2. Purchase DOGE or other supported tokens
3. Withdraw to your wallet address
4. Bridge or swap to DC on-chain

#### Option 3: Swap Other Tokens

If you have other tokens:
1. Navigate to the DEX swap page
2. Select your token as "From"
3. Select DC as "To"
4. Execute the swap

### Checking Your Balance

After getting DC tokens:
1. Look at the top of the DEX interface
2. Your DC balance should be displayed
3. Make sure you have at least 0.1 DC for gas

---

## Step 3: Make Your First Swap

### Understanding Swaps

A swap exchanges one token for another using the DEX's liquidity pools. You'll pay:
- **Trading fees**: 0.3% of the trade amount
- **Gas fees**: Paid in DC to process the transaction

### Executing Your First Swap

#### 1. Select Your Tokens

1. Click on the "From" token selector
2. Choose the token you want to swap from (e.g., wDOGE)
3. Click on the "To" token selector
4. Choose the token you want to receive (e.g., DC)

#### 2. Enter the Amount

1. Type the amount you want to swap in the "From" field
2. The "To" field will automatically calculate the expected output
3. Example: Swap 100 wDOGE for DC

#### 3. Review the Details

Before confirming, check:
- **Exchange Rate**: `1 wDOGE = X DC`
- **Price Impact**: Should be low (< 1% is good)
- **Minimum Received**: The least you'll receive
- **Gas Fee**: The cost to execute the transaction

#### 4. Execute the Swap

1. Click the "Swap" button
2. Your wallet will open with a transaction request
3. Review the details in your wallet
4. Click "Confirm" to approve the transaction
5. Wait for the transaction to confirm (usually 30-60 seconds)

#### 5. Confirmation

Once confirmed:
- You'll see a success message
- Your token balances will update
- The transaction will appear in your history

### Common First-Time Issues

**"Approval Required" Message**
- This is normal for first-time trades with a token
- Click "Approve" in the DEX
- Confirm the approval transaction in your wallet
- Retry the swap

**Transaction Failed**
- Check if you have enough DC for gas
- Try increasing the slippage tolerance
- Wait a moment and try again

---

## Step 4: Add Liquidity

### Understanding Liquidity

By adding liquidity, you:
- Provide both tokens in a trading pair
- Earn fees from trades in that pool
- Receive LP tokens representing your share
- Can withdraw your tokens at any time

### Adding Your First Liquidity

#### 1. Navigate to Liquidity

1. Click on "Liquidity" in the DEX navigation
2. You'll see the liquidity management interface

#### 2. Select Token Pair

1. Click on the first token selector
2. Choose the token you want to provide (e.g., DC)
3. Click on the second token selector
4. Choose the other token (e.g., wDOGE)

#### 3. Enter Amounts

1. Enter the amount of the first token
2. The system will calculate the optimal amount of the second token
3. Or enter both amounts manually if you prefer

**Tip:** The system maintains the pool's price ratio. If you enter an amount for one token, the optimal amount for the other is calculated automatically.

#### 4. Review the Details

Check:
- **LP Tokens You'll Receive**: Your share of the pool
- **Pool Share**: Percentage of the pool you'll own
- **Price Ratio**: Current exchange rate

#### 5. Add Liquidity

1. Click the "Add Liquidity" button
2. If prompted, approve token spending for both tokens
3. Confirm each approval in your wallet
4. Confirm the add liquidity transaction
5. Wait for confirmation

#### 6. Receive LP Tokens

Once confirmed:
- You'll receive LP tokens in your wallet
- These represent your share of the pool
- You'll start earning trading fees immediately

### First-Time Liquidity Provider

If you're the first to add liquidity to a pool:
- You set the initial price ratio
- This is important - make sure it reflects market prices
- You'll receive 100% of the LP tokens initially

### Understanding LP Tokens

LP tokens are:
- **Proof of ownership**: Show your share of the pool
- **Transferable**: You can send or sell them
- **Valuable**: They increase in value as fees accumulate
- **Redeemable**: Exchange them for your pool share anytime

---

## Step 5: View Your Positions

### Accessing Your Positions

1. Click on "Positions" in the DEX navigation
2. View all your liquidity positions

### Understanding Position Information

Each position shows:

#### Pool Details
- **Token Pair**: Which tokens are in the pool
- **Pool Address**: The smart contract address
- **TVL**: Total value locked in the pool

#### Your Position
- **LP Tokens**: How many LP tokens you own
- **Pool Share**: Your percentage of the pool
- **Position Value**: USD value of your position

#### Performance
- **Fees Earned**: Trading fees you've collected
- **APY**: Estimated annual return
- **Price Change**: How the pool price has changed

### Managing Your Positions

From the positions page, you can:
- **View Details**: Click on a position to see more information
- **Add More Liquidity**: Increase your position
- **Remove Liquidity**: Withdraw your tokens and fees
- **Track Performance**: Monitor your earnings over time

---

## Next Steps

Now that you've completed the quick start, you can:

### Explore More Features

- **Browse Pools**: Discover new trading opportunities
- **Advanced Swapping**: Use multi-hop routes for better prices
- **Liquidity Management**: Add or remove liquidity as needed
- **Track Performance**: Monitor your positions and earnings

### Learn More

- Read the [Complete User Guide](./DEX_USER_GUIDE.md) for detailed information
- Understand [Slippage](./DEX_USER_GUIDE.md#understanding-slippage) and [Price Impact](./DEX_USER_GUIDE.md#understanding-price-impact)
- Learn about [Gas Fees](./DEX_USER_GUIDE.md#understanding-gas-fees) to optimize your transactions

### Stay Safe

- **Never share your seed phrase**
- **Always verify transaction details**
- **Start with small amounts** until you're comfortable
- **Do your own research** before trading new tokens
- **Be aware of impermanent loss** when providing liquidity

---

## Need Help?

### Common Issues

**Transaction stuck?**
- Wait a few minutes for confirmation
- Try speeding up the transaction with higher gas
- Or cancel and retry

**Wrong network?**
- Check your wallet's network selector
- Make sure "Dogechain" is selected

**Insufficient balance?**
- Check you have enough tokens for the trade
- Make sure you have enough DC for gas fees

**Approval failed?**
- Make sure you're approving the correct token
- Check you have enough DC for the approval gas fee

### Getting Support

If you need more help:

1. **Read the FAQ** in the [User Guide](./DEX_USER_GUIDE.md#faq)
2. **Check the [Troubleshooting Guide](./DEX_TROUBLESHOOTING.md)**
3. **Visit the Community** forums for help from other users
4. **Contact Support** through official channels

---

## Quick Reference

### Common Actions

| Action | Where to Find | Time Required | Gas Cost |
|---------|---------------|---------------|-----------|
| Connect Wallet | Top right button | < 1 minute | None |
| Swap Tokens | DEX → Swap | 30-60 seconds | ~0.001-0.005 DC |
| Add Liquidity | DEX → Liquidity | 1-2 minutes | ~0.002-0.008 DC |
| Remove Liquidity | DEX → Positions | 1-2 minutes | ~0.001-0.005 DC |
| View Positions | DEX → Positions | Instant | None |

### Important Numbers

- **Trading Fee**: 0.3%
- **Default Slippage**: 0.5%
- **Recommended Gas**: Average (for most transactions)
- **Minimum Trade**: No hard minimum, but >$1 recommended

### Keyboard Shortcuts

- `Ctrl/Cmd + K`: Open command palette
- `Esc`: Close modals
- `Enter`: Confirm actions (when focused)

---

**Congratulations!** You've completed the DEX quick start. You're now ready to trade and provide liquidity on the Dogepump DEX.

For more detailed information, see the [Complete User Guide](./DEX_USER_GUIDE.md).

---

**Last Updated:** December 30, 2025
