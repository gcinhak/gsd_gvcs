import { useEffect, useMemo, useState } from 'react';
import {
    CAMPUS_OPTIONS,
    CAMPUS,
    INITIAL_DASHBOARD_EVENTS,
    getCampus,
    getEventDivisions,
    fetchDashboard,
    applyDivisionsToEvents,
} from '../lib/dashboardStore';
import { fetchComments, fetchLiveStates } from '../lib/liveApi';
import { LIVE_MATCHES } from '../data/data';
import { getRelayMatchId, getScorePair } from '../lib/dashboardRelay';

const STATUS_LABELS = {
    upcoming: '경기 전',
    live: '진행 중',
    finished: '경기 종료',
};

function formatRelayScore(state) {
    if (!state || state.status === 'upcoming') return '';
    return `${Number(state.homeScore) || 0} : ${Number(state.awayScore) || 0}`;
}

function formatDashboardScore(event, division, state) {
    const { home, away } = getScorePair(state);
    return `${home}:${away}`;
}

function shouldShowDashboardScore(event, division) {
    if (
        event.id === 'middle-distance' ||
        event.id === 'relay' ||
        event.id === 'table-tennis' ||
        event.id === 'chess' ||
        event.id === 'tug-of-war'
    )
        return false;
    if (event.id === 'taekwondo' && !division.id.includes('sparring')) return false;
    return true;
}

function formatMatchup(match) {
    if (!match?.teams?.home || !match?.teams?.away) return '';
    return `${match.teams.home} VS ${match.teams.away}`;
}

function getPendingMatchup(event, division, match) {
    const relayMatchup = formatMatchup(match);
    if (relayMatchup) return relayMatchup;
    if (event.id === 'middle-distance' || event.id === 'relay') return '문경 VS 음성 VS 세종';
    if (event.id === 'taekwondo' && !division.id.includes('sparring')) return '문경 VS 음성 VS 세종';
    return '문경 VS 음성';
}

function getMatchupCampusClass(name) {
    if (name.includes('문경')) return 'campus-mungyeong';
    if (name.includes('음성')) return 'campus-eumseong';
    if (name.includes('세종')) return 'campus-sejong';
    return 'campus-pending';
}

function MatchupPills({ matchup }) {
    const teams = matchup.split(' VS ').filter(Boolean);
    if (teams.length < 2) return <span className="db-matchup-line">{matchup}</span>;
    const sizeClass = teams.length >= 3 ? 'is-triple' : 'is-double';

    return (
        <span className={`db-matchup-line db-matchup-pills ${sizeClass}`}>
            {teams.map((team, index) => (
                <span className="db-matchup-item" key={`${team}-${index}`}>
                    {index > 0 && <span className="db-matchup-vs">VS</span>}
                    <span className={`db-matchup-campus ${getMatchupCampusClass(team)}`}>{team}</span>
                </span>
            ))}
        </span>
    );
}

function formatDashboardDate(date) {
    const pad = (value) => String(value).padStart(2, '0');
    const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} (${weekday})`;
}

function formatDashboardTime(date) {
    const pad = (value) => String(value).padStart(2, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatCommentTime(ts) {
    if (!ts) return '';
    const date = new Date(ts);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

function CampusBadge({ campus, size = 'md' }) {
    return <span className={`db-campus-badge ${campus.className} size-${size}`}>{campus.name}</span>;
}

function getCellBadgeCampus(winnerKey, displayState) {
    if (winnerKey !== 'pending') return getCampus(winnerKey);
    if (displayState === 'live') return CAMPUS.live;
    return getCampus('pending');
}

function ResultCell({ event, division, match, relayState, onOpen }) {
    // displayState와 winnerKey는 서버에서 이미 병합된 값 사용
    const displayState = division.state || 'ready';
    const winnerKey = division.winnerKey || 'pending';
    const campus = getCellBadgeCampus(winnerKey, displayState);
    const finalScore = formatDashboardScore(event, division, relayState);
    const showScore = shouldShowDashboardScore(event, division);
    const matchup = getPendingMatchup(event, division, match);
    const hasWinner = winnerKey !== 'pending';
    const isActive = displayState === 'live' || displayState === 'done';

    const parts = matchup.split(' VS ');
    const homeName = match?.teams?.home ?? parts[0] ?? '문경';
    const awayName = match?.teams?.away ?? parts[1] ?? '음성';

    return (
        <button
            type="button"
            className={`db-result-cell is-${displayState} ${campus.className}`}
            onClick={onOpen}
            aria-label={`${division.label} 점수 상세 보기`}
        >
            <span className="db-division-label">{division.label}</span>
            {displayState === 'live' && <span className="db-live-label">LIVE</span>}

            {showScore && isActive ? (
                <div className="db-score-with-teams">
                    <span className="db-team-name db-team-home">{homeName}</span>
                    <span className="db-final-score-box">{finalScore}</span>
                    <span className="db-team-name db-team-away">{awayName}</span>
                </div>
            ) : showScore ? (
                <span className="db-final-score-box">{finalScore}</span>
            ) : null}

            {isActive ? (
                hasWinner && <CampusBadge campus={campus} size="sm" />
            ) : hasWinner ? (
                <CampusBadge campus={campus} size="sm" />
            ) : (
                <MatchupPills matchup={matchup} />
            )}
        </button>
    );
}

function TaekwondoGroups({ event, groups, liveMatchMap, relayStatesMap, onOpenDetail }) {
    const divisions = groups.flatMap((group) => group.divisions);

    return (
        <div className="db-taekwondo-groups">
            {divisions.map((division) => {
                const matchId = getRelayMatchId(division);
                const match = matchId ? liveMatchMap[matchId] : null;

                return (
                    <ResultCell
                        event={event}
                        division={division}
                        key={division.id}
                        match={match}
                        relayState={matchId ? relayStatesMap[matchId] : null}
                        onOpen={() => onOpenDetail({ division, matchId, match })}
                    />
                );
            })}
        </div>
    );
}

function getEventContext(event) {
    const divisions = getEventDivisions(event);
    const isDone = divisions.length > 0 && divisions.every((d) => d.state === 'done');
    const isLive = divisions.some((d) => d.state === 'live');
    const winnerKey = event.manualWinnerKey || getLeadingCampusFromDivisions(divisions);
    return { divisions, isDone, isLive, winnerKey };
}

function getLeadingCampusFromDivisions(divisions) {
    const scores = CAMPUS_OPTIONS.reduce((acc, campus) => ({ ...acc, [campus.key]: 0 }), {});
    for (const div of divisions) {
        if (div.state !== 'done') continue;
        if (scores[div.winnerKey] === undefined) continue;
        scores[div.winnerKey] += 1;
    }
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    if (sorted[0][1] === 0) return 'pending';
    if (sorted[0][1] === sorted[1][1]) return 'pending';
    return sorted[0][0];
}

function getCampusWinCounts(events) {
    const counts = CAMPUS_OPTIONS.reduce((acc, campus) => ({ ...acc, [campus.key]: 0 }), {});
    for (const event of events) {
        const context = getEventContext(event);
        if (!context.isDone) continue;
        if (counts[context.winnerKey] === undefined) continue;
        counts[context.winnerKey] += 1;
    }
    return counts;
}

function ScoreDetailModal({ detail, relayState, comments, loading, onClose }) {
    if (!detail) return null;

    const { division, match } = detail;
    const score = formatRelayScore(relayState);
    const status = relayState?.status || 'upcoming';

    return (
        <div className="db-detail-backdrop" onMouseDown={onClose}>
            <section
                className="db-detail-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="db-detail-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <header className="db-detail-head">
                    <div>
                        <span className={`db-detail-status status-${status}`}>{STATUS_LABELS[status] || status}</span>
                        <h2 id="db-detail-title">{division.label}</h2>
                        {match && (
                            <p>
                                {match.sport} · {match.round} · {match.category}
                            </p>
                        )}
                    </div>
                    <button type="button" className="db-detail-close" onClick={onClose} aria-label="닫기">
                        ×
                    </button>
                </header>

                {match && score ? (
                    <div className="db-detail-score">
                        <span>{match.teams.home}</span>
                        <strong>{score || '0 : 0'}</strong>
                        <span>{match.teams.away}</span>
                    </div>
                ) : null}

                {relayState?.currentQuarter && (
                    <div className="db-detail-quarter">현재 구간: {relayState.currentQuarter}</div>
                )}

                <div className="db-detail-feed">
                    <div className="db-detail-feed-title">점수 상세 내역</div>
                    {loading ? (
                        <div className="db-detail-empty">중계 기록을 불러오는 중입니다.</div>
                    ) : comments.length > 0 ? (
                        comments
                            .slice()
                            .reverse()
                            .map((comment) => (
                                <article className={`db-detail-comment type-${comment.type}`} key={comment.id}>
                                    <div className="db-detail-comment-meta">
                                        {comment.quarter && <span>{comment.quarter}</span>}
                                        <span>{comment.type === 'score' ? '득점' : '기록'}</span>
                                        {formatCommentTime(comment.ts) && <time>{formatCommentTime(comment.ts)}</time>}
                                    </div>
                                    <p>{comment.content}</p>
                                </article>
                            ))
                    ) : (
                        <div className="db-detail-empty">아직 등록된 상세 기록이 없습니다.</div>
                    )}
                </div>
            </section>
        </div>
    );
}

export default function DashboardPage() {
    const [events, setEvents] = useState(INITIAL_DASHBOARD_EVENTS);
    const [relayStatesMap, setRelayStatesMap] = useState({});
    const [relayCommentsMap, setRelayCommentsMap] = useState({});
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [now, setNow] = useState(() => new Date());

    const liveMatchMap = useMemo(() => {
        return LIVE_MATCHES.reduce((acc, match) => {
            acc[match.id] = match;
            return acc;
        }, {});
    }, []);

    // 서버에서 대시보드 결과 로드 (10초마다 폴링)
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const { divisions } = await fetchDashboard();
                if (!cancelled) {
                    setEvents(applyDivisionsToEvents(INITIAL_DASHBOARD_EVENTS, divisions));
                }
            } catch {
                /* 서버 연결 실패 시 기존 상태 유지 */
            }
        };
        load();
        const timer = window.setInterval(load, 10000);
        return () => {
            cancelled = true;
            window.clearInterval(timer);
        };
    }, []);

    // 실시간 경기 점수 폴링 (4초마다)
    useEffect(() => {
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
        const timer = window.setInterval(pull, 4000);
        return () => {
            cancelled = true;
            window.clearInterval(timer);
        };
    }, []);

    useEffect(() => {
        const timer = window.setInterval(() => setNow(new Date()), 1000);
        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!selectedDetail?.matchId) return;
        let cancelled = false;
        const matchId = selectedDetail.matchId;
        fetchComments(matchId)
            .then((data) => {
                if (cancelled) return;
                setRelayCommentsMap((prev) => ({ ...prev, [matchId]: data.comments || [] }));
            })
            .catch(() => {
                if (cancelled) return;
                setRelayCommentsMap((prev) => ({ ...prev, [matchId]: [] }));
            });
        return () => {
            cancelled = true;
        };
    }, [selectedDetail]);

    const stats = useMemo(() => {
        const allDivisions = events.flatMap(getEventDivisions);
        return {
            total: allDivisions.length,
            done: allDivisions.filter((d) => d.state === 'done').length,
            live: allDivisions.filter((d) => d.state === 'live').length,
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

                <div className="db-campus-scoreboard" aria-label="캠퍼스별 종목 우승 개수">
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
                    <time className="db-live-clock" dateTime={now.toISOString()}>
                        <span className="db-live-time">{formatDashboardTime(now)}</span>
                        <span className="db-live-date">{formatDashboardDate(now)}</span>
                    </time>
                    <span className="db-live-summary">
                        {stats.done}/{stats.total} 완료 · {stats.live} 진행
                    </span>
                </div>
            </section>

            <section className="db-board" aria-label="종목별 결과 현황">
                <div className="db-event-list">
                    {events.map((event) => {
                        const context = getEventContext(event);
                        const isChampion = context.isDone && context.winnerKey !== 'pending';
                        const eventCampus = isChampion ? getCampus(context.winnerKey) : getCampus('pending');

                        return (
                            <article
                                className={`db-event-card event-${event.id} ${context.isLive ? 'has-live' : ''} ${isChampion ? `is-champion ${eventCampus.className}` : ''}`}
                                key={event.id}
                            >
                                <div className="db-event-top">
                                    <div className="db-event-title-row">
                                        <h2>{event.sport}</h2>
                                        <span className="db-event-status">{event.status}</span>
                                    </div>
                                    {isChampion && (
                                        <div className="db-winner-box is-final">
                                            <CampusBadge campus={eventCampus} size="sm" />
                                        </div>
                                    )}
                                </div>

                                {event.groups ? (
                                    <TaekwondoGroups
                                        event={event}
                                        groups={event.groups}
                                        liveMatchMap={liveMatchMap}
                                        relayStatesMap={relayStatesMap}
                                        onOpenDetail={(detail) => setSelectedDetail({ ...detail, event })}
                                    />
                                ) : (
                                    <div className="db-result-grid">
                                        {event.divisions.map((division) => {
                                            const matchId = getRelayMatchId(division);
                                            const match = matchId ? liveMatchMap[matchId] : null;
                                            return (
                                                <ResultCell
                                                    event={event}
                                                    division={division}
                                                    key={division.id}
                                                    match={match}
                                                    relayState={matchId ? relayStatesMap[matchId] : null}
                                                    onOpen={() =>
                                                        setSelectedDetail({ event, division, matchId, match })
                                                    }
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </div>
            </section>
            <ScoreDetailModal
                detail={selectedDetail}
                relayState={selectedDetail?.matchId ? relayStatesMap[selectedDetail.matchId] : null}
                comments={selectedDetail?.matchId ? relayCommentsMap[selectedDetail.matchId] || [] : []}
                loading={Boolean(
                    selectedDetail?.matchId &&
                    !Object.prototype.hasOwnProperty.call(relayCommentsMap, selectedDetail.matchId)
                )}
                onClose={() => setSelectedDetail(null)}
            />
        </div>
    );
}
