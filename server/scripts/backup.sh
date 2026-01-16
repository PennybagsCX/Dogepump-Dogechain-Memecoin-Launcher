#!/bin/bash

# ==============================================================================
# DOGEPUMP DATABASE BACKUP SCRIPT
# ==============================================================================
# This script creates automated backups of the PostgreSQL database
# Usage: ./backup.sh [dry-run]
#
# Environment variables required:
#   DATABASE_URL - PostgreSQL connection string
#   BACKUP_DIR - Directory to store backups (default: ./backups)
#   BACKUP_RETENTION_DAYS - Number of days to keep backups (default: 7)
#   BACKUP_S3_BUCKET - Optional S3 bucket for offsite backups

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATE=$(date +%Y%m%d_%H%M%S)
TIMESTAMP=$(date +%s)

# Parse DATABASE_URL to get connection details
# Format: postgresql://user:password@host:port/database
if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "❌ Error: DATABASE_URL environment variable is required"
  echo "   Usage: DATABASE_URL=postgresql://user:pass@host:port/db $0"
  exit 1
fi

# Extract connection info from DATABASE_URL
DB_CONNECTION=$(echo "$DATABASE_URL" | sed -E 's|postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+)|\1://\2:\3:\4/\5|')

# Backup directories
BACKUP_DIR="${BACKUP_DIR:-$SCRIPT_DIR/../../backups}"
BACKUP_LOG_DIR="$BACKUP_DIR/logs"

# Create backup directories if they don't exist
mkdir -p "$BACKUP_DIR"
mkdir -p "$BACKUP_LOG_DIR"

# Backup file names
BACKUP_FILE="$BACKUP_DIR/dogepump_backup_$DATE.sql.gz"
LOG_FILE="$BACKUP_LOG_DIR/backup_$DATE.log"

# Retention settings
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

# Function to log messages
log() {
  local level="$1"
  shift
  local message="[$(date +'%Y-%m-%d %H:%M:%S')] [$level] $*"
  echo "$message" | tee -a "$LOG_FILE"
}

# Function to check if pg_dump is available
check_dependencies() {
  log "INFO" "Checking dependencies..."

  if ! command -v pg_dump &> /dev/null; then
    log "ERROR" "pg_dump is required but not installed"
    log "ERROR" "Install with: brew install postgresql (macOS)"
    log "ERROR" "            or apt-get install postgresql-client (Linux)"
    exit 1
  fi

  if ! command -v psql &> /dev/null; then
    log "ERROR" "psql is required but not installed"
    exit 1
  fi

  log "INFO" "Dependencies OK"
}

# Function to test database connection
test_connection() {
  log "INFO" "Testing database connection..."

  if pg_dump "$DATABASE_URL" --schema-only > /dev/null 2>&1; then
    log "INFO" "Database connection successful"
  else
    log "ERROR" "Failed to connect to database"
    log "ERROR" "Check your DATABASE_URL: ${DATABASE_URL:0:20}..."
    exit 1
  fi
}

# Function to create backup
create_backup() {
  log "INFO" "Starting database backup..."
  log "INFO" "Backup file: $BACKUP_FILE"

  local start_time=$(date +%s)

  # Create backup with pg_dump
  # --format=plain: Plain text SQL format
  # --no-owner: Skip owner commands (simpler restores)
  # --no-acl: Skip ACL commands
  # --schema-only: Schema only (uncomment for schema-only backup)
  # --data-only: Data only (uncomment for data-only backup)
  pg_dump "$DATABASE_URL" \
    --format=plain \
    --no-owner \
    --no-acl \
    --verbose \
    2>&1 | tee >(gzip > "$BACKUP_FILE") | tee -a "$LOG_FILE" | grep -v "^--"

  local end_time=$(date +%s)
  local duration=$((end_time - start_time))

  # Check if backup was created successfully
  if [[ -f "$BACKUP_FILE" ]]; then
    local backup_size=$(du -h "$BACKUP_FILE" | cut -f1)
    log "INFO" "Backup created successfully"
    log "INFO" "Size: $backup_size"
    log "INFO" "Duration: ${duration}s"
  else
    log "ERROR" "Backup file was not created"
    exit 1
  fi
}

# Function to verify backup integrity
verify_backup() {
  log "INFO" "Verifying backup integrity..."

  local test_file="$BACKUP_DIR/verify_backup_$$.sql"

  # Test if gzip file is valid and extract first few lines
  if gunzip -t "$BACKUP_FILE" 2>&1; then
    log "INFO" "GZIP integrity OK"
  else
    log "ERROR" "Backup file is corrupted"
    exit 1
  fi

  # Extract and check SQL structure
  gunzip -c "$BACKUP_FILE" | head -20 > "$test_file"

  if grep -q "PostgreSQL database dump" "$test_file"; then
    log "INFO" "Backup format OK"
  else
    log "ERROR" "Invalid backup format"
    rm -f "$test_file"
    exit 1
  fi

  rm -f "$test_file"
  log "INFO" "Backup verification OK"
}

# Function to upload to S3 (optional)
upload_to_s3() {
  if [[ -n "${BACKUP_S3_BUCKET:-}" ]] && command -v aws &> /dev/null; then
    log "INFO" "Uploading backup to S3: $BACKUP_S3_BUCKET"

    local s3_path="s3://$BACKUP_S3_BUCKET/dogepump/backup_$DATE.sql.gz"

    if aws s3 cp "$BACKUP_FILE" "$s3_path" 2>&1 | tee -a "$LOG_FILE"; then
      log "INFO" "S3 upload successful"
    else
      log "ERROR" "S3 upload failed"
    fi
  else
    log "INFO" "S3 upload skipped (BACKUP_S3_BUCKET not set or AWS CLI not installed)"
  fi
}

# Function to clean up old backups
cleanup_old_backups() {
  log "INFO" "Cleaning up backups older than $RETENTION_DAYS days..."

  local deleted_count=0

  # Find and delete old backup files
  while IFS= read -r -d '' file; do
    log "INFO" "Deleting old backup: $(basename "$file")"
    rm -f "$file"
    ((deleted_count++))
  done < <(find "$BACKUP_DIR" -name "dogepump_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -print0 2>/dev/null)

  # Clean up old log files
  while IFS= read -r -d '' file; do
    rm -f "$file"
  done < <(find "$BACKUP_LOG_DIR" -name "backup_*.log" -type f -mtime +$RETENTION_DAYS -print0 2>/dev/null)

  log "INFO" "Deleted $deleted_count old backup(s)"
}

# Function to create backup manifest
create_manifest() {
  local manifest_file="$BACKUP_DIR/manifest_$DATE.json"

  log "INFO" "Creating backup manifest..."

  cat > "$manifest_file" << EOF
{
  "timestamp": "$TIMESTAMP",
  "date": "$(date -Iseconds)",
  "backup_file": "$(basename "$BACKUP_FILE")",
  "backup_path": "$BACKUP_FILE",
  "backup_size_bytes": $(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE"),
  "database_host": "$(echo "$DATABASE_URL" | sed -E 's|.*@([^:]+):[0-9]+/.*|\1|')",
  "database_name": "$(echo "$DATABASE_URL" | sed -E 's|.*/(.+)|\1|')",
  "retention_days": $RETENTION_DAYS,
  "script_version": "1.0.0"
}
EOF

  log "INFO" "Manifest created: $manifest_file"
}

# Function to display backup summary
backup_summary() {
  log "INFO" "=========================================="
  log "INFO" "BACKUP SUMMARY"
  log "INFO" "=========================================="
  log "INFO" "Status: SUCCESS"
  log "INFO" "Backup: $BACKUP_FILE"
  log "INFO" "Manifest: $manifest_file"
  log "INFO" "Logs: $LOG_FILE"
  log "INFO" "Retention: $RETENTION_DAYS days"
  log "INFO" "=========================================="
}

# Main execution
main() {
  log "INFO" "=========================================="
  log "INFO" "DOGEPUMP DATABASE BACKUP"
  log "INFO" "=========================================="
  log "INFO" "Date: $(date)"
  log "INFO" "Database: $(echo "$DATABASE_URL" | sed -E 's|.*/(.+)|\1|')"
  log "INFO" "Backup Dir: $BACKUP_DIR"
  log "INFO" "=========================================="

  # Dry run mode
  if [[ "${1:-}" == "dry-run" ]]; then
    log "INFO" "DRY RUN MODE - No backup will be created"
    log "INFO" "Configuration:"
    log "INFO" "  DATABASE_URL: ${DATABASE_URL:0:30}..."
    log "INFO" "  BACKUP_DIR: $BACKUP_DIR"
    log "INFO" "  RETENTION_DAYS: $RETENTION_DAYS"
    log "INFO" "  BACKUP_S3_BUCKET: ${BACKUP_S3_BUCKET:-not set}"
    exit 0
  fi

  # Execute backup
  check_dependencies
  test_connection
  create_backup
  verify_backup
  create_manifest
  upload_to_s3
  cleanup_old_backups
  backup_summary

  log "INFO" "Backup completed successfully!"
}

# Run main function
main "$@"
