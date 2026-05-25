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
];

export function pickRandomQuiz() {
    return QUIZZES[Math.floor(Math.random() * QUIZZES.length)];
}
