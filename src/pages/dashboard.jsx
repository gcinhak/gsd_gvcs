import { useEffect, useMemo, useState } from 'react';
import {
    CAMPUS_OPTIONS,
    DASHBOARD_CHANGE_EVENT,
    getCampus,
    getEventDivisions,
    readDashboardEvents,
} from '../lib/dashboardStore';
import { fetchComments, fetchLiveStates } from '../lib/liveApi';
import { LIVE_MATCHES } from '../data';

const DIVISION_RELAY_MATCHES = {
    'soccer-high-men': 'sat-fb-4',
    'soccer-mid-men': 'sat-fb-2',
    'soccer-mix-women': 'sat-fb-3',
    'basketball-high-men': 'thu-bb-4',
    'basketball-mid-men': 'thu-bb-3',
    'basketball-mix-women': 'thu-bb-2',
    'volleyball-high-men': 'fri-vb-6',
    'volleyball-mid-men': 'fri-vb-4',
    'volleyball-mix-women': 'fri-vb-5',
    'tk-sparring-mid': 'sat-tk-1',
    'tk-sparring-high': 'sat-tk-2',
};

const STATUS_LABELS = {
    upcoming: '경기 전',
    live: '진행 중',
    finished: '경기 후',
};

function getRelayMatchId(division) {
    return division.relayMatchId || DIVISION_RELAY_MATCHES[division.id] || null;
}

function formatRelayScore(state) {
    if (!state || state.status === 'upcoming') return '';
    return `${Number(state.homeScore) || 0} : ${Number(state.awayScore) || 0}`;
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

function ResultCell({ division, match, relayState, onOpen }) {
    const state = division.state || 'ready';
    const displayState = relayState?.status === 'live'
        ? 'live'
        : relayState?.status === 'finished'
            ? 'done'
            : state;
    const campus = getCampus(division.winnerKey);
    const score = formatRelayScore(relayState);

    return (
        <button
            type="button"
            className={`db-result-cell is-${displayState} ${campus.className}`}
            onClick={onOpen}
            aria-label={`${division.label} 점수 상세 보기`}
        >
            <span className="db-division-label">{division.label}</span>
            {displayState === 'live' && <span className="db-live-label">LIVE</span>}
            {score && <span className="db-result-score">{score}</span>}
            {match && relayState?.currentQuarter && (
                <span className="db-result-quarter">{relayState.currentQuarter}</span>
            )}
            <CampusBadge campus={campus} size="sm" />
        </button>
    );
}

function TaekwondoGroups({ groups, liveMatchMap, relayStatesMap, onOpenDetail }) {
    const divisions = groups.flatMap((group) => group.divisions);

    return (
        <div className="db-taekwondo-groups">
            {divisions.map((division) => {
                const matchId = getRelayMatchId(division);
                const match = matchId ? liveMatchMap[matchId] : null;

                return (
                    <ResultCell
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
                        <span className={`db-detail-status status-${status}`}>
                            {STATUS_LABELS[status] || status}
                        </span>
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

                {match ? (
                    <div className="db-detail-score">
                        <span>{match.teams.home}</span>
                        <strong>{score || '0 : 0'}</strong>
                        <span>{match.teams.away}</span>
                    </div>
                ) : (
                    <div className="db-detail-empty">연결된 admin relay 경기가 아직 없습니다.</div>
                )}

                {relayState?.currentQuarter && (
                    <div className="db-detail-quarter">현재 구간: {relayState.currentQuarter}</div>
                )}

                <div className="db-detail-feed">
                    <div className="db-detail-feed-title">점수 상세 내역</div>
                    {loading ? (
                        <div className="db-detail-empty">중계 기록을 불러오는 중입니다.</div>
                    ) : comments.length > 0 ? (
                        comments.slice().reverse().map((comment) => (
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
    const [events, setEvents] = useState(() => readDashboardEvents());
    const [relayStatesMap, setRelayStatesMap] = useState({});
    const [relayCommentsMap, setRelayCommentsMap] = useState({});
    const [selectedDetail, setSelectedDetail] = useState(null);

    const liveMatchMap = useMemo(() => {
        return LIVE_MATCHES.reduce((acc, match) => {
            acc[match.id] = match;
            return acc;
        }, {});
    }, []);

    useEffect(() => {
        const sync = () => setEvents(readDashboardEvents());
        window.addEventListener('storage', sync);
        window.addEventListener(DASHBOARD_CHANGE_EVENT, sync);
        return () => {
            window.removeEventListener('storage', sync);
            window.removeEventListener(DASHBOARD_CHANGE_EVENT, sync);
        };
    }, []);

    useEffect(() => {
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
            } catch {
                /* Keep the board usable when relay API is temporarily unavailable. */
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
                    {events.map((event) => {
                        const hasLive = getEventDivisions(event).some((division) => {
                            const matchId = getRelayMatchId(division);
                            return division.state === 'live' || relayStatesMap[matchId]?.status === 'live';
                        });

                        return (
                            <article className={`db-event-card event-${event.id} ${hasLive ? 'has-live' : ''}`} key={event.id}>
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
                                    <TaekwondoGroups
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
                                                    division={division}
                                                    key={division.id}
                                                    match={match}
                                                    relayState={matchId ? relayStatesMap[matchId] : null}
                                                    onOpen={() => setSelectedDetail({ event, division, matchId, match })}
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
                    selectedDetail?.matchId
                    && !Object.prototype.hasOwnProperty.call(relayCommentsMap, selectedDetail.matchId)
                )}
                onClose={() => setSelectedDetail(null)}
            />
        </div>
    );
}
