/**
 * Popcat 카운터 API — Cloudflare Workers + D1
 */

const CAMPUSES = ['문경', '음성', '세종'];
const GET_CACHE_TTL = 2; // 초

// 매크로 감지 임계값
const INSTANT_BAN_DELTA = 1000; // 이 이상이면 즉시 5분 밴
const SOFT_BAN_DELTA = 600; // 이 이상이면 누적 카운터 +1
const SOFT_BAN_COUNT = 3; // 누적 3회 도달 시 5분 밴

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
};

// 💡 IP별 접속 기록과 차단 목록을 서버 메모리에 임시 저장
const ipRequestHistory = new Map();
const blockedIPs = new Map();
const macroDeltaCount = new Map(); // 💡 누적 카운터용 (600~1000 구간)

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
            return increment(req, env, ctx); // 💡 ctx(Context)를 넘겨줍니다!
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

// ✅ 함수 정의 부분에 ctx 추가
async function increment(req, env, ctx) {
    let body;
    try {
        body = await req.json();
    } catch {
        return json({ error: 'invalid json' }, 400);
    }

    const campus = body?.campus;
    let delta = Number(body?.delta);

    // 💡 IP와 UUID 추출 (로그 기록용)
    const clientIp = req.headers.get('cf-connecting-ip') || 'unknown';
    const uuid = body?.uuid || 'none';

    // [3] uuid 없거나 none이면 차단
    if (!uuid || uuid === 'none') {
        return json({ error: 'Forbidden' }, 403);
    }

    const rateKey = `rate:${clientIp}`;
    const now = Date.now();

    // 1. 이미 밴 당한 유저라면? -> 여기서 바로 차단 (DB 쓰기 절대 금지!)
    if (blockedIPs.has(rateKey)) {
        const unblockTime = blockedIPs.get(rateKey);
        if (now < unblockTime) {
            return json({ error: 'Too many requests. Blocked.' }, 429);
        } else {
            blockedIPs.delete(rateKey);
        }
    }

    // 2. 20초 이내 요청 횟수 확인 로직
    const RATE_LIMIT = 5;
    let timestamps = ipRequestHistory.get(rateKey) || [];
    timestamps = timestamps.filter((t) => now - t < 20000);

    if (timestamps.length >= RATE_LIMIT) {
        // 🚨 밴이 '최초로' 발생하는 순간!
        blockedIPs.set(rateKey, now + 5 * 60 * 1000);

        // 💡 [여기에 로그 추가] 백그라운드에서 DB에 기록 (사용자 응답 지연 없음)
        ctx.waitUntil(
            env.DB.prepare(
                'INSERT INTO abnormal_logs (uuid, ip, campus, attempted_delta, reason, created_at) VALUES (?, ?, ?, ?, ?, unixepoch())'
            )
                .bind(uuid, clientIp, campus || 'none', delta, 'RATE_LIMIT_EXCEEDED')
                .run()
                .catch(console.error)
        );

        return json({ error: 'Too many requests. Blocked for 5 minutes.' }, 429);
    }

    timestamps.push(now);
    ipRequestHistory.set(rateKey, timestamps);

    if (isNaN(delta) || delta <= 0) {
        return json({ error: 'Invalid request' }, 400);
    }

    // 3. 600타 초과 매크로 요청 삭감 로직
    const MAX_DELTA = 600;

    if (delta > MAX_DELTA) {
        const macroKey = `macro:${clientIp}`;

        // [1] 즉시 밴 — delta가 2,001 이상이면 바로 5분 밴
        if (delta >= INSTANT_BAN_DELTA) {
            blockedIPs.set(rateKey, now + 5 * 60 * 1000);
            ctx.waitUntil(
                env.DB.prepare(
                    'INSERT INTO abnormal_logs (uuid, ip, campus, attempted_delta, reason, created_at) VALUES (?, ?, ?, ?, ?, unixepoch())'
                )
                    .bind(uuid, clientIp, campus, delta, 'INSTANT_BAN')
                    .run()
                    .catch(console.error)
            );
            return json({ error: 'Macro detected. Blocked for 5 minutes.' }, 429);
        }

        // [2] 누적 밴 — delta가 800~2,000이면 카운터 +1, 3회 시 5분 밴
        if (delta >= SOFT_BAN_DELTA) {
            const count = (macroDeltaCount.get(macroKey) || 0) + 1;
            macroDeltaCount.set(macroKey, count);

            if (count >= SOFT_BAN_COUNT) {
                macroDeltaCount.delete(macroKey); // 카운터 초기화
                blockedIPs.set(rateKey, now + 5 * 60 * 1000);
                ctx.waitUntil(
                    env.DB.prepare(
                        'INSERT INTO abnormal_logs (uuid, ip, campus, attempted_delta, reason, created_at) VALUES (?, ?, ?, ?, ?, unixepoch())'
                    )
                        .bind(uuid, clientIp, campus, delta, 'SOFT_BAN_3X')
                        .run()
                        .catch(console.error)
                );
                return json({ error: 'Repeated macro detected. Blocked for 5 minutes.' }, 429);
            }
        }

        // 밴 조건 미달 시 — 기존대로 600으로 삭감 후 처리
        ctx.waitUntil(
            env.DB.prepare(
                'INSERT INTO abnormal_logs (uuid, ip, campus, attempted_delta, reason, created_at) VALUES (?, ?, ?, ?, ?, unixepoch())'
            )
                .bind(uuid, clientIp, campus, delta, 'MACRO_LIMIT_TRIGGERED')
                .run()
                .catch(console.error)
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
