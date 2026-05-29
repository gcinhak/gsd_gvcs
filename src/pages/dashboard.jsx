import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import LiveClock from '../components/LiveClock';
import {
    CAMPUS_OPTIONS,
    CAMPUS,
    INITIAL_DASHBOARD_EVENTS,
    getCampus,
    getEventDivisions,
    fetchDashboard,
    applyDivisionsToEvents,
    getTugOfWarPoints,
} from '../lib/dashboardStore';
import { fetchComments, fetchLiveStates } from '../lib/liveApi';
import { LIVE_MATCHES, getQuarters } from '../data/data';
import { getRelayMatchId, getScorePair } from '../lib/dashboardRelay';
import { getSetSummary, getSetTargetWins, isSetEvent, isSetMatch } from '../lib/volleyballSets';

const STATUS_LABELS = {
    upcoming: '경기 전',
    live: '진행 중',
    finished: '경기 종료',
};

function formatRelayScore(state) {
    if (!state || state.status === 'upcoming') return '';
    return `${Number(state.homeScore) || 0} : ${Number(state.awayScore) || 0}`;
}

function formatDashboardScore(event, division, state, comments = [], match) {
    if (isSetEvent(event)) {
        const summary = getSetSummary(comments, match, match ? getQuarters(match.sport) : [], state);
        const relayScore = getScorePair(state);
        const score = summary.home > 0 || summary.away > 0 ? summary : relayScore;
        return `${score.home}:${score.away}`;
    }
    const { home, away } = getScorePair(state);
    return `${home}:${away}`;
}

function shouldShowDashboardScore(event, division) {
    if (
        event.id === 'relay' ||
        event.id === 'table-tennis' ||
        event.id === 'chess' ||
        event.id === 'tug-of-war' ||
        event.id === 'elementary'
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
    // 채점제 매치는 teams 가 플레이스홀더라 3 캠퍼스로 표시
    if (match?.mode === 'scoring') return '문경 VS 음성 VS 세종';
    const relayMatchup = formatMatchup(match);
    if (relayMatchup) return relayMatchup;
    if (event.id === 'middle-distance' || event.id === 'relay' || event.id === 'elementary')
        return '문경 VS 음성 VS 세종';
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

function formatCommentTime(ts) {
    if (!ts) return '';
    const date = new Date(ts * 1000); // ← * 1000 추가
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

function campusKeyFromTeamName(teamName) {
    if (!teamName) return 'pending';
    const campus = CAMPUS_OPTIONS.find((option) => teamName.includes(option.name));
    return campus?.key || 'pending';
}

/**
 * 채점제 매치(mode='scoring')의 승자 캠퍼스 이름 추출.
 * teams.home/away가 플레이스홀더라 일반 점수 비교가 안 되므로 코멘트에서 직접 계산.
 */
function getScoringWinner(match, comments = []) {
    if (!match || match.mode !== 'scoring') return null;
    const type = match.scoringType;

    const pickMax = (obj) => {
        let winner = null;
        let max = -Infinity;
        for (const [c, n] of Object.entries(obj)) {
            if (n > max) {
                max = n;
                winner = c;
            }
        }
        return max > -Infinity ? winner : null;
    };

    if (type === 'sets') {
        // 줄다리기 — '1세트', '2세트' 코멘트 각각의 scoreTeam = 그 세트 승자
        const wins = {};
        for (const c of comments) {
            if (!c?.scoreTeam || !/^\d+세트$/.test(String(c?.quarter || ''))) continue;
            wins[c.scoreTeam] = (wins[c.scoreTeam] || 0) + 1;
        }
        const targetWins = Math.ceil((match.setCount || 3) / 2);
        for (const [c, n] of Object.entries(wins)) {
            if (n >= targetWins) return c;
        }
        return pickMax(wins);
    }

    if (type === 'tableTennis') {
        // 탁구 — 세트별 캠퍼스 점수. 각 세트 최고점 = 그 세트 승자, 최다 세트 승 = 매치 승자
        const setScores = {};
        for (const c of comments) {
            const q = String(c?.quarter || '');
            if (!c?.scoreTeam || !/^\d+세트$/.test(q)) continue;
            const n = Number(c.scoreAmount) || 0;
            if (!setScores[q]) setScores[q] = {};
            setScores[q][c.scoreTeam] = n;
        }
        const setWins = {};
        for (const q of Object.keys(setScores)) {
            const scores = setScores[q];
            let bestC = null;
            let bestN = -1;
            let tie = false;
            for (const [c, n] of Object.entries(scores)) {
                if (n > bestN) {
                    bestN = n;
                    bestC = c;
                    tie = false;
                } else if (n === bestN) tie = true;
            }
            if (!tie && bestC) setWins[bestC] = (setWins[bestC] || 0) + 1;
        }
        return pickMax(setWins);
    }

    if (type === 'chess') {
        // 체스 — 합계 코멘트(quarter 없음)만 사용
        const totals = {};
        for (const c of comments) {
            if (!c?.scoreTeam || c?.scoreAmount == null) continue;
            if (c.quarter) continue;
            totals[c.scoreTeam] = Number(c.scoreAmount) || 0;
        }
        return pickMax(totals);
    }

    if (type === 'firstPlace') {
        // 이어달리기 — 1등 코멘트
        const c = comments.find((x) => x?.scoreTeam);
        return c?.scoreTeam || null;
    }

    // 기본 (simple / placements 등) — 캠퍼스별 가장 큰 scoreAmount 가 합계
    const totals = {};
    for (const c of comments) {
        if (!c?.scoreTeam || c?.scoreAmount == null) continue;
        if (c.quarter) continue; // W/D/L 같은 부속 카운트는 무시
        const n = Number(c.scoreAmount);
        if (!Number.isFinite(n)) continue;
        totals[c.scoreTeam] = Math.max(totals[c.scoreTeam] || 0, n);
    }
    return pickMax(totals);
}

function getRelayDisplayState(event, division, match, relayState, relayComments = []) {
    const base = {
        state: division.state || 'ready',
        winnerKey: division.winnerKey || 'pending',
    };
    if (!relayState || !match) return base;

    if (match.mode === 'scoring') {
        // 초등부: comment 있으면 바로 계산
        if (match.scoringType === 'elementary') {
            if (relayComments.length > 0) {
                const winnerName = getScoringWinner(match, relayComments);
                return {
                    state: 'done',
                    winnerKey: winnerName ? campusKeyFromTeamName(winnerName) : 'pending',
                };
            }
            return base;
        }

        if (relayState.status === 'finished') {
            const winnerName = getScoringWinner(match, relayComments);
            return {
                state: 'done',
                winnerKey: winnerName ? campusKeyFromTeamName(winnerName) : 'pending',
            };
        }
        if (relayState.status === 'live') return { state: 'live', winnerKey: 'pending' };
        if (relayState.status === 'upcoming') return { state: 'ready', winnerKey: 'pending' };
        return base;
    }

    if (isSetEvent(event)) {
        const summary = getSetSummary(relayComments, match, getQuarters(match.sport), relayState);

        // ★ 핵심 수정: 세트 comment가 아직 로드되지 않은 경우 base 반환
        if (relayComments.length === 0) return base;

        const relayScore = getScorePair(relayState);
        const score = summary.home > 0 || summary.away > 0 ? summary : relayScore;
        const targetWins = getSetTargetWins(match);
        const winnerTeam =
            targetWins && score.home >= targetWins
                ? match.teams.home
                : targetWins && score.away >= targetWins
                  ? match.teams.away
                  : null;
        if (winnerTeam) {
            return {
                state: 'done',
                winnerKey: campusKeyFromTeamName(winnerTeam),
            };
        }
    }

    if (relayState.status === 'finished') {
        const { home, away } = getScorePair(relayState);
        const winnerTeam = home > away ? match.teams.home : away > home ? match.teams.away : null;
        return {
            state: 'done',
            winnerKey: winnerTeam ? campusKeyFromTeamName(winnerTeam) : 'pending',
        };
    }

    if (relayState.status === 'live') return { state: 'live', winnerKey: 'pending' };
    if (relayState.status === 'upcoming') return { state: 'ready', winnerKey: 'pending' };

    return base;
}

function ResultCell({ event, division, match, relayState, relayComments = [], onOpen }) {
    // displayState와 winnerKey는 서버에서 이미 병합된 값 사용
    const relayDisplay = getRelayDisplayState(event, division, match, relayState, relayComments);
    const displayState = relayDisplay.state;
    const winnerKey = relayDisplay.winnerKey;
    const campus = getCellBadgeCampus(winnerKey, displayState);
    const finalScore = formatDashboardScore(event, division, relayState, relayComments, match);
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

            {hasWinner ? <CampusBadge campus={campus} size="sm" /> : <MatchupPills matchup={matchup} />}
        </button>
    );
}

function TugTeamRow({ label, points, onClick }) {
    return (
        <button type="button" className="db-result-cell" onClick={onClick} aria-label={`${label} 점수 상세 보기`}>
            <span className="db-division-label">{label}</span>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {CAMPUS_OPTIONS.map((campus) => (
                    <span key={campus.key} className={`db-campus-badge size-sm ${campus.className}`}>
                        {campus.name} {points[campus.key]}점
                    </span>
                ))}
            </div>
        </button>
    );
}

function TugOfWarCard({ divisions, onOpenDetail }) {
    const studentDivs = divisions.filter((d) => d.id.startsWith('tug-s-'));
    const adultDivs = divisions.filter((d) => d.id.startsWith('tug-a-'));
    return (
        <div className="db-result-grid">
            <TugTeamRow
                label="학생팀"
                points={getTugOfWarPoints(studentDivs)}
                onClick={() => onOpenDetail({ label: '학생팀', divisions: studentDivs })}
            />
            <TugTeamRow
                label="성인팀"
                points={getTugOfWarPoints(adultDivs)}
                onClick={() => onOpenDetail({ label: '성인팀', divisions: adultDivs })}
            />
        </div>
    );
}

/** 중거리 division 한 종목의 comments에서 캠퍼스별 점수 추출 */
function getMiddleDistancePoints(comments = []) {
    const pts = { mungyeong: 0, eumseong: 0, sejong: 0 };
    for (const c of comments) {
        if (!c?.scoreTeam || c?.scoreAmount == null || c.quarter) continue;
        const n = Number(c.scoreAmount);
        if (!Number.isFinite(n)) continue;
        const key = campusKeyFromTeamName(c.scoreTeam);
        if (pts[key] !== undefined) pts[key] = Math.max(pts[key], n);
    }
    return pts;
}

/** comment content에서 "1등 문경, 2등 음성, ..." 순위 파싱
 *  반환: { 1: '문경', 2: '음성', 3: '세종', ... } */
function parseRankSummary(comments = []) {
    for (const c of comments) {
        if (!c?.content) continue;
        const parts = c.content.split(' · ');
        if (parts.length < 2) continue;
        const rankPart = parts[1]; // "1등 문경, 2등 음성, ..."
        const ranks = {};
        for (const item of rankPart.split(', ')) {
            const m = item.match(/(\d+)등\s+(.+)/);
            if (m) ranks[Number(m[1])] = m[2].trim();
        }
        if (Object.keys(ranks).length > 0) return ranks;
    }
    return {};
}

/** 중거리 카드: 4개 종목 각각 캠퍼스별 점수 표시 */
function MiddleDistanceCard({ divisions, liveMatchMap, commentsMap, onOpenDetail }) {
    return (
        <div className="db-result-grid">
            {divisions.map((div) => {
                const matchId = getRelayMatchId(div);
                const match = matchId ? liveMatchMap[matchId] : null;
                const comments = matchId ? commentsMap[matchId] || [] : [];
                const points = getMiddleDistancePoints(comments);
                return (
                    <TugTeamRow
                        key={div.id}
                        label={div.label}
                        points={points}
                        onClick={() => onOpenDetail({ division: div, matchId, match, comments })}
                    />
                );
            })}
        </div>
    );
}

function TaekwondoGroups({ event, groups, liveMatchMap, relayStatesMap, relayCommentsMap = {}, onOpenDetail }) {
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
                        relayComments={matchId ? relayCommentsMap[matchId] || [] : []}
                        onOpen={() => onOpenDetail({ division, matchId, match })}
                    />
                );
            })}
        </div>
    );
}

function getDerivedEventDivisions(event, relayStatesMap = {}, liveMatchMap = {}, relayCommentsMap = {}) {
    return getEventDivisions(event).map((division) => {
        const matchId = getRelayMatchId(division);
        const match = matchId ? liveMatchMap[matchId] : null;
        const relayState = matchId ? relayStatesMap[matchId] : null;
        const relayComments = matchId ? relayCommentsMap[matchId] || [] : [];
        return {
            ...division,
            ...getRelayDisplayState(event, division, match, relayState, relayComments),
        };
    });
}

function getEventStatusLabelFromContext(event, context) {
    if (context.isDone) return '완료';
    if (context.isLive) return '진행 중';
    return event.status;
}

function getEventContext(event, relayStatesMap = {}, liveMatchMap = {}, relayCommentsMap = {}) {
    const divisions = getDerivedEventDivisions(event, relayStatesMap, liveMatchMap, relayCommentsMap);
    const majorityWinnerKey = getMajorityCampusFromDivisions(divisions);
    const allDone = divisions.length > 0 && divisions.every((d) => d.state === 'done');
    const isDone = allDone || Boolean(event.manualWinnerKey || majorityWinnerKey);
    const isLive = divisions.some((d) => d.state === 'live');

    // 줄다리기: 6경기 승점 합산으로 종목 승자 결정
    if (event.id === 'tug-of-war') {
        const pts = getTugOfWarPoints(divisions);
        const sorted = Object.entries(pts).sort((a, b) => b[1] - a[1]);
        const [[firstKey, firstPts], [, secondPts]] = sorted;
        const calcWinner = firstPts > 0 && firstPts > secondPts ? firstKey : 'pending';
        const winnerKey = event.manualWinnerKey || calcWinner;
        const isDone = allDone || Boolean(event.manualWinnerKey);
        return { divisions, isDone, isLive, winnerKey };
    }

    // 중거리: 4종목 점수 총합산으로 종목 승자 결정
    if (event.id === 'middle-distance') {
        const totals = { mungyeong: 0, eumseong: 0, sejong: 0 };
        for (const div of divisions) {
            const matchId = getRelayMatchId(div);
            const comments = matchId ? relayCommentsMap[matchId] || [] : [];
            for (const c of comments) {
                if (!c?.scoreTeam || c?.scoreAmount == null || c.quarter) continue;
                const n = Number(c.scoreAmount);
                if (!Number.isFinite(n)) continue;
                const campusKey = campusKeyFromTeamName(c.scoreTeam);
                if (totals[campusKey] !== undefined) totals[campusKey] += n;
            }
        }
        const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
        const [[firstKey, firstPts], [, secondPts]] = sorted;
        const calcWinner = firstPts > 0 && firstPts > secondPts ? firstKey : 'pending';
        const winnerKey = event.manualWinnerKey || calcWinner;
        const isDone = allDone || Boolean(event.manualWinnerKey);
        return { divisions, isDone, isLive, winnerKey };
    }

    const winnerKey =
        event.manualWinnerKey || majorityWinnerKey || (allDone ? getLeadingCampusFromDivisions(divisions) : 'pending');
    return { divisions, isDone, isLive, winnerKey };
}

function getMajorityCampusFromDivisions(divisions) {
    const scores = CAMPUS_OPTIONS.reduce((acc, campus) => ({ ...acc, [campus.key]: 0 }), {});
    for (const div of divisions) {
        if (div.state !== 'done') continue;
        if (scores[div.winnerKey] === undefined) continue;
        scores[div.winnerKey] += 1;
    }
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    if ((sorted[0]?.[1] || 0) <= divisions.length / 2) return null;
    return sorted[0][0];
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

function getCampusWinCountsFromContexts(contexts) {
    const counts = CAMPUS_OPTIONS.reduce((acc, campus) => ({ ...acc, [campus.key]: 0 }), {});
    for (const context of contexts) {
        if (!context.isDone) continue;
        if (counts[context.winnerKey] === undefined) continue;
        counts[context.winnerKey] += 1;
    }
    return counts;
}

function ScoreDetailModal({ detail, relayState, comments, loading, onClose }) {
    if (!detail) return null;

    const detailKey = `${detail.matchId || 'match'}-${detail.division?.id || 'division'}`;

    return createPortal(
        <ScoreDetailModalContent
            key={detailKey}
            detail={detail}
            relayState={relayState}
            comments={comments}
            loading={loading}
            onClose={onClose}
        />,
        document.body
    );
}

function TugDetailModal({ detail, liveMatchMap, onClose }) {
    if (!detail) return null;
    return createPortal(
        <TugDetailModalContent detail={detail} liveMatchMap={liveMatchMap} onClose={onClose} />,
        document.body
    );
}

function MiddleDistanceDetailModal({ detail, onClose }) {
    if (!detail) return null;
    return createPortal(<MiddleDistanceDetailContent detail={detail} onClose={onClose} />, document.body);
}

function MiddleDistanceDetailContent({ detail, onClose }) {
    const { division, comments } = detail;
    const points = getMiddleDistancePoints(comments);
    const ranks = parseRankSummary(comments);
    const hasRanks = Object.keys(ranks).length > 0;

    return (
        <div className="db-detail-backdrop db-detail-backdrop--sheet" onMouseDown={onClose}>
            <section
                className="db-detail-modal"
                role="dialog"
                aria-modal="true"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <header className="db-detail-head">
                    <div>
                        <span className="db-detail-status status-upcoming">중거리</span>
                        <h2>{division.label}</h2>
                        <p>1등 20점, 2등 15점, 3등 10점, 4등 7점, 5등 5점, 완주 2점</p>
                    </div>
                    <button type="button" className="db-detail-close" onClick={onClose} aria-label="닫기">
                        ×
                    </button>
                </header>

                <div style={{ display: 'flex', gap: '8px', padding: '12px 16px' }}>
                    {CAMPUS_OPTIONS.map((campus) => (
                        <span
                            key={campus.key}
                            className={`db-campus-badge ${campus.className}`}
                            style={{ flex: 1, justifyContent: 'center' }}
                        >
                            {campus.name} {points[campus.key]}점
                        </span>
                    ))}
                </div>

                <div className="db-detail-feed">
                    <div className="db-detail-feed-head">
                        <div className="db-detail-feed-title">순위별 결과</div>
                    </div>
                    {hasRanks ? (
                        [1, 2, 3, 4, 5].map((rank) => {
                            const campusName = ranks[rank];
                            const campus = campusName ? getCampus(campusKeyFromTeamName(campusName)) : null;
                            return (
                                <article
                                    key={rank}
                                    className="db-detail-comment type-score"
                                    style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                                >
                                    <span className="db-detail-comment-meta" style={{ minWidth: '32px' }}>
                                        {rank}등
                                    </span>
                                    {campus && campusName ? (
                                        <CampusBadge campus={campus} size="sm" />
                                    ) : (
                                        <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>미입력</span>
                                    )}
                                </article>
                            );
                        })
                    ) : (
                        <div className="db-detail-empty">아직 등록된 순위 정보가 없습니다.</div>
                    )}
                </div>
            </section>
        </div>
    );
}

function TugDetailModalContent({ detail, liveMatchMap, onClose }) {
    const { label, divisions } = detail;
    const points = getTugOfWarPoints(divisions);

    return (
        <div className="db-detail-backdrop db-detail-backdrop--sheet" onMouseDown={onClose}>
            <section
                className="db-detail-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="db-tug-detail-title"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <header className="db-detail-head">
                    <div>
                        <span className="db-detail-status status-upcoming">줄다리기</span>
                        <h2 id="db-tug-detail-title">{label}</h2>
                        <p>승점제 · 승 2점 · 패 0점</p>
                    </div>
                    <button type="button" className="db-detail-close" onClick={onClose} aria-label="닫기">
                        ×
                    </button>
                </header>

                {/* 승점 합계 */}
                <div style={{ display: 'flex', gap: '8px', padding: '12px 16px' }}>
                    {CAMPUS_OPTIONS.map((campus) => (
                        <span
                            key={campus.key}
                            className={`db-campus-badge ${campus.className}`}
                            style={{ flex: 1, justifyContent: 'center' }}
                        >
                            {campus.name} {points[campus.key]}점
                        </span>
                    ))}
                </div>

                {/* 경기별 결과 */}
                <div className="db-detail-feed">
                    <div className="db-detail-feed-head">
                        <div className="db-detail-feed-title">경기별 결과</div>
                    </div>
                    {divisions.map((div) => {
                        const matchId = getRelayMatchId(div);
                        const match = matchId ? liveMatchMap[matchId] : null;
                        const winnerCampus = div.winnerKey !== 'pending' ? getCampus(div.winnerKey) : null;
                        const stateLabel = div.state === 'done' ? '완료' : div.state === 'live' ? '진행중' : '경기 전';

                        return (
                            <article key={div.id} className="db-detail-comment type-score">
                                <div className="db-detail-comment-meta">
                                    <span>{match ? `${match.teams.home} vs ${match.teams.away}` : div.label}</span>
                                    <span>{stateLabel}</span>
                                </div>
                                <p>
                                    {winnerCampus ? (
                                        <>
                                            <CampusBadge campus={winnerCampus} size="sm" /> 승리 · +2점
                                        </>
                                    ) : (
                                        '결과 대기중'
                                    )}
                                </p>
                            </article>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}

function ScoreDetailModalContent({ detail, relayState, comments, loading, onClose }) {
    const [selectedSet, setSelectedSet] = useState('all');

    const { division, match } = detail;
    const setSummary = isSetMatch(match) ? getSetSummary(comments, match, getQuarters(match.sport), relayState) : null;
    const setFilterOptions = setSummary?.rows || [];
    const filteredComments =
        selectedSet === 'all' ? comments : comments.filter((comment) => comment.quarter === selectedSet);
    const relayScore = getScorePair(relayState);
    const visibleSetScore = setSummary && (setSummary.home > 0 || setSummary.away > 0) ? setSummary : relayScore;
    const score = setSummary ? `${visibleSetScore.home} : ${visibleSetScore.away}` : formatRelayScore(relayState);
    const status = relayState?.status || 'upcoming';

    return (
        <div className="db-detail-backdrop db-detail-backdrop--sheet" onMouseDown={onClose}>
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

                {setSummary && (
                    <div className="db-detail-sets">
                        <div className="db-detail-sets-title">세트별 점수</div>
                        {setSummary.rows.map((set) => (
                            <div key={set.label} className="db-detail-set-row">
                                <span>{set.label}</span>
                                <strong>
                                    {set.home} : {set.away}
                                </strong>
                                <span>{set.winnerTeam || '진행/대기'}</span>
                            </div>
                        ))}
                    </div>
                )}

                {relayState?.currentQuarter && (
                    <div className="db-detail-quarter">현재 구간: {relayState.currentQuarter}</div>
                )}

                <div className="db-detail-feed">
                    <div className="db-detail-feed-head">
                        <div className="db-detail-feed-title">점수 상세 내역</div>
                        {setFilterOptions.length > 0 && (
                            <div className="db-detail-set-tabs" role="tablist" aria-label="세트별 상세 내역 보기">
                                <button
                                    type="button"
                                    className={selectedSet === 'all' ? 'active' : ''}
                                    onClick={() => setSelectedSet('all')}
                                    role="tab"
                                    aria-selected={selectedSet === 'all'}
                                >
                                    전체
                                </button>
                                {setFilterOptions.map((set) => (
                                    <button
                                        type="button"
                                        className={selectedSet === set.label ? 'active' : ''}
                                        onClick={() => setSelectedSet(set.label)}
                                        role="tab"
                                        aria-selected={selectedSet === set.label}
                                        key={set.label}
                                    >
                                        {set.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {loading ? (
                        <div className="db-detail-empty">중계 기록을 불러오는 중입니다.</div>
                    ) : filteredComments.length > 0 ? (
                        filteredComments
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
                        <div className="db-detail-empty">
                            {selectedSet === 'all'
                                ? '아직 등록된 상세 기록이 없습니다.'
                                : `${selectedSet} 상세 기록이 없습니다.`}
                        </div>
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
    const [setCommentsMap, setSetCommentsMap] = useState({});
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [selectedTugDetail, setSelectedTugDetail] = useState(null);
    const [selectedMidDetail, setSelectedMidDetail] = useState(null);
    const lastTsRef = useRef({});

    const liveMatchMap = useMemo(() => {
        return LIVE_MATCHES.reduce((acc, match) => {
            acc[match.id] = match;
            return acc;
        }, {});
    }, []);

    const setMatchIds = useMemo(() => {
        const ids = INITIAL_DASHBOARD_EVENTS.flatMap(getEventDivisions)
            .map(getRelayMatchId)
            .filter(Boolean)
            .filter((matchId) => {
                const m = liveMatchMap[matchId];
                return m && (isSetMatch(m) || m.mode === 'scoring');
            });
        return [...new Set(ids)];
    }, [liveMatchMap]);

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
        if (setMatchIds.length === 0) return;
        let cancelled = false;
        let pullCount = 0;
        const FULL_RELOAD_EVERY = 15;

        const pull = async () => {
            // 주기적으로 lastTs 초기화 → 다음 fetch는 since=0
            if (pullCount > 0 && pullCount % FULL_RELOAD_EVERY === 0) {
                lastTsRef.current = {};
            }
            pullCount += 1;

            const results = await Promise.allSettled(
                setMatchIds.map(async (matchId) => {
                    const since = lastTsRef.current[matchId] ?? 0;
                    const data = await fetchComments(matchId, since);
                    return { matchId, since, comments: data.comments || [] };
                })
            );

            if (cancelled) return;

            setSetCommentsMap((prev) => {
                const next = { ...prev };
                let changed = false;

                for (const r of results) {
                    if (r.status !== 'fulfilled') continue;
                    const { matchId, since, comments } = r.value;
                    if (comments.length === 0) continue;

                    if (since === 0) {
                        // 첫 폴링 — 통째로 채움
                        next[matchId] = comments;
                        changed = true;
                    } else {
                        // 증분 — 기존에 합치고 id로 중복 제거
                        const existing = prev[matchId] || [];
                        const seen = new Set(existing.map((c) => c.id));
                        const fresh = comments.filter((c) => !seen.has(c.id));
                        if (fresh.length > 0) {
                            next[matchId] = existing.concat(fresh);
                            changed = true;
                        }
                    }

                    // lastTs 갱신 (응답에서 가장 늦은 ts)
                    const lastTs = comments[comments.length - 1]?.ts;
                    if (lastTs) {
                        const cur = lastTsRef.current[matchId] ?? 0;
                        lastTsRef.current[matchId] = Math.max(cur, lastTs);
                    }
                }

                return changed ? next : prev; // 새 코멘트 0개면 같은 ref 반환 → 리렌더 스킵
            });
        };

        pull();
        const timer = window.setInterval(pull, 4000);
        return () => {
            cancelled = true;
            window.clearInterval(timer);
        };
    }, [setMatchIds]);

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

    const eventContexts = useMemo(() => {
        return events.map((event) => ({
            eventId: event.id,
            context: getEventContext(event, relayStatesMap, liveMatchMap, setCommentsMap),
        }));
    }, [events, liveMatchMap, relayStatesMap, setCommentsMap]);

    const eventContextMap = useMemo(() => {
        return eventContexts.reduce((acc, item) => {
            acc[item.eventId] = item.context;
            return acc;
        }, {});
    }, [eventContexts]);

    const stats = useMemo(() => {
        const contexts = eventContexts.map((item) => item.context);
        const allDivisions = contexts.flatMap((context) => context.divisions);
        return {
            total: allDivisions.length,
            done: allDivisions.filter((d) => d.state === 'done').length,
            live: allDivisions.filter((d) => d.state === 'live').length,
            campusWins: getCampusWinCountsFromContexts(contexts),
        };
    }, [eventContexts]);

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
                    <LiveClock />
                    <span className="db-live-summary">
                        {stats.done}/{stats.total} 완료 · {stats.live} 진행
                    </span>
                </div>
            </section>

            <section className="db-board" aria-label="종목별 결과 현황">
                <div className="db-event-list">
                    {events.map((event) => {
                        const context = eventContextMap[event.id] || getEventContext(event);
                        const isChampion = context.isDone && context.winnerKey !== 'pending';
                        const eventCampus = isChampion ? getCampus(context.winnerKey) : getCampus('pending');
                        const eventStatus = getEventStatusLabelFromContext(event, context);

                        return (
                            <article
                                className={`db-event-card event-${event.id} ${context.isLive ? 'has-live' : ''} ${isChampion ? `is-champion ${eventCampus.className}` : ''}`}
                                key={event.id}
                            >
                                <div className="db-event-top">
                                    <div className="db-event-title-row">
                                        <h2>{event.sport}</h2>
                                        <span className="db-event-status">{eventStatus}</span>
                                    </div>
                                    {isChampion && (
                                        <div className="db-winner-box is-final">
                                            <CampusBadge campus={eventCampus} size="sm" />
                                        </div>
                                    )}
                                </div>

                                {event.id === 'middle-distance' ? (
                                    <MiddleDistanceCard
                                        divisions={context.divisions}
                                        liveMatchMap={liveMatchMap}
                                        commentsMap={setCommentsMap}
                                        onOpenDetail={(detail) => setSelectedMidDetail(detail)}
                                    />
                                ) : event.id === 'tug-of-war' ? (
                                    <TugOfWarCard
                                        divisions={context.divisions}
                                        onOpenDetail={(detail) => setSelectedTugDetail(detail)}
                                    />
                                ) : event.groups ? (
                                    <TaekwondoGroups
                                        event={event}
                                        groups={event.groups}
                                        liveMatchMap={liveMatchMap}
                                        relayStatesMap={relayStatesMap}
                                        relayCommentsMap={setCommentsMap}
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
                                                    relayComments={matchId ? setCommentsMap[matchId] || [] : []}
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
            <TugDetailModal
                detail={selectedTugDetail}
                liveMatchMap={liveMatchMap}
                onClose={() => setSelectedTugDetail(null)}
            />
            <MiddleDistanceDetailModal detail={selectedMidDetail} onClose={() => setSelectedMidDetail(null)} />
        </div>
    );
}
