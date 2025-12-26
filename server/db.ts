import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

let db: NodePgDatabase | null = null;

const connectionString = process.env.DATABASE_URL;

if (connectionString) {
  const pool = new Pool({
    connectionString,
    ssl:
      process.env.DATABASE_SSL === "true"
        ? {
            rejectUnauthorized: false,
          }
        : undefined,
  });

  db = drizzle(pool);
} else if (process.env.NODE_ENV !== "production") {
  console.warn(
    "[db] DATABASE_URL saknas. Replit Auth-lagring kommer inte fungera förrän den sattes.",
  );
}

export function getDb() {
  return db;
}

