# Token Launch Guide

Complete guide to launching memecoins on DogePump Dogechain Launchpad.

## Table of Contents

1. [Overview](#overview)
2. [Key Concepts](#key-concepts)
3. [Creator Limits](#creator-limits)
4. [Launching a Token](#launching-a-token)
5. [Initial Buy Feature](#initial-buy-feature)
6. [Fair Launch Mechanics](#fair-launch-mechanics)
7. [Graduation System](#graduation-system)
8. [Fees and Costs](#fees-and-costs)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Overview

DogePump is a fair launch memecoin platform on Dogechain. Anyone can launch a token instantly with no presale, no team allocation, and locked liquidity.

### Key Features

- **Instant Deployment**: Tokens are live immediately after creation
- **Bonding Curve**: Price discovery through automated market maker
- **Fair Launch**: No preferential treatment for creators
- **Graduation**: Successful tokens migrate to DEX with burned liquidity
- **Anti-Whale**: Creator limits prevent market manipulation

---

## Key Concepts

### Total Supply

Every token launched on DogePump has a **fixed total supply of 1,000,000,000 (1 billion) tokens**.

### Initial Price

All tokens start at **0.000005 DC per token**.

### Graduation Market Cap

Tokens graduate to DogePump DEX when market cap reaches **$6,900 DC**.

### Bonding Curve

The bonding curve is a mathematical formula that determines token price based on market cap:

```
Price increases as market cap increases
Price = Initial_Price + (Market_Cap / Graduation_Cap) × Price_Multiplier
```

---

## Creator Limits

### Maximum Initial Buy: 3% of Total Supply

**To ensure fair launch and prevent market manipulation, creators are limited to purchasing a maximum of 3% of the total supply during token creation.**

#### What This Means

- **Maximum Tokens**: 30,000,000 tokens (3% of 1 billion)
- **Maximum DC Cost**: 150 DC (at initial price of 0.000005 DC/token)
- **Purpose**: Prevents creators from holding too much supply at launch

#### Why 3%?

The 3% limit balances several factors:

1. **Fairness**: Ensures other traders can participate
2. **Protection**: Prevents creators from dumping on early buyers
3. **Incentive**: Still allows creators to have meaningful skin in the game
4. **Distribution**: Encourages wider token distribution

#### Enforcement

The limit is enforced at multiple levels:

1. **Frontend Validation**: Real-time input validation prevents entering amounts above 150 DC
2. **Backend Validation**: Server-side validation checks during token creation
3. **Smart Contract**: Contract-level restrictions (when deployed)

#### Error Messages

If you attempt to exceed the limit:

- **Frontend**: "Cannot exceed 3% of total supply (150 DC maximum)"
- **Backend**: "Creators cannot buy more than 3% of total supply during launch"

---

## Launching a Token

### Prerequisites

Before launching a token, ensure you have:

- Sufficient DC balance (10,000 DC launch fee + optional initial buy)
- Token image/logo prepared (optional but recommended)
- Token details decided (name, ticker, description)
- Social links prepared (optional)

### Step-by-Step Process

#### 1. Navigate to Launch Page

Visit `/launch` on the DogePump platform.

#### 2. Upload Token Image

- Drag and drop or click to upload
- Supported formats: JPEG, PNG, WebP, AVIF, GIF
- Maximum file size: 10MB
- Recommended: Square image (500×500px or larger)

#### 3. Enter Token Details

**Required Fields:**

- **Name**: Token name (e.g., "Doge Moon")
- **Ticker**: Symbol (e.g., "DOGE_MOON", max 8 characters)
- **Description**: Explain your token's purpose

**Optional Fields:**

- **Website**: Project website URL
- **Twitter/X**: Social media link
- **Telegram**: Community link
- **Discord**: Server invite link

#### 4. Set Initial Buy (Optional)

Enter amount in DC (maximum 150 DC = 3% of supply)

**Benefits of Initial Buy:**
- Get in before snipers
- Demonstrate confidence
- Better entry price

**Important Notes:**
- You cannot buy more than 3% of supply
- This is the ONLY time you can buy as creator with this limit
- After launch, you can buy more like any other trader

#### 5. Review and Launch

- Preview your token card
- Verify all details
- Click "Launch Coin"
- Pay 10,000 DC deployment fee + initial buy (if set)

#### 6. Token Goes Live

- Token is immediately tradable
- Appears on homepage
- Initial buy executed (if set)
- Others can now trade

---

## Initial Buy Feature

### What Is Initial Buy?

The "Initial Buy" feature allows creators to purchase tokens during the deployment transaction, ensuring they get the best possible price before snipers.

### How It Works

1. **During Token Creation**: Enter amount in DC (max 150 DC)
2. **Deployment**: Token deploys with your purchase in same block
3. **Execution**: Buy executes immediately after deployment
4. **Receipt**: Tokens added to your balance

### Calculations

At initial price of 0.000005 DC per token:

| DC Amount | Tokens Received | % of Supply |
|-----------|----------------|-------------|
| 50 DC     | 10,000,000     | 1%          |
| 100 DC    | 20,000,000     | 2%          |
| 150 DC    | 30,000,000     | 3% (max)    |

### Validation

The system validates:

- Minimum: 0 DC (optional)
- Maximum: 150 DC (3% of supply)
- Real-time feedback as you type
- Error prevention

### Why Use Initial Buy?

**Pros:**
- Beat snipers to best price
- Show commitment to project
- Secure early position
- Simple execution

**Cons:**
- Still costs DC (not free)
- Limited to 3% max
- Irreversible once deployed

---

## Fair Launch Mechanics

### What Makes It Fair?

DogePump implements several mechanisms to ensure fairness:

#### 1. No Presale

- No early investor discounts
- No team allocations
- No VC preferential treatment
- Everyone buys on the open market

#### 2. No Mint Authority

- Total supply fixed at 1 billion
- No inflation possible
- No hidden minting
- Supply transparent

#### 3. Creator Limits

- 3% maximum initial purchase
- Prevents excessive early accumulation
- Levels playing field

#### 4. Locked Liquidity

- Liquidity locked until graduation
- Cannot rug pull
- Automated migration to DEX

#### 5. Public Bonding Curve

- Price formula visible
- Market cap transparent
- Trades visible on-chain

### Anti-Manipulation Measures

#### Sniping Protection

- Initial buy in same block as deployment
- First-come, first-served after launch
- No preferential access

#### Anti-Whale

- Creator limits on initial buy
- Normal trading limits apply after launch
- No special privileges

#### Anti-Dump

- Bonding curve moderates price impact
- Gradual price discovery
- Liquidity locked

---

## Graduation System

### What Is Graduation?

When a token reaches $6,900 DC market cap, it "graduates" from the bonding curve to DogePump DEX.

### Graduation Process

1. **Threshold**: Market cap hits $6,900 DC (100% progress)
2. **Migration**: Liquidity automatically migrated to DEX
3. **LP Tokens**: Burned or sent to creator (depending on implementation)
4. **Trading**: Continues on DEX with standard AMM

### Progress Calculation

```
Progress % = (Current_Market_Cap / 6,900) × 100
```

**Examples:**

- $3,450 market cap = 50% progress
- $6,210 market cap = 90% progress
- $6,900 market cap = 100% (graduated)

### Benefits of Graduation

- **Deeper Liquidity**: DEX provides more liquidity
- **Price Stability**: Reduced volatility
- **Burned LP**: Permanent liquidity on-chain
- **Credibility**: Signals successful launch

---

## Fees and Costs

### Launch Fee

**10,000 DC** one-time deployment fee

This fee covers:
- Smart contract deployment
- Platform maintenance
- Development costs

### Trading Fees

**Before Graduation:**
- Buy: 1% fee
- Sell: 1% fee

**After Graduation:**
- Standard DEX fees (typically 0.3-0.5%)

### Total Cost Example

Launching with 150 DC initial buy:

```
Launch Fee:    10,000 DC
Initial Buy:      150 DC
-----------------------
Total:         10,150 DC
```

---

## Best Practices

### Before Launch

1. **Test Small**: Start with smaller amounts to learn the process
2. **Prepare Assets**: Have image and descriptions ready
3. **Plan Marketing**: Prepare social media announcements
4. **Set Budget**: Know your maximum spend (fee + initial buy)

### During Launch

1. **Double-Check Details**: Verify name, ticker, description
2. **Consider Initial Buy**: Decide if you want to buy in (up to 150 DC)
3. **Monitor Deployment**: Watch for successful launch
4. **Be Ready to Engage**: Respond to early community interest

### After Launch

1. **Engage Community**: Be active in comments and social media
2. **Provide Updates**: Keep traders informed
3. **Avoid Manipulation**: Don't promise unrealistic returns
4. **Build Trust**: Be transparent about your project

### Marketing Tips

1. **Unique Concept**: Stand out from other tokens
2. **Clear Vision**: Explain what makes your token special
3. **Professional Branding**: Use quality images and graphics
4. **Community First**: Build a genuine community
5. **Real Utility**: Have a plan beyond just "number go up"

---

## Troubleshooting

### Common Issues

#### Issue: "Insufficient Balance" Error

**Cause**: Not enough DC for launch fee + initial buy

**Solution**:
- Check your DC balance
- Remember: 10,000 DC fee + initial buy
- Get DC from faucet or buy on exchange

#### Issue: "Cannot Exceed 3% of Supply" Error

**Cause**: Initial buy amount exceeds 150 DC

**Solution**:
- Reduce initial buy to 150 DC or less
- Remember: 150 DC = 30M tokens = 3% of supply

#### Issue: Image Upload Fails

**Cause**: File too large, wrong format, or network error

**Solution**:
- Check file size (max 10MB)
- Verify format (JPEG, PNG, WebP, AVIF, GIF)
- Try different image
- Check internet connection

#### Issue: Token Not Appearing

**Cause**: Deployment delay or caching

**Solution**:
- Wait 1-2 minutes
- Refresh page
- Check browser console for errors
- Verify transaction completed

#### Issue: Initial Buy Didn't Execute

**Cause**: Insufficient balance or transaction failed

**Solution**:
- Check transaction in explorer
- Verify balance was sufficient
- Contact support if issue persists

### Getting Help

If you encounter issues not covered here:

1. Check the [FAQ](#faq)
2. Review [Documentation](../README.md#documentation)
3. Check server logs for errors
4. Open an issue on GitHub
5. Contact support

---

## FAQ

### Q: Can I launch a token for free?

**A**: No, there's a 10,000 DC deployment fee. This covers contract deployment and platform costs.

### Q: Why is there a 3% creator limit?

**A**: To ensure fair launch and prevent creators from accumulating too much supply, which could harm early traders.

### Q: Can I buy more than 3% after launch?

**A**: Yes! The 3% limit only applies to the initial buy during token creation. After launch, you can buy more like any other trader, subject to normal trading limits.

### Q: What happens to unsold tokens?

**A**: All 1 billion tokens exist from deployment. Unsold tokens remain in the bonding curve and can be purchased by anyone.

### Q: Can I change my token details after launch?

**A**: No, token details (name, ticker, supply) are immutable after deployment. However, you can update social links.

### Q: How long does deployment take?

**A**: Typically 10-30 seconds, depending on network conditions.

### Q: What if my token never graduates?

**A**: Tokens that don't reach $6,900 market cap remain on the bonding curve indefinitely. Trading continues as long as there's liquidity.

### Q: Can I relaunch a failed token?

**A**: Yes, you can launch a new token with the same parameters, but it will be a separate token with its own contract.

### Q: Is there a minimum market cap to graduate?

**A**: No, but tokens need to reach $6,900 market cap to graduate, which requires significant trading activity.

### Q: What happens to the liquidity after graduation?

**A**: Liquidity is migrated to DogePump DEX and LP tokens are typically burned, making the liquidity permanent.

---

## Resources

- [Platform README](../README.md)
- [Quick Start Guide](./QUICKSTART.md)
- [API Documentation](./server/API_REFERENCE.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Troubleshooting](./TROUBLESHOOTING.md)

---

## Constants Reference

### Token Launch Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `TOTAL_SUPPLY` | 1,000,000,000 | Total token supply |
| `INITIAL_TOKEN_PRICE` | 0.000005 DC | Starting price |
| `MAX_CREATOR_BUY_PERCENTAGE` | 0.03 (3%) | Max creator initial buy |
| `MAX_CREATOR_BUY_DC` | 150 DC | Max DC for creator initial buy |
| `GRADUATION_MARKETCAP` | 6,900 DC | Market cap for graduation |
| `LAUNCH_FEE` | 10,000 DC | Deployment fee |

### Calculations

**Maximum Creator Initial Buy:**
```
Max Tokens = Total_Supply × Max_Percentage
Max Tokens = 1,000,000,000 × 0.03 = 30,000,000 tokens

Max DC = Max_Tokens × Initial_Price
Max DC = 30,000,000 × 0.000005 = 150 DC
```

**Progress to Graduation:**
```
Progress % = (Market_Cap / 6,900) × 100
```

---

**Last Updated**: December 2024

**Version**: 1.0
