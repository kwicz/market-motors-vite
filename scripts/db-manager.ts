#!/usr/bin/env tsx

import { program } from 'commander';
import { config } from 'dotenv';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

// Load environment variables
config();

const PROJECT_ROOT = path.resolve(__dirname, '..');
const BACKUP_SCRIPT = path.join(PROJECT_ROOT, 'scripts', 'backup-database.sh');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function printStatus(message: string) {
  console.log(`${colors.blue}[INFO]${colors.reset} ${message}`);
}

function printSuccess(message: string) {
  console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`);
}

function printWarning(message: string) {
  console.log(`${colors.yellow}[WARNING]${colors.reset} ${message}`);
}

function printError(message: string) {
  console.log(`${colors.red}[ERROR]${colors.reset} ${message}`);
}

function executeCommand(command: string, cwd: string = PROJECT_ROOT): string {
  try {
    const result = execSync(command, {
      cwd,
      encoding: 'utf-8',
      stdio: ['inherit', 'pipe', 'pipe'],
    });
    return result.toString().trim();
  } catch (error: any) {
    throw new Error(`Command failed: ${command}\n${error.message}`);
  }
}

// Migration commands
program
  .command('migrate')
  .description('Run pending database migrations')
  .option('-t, --target <migration>', 'Migrate to specific migration')
  .action(async (options) => {
    try {
      printStatus('Running database migrations...');

      if (options.target) {
        printStatus(`Migrating to target: ${options.target}`);
        // Custom migration logic would go here
        executeCommand('npm run db:migrate');
      } else {
        executeCommand('npm run db:migrate');
      }

      printSuccess('Database migrations completed successfully');
    } catch (error: any) {
      printError(`Migration failed: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('migrate:status')
  .description('Show migration status')
  .action(async () => {
    try {
      printStatus('Checking migration status...');

      // Check if migrations directory exists
      const migrationsDir = path.join(PROJECT_ROOT, 'lib', 'db', 'migrations');
      if (!fs.existsSync(migrationsDir)) {
        printWarning('No migrations directory found');
        return;
      }

      // List migration files
      const migrationFiles = fs
        .readdirSync(migrationsDir)
        .filter((file) => file.endsWith('.sql'))
        .sort();

      if (migrationFiles.length === 0) {
        printWarning('No migration files found');
        return;
      }

      console.log('\nMigration files:');
      migrationFiles.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file}`);
      });

      // Check database connection
      try {
        executeCommand('npm run db:test');
        printSuccess('Database connection verified');
      } catch (error) {
        printWarning('Could not verify database connection');
      }
    } catch (error: any) {
      printError(`Failed to check migration status: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('migrate:generate')
  .description('Generate new migration from schema changes')
  .option('-n, --name <name>', 'Migration name')
  .action(async (options) => {
    try {
      printStatus('Generating new migration...');

      if (options.name) {
        executeCommand(`npm run db:generate -- --name ${options.name}`);
      } else {
        executeCommand('npm run db:generate');
      }

      printSuccess('Migration generated successfully');
    } catch (error: any) {
      printError(`Migration generation failed: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('migrate:rollback')
  .description('Rollback last migration')
  .option('-t, --target <migration>', 'Rollback to specific migration')
  .action(async (options) => {
    try {
      printWarning('Rolling back database migration...');

      // This would require custom rollback logic
      printWarning('Rollback functionality requires manual implementation');
      printStatus('Please use database backup restore for rollback operations');
    } catch (error: any) {
      printError(`Rollback failed: ${error.message}`);
      process.exit(1);
    }
  });

// Backup commands
program
  .command('backup')
  .description('Create database backup')
  .option('-t, --type <type>', 'Backup type (full, schema, data)', 'full')
  .action(async (options) => {
    try {
      printStatus(`Creating ${options.type} database backup...`);

      if (!fs.existsSync(BACKUP_SCRIPT)) {
        printError('Backup script not found');
        process.exit(1);
      }

      executeCommand(`chmod +x ${BACKUP_SCRIPT}`);
      executeCommand(`${BACKUP_SCRIPT} backup ${options.type}`);

      printSuccess('Database backup completed successfully');
    } catch (error: any) {
      printError(`Backup failed: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('backup:list')
  .description('List available backups')
  .action(async () => {
    try {
      printStatus('Listing available backups...');

      if (!fs.existsSync(BACKUP_SCRIPT)) {
        printError('Backup script not found');
        process.exit(1);
      }

      executeCommand(`chmod +x ${BACKUP_SCRIPT}`);
      executeCommand(`${BACKUP_SCRIPT} list`);
    } catch (error: any) {
      printError(`Failed to list backups: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('backup:restore')
  .description('Restore database from backup')
  .argument('<backup-file>', 'Backup file to restore from')
  .action(async (backupFile) => {
    try {
      printWarning(`Restoring database from backup: ${backupFile}`);

      if (!fs.existsSync(BACKUP_SCRIPT)) {
        printError('Backup script not found');
        process.exit(1);
      }

      executeCommand(`chmod +x ${BACKUP_SCRIPT}`);
      executeCommand(`${BACKUP_SCRIPT} restore ${backupFile}`);

      printSuccess('Database restore completed successfully');
    } catch (error: any) {
      printError(`Restore failed: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('backup:verify')
  .description('Verify backup file integrity')
  .argument('<backup-file>', 'Backup file to verify')
  .action(async (backupFile) => {
    try {
      printStatus(`Verifying backup file: ${backupFile}`);

      if (!fs.existsSync(BACKUP_SCRIPT)) {
        printError('Backup script not found');
        process.exit(1);
      }

      executeCommand(`chmod +x ${BACKUP_SCRIPT}`);
      executeCommand(`${BACKUP_SCRIPT} verify ${backupFile}`);

      printSuccess('Backup verification completed');
    } catch (error: any) {
      printError(`Verification failed: ${error.message}`);
      process.exit(1);
    }
  });

// Database utility commands
program
  .command('db:status')
  .description('Check database connection and status')
  .action(async () => {
    try {
      printStatus('Checking database status...');

      // Check environment variables
      if (!process.env.DATABASE_URL) {
        printError('DATABASE_URL environment variable not set');
        process.exit(1);
      }

      printStatus('Environment variables configured');

      // Test database connection
      executeCommand('npm run db:test');
      printSuccess('Database connection successful');

      // Check if Drizzle studio is available
      try {
        printStatus('Drizzle ORM configuration:');
        console.log(
          `  Database URL: ${process.env.DATABASE_URL?.replace(
            /:[^:]*@/,
            ':***@'
          )}`
        );
        printStatus('Run "npm run db:studio" to open Drizzle Studio');
      } catch (error) {
        printWarning('Could not check Drizzle configuration');
      }
    } catch (error: any) {
      printError(`Database status check failed: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('db:seed')
  .description('Seed database with initial data')
  .action(async () => {
    try {
      printStatus('Seeding database with initial data...');

      // Check if seed script exists
      const seedScript = path.join(PROJECT_ROOT, 'lib', 'db', 'seed.ts');
      if (fs.existsSync(seedScript)) {
        executeCommand(`tsx ${seedScript}`);
        printSuccess('Database seeded successfully');
      } else {
        printWarning('No seed script found at lib/db/seed.ts');
      }
    } catch (error: any) {
      printError(`Database seeding failed: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('db:reset')
  .description('Reset database (drop all tables and re-run migrations)')
  .option('--force', 'Skip confirmation prompt')
  .action(async (options) => {
    try {
      if (!options.force) {
        printWarning('This will completely reset your database!');
        printWarning('All data will be lost. This action cannot be undone.');

        // In a real CLI, you'd use a proper prompt library
        printError('Use --force flag to confirm this destructive operation');
        process.exit(1);
      }

      printStatus('Resetting database...');

      // Drop and recreate database
      executeCommand('npm run db:push -- --force');

      // Run migrations
      executeCommand('npm run db:migrate');

      // Seed if available
      const seedScript = path.join(PROJECT_ROOT, 'lib', 'db', 'seed.ts');
      if (fs.existsSync(seedScript)) {
        printStatus('Seeding database...');
        executeCommand(`tsx ${seedScript}`);
      }

      printSuccess('Database reset completed successfully');
    } catch (error: any) {
      printError(`Database reset failed: ${error.message}`);
      process.exit(1);
    }
  });

// Maintenance commands
program
  .command('maintenance')
  .description('Run database maintenance tasks')
  .action(async () => {
    try {
      printStatus('Running database maintenance...');

      // Create backup
      printStatus('Creating maintenance backup...');
      if (fs.existsSync(BACKUP_SCRIPT)) {
        executeCommand(`chmod +x ${BACKUP_SCRIPT}`);
        executeCommand(`${BACKUP_SCRIPT} backup full`);
      }

      // Analyze tables (PostgreSQL specific)
      try {
        executeCommand('psql $DATABASE_URL -c "ANALYZE;"');
        printStatus('Database statistics updated');
      } catch (error) {
        printWarning('Could not update database statistics');
      }

      // Rotate old backups
      if (fs.existsSync(BACKUP_SCRIPT)) {
        printStatus('Rotating old backups...');
        // Backup rotation is handled by the backup script
      }

      printSuccess('Database maintenance completed');
    } catch (error: any) {
      printError(`Maintenance failed: ${error.message}`);
      process.exit(1);
    }
  });

// Set up the CLI
program
  .name('db-manager')
  .description('Database management CLI for Market Motors')
  .version('1.0.0');

// Parse command line arguments
program.parse();

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
