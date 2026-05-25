import { useEffect, useRef, useState } from 'react';

const GAME_W = 300;
const GAME_H = 240;
const PLAYER_W = 40;
const PLAYER_H = 22;
const PLAYER_Y = GAME_H - PLAYER_H - 6;
const PLAYER_SPEED = 0.34;   // px/ms
const OBJ_W = 22;
const OBJ_H = 22;
const OBJ_SPEED = 0.18;      // px/ms
const SPAWN_MS = 360;
const WIN_TIME = 6000;

export default function FallingGame({ onWin, onLose }) {
    const [, force] = useState(0);
    const [phase, setPhase] = useState('play');
    const [winResult, setWinResult] = useState(false);
    const stateRef = useRef({
        playerX: GAME_W / 2,
        objects: [],
        moveDir: 0,
        startedAt: 0,
        lastSpawn: 0,
    });
    const rafRef = useRef(null);

    useEffect(() => {
        let cancelled = false;
        let lastT = performance.now();
        const s = stateRef.current;
        s.startedAt = lastT;
        s.lastSpawn = lastT;

        const end = (win) => {
            cancelAnimationFrame(rafRef.current);
            setWinResult(win);
            setPhase('done');
            setTimeout(() => (win ? onWin?.() : onLose?.()), 500);
        };

        const loop = (t) => {
            if (cancelled) return;
            const dt = Math.min(t - lastT, 40);
            lastT = t;
            s.playerX += s.moveDir * PLAYER_SPEED * dt;
            s.playerX = Math.max(PLAYER_W / 2, Math.min(GAME_W - PLAYER_W / 2, s.playerX));
            if (t - s.lastSpawn > SPAWN_MS) {
                s.lastSpawn = t;
                s.objects.push({ x: Math.random() * (GAME_W - OBJ_W), y: -OBJ_H });
            }
            s.objects.forEach((o) => { o.y += OBJ_SPEED * dt; });
            s.objects = s.objects.filter((o) => o.y < GAME_H + OBJ_H);
            const px = s.playerX - PLAYER_W / 2;
            const py = PLAYER_Y;
            for (const o of s.objects) {
                if (o.x + OBJ_W > px && o.x < px + PLAYER_W &&
                    o.y + OBJ_H > py && o.y < py + PLAYER_H) {
                    end(false); return;
                }
            }
            if (t - s.startedAt >= WIN_TIME) { end(true); return; }
            force((x) => (x + 1) % 1000);
            rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);

        const onKey = (e, down) => {
            if (e.key === 'ArrowLeft') {
                if (down) stateRef.current.moveDir = -1;
                else if (stateRef.current.moveDir === -1) stateRef.current.moveDir = 0;
            } else if (e.key === 'ArrowRight') {
                if (down) stateRef.current.moveDir = 1;
                else if (stateRef.current.moveDir === 1) stateRef.current.moveDir = 0;
            }
        };
        const kd = (e) => onKey(e, true);
        const ku = (e) => onKey(e, false);
        window.addEventListener('keydown', kd);
        window.addEventListener('keyup', ku);

        return () => {
            cancelled = true;
            cancelAnimationFrame(rafRef.current);
            window.removeEventListener('keydown', kd);
            window.removeEventListener('keyup', ku);
        };
    }, []);

    const press = (dir) => (e) => {
        e?.preventDefault?.();
        stateRef.current.moveDir = dir;
    };
    const release = () => { stateRef.current.moveDir = 0; };

    const s = stateRef.current;
    const remain = Math.max(0, WIN_TIME - (performance.now() - s.startedAt));
    return (
        <div className="game-falling">
            <div className="game-tag">🌧 떨어지는 물체 피하기</div>
            <div className="gflp-status">
                {phase === 'play' && `${(remain / 1000).toFixed(1)}s`}
                {phase === 'done' && (winResult ? '성공!' : '실패!')}
            </div>
            <div className="gfl-board" style={{ width: GAME_W, height: GAME_H }}>
                {s.objects.map((o, i) => (
                    <div key={i} className="gfl-obj"
                         style={{ left: o.x, top: o.y, width: OBJ_W, height: OBJ_H }} />
                ))}
                <div className="gfl-player"
                     style={{ left: s.playerX - PLAYER_W / 2, top: PLAYER_Y, width: PLAYER_W, height: PLAYER_H }} />
            </div>
            <div className="gfl-controls">
                <button type="button" className="gfl-btn"
                        onPointerDown={press(-1)} onPointerUp={release} onPointerLeave={release} onPointerCancel={release}>
                    ◀
                </button>
                <button type="button" className="gfl-btn"
                        onPointerDown={press(1)} onPointerUp={release} onPointerLeave={release} onPointerCancel={release}>
                    ▶
                </button>
            </div>
            <div className="gr-hint">방향키 또는 ◀▶ 버튼으로 이동. 6초 버티기!</div>
        </div>
    );
}
