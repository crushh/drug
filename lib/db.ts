import mysql, { Pool, PoolOptions } from "mysql2/promise";

let pool: Pool | null = null;

function createPool() {
  const config: PoolOptions = {
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASS ?? "",
    database: process.env.DB_NAME ?? "rdcdb",
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true,
  };

  return mysql.createPool(config);
}

export function getPool(): Pool {
  if (!pool) {
    pool = createPool();
  }
  return pool;
}

export async function withConnection<T>(fn: (conn: Pool) => Promise<T>) {
  const instance = getPool();
  return fn(instance);
}
