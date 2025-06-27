import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { logger } from '../../../server/utils/logger';

interface MigrationInfo {
  id: string;
  name: string;
  timestamp: number;
  executed_at: Date;
  checksum: string;
  rollback_sql?: string;
}

interface MigrationFile {
  id: string;
  name: string;
  upSql: string;
  downSql?: string;
  checksum: string;
}

export class MigrationRunner {
  private db: ReturnType<typeof drizzle>;
  private connection: postgres.Sql;
  private migrationsPath: string;

  constructor(
    connectionString: string,
    migrationsPath: string = './lib/db/migrations'
  ) {
    this.connection = postgres(connectionString, { max: 1 });
    this.db = drizzle(this.connection);
    this.migrationsPath = migrationsPath;
  }

  /**
   * Initialize migration tracking table
   */
  async initializeMigrationTable(): Promise<void> {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash TEXT NOT NULL,
        created_at BIGINT NOT NULL,
        name TEXT NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        checksum TEXT NOT NULL,
        rollback_sql TEXT
      );
      
      CREATE INDEX IF NOT EXISTS idx_drizzle_migrations_hash ON __drizzle_migrations(hash);
      CREATE INDEX IF NOT EXISTS idx_drizzle_migrations_created_at ON __drizzle_migrations(created_at);
    `;

    try {
      await this.connection.unsafe(createTableQuery);
      logger.info('Migration tracking table initialized');
    } catch (error) {
      logger.error('Failed to initialize migration table:', error as Error);
      throw error;
    }
  }

  /**
   * Calculate checksum for migration content
   */
  private calculateChecksum(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Get list of executed migrations
   */
  async getExecutedMigrations(): Promise<MigrationInfo[]> {
    try {
      const result = await this.connection`
        SELECT hash as id, name, created_at as timestamp, executed_at, checksum, rollback_sql
        FROM __drizzle_migrations 
        ORDER BY created_at ASC
      `;

      return result.map((row) => ({
        id: row.id,
        name: row.name,
        timestamp: parseInt(row.timestamp),
        executed_at: row.executed_at,
        checksum: row.checksum,
        rollback_sql: row.rollback_sql,
      }));
    } catch (error) {
      logger.error('Failed to get executed migrations:', error as Error);
      throw error;
    }
  }

  /**
   * Get list of pending migrations
   */
  async getPendingMigrations(): Promise<MigrationFile[]> {
    try {
      const executedMigrations = await this.getExecutedMigrations();
      const executedIds = new Set(executedMigrations.map((m) => m.id));

      const migrationFiles = await this.loadMigrationFiles();
      return migrationFiles.filter(
        (migration) => !executedIds.has(migration.id)
      );
    } catch (error) {
      logger.error('Failed to get pending migrations:', error as Error);
      throw error;
    }
  }

  /**
   * Load migration files from directory
   */
  private async loadMigrationFiles(): Promise<MigrationFile[]> {
    try {
      const metaPath = path.join(this.migrationsPath, 'meta.json');
      const metaContent = await fs.readFile(metaPath, 'utf-8');
      const meta = JSON.parse(metaContent);

      const migrations: MigrationFile[] = [];

      for (const snapshot of meta.snapshots) {
        const migrationPath = path.join(
          this.migrationsPath,
          `${snapshot.folderMillis}_${snapshot.name}.sql`
        );

        try {
          const sqlContent = await fs.readFile(migrationPath, 'utf-8');

          migrations.push({
            id: snapshot.hash,
            name: `${snapshot.folderMillis}_${snapshot.name}`,
            upSql: sqlContent,
            checksum: this.calculateChecksum(sqlContent),
          });
        } catch (error) {
          logger.warn(`Migration file not found: ${migrationPath}`);
        }
      }

      return migrations.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      logger.error('Failed to load migration files:', error as Error);
      throw error;
    }
  }

  /**
   * Run pending migrations
   */
  async runMigrations(): Promise<void> {
    try {
      await this.initializeMigrationTable();

      logger.info('Starting database migrations...');

      // Use Drizzle's migrate function
      await migrate(this.db, { migrationsFolder: this.migrationsPath });

      logger.info('Database migrations completed successfully');
    } catch (error) {
      logger.error('Migration failed:', error as Error);
      throw error;
    }
  }

  /**
   * Run migrations up to a specific version
   */
  async migrateTo(targetMigration: string): Promise<void> {
    try {
      await this.initializeMigrationTable();

      const pendingMigrations = await this.getPendingMigrations();
      const targetIndex = pendingMigrations.findIndex(
        (m) => m.id === targetMigration || m.name === targetMigration
      );

      if (targetIndex === -1) {
        throw new Error(`Target migration not found: ${targetMigration}`);
      }

      const migrationsToRun = pendingMigrations.slice(0, targetIndex + 1);

      logger.info(
        `Running ${migrationsToRun.length} migrations to reach ${targetMigration}`
      );

      for (const migration of migrationsToRun) {
        await this.runSingleMigration(migration);
      }

      logger.info(`Successfully migrated to ${targetMigration}`);
    } catch (error) {
      logger.error('Migration to target failed:', error as Error);
      throw error;
    }
  }

  /**
   * Run a single migration
   */
  private async runSingleMigration(migration: MigrationFile): Promise<void> {
    try {
      logger.info(`Running migration: ${migration.name}`);

      await this.connection.unsafe(migration.upSql);

      // Record migration execution (this is handled by Drizzle internally)
      logger.info(`Completed migration: ${migration.name}`);
    } catch (error) {
      logger.error(
        `Failed to run migration ${migration.name}:`,
        error as Error
      );
      throw error;
    }
  }

  /**
   * Rollback last migration
   */
  async rollbackLast(): Promise<void> {
    try {
      const executedMigrations = await this.getExecutedMigrations();

      if (executedMigrations.length === 0) {
        logger.info('No migrations to rollback');
        return;
      }

      const lastMigration = executedMigrations[executedMigrations.length - 1];

      if (!lastMigration.rollback_sql) {
        throw new Error(
          `No rollback SQL available for migration: ${lastMigration.name}`
        );
      }

      logger.info(`Rolling back migration: ${lastMigration.name}`);

      await this.connection.unsafe(lastMigration.rollback_sql);

      // Remove migration record
      await this.connection`
        DELETE FROM __drizzle_migrations 
        WHERE hash = ${lastMigration.id}
      `;

      logger.info(`Successfully rolled back migration: ${lastMigration.name}`);
    } catch (error) {
      logger.error('Rollback failed:', error as Error);
      throw error;
    }
  }

  /**
   * Rollback to a specific migration
   */
  async rollbackTo(targetMigration: string): Promise<void> {
    try {
      const executedMigrations = await this.getExecutedMigrations();
      const targetIndex = executedMigrations.findIndex(
        (m) => m.id === targetMigration || m.name === targetMigration
      );

      if (targetIndex === -1) {
        throw new Error(`Target migration not found: ${targetMigration}`);
      }

      const migrationsToRollback = executedMigrations
        .slice(targetIndex + 1)
        .reverse();

      logger.info(
        `Rolling back ${migrationsToRollback.length} migrations to reach ${targetMigration}`
      );

      for (const migration of migrationsToRollback) {
        if (!migration.rollback_sql) {
          throw new Error(
            `No rollback SQL available for migration: ${migration.name}`
          );
        }

        logger.info(`Rolling back migration: ${migration.name}`);
        await this.connection.unsafe(migration.rollback_sql);

        await this.connection`
          DELETE FROM __drizzle_migrations 
          WHERE hash = ${migration.id}
        `;
      }

      logger.info(`Successfully rolled back to ${targetMigration}`);
    } catch (error) {
      logger.error('Rollback to target failed:', error as Error);
      throw error;
    }
  }

  /**
   * Get migration status
   */
  async getStatus(): Promise<{
    executed: MigrationInfo[];
    pending: MigrationFile[];
    total: number;
  }> {
    try {
      const executed = await this.getExecutedMigrations();
      const pending = await getPendingMigrations();

      return {
        executed,
        pending,
        total: executed.length + pending.length,
      };
    } catch (error) {
      logger.error('Failed to get migration status:', error as Error);
      throw error;
    }
  }

  /**
   * Validate migration integrity
   */
  async validateMigrations(): Promise<boolean> {
    try {
      const executedMigrations = await this.getExecutedMigrations();
      const migrationFiles = await this.loadMigrationFiles();

      for (const executed of executedMigrations) {
        const file = migrationFiles.find((f) => f.id === executed.id);

        if (!file) {
          logger.error(
            `Migration file missing for executed migration: ${executed.name}`
          );
          return false;
        }

        if (file.checksum !== executed.checksum) {
          logger.error(`Checksum mismatch for migration: ${executed.name}`);
          return false;
        }
      }

      logger.info('All migrations validated successfully');
      return true;
    } catch (error) {
      logger.error('Migration validation failed:', error as Error);
      return false;
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.connection.end();
  }
}

// Utility function to get pending migrations without class instance
export async function getPendingMigrations(): Promise<MigrationFile[]> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const runner = new MigrationRunner(connectionString);
  try {
    return await runner.getPendingMigrations();
  } finally {
    await runner.close();
  }
}

// Export for CLI usage
export default MigrationRunner;
