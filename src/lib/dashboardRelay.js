// 종목 부문(division) → Live Relay 경기 ID 매핑.
// 대시보드에서 라이브 점수를 표시할 때, 어떤 경기의 점수를 보여줄지 찾는 데 사용.
// (승패 판정/상태 병합은 Worker의 /api/dashboard 가 담당)
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
    'chess-7-8': 'sat-chess-1',
    'chess-9-10': 'sat-chess-2',
    'chess-11-12': 'sat-chess-3',
    'tug-students': 'sat-tug-1',
    'tug-adults': 'sat-tug-2',
    'tk-sparring-mid': 'sat-tk-1',
    'tk-sparring-high': 'sat-tk-2',
    // 채점제 매치 매핑
    'tk-routine': 'sat-tk-demo',
    'tk-poomsae-mid': 'sat-tk-poomsae-mid',
    'tk-poomsae-high': 'sat-tk-poomsae-high',
    'distance-mid-women': 'sat-mid-mid-f',
    'distance-mid-men': 'sat-mid-mid-m',
    'distance-high-women': 'sat-mid-high-f',
    'distance-high-men': 'sat-mid-high-m',
    'relay-main': 'sat-relay',
    'table-mid': 'sat-tt-mid',
    'table-high': 'sat-tt-high',
    'table-popular': 'sat-tt-popular',
    'table-staff': 'sat-tt-staff',
};

export function getRelayMatchId(division) {
    return division.relayMatchId || DIVISION_RELAY_MATCHES[division.id] || null;
}

export function getScorePair(relayState) {
    return {
        home: Number(relayState?.homeScore) || 0,
        away: Number(relayState?.awayScore) || 0,
    };
}
