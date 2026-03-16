-- 002_analytics.sql — sessions, game_plays, page_events
-- Safe to re-run: all statements use IF NOT EXISTS.

BEGIN;

CREATE TABLE IF NOT EXISTS sessions (
    id          BIGSERIAL PRIMARY KEY,
    session_id  TEXT NOT NULL UNIQUE,
    user_id     BIGINT REFERENCES users(id) ON DELETE SET NULL,
    ip          TEXT,
    user_agent  TEXT,
    referrer    TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS game_plays (
    id          BIGSERIAL PRIMARY KEY,
    session_id  TEXT NOT NULL,
    user_id     BIGINT REFERENCES users(id) ON DELETE SET NULL,
    game        TEXT NOT NULL,
    result      TEXT NOT NULL,
    duration_s  INT,
    played_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS page_events (
    id          BIGSERIAL PRIMARY KEY,
    session_id  TEXT NOT NULL,
    user_id     BIGINT REFERENCES users(id) ON DELETE SET NULL,
    event       TEXT NOT NULL,
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_sid      ON sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user     ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created  ON sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_gp_game           ON game_plays(game);
CREATE INDEX IF NOT EXISTS idx_gp_user           ON game_plays(user_id);
CREATE INDEX IF NOT EXISTS idx_gp_played_at      ON game_plays(played_at);
CREATE INDEX IF NOT EXISTS idx_pe_event          ON page_events(event);
CREATE INDEX IF NOT EXISTS idx_pe_session        ON page_events(session_id);
CREATE INDEX IF NOT EXISTS idx_pe_created        ON page_events(created_at);

COMMIT;
