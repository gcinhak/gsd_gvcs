/**
 * 점령전 퀴즈 풀.
 * 필요할 때 자유롭게 추가/수정하세요.
 */
export const QUIZZES = [
    {
        question: '2026 글로벌 체육 축제 본선은 며칠인가요?',
        choices: ['5월 28일', '5월 29일', '5월 30일', '5월 31일'],
        answer: 2,
    },
    {
        question: '문경 캠퍼스의 상징색은?',
        choices: ['파랑', '빨강', '초록', '노랑'],
        answer: 0,
    },
    {
        question: '음성 캠퍼스의 상징색은?',
        choices: ['파랑', '빨강', '초록', '보라'],
        answer: 1,
    },
    {
        question: '세종 캠퍼스의 상징색은?',
        choices: ['파랑', '빨강', '초록', '주황'],
        answer: 2,
    },
    {
        question: '코딩동아리 SYNC의 설립년도는?',
        choices: ['2024', '2025', '2026', '2027'],
        answer: 2,
    },
    {
        question: '북극곰의 피부색은?',
        choices: ['흰색', '검은색', '분홍색', '회색'],
        answer: 1,
    },
    {
        question: '바나나는 무엇일까?',
        choices: ['나무', '풀', '선인장', '버섯'],
        answer: 1,
    },
    {
        question: 'Sync는 어떤 학교의 동아리인가?',
        choices: [
            '글로벌선진학교 음성캠퍼스',
            '글로벌선진학교 문경캠퍼스',
            '글로벌선진학교 세종캠퍼스',
            '글로벌선진학교 미국캠퍼스',
        ],
        answer: 1,
    },
    {
        question: '코딩동아리 Sync의 부원 수는 몇 명일까? (힌트: About 페이지)',
        choices: ['7명', '8명', '9명', '10명'],
        answer: 2,
    },
    {
        question: 'Global Sports Festival 웹사이트가 제작된 이유로 가장 적절한 것은? (힌트: About 페이지)',
        choices: [
            '학생 출석 체크',
            '학교 광고',
            '모든 캠퍼스가 함께 축제를 즐기도록',
            '온라인 시험 진행',
        ],
        answer: 2,
    },
];

export function pickRandomQuiz() {
    return QUIZZES[Math.floor(Math.random() * QUIZZES.length)];
}
