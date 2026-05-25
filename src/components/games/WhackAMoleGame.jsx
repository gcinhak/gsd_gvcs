import { useEffect, useRef, useState } from 'react';

const ROWS = 3;
const COLS = 3;
const CELLS = ROWS * COLS;
const SHOW_MS = 900;
const SPAWN_MS = 700;
const TARGET_HITS = 5;
const TIME_LIMIT = 6000;

export default function WhackAMoleGame({ onWin, onLose }) {
    const [, force] = useState(0);
    const [phase, setPhase] = useState('play');
    const [hits, setHits] = useState(0);
    const hitsRef = useRef(0);
    const molesRef = useRef([]);
    const startRef = useRef(0);
    const rafRef = useRef(null);

    useEffect(() => {
        let cancelled = false;
        startRef.current = performance.now();
        let nextSpawn = startRef.current + 200;

        const end = (win) => {
            cancelAnimationFrame(rafRef.current);
            setPhase('done');
            setTimeout(() => (win ? onWin?.() : onLose?.()), 400);
        };

        const loop = (t) => {
            if (cancelled) return;
            if (t > nextSpawn) {
                nextSpawn = t + SPAWN_MS;
                const occupied = new Set(molesRef.current.map((m) => m.cell));
                const free = [];
                for (let i = 0; i < CELLS; i++) if (!occupied.has(i)) free.push(i);
                if (free.length > 0) {
                    const cell = free[Math.floor(Math.random() * free.length)];
                    molesRef.current.push({ cell, expiresAt: t + SHOW_MS });
                }
            }
            molesRef.current = molesRef.current.filter((m) => m.expiresAt > t);
            if (t - startRef.current > TIME_LIMIT) {
                end(hitsRef.current >= TARGET_HITS);
                return;
            }
            force((x) => (x + 1) % 1000);
            rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
        return () => { cancelled = true; cancelAnimationFrame(rafRef.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const whack = (cell) => {
        if (phase !== 'play') return;
        const idx = molesRef.current.findIndex((m) => m.cell === cell);
        if (idx < 0) return;
        molesRef.current.splice(idx, 1);
        hitsRef.current += 1;
        setHits(hitsRef.current);
        if (hitsRef.current >= TARGET_HITS) {
            cancelAnimationFrame(rafRef.current);
            setPhase('done');
            setTimeout(() => onWin?.(), 400);
        }
    };

    const remain = Math.max(0, TIME_LIMIT - (performance.now() - startRef.current));
    const moleCells = new Set(molesRef.current.map((m) => m.cell));

    return (
        <div className="game-whack">
            <div className="game-tag">🔨 두더지 잡기</div>
            <div className="gflp-status">
                {phase === 'play' && `${hits}/${TARGET_HITS} · ${(remain / 1000).toFixed(1)}s`}
                {phase === 'done' && (hits >= TARGET_HITS ? '성공!' : '실패!')}
            </div>
            <div className="gwm-grid">
                {Array.from({ length: CELLS }).map((_, i) => (
                    <button
                        key={i}
                        type="button"
                        className={`gwm-hole ${moleCells.has(i) ? 'has-mole' : ''}`}
                        onPointerDown={() => whack(i)}
                    >
                        {moleCells.has(i) && <span className="gwm-mole">🐀</span>}
                    </button>
                ))}
            </div>
            <div className="gr-hint">6초 안에 두더지 {TARGET_HITS}마리 잡기!</div>
        </div>
    );
}
