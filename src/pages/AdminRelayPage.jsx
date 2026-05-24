import { useEffect, useState } from 'react';
import { LIVE_MATCHES, CAMPUS_COLORS, getQuarters } from '../data/data';
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
const SCORE_OPTIONS = [1, 2, 3];
const ALL_CAMPUSES = ['문경', '음성', '세종'];

const DAY_LABEL = {
    '2026-05-28': '5/28 (목)',
    '2026-05-29': '5/29 (금)',
    '2026-05-30': '5/30 (토)',
};

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

function MatchListView({ matches, statesMap, onSelect }) {
    const statusRank = { live: 0, upcoming: 1, finished: 2 };
    const sorted = matches.slice().sort((a, b) => {
        const sa = statesMap[a.id]?.status || 'upcoming';
        const sb = statesMap[b.id]?.status || 'upcoming';
        const r = (statusRank[sa] ?? 9) - (statusRank[sb] ?? 9);
        if (r !== 0) return r;
        if (a.day !== b.day) return a.day < b.day ? -1 : 1;
        if (a.startTime && b.startTime) return a.startTime < b.startTime ? -1 : 1;
        if (a.startTime) return -1;
        if (b.startTime) return 1;
        return 0;
    });

    return (
        <div className="adm-list">
            {sorted.map((m) => {
                const st = statesMap[m.id] || {};
                const status = st.status || 'upcoming';
                return (
                    <div key={m.id} className={`adm-row status-${status}`}>
                        <div className="adm-row-when">
                            <span className="adm-day">{DAY_LABEL[m.day] || m.day}</span>
                            {m.startTime && <span className="adm-time">{m.startTime}</span>}
                        </div>
                        <div className="adm-row-event">
                            <span className="adm-sport">{m.sport}</span>
                            <span className="adm-cat">
                                {m.round} · {m.category}
                            </span>
                        </div>
                        <div className="adm-row-teams">
                            <CampusBadge campus={m.teams.home} size="sm" />
                            <span className="adm-vs">VS</span>
                            <CampusBadge campus={m.teams.away} size="sm" />
                        </div>
                        <div className="adm-row-status">
                            {status === 'live' && (
                                <span className="adm-live-tag">
                                    <span className="adm-live-dot" aria-hidden /> LIVE
                                </span>
                            )}
                            {status === 'finished' && <span className="adm-finished-tag">종료</span>}
                            {status === 'upcoming' && <span className="adm-upcoming-tag">예정</span>}
                            {status === 'live' && (
                                <span className="adm-score-mini">
                                    {st.homeScore || 0} : {st.awayScore || 0}
                                </span>
                            )}
                        </div>
                        <button type="button" className="adm-row-btn" onClick={() => onSelect(m.id)}>
                            중계하기 →
                        </button>
                    </div>
                );
            })}
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
    const [scoreTeam, setScoreTeam] = useState('');
    const [scoreAmount, setScoreAmount] = useState(0);
    const [posting, setPosting] = useState(false);

    const quarters = getQuarters(match.sport);
    const colors = CAMPUS_COLORS[match.teams.home];
    const cardStyle = colors ? { borderTopColor: colors.bg } : {};

    const save = async () => {
        setSaving(true);
        try {
            await onUpdate(match.id, { status, youtubeId: youtubeId || null });
            setDirty(false);
        } catch (e) {
            alert('저장 실패: ' + e.message);
        }
        setSaving(false);
    };

    const quickQuarter = async (q) => {
        try {
            await onUpdate(match.id, { currentQuarter: q || null });
        } catch (err) {
            alert('쿼터 변경 실패: ' + err.message);
        }
    };

    const computeScoreSide = (team) => {
        if (team === match.teams.home) return 'home';
        if (team === match.teams.away) return 'away';
        return null;
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
                const side = computeScoreSide(scoreTeam);
                const baseMsg = `${scoreTeam} ${amount}점 득점!`;
                const fullMsg = extra ? `${baseMsg} ${extra}` : baseMsg;
                // 서버가 score_amount/side 받으면 자동으로 매치 스코어 업데이트.
                await onAddComment(match.id, {
                    type: 'score',
                    content: fullMsg,
                    quarter: state?.currentQuarter || null,
                    scoreTeam,
                    scoreAmount: amount,
                    scoreSide: side,
                });
                // 팀/점수·메시지만 리셋 (쿼터는 매치 상단에서 관리)
                setScoreTeam('');
                setScoreAmount(0);
                setContent('');
            } else {
                await onAddComment(match.id, {
                    type,
                    content: extra,
                    quarter: state?.currentQuarter || null,
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
                        onChange={(e) => {
                            setStatus(e.target.value);
                            setDirty(true);
                        }}
                    >
                        {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="ac-field flex-1">
                    <span>YouTube ID (선택)</span>
                    <input
                        type="text"
                        placeholder="비우면 문자 중계만"
                        value={youtubeId}
                        onChange={(e) => {
                            setYoutubeId(e.target.value);
                            setDirty(true);
                        }}
                    />
                </label>
                <button type="button" className="ac-save" onClick={save} disabled={!dirty || saving}>
                    {saving ? '저장중…' : '저장'}
                </button>
            </div>

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
                        {/* 팀 — 캠퍼스 색 뱃지 */}
                        <div className="ac-msg-pillrow">
                            <span className="ac-pillrow-label">팀</span>
                            <div className="ac-team-pills">
                                <button
                                    type="button"
                                    className={`ac-team-pill is-none ${!scoreTeam ? 'active' : ''}`}
                                    onClick={() => setScoreTeam('')}
                                >
                                    없음
                                </button>
                                {ALL_CAMPUSES.map((c) => {
                                    const cc = CAMPUS_COLORS[c] || {};
                                    const active = scoreTeam === c;
                                    const style = active
                                        ? { background: cc.bg, color: '#fff', borderColor: cc.bg }
                                        : { background: cc.soft, color: cc.bg, borderColor: cc.bg };
                                    return (
                                        <button
                                            key={c}
                                            type="button"
                                            className={`ac-team-pill ${active ? 'active' : ''}`}
                                            style={style}
                                            onClick={() => setScoreTeam(c)}
                                        >
                                            {c}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 점수 + 타입 */}
                        <div className="ac-msg-pillrow">
                            <span className="ac-pillrow-label">점수</span>
                            <div className="ac-score-pick">
                                {SCORE_OPTIONS.map((n) => (
                                    <button
                                        type="button"
                                        key={n}
                                        className={Number(scoreAmount) === n ? 'active' : ''}
                                        onClick={() => setScoreAmount(Number(scoreAmount) === n ? 0 : n)}
                                    >
                                        {n}점
                                    </button>
                                ))}
                            </div>
                            <select
                                className="ac-field-type ac-field-type-right"
                                value={isScoringMode ? 'score' : type}
                                onChange={(e) => setType(e.target.value)}
                                disabled={isScoringMode}
                                aria-label="메시지 타입"
                            >
                                {COMMENT_TYPES.map((t) => (
                                    <option key={t.key} value={t.key}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 메시지 + 전송 */}
                        <div className="ac-msg-row ac-msg-row-2">
                            <input
                                type="text"
                                placeholder={
                                    isScoringMode
                                        ? `자동: "${scoreTeam} ${scoreAmount}점 득점!"  (추가 코멘트 선택)`
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
                            comments
                                .slice()
                                .reverse()
                                .map((c) => (
                                    <div key={c.id} className={`ac-msg type-${c.type}`}>
                                        {c.quarter && <span className="ac-msg-quarter">{c.quarter}</span>}
                                        <span className="ac-msg-type">
                                            {COMMENT_TYPES.find((t) => t.key === c.type)?.label || c.type}
                                        </span>
                                        <span className="ac-msg-content">{c.content}</span>
                                        {c.scoreAmount > 0 && c.scoreSide && (
                                            <span className="ac-msg-score-tag">−{c.scoreAmount}점 롤백</span>
                                        )}
                                        <button
                                            type="button"
                                            className="ac-msg-del"
                                            onClick={() => {
                                                const msg =
                                                    c.scoreAmount > 0 && c.scoreSide
                                                        ? `이 메시지를 삭제하면 ${c.scoreTeam} 점수에서 ${c.scoreAmount}점이 차감됩니다. 계속할까요?`
                                                        : '이 메시지를 삭제할까요?';
                                                if (window.confirm(msg)) {
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
    const [selectedMatchId, setSelectedMatchId] = useState(null);

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

                // 상세 화면이 열려 있는 매치만 코멘트 폴링
                if (selectedMatchId && map[selectedMatchId]?.status === 'live') {
                    try {
                        const cd = await fetchComments(selectedMatchId);
                        if (!cancelled) {
                            setCommentsMap((prev) => ({ ...prev, [selectedMatchId]: cd.comments || [] }));
                        }
                    } catch {
                        /* ignore */
                    }
                }
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
    }, [authed, selectedMatchId]);

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
        // 서버가 점수도 같이 갱신했으니 state 다시 불러오기 위해 짧게 폴링 트리거
        try {
            const data = await fetchLiveStates();
            const map = {};
            for (const row of data.matches || []) map[row.matchId] = row;
            setStatesMap(map);
        } catch {
            /* ignore */
        }
    };

    const onDeleteComment = async (matchId, commentId) => {
        await adminDeleteComment(matchId, commentId);
        setCommentsMap((m) => ({
            ...m,
            [matchId]: (m[matchId] || []).filter((c) => c.id !== commentId),
        }));
        try {
            const data = await fetchLiveStates();
            const map = {};
            for (const row of data.matches || []) map[row.matchId] = row;
            setStatesMap(map);
        } catch {
            /* ignore */
        }
    };

    const logout = () => {
        setStoredPin('');
        setAuthed(false);
    };

    if (!authed) return <PinGate onSuccess={() => setAuthed(true)} />;

    const selectedMatch = selectedMatchId ? LIVE_MATCHES.find((m) => m.id === selectedMatchId) : null;
    const sState = selectedMatchId ? statesMap[selectedMatchId] : null;

    return (
        <div className="page admin-relay-page">
            <div className="ar-inner">
                <header className="ar-head">
                    <div>
                        <div className="ar-eyebrow">ADMIN · LIVE RELAY</div>
                        <h1 className="ar-title">중계 관리 콘솔</h1>
                        <p className="ar-sub">
                            {selectedMatchId
                                ? '매치를 중계하는 중입니다. 메시지 입력 시 점수도 자동 누적됩니다.'
                                : '아래 목록에서 중계할 매치를 선택하세요.'}
                        </p>
                    </div>
                    <button className="ar-logout" onClick={logout}>
                        로그아웃
                    </button>
                </header>

                {!selectedMatch ? (
                    <MatchListView matches={LIVE_MATCHES} statesMap={statesMap} onSelect={setSelectedMatchId} />
                ) : (
                    <>
                        <button type="button" className="back-btn ar-back" onClick={() => setSelectedMatchId(null)}>
                            ← 매치 목록
                        </button>
                        <MatchAdminCard
                            key={`${selectedMatchId}-${sState?.updatedAt || 0}`}
                            match={selectedMatch}
                            state={sState}
                            comments={commentsMap[selectedMatchId] || []}
                            onUpdate={onUpdate}
                            onAddComment={onAddComment}
                            onDeleteComment={onDeleteComment}
                        />
                    </>
                )}
            </div>
        </div>
    );
}
