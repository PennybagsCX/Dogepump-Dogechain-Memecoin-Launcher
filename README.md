<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Dogepump Dogechain Memecoin Launcher

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5%2B-blue.svg)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-4%2B-red.svg)](https://fastify.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A comprehensive memecoin launcher platform with advanced image upload capabilities, built with React, TypeScript, and Fastify.

## Features

### Core Platform

- 🚀 **Memecoin Launch**: Launch and manage memecoins on Dogechain
  - **Fair Launch**: No presale, instant deployment to bonding curve
  - **Creator Limits**: Maximum 3% of total supply for initial buy (150 DC)
  - **Anti-Whale**: Prevents excessive initial purchases by creators
  - **Graduation System**: Tokens graduate to DEX at $6,900 market cap
- 📊 **Real-time Analytics**: Live charts and market data
- 🏆 **Leaderboard**: Track top performers
- 💰 **Trading**: Built-in trading interface
- 🔗 **Wallet Integration**: Connect your wallet
- 📱 **Responsive Design**: Works on all devices

### Real-Time Market Information

![Crypto News](https://img.shields.io/badge/Crypto_News-RSS_Feeds-success.svg)
![Sticky UI](https://img.shields.io/badge/Sticky_Positioning-Enhanced%20UX-blue.svg)

The platform features live market information from multiple sources:

- 📰 **Breaking News Banner**: Real-time Dogecoin/$DOGE news from free/open sources
  - RSS feeds from Reddit (r/CryptoCurrency, r/Bitcoin, r/Dogecoin, r/ethereum)
  - News from Cointelegraph, CoinDesk, Decrypt, and Bitcoin.com
  - **Filtered for Dogecoin-related content only** (keywords: dogecoin, doge, elon, shiba, meme)
  - **Smart news cycling** - prevents duplicate announcements, cycles through available news
  - Automatic sentiment analysis (bullish/bearish/neutral)
  - Market event multiplier integration for trading simulations
- 📊 **Live Ticker Feed**: Real-time trading activity ticker
  - Shows recent buys, sells, and token launches
  - Links to token pages for quick access
- 📌 **Sticky Positioning**: Enhanced user experience
  - News banner sticks to top when active
  - Ticker stays visible below breaking news
  - Automatic position adjustment when news is dismissed
  - Smooth transitions and proper z-index layering

### Dogepump DEX

![DEX](https://img.shields.io/badge/DEX-Production%20Ready-success.svg)
![AMM](https://img.shields.io/badge/AMM-Constant%20Product-blue.svg)
![Security](https://img.shields.io/badge/Security-Audited-green.svg)

The platform includes a fully-featured Decentralized Exchange (DEX) built on Dogechain:

- 💱 **Decentralized Trading**: Swap tokens without intermediaries
  - **AMM Model**: Constant product formula (x * y = k) for fair pricing
  - **Direct Swaps**: Trade between any token pair with existing pool
  - **Multi-Hop Swaps**: Trade through DC token for better routing
  - **Slippage Protection**: Set maximum acceptable price impact
- 💧 **Liquidity Provision**: Add and remove liquidity from pools
  - **LP Tokens**: Receive tokens representing your pool share
  - **Fee Earnings**: Earn 0.3% trading fees proportional to your share
  - **Impermanent Loss**: Understand potential losses from price divergence
  - **Pool Creation**: Create new trading pairs for any token combination
- 📊 **Pool Discovery**: Browse and analyze trading pools
  - **Pool List**: View all available pools with key metrics
  - **TVL Tracking**: Monitor Total Value Locked in each pool
  - **Volume Analysis**: Track 24-hour trading volume
  - **APY Calculation**: See estimated annual returns from fees
- 🔍 **Advanced Features**: Enhanced trading capabilities
  - **Price Impact**: See how your trade affects pool price
  - **Gas Estimation**: Know transaction costs before confirming
  - **Transaction Queue**: Manage and track all your transactions
  - **Speed Up/Cancel**: Replace or cancel pending transactions

**Security Features:**
- 🔒 **Reentrancy Protection**: Prevents reentrancy attacks
- 🔒 **Access Control**: Role-based permissions for critical functions
- 🔒 **Pause Mechanisms**: Emergency pause for protocol safety
- 🔒 **Flash Loan Protection**: TWAP oracle prevents manipulation
- 🔒 **Oracle Protection**: Time-weighted average price for accurate pricing
- 🔒 **Gas Validation**: Minimum gas requirements to prevent DoS
- 🔒 **Slippage Validation**: Protects against excessive price impact
- 🔒 **Emergency Withdraw**: Recover funds in emergency situations

**Smart Contracts:**
- **DogePumpFactory**: Manages pool creation and registry
- **DogePumpPair**: Handles individual trading pairs
- **DogePumpRouter**: Facilitates swaps and liquidity operations
- **DogePumpLPToken**: LP token for liquidity providers
- **GraduationManager**: Manages token graduation mechanism

### Moderation & Administration

![Moderation](https://img.shields.io/badge/Moderation-3%20Strike%20System-orange.svg)
![Admin](https://img.shields.io/badge/Admin%20Tools-Comprehensive-blue.svg)

The platform includes a comprehensive moderation system:

- ⚠️ **3-Strike Warning System**: Progressive disciplinary system for users
  - User warnings and token-specific warnings
  - Automatic penalties at 3 warnings (ban/delist)
  - Warning expiration and acknowledgment tracking
- 🚫 **Ban System**: Account and token restrictions
  - Automatic bans after 3 warnings
  - Manual ban capability for admins
  - Token delisting with creator bans
- 💬 **Trollbox Moderation**: Chat restrictions for banned users
  - Detailed ban notices in chat
  - Appeal information display
  - View-only access for banned users
- 🛡️ **Admin Dashboard**: Centralized moderation management
  - Real-time warning badges (1/3, 2/3, 3/3)
  - Admin actions logging
  - Warning acknowledgment tracking

### Image Upload System

![Image Upload](https://img.shields.io/badge/Image_Upload-Production%20Ready-success.svg)
![Security](https://img.shields.io/badge/Security-Advanced-blueviolet.svg)
![Performance](https://img.shields.io/badge/Performance-Optimized-brightgreen.svg)

The platform includes a production-ready image upload system with:

- 🖼️ **Multi-format Support**: JPEG, PNG, WebP, AVIF, GIF
- 🔄 **Automatic Processing**: Resize, compress, and convert images
- 📐 **Multiple Variants**: Thumbnail, small, medium, large, extra-large
- 🔒 **Security First**: Magic number validation, malware detection, XSS prevention
- 💾 **Flexible Storage**: Local filesystem with S3/MinIO compatibility
- 🗑️ **Automatic Cleanup**: Scheduled cleanup of temporary files
- 📊 **Deduplication**: Content-based deduplication to save space
- 📝 **Comprehensive Logging**: Detailed audit logs for all operations

### Integrated Image Features

![Integration](https://img.shields.io/badge/Integration-Seamless-blue.svg)
![Unified](https://img.shields.io/badge/Architecture-Unified-green.svg)

The image upload system is seamlessly integrated across the platform:

- 👤 **Profile Avatar Upload**: Users can upload and manage their profile pictures
- 🪙 **Token Logo Upload**: Memecoin creators can upload logos for their tokens
- 💬 **Comment Image Upload**: Users can attach images to their comments
- 🎯 **Unified Infrastructure**: All features share the same secure, validated, and optimized pipeline
- 🚀 **Developer Experience**: Consistent API patterns and error handling across all features
- ✨ **Enhanced User Experience**: Fast uploads with instant preview and responsive images

**Benefits of Integration:**
- **Consistent Security**: Same validation and security checks across all uploads
- **Optimized Storage**: Content-based deduplication across all image types
- **Automatic Processing**: Uniform image processing and variant generation
- **Centralized Management**: Single point of control for image configuration
- **Easier Maintenance**: Single infrastructure to maintain and update
- **Better Performance**: Shared processing resources and caching

For detailed integration information, see the [Integration Guide](./server/INTEGRATION_GUIDE.md).

## Recent Updates

### Mobile UI Improvements (December 2025)

**Creator Admin Component Mobile Optimization:**
- 📱 **Responsive Tab Layout**: Creator admin tabs (Security, Info, Stream, Airdrop) now stack below the header on mobile devices for better readability
- 🎛️ **Audio Control Layout**: Microphone and System Audio toggles now display vertically on mobile, with toggle buttons on separate lines below the text
- 📐 **Better Touch Targets**: Improved spacing and layout for small screens (iPhone SE and similar)
- 💻 **Desktop Preservation**: All changes maintain the original horizontal layout on desktop screens

These improvements ensure a better user experience on mobile devices while preserving the desktop interface.

## Tech Stack

### Frontend

- **React 18**: UI framework
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool
- **Tailwind CSS**: Utility-first CSS
- **Recharts**: Data visualization

### Backend

- **Node.js 18+**: Runtime environment
- **Fastify**: High-performance web framework
- **TypeScript**: Type-safe backend
- **Sharp**: High-performance image processing
- **JWT**: Authentication
- **bcrypt**: Password hashing

### Security

- **Magic Number Detection**: File signature validation
- **Malware Detection**: Pattern-based detection
- **XSS Prevention**: Content sanitization
- **EXIF Stripping**: Privacy protection
- **Rate Limiting**: Request throttling
- **CORS**: Cross-origin resource sharing

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd dogepump-dogechain-memecoin-launcher

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Create upload directories
mkdir -p uploads/temp uploads/permanent
```

### Running the Application

**Development Mode:**

```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run server
```

**Production Mode:**

```bash
# Build frontend
npm run build

# Start production server
npm run server:prod
```

### Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Documentation

### DEX Documentation

- 📖 [DEX User Guide](./DEX_USER_GUIDE.md) - Complete user guide for Dogepump DEX, including swapping, liquidity management, and troubleshooting
- 🚀 [DEX Quick Start](./DEX_QUICKSTART.md) - Get started with the DEX in 5 minutes
- 📖 [DEX Developer Guide](./DEX_DEVELOPER_GUIDE.md) - Complete developer guide covering architecture, development workflow, and best practices
- 📚 [DEX API Reference](./DEX_API_REFERENCE.md) - Complete API reference for smart contracts, services, and components
- 🔗 [DEX Integration Guide](./DEX_INTEGRATION_GUIDE.md) - Guide for integrating DEX into existing code and adding new features
- 🧪 [DEX Testing Guide](./DEX_TESTING_GUIDE.md) - Complete testing guide covering unit, integration, E2E, security, and performance tests
- 🔒 [DEX Security Guide](./DEX_SECURITY_GUIDE.md) - Security architecture, best practices, audit results, and user security tips
- 🔧 [DEX Troubleshooting](./DEX_TROUBLESHOOTING.md) - Common issues, error messages, debugging tips, and workarounds
- 📝 [DEX Changelog](./DEX_CHANGELOG.md) - Version history, new features, bug fixes, and migration guide
- 🤝 [DEX Contributing](./DEX_CONTRIBUTING.md) - How to contribute, code of conduct, development setup, and pull request process
- 🏗️ [DEX Architecture](./DEX_ARCHITECTURE.md) - System architecture, smart contract architecture, data flow, and scalability
- 📖 [DEX Glossary](./DEX_GLOSSARY.md) - Complete glossary of DEX, blockchain, and DeFi terminology

### Smart Contract Documentation
 
- 📖 [Contract Documentation](./contracts/CONTRACT_DOCUMENTATION.md) - Complete documentation for all DEX smart contracts
- 🔒 [Security Features](./contracts/SECURITY_FEATURES.md) - Documentation of all security features and audit results
- 🚀 [Deployment Guide](./contracts/DEPLOYMENT_GUIDE.md) - Complete deployment guide for testnet and mainnet

#### DEX Navigation

The DEX is fully integrated into the platform and can be accessed through multiple navigation points:

**Desktop Navigation**
- **Navbar**: Click on the **"DEX"** link in the top navigation bar
- **Home Page**: Click on the **"Swap Now"** button in the DEX highlights section
- **Token Detail Page**: For graduated tokens, click on **"Swap"** or **"Add Liquidity"** buttons in the DEX Pool section

**Mobile Navigation**
- **Mobile Navigation Bar**: Tap on the **"DEX"** icon in the bottom navigation bar
- **Home Page**: Tap on the **"Swap Now"** button in the DEX highlights section
- **Token Detail Page**: For graduated tokens, tap on **"Swap"** or **"Add Liquidity"** buttons in the DEX Pool section

**Direct URLs**
You can also access DEX pages directly using these URLs:
- **Swap**: `/dex/swap`
- **Pools**: `/dex/pools`
- **Liquidity**: `/dex/liquidity`

### Earn / Farming System

![Status](https://img.shields.io/badge/Status-DEMO%20MODE-yellow.svg)
![Blockchain](https://img.shields.io/badge/Blockchain-Not%20Integrated-important.svg)

> **⚠️ IMPORTANT: DEMO MODE**
> The Earn/Farming system is currently in **DEMO MODE** for testing and demonstration purposes only. All staking operations are simulations and do not execute real blockchain transactions.

#### Features

The Earn page (`/earn`) provides a comprehensive farming interface where users can:

- 🌾 **Stake Tokens**: Stake graduated tokens to earn passive $DC rewards
- 🏆 **Core Farms**: Stake in official platform farms with guaranteed returns
- 👥 **Community Farms**: Browse and stake in user-created farms
- 🎯 **Create Farms**: Token owners can create custom staking farms
- 📊 **Farm Management**: Monitor APY, TVL, stakers, and rewards
- 🔒 **Lock Periods**: Configurable lock periods for higher yields
- 💰 **Harvest Rewards**: Claim accumulated rewards at any time

#### DEMO MODE Limitations

**Current Implementation:**
- ✅ **UI/UX**: Fully functional user interface
- ✅ **Business Logic**: Complete farm management system
- ✅ **Calculations**: Accurate APY and reward calculations
- ❌ **Blockchain Integration**: NOT connected to smart contracts
- ❌ **Real Transactions**: All operations are localStorage simulations
- ❌ **Wallet Verification**: Mock authentication (no signature verification)

**What DOESN'T Work in Demo Mode:**
1. No real token transfers occur when staking/unstaking
2. No actual reward distribution from smart contracts
3. Token balances are not affected (uses mock balance of 1,000,000)
4. Farm creation doesn't deploy smart contracts
5. No on-chain verification of ownership
6. All data persists to localStorage only (no backend sync)

**Data Storage:**
- All farm data stored in browser localStorage
- Data is lost when clearing browser data
- No cross-device synchronization
- No backup to cloud/database

#### Production Migration Roadmap

To make the Earn page production-ready, the following must be implemented:

**Phase 1: Blockchain Integration (Weeks 1-2)**
- Audit smart contracts in `/contracts/`
- Test contract methods on Dogechain testnet
- Document contract ABIs and interfaces

**Phase 2: Core Integration (Weeks 3-6)**
- Replace mock functions with smart contract calls
- Implement transaction signing via ethers.js
- Add contract event listeners for real-time updates
- Create backend API endpoints for farm CRUD

**Phase 3: Security Hardening (Weeks 7-9)**
- Implement wallet signature verification
- Add server-side validation
- Implement rate limiting
- Conduct security audit

**Phase 4: Testing & Deployment (Weeks 10-12)**
- Achieve 90%+ test coverage
- Performance optimization
- Mainnet deployment

**Estimated Timeline**: 12 weeks to production-ready
**Full Audit Report**: See `/docs/EARN_PAGE_AUDIT_REPORT.md`

#### Access the Earn Page

**Navigation**
- **Navbar**: Click on **"Earn"** link in top navigation
- **Direct URL**: `/earn`

#### Technical Details

**Key Files:**
- `/pages/Earn.tsx` - Main Earn page component
- `/services/farmService.ts` - Farm business logic (1,740 lines)
- `/contexts/StoreContext.tsx` - State management
- `/components/FarmCard.tsx` - Farm display card
- `/components/FarmStakingModal.tsx` - Staking interface
- `/components/CreateFarmModal.tsx` - Farm creation interface

**Mock Functions (require production replacement):**
- `getUserTokenBalance()` - Returns hardcoded 1,000,000
- `deductTokenBalance()` - Console.log only
- `addTokenBalance()` - Console.log only

### Token Launch System

- 📖 [Token Launch Guide](./TOKEN_LAUNCH.md) - Complete guide to launching memecoins, including creator limits and fair launch mechanics
- 🚀 [Quick Start Guide](./QUICKSTART.md) - Get up and running in minutes

### Moderation System

- 📖 [Moderation System Documentation](./MODERATION_SYSTEM.md) - Complete guide to the 3-strike warning system, ban system, trollbox restrictions, and admin dashboard
- 📖 [Database Integration Guide](./MODERATION_DB_INTEGRATION_COMPLETE.md) - Complete PostgreSQL database integration with API endpoints, audit trails, and data persistence
- 📖 [Migration Quick Start](./MIGRATION_QUICK_START.md) - Quick start guide for migrating from localStorage to database

### Trollbox Reporting System

- 📖 [Trollbox Reporting System](./TROLLBOX_REPORTING_SYSTEM.md) - Complete guide to reporting trollbox messages, admin dashboard management, and troubleshooting

### Image Upload System

For detailed information about the image upload system:

- 📖 [Complete System Documentation](./server/IMAGE_UPLOAD_SYSTEM.md) - Comprehensive system overview, architecture, and features
- 🔗 [Integration Guide](./server/INTEGRATION_GUIDE.md) - Complete guide for integrating image upload functionality across the platform
- 📚 [API Reference](./server/API_REFERENCE.md) - Complete API documentation with examples
- 🚀 [Deployment Guide](./DEPLOYMENT.md) - Production deployment instructions
- 🔧 [Troubleshooting Guide](./TROUBLESHOOTING.md) - Common issues and solutions

### Authentication

The platform uses JWT-based authentication. To use the image upload system:

1. Register a new account or login
2. Receive access and refresh tokens
3. Include access token in `Authorization` header: `Bearer <token>`
4. Refresh token when expired

### Image Upload API

**Upload an Image:**

```bash
curl -X POST http://localhost:3001/api/images/upload \
  -H "Authorization: Bearer <your-token>" \
  -F "file=@/path/to/image.jpg"
```

**Get an Image:**

```bash
curl -X GET http://localhost:3001/api/images/<image-id>?variant=thumbnail \
  -H "Authorization: Bearer <your-token>" \
  --output thumbnail.jpg
```

**Validate an Image:**

```bash
curl -X POST http://localhost:3001/api/images/validate \
  -H "Authorization: Bearer <your-token>" \
  -F "file=@/path/to/image.jpg"
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Server
NODE_ENV=development
PORT=3001
HOST=0.0.0.0

# CORS
CORS_ORIGIN=http://localhost:5173

# Image Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp
UPLOAD_DIR=./uploads

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production

# Storage
STORAGE_BACKEND=local
STORAGE_BASE_PATH=./uploads
STORAGE_MAX_SIZE=10737418240
STORAGE_TEMP_TTL=86400000
STORAGE_ENABLE_DEDUPLICATION=true

# Security
SECURITY_VALIDATE_FILE_SIGNATURE=true
SECURITY_ENABLE_MALWARE_DETECTION=true
SECURITY_ENABLE_XSS_DETECTION=true
SECURITY_STRIP_METADATA=true
```

For a complete list of configuration options, see [Configuration](./server/IMAGE_UPLOAD_SYSTEM.md#configuration).

## Project Structure

```
dogepump-dogechain-memecoin-launcher/
├── server/                    # Backend server
│   ├── middleware/            # Express middleware
│   ├── routes/               # API routes
│   ├── services/             # Business logic
│   ├── utils/               # Utility functions
│   ├── types/               # TypeScript types
│   └── config.ts            # Configuration
├── components/              # React components
│   ├── NewsBanner.tsx       # Breaking news banner with sticky positioning
│   ├── Ticker.tsx           # Live trading activity ticker
│   └── ...
├── services/               # Frontend services
│   ├── cryptoNewsService.ts # RSS feed parser and news aggregator
│   └── ...
├── pages/                  # Page components
├── public/                 # Static assets
├── uploads/                # Uploaded images
│   ├── temp/              # Temporary files
│   └── permanent/         # Permanent files
└── README.md              # This file
```

## Development

### Available Scripts

```bash
# Development
npm run dev              # Start frontend dev server
npm run server           # Start backend server

# Building
npm run build            # Build frontend for production

# Linting & Formatting
npm run lint             # Run ESLint
npm run format           # Run Prettier

# Testing (if available)
npm test                # Run tests
```

### Code Style

- Use TypeScript for type safety
- Follow ESLint rules
- Format code with Prettier
- Write meaningful commit messages

## Security

The image upload system implements multiple layers of security:

1. **Authentication**: JWT-based authentication with refresh tokens
2. **Authorization**: Role-based access control with permissions
3. **Input Validation**: Comprehensive file validation
4. **Content Security**: Malware detection, XSS prevention
5. **Rate Limiting**: Request throttling to prevent abuse
6. **Privacy**: EXIF data stripping for user privacy

For detailed security information, see [Security](./server/IMAGE_UPLOAD_SYSTEM.md#security).

## Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT secrets
- [ ] Enable HTTPS/SSL
- [ ] Configure proper CORS origins
- [ ] Enable all security validations
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Set up CDN for static assets
- [ ] Configure rate limiting
- [ ] Test all endpoints

For detailed deployment instructions, see [Deployment Guide](./DEPLOYMENT.md).

## Troubleshooting

### Common Issues

**Port Already in Use:**
```bash
lsof -i :3001
kill -9 <PID>
```

**Permission Denied:**
```bash
chmod 755 uploads
chmod 755 uploads/temp
chmod 755 uploads/permanent
```

**JWT Token Expired:**
Use the refresh token to get a new access token.

For more troubleshooting tips, see [Troubleshooting Guide](./TROUBLESHOOTING.md).

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues, questions, or contributions:

**Moderation & Administration:**
- 📖 [Moderation System](./MODERATION_SYSTEM.md) - 3-strike warning system, bans, and trollbox moderation
- 📖 [Database Integration](./MODERATION_DB_INTEGRATION_COMPLETE.md) - Complete database integration with PostgreSQL
- 📖 [Migration Guide](./MIGRATION_QUICK_START.md) - Quick start for database migration

**Platform Features:**
- 🚀 [Token Launch Guide](./TOKEN_LAUNCH.md) - Launching memecoins and creator limits
- 🚀 [Quick Start](./QUICKSTART.md) - Get up and running in minutes

**Image Upload:**
- 📖 [Image Upload System](./server/IMAGE_UPLOAD_SYSTEM.md) - Complete image upload documentation
- 🔗 [Integration Guide](./server/INTEGRATION_GUIDE.md) - Image upload integration guide

**General:**
- 📚 [API Reference](./server/API_REFERENCE.md) - Complete API documentation
- 🔧 [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and solutions
- 📧 Open an issue in the repository

## Acknowledgments

- Built with [React](https://reactjs.org/)
- Backend powered by [Fastify](https://fastify.io/)
- Image processing with [Sharp](https://sharp.pixelplumbing.com/)
- UI styled with [Tailwind CSS](https://tailwindcss.com/)

---

**View your app in AI Studio:** https://ai.studio/apps/drive/1kkOTBg1JbMvVIRlbO5z6vcpRvZD_mCXR
