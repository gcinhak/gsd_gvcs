import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CampusBadge from '../components/CampusBadge';
import { LIVE_MATCHES, CAMPUS_COLORS, getQuarters } from '../data/data';
import { getLineupForMatch } from '../data/lineup';
import { fetchLiveStates, fetchComments } from '../lib/liveApi';

const POLL_STATE_MS = 3000;
const POLL_COMMENT_MS = 2000;

function dayLabel(day) {
    const map = {
        '2026-05-28': '5/28 (목)',
        '2026-05-29': '5/29 (금)',
        '2026-05-30': '5/30 (토)',
    };
    return map[day] || day;
}

function formatTime(ts) {
    if (!ts) return '';
    const d = new Date(ts * 1000);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
}

function sortByGrade(arr) {
    // 학년 높은 순(12 → 7), 학년 없는 인원은 맨 아래
    return arr.slice().sort((a, b) => {
        const ga = a.grade ?? -Infinity;
        const gb = b.grade ?? -Infinity;
        return gb - ga;
    });
}

function LineupCard({ team, members }) {
    const color = CAMPUS_COLORS[team];
    const starters = sortByGrade(members.filter((m) => !m.bench));
    const bench = sortByGrade(members.filter((m) => m.bench));

    return (
        <article className="lineup-card" style={color ? { '--card-tint': color.soft, '--card-accent': color.bg } : {}}>
            <header className="lu-head">
                <CampusBadge campus={team} size="lg" />
                <span className="lu-count">
                    {starters.length}명{bench.length > 0 && ` · 후보 ${bench.length}`}
                </span>
            </header>
            {members.length === 0 ? (
                <div className="lu-empty">라인업 데이터 입력 대기중</div>
            ) : (
                <ul className="lu-list">
                    {starters.map((m, i) => (
                        <li key={`s-${i}`} className="lu-row">
                            {/* 번호는 정식 등번호 들어오면 다시 노출 */}
                            {m.grade != null && <span className="lu-grade">{m.grade}</span>}
                            <span className="lu-name">{m.name}</span>
                            {m.role && <span className="lu-role">{m.role}</span>}
                            {m.alt && <span className="lu-alt">{m.alt}</span>}
                            {m.position && <span className="lu-pos">{m.position}</span>}
                        </li>
                    ))}
                    {bench.length > 0 && <li className="lu-divider">후보</li>}
                    {bench.map((m, i) => (
                        <li key={`b-${i}`} className="lu-row is-bench">
                            {m.grade != null && <span className="lu-grade">{m.grade}</span>}
                            <span className="lu-name">{m.name}</span>
                            {m.role && <span className="lu-role">{m.role}</span>}
                            {m.alt && <span className="lu-alt">{m.alt}</span>}
                        </li>
                    ))}
                </ul>
            )}
        </article>
    );
}

function CommentaryFeed({ comments }) {
    if (comments.length === 0) {
        return (
            <div className="cf-empty">
                <p>이 쿼터의 중계 메시지가 없습니다.</p>
                <p className="cf-empty-sub">관리자가 중계를 시작하면 여기에 실시간으로 표시됩니다.</p>
            </div>
        );
    }

    // 최신이 맨 위로
    const ordered = comments.slice().reverse();

    return (
        <div className="cf-list">
            {ordered.map((c) => (
                <div key={c.id} className={`cf-msg type-${c.type || 'normal'}`}>
                    {c.quarter && <span className="cf-quarter">{c.quarter}</span>}
                    <span className="cf-time">{formatTime(c.ts)}</span>
                    <span className="cf-content">{c.content}</span>
                </div>
            ))}
        </div>
    );
}

function ScoreHeader({ match, state }) {
    const home = match.teams.home;
    const away = match.teams.away;
    const isLive = state.status === 'live';
    const isFinished = state.status === 'finished';
    const isUpcoming = state.status === 'upcoming';

    return (
        <div className={`scoreboard status-${state.status}`}>
            <div className="sb-status">
                {isLive && (
                    <span className="sb-live-tag">
                        <span className="lm-live-dot" aria-hidden /> LIVE
                    </span>
                )}
                {isFinished && <span className="sb-status-tag">종료</span>}
                {isUpcoming && <span className="sb-status-tag is-upcoming">예정</span>}
                {state.currentQuarter && <span className="sb-quarter-tag">{state.currentQuarter}</span>}
            </div>
            <div className="sb-row">
                <div className="sb-team">
                    <CampusBadge campus={home} size="lg" />
                </div>
                <div className="sb-score">
                    <span className="sb-num">{state.homeScore || 0}</span>
                    <span className="sb-sep">:</span>
                    <span className="sb-num">{state.awayScore || 0}</span>
                </div>
                <div className="sb-team sb-team-away">
                    <CampusBadge campus={away} size="lg" />
                </div>
            </div>
        </div>
    );
}

function QuarterTabs({ quarters, selected, onSelect, counts }) {
    return (
        <div className="qt-tabs">
            <button
                type="button"
                className={`qt-tab ${selected === '__all' ? 'active' : ''}`}
                onClick={() => onSelect('__all')}
            >
                전체
                <span className="qt-tab-count">{counts.__all || 0}</span>
            </button>
            {quarters.map((q) => (
                <button
                    key={q}
                    type="button"
                    className={`qt-tab ${selected === q ? 'active' : ''}`}
                    onClick={() => onSelect(q)}
                >
                    {q}
                    {counts[q] > 0 && <span className="qt-tab-count">{counts[q]}</span>}
                </button>
            ))}
        </div>
    );
}

export default function LiveMatchPage() {
    const { matchId } = useParams();
    const navigate = useNavigate();
    const match = LIVE_MATCHES.find((m) => m.id === matchId);

    const [state, setState] = useState({
        status: 'upcoming',
        youtubeId: null,
        homeScore: 0,
        awayScore: 0,
        currentQuarter: null,
    });
    const [comments, setComments] = useState([]);
    const [selectedQuarter, setSelectedQuarter] = useState('__all');

    /* state 폴링 */
    useEffect(() => {
        if (!matchId) return;
        let cancelled = false;
        const pull = async () => {
            try {
                const data = await fetchLiveStates();
                if (cancelled) return;
                const row = (data.matches || []).find((r) => r.matchId === matchId);
                if (row) {
                    setState({
                        status: row.status,
                        youtubeId: row.youtubeId || null,
                        homeScore: Number(row.homeScore) || 0,
                        awayScore: Number(row.awayScore) || 0,
                        currentQuarter: row.currentQuarter || null,
                    });
                }
            } catch {
                /* ignore */
            }
        };
        pull();
        const timer = setInterval(pull, POLL_STATE_MS);
        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, [matchId]);

    /* comments 폴링 (LIVE / 종료 일 때) */
    useEffect(() => {
        if (!matchId) return;
        if (state.status === 'upcoming') return;
        let cancelled = false;
        const pull = async () => {
            try {
                const data = await fetchComments(matchId, 0);
                if (cancelled) return;
                setComments(data.comments || []);
            } catch {
                /* ignore */
            }
        };
        pull();
        const timer = setInterval(pull, POLL_COMMENT_MS);
        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, [matchId, state.status]);

    const quarters = match ? getQuarters(match.sport) : ['전체'];

    // 매번 계산해도 가벼움 — React Compiler 가 알아서 최적화하도록
    const counts = { __all: comments.length };
    for (const q of quarters) counts[q] = 0;
    for (const m of comments) {
        if (m.quarter && counts[m.quarter] != null) counts[m.quarter]++;
    }
    const filteredComments =
        selectedQuarter === '__all' ? comments : comments.filter((m) => m.quarter === selectedQuarter);

    if (!match) {
        return (
            <div className="page live-match-page">
                <div className="lm-inner">
                    <button className="back-btn" onClick={() => navigate('/live')}>
                        ← LIVE 목록
                    </button>
                    <div className="empty-state">
                        <div className="empty-tag">매치 없음</div>
                        <p>요청하신 매치를 찾을 수 없습니다.</p>
                    </div>
                </div>
            </div>
        );
    }

    const isLive = state.status === 'live';
    const isUpcoming = state.status === 'upcoming';
    const hasVideo = !!state.youtubeId;
    const hasCommentary = comments.length > 0;
    const showRelayUi = isLive || (state.status === 'finished' && hasCommentary);

    return (
        <div className="page live-match-page">
            <div className="lm-inner">
                <button className="back-btn" onClick={() => navigate('/live')}>
                    ← LIVE 목록
                </button>

                <header className="lm-head">
                    <div className="lm-meta">
                        <span className="lm-day">{dayLabel(match.day)}</span>
                        {match.startTime && <span className="lm-time">{match.startTime}</span>}
                        <span className="lm-cat-label">
                            {match.sport} · {match.round} · {match.category}
                        </span>
                    </div>
                    <ScoreHeader match={match} state={state} />
                    <div className="lm-venue">📍 {match.venue}</div>
                </header>

                {showRelayUi ? (
                    <div className={`lm-live-layout ${!hasVideo ? 'no-video' : ''}`}>
                        {hasVideo && (
                            <div className="lm-video">
                                <div className="video-frame">
                                    <iframe
                                        src={`https://www.youtube.com/embed/${state.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                                        title={`${match.sport} ${match.category} 중계`}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                            </div>
                        )}
                        <aside className="lm-chat">
                            <header className="cf-head">
                                <span className="cf-title">📣 문자 중계</span>
                                {isLive && (
                                    <span className="cf-live-badge">
                                        <span className="lm-live-dot" aria-hidden /> LIVE
                                    </span>
                                )}
                            </header>
                            <QuarterTabs
                                quarters={quarters}
                                selected={selectedQuarter}
                                onSelect={setSelectedQuarter}
                                counts={counts}
                            />
                            <CommentaryFeed comments={filteredComments} />
                        </aside>
                    </div>
                ) : (
                    <div className="lm-lineup-layout">
                        <div className="lm-pre-banner">
                            <div className="lm-pre-icon">{isUpcoming ? '⏰' : '🏁'}</div>
                            <div className="lm-pre-text">
                                <div className="lm-pre-title">{isUpcoming ? '경기 시작 대기중' : '경기 종료'}</div>
                                <div className="lm-pre-sub">
                                    {isUpcoming
                                        ? '아래는 양 팀 라인업입니다. 경기가 시작되면 실시간 중계로 전환됩니다.'
                                        : '중계 기록이 없습니다.'}
                                </div>
                            </div>
                        </div>
                        <div className="lineup-grid">
                            <LineupCard
                                team={match.teams.home}
                                members={
                                    match.lineup?.home && match.lineup.home.length > 0
                                        ? match.lineup.home
                                        : getLineupForMatch(match.teams.home, match.sport, match.category)
                                }
                            />
                            <LineupCard
                                team={match.teams.away}
                                members={
                                    match.lineup?.away && match.lineup.away.length > 0
                                        ? match.lineup.away
                                        : getLineupForMatch(match.teams.away, match.sport, match.category)
                                }
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
