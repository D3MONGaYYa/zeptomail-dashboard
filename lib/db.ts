import { Pool, type QueryResultRow } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __mailstatsPool: Pool | undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
  }
  return new Pool({
    connectionString,
    ssl: process.env.PGSSL === "false" ? false : { rejectUnauthorized: false },
    max: 10,
  });
}

// Lazy singleton: the pool is only created the first time a query actually
// runs, not at module import time. This matters because Next.js imports
// route modules during `next build` to collect page data, which would
// otherwise throw if DATABASE_URL isn't set at build time.
function getPool(): Pool {
  if (!global.__mailstatsPool) {
    global.__mailstatsPool = createPool();
  }
  return global.__mailstatsPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
) {
  return getPool().query<T>(text, params);
}

export default getPool;
