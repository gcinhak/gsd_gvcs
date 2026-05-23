export const DIVISION_RELAY_MATCHES = {
    'soccer-high-men': 'sat-fb-4',
    'soccer-mid-men': 'sat-fb-2',
    'soccer-mix-women': 'sat-fb-3',
    'basketball-high-men': 'thu-bb-4',
    'basketball-mid-men': 'thu-bb-3',
    'basketball-mix-women': 'thu-bb-2',
    'volleyball-high-men': 'fri-vb-6',
    'volleyball-mid-men': 'fri-vb-4',
    'volleyball-mix-women': 'fri-vb-5',
    'tk-sparring-mid': 'sat-tk-1',
    'tk-sparring-high': 'sat-tk-2',
};

export function getRelayMatchId(division) {
    return division.relayMatchId || DIVISION_RELAY_MATCHES[division.id] || null;
}

export function getRelayDisplayState(division, relayState) {
    if (relayState?.status === 'live') return 'live';
    if (relayState?.status === 'finished') return 'done';
    return division.state || 'ready';
}

export function campusKeyFromTeamName(name = '') {
    if (name.includes('문경')) return 'mungyeong';
    if (name.includes('음성')) return 'eumseong';
    if (name.includes('세종')) return 'sejong';
    return 'pending';
}

export function getRelayWinnerKey(match, relayState) {
    if (!match || relayState?.status !== 'finished') return 'pending';

    const home = Number(relayState.homeScore) || 0;
    const away = Number(relayState.awayScore) || 0;
    if (home === away) return 'pending';

    const winnerName = home > away ? match.teams.home : match.teams.away;
    return campusKeyFromTeamName(winnerName);
}

export function getEffectiveDivisionWinnerKey(division, match, relayState) {
    if (division.winnerKey && division.winnerKey !== 'pending') return division.winnerKey;
    return getRelayWinnerKey(match, relayState);
}

export function getScorePair(relayState) {
    return {
        home: Number(relayState?.homeScore) || 0,
        away: Number(relayState?.awayScore) || 0,
    };
}
