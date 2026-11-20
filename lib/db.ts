import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Add it to your .env.local file.");
}

const globalForPg = globalThis as typeof globalThis & { eventPlannerPool?: Pool };

export const db =
  globalForPg.eventPlannerPool ??
  new Pool({
    connectionString,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });

if (process.env.NODE_ENV !== "production") globalForPg.eventPlannerPool = db;

let setupPromise: Promise<void> | undefined;

export function ensureEventsTable() {
  setupPromise ??= db.query(`
    CREATE TABLE IF NOT EXISTS events (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      title VARCHAR(120) NOT NULL,
      description VARCHAR(500),
      location VARCHAR(160) NOT NULL,
      starts_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `).then(() => undefined).catch((error: unknown) => {
    setupPromise = undefined;
    throw error;
  });
  return setupPromise;
}
