import { useEffect, useState } from 'react';
import { RELAY_MATCHES, SCORING_MATCHES, CAMPUS_COLORS, getQuarters } from '../data/data';
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
import {
    VOLLEYBALL_SET_END_TEXT,
    getSetSummary,
    getSetTargetWins,
    isSetMatch,
    isWinnerOnlySetMatch,
} from '../lib/volleyballSets';

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

function SetPanel({ match, state, comments }) {
    const sets = getQuarters(match.sport);
    const summary = getSetSummary(comments, match, sets, state);

    return (
        <div className="ac-volley-sets">
            <div className="ac-volley-sets-head">
                <span>{isWinnerOnlySetMatch(match) ? '세트별 승리' : '세트별 점수'}</span>
                <strong>
                    {match.teams.home} {summary.home} : {summary.away} {match.teams.away}
                </strong>
            </div>
            <div className="ac-volley-set-list">
                {summary.rows.map((set) => (
                    <div key={set.label} className={`ac-volley-set ${set.winnerSide ? 'is-decided' : ''}`}>
                        <span className="ac-volley-set-label">{set.label}</span>
                        <span className="ac-volley-set-score">
                            {set.home} : {set.away}
                        </span>
                        <span className="ac-volley-set-winner">
                            {set.winnerTeam ? <CampusBadge campus={set.winnerTeam} size="sm" /> : '진행/대기'}
                        </span>
                    </div>
                ))}
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
    const [scoreTeam, setScoreTeam] = useState('');
    const [scoreAmount, setScoreAmount] = useState(0);
    const [posting, setPosting] = useState(false);
    const [pendingSetEnd, setPendingSetEnd] = useState(false);

    const quarters = getQuarters(match.sport);
    const colors = CAMPUS_COLORS[match.teams.home];
    const cardStyle = colors ? { borderTopColor: colors.bg } : {};

    const save = async () => {
        setSaving(true);
        try {
            await onUpdate(match.id, {
                status,
                youtubeId: youtubeId || null,
                homeTeam: match.teams.home, // data.js의 팀 이름
                awayTeam: match.teams.away,
            });
            setDirty(false);
        } catch (e) {
            alert('저장 실패: ' + e.message);
        }
        setSaving(false);
    };

    const quickQuarter = async (q) => {
        try {
            await onUpdate(match.id, { currentQuarter: q || null });
            // 다른 세트로 옮겨가면 대기 중인 세트 종료는 자동 취소
            setPendingSetEnd(false);
        } catch (err) {
            alert('쿼터 변경 실패: ' + err.message);
        }
    };

    /** 세트 종료 버튼을 누르면 즉시 전송하지 않고, 다음 전송이 세트 종료가 되도록 큐잉만 한다. */
    const queueOrCancelSetEnd = () => {
        if (pendingSetEnd) {
            setPendingSetEnd(false);
            return;
        }
        if (!setSummary || !state?.currentQuarter) return;
        const winnerOnlySetMatchLocal = isWinnerOnlySetMatch(match);
        const cur = setSummary.rows.find((row) => row.label === state.currentQuarter);
        if (!cur || cur.isEnded) return;
        if (winnerOnlySetMatchLocal && !scoreTeam) {
            alert('세트 승리 캠퍼스를 먼저 선택해주세요.');
            return;
        }
        if (!winnerOnlySetMatchLocal && cur.home === cur.away) {
            alert('동점 세트는 종료할 수 없습니다.');
            return;
        }
        setPendingSetEnd(true);
    };

    /** 실제 세트 종료 전송 — post()에서 pendingSetEnd가 true일 때 호출. */
    const submitSetEnd = async () => {
        if (!setSummary || !state?.currentQuarter) return false;
        const winnerOnlySetMatchLocal = isWinnerOnlySetMatch(match);
        const cur = setSummary.rows.find((row) => row.label === state.currentQuarter);
        if (!cur || cur.isEnded) {
            setPendingSetEnd(false);
            return false;
        }
        if (winnerOnlySetMatchLocal && !scoreTeam) {
            alert('세트 승리 캠퍼스를 먼저 선택해주세요.');
            return false;
        }
        if (!winnerOnlySetMatchLocal && cur.home === cur.away) {
            alert('동점 세트는 종료할 수 없습니다.');
            return false;
        }
        const winnerTeam = winnerOnlySetMatchLocal
            ? scoreTeam
            : cur.home > cur.away
                ? match.teams.home
                : match.teams.away;
        const winnerSide = computeScoreSide(winnerTeam);
        const nextHome = setSummary.home + (winnerSide === 'home' ? 1 : 0);
        const nextAway = setSummary.away + (winnerSide === 'away' ? 1 : 0);
        const targetWins = getSetTargetWins(match);
        const shouldFinish = targetWins > 0 && (nextHome >= targetWins || nextAway >= targetWins);
        const extra = content.trim();
        const baseMsg = `${state.currentQuarter} ${VOLLEYBALL_SET_END_TEXT}: ${winnerTeam} 승`;
        const fullMsg = extra ? `${baseMsg} ${extra}` : baseMsg;
        try {
            await onAddComment(match.id, {
                type: 'normal',
                content: fullMsg,
                quarter: state.currentQuarter,
                scoreTeam: winnerOnlySetMatchLocal ? winnerTeam : undefined,
                scoreAmount: winnerOnlySetMatchLocal ? 1 : undefined,
                scoreSide: winnerOnlySetMatchLocal ? winnerSide : undefined,
            });
            if (shouldFinish) {
                await onUpdate(match.id, { status: 'finished', currentQuarter: null });
                setStatus('finished');
            }
            setScoreTeam('');
            setContent('');
            setPendingSetEnd(false);
            return true;
        } catch (err) {
            alert('세트 종료 저장 실패: ' + err.message);
            return false;
        }
    };

    const computeScoreSide = (team) => {
        if (team === match.teams.home) return 'home';
        if (team === match.teams.away) return 'away';
        return null;
    };

    const post = async (e) => {
        e.preventDefault();

        // 세트 종료가 큐잉돼 있으면 전송 = 세트 종료 확정
        if (pendingSetEnd) {
            setPosting(true);
            await submitSetEnd();
            setPosting(false);
            return;
        }

        const amount = Number(scoreAmount) || 0;
        const extra = content.trim();
        const isScoring = !isWinnerOnlySetMatch(match) && !!scoreTeam && amount > 0;

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
    const winnerOnlySetMatch = isWinnerOnlySetMatch(match);
    const isScoringMode = !winnerOnlySetMatch && !!scoreTeam && Number(scoreAmount) > 0;
    const setSummary = isSetMatch(match)
        ? getSetSummary(comments, match, quarters, state)
        : null;
    const hasSetScore = setSummary && (setSummary.home > 0 || setSummary.away > 0);
    const displayHome = hasSetScore ? setSummary.home : serverHome;
    const displayAway = hasSetScore ? setSummary.away : serverAway;
    const currentSet = setSummary?.rows.find((row) => row.label === state?.currentQuarter);
    const selectableCampuses = winnerOnlySetMatch ? [match.teams.home, match.teams.away] : ALL_CAMPUSES;
    const canCloseCurrentSet =
        Boolean(currentSet) &&
        !currentSet.isEnded &&
        (winnerOnlySetMatch
            ? Boolean(computeScoreSide(scoreTeam))
            : currentSet.home !== currentSet.away && (currentSet.home > 0 || currentSet.away > 0));

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
                <span className="ac-score-summary-label">{setSummary ? '세트 스코어' : '현재 점수'}</span>
                <div className="ac-score-summary-row">
                    <span className="ac-ss-team">
                        <CampusBadge campus={match.teams.home} size="sm" />
                        <strong>{displayHome}</strong>
                    </span>
                    <span className="ac-ss-sep">:</span>
                    <span className="ac-ss-team">
                        <strong>{displayAway}</strong>
                        <CampusBadge campus={match.teams.away} size="sm" />
                    </span>
                </div>
            </div>

            {setSummary && <SetPanel match={match} state={state} comments={comments} />}

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
                    {setSummary && state?.currentQuarter && (
                        <button
                            type="button"
                            className={`ac-set-end-btn ${pendingSetEnd ? 'is-pending' : ''}`}
                            onClick={queueOrCancelSetEnd}
                            disabled={(!canCloseCurrentSet && !pendingSetEnd) || posting}
                            title={pendingSetEnd ? '취소하려면 다시 클릭' : '다음 전송이 세트 종료로 처리됩니다'}
                        >
                            {pendingSetEnd ? '세트 종료 대기 (전송 누르면 확정)' : '세트 종료'}
                        </button>
                    )}
                </div>
            </div>

            {isLive && (
                <>
                    <form onSubmit={post} className={`ac-msg-form ${isScoringMode ? 'is-scoring' : ''}`}>
                        {/* 팀 — 캠퍼스 색 뱃지 */}
                        <div className="ac-msg-pillrow">
                            <span className="ac-pillrow-label">{winnerOnlySetMatch ? '세트 승리' : '팀'}</span>
                            <div className="ac-team-pills">
                                <button
                                    type="button"
                                    className={`ac-team-pill is-none ${!scoreTeam ? 'active' : ''}`}
                                    onClick={() => setScoreTeam('')}
                                >
                                    없음
                                </button>
                                {selectableCampuses.map((c) => {
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
                            <span className="ac-pillrow-label">{winnerOnlySetMatch ? '입력' : '점수'}</span>
                            {winnerOnlySetMatch ? (
                                <div className="ac-score-pick">
                                    <span className="ac-set-input-hint">승리 캠퍼스 선택 후 세트 종료</span>
                                </div>
                            ) : (
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
                            )}
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
                            <button
                                type="submit"
                                disabled={posting || (!pendingSetEnd && !isScoringMode && !content.trim())}
                            >
                                {posting ? '…' : pendingSetEnd ? '세트 종료 전송' : isScoringMode ? '득점 전송' : '전송'}
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

/* ────────────────────────────────────────────────────────────
   채점제(태권체조·품새) — 경기 끝나면 3 캠퍼스 점수 한번에 입력
──────────────────────────────────────────────────────────── */
function ScoringMatchCard({ match, state, comments = [], onAddComment, onUpdate }) {
    // 이미 저장된 score 코멘트에서 캠퍼스별 점수 추출
    const existingScores = {};
    for (const c of comments) {
        if (c?.scoreTeam && c?.scoreAmount != null) {
            existingScores[c.scoreTeam] = Number(c.scoreAmount);
        }
    }

    const [scores, setScores] = useState(() => ({
        문경: existingScores['문경'] ?? '',
        음성: existingScores['음성'] ?? '',
        세종: existingScores['세종'] ?? '',
    }));
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const isFinished = state?.status === 'finished';

    const setOne = (campus, val) => {
        setSaved(false);
        setScores((s) => ({ ...s, [campus]: val }));
    };

    const winnerCampus = (() => {
        let win = null;
        let max = -Infinity;
        for (const c of ALL_CAMPUSES) {
            const n = Number(scores[c]);
            if (!Number.isFinite(n)) continue;
            if (n > max) {
                max = n;
                win = c;
            }
        }
        return max > -Infinity ? win : null;
    })();

    const submit = async () => {
        const entries = ALL_CAMPUSES.map((c) => ({ campus: c, score: Number(scores[c]) }))
            .filter((e) => Number.isFinite(e.score) && e.score !== 0);
        if (entries.length === 0) {
            alert('점수를 1개 이상 입력해주세요.');
            return;
        }
        setSaving(true);
        try {
            for (const { campus, score } of entries) {
                await onAddComment(match.id, {
                    type: 'score',
                    content: `${campus} ${score}점`,
                    scoreTeam: campus,
                    scoreAmount: score,
                });
            }
            await onUpdate(match.id, { status: 'finished' });
            setSaved(true);
        } catch (err) {
            alert('저장 실패: ' + err.message);
        }
        setSaving(false);
    };

    return (
        <article className={`scoring-card ${isFinished ? 'is-finished' : ''}`}>
            <header className="scoring-head">
                <div className="scoring-meta">
                    <span className="scoring-day">{match.day.slice(5)}</span>
                    {match.startTime && <span className="scoring-time">{match.startTime}</span>}
                    <span className="scoring-cat">{match.sport} · {match.category}</span>
                </div>
                <span className={`scoring-status ${isFinished ? 'is-finished' : ''}`}>
                    {isFinished ? '완료' : '대기'}
                </span>
            </header>
            <div className="scoring-inputs">
                {ALL_CAMPUSES.map((c) => {
                    const cc = CAMPUS_COLORS[c] || {};
                    const isWinner = winnerCampus === c && Number(scores[c]) > 0;
                    return (
                        <label key={c} className={`scoring-input ${isWinner ? 'is-winner' : ''}`}
                               style={{ '--c': cc.bg, '--c-soft': cc.soft }}>
                            <span className="scoring-input-label">{c}</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={scores[c]}
                                onChange={(e) => setOne(c, e.target.value)}
                                disabled={saving}
                                placeholder="0"
                            />
                            {isWinner && <span className="scoring-trophy">🏆</span>}
                        </label>
                    );
                })}
            </div>
            <div className="scoring-foot">
                {saved && <span className="scoring-saved">✓ 저장됨</span>}
                <button
                    type="button"
                    className="scoring-save"
                    onClick={submit}
                    disabled={saving}
                >
                    {saving ? '저장중…' : isFinished ? '재저장' : '저장 (결과 확정)'}
                </button>
            </div>
        </article>
    );
}

function ScoringPanel({ matches, statesMap, commentsMap, onAddComment, onUpdate }) {
    if (matches.length === 0) {
        return <div className="empty-state"><p>채점제 종목이 없습니다.</p></div>;
    }
    return (
        <div className="scoring-grid">
            {matches.map((m) => (
                <ScoringMatchCard
                    key={m.id}
                    match={m}
                    state={statesMap[m.id]}
                    comments={commentsMap[m.id] || []}
                    onAddComment={onAddComment}
                    onUpdate={onUpdate}
                />
            ))}
        </div>
    );
}

export default function AdminRelayPage() {
    const [authed, setAuthed] = useState(false);
    const [statesMap, setStatesMap] = useState({});
    const [commentsMap, setCommentsMap] = useState({});
    const [selectedMatchId, setSelectedMatchId] = useState(null);
    const [tab, setTab] = useState('relay'); // 'relay' | 'scoring'

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
                if (selectedMatchId && map[selectedMatchId]?.status !== 'upcoming') {
                    try {
                        const cd = await fetchComments(selectedMatchId);
                        if (!cancelled) {
                            setCommentsMap((prev) => ({ ...prev, [selectedMatchId]: cd.comments || [] }));
                        }
                    } catch {
                        /* ignore */
                    }
                }

                // 채점제 탭에서는 모든 scoring 매치의 코멘트를 로드 (점수 표시용)
                if (tab === 'scoring') {
                    for (const sm of SCORING_MATCHES) {
                        if (map[sm.id]?.status === 'upcoming') continue;
                        try {
                            const cd = await fetchComments(sm.id);
                            if (cancelled) return;
                            setCommentsMap((prev) => ({ ...prev, [sm.id]: cd.comments || [] }));
                        } catch {
                            /* ignore */
                        }
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
    }, [authed, selectedMatchId, tab]);

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

    const selectedMatch = selectedMatchId ? RELAY_MATCHES.find((m) => m.id === selectedMatchId) : null;
    const sState = selectedMatchId ? statesMap[selectedMatchId] : null;

    return (
        <div className="page admin-relay-page">
            <div className="ar-inner">
                <header className="ar-head">
                    <div>
                        <div className="ar-eyebrow">ADMIN · LIVE RELAY</div>
                        <h1 className="ar-title">중계 관리 콘솔</h1>
                        <p className="ar-sub">
                            {tab === 'scoring'
                                ? '채점제 종목(태권체조·품새)은 경기 끝나고 캠퍼스별 점수를 한번에 입력하세요.'
                                : selectedMatchId
                                    ? '매치를 중계하는 중입니다. 메시지 입력 시 점수도 자동 누적됩니다.'
                                    : '아래 목록에서 중계할 매치를 선택하세요.'}
                        </p>
                    </div>
                    <button className="ar-logout" onClick={logout}>
                        로그아웃
                    </button>
                </header>

                <div className="ar-tabs">
                    <button
                        type="button"
                        className={`ar-tab ${tab === 'relay' ? 'active' : ''}`}
                        onClick={() => setTab('relay')}
                    >
                        📺 문자 중계
                    </button>
                    <button
                        type="button"
                        className={`ar-tab ${tab === 'scoring' ? 'active' : ''}`}
                        onClick={() => {
                            setTab('scoring');
                            setSelectedMatchId(null);
                        }}
                    >
                        🥋 채점제 입력
                    </button>
                </div>

                {tab === 'scoring' ? (
                    <ScoringPanel
                        matches={SCORING_MATCHES}
                        statesMap={statesMap}
                        commentsMap={commentsMap}
                        onAddComment={onAddComment}
                        onUpdate={onUpdate}
                    />
                ) : !selectedMatch ? (
                    <MatchListView matches={RELAY_MATCHES} statesMap={statesMap} onSelect={setSelectedMatchId} />
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
