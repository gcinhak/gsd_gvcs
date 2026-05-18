export const TARGET_DATE = new Date('2026-05-30T09:00:00');

/* ──────────────────────────────────────────────────────────
   THEME PALETTES — 흰색 베이스 스포츠 사이트 톤
   네이버 스포츠 / KBO 스타일 (밝은 배경, 진한 액센트)
────────────────────────────────────────────────────────── */
export const THEMES = {
    blue: {
        name: '블루',
        primary: '#1d4ed8',        // 진한 블루 (버튼/포인트)
        primaryDark: '#1e3a8a',
        primarySoft: '#dbeafe',    // 옅은 배경 틴트
        primaryLine: '#93c5fd',    // 활성 라인/보더
        primaryInk: '#ffffff',     // 진한 블루 위에 올라가는 글자
    },
    red: {
        name: '레드',
        primary: '#dc2626',
        primaryDark: '#991b1b',
        primarySoft: '#fee2e2',
        primaryLine: '#fca5a5',
        primaryInk: '#ffffff',
    },
    green: {
        name: '그린',
        primary: '#059669',
        primaryDark: '#065f46',
        primarySoft: '#d1fae5',
        primaryLine: '#6ee7b7',
        primaryInk: '#ffffff',
    },
};

/* ──────────────────────────────────────────────────────────
   응원전 영상 (연도별 + 캠퍼스별)
────────────────────────────────────────────────────────── */
export const YEARS = [
    {
        year: 2025,
        color: '#1d4ed8',
        soft: '#dbeafe',
        videos: [
            { id: 'fEnq3d-uKXA', campus: '문경', label: '문경 응원전' },
            { id: 'UF3dDM0MlF4', campus: '음성', label: '음성 응원전' },
        ],
    },
    {
        year: 2024,
        color: '#4f46e5',
        soft: '#e0e7ff',
        videos: [{ id: 'rljlFUm5hUM', campus: '문경', label: '문경 응원전' }],
    },
    {
        year: 2023,
        color: '#0891b2',
        soft: '#cffafe',
        videos: [{ id: '-DtEM16yC8o', campus: '문경', label: '문경 응원전' }],
    },
    {
        year: 2022,
        color: '#059669',
        soft: '#d1fae5',
        videos: [
            { id: 'UhRKLqWNoio', campus: '문경', label: '문경 단체' },
            { id: 'EU19d_kOl18', campus: '문경', label: '문경 댄스' },
            { id: 'p4Q0KR-p1TU', campus: '음성', label: '음성 단체' },
            { id: 'S9osgUg2kao', campus: '음성', label: '음성 댄스' },
        ],
    },
];

/* ──────────────────────────────────────────────────────────
   경기 일정 (Coming Soon 상태)
   날짜/장소가 확정되면 stage·rounds·location 등을 채워주세요.
────────────────────────────────────────────────────────── */
export const SCHEDULE = {
    status: 'coming_soon',
    preliminary: {
        label: '예선전',
        dateRange: '2026년 5월 28일(목) ~ 29일(금)',
        location: '문경캠 / 음성캠 동시 진행 (장소 미정)',
        rounds: [],
    },
    finals: {
        label: '본선',
        dateRange: '2026년 5월 30일(토)',
        location: '본선 장소 미정',
        kickOff: '09:00',
        rounds: [],
    },
};

/* ──────────────────────────────────────────────────────────
   종목 카탈로그 (라인업/경기영상에 공통 사용)
   필요에 따라 종목을 추가/수정하세요.
────────────────────────────────────────────────────────── */
export const EVENTS = [
    { key: 'basketball', name: '농구', emoji: '🏀' },
    { key: 'soccer', name: '축구', emoji: '⚽' },
    { key: 'volleyball', name: '배구', emoji: '🏐' },
    { key: 'dodgeball', name: '피구', emoji: '🤾' },
    { key: 'relay', name: '계주', emoji: '🏃' },
    { key: 'tugofwar', name: '줄다리기', emoji: '🪢' },
];

/* ──────────────────────────────────────────────────────────
   종목별 경기영상 (연도별 + 종목별 + 라운드별)
   round: 'preliminary' | 'final'
   videoId가 비어 있으면 'Coming Soon'으로 표시됩니다.
────────────────────────────────────────────────────────── */
export const GAME_VIDEOS = [
    // 2025
    { year: 2025, event: 'basketball', round: 'final', label: '농구 본선', videoId: '' },
    { year: 2025, event: 'soccer', round: 'final', label: '축구 본선', videoId: '' },
    { year: 2025, event: 'volleyball', round: 'final', label: '배구 본선', videoId: '' },
    // 2024
    { year: 2024, event: 'basketball', round: 'final', label: '농구 본선', videoId: '' },
    { year: 2024, event: 'soccer', round: 'final', label: '축구 본선', videoId: '' },
    // 2023
    { year: 2023, event: 'basketball', round: 'final', label: '농구 본선', videoId: '' },
    // 2022
    { year: 2022, event: 'basketball', round: 'final', label: '농구 본선', videoId: '' },
];

/* ──────────────────────────────────────────────────────────
   캠퍼스 식별 컬러 (2024 현황판 컨벤션 기준)
────────────────────────────────────────────────────────── */
export const CAMPUS_COLORS = {
    문경: { bg: '#1d4ed8', text: '#ffffff', soft: '#dbeafe' },
    음성: { bg: '#dc2626', text: '#ffffff', soft: '#fee2e2' },
    세종: { bg: '#059669', text: '#ffffff', soft: '#d1fae5' },
    '미국/세종': { bg: '#7c3aed', text: '#ffffff', soft: '#ede9fe' },
    미국: { bg: '#7c3aed', text: '#ffffff', soft: '#ede9fe' },
};

/* ──────────────────────────────────────────────────────────
   역대 전적
   각 연도는 다음을 가질 수 있습니다:
     overall : { winner, note }
     cheer   : { winner, note, scores?, rankings? }
     events  : [
       {
         name,
         winner,
         finalScore?,       // 예: '2:1'
         note?,             // 비고
         gameCount?,        // 총 경기수
         wins?: [{ campus, count }],   // 캠퍼스별 승수 집계
         matches?: [{ label, winner, score?, note? }], // 세부 경기
       }
     ]
────────────────────────────────────────────────────────── */
export const HISTORY = [
    {
        year: 2025,
        overall: {
            winner: '음성',
            note: '7종목 중 5종목 우승으로 음성캠퍼스 종합우승',
        },
        cheer: {
            winner: '문경',
            note: '응원전 심사 결과 (총 2500점 만점)',
            scores: [
                { campus: '문경', total: 2443 },
                { campus: '음성', total: 2370 },
            ],
        },
        events: [
            { name: '탁구', winner: '음성', gameCount: 4, wins: [{ campus: '음성', count: 2 }, { campus: '문경', count: 1 }] },
            { name: '태권도', winner: '음성', gameCount: 5, wins: [{ campus: '음성', count: 0 }, { campus: '문경', count: 5 }], note: '원본 표 기준 우승 표기. 승수와 차이가 있어 확인 필요' },
            { name: '축구', winner: '음성', gameCount: 2, wins: [{ campus: '음성', count: 1 }, { campus: '문경', count: 1 }], note: '승부차기 승' },
            { name: '배구', winner: '문경', gameCount: 3, wins: [{ campus: '음성', count: 0 }, { campus: '문경', count: 3 }, { campus: '세종', count: 0 }] },
            { name: '농구', winner: '문경', gameCount: 3, wins: [{ campus: '음성', count: 3 }, { campus: '문경', count: 0 }, { campus: '세종', count: 0 }], note: '원본 표 기준 우승 표기. 승수와 차이가 있어 확인 필요' },
            { name: '체스', winner: '음성', gameCount: 3, wins: [{ campus: '음성', count: 1 }, { campus: '문경', count: 1 }, { campus: '세종', count: 1 }], note: '남녀 기록수 합산' },
            { name: '줄다리기', winner: '음성', gameCount: 3, wins: [{ campus: '음성', count: 2 }, { campus: '문경', count: 1 }, { campus: '세종', count: 0 }] },
        ],
    },
    {
        year: 2024,
        overall: {
            winner: '문경',
            note: '7종목 중 6종목 우승 (응원전 결과 미반영)',
        },
        cheer: { winner: null },
        events: [
            {
                name: '축구', winner: '문경',
                matches: [
                    { label: '중학교(남)', winner: '음성' },
                    { label: '고등학교(남)', winner: '문경' },
                    { label: '중고연합(여)', winner: '문경' },
                ],
            },
            {
                name: '배구', winner: '문경',
                matches: [
                    { label: '중학교(남)', winner: '세종' },
                    { label: '고등학교(남)', winner: '문경' },
                    { label: '중고연합(여)', winner: '문경' },
                    { label: '동문/인기모(남)', winner: '음성' },
                    { label: '동문/인기모(여)', winner: '음성' },
                ],
            },
            {
                name: '농구', winner: '문경',
                matches: [
                    { label: '중학교(남)', winner: '문경' },
                    { label: '고등학교(남)', winner: '문경' },
                    { label: '중고연합(여)', winner: '문경' },
                ],
            },
            {
                name: '태권도', winner: '음성',
                matches: [
                    { label: '품새 중등부', winner: '문경' },
                    { label: '품새 고등부', winner: '문경' },
                    { label: '겨루기 단체전 남자부', winner: '음성' },
                    { label: '겨루기 단체전 여자부', winner: '음성' },
                    { label: '태권체조', winner: '음성' },
                ],
            },
            {
                name: '탁구', winner: '문경',
                matches: [
                    { label: '7학년', winner: '문경' },
                    { label: '8학년', winner: '음성' },
                    { label: '9학년', winner: '문경' },
                    { label: '10학년', winner: '문경' },
                    { label: '11학년', winner: '문경' },
                    { label: '12학년', winner: '문경' },
                    { label: '교직원', winner: '문경' },
                    { label: '인기모(중)', winner: '문경' },
                    { label: '인기모(고)', winner: '음성' },
                ],
            },
            {
                name: '중거리달리기', winner: '문경',
                matches: [
                    { label: '중학교(남)', winner: '문경' },
                    { label: '중학교(여)', winner: '세종' },
                    { label: '고등학교(남)', winner: '문경' },
                    { label: '고등학교(여)', winner: '문경' },
                ],
            },
            {
                name: '줄다리기', winner: '문경',
                matches: [
                    { label: '동문', winner: '문경' },
                    { label: '인기모', winner: '문경' },
                    { label: '학생&교직원', winner: '문경' },
                ],
            },
        ],
    },
    {
        year: 2023,
        overall: {
            winner: '문경',
            note: '7종목 중 6종목 우승 (응원전 음성)',
        },
        cheer: { winner: '음성' },
        events: [
            {
                name: '축구', winner: '문경',
                matches: [
                    { label: '중학교', winner: '문경' },
                    { label: '고등학교', winner: '음성' },
                    { label: '여연합', winner: '문경' },
                    { label: '동문/인기모', winner: '문경' },
                ],
            },
            {
                name: '배구', winner: '음성',
                matches: [
                    { label: '중학교', winner: '문경' },
                    { label: '고등학교', winner: '음성' },
                    { label: '여연합', winner: '문경' },
                    { label: '동문/인기모', winner: '음성' },
                ],
            },
            {
                name: '농구', winner: '문경',
                matches: [
                    { label: '중학교', winner: '문경' },
                    { label: '고등학교', winner: '음성' },
                ],
            },
            {
                name: '태권도', winner: '문경',
                matches: [
                    { label: '품새', winner: '음성' },
                    { label: '겨루기 단체전', winner: '문경' },
                    { label: '태권체조', winner: '문경' },
                ],
            },
            {
                name: '탁구', winner: '문경',
                matches: [
                    { label: '7,8학년', winner: '문경' },
                    { label: '9학년', winner: '음성' },
                    { label: '10학년', winner: '문경' },
                    { label: '11학년', winner: '문경' },
                    { label: '12학년', winner: '문경' },
                    { label: '교직원', winner: '문경' },
                    { label: '인기모', winner: '문경' },
                ],
            },
            {
                name: '이어달리기', winner: '문경',
                matches: [
                    { label: '중등', winner: '음성' },
                    { label: '고등', winner: '문경' },
                    { label: '성인', winner: '음성' },
                ],
            },
            {
                name: '줄다리기', winner: '문경',
                matches: [
                    { label: '동문', winner: '음성' },
                    { label: '인기모', winner: '문경' },
                    { label: '학생&교직원', winner: '음성' },
                ],
            },
        ],
    },
    {
        year: 2022,
        overall: {
            winner: '문경',
            note: '6종목 우승 (2020·2021에 이어 3연속 종합우승)',
        },
        cheer: {
            winner: '음성',
            note: '응원전 합산 272.2점으로 음성캠퍼스 우승',
            scores: [
                {
                    campus: '문경',
                    breakdown: [
                        { name: '응원열전', value: 90.7 },
                        { name: '종합', value: 84.7 },
                        { name: 'KC-POP', value: 85.5 },
                    ],
                    total: 260.8,
                },
                {
                    campus: '미국/세종',
                    breakdown: [
                        { name: '응원열전', value: 81.0 },
                        { name: '종합', value: 70.0 },
                        { name: 'KC-POP', value: 84.4 },
                    ],
                    total: 235.4,
                },
                {
                    campus: '음성',
                    breakdown: [
                        { name: '응원열전', value: 93.4 },
                        { name: '종합', value: 89.3 },
                        { name: 'KC-POP', value: 89.4 },
                    ],
                    total: 272.2,
                },
            ],
            rankings: [
                { rank: 1, campus: '음성', team: 'GV 갓 선비', score: 90.5 },
                { rank: 2, campus: '문경', team: 'H.I.(Holy I)', score: 88.8 },
                { rank: 3, campus: '음성', team: '메가크루', score: 88.4 },
            ],
        },
        events: [
            { name: '탁구', winner: '문경', gameCount: 7, wins: [{ campus: '문경', count: 6 }, { campus: '음성', count: 1 }, { campus: '미국/세종', count: 0 }] },
            { name: '태권도', winner: '음성', gameCount: 5, wins: [{ campus: '문경', count: 3 }, { campus: '음성', count: 2 }, { campus: '미국/세종', count: 0 }], note: '문경 3승이나 총합점수에서 음성 우세로 음성 우승' },
            { name: '축구', winner: '문경', gameCount: 4, wins: [{ campus: '문경', count: 3 }, { campus: '음성', count: 1 }, { campus: '미국/세종', count: 0 }] },
            { name: '배구', winner: '문경', gameCount: 3, wins: [{ campus: '문경', count: 2 }, { campus: '음성', count: 1 }, { campus: '미국/세종', count: 0 }] },
            { name: '농구', winner: '문경', gameCount: 3, wins: [{ campus: '문경', count: 2 }, { campus: '음성', count: 1 }, { campus: '미국/세종', count: 0 }] },
            { name: '중거리', winner: '문경', gameCount: 4, wins: [{ campus: '문경', count: 2 }, { campus: '음성', count: 2 }, { campus: '미국/세종', count: 0 }] },
            { name: '줄다리기', winner: '음성', gameCount: 3, wins: [{ campus: '문경', count: 1 }, { campus: '음성', count: 2 }, { campus: '미국/세종', count: 0 }] },
            { name: '초등', winner: '문경', gameCount: 2, wins: [{ campus: '문경', count: 1 }, { campus: '음성', count: 1 }, { campus: '미국/세종', count: 0 }] },
        ],
    },
    {
        year: 2021,
        overall: { winner: null, note: '데이터 일부만 확인됨' },
        cheer: { winner: null },
        events: [
            {
                name: '농구', winner: '음성', finalScore: '1:2',
                matches: [
                    { label: '남중', winner: '음성', score: '문경 15 : 16 음성' },
                    { label: '여자연합', winner: '문경', score: '문경 22 : 14 음성' },
                    { label: '남고', winner: '음성', score: '문경 12 : 15 음성' },
                ],
            },
            {
                name: '배구', winner: '문경', finalScore: '3:0',
                matches: [
                    { label: '남중', winner: '문경', score: '문경 2 : 0 음성' },
                    { label: '여자연합', winner: '문경', score: '문경 2 : 0 음성' },
                    { label: '남고', winner: '문경', score: '문경 2 : 1 음성' },
                ],
            },
            {
                name: '축구', winner: '문경', finalScore: '2:1',
                matches: [
                    { label: '남중', winner: '문경', score: '문경 1 : 1 음성', note: '승부차기 6:5 승' },
                    { label: '여자연합', winner: '문경', score: '문경 1 : 0 음성' },
                    { label: '남고', winner: '음성', score: '문경 0 : 1 음성' },
                ],
            },
            {
                name: '탁구', winner: '문경', finalScore: '4:2',
                matches: [
                    { label: '8학년', winner: '문경', score: '문경 3 : 0 음성' },
                    { label: '9학년', winner: '문경', score: '문경 3 : 0 음성' },
                    { label: '10학년', winner: '음성', score: '문경 1 : 2 음성' },
                    { label: '11학년', winner: '문경', score: '문경 3 : 0 음성' },
                    { label: '12학년', winner: '음성', score: '문경 0 : 3 음성' },
                    { label: '교직원', winner: '문경', score: '문경 2 : 1 음성' },
                ],
            },
            {
                name: '태권도', winner: '문경', finalScore: '5:2',
                matches: [
                    { label: '품새 8학년', winner: '문경', score: '문경 2 : 1 음성' },
                    { label: '품새 9·10학년', winner: '음성', score: '문경 0 : 3 음성' },
                    { label: '품새 11·12학년', winner: '음성', score: '문경 0 : 3 음성' },
                    { label: '남자 겨루기 9·10학년', winner: '문경', score: '문경 54 : 33 음성' },
                    { label: '남자 겨루기 11·12학년', winner: '문경', score: '문경 47 : 13 음성' },
                    { label: '여자 겨루기 9·10학년', winner: '문경', score: '문경 55 : 44 음성' },
                    { label: '여자 겨루기 11·12학년', winner: '문경', score: '문경 59 : 55 음성' },
                ],
            },
        ],
    },
];

/* ──────────────────────────────────────────────────────────
   하이라이트 영상 (Popcat 페이지 등에서 사용)
────────────────────────────────────────────────────────── */
export const HIGHLIGHTS = [
    // { id: 'youtube-video-id', label: '2025 하이라이트', year: 2025 },
];

/* ──────────────────────────────────────────────────────────
   "곧 추가될 기능" 안내 (사전 런칭용)
────────────────────────────────────────────────────────── */
export const UPCOMING_FEATURES = [
    {
        key: 'realtime',
        title: '실시간 문자 중계',
        desc: 'NBA/KBL 스타일 Play-by-Play로 본선 경기를 실시간 중계합니다.',
        status: '준비중',
    },
    {
        key: 'lineup',
        title: '종목별 라인업',
        desc: '음성·세종·문경 전체 캠퍼스 라인업이 본선 직전 공개됩니다.',
        status: '준비중',
    },
    {
        key: 'timeline',
        title: '전체 타임라인 + 위치',
        desc: '예선 종목별 진행 위치, 시간별 일정이 한눈에 들어오는 타임라인.',
        status: '준비중',
    },
    {
        key: 'popcat',
        title: '팝캣 클릭 카운터',
        desc: '응원 누적 클릭 수가 실시간으로 올라가는 응원 카운터.',
        status: '베타',
    },
    {
        key: 'highlight',
        title: '하이라이트 전용 창',
        desc: '명장면만 모아 보는 하이라이트 전용 페이지.',
        status: '준비중',
    },
];
