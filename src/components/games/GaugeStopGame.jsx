import { useEffect, useRef, useState } from 'react';

const SPEED = 0.18; // % per ms
const GREEN_START = 42;
const GREEN_END = 58;

export default function GaugeStopGame({ onWin, onLose }) {
    const [, force] = useState(0);
    const [done, setDone] = useState(false);
    const [stopAt, setStopAt] = useState(null);
    const posRef = useRef(0);
    const dirRef = useRef(1);
    const rafRef = useRef(null);

    useEffect(() => {
        let cancelled = false;
        let lastT = performance.now();
        const tick = (t) => {
            if (cancelled) return;
            const dt = t - lastT;
            lastT = t;
            let next = posRef.current + dirRef.current * SPEED * dt;
            if (next >= 100) { next = 100; dirRef.current = -1; }
            else if (next <= 0) { next = 0; dirRef.current = 1; }
            posRef.current = next;
            force((x) => (x + 1) % 1000);
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => { cancelled = true; cancelAnimationFrame(rafRef.current); };
    }, []);

    const click = () => {
        if (done) return;
        cancelAnimationFrame(rafRef.current);
        const p = posRef.current;
        setStopAt(p);
        setDone(true);
        const win = p >= GREEN_START && p <= GREEN_END;
        setTimeout(() => (win ? onWin?.() : onLose?.()), 700);
    };

    const win = stopAt !== null && stopAt >= GREEN_START && stopAt <= GREEN_END;
    const label = done ? (win ? `성공! (${stopAt.toFixed(1)}%)` : `실패! (${stopAt.toFixed(1)}%)`) : '클릭하여 멈추기';

    return (
        <div className="game-gauge">
            <div className="game-tag">🎯 정지!</div>
            <div className="gg-bar">
                <div className="gg-zone-green" style={{ left: `${GREEN_START}%`, width: `${GREEN_END - GREEN_START}%` }} />
                <div className="gg-pointer" style={{ left: `${posRef.current}%` }} />
            </div>
            <button type="button" className={`gg-stop ${done ? (win ? 'is-win' : 'is-lose') : ''}`} onClick={click} disabled={done}>
                {label}
            </button>
            <div className="gr-hint">초록색 칸에 멈추면 성공!</div>
        </div>
    );
}
