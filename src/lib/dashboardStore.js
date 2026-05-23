export const DASHBOARD_STORAGE_KEY = 'gvcs-dashboard-results-v2';
export const DASHBOARD_CHANGE_EVENT = 'gvcs-dashboard-results-change';

export const CAMPUS = {
    mungyeong: { key: 'mungyeong', name: '문경', className: 'campus-mungyeong' },
    eumseong: { key: 'eumseong', name: '음성', className: 'campus-eumseong' },
    sejong: { key: 'sejong', name: '세종', className: 'campus-sejong' },
    pending: { key: 'pending', name: '대기', className: 'campus-pending' },
};

export const CAMPUS_OPTIONS = [CAMPUS.mungyeong, CAMPUS.eumseong, CAMPUS.sejong];

export const STATE_OPTIONS = [
    { key: 'ready', label: '경기 전' },
    { key: 'live', label: '진행 중' },
    { key: 'done', label: '경기 후' },
];

export const INITIAL_DASHBOARD_EVENTS = [
    {
        id: 'soccer',
        sport: '축구',
        rule: '전반 / 후반',
        status: '경기 전',
        winnerKey: 'pending',
        divisions: [
            { id: 'soccer-high-men', label: '고등부(남)', winnerKey: 'pending', note: '경기 예정', state: 'ready' },
            { id: 'soccer-mid-men', label: '중등부(남)', winnerKey: 'pending', note: '경기 예정', state: 'ready' },
            { id: 'soccer-mix-women', label: '중고연합(여)', winnerKey: 'pending', note: '경기 예정', state: 'ready' },
        ],
    },
    {
        id: 'basketball',
        sport: '농구',
        rule: '2쿼터',
        status: '경기 전',
        winnerKey: 'pending',
        divisions: [
            { id: 'basketball-high-men', label: '고등부(남)', winnerKey: 'pending', note: '경기 예정', state: 'ready' },
            { id: 'basketball-mid-men', label: '중등부(남)', winnerKey: 'pending', note: '경기 예정', state: 'ready' },
            { id: 'basketball-mix-women', label: '중고연합(여)', winnerKey: 'pending', note: '경기 예정', state: 'ready' },
        ],
    },
    {
        id: 'volleyball',
        sport: '배구',
        rule: '3세트',
        status: '경기 전',
        winnerKey: 'pending',
        divisions: [
            { id: 'volleyball-high-men', label: '고등부(남)', winnerKey: 'pending', note: '경기 예정', state: 'ready' },
            { id: 'volleyball-mid-men', label: '중등부(남)', winnerKey: 'pending', note: '경기 예정', state: 'ready' },
            { id: 'volleyball-mix-women', label: '중고연합(여)', winnerKey: 'pending', note: '경기 예정', state: 'ready' },
        ],
    },
    {
        id: 'table-tennis',
        sport: '탁구',
        rule: '3세트 11점',
        status: '경기 전',
        winnerKey: 'pending',
        divisions: [
            { id: 'table-high', label: '고등부', winnerKey: 'pending', note: '경기 예정', state: 'ready' },
            { id: 'table-mid', label: '중등부', winnerKey: 'pending', note: '경기 예정', state: 'ready' },
            { id: 'table-popular', label: '인기모', winnerKey: 'pending', note: '경기 예정', state: 'ready' },
            { id: 'table-staff', label: '교직원', winnerKey: 'pending', note: '경기 예정', state: 'ready' },
        ],
    },
    {
        id: 'chess',
        sport: '체스',
        rule: '1경기',
        status: '경기 전',
        winnerKey: 'pending',
        divisions: [
            { id: 'chess-7-8', label: '7-8학년', winnerKey: 'pending', note: '경기 예정', state: 'ready' },
            { id: 'chess-9-10', label: '9-10학년', winnerKey: 'pending', note: '경기 예정', state: 'ready' },
            { id: 'chess-11-12', label: '11-12학년', winnerKey: 'pending', note: '경기 예정', state: 'ready' },
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
                divisions: [{ id: 'tk-routine', label: '태권체조', winnerKey: 'pending', note: '경기 예정', state: 'ready' }],
            },
            {
                id: 'taekwondo-poomsae',
                title: '품새',
                divisions: [
                    { id: 'tk-poomsae-mid', label: '품새(중)', winnerKey: 'pending', note: '경기 예정', state: 'ready' },
                    { id: 'tk-poomsae-high', label: '품새(고)', winnerKey: 'pending', note: '경기 예정', state: 'ready' },
                ],
            },
            {
                id: 'taekwondo-sparring',
                title: '겨루기',
                divisions: [
                    { id: 'tk-sparring-mid', label: '겨루기(중)', winnerKey: 'pending', note: '경기 예정', state: 'ready' },
                    { id: 'tk-sparring-high', label: '겨루기(고)', winnerKey: 'pending', note: '경기 예정', state: 'ready' },
                ],
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
            { id: 'distance-mid-women', label: '중등부(여)', winnerKey: 'pending', note: '경기 예정', state: 'ready' },
            { id: 'distance-mid-men', label: '중등부(남)', winnerKey: 'pending', note: '경기 예정', state: 'ready' },
            { id: 'distance-high-women', label: '고등부(여)', winnerKey: 'pending', note: '경기 예정', state: 'ready' },
            { id: 'distance-high-men', label: '고등부(남)', winnerKey: 'pending', note: '경기 예정', state: 'ready' },
        ],
    },
    {
        id: 'relay',
        sport: '이어달리기',
        rule: '릴레이',
        status: '경기 전',
        winnerKey: 'pending',
        divisions: [{ id: 'relay-main', label: '이어달리기', winnerKey: 'pending', note: '경기 예정', state: 'ready' }],
    },
    {
        id: 'tug-of-war',
        sport: '줄다리기',
        rule: '3판 2선승',
        status: '경기 전',
        winnerKey: 'pending',
        divisions: [
            { id: 'tug-students', label: '학생팀', winnerKey: 'pending', note: '경기 예정', state: 'ready' },
            { id: 'tug-adults', label: '성인팀', winnerKey: 'pending', note: '경기 예정', state: 'ready' },
        ],
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

export function readDashboardEvents() {
    if (typeof window === 'undefined') return cloneDashboardEvents();

    try {
        const raw = window.localStorage.getItem(DASHBOARD_STORAGE_KEY);
        if (!raw) return cloneDashboardEvents();
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : cloneDashboardEvents();
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
    for (const division of getEventDivisions(event)) {
        if (division.state !== 'done' && division.state !== 'live') continue;
        if (scores[division.winnerKey] === undefined) continue;
        scores[division.winnerKey] += division.state === 'done' ? 2 : 1;
    }

    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    return sorted[0][1] > 0 ? sorted[0][0] : 'pending';
}

export function updateDivision(events, eventId, divisionId, patch) {
    return events.map((event) => {
        if (event.id !== eventId) return event;

        const nextEvent = cloneDashboardEvents([event])[0];
        const applyDivision = (division) => (
            division.id === divisionId ? { ...division, ...patch } : division
        );

        if (nextEvent.groups) {
            nextEvent.groups = nextEvent.groups.map((group) => ({
                ...group,
                divisions: group.divisions.map(applyDivision),
            }));
        } else {
            nextEvent.divisions = nextEvent.divisions.map(applyDivision);
        }

        nextEvent.winnerKey = getLeadingCampusKey(nextEvent);
        const hasLive = getEventDivisions(nextEvent).some((division) => division.state === 'live');
        const allDone = getEventDivisions(nextEvent).every((division) => division.state === 'done');
        nextEvent.status = hasLive ? '진행 중' : allDone ? '경기 후' : '경기 전';

        return nextEvent;
    });
}

export function resetDashboardEvents() {
    return cloneDashboardEvents().map((event) => {
        const resetDivision = (division) => ({
            ...division,
            winnerKey: 'pending',
            state: 'ready',
            note: '경기 예정',
        });

        const nextEvent = {
            ...event,
            status: '경기 전',
            winnerKey: 'pending',
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
