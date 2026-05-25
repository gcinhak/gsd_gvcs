export const DASHBOARD_STORAGE_KEY = 'gvcs-dashboard-results-v2';
export const DASHBOARD_CHANGE_EVENT = 'gvcs-dashboard-results-change';

export const CAMPUS = {
    mungyeong: { key: 'mungyeong', name: '문경', className: 'campus-mungyeong' },
    eumseong: { key: 'eumseong', name: '음성', className: 'campus-eumseong' },
    sejong: { key: 'sejong', name: '세종', className: 'campus-sejong' },
    pending: { key: 'pending', name: '대기', className: 'campus-pending' },
    live: { key: 'live', name: '진행중', className: 'campus-pending' },
};

export const CAMPUS_OPTIONS = [CAMPUS.mungyeong, CAMPUS.eumseong, CAMPUS.sejong];

export const STATE_OPTIONS = [
    { key: 'ready', label: '경기 전' },
    { key: 'live', label: '진행중' },
    { key: 'done', label: '경기종료' },
];

const division = (id, label) => ({
    id,
    label,
    winnerKey: 'pending',
    note: '경기 예정',
    state: 'ready',
});

export const INITIAL_DASHBOARD_EVENTS = [
    {
        id: 'soccer',
        sport: '축구',
        rule: '전반 / 후반',
        status: '경기 전',
        winnerKey: 'pending',
        divisions: [
            division('soccer-high-men', '고등부(남)'),
            division('soccer-mid-men', '중등부(남)'),
            division('soccer-mix-women', '중고연합(여)'),
        ],
    },
    {
        id: 'basketball',
        sport: '농구',
        rule: '2쿼터',
        status: '경기 전',
        winnerKey: 'pending',
        divisions: [
            division('basketball-high-men', '고등부(남)'),
            division('basketball-mid-men', '중등부(남)'),
            division('basketball-mix-women', '중고연합(여)'),
        ],
    },
    {
        id: 'volleyball',
        sport: '배구',
        rule: '3세트',
        status: '경기 전',
        winnerKey: 'pending',
        divisions: [
            division('volleyball-high-men', '고등부(남)'),
            division('volleyball-mid-men', '중등부(남)'),
            division('volleyball-mix-women', '중고연합(여)'),
        ],
    },
    {
        id: 'table-tennis',
        sport: '탁구',
        rule: '3세트 11점',
        status: '경기 전',
        winnerKey: 'pending',
        divisions: [
            division('table-high', '고등부'),
            division('table-mid', '중등부'),
            division('table-popular', '인기모'),
            division('table-staff', '교직원'),
        ],
    },
    {
        id: 'chess',
        sport: '체스',
        rule: '1경기',
        status: '경기 전',
        winnerKey: 'pending',
        divisions: [
            division('chess-7-8', '7-8학년'),
            division('chess-9-10', '9-10학년'),
            division('chess-11-12', '11-12학년'),
        ],
    },
    {
        id: 'taekwondo',
        sport: '태권도',
        rule: '태권체조 / 품새 / 겨루기',
        status: '경기 전',
        winnerKey: 'pending',
        groups: [
            {
                id: 'taekwondo-routine',
                title: '태권체조',
                divisions: [division('tk-routine', '태권체조')],
            },
            {
                id: 'taekwondo-poomsae',
                title: '품새',
                divisions: [division('tk-poomsae-mid', '품새(중)'), division('tk-poomsae-high', '품새(고)')],
            },
            {
                id: 'taekwondo-sparring',
                title: '겨루기',
                divisions: [division('tk-sparring-mid', '겨루기(중)'), division('tk-sparring-high', '겨루기(고)')],
            },
        ],
    },
    {
        id: 'middle-distance',
        sport: '중거리',
        rule: '타임 레이스',
        status: '경기 전',
        winnerKey: 'pending',
        divisions: [
            division('distance-mid-women', '중등부(여)'),
            division('distance-mid-men', '중등부(남)'),
            division('distance-high-women', '고등부(여)'),
            division('distance-high-men', '고등부(남)'),
        ],
    },
    {
        id: 'relay',
        sport: '이어달리기',
        rule: '릴레이',
        status: '경기 전',
        winnerKey: 'pending',
        divisions: [division('relay-main', '이어달리기')],
    },
    {
        id: 'tug-of-war',
        sport: '줄다리기',
        rule: '3판 2선승',
        status: '경기 전',
        winnerKey: 'pending',
        divisions: [division('tug-students', '학생팀'), division('tug-adults', '성인팀')],
    },
];

export function getCampus(key) {
    return CAMPUS[key] || CAMPUS.pending;
}

export function getEventDivisions(event) {
    if (event.groups) {
        return event.groups.flatMap((group) => group.divisions);
    }
    return event.divisions || [];
}

export function cloneDashboardEvents(events = INITIAL_DASHBOARD_EVENTS) {
    return JSON.parse(JSON.stringify(events));
}

function mergeEventsWithDefaults(events) {
    const defaultEvents = cloneDashboardEvents();
    if (!Array.isArray(events)) return defaultEvents;

    return defaultEvents.map((defaultEvent) => {
        const storedEvent = events.find((event) => event.id === defaultEvent.id);
        if (!storedEvent) return defaultEvent;
        return {
            ...defaultEvent,
            ...storedEvent,
            groups: storedEvent.groups || defaultEvent.groups,
            divisions: storedEvent.divisions || defaultEvent.divisions,
        };
    });
}

export function readDashboardEvents() {
    if (typeof window === 'undefined') return cloneDashboardEvents();

    try {
        const raw = window.localStorage.getItem(DASHBOARD_STORAGE_KEY);
        if (!raw) return cloneDashboardEvents();
        return mergeEventsWithDefaults(JSON.parse(raw));
    } catch {
        return cloneDashboardEvents();
    }
}

export function writeDashboardEvents(events) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(events));
    window.dispatchEvent(new CustomEvent(DASHBOARD_CHANGE_EVENT, { detail: events }));
}

function getLeadingCampusKey(event) {
    const scores = { mungyeong: 0, eumseong: 0, sejong: 0 };
    for (const item of getEventDivisions(event)) {
        if (item.state !== 'done') continue;
        if (scores[item.winnerKey] === undefined) continue;
        scores[item.winnerKey] += 1;
    }

    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    if (sorted[0][1] === 0) return 'pending';
    if (sorted[0][1] === sorted[1][1]) return 'pending';
    return sorted[0][0];
}

function getEventStatus(event) {
    const items = getEventDivisions(event);
    const hasLive = items.some((item) => item.state === 'live');
    const allDone = items.length > 0 && items.every((item) => item.state === 'done');
    if (hasLive) return '진행중';
    if (allDone) return '경기종료';
    return '경기 전';
}

export function updateDivision(events, eventId, divisionId, patch) {
    return events.map((event) => {
        if (event.id !== eventId) return event;

        const nextEvent = cloneDashboardEvents([event])[0];
        const applyDivision = (item) => (item.id === divisionId ? { ...item, ...patch } : item);

        if (nextEvent.groups) {
            nextEvent.groups = nextEvent.groups.map((group) => ({
                ...group,
                divisions: group.divisions.map(applyDivision),
            }));
        } else {
            nextEvent.divisions = nextEvent.divisions.map(applyDivision);
        }

        nextEvent.status = getEventStatus(nextEvent);
        nextEvent.winnerKey = nextEvent.manualWinnerKey || getLeadingCampusKey(nextEvent);
        return nextEvent;
    });
}

export function updateEventWinner(events, eventId, winnerKey) {
    return events.map((event) => {
        if (event.id !== eventId) return event;
        const manualWinnerKey = winnerKey === 'pending' ? null : winnerKey;
        return {
            ...event,
            manualWinnerKey,
            winnerKey: manualWinnerKey || getLeadingCampusKey(event),
        };
    });
}

export function resetDashboardEvents() {
    return cloneDashboardEvents().map((event) => {
        const resetDivision = (item) => ({
            ...item,
            winnerKey: 'pending',
            state: 'ready',
            note: '경기 예정',
        });

        const nextEvent = {
            ...event,
            status: '경기 전',
            winnerKey: 'pending',
            manualWinnerKey: null,
        };

        if (nextEvent.groups) {
            nextEvent.groups = nextEvent.groups.map((group) => ({
                ...group,
                divisions: group.divisions.map(resetDivision),
            }));
        } else {
            nextEvent.divisions = nextEvent.divisions.map(resetDivision);
        }

        return nextEvent;
    });
}

// ── API 함수 (D1 기반) ────────────────────────────────────────────────────────

const DASHBOARD_API = import.meta.env.DEV ? '' : 'https://gsd-gvcs-popcat.gcinhak.workers.dev';

export async function fetchDashboard() {
    const res = await fetch(`${DASHBOARD_API}/api/dashboard`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`fetchDashboard failed: ${res.status}`);
    return res.json(); // { divisions: { [divisionId]: { winner_key, state, note, is_manual } } }
}

export async function saveDivision(divisionId, patch, pin) {
    const res = await fetch(`${DASHBOARD_API}/api/dashboard/division/${encodeURIComponent(divisionId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': pin },
        body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error(`saveDivision failed: ${res.status}`);
    return res.json();
}

export async function resetDashboardRemote(pin) {
    const res = await fetch(`${DASHBOARD_API}/api/dashboard/reset`, {
        method: 'POST',
        headers: { 'X-Admin-Pin': pin },
    });
    if (!res.ok) throw new Error(`resetDashboard failed: ${res.status}`);
    return res.json();
}

export function applyDivisionsToEvents(events, divisionsFromServer) {
    return events.map((event) => {
        const applyDiv = (div) => {
            const server = divisionsFromServer[div.id];
            if (!server) return div;
            return {
                ...div,
                winnerKey: server.winner_key,
                state: server.state,
                note: server.note,
            };
        };

        if (event.groups) {
            return {
                ...event,
                groups: event.groups.map((g) => ({
                    ...g,
                    divisions: g.divisions.map(applyDiv),
                })),
            };
        }
        return { ...event, divisions: event.divisions.map(applyDiv) };
    });
}
