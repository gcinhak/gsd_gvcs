const INITIAL_ITEMS = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 4,
    dur: 3 + Math.random() * 4,
    size: 3 + Math.random() * 6,
}));

export default function Sparks({ color }) {
    return (
        <div className="sparks" aria-hidden>
            {INITIAL_ITEMS.map((p) => (
                <span
                    key={p.id}
                    className="spark"
                    style={{
                        left: `${p.x}%`,
                        width: p.size,
                        height: p.size,
                        background: color,
                        animationDuration: `${p.dur}s`,
                        animationDelay: `${p.delay}s`,
                        boxShadow: `0 0 6px ${color}`,
                    }}
                />
            ))}
        </div>
    );
}
