const DEFAULT_API = 'https://gsd-gvcs-popcat.gcinhak.workers.dev';
const RAW = import.meta.env.VITE_POPCAT_API_URL || DEFAULT_API;
const API = RAW.replace(/\/$/, '');

const ADMIN_PIN_KEY = 'gsd-admin-pin';

export const isLiveApiConfigured = Boolean(API);

export function getStoredPin() {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem(ADMIN_PIN_KEY) || '';
}

export function setStoredPin(pin) {
    if (typeof window === 'undefined') return;
    if (pin) window.localStorage.setItem(ADMIN_PIN_KEY, pin);
    else window.localStorage.removeItem(ADMIN_PIN_KEY);
}

export async function fetchLiveStates() {
    const res = await fetch(`${API}/api/live/state`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`fetchLiveStates failed: ${res.status}`);
    return res.json();
}

export async function fetchComments(matchId, since = 0) {
    const url = `${API}/api/live/match/${encodeURIComponent(matchId)}/comments?since=${since}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`fetchComments failed: ${res.status}`);
    return res.json();
}

/* ─── Admin endpoints (X-Admin-Pin 헤더 필요) ─── */
function adminHeaders(pin) {
    return {
        'Content-Type': 'application/json',
        'X-Admin-Pin': pin || getStoredPin(),
    };
}

export async function adminPing(pin) {
    const res = await fetch(`${API}/api/live/admin/ping`, {
        method: 'GET',
        headers: adminHeaders(pin),
    });
    return res.ok;
}

export async function adminUpdateMatch(matchId, patch, pin) {
    const res = await fetch(`${API}/api/live/match/${encodeURIComponent(matchId)}`, {
        method: 'PUT',
        headers: adminHeaders(pin),
        body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error(`adminUpdateMatch failed: ${res.status}`);
    return res.json();
}

export async function adminAddComment(matchId, comment, pin) {
    const res = await fetch(`${API}/api/live/match/${encodeURIComponent(matchId)}/comments`, {
        method: 'POST',
        headers: adminHeaders(pin),
        body: JSON.stringify(comment),
    });
    if (!res.ok) throw new Error(`adminAddComment failed: ${res.status}`);
    return res.json();
}

export async function adminDeleteComment(matchId, commentId, pin) {
    const res = await fetch(
        `${API}/api/live/match/${encodeURIComponent(matchId)}/comments/${commentId}`,
        {
            method: 'DELETE',
            headers: adminHeaders(pin),
        }
    );
    if (!res.ok) throw new Error(`adminDeleteComment failed: ${res.status}`);
    return res.json();
}
