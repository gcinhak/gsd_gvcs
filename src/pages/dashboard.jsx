import { useEffect, useMemo, useState } from 'react';
import {
    CAMPUS_OPTIONS,
    DASHBOARD_CHANGE_EVENT,
    getCampus,
    getEventDivisions,
    readDashboardEvents,
} from '../lib/dashboardStore';

function CampusBadge({ campus, size = 'md' }) {
    return <span className={`db-campus-badge ${campus.className} size-${size}`}>{campus.name}</span>;
}

function ResultCell({ division }) {
    const state = division.state || 'ready';
    const campus = getCampus(division.winnerKey);

    return (
        <div className={`db-result-cell is-${state} ${campus.className}`}>
            <span className="db-division-label">{division.label}</span>
            {state === 'live' && <span className="db-live-label">LIVE</span>}
            <CampusBadge campus={campus} size="sm" />
        </div>
    );
}

function TaekwondoGroups({ groups }) {
    const divisions = groups.flatMap((group) => group.divisions);

    return (
        <div className="db-taekwondo-groups">
            {divisions.map((division) => (
                <ResultCell division={division} key={division.id} />
            ))}
        </div>
    );
}

function getCampusWinCounts(events) {
    const counts = CAMPUS_OPTIONS.reduce((acc, campus) => ({ ...acc, [campus.key]: 0 }), {});

    for (const event of events) {
        for (const division of getEventDivisions(event)) {
            if (division.state !== 'done') continue;
            if (counts[division.winnerKey] === undefined) continue;
            counts[division.winnerKey] += 1;
        }
    }

    return counts;
}

export default function DashboardPage() {
    const [events, setEvents] = useState(() => readDashboardEvents());

    useEffect(() => {
        const sync = () => setEvents(readDashboardEvents());
        window.addEventListener('storage', sync);
        window.addEventListener(DASHBOARD_CHANGE_EVENT, sync);
        return () => {
            window.removeEventListener('storage', sync);
            window.removeEventListener(DASHBOARD_CHANGE_EVENT, sync);
        };
    }, []);

    const stats = useMemo(() => {
        const divisions = events.flatMap(getEventDivisions);
        return {
            total: divisions.length,
            done: divisions.filter((division) => division.state === 'done').length,
            live: divisions.filter((division) => division.state === 'live').length,
            campusWins: getCampusWinCounts(events),
        };
    }, [events]);

    return (
        <div className="page dashboard-page">
            <section className="db-topline">
                <div className="db-title-block">
                    <span className="db-kicker">MATCH BOARD</span>
                    <h1>경기 현황판</h1>
                </div>

                <div className="db-campus-scoreboard" aria-label="캠퍼스별 우승 개수">
                    {CAMPUS_OPTIONS.map((campus) => (
                        <div className={`db-campus-score ${campus.className}`} key={campus.key}>
                            <span>{campus.name}</span>
                            <strong>{stats.campusWins[campus.key]}</strong>
                            <em>우승</em>
                        </div>
                    ))}
                </div>

                <div className="db-live-panel" aria-label="현재 진행 상태">
                    <span className="db-live-dot" />
                    <strong>LIVE</strong>
                    <span>{stats.done}/{stats.total} 완료 · {stats.live} 진행</span>
                </div>
            </section>

            <section className="db-board" aria-label="종목별 결과 현황">
                <div className="db-event-list">
                    {events.map((event) => (
                        <article className={`db-event-card event-${event.id}`} key={event.id}>
                            <div className="db-event-top">
                                <div>
                                    <span className="db-event-status">{event.status}</span>
                                    <h2>{event.sport}</h2>
                                    <p>{event.rule}</p>
                                </div>
                                <div className="db-winner-box">
                                    <span>종목 선두</span>
                                    <CampusBadge campus={getCampus(event.winnerKey)} size="sm" />
                                </div>
                            </div>

                            {event.groups ? (
                                <TaekwondoGroups groups={event.groups} />
                            ) : (
                                <div className="db-result-grid">
                                    {event.divisions.map((division) => (
                                        <ResultCell division={division} key={division.id} />
                                    ))}
                                </div>
                            )}
                        </article>
                    ))}
                </div>
            </section>
        </div>
    );
}
