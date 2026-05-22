import { useEffect, useState } from 'react';
import { LIVE_MATCHES, CAMPUS_COLORS, getQuarters } from '../data';
import CampusBadge from '../components/CampusBadge';
import {
    adminPing,
    adminUpdateMatch,
    adminAddComment,
    adminDeleteComment,
    fetchLiveStates,
    fetchComments,
    getStoredPin,
    setStoredPin,
} from '../lib/liveApi';

const STATUS_OPTIONS = ['upcoming', 'live', 'finished'];
const COMMENT_TYPES = [
    { key: 'normal', label: '일반' },
    { key: 'score', label: '득점' },
    { key: 'miss', label: '실패' },
    { key: 'sub', label: '교체' },
];

function PinGate({ onSuccess }) {
    const [pin, setPin] = useState('');
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');

    const submit = async (e) => {
        e.preventDefault();
        if (!pin.trim()) return;
        setBusy(true);
        setErr('');
        try {
            const ok = await adminPing(pin.trim());
            if (ok) {
                setStoredPin(pin.trim());
                onSuccess();
            } else {
                setErr('PIN이 올바르지 않습니다.');
            }
        } catch {
            setErr('서버 연결 실패. 잠시 후 다시 시도해주세요.');
        }
        setBusy(false);
    };

    return (
        <div className="admin-gate">
            <div className="admin-gate-card">
                <div className="ag-lock">🔐</div>
                <h1 className="ag-title">관리자 인증</h1>
                <p className="ag-sub">중계 관리자만 접근 가능합니다.</p>
                <form onSubmit={submit} className="ag-form">
                    <input
                        type="password"
                        className="ag-input"
                        placeholder="PIN 입력"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        autoFocus
                    />
                    <button type="submit" className="ag-btn" disabled={busy || !pin.trim()}>
                        {busy ? '확인중…' : '입장'}
                    </button>
                </form>
                {err && <div className="ag-err">{err}</div>}
            </div>
        </div>
    );
}

function MatchAdminCard({ match, state, comments, onUpdate, onAddComment, onDeleteComment }) {
    const [status, setStatus] = useState(state?.status || 'upcoming');
    const [youtubeId, setYoutubeId] = useState(state?.youtubeId || '');
    const [dirty, setDirty] = useState(false);
    const [saving, setSaving] = useState(false);

    const [type, setType] = useState('normal');
    const [content, setContent] = useState('');
    const [msgQuarter, setMsgQuarter] = useState(state?.currentQuarter || '');
    const [scoreTeam, setScoreTeam] = useState('');
    const [scoreAmount, setScoreAmount] = useState('');
    const [posting, setPosting] = useState(false);

    const quarters = getQuarters(match.sport);
    const colors = CAMPUS_COLORS[match.teams.home];
    const cardStyle = colors ? { borderTopColor: colors.bg } : {};

    // 팀 셀렉트는 항상 3캠퍼스, 단 매치의 home/away 와 일치할 때만 점수가 반영됨
    const ALL_CAMPUSES = ['문경', '음성', '세종'];

    const save = async () => {
        setSaving(true);
        try {
            await onUpdate(match.id, {
                status,
                youtubeId: youtubeId || null,
            });
            setDirty(false);
        } catch (e) {
            alert('저장 실패: ' + e.message);
        }
        setSaving(false);
    };

    // 빠른 쿼터 변경 (즉시 서버 반영)
    const quickQuarter = async (q) => {
        try {
            await onUpdate(match.id, { currentQuarter: q || null });
            setMsgQuarter(q || '');
        } catch (err) {
            alert('쿼터 변경 실패: ' + err.message);
        }
    };

    const post = async (e) => {
        e.preventDefault();
        const amount = Number(scoreAmount) || 0;
        const extra = content.trim();
        const isScoring = !!scoreTeam && amount > 0;

        if (!isScoring && !extra) return;

        setPosting(true);
        try {
            if (isScoring) {
                // 1) 점수 업데이트 (선택 팀이 home/away 일 때만)
                const patch = {};
                if (scoreTeam === match.teams.home) {
                    patch.homeScore = (state?.homeScore || 0) + amount;
                } else if (scoreTeam === match.teams.away) {
                    patch.awayScore = (state?.awayScore || 0) + amount;
                }
                if (Object.keys(patch).length > 0) {
                    await onUpdate(match.id, patch);
                }

                // 2) 자동 메시지 (+ 추가 코멘트가 있으면 뒤에 붙임)
                const baseMsg = `${scoreTeam} ${amount}점 득점!`;
                const fullMsg = extra ? `${baseMsg} ${extra}` : baseMsg;
                await onAddComment(match.id, {
                    type: 'score',
                    content: fullMsg,
                    quarter: msgQuarter || null,
                });
                setScoreAmount('');
                setContent('');
            } else {
                await onAddComment(match.id, {
                    type,
                    content: extra,
                    quarter: msgQuarter || null,
                });
                setContent('');
            }
        } catch (err) {
            alert('전송 실패: ' + err.message);
        }
        setPosting(false);
    };

    const isLive = status === 'live';
    const serverHome = state?.homeScore || 0;
    const serverAway = state?.awayScore || 0;
    const isScoringMode = !!scoreTeam && Number(scoreAmount) > 0;

    return (
        <article className={`admin-card ${isLive ? 'is-live' : ''}`} style={cardStyle}>
            <header className="ac-head">
                <div className="ac-meta">
                    <span className="ac-day">{match.day.slice(5)}</span>
                    {match.startTime && <span className="ac-time">{match.startTime}</span>}
                    <span className="ac-sport">{match.sport}</span>
                    <span className="ac-cat">
                        {match.round} · {match.category}
                    </span>
                </div>
                <div className="ac-vs">
                    <CampusBadge campus={match.teams.home} size="sm" />
                    <span className="ac-vs-text">VS</span>
                    <CampusBadge campus={match.teams.away} size="sm" />
                </div>
            </header>

            <div className="ac-controls">
                <label className="ac-field">
                    <span>상태</span>
                    <select
                        value={status}
                        onChange={(e) => { setStatus(e.target.value); setDirty(true); }}
                    >
                        {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </label>
                <label className="ac-field flex-1">
                    <span>YouTube ID (선택)</span>
                    <input
                        type="text"
                        placeholder="비우면 문자 중계만"
                        value={youtubeId}
                        onChange={(e) => { setYoutubeId(e.target.value); setDirty(true); }}
                    />
                </label>
                <button type="button" className="ac-save" onClick={save} disabled={!dirty || saving}>
                    {saving ? '저장중…' : '저장'}
                </button>
            </div>

            {/* 현재 점수 표시 (읽기 전용) + 쿼터 빠른 변경 */}
            <div className="ac-score-summary">
                <span className="ac-score-summary-label">현재 점수</span>
                <div className="ac-score-summary-row">
                    <span className="ac-ss-team">
                        <CampusBadge campus={match.teams.home} size="sm" />
                        <strong>{serverHome}</strong>
                    </span>
                    <span className="ac-ss-sep">:</span>
                    <span className="ac-ss-team">
                        <strong>{serverAway}</strong>
                        <CampusBadge campus={match.teams.away} size="sm" />
                    </span>
                </div>
            </div>

            <div className="ac-quarter-row">
                <span className="ac-quarter-label">현재 쿼터</span>
                <div className="ac-quarter-btns">
                    <button
                        type="button"
                        className={!state?.currentQuarter ? 'active' : ''}
                        onClick={() => quickQuarter(null)}
                    >
                        없음
                    </button>
                    {quarters.map((q) => (
                        <button
                            key={q}
                            type="button"
                            className={state?.currentQuarter === q ? 'active' : ''}
                            onClick={() => quickQuarter(q)}
                        >
                            {q}
                        </button>
                    ))}
                </div>
            </div>

            {isLive && (
                <>
                    <form onSubmit={post} className={`ac-msg-form ${isScoringMode ? 'is-scoring' : ''}`}>
                        <div className="ac-msg-row ac-msg-row-1">
                            <select
                                className="ac-field-quarter"
                                value={msgQuarter}
                                onChange={(e) => setMsgQuarter(e.target.value)}
                                aria-label="쿼터"
                            >
                                <option value="">쿼터 없음</option>
                                {quarters.map((q) => (
                                    <option key={q} value={q}>{q}</option>
                                ))}
                            </select>

                            <select
                                className="ac-field-team"
                                value={scoreTeam}
                                onChange={(e) => setScoreTeam(e.target.value)}
                                aria-label="득점 팀"
                            >
                                <option value="">팀 (득점)</option>
                                {ALL_CAMPUSES.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>

                            <input
                                type="number"
                                className="ac-field-score"
                                placeholder="점수"
                                min="0"
                                max="100"
                                value={scoreAmount}
                                onChange={(e) => setScoreAmount(e.target.value)}
                                aria-label="추가 점수"
                            />

                            <select
                                className="ac-field-type"
                                value={isScoringMode ? 'score' : type}
                                onChange={(e) => setType(e.target.value)}
                                disabled={isScoringMode}
                                aria-label="메시지 타입"
                            >
                                {COMMENT_TYPES.map((t) => (
                                    <option key={t.key} value={t.key}>{t.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="ac-msg-row ac-msg-row-2">
                            <input
                                type="text"
                                placeholder={
                                    isScoringMode
                                        ? `자동 메시지: "${scoreTeam} ${scoreAmount}점 득점!"  (추가 코멘트 선택)`
                                        : '메시지 입력 (Enter 전송)'
                                }
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                            <button type="submit" disabled={posting || (!isScoringMode && !content.trim())}>
                                {posting ? '…' : isScoringMode ? '득점 전송' : '전송'}
                            </button>
                        </div>
                    </form>
                    <div className="ac-feed">
                        {comments.length === 0 ? (
                            <div className="ac-feed-empty">아직 메시지 없음</div>
                        ) : (
                            comments.slice().reverse().map((c) => (
                                <div key={c.id} className={`ac-msg type-${c.type}`}>
                                    {c.quarter && <span className="ac-msg-quarter">{c.quarter}</span>}
                                    <span className="ac-msg-type">
                                        {COMMENT_TYPES.find((t) => t.key === c.type)?.label || c.type}
                                    </span>
                                    <span className="ac-msg-content">{c.content}</span>
                                    <button
                                        type="button"
                                        className="ac-msg-del"
                                        onClick={() => {
                                            if (window.confirm('이 메시지를 삭제할까요?')) {
                                                onDeleteComment(match.id, c.id);
                                            }
                                        }}
                                        aria-label="삭제"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}
        </article>
    );
}

export default function AdminRelayPage() {
    const [authed, setAuthed] = useState(false);
    const [statesMap, setStatesMap] = useState({});
    const [commentsMap, setCommentsMap] = useState({});

    useEffect(() => {
        const stored = getStoredPin();
        if (!stored) return;
        adminPing(stored).then((ok) => {
            if (ok) setAuthed(true);
            else setStoredPin('');
        });
    }, []);

    useEffect(() => {
        if (!authed) return;
        let cancelled = false;

        const pull = async () => {
            try {
                const data = await fetchLiveStates();
                if (cancelled) return;
                const map = {};
                for (const row of data.matches || []) map[row.matchId] = row;
                setStatesMap(map);

                const liveIds = Object.values(map).filter((r) => r.status === 'live').map((r) => r.matchId);
                const newComments = {};
                for (const id of liveIds) {
                    try {
                        const cd = await fetchComments(id);
                        newComments[id] = cd.comments || [];
                    } catch {
                        newComments[id] = commentsMap[id] || [];
                    }
                }
                if (!cancelled) setCommentsMap(newComments);
            } catch {
                /* ignore */
            }
        };

        pull();
        const timer = setInterval(pull, 2500);
        return () => {
            cancelled = true;
            clearInterval(timer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authed]);

    const onUpdate = async (matchId, patch) => {
        const updated = await adminUpdateMatch(matchId, patch);
        setStatesMap((m) => ({ ...m, [matchId]: { ...m[matchId], ...updated } }));
    };

    const onAddComment = async (matchId, comment) => {
        const res = await adminAddComment(matchId, comment);
        setCommentsMap((m) => ({
            ...m,
            [matchId]: [...(m[matchId] || []), res.comment].slice(-200),
        }));
    };

    const onDeleteComment = async (matchId, commentId) => {
        await adminDeleteComment(matchId, commentId);
        setCommentsMap((m) => ({
            ...m,
            [matchId]: (m[matchId] || []).filter((c) => c.id !== commentId),
        }));
    };

    const logout = () => {
        setStoredPin('');
        setAuthed(false);
    };

    if (!authed) return <PinGate onSuccess={() => setAuthed(true)} />;

    return (
        <div className="page admin-relay-page">
            <div className="ar-inner">
                <header className="ar-head">
                    <div>
                        <div className="ar-eyebrow">ADMIN · LIVE RELAY</div>
                        <h1 className="ar-title">중계 관리 콘솔</h1>
                        <p className="ar-sub">상태를 LIVE 로 바꾸면 일반 사용자 화면에서 영상/문자 중계가 활성화됩니다.</p>
                    </div>
                    <button className="ar-logout" onClick={logout}>로그아웃</button>
                </header>

                <div className="ar-grid">
                    {LIVE_MATCHES.map((m) => {
                        const s = statesMap[m.id];
                        const key = `${m.id}-${s?.updatedAt || 0}`;
                        return (
                            <MatchAdminCard
                                key={key}
                                match={m}
                                state={s}
                                comments={commentsMap[m.id] || []}
                                onUpdate={onUpdate}
                                onAddComment={onAddComment}
                                onDeleteComment={onDeleteComment}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
