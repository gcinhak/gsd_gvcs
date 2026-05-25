import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import CampusBadge from '../components/CampusBadge';
import { LIVE_MATCHES, getQuarters } from '../data/data';
import { fetchComments, fetchLiveStates } from '../lib/liveApi';
import { getSetSummary, isSetMatch } from '../lib/volleyballSets';

const POLL_MS = 3000;

const SPORT_EMOJI = {
    농구: '🏀',
    배구: '🏐',
    축구: '⚽',
    태권도: '🥋',
    탁구: '🏓',
    체스: '♟️',
    계주: '🏃',
    이어달리기: '🏃',
    중거리달리기: '🏃',
    줄다리기: '🪢',
};

function dayLabel(day) {
    const map = {
        '2026-05-28': '5/28 (목)',
        '2026-05-29': '5/29 (금)',
        '2026-05-30': '5/30 (토)',
    };
    return map[day] || day;
}

function MatchCard({ match, state, comments = [] }) {
    const status = state?.status || 'upcoming';
    const isLive = status === 'live';
    const isFinished = status === 'finished';
    const showScore = !!state && (isLive || isFinished);
    const setSummary =
        showScore && isSetMatch(match) ? getSetSummary(comments, match, getQuarters(match.sport), state) : null;
    const hasSetScore = setSummary && (setSummary.home > 0 || setSummary.away > 0);
    const homeScore = hasSetScore ? setSummary.home : state?.homeScore || 0;
    const awayScore = hasSetScore ? setSummary.away : state?.awayScore || 0;

    return (
        <Link to={`/live/${match.id}`} className={`mc status-${status}`}>
            <header className="mc-head">
                {isLive ? (
                    <span className="mc-live">
                        <span className="mc-live-dot" aria-hidden />
                        LIVE
                    </span>
                ) : (
                    <span className={`mc-time-tag ${isFinished ? 'is-finished' : ''}`}>
                        {isFinished ? '종료' : match.startTime ? `${match.startTime} 예정` : '예정'}
                    </span>
                )}
                <span className="mc-day">{dayLabel(match.day)}</span>
            </header>

            <div className="mc-event">
                <span className="mc-sport">
                    <span className="mc-sport-emoji" aria-hidden>
                        {SPORT_EMOJI[match.sport] || '🎽'}
                    </span>
                    <span className="mc-sport-name">{match.sport}</span>
                </span>
                <span className={`mc-round round-${match.round === '결선' ? 'final' : 'prelim'}`}>{match.round}</span>
            </div>

            <div className="mc-teams">
                <div className="mc-team mc-team-home">
                    <CampusBadge campus={match.teams.home} size="md" />
                </div>
                {showScore ? (
                    <div
                        className="mc-scoreline"
                        aria-label={`${match.teams.home} ${homeScore} 대 ${awayScore} ${match.teams.away}`}
                    >
                        <span className="mc-score">{homeScore}</span>
                        <span className="mc-score-colon">:</span>
                        <span className="mc-score">{awayScore}</span>
                    </div>
                ) : (
                    <span className="mc-vs">VS</span>
                )}
                <div className="mc-team mc-team-away">
                    <CampusBadge campus={match.teams.away} size="md" />
                </div>
            </div>

            <div className="mc-category-line">{match.category}</div>
        </Link>
    );
}

export default function LivePage() {
    const [statesMap, setStatesMap] = useState({});
    const [commentsMap, setCommentsMap] = useState({});
    const [serverState, setServerState] = useState('connecting');
    const setMatchIds = useMemo(() => LIVE_MATCHES.filter(isSetMatch).map((match) => match.id), []);

    useEffect(() => {
        let cancelled = false;
        const pull = async () => {
            try {
                const data = await fetchLiveStates();
                if (cancelled) return;
                const map = {};
                for (const row of data.matches || []) map[row.matchId] = row;
                setStatesMap(map);
                setServerState('online');
            } catch {
                if (!cancelled) setServerState('error');
            }
        };
        pull();
        const timer = setInterval(pull, POLL_MS);
        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, []);

    useEffect(() => {
        let cancelled = false;
        const pull = async () => {
            try {
                const activeSetMatches = setMatchIds.filter((matchId) => {
                    const status = statesMap[matchId]?.status;
                    return status === 'live' || status === 'finished';
                });
                if (activeSetMatches.length === 0) {
                    if (!cancelled) setCommentsMap({});
                    return;
                }
                const entries = await Promise.all(
                    activeSetMatches.map(async (matchId) => {
                        const data = await fetchComments(matchId, 0);
                        return [matchId, data.comments || []];
                    })
                );
                if (!cancelled) setCommentsMap(Object.fromEntries(entries));
            } catch {
                /* keep score cards on last known data */
            }
        };
        pull();
        const timer = setInterval(pull, POLL_MS);
        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, [statesMap, setMatchIds]);

    /* LIVE 가 맨 위, 그 다음 시간 순. 종료는 맨 아래. */
    const { live, scheduled, finished } = useMemo(() => {
        const byTime = (a, b) => {
            if (a.day !== b.day) return a.day < b.day ? -1 : 1;
            if (a.startTime && b.startTime) return a.startTime < b.startTime ? -1 : 1;
            if (a.startTime) return -1;
            if (b.startTime) return 1;
            return 0;
        };
        const liveArr = [];
        const upcomingArr = [];
        const finishedArr = [];
        for (const m of LIVE_MATCHES) {
            const st = statesMap[m.id]?.status || 'upcoming';
            if (st === 'live') liveArr.push(m);
            else if (st === 'finished') finishedArr.push(m);
            else upcomingArr.push(m);
        }
        liveArr.sort(byTime);
        upcomingArr.sort(byTime);
        finishedArr.sort(byTime);
        return { live: liveArr, scheduled: upcomingArr, finished: finishedArr };
    }, [statesMap]);

    return (
        <div className="page live-page">
            <div className="live-inner">
                <PageHeader
                    eyebrow={
                        <span className="live-eyebrow">
                            <span className="live-eyebrow-dot" aria-hidden />
                            LIVE BROADCAST
                        </span>
                    }
                    title="실시간 중계"
                    description="진행 중인 경기와 다음 경기를 한눈에 확인하세요."
                />

                {serverState === 'error' && (
                    <div className="live-error">⚠️ 서버 연결 실패. 잠시 후 자동 재시도합니다.</div>
                )}

                {live.length > 0 && (
                    <section className="live-section">
                        <header className="lb-head">
                            <span className="lb-pill is-live">
                                <span className="mc-live-dot" aria-hidden />
                                LIVE {live.length}
                            </span>
                        </header>
                        <div className="mc-grid">
                            {live.map((m) => (
                                <MatchCard
                                    key={m.id}
                                    match={m}
                                    state={statesMap[m.id]}
                                    comments={commentsMap[m.id] || []}
                                />
                            ))}
                        </div>
                    </section>
                )}

                <section className="live-section">
                    <header className="lb-head">
                        <span className="lb-pill">다가오는 경기</span>
                        <span className="lb-total">{scheduled.length}경기</span>
                    </header>
                    {scheduled.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-tag">예정 경기 없음</div>
                            <p>경기가 추가되면 이곳에 자동으로 나타납니다.</p>
                        </div>
                    ) : (
                        <div className="mc-grid">
                            {scheduled.map((m) => (
                                <MatchCard
                                    key={m.id}
                                    match={m}
                                    state={statesMap[m.id]}
                                    comments={commentsMap[m.id] || []}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {finished.length > 0 && (
                    <section className="live-section is-muted">
                        <header className="lb-head">
                            <span className="lb-pill is-finished">종료</span>
                            <span className="lb-total">{finished.length}경기</span>
                        </header>
                        <div className="mc-grid">
                            {finished.map((m) => (
                                <MatchCard
                                    key={m.id}
                                    match={m}
                                    state={statesMap[m.id]}
                                    comments={commentsMap[m.id] || []}
                                />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
