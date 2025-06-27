#!/bin/bash

# Database Backup Script for Market Motors
# This script creates automated backups of PostgreSQL database with rotation

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_ROOT}/backups"
LOG_FILE="${PROJECT_ROOT}/logs/backup.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

# Load environment variables
load_env() {
    if [ -f "$PROJECT_ROOT/.env" ]; then
        export $(cat "$PROJECT_ROOT/.env" | grep -v '^#' | xargs)
    elif [ -f "$PROJECT_ROOT/.env.production" ]; then
        export $(cat "$PROJECT_ROOT/.env.production" | grep -v '^#' | xargs)
    else
        print_error "No environment file found"
        exit 1
    fi
}

# Create necessary directories
setup_directories() {
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$(dirname "$LOG_FILE")"
}

# Parse DATABASE_URL to extract connection details
parse_database_url() {
    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL environment variable is not set"
        exit 1
    fi

    # Parse PostgreSQL URL: postgresql://user:password@host:port/database
    DB_URL_REGEX="postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+)"
    
    if [[ $DATABASE_URL =~ $DB_URL_REGEX ]]; then
        export PGUSER="${BASH_REMATCH[1]}"
        export PGPASSWORD="${BASH_REMATCH[2]}"
        export PGHOST="${BASH_REMATCH[3]}"
        export PGPORT="${BASH_REMATCH[4]}"
        export PGDATABASE="${BASH_REMATCH[5]}"
    else
        print_error "Invalid DATABASE_URL format"
        exit 1
    fi
}

# Check if PostgreSQL tools are available
check_postgresql_tools() {
    if ! command -v pg_dump &> /dev/null; then
        print_error "pg_dump is not installed. Please install PostgreSQL client tools."
        exit 1
    fi
    
    if ! command -v psql &> /dev/null; then
        print_error "psql is not installed. Please install PostgreSQL client tools."
        exit 1
    fi
}

# Test database connection
test_connection() {
    print_status "Testing database connection..."
    
    if psql -c "SELECT version();" > /dev/null 2>&1; then
        print_success "Database connection successful"
    else
        print_error "Failed to connect to database"
        exit 1
    fi
}

# Create database backup
create_backup() {
    local backup_type="${1:-full}"
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_filename="market_motors_${backup_type}_${timestamp}.sql"
    local backup_path="${BACKUP_DIR}/${backup_filename}"
    
    print_status "Creating ${backup_type} backup: ${backup_filename}"
    
    case $backup_type in
        "full")
            pg_dump --verbose --clean --no-acl --no-owner --format=custom --file="${backup_path}.dump" 2>> "$LOG_FILE"
            pg_dump --verbose --clean --no-acl --no-owner --format=plain --file="${backup_path}" 2>> "$LOG_FILE"
            ;;
        "schema")
            pg_dump --verbose --schema-only --clean --no-acl --no-owner --format=plain --file="${backup_path}" 2>> "$LOG_FILE"
            ;;
        "data")
            pg_dump --verbose --data-only --clean --no-acl --no-owner --format=plain --file="${backup_path}" 2>> "$LOG_FILE"
            ;;
        *)
            print_error "Invalid backup type: ${backup_type}"
            exit 1
            ;;
    esac
    
    if [ $? -eq 0 ]; then
        # Compress the backup
        gzip "${backup_path}"
        if [ "$backup_type" = "full" ]; then
            gzip "${backup_path}.dump"
        fi
        
        print_success "Backup created successfully: ${backup_filename}.gz"
        
        # Calculate backup size
        local backup_size=$(du -h "${backup_path}.gz" | cut -f1)
        print_status "Backup size: ${backup_size}"
        
        # Store backup info
        echo "$(date '+%Y-%m-%d %H:%M:%S') | ${backup_type} | ${backup_filename}.gz | ${backup_size}" >> "${BACKUP_DIR}/backup_log.txt"
        
        return 0
    else
        print_error "Backup failed"
        return 1
    fi
}

# Rotate old backups
rotate_backups() {
    local retention_days="${BACKUP_RETENTION_DAYS:-7}"
    
    print_status "Rotating backups older than ${retention_days} days..."
    
    # Remove backups older than retention period
    find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime +${retention_days} -delete
    find "$BACKUP_DIR" -name "*.dump.gz" -type f -mtime +${retention_days} -delete
    
    # Clean up backup log entries older than 30 days
    if [ -f "${BACKUP_DIR}/backup_log.txt" ]; then
        local temp_log=$(mktemp)
        awk -v cutoff_date="$(date -d '30 days ago' '+%Y-%m-%d')" '
            BEGIN { FS=" | " }
            {
                if ($1 >= cutoff_date) print $0
            }
        ' "${BACKUP_DIR}/backup_log.txt" > "$temp_log"
        mv "$temp_log" "${BACKUP_DIR}/backup_log.txt"
    fi
    
    print_success "Backup rotation completed"
}

# List available backups
list_backups() {
    print_status "Available backups:"
    
    if [ -f "${BACKUP_DIR}/backup_log.txt" ]; then
        echo "Date & Time          | Type   | Filename                                    | Size"
        echo "-------------------- | ------ | ------------------------------------------- | ------"
        cat "${BACKUP_DIR}/backup_log.txt" | tail -20
    else
        print_warning "No backup log found"
    fi
    
    echo ""
    print_status "Backup files in ${BACKUP_DIR}:"
    ls -lh "${BACKUP_DIR}"/*.gz 2>/dev/null || print_warning "No backup files found"
}

# Restore database from backup
restore_backup() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        print_error "Backup file not specified"
        echo "Usage: $0 restore <backup_file>"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        print_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    print_warning "This will overwrite the current database!"
    read -p "Are you sure you want to continue? (yes/no): " -r
    
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        print_status "Restore cancelled"
        exit 0
    fi
    
    print_status "Restoring database from: $(basename "$backup_file")"
    
    # Check if it's a compressed file
    if [[ "$backup_file" == *.gz ]]; then
        if [[ "$backup_file" == *.dump.gz ]]; then
            # Custom format backup
            gunzip -c "$backup_file" | pg_restore --verbose --clean --no-acl --no-owner --dbname="$PGDATABASE" 2>> "$LOG_FILE"
        else
            # Plain SQL backup
            gunzip -c "$backup_file" | psql 2>> "$LOG_FILE"
        fi
    else
        if [[ "$backup_file" == *.dump ]]; then
            # Custom format backup
            pg_restore --verbose --clean --no-acl --no-owner --dbname="$PGDATABASE" "$backup_file" 2>> "$LOG_FILE"
        else
            # Plain SQL backup
            psql -f "$backup_file" 2>> "$LOG_FILE"
        fi
    fi
    
    if [ $? -eq 0 ]; then
        print_success "Database restored successfully"
    else
        print_error "Database restore failed"
        exit 1
    fi
}

# Verify backup integrity
verify_backup() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        print_error "Backup file not specified"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        print_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    print_status "Verifying backup integrity: $(basename "$backup_file")"
    
    # Check if file is readable and not corrupted
    if [[ "$backup_file" == *.gz ]]; then
        if gzip -t "$backup_file" 2>/dev/null; then
            print_success "Backup file is valid and not corrupted"
        else
            print_error "Backup file is corrupted"
            exit 1
        fi
    else
        if [ -r "$backup_file" ] && [ -s "$backup_file" ]; then
            print_success "Backup file is readable and not empty"
        else
            print_error "Backup file is not readable or empty"
            exit 1
        fi
    fi
}

# Main function
main() {
    local command="${1:-backup}"
    
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Starting database ${command} operation" >> "$LOG_FILE"
    
    setup_directories
    load_env
    parse_database_url
    check_postgresql_tools
    
    case $command in
        "backup")
            local backup_type="${2:-full}"
            test_connection
            create_backup "$backup_type"
            rotate_backups
            ;;
        "restore")
            restore_backup "$2"
            ;;
        "list")
            list_backups
            ;;
        "verify")
            verify_backup "$2"
            ;;
        "help"|"--help"|"-h")
            echo "Database Backup Script for Market Motors"
            echo ""
            echo "Usage: $0 [command] [options]"
            echo ""
            echo "Commands:"
            echo "  backup [type]    Create database backup (default: full)"
            echo "                   Types: full, schema, data"
            echo "  restore <file>   Restore database from backup file"
            echo "  list            List available backups"
            echo "  verify <file>   Verify backup file integrity"
            echo "  help            Show this help message"
            echo ""
            echo "Environment Variables:"
            echo "  DATABASE_URL              PostgreSQL connection URL"
            echo "  BACKUP_RETENTION_DAYS     Days to keep backups (default: 7)"
            echo ""
            echo "Examples:"
            echo "  $0 backup full           # Create full backup"
            echo "  $0 backup schema         # Create schema-only backup"
            echo "  $0 restore backup.sql.gz # Restore from backup"
            echo "  $0 list                  # List all backups"
            ;;
        *)
            print_error "Unknown command: $command"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
    
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Completed database ${command} operation" >> "$LOG_FILE"
}

# Run main function with all arguments
main "$@" 