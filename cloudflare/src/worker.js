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
    // 💡 IP 기반 과도한 요청(매크로 API 호출) 5분 차단 로직
    const clientIp = req.headers.get('cf-connecting-ip');
    const now = Date.now();

    // 1. 현재 5분 차단(블랙리스트) 상태인지 확인
    if (blockedIPs.has(clientIp)) {
        const unblockTime = blockedIPs.get(clientIp);
        if (now < unblockTime) {
            const remainSeconds = Math.ceil((unblockTime - now) / 1000);
            console.warn(`[Blocked Attempt] IP: ${clientIp}는 차단된 상태입니다. 해제까지 ${remainSeconds}초 남음.`);
            return json({ error: `Too many requests. Blocked for ${remainSeconds}s.` }, 429);
        } else {
            // 5분이 지나면 차단 해제
            blockedIPs.delete(clientIp);
        }
    }

    // 2. 20초 이내에 3번 이상 보냈는지 확인
    let timestamps = ipRequestHistory.get(clientIp) || [];
    timestamps = timestamps.filter((t) => now - t < 20000); // 최근 20초 기록만 남김

    if (timestamps.length >= 3) {
        // 20초 안에 3번(현재 요청 포함 4번째 시도)이면 즉시 5분(300,000ms) 차단
        blockedIPs.set(clientIp, now + 5 * 60 * 1000);
        console.warn(`[Auto Ban] IP: ${clientIp} - 20초 내 3회 이상 비정상 요청으로 5분간 밴 처리됨!`);
        return json({ error: 'Too many requests. Blocked for 5 minutes.' }, 429);
    }

    // 이번 요청 시간 기록
    timestamps.push(now);
    ipRequestHistory.set(clientIp, timestamps);

    // 기존 로직: 바디 파싱 및 점수 누적
    let body;
    try {
        body = await req.json();
    } catch {
        return json({ error: 'invalid json' }, 400);
    }

    const campus = body?.campus;
    let delta = Number(body?.delta);

    if (isNaN(delta) || delta <= 0) {
        return json({ error: 'Invalid request' }, 400);
    }

    // 3. [보안 수정] 600타를 넘겨서 보낸 매크로 요청은 최대치인 600점으로 깎아서 반영
    const MAX_DELTA = 600;
    if (delta > MAX_DELTA) {
        console.warn(
            `[Macro Adjusted] IP: ${clientIp}, Campus: ${campus}, Attempted Delta: ${delta} -> Reduced to 600`
        );
        delta = MAX_DELTA;
    }

    if (!CAMPUSES.includes(campus)) {
        return json({ error: 'invalid campus' }, 400);
    }

    console.log(`[Score Added] Campus: ${campus}, Added Delta: ${delta} POPS (IP: ${clientIp})`);

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
