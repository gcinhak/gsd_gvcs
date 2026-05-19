// 운영 Worker URL — 비밀이 아니라서 기본값으로 박아둠.
// 로컬/스테이징에서 다른 워커를 가리키려면 .env.local 의 VITE_POPCAT_API_URL 로 override.
const DEFAULT_API = 'https://gsd-gvcs-popcat.gcinhak.workers.dev';
const RAW = import.meta.env.VITE_POPCAT_API_URL || DEFAULT_API;
const API = RAW.replace(/\/$/, '');

export const isPopcatApiConfigured = Boolean(API);

export async function fetchCounts() {
    const res = await fetch(`${API}/api/popcat`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`fetchCounts failed: ${res.status}`);
    return res.json();
}

export async function incrementCount(campus, delta = 1) {
    const res = await fetch(`${API}/api/popcat/increment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campus, delta }),
    });
    if (!res.ok) throw new Error(`incrementCount failed: ${res.status}`);
    return res.json();
}
