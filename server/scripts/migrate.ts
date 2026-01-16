#!/usr/bin/env tsx
/**
 * Database Migration CLI
 *
 * Usage:
 *   npm run migrate status          - Show migration status
 *   npm run migrate up              - Apply pending migrations
 *   npm run migrate up --step 1     - Apply 1 migration
 *   npm run migrate down            - Rollback last migration
 *   npm run migrate down --step 2   - Rollback 2 migrations
 *   npm run migrate create add_user_table - Create new migration
 *   npm run migrate --dry-run       - Preview migrations without applying
 */

import { runMigrationCLI } from '../database/migrations.js';

const command = process.argv[2] as 'status' | 'up' | 'down' | 'create';
const args = process.argv.slice(3);

await runMigrationCLI(command, args);
