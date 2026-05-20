/**
 * Popcat 카운터 API — Cloudflare Workers + D1
 *
 * 엔드포인트:
 *   GET  /api/popcat            → { "문경": 123, "음성": 90, "세종": 45 }
 *   POST /api/popcat/increment  body { campus: "문경", delta?: 1 } → { count: 124 }
 *
 * D1 바인딩 이름: DB
 * GET 응답은 Cloudflare 엣지에 2초 캐시되어 D1 부하를 크게 줄임.
 * POST 는 클라이언트에서 20초 단위로 누적 전송(batched delta) 하도록 설계됨.
 */

const CAMPUSES = ['문경', '음성', '세종'];
const GET_CACHE_TTL = 2; // 초

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
};

export default {
    async fetch(req, env, ctx) {
        if (req.method === 'OPTIONS') {
            return new Response(null, { headers: CORS_HEADERS });
        }

        const url = new URL(req.url);

        if (url.pathname === '/api/popcat' && req.method === 'GET') {
            return getCounts(env, req, ctx);
        }
        if (url.pathname === '/api/popcat/increment' && req.method === 'POST') {
            return increment(req, env);
        }

        return json({ error: 'not found' }, 404);
    },
};

async function getCounts(env, req, ctx) {
    const cache = caches.default;
    const cacheKey = new Request(req.url, { method: 'GET' });

    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    const { results } = await env.DB
        .prepare('SELECT campus, count FROM popcat_counts')
        .all();

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

    if (ctx && ctx.waitUntil) {
        ctx.waitUntil(cache.put(cacheKey, res.clone()));
    }
    return res;
}

async function increment(req, env) {
    let body;
    try {
        body = await req.json();
    } catch {
        return json({ error: 'invalid json' }, 400);
    }

    const campus = body?.campus;
    const delta = Math.max(1, Math.min(Number(body?.delta) || 1, 10000));

    if (!CAMPUSES.includes(campus)) {
        return json({ error: 'invalid campus' }, 400);
    }

    await env.DB
        .prepare(
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

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
}
