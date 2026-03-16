-- 001_init.sql — Footio database schema
-- Run on a fresh database: psql $DATABASE_URL -f 001_init.sql
-- Safe to re-run: all statements use IF NOT EXISTS / DO NOTHING patterns.

BEGIN;

CREATE TABLE IF NOT EXISTS users (
    id         BIGSERIAL PRIMARY KEY,
    email      TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT users_email_unique UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS profiles (
    user_id      BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    username     TEXT NOT NULL DEFAULT 'Player',
    avatar_url   TEXT,
    wins         INT NOT NULL DEFAULT 0,
    losses       INT NOT NULL DEFAULT 0,
    streak       INT NOT NULL DEFAULT 0,
    played_today JSONB NOT NULL DEFAULT '{}',
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS magic_links (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      TEXT NOT NULL,
    used       BOOLEAN NOT NULL DEFAULT false,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for auth hot paths
CREATE INDEX IF NOT EXISTS idx_ml_token       ON magic_links(token);
CREATE INDEX IF NOT EXISTS idx_ml_user_used   ON magic_links(user_id, used);
CREATE INDEX IF NOT EXISTS idx_ml_expires     ON magic_links(expires_at);

-- Index for leaderboard ORDER BY (wins*100 + streak*50) DESC
CREATE INDEX IF NOT EXISTS idx_profiles_score ON profiles((wins*100 + streak*50) DESC);

-- Idempotent column addition (lifespan hook also runs this)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS played_today JSONB NOT NULL DEFAULT '{}';

COMMIT;
