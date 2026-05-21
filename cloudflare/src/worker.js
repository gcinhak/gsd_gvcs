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
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Pin',
    'Access-Control-Max-Age': '86400',
};

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
            return new Response(null, { headers: CORS_HEADERS });
        }

        // 도메인 검증
        if (!isOriginAllowed(req)) {
            return new Response('Forbidden: Invalid Origin', { status: 403, headers: CORS_HEADERS });
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
            ...CORS_HEADERS,
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

    const campus = body?.campus;
    let delta = Number(body?.delta);

    // IP / UUID 추출 (로그용)
    const clientIp = req.headers.get('cf-connecting-ip') || 'unknown';
    const uuid = body?.uuid || 'none';

    // [3] uuid 없거나 none이면 차단
    if (!uuid || uuid === 'none') {
        return json({ error: 'Forbidden' }, 403);
    }

    const rateKey = `rate:${clientIp}`;
    const now = Date.now();

    // 1) 이미 밴된 IP 차단
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
            ctx.waitUntil(
                env.DB.prepare(
                    'INSERT INTO abnormal_logs (uuid, ip, campus, attempted_delta, reason, created_at) VALUES (?, ?, ?, ?, ?, unixepoch())'
                )
                    .bind(uuid, clientIp, campus || 'none', delta, 'RATE_LIMIT_EXCEEDED')
                    .run()
                    .catch(() => {})
            );
        }
        return json({ error: 'Too many requests. Blocked for 5 minutes.' }, 429);
    }

    timestamps.push(now);
    ipRequestHistory.set(rateKey, timestamps);

    if (isNaN(delta) || delta <= 0) {
        return json({ error: 'Invalid request' }, 400);
    }

    // 3) 600타 초과 매크로 삭감
    const MAX_DELTA = 600;

    if (delta > MAX_DELTA) {
        const macroKey = `macro:${clientIp}`;

        // [1] 즉시 밴 — delta가 INSTANT_BAN_DELTA 이상이면 바로 5분 밴
        if (delta >= INSTANT_BAN_DELTA) {
            blockedIPs.set(rateKey, now + 5 * 60 * 1000);
            ctx.waitUntil(
                env.DB.prepare(
                    'INSERT INTO abnormal_logs (uuid, ip, campus, attempted_delta, reason, created_at) VALUES (?, ?, ?, ?, ?, unixepoch())'
                )
                    .bind(uuid, clientIp, campus, delta, 'INSTANT_BAN')
                    .run()
                    .catch(() => {})
            );
            return json({ error: 'Macro detected. Blocked for 5 minutes.' }, 429);
        }

        // [2] 누적 밴 — delta가 SOFT_BAN_DELTA 이상이면 카운터 +1, 3회 시 5분 밴
        if (delta >= SOFT_BAN_DELTA) {
            const count = (macroDeltaCount.get(macroKey) || 0) + 1;
            macroDeltaCount.set(macroKey, count);

            if (count >= SOFT_BAN_COUNT) {
                macroDeltaCount.delete(macroKey);
                blockedIPs.set(rateKey, now + 5 * 60 * 1000);
                ctx.waitUntil(
                    env.DB.prepare(
                        'INSERT INTO abnormal_logs (uuid, ip, campus, attempted_delta, reason, created_at) VALUES (?, ?, ?, ?, ?, unixepoch())'
                    )
                        .bind(uuid, clientIp, campus, delta, 'SOFT_BAN_3X')
                        .run()
                        .catch(() => {})
                );
                return json({ error: 'Repeated macro detected. Blocked for 5 minutes.' }, 429);
            }
        }

        // 밴 조건 미달 시 — 600으로 삭감 후 처리
        ctx.waitUntil(
            env.DB.prepare(
                'INSERT INTO abnormal_logs (uuid, ip, campus, attempted_delta, reason, created_at) VALUES (?, ?, ?, ?, ?, unixepoch())'
            )
                .bind(uuid, clientIp, campus, delta, 'MACRO_LIMIT_TRIGGERED')
                .run()
                .catch(() => {})
        );
        delta = MAX_DELTA;
    }

    if (!CAMPUSES.includes(campus)) {
        return json({ error: 'invalid campus' }, 400);
    }

    await env.DB.prepare(
        'INSERT INTO popcat_counts (campus, count, updated_at) VALUES (?, ?, unixepoch()) ' +
        'ON CONFLICT(campus) DO UPDATE SET count = count + excluded.count, updated_at = unixepoch()'
    )
        .bind(campus, delta)
        .run();

    const row = await env.DB
        .prepare('SELECT count FROM popcat_counts WHERE campus = ?')
        .bind(campus)
        .first();
    return json({ campus, count: Number(row?.count) || 0 });
}

/* ─── Live state ─── */
async function getLiveState(env, req, ctx) {
    const cache = caches.default;
    const cacheKey = new Request(req.url, { method: 'GET' });
    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    const { results } = await env.DB
        .prepare('SELECT match_id, status, youtube_id, updated_at FROM live_match_state')
        .all();

    const matches = (results || []).map((r) => ({
        matchId: r.match_id,
        status: r.status,
        youtubeId: r.youtube_id,
        updatedAt: Number(r.updated_at),
    }));

    const res = new Response(JSON.stringify({ matches }), {
        status: 200,
        headers: {
            ...CORS_HEADERS,
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=2',
        },
    });
    if (ctx?.waitUntil) ctx.waitUntil(cache.put(cacheKey, res.clone()));
    return res;
}

async function updateMatch(matchId, req, env) {
    const body = await req.json().catch(() => null);
    if (!body) return json({ error: 'invalid json' }, 400);

    const status = body.status;
    const youtubeId = body.youtubeId == null ? null : String(body.youtubeId);

    if (status != null && !ALLOWED_STATUS.includes(status)) {
        return json({ error: 'invalid status' }, 400);
    }

    await env.DB
        .prepare(
            'INSERT INTO live_match_state (match_id, status, youtube_id, updated_at) ' +
            'VALUES (?, COALESCE(?, ?), ?, unixepoch()) ' +
            'ON CONFLICT(match_id) DO UPDATE SET ' +
            '  status = COALESCE(excluded.status, live_match_state.status), ' +
            '  youtube_id = excluded.youtube_id, ' +
            '  updated_at = unixepoch()'
        )
        .bind(matchId, status, status || 'upcoming', youtubeId)
        .run();

    const row = await env.DB
        .prepare('SELECT match_id, status, youtube_id, updated_at FROM live_match_state WHERE match_id = ?')
        .bind(matchId)
        .first();

    return json({
        matchId: row.match_id,
        status: row.status,
        youtubeId: row.youtube_id,
        updatedAt: Number(row.updated_at),
    });
}

/* ─── Comments ─── */
async function getComments(matchId, url, env) {
    const since = Number(url.searchParams.get('since')) || 0;
    const { results } = await env.DB
        .prepare(
            'SELECT id, ts, type, content FROM live_comments ' +
            'WHERE match_id = ? AND ts >= ? ORDER BY id ASC LIMIT 500'
        )
        .bind(matchId, since)
        .all();
    const comments = (results || []).map((r) => ({
        id: Number(r.id),
        ts: Number(r.ts),
        type: r.type,
        content: r.content,
    }));
    return json({ matchId, comments });
}

async function addComment(matchId, req, env) {
    const body = await req.json().catch(() => null);
    if (!body) return json({ error: 'invalid json' }, 400);

    const type = ALLOWED_TYPES.includes(body.type) ? body.type : 'normal';
    const content = String(body.content || '').trim().slice(0, 500);
    if (!content) return json({ error: 'empty content' }, 400);

    const result = await env.DB
        .prepare(
            'INSERT INTO live_comments (match_id, ts, type, content) ' +
            'VALUES (?, unixepoch(), ?, ?)'
        )
        .bind(matchId, type, content)
        .run();

    const id = result?.meta?.last_row_id ? Number(result.meta.last_row_id) : 0;
    const row = await env.DB
        .prepare('SELECT id, ts, type, content FROM live_comments WHERE id = ?')
        .bind(id)
        .first();

    return json({
        comment: row
            ? { id: Number(row.id), ts: Number(row.ts), type: row.type, content: row.content }
            : null,
    });
}

async function deleteComment(matchId, commentId, env) {
    await env.DB
        .prepare('DELETE FROM live_comments WHERE id = ? AND match_id = ?')
        .bind(commentId, matchId)
        .run();
    return json({ ok: true });
}

/* ─── Util ─── */
function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
}
