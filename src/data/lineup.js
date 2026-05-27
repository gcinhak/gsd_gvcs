/**
 * 2026 글로벌 체육 축제 — 캠퍼스별 라인업
 *
 * 구조: LINEUP[campus][sport][category] = Player[]
 * Player = { no?, grade?, name, bench?, alt?, role? }
 * no    : 등번호 또는 순번
 * grade : 학년 (없으면 미입력)
 * name  : 선수 이름
 * bench : true 면 후보
 * alt   : 대체/주의 정보 (예: 다른 종목 출전 표시, 학부모 관계 등)
 * role  : 학부모 / 교직원 / 동문 / 인기모 — 인성인 카테고리에서 사용
 *
 * 음성/세종은 데이터 들어오면 같은 구조로 추가하면 자동 노출.
 */

export const LINEUP = {
    문경: {
        /* 축구 주석 처리
        축구: {
            남중: [
                { no: 1, grade: 7, name: '김서준'},
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
        */
        농구: {
            남중: [
                { no: 1, grade: 9, name: '강지우' },
                { no: 2, grade: 9, name: '김시우' },
                { no: 3, grade: 9, name: '김유현' },
                { no: 4, grade: 9, name: '김태웅' },
                { no: 5, grade: 9, name: '송하율' },
                { no: 6, grade: 9, name: '우도현' },
                { no: 7, grade: 9, name: '이은혁' },
            ],
            남고: [
                { no: 1, grade: 12, name: '김예찬' },
                { no: 2, grade: 12, name: '박재현' },
                { no: 3, grade: 12, name: '변정후' },
                { no: 4, grade: 12, name: '정소망' },
                { no: 5, grade: 11, name: '김하준' },
                { no: 6, grade: 11, name: '박하음' },
                { no: 7, grade: 11, name: '여정훈' },
            ],
            여연합: [
                { no: 1, grade: 12, name: '김지오' },
                { no: 2, grade: 10, name: '황라온' },
                { no: 3, grade: 9, name: '김민정' },
                { no: 4, grade: 9, name: '이래윤' },
                { no: 5, grade: 9, name: '방채라' },
                { no: 6, grade: 9, name: '김예린' },
                { no: 7, grade: 9, name: '조수현' },
            ],
        },
        배구: {
            남중: [
                { no: 1, grade: 9, name: '송하율' },
                { no: 2, grade: 9, name: '김유건' },
                { no: 3, grade: 9, name: '홍하일' },
                { no: 4, grade: 8, name: '석지훈' },
                { no: 5, grade: 8, name: '이선율' },
                { no: 6, grade: 8, name: '이지호' },
                { no: 7, grade: 9, name: '최은도' },
                { no: 8, grade: 9, name: '이주혁' },
                { no: 9, grade: 8, name: '신기창' },
                { no: 10, grade: 8, name: '임주왕' },
            ],
            남고: [
                { no: 1, grade: 12, name: '이건희' },
                { no: 2, grade: 10, name: '채태윤' },
                { no: 3, grade: 12, name: '정온유' },
                { no: 4, grade: 12, name: '정은수' },
                { no: 5, grade: 12, name: '송민호' },
                { no: 6, grade: 10, name: '정진수' },
                { no: 7, grade: 10, name: '홍승현' },
                { no: 8, grade: 11, name: 'Prasetya, Kohen Adit' },
                { no: 9, grade: 12, name: '정소망' },
            ],
            여연합: [
                { no: 1, grade: 12, name: '백서진' },
                { no: 2, grade: 12, name: '심예은' },
                { no: 3, grade: 12, name: '김주하' },
                { no: 4, grade: 12, name: '이채민' },
                { no: 5, grade: 9, name: '조시온' },
                { no: 6, grade: 9, name: '이주원' },
                { no: 7, grade: 11, name: '강예빈' },
                { no: 8, grade: 10, name: '윤가람' },
                { no: 9, grade: 10, name: '김서우' },
                { no: 10, grade: 9, name: '최서윤' },
            ],
        },
        태권도: {
            태권체조: [
                { no: 1, grade: 12, name: '심예은' },
                { no: 2, grade: 10, name: '임환희' },
                { no: 3, grade: 11, name: '엄세영' },
                { no: 4, grade: 11, name: '운유송' },
                { no: 5, grade: 10, name: '신예은' },
                { no: 6, grade: 11, name: '송효원' },
            ],
            '품새(중)': [
                { no: 1, grade: 8, name: '조민수' },
                { no: 2, grade: 9, name: '이정우' },
            ],
            '품새(고)': [
                { no: 1, grade: 12, name: '심예진' },
                { no: 2, grade: 11, name: '이지율' },
            ],
            '겨루기(남)': [
                { no: 1, grade: 11, name: '운유송' },
                { no: 2, grade: 12, name: '최종민' },
                { no: 3, grade: 12, name: '이건희' },
                { no: 4, grade: 12, name: '조승운' },
            ],
            '겨루기(여)': [
                { no: 1, grade: 12, name: '안규리' },
                { no: 2, grade: 12, name: '이채민' },
                { no: 3, grade: 12, name: '김가현' },
                { no: 4, grade: 11, name: '한수진' },
            ],
        },
        /* 탁구부터 줄다리기까지 나머지 데이터 주석 처리
        탁구: {
            중등부: [
                { no: 1, grade: 9, name: '변채영' },
                { no: 2, grade: 9, name: '조시온'},
                { no: 3, grade: 9, name: '홍하일' },
                { no: 4, grade: 9, name: '백종서' },
            ],
            고등부: [
                { no: 1, grade: 11, name: '김은혜F' },
                { no: 2, grade: 12,name: '이윤지',},
                { no: 3, grade: 10, name: '이명준' },
                { no: 4, grade: 10,name: '홍승현' },
            ],
            인기모: [
                { no: 1, name: '양정수'},
                { no: 2, name: '최용락' },
                {  no: 3, name: '홍성택' },
                {  no: 4, name: '이성화'},
            ],
            교직원: [{ no: 1, name: '이경민' },
            {  no: 2, name: '남정하' },
              { no: 3, name: '김경식' },
               {no: 4,name: '신찬영' }
               ],
        },
        체스: {
            '7-8학년': [{ no: 1, grade: 8, name: '박주원' }, { no: 2, grade: 8,name: '임온찬' }],
            '9-10학년': [{ no: 1, grade: 9, name: '변지원' }, { no: 2, grade: 9,name: '윤종한' }],
            '11-12학년': [{ no: 1, grade: 11, name: '윤주호' }, { no: 2, grade: 12, name: '정소망' }],
        },
        중거리: {
            통합: [
                { no: 1,grade: 7, name: '이승주' },
                { no: 2,grade: 9, name: 'Kim Joyce Seoyon' },
                { no: 3,grade: 12, name: '심예진' },
                { no: 4,grade: 7, name: '우도현' },
                { no: 5,grade: 8, name: '김찬영' },
                { no: 6,grade: 9, name: '이재이' },
                { no: 7,grade: 12, name: '하지훈' },
                { no: 8,grade: 10, name: '전준호' },
                { no: 9,grade: 12, name: '강민성' },
                { no: 10,grade: 12, name: '박예준'},
                { no: 11,grade: 12, name: '권태연'},
            ],
        },

        이어달리기: {
            통합: [
                { no: 1, grade: 8, name: '이선율', role: '학생' },
                { no: 2, grade: 8, name: '김지훈', role: '학생' },
                { no: 3, grade: 7, name: '주혜원', role: '학생' },
                { no: 4, grade: 8, name: '최민교', role: '학생' },
                { no: 5, grade: 9, name: '우도현', role: '학생' },
                { no: 6, grade: 9, name: '장서율', role: '학생' },
                { no: 7, grade: 9, name: '이래윤', role: '학생' },
                { no: 8, grade: 10, name: '배혜성', role: '학생' },
                { no: 9, grade: 10, name: '김성율', role: '학생' },
                { no: 10, grade: 10, name: '임환희', role: '학생' },
                { no: 11, grade: 10, name: '김나예', role: '학생' },
                { no: 12, grade: 11, name: '김영휘', role: '학생' },
                { no: 13, grade: 11, name: '김하겸', role: '학생' },
                { no: 14, grade: 11, name: '박승민', role: '학생' },
                { no: 15, grade: 12, name: '강민성', role: '학생' },
                { no: 16, grade: 12, name: '최지웅', role: '학생' },
                { no: 17, grade: 12, name: '김세빈', role: '학생' },
                { no: 18, grade: 12, name: '김가현', role: '학생' },
                { no: 19, name: '박형렬', role: '인기모' },
                { no: 20, name: '윤은정', role: '인기모' },
                { no: 21, name: '장보선', role: '인기모' },
               ],
        },
        

        줄다리기: {
            학생팀: [
                { no: 1,grade: 8, name: '양하준' },
                { no: 2,grade: 7, name: '이윤재' },
                { no: 3,grade: 7, name: '홍준표' },
                { no: 4,grade: 9, name: '정인성' },
                { no: 5,grade: 8, name: '이선율' },
                { no: 6,grade: 9, name: '하성현' },
                { no: 7,grade: 9, name: '박준영' },
                { no: 8, grade: 7, name: '강은결' },
                { no: 9,grade: 8, name: '석지훈' },
                { no: 10,grade: 7, name: '정태이' },
                { no: 11, grade: 9, name: '김시원' },
                { no: 12,grade: 9, name: '김지현A' },
                { no: 13,grade: 8, name: '박예은' },
                { no: 14,grade: 8, name: '최민교' },
                { no: 15,grade: 8, name: '황서윤' },
                { no: 16,grade: 12, name: '송재현' },
                { no: 17, grade: 11, name: '주지원' },
                { no: 18, grade: 11, name: '이다솔' },
                { no: 19,grade: 11, name: '이이삭' },
                { no: 20,grade: 10, name: '이에녹' },
                { no: 21,grade: 10, name: '운유현' },
                { no: 22,grade: 10, name: '임승현' },
                { no: 23,grade: 12, name: '박예준' },
                { no: 24,grade: 10, name: '안현성' },
                { no: 25,grade: 11, name: '김선우' },
                { no: 26,grade: 10, name: '이지안' },
                { no: 27,grade: 12, name: 'Hanna' },
                { no: 28,grade: 11, name: '김나린' },
                { no: 29,grade: 10, name: '신라희' },
                { no: 30,grade: 10, name: '황라온' },
                { no: 31,grade: 8, name: '임주왕'},
                { no: 32,grade: 8, name: '표찬범'},
                { no: 33,grade: 9, name: '최규현'},
                { no: 34,grade: 12, name: '김동훈'},
                { no: 35,grade: 12, name: '강민성'},
                { no: 36,grade: 10, name: '최규민'},
                { no: 37,grade: 12, name: '권태연'},
                { no: 38,grade: 10, name: '김수빈'},
            ],
            성인팀: [
                { no: 1, name: '강태균', role: '동문' },
                { no: 2, name: '김라엘', role: '동문' },
                { no: 3, name: '김현서', role: '동문' },
                { no: 4, name: '염솔', role: '동문' },
                { no: 5, name: '양준서', role: '동문' },
                { no: 6, name: '마성주', role: '동문' },
                { no: 7, name: '이희성', role: '동문' },
                { no: 8, name: '김하은', role: '동문' },
                { no: 9, name: '이현지', role: '동문' },
                
                // 인기모 (기존 학부모)
                { no: 10, name: '김정훈', role: '인기모' },
                { no: 11, name: '하준호', role: '인기모' },
                { no: 12, name: '주영', role: '인기모' },
                { no: 13, name: '오은미', role: '인기모' },
                
                // 교직원
                { no: 14, name: 'Edward Jang', role: '교직원' },
                { no: 15, name: '박해성', role: '교직원' },
                { no: 16, name: '신호준', role: '교직원' },
                { no: 17, name: '조현진', role: '교직원' },
                { no: 18, name: '송대섭', role: '교직원' },
                { no: 19, name: '김미영', role: '교직원' },
                { no: 20, name: '신선미', role: '교직원' },
                { no: 21, name: '남정하', role: '교직원' },
                { no: 22, name: '복미영', role: '교직원' },
                { no: 23, name: '이나은', role: '교직원' },
                { no: 24, name: '김필란', role: '교직원' },
                { no: 25, name: '이윤정', role: '교직원' },
                { no: 26, name: '한지숙', role: '교직원' },
                { no: 27, name: '황보은', role: '교직원' },
                { no: 28, name: '박수인', role: '교직원' },
                { no: 29, name: '김유민', role: '교직원' },
                { no: 30, name: '김예원', role: '교직원' },
            ],
        },
        */
    },
    음성: {
        농구: {
            남중: [
                { no: 1, grade: 9, name: '권성현' },
                { no: 2, grade: 9, name: '이유준' },
                { no: 3, grade: 9, name: '구주찬' },
                { no: 4, grade: 9, name: '김우영' },
                { no: 5, grade: 9, name: '이준' },
                { no: 6, grade: 9, name: '김예준' },
                { no: 7, grade: 9, name: '이도훈' },
            ],
            여연합: [
                { no: 1, grade: 9, name: '모리아' },
                { no: 2, grade: 9, name: '이여랑' },
                { no: 3, grade: 12, name: '박시현' },
                { no: 4, grade: 10, name: '김유나' },
                { no: 5, grade: 10, name: '박예하' },
                { no: 6, grade: 11, name: '황인영' },
                { no: 7, grade: 7, name: '양승은' },
            ],
            남고: [
                { no: 1, grade: 12, name: '홍주원' },
                { no: 2, grade: 10, name: '김민찬' },
                { no: 3, grade: 11, name: '임준희' },
                { no: 4, grade: 11, name: '김래율' },
                { no: 5, grade: 10, name: '정우성' },
                { no: 6, grade: 11, name: '조대현' },
                { no: 7, grade: 11, name: '김의국' },
            ],
        },
        배구: {
            남중: [
                { no: 1, grade: 9, name: '구준표' },
                { no: 2, grade: 9, name: '권성현' },
                { no: 3, grade: 9, name: '구주찬' },
                { no: 4, grade: 9, name: '손유찬' },
                { no: 5, grade: 9, name: '조병준' },
                { no: 6, grade: 9, name: '이유준' },
                { no: 7, grade: 9, name: '김예준' },
                { no: 8, grade: 9, name: '이도훈' },
            ],
            여연합: [
                { no: 1, grade: 8, name: '인시연' },
                { no: 2, grade: 9, name: '박지인' },
                { no: 3, grade: 10, name: '박예하' },
                { no: 4, grade: 12, name: '강수연' },
                { no: 5, grade: 11, name: '허윤성' },
                { no: 6, grade: 10, name: '김유나' },
                { no: 7, grade: 9, name: '김은' },
                { no: 8, grade: 10, name: '황서현' },
                { no: 9, grade: 9, name: '유하미' },
                { no: 10, grade: 11, name: '김서정' },
            ],
            남고: [
                { no: 1, grade: 12, name: '한영진' },
                { no: 2, grade: 12, name: '김영래' },
                { no: 3, grade: 12, name: '이예준' },
                { no: 4, grade: 12, name: '박근호' },
                { no: 5, grade: 12, name: '안정우' },
                { no: 6, grade: 11, name: '조한' },
                { no: 7, grade: 10, name: '박시헌' },
                { no: 8, grade: 11, name: '김영빈' },
                { no: 9, grade: 10, name: '정우성' },
                { no: 10, grade: 10, name: '유수호' },
            ],
        },
        태권도: {
            태권체조: [
                { no: 1, grade: 9, name: '박지인' },
                { no: 2, grade: 9, name: '손유향' },
                { no: 3, grade: 10, name: '허강일' },
                { no: 4, grade: 10, name: '이신해' },
                { no: 5, grade: 10, name: '김유민' },
                { no: 6, grade: 10, name: '김세아' },
                { no: 7, grade: 12, name: '박시현' },
            ],
            '품새(중)': [
                { no: 1, grade: 9, name: '박지인' },
                { no: 2, grade: 9, name: '성제훈' },
            ],
            '품새(고)': [
                { no: 1, grade: 11, name: '권예빈' },
                { no: 2, grade: 11, name: '조한' },
            ],
            '겨루기(남)': [
                { no: 1, grade: 12, name: '이승재' },
                { no: 2, grade: 10, name: '정민준' },
                { no: 3, grade: 7, name: '이태율' },
            ],
            '겨루기(여)': [
                { no: 1, grade: 12, name: '김예림' },
                { no: 2, grade: 12, name: '이아영' },
                { no: 3, grade: 10, name: '권예빈' },
            ],
        },
    },
    세종: {
        농구: {
            남중: [
                { no: 1, grade: 8, name: 'Lachlan McClure' },
                { no: 2, grade: 8, name: 'Mason Snyder' },
                { no: 3, grade: 9, name: 'Michael Snyder' },
                { no: 4, grade: 9, name: 'Easton Socks' },
                { no: 5, grade: 9, name: 'Lucas Greivell' },
                { no: 6, grade: 7, name: '정은수' },
                { no: 7, grade: 7, name: '이지호' },
            ],
            남고: [
                { no: 1, grade: 12, name: '손주환' },
                { no: 2, grade: 10, name: '김민후' },
                { no: 3, grade: 10, name: '강한성' },
                { no: 4, grade: 10, name: 'Isaac Derr' },
                { no: 5, grade: 10, name: 'Zachary Yanick' },
                { no: 6, grade: 10, name: '정현수' },
                { no: 7, grade: 10, name: '최사무엘' },
            ],
        },
        배구: {
            남중: [
                { no: 1, grade: 9, name: '임희수' },
                { no: 2, grade: 9, name: '김루아' },
                { no: 3, grade: 7, name: '이산' },
                { no: 4, grade: 7, name: '이나건' },
                { no: 5, grade: 7, name: '정은수' },
                { no: 6, grade: 9, name: '박지완' },
                { no: 7, grade: 8, name: '문단우' },
                { no: 8, grade: 8, name: '박노엘' },
                { no: 9, grade: 8, name: '미국캠2' },
                { no: 10, grade: 9, name: '미국캠1' },
            ],
            남고: [
                { no: 1, grade: 12, name: '김형민' },
                { no: 2, grade: 12, name: '손주환' },
                { no: 3, grade: 10, name: '김민후' },
                { no: 4, grade: 10, name: '강한성' },
                { no: 5, grade: 11, name: '박환상' },
                { no: 6, grade: 10, name: '정현수' },
                { no: 7, grade: 12, name: '김주한' },
                { no: 8, grade: 10, name: '최사무엘' },
                { no: 9, grade: 10, name: '김시온' },
                { no: 10, grade: 10, name: '미국캠1' },
            ],
            여연합: [
                { no: 1, grade: 11, name: '김하진' },
                { no: 2, grade: 11, name: '석지혜' },
                { no: 3, grade: 10, name: '신지오' },
                { no: 4, grade: 9, name: '이수아' },
                { no: 5, grade: 8, name: '강라엘' },
                { no: 6, grade: 7, name: '박향유' },
                { no: 7, grade: 9, name: '김영진' },
                { no: 8, grade: 0, name: '미국캠1' },
                { no: 9, grade: 0, name: '미국캠2' },
            ],
        },
        태권도: {
            태권체조: [
                { no: 1, grade: 12, name: '김형민' },
                { no: 2, grade: 12, name: '손주환' },
                { no: 3, grade: 11, name: '김하진' },
                { no: 4, grade: 11, name: '박환상' },
                { no: 5, grade: 11, name: '석지혜' },
                { no: 6, grade: 10, name: '김민후' },
                { no: 7, grade: 9, name: '임희수' },
            ],
            '품새(중)': [
                { no: 1, grade: 9, name: '임희수' },
                { no: 2, grade: 9, name: '김영진' },
            ],
            '품새(고)': [
                { no: 1, grade: 11, name: '박환상' },
                { no: 2, grade: 11, name: '김하진' },
            ],
        },
    },
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

/** 모든 캠퍼스의 종목 합집합 (입력 순서 유지) */
export function getAllSports() {
    const out = [];
    const seen = new Set();
    for (const campus of SUPPORTED_CAMPUSES) {
        for (const sport of Object.keys(LINEUP[campus] || {})) {
            if (!seen.has(sport)) {
                seen.add(sport);
                out.push(sport);
            }
        }
    }
    return out;
}

/** 한 종목에서 모든 캠퍼스의 카테고리 합집합 */
export function getAllCategoriesForSport(sport) {
    const out = [];
    const seen = new Set();
    for (const campus of SUPPORTED_CAMPUSES) {
        for (const cat of Object.keys(LINEUP[campus]?.[sport] || {})) {
            if (!seen.has(cat)) {
                seen.add(cat);
                out.push(cat);
            }
        }
    }
    return out;
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
