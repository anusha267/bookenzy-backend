import { vi } from "vitest";

process.env.BOOKENZY_JWT_SECRET = "test-secret-not-for-production";
process.env.DATABASE_URL = "postgres://test";
process.env.AUTH_RATE_LIMIT ??= "1000";

// In-memory Postgres loaded with the real schema.sql, so the SQL in the models is actually executed.
vi.mock("pg", async () => {
  const { readFileSync } = await import("fs");
  const { join } = await import("path");
  const { randomUUID } = await import("crypto");
  const { newDb, DataType } = await import("pg-mem");
  const db = newDb();
  db.public.registerFunction({ name: "gen_random_uuid", returns: DataType.uuid, implementation: randomUUID, impure: true });
  const schema = readFileSync(join(process.cwd(), "schema.sql"), "utf8").replace(/CREATE EXTENSION[^;]*;/i, "");
  db.public.none(schema);
  const { Pool } = db.adapters.createPg();
  return { Pool, default: { Pool } };
});
