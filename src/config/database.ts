import { Pool } from "pg";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Plain PostgreSQL via node-postgres, so any Postgres host works (Render, Neon, local).
// Render's internal URLs do not need TLS; external ones do. Neon-style URLs carry sslmode=require.
const connectionString = process.env.DATABASE_URL || "";
const needsSsl = /sslmode=require/.test(connectionString);

export const pool = new Pool({
  connectionString,
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
});

type Row = Record<string, any>;

/**
 * Query helper that works both as a tagged template and as a plain call:
 *   sql`SELECT * FROM users WHERE email = ${email}`
 *   sql("SELECT version()")
 * Template values are sent as bound parameters ($1, $2, ...), never concatenated.
 */
function sql(strings: TemplateStringsArray | string, ...values: unknown[]): Promise<Row[]> {
  if (typeof strings === "string") {
    return pool.query(strings).then((r) => r.rows);
  }
  const text = strings.reduce((acc, part, i) => acc + part + (i < values.length ? `$${i + 1}` : ""), "");
  return pool.query(text, values as any[]).then((r) => r.rows);
}

export default sql;
