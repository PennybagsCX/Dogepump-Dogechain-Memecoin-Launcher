# Database Migration System

**Date**: January 15, 2026
**Feature**: Versioned Schema Migrations
**Status**: ✅ Implemented

---

## Overview

The DogePump platform now includes a comprehensive database migration system for PostgreSQL. This system allows for versioned database schema changes, automatic migration tracking, and safe rollbacks.

---

## Features

### Core Capabilities

- **Versioned Migrations**: Each migration has a unique timestamp-based ID
- **Up/Down Support**: Every migration can be applied and rolled back
- **Migration Tracking**: `schema_migrations` table tracks applied migrations
- **Dry Run Mode**: Preview migrations without applying them
- **Step-by-Step**: Apply/rollback specific numbers of migrations
- **Safe Transactions**: Migrations run in transactions with automatic rollback on failure
- **CLI Interface**: Simple command-line interface for all operations

---

## Migration File Format

### Naming Convention

Migrations are named using timestamp format:

```
YYYYMMDDHHMMSS_description.sql
```

Example: `20240115120000_add_user_indexes.sql`

### File Structure

Each migration file contains three sections:

```sql
-- Migration: Add user indexes
-- Created: 2024-01-15T12:00:00.000Z

-- UP: Apply this migration to the database

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- DOWN: Rollback this migration

DROP INDEX IF EXISTS idx_users_username;
DROP INDEX IF EXISTS idx_users_email;
```

**Sections**:
1. **Header**: Metadata (description, creation date)
2. **UP**: SQL to apply the migration
3. **DOWN**: SQL to rollback the migration

---

## Usage

### Check Migration Status

See which migrations have been applied and which are pending:

```bash
npm run migrate:status
```

**Output**:
```
Migration Status:
================
Total migrations: 5
Applied: 3
Pending: 2

Applied migrations:
  20240115120000 - add user table (2024-01-15T12:00:00Z)
  20240115120100 - add user indexes (2024-01-15T12:01:00Z)
  20240115120200 - add comments table (2024-01-15T12:02:00Z)

Pending migrations:
  20240115120300 - add audit logging
  20240115120400 - add encryption keys
```

### Apply All Pending Migrations

Apply all pending migrations in order:

```bash
npm run migrate:up
```

### Apply One Migration

Apply a single migration (useful for testing):

```bash
npm run migrate:up -- --step 1
```

### Apply N Migrations

Apply a specific number of migrations:

```bash
npm run migrate:up -- --step 3
```

### Dry Run (Preview)

Preview what migrations would be applied without actually running them:

```bash
npm run migrate:up -- --dry-run
```

**Output**:
```
DRY RUN - Would apply migrations:
  20240115120300 - add audit logging
  20240115120400 - add encryption keys
```

### Rollback Last Migration

Rollback the most recently applied migration:

```bash
npm run migrate:down
```

### Rollback N Migrations

Rollback a specific number of migrations:

```bash
npm run migrate:down -- --step 3
```

### Create New Migration

Create a new migration file with a template:

```bash
npm run migrate:create add_token_indexes
```

**Output**:
```
Created migration: 20240115120500_add_token_indexes.sql
Edit file: /path/to/server/database/migrations/20240115120500_add_token_indexes.sql
```

The migration file will be created with a template ready to edit.

---

## Migration Best Practices

### 1. Design Idempotent Migrations

Migrations should be safe to run multiple times (though the system prevents re-running):

```sql
-- GOOD: Uses IF NOT EXISTS
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

-- BAD: Will fail if table already exists
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY
);
```

### 2. Include Down Migrations

Always include rollback logic:

```sql
-- UP
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;

-- DOWN
ALTER TABLE users DROP COLUMN IF EXISTS email_verified;
```

### 3. Use Transactions for Complex Migrations

For multi-step changes, wrap in transactions:

```sql
-- UP
BEGIN;
  ALTER TABLE tokens ADD COLUMN market_cap BIGINT;
  UPDATE tokens SET market_cap = 0 WHERE market_cap IS NULL;
  ALTER TABLE tokens ALTER COLUMN market_cap SET NOT NULL;
COMMIT;

-- DOWN
ALTER TABLE tokens DROP COLUMN IF EXISTS market_cap;
```

### 4. Test Migrations Locally

Always test migrations on a local database first:

```bash
# Apply migration
npm run migrate:up -- --step 1

# Verify changes
psql -d dogepump -c "\d users"

# Rollback if needed
npm run migrate:down
```

### 5. Create Migrations Before Schema Changes

When modifying the schema:
1. Create migration first
2. Write unit tests
3. Apply migration to dev database
4. Update application code
5. Test thoroughly
6. Deploy to production

---

## Common Migration Patterns

### Adding Indexes

```sql
-- UP
CREATE INDEX idx_tokens_symbol ON tokens(symbol);
CREATE INDEX idx_tokens_market_cap ON tokens(market_cap DESC);
CREATE INDEX idx_trades_token_id ON trades(token_id);
CREATE INDEX idx_trades_created_at ON trades(created_at DESC);

-- DOWN
DROP INDEX IF EXISTS idx_trades_created_at;
DROP INDEX IF EXISTS idx_trades_token_id;
DROP INDEX IF EXISTS idx_tokens_market_cap;
DROP INDEX IF EXISTS idx_tokens_symbol;
```

### Adding Columns

```sql
-- UP
ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500);
ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP;

-- DOWN
ALTER TABLE users DROP COLUMN IF EXISTS last_login_at;
ALTER TABLE users DROP COLUMN IF EXISTS avatar_url;
ALTER TABLE users DROP COLUMN IF EXISTS bio;
```

### Creating Tables

```sql
-- UP
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- DOWN
DROP TABLE IF EXISTS audit_logs;
```

### Modifying Columns

```sql
-- UP: Increase column size
ALTER TABLE tokens ALTER COLUMN name TYPE VARCHAR(100);

-- DOWN: Revert change
ALTER TABLE tokens ALTER COLUMN name TYPE VARCHAR(50);
```

### Adding Foreign Keys

```sql
-- UP
ALTER TABLE comments
ADD CONSTRAINT fk_comments_user_id
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- DOWN
ALTER TABLE comments
DROP CONSTRAINT IF EXISTS fk_comments_user_id;
```

---

## Migration Tracking

### Schema Migrations Table

The system creates a `schema_migrations` table to track applied migrations:

```sql
CREATE TABLE schema_migrations (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_schema_migrations_applied_at
ON schema_migrations(applied_at);
```

**Query Applied Migrations**:

```sql
SELECT id, name, applied_at
FROM schema_migrations
ORDER BY applied_at;
```

---

## Troubleshooting

### Issue: Migration Failed

**Error**: `Migration 20240115120000 failed`

**Solution**:
1. Check the error logs for details
2. Fix the issue in the migration file
3. The transaction was automatically rolled back
4. Fix any data inconsistencies manually if needed
5. Re-run the migration

### Issue: Need to Modify Applied Migration

**Problem**: Migration was applied but needs changes

**Solution**:
1. **Option A**: Create a new migration that fixes the issue
   ```bash
   npm run migrate:create fix_user_table_constraint
   ```
   Add the corrective SQL to the new migration.

2. **Option B**: Rollback and modify (only if in development)
   ```bash
   npm run migrate:down
   # Edit migration file
   npm run migrate:up
   ```

**Never rollback production migrations** unless absolutely necessary!

### Issue: Migration Status Shows Migrations as Pending But They're Applied

**Problem**: Migrations were applied manually (outside the system)

**Solution**: Manually insert records into `schema_migrations`:

```sql
INSERT INTO schema_migrations (id, name)
VALUES ('20240115120000', 'add user table');
```

### Issue: Conflicting Migrations in Team Environment

**Problem**: Two developers create migrations with same timestamp

**Solution**:
- Use communication channels to coordinate migrations
- If conflict occurs, rename one migration with a later timestamp
- Format: `YYYYMMDDHHMMSS_description.sql`

---

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Run Migrations

on:
  push:
    branches: [main]

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run migrations
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: npm run migrate:up

      - name: Check migration status
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: npm run migrate:status
```

---

## Production Deployment Checklist

### Pre-Deployment

- [ ] Test all migrations on staging database
- [ ] Backup production database
- [ ] Ensure `DATABASE_URL` is set correctly
- [ ] Review pending migrations

### Deployment Day

- [ ] Put application in maintenance mode
- [ ] Run `npm run migrate:status` to check current state
- [ ] Run `npm run migrate:up` to apply migrations
- [ ] Run `npm run migrate:status` to verify
- [ ] Test application functionality
- [ ] Take application out of maintenance mode

### Post-Deployment

- [ ] Monitor application logs for migration errors
- [ ] Verify database performance
- [ ] Check query execution plans
- [ ] Monitor for long-running queries

---

## Advanced Usage

### Programmatic Migration

Import and use migration functions in your code:

```typescript
import { runMigrations, rollbackMigration } from './database/migrations.js';
import { getPool } from './database/db.js';

// Apply migrations programmatically
const pool = getPool();
await runMigrations(pool);

// Rollback programmatically
await rollbackMigration(pool, { step: 1 });
```

### Custom Migration Logic

Create custom migration scripts:

```typescript
// server/scripts/custom-migration.ts
import { Pool } from 'pg';
import { runMigrations } from '../database/migrations.js';

async function customMigration() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Apply migrations
    await runMigrations(pool);

    // Run custom post-migration logic
    await pool.query('ANALYZE users');
    await pool.query('ANALYZE tokens');

    console.log('Migration completed successfully');
  } finally {
    await pool.end();
  }
}

customMigration();
```

---

## Migration Examples

### Example 1: Add User Preferences

```sql
-- Migration: Add user preferences
-- Created: 2024-01-15T12:00:00.000Z

-- UP: Add preferences table

CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  theme VARCHAR(20) DEFAULT 'light',
  language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- DOWN: Remove preferences table

DROP TABLE IF EXISTS user_preferences;
```

### Example 2: Add Token Metrics

```sql
-- Migration: Add token metrics tracking
-- Created: 2024-01-15T12:05:00.000Z

-- UP: Add metrics columns

ALTER TABLE tokens ADD COLUMN total_supply BIGINT;
ALTER TABLE tokens ADD COLUMN circulating_supply BIGINT;
ALTER TABLE tokens ADD COLUMN market_cap BIGINT;
ALTER TABLE tokens ADD COLUMN volume_24h BIGINT;

CREATE INDEX idx_tokens_market_cap ON tokens(market_cap DESC);
CREATE INDEX idx_tokens_volume_24h ON tokens(volume_24h DESC);

-- DOWN: Remove metrics columns

DROP INDEX IF EXISTS idx_tokens_volume_24h;
DROP INDEX IF EXISTS idx_tokens_market_cap;

ALTER TABLE tokens DROP COLUMN IF EXISTS volume_24h;
ALTER TABLE tokens DROP COLUMN IF EXISTS market_cap;
ALTER TABLE tokens DROP COLUMN IF EXISTS circulating_supply;
ALTER TABLE tokens DROP COLUMN IF EXISTS total_supply;
```

### Example 3: Add Audit Logging

```sql
-- Migration: Add comprehensive audit logging
-- Created: 2024-01-15T12:10:00.000Z

-- UP: Create audit infrastructure

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Create trigger function
CREATE OR REPLACE FUNCTION audit_log_func()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    new_values
  ) VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- DOWN: Remove audit infrastructure

DROP FUNCTION IF EXISTS audit_log_func() CASCADE;
DROP TABLE IF EXISTS audit_logs;
```

---

## Performance Considerations

### Impact on Production

**Migration Operations**:
- Add columns (instant): No performance impact
- Add indexes (slow): Locks table, builds index
- Create tables (instant): No impact on existing data
- Modify columns (slow): May rewrite entire table

**Best Practices**:
- Run index-creation migrations during low-traffic periods
- Use `CONCURRENTLY` for index creation when possible
- Test migration performance on staging first

### Concurrent Index Creation

For large tables, create indexes without locking:

```sql
-- UP: Non-blocking index creation
CREATE INDEX CONCURRENTLY idx_tokens_market_cap
ON tokens(market_cap DESC);

-- DOWN: Regular drop is fine
DROP INDEX IF EXISTS idx_tokens_market_cap;
```

---

## Security Considerations

### Migration Permissions

The migration system requires database permissions to:
- CREATE TABLE / DROP TABLE
- ALTER TABLE
- CREATE INDEX / DROP INDEX
- INSERT into `schema_migrations` table

**Recommended**: Use a dedicated migration database user with limited permissions:

```sql
CREATE USER dogepump_migrate WITH PASSWORD 'secure_password';

GRANT CONNECT ON DATABASE dogepump TO dogepump_migrate;
GRANT CREATE, ALTER, DROP ON SCHEMA public TO dogepump_migrate;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO dogepump_migrate;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO dogepump_migrate;
```

---

## Backup Recommendations

### Before Migrations

Always backup before running migrations in production:

```bash
# Manual backup
./server/scripts/backup.sh

# Or use pg_dump directly
pg_dump $DATABASE_URL > backup_before_migration.sql
```

### After Failed Migrations

If a migration fails:
1. Do NOT manually modify the database
2. Check the logs for the specific error
3. Fix the migration file
4. The transaction was rolled back automatically
5. Re-run the migration

---

## Additional Resources

- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [Database Migration Best Practices](https://martinfowler.com/articles/evodb.html)
- [PostgreSQL Index Types](https://www.postgresql.org/docs/current/indexes.html)

---

**Implementation Date**: January 15, 2026
**Last Updated**: January 15, 2026
**Version**: 1.0.0
