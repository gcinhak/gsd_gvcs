export const TARGET_DATE = new Date('2026-05-30T09:00:00');

/* ──────────────────────────────────────────────────────────
   THEME PALETTES — 흰색 베이스 스포츠 사이트 톤
   네이버 스포츠 / KBO 스타일 (밝은 배경, 진한 액센트)
────────────────────────────────────────────────────────── */
export const THEMES = {
    blue: {
        name: '블루',
        primary: '#1d4ed8', // 진한 블루 (버튼/포인트)
        primaryDark: '#1e3a8a',
        primarySoft: '#dbeafe', // 옅은 배경 틴트
        primaryLine: '#93c5fd', // 활성 라인/보더
        primaryInk: '#ffffff', // 진한 블루 위에 올라가는 글자
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
    {
        year: 2019,
        color: '#c2410c',
        soft: '#ffedd5',
        videos: [
            { id: 'pyNlyms0IDY', campus: '문경', label: '문경 1부' },
            { id: 'yPwJ-QmnUKQ', campus: '문경', label: '문경 2부' },
        ],
    },
    {
        year: 2017,
        color: '#7c3aed',
        soft: '#ede9fe',
        videos: [
            { id: 'v3YktPGB3vc', campus: '문경', label: '문경 1부' },
            { id: 'B5fzWEOLk98', campus: '문경', label: '문경 2부' },
        ],
    },
    {
        year: 2016,
        color: '#b45309',
        soft: '#fef3c7',
        videos: [
            { id: 'CzpsyfWmh_g', campus: '문경', label: '문경 1부' },
            { id: 'wfpbMMd3NCw', campus: '문경', label: '문경 2부' },
            { id: 'lcOMDlnLQ_g', campus: '음성', label: '음성 3부' },
        ],
    },
];

/* ──────────────────────────────────────────────────────────
   2026 경기 일정
────────────────────────────────────────────────────────── */
export const SCHEDULE = {
    thursday: {
        key: 'thursday',
        date: '2026년 5월 28일 (목)',
        shortDate: '5/28 (목)',
        title: '농구',
        emoji: '🏀',
        matches: [
            { num: '1경기', round: '예선', category: '남자 고등', match: '문경 VS 음성' },
            { num: '2경기', round: '결선', category: '여자 연합', match: '문경 VS 음성' },
            { num: '3경기', round: '결선', category: '남자 중등', match: '문경 VS 음성' },
            { num: '4경기', round: '결선', category: '남자 고등', match: '세종 VS 예선 승리 팀' },
        ],
    },
    friday: {
        key: 'friday',
        date: '2026년 5월 29일 (금)',
        shortDate: '5/29 (금)',
        title: '배구',
        emoji: '🏐',
        matches: [
            { num: '1경기', round: '예선', category: '남중', match: '문경 VS 음성' },
            { num: '2경기', round: '예선', category: '여연합', match: '음성 VS 세종' },
            { num: '3경기', round: '예선', category: '남고', match: '문경 VS 음성' },
            { num: '4경기', round: '결선', category: '남중', match: '세종 VS 예선 승리 팀' },
            { num: '5경기', round: '결선', category: '여연합', match: '문경 VS 예선 승리 팀' },
            { num: '6경기', round: '결선', category: '남고', match: '세종 VS 예선 승리 팀' },
        ],
    },
    saturday: {
        key: 'saturday',
        date: '2026년 5월 30일 (토)',
        shortDate: '5/30 (토)',
        title: '체육축제',
        emoji: '🎉',
        venues: [
            {
                name: '보조경기장',
                kind: 'timeline',
                items: [
                    { start: '9:00', end: '9:30', label: '개회식', meta: '30분' },
                    { start: '9:30', end: '9:50', label: '태권도 시범', meta: '15분' },
                    { start: '9:50', end: '10:40', label: '응원전' },
                    { start: '10:40', end: '11:10', label: '중거리 달리기' },
                    { start: '11:10', end: '11:40', label: '초등 경기' },
                    { start: '11:40', end: '12:30', label: '예선) 축구 남고부', sub: '음성 VS 세종', meta: '50분' },
                    { start: '12:30', end: '13:20', label: '결선) 축구 남중부', sub: '음성 VS 문경', meta: '50분' },
                    { start: '13:20', end: '14:00', label: '결선) 축구 여자연합', sub: '음성 VS 문경', meta: '40분' },
                    {
                        start: '14:00',
                        end: '14:50',
                        label: '결선) 축구 남고부',
                        sub: '문경 VS 예선 승리팀',
                        meta: '50분',
                    },
                    { start: '15:30', end: '16:00', label: '줄다리기·이어달리기 선수 확인', meta: '주변 정리' },
                    { start: '16:10', end: '16:35', label: '결선) 줄다리기 학부모', meta: '25분' },
                    { start: '16:35', end: '17:00', label: '결선) 줄다리기 학생', meta: '4경기 25분' },
                    { start: '17:00', end: '17:30', label: '결선) 이어달리기', meta: '30분' },
                    { start: '17:30', end: '18:00', label: '폐회식' },
                ],
            },
            {
                name: '보조실내체육관 1층',
                subtitle: '태권도',
                kind: 'timeline',
                items: [
                    { start: '11:10', end: '11:20', label: '결선) 품새 중등 혼성', meta: '10분' },
                    { start: '11:20', end: '11:35', label: '결선) 품새 고등 혼성', meta: '15분' },
                    { start: '11:35', end: '11:45', label: '결선) 태권체조', meta: '10분' },
                    { start: '11:45', end: '12:05', label: '결선) 겨루기 여자', sub: '문경 VS 음성', meta: '20분' },
                    { start: '12:05', end: '12:25', label: '결선) 겨루기 남자', sub: '문경 VS 음성', meta: '20분' },
                ],
            },
            {
                name: '조치원복합커뮤니티센터 · 중회의실',
                subtitle: '체스 — 장소 3곳 운영',
                kind: 'timeline',
                items: [
                    { start: '12:00', end: '13:00', label: '결선) 체스 중등부', meta: '45분' },
                    { start: '13:00', end: '14:00', label: '결선) 체스 고등부', meta: '45분' },
                ],
            },
            {
                name: '보조실내체육관 2층',
                subtitle: '탁구 — 코트 3개 동시 진행',
                kind: 'courts',
                courtNames: ['코트 1', '코트 2', '코트 3'],
                rows: [
                    {
                        num: '1-1경기',
                        start: '13:50',
                        end: '14:00',
                        courts: [
                            { category: '예선) 인기모 남 단식', match: '문경 VS 세종' },
                            { category: '예선) 인기모 여 단식', match: '문경 VS 세종' },
                            null,
                        ],
                    },
                    {
                        num: '1-2경기',
                        start: '14:00',
                        end: '14:10',
                        courts: [null, null, { category: '예선) 인기모 복식', match: '문경 VS 세종' }],
                    },
                    {
                        num: '2-1경기',
                        start: '14:10',
                        end: '14:20',
                        courts: [
                            { category: '예선) 중학교 여 단식', match: '음성 VS 세종' },
                            { category: '예선) 중학교 남 단식', match: '음성 VS 세종' },
                            { category: '예선) 고등학교 복식', match: '문경 VS 음성' },
                        ],
                    },
                    {
                        num: '2-2경기',
                        start: '14:20',
                        end: '14:30',
                        courts: [
                            { category: '예선) 중학교 복식', match: '음성 VS 세종' },
                            { category: '예선) 고등학교 남 단식', match: '문경 VS 음성' },
                            { category: '예선) 고등학교 여 단식', match: '문경 VS 음성' },
                        ],
                    },
                    {
                        num: '3-1경기',
                        start: '14:30',
                        end: '14:40',
                        // isFinal: true,
                        courts: [
                            { category: '결선) 인기모 남 단식', match: '음성 VS 예선 승리 팀' },
                            { category: '결선) 인기모 여 단식', match: '음성 VS 예선 승리 팀' },
                            null,
                        ],
                    },
                    {
                        num: '3-2경기',
                        start: '14:40',
                        end: '14:50',
                        // isFinal: true,
                        courts: [null, null, { category: '결선) 인기모 복식', match: '음성 VS 예선 승리 팀' }],
                    },
                    {
                        num: '4-1경기',
                        start: '14:50',
                        end: '15:00',
                        // isFinal: true,
                        courts: [
                            { category: '결선) 중학교 복식', match: '문경 VS 예선 승리 팀' },
                            { category: '결선) 고등학교 남 단식', match: '세종 VS 예선 승리 팀' },
                            { category: '결선) 고등학교 여 단식', match: '세종 VS 예선 승리 팀' },
                        ],
                    },
                    {
                        num: '4-2경기',
                        start: '15:00',
                        end: '15:10',
                        // isFinal: true,
                        courts: [
                            { category: '결선) 중학교 남 단식', match: '문경 VS 예선 승리 팀' },
                            { category: '결선) 중학교 여 단식', match: '문경 VS 예선 승리 팀' },
                            { category: '결선) 고등학교 복식', match: '세종 VS 예선 승리 팀' },
                        ],
                    },
                ],
            },
        ],
    },
};

/* ──────────────────────────────────────────────────────────
   종목 카탈로그 (라인업/경기영상에 공통 사용)
   필요에 따라 종목을 추가/수정하세요.
────────────────────────────────────────────────────────── */
export const EVENTS = [
    { key: 'soccer', name: '축구', emoji: '⚽' },
    { key: 'basketball', name: '농구', emoji: '🏀' },
    { key: 'volleyball', name: '배구', emoji: '🏐' },
    { key: 'taekwondo', name: '태권도', emoji: '🥋' },
    { key: 'relay', name: '계주', emoji: '🏃' },
    { key: 'tugofwar', name: '줄다리기', emoji: '🪢' },
];

/* 역대 전적 종목 정렬 우선순위 — 모든 연도 카드를 동일 순서로 노출 */
export const EVENT_ORDER = [
    '축구',
    '농구',
    '배구',
    '태권도',
    '탁구',
    '체스',
    '계주',
    '이어달리기',
    '중거리달리기',
    '중거리',
    '줄다리기',
    '초등',
];

/* ──────────────────────────────────────────────────────────
   종목별 경기영상 (연도별 + 종목별 + 라운드별)
   round: 'preliminary' | 'final'
   videoId가 비어 있으면 'Coming Soon'으로 표시됩니다.
────────────────────────────────────────────────────────── */
export const GAME_VIDEOS = [
    // // 2025
    // { year: 2025, event: 'basketball', round: 'final', label: '농구 본선', videoId: '' },
    // { year: 2025, event: 'soccer', round: 'final', label: '축구 본선', videoId: '' },
    // { year: 2025, event: 'volleyball', round: 'final', label: '배구 본선', videoId: '' },
    // // 2024
    // { year: 2024, event: 'basketball', round: 'final', label: '농구 본선', videoId: '' },
    // { year: 2024, event: 'soccer', round: 'final', label: '축구 본선', videoId: '' },
    // // 2023
    // { year: 2023, event: 'basketball', round: 'final', label: '농구 본선', videoId: '' },
    // // 2022
    // { year: 2022, event: 'basketball', round: 'final', label: '농구 본선', videoId: '' },
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
            note: '2025년 경기 종합우승은 음성캠퍼스입니다.',
        },
        cheer: {
            winner: '문경',
            note: '2025년 응원전 우승은 문경캠퍼스입니다.',
        },
        events: [
            {
                name: '탁구',
                winner: '음성',
                matches: [
                    { label: '중등부', winner: '음성' },
                    { label: '고등부', winner: '음성' },
                    { label: '인기모', winner: '세종' },
                    { label: '교직원', winner: '문경' },
                ],
            },
            {
                name: '태권도',
                winner: '문경',
                matches: [
                    { label: '품새(중)', winner: '문경' },
                    { label: '품새(고)', winner: '문경' },
                    { label: '겨루기(중)', winner: '문경' },
                    { label: '겨루기(고)', winner: '문경' },
                    { label: '태권체조', winner: '문경' },
                ],
            },
            {
                name: '축구',
                winner: '음성',
                matches: [
                    { label: '중고연합(여)', winner: '음성' },
                    { label: '고등학교(남)', winner: '문경' },
                ],
            },
            {
                name: '배구',
                winner: '문경',
                matches: [
                    { label: '중학교(남)', winner: '문경' },
                    { label: '고등학교(남)', winner: '문경' },
                    { label: '중고연합(여)', winner: '문경' },
                ],
            },
            {
                name: '농구',
                winner: '음성',
                matches: [
                    { label: '중학교(남)', winner: '음성' },
                    { label: '고등학교(남)', winner: '음성' },
                    { label: '중고연합(여)', winner: '음성' },
                ],
            },
            {
                name: '체스',
                winner: '음성',
                matches: [
                    { label: '7·8학년', winner: '음성' },
                    { label: '9·10학년', winner: '세종' },
                    { label: '11·12학년', winner: '문경' },
                ],
            },
            {
                name: '줄다리기',
                winner: '음성',
                matches: [
                    { label: '중등부', winner: '음성' },
                    { label: '고등부', winner: '음성' },
                    { label: '장년부', winner: '문경' },
                ],
            },
        ],
    },

    {
        year: 2024,
        overall: {
            winner: '문경',
            note: '2024년 경기 종합우승은 문경캠퍼스입니다.',
        },
        cheer: {
            winner: '문경',
            note: '2024년 응원전 우승은 문경캠퍼스입니다.',
        },
        events: [
            {
                name: '축구',
                winner: '문경',
                matches: [
                    { label: '중학교(남)', winner: '음성' },
                    { label: '고등학교(남)', winner: '문경' },
                    { label: '중고연합(여)', winner: '문경' },
                ],
            },
            {
                name: '배구',
                winner: '문경',
                matches: [
                    { label: '중학교(남)', winner: '세종' },
                    { label: '고등학교(남)', winner: '문경' },
                    { label: '중고연합(여)', winner: '문경' },
                    { label: '동문/인기모(남)', winner: '음성' },
                    { label: '동문/인기모(여)', winner: '음성' },
                ],
            },
            {
                name: '농구',
                winner: '문경',
                matches: [
                    { label: '중학교(남)', winner: '문경' },
                    { label: '고등학교(남)', winner: '문경' },
                    { label: '중고연합(여)', winner: '문경' },
                ],
            },
            {
                name: '태권도',
                winner: '음성',
                matches: [
                    { label: '품새(중등)', winner: '문경' },
                    { label: '품새(고등)', winner: '문경' },
                    { label: '겨루기 단체전(남)', winner: '음성' },
                    { label: '겨루기 단체전(여)', winner: '음성' },
                    { label: '태권체조', winner: '음성' },
                ],
            },
            {
                name: '탁구',
                winner: '문경',
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
                name: '중거리달리기',
                winner: '문경',
                matches: [
                    { label: '중학교(남)', winner: '문경' },
                    { label: '중학교(여)', winner: '세종' },
                    { label: '고등학교(남)', winner: '문경' },
                    { label: '고등학교(여)', winner: '문경' },
                ],
            },
            {
                name: '줄다리기',
                winner: '문경',
                matches: [
                    { label: '중등부', winner: '문경' },
                    { label: '고등부', winner: '문경' },
                    { label: '장년부', winner: '문경' },
                ],
            },
        ],
    },

    {
        year: 2023,
        overall: {
            winner: '문경',
            note: '2023년 경기 종합우승은 문경캠퍼스입니다.',
        },
        cheer: {
            winner: '음성',
            note: '2023년 응원전 우승은 음성캠퍼스입니다.',
        },
        events: [
            {
                name: '축구',
                winner: '문경',
                matches: [
                    { label: '중학교(남)', winner: '문경' },
                    { label: '고등학교(남)', winner: '음성' },
                    { label: '중고연합(여)', winner: '문경' },
                    { label: '동문/인기모', winner: '문경' },
                ],
            },
            {
                name: '배구',
                winner: '음성',
                matches: [
                    { label: '중학교(남)', winner: '문경' },
                    { label: '고등학교(남)', winner: '음성' },
                    { label: '중고연합(여)', winner: '문경' },
                    { label: '동문/인기모', winner: '음성' },
                ],
            },
            {
                name: '농구',
                winner: '문경',
                matches: [
                    { label: '중학교(남)', winner: '문경' },
                    { label: '고등학교(남)', winner: '문경' },
                    { label: '중고연합(여)', winner: '음성' },
                ],
            },
            {
                name: '태권도',
                winner: '문경',
                matches: [
                    { label: '품새', winner: '음성' },
                    { label: '겨루기 단체전', winner: '문경' },
                    { label: '태권체조', winner: '문경' },
                ],
            },
            {
                name: '탁구',
                winner: '문경',
                matches: [
                    { label: '7·8학년', winner: '문경' },
                    { label: '9학년', winner: '음성' },
                    { label: '10학년', winner: '문경' },
                    { label: '11학년', winner: '문경' },
                    { label: '12학년', winner: '문경' },
                    { label: '교직원', winner: '문경' },
                    { label: '인기모', winner: '문경' },
                ],
            },
            {
                name: '이어달리기',
                winner: '문경',
                matches: [
                    { label: '중등', winner: '문경' },
                    { label: '고등', winner: '문경' },
                    { label: '성인', winner: '음성' },
                ],
            },
            {
                name: '줄다리기',
                winner: '문경',
                matches: [
                    { label: '중등부', winner: '음성' },
                    { label: '고등부', winner: '문경' },
                    { label: '장년부', winner: '음성' },
                ],
            },
        ],
    },

    {
        year: 2022,
        overall: {
            winner: '문경',
            note: '2022년 경기 종합우승은 문경캠퍼스입니다.',
        },
        cheer: {
            winner: '음성',
            note: '2022년 응원전 우승은 음성캠퍼스입니다.',
        },
        events: [
            {
                name: '탁구',
                winner: '문경',
                matches: [
                    { label: '7·8학년', winner: '세종' },
                    { label: '9학년', winner: '문경' },
                    { label: '10학년', winner: '문경' },
                    { label: '11학년', winner: '문경' },
                    { label: '12학년', winner: '문경' },
                    { label: '교직원', winner: '문경' },
                    { label: '인기모', winner: '문경' },
                ],
            },
            {
                name: '태권도',
                winner: '음성',
                matches: [
                    { label: '품새(중)', winner: '음성' },
                    { label: '품새(고)', winner: '문경' },
                    { label: '겨루기(중)', winner: '세종' },
                    { label: '겨루기(고)', winner: '문경' },
                    { label: '태권체조', winner: '음성' },
                ],
            },
            {
                name: '축구',
                winner: '문경',
                matches: [
                    { label: '중등부(남)', winner: '문경' },
                    { label: '고등부(남)', winner: '문경' },
                    { label: '중고연합(여)', winner: '문경' },
                ],
            },
            {
                name: '배구',
                winner: '문경',
                matches: [
                    { label: '중등부(남)', winner: '문경' },
                    { label: '고등부(남)', winner: '문경' },
                    { label: '중고연합(여)', winner: '음성' },
                ],
            },
            {
                name: '농구',
                winner: '문경',
                matches: [
                    { label: '중등부(남)', winner: '문경' },
                    { label: '고등부(남)', winner: '음성' },
                    { label: '중고연합(여)', winner: '문경' },
                ],
            },
            {
                name: '중거리달리기',
                winner: '문경',
                matches: [
                    { label: '중등부(여)', winner: '세종' },
                    { label: '중등부(남)', winner: '문경' },
                    { label: '고등부(여)', winner: '음성' },
                    { label: '고등부(남)', winner: '문경' },
                ],
            },
            {
                name: '줄다리기',
                winner: '음성',
                matches: [
                    { label: '중등부', winner: '문경' },
                    { label: '고등부', winner: '음성' },
                    { label: '장년부', winner: '음성' },
                ],
            },
            {
                name: '초등',
                winner: '문경',
                matches: [
                    { label: '축구', winner: '문경' },
                    { label: '이어달리기', winner: '문경' },
                    { label: '줄다리기', winner: '세종' },
                ],
            },
        ],
    },

    {
        year: 2021,
        overall: {
            winner: '문경',
            note: '2021년 경기 종합우승은 문경캠퍼스입니다.',
        },
        cheer: {
            winner: '음성',
            note: '2021년 응원전 우승은 음성캠퍼스입니다.',
        },
        events: [
            {
                name: '농구',
                winner: '음성',
                matches: [
                    { label: '중학교(남)', winner: '음성' },
                    { label: '중고연합(여)', winner: '문경' },
                    { label: '고등학교(남)', winner: '음성' },
                ],
            },
            {
                name: '배구',
                winner: '문경',
                matches: [
                    { label: '중학교(남)', winner: '문경' },
                    { label: '중고연합(여)', winner: '문경' },
                    { label: '고등학교(남)', winner: '문경' },
                ],
            },
            {
                name: '축구',
                winner: '문경',
                matches: [
                    { label: '중학교(남)', winner: '문경' },
                    { label: '중고연합(여)', winner: '문경' },
                    { label: '고등학교(남)', winner: '음성' },
                ],
            },
            {
                name: '탁구',
                winner: '문경',
                matches: [
                    { label: '8학년', winner: '문경' },
                    { label: '9학년', winner: '문경' },
                    { label: '10학년', winner: '음성' },
                    { label: '11학년', winner: '문경' },
                    { label: '12학년', winner: '음성' },
                    { label: '교직원', winner: '문경' },
                ],
            },
            {
                name: '태권도',
                winner: '문경',
                matches: [
                    { label: '품새 8학년', winner: '문경' },
                    { label: '품새 9·10학년', winner: '음성' },
                    { label: '품새 11·12학년', winner: '음성' },
                    { label: '겨루기(남) 9·10학년', winner: '문경' },
                    { label: '겨루기(남) 11·12학년', winner: '문경' },
                    { label: '겨루기(여) 9·10학년', winner: '문경' },
                    { label: '겨루기(여) 11·12학년', winner: '문경' },
                ],
            },
        ],
    },
    // {
    //     year: 2020,
    //     overall: {
    //         winner: '문경',
    //         note: '2020년 경기 종합우승은 문경캠퍼스입니다.',
    //     },
    //     cheer: {
    //         // winner: '음성',
    //         note: '2020년 응원전 우승은 음성캠퍼스입니다.',
    //     },
    // },
    // {
    //     year: 2019,
    //     overall: {
    //         winner: '문경',
    //         note: '2020년 경기 종합우승은 문경캠퍼스입니다.',
    //     },
    //     cheer: {
    //         // winner: '음성',
    //         note: '2020년 응원전 우승은 음성캠퍼스입니다.',
    //     },
    // },
    // {
    //     year: 2018,
    //     overall: {
    //         winner: '문경',
    //         note: '2020년 경기 종합우승은 문경캠퍼스입니다.',
    //     },
    //     cheer: {
    //         // winner: '음성',
    //         note: '2020년 응원전 우승은 음성캠퍼스입니다.',
    //     },
    // },
    // {
    //     year: 2017,
    //     overall: {
    //         winner: '문경',
    //         note: '2020년 경기 종합우승은 문경캠퍼스입니다.',
    //     },
    //     cheer: {
    //         // winner: '음성',
    //         note: '2020년 응원전 우승은 음성캠퍼스입니다.',
    //     },
    // },
    // {
    //     year: 2016,
    //     overall: {
    //         winner: '문경',
    //         note: '2020년 경기 종합우승은 문경캠퍼스입니다.',
    //     },
    //     cheer: {
    //         // winner: '음성',
    //         note: '2020년 응원전 우승은 음성캠퍼스입니다.',
    //     },
    // },
    // {
    //     year: 2015,
    //     overall: {
    //         winner: '문경',
    //         note: '2020년 경기 종합우승은 문경캠퍼스입니다.',
    //     },
    //     cheer: {
    //         // winner: '음성',
    //         note: '2020년 응원전 우승은 음성캠퍼스입니다.',
    //     },
    // },
    // {
    //     year: 2014,
    //     overall: {
    //         winner: '문경',
    //         note: '2020년 경기 종합우승은 문경캠퍼스입니다.',
    //     },
    //     cheer: {
    //         // winner: '음성',
    //         note: '2020년 응원전 우승은 음성캠퍼스입니다.',
    //     },
    // },
    // {
    //     year: 2013,
    //     overall: {
    //         winner: '문경',
    //         note: '2020년 경기 종합우승은 문경캠퍼스입니다.',
    //     },
    //     cheer: {
    //         // winner: '음성',
    //         note: '2020년 응원전 우승은 음성캠퍼스입니다.',
    //     },
    // },
    // {
    //     year: 2012,
    //     overall: {
    //         winner: '문경',
    //         note: '2020년 경기 종합우승은 문경캠퍼스입니다.',
    //     },
    //     cheer: {
    //         // winner: '음성',
    //         note: '2020년 응원전 우승은 음성캠퍼스입니다.',
    //     },
    // },
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
        key: 'timeline',
        title: '전체 타임라인 + 위치',
        desc: '예선 종목별 진행 위치, 시간별 일정이 한눈에 들어오는 타임라인.',
        status: '준비중',
    },
    {
        key: 'popcat',
        title: '팝캣 클릭 카운터',
        desc: '문경·음성·세종 3캠퍼스가 클릭으로 겨루는 응원 카운터.',
        status: '베타',
    },
    {
        key: 'highlight',
        title: '하이라이트 전용 창',
        desc: '명장면만 모아 보는 하이라이트 전용 페이지.',
        status: '준비중',
    },
];
