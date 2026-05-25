/**
 * GVCS GSD Cloudflare Worker
 * ===========================
 * 글로벌선진학교(GVCS) 체육대회(GSD) 백엔드 API
 *
 * [Popcat] — 현재 일시 중단 상태 (paused)
 *   GET  /api/popcat                          → { 문경, 음성, 세종, paused }
 *   POST /api/popcat/increment                → 503 (일시 중단)
 *
 * [Live Relay] — 실시간 경기 중계
 *   GET  /api/live/state                      → { matches: [{ matchId, status, youtubeId, homeScore, awayScore, currentQuarter, updatedAt }] }
 *   GET  /api/live/match/:id/comments?since=  → { matchId, comments: [...] }
 *   PUT  /api/live/match/:id                  → 경기 상태/점수 수정          [admin]
 *   POST /api/live/match/:id/comments         → 중계 댓글 추가               [admin]
 *   DEL  /api/live/match/:id/comments/:cid    → 댓글 삭제 (점수 자동 롤백)   [admin]
 *   GET  /api/live/admin/ping                 → 어드민 인증 확인              [admin]
 *
 * [Territory] — 캠퍼스 점령전
 *   GET  /api/territory                       → { campuses, total, empty }
 *   POST /api/territory/claim                 → { mode: 'claim'|'steal'|'full', ... }
 *
 * [Dashboard] — 종목별 결과 관리 (localStorage → D1 전환)
 *   GET  /api/dashboard                       → { divisions: { [divisionId]: { winner_key, state, note, is_manual } } }
 *   PUT  /api/dashboard/division/:divisionId  → 종목 결과 저장               [admin]
 *   POST /api/dashboard/reset                 → 전체 결과 초기화              [admin]
 *
 * Admin 인증: X-Admin-Pin 헤더 = env.ADMIN_PIN (wrangler secret put ADMIN_PIN)
 * 허용 도메인: https://gsd.gvcs.kr (localhost 개발 환경 포함)
 * D1 바인딩: DB
 *
 * @updated 2026-05-25
 */

const CAMPUSES = ['문경', '음성', '세종'];
const ALLOWED_STATUS = ['upcoming', 'live', 'finished'];
const ALLOWED_TYPES = ['normal', 'score', 'miss', 'sub'];
const GET_CACHE_TTL = 2;
const ALLOWED_DOMAIN = 'https://gsd.gvcs.kr';
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Pin',
    'Access-Control-Max-Age': '86400',
};

function getCorsHeaders(req) {
    const origin = req.headers.get('Origin') || '';
    const isLocal = origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
    const allowedOrigin = origin === ALLOWED_DOMAIN || isLocal ? origin : ALLOWED_DOMAIN;
    return {
        ...CORS_HEADERS,
        'Access-Control-Allow-Origin': allowedOrigin,
    };
}

function isOriginAllowed(req) {
    const origin = req.headers.get('Origin');
    const referer = req.headers.get('Referer');
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
        if (!isOriginAllowed(req)) {
            return new Response('Forbidden: Invalid Origin', { status: 403, headers: getCorsHeaders(req) });
        }
        const url = new URL(req.url);
        const path = url.pathname;
        const method = req.method;
        try {
            // ── Popcat (일시 중단) ──────────────────────────────────────
            if (path === '/api/popcat' && method === 'GET') {
                return json({ 문경: 0, 음성: 0, 세종: 0, paused: true, message: 'popcat temporarily paused' }, 200);
            }
            if (path === '/api/popcat/increment' && method === 'POST') {
                return json({ error: 'popcat temporarily paused', paused: true }, 503);
            }

            // ── Live Relay ──────────────────────────────────────────────
            if (path === '/api/live/state' && method === 'GET') return getLiveState(env, req, ctx);
            if (path === '/api/live/admin/ping' && method === 'GET') {
                if (!checkAdmin(req, env)) return json({ error: 'unauthorized' }, 401);
                return json({ ok: true });
            }
            let m = path.match(/^\/api\/live\/match\/([^/]+)$/);
            if (m && method === 'PUT') {
                if (!checkAdmin(req, env)) return json({ error: 'unauthorized' }, 401);
                return updateMatch(m[1], req, env);
            }
            m = path.match(/^\/api\/live\/match\/([^/]+)\/comments$/);
            if (m && method === 'GET') return getComments(m[1], url, env);
            if (m && method === 'POST') {
                if (!checkAdmin(req, env)) return json({ error: 'unauthorized' }, 401);
                return addComment(m[1], req, env);
            }
            m = path.match(/^\/api\/live\/match\/([^/]+)\/comments\/(\d+)$/);
            if (m && method === 'DELETE') {
                if (!checkAdmin(req, env)) return json({ error: 'unauthorized' }, 401);
                return deleteComment(m[1], Number(m[2]), env);
            }

            // ── Territory ───────────────────────────────────────────────
            if (path === '/api/territory' && method === 'GET') return getTerritory(env, req, ctx);
            if (path === '/api/territory/claim' && method === 'POST') return claimTerritory(req, env);

            // ── Dashboard ───────────────────────────────────────────────
            if (path === '/api/dashboard' && method === 'GET') return getDashboard(env);
            if (path.startsWith('/api/dashboard/division/') && method === 'PUT') {
                if (!checkAdmin(req, env)) return json({ error: 'unauthorized' }, 401);
                return saveDivision(path.split('/')[4], req, env);
            }
            if (path === '/api/dashboard/reset' && method === 'POST') {
                if (!checkAdmin(req, env)) return json({ error: 'unauthorized' }, 401);
                return resetDashboard(env);
            }

            return json({ error: 'not found' }, 404);
        } catch (err) {
            return json({ error: 'internal', message: String(err?.message || err) }, 500);
        }
    },
};

// ── 공통 유틸 ────────────────────────────────────────────────────────────────

function checkAdmin(req, env) {
    const pin = req.headers.get('X-Admin-Pin');
    if (!pin || !env.ADMIN_PIN) return false;
    return pin === env.ADMIN_PIN;
}

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
}

function campusKeyFromName(name = '') {
    if (name.includes('문경')) return 'mungyeong';
    if (name.includes('음성')) return 'eumseong';
    if (name.includes('세종')) return 'sejong';
    return 'pending';
}

// ── Live Relay ───────────────────────────────────────────────────────────────

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
    // body.homeTeam, body.awayTeam 처리 추가
    if (body.homeTeam !== undefined) {
        sets.push('home_team = ?');
        params.push(String(body.homeTeam).slice(0, 64));
    }
    if (body.awayTeam !== undefined) {
        sets.push('away_team = ?');
        params.push(String(body.awayTeam).slice(0, 64));
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

async function getComments(matchId, url, env) {
    const since = Number(url.searchParams.get('since')) || 0;
    const { results } = await env.DB.prepare(
        'SELECT id, ts, type, content, quarter, score_team, score_amount, score_side FROM live_comments WHERE match_id = ? AND ts >= ? ORDER BY id ASC LIMIT 500'
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
    const scoreTeam = body.scoreTeam ? String(body.scoreTeam).slice(0, 32) : null;
    const scoreAmount = Math.max(0, Math.min(Number(body.scoreAmount) || 0, 999));
    const scoreSide = body.scoreSide === 'home' || body.scoreSide === 'away' ? body.scoreSide : null;
    const result = await env.DB.prepare(
        'INSERT INTO live_comments (match_id, ts, type, content, quarter, score_team, score_amount, score_side) VALUES (?, unixepoch(), ?, ?, ?, ?, ?, ?)'
    )
        .bind(matchId, type, content, quarter, scoreTeam, scoreAmount, scoreSide)
        .run();
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

// ── Territory ────────────────────────────────────────────────────────────────

const TERRITORY_TOTAL = 200000;
const CLAIM_UNITS = 20;
const STEAL_UNITS = 10;

async function fetchTerritoryRow(env) {
    const { results } = await env.DB.prepare('SELECT campus, claims FROM territory_state').all();
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
    const res = new Response(JSON.stringify({ campuses: state.campuses, total: state.total, empty: state.empty }), {
        status: 200,
        headers: {
            ...getCorsHeaders(req),
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=2',
        },
    });
    if (ctx?.waitUntil) ctx.waitUntil(cache.put(cacheKey, res.clone()));
    return res;
}

async function claimTerritory(req, env) {
    const body = await req.json().catch(() => null);
    const team = body?.team;
    if (!CAMPUSES.includes(team)) return json({ error: 'invalid team' }, 400);
    await env.DB.prepare('INSERT INTO territory_state (campus) VALUES (?) ON CONFLICT(campus) DO NOTHING')
        .bind(team)
        .run();
    const state = await fetchTerritoryRow(env);
    if (state.empty >= CLAIM_UNITS) {
        await env.DB.prepare(
            'UPDATE territory_state SET claims = claims + ?, updated_at = unixepoch() WHERE campus = ?'
        )
            .bind(CLAIM_UNITS, team)
            .run();
        const after = await fetchTerritoryRow(env);
        return json({ mode: 'claim', campuses: after.campuses, total: after.total, empty: after.empty });
    }
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
        env.DB.prepare(
            'UPDATE territory_state SET claims = claims - ?, updated_at = unixepoch() WHERE campus = ? AND claims >= ?'
        ).bind(STEAL_UNITS, target, STEAL_UNITS),
        env.DB.prepare(
            'UPDATE territory_state SET claims = claims + ?, updated_at = unixepoch() WHERE campus = ?'
        ).bind(STEAL_UNITS, team),
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

// ── Dashboard ────────────────────────────────────────────────────────────────

const RELAY_MAP = {
    'soccer-high-men': 'sat-fb-4',
    'soccer-mid-men': 'sat-fb-2',
    'soccer-mix-women': 'sat-fb-3',
    'basketball-high-men': 'thu-bb-4',
    'basketball-mid-men': 'thu-bb-3',
    'basketball-mix-women': 'thu-bb-2',
    'volleyball-high-men': 'fri-vb-6',
    'volleyball-mid-men': 'fri-vb-4',
    'volleyball-mix-women': 'fri-vb-5',
    'tk-sparring-mid': 'sat-tk-1',
    'tk-sparring-high': 'sat-tk-2',
};

function isVolleyballRelayMatch(matchId) {
    return typeof matchId === 'string' && matchId.startsWith('fri-vb-');
}

function getSetWinsFromComments(comments = []) {
    const setMap = new Map();
    for (const comment of comments) {
        if (!comment.quarter || !comment.score_side) continue;
        const amount = Number(comment.score_amount) || 0;
        if (amount <= 0) continue;
        if (!setMap.has(comment.quarter)) setMap.set(comment.quarter, { home: 0, away: 0 });
        const row = setMap.get(comment.quarter);
        if (comment.score_side === 'home') row.home += amount;
        if (comment.score_side === 'away') row.away += amount;
    }

    const wins = { home: 0, away: 0 };
    for (const row of setMap.values()) {
        if (row.home > row.away) wins.home += 1;
        if (row.away > row.home) wins.away += 1;
    }
    return wins;
}

async function getDashboard(env) {
    const [divRows, matchRows, volleyballCommentRows] = await Promise.all([
        env.DB.prepare('SELECT * FROM division_results').all(),
        env.DB.prepare('SELECT * FROM live_match_state').all(),
        env.DB.prepare(
            "SELECT match_id, quarter, score_amount, score_side FROM live_comments WHERE match_id LIKE 'fri-vb-%' AND score_amount > 0"
        ).all(),
    ]);
    const divMap = Object.fromEntries((divRows.results || []).map((r) => [r.division_id, r]));
    const matchMap = Object.fromEntries((matchRows.results || []).map((r) => [r.match_id, r]));
    const volleyballCommentsMap = {};
    for (const row of volleyballCommentRows.results || []) {
        if (!volleyballCommentsMap[row.match_id]) volleyballCommentsMap[row.match_id] = [];
        volleyballCommentsMap[row.match_id].push(row);
    }
    const merged = { ...divMap };

    for (const [divId, relayMatchId] of Object.entries(RELAY_MAP)) {
        const div = divMap[divId] || { winner_key: 'pending', state: 'ready', note: '경기 예정', is_manual: 0 };
        const match = matchMap[relayMatchId];

        if (!div.is_manual) {
            if (match?.status === 'finished') {
                const setWins = isVolleyballRelayMatch(relayMatchId)
                    ? getSetWinsFromComments(volleyballCommentsMap[relayMatchId] || [])
                    : null;
                const home = setWins ? setWins.home : Number(match.home_score) || 0;
                const away = setWins ? setWins.away : Number(match.away_score) || 0;
                if (home !== away) {
                    const winnerTeam = home > away ? match.home_team : match.away_team;
                    div.winner_key = campusKeyFromName(winnerTeam);
                }
                div.state = 'done';
            } else if (match?.status === 'live') {
                div.state = 'live';
            }
        }
        merged[divId] = div;
    }

    return json({ divisions: merged });
}

async function saveDivision(divisionId, req, env) {
    const body = await req.json().catch(() => null);
    if (!body) return json({ error: 'invalid json' }, 400);
    await env.DB.prepare(
        `
        INSERT INTO division_results (division_id, winner_key, state, note, is_manual, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(division_id) DO UPDATE SET
            winner_key = excluded.winner_key,
            state      = excluded.state,
            note       = excluded.note,
            is_manual  = excluded.is_manual,
            updated_at = excluded.updated_at
    `
    )
        .bind(
            divisionId,
            body.winner_key ?? 'pending',
            body.state ?? 'ready',
            body.note ?? '',
            body.is_manual ? 1 : 0,
            Math.floor(Date.now() / 1000)
        )
        .run();
    return json({ ok: true });
}

async function resetDashboard(env) {
    await env.DB.prepare('DELETE FROM division_results').run();
    return json({ ok: true });
}
