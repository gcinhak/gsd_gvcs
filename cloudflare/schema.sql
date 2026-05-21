-- ============================================================
-- GVCS GSD Worker — D1 Schema
-- ============================================================

-- Popcat 카운터
CREATE TABLE IF NOT EXISTS popcat_counts (
    campus TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

INSERT INTO popcat_counts (campus, count) VALUES
    ('문경', 0),
    ('음성', 0),
    ('세종', 0)
ON CONFLICT(campus) DO NOTHING;

-- ============================================================
-- Live Relay
-- ============================================================

-- 매치별 상태 (관리자 페이지에서 변경)
CREATE TABLE IF NOT EXISTS live_match_state (
    match_id TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'upcoming',    -- upcoming | live | finished
    youtube_id TEXT,                             -- 영상 중계용 YouTube ID
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 매치별 문자 중계 메시지
CREATE TABLE IF NOT EXISTS live_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id TEXT NOT NULL,
    ts INTEGER NOT NULL DEFAULT (unixepoch()),
    type TEXT NOT NULL DEFAULT 'normal',         -- normal | score | miss | sub
    content TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_live_comments_match_ts
    ON live_comments(match_id, ts);
