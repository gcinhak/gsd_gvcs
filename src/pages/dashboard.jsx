import { useEffect, useState } from 'react';
import {
    CAMPUS,
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
            <span className="db-cell-note">{division.note}</span>
        </div>
    );
}

function TaekwondoGroups({ groups }) {
    return (
        <div className="db-taekwondo-groups">
            {groups.map((group) => (
                <div className="db-taekwondo-group" key={group.id}>
                    <div className="db-group-title">{group.title}</div>
                    <div className="db-result-grid">
                        {group.divisions.map((division) => (
                            <ResultCell division={division} key={division.id} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
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

    const totalDivisions = events.reduce((sum, event) => sum + getEventDivisions(event).length, 0);
    const liveCount = events.reduce(
        (sum, event) => sum + getEventDivisions(event).filter((division) => division.state === 'live').length,
        0,
    );
    const doneCount = events.reduce(
        (sum, event) => sum + getEventDivisions(event).filter((division) => division.state === 'done').length,
        0,
    );

    return (
        <div className="page dashboard-page">
            <section className="db-topline">
                <div>
                    <span className="db-kicker">MATCH BOARD</span>
                    <h1>경기 현황판</h1>
                </div>
                <div className="db-live-panel" aria-label="현재 진행 상태">
                    <span className="db-live-dot" />
                    <strong>LIVE</strong>
                    <span>관리자 입력 즉시 반영</span>
                </div>
            </section>

            <section className="db-summary-grid" aria-label="요약">
                <div className="db-summary-card">
                    <span>운영 종목</span>
                    <strong>{events.length}</strong>
                </div>
                <div className="db-summary-card">
                    <span>세부 부문</span>
                    <strong>{totalDivisions}</strong>
                </div>
                <div className="db-summary-card">
                    <span>진행 중</span>
                    <strong>{liveCount}</strong>
                </div>
                <div className="db-summary-card is-accent">
                    <span>완료 부문</span>
                    <strong>{doneCount}</strong>
                </div>
            </section>

            <section className="db-board" aria-label="종목별 결과 현황">
                <div className="db-board-head">
                    <div>
                        <span className="db-board-label">MATCH BOARD</span>
                        <h2>종목별 경기 결과</h2>
                    </div>
                    <div className="db-legend" aria-label="캠퍼스 색상">
                        <CampusBadge campus={CAMPUS.mungyeong} size="sm" />
                        <CampusBadge campus={CAMPUS.eumseong} size="sm" />
                        <CampusBadge campus={CAMPUS.sejong} size="sm" />
                    </div>
                </div>

                <div className="db-event-list">
                    {events.map((event) => (
                        <article className={`db-event-card ${event.id === 'taekwondo' ? 'is-wide' : ''}`} key={event.id}>
                            <div className="db-event-top">
                                <div>
                                    <span className="db-event-status">{event.status}</span>
                                    <h3>{event.sport}</h3>
                                    <p>{event.rule}</p>
                                </div>
                                <div className="db-winner-box">
                                    <span>우승캠퍼스</span>
                                    <CampusBadge campus={getCampus(event.winnerKey)} />
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
