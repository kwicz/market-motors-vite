import postgres from 'postgres';
import * as schema from './schema';
export declare const db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof schema> & {
    $client: postgres.Sql<{}>;
};
export declare function testConnection(): Promise<boolean>;
export declare function closeConnection(): Promise<void>;
//# sourceMappingURL=index.d.ts.map