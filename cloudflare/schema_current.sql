PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE popcat_counts (
    campus TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE TABLE abnormal_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, uuid TEXT, ip TEXT, campus TEXT, attempted_delta INTEGER, reason TEXT, created_at INTEGER);
CREATE TABLE live_match_state (
    match_id TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'upcoming',    -- upcoming | live | finished
    youtube_id TEXT,                             -- 영상 중계용 YouTube ID
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
, home_score INTEGER NOT NULL DEFAULT 0, away_score INTEGER NOT NULL DEFAULT 0, current_quarter TEXT, home_team TEXT NOT NULL DEFAULT '', away_team TEXT NOT NULL DEFAULT '');
CREATE TABLE live_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id TEXT NOT NULL,
    ts INTEGER NOT NULL DEFAULT (unixepoch()),
    type TEXT NOT NULL DEFAULT 'normal',         -- normal | score | miss | sub
    content TEXT NOT NULL
, quarter TEXT, score_team TEXT, score_amount INTEGER NOT NULL DEFAULT 0, score_side TEXT);
CREATE TABLE popcat_bans (
    uuid TEXT PRIMARY KEY,
    ban_until INTEGER NOT NULL
);
CREATE TABLE territory_state (campus TEXT PRIMARY KEY, claims INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL DEFAULT (unixepoch()));
CREATE TABLE division_results (
  division_id  TEXT    PRIMARY KEY,
  winner_key   TEXT    NOT NULL DEFAULT 'pending',
  state        TEXT    NOT NULL DEFAULT 'ready',
  note         TEXT    NOT NULL DEFAULT '경기 예정',
  is_manual    INTEGER NOT NULL DEFAULT 0,
  updated_at   INTEGER NOT NULL DEFAULT 0
);
DELETE FROM sqlite_sequence;
CREATE INDEX idx_live_comments_match_ts
    ON live_comments(match_id, ts);
CREATE INDEX idx_popcat_bans_uuid ON popcat_bans(uuid);
