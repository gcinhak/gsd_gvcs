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
    home_score INTEGER NOT NULL DEFAULT 0,       -- 홈팀 현재 점수
    away_score INTEGER NOT NULL DEFAULT 0,       -- 어웨이팀 현재 점수
    current_quarter TEXT,                        -- 현재 쿼터/세트/판 (sport 별로 다름)
    home_team TEXT NOT NULL DEFAULT '',          -- 홈팀 이름 (대시보드 자동 승패 판정용)
    away_team TEXT NOT NULL DEFAULT '',          -- 어웨이팀 이름
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 매치별 문자 중계 메시지
CREATE TABLE IF NOT EXISTS live_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id TEXT NOT NULL,
    ts INTEGER NOT NULL DEFAULT (unixepoch()),
    type TEXT NOT NULL DEFAULT 'normal',         -- normal | score | miss | sub
    content TEXT NOT NULL,
    quarter TEXT,                                 -- 쿼터/세트/판 라벨 (선택)
    score_team TEXT,                              -- 득점 팀 이름 (표시용)
    score_amount INTEGER NOT NULL DEFAULT 0,      -- 가산 점수 (삭제 시 롤백)
    score_side TEXT                               -- 'home' | 'away' (매치 스코어 어느 칸에 누적했는지)
);

CREATE INDEX IF NOT EXISTS idx_live_comments_match_ts
    ON live_comments(match_id, ts);

-- ============================================================
-- 점령전 (Territory)
-- ============================================================
-- 3캠퍼스가 미니게임 클리어로 영토를 차지/뺏기.
-- claims = 누적 클레임 수. 한 클레임 = 1/TERRITORY_TOTAL 비율.
-- TERRITORY_TOTAL 은 worker.js 의 상수로 정의 (기본 200,000).
-- 합산 < TERRITORY_TOTAL 이면 empty 땅이 남아있는 상태.
CREATE TABLE IF NOT EXISTS territory_state (
    campus TEXT PRIMARY KEY,
    claims INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

INSERT INTO territory_state (campus, claims) VALUES
    ('문경', 0),
    ('음성', 0),
    ('세종', 0)
ON CONFLICT(campus) DO NOTHING;

-- ============================================================
-- Dashboard (종목별 결과)
-- ============================================================
-- 종목 내 세부 부문(division)별 승리 캠퍼스/상태.
-- is_manual = 1 이면 관리자 수동 지정 (Relay 자동 반영보다 우선).
CREATE TABLE IF NOT EXISTS division_results (
    division_id  TEXT    PRIMARY KEY,
    winner_key   TEXT    NOT NULL DEFAULT 'pending',  -- mungyeong | eumseong | sejong | pending
    state        TEXT    NOT NULL DEFAULT 'ready',    -- ready | live | done
    note         TEXT    NOT NULL DEFAULT '경기 예정',
    is_manual    INTEGER NOT NULL DEFAULT 0,
    updated_at   INTEGER NOT NULL DEFAULT 0
);
