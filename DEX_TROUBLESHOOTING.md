# DEX Troubleshooting Guide

Complete troubleshooting guide for Dogepump DEX.

## Table of Contents

- [Common Issues](#common-issues)
- [Error Messages](#error-messages)
- [Debugging Tips](#debugging-tips)
- [Known Issues](#known-issues)
- [Workarounds](#workarounds)
- [Getting Help](#getting-help)

---

## Common Issues

### Wallet Connection Issues

#### Issue: Wallet Not Connecting

**Symptoms**:
- "Connect Wallet" button doesn't respond
- Wallet popup doesn't appear
- Connection times out

**Possible Causes**:
- Wallet not installed
- Wallet locked
- Wrong network selected
- Browser extension disabled

**Solutions**:

1. **Check Wallet Installation**
   - Verify wallet is installed
   - Try refreshing the page
   - Try a different browser

2. **Unlock Wallet**
   - Open your wallet extension
   - Enter your password
   - Return to the DEX

3. **Check Network**
   - Ensure wallet is connected to Dogechain
   - Switch to correct network in wallet settings
   - Network ID: 2000

4. **Enable Extension**
   - Check browser extensions
   - Ensure wallet extension is enabled
   - Try incognito mode

#### Issue: Wrong Network

**Symptoms**:
- "Wrong network" error message
- Transactions fail
- Balances show as zero

**Solutions**:

1. **Switch Network in Wallet**
   - Open wallet settings
   - Select Dogechain network
   - Refresh the page

2. **Add Custom Network**
   ```
   Network Name: Dogechain
   RPC URL: https://rpc.dogechain.dog
   Chain ID: 2000
   Currency Symbol: DOGE
   Block Explorer: https://explorer.dogechain.dog
   ```

3. **Use Network Switch Button**
   - Click network indicator in DEX
   - Select Dogechain from dropdown
   - Approve network switch in wallet

### Transaction Issues

#### Issue: Transaction Failed

**Symptoms**:
- Transaction shows as failed in wallet
- "Transaction reverted" error
- Gas deducted but no effect

**Possible Causes**:
- Insufficient balance
- Slippage too low
- Gas too low
- Contract paused
- Token approval needed

**Solutions**:

1. **Check Token Balance**
   - Verify you have enough tokens
   - Include gas fees in calculation
   - Check for locked tokens

2. **Increase Slippage**
   - Go to swap settings
   - Increase slippage tolerance
   - Try 1-3% for normal swaps
   - Try 5-10% for volatile tokens

3. **Increase Gas Limit**
   - Go to swap settings
   - Increase gas limit
   - Try 20% higher than estimated

4. **Check Approvals**
   - Ensure token is approved
   - Approve if needed
   - Wait for approval confirmation

5. **Check Contract Status**
   - Check if protocol is paused
   - Check announcements on Discord/Twitter
   - Contact support if unsure

#### Issue: Transaction Stuck

**Symptoms**:
- Transaction shows "pending" for long time
- Transaction doesn't confirm
- Can't execute new transactions

**Possible Causes**:
- Gas price too low
- Network congestion
- Nonce issue

**Solutions**:

1. **Wait Longer**
   - Transactions can take 5-30 minutes
   - Check network status on explorer
   - Don't cancel immediately

2. **Speed Up Transaction**
   - Open wallet transaction history
   - Click on pending transaction
   - Select "speed up" or "replace"
   - Increase gas price

3. **Cancel Transaction**
   - Open wallet transaction history
   - Click on pending transaction
   - Select "cancel"
   - Use same nonce with higher gas

4. **Reset Nonce**
   - Send a zero-value transaction
   - Use current nonce
   - This will reset nonce sequence

#### Issue: Out of Gas

**Symptoms**:
- "Out of gas" error
- Transaction fails partway through
- Gas used equals gas limit

**Possible Causes**:
- Gas limit too low
- Complex transaction
- Network congestion

**Solutions**:

1. **Increase Gas Limit**
   - Go to swap settings
   - Increase gas limit by 20-50%
   - Retry transaction

2. **Check Network Congestion**
   - Check gas prices on Dogechain
   - Wait for lower gas prices
   - Use off-peak hours

3. **Simplify Transaction**
   - Break large transactions into smaller ones
   - Reduce swap amount
   - Remove unnecessary approvals

### Token Approval Issues

#### Issue: Approval Failed

**Symptoms**:
- "Approval failed" error
- Can't swap tokens
- "Allowance too low" error

**Possible Causes**:
- Insufficient balance for approval
- Wrong contract address
- Token contract paused

**Solutions**:

1. **Check Balance**
   - Ensure you have tokens to approve
   - Check for locked tokens
   - Verify token decimals

2. **Verify Contract Address**
   - Check router contract address
   - Compare with official addresses
   - Don't use unverified addresses

3. **Approve Specific Amount**
   - Instead of infinite approval
   - Approve exact amount needed
   - More secure

4. **Reset Approvals**
   - Revoke existing approvals
   - Approve again with correct address
   - Use token approval UI

### Liquidity Issues

#### Issue: Can't Add Liquidity

**Symptoms**:
- "Add liquidity" button disabled
- "Insufficient liquidity" error
- Transaction fails

**Possible Causes**:
- Pool doesn't exist
- Insufficient token balance
- Wrong token pair
- Slippage too low

**Solutions**:

1. **Create Pool**
   - If pool doesn't exist
   - Click "Create Pool" button
   - Add initial liquidity

2. **Check Balances**
   - Verify you have both tokens
   - Include gas fees
   - Check for locked tokens

3. **Verify Token Pair**
   - Ensure tokens are compatible
   - Check if pair exists
   - Use correct token addresses

4. **Adjust Slippage**
   - Increase slippage tolerance
   - Try 1-3% for normal pools
   - Try higher for new pools

#### Issue: Can't Remove Liquidity

**Symptoms**:
- "Remove liquidity" button disabled
- Transaction fails
- "Insufficient LP tokens" error

**Possible Causes**:
- No LP tokens
- LP tokens in another wallet
- Pool paused
- Slippage too low

**Solutions**:

1. **Check LP Token Balance**
   - Verify you have LP tokens
   - Check correct wallet
   - Check for staked tokens

2. **Unstake First**
   - If LP tokens are staked
   - Unstake before removing
   - Wait for confirmation

3. **Check Pool Status**
   - Verify pool is not paused
   - Check announcements
   - Contact support if unsure

4. **Adjust Slippage**
   - Increase slippage tolerance
   - Try 1-3% for normal pools
   - Try higher for volatile pools

### Price Issues

#### Issue: Wrong Price Displayed

**Symptoms**:
- Price doesn't match external sources
- Price updates slowly
- Price shows as zero

**Possible Causes**:
- Stale oracle data
- Low liquidity
- Network issues
- Cache issues

**Solutions**:

1. **Refresh Page**
   - Hard refresh (Ctrl+Shift+R)
   - Clear browser cache
   - Try incognito mode

2. **Check Pool Liquidity**
   - Low liquidity affects prices
   - Check pool TVL
   - Consider using larger pools

3. **Wait for Oracle Update**
   - TWAP oracle updates periodically
   - Wait 1-2 blocks for update
   - Check block explorer for updates

4. **Check External Sources**
   - Compare with other DEXs
   - Check price on CoinGecko
   - Verify token contract

### Gas Fee Issues

#### Issue: High Gas Fees

**Symptoms**:
- Gas fees very high
- Transaction expensive
- Gas price spike

**Possible Causes**:
- Network congestion
- High demand
- Complex transactions

**Solutions**:

1. **Wait for Lower Gas**
   - Monitor gas prices
   - Use off-peak hours
   - Check gas trackers

2. **Reduce Transaction Size**
   - Swap smaller amounts
   - Break into multiple transactions
   - Use direct swaps instead of multi-hop

3. **Optimize Settings**
   - Use lower gas price
   - Increase deadline
   - Accept higher slippage

4. **Use Gas Estimator**
   - Check estimated gas before confirming
   - Compare with network average
   - Adjust accordingly

---

## Error Messages

### Wallet Errors

#### "No wallet detected"

**Meaning**: No Web3 wallet found in browser

**Solution**: Install a Web3 wallet (MetaMask, Trust Wallet, etc.)

#### "Wrong network"

**Meaning**: Wallet connected to wrong blockchain

**Solution**: Switch wallet to Dogechain network

#### "Account locked"

**Meaning**: Wallet is locked

**Solution**: Unlock wallet with password

### Transaction Errors

#### "Transaction reverted"

**Meaning**: Transaction failed during execution

**Solution**:
- Check token balances
- Increase slippage
- Check contract status
- Verify approvals

#### "Insufficient funds for gas"

**Meaning**: Not enough DOGE to pay for gas

**Solution**: Add more DOGE to wallet

#### "Gas required exceeds allowance"

**Meaning**: Gas limit too low for transaction

**Solution**: Increase gas limit in settings

#### "Slippage exceeded"

**Meaning**: Price moved too much during transaction

**Solution**: Increase slippage tolerance

#### "Transaction underpriced"

**Meaning**: Gas price too low

**Solution**: Increase gas price

#### "Nonce too low"

**Meaning**: Transaction nonce is incorrect

**Solution**: Reset nonce by sending zero-value transaction

#### "Revert: execution reverted"

**Meaning**: Contract execution failed

**Solution**:
- Check contract status
- Verify inputs
- Check for paused contract

### Approval Errors

#### "Allowance too low"

**Meaning**: Token not approved or approved amount too low

**Solution**: Approve token for spending

#### "ERC20: transfer amount exceeds balance"

**Meaning**: Insufficient token balance

**Solution**: Add more tokens to wallet

#### "ERC20: transfer amount exceeds allowance"

**Meaning**: Token not approved or approved amount insufficient

**Solution**: Approve token for spending

### Liquidity Errors

#### "Insufficient liquidity"

**Meaning**: Not enough liquidity in pool

**Solution**: Add more liquidity to pool

#### "K: Insufficient liquidity"

**Meaning**: Pool reserves too low

**Solution**: Add more liquidity to pool

#### "TransferHelper: TRANSFER_FROM_FAILED"

**Meaning**: Token transfer failed

**Solution**:
- Check token balance
- Verify token approval
- Check token contract

### Price Errors

#### "Price impact too high"

**Meaning**: Swap would significantly affect price

**Solution**:
- Reduce swap amount
- Increase slippage tolerance
- Use pool with more liquidity

#### "No route found"

**Meaning**: No trading path exists between tokens

**Solution**:
- Check if tokens are compatible
- Verify pool exists
- Try different token pair

### General Errors

#### "Network error"

**Meaning**: Connection to blockchain failed

**Solution**:
- Check internet connection
- Verify RPC endpoint
- Try different RPC

#### "Internal error"

**Meaning**: Unexpected error occurred

**Solution**:
- Refresh page
- Clear browser cache
- Try different browser
- Contact support

---

## Debugging Tips

### Browser Console

Open browser console to see detailed error messages:

**Chrome/Edge**: F12 or Ctrl+Shift+I
**Firefox**: F12 or Ctrl+Shift+I
**Safari**: Cmd+Option+I

Look for:
- Red error messages
- Failed network requests
- Console warnings

### Network Tab

Check network tab in browser dev tools:

1. Open DevTools (F12)
2. Go to "Network" tab
3. Execute transaction
4. Check for failed requests
5. Review request/response data

### Transaction Explorer

Use Dogechain explorer to debug transactions:

1. Copy transaction hash
2. Paste into explorer: https://explorer.dogechain.dog
3. Review transaction details
4. Check internal transactions
5. View event logs

### Contract Interaction

Use Etherscan or block explorer to interact directly:

1. Go to contract page on explorer
2. Click "Write Contract"
3. Connect wallet
4. Execute functions directly
5. Check return values

### Local Testing

Test locally before mainnet:

1. Use testnet (Dogechain testnet)
2. Use test tokens
3. Verify functionality
4. Check gas costs
5. Deploy to mainnet after testing

### Logging

Enable detailed logging in browser console:

```javascript
// Enable debug logging
localStorage.setItem('debug', 'dex:*');

// Disable debug logging
localStorage.removeItem('debug');
```

### Clear Cache

Clear browser cache and data:

1. Open browser settings
2. Go to privacy/security
3. Clear browsing data
4. Select "Cached images and files"
5. Clear data
6. Refresh page

---

## Known Issues

### Current Known Issues

#### Issue 1: Slow Price Updates on Low Liquidity Pools

**Status**: Known
**Impact**: Medium
**Workaround**: Use pools with higher liquidity or wait for oracle update

**Description**: Pools with very low liquidity may have slow price updates due to TWAP oracle mechanics.

**Timeline**: No fix scheduled - working as designed

#### Issue 2: High Gas on Multi-Hop Swaps

**Status**: Known
**Impact**: Low
**Workaround**: Use direct swaps when possible

**Description**: Multi-hop swaps through DC token use more gas than direct swaps.

**Timeline**: Optimization planned for Q1 2026

#### Issue 3: Mobile Browser Compatibility Issues

**Status**: Known
**Impact**: Low
**Workaround**: Use desktop browser or Chrome mobile

**Description**: Some mobile browsers have issues with wallet connection.

**Timeline**: Fix planned for Q1 2026

### Recently Fixed Issues

#### Issue: Transaction Stuck on Pending

**Status**: Fixed
**Version**: v1.2.0
**Date**: December 28, 2025

**Description**: Transactions would sometimes get stuck in pending state due to nonce issues.

**Fix**: Improved nonce management and added transaction replacement support.

#### Issue: Incorrect Slippage Calculation

**Status**: Fixed
**Version**: v1.1.5
**Date**: December 25, 2025

**Description**: Slippage calculation was incorrect for certain token pairs.

**Fix**: Updated slippage calculation algorithm.

#### Issue: Pool Not Found Error

**Status**: Fixed
**Version**: v1.1.0
**Date**: December 20, 2025

**Description**: Newly created pools would sometimes show as "not found".

**Fix**: Improved pool discovery and caching.

---

## Workarounds

### Transaction Fails

**Workaround 1**: Increase slippage tolerance
- Go to swap settings
- Increase slippage to 3-5%
- Retry transaction

**Workaround 2**: Reduce swap amount
- Swap smaller amount
- Break into multiple transactions
- Check price impact

**Workaround 3**: Use different route
- Try direct swap instead of multi-hop
- Check if alternative route exists
- Compare prices

### High Gas Fees

**Workaround 1**: Wait for lower gas
- Monitor gas prices
- Use off-peak hours
- Check gas trackers

**Workaround 2**: Reduce transaction complexity
- Use direct swaps
- Avoid multi-hop swaps
- Reduce approval amounts

**Workaround 3**: Batch transactions
- Combine multiple operations
- Use lower gas price
- Increase deadline

### Wallet Issues

**Workaround 1**: Use different wallet
- Try MetaMask
- Try Trust Wallet
- Try WalletConnect

**Workaround 2**: Reset wallet connection
- Disconnect wallet
- Refresh page
- Reconnect wallet

**Workaround 3**: Use incognito mode
- Open incognito window
- Connect wallet
- Try transaction

### Price Issues

**Workaround 1**: Refresh page
- Hard refresh (Ctrl+Shift+R)
- Clear cache
- Reload page

**Workaround 2**: Wait for oracle update
- Wait 1-2 blocks
- Check block explorer
- Verify pool updates

**Workaround 3**: Use external price reference
- Check price on CoinGecko
- Compare with other DEXs
- Verify token contract

### Liquidity Issues

**Workaround 1**: Create new pool
- Use "Create Pool" button
- Add initial liquidity
- Wait for confirmation

**Workaround 2**: Use existing pool
- Check if pool already exists
- Use existing pool instead
- Verify pool address

**Workaround 3**: Add liquidity gradually
- Start with small amount
- Monitor pool performance
- Add more over time

---

## Getting Help

### Self-Service Resources

#### Documentation
- [User Guide](./DEX_USER_GUIDE.md)
- [Quick Start Guide](./DEX_QUICKSTART.md)
- [Developer Guide](./DEX_DEVELOPER_GUIDE.md)
- [API Reference](./DEX_API_REFERENCE.md)

#### FAQ
- Check [User Guide FAQ](./DEX_USER_GUIDE.md#faq)
- Check [Developer Guide FAQ](./DEX_DEVELOPER_GUIDE.md#faq)
- Check [Troubleshooting FAQ](#faq)

#### Community Resources
- [Discord Server](https://discord.gg/dogepump)
- [Twitter/X](https://twitter.com/dogepump)
- [Telegram](https://t.me/dogepump)

### Support Channels

#### Discord Support
- **Channel**: #support
- **Response Time**: 1-24 hours
- **Best for**: General questions, community help

#### Email Support
- **Email**: support@dogepump.com
- **Response Time**: 24-48 hours
- **Best for**: Technical issues, account problems

#### Bug Reports
- **GitHub Issues**: https://github.com/dogepump/dex/issues
- **Response Time**: Varies
- **Best for**: Bug reports, feature requests

### When to Contact Support

Contact support when:

- You've tried all troubleshooting steps
- Issue affects funds or transactions
- You see suspicious activity
- Error messages don't match documentation
- You need help with a complex issue

### Information to Provide

When contacting support, provide:

1. **Issue Description**
   - What you were trying to do
   - What happened instead
   - When it happened

2. **Error Messages**
   - Exact error text
   - Screenshots if possible
   - Console errors

3. **Transaction Details**
   - Transaction hash (if applicable)
   - Wallet address
   - Token addresses

4. **Environment**
   - Browser and version
   - Wallet type and version
   - Operating system

5. **Steps Taken**
   - What troubleshooting steps you've tried
   - Results of each step
   - Any workarounds attempted

### Emergency Situations

For emergency situations involving:

- **Stuck funds**: Contact support immediately
- **Security concerns**: Email security@dogepump.com
- **Lost transactions**: Provide transaction hash

### FAQ

#### Q: My transaction is stuck, what should I do?

A: First, wait 10-15 minutes for confirmation. If still stuck, try speeding up the transaction from your wallet. If that doesn't work, you can cancel it and try again.

#### Q: Why are gas fees so high?

A: Gas fees depend on network congestion. Try waiting for lower gas times (usually early morning or late night in your timezone), or reduce your transaction size.

#### Q: Can I recover tokens from a failed transaction?

A: Generally, yes. If a transaction fails, your tokens remain in your wallet. However, you still pay gas fees for the failed transaction. Check your token balance to confirm.

#### Q: Why is the price different from other exchanges?

A: DEX prices are determined by pool liquidity and can differ from CEX prices. This is normal and creates arbitrage opportunities. Large price differences usually indicate low liquidity.

#### Q: How do I know if a pool is safe?

A: Only interact with pools created through the official Dogepump DEX interface. Verify contract addresses against official documentation. Be wary of pools with suspiciously high APYs.

#### Q: What happens if I lose my LP tokens?

A: LP tokens are required to remove liquidity. If you lose them, you cannot withdraw your liquidity. Always keep your LP tokens safe, just like any other token.

#### Q: Can I use the DEX on mobile?

A: Yes, but some features work better on desktop. For the best experience, use Chrome mobile with MetaMask or Trust Wallet.

#### Q: Why did my transaction fail with "revert"?

A: "Revert" means the contract execution failed. Common causes include insufficient balance, slippage exceeded, or contract paused. Check the specific error message for more details.

#### Q: How do I report a bug?

A: Report bugs through GitHub Issues or Discord #bug-reports. Include detailed information about the bug, steps to reproduce, and expected vs actual behavior.

#### Q: Is my data private?

A: Blockchain transactions are public, but your personal information is not. We don't store your private keys or personal data. Always keep your seed phrase private.

---

## Additional Resources

- [User Guide](./DEX_USER_GUIDE.md)
- [Quick Start Guide](./DEX_QUICKSTART.md)
- [Developer Guide](./DEX_DEVELOPER_GUIDE.md)
- [API Reference](./DEX_API_REFERENCE.md)
- [Security Guide](./DEX_SECURITY_GUIDE.md)
- [Testing Guide](./DEX_TESTING_GUIDE.md)

---

**Last Updated:** December 30, 2025
