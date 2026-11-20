-- Bookenzy database schema (PostgreSQL). Inferred from src/models; run once against your database:
--   psql "$DATABASE_URL" -f schema.sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  user_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username        TEXT NOT NULL UNIQUE,
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  profile_picture TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS books (
  book_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT NOT NULL,
  author         TEXT NOT NULL,
  genre          TEXT,
  cover_image    TEXT NOT NULL DEFAULT '',
  description    TEXT NOT NULL DEFAULT '',
  published_date DATE,
  average_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  ratings_count  INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS read_logs (
  log_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  book_id             UUID NOT NULL REFERENCES books(book_id) ON DELETE CASCADE,
  started_reading_at  TIMESTAMPTZ NOT NULL,
  finished_reading_at TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS read_logs_user_idx ON read_logs(user_id);
