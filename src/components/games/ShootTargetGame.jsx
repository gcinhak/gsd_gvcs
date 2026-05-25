import { useEffect, useRef, useState } from 'react';

const W = 290;
const H = 220;
const R = 20;
const SPEED = 0.24;     // px/ms
const TARGET_HITS = 3;
const TIME_LIMIT = 8000;

export default function ShootTargetGame({ onWin, onLose }) {
    const [, force] = useState(0);
    const [phase, setPhase] = useState('play');
    const [hits, setHits] = useState(0);
    const hitsRef = useRef(0);
    const stateRef = useRef({
        x: W / 2,
        y: H / 2,
        vx: SPEED,
        vy: SPEED * 0.7,
        startedAt: 0,
    });
    const rafRef = useRef(null);

    useEffect(() => {
        let cancelled = false;
        let lastT = performance.now();
        const s = stateRef.current;
        s.startedAt = lastT;
        const ang = Math.random() * Math.PI * 2;
        s.vx = Math.cos(ang) * SPEED;
        s.vy = Math.sin(ang) * SPEED;

        const end = (win) => {
            cancelAnimationFrame(rafRef.current);
            setPhase('done');
            setTimeout(() => (win ? onWin?.() : onLose?.()), 400);
        };

        const loop = (t) => {
            if (cancelled) return;
            const dt = Math.min(t - lastT, 40);
            lastT = t;
            s.x += s.vx * dt;
            s.y += s.vy * dt;
            if (s.x < R) { s.x = R; s.vx = Math.abs(s.vx); }
            if (s.x > W - R) { s.x = W - R; s.vx = -Math.abs(s.vx); }
            if (s.y < R) { s.y = R; s.vy = Math.abs(s.vy); }
            if (s.y > H - R) { s.y = H - R; s.vy = -Math.abs(s.vy); }
            if (t - s.startedAt > TIME_LIMIT) { end(false); return; }
            force((x) => (x + 1) % 1000);
            rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
        return () => { cancelled = true; cancelAnimationFrame(rafRef.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const shoot = (e) => {
        if (phase !== 'play') return;
        const rect = e.currentTarget.getBoundingClientRect();
        const cx = ((e.clientX - rect.left) / rect.width) * W;
        const cy = ((e.clientY - rect.top) / rect.height) * H;
        const s = stateRef.current;
        const dx = cx - s.x;
        const dy = cy - s.y;
        if (dx * dx + dy * dy <= R * R) {
            hitsRef.current += 1;
            setHits(hitsRef.current);
            s.x = R + Math.random() * (W - 2 * R);
            s.y = R + Math.random() * (H - 2 * R);
            const ang = Math.random() * Math.PI * 2;
            s.vx = Math.cos(ang) * SPEED;
            s.vy = Math.sin(ang) * SPEED;
            if (hitsRef.current >= TARGET_HITS) {
                cancelAnimationFrame(rafRef.current);
                setPhase('done');
                setTimeout(() => onWin?.(), 400);
            }
        }
    };

    const s = stateRef.current;
    const remain = Math.max(0, TIME_LIMIT - (performance.now() - s.startedAt));
    return (
        <div className="game-shoot">
            <div className="game-tag">🎯 저격수</div>
            <div className="gflp-status">
                {phase === 'play' && `${hits}/${TARGET_HITS} · ${(remain / 1000).toFixed(1)}s`}
                {phase === 'done' && (hits >= TARGET_HITS ? '성공!' : '실패!')}
            </div>
            <div className="gst-board" style={{ width: W, height: H }} onPointerDown={shoot}>
                <div className="gst-target"
                     style={{ left: s.x - R, top: s.y - R, width: R * 2, height: R * 2 }} />
            </div>
            <div className="gr-hint">움직이는 빨간 타겟을 {TARGET_HITS}번 맞추세요</div>
        </div>
    );
}
