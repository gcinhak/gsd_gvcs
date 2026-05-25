export function isVolleyballMatch(match) {
    return Boolean(match?.id?.startsWith('fri-vb'));
}

export function isVolleyballEvent(event) {
    return event?.id === 'volleyball';
}

export function getVolleyballSetScores(comments = [], match, sets = [], state = {}) {
    const rows = sets.map((label) => ({
        label,
        home: 0,
        away: 0,
        winnerSide: null,
        winnerTeam: null,
    }));
    const rowMap = new Map(rows.map((row) => [row.label, row]));

    for (const comment of comments) {
        if (!comment.quarter || !comment.scoreSide || !comment.scoreAmount) continue;
        const row = rowMap.get(comment.quarter);
        if (!row) continue;
        if (comment.scoreSide === 'home') row.home += Number(comment.scoreAmount) || 0;
        if (comment.scoreSide === 'away') row.away += Number(comment.scoreAmount) || 0;
    }

    const currentIndex = rows.findIndex((row) => row.label === state.currentQuarter);
    for (const [index, row] of rows.entries()) {
        const hasScore = row.home !== row.away && (row.home > 0 || row.away > 0);
        const setIsClosed =
            state.status === 'finished' ||
            (currentIndex >= 0 && index < currentIndex) ||
            (currentIndex < 0 && state.status !== 'live');
        if (!hasScore || !setIsClosed) continue;
        row.winnerSide = row.home > row.away ? 'home' : 'away';
        row.winnerTeam = row.winnerSide === 'home' ? match?.teams?.home : match?.teams?.away;
    }

    return rows;
}

export function getVolleyballSetSummary(comments = [], match, sets = [], state = {}) {
    const rows = getVolleyballSetScores(comments, match, sets, state);
    return rows.reduce(
        (summary, row) => {
            if (row.winnerSide === 'home') summary.home += 1;
            if (row.winnerSide === 'away') summary.away += 1;
            return summary;
        },
        { home: 0, away: 0, rows }
    );
}
