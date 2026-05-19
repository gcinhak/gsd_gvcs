-- Popcat 카운터 D1 스키마
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
