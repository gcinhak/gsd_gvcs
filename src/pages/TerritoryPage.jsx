import { useEffect, useMemo, useState } from 'react';
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

const GRID_COLS = 75;
const GRID_ROWS = 30;
const GRID_CELLS = GRID_COLS * GRID_ROWS; // 2250

function pickRandomGame() {
    return GAME_TYPES[Math.floor(Math.random() * GAME_TYPES.length)];
}

/**
 * 실수 비율을 정수 셀 수로 분배하면서 합이 정확히 GRID_CELLS 가 되도록.
 * (largest-remainder method)
 */
function distributeCells(state) {
    const total = state.total || 1;
    const raw = [];
    for (const c of CAMPUSES) {
        raw.push({ key: c, exact: ((state.campuses[c] || 0) * GRID_CELLS) / total });
    }
    raw.push({ key: '__empty', exact: ((state.empty || 0) * GRID_CELLS) / total });

    const floored = raw.map((r) => ({ ...r, n: Math.floor(r.exact), frac: r.exact - Math.floor(r.exact) }));
    let used = floored.reduce((s, r) => s + r.n, 0);
    let remaining = GRID_CELLS - used;
    const sorted = [...floored].sort((a, b) => b.frac - a.frac);
    for (let i = 0; i < sorted.length && remaining > 0; i++) {
        sorted[i].n += 1;
        remaining--;
    }
    const out = {};
    for (const r of floored) out[r.key] = r.n;
    return out;
}

function TerritoryMap({ state }) {
    const cellOwners = useMemo(() => {
        const counts = distributeCells(state);
        const owners = [];
        const order = [...CAMPUSES, '__empty'];
        for (const key of order) {
            for (let i = 0; i < counts[key]; i++) owners.push(key);
        }
        // 안전장치
        while (owners.length < GRID_CELLS) owners.push('__empty');
        return owners.slice(0, GRID_CELLS);
    }, [state]);

    return (
        <div className="terr-map" style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)` }}>
            {cellOwners.map((owner, i) => {
                const color = owner === '__empty' ? null : CAMPUS_COLORS[owner]?.bg;
                return (
                    <span
                        key={i}
                        className={`terr-cell ${owner === '__empty' ? 'is-empty' : ''}`}
                        style={color ? { background: color } : {}}
                    />
                );
            })}
        </div>
    );
}

function TerritoryLegend({ state }) {
    const total = state.total || 1;
    const fmt = (n) => ((n / total) * 100).toFixed(3) + '%';
    return (
        <div className="terr-legend">
            {CAMPUSES.map((c) => {
                const n = state.campuses[c] || 0;
                return (
                    <div key={c} className="terr-legend-item">
                        <CampusBadge campus={c} size="sm" />
                        <span className="terr-pct">{fmt(n)}</span>
                    </div>
                );
            })}
            <div className="terr-legend-item">
                <span className="terr-empty-chip">빈 땅</span>
                <span className="terr-pct">{fmt(state.empty || 0)}</span>
            </div>
        </div>
    );
}

function GameModal({ gameType, onResolve, onClose }) {
    // 퀴즈는 인트로 생략 — 바로 문제 등장
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
        // 진행 중이던 게임이 있으면 같은 타입을 다시 사용 (= 똑같은 게임 다시)
        setGameType((prev) => prev ?? pickRandomGame());
        setModalOpen(true);
    };

    // 모달 닫기: 게임 타입은 유지 → 다음에 또 같은 게임 등장
    const cancelGame = () => setModalOpen(false);

    // 게임 결과 확정 (승/패) — 게임 타입을 비워서 다음엔 새로 뽑음
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
                className={`terr-vis terr-vis-btn ${myCampus ? 'is-ready' : 'is-locked'}`}
                onClick={() => {
                    if (!myCampus) {
                        setResultMsg('⚠️ 우측 상단에서 캠퍼스를 먼저 선택하세요');
                        return;
                    }
                    startGame();
                }}
                aria-label="게임 시작"
            >
                <TerritoryMap state={state} />
                <TerritoryLegend state={state} />
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

            {resultMsg && <div className="terr-result-msg">{resultMsg}</div>}

            {modalOpen && gameType && <GameModal gameType={gameType} onResolve={onGameResolved} onClose={cancelGame} />}
        </div>
    );
}
