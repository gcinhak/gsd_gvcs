import { useEffect, useMemo, useState } from 'react';
import {
    CAMPUS,
    CAMPUS_OPTIONS,
    STATE_OPTIONS,
    INITIAL_DASHBOARD_EVENTS,
    getCampus,
    getEventDivisions,
    fetchDashboard,
    saveDivision,
    resetDashboardRemote,
    applyDivisionsToEvents,
} from '../lib/dashboardStore';
import { getRelayMatchId, getScorePair } from '../lib/dashboardRelay';
import { fetchLiveStates, getStoredPin, setStoredPin } from '../lib/liveApi';

const RELAY_STATUS_LABELS = {
    upcoming: '경기 전',
    live: '진행중',
    finished: '경기종료',
};

function PinGate({ onSuccess }) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    const submit = (e) => {
        e.preventDefault();
        if (!pin.trim()) return;
        // PIN 유효성은 첫 저장 시 서버가 검증. 여기서는 저장만.
        setStoredPin(pin.trim());
        onSuccess();
    };

    return (
        <div className="dashboard-admin-page">
            <section className="da-gate">
                <div className="da-gate-card">
                    <span className="da-kicker">DASHBOARD ADMIN</span>
                    <h1>현황판 관리자</h1>
                    <p>관리자 PIN을 입력하면 종목별 경기 결과를 수정할 수 있습니다.</p>
                    <form className="da-login-form" onSubmit={submit}>
                        <input
                            type="password"
                            value={pin}
                            onChange={(e) => {
                                setPin(e.target.value);
                                setError('');
                            }}
                            placeholder="관리자 PIN"
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

function DivisionControl({ division, relayState, onChange }) {
    // 서버에서 병합된 상태/승자 사용
    const displayState = division.state || 'ready';
    const winnerKey = division.winnerKey || 'pending';
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
                <select value={displayState} onChange={(e) => onChange(division, { state: e.target.value })}>
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
                        onChange(division, {
                            winnerKey: winnerKeyValue,
                            state:
                                winnerKeyValue === 'pending'
                                    ? 'ready'
                                    : displayState === 'ready'
                                      ? 'done'
                                      : displayState,
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

function EventAdminCard({ event, relayStatesMap, onChange }) {
    return (
        <article className="da-event-card">
            <header className="da-event-head">
                <div>
                    <span>{event.status}</span>
                    <h2>{event.sport}</h2>
                    <p>{event.rule}</p>
                </div>
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
                                            division={division}
                                            key={division.id}
                                            relayState={matchId ? relayStatesMap[matchId] : null}
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
                                division={division}
                                key={division.id}
                                relayState={matchId ? relayStatesMap[matchId] : null}
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
    const [authed, setAuthed] = useState(() => !!getStoredPin());
    const [events, setEvents] = useState(INITIAL_DASHBOARD_EVENTS);
    const [relayStatesMap, setRelayStatesMap] = useState({});
    const [savedAt, setSavedAt] = useState('');

    const counts = useMemo(() => {
        const divisions = events.flatMap(getEventDivisions);
        return {
            ready: divisions.filter((d) => d.state === 'ready').length,
            live: divisions.filter((d) => d.state === 'live').length,
            done: divisions.filter((d) => d.state === 'done').length,
        };
    }, [events]);

    // 대시보드 결과 로드 (10초마다 폴링)
    const reloadDashboard = async () => {
        try {
            const { divisions } = await fetchDashboard();
            setEvents(applyDivisionsToEvents(INITIAL_DASHBOARD_EVENTS, divisions));
        } catch {
            /* 무시 */
        }
    };

    useEffect(() => {
        if (!authed) return undefined;
        let cancelled = false;
        const load = async () => {
            if (!cancelled) await reloadDashboard();
        };
        load();
        const timer = window.setInterval(load, 10000);
        return () => {
            cancelled = true;
            window.clearInterval(timer);
        };
    }, [authed]);

    // 실시간 경기 점수 폴링 (3초마다)
    useEffect(() => {
        if (!authed) return undefined;
        let cancelled = false;
        const pull = async () => {
            try {
                const data = await fetchLiveStates();
                if (cancelled) return;
                const map = {};
                for (const row of data.matches || []) map[row.matchId] = row;
                setRelayStatesMap(map);
            } catch {
                /* relay API 일시 불가 */
            }
        };
        pull();
        const timer = window.setInterval(pull, 3000);
        return () => {
            cancelled = true;
            window.clearInterval(timer);
        };
    }, [authed]);

    // division 변경 → 서버 저장 (is_manual=1) → 재로드
    const changeDivision = async (division, patch) => {
        const pin = getStoredPin();
        const body = {
            winner_key: patch.winnerKey ?? division.winnerKey ?? 'pending',
            state: patch.state ?? division.state ?? 'ready',
            note: division.note ?? '',
            is_manual: 1,
        };
        try {
            await saveDivision(division.id, body, pin);
            setSavedAt(
                new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            );
            await reloadDashboard();
        } catch (e) {
            if (String(e.message).includes('401')) {
                alert('PIN이 올바르지 않습니다. 다시 로그인해주세요.');
                setStoredPin('');
                setAuthed(false);
            } else {
                alert('저장 실패: ' + e.message);
            }
        }
    };

    const resetAll = async () => {
        if (!window.confirm('모든 종목 결과를 경기 전 상태로 완전히 초기화할까요?')) return;
        const pin = getStoredPin();
        try {
            await resetDashboardRemote(pin);
            setSavedAt('완전 초기화');
            await reloadDashboard();
        } catch (e) {
            alert('초기화 실패: ' + e.message);
        }
    };

    const logout = () => {
        setStoredPin('');
        setAuthed(false);
    };

    if (!authed) return <PinGate onSuccess={() => setAuthed(true)} />;

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
                            relayStatesMap={relayStatesMap}
                            onChange={changeDivision}
                        />
                    ))}
                </section>
            </div>
        </div>
    );
}
