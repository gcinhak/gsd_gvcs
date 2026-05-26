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

    /** 상태 변경 즉시 반영 — 점수·YouTube 입력 없이도 가능 */
    const updateStatus = async (next) => {
        if (next === status) return;
        setStatus(next);
        try {
            await onUpdate(match.id, {
                status: next,
                homeTeam: match.teams.home,
                awayTeam: match.teams.away,
            });
        } catch (e) {
            alert('상태 변경 실패: ' + e.message);
            setStatus(status); // 롤백
        }
    };

    /** YouTube ID만 따로 저장 (상태는 위에서 즉시 반영됨) */
    const save = async () => {
        setSaving(true);
        try {
            await onUpdate(match.id, {
                youtubeId: youtubeId || null,
                homeTeam: match.teams.home,
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
                        onChange={(e) => updateStatus(e.target.value)}
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
   채점제(태권체조·품새 / 중거리 등) — 경기 끝나면 점수 한번에 입력
──────────────────────────────────────────────────────────── */

const STATUS_PILLS = [
    { key: 'upcoming', label: '예정' },
    { key: 'live', label: 'LIVE' },
    { key: 'finished', label: '완료' },
];

/** 모든 scoring 카드 헤더에 공용으로 들어가는 상태 픽커. 클릭 시 즉시 서버 반영. */
function StatusPicker({ matchId, currentStatus, onUpdate }) {
    const [pending, setPending] = useState(null);
    const status = pending || currentStatus || 'upcoming';
    const set = async (e, key) => {
        e.stopPropagation(); // 카드 expand 토글 방지
        if (key === status) return;
        setPending(key);
        try {
            await onUpdate(matchId, { status: key });
        } catch (err) {
            alert('상태 변경 실패: ' + err.message);
        } finally {
            setPending(null);
        }
    };
    return (
        <span
            className="scoring-status-picker"
            role="group"
            aria-label="경기 상태"
            onClick={(e) => e.stopPropagation()}
        >
            {STATUS_PILLS.map((p) => (
                <button
                    key={p.key}
                    type="button"
                    className={`ssp-pill ssp-${p.key} ${status === p.key ? 'active' : ''}`}
                    onClick={(e) => set(e, p.key)}
                    aria-pressed={status === p.key}
                >
                    {p.key === 'live' && status === 'live' && <span className="ssp-live-dot" aria-hidden />}
                    {p.label}
                </button>
            ))}
        </span>
    );
}

const PLACEMENT_POINTS = [20, 15, 10, 7, 5]; // 1등~5등
const FINISHER_POINT = 2; // 완주한 그 외 선수

function PlacementScoringCard({ match, state, comments = [], onAddComment, onUpdate }) {
    const [participants, setParticipants] = useState({ 문경: '', 음성: '', 세종: '' });
    const [placements, setPlacements] = useState(['', '', '', '', '']);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [open, setOpen] = useState(false);
    const isFinished = state?.status === 'finished';

    // 이미 저장된 점수가 있으면 collapsed 칩으로 보여주기 위해 추출
    const savedTotals = {};
    for (const c of comments) {
        if (c?.scoreTeam && c?.scoreAmount != null) {
            savedTotals[c.scoreTeam] = Number(c.scoreAmount);
        }
    }

    const totals = ALL_CAMPUSES.reduce((acc, c) => {
        let pts = 0;
        let placedCount = 0;
        placements.forEach((pickedCampus, idx) => {
            if (pickedCampus === c) {
                pts += PLACEMENT_POINTS[idx] ?? 0;
                placedCount += 1;
            }
        });
        const totalParticipants = Number(participants[c]) || 0;
        const others = Math.max(0, totalParticipants - placedCount);
        pts += others * FINISHER_POINT;
        acc[c] = pts;
        return acc;
    }, {});

    const winnerCampus = (() => {
        let win = null;
        let max = -Infinity;
        for (const c of ALL_CAMPUSES) {
            if (totals[c] > max && totals[c] > 0) {
                max = totals[c];
                win = c;
            }
        }
        return win;
    })();

    const setPart = (c, v) => {
        setSaved(false);
        setParticipants((s) => ({ ...s, [c]: v }));
    };
    const setRank = (idx, c) => {
        setSaved(false);
        setPlacements((arr) => {
            const next = [...arr];
            next[idx] = next[idx] === c ? '' : c;
            return next;
        });
    };

    const submit = async () => {
        const entries = ALL_CAMPUSES.map((c) => ({ campus: c, score: totals[c] }))
            .filter((e) => e.score > 0);
        if (entries.length === 0) {
            alert('점수가 0점입니다. 출전 인원이나 순위를 먼저 입력해주세요.');
            return;
        }
        const rankSummary = placements
            .map((c, i) => (c ? `${i + 1}등 ${c}` : null))
            .filter(Boolean)
            .join(', ');
        setSaving(true);
        try {
            for (const { campus, score } of entries) {
                await onAddComment(match.id, {
                    type: 'score',
                    content: `${campus} 합계 ${score}점${rankSummary ? ` · ${rankSummary}` : ''}`,
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
        <article className={`scoring-card placement-card ${isFinished ? 'is-finished' : ''} ${open ? 'is-open' : 'is-collapsed'}`}>
            <button
                type="button"
                className="scoring-head-btn"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
            >
                <div className="scoring-meta">
                    <span className="scoring-day">{match.day.slice(5)}</span>
                    {match.startTime && <span className="scoring-time">{match.startTime}</span>}
                    <span className="scoring-cat">{match.sport} · {match.category}</span>
                </div>
                <div className="scoring-head-right">
                    {!open && isFinished && Object.keys(savedTotals).length > 0 && (
                        <span className="scoring-mini-totals">
                            {ALL_CAMPUSES.map((c) => (
                                <span key={c} className="scoring-mini-total" style={{ '--c': CAMPUS_COLORS[c]?.bg }}>
                                    {c} {savedTotals[c] ?? 0}
                                </span>
                            ))}
                        </span>
                    )}
                    <StatusPicker matchId={match.id} currentStatus={state?.status} onUpdate={onUpdate} />
                    <span className={`scoring-chevron ${open ? 'is-open' : ''}`} aria-hidden>▾</span>
                </div>
            </button>

            {open && <>
            <div className="pl-rule">
                1등 20 · 2등 15 · 3등 10 · 4등 7 · 5등 5 · 그 외 완주 2점
            </div>

            <div className="pl-participants">
                <div className="pl-section-title">캠퍼스별 출전 인원</div>
                <div className="pl-participants-row">
                    {ALL_CAMPUSES.map((c) => {
                        const cc = CAMPUS_COLORS[c] || {};
                        return (
                            <label key={c} className="pl-participants-cell" style={{ '--c': cc.bg, '--c-soft': cc.soft }}>
                                <span className="pl-pc-label">{c}</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={participants[c]}
                                    onChange={(e) => setPart(c, e.target.value)}
                                    placeholder="0"
                                    disabled={saving}
                                />
                            </label>
                        );
                    })}
                </div>
            </div>

            <div className="pl-ranks">
                <div className="pl-section-title">순위 (1~5등)</div>
                {placements.map((picked, idx) => (
                    <div key={idx} className="pl-rank-row">
                        <span className="pl-rank-label">
                            <strong>{idx + 1}등</strong>
                            <span className="pl-rank-pts">+{PLACEMENT_POINTS[idx]}</span>
                        </span>
                        <div className="pl-rank-pills">
                            {ALL_CAMPUSES.map((c) => {
                                const cc = CAMPUS_COLORS[c] || {};
                                const active = picked === c;
                                const style = active
                                    ? { background: cc.bg, color: '#fff', borderColor: cc.bg }
                                    : { background: cc.soft, color: cc.bg, borderColor: cc.bg };
                                return (
                                    <button
                                        key={c}
                                        type="button"
                                        className={`pl-rank-pill ${active ? 'active' : ''}`}
                                        style={style}
                                        onClick={() => setRank(idx, c)}
                                        disabled={saving}
                                    >
                                        {c}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div className="pl-totals">
                <div className="pl-section-title">합계</div>
                <div className="pl-totals-row">
                    {ALL_CAMPUSES.map((c) => {
                        const cc = CAMPUS_COLORS[c] || {};
                        const isWinner = winnerCampus === c;
                        return (
                            <div
                                key={c}
                                className={`pl-total-cell ${isWinner ? 'is-winner' : ''}`}
                                style={{ '--c': cc.bg, '--c-soft': cc.soft }}
                            >
                                <span className="pl-total-camp">{c}</span>
                                <span className="pl-total-num">{totals[c]}</span>
                                {isWinner && <span className="scoring-trophy">🏆</span>}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="scoring-foot">
                {saved && <span className="scoring-saved">✓ 저장됨</span>}
                <button type="button" className="scoring-save" onClick={submit} disabled={saving}>
                    {saving ? '저장중…' : isFinished ? '재저장' : '저장 (결과 확정)'}
                </button>
            </div>
            </>}
        </article>
    );
}

function ScoringMatchCard({ match, state, comments = [], onAddComment, onUpdate }) {
    const props = { match, state, comments, onAddComment, onUpdate };
    if (match.scoringType === 'placements') return <PlacementScoringCard {...props} />;
    if (match.scoringType === 'firstPlace') return <FirstPlaceScoringCard {...props} />;
    if (match.scoringType === 'sets') return <SetsScoringCard {...props} />;
    if (match.scoringType === 'tableTennis') return <TableTennisScoringCard {...props} />;
    if (match.scoringType === 'chess') return <ChessScoringCard {...props} />;
    return <SimpleScoringCard {...props} />;
}

/* 탁구: 세트별 캠퍼스 점수 입력 (11점 3세트) */
function TableTennisScoringCard({ match, state, comments = [], onAddComment, onUpdate }) {
    const setCount = match.setCount || 3;
    const maxScore = match.setMaxScore || 11;

    // 저장된 데이터 복원: quarter='1세트', scoreTeam, scoreAmount
    const savedSets = Array.from({ length: setCount }, () => ({ 문경: '', 음성: '', 세종: '' }));
    for (const c of comments) {
        if (!c?.quarter || !c?.scoreTeam) continue;
        const m = String(c.quarter).match(/^(\d+)세트$/);
        if (!m) continue;
        const i = Number(m[1]) - 1;
        if (i < 0 || i >= setCount) continue;
        if (ALL_CAMPUSES.includes(c.scoreTeam)) {
            savedSets[i][c.scoreTeam] = Number(c.scoreAmount) || 0;
        }
    }

    const [sets, setSets] = useState(savedSets);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [open, setOpen] = useState(false);
    const isFinished = state?.status === 'finished';

    const updateScore = (setIdx, campus, val) => {
        setSaved(false);
        setSets((arr) => {
            const next = arr.map((s) => ({ ...s }));
            next[setIdx][campus] = val;
            return next;
        });
    };

    // 세트별 승자 + 매치 승자 계산
    const setWinners = sets.map((s) => {
        let win = null;
        let max = -1;
        let count = 0;
        for (const c of ALL_CAMPUSES) {
            const n = Number(s[c]);
            if (!Number.isFinite(n) || n <= 0) continue;
            if (n > max) {
                max = n;
                win = c;
                count = 1;
            } else if (n === max) {
                count += 1;
            }
        }
        return count === 1 ? win : null;
    });

    const setWinsByCampus = {};
    for (const w of setWinners) {
        if (!w) continue;
        setWinsByCampus[w] = (setWinsByCampus[w] || 0) + 1;
    }
    const matchWinner = (() => {
        const targetWins = Math.ceil(setCount / 2);
        for (const c of ALL_CAMPUSES) {
            if ((setWinsByCampus[c] || 0) >= targetWins) return c;
        }
        return null;
    })();

    const submit = async () => {
        const anyEntered = sets.some((s) => ALL_CAMPUSES.some((c) => Number(s[c]) > 0));
        if (!anyEntered) {
            alert('세트 점수를 1개 이상 입력해주세요.');
            return;
        }
        setSaving(true);
        try {
            for (let i = 0; i < setCount; i++) {
                for (const c of ALL_CAMPUSES) {
                    const n = Number(sets[i][c]);
                    if (!Number.isFinite(n) || n <= 0) continue;
                    await onAddComment(match.id, {
                        type: 'score',
                        content: `${i + 1}세트 ${c} ${n}점`,
                        quarter: `${i + 1}세트`,
                        scoreTeam: c,
                        scoreAmount: n,
                    });
                }
            }
            await onUpdate(match.id, { status: 'finished' });
            setSaved(true);
        } catch (err) {
            alert('저장 실패: ' + err.message);
        }
        setSaving(false);
    };

    return (
        <article className={`scoring-card placement-card ${isFinished ? 'is-finished' : ''} ${open ? 'is-open' : 'is-collapsed'}`}>
            <button type="button" className="scoring-head-btn" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
                <div className="scoring-meta">
                    <span className="scoring-day">{match.day.slice(5)}</span>
                    {match.startTime && <span className="scoring-time">{match.startTime}</span>}
                    <span className="scoring-cat">{match.sport} · {match.category}</span>
                </div>
                <div className="scoring-head-right">
                    {!open && isFinished && matchWinner && (
                        <span className="scoring-mini-totals">
                            <span className="scoring-mini-total" style={{ '--c': CAMPUS_COLORS[matchWinner]?.bg }}>
                                🏆 {matchWinner} ({setWinsByCampus[matchWinner] || 0}세트)
                            </span>
                        </span>
                    )}
                    <StatusPicker matchId={match.id} currentStatus={state?.status} onUpdate={onUpdate} />
                    <span className={`scoring-chevron ${open ? 'is-open' : ''}`} aria-hidden>▾</span>
                </div>
            </button>
            {open && <>
                <div className="pl-rule">{maxScore}점 {setCount}세트 — 출전하지 않은 캠퍼스는 0으로 비워두세요</div>
                <div className="tt-table">
                    <div className="tt-row tt-row-head">
                        <span className="tt-cell tt-cell-label" />
                        {ALL_CAMPUSES.map((c) => (
                            <span key={c} className="tt-cell tt-cell-head" style={{ color: CAMPUS_COLORS[c]?.bg }}>
                                {c}
                            </span>
                        ))}
                        <span className="tt-cell tt-cell-winner">세트 승</span>
                    </div>
                    {sets.map((s, idx) => (
                        <div key={idx} className="tt-row">
                            <span className="tt-cell tt-cell-label">
                                <strong>{idx + 1}세트</strong>
                            </span>
                            {ALL_CAMPUSES.map((c) => {
                                const isWinner = setWinners[idx] === c;
                                return (
                                    <span key={c} className={`tt-cell ${isWinner ? 'is-winner' : ''}`}
                                          style={{ '--c': CAMPUS_COLORS[c]?.bg, '--c-soft': CAMPUS_COLORS[c]?.soft }}>
                                        <input
                                            type="number"
                                            min="0"
                                            max={maxScore}
                                            value={s[c]}
                                            onChange={(e) => updateScore(idx, c, e.target.value)}
                                            placeholder="0"
                                            disabled={saving}
                                        />
                                    </span>
                                );
                            })}
                            <span className="tt-cell tt-cell-winner">
                                {setWinners[idx] ? (
                                    <span style={{ color: CAMPUS_COLORS[setWinners[idx]]?.bg, fontWeight: 700 }}>
                                        {setWinners[idx]}
                                    </span>
                                ) : '—'}
                            </span>
                        </div>
                    ))}
                </div>
                {matchWinner && (
                    <div className="sets-winner-line">
                        매치 승리: <strong style={{ color: CAMPUS_COLORS[matchWinner]?.bg }}>🏆 {matchWinner}</strong>
                        {' '} ({setWinsByCampus[matchWinner]}세트 선취)
                    </div>
                )}
                <div className="scoring-foot">
                    {saved && <span className="scoring-saved">✓ 저장됨</span>}
                    <button type="button" className="scoring-save" onClick={submit} disabled={saving}>
                        {saving ? '저장중…' : isFinished ? '재저장' : '저장 (결과 확정)'}
                    </button>
                </div>
            </>}
        </article>
    );
}

/* 체스: 승점제 (승 1, 무 0.5, 패 0). 캠퍼스별 승/무/패 횟수 → 합계 자동 계산 */
function ChessScoringCard({ match, state, comments = [], onAddComment, onUpdate }) {
    // 저장된 데이터 복원: quarter='문경 W/D/L' 같은 형식으로 인코딩
    const saved = { 문경: { W: '', D: '', L: '' }, 음성: { W: '', D: '', L: '' }, 세종: { W: '', D: '', L: '' } };
    for (const c of comments) {
        if (!c?.quarter || !c?.scoreTeam) continue;
        const m = String(c.quarter).match(/^(W|D|L)$/);
        if (!m) continue;
        if (ALL_CAMPUSES.includes(c.scoreTeam)) {
            saved[c.scoreTeam][m[1]] = Number(c.scoreAmount) || 0;
        }
    }

    const [stats, setStats] = useState(saved);
    const [saving, setSaving] = useState(false);
    const [savedFlag, setSavedFlag] = useState(false);
    const [open, setOpen] = useState(false);
    const isFinished = state?.status === 'finished';

    const update = (campus, key, val) => {
        setSavedFlag(false);
        setStats((s) => ({ ...s, [campus]: { ...s[campus], [key]: val } }));
    };

    const totals = ALL_CAMPUSES.reduce((acc, c) => {
        const w = Number(stats[c].W) || 0;
        const d = Number(stats[c].D) || 0;
        acc[c] = w + d * 0.5;
        return acc;
    }, {});
    const winnerCampus = (() => {
        let win = null;
        let max = -Infinity;
        for (const c of ALL_CAMPUSES) {
            if (totals[c] > max && totals[c] > 0) {
                max = totals[c];
                win = c;
            }
        }
        return win;
    })();

    const submit = async () => {
        const hasInput = ALL_CAMPUSES.some((c) =>
            ['W', 'D', 'L'].some((k) => Number(stats[c][k]) > 0)
        );
        if (!hasInput) {
            alert('승/무/패 횟수를 입력해주세요.');
            return;
        }
        setSaving(true);
        try {
            for (const c of ALL_CAMPUSES) {
                for (const k of ['W', 'D', 'L']) {
                    const n = Number(stats[c][k]);
                    if (!Number.isFinite(n) || n <= 0) continue;
                    const ko = k === 'W' ? '승' : k === 'D' ? '무' : '패';
                    await onAddComment(match.id, {
                        type: 'score',
                        content: `${c} ${ko} ${n}`,
                        quarter: k,
                        scoreTeam: c,
                        scoreAmount: n,
                    });
                }
            }
            // 총점도 따로 저장 (대시보드용)
            for (const c of ALL_CAMPUSES) {
                if (totals[c] > 0) {
                    await onAddComment(match.id, {
                        type: 'score',
                        content: `${c} 합계 ${totals[c]}점`,
                        scoreTeam: c,
                        scoreAmount: totals[c],
                    });
                }
            }
            await onUpdate(match.id, { status: 'finished' });
            setSavedFlag(true);
        } catch (err) {
            alert('저장 실패: ' + err.message);
        }
        setSaving(false);
    };

    return (
        <article className={`scoring-card placement-card ${isFinished ? 'is-finished' : ''} ${open ? 'is-open' : 'is-collapsed'}`}>
            <button type="button" className="scoring-head-btn" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
                <div className="scoring-meta">
                    <span className="scoring-day">{match.day.slice(5)}</span>
                    {match.startTime && <span className="scoring-time">{match.startTime}</span>}
                    <span className="scoring-cat">{match.sport} · {match.category}</span>
                </div>
                <div className="scoring-head-right">
                    {!open && isFinished && winnerCampus && (
                        <span className="scoring-mini-totals">
                            {ALL_CAMPUSES.map((c) => (
                                <span key={c} className="scoring-mini-total" style={{ '--c': CAMPUS_COLORS[c]?.bg }}>
                                    {c} {totals[c]}
                                </span>
                            ))}
                        </span>
                    )}
                    <StatusPicker matchId={match.id} currentStatus={state?.status} onUpdate={onUpdate} />
                    <span className={`scoring-chevron ${open ? 'is-open' : ''}`} aria-hidden>▾</span>
                </div>
            </button>
            {open && <>
                <div className="pl-rule">승 1점 · 무 0.5점 · 패 0점 (1인당 2경기)</div>
                <div className="chess-table">
                    <div className="chess-row chess-row-head">
                        <span className="chess-cell chess-cell-label" />
                        <span className="chess-cell chess-cell-h">승</span>
                        <span className="chess-cell chess-cell-h">무</span>
                        <span className="chess-cell chess-cell-h">패</span>
                        <span className="chess-cell chess-cell-h chess-total-h">총점</span>
                    </div>
                    {ALL_CAMPUSES.map((c) => {
                        const cc = CAMPUS_COLORS[c] || {};
                        const isWinner = winnerCampus === c;
                        return (
                            <div key={c} className={`chess-row ${isWinner ? 'is-winner' : ''}`}
                                 style={{ '--c': cc.bg, '--c-soft': cc.soft }}>
                                <span className="chess-cell chess-cell-label" style={{ color: cc.bg }}>
                                    {isWinner && <span>🏆 </span>}
                                    <strong>{c}</strong>
                                </span>
                                {['W', 'D', 'L'].map((k) => (
                                    <span key={k} className="chess-cell">
                                        <input
                                            type="number"
                                            min="0"
                                            value={stats[c][k]}
                                            onChange={(e) => update(c, k, e.target.value)}
                                            placeholder="0"
                                            disabled={saving}
                                        />
                                    </span>
                                ))}
                                <span className="chess-cell chess-total">
                                    {totals[c]}
                                </span>
                            </div>
                        );
                    })}
                </div>
                <div className="scoring-foot">
                    {savedFlag && <span className="scoring-saved">✓ 저장됨</span>}
                    <button type="button" className="scoring-save" onClick={submit} disabled={saving}>
                        {saving ? '저장중…' : isFinished ? '재저장' : '저장 (결과 확정)'}
                    </button>
                </div>
            </>}
        </article>
    );
}

/* 이어달리기: 1등 캠퍼스 한 번만 픽 */
function FirstPlaceScoringCard({ match, state, comments = [], onAddComment, onUpdate }) {
    const savedWinner = comments.find((c) => c?.scoreTeam)?.scoreTeam || '';
    const [winner, setWinner] = useState(savedWinner);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [open, setOpen] = useState(false);
    const isFinished = state?.status === 'finished';

    const pick = (c) => {
        setSaved(false);
        setWinner((prev) => (prev === c ? '' : c));
    };

    const submit = async () => {
        if (!winner) {
            alert('1등 캠퍼스를 먼저 선택해주세요.');
            return;
        }
        setSaving(true);
        try {
            await onAddComment(match.id, {
                type: 'score',
                content: `1등 ${winner}`,
                scoreTeam: winner,
                scoreAmount: 1,
            });
            await onUpdate(match.id, { status: 'finished' });
            setSaved(true);
        } catch (err) {
            alert('저장 실패: ' + err.message);
        }
        setSaving(false);
    };

    return (
        <article className={`scoring-card ${isFinished ? 'is-finished' : ''} ${open ? 'is-open' : 'is-collapsed'}`}>
            <button type="button" className="scoring-head-btn" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
                <div className="scoring-meta">
                    <span className="scoring-day">{match.day.slice(5)}</span>
                    {match.startTime && <span className="scoring-time">{match.startTime}</span>}
                    <span className="scoring-cat">{match.sport} · {match.category}</span>
                </div>
                <div className="scoring-head-right">
                    {!open && isFinished && savedWinner && (
                        <span className="scoring-mini-totals">
                            <span className="scoring-mini-total" style={{ '--c': CAMPUS_COLORS[savedWinner]?.bg }}>
                                🏆 {savedWinner}
                            </span>
                        </span>
                    )}
                    <StatusPicker matchId={match.id} currentStatus={state?.status} onUpdate={onUpdate} />
                    <span className={`scoring-chevron ${open ? 'is-open' : ''}`} aria-hidden>▾</span>
                </div>
            </button>
            {open && <>
                <div className="pl-rule">1등으로 들어온 캠퍼스가 승리합니다</div>
                <div className="fp-pick">
                    <div className="pl-section-title">1등 캠퍼스</div>
                    <div className="fp-pills">
                        {ALL_CAMPUSES.map((c) => {
                            const cc = CAMPUS_COLORS[c] || {};
                            const active = winner === c;
                            const style = active
                                ? { background: cc.bg, color: '#fff', borderColor: cc.bg }
                                : { background: cc.soft, color: cc.bg, borderColor: cc.bg };
                            return (
                                <button
                                    key={c}
                                    type="button"
                                    className={`fp-pill ${active ? 'active' : ''}`}
                                    style={style}
                                    onClick={() => pick(c)}
                                    disabled={saving}
                                >
                                    {active && <span aria-hidden>🏆 </span>}
                                    {c}
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div className="scoring-foot">
                    {saved && <span className="scoring-saved">✓ 저장됨</span>}
                    <button type="button" className="scoring-save" onClick={submit} disabled={saving}>
                        {saving ? '저장중…' : isFinished ? '재저장' : '저장 (결과 확정)'}
                    </button>
                </div>
            </>}
        </article>
    );
}

/* 줄다리기: 3판 2선승, 세트별 승리 캠퍼스 픽 */
function SetsScoringCard({ match, state, comments = [], onAddComment, onUpdate }) {
    const setCount = match.setCount || 3;

    // 기존 저장값 복원: '1세트', '2세트' 같은 quarter로 저장된 코멘트의 scoreTeam을 인덱스로 매핑
    const savedSets = Array(setCount).fill('');
    for (const c of comments) {
        if (!c?.quarter || !c?.scoreTeam) continue;
        const m = String(c.quarter).match(/^(\d+)세트$/);
        if (!m) continue;
        const i = Number(m[1]) - 1;
        if (i >= 0 && i < setCount) savedSets[i] = c.scoreTeam;
    }

    const [setWinners, setSetWinners] = useState(savedSets);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [open, setOpen] = useState(false);
    const isFinished = state?.status === 'finished';

    const setWin = (idx, c) => {
        setSaved(false);
        setSetWinners((arr) => {
            const next = [...arr];
            next[idx] = next[idx] === c ? '' : c;
            return next;
        });
    };

    // 누가 이번 매치를 이겼는지 계산
    const matchWinner = (() => {
        const counts = {};
        for (const w of setWinners) {
            if (!w) continue;
            counts[w] = (counts[w] || 0) + 1;
        }
        const targetWins = Math.ceil(setCount / 2); // 3판 → 2선승
        for (const c of ALL_CAMPUSES) {
            if ((counts[c] || 0) >= targetWins) return c;
        }
        return null;
    })();

    const submit = async () => {
        const filled = setWinners.filter(Boolean);
        if (filled.length === 0) {
            alert('세트 승리 캠퍼스를 하나 이상 선택해주세요.');
            return;
        }
        setSaving(true);
        try {
            for (let i = 0; i < setWinners.length; i++) {
                const w = setWinners[i];
                if (!w) continue;
                await onAddComment(match.id, {
                    type: 'score',
                    content: `${i + 1}세트 ${w} 승`,
                    quarter: `${i + 1}세트`,
                    scoreTeam: w,
                    scoreAmount: 1,
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
        <article className={`scoring-card ${isFinished ? 'is-finished' : ''} ${open ? 'is-open' : 'is-collapsed'}`}>
            <button type="button" className="scoring-head-btn" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
                <div className="scoring-meta">
                    <span className="scoring-day">{match.day.slice(5)}</span>
                    {match.startTime && <span className="scoring-time">{match.startTime}</span>}
                    <span className="scoring-cat">{match.sport} · {match.category}</span>
                </div>
                <div className="scoring-head-right">
                    {!open && isFinished && matchWinner && (
                        <span className="scoring-mini-totals">
                            <span className="scoring-mini-total" style={{ '--c': CAMPUS_COLORS[matchWinner]?.bg }}>
                                🏆 {matchWinner}
                            </span>
                        </span>
                    )}
                    <StatusPicker matchId={match.id} currentStatus={state?.status} onUpdate={onUpdate} />
                    <span className={`scoring-chevron ${open ? 'is-open' : ''}`} aria-hidden>▾</span>
                </div>
            </button>
            {open && <>
                <div className="pl-rule">{setCount}판 {Math.ceil(setCount / 2)}선승 — 세트별 승리 캠퍼스를 선택하세요</div>
                <div className="sets-list">
                    {setWinners.map((w, idx) => (
                        <div key={idx} className="pl-rank-row">
                            <span className="pl-rank-label">
                                <strong>{idx + 1}세트</strong>
                            </span>
                            <div className="pl-rank-pills">
                                {ALL_CAMPUSES.map((c) => {
                                    const cc = CAMPUS_COLORS[c] || {};
                                    const active = w === c;
                                    const style = active
                                        ? { background: cc.bg, color: '#fff', borderColor: cc.bg }
                                        : { background: cc.soft, color: cc.bg, borderColor: cc.bg };
                                    return (
                                        <button
                                            key={c}
                                            type="button"
                                            className={`pl-rank-pill ${active ? 'active' : ''}`}
                                            style={style}
                                            onClick={() => setWin(idx, c)}
                                            disabled={saving}
                                        >
                                            {c}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
                {matchWinner && (
                    <div className="sets-winner-line">
                        매치 승리: <strong style={{ color: CAMPUS_COLORS[matchWinner]?.bg }}>🏆 {matchWinner}</strong>
                    </div>
                )}
                <div className="scoring-foot">
                    {saved && <span className="scoring-saved">✓ 저장됨</span>}
                    <button type="button" className="scoring-save" onClick={submit} disabled={saving}>
                        {saving ? '저장중…' : isFinished ? '재저장' : '저장 (결과 확정)'}
                    </button>
                </div>
            </>}
        </article>
    );
}

function SimpleScoringCard({ match, state, comments = [], onAddComment, onUpdate }) {
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
    const [open, setOpen] = useState(false);
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
        <article className={`scoring-card ${isFinished ? 'is-finished' : ''} ${open ? 'is-open' : 'is-collapsed'}`}>
            <button
                type="button"
                className="scoring-head-btn"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
            >
                <div className="scoring-meta">
                    <span className="scoring-day">{match.day.slice(5)}</span>
                    {match.startTime && <span className="scoring-time">{match.startTime}</span>}
                    <span className="scoring-cat">{match.sport} · {match.category}</span>
                </div>
                <div className="scoring-head-right">
                    {!open && isFinished && Object.keys(existingScores).length > 0 && (
                        <span className="scoring-mini-totals">
                            {ALL_CAMPUSES.map((c) => (
                                <span key={c} className="scoring-mini-total" style={{ '--c': CAMPUS_COLORS[c]?.bg }}>
                                    {c} {existingScores[c] ?? 0}
                                </span>
                            ))}
                        </span>
                    )}
                    <StatusPicker matchId={match.id} currentStatus={state?.status} onUpdate={onUpdate} />
                    <span className={`scoring-chevron ${open ? 'is-open' : ''}`} aria-hidden>▾</span>
                </div>
            </button>
            {open && <>
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
            </>}
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
