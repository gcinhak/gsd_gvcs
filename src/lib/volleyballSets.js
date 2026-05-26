export const VOLLEYBALL_SET_END_TEXT = '세트 종료';

export function isVolleyballMatch(match) {
    return Boolean(match?.id?.startsWith('fri-vb'));
}

export function isVolleyballEvent(event) {
    return event?.id === 'volleyball';
}

export function isWinnerOnlySetMatch(match) {
    return Boolean(match?.id?.startsWith('sat-chess') || match?.id?.startsWith('sat-tug'));
}

export function isSetMatch(match) {
    return isVolleyballMatch(match) || isWinnerOnlySetMatch(match);
}

export function isSetEvent(event) {
    return event?.id === 'volleyball' || event?.id === 'chess' || event?.id === 'tug-of-war';
}

export function getSetTargetWins(match) {
    return isSetMatch(match) ? 2 : 0;
}

export function getSetScores(comments = [], match, sets = [], state = {}) {
    const winnerOnly = isWinnerOnlySetMatch(match);
    const rows = sets.map((label) => ({
        label,
        home: 0,
        away: 0,
        winnerSide: null,
        winnerTeam: null,
        isEnded: false,
    }));
    const rowMap = new Map(rows.map((row) => [row.label, row]));

    for (const comment of comments) {
        if (!comment.quarter) continue;
        const row = rowMap.get(comment.quarter);
        if (!row) continue;

        const isSetEnd = String(comment.content || '').includes(VOLLEYBALL_SET_END_TEXT);
        if (isSetEnd) row.isEnded = true;

        if (!comment.scoreSide) continue;

        if (winnerOnly && isSetEnd) {
            row.winnerSide = comment.scoreSide;
            row.winnerTeam = comment.scoreSide === 'home' ? match?.teams?.home : match?.teams?.away;
            if (comment.scoreSide === 'home') row.home = 1;
            if (comment.scoreSide === 'away') row.away = 1;
            continue;
        }

        if (!comment.scoreAmount) continue;
        if (comment.scoreSide === 'home') row.home += Number(comment.scoreAmount) || 0;
        if (comment.scoreSide === 'away') row.away += Number(comment.scoreAmount) || 0;
    }

    const currentIndex = rows.findIndex((row) => row.label === state.currentQuarter);
    for (const [index, row] of rows.entries()) {
        if (row.winnerSide) continue;
        const hasScore = row.home !== row.away && (row.home > 0 || row.away > 0);
        const setIsClosed =
            row.isEnded ||
            state.status === 'finished' ||
            (currentIndex >= 0 && index < currentIndex) ||
            (currentIndex < 0 && state.status !== 'live');
        if (!hasScore || !setIsClosed) continue;
        row.winnerSide = row.home > row.away ? 'home' : 'away';
        row.winnerTeam = row.winnerSide === 'home' ? match?.teams?.home : match?.teams?.away;
    }

    return rows;
}

export function getSetSummary(comments = [], match, sets = [], state = {}) {
    const rows = getSetScores(comments, match, sets, state);
    return rows.reduce(
        (summary, row) => {
            if (row.winnerSide === 'home') summary.home += 1;
            if (row.winnerSide === 'away') summary.away += 1;
            return summary;
        },
        { home: 0, away: 0, rows }
    );
}

export const getVolleyballSetScores = getSetScores;
export const getVolleyballSetSummary = getSetSummary;
