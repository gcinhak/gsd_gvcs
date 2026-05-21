/**
 * Popcat 카운터 API — Cloudflare Workers + D1
 */

const CAMPUSES = ['문경', '음성', '세종'];
const GET_CACHE_TTL = 2; // 초

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
};

// 💡 IP별 접속 기록과 차단 목록을 서버 메모리에 임시 저장
const ipRequestHistory = new Map();
const blockedIPs = new Map();

export default {
    async fetch(req, env, ctx) {
        if (req.method === 'OPTIONS') {
            return new Response(null, { headers: CORS_HEADERS });
        }

        // 1. 도메인 엄격 검증 (로컬호스트 전면 차단, 오직 공식 도메인만 허용)
        const origin = req.headers.get('Origin');
        const referer = req.headers.get('Referer');
        const ALLOWED_DOMAIN = 'https://gsd.gvcs.kr';

        const isOriginValid = origin === ALLOWED_DOMAIN;
        const isRefererValid = referer && (referer === ALLOWED_DOMAIN || referer.startsWith(ALLOWED_DOMAIN + '/'));

        if (!isOriginValid && !isRefererValid) {
            return new Response('Forbidden: Invalid Origin', {
                status: 403,
                headers: CORS_HEADERS,
            });
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

    if (ctx && ctx.waitUntil) {
        ctx.waitUntil(cache.put(cacheKey, res.clone()));
    }
    return res;
}

async function increment(req, env) {
    // 바디를 먼저 파싱 (UUID, campus, delta 모두 여기에 있음)
    let body;
    try {
        body = await req.json();
    } catch {
        return json({ error: 'invalid json' }, 400);
    }

    const campus = body?.campus;
    let delta = Number(body?.delta);
    // 클라이언트가 보낸 UUID (localStorage에서 생성한 값).
    // UUID가 없으면 IP를 fallback으로 사용하되, 학교 NAT 환경에서는
    // IP만으로 차단하면 전체 캠퍼스가 한꺼번에 밴될 수 있어 UUID 우선 사용.
    const clientUuid = typeof body?.uuid === 'string' && body.uuid.length > 0 ? body.uuid : null;
    const clientIp = req.headers.get('cf-connecting-ip') || 'unknown';

    // 💡 차단 키: UUID가 있으면 UUID, 없으면 IP
    const rateKey = clientUuid ?? clientIp;

    const now = Date.now();

    // 1. 현재 차단(블랙리스트) 상태인지 확인
    if (blockedIPs.has(rateKey)) {
        const unblockTime = blockedIPs.get(rateKey);
        if (now < unblockTime) {
            const remainSeconds = Math.ceil((unblockTime - now) / 1000);
            console.warn(`[Blocked Attempt] Key: ${rateKey} — 해제까지 ${remainSeconds}초 남음.`);
            return json({ error: `Too many requests. Blocked for ${remainSeconds}s.` }, 429);
        } else {
            blockedIPs.delete(rateKey);
        }
    }

    // 2. 20초 이내 요청 횟수 확인
    //    임계값을 5회로 상향 (기존 3회는 20초 타이머 flush + SPA 이탈 flush 가
    //    겹치면 정상 사용자도 쉽게 초과하는 문제가 있었음)
    const RATE_LIMIT = 5;
    let timestamps = ipRequestHistory.get(rateKey) || [];
    timestamps = timestamps.filter((t) => now - t < 20000);

    if (timestamps.length >= RATE_LIMIT) {
        blockedIPs.set(rateKey, now + 5 * 60 * 1000);
        console.warn(`[Auto Ban] Key: ${rateKey} (IP: ${clientIp}) — 20초 내 ${RATE_LIMIT}회 초과로 5분 밴.`);
        return json({ error: 'Too many requests. Blocked for 5 minutes.' }, 429);
    }

    timestamps.push(now);
    ipRequestHistory.set(rateKey, timestamps);

    // 기존 유효성 검사
    if (isNaN(delta) || delta <= 0) {
        return json({ error: 'Invalid request' }, 400);
    }

    // 3. 600타 초과 매크로 요청은 최대치로 깎아서 반영
    const MAX_DELTA = 600;
    if (delta > MAX_DELTA) {
        console.warn(
            `[Macro Adjusted] Key: ${rateKey}, Campus: ${campus}, Attempted Delta: ${delta} -> Reduced to 600`
        );
        delta = MAX_DELTA;
    }

    if (!CAMPUSES.includes(campus)) {
        return json({ error: 'invalid campus' }, 400);
    }

    console.log(`[Score Added] Campus: ${campus}, Delta: ${delta} POPS (Key: ${rateKey}, IP: ${clientIp})`);

    await env.DB.prepare(
        'INSERT INTO popcat_counts (campus, count, updated_at) VALUES (?, ?, unixepoch()) ' +
            'ON CONFLICT(campus) DO UPDATE SET count = count + excluded.count, updated_at = unixepoch()'
    )
        .bind(campus, delta)
        .run();

    const row = await env.DB.prepare('SELECT count FROM popcat_counts WHERE campus = ?').bind(campus).first();

    return json({ campus, count: Number(row?.count) || 0 });
}

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
}
