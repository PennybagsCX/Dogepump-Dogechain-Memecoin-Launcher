/**
 * Database Migration System
 *
 * Simple, self-contained migration runner for PostgreSQL.
 * Tracks applied migrations in `schema_migrations` table.
 */

import { Pool } from 'pg';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Migration {
  id: string;
  name: string;
  up: string;
  down: string;
}

interface MigrationRecord {
  id: string;
  name: string;
  applied_at: Date;
}

/**
 * Create migrations table if it doesn't exist
 */
async function createMigrationsTable(pool: Pool): Promise<void> {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  );

  // Create index on applied_at for sorting
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied_at
    ON schema_migrations(applied_at)`
  );

  logger.info('Migrations table ready');
}

/**
 * Get list of applied migrations from database
 */
async function getAppliedMigrations(pool: Pool): Promise<Set<string>> {
  const result = await pool.query<MigrationRecord>(
    'SELECT id FROM schema_migrations ORDER BY applied_at'
  );

  const applied = new Set<string>();
  for (const row of result.rows) {
    applied.add(row.id);
  }

  return applied;
}

/**
 * Load migration files from migrations directory
 */
async function loadMigrations(): Promise<Migration[]> {
  const migrationsDir = path.join(__dirname, 'migrations');

  try {
    await fs.access(migrationsDir);
  } catch {
    logger.warn('Migrations directory does not exist, creating it');
    await fs.mkdir(migrationsDir, { recursive: true });
    return [];
  }

  const files = await fs.readdir(migrationsDir);
  const migrations: Migration[] = [];

  for (const file of files) {
    if (!file.endsWith('.sql')) {
      continue;
    }

    const filePath = path.join(migrationsDir, file);
    const content = await fs.readFile(filePath, 'utf-8');

    // Parse migration file
    // Format: YYYYMMDDHHMMSS_description.sql
    const match = file.match(/^(\d{14})_(.+)\.sql$/);
    if (!match) {
      logger.warn(`Skipping invalid migration file: ${file}`);
      continue;
    }

    const [, id, description] = match;

    // Split migration into up and down sections
    const parts = content.split(/^--\s*DOWN\s*$/m);

    if (parts.length < 2) {
      logger.warn(`Migration ${file} is missing DOWN section`);
      continue;
    }

    const up = parts[0]
      .replace(/^--\s*UP\s*$/m, '')
      .trim();

    const down = parts[1].trim();

    migrations.push({
      id,
      name: description.replace(/_/g, ' '),
      up,
      down,
    });
  }

  // Sort by ID (timestamp)
  migrations.sort((a, b) => a.id.localeCompare(b.id));

  return migrations;
}

/**
 * Apply pending migrations
 */
export async function runMigrations(pool: Pool, options: {
  step?: number;
  to?: string;
  dryRun?: boolean;
} = {}): Promise<void> {
  logger.info('Starting database migration...');

  // Create migrations table
  await createMigrationsTable(pool);

  // Get applied migrations
  const applied = await getAppliedMigrations(pool);

  // Load migration files
  const migrations = await loadMigrations();

  if (migrations.length === 0) {
    logger.info('No migrations to run');
    return;
  }

  // Filter pending migrations
  const pending = migrations.filter(m => !applied.has(m.id));

  if (pending.length === 0) {
    logger.info('Database is up to date');
    return;
  }

  // Limit migrations if step option provided
  const toRun = options.step
    ? pending.slice(0, options.step)
    : options.to
    ? pending.filter(m => m.id <= options.to)
    : pending;

  if (options.dryRun) {
    logger.info('DRY RUN - Would apply migrations:');
    for (const migration of toRun) {
      logger.info(`  ${migration.id} - ${migration.name}`);
    }
    return;
  }

  logger.info(`Applying ${toRun.length} migration(s)...`);

  // Apply migrations in transaction
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const migration of toRun) {
      logger.info(`Running migration: ${migration.id} - ${migration.name}`);

      try {
        await client.query(migration.up);

        // Record migration
        await client.query(
          'INSERT INTO schema_migrations (id, name) VALUES ($1, $2)',
          [migration.id, migration.name]
        );

        logger.info(`✓ Migration ${migration.id} applied`);
      } catch (error) {
        logger.error(`✗ Migration ${migration.id} failed`, error);
        throw error;
      }
    }

    await client.query('COMMIT');
    logger.info('✓ All migrations applied successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Migration failed, rolled back', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Rollback last migration
 */
export async function rollbackMigration(pool: Pool, options: {
  step?: number;
  to?: string;
  dryRun?: boolean;
} = {}): Promise<void> {
  logger.info('Rolling back database migration...');

  // Get applied migrations
  const applied = await getAppliedMigrations(pool);

  if (applied.size === 0) {
    logger.info('No migrations to rollback');
    return;
  }

  // Load all migrations
  const migrations = await loadMigrations();

  // Get migrations to rollback (most recent first)
  const appliedList = Array.from(applied).sort().reverse();
  const toRollback = options.step
    ? appliedList.slice(0, options.step)
    : options.to
    ? appliedList.filter(id => id >= options.to)
    : [appliedList[0]]; // Default: rollback one

  if (toRollback.length === 0) {
    logger.info('No migrations match rollback criteria');
    return;
  }

  if (options.dryRun) {
    logger.info('DRY RUN - Would rollback migrations:');
    for (const id of toRollback) {
      const migration = migrations.find(m => m.id === id);
      logger.info(`  ${id} - ${migration?.name || 'Unknown'}`);
    }
    return;
  }

  logger.info(`Rolling back ${toRollback.length} migration(s)...`);

  // Rollback migrations in transaction
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const id of toRollback) {
      const migration = migrations.find(m => m.id === id);

      if (!migration) {
        logger.warn(`Migration file not found for ${id}, skipping`);
        continue;
      }

      logger.info(`Rolling back: ${migration.id} - ${migration.name}`);

      try {
        await client.query(migration.down);

        // Remove migration record
        await client.query('DELETE FROM schema_migrations WHERE id = $1', [id]);

        logger.info(`✓ Migration ${migration.id} rolled back`);
      } catch (error) {
        logger.error(`✗ Rollback ${migration.id} failed`, error);
        throw error;
      }
    }

    await client.query('COMMIT');
    logger.info('✓ Rollback completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Rollback failed, rolled back', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get migration status
 */
export async function getMigrationStatus(pool: Pool): Promise<void> {
  try {
    logger.info('Migration Status:');
    logger.info('================');

    // Ensure migrations table exists
    await createMigrationsTable(pool);

    logger.info('Querying applied migrations from database...');
    // Get applied migrations
    const appliedResult = await pool.query<MigrationRecord>(
      'SELECT id, name, applied_at FROM schema_migrations ORDER BY applied_at'
    );

    logger.info('Loading migration files from filesystem...');
    // Load all migrations
    const migrations = await loadMigrations();

    logger.info(`Total migrations: ${migrations.length}`);
    logger.info(`Applied: ${appliedResult.rows.length}`);
    logger.info(`Pending: ${migrations.length - appliedResult.rows.length}`);
    logger.info('');

    if (appliedResult.rows.length > 0) {
      logger.info('Applied migrations:');
      for (const row of appliedResult.rows) {
        const date = new Date(row.applied_at).toISOString();
        logger.info(`  ${row.id} - ${row.name} (${date})`);
      }
    }

    const appliedIds = new Set(appliedResult.rows.map(r => r.id));
    const pending = migrations.filter(m => !appliedIds.has(m.id));

    if (pending.length > 0) {
      logger.info('');
      logger.info('Pending migrations:');
      for (const migration of pending) {
        logger.info(`  ${migration.id} - ${migration.name}`);
      }
    }
  } catch (error: any) {
    logger.error('Failed to get migration status');
    logger.error('Error message:', error?.message || 'Unknown error');
    logger.error('Error stack:', error?.stack || 'No stack trace');
    logger.error('Error details:', error ? JSON.stringify(error, Object.getOwnPropertyNames(error)) : 'No error object');
    throw error;
  }
}

/**
 * Create a new migration file
 */
export async function createMigration(description: string): Promise<void> {
  const migrationsDir = path.join(__dirname, 'migrations');

  await fs.mkdir(migrationsDir, { recursive: true });

  // Generate migration ID (timestamp)
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hour = now.getHours().toString().padStart(2, '0');
  const minute = now.getMinutes().toString().padStart(2, '0');
  const second = now.getSeconds().toString().padStart(2, '0');

  const id = `${year}${month}${day}${hour}${minute}${second}`;

  // Sanitize description
  const sanitizedDescription = description
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

  const filename = `${id}_${sanitizedDescription}.sql`;
  const filePath = path.join(migrationsDir, filename);

  // Migration template
  const template = `-- Migration: ${description}
-- Created: ${now.toISOString()}

-- UP: Apply this migration to the database


-- DOWN: Rollback this migration


`;

  await fs.writeFile(filePath, template, 'utf-8');

  logger.info(`Created migration: ${filename}`);
  logger.info(`Edit file: ${filePath}`);
}

/**
 * CLI entry point for migration commands
 */
export async function runMigrationCLI(
  command: 'status' | 'up' | 'down' | 'create',
  args: string[]
): Promise<void> {
  const { Pool } = await import('pg');
  const { getPool } = await import('./db.js');

  const pool = getPool();

  try {
    switch (command) {
      case 'status':
        await getMigrationStatus(pool);
        break;

      case 'up': {
        const step = args.includes('--step')
          ? parseInt(args[args.indexOf('--step') + 1] || '1', 10)
          : undefined;

        const dryRun = args.includes('--dry-run');

        await runMigrations(pool, { step, dryRun });
        break;
      }

      case 'down': {
        const step = args.includes('--step')
          ? parseInt(args[args.indexOf('--step') + 1] || '1', 10)
          : undefined;

        const dryRun = args.includes('--dry-run');

        await rollbackMigration(pool, { step, dryRun });
        break;
      }

      case 'create': {
        const description = args[0];
        if (!description) {
          logger.error('Usage: migrate create <description>');
          process.exit(1);
        }

        await createMigration(description);
        break;
      }

      default:
        logger.error(`Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    logger.error('Migration command failed', error);
    process.exit(1);
  }
}
