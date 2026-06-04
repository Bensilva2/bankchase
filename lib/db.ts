import { neon as neonClient } from '@neondatabase/serverless';

let sql: any = null;
let initialized = false;

export function getSql() {
  if (!initialized) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    sql = neonClient(databaseUrl);
    initialized = true;
  }
  return sql;
}

export function resetSql() {
  sql = null;
  initialized = false;
}
