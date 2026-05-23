/**
 * GVCS GSD Worker — Popcat + Live Relay API
 *
 * [Popcat]
 *   GET  /api/popcat                    → { 문경: N, 음성: N, 세종: N }
 *   POST /api/popcat/increment          body { campus, delta?, uuid? }
 *
 * [Live Relay]
 *   GET  /api/live/state                → { matches: [{ matchId, status, youtubeId, updatedAt }] }
 *   GET  /api/live/match/:id/comments?since=ts → { comments: [{ id, ts, type, content }] }
 *   PUT  /api/live/match/:id            body { status?, youtubeId? }            [admin]
 *   POST /api/live/match/:id/comments   body { type?, content }                 [admin]
 *   DEL  /api/live/match/:id/comments/:cid                                       [admin]
 *   GET  /api/live/admin/ping                                                    [admin]
 *
 * Admin auth: X-Admin-Pin 헤더가 env.ADMIN_PIN 와 일치해야 함.
 * 설정: wrangler secret put ADMIN_PIN
 *
 * 보안:
 *   - 모든 요청은 ALLOWED_DOMAIN 또는 localhost(dev) 에서 와야 함.
 *   - Popcat 은 IP별 rate-limit(20s 5회) + 600타 초과 매크로 삭감.
 *   - 위반은 abnormal_logs 테이블에 기록.
 *
 * D1 바인딩 이름: DB
 */

const CAMPUSES = ['문경', '음성', '세종'];
const ALLOWED_STATUS = ['upcoming', 'live', 'finished'];
const ALLOWED_TYPES = ['normal', 'score', 'miss', 'sub'];
const GET_CACHE_TTL = 2;

const ALLOWED_DOMAIN = 'https://gsd.gvcs.kr';

// 매크로 감지 임계값
const INSTANT_BAN_DELTA = 1000; // 이 이상이면 즉시 5분 밴
const SOFT_BAN_DELTA = 600; // 이 이상이면 누적 카운터 +1
const SOFT_BAN_COUNT = 3; // 누적 3회 도달 시 5분 밴

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': ALLOWED_DOMAIN, // 'https://gsd.gvcs.kr'
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Pin',
    'Access-Control-Max-Age': '86400',
};

// Origin별로 허용 도메인 동적 설정
function getCorsHeaders(req) {
    const origin = req.headers.get('Origin') || '';
    const isLocal = origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
    const allowedOrigin = origin === ALLOWED_DOMAIN || isLocal ? origin : ALLOWED_DOMAIN;
    return {
        ...CORS_HEADERS,
        'Access-Control-Allow-Origin': allowedOrigin,
    };
}

// 💡 IP별 접속 기록과 차단 목록을 서버 메모리에 임시 저장
const ipRequestHistory = new Map();
const blockedIPs = new Map();
const macroDeltaCount = new Map(); // 💡 누적 카운터용 (600~1000 구간)

function isOriginAllowed(req) {
    const origin = req.headers.get('Origin');
    const referer = req.headers.get('Referer');

    // 로컬 개발(localhost / 127.0.0.1) 허용
    if (origin && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
        return true;
    }

    if (origin === ALLOWED_DOMAIN) return true;
    if (referer && (referer === ALLOWED_DOMAIN || referer.startsWith(ALLOWED_DOMAIN + '/'))) return true;

    return false;
}

export default {
    async fetch(req, env, ctx) {
        if (req.method === 'OPTIONS') {
            return new Response(null, { headers: getCorsHeaders(req) });
        }

        // 도메인 검증
        if (!isOriginAllowed(req)) {
            return new Response('Forbidden: Invalid Origin', { status: 403, headers: getCorsHeaders(req) });
        }

        const url = new URL(req.url);
        const path = url.pathname;

        try {
            // Popcat
            if (path === '/api/popcat' && req.method === 'GET') return getPopcatCounts(env, req, ctx);
            if (path === '/api/popcat/increment' && req.method === 'POST') return incrementPopcat(req, env, ctx);

            // Live state
            if (path === '/api/live/state' && req.method === 'GET') return getLiveState(env, req, ctx);

            // Live admin ping
            if (path === '/api/live/admin/ping' && req.method === 'GET') {
                if (!checkAdmin(req, env)) return json({ error: 'unauthorized' }, 401);
                return json({ ok: true });
            }

            // Live match PUT (admin)
            let m = path.match(/^\/api\/live\/match\/([^/]+)$/);
            if (m && req.method === 'PUT') {
                if (!checkAdmin(req, env)) return json({ error: 'unauthorized' }, 401);
                return updateMatch(m[1], req, env);
            }

            // Comments collection
            m = path.match(/^\/api\/live\/match\/([^/]+)\/comments$/);
            if (m && req.method === 'GET') return getComments(m[1], url, env);
            if (m && req.method === 'POST') {
                if (!checkAdmin(req, env)) return json({ error: 'unauthorized' }, 401);
                return addComment(m[1], req, env);
            }

            // Single comment DELETE (admin)
            m = path.match(/^\/api\/live\/match\/([^/]+)\/comments\/(\d+)$/);
            if (m && req.method === 'DELETE') {
                if (!checkAdmin(req, env)) return json({ error: 'unauthorized' }, 401);
                return deleteComment(m[1], Number(m[2]), env);
            }

            // Territory (점령전)
            if (path === '/api/territory' && req.method === 'GET') return getTerritory(env, req, ctx);
            if (path === '/api/territory/claim' && req.method === 'POST') return claimTerritory(req, env);
            if (path === '/api/territory/attack' && req.method === 'POST') return attackTerritory(req, env);

            return json({ error: 'not found' }, 404);
        } catch (err) {
            return json({ error: 'internal', message: String(err?.message || err) }, 500);
        }
    },
};

/* ─── Admin auth ─── */
function checkAdmin(req, env) {
    const pin = req.headers.get('X-Admin-Pin');
    if (!pin || !env.ADMIN_PIN) return false;
    return pin === env.ADMIN_PIN;
}

/* ─── Popcat ─── */
async function getPopcatCounts(env, req, ctx) {
    const cache = caches.default;
    const cacheKey = new Request(req.url, { method: 'GET' });
    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    const { results } = await env.DB.prepare('SELECT campus, count FROM popcat_counts').all();

    const out = Object.fromEntries(CAMPUSES.map((c) => [c, 0]));
    for (const row of results || []) {
        if (CAMPUSES.includes(row.campus)) out[row.campus] = Number(row.count) || 0;
    }

    const res = new Response(JSON.stringify(out), {
        status: 200,
        headers: {
            ...getCorsHeaders(req),
            'Content-Type': 'application/json',
            'Cache-Control': `public, max-age=${GET_CACHE_TTL}`,
        },
    });
    if (ctx?.waitUntil) ctx.waitUntil(cache.put(cacheKey, res.clone()));
    return res;
}

async function incrementPopcat(req, env, ctx) {
    let body;
    try {
        body = await req.json();
    } catch {
        return json({ error: 'invalid json' }, 400);
    }

    // IP / UUID 추출 (로그용)
    const clientIp = req.headers.get('cf-connecting-ip') || 'unknown';
    const uuid = body?.uuid || 'none';

    // uuid 없거나 none이면 차단
    if (!uuid || uuid === 'none') {
        return json({ error: 'Forbidden' }, 403);
    }

    // 💡 [수정 포인트 1] 공용 와이파이 피해를 막기 위해 기준을 clientIp에서 uuid로 변경
    const rateKey = `rate:${uuid}`;
    const now = Date.now();

    // 1-A) D1에서 영구 밴 체크 (Worker 재시작돼도 유지됨)
    const banRow = await env.DB.prepare('SELECT ban_until FROM popcat_bans WHERE uuid = ? AND ban_until > unixepoch()')
        .bind(uuid)
        .first();
    if (banRow) {
        return json({ error: 'Too many requests. Blocked.' }, 429);
    }

    // 1-B) 메모리 밴 체크 (같은 인스턴스 내에서 빠른 차단)
    if (blockedIPs.has(rateKey)) {
        const unblockTime = blockedIPs.get(rateKey);
        if (now < unblockTime) {
            return json({ error: 'Too many requests. Blocked.' }, 429);
        }
        blockedIPs.delete(rateKey);
    }

    // 2) 20초 슬라이딩 윈도우, 5회 초과 시 5분 차단
    const RATE_LIMIT = 5;
    let timestamps = ipRequestHistory.get(rateKey) || [];
    timestamps = timestamps.filter((t) => now - t < 20000);

    if (timestamps.length >= RATE_LIMIT) {
        blockedIPs.set(rateKey, now + 5 * 60 * 1000);
        if (ctx?.waitUntil) {
            // D1에 밴 저장 (영구적)
            ctx.waitUntil(
                env.DB.prepare(
                    'INSERT INTO popcat_bans (uuid, ban_until) VALUES (?, unixepoch() + 300) ' +
                        'ON CONFLICT(uuid) DO UPDATE SET ban_until = unixepoch() + 300'
                )
                    .bind(uuid)
                    .run()
                    .catch(() => {})
            );
            ctx.waitUntil(
                env.DB.prepare(
                    'INSERT INTO abnormal_logs (uuid, ip, campus, attempted_delta, reason, created_at) VALUES (?, ?, ?, ?, ?, unixepoch())'
                )
                    .bind(uuid, clientIp, 'batch', 0, 'RATE_LIMIT_EXCEEDED')
                    .run()
                    .catch(() => {})
            );
        }
        return json({ error: 'Too many requests. Blocked for 5 minutes.' }, 429);
    }

    timestamps.push(now);
    ipRequestHistory.set(rateKey, timestamps);

    // 💡 [수정 포인트 2] 배열(Batch) 형태의 다중 캠퍼스 업데이트 처리
    let updates = body?.updates;

    // 구버전 프론트엔드(새로고침 안 한 유저)와의 호환성 유지
    if (!updates && body?.campus) {
        updates = [{ campus: body.campus, delta: Number(body.delta) }];
    }

    if (!Array.isArray(updates) || updates.length === 0) {
        return json({ error: 'Invalid request: updates array required' }, 400);
    }

    const MAX_DELTA = 600;
    const statements = [];

    // 전송된 각 캠퍼스별 클릭 데이터 순회
    for (let item of updates) {
        const campus = item.campus;
        let delta = Number(item.delta);

        if (isNaN(delta) || delta <= 0 || !CAMPUSES.includes(campus)) continue;

        // 3) 매크로 삭감 및 밴 처리 (질문자님의 기존 로직 유지)
        if (delta > MAX_DELTA) {
            // 매크로 감지도 IP 대신 UUID 기준으로 변경하여 기숙사 등에서 한 명 때문에 전체가 차단되는 것 방지
            const macroKey = `macro:${uuid}`;

            // [1] 즉시 밴 — delta가 INSTANT_BAN_DELTA 이상이면 바로 5분 밴
            if (delta >= INSTANT_BAN_DELTA) {
                blockedIPs.set(rateKey, now + 5 * 60 * 1000);
                if (ctx?.waitUntil) {
                    // D1에 밴 저장 (영구적)
                    ctx.waitUntil(
                        env.DB.prepare(
                            'INSERT INTO popcat_bans (uuid, ban_until) VALUES (?, unixepoch() + 300) ' +
                                'ON CONFLICT(uuid) DO UPDATE SET ban_until = unixepoch() + 300'
                        )
                            .bind(uuid)
                            .run()
                            .catch(() => {})
                    );
                    ctx.waitUntil(
                        env.DB.prepare(
                            'INSERT INTO abnormal_logs (uuid, ip, campus, attempted_delta, reason, created_at) VALUES (?, ?, ?, ?, ?, unixepoch())'
                        )
                            .bind(uuid, clientIp, campus, delta, 'INSTANT_BAN')
                            .run()
                            .catch(() => {})
                    );
                }
                return json({ error: 'Macro detected. Blocked for 5 minutes.' }, 429);
            }

            // [2] 누적 밴 — delta가 SOFT_BAN_DELTA 이상이면 카운터 +1, 3회 시 5분 밴
            if (delta >= SOFT_BAN_DELTA) {
                const count = (macroDeltaCount.get(macroKey) || 0) + 1;
                macroDeltaCount.set(macroKey, count);

                if (count >= SOFT_BAN_COUNT) {
                    macroDeltaCount.delete(macroKey);
                    blockedIPs.set(rateKey, now + 5 * 60 * 1000);
                    if (ctx?.waitUntil) {
                        // D1에 밴 저장 (영구적)
                        ctx.waitUntil(
                            env.DB.prepare(
                                'INSERT INTO popcat_bans (uuid, ban_until) VALUES (?, unixepoch() + 300) ' +
                                    'ON CONFLICT(uuid) DO UPDATE SET ban_until = unixepoch() + 300'
                            )
                                .bind(uuid)
                                .run()
                                .catch(() => {})
                        );
                        ctx.waitUntil(
                            env.DB.prepare(
                                'INSERT INTO abnormal_logs (uuid, ip, campus, attempted_delta, reason, created_at) VALUES (?, ?, ?, ?, ?, unixepoch())'
                            )
                                .bind(uuid, clientIp, campus, delta, 'SOFT_BAN_3X')
                                .run()
                                .catch(() => {})
                        );
                    }
                    return json({ error: 'Repeated macro detected. Blocked for 5 minutes.' }, 429);
                }
            }

            // 밴 조건 미달 시 — 600으로 삭감 후 처리 기록
            if (ctx?.waitUntil) {
                ctx.waitUntil(
                    env.DB.prepare(
                        'INSERT INTO abnormal_logs (uuid, ip, campus, attempted_delta, reason, created_at) VALUES (?, ?, ?, ?, ?, unixepoch())'
                    )
                        .bind(uuid, clientIp, campus, delta, 'MACRO_LIMIT_TRIGGERED')
                        .run()
                        .catch(() => {})
                );
            }
            delta = MAX_DELTA;
        }

        // DB 저장용 쿼리 누적 (ON CONFLICT DO UPDATE)
        statements.push(
            env.DB.prepare(
                'INSERT INTO popcat_counts (campus, count, updated_at) VALUES (?, ?, unixepoch()) ' +
                    'ON CONFLICT(campus) DO UPDATE SET count = count + excluded.count, updated_at = unixepoch()'
            ).bind(campus, delta)
        );
    }

    // 💡 [수정 포인트 3] 누적된 쿼리를 한 번에 실행 (성능 최적화 및 횟수 절감)
    if (statements.length > 0) {
        await env.DB.batch(statements);
    }

    // 프론트엔드에 처리 완료 응답
    return json({ ok: true, processed: statements.length });
}

/* ─── Live state ─── */
async function getLiveState(env, req, ctx) {
    const cache = caches.default;
    const cacheKey = new Request(req.url, { method: 'GET' });
    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    const { results } = await env.DB.prepare(
        'SELECT match_id, status, youtube_id, home_score, away_score, current_quarter, updated_at FROM live_match_state'
    ).all();

    const matches = (results || []).map((r) => ({
        matchId: r.match_id,
        status: r.status,
        youtubeId: r.youtube_id,
        homeScore: Number(r.home_score) || 0,
        awayScore: Number(r.away_score) || 0,
        currentQuarter: r.current_quarter || null,
        updatedAt: Number(r.updated_at),
    }));

    const res = new Response(JSON.stringify({ matches }), {
        status: 200,
        headers: {
            ...getCorsHeaders(req),
            'Content-Type': 'application/json',
            'Cache-Control': `public, max-age=${GET_CACHE_TTL}`,
        },
    });
    if (ctx?.waitUntil) ctx.waitUntil(cache.put(cacheKey, res.clone()));
    return res;
}

async function updateMatch(matchId, req, env) {
    const body = await req.json().catch(() => null);
    if (!body) return json({ error: 'invalid json' }, 400);

    // 행이 없으면 기본값으로 만들어 두고, 그 위에 partial UPDATE
    await env.DB.prepare('INSERT INTO live_match_state (match_id) VALUES (?) ON CONFLICT(match_id) DO NOTHING')
        .bind(matchId)
        .run();

    const sets = [];
    const params = [];

    if (body.status !== undefined) {
        if (!ALLOWED_STATUS.includes(body.status)) return json({ error: 'invalid status' }, 400);
        sets.push('status = ?');
        params.push(body.status);
    }
    if (body.youtubeId !== undefined) {
        sets.push('youtube_id = ?');
        params.push(body.youtubeId == null || body.youtubeId === '' ? null : String(body.youtubeId));
    }
    if (body.homeScore !== undefined) {
        const v = Math.max(0, Math.min(Number(body.homeScore) || 0, 9999));
        sets.push('home_score = ?');
        params.push(v);
    }
    if (body.awayScore !== undefined) {
        const v = Math.max(0, Math.min(Number(body.awayScore) || 0, 9999));
        sets.push('away_score = ?');
        params.push(v);
    }
    if (body.currentQuarter !== undefined) {
        sets.push('current_quarter = ?');
        params.push(
            body.currentQuarter == null || body.currentQuarter === '' ? null : String(body.currentQuarter).slice(0, 32)
        );
    }

    if (sets.length === 0) return json({ error: 'no updates' }, 400);

    sets.push('updated_at = unixepoch()');
    params.push(matchId);

    await env.DB.prepare(`UPDATE live_match_state SET ${sets.join(', ')} WHERE match_id = ?`)
        .bind(...params)
        .run();

    const row = await env.DB.prepare(
        'SELECT match_id, status, youtube_id, home_score, away_score, current_quarter, updated_at FROM live_match_state WHERE match_id = ?'
    )
        .bind(matchId)
        .first();

    return json({
        matchId: row.match_id,
        status: row.status,
        youtubeId: row.youtube_id,
        homeScore: Number(row.home_score) || 0,
        awayScore: Number(row.away_score) || 0,
        currentQuarter: row.current_quarter || null,
        updatedAt: Number(row.updated_at),
    });
}

/* ─── Comments ─── */
async function getComments(matchId, url, env) {
    const since = Number(url.searchParams.get('since')) || 0;
    const { results } = await env.DB.prepare(
        'SELECT id, ts, type, content, quarter, score_team, score_amount, score_side FROM live_comments ' +
            'WHERE match_id = ? AND ts >= ? ORDER BY id ASC LIMIT 500'
    )
        .bind(matchId, since)
        .all();
    const comments = (results || []).map((r) => ({
        id: Number(r.id),
        ts: Number(r.ts),
        type: r.type,
        content: r.content,
        quarter: r.quarter || null,
        scoreTeam: r.score_team || null,
        scoreAmount: Number(r.score_amount) || 0,
        scoreSide: r.score_side || null,
    }));
    return json({ matchId, comments });
}

async function addComment(matchId, req, env) {
    const body = await req.json().catch(() => null);
    if (!body) return json({ error: 'invalid json' }, 400);

    const type = ALLOWED_TYPES.includes(body.type) ? body.type : 'normal';
    const content = String(body.content || '')
        .trim()
        .slice(0, 500);
    if (!content) return json({ error: 'empty content' }, 400);
    const quarter = body.quarter == null || body.quarter === '' ? null : String(body.quarter).slice(0, 32);

    // 점수 메타 (선택)
    const scoreTeam = body.scoreTeam ? String(body.scoreTeam).slice(0, 32) : null;
    const scoreAmount = Math.max(0, Math.min(Number(body.scoreAmount) || 0, 999));
    const scoreSide = body.scoreSide === 'home' || body.scoreSide === 'away' ? body.scoreSide : null;

    const result = await env.DB.prepare(
        'INSERT INTO live_comments (match_id, ts, type, content, quarter, score_team, score_amount, score_side) ' +
            'VALUES (?, unixepoch(), ?, ?, ?, ?, ?, ?)'
    )
        .bind(matchId, type, content, quarter, scoreTeam, scoreAmount, scoreSide)
        .run();

    // 점수가 있고 home/away 가 지정되어 있으면 매치 스코어 증가
    if (scoreAmount > 0 && scoreSide) {
        const column = scoreSide === 'home' ? 'home_score' : 'away_score';
        await env.DB.prepare('INSERT INTO live_match_state (match_id) VALUES (?) ON CONFLICT(match_id) DO NOTHING')
            .bind(matchId)
            .run();
        await env.DB.prepare(
            `UPDATE live_match_state SET ${column} = ${column} + ?, updated_at = unixepoch() WHERE match_id = ?`
        )
            .bind(scoreAmount, matchId)
            .run();
    }

    const id = result?.meta?.last_row_id ? Number(result.meta.last_row_id) : 0;
    const row = await env.DB.prepare(
        'SELECT id, ts, type, content, quarter, score_team, score_amount, score_side FROM live_comments WHERE id = ?'
    )
        .bind(id)
        .first();

    return json({
        comment: row
            ? {
                  id: Number(row.id),
                  ts: Number(row.ts),
                  type: row.type,
                  content: row.content,
                  quarter: row.quarter || null,
                  scoreTeam: row.score_team || null,
                  scoreAmount: Number(row.score_amount) || 0,
                  scoreSide: row.score_side || null,
              }
            : null,
    });
}

async function deleteComment(matchId, commentId, env) {
    // 점수가 연동된 메시지면 먼저 매치 점수 롤백
    const row = await env.DB.prepare('SELECT score_amount, score_side FROM live_comments WHERE id = ? AND match_id = ?')
        .bind(commentId, matchId)
        .first();

    if (row) {
        const amount = Number(row.score_amount) || 0;
        const side = row.score_side === 'home' || row.score_side === 'away' ? row.score_side : null;
        if (amount > 0 && side) {
            const column = side === 'home' ? 'home_score' : 'away_score';
            await env.DB.prepare(
                `UPDATE live_match_state SET ${column} = MAX(0, ${column} - ?), updated_at = unixepoch() WHERE match_id = ?`
            )
                .bind(amount, matchId)
                .run();
        }
    }

    await env.DB.prepare('DELETE FROM live_comments WHERE id = ? AND match_id = ?').bind(commentId, matchId).run();
    return json({ ok: true });
}

/* ─── Territory (점령전) ─── */
// 1 unit = 0.0005% → TOTAL = 200,000
// 빈 땅 차지: +20 units (= 0.01%)
// 강탈 (빈 땅 0): +10 to me, -10 from leader opponent (= 0.005% transfer)
const TERRITORY_TOTAL = 200000;
const CLAIM_UNITS = 20;
const STEAL_UNITS = 10;

async function fetchTerritoryRow(env) {
    const { results } = await env.DB
        .prepare('SELECT campus, claims FROM territory_state')
        .all();
    const campuses = Object.fromEntries(CAMPUSES.map((c) => [c, 0]));
    let sum = 0;
    for (const row of results || []) {
        if (CAMPUSES.includes(row.campus)) {
            const n = Math.max(0, Number(row.claims) || 0);
            campuses[row.campus] = n;
            sum += n;
        }
    }
    return { campuses, total: TERRITORY_TOTAL, empty: Math.max(0, TERRITORY_TOTAL - sum), sum };
}

async function getTerritory(env, req, ctx) {
    const cache = caches.default;
    const cacheKey = new Request(req.url, { method: 'GET' });
    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    const state = await fetchTerritoryRow(env);
    const res = new Response(
        JSON.stringify({ campuses: state.campuses, total: state.total, empty: state.empty }),
        {
            status: 200,
            headers: {
                ...getCorsHeaders(req),
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=2',
            },
        }
    );
    if (ctx?.waitUntil) ctx.waitUntil(cache.put(cacheKey, res.clone()));
    return res;
}

/**
 * Unified play:
 *   - 빈 땅 >= 2 → +2 (CLAIM_UNITS) to team
 *   - 빈 땅 < 2 → +1 to team, -1 from 리더(상대 중 가장 많이 가진 캠퍼스)
 *
 * 응답: { campuses, total, empty, mode: 'claim' | 'steal' | 'full', stolenFrom? }
 */
async function claimTerritory(req, env) {
    const body = await req.json().catch(() => null);
    const team = body?.team;
    if (!CAMPUSES.includes(team)) return json({ error: 'invalid team' }, 400);

    await env.DB
        .prepare('INSERT INTO territory_state (campus) VALUES (?) ON CONFLICT(campus) DO NOTHING')
        .bind(team)
        .run();

    const state = await fetchTerritoryRow(env);

    if (state.empty >= CLAIM_UNITS) {
        // 빈 땅 차지 모드
        await env.DB
            .prepare(
                'UPDATE territory_state SET claims = claims + ?, updated_at = unixepoch() WHERE campus = ?'
            )
            .bind(CLAIM_UNITS, team)
            .run();
        const after = await fetchTerritoryRow(env);
        return json({
            mode: 'claim',
            campuses: after.campuses,
            total: after.total,
            empty: after.empty,
        });
    }

    // 강탈 모드 — 가장 많이 가진 상대 캠퍼스를 자동 타겟
    let target = null;
    let targetClaims = -1;
    for (const [c, n] of Object.entries(state.campuses)) {
        if (c === team) continue;
        if (n > targetClaims) {
            target = c;
            targetClaims = n;
        }
    }
    if (!target || targetClaims < STEAL_UNITS) {
        // 모든 영토를 본인이 차지한 상태 (이론상 100%)
        return json(
            {
                error: 'fully conquered',
                mode: 'full',
                campuses: state.campuses,
                total: state.total,
                empty: state.empty,
            },
            409
        );
    }

    await env.DB.batch([
        env.DB
            .prepare(
                'UPDATE territory_state SET claims = claims - ?, updated_at = unixepoch() WHERE campus = ? AND claims >= ?'
            )
            .bind(STEAL_UNITS, target, STEAL_UNITS),
        env.DB
            .prepare(
                'UPDATE territory_state SET claims = claims + ?, updated_at = unixepoch() WHERE campus = ?'
            )
            .bind(STEAL_UNITS, team),
    ]);

    const after = await fetchTerritoryRow(env);
    return json({
        mode: 'steal',
        stolenFrom: target,
        campuses: after.campuses,
        total: after.total,
        empty: after.empty,
    });
}

// 호환성 위해 남겨두지만 더 이상 호출 안 됨 (claim 이 자동으로 steal 수행)
async function attackTerritory(req, env) {
    return claimTerritory(req, env);
}

/* ─── Util ─── */
function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
}
