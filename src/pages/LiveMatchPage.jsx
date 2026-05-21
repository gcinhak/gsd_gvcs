import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CampusBadge from '../components/CampusBadge';
import { LIVE_MATCHES, CAMPUS_COLORS } from '../data';
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
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
}

function LineupCard({ team, members }) {
    const color = CAMPUS_COLORS[team];
    return (
        <article
            className="lineup-card"
            style={color ? { '--card-tint': color.soft, '--card-accent': color.bg } : {}}
        >
            <header className="lu-head">
                <CampusBadge campus={team} size="lg" />
                <span className="lu-count">{members.length}명</span>
            </header>
            {members.length === 0 ? (
                <div className="lu-empty">라인업 데이터 입력 대기중</div>
            ) : (
                <ul className="lu-list">
                    {members.map((m, i) => (
                        <li key={i} className="lu-row">
                            {m.number != null && <span className="lu-num">{m.number}</span>}
                            <span className="lu-name">{m.name}</span>
                            {m.position && <span className="lu-pos">{m.position}</span>}
                        </li>
                    ))}
                </ul>
            )}
        </article>
    );
}

function CommentaryFeed({ comments }) {
    const scrollRef = useRef(null);
    const lastLengthRef = useRef(0);

    useEffect(() => {
        if (comments.length > lastLengthRef.current && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
        lastLengthRef.current = comments.length;
    }, [comments.length]);

    if (comments.length === 0) {
        return (
            <div className="cf-empty">
                <p>아직 중계 메시지가 없습니다.</p>
                <p className="cf-empty-sub">관리자가 중계를 시작하면 여기에 실시간으로 표시됩니다.</p>
            </div>
        );
    }

    return (
        <div className="cf-list" ref={scrollRef}>
            {comments.map((c) => (
                <div key={c.id} className={`cf-msg type-${c.type || 'normal'}`}>
                    <span className="cf-time">{formatTime(c.ts)}</span>
                    <span className="cf-content">{c.content}</span>
                </div>
            ))}
        </div>
    );
}

export default function LiveMatchPage() {
    const { matchId } = useParams();
    const navigate = useNavigate();
    const match = LIVE_MATCHES.find((m) => m.id === matchId);

    const [state, setState] = useState({ status: 'upcoming', youtubeId: null });
    const [comments, setComments] = useState([]);

    /* state 폴링 */
    useEffect(() => {
        if (!matchId) return;
        let cancelled = false;
        const pull = async () => {
            try {
                const data = await fetchLiveStates();
                if (cancelled) return;
                const row = (data.matches || []).find((r) => r.matchId === matchId);
                if (row) setState({ status: row.status, youtubeId: row.youtubeId || null });
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

    /* comments 폴링 (LIVE 일 때만 자주) */
    useEffect(() => {
        if (!matchId || state.status !== 'live') return;
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
    const youtubeId = state.youtubeId;

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
                        <span className={`lm-status status-${state.status}`}>
                            {isLive && <span className="lm-live-dot" aria-hidden />}
                            {isLive ? 'LIVE' : state.status === 'finished' ? '종료' : '예정'}
                        </span>
                    </div>
                    <h1 className="lm-title">
                        <span className="lm-sport">{match.sport}</span>
                        <span className="lm-cat">
                            {match.round} · {match.category}
                        </span>
                    </h1>
                    <div className="lm-teams">
                        <CampusBadge campus={match.teams.home} size="lg" />
                        <span className="lm-vs">VS</span>
                        <CampusBadge campus={match.teams.away} size="lg" />
                    </div>
                    <div className="lm-venue">📍 {match.venue}</div>
                </header>

                {isLive ? (
                    <div className="lm-live-layout">
                        <div className="lm-video">
                            {youtubeId ? (
                                <div className="video-frame">
                                    <iframe
                                        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                                        title={`${match.sport} ${match.category} 중계`}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                            ) : (
                                <div className="video-placeholder">
                                    <div className="vp-icon">📺</div>
                                    <div className="vp-text">영상 중계 준비중</div>
                                    <div className="vp-sub">관리자가 YouTube 링크를 연결하면 여기에 표시됩니다.</div>
                                </div>
                            )}
                        </div>
                        <aside className="lm-chat">
                            <header className="cf-head">
                                <span className="cf-title">📣 문자 중계</span>
                                <span className="cf-live-badge">
                                    <span className="lm-live-dot" aria-hidden /> LIVE
                                </span>
                            </header>
                            <CommentaryFeed comments={comments} />
                        </aside>
                    </div>
                ) : (
                    <div className="lm-lineup-layout">
                        <div className="lm-pre-banner">
                            <div className="lm-pre-icon">{state.status === 'finished' ? '🏁' : '⏰'}</div>
                            <div className="lm-pre-text">
                                <div className="lm-pre-title">
                                    {state.status === 'finished' ? '경기 종료' : '경기 시작 대기중'}
                                </div>
                                <div className="lm-pre-sub">
                                    {state.status === 'finished'
                                        ? '경기 영상이 추가되면 다시 확인하실 수 있습니다.'
                                        : '아래는 양 팀 라인업입니다. 경기가 시작되면 실시간 중계로 전환됩니다.'}
                                </div>
                            </div>
                        </div>
                        <div className="lineup-grid">
                            <LineupCard team={match.teams.home} members={match.lineup?.home || []} />
                            <LineupCard team={match.teams.away} members={match.lineup?.away || []} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
