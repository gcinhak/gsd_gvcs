/**
 * GVCS GSD Territory Worker — 점령전 API (캠퍼스 영토 차지/강탈)
 *
 *   GET  /api/territory                 → { campuses, total, empty }
 *   POST /api/territory/claim   body { team } → 빈 땅 차지 또는 강탈
 *
 * 보안:
 *   - 모든 요청은 ALLOWED_DOMAIN 또는 localhost(dev) 에서 와야 함.
 *
 * D1 바인딩 이름: DB (popcat 워커와 동일 데이터베이스 공유, territory_state 테이블 사용)
 */

const CAMPUSES = ['문경', '음성', '세종'];
const ALLOWED_DOMAIN = 'https://gsd.gvcs.kr';
const GET_CACHE_TTL = 2;

// 1 unit = 0.0005% → TOTAL = 200,000
// 빈 땅 차지: +20 units (= 0.01%)
// 강탈 (빈 땅 0): +10 to me, -10 from leader opponent (= 0.005% transfer)
const TERRITORY_TOTAL = 200000;
const CLAIM_UNITS = 20;
const STEAL_UNITS = 10;

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': ALLOWED_DOMAIN,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
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

function json(data, status = 200, req) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            ...(req ? getCorsHeaders(req) : CORS_HEADERS),
            'Content-Type': 'application/json',
        },
    });
}

export default {
    async fetch(req, env, ctx) {
        if (req.method === 'OPTIONS') {
            return new Response(null, { headers: getCorsHeaders(req) });
        }
        if (!isOriginAllowed(req)) {
            return new Response('Forbidden: Invalid Origin', {
                status: 403,
                headers: getCorsHeaders(req),
            });
        }

        const url = new URL(req.url);
        const path = url.pathname;

        try {
            if (path === '/api/territory' && req.method === 'GET') return getTerritory(env, req, ctx);
            if (path === '/api/territory/claim' && req.method === 'POST') return claimTerritory(req, env);
            return json({ error: 'not found' }, 404, req);
        } catch (err) {
            return json({ error: 'internal', message: String(err?.message || err) }, 500, req);
        }
    },
};

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
                'Cache-Control': `public, max-age=${GET_CACHE_TTL}`,
            },
        }
    );
    if (ctx?.waitUntil) ctx.waitUntil(cache.put(cacheKey, res.clone()));
    return res;
}

/**
 * Unified play:
 *   - 빈 땅 >= CLAIM_UNITS → +CLAIM_UNITS to team (= 0.01%)
 *   - 빈 땅 < CLAIM_UNITS → +STEAL_UNITS to team, -STEAL_UNITS from 리더(상대 중 1위) (= 0.005% transfer)
 *
 * 응답: { mode: 'claim' | 'steal' | 'full', stolenFrom?, campuses, total, empty }
 */
async function claimTerritory(req, env) {
    const body = await req.json().catch(() => null);
    const team = body?.team;
    if (!CAMPUSES.includes(team)) return json({ error: 'invalid team' }, 400, req);

    await env.DB
        .prepare('INSERT INTO territory_state (campus) VALUES (?) ON CONFLICT(campus) DO NOTHING')
        .bind(team)
        .run();

    const state = await fetchTerritoryRow(env);

    if (state.empty >= CLAIM_UNITS) {
        await env.DB
            .prepare(
                'UPDATE territory_state SET claims = claims + ?, updated_at = unixepoch() WHERE campus = ?'
            )
            .bind(CLAIM_UNITS, team)
            .run();
        const after = await fetchTerritoryRow(env);
        return json(
            { mode: 'claim', campuses: after.campuses, total: after.total, empty: after.empty },
            200,
            req
        );
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
        return json(
            {
                error: 'fully conquered',
                mode: 'full',
                campuses: state.campuses,
                total: state.total,
                empty: state.empty,
            },
            409,
            req
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
    return json(
        {
            mode: 'steal',
            stolenFrom: target,
            campuses: after.campuses,
            total: after.total,
            empty: after.empty,
        },
        200,
        req
    );
}
