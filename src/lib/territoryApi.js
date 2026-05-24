const DEFAULT_API = 'https://gsd-gvcs-territory.gcinhak.workers.dev';
const RAW = import.meta.env.VITE_TERRITORY_API_URL || DEFAULT_API;
const API = RAW.replace(/\/$/, '');

export const isTerritoryApiConfigured = Boolean(API);

export async function fetchTerritory() {
    const res = await fetch(`${API}/api/territory`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`fetchTerritory failed: ${res.status}`);
    return res.json();
}

/**
 * 게임 클리어 후 호출.
 * 서버가 빈 땅 유무에 따라 자동으로 claim / steal 모드를 선택.
 * 응답: { mode: 'claim'|'steal'|'full', stolenFrom?, campuses, total, empty }
 */
export async function playTerritory(team) {
    const res = await fetch(`${API}/api/territory/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `play failed: ${res.status}`);
    return data;
}
