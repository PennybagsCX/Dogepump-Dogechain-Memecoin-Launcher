#!/bin/bash

# ==============================================================================
# DOGEPUMP DATABASE RESTORE SCRIPT
# ==============================================================================
# This script restores a PostgreSQL database from a backup file
# Usage: ./restore.sh <backup_file> [--force]
#
# Arguments:
#   backup_file - Path to the backup file (optional, uses latest if not specified)
#   --force - Skip confirmation prompt
#
# Environment variables required:
#   DATABASE_URL - PostgreSQL connection string

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$SCRIPT_DIR/../../backups}"
LOG_DIR="$BACKUP_DIR/logs"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to log messages
log() {
  local level="$1"
  shift
  echo -e "${NC}[$(date +'%Y-%m-%d %H:%M:%S')] [$level] $*"
}

log_error() {
  echo -e "${RED}[ERROR] $*${NC}"
}

log_success() {
  echo -e "${GREEN}[SUCCESS] $*${NC}"
}

log_warning() {
  echo -e "${YELLOW}[WARNING] $*${NC}"
}

# Function to display usage
usage() {
  cat << EOF
Usage: $0 [backup_file] [--force]

Arguments:
  backup_file    Path to the backup file to restore (optional)
  --force        Skip confirmation prompt

If no backup file is specified, the latest backup will be used.

Examples:
  $0 restore.sh                                  # Restore latest backup
  $0 restore.sh dogepump_backup_20240115.sql.gz   # Restore specific backup
  $0 restore.sh --force                          # Restore without confirmation

EOF
  exit 1
}

# Function to check dependencies
check_dependencies() {
  log "INFO" "Checking dependencies..."

  if ! command -v psql &> /dev/null; then
    log_error "psql is required but not installed"
    log_error "Install with: brew install postgresql (macOS)"
    log_error "            or apt-get install postgresql-client (Linux)"
    exit 1
  fi

  if ! command -v gunzip &> /dev/null; then
    log_error "gunzip is required but not installed"
    exit 1
  fi

  log "INFO" "Dependencies OK"
}

# Function to find latest backup
find_latest_backup() {
  log "INFO" "Finding latest backup..."

  local latest=$(find "$BACKUP_DIR" -name "dogepump_backup_*.sql.gz" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)

  if [[ -z "$latest" ]]; then
    log_error "No backup files found in $BACKUP_DIR"
    exit 1
  fi

  log "INFO" "Latest backup: $(basename "$latest")"
  echo "$latest"
}

# Function to get backup size
get_backup_size() {
  local file="$1"
  local size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file")
  local size_mb=$((size / 1024 / 1024))
  echo "${size_mb}MB"
}

# Function to verify backup file
verify_backup_file() {
  local backup_file="$1"

  log "INFO" "Verifying backup file..."

  if [[ ! -f "$backup_file" ]]; then
    log_error "Backup file not found: $backup_file"
    exit 1
  fi

  # Check if gzip file is valid
  if ! gunzip -t "$backup_file" 2>&1; then
    log_error "Backup file is corrupted or invalid"
    exit 1
  fi

  log "INFO" "Backup file OK ($(get_backup_size "$backup_file"))"
}

# Function to test database connection before restore
pre_restore_check() {
  log "INFO" "Checking database connection..."

  if ! psql "$DATABASE_URL" -c '\q' 2>&1; then
    log_error "Cannot connect to database"
    log_error "Check your DATABASE_URL and ensure database is running"
    exit 1
  fi

  log "INFO" "Database connection OK"
}

# Function to confirm restore
confirm_restore() {
  local backup_file="$1"

  echo ""
  echo -e "${YELLOW}========================================${NC}"
  echo -e "${YELLOW}  DATABASE RESTORE CONFIRMATION${NC}"
  echo -e "${YELLOW}========================================${NC}"
  echo ""
  echo "This will RESTORE the database from backup:"
  echo "  Backup: $(basename "$backup_file")"
  echo "  Size: $(get_backup_size "$backup_file")"
  echo "  Database: $(echo "$DATABASE_URL" | sed -E 's|.*/(.+)|\1|')"
  echo ""
  echo -e "${RED}WARNING: This will DELETE all existing data!${NC}"
  echo ""

  read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirmation

  if [[ "$confirmation" != "yes" ]]; then
    log "INFO" "Restore cancelled by user"
    exit 0
  fi
}

# Function to perform restore
perform_restore() {
  local backup_file="$1"
  local log_file="$LOG_DIR/restore_$(date +%Y%m%d_%H%M%S).log"

  log "INFO" "Starting database restore..."
  log "INFO" "Log file: $log_file"

  local start_time=$(date +%s)

  # Extract and restore backup
  gunzip -c "$backup_file" | psql "$DATABASE_URL" 2>&1 | tee -a "$log_file"

  local exit_code=${PIPESTATUS[0]}

  local end_time=$(date +%s)
  local duration=$((end_time - start_time))

  if [[ $exit_code -eq 0 ]]; then
    log_success "Database restored successfully in ${duration}s"
  else
    log_error "Restore failed with exit code $exit_code"
    log_error "Check log file for details: $log_file"
    exit 1
  fi
}

# Function to verify data after restore
verify_restore() {
  log "INFO" "Verifying restored data..."

  # Check if tables exist
  local table_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>&1 | tr -d ' ')

  if [[ -n "$table_count" ]] && [[ "$table_count" -gt 0 ]]; then
    log "INFO" "Tables found in database: $table_count"
  else
    log_warning "No tables found in database after restore"
  fi

  # Check user count
  local user_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM users WHERE deleted_at IS NULL;" 2>/dev/null | tr -d ' ' || echo "N/A")
  log "INFO" "Active users: $user_count"

  # Check token count
  local token_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM tokens;" 2>/dev/null | tr -d ' ' || echo "N/A")
  log "INFO" "Tokens: $token_count"

  log "INFO" "Restore verification complete"
}

# Main execution
main() {
  local backup_file=""
  local force=false

  # Parse arguments
  while [[ $# -gt 0 ]]; do
    case $1 in
      --force)
        force=true
        shift
        ;;
      -*)
        usage
        ;;
      *)
        backup_file="$1"
        shift
        ;;
    esac
  done

  log "INFO" "=========================================="
  log "INFO" "DOGEPUMP DATABASE RESTORE"
  log "INFO" "=========================================="

  # Check if DATABASE_URL is set
  if [[ -z "${DATABASE_URL:-}" ]]; then
    log_error "DATABASE_URL environment variable is required"
    usage
  fi

  # Find backup file if not specified
  if [[ -z "$backup_file" ]]; then
    backup_file=$(find_latest_backup)
  elif [[ "$backup_file" != /* ]]; then
    # Relative path - convert to absolute
    backup_file="$BACKUP_DIR/$backup_file"
  fi

  # Run restore process
  check_dependencies
  verify_backup_file "$backup_file"
  pre_restore_check

  # Confirm restore unless --force flag
  if [[ "$force" != true ]]; then
    confirm_restore "$backup_file"
  else
    log_warning "--force flag set, skipping confirmation"
  fi

  # Create log directory
  mkdir -p "$LOG_DIR"

  # Perform restore
  perform_restore "$backup_file"
  verify_restore

  log_success "=========================================="
  log "Restore completed successfully!"
  log_success "=========================================="
}

# Run main function
main "$@"
