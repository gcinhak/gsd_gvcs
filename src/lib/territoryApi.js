const DEFAULT_API = 'https://gsd-gvcs-popcat.gcinhak.workers.dev';
const RAW = import.meta.env.VITE_POPCAT_API_URL || DEFAULT_API;
const API = RAW.replace(/\/$/, '');

export const isTerritoryApiConfigured = Boolean(API);

// ── clientId: 기기/브라우저 단위 식별자 (서버 발급 제한의 키) ──────────────────
// 학교 와이파이처럼 IP가 공유되는 환경에서도 학생별로 분리되도록 IP가 아닌
// 클라이언트 UUID를 1차 키로 사용한다.
const CLIENT_ID_KEY = 'gsd-territory-clientid';
function getClientId() {
    if (typeof window === 'undefined') return 'ssr';
    let id = window.localStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
        id =
            (typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID()) ||
            String(Date.now()) + Math.random().toString(16).slice(2);
        window.localStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
}

export async function fetchTerritory() {
    const res = await fetch(`${API}/api/territory`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`fetchTerritory failed: ${res.status}`);
    return res.json();
}

/**
 * 게임 시작 시 호출 → 서버가 1회용 토큰(nonce)을 발급.
 * 이 토큰은 claim 단계에서 검증/소비된다.
 * 응답: { nonce, ttlMs, minPlayMs }
 * 실패(429 쿨다운/레이트리밋) 시 err.status, err.retryAfterMs 가 채워진다.
 */
export async function startTerritory() {
    const res = await fetch(`${API}/api/territory/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Client-Id': getClientId() },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const err = new Error(data.error || `start failed: ${res.status}`);
        err.status = res.status;
        err.retryAfterMs = data.retryAfterMs;
        throw err;
    }
    return data;
}

/**
 * 게임 클리어 후 호출. start에서 받은 nonce를 함께 보내야 한다.
 * 서버가 nonce를 검증(1회용·시간조건)한 뒤 빈 땅 유무에 따라 claim/steal 자동 선택.
 * 응답: { mode: 'claim'|'steal'|'full', stolenFrom?, campuses, total, empty }
 */
export async function playTerritory(team, nonce) {
    const res = await fetch(`${API}/api/territory/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Client-Id': getClientId() },
        body: JSON.stringify({ team, nonce }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `play failed: ${res.status}`);
    return data;
}