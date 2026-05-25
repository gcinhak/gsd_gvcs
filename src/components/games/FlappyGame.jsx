import { useEffect, useRef, useState } from 'react';

const GAME_W = 300;
const GAME_H = 220;
const GRAVITY = 0.0010;     // px/ms²
const FLAP_V = -0.42;       // px/ms
const PIPE_SPEED = 0.13;    // px/ms
const PIPE_W = 38;
const GAP = 140;            // 넉넉히
const PIPE_INTERVAL = 1150; // ms
const GRACE_MS = 1200;      // 시작 전 준비 시간
const WIN_TIME = 5000;
const BIRD_X = 56;
const BIRD_R = 9;           // 히트박스 작게

export default function FlappyGame({ onWin, onLose }) {
    const [, force] = useState(0);
    const [phase, setPhase] = useState('ready'); // ready | play | done
    const [winResult, setWinResult] = useState(false);
    const stateRef = useRef({
        birdY: GAME_H / 2,
        birdV: 0,
        pipes: [],
        playStartedAt: 0,
        lastSpawn: 0,
    });
    const phaseRef = useRef('ready');
    const rafRef = useRef(null);

    useEffect(() => {
        let cancelled = false;
        let lastT = performance.now();
        const s = stateRef.current;
        const mounted = lastT;
        s.playStartedAt = mounted + GRACE_MS;
        // 게임 시작 후 약 0.9s 뒤 첫 파이프
        s.lastSpawn = s.playStartedAt - PIPE_INTERVAL + 900;

        const end = (win) => {
            cancelAnimationFrame(rafRef.current);
            phaseRef.current = 'done';
            setWinResult(win);
            setPhase('done');
            setTimeout(() => (win ? onWin?.() : onLose?.()), 500);
        };

        const loop = (t) => {
            if (cancelled) return;
            const dt = Math.min(t - lastT, 40);
            lastT = t;

            // 준비 구간: 새는 중앙 고정, 파이프/중력 없음
            if (t < s.playStartedAt) {
                s.birdY = GAME_H / 2;
                s.birdV = 0;
                force((x) => (x + 1) % 1000);
                rafRef.current = requestAnimationFrame(loop);
                return;
            }
            // 준비 끝나는 순간 phase 전환
            if (phaseRef.current === 'ready') {
                phaseRef.current = 'play';
                setPhase('play');
            }

            s.birdV += GRAVITY * dt;
            s.birdY += s.birdV * dt;
            if (t - s.lastSpawn > PIPE_INTERVAL) {
                s.lastSpawn = t;
                const gapY = 24 + Math.random() * (GAME_H - 48 - GAP);
                s.pipes.push({ x: GAME_W, gapY });
            }
            s.pipes.forEach((p) => { p.x -= PIPE_SPEED * dt; });
            s.pipes = s.pipes.filter((p) => p.x + PIPE_W > -10);
            if (s.birdY - BIRD_R < 0 || s.birdY + BIRD_R > GAME_H) {
                end(false); return;
            }
            for (const p of s.pipes) {
                if (BIRD_X + BIRD_R > p.x && BIRD_X - BIRD_R < p.x + PIPE_W) {
                    if (s.birdY - BIRD_R < p.gapY || s.birdY + BIRD_R > p.gapY + GAP) {
                        end(false); return;
                    }
                }
            }
            if (t - s.playStartedAt >= WIN_TIME) { end(true); return; }
            force((x) => (x + 1) % 1000);
            rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);

        const onKey = (e) => {
            if (e.key !== ' ' && e.key !== 'ArrowUp') return;
            if (phaseRef.current !== 'play') return;
            e.preventDefault();
            stateRef.current.birdV = FLAP_V;
        };
        window.addEventListener('keydown', onKey);

        return () => {
            cancelled = true;
            cancelAnimationFrame(rafRef.current);
            window.removeEventListener('keydown', onKey);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const flap = (e) => {
        if (phaseRef.current !== 'play') return;
        e?.preventDefault?.();
        stateRef.current.birdV = FLAP_V;
    };

    const s = stateRef.current;
    const now = performance.now();
    let statusText;
    if (phase === 'ready') {
        const left = Math.max(0, s.playStartedAt - now);
        statusText = `준비... ${Math.ceil(left / 1000)}`;
    } else if (phase === 'play') {
        const remain = Math.max(0, WIN_TIME - (now - s.playStartedAt));
        statusText = `${(remain / 1000).toFixed(1)}s`;
    } else {
        statusText = winResult ? '성공!' : '실패!';
    }

    return (
        <div className="game-flappy">
            <div className="game-tag">🐦 5초 버티기</div>
            <div className="gflp-status">{statusText}</div>
            <div className="gflp-board" style={{ width: GAME_W, height: GAME_H }}
                 onPointerDown={flap}>
                {s.pipes.map((p, i) => (
                    <span key={i}>
                        <div className="gflp-pipe" style={{ left: p.x, top: 0, width: PIPE_W, height: p.gapY }} />
                        <div className="gflp-pipe" style={{ left: p.x, top: p.gapY + GAP, width: PIPE_W, height: GAME_H - (p.gapY + GAP) }} />
                    </span>
                ))}
                <div className="gflp-bird"
                     style={{ left: BIRD_X - BIRD_R, top: s.birdY - BIRD_R, width: BIRD_R * 2, height: BIRD_R * 2 }} />
                {phase === 'ready' && (
                    <div className="gflp-overlay">
                        <span>{statusText}</span>
                    </div>
                )}
            </div>
            <div className="gr-hint">탭/스페이스로 날아오르기. 파이프 피해서 5초 버티기!</div>
        </div>
    );
}
