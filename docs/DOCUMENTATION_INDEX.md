# DogePump Documentation Index

Complete guide to all DogePump documentation, organized by topic and purpose.

---

## Quick Links

- **New Users**: Start with [QUICK_START.md](#quick-start)
- **Administrators**: See [ADMIN_GUIDE.md](#administration)
- **Developers**: See [ARCHITECTURE](#architecture)
- **Deployment**: See [DEPLOYMENT](#deployment)

---

## Documentation Files

### Getting Started

#### [QUICK_START.md](QUICK_START.md)
**Who should read**: Everyone deploying DogePump for the first time

**Contents**:
- Prerequisites and required accounts
- Initial setup and installation
- Configuration steps
- Deployment to production
- Post-deployment verification
- Troubleshooting common issues

**Time to read**: 15 minutes

---

### Administration

#### [ADMIN_GUIDE.md](ADMIN_GUIDE.md)
**Who should read**: Platform administrators and moderators

**Contents**:
- Accessing the admin panel
- Authentication methods (wallet + access code)
- Dashboard overview
- Price Oracle monitoring
- Managing user reports
- User banning system
- Security best practices
- Troubleshooting admin issues

**Time to read**: 25 minutes

#### [BAN_SYSTEM_ENHANCEMENTS.md](BAN_SYSTEM_ENHANCEMENTS.md)
**Who should read**: Developers and administrators interested in ban system details

**Contents**:
- Enhanced ban detection (dual-checking)
- Ban notice modal implementation
- Comment details in reports
- Technical implementation details
- Security considerations
- Testing checklist
- Future enhancements

**Time to read**: 15 minutes

#### [TOKEN_REPORT_ENHANCEMENT.md](TOKEN_REPORT_ENHANCEMENT.md)
**Who should read**: Developers and administrators interested in report system details

**Contents**:
- Token report additional details field
- Implementation summary
- User experience improvements
- Testing checklist
- Benefits and future enhancements

**Time to read**: 10 minutes

#### [AUDIO_SYSTEM_GUIDE.md](AUDIO_SYSTEM_GUIDE.md)
**Who should read**: Developers and users interested in audio settings

**Contents**:
- Unified audio control system architecture
- Sound settings persistence
- UI synchronization (footer + settings modal)
- Configuration options
- Testing checklist
- API reference

**Time to read**: 15 minutes

#### [TROLLBOX_NEWS_ENHANCEMENT.md](TROLLBOX_NEWS_ENHANCEMENT.md)
**Who should read**: Developers and users interested in Trollbox news features

**Contents**:
- Complete news headlines (no truncation)
- Clickable article links
- Multi-source RSS news aggregation
- Sentiment analysis system
- Technical implementation details
- Testing checklist
- Troubleshooting guide

**Time to read**: 20 minutes

---

### Architecture & Design

#### [PRICE_ORACLE_ARCHITECTURE.md](PRICE_ORACLE_ARCHITECTURE.md)
**Who should read**: Developers and technical stakeholders

**Contents**:
- System overview and data flow
- Price sources and priority order
- TWAP calculation methodology
- Fallback mechanisms
- Architecture diagrams
- Integration points

**Time to read**: 15 minutes

#### [ADVANCED_FEATURES_GUIDE.md](ADVANCED_FEATURES_GUIDE.md)
**Who should read**: Developers implementing advanced features

**Contents**:
- On-chain pool price reading
- WebSocket real-time updates
- Historical price tracking
- Integration guide
- Configuration options
- Performance optimization

**Time to read**: 25 minutes

---

### Configuration

#### [GRADUATION_CONFIG_GUIDE.md](GRADUATION_CONFIG_GUIDE.md)
**Who should read**: Anyone customizing graduation parameters

**Contents**:
- Graduation marketcap configuration
- Price oracle settings
- Bonding curve parameters
- Update intervals and cache settings
- TWAP configuration
- Example configurations

**Time to read**: 10 minutes

#### [TOKEN_LAUNCH.md](docs/TOKEN_LAUNCH.md)
**Who should read**: Token creators and users

**Contents**:
- How token creation works
- Creator purchase limits (3%)
- Bonding curve mechanics
- Graduation process
- Best practices

**Time to read**: 8 minutes

---

### Implementation & Summaries

#### [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
**Who should read**: Developers reviewing Phase 1 changes

**Contents**:
- USD-based graduation implementation
- Price oracle integration
- Creator limits
- Code changes made
- Testing procedures

**Time to read**: 10 minutes

#### [COMPLETE_IMPLEMENTATION_SUMMARY.md](COMPLETE_IMPLEMENTATION_SUMMARY.md)
**Who should read**: Anyone wanting full system overview

**Contents**:
- Executive summary
- Complete feature list
- Architecture overview
- Cost analysis
- Deployment checklist
- Future enhancements

**Time to read**: 20 minutes

---

## Reading Paths

### For Platform Administrators

1. **Start**: [QUICK_START.md](QUICK_START.md) - Deploy the platform
2. **Then**: [ADMIN_GUIDE.md](ADMIN_GUIDE.md) - Learn admin features
3. **Then**: [BAN_SYSTEM_ENHANCEMENTS.md](BAN_SYSTEM_ENHANCEMENTS.md) - Understand user moderation
4. **Reference**: [PRICE_ORACLE_ARCHITECTURE.md](PRICE_ORACLE_ARCHITECTURE.md) - Understand price oracle
5. **Optional**: [ADVANCED_FEATURES_GUIDE.md](ADVANCED_FEATURES_GUIDE.md) - Advanced configuration

### For Token Creators

1. **Start**: [TOKEN_LAUNCH.md](TOKEN_LAUNCH.md) - Learn token creation
2. **Reference**: [GRADUATION_CONFIG_GUIDE.md](GRADUATION_CONFIG_GUIDE.md) - Understand graduation
3. **Optional**: [QUICK_START.md](QUICK_START.md) - If self-hosting

### For Developers

1. **Start**: [COMPLETE_IMPLEMENTATION_SUMMARY.md](COMPLETE_IMPLEMENTATION_SUMMARY.md) - Full overview
2. **Then**: [PRICE_ORACLE_ARCHITECTURE.md](PRICE_ORACLE_ARCHITECTURE.md) - Price oracle details
3. **Then**: [ADVANCED_FEATURES_GUIDE.md](ADVANCED_FEATURES_GUIDE.md) - Advanced features
4. **Reference**: [TROLLBOX_NEWS_ENHANCEMENT.md](TROLLBOX_NEWS_ENHANCEMENT.md) - News system details
5. **Reference**: [GRADUATION_CONFIG_GUIDE.md](GRADUATION_CONFIG_GUIDE.md) - Configuration options

### For Security Auditors

1. **Start**: [ADMIN_GUIDE.md](ADMIN_GUIDE.md) - Security best practices
2. **Then**: [PRICE_ORACLE_ARCHITECTURE.md](PRICE_ORACLE_ARCHITECTURE.md) - Price manipulation protection
3. **Then**: [COMPLETE_IMPLEMENTATION_SUMMARY.md](COMPLETE_IMPLEMENTATION_SUMMARY.md) - Architecture review

---

## Key Concepts

### Price Oracle

Multi-source price fetching system with fallback chain:
1. **Pool TWAP** (on-chain, primary)
2. **DEXScreener API** (fallback 1)
3. **GeckoTerminal API** (fallback 2)
4. **Cached Price** (ultimate fallback)

**Docs**: [PRICE_ORACLE_ARCHITECTURE.md](PRICE_ORACLE_ARCHITECTURE.md), [ADVANCED_FEATURES_GUIDE.md](ADVANCED_FEATURES_GUIDE.md)

### Graduation

Tokens graduate from bonding curve to DEX at **$6,900 USD marketcap**.

**Docs**: [GRADUATION_CONFIG_GUIDE.md](GRADUATION_CONFIG_GUIDE.md), [TOKEN_LAUNCH.md](TOKEN_LAUNCH.md)

### Creator Limits

Token creators cannot purchase more than **3% of total supply** during creation.

**Docs**: [TOKEN_LAUNCH.md](TOKEN_LAUNCH.md), [COMPLETE_IMPLEMENTATION_SUMMARY.md](COMPLETE_IMPLEMENTATION_SUMMARY.md)

### TWAP

Time-Weighted Average Price over **5 minutes** prevents manipulation.

**Docs**: [PRICE_ORACLE_ARCHITECTURE.md](PRICE_ORACLE_ARCHITECTURE.md), [ADVANCED_FEATURES_GUIDE.md](ADVANCED_FEATURES_GUIDE.md)

### User Banning

Platform administrators can ban users from performing actions:
- Commenting
- Launching tokens
- Buying/selling tokens

Ban system uses **dual-checking** (address + username) to prevent bypass.

**Docs**: [ADMIN_GUIDE.md](ADMIN_GUIDE.md) section 6, [BAN_SYSTEM_ENHANCEMENTS.md](BAN_SYSTEM_ENHANCEMENTS.md)

### Audio System

Unified sound control system with persistent settings:
- Sound effects enabled by default for new users
- Settings persist across page refreshes
- Footer mute button and Settings modal stay synchronized
- Uses store settings as single source of truth

**Docs**: [AUDIO_SYSTEM_GUIDE.md](AUDIO_SYSTEM_GUIDE.md)

### Trollbox News

Real-time crypto news aggregation and display:
- Multi-source RSS feeds (Reddit, Cointelegraph, CoinDesk, etc.)
- Complete headlines without truncation
- Clickable links to full articles
- Automatic sentiment analysis (bullish/bearish/neutral)
- 5-minute cache for performance

**Docs**: [TROLLBOX_NEWS_ENHANCEMENT.md](TROLLBOX_NEWS_ENHANCEMENT.md)

---

## FAQ

**Q: How do I deploy DogePump?**

A: See [QUICK_START.md](QUICK_START.md) for complete deployment guide.

**Q: How do I access the admin panel?**

A: See [ADMIN_GUIDE.md](ADMIN_GUIDE.md) section 2 for authentication methods.

**Q: How does the price oracle work?**

A: See [PRICE_ORACLE_ARCHITECTURE.md](PRICE_ORACLE_ARCHITECTURE.md) for complete explanation.

**Q: How do I change the graduation threshold?**

A: See [GRADUATION_CONFIG_GUIDE.md](GRADUATION_CONFIG_GUIDE.md) for configuration options.

**Q: How do I add admin wallets?**

A: See [ADMIN_GUIDE.md](ADMIN_GUIDE.md) section 6 for configuration.

**Q: What's the creator purchase limit?**

A: See [TOKEN_LAUNCH.md](TOKEN_LAUNCH.md) for details on the 3% limit.

**Q: How do I deploy the DC/wDOGE pool?**

A: See [QUICK_START.md](QUICK_START.md) section 5 for pool deployment instructions.

**Q: Why is my price oracle showing errors?**

A: See [ADMIN_GUIDE.md](ADMIN_GUIDE.md) section 9 for troubleshooting.

**Q: How does the ban system work?**

A: See [BAN_SYSTEM_ENHANCEMENTS.md](BAN_SYSTEM_ENHANCEMENTS.md) for complete ban system documentation.

**Q: A banned user can still post comments, what do I do?**

A: See [ADMIN_GUIDE.md](ADMIN_GUIDE.md) section 9 (Troubleshooting) for "Ban System Not Working".

**Q: How do I change the audio settings?**

A: See [AUDIO_SYSTEM_GUIDE.md](AUDIO_SYSTEM_GUIDE.md) for complete audio system documentation.

**Q: Why aren't my sound settings persisting?**

A: See [AUDIO_SYSTEM_GUIDE.md](AUDIO_SYSTEM_GUIDE.md) section 6 (Troubleshooting) for solutions.

**Q: How does the Trollbox news system work?**

A: See [TROLLBOX_NEWS_ENHANCEMENT.md](TROLLBOX_NEWS_ENHANCEMENT.md) for complete news system documentation.

**Q: Where do the news articles come from?**

A: See [TROLLBOX_NEWS_ENHANCEMENT.md](TROLLBOX_NEWS_ENHANCEMENT.md) section "News Sources" for the full list of RSS feeds.

**Q: Why are news headlines not clickable in the Trollbox?**

A: News headlines should display with a "Read More" link. See [TROLLBOX_NEWS_ENHANCEMENT.md](TROLLBOX_NEWS_ENHANCEMENT.md) section "Troubleshooting" if links aren't working.

---

## Configuration Files

### Main Configuration

**File**: `constants.ts`

Contains:
- Graduation marketcap (`GRADUATION_MARKETCAP_USD`)
- Token addresses (`DC_TOKEN_ADDRESS`, `WDOGE_TOKEN_ADDRESS`)
- Price oracle settings (`PRICE_UPDATE_INTERVAL`, `TWAP_WINDOW_SECONDS`)
- Launch parameters (`MAX_CREATOR_BUY_PERCENTAGE`, `TOTAL_SUPPLY`)

**Guide**: [GRADUATION_CONFIG_GUIDE.md](GRADUATION_CONFIG_GUIDE.md)

### Pool Configuration

**File**: `services/poolPriceService.ts`

Contains:
- Pool address (`POOL_ADDRESS`)
- RPC endpoints
- Minimum liquidity threshold
- TWAP window settings

**Guide**: [ADVANCED_FEATURES_GUIDE.md](ADVANCED_FEATURES_GUIDE.md) section 1

### Admin Configuration

**File**: `pages/Admin.tsx`

Contains:
- Admin wallet list (`ADMIN_WALLETS`)
- Access code (`ADMIN_ACCESS_CODE`)

**Guide**: [ADMIN_GUIDE.md](ADMIN_GUIDE.md) section 6

---

## Troubleshooting Guides

### Quick Issues

| Issue | Documentation |
|-------|---------------|
| Can't access admin | [ADMIN_GUIDE.md](ADMIN_GUIDE.md) section 9 |
| Pool not working | [ADMIN_GUIDE.md](ADMIN_GUIDE.md) section 9 |
| Price errors | [ADMIN_GUIDE.md](ADMIN_GUIDE.md) section 9 |
| Ban system not working | [ADMIN_GUIDE.md](ADMIN_GUIDE.md) section 9 |
| Ban notice not showing | [ADMIN_GUIDE.md](ADMIN_GUIDE.md) section 9 |
| Build errors | [QUICK_START.md](QUICK_START.md) section 7 |
| Deploy errors | [QUICK_START.md](QUICK_START.md) section 7 |

### Detailed Troubleshooting

- **Admin Panel**: [ADMIN_GUIDE.md](ADMIN_GUIDE.md) - Full troubleshooting section
- **Price Oracle**: [ADVANCED_FEATURES_GUIDE.md](ADVANCED_FEATURES_GUIDE.md) - Troubleshooting section
- **Deployment**: [QUICK_START.md](QUICK_START.md) - Complete verification steps

---

## Code Documentation

### Services

All services have JSDoc comments:

- `services/audio.ts` - Sound effects engine
- `services/priceOracleService.ts` - Main price oracle
- `services/poolPriceService.ts` - On-chain pool reading
- `services/priceHistoryService.ts` - Historical tracking
- `services/websocketPriceService.ts` - Real-time updates
- `services/cryptoNewsService.ts` - Crypto news RSS aggregation

### Components

Key components with inline documentation:

- `components/PriceOracleDashboard.tsx` - Admin monitoring dashboard
- `components/Trollbox.tsx` - Real-time chat with news integration
- `components/NewsBanner.tsx` - Breaking news display
- `pages/Admin.tsx` - Admin panel entry point

### How to Read Code Comments

```typescript
/**
 * Brief description
 * @param {Type} paramName - Description
 * @returns {Type} Description
 */
function functionName(paramName: Type): Type {
  // Implementation
}
```

---

## Version History

### v1.5 (December 2025)
- Added Trollbox news enhancement documentation
- News headlines now display in full (no truncation)
- Clickable article links added to news messages
- Multi-source RSS news aggregation improvements
- Enhanced sentiment analysis documentation

### v1.4 (December 2025)
- Fixed notification routing for token and comment reports
- Notifications now navigate to admin dashboard sections
- Added wallet menu auto-close on notification click
- Enhanced UX for report tracking

### v1.3 (December 2025)
- Added audio system documentation
- Unified audio control system
- Sound settings persistence
- UI synchronization guide
- API reference for audio service

### v1.2 (December 2025)
- Added token report enhancement documentation
- Token reports now include Additional Details field
- Enhanced admin guide with token report updates

### v1.1 (December 2025)
- Added ban system documentation
- Enhanced admin guide with user banning section
- Added ban system troubleshooting
- Created comprehensive enhancement summary

### v1.0 (January 2025)
- Initial documentation suite
- Price oracle system
- Admin dashboard
- Multi-source price fetching
- TWAP implementation
- USD-based graduation

---

## Support

### Documentation Help

If documentation is unclear or missing information:
1. Check inline code comments
2. Review related documentation files
3. Check browser console for errors
4. Review implementation summaries

### Code Issues

For bugs or feature requests:
1. Check existing documentation first
2. Review troubleshooting sections
3. Check GitHub issues
4. Create new issue with details

---

## Best Practices

### Reading Documentation

1. **Start with overview docs**: Get the big picture first
2. **Use reading paths**: Follow the path for your role
3. **Check examples**: Docs include code examples
4. **Bookmark key sections**: Quick reference later

### Keeping Documentation Updated

When making changes:
1. Update relevant docs immediately
2. Add examples for new features
3. Update troubleshooting sections
4. Cross-reference related docs

### Contributing to Docs

Documentation contributions welcome:
1. Use clear, concise language
2. Include code examples
3. Add diagrams where helpful
4. Cross-reference related topics
5. Update index when adding new docs

---

## File Organization

```
docs/
├── DOCUMENTATION_INDEX.md (this file)
├── QUICK_START.md (deployment guide)
├── ADMIN_GUIDE.md (admin manual)
├── BAN_SYSTEM_ENHANCEMENTS.md (ban system details)
├── TOKEN_REPORT_ENHANCEMENT.md (token report enhancement)
├── AUDIO_SYSTEM_GUIDE.md (audio system documentation)
├── TROLLBOX_NEWS_ENHANCEMENT.md (Trollbox news features)
├── PRICE_ORACLE_ARCHITECTURE.md (system design)
├── ADVANCED_FEATURES_GUIDE.md (advanced features)
├── GRADUATION_CONFIG_GUIDE.md (configuration)
├── TOKEN_LAUNCH.md (user guide)
├── IMPLEMENTATION_SUMMARY.md (phase 1)
└── COMPLETE_IMPLEMENTATION_SUMMARY.md (full overview)
```

---

## Additional Resources

### External Documentation

- **React**: https://react.dev/
- **React Router**: https://reactrouter.com/
- **Ethers.js**: https://docs.ethers.org/
- **DogeChain**: https://dogechain.dog/
- **Recharts**: https://recharts.org/

### Related Projects

- **Uniswap V2**: https://docs.uniswap.org/
- **pump.fun**: https://pump.fun/
- **DogeChain DEXs**: Check individual DEX documentation

---

**Last Updated**: December 2025
**Version**: 1.5
**Maintained By**: DogePump Team

For the latest documentation, check the `docs/` folder in the repository.
