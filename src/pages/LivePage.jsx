import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import CampusBadge from '../components/CampusBadge';
import { LIVE_MATCHES } from '../data';
import { fetchLiveStates } from '../lib/liveApi';

const POLL_MS = 3000;

function dayLabel(day) {
    const map = {
        '2026-05-28': '5/28 (목)',
        '2026-05-29': '5/29 (금)',
        '2026-05-30': '5/30 (토)',
    };
    return map[day] || day;
}

function MatchCard({ match, state }) {
    const status = state?.status || 'upcoming';
    const isLive = status === 'live';
    const isFinished = status === 'finished';

    return (
        <Link to={`/live/${match.id}`} className={`live-card status-${status}`}>
            <div className="lc-head">
                <span className="lc-day">{dayLabel(match.day)}</span>
                {match.startTime && <span className="lc-time">{match.startTime}</span>}
                <span className={`lc-status ${isLive ? 'is-live' : ''}`}>
                    {isLive && <span className="lc-live-dot" aria-hidden />}
                    {isLive ? 'LIVE' : isFinished ? '종료' : '예정'}
                </span>
            </div>
            <div className="lc-body">
                <div className="lc-sport">
                    <span className={`lc-sport-tag round-${match.round === '결선' ? 'final' : 'prelim'}`}>
                        {match.round}
                    </span>
                    <span className="lc-sport-name">{match.sport}</span>
                    <span className="lc-category">{match.category}</span>
                </div>
                <div className="lc-vs">
                    <CampusBadge campus={match.teams.home} size="md" />
                    <span className="lc-vs-text">VS</span>
                    <CampusBadge campus={match.teams.away} size="md" />
                </div>
                <div className="lc-venue">📍 {match.venue}</div>
            </div>
        </Link>
    );
}

export default function LivePage() {
    const [statesMap, setStatesMap] = useState({});
    const [serverState, setServerState] = useState('connecting');

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

    const { live, upcoming, finished } = useMemo(() => {
        const buckets = { live: [], upcoming: [], finished: [] };
        for (const m of LIVE_MATCHES) {
            const s = statesMap[m.id]?.status || 'upcoming';
            buckets[s]?.push(m);
        }
        return buckets;
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
                    description="진행 중인 경기와 곧 시작될 경기를 한눈에 확인하세요."
                />

                {serverState === 'error' && (
                    <div className="live-error">⚠️ 서버 연결 실패. 잠시 후 자동 재시도합니다.</div>
                )}

                {live.length > 0 && (
                    <section className="live-section">
                        <h2 className="live-section-title">
                            <span className="live-section-dot is-live" aria-hidden />
                            현재 LIVE
                            <span className="live-section-count">{live.length}</span>
                        </h2>
                        <div className="live-grid">
                            {live.map((m) => (
                                <MatchCard key={m.id} match={m} state={statesMap[m.id]} />
                            ))}
                        </div>
                    </section>
                )}

                <section className="live-section">
                    <h2 className="live-section-title">
                        <span className="live-section-dot" aria-hidden />
                        예정 경기
                        <span className="live-section-count">{upcoming.length}</span>
                    </h2>
                    {upcoming.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-tag">예정 경기 없음</div>
                            <p>경기가 추가되면 이곳에 자동으로 나타납니다.</p>
                        </div>
                    ) : (
                        <div className="live-grid">
                            {upcoming.map((m) => (
                                <MatchCard key={m.id} match={m} state={statesMap[m.id]} />
                            ))}
                        </div>
                    )}
                </section>

                {finished.length > 0 && (
                    <section className="live-section is-muted">
                        <h2 className="live-section-title">
                            <span className="live-section-dot" aria-hidden />
                            종료된 경기
                            <span className="live-section-count">{finished.length}</span>
                        </h2>
                        <div className="live-grid">
                            {finished.map((m) => (
                                <MatchCard key={m.id} match={m} state={statesMap[m.id]} />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
