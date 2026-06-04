-- 영토전 게임 토큰(논스) 테이블
-- 게임 시작 시 1회용 토큰을 발급하고, claim 시 검증/소비한다.
-- issued_at 은 epoch milliseconds (서버 Date.now()).

CREATE TABLE IF NOT EXISTS territory_tokens (
    nonce      TEXT PRIMARY KEY,            -- 추측 불가능한 1회용 토큰
    client_id  TEXT,                        -- X-Client-Id (localStorage UUID)
    ip         TEXT,                         -- CF-Connecting-IP (감사용)
    issued_at  INTEGER NOT NULL,            -- 발급 시각 (epoch ms)
    used       INTEGER NOT NULL DEFAULT 0   -- 0=미사용, 1=사용됨
);

-- 발급 쿨다운/윈도우 상한 조회용
CREATE INDEX IF NOT EXISTS idx_territory_tokens_client ON territory_tokens(client_id, issued_at);
-- 만료 토큰 청소용
CREATE INDEX IF NOT EXISTS idx_territory_tokens_issued ON territory_tokens(issued_at);
