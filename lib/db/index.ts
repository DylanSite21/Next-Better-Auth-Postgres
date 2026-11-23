import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { relations } from "./relations";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL belum diisi. Pastikan ada di file .env.");
}

// satu pool dipakai ulang saat hot reload di development
const globalForDb = globalThis as unknown as { pool?: Pool };
export const pool = globalForDb.pool ?? new Pool({ connectionString: url });
if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export const db = drizzle({ client: pool, relations });
