import { useEffect, useMemo, useState } from 'react';
import { LIVE_MATCHES } from '../data/data';
import {
    CAMPUS,
    CAMPUS_OPTIONS,
    STATE_OPTIONS,
    getCampus,
    getEventDivisions,
    readDashboardEvents,
    resetDashboardEvents,
    updateDivision,
    updateEventWinner,
    writeDashboardEvents,
} from '../lib/dashboardStore';
import {
    getEffectiveDivisionWinnerKey,
    getRelayDisplayState,
    getRelayMatchId,
    getRelayWinnerKey,
    getScorePair,
} from '../lib/dashboardRelay';
import { fetchLiveStates } from '../lib/liveApi';

const ADMIN_PASSWORD = 'gvcs2026';
const RELAY_STATUS_LABELS = {
    upcoming: '경기 전',
    live: '진행중',
    finished: '경기종료',
};

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
                    <p>비밀번호를 입력하면 종목별 경기 결과를 바로 수정할 수 있습니다.</p>
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

function DivisionControl({ event, division, match, relayState, onChange }) {
    const displayState = getRelayDisplayState(division, relayState);
    const winnerKey = getEffectiveDivisionWinnerKey(division, match, relayState);
    const previewCampus = winnerKey === 'pending' ? CAMPUS.live : getCampus(winnerKey);
    const { home, away } = getScorePair(relayState);
    const relayStatus = relayState ? RELAY_STATUS_LABELS[relayState.status] || relayState.status : null;

    return (
        <div className={`da-division-row is-${displayState}`}>
            <div className="da-division-main">
                <strong>{division.label}</strong>
                <span>{relayStatus ? `${relayStatus} · ${home}:${away}` : division.note}</span>
            </div>
            <label>
                <span>상태</span>
                <select
                    value={displayState}
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
                <span>승리 캠퍼스</span>
                <select
                    value={winnerKey === 'pending' ? '' : winnerKey}
                    onChange={(e) => {
                        const winnerKeyValue = e.target.value || 'pending';
                        onChange(event.id, division.id, {
                            winnerKey: winnerKeyValue,
                            state:
                                winnerKeyValue === 'pending'
                                    ? 'ready'
                                    : division.state === 'ready'
                                      ? 'done'
                                      : division.state,
                        });
                    }}
                >
                    <option value="">선택 안 함</option>
                    {CAMPUS_OPTIONS.map((campusOption) => (
                        <option key={campusOption.key} value={campusOption.key}>
                            {campusOption.name}
                        </option>
                    ))}
                </select>
            </label>
            <div className="da-campus-preview">
                <span className={`db-campus-badge ${previewCampus.className} size-sm`}>{previewCampus.name}</span>
            </div>
        </div>
    );
}

function syncDivisionWithRelay(division, liveMatchMap, relayStatesMap) {
    const matchId = getRelayMatchId(division);
    if (!matchId) return division;

    const relayState = relayStatesMap[matchId];
    if (!relayState) return division;

    const match = liveMatchMap[matchId];
    const relayWinnerKey = getRelayWinnerKey(match, relayState);
    const patch = {};

    if (relayState.status === 'live' && division.state !== 'live') {
        patch.state = 'live';
    }

    if (relayState.status === 'finished') {
        if (division.state !== 'done') patch.state = 'done';
        if (relayWinnerKey !== 'pending' && division.winnerKey !== relayWinnerKey) {
            patch.winnerKey = relayWinnerKey;
        }
    }

    return Object.keys(patch).length ? { ...division, ...patch } : division;
}

function syncEventWithRelay(event, liveMatchMap, relayStatesMap) {
    let changed = false;
    const syncDivision = (division) => {
        const next = syncDivisionWithRelay(division, liveMatchMap, relayStatesMap);
        if (next !== division) changed = true;
        return next;
    };

    if (event.groups) {
        const groups = event.groups.map((group) => ({
            ...group,
            divisions: group.divisions.map(syncDivision),
        }));
        return changed ? { ...event, groups } : event;
    }

    const divisions = event.divisions.map(syncDivision);
    return changed ? { ...event, divisions } : event;
}

function EventAdminCard({ event, liveMatchMap, relayStatesMap, onChange, onWinnerChange }) {
    const finalWinnerKey = event.manualWinnerKey || event.winnerKey || 'pending';
    const hasTie = getEventDivisions(event).some((division) => {
        const matchId = getRelayMatchId(division);
        const relayState = matchId ? relayStatesMap[matchId] : null;
        if (relayState?.status !== 'finished') return false;
        const { home, away } = getScorePair(relayState);
        return home === away;
    });

    return (
        <article className="da-event-card">
            <header className="da-event-head">
                <div>
                    <span>{event.status}</span>
                    <h2>{event.sport}</h2>
                    <p>{event.rule}</p>
                </div>
                <label className="da-event-winner">
                    <span>종목 승리 캠퍼스</span>
                    <select
                        value={finalWinnerKey === 'pending' ? '' : finalWinnerKey}
                        onChange={(e) => onWinnerChange(event.id, e.target.value || 'pending')}
                    >
                        <option value="">자동/미정</option>
                        {CAMPUS_OPTIONS.map((campus) => (
                            <option key={campus.key} value={campus.key}>
                                {campus.name}
                            </option>
                        ))}
                    </select>
                    {hasTie && <em className="da-tie-hint">동점: 우승 캠퍼스를 선택하세요</em>}
                </label>
            </header>

            {event.groups ? (
                <div className="da-group-list">
                    {event.groups.map((group) => (
                        <section className="da-group" key={group.id}>
                            <h3>{group.title}</h3>
                            <div className="da-division-list">
                                {group.divisions.map((division) => {
                                    const matchId = getRelayMatchId(division);
                                    return (
                                        <DivisionControl
                                            event={event}
                                            division={division}
                                            key={division.id}
                                            match={liveMatchMap[matchId]}
                                            relayState={relayStatesMap[matchId]}
                                            onChange={onChange}
                                        />
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </div>
            ) : (
                <div className="da-division-list">
                    {event.divisions.map((division) => {
                        const matchId = getRelayMatchId(division);
                        return (
                            <DivisionControl
                                event={event}
                                division={division}
                                key={division.id}
                                match={liveMatchMap[matchId]}
                                relayState={relayStatesMap[matchId]}
                                onChange={onChange}
                            />
                        );
                    })}
                </div>
            )}
        </article>
    );
}

export default function AdminDashboardPage() {
    const [authed, setAuthed] = useState(() => window.sessionStorage.getItem('gvcs-dashboard-admin') === 'ok');
    const [events, setEvents] = useState(() => readDashboardEvents());
    const [relayStatesMap, setRelayStatesMap] = useState({});
    const [savedAt, setSavedAt] = useState('');

    const liveMatchMap = useMemo(() => {
        return LIVE_MATCHES.reduce((acc, match) => {
            acc[match.id] = match;
            return acc;
        }, {});
    }, []);

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

    useEffect(() => {
        if (!authed) return undefined;
        let cancelled = false;

        const pull = async () => {
            try {
                const data = await fetchLiveStates();
                if (cancelled) return;
                const map = {};
                for (const row of data.matches || []) {
                    map[row.matchId] = row;
                }
                setRelayStatesMap(map);
                setEvents((prev) => {
                    let changed = false;
                    const next = prev.map((event) => {
                        const synced = syncEventWithRelay(event, liveMatchMap, map);
                        if (synced !== event) changed = true;
                        return synced;
                    });

                    if (!changed) return prev;
                    writeDashboardEvents(next);
                    return next;
                });
            } catch {
                /* relay API can be temporarily unavailable */
            }
        };

        pull();
        const timer = window.setInterval(pull, 3000);
        return () => {
            cancelled = true;
            window.clearInterval(timer);
        };
    }, [authed, liveMatchMap]);

    const saveEvents = (updater) => {
        setEvents((prev) => {
            const next = updater(prev);
            writeDashboardEvents(next);
            setSavedAt(
                new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            );
            return next;
        });
    };

    const changeDivision = (eventId, divisionId, patch) => {
        saveEvents((prev) => updateDivision(prev, eventId, divisionId, patch));
    };

    const changeEventWinner = (eventId, winnerKey) => {
        saveEvents((prev) => updateEventWinner(prev, eventId, winnerKey));
    };

    const resetAll = () => {
        if (!window.confirm('모든 종목 결과를 경기 전 상태로 완전히 초기화할까요?')) return;
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
                        <p>중계 점수와 관리자 선택이 대시보드에 실시간 반영됩니다.</p>
                    </div>
                    <div className="da-actions">
                        <button type="button" className="da-ghost-btn" onClick={resetAll}>
                            초기화
                        </button>
                        <button type="button" className="da-ghost-btn" onClick={logout}>
                            로그아웃
                        </button>
                    </div>
                </header>

                <section className="da-status-strip">
                    <div>
                        <span>경기 전</span>
                        <strong>{counts.ready}</strong>
                    </div>
                    <div>
                        <span>진행중</span>
                        <strong>{counts.live}</strong>
                    </div>
                    <div>
                        <span>경기종료</span>
                        <strong>{counts.done}</strong>
                    </div>
                    <div>
                        <span>저장</span>
                        <strong>{savedAt || '대기'}</strong>
                    </div>
                </section>

                <section className="da-event-list">
                    {events.map((event) => (
                        <EventAdminCard
                            event={event}
                            key={event.id}
                            liveMatchMap={liveMatchMap}
                            relayStatesMap={relayStatesMap}
                            onChange={changeDivision}
                            onWinnerChange={changeEventWinner}
                        />
                    ))}
                </section>
            </div>
        </div>
    );
}
