import { useEffect, useState } from 'react';

const COLORS = ['#dc2626', '#1d4ed8', '#059669', '#f59e0b'];
const SEQ_LEN = 4;
// 3초 안에 4개 점등: 한 칸당 600ms 보임 + 150ms 간격 ≈ 3s
const SHOW_PER_MS = 600;
const GAP_MS = 150;

export default function SequenceGame({ onWin, onLose }) {
    const [phase, setPhase] = useState('show'); // show | input | done
    const [seq] = useState(() =>
        Array.from({ length: SEQ_LEN }, () => Math.floor(Math.random() * 4))
    );
    const [shownIdx, setShownIdx] = useState(-1);
    const [inputIdx, setInputIdx] = useState(0);
    const [wrong, setWrong] = useState(false);

    useEffect(() => {
        if (phase !== 'show') return;
        let cancelled = false;
        let i = 0;
        const step = () => {
            if (cancelled) return;
            if (i >= seq.length) {
                setShownIdx(-1);
                setPhase('input');
                return;
            }
            setShownIdx(seq[i]);
            setTimeout(() => {
                if (cancelled) return;
                setShownIdx(-1);
                setTimeout(() => {
                    i++;
                    step();
                }, GAP_MS);
            }, SHOW_PER_MS);
        };
        // 살짝 뜸 들이고 시작
        const t0 = setTimeout(step, 350);
        return () => {
            cancelled = true;
            clearTimeout(t0);
        };
    }, [phase, seq]);

    const click = (i) => {
        if (phase !== 'input') return;
        if (i === seq[inputIdx]) {
            if (inputIdx + 1 >= seq.length) {
                setPhase('done');
                setTimeout(() => onWin?.(), 500);
            } else {
                setInputIdx(inputIdx + 1);
            }
        } else {
            setWrong(true);
            setPhase('done');
            setTimeout(() => onLose?.(), 700);
        }
    };

    return (
        <div className="game-seq">
            <div className="game-tag">🧠 순서 외우기</div>
            <div className="gs-status">
                {phase === 'show' && '잘 보세요...'}
                {phase === 'input' && `${inputIdx + 1} / ${seq.length}`}
                {phase === 'done' && (wrong ? '실패!' : '성공!')}
            </div>
            <div className="gs-grid">
                {COLORS.map((c, i) => (
                    <button
                        key={i}
                        type="button"
                        className={`gs-cell ${shownIdx === i ? 'lit' : ''}`}
                        style={{ background: c }}
                        onClick={() => click(i)}
                        disabled={phase !== 'input'}
                        aria-label={`${i + 1}`}
                    />
                ))}
            </div>
            <div className="gr-hint">불빛 순서를 외워서 같은 순서로 누르세요</div>
        </div>
    );
}
