import { useEffect, useMemo, useState } from 'react';
import {
    CAMPUS_OPTIONS,
    STATE_OPTIONS,
    getCampus,
    getEventDivisions,
    readDashboardEvents,
    resetDashboardEvents,
    updateDivision,
    writeDashboardEvents,
} from '../lib/dashboardStore';

const ADMIN_PASSWORD = 'gvcs2026';

function PasswordGate({ onSuccess }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const submit = (e) => {
        e.preventDefault();
        if (password === ADMIN_PASSWORD) {
            window.sessionStorage.setItem('gvcs-dashboard-admin', 'ok');
            onSuccess();
            return;
        }
        setError('비밀번호가 올바르지 않습니다.');
    };

    return (
        <div className="dashboard-admin-page">
            <section className="da-gate">
                <div className="da-gate-card">
                    <span className="da-kicker">DASHBOARD ADMIN</span>
                    <h1>현황판 관리자</h1>
                    <p>비밀번호를 입력하면 종목별 결과를 바로 수정할 수 있습니다.</p>
                    <form className="da-login-form" onSubmit={submit}>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError('');
                            }}
                            placeholder="관리자 비밀번호"
                            autoFocus
                        />
                        <button type="submit">입장</button>
                    </form>
                    {error && <div className="da-error">{error}</div>}
                </div>
            </section>
        </div>
    );
}

function DivisionControl({ event, division, onChange }) {
    const campus = getCampus(division.winnerKey);

    return (
        <div className={`da-division-row is-${division.state}`}>
            <div className="da-division-main">
                <strong>{division.label}</strong>
                <span>{division.note}</span>
            </div>
            <label>
                <span>상태</span>
                <select
                    value={division.state}
                    onChange={(e) => onChange(event.id, division.id, { state: e.target.value })}
                >
                    {STATE_OPTIONS.map((state) => (
                        <option key={state.key} value={state.key}>
                            {state.label}
                        </option>
                    ))}
                </select>
            </label>
            <label>
                <span>이긴 캠퍼스</span>
                <select
                    value={division.winnerKey === 'pending' ? '' : division.winnerKey}
                    onChange={(e) => {
                        const winnerKey = e.target.value || 'pending';
                        onChange(event.id, division.id, {
                            winnerKey,
                            state: winnerKey === 'pending' ? 'ready' : division.state === 'ready' ? 'done' : division.state,
                        });
                    }}
                >
                    <option value="">선택 전</option>
                    {CAMPUS_OPTIONS.map((campusOption) => (
                        <option key={campusOption.key} value={campusOption.key}>
                            {campusOption.name}
                        </option>
                    ))}
                </select>
            </label>
            <div className="da-campus-preview">
                <span className={`db-campus-badge ${campus.className} size-sm`}>{campus.name}</span>
            </div>
        </div>
    );
}

function EventAdminCard({ event, onChange }) {
    return (
        <article className="da-event-card">
            <header className="da-event-head">
                <div>
                    <span>{event.status}</span>
                    <h2>{event.sport}</h2>
                    <p>{event.rule}</p>
                </div>
                <div className="da-event-winner">
                    <span>현재 선두</span>
                    <strong>{getCampus(event.winnerKey).name}</strong>
                </div>
            </header>

            {event.groups ? (
                <div className="da-group-list">
                    {event.groups.map((group) => (
                        <section className="da-group" key={group.id}>
                            <h3>{group.title}</h3>
                            <div className="da-division-list">
                                {group.divisions.map((division) => (
                                    <DivisionControl
                                        event={event}
                                        division={division}
                                        key={division.id}
                                        onChange={onChange}
                                    />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            ) : (
                <div className="da-division-list">
                    {event.divisions.map((division) => (
                        <DivisionControl event={event} division={division} key={division.id} onChange={onChange} />
                    ))}
                </div>
            )}
        </article>
    );
}

export default function AdminDashboardPage() {
    const [authed, setAuthed] = useState(() => window.sessionStorage.getItem('gvcs-dashboard-admin') === 'ok');
    const [events, setEvents] = useState(() => readDashboardEvents());
    const [savedAt, setSavedAt] = useState('');

    const counts = useMemo(() => {
        const divisions = events.flatMap(getEventDivisions);
        return {
            ready: divisions.filter((division) => division.state === 'ready').length,
            live: divisions.filter((division) => division.state === 'live').length,
            done: divisions.filter((division) => division.state === 'done').length,
        };
    }, [events]);

    useEffect(() => {
        if (authed) writeDashboardEvents(events);
    }, [authed, events]);

    const changeDivision = (eventId, divisionId, patch) => {
        setEvents((prev) => {
            const next = updateDivision(prev, eventId, divisionId, patch);
            writeDashboardEvents(next);
            setSavedAt(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
            return next;
        });
    };

    const resetAll = () => {
        if (!window.confirm('모든 종목 결과를 경기 전/선택 전 상태로 완전히 초기화할까요?')) return;
        const next = resetDashboardEvents();
        setEvents(next);
        writeDashboardEvents(next);
        setSavedAt('완전 초기화');
    };

    const logout = () => {
        window.sessionStorage.removeItem('gvcs-dashboard-admin');
        setAuthed(false);
    };

    if (!authed) return <PasswordGate onSuccess={() => setAuthed(true)} />;

    return (
        <div className="dashboard-admin-page">
            <div className="da-inner">
                <header className="da-head">
                    <div>
                        <span className="da-kicker">DASHBOARD ADMIN</span>
                        <h1>현황판 관리자</h1>
                        <p>캠퍼스 선택과 동시에 대시보드에 반영됩니다.</p>
                    </div>
                    <div className="da-actions">
                        <button type="button" className="da-ghost-btn" onClick={resetAll}>초기화</button>
                        <button type="button" className="da-ghost-btn" onClick={logout}>로그아웃</button>
                    </div>
                </header>

                <section className="da-status-strip">
                    <div><span>경기 전</span><strong>{counts.ready}</strong></div>
                    <div><span>진행 중</span><strong>{counts.live}</strong></div>
                    <div><span>경기 후</span><strong>{counts.done}</strong></div>
                    <div><span>저장</span><strong>{savedAt || '대기'}</strong></div>
                </section>

                <section className="da-event-list">
                    {events.map((event) => (
                        <EventAdminCard event={event} key={event.id} onChange={changeDivision} />
                    ))}
                </section>
            </div>
        </div>
    );
}
