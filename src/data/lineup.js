/**
 * 2026 글로벌 체육 축제 — 캠퍼스별 라인업
 *
 * 구조: LINEUP[campus][sport][category] = Player[]
 *   Player = { no?, grade?, name, bench?, alt?, role? }
 *     no    : 등번호 또는 순번
 *     grade : 학년 (없으면 미입력)
 *     name  : 선수 이름
 *     bench : true 면 후보
 *     alt   : 대체/주의 정보 (예: 다른 종목 출전 표시, 학부모 관계 등)
 *     role  : 학부모 / 교직원 / 동문 / 인기모 — 인성인 카테고리에서 사용
 *
 * 음성/세종은 데이터 들어오면 같은 구조로 추가하면 자동 노출.
 */

export const LINEUP = {
    문경: {
        축구: {
            남고: [
                { no: 1, grade: 12, name: '정온유' },
                { no: 2, grade: 12, name: '김예찬' },
                { no: 3, grade: 12, name: '최지웅' },
                { no: 4, grade: 12, name: '최한결' },
                { no: 5, grade: 12, name: '홍유준' },
                { no: 6, grade: 12, name: '이기상' },
                { no: 7, grade: 12, name: '임우징' },
                { no: 8, grade: 12, name: '변정후' },
                { no: 9, grade: 11, name: '백지월' },
                { no: 10, grade: 11, name: '송윤서' },
                { no: 11, grade: 11, name: '최예성' },
                { no: 12, grade: 11, name: '박주영' },
                { no: 13, grade: 11, name: '이민섭' },
                { no: 14, grade: 11, name: '김하겸' },
                { no: 15, grade: 10, name: '정예준' },
                { no: 16, grade: 10, name: '이시우' },
            ],
            남중: [
                { no: 1, grade: 7, name: '김서준' },
                { no: 2, grade: 7, name: '윤지안' },
                { no: 3, grade: 7, name: '서예준' },
                { no: 4, grade: 7, name: '홍준표' },
                { no: 5, grade: 7, name: '김지후' },
                { no: 6, grade: 7, name: '최재영' },
                { no: 7, grade: 8, name: '류예준' },
                { no: 8, grade: 8, name: '석지훈' },
                { no: 9, grade: 8, name: '김세윤' },
                { no: 10, grade: 8, name: '노주환' },
                { no: 11, grade: 8, name: '김형준' },
                { no: 12, grade: 9, name: '김대은' },
                { no: 13, grade: 9, name: '이정우' },
                { no: 14, grade: 9, name: '류제이' },
                { no: 15, grade: 9, name: '박서준' },
                { no: 16, grade: 9, name: '이하율' },
            ],
            여연합: [
                { no: 1, grade: 12, name: '이윤지' },
                { no: 2, grade: 11, name: '이예찬' },
                { no: 3, grade: 11, name: '이다인' },
                { no: 4, grade: 11, name: '조은서' },
                { no: 5, grade: 11, name: '한수진' },
                { no: 6, grade: 10, name: '김시윤' },
                { no: 7, grade: 10, name: '이수민' },
                { no: 8, grade: 10, name: '조성민' },
                { no: 9, grade: 10, name: '오주하' },
                { no: 10, grade: 10, name: '한수정' },
                { no: 11, grade: 9, name: '김지현' },
                { no: 12, grade: 9, name: '박제이' },
                { no: 13, grade: 9, name: '김하늬' },
                { no: 14, grade: 7, name: '이세연' },
                { no: 15, grade: 7, name: '김소연' },
                { no: 16, grade: 7, name: '주혜원' },
            ],
        },
        농구: {
            남중: [
                { no: 1, grade: 9, name: '강지우' },
                { no: 2, grade: 9, name: '김시우' },
                { no: 3, grade: 9, name: '김유건' },
                { no: 4, grade: 9, name: '김유현' },
                { no: 5, grade: 9, name: '김태웅' },
                { no: 6, grade: 9, name: '송하율' },
                { no: 7, grade: 9, name: '우도현' },
                { no: 8, grade: 9, name: '이은혁' },
                { no: 9, grade: 9, name: '최규현' },
            ],
            남고: [
                { no: 1, grade: 12, name: '김예찬' },
                { no: 2, grade: 12, name: '박재현' },
                { no: 3, grade: 12, name: '변정후' },
                { no: 4, grade: 12, name: '정소망' },
                { no: 5, grade: 12, name: '정은수' },
                { no: 6, grade: 11, name: '김하준' },
                { no: 7, grade: 11, name: '박하음' },
                { no: 8, grade: 11, name: '안우진' },
                { no: 9, grade: 11, name: '여정훈' },
                { no: 10, grade: 10, name: '채태윤' },
                { no: 11, grade: 10, name: '하성윤' },
            ],
            여연합: [
                { no: 1, grade: 12, name: '김지오' },
                { no: 2, grade: 12, name: '정다희' },
                { no: 3, grade: 11, name: '김나린' },
                { no: 4, grade: 11, name: '김은혜' },
                { no: 5, grade: 10, name: '김예린' },
                { no: 6, grade: 10, name: '황라온' },
                { no: 7, grade: 9, name: '김민정' },
                { no: 8, grade: 9, name: '방채라' },
                { no: 9, grade: 9, name: '이래윤' },
                { no: 10, grade: 9, name: '조수현' },
            ],
        },
        배구: {
            남중: [
                { no: 1, grade: 9, name: '송하율' },
                { no: 2, grade: 9, name: '김유건' },
                { no: 3, grade: 9, name: '홍아일' },
                { no: 4, grade: 8, name: '석지훈' },
                { no: 5, grade: 8, name: '이선율' },
                { no: 6, grade: 8, name: '이지호' },
                { no: 7, grade: 9, name: '최은도', bench: true },
                { no: 8, grade: 9, name: '이주혁', bench: true },
                { no: 9, grade: 8, name: '신기창', bench: true },
                { no: 10, grade: 8, name: '임주왕', bench: true },
            ],
            남고: [
                { no: 1, grade: 12, name: '이건희' },
                { no: 2, grade: 10, name: '채태윤' },
                { no: 3, grade: 12, name: '정온유' },
                { no: 4, grade: 12, name: '정은수' },
                { no: 5, grade: 12, name: '송민호' },
                { no: 6, grade: 10, name: '정진수' },
                { no: 7, grade: 10, name: '홍승현', bench: true },
                { no: 8, grade: 11, name: '코헨', bench: true },
                { no: 9, grade: 12, name: '정소망', bench: true },
            ],
            여연합: [
                { no: 1, grade: 12, name: '백서진' },
                { no: 2, grade: 12, name: '심예은' },
                { no: 3, grade: 12, name: '김주하' },
                { no: 4, grade: 12, name: '이채민' },
                { no: 5, grade: 9, name: '조시온' },
                { no: 6, grade: 9, name: '이주원' },
                { no: 7, grade: 11, name: '강예빈', bench: true },
                { no: 8, grade: 10, name: '윤가람', bench: true },
                { no: 9, grade: 10, name: '김서우', bench: true },
                { no: 10, grade: 9, name: '최서윤', bench: true },
            ],
        },
        탁구: {
            중등여: [
                { no: 1, grade: 9, name: '변채영' },
                { name: '조시온', alt: '후보' },
            ],
            중등남: [
                { no: 1, grade: 9, name: '홍하일' },
                { name: '백종서', alt: '후보' },
            ],
            고등여: [
                { no: 1, grade: 11, name: '김은혜F' },
                { name: '이윤지', alt: '후보' },
            ],
            고등남: [
                { no: 1, grade: 10, name: '이명준' },
                { name: '홍승현', alt: '후보' },
            ],
            인기모여: [{ no: 1, name: '양정수', alt: '9 이은혁 모' }],
            인기모남: [
                { no: 1, name: '최용락', alt: '10 최규민 부' },
                { name: '홍성택', alt: '9 홍하일 부' },
                { name: '이성화', alt: '9 이은혁 부' },
            ],
            교직원여: [
                { no: 1, name: '이경민' },
                { name: '남정하' },
            ],
            교직원남: [
                { no: 1, name: '김경식' },
                { name: '신찬영' },
            ],
        },
        체스: {
            '7-8학년 대표': [
                { no: 1, grade: 8, name: '박주원' },
                { name: '임온찬'},
            ],
            '9-10학년 대표': [
                { no: 1, grade: 9, name: '변지원' },
                { name: '윤종한' },
            ],
            '11-12학년 대표': [
                { no: 1, grade: 11, name: '윤주호' },
                { name: '정소망' },
            ],
        },
        태권도: {
            '태권체조 고등': [
                { no: 1, grade: 12, name: '심예은' },
                { no: 2, grade: 10, name: '임환희' },
                { no: 3, grade: 11, name: '엄세영' },
                { no: 4, grade: 11, name: '운유송' },
                { no: 5, grade: 10, name: '신예은' },
                { no: 6, grade: 11, name: '송효원' },
            ],
            '품새 중등': [
                { no: 1, grade: 8, name: '조민수' },
                { no: 2, grade: 9, name: '이정우' },
            ],
            '품새 고등': [
                { no: 1, grade: 12, name: '심예진' },
                { no: 2, grade: 11, name: '이지율' },
            ],
            '겨루기 남자': [
                { no: 1, grade: 11, name: '운유송' },
                { no: 2, grade: 12, name: '최종민' },
                { no: 3, grade: 12, name: '이건희' },
                { no: 4, grade: 12, name: '조승운' },
            ],
            '겨루기 여자': [
                { no: 1, grade: 12, name: '안규리' },
                { no: 2, grade: 12, name: '이채민' },
                { no: 3, grade: 12, name: '김가현' },
                { no: 4, grade: 11, name: '한수진' },
            ],
        },
        중거리: {
            여중: [
                { no: 1, grade: 7, name: '이승주' },
                { no: 2, grade: 9, name: 'Kim Joyce Seoyon' },
            ],
            여고: [{ no: 1, grade: 12, name: '심예진' }],
            남중: [
                { no: 1, grade: 7, name: '우도현' },
                { no: 2, grade: 8, name: '김찬영' },
                { no: 3, grade: 9, name: '이재이' },
            ],
            남고: [
                { no: 1, grade: 12, name: '박예준', bench: true },
                { no: 2, grade: 12, name: '하지훈' },
                { no: 3, grade: 10, name: '전준호' },
                { no: 4, grade: 12, name: '권태연', bench: true },
                { no: 5, grade: 12, name: '강민성'},
            ],
        },
        이어달리기: {
            '7-8학년 남자': [
                { no: 1, grade: 8, name: '이선율'},
                { no: 2, grade: 8, name: '김지훈'},
            ],
            '7-8학년 여자': [
                { no: 1, grade: 7, name: '주혜원' },
                { no: 2, grade: 8, name: '최민교' },
            ],
            '9학년 남자': [{ no: 1, grade: 9, name: '우도현' }],
            '9학년 여자': [
                { no: 1, grade: 9, name: '장서율' },
                { no: 2, grade: 9, name: '이래윤' },
            ],
            '10학년 남자': [
                { no: 1, name: '배혜성' },
                { no: 2, name: '김성율' },
            ],
            '10학년 여자': [
                { no: 1, name: '임환희' },
                { no: 2, name: '김나예' },
            ],
            '11학년 남자': [
                { no: 1, name: '김영휘', alt: '축구' },
                { no: 2, name: '김하겸' },
            ],
            '11학년 여자': [{ no: 1, name: '박승민' }],
            '12학년 남자': [
                { no: 1, name: '강민성', alt: '축구' },
                { no: 2, name: '최지웅' },
            ],
            '12학년 여자': [
                { no: 1, name: '김세빈' },
                { no: 2, name: '김가현' },
            ],
            인기모남: [{ name: '박형렬', alt: '12 박하은 부' }],
            인기모여: [
                { name: '윤은정', alt: '8 강윤성 모' },
                { name: '장보선', alt: '후보 · 7 김주아 모' },
            ],
        },
        줄다리기: {
            남중: [
                { no: 1, grade: 8, name: '양하준' },
                { no: 2, grade: 7, name: '이윤재' },
                { no: 3, grade: 7, name: '홍준표' },
                { no: 4, grade: 9, name: '정인성' },
                { no: 5, grade: 8, name: '이선율' },
                { no: 6, grade: 9, name: '하성현' },
                { no: 7, grade: 9, name: '박준영' },
                { no: 8, grade: 7, name: '강은결' },
                { no: 9, grade: 8, name: '석지훈' },
                { no: 10, grade: 7, name: '정태이' },
                { no: 11, grade: 8, name: '임주왕', bench: true },
                { no: 12, grade: 8, name: '표찬범', bench: true },
                { no: 13, grade: 9, name: '최규현', bench: true },
            ],
            여중: [
                { no: 1, grade: 9, name: '김시원' },
                { no: 2, grade: 9, name: '김지현A' },
                { no: 3, grade: 8, name: '박예은' },
                { no: 4, grade: 8, name: '최민교' },
                { no: 5, grade: 8, name: '황서윤' },
            ],
            남고: [
                { no: 1, grade: 12, name: '송재현' },
                { no: 2, grade: 11, name: '주지원' },
                { no: 3, grade: 11, name: '이다솔' },
                { no: 4, grade: 11, name: '이이삭' },
                { no: 5, grade: 10, name: '이에녹' },
                { no: 6, grade: 10, name: '운유현' },
                { no: 7, grade: 10, name: '임승현' },
                { no: 8, grade: 12, name: '박예준' },
                { no: 9, grade: 10, name: '안현성' },
                { no: 10, grade: 11, name: '김선우' },
                { no: 11, grade: 12, name: '김동훈', bench: true },
                { no: 12, grade: 12, name: '강민성', bench: true },
                { no: 13, grade: 10, name: '최규민', bench: true },
                { no: 14, grade: 12, name: '권태연', bench: true },
            ],
            여고: [
                { no: 1, grade: 10, name: '이지안' },
                { no: 2, grade: 12, name: 'Hanna' },
                { no: 3, grade: 11, name: '김나린' },
                { no: 4, grade: 10, name: '신라희' },
                { no: 5, grade: 10, name: '황라온' },
                { no: 6, grade: 10, name: '김수빈', bench: true },
            ],
            남성인: [
                { no: 1, name: '김정훈', role: '학부모', alt: '12 김주하 부' },
                { no: 2, name: 'Edward Jang', role: '교직원' },
                { no: 3, name: '강태균', role: '동문' },
                { no: 4, name: '김라엘', role: '동문' },
                { no: 5, name: '김현서', role: '동문' },
                { no: 6, name: '염솔', role: '동문' },
                { no: 7, name: '양준서', role: '동문' },
                { no: 8, name: '마성주', role: '동문' },
                { no: 9, name: '이희성', role: '동문' },
                { no: 10, name: '하준호', role: '학부모', alt: '12 하지훈 부' },
                { no: 11, name: '박해성', role: '교직원' },
                { no: 12, name: '신호준', role: '교직원' },
                { no: 13, name: '조현진', role: '교직원' },
                { no: 14, name: '송대섭', role: '교직원' },
                { no: 15, name: '11주지원 부', role: '학부모' },
            ],
            여성인: [
                { no: 1, name: '오은미', role: '학부모', alt: '10 오주하 모' },
                { no: 2, name: '김미영', role: '교직원' },
                { no: 3, name: '신선미', role: '교직원' },
                { no: 4, name: '남정하', role: '교직원' },
                { no: 5, name: '복미영', role: '교직원' },
                { no: 6, name: '이나은', role: '교직원' },
                { no: 7, name: '김필란', role: '교직원' },
                { no: 8, name: '이윤정', role: '교직원' },
                { no: 9, name: '한지숙', role: '교직원' },
                { no: 10, name: '황보은', role: '교직원' },
                { no: 11, name: '박수인', role: '교직원' },
                { no: 12, name: '김유민', role: '교직원' },
                { no: 13, name: '김예원', role: '교직원' },
                { no: 14, name: '김하은', role: '교직원/동문' },
                { no: 15, name: '이현지', role: '교직원/동문' },
            ],
        },
    },
    음성: {},
    세종: {},
};

/* ───── Helpers ───── */

const SUPPORTED_CAMPUSES = ['문경', '음성', '세종'];

export function getCampusList() {
    return SUPPORTED_CAMPUSES;
}

export function hasCampusData(campus) {
    const c = LINEUP[campus];
    if (!c) return false;
    return Object.values(c).some((sport) => Object.values(sport).some((arr) => arr && arr.length > 0));
}

export function getSports(campus) {
    return Object.keys(LINEUP[campus] || {});
}

export function getCategories(campus, sport) {
    return Object.keys(LINEUP[campus]?.[sport] || {});
}

export function getPlayers(campus, sport, category) {
    return LINEUP[campus]?.[sport]?.[category] || [];
}

/* match.category → lineup category 키 정규화 */
const CATEGORY_ALIASES = {
    '남자 고등': '남고',
    '남자 중등': '남중',
    '여자 연합': '여연합',
    '여자 고등': '여고',
    '여자 중등': '여중',
    남고부: '남고',
    남중부: '남중',
    여고부: '여고',
    여중부: '여중',
    여자연합: '여연합',
    여연합부: '여연합',
};

export function normalizeCategory(category) {
    if (!category) return '';
    const trimmed = String(category).trim();
    return CATEGORY_ALIASES[trimmed] || trimmed;
}

/**
 * LIVE 매치(sport + category)에 해당하는 캠퍼스의 라인업을 반환.
 * 정확 매칭 안 되면 fuzzy contains 로 다음 키 시도.
 */
export function getLineupForMatch(campus, sport, category) {
    const sportData = LINEUP[campus]?.[sport];
    if (!sportData) return [];

    const wanted = normalizeCategory(category);
    if (sportData[wanted]) return sportData[wanted];

    // fuzzy: 키 안에 wanted 문자열이 포함되거나 그 반대
    for (const [key, players] of Object.entries(sportData)) {
        if (key === wanted) return players;
        if (wanted && (key.includes(wanted) || wanted.includes(key))) return players;
    }
    return [];
}
