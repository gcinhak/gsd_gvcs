import { useEffect, useRef, useState } from 'react';
import CampusBadge from '../components/CampusBadge';
import FallingGame from '../components/games/FallingGame';
import FlappyGame from '../components/games/FlappyGame';
import GaugeStopGame from '../components/games/GaugeStopGame';
import QuizGame from '../components/games/QuizGame';
import ReactionGame from '../components/games/ReactionGame';
import SequenceGame from '../components/games/SequenceGame';
import ShootTargetGame from '../components/games/ShootTargetGame';
import WhackAMoleGame from '../components/games/WhackAMoleGame';
import { CAMPUS_COLORS } from '../data/data';
import { fetchTerritory, playTerritory } from '../lib/territoryApi';

const CAMPUSES = ['문경', '음성', '세종'];
const MY_CAMPUS_KEY = 'gsd-territory-mycampus';
const POLL_MS = 3000;
const GAME_TYPES = ['quiz', 'reaction', 'gauge', 'flappy', 'sequence', 'falling', 'shoot', 'whack'];

const GAME_INFO = {
    quiz: {
        icon: '📚',
        title: '퀴즈',
        desc: '4지선다 문제가 나옵니다. 정답을 고르면 성공!',
    },
    reaction: {
        icon: '⚡',
        title: '반응속도',
        desc: '빨간 화면이 초록으로 바뀌면 400ms 이내에 클릭하세요.',
    },
    gauge: {
        icon: '🎯',
        title: '게이지 정지',
        desc: '좌우로 움직이는 포인터를 초록 구간에서 클릭하여 멈추세요.',
    },
    flappy: {
        icon: '🐦',
        title: '5초 버티기',
        desc: '화면을 탭(또는 스페이스)해서 새를 날립니다. 파이프를 피해 5초 동안 살아남으세요.',
    },
    sequence: {
        icon: '🧠',
        title: '순서 외우기',
        desc: '4개의 색버튼이 순서대로 점등됩니다. 같은 순서로 다시 누르세요.',
    },
    falling: {
        icon: '🌧',
        title: '물체 피하기',
        desc: '◀ ▶ 버튼(또는 방향키)으로 좌우 이동. 떨어지는 빨간 블록을 6초 동안 피하세요.',
    },
    shoot: {
        icon: '🔫',
        title: '움직이는 타겟 저격',
        desc: '벽을 튕기며 움직이는 빨간 타겟을 8초 안에 3번 클릭하여 맞추세요.',
    },
    whack: {
        icon: '🔨',
        title: '두더지 잡기',
        desc: '구멍에서 튀어나오는 두더지를 6초 안에 5마리 잡으세요.',
    },
};

function pickRandomGame() {
    return GAME_TYPES[Math.floor(Math.random() * GAME_TYPES.length)];
}

// ─────────────────────────────────────────────────────────────────────────────
// TerritoryMap — GVCS 캔버스 페인트볼
// ─────────────────────────────────────────────────────────────────────────────

// ── 시드 기반 난수 (mulberry32) ──────────────────────────────────────────────
// 같은 서버 state → 항상 같은 배치
function mulberry32(seed) {
    return function () {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function stateToSeed(state) {
    // 캠퍼스 점수를 합산해 정수 시드 생성
    return CAMPUSES.reduce((acc, c) => acc + (state.campuses[c] || 0), 0);
}

const CANVAS_W = 1050;
const CANVAS_H = 420;
const BIAS_SAMPLES = 10;

function hexToRgb(hex) {
    return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

/* 유기적 둥근 블롭 */
function drawBlob(ctx, cx, cy, r, clr, rng) {
    if (r < 0.8) return;
    const n = Math.max(9, Math.round(9 + r * 0.5));
    const pts = [];
    for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const noise = 0.78 + rng() * 0.34;
        pts.push([cx + Math.cos(a) * r * noise, cy + Math.sin(a) * r * noise]);
    }
    ctx.beginPath();
    ctx.moveTo((pts[0][0] + pts[n - 1][0]) / 2, (pts[0][1] + pts[n - 1][1]) / 2);
    for (let i = 0; i < n; i++) {
        const p = pts[i];
        const q = pts[(i + 1) % n];
        ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
    }
    ctx.closePath();
    ctx.fillStyle = clr;
    ctx.fill();
}

/* 짧고 통통한 스파이크 */
function drawRoundedSpike(ctx, ox, oy, angle, len, w, clr, rng) {
    const ex = ox + Math.cos(angle) * len;
    const ey = oy + Math.sin(angle) * len;
    const perp = angle + Math.PI / 2;
    const t = 0.45;
    const cpx = ox * (1 - t) + ex * t + Math.cos(perp) * w * 0.5;
    const cpy = oy * (1 - t) + ey * t + Math.sin(perp) * w * 0.5;
    const cpx2 = ox * (1 - t) + ex * t - Math.cos(perp) * w * 0.5;
    const cpy2 = oy * (1 - t) + ey * t - Math.sin(perp) * w * 0.5;
    ctx.beginPath();
    ctx.moveTo(ox + Math.cos(perp) * w, oy + Math.sin(perp) * w);
    ctx.quadraticCurveTo(cpx, cpy, ex, ey);
    ctx.quadraticCurveTo(cpx2, cpy2, ox - Math.cos(perp) * w, oy - Math.sin(perp) * w);
    ctx.quadraticCurveTo(
        ox - Math.cos(angle) * w * 0.4,
        oy - Math.sin(angle) * w * 0.4,
        ox + Math.cos(perp) * w,
        oy + Math.sin(perp) * w
    );
    ctx.closePath();
    ctx.fillStyle = clr;
    ctx.fill();
}

/* 스플래툰 스타일 스플랫 1발 */
function drawSplatoonSplat(ctx, cx, cy, size, clr, rng) {
    drawBlob(ctx, cx, cy, size, clr, rng);
    const nSpikes = 2 + Math.floor(rng() * 3);
    for (let i = 0; i < nSpikes; i++) {
        const a = rng() * Math.PI * 2;
        drawRoundedSpike(ctx, cx, cy, a, size * (0.7 + rng() * 0.9), size * (0.28 + rng() * 0.22), clr, rng);
    }
    const nMini = 1 + Math.floor(rng() * 3);
    for (let i = 0; i < nMini; i++) {
        const a = rng() * Math.PI * 2;
        drawBlob(
            ctx,
            cx + Math.cos(a) * size * (1.1 + rng()),
            cy + Math.sin(a) * size * (1.1 + rng()),
            size * (0.28 + rng() * 0.38),
            clr,
            rng
        );
    }
    const nDrops = 3 + Math.floor(rng() * 5);
    for (let i = 0; i < nDrops; i++) {
        const a = rng() * Math.PI * 2;
        drawBlob(
            ctx,
            cx + Math.cos(a) * size * (1.5 + rng() * 2.2),
            cy + Math.sin(a) * size * (1.5 + rng() * 2.2),
            size * (0.07 + rng() * 0.16),
            clr,
            rng
        );
    }
}

/* 강탈 모드 위치 선택:
 * - 캔버스에서 적 색상 픽셀을 우선 탐색
 * - 내 영역(myRgb) 경계 근처의 적 픽셀 선호
 */
function randStealPos(letterPixels, snapImageData, enemyRgb, myRgb, rng) {
    const SEARCH_R = 40;
    const INNER_R = 12;
    let bestPos = null;
    let bestScore = Infinity;

    for (let i = 0; i < BIAS_SAMPLES; i++) {
        const pos = letterPixels[Math.floor(rng() * letterPixels.length)];
        const [x, y] = pos;
        const idx = (y * CANVAS_W + x) * 4;

        // 이 픽셀이 적 색상인지 확인
        const a = snapImageData.data[idx + 3];
        if (a < 64) continue; // 빈 픽셀 스킵
        const [er, eg, eb] = enemyRgb;
        const distEnemy =
            Math.abs(snapImageData.data[idx] - er) +
            Math.abs(snapImageData.data[idx + 1] - eg) +
            Math.abs(snapImageData.data[idx + 2] - eb);
        if (distEnemy > 100) continue; // 적 색이 아니면 스킵

        // 내 영역이 도넛 안에 얼마나 있는지 (많을수록 내 경계 근처)
        let myCount = 0;
        const [mr, mg, mb] = myRgb;
        const step = 4;
        for (let dy = -SEARCH_R; dy <= SEARCH_R; dy += step) {
            for (let dx = -SEARCH_R; dx <= SEARCH_R; dx += step) {
                const d2 = dx * dx + dy * dy;
                if (d2 < INNER_R * INNER_R || d2 > SEARCH_R * SEARCH_R) continue;
                const nx = Math.min(CANVAS_W - 1, Math.max(0, x + dx));
                const ny = Math.min(CANVAS_H - 1, Math.max(0, y + dy));
                const ni = (ny * CANVAS_W + nx) * 4;
                if (snapImageData.data[ni + 3] > 64) {
                    const dm =
                        Math.abs(snapImageData.data[ni] - mr) +
                        Math.abs(snapImageData.data[ni + 1] - mg) +
                        Math.abs(snapImageData.data[ni + 2] - mb);
                    if (dm < 80) myCount++;
                }
            }
        }
        // 내 영역이 근처에 많을수록 점수 낮음(=선호)
        const score = -myCount;
        if (score < bestScore) {
            bestScore = score;
            bestPos = pos;
        }
    }
    // 적 픽셀을 못 찾으면 일반 랜덤
    return bestPos ?? letterPixels[Math.floor(rng() * letterPixels.length)];
}

/* 가중치 샘플링:
 *   - 흰 영역(알파 낮음) 선호
 *   - 같은 색이 이미 있는 영역 근처 선호 (클러스터링)
 * score가 낮을수록 우선 선택
 */
function randWeightedPos(letterPixels, snapImageData, targetRgb, rng) {
    let bestPos = null;
    let bestScore = Infinity;
    const SEARCH_R = 40; // 같은 색 인접 탐색 반경 (픽셀)

    for (let i = 0; i < BIAS_SAMPLES; i++) {
        const pos = letterPixels[Math.floor(rng() * letterPixels.length)];
        const [x, y] = pos;

        // ① 흰 영역 점수: 3×3 평균 알파 (낮을수록 좋음)
        let alphaSum = 0,
            cnt = 0;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const nx = Math.min(CANVAS_W - 1, Math.max(0, x + dx));
                const ny = Math.min(CANVAS_H - 1, Math.max(0, y + dy));
                alphaSum += snapImageData.data[(ny * CANVAS_W + nx) * 4 + 3];
                cnt++;
            }
        }
        const whiteScore = alphaSum / cnt; // 0(흰) ~ 255(칠해짐)

        // ② 경계 확장 점수: 도넛(annulus) 안의 같은 색 픽셀 수
        //    inner_r 안쪽은 제외 → 이미 칠해진 중심 위는 피하고
        //    outer_r 안쪽 링에서만 카운트 → 클러스터 경계 바로 밖을 선호
        let sameColorCount = 0;
        if (targetRgb) {
            const [tr, tg, tb] = targetRgb;
            const INNER_R = 12; // 이 안쪽은 이미 칠해진 영역으로 간주, 제외
            const step = 4;
            for (let dy = -SEARCH_R; dy <= SEARCH_R; dy += step) {
                for (let dx = -SEARCH_R; dx <= SEARCH_R; dx += step) {
                    const dist2 = dx * dx + dy * dy;
                    // 도넛 범위만 탐색
                    if (dist2 < INNER_R * INNER_R || dist2 > SEARCH_R * SEARCH_R) continue;
                    const nx = Math.min(CANVAS_W - 1, Math.max(0, x + dx));
                    const ny = Math.min(CANVAS_H - 1, Math.max(0, y + dy));
                    const idx = (ny * CANVAS_W + nx) * 4;
                    if (snapImageData.data[idx + 3] > 64) {
                        const dr = Math.abs(snapImageData.data[idx] - tr);
                        const dg = Math.abs(snapImageData.data[idx + 1] - tg);
                        const db = Math.abs(snapImageData.data[idx + 2] - tb);
                        if (dr + dg + db < 80) sameColorCount++;
                    }
                }
            }
        }
        // 최종 점수: 흰 영역 5 : 경계 확장 3 비율 (낮을수록 우선)
        // whiteScore 0~255, sameColorCount 도넛 기준 최대 ~220 → 계수 3.4
        const score = whiteScore * 5 - sameColorCount * 5.2;
        if (score < bestScore) {
            bestScore = score;
            bestPos = pos;
        }
    }
    return bestPos;
}

/**
 * 페인트볼 개수 계산:
 *   delta / total  → 이번에 늘어난 비율
 *   × letterPixels.length  → 글자 영역 픽셀 수 기준으로 환산
 *   × 10  → 스플랫 1개가 커버하는 픽셀 대비 여유 계수
 */
function calcSplatCount(delta, total, letterPixelCount) {
    const fraction = delta / (total || 200000);
    // 스플랫 1개 평균 커버 픽셀 ≈ 175px (블롭+스파이크+위성 합산)
    // fraction * 글자픽셀수 = 목표 커버 픽셀수 → ÷175 = 필요 스플랫 수
    return Math.round((fraction * letterPixelCount) / 20);
}

function TerritoryMap({ state, onStatsUpdate, onAnimationStart, onAnimationEnd }) {
    const canvasRef = useRef(null);
    const letterCRef = useRef(null);
    const splatCRef = useRef(null);
    const tempCRef = useRef(null);
    const letterPixelsRef = useRef(null);
    const prevStateRef = useRef(null);
    const rngRef = useRef(null); // 시드 기반 난수
    const overlayCRef = useRef(null); // 임팩트 이펙트 오버레이
    const impactsRef = useRef([]); // 활성 임팩트 목록 { x, y, clr, startTime, duration }

    /* 마운트 시 1회 — 오프스크린 캔버스 + 글자 마스크 초기화 */
    useEffect(() => {
        const lc = document.createElement('canvas');
        lc.width = CANVAS_W;
        lc.height = CANVAS_H;
        const lCtx = lc.getContext('2d');
        lCtx.fillStyle = 'white';
        lCtx.textAlign = 'center';
        lCtx.textBaseline = 'middle';
        let fs = CANVAS_H * 0.96;
        lCtx.font = `bold ${fs}px Impact, Arial Black, sans-serif`;
        const mw = lCtx.measureText('GVCS').width;
        if (mw > CANVAS_W * 0.97) {
            fs *= (CANVAS_W * 0.97) / mw;
            lCtx.font = `bold ${fs}px Impact, Arial Black, sans-serif`;
        }
        lCtx.fillText('GVCS', CANVAS_W / 2, CANVAS_H / 2);
        letterCRef.current = lc;

        const id = lCtx.getImageData(0, 0, CANVAS_W, CANVAS_H);
        const pixels = [];
        for (let y = 0; y < CANVAS_H; y += 2)
            for (let x = 0; x < CANVAS_W; x += 2) if (id.data[(y * CANVAS_W + x) * 4 + 3] > 128) pixels.push([x, y]);
        letterPixelsRef.current = pixels;

        const sc = document.createElement('canvas');
        sc.width = CANVAS_W;
        sc.height = CANVAS_H;
        splatCRef.current = sc;

        const tc = document.createElement('canvas');
        tc.width = CANVAS_W;
        tc.height = CANVAS_H;
        tempCRef.current = tc;

        const oc = document.createElement('canvas');
        oc.width = CANVAS_W;
        oc.height = CANVAS_H;
        overlayCRef.current = oc;

        // localStorage에서 이전 캔버스 복원 시도
        try {
            const saved = localStorage.getItem('gvcs-territory-canvas');
            if (saved) {
                const { seed: savedSeed, dataUrl } = JSON.parse(saved);
                // seed는 나중에 state 로드 후 검증 — 일단 dataUrl 저장
                splatCRef.current._savedSeed = savedSeed;
                splatCRef.current._savedDataUrl = dataUrl;
            }
        } catch {}

        render();
    }, []);

    function calcCanvasStats() {
        const lp = letterPixelsRef.current;
        const sc = splatCRef.current;
        if (!lp || !sc || !onStatsUpdate) return;
        const sCtx = sc.getContext('2d');
        const id = sCtx.getImageData(0, 0, CANVAS_W, CANVAS_H);
        const campusRgb = Object.fromEntries(CAMPUSES.map((c) => [c, hexToRgb(CAMPUS_COLORS[c]?.bg || '#888')]));
        const counts = Object.fromEntries(CAMPUSES.map((c) => [c, 0]));
        let empty = 0;
        const step = 3; // 샘플 간격 (정확도↑)
        let total = 0;
        for (let i = 0; i < lp.length; i += step) {
            const [px, py] = lp[i];
            const idx = (py * CANVAS_W + px) * 4;
            total++;
            if (id.data[idx + 3] < 20) {
                empty++;
                continue;
            }
            const rv = id.data[idx],
                gv = id.data[idx + 1],
                bv = id.data[idx + 2];
            let best = null,
                bestD = 120;
            for (const [campus, [cr, cg, cb]] of Object.entries(campusRgb)) {
                const d = Math.abs(rv - cr) + Math.abs(gv - cg) + Math.abs(bv - cb);
                if (d < bestD) {
                    bestD = d;
                    best = campus;
                }
            }
            if (best) counts[best]++;
            else empty++;
        }
        onStatsUpdate({ counts, empty, total });
    }

    function render(updateStats = false) {
        const canvas = canvasRef.current;
        if (!canvas || !letterCRef.current || !splatCRef.current) return;
        const dCtx = canvas.getContext('2d');
        const lc = letterCRef.current;
        const sc = splatCRef.current;
        const tc = tempCRef.current;
        const tCtx = tc.getContext('2d');

        dCtx.fillStyle = '#0f172a';
        dCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        dCtx.drawImage(lc, 0, 0);

        tCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);
        tCtx.drawImage(sc, 0, 0);
        tCtx.globalCompositeOperation = 'destination-in';
        tCtx.drawImage(lc, 0, 0);
        tCtx.globalCompositeOperation = 'source-over';
        dCtx.drawImage(tc, 0, 0);

        // 임팩트 이펙트 항상 최상단에 합성
        compositeImpacts(dCtx);

        if (updateStats) calcCanvasStats();
    }

    /* 파티클 폭발 임팩트 — overlay에 그리고 display에 합성 */
    function compositeImpacts(dCtx) {
        const oc = overlayCRef.current;
        const lc = letterCRef.current;
        const tc = tempCRef.current;
        if (!oc || !lc || !tc) return;

        const oCtx = oc.getContext('2d');
        const tCtx = tc.getContext('2d');
        const now = performance.now();

        oCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);
        const alive = [];

        for (const imp of impactsRef.current) {
            const t = Math.min(1, (now - imp.startTime) / imp.duration);
            if (t >= 1) continue;
            alive.push(imp);

            const { x, y, clr } = imp;
            const scale = imp.r / 30;
            const N = 14;

            for (let i = 0; i < N; i++) {
                const angle = (i / N) * Math.PI * 2 + 0.3;
                const speed = (42 + (i % 3) * 21) * scale;
                const size = (3 + (i % 4) * 2.2) * scale;
                const grav = 60 * scale;
                const px = x + Math.cos(angle) * speed * t;
                const py = y + Math.sin(angle) * speed * t + grav * t * t;
                const alpha = Math.max(0, 1 - t * 1.4);

                // 파티클 본체
                oCtx.globalAlpha = alpha;
                oCtx.fillStyle = clr;
                oCtx.beginPath();
                oCtx.arc(px, py, Math.max(0.5, size * (1 - t * 0.6)), 0, Math.PI * 2);
                oCtx.fill();

                // 잔상 trail
                if (t > 0.08) {
                    const t2 = t - 0.08;
                    const px2 = x + Math.cos(angle) * speed * t2;
                    const py2 = y + Math.sin(angle) * speed * t2 + grav * t2 * t2;
                    oCtx.globalAlpha = alpha * 0.3;
                    oCtx.strokeStyle = clr;
                    oCtx.lineWidth = size * 0.8;
                    oCtx.lineCap = 'round';
                    oCtx.beginPath();
                    oCtx.moveTo(px2, py2);
                    oCtx.lineTo(px, py);
                    oCtx.stroke();
                }
            }

            // 중심 플래시
            if (t < 0.25) {
                const fe = 1 - t / 0.25;
                oCtx.globalAlpha = fe * 0.85;
                oCtx.fillStyle = '#ffffff';
                oCtx.beginPath();
                oCtx.arc(x, y, imp.r * 0.55 * fe, 0, Math.PI * 2);
                oCtx.fill();
                oCtx.globalAlpha = fe * 0.5;
                oCtx.fillStyle = clr;
                oCtx.beginPath();
                oCtx.arc(x, y, imp.r * 0.9 * fe, 0, Math.PI * 2);
                oCtx.fill();
            }

            oCtx.globalAlpha = 1;
        }

        impactsRef.current = alive;

        if (alive.length > 0) {
            tCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);
            tCtx.drawImage(oc, 0, 0);
            tCtx.globalCompositeOperation = 'destination-in';
            tCtx.drawImage(lc, 0, 0);
            tCtx.globalCompositeOperation = 'source-over';
            dCtx.drawImage(tc, 0, 0);
        }
    }

    /* RAF 루프 — 임팩트가 살아있는 동안 render()를 계속 호출 */
    const rafRef = useRef(null);
    function tickImpacts() {
        render(); // render() 안에서 compositeImpacts 호출
        if (impactsRef.current.length > 0) {
            rafRef.current = requestAnimationFrame(tickImpacts);
        } else {
            rafRef.current = null;
        }
    }

    /* 임팩트 1발 등록 */
    function addImpact(x, y, clr, r) {
        impactsRef.current.push({ x, y, clr, r: r * 1.6, startTime: performance.now(), duration: 700 });
        if (!rafRef.current) {
            rafRef.current = requestAnimationFrame(tickImpacts);
        }
    }

    useEffect(() => {
        if (!letterPixelsRef.current || !splatCRef.current) return;

        const sc = splatCRef.current;
        const sCtx = sc.getContext('2d');
        const lp = letterPixelsRef.current;
        const total = state.total || 200000;

        const prev = prevStateRef.current;
        prevStateRef.current = state;

        // 시드 초기화: 첫 로드면 state 기반 고정 시드, 이후엔 delta 포함
        const seed = stateToSeed(state);
        rngRef.current = mulberry32(seed);
        const rng = rngRef.current;

        // 변화량 계산 (증가/감소 모두 추적)
        const gained = {}; // 늘어난 캠퍼스 { campus: delta }
        const lost = {}; // 줄어든 캠퍼스 { campus: |delta| }
        for (const c of CAMPUSES) {
            const delta = (state.campuses[c] || 0) - (prev ? prev.campuses[c] || 0 : 0);
            if (delta > 0) gained[c] = delta;
            if (delta < 0) lost[c] = -delta;
        }
        if (Object.keys(gained).length === 0) return;

        // 강탈 여부: 빈 땅이 줄지 않고 상대 캠퍼스가 줄었으면 steal
        const isSteal = Object.keys(lost).length > 0;

        // ── 첫 서버 로드 (prev가 없거나 모두 0) → 빠른 애니메이션으로 채우기 ──
        const isFirstLoad = !prev || CAMPUSES.every((c) => (prev.campuses[c] || 0) === 0);

        if (isFirstLoad) {
            // localStorage 복원: 저장된 seed와 현재 seed가 일치하면 즉시 복원
            const currentSeed = stateToSeed(state);
            const savedSeed = sc._savedSeed;
            const savedDataUrl = sc._savedDataUrl;
            if (savedSeed === currentSeed && savedDataUrl) {
                const img = new Image();
                img.onload = () => {
                    sCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);
                    sCtx.drawImage(img, 0, 0);
                    render(true);
                };
                img.src = savedDataUrl;
                return;
            }
            // 모든 캠퍼스 스플랫을 하나의 큐로 섞어서 동시다발로 날아오는 느낌
            const queue = [];
            for (const [campus, delta] of Object.entries(gained)) {
                const count = Math.min(2000, calcSplatCount(delta, total, lp.length));
                const clr = CAMPUS_COLORS[campus]?.bg || '#888';
                for (let n = 0; n < count; n++) queue.push(clr);
            }
            // 캠퍼스끼리 섞기 (Fisher-Yates)
            for (let i = queue.length - 1; i > 0; i--) {
                const j = Math.floor(rng() * (i + 1));
                [queue[i], queue[j]] = [queue[j], queue[i]];
            }
            let qi = 0;
            // rAF 기반 배치 처리 — 1초 내 완료 보장
            // setTimeout은 최소 4~16ms라 느리므로 rAF(~16.7ms/frame)로 프레임당 N발씩
            const TARGET_MS = 2000;
            const FRAMES = Math.ceil(TARGET_MS / 16.7); // ~60프레임
            const perFrame = Math.max(1, Math.ceil(queue.length / FRAMES));
            let snapId = sCtx.getImageData(0, 0, CANVAS_W, CANVAS_H);
            let snapCounter = 0;

            function fireInitial() {
                if (qi >= queue.length) {
                    render(true);
                    // 완료 후 캔버스 상태 저장
                    try {
                        const dataUrl = sc.toDataURL('image/png');
                        localStorage.setItem(
                            'gvcs-territory-canvas',
                            JSON.stringify({
                                seed: stateToSeed(state),
                                dataUrl,
                            })
                        );
                    } catch {}
                    return;
                }
                // 프레임당 perFrame발씩 동기 처리
                for (let f = 0; f < perFrame && qi < queue.length; f++) {
                    snapCounter++;
                    if (snapCounter % 30 === 0) snapId = sCtx.getImageData(0, 0, CANVAS_W, CANVAS_H);
                    const clr = queue[qi++];
                    const pos = randWeightedPos(lp, snapId, hexToRgb(clr), rng);
                    if (pos) {
                        const size = 2.5 + rng() * 6.5;
                        drawSplatoonSplat(sCtx, pos[0], pos[1], size, clr, rng);
                        // 매 10발마다 이펙트
                        if (qi % 8 === 0) addImpact(pos[0], pos[1], clr, size * 3.5 * 1.15);
                    }
                }
                render();
                requestAnimationFrame(fireInitial);
            }
            requestAnimationFrame(fireInitial);
            return;
        }

        // ── 일반 점령 / 강탈: 순차 애니메이션 ──
        if (onAnimationStart) onAnimationStart();
        const entries = Object.entries(gained);
        let entryIdx = 0;

        function fireNext() {
            if (entryIdx >= entries.length) {
                if (onAnimationEnd) onAnimationEnd();
                return;
            }
            const [campus, delta] = entries[entryIdx++];
            const clr = CAMPUS_COLORS[campus]?.bg || '#888';
            const myRgb = hexToRgb(clr);
            const count = Math.min(80, Math.max(5, calcSplatCount(delta, total, lp.length)));
            let n = 0;
            let snapId = sCtx.getImageData(0, 0, CANVAS_W, CANVAS_H);

            // 강탈 시: 어떤 적을 덮을지 결정 (lost 중 가장 많이 줄어든 캠퍼스)
            const enemyCampus = isSteal ? Object.entries(lost).sort((a, b) => b[1] - a[1])[0]?.[0] : null;
            const enemyRgb = enemyCampus ? hexToRgb(CAMPUS_COLORS[enemyCampus]?.bg || '#888') : null;

            function nextSplat() {
                if (n >= count) {
                    render(true);
                    fireNext();
                    return;
                }
                if (n % 4 === 0) snapId = sCtx.getImageData(0, 0, CANVAS_W, CANVAS_H);

                // 강탈이면 적 픽셀 위를 선호, 아니면 흰 영역 선호
                const pos =
                    isSteal && enemyRgb
                        ? randStealPos(lp, snapId, enemyRgb, myRgb, rng)
                        : randWeightedPos(lp, snapId, myRgb, rng);

                if (pos) {
                    const size = 4.5 + rng() * 9.0; // 게임 플레이 스플랫 더 크게
                    drawSplatoonSplat(sCtx, pos[0], pos[1], size, clr, rng);
                    render();
                    addImpact(pos[0], pos[1], clr, size * 3.5);
                }
                n++;
                setTimeout(nextSplat, Math.max(60, Math.floor(2000 / count)) + rng() * 30); // 2.5초 안에 완료
            }
            nextSplat();
        }
        fireNext();
    }, [state]);

    return (
        <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            style={{ width: '100%', borderRadius: '12px', display: 'block' }}
        />
    );
}

// ─────────────────────────────────────────────────────────────────────────────

function TerritoryLegend({ state }) {
    const total = state.total || 1;
    const fmt = (n) => ((n / total) * 100).toFixed(3) + '%';
    return (
        <div className="terr-legend">
            {CAMPUSES.map((c) => (
                <div key={c} className="terr-legend-item">
                    <CampusBadge campus={c} size="sm" />
                    <span className="terr-pct">{fmt(state.campuses[c] || 0)}</span>
                </div>
            ))}
            <div className="terr-legend-item">
                <span className="terr-empty-chip">빈 땅</span>
                <span className="terr-pct">{fmt(state.empty || 0)}</span>
            </div>
        </div>
    );
}

function GameModal({ gameType, onResolve, onClose }) {
    const [started, setStarted] = useState(gameType === 'quiz');
    const info = GAME_INFO[gameType] || {};

    return (
        <div className="game-modal-backdrop" onClick={onClose}>
            <div className="game-modal" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="gm-close" onClick={onClose} aria-label="닫기">
                    ✕
                </button>
                {!started ? (
                    <div className="game-intro">
                        <div className="gi-icon">{info.icon}</div>
                        <div className="gi-title">{info.title}</div>
                        <div className="gi-desc">{info.desc}</div>
                        <button type="button" className="gi-start" onClick={() => setStarted(true)}>
                            ▶ 시작!
                        </button>
                    </div>
                ) : (
                    <>
                        {gameType === 'quiz' && (
                            <QuizGame onWin={() => onResolve(true)} onLose={() => onResolve(false)} />
                        )}
                        {gameType === 'reaction' && (
                            <ReactionGame onWin={() => onResolve(true)} onLose={() => onResolve(false)} />
                        )}
                        {gameType === 'gauge' && (
                            <GaugeStopGame onWin={() => onResolve(true)} onLose={() => onResolve(false)} />
                        )}
                        {gameType === 'flappy' && (
                            <FlappyGame onWin={() => onResolve(true)} onLose={() => onResolve(false)} />
                        )}
                        {gameType === 'sequence' && (
                            <SequenceGame onWin={() => onResolve(true)} onLose={() => onResolve(false)} />
                        )}
                        {gameType === 'falling' && (
                            <FallingGame onWin={() => onResolve(true)} onLose={() => onResolve(false)} />
                        )}
                        {gameType === 'shoot' && (
                            <ShootTargetGame onWin={() => onResolve(true)} onLose={() => onResolve(false)} />
                        )}
                        {gameType === 'whack' && (
                            <WhackAMoleGame onWin={() => onResolve(true)} onLose={() => onResolve(false)} />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default function TerritoryPage() {
    const [state, setState] = useState({
        campuses: { 문경: 0, 음성: 0, 세종: 0 },
        total: 200000,
        empty: 200000,
    });
    const [myCampus, setMyCampus] = useState(() => {
        if (typeof window === 'undefined') return '';
        return window.localStorage.getItem(MY_CAMPUS_KEY) || '';
    });
    const [gameType, setGameType] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [resultMsg, setResultMsg] = useState('');
    const [canvasStats, setCanvasStats] = useState(null);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const pull = async () => {
            try {
                const data = await fetchTerritory();
                if (!cancelled) setState(data);
            } catch {
                /* ignore */
            }
        };
        pull();
        const timer = setInterval(pull, POLL_MS);
        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, []);

    const selectCampus = (c) => {
        setMyCampus(c);
        window.localStorage.setItem(MY_CAMPUS_KEY, c);
    };

    const startGame = () => {
        if (!myCampus) return;
        setResultMsg('');
        setGameType((prev) => prev ?? pickRandomGame());
        setModalOpen(true);
    };

    const cancelGame = () => setModalOpen(false);

    const finishGame = () => {
        setModalOpen(false);
        setGameType(null);
    };

    const onGameResolved = async (won) => {
        if (!myCampus) {
            finishGame();
            return;
        }
        if (!won) {
            setResultMsg('❌ 실패 — 다시 도전해보세요');
            finishGame();
            return;
        }
        try {
            const result = await playTerritory(myCampus);
            setState({ campuses: result.campuses, total: result.total, empty: result.empty });
            if (result.mode === 'claim') {
                setResultMsg(`✅ ${myCampus} +0.01% 영토 차지!`);
            } else if (result.mode === 'steal') {
                setResultMsg(`⚔️ ${result.stolenFrom} 에게서 0.005% 빼앗았어요!`);
            }
        } catch (err) {
            if (String(err.message).includes('fully conquered')) {
                setResultMsg('🏆 이미 모든 땅을 본인 캠퍼스가 점령했습니다!');
            } else {
                setResultMsg('서버 오류: ' + err.message);
            }
        }
        finishGame();
    };

    const emptyExists = state.empty > 0;
    const mode = emptyExists ? 'claim' : 'steal';

    return (
        <div className="territory-page">
            <header className="terr-head">
                <div className="terr-head-left">
                    <h2 className="terr-title">🏰 점령전</h2>
                    <p className="terr-sub">퀴즈와 미니게임을 클리어해서 캠퍼스 영토를 차지하세요!</p>
                </div>
                <div className="terr-campus-pick">
                    {CAMPUSES.map((c) => {
                        const cc = CAMPUS_COLORS[c] || {};
                        const active = myCampus === c;
                        const style = active
                            ? { background: cc.bg, color: '#fff', borderColor: cc.bg }
                            : { background: cc.soft, color: cc.bg, borderColor: cc.bg };
                        return (
                            <button
                                key={c}
                                type="button"
                                className={`terr-team-pill ${active ? 'active' : ''}`}
                                style={style}
                                onClick={() => selectCampus(c)}
                                title={`${c} 캠퍼스로 플레이`}
                            >
                                {c}
                            </button>
                        );
                    })}
                </div>
            </header>

            <button
                type="button"
                className={`terr-vis terr-vis-btn ${myCampus ? 'is-ready' : 'is-locked'} ${isAnimating ? 'is-animating' : ''}`}
                disabled={isAnimating}
                onClick={() => {
                    if (isAnimating) return;
                    if (!myCampus) {
                        setResultMsg('⚠️ 우측 상단에서 캠퍼스를 먼저 선택하세요');
                        return;
                    }
                    startGame();
                }}
                aria-label="게임 시작"
            >
                <TerritoryMap
                    state={state}
                    onStatsUpdate={setCanvasStats}
                    onAnimationStart={() => setIsAnimating(true)}
                    onAnimationEnd={() => setIsAnimating(false)}
                />
                <TerritoryLegend state={state} />
                <p
                    style={{
                        fontSize: '11px',
                        color: 'var(--color-text-tertiary)',
                        margin: '0.3rem 0 0',
                        textAlign: 'center',
                    }}
                >
                    실제 점수와 보이는 시각적 비율이 상이할 수 있음에 주의하세요
                </p>
                <span className={`terr-vis-overlay mode-${mode}`}>
                    <span className="terr-vis-cta">
                        {!myCampus
                            ? '👆 캠퍼스 선택 후 클릭'
                            : mode === 'claim'
                              ? '🟦 클릭하여 빈 땅 차지 (+0.01%)'
                              : '⚔️ 클릭하여 상대 땅 강탈 (+0.005%)'}
                    </span>
                </span>
            </button>

            {/* resultMsg 비활성화 */}

            {modalOpen && gameType && <GameModal gameType={gameType} onResolve={onGameResolved} onClose={cancelGame} />}
        </div>
    );
}
