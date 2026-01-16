#!/bin/bash

# ==============================================================================
# SECURE SECRETS GENERATION SCRIPT
# ==============================================================================
# This script generates cryptographically secure random secrets for production

echo "=============================================================================="
echo "DogePump Production Secrets Generator"
echo "=============================================================================="
echo ""

# Check if OpenSSL is available
if ! command -v openssl &> /dev/null; then
    echo "❌ Error: OpenSSL is required but not installed."
    echo "   Install with: brew install openssl (macOS)"
    echo "                or apt-get install openssl (Linux)"
    exit 1
fi

echo "🔐 Generating secure secrets..."
echo ""

# Generate JWT secrets (64 bytes base64 encoded)
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d '\n')

# Generate encryption key (64 hex characters)
ENCRYPTION_KEY=$(openssl rand -hex 32 | tr -d '\n')

echo "=============================================================================="
echo "PRODUCTION ENVIRONMENT VARIABLES"
echo "=============================================================================="
echo ""
echo "⚠️  IMPORTANT: Copy these values to your .env.production file"
echo "   Keep these secrets secure and never commit them to git!"
echo ""
echo "------------------------------------------------------------------------------"
echo "JWT_SECRET=$JWT_SECRET"
echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"
echo "------------------------------------------------------------------------------"
echo ""

# Create .env.production if it doesn't exist
if [ ! -f ".env.production" ]; then
    echo "📝 Creating .env.production file..."
    cat > .env.production << EOF
# ==============================================================================
# PRODUCTION ENVIRONMENT CONFIGURATION
# ==============================================================================
# ⚠️  WARNING: Never commit this file to version control!

NODE_ENV=production
PORT=3001
HOST=0.0.0.0
LOG_LEVEL=warn

# JWT Configuration (Generated: $(date))
JWT_SECRET=$JWT_SECRET
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET

# CORS Configuration
CORS_ORIGIN=https://dogepump.com

# Database Configuration
DATABASE_URL=postgresql://user:password@host:5432/dogepump_prod

# Redis Configuration (Optional - leave empty for in-memory fallback)
REDIS_URL=redis://localhost:6379

# Security Configuration
SECURITY_HEADERS_ENABLED=true
CSP_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=50

# Sentry Error Tracking
SENTRY_DSN=your-production-sentry-dsn-here
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1

# Blockchain Configuration
DOGCHAIN_RPC_URL=https://rpc.dogechain.dog
DOGCHAIN_FALLBACK_RPC_URL=https://rpc.ankr.com/dogechain
DOGCHAIN_EXPLORER_URL=https://explorer.dogechain.dog
DOGCHAIN_CHAIN_ID=2000

# Token Addresses
DC_TOKEN_ADDRESS=0x7B4328c127B85369D9f82ca0503B000D09CF9180
WDOGE_TOKEN_ADDRESS=0xB7ddC6414bf4F5515b52D8BdD69973Ae205ff101

# DEX Contract Addresses
VITE_DEX_FACTORY_ADDRESS=0x0000000000000000000000000000000000000000
VITE_DEX_ROUTER_ADDRESS=0x0000000000000000000000000000000000000000

# Data Encryption
ENCRYPTION_KEY=$ENCRYPTION_KEY

# Backup Configuration
BACKUP_DIR=/backups
BACKUP_RETENTION_DAYS=7
EOF
    echo "✅ Created .env.production file"
    echo ""
    echo "⚠️  EDIT REQUIRED: Update the following values in .env.production:"
    echo "   - DATABASE_URL (your PostgreSQL connection string)"
    echo "   - REDIS_URL (your Redis connection string)"
    echo "   - SENTRY_DSN (your Sentry DSN)"
    echo "   - VITE_DEX_FACTORY_ADDRESS (deployed factory contract address)"
    echo "   - VITE_DEX_ROUTER_ADDRESS (deployed router contract address)"
    echo ""
else
    echo "ℹ️  .env.production file already exists."
    echo "   Manually update your secrets with the values above."
    echo ""
fi

echo "=============================================================================="
echo "✨ Secrets generation complete!"
echo "=============================================================================="
echo ""
echo "📋 Next Steps:"
echo "   1. Review and update .env.production with your specific configuration"
echo "   2. Ensure DATABASE_URL, REDIS_URL, and contract addresses are set"
echo "   3. Add .env.production to .gitignore if not already added"
echo "   4. Deploy your production environment"
echo ""
